using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLNV.DTO;
using QLNV.Models;

namespace QLNV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccessPointController : ControllerBase
    {
        private readonly QlnvContext _context;

        public AccessPointController(QlnvContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccessPoints()
        {
            try
            {
                var accessPoints = await _context.AccessPoints
                    .Include(ap => ap.Site)
                    .ToListAsync();

                if (accessPoints == null || !accessPoints.Any())
                {
                    return NotFound(new { message = "Không tìm thấy điểm truy cập nào." });
                }

                var accessPointDTOs = accessPoints.Select(ap => new AccessPointDTO
                {
                    AccessPointId = ap.AccessPointId,
                    AccessName = ap.AccessName,
                    Location = ap.Location,
                    SiteId = ap.SiteId,
                    DeviceType = ap.DeviceType,
                    DeviceData = ap.DeviceData,
                    IsActive = ap.Site?.IsActive ?? ap.IsActive,
                    CreatedDate = ap.CreatedDate,
                    ModifiedDate = ap.ModifiedDate,
                    SiteName = ap.Site?.SiteName,
                    Address = ap.Site?.Address
                }).ToList();

                return Ok(accessPointDTOs);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi lấy danh sách điểm truy cập: {ex.Message}\nStack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách điểm truy cập: " + ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccessPoint(int id)
        {
            try
            {
                var accessPoint = await _context.AccessPoints
                    .Include(ap => ap.Site)
                    .FirstOrDefaultAsync(ap => ap.AccessPointId == id);

                if (accessPoint == null)
                {
                    return NotFound(new { message = "Không tìm thấy điểm truy cập." });
                }

                var accessPointDTO = new AccessPointDTO
                {
                    AccessPointId = accessPoint.AccessPointId,
                    AccessName = accessPoint.AccessName,
                    Location = accessPoint.Location,
                    SiteId = accessPoint.SiteId,
                    DeviceType = accessPoint.DeviceType,
                    DeviceData = accessPoint.DeviceData,
                    IsActive = accessPoint.Site?.IsActive ?? accessPoint.IsActive,
                    CreatedDate = accessPoint.CreatedDate,
                    ModifiedDate = accessPoint.ModifiedDate,
                    SiteName = accessPoint.Site?.SiteName,
                    Address = accessPoint.Site?.Address
                };

                return Ok(accessPointDTO);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi lấy điểm truy cập ID {id}: {ex.Message}\nStack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi lấy điểm truy cập: " + ex.Message });
            }
        }

        [HttpGet("by-device")]
        public async Task<IActionResult> GetAccessPointByDevice([FromQuery] string deviceData)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceData))
                {
                    return BadRequest(new { message = "DeviceData là bắt buộc." });
                }

                var accessPoint = await _context.AccessPoints
                    .FirstOrDefaultAsync(ap => ap.DeviceData == deviceData && ap.IsActive == true);

                if (accessPoint == null)
                {
                    return NotFound(new { message = "Không tìm thấy điểm truy cập cho DeviceData đã cung cấp." });
                }

                var accessPointDTO = new AccessPointDTO
                {
                    AccessPointId = accessPoint.AccessPointId,
                    AccessName = accessPoint.AccessName,
                    Location = accessPoint.Location,
                    SiteId = accessPoint.SiteId,
                    DeviceType = accessPoint.DeviceType,
                    DeviceData = accessPoint.DeviceData,
                    IsActive = accessPoint.Site?.IsActive ?? accessPoint.IsActive,
                    CreatedDate = accessPoint.CreatedDate,
                    ModifiedDate = accessPoint.ModifiedDate,
                    SiteName = accessPoint.Site?.SiteName,
                    Address = accessPoint.Site?.Address
                };

                return Ok(accessPointDTO);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi lấy điểm truy cập theo DeviceData: {ex.Message}\nStack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi lấy điểm truy cập: " + ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccessPoint(int id)
        {
            try
            {
                var accessPoint = await _context.AccessPoints.FindAsync(id);
                if (accessPoint == null)
                {
                    return NotFound(new { message = "Không tìm thấy điểm truy cập." });
                }

                _context.AccessPoints.Remove(accessPoint);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa điểm truy cập thành công." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi xóa điểm truy cập ID {id}: {ex.Message}\nStack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi xóa điểm truy cập: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccessPoint(int id, [FromBody] AccessPointDTO accessPointDTO)
        {
            try
            {
                var accessPoint = await _context.AccessPoints
                    .Include(ap => ap.Site)
                    .FirstOrDefaultAsync(ap => ap.AccessPointId == id);

                if (accessPoint == null)
                {
                    return NotFound(new { message = "Không tìm thấy điểm truy cập." });
                }

                // Cập nhật các trường của AccessPoint
                accessPoint.AccessName = accessPointDTO.AccessName ?? accessPoint.AccessName;
                accessPoint.Location = accessPointDTO.Location ?? accessPoint.Location;
                accessPoint.DeviceType = accessPointDTO.DeviceType ?? accessPoint.DeviceType;
                accessPoint.DeviceData = accessPointDTO.DeviceData ?? accessPoint.DeviceData;
                accessPoint.IsActive = accessPointDTO.IsActive;
                accessPoint.ModifiedDate = DateTime.Now;

                // Kiểm tra và cập nhật Site nếu có thay đổi
                if (accessPoint.Site != null && (accessPointDTO.SiteName != null || accessPointDTO.Address != null))
                {
                    accessPoint.Site.SiteName = accessPointDTO.SiteName ?? accessPoint.Site.SiteName;
                    accessPoint.Site.Address = accessPointDTO.Address ?? accessPoint.Site.Address;
                    accessPoint.Site.IsActive = accessPointDTO.IsActive; // Đồng bộ trạng thái với AccessPoint
                    accessPoint.Site.ModifiedDate = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật điểm truy cập thành công." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi cập nhật điểm truy cập ID {id}: {ex.Message}\nStack Trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi cập nhật điểm truy cập: " + ex.Message });
            }
        }
    }
}