using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLNV.Models;
using QLNV.DTO;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Cors;

namespace QLNV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("AllowAllOrigins")]
    public class AccessLogController : ControllerBase
    {
        private readonly QlnvContext _context;
        private readonly ILogger<AccessLogController> _logger;
        private const int DelaySeconds = 10;
        private static readonly TimeSpan CheckInThreshold = new TimeSpan(8, 30, 0);
        private static readonly TimeSpan CheckOutThreshold = new TimeSpan(17, 30, 0);

        public AccessLogController(QlnvContext context, ILogger<AccessLogController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        public async Task<IActionResult> GetAccessLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string accessPoint = null,
            [FromQuery] string employee = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string result = null)
        {
            try
            {
                _logger.LogInformation("Fetching access logs. Filters: page={Page}, pageSize={PageSize}, accessPoint={AccessPoint}, employee={Employee}, fromDate={FromDate}, toDate={ToDate}, result={Result}",
                    page, pageSize, accessPoint, employee, fromDate, toDate, result);

                var query = _context.AccessLogs
                    .Include(al => al.Employee)
                    .Include(al => al.AccessPoint)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(accessPoint))
                {
                    query = query.Where(al => al.AccessPoint != null && al.AccessPoint.AccessName.ToLower().Contains(accessPoint.ToLower()));
                }
                if (!string.IsNullOrEmpty(employee))
                {
                    query = query.Where(al => al.Employee != null && (al.Employee.FullName.ToLower().Contains(employee.ToLower()) || al.Employee.EmployeeCode.ToLower().Contains(employee.ToLower())));
                }
                if (fromDate.HasValue)
                {
                    query = query.Where(al => al.AccessTime >= fromDate.Value);
                }
                if (toDate.HasValue)
                {
                    query = query.Where(al => al.AccessTime <= toDate.Value.AddDays(1).AddTicks(-1));
                }
                if (!string.IsNullOrEmpty(result))
                {
                    query = query.Where(al => al.AccessResult != null && al.AccessResult.ToLower().Contains(result.ToLower()));
                }

                var totalCount = await query.CountAsync();

                var accessLogs = await query
                    .OrderByDescending(al => al.AccessTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(al => new AccessLogDTO
                    {
                        LogId = al.LogId,
                        EmployeeId = al.EmployeeId,
                        FullName = al.Employee != null ? al.Employee.FullName : null,
                        EmployeeCode = al.Employee != null ? al.Employee.EmployeeCode : null,
                        AccessPointId = al.AccessPointId,
                        AccessPointName = al.AccessPoint != null ? al.AccessPoint.AccessName : null,
                        AccessTime = al.AccessTime,
                        AccessResult = al.AccessResult,
                        AccessStatus = al.AccessStatus,
                        AccessType = al.AccessType,
                        Note = al.Note
                    })
                    .ToListAsync();

                _logger.LogInformation("Fetched {Count} access logs out of {TotalCount} total: {@AccessLogs}", accessLogs.Count, totalCount, accessLogs);

                if (!accessLogs.Any() && totalCount == 0)
                {
                    _logger.LogWarning("No access logs found with the given filters.");
                    return NotFound(new { message = "No access logs found." });
                }

                return Ok(new
                {
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    Data = accessLogs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching access logs");
                return StatusCode(500, new { message = "Error fetching access logs: " + ex.Message });
            }
        }

        [HttpGet("FilterOptions")]
        public async Task<IActionResult> GetFilterOptions()
        {
            try
            {
                _logger.LogInformation("Fetching filter options for access logs");

                var accessPoints = await _context.AccessPoints
                    .Where(ap => ap.AccessName != null)
                    .Select(ap => ap.AccessName)
                    .Distinct()
                    .ToListAsync();

                var employees = await _context.Employees
                    .Where(e => e.FullName != null)
                    .Select(e => new { e.FullName, e.EmployeeCode })
                    .Distinct()
                    .ToListAsync();

                var results = await _context.AccessLogs
                    .Where(al => al.AccessResult != null)
                    .Select(al => al.AccessResult)
                    .Distinct()
                    .ToListAsync();

                _logger.LogInformation("Fetched filter options: AccessPoints={@AccessPoints}, Employees={@Employees}, Results={@Results}",
                    accessPoints, employees, results);

                return Ok(new
                {
                    AccessPoints = accessPoints,
                    Employees = employees.Select(e => e.FullName).ToList(),
                    Results = results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching filter options");
                return StatusCode(500, new { message = "Error fetching filter options: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> PostAccessLog([FromBody] AccessLogRequest request)
        {
            try
            {
                if (request == null || request.EmployeeId == 0 || string.IsNullOrEmpty(request.AccessType))
                {
                    return BadRequest(new { message = "EmployeeId and AccessType are required." });
                }

                var employee = await _context.Employees.FindAsync(request.EmployeeId);
                if (employee == null) return NotFound(new { message = "Nhân viên không tồn tại." });

                var accessPoint = await _context.AccessPoints.FindAsync(request.AccessPointId ?? 1);
                if (accessPoint == null) return NotFound(new { message = "Điểm truy cập không tồn tại." });

                // Check if this is from Pixel or ACR based on AccessPointId or DeviceData
                bool isPixel = accessPoint.DeviceData?.Contains("Pixel") ?? false;

                // Logic to determine AccessType for Pixel to include CheckOut
                string finalAccessType = request.AccessType;
                if (isPixel)
                {
                    var lastLog = await _context.AccessLogs
                        .Where(al => al.EmployeeId == request.EmployeeId && al.AccessTime.HasValue && al.AccessTime.Value.Date == DateTime.Today)
                        .OrderByDescending(al => al.AccessTime)
                        .FirstOrDefaultAsync();

                    if (lastLog == null)
                    {
                        finalAccessType = "CheckIn"; // First scan of the day
                    }
                    else
                    {
                        finalAccessType = lastLog.AccessType == "CheckIn" ? "CheckOut" : "CheckIn"; // Alternate between CheckIn and CheckOut
                    }
                }

                string accessStatus = "Chưa xác định";
                DateTime accessTime = request.AccessTime?.ToLocalTime() ?? DateTime.Now.ToLocalTime();

                if (finalAccessType == "CheckIn")
                {
                    accessStatus = accessTime.TimeOfDay <= TimeSpan.FromHours(8.5) ? "Vào làm" : "Đi trễ";
                }
                else if (finalAccessType == "CheckOut")
                {
                    accessStatus = accessTime.TimeOfDay <= TimeSpan.FromHours(17.5) ? "Ra ngoài" : "Tan ca";
                }

                var accessLog = new AccessLog
                {
                    EmployeeId = request.EmployeeId,
                    AccessPointId = request.AccessPointId ?? 1,
                    AccessTime = accessTime,
                    AccessType = finalAccessType,
                    Note = request.Note,
                    AccessResult = accessPoint.IsActive == true ? "Thành công" : "Thất bại",
                    AccessStatus = accessStatus
                };

                _context.AccessLogs.Add(accessLog);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Saved access log for employee {employee.EmployeeCode}: {finalAccessType} at {accessTime}");

                return Ok(new { message = "Access log saved successfully.", LogId = accessLog.LogId, IsCheckIn = finalAccessType == "CheckIn" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving access log");
                return StatusCode(500, new { message = "Error saving access log: " + ex.Message });
            }
        }
    }
}