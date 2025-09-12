using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLNV.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text;
using QLNV.DTO;
using System.Globalization;
using System.ComponentModel.DataAnnotations;

namespace QLNV.Controllers
{
    [Authorize(Roles = "admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class HomeController : ControllerBase
    {
        private readonly QlnvContext _context;
        private readonly Random _random = new Random();

        public HomeController(QlnvContext context)
        {
            _context = context;
        }

        [HttpGet("home")]
        [Authorize]
        public async Task<IActionResult> GetEmployeeHome()
        {
            try
            {
                string? userEmail = User?.Identity?.Name ?? HttpContext.Session.GetString("UserEmail");
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new { message = "Chưa đăng nhập." });
                }

                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Email == userEmail);

                if (employee == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin nhân viên." });
                }

                var recentAccessLogs = await _context.AccessLogs
                    .Include(al => al.AccessPoint)
                    .Where(al => al.EmployeeId == employee.EmployeeId && al.AccessTime.HasValue)
                    .OrderByDescending(al => al.AccessTime)
                    .Take(5)
                    .Select(al => new
                    {
                        accessPointName = al.AccessPoint != null ? al.AccessPoint.AccessName : "Không xác định",
                        accessTime = al.AccessTime.HasValue ? al.AccessTime.Value.ToString("HH:mm dd/MM/yyyy") : "Không có dữ liệu",
                        accessResult = al.AccessResult ?? "Không xác định"
                    })
                    .ToListAsync();

                return Ok(new
                {
                    employee = new
                    {
                        fullName = employee.FullName ?? "N/A",
                        email = employee.Email ?? "N/A",
                        employeeCode = employee.EmployeeCode ?? "N/A",
                        department = employee.Department ?? "N/A",
                        role = employee.Role ?? "N/A",
                        memberCard = employee.MemberCard ?? "N/A"
                    },
                    recentAccessLogs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải dữ liệu trang chủ: " + ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees()
        {
            var today = DateTime.Today;
            var employees = await _context.Employees
                .Select(e => new
                {
                    employeeId = e.EmployeeId,
                    fullName = e.FullName,
                    employeeCode = e.EmployeeCode,
                    department = e.Department,
                    role = e.Role,
                    accessPointId = e.AccessPointId,
                    email = e.Email,
                    phone = e.Phone,
                    isActive = e.IsActive,
                    memberCard = e.MemberCard,
                    checkIn = _context.AccessLogs
                        .Where(al => al.EmployeeId == e.EmployeeId && al.AccessTime.HasValue && al.AccessTime.Value.Date == today && al.AccessType == "CheckIn")
                        .OrderBy(al => al.AccessTime)
                        .Select(al => al.AccessTime.HasValue ? al.AccessTime.Value.ToString("HH:mm") : "-")
                        .FirstOrDefault() ?? "-",
                    checkOut = _context.AccessLogs
                        .Where(al => al.EmployeeId == e.EmployeeId && al.AccessTime.HasValue && al.AccessTime.Value.Date == today && al.AccessType == "CheckOut")
                        .OrderByDescending(al => al.AccessTime)
                        .Select(al => al.AccessTime.HasValue ? al.AccessTime.Value.ToString("HH:mm") : "-")
                        .FirstOrDefault() ?? "-",
                    latestCheckInStatus = _context.AccessLogs
                        .Where(al => al.EmployeeId == e.EmployeeId && al.AccessTime.HasValue && al.AccessTime.Value.Date == today && al.AccessType == "CheckIn")
                        .OrderBy(al => al.AccessTime)
                        .Select(al => al.AccessTime.HasValue && al.AccessTime.Value.TimeOfDay <= TimeSpan.FromHours(8.5) ? "Vào làm" : "Đi trễ")
                        .FirstOrDefault() ?? "Chưa check-in"
                })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == id);

            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên." });
            }

            try
            {
                var totalAccess = await _context.AccessLogs
                    .CountAsync(al => al.EmployeeId == id && al.AccessTime.HasValue);

                var avgCheckInQuery = await _context.AccessLogs
                    .Where(al => al.EmployeeId == id && al.AccessTime.HasValue && al.AccessType == "CheckIn")
                    .GroupBy(al => al.AccessTime!.Value.Date)
                    .Select(g => g.OrderBy(al => al.AccessTime).First().AccessTime!.Value.TimeOfDay)
                    .ToListAsync();
                var avgCheckIn = avgCheckInQuery.Any() ? TimeSpan.FromTicks((long)avgCheckInQuery.Average(t => t.Ticks)) : TimeSpan.Zero;

                var avgCheckOutQuery = await _context.AccessLogs
                    .Where(al => al.EmployeeId == id && al.AccessTime.HasValue && al.AccessType == "CheckOut")
                    .GroupBy(al => al.AccessTime!.Value.Date)
                    .Select(g => g.OrderByDescending(al => al.AccessTime).First().AccessTime!.Value.TimeOfDay)
                    .ToListAsync();
                var avgCheckOut = avgCheckOutQuery.Any() ? TimeSpan.FromTicks((long)avgCheckOutQuery.Average(t => t.Ticks)) : TimeSpan.Zero;

                var rating = "Chưa xếp loại";

                return Ok(new
                {
                    employee = new
                    {
                        employeeId = employee.EmployeeId,
                        fullName = employee.FullName,
                        employeeCode = employee.EmployeeCode,
                        department = employee.Department,
                        role = employee.Role,
                        accessPointId = employee.AccessPointId,
                        email = employee.Email,
                        phone = employee.Phone,
                        isActive = employee.IsActive,
                        memberCard = employee.MemberCard
                    },
                    stats = new
                    {
                        totalAccess,
                        avgCheckIn = avgCheckIn != TimeSpan.Zero ? avgCheckIn.ToString(@"hh\:mm") : "Không có dữ liệu",
                        avgCheckOut = avgCheckOut != TimeSpan.Zero ? avgCheckOut.ToString(@"hh\:mm") : "Không có dữ liệu",
                        employeeRating = rating
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin nhân viên: " + ex.Message });
            }
        }

        [HttpGet("attendance/{employeeId}")]
        public async Task<IActionResult> GetAttendanceHistory(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
                if (employee == null)
                {
                    return NotFound(new { message = "Không tìm thấy nhân viên." });
                }

                var startDate = DateTime.Today.AddDays(-30);
                var endDate = DateTime.Today;
                var allDates = Enumerable.Range(0, (endDate - startDate).Days + 1)
                    .Select(d => startDate.AddDays(d))
                    .ToList();

                var logs = await _context.AccessLogs
                    .Where(al => al.EmployeeId == employeeId && al.AccessTime.HasValue)
                    .OrderBy(al => al.AccessTime)
                    .ToListAsync();

                var attendanceRecords = new List<object>();

                foreach (var date in allDates)
                {
                    var group = logs.Where(al => al.AccessTime!.Value.Date == date).ToList();
                    var checkIns = group.Where(al => al.AccessType == "CheckIn").OrderBy(al => al.AccessTime).ToList();
                    var checkOuts = group.Where(al => al.AccessType == "CheckOut").OrderBy(al => al.AccessTime).ToList();

                    var vietnameseCulture = new CultureInfo("vi-VN");
                    string dayOfWeek = vietnameseCulture.DateTimeFormat.GetDayName(date.DayOfWeek);

                    if (!checkIns.Any())
                    {
                        attendanceRecords.Add(new
                        {
                            fullName = employee.FullName ?? "N/A",
                            date = date.ToString("dd/MM/yyyy"),
                            dayOfWeek,
                            checkIn = "Không có dữ liệu",
                            checkOut = "Không có dữ liệu",
                            workingTime = "-",
                            status = "Vắng mặt"
                        });
                        continue;
                    }

                    int checkInIndex = 0, checkOutIndex = 0;
                    bool hasPreviousCheckOut = false;

                    while (checkInIndex < checkIns.Count)
                    {
                        var checkIn = checkIns[checkInIndex];
                        string checkInTime = checkIn.AccessTime!.Value.ToString("HH:mm");
                        string checkOutTime = null;
                        string workingTime = "-";
                        string status = "Không xác định";

                        if (checkOutIndex < checkOuts.Count && checkOuts[checkOutIndex].AccessTime < checkIn.AccessTime)
                        {
                            checkOutTime = checkOuts[checkOutIndex].AccessTime!.Value.ToString("HH:mm");
                            hasPreviousCheckOut = true;
                            checkOutIndex++;
                        }

                        if (checkInIndex == 0 && !hasPreviousCheckOut)
                        {
                            status = checkIn.AccessTime!.Value.TimeOfDay <= TimeSpan.FromHours(8.5) ? "Vào làm" : "Đi trễ";
                        }
                        else if (hasPreviousCheckOut)
                        {
                            status = "Vào lại";
                        }
                        else
                        {
                            status = "Vào lại";
                        }

                        if (checkOutIndex < checkOuts.Count && (checkOutTime == null || checkOuts[checkOutIndex].AccessTime > checkIn.AccessTime))
                        {
                            checkOutTime = checkOuts[checkOutIndex].AccessTime!.Value.ToString("HH:mm");
                            var duration = checkOuts[checkOutIndex].AccessTime!.Value - checkIn.AccessTime!.Value;
                            if (duration.TotalMinutes > 0)
                            {
                                int hours = (int)duration.TotalHours;
                                int minutes = duration.Minutes;
                                workingTime = hours > 0 ? $"{hours}h{minutes.ToString().PadLeft(2, '0')}p" : $"{minutes}p";
                            }
                            if (checkInIndex == 0 && checkIn.AccessTime!.Value.TimeOfDay > TimeSpan.FromHours(8.5))
                            {
                                status = "Đi trễ";
                            }
                            else if (checkInIndex == checkIns.Count - 1 && checkOuts[checkOutIndex].AccessTime!.Value.TimeOfDay >= TimeSpan.FromHours(17.5))
                            {
                                status = "Tan ca";
                            }
                            else
                            {
                                status = "Ra ngoài";
                            }
                            checkOutIndex++;
                        }

                        attendanceRecords.Add(new
                        {
                            fullName = employee.FullName ?? "N/A",
                            date = date.ToString("dd/MM/yyyy"),
                            dayOfWeek,
                            checkIn = checkInTime,
                            checkOut = checkOutTime ?? "Không có dữ liệu",
                            workingTime,
                            status
                        });

                        checkInIndex++;
                    }
                }

                return Ok(attendanceRecords.OrderByDescending(x => DateTime.ParseExact(((dynamic)x).date, "dd/MM/yyyy", null)));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAttendanceHistory: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy lịch sử ra vào: " + ex.Message });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics(int page = 1, int pageSize = 10)
        {
            try
            {
                var employeeCount = await _context.Employees.CountAsync();
                var siteCount = await _context.Sites
                    .Where(s => s.IsActive == true)
                    .CountAsync();
                var accessPointCount = await _context.AccessPoints
                    .Where(ap => ap.IsActive == true)
                    .CountAsync();
                var today = DateTime.Today;
                var accessTodayCount = await _context.AccessLogs
                    .Where(al => al.AccessTime.HasValue && al.AccessTime.Value.Date == today)
                    .CountAsync();
                var successfulAccessCount = await _context.AccessLogs
                    .Where(al => al.AccessTime.HasValue && al.AccessTime.Value.Date == today && al.AccessResult == "Thành công")
                    .CountAsync();
                var failedAccessCount = await _context.AccessLogs
                    .Where(al => al.AccessTime.HasValue && al.AccessTime.Value.Date == today && al.AccessResult == "Thất bại")
                    .CountAsync();

                var totalLogs = await _context.AccessLogs
                    .Where(al => al.AccessTime.HasValue && al.AccessTime.Value.Date == today)
                    .CountAsync();

                var recentAccessLogs = await _context.AccessLogs
                    .Where(al => al.AccessTime.HasValue && al.AccessTime.Value.Date == today)
                    .Include(al => al.Employee)
                    .Include(al => al.AccessPoint)
                    .OrderByDescending(al => al.AccessTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(al => new
                    {
                        employeeName = al.Employee != null ? al.Employee.FullName : "Không xác định",
                        accessPointName = al.AccessPoint != null ? al.AccessPoint.AccessName : "Không xác định",
                        accessTime = al.AccessTime!.Value.ToString("HH:mm:ss dd/MM/yyyy"),
                        accessResult = al.AccessResult,
                        accessStatus = al.AccessStatus,
                        checkInStatus = al.AccessType == "CheckIn" ?
                            (_context.AccessLogs.Any(al2 => al2.EmployeeId == al.EmployeeId &&
                                                           al2.AccessTime.HasValue &&
                                                           al2.AccessTime.Value.Date == today &&
                                                           al2.AccessType == "CheckIn" &&
                                                           al2.AccessTime < al.AccessTime) ?
                                "Vào lại" :
                                (al.AccessTime!.Value.TimeOfDay <= TimeSpan.FromHours(8.5) ? "Vào làm" : "Đi trễ")) :
                            (al.AccessType == "CheckOut" ?
                                (al.AccessTime!.Value.TimeOfDay <= TimeSpan.FromHours(17.5) ? "Ra ngoài" : "Tan ca") :
                                al.AccessStatus)
                    })
                    .ToListAsync();

                return Ok(new
                {
                    employeeCount,
                    siteCount,
                    accessPointCount,
                    accessTodayCount,
                    successfulAccessCount,
                    failedAccessCount,
                    recentAccessLogs = new
                    {
                        data = recentAccessLogs,
                        totalCount = totalLogs,
                        page,
                        pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê: " + ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _context.Employees
                .Select(e => new
                {
                    employeeId = e.EmployeeId,
                    fullName = e.FullName,
                    employeeCode = e.EmployeeCode,
                    department = e.Department,
                    role = e.Role,
                    accessPointId = e.AccessPointId,
                    email = e.Email,
                    phone = e.Phone,
                    isActive = e.IsActive,
                    memberCard = e.MemberCard
                })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeRequest request)
        {
            try
            {
                // Kiểm tra các trường bắt buộc
                if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Phone) ||
                    string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) ||
                    string.IsNullOrWhiteSpace(request.MemberCard))
                {
                    return BadRequest(new { message = "Tên, số điện thoại, email, mật khẩu và mã thẻ thành viên là bắt buộc." });
                }

                // Kiểm tra mã nhân viên trùng lặp
                if (_context.Employees.Any(e => e.EmployeeCode == request.EmployeeCode))
                {
                    return BadRequest(new { message = "Mã nhân viên đã tồn tại." });
                }

                // Kiểm tra MemberCard trùng lặp
                if (_context.Employees.Any(e => e.MemberCard == request.MemberCard))
                {
                    return BadRequest(new { message = "Mã thẻ thành viên đã tồn tại." });
                }

                // Kiểm tra phòng ban hợp lệ
                var departmentToAccessPoint = new Dictionary<string, int>
                {
                    { "Kỹ thuật", 1 },
                    { "Kế toán", 2 },
                    { "Kho", 3 },
                    { "Marketing", 4 },
                    { "Giám đốc", 5 }
                };

                if (string.IsNullOrWhiteSpace(request.Department) || !departmentToAccessPoint.ContainsKey(request.Department))
                {
                    return BadRequest(new { message = "Chức vụ không hợp lệ." });
                }

                int accessPointId = departmentToAccessPoint[request.Department];

                // Tạo nhân viên mới
                var employee = new Employee
                {
                    FullName = request.FullName,
                    EmployeeCode = request.EmployeeCode,
                    MemberCard = request.MemberCard,
                    Department = request.Department,
                    Role = request.Role ?? "Nhân viên",
                    AccessPointId = accessPointId,
                    Email = request.Email,
                    Password = HashPassword(request.Password),
                    Phone = request.Phone,
                    IsActive = request.IsActive ?? true,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Thêm nhân viên thành công.", employeeId = employee.EmployeeId, memberCard = employee.MemberCard });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi thêm nhân viên: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeRequest request)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { message = "Không tìm thấy nhân viên." });
                }

                // Kiểm tra các trường bắt buộc
                if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Phone) ||
                    string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.MemberCard))
                {
                    return BadRequest(new { message = "Tên, số điện thoại, email và mã thẻ thành viên là bắt buộc." });
                }

                // Kiểm tra mã nhân viên trùng lặp (trừ nhân viên hiện tại)
                if (_context.Employees.Any(e => e.EmployeeCode == request.EmployeeCode && e.EmployeeId != id))
                {
                    return BadRequest(new { message = "Mã nhân viên đã tồn tại." });
                }

                // Kiểm tra MemberCard trùng lặp (trừ nhân viên hiện tại)
                if (_context.Employees.Any(e => e.MemberCard == request.MemberCard && e.EmployeeId != id))
                {
                    return BadRequest(new { message = "Mã thẻ thành viên đã tồn tại." });
                }

                // Kiểm tra phòng ban hợp lệ
                var departmentToAccessPoint = new Dictionary<string, int>
                {
                    { "Kỹ thuật", 1 },
                    { "Kế toán", 2 },
                    { "Kho", 3 },
                    { "Marketing", 4 },
                    { "Giám đốc", 5 }
                };

                if (string.IsNullOrWhiteSpace(request.Department) || !departmentToAccessPoint.ContainsKey(request.Department))
                {
                    return BadRequest(new { message = "Chức vụ không hợp lệ." });
                }

                int accessPointId = departmentToAccessPoint[request.Department];

                // Cập nhật thông tin nhân viên
                employee.FullName = request.FullName;
                employee.EmployeeCode = request.EmployeeCode;
                employee.MemberCard = request.MemberCard;
                employee.Department = request.Department;
                employee.Role = request.Role ?? employee.Role;
                employee.AccessPointId = accessPointId;
                employee.Email = request.Email;
                employee.Phone = request.Phone;
                employee.IsActive = request.IsActive ?? employee.IsActive;
                employee.ModifiedDate = DateTime.Now;

                // Cập nhật mật khẩu nếu có
                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    employee.Password = HashPassword(request.Password);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật nhân viên thành công.", employeeId = employee.EmployeeId, memberCard = employee.MemberCard });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi cập nhật nhân viên: " + ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            try
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                var employee = await _context.Employees
                    .Include(e => e.AccessLogs)
                    .FirstOrDefaultAsync(e => e.EmployeeId == id);

                if (employee == null)
                {
                    return NotFound(new { message = "Không tìm thấy nhân viên." });
                }

                if (employee.AccessLogs?.Any() == true)
                {
                    _context.AccessLogs.RemoveRange(employee.AccessLogs);
                    await _context.SaveChangesAsync();
                }

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { message = "Xoá nhân viên thành công." });
            }
            catch (Exception ex)
            {
                await _context.Database.RollbackTransactionAsync();
                return StatusCode(500, new { message = "Lỗi khi xoá nhân viên: " + ex.Message });
            }
        }

        [HttpPost("create-access-log")]
        public async Task<IActionResult> CreateAccessLog([FromBody] AccessLogRequest request)
        {
            try
            {
                if (request.EmployeeId == null || request.AccessPointId == null || request.AccessTime == null)
                {
                    return BadRequest(new { message = "EmployeeId, AccessPointId, và AccessTime là bắt buộc." });
                }

                var accessPoint = await _context.AccessPoints
                    .FirstOrDefaultAsync(ap => ap.AccessPointId == request.AccessPointId);

                if (accessPoint == null)
                {
                    return NotFound(new { message = "Điểm truy cập không tồn tại." });
                }

                string accessResult = accessPoint.IsActive == true ? "Thành công" : "Thất bại";
                string accessStatus = accessPoint.IsActive == true ? "Hợp lệ" : "Không hợp lệ";

                var accessLog = new AccessLog
                {
                    EmployeeId = request.EmployeeId,
                    AccessPointId = request.AccessPointId,
                    AccessTime = request.AccessTime,
                    AccessResult = accessResult,
                    AccessStatus = accessStatus,
                    AccessType = request.AccessType,
                    Note = request.Note
                };

                _context.AccessLogs.Add(accessLog);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Ghi nhận truy cập thành công.", logId = accessLog.LogId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi ghi nhận truy cập: " + ex.Message });
            }
        }

        [HttpPost("update-access-logs")]
        public async Task<IActionResult> UpdateExistingAccessLogs()
        {
            try
            {
                var accessLogs = await _context.AccessLogs
                    .Include(al => al.AccessPoint)
                    .ToListAsync();

                foreach (var log in accessLogs)
                {
                    if (log.AccessPoint != null)
                    {
                        log.AccessResult = log.AccessPoint.IsActive == true ? "Thành công" : "Thất bại";
                        log.AccessStatus = log.AccessPoint.IsActive == true ? "Hợp lệ" : "Không hợp lệ";
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật AccessLogs thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi cập nhật AccessLogs: " + ex.Message });
            }
        }

        [HttpPost("changepassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                string? userEmail = User?.Identity?.Name ?? HttpContext.Session.GetString("UserEmail");
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new { message = "Chưa đăng nhập." });
                }

                var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == userEmail);
                if (employee == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin nhân viên." });
                }

                var hashedOldPassword = HashPassword(request.oldPassword);
                if (employee.Password != hashedOldPassword)
                {
                    return BadRequest(new { message = "Mật khẩu hiện tại không đúng." });
                }

                employee.Password = HashPassword(request.newPassword);
                employee.ModifiedDate = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đổi mật khẩu thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi đổi mật khẩu: " + ex.Message });
            }
        }

        [HttpGet("GetByMemberCard")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByMemberCard(string memberCard)
        {
            try
            {
                var employee = await _context.Employees
                    .Where(e => e.MemberCard == memberCard)
                    .Select(e => new { employeeId = e.EmployeeId, memberCard = e.MemberCard })
                    .FirstOrDefaultAsync();

                if (employee == null)
                {
                    return NotFound(new { message = "Không tìm thấy nhân viên với mã thẻ này." });
                }

                return Ok(employee);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tra cứu nhân viên: " + ex.Message });
            }
        }

        public class ChangePasswordRequest
        {
            [Required(ErrorMessage = "Mật khẩu cũ là bắt buộc.")]
            public string oldPassword { get; set; }

            [Required(ErrorMessage = "Mật khẩu mới là bắt buộc.")]
            public string newPassword { get; set; }
        }

        private string GenerateEmployeeCode()
        {
            var existingCodes = _context.Employees.Select(e => e.EmployeeCode).ToList();
            int newId = 1;
            string newCode;
            do
            {
                newCode = $"NV{newId}";
                newId++;
            } while (existingCodes.Contains(newCode));
            return newCode;
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                return BitConverter.ToString(hash).Replace("-", "").ToLower();
            }
        }
    }
}