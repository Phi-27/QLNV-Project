using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLNV.Models;
using QLNV.DTO;
using System.Text.Json;

namespace QLNV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SiteController : ControllerBase
    {
        private readonly QlnvContext _context;
        private readonly ILogger<SiteController> _logger;

        public SiteController(QlnvContext context, ILogger<SiteController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Site
        [HttpGet]
        public async Task<IActionResult> GetSites()
        {
            try
            {
                var sites = await _context.Sites.ToListAsync();
                _logger.LogInformation("Fetched sites: {@Sites}", sites);
                if (sites == null || !sites.Any())
                {
                    _logger.LogWarning("No sites found in the database.");
                    return NotFound(new { message = "Không tìm thấy toà nhà nào." });
                }

                // Map to DTO
                var siteDTOs = sites.Select(s => new SiteDTO
                {
                    SiteId = s.SiteId,
                    SiteName = s.SiteName,
                    Address = s.Address,
                    IsActive = s.IsActive,
                    CreatedDate = s.CreatedDate,
                    ModifiedDate = s.ModifiedDate,
                    AccessPoints = new List<AccessPointDTO>()
                }).ToList();

                return Ok(siteDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sites");
                return StatusCode(500, new { message = "Lỗi hệ thống, vui lòng thử lại sau." });
            }
        }

        // GET: api/Site/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSite(int id)
        {
            try
            {
                var site = await _context.Sites
                    .Include(s => s.AccessPoints)
                    .FirstOrDefaultAsync(s => s.SiteId == id);
                if (site == null)
                {
                    _logger.LogWarning("Site with ID {Id} not found.", id);
                    return NotFound(new { message = $"Không tìm thấy toà nhà với ID {id}." });
                }

                // Map to DTO
                var siteDTO = new SiteDTO
                {
                    SiteId = site.SiteId,
                    SiteName = site.SiteName,
                    Address = site.Address,
                    IsActive = site.IsActive,
                    CreatedDate = site.CreatedDate,
                    ModifiedDate = site.ModifiedDate,
                    AccessPoints = site.AccessPoints.Select(ap => new AccessPointDTO
                    {
                        AccessPointId = ap.AccessPointId,
                        AccessName = ap.AccessName,
                        Location = ap.Location,
                        SiteId = ap.SiteId,
                        DeviceType = ap.DeviceType,
                        DeviceData = ap.DeviceData,
                        IsActive = ap.IsActive,
                        CreatedDate = ap.CreatedDate,
                        ModifiedDate = ap.ModifiedDate
                    }).ToList()
                };

                _logger.LogInformation("Fetched site: {@Site}", siteDTO);
                return Ok(siteDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching site with ID {Id}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống, vui lòng thử lại sau." });
            }
        }

        // POST: api/Site
        [HttpPost]
        public async Task<IActionResult> CreateSite([FromBody] SiteDTO siteDTO)
        {
            try
            {
                if (siteDTO == null)
                {
                    _logger.LogWarning("Received null siteDTO for site creation.");
                    return BadRequest(new { message = "Dữ liệu không hợp lệ, vui lòng kiểm tra lại." });
                }

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for site creation: {@ModelState}", ModelState);
                    return BadRequest(new { message = "Dữ liệu không hợp lệ, vui lòng kiểm tra lại." });
                }

                // Check for duplicate SiteName
                if (await _context.Sites.AnyAsync(s => s.SiteName == siteDTO.SiteName))
                {
                    _logger.LogWarning("Site name {SiteName} already exists.", siteDTO.SiteName);
                    return BadRequest(new { message = "Tên toà nhà đã tồn tại." });
                }

                // Map DTO to entity
                var site = new Site
                {
                    SiteName = siteDTO.SiteName,
                    Address = siteDTO.Address,
                    IsActive = siteDTO.IsActive,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now
                };

                _context.Sites.Add(site);
                await _context.SaveChangesAsync();

                // Map created entity back to DTO
                var createdSiteDTO = new SiteDTO
                {
                    SiteId = site.SiteId,
                    SiteName = site.SiteName,
                    Address = site.Address,
                    IsActive = site.IsActive,
                    CreatedDate = site.CreatedDate,
                    ModifiedDate = site.ModifiedDate,
                    AccessPoints = new List<AccessPointDTO>()
                };

                _logger.LogInformation("Created site: {@Site}", createdSiteDTO);
                return Ok(new { message = "Tạo toà nhà thành công.", site = createdSiteDTO });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating site");
                return StatusCode(500, new { message = "Lỗi hệ thống, vui lòng thử lại sau." });
            }
        }

        // PUT: api/Site/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSite(int id, [FromBody] JsonElement body)
        {
            try
            {
                if (!body.TryGetProperty("siteName", out var siteNameElement) || siteNameElement.ValueKind == JsonValueKind.Null || string.IsNullOrWhiteSpace(siteNameElement.GetString()))
                {
                    _logger.LogWarning("SiteName is missing or invalid in request body.");
                    return BadRequest(new { message = "Tên toà nhà là bắt buộc." });
                }

                if (!body.TryGetProperty("address", out var addressElement) || addressElement.ValueKind == JsonValueKind.Null || string.IsNullOrWhiteSpace(addressElement.GetString()))
                {
                    _logger.LogWarning("Address is missing or invalid in request body.");
                    return BadRequest(new { message = "Địa chỉ là bắt buộc." });
                }

                bool isActive;
                if (!body.TryGetProperty("isActive", out var isActiveElement))
                {
                    _logger.LogWarning("IsActive is missing in request body.");
                    return BadRequest(new { message = "Trạng thái là bắt buộc." });
                }
                // Handle isActive as string or boolean
                if (isActiveElement.ValueKind == JsonValueKind.String)
                {
                    if (!bool.TryParse(isActiveElement.GetString(), out isActive))
                    {
                        _logger.LogWarning("Invalid isActive value: {Value}", isActiveElement.GetString());
                        return BadRequest(new { message = "Trạng thái không hợp lệ, phải là true hoặc false." });
                    }
                }
                else if (isActiveElement.ValueKind == JsonValueKind.True || isActiveElement.ValueKind == JsonValueKind.False)
                {
                    isActive = isActiveElement.GetBoolean();
                }
                else
                {
                    _logger.LogWarning("Invalid isActive value kind: {ValueKind}", isActiveElement.ValueKind);
                    return BadRequest(new { message = "Trạng thái không hợp lệ, phải là true hoặc false." });
                }

                var site = await _context.Sites.FindAsync(id);
                if (site == null)
                {
                    _logger.LogWarning("Site with ID {Id} not found.", id);
                    return NotFound(new { message = $"Không tìm thấy toà nhà với ID {id}." });
                }

                // Check for duplicate SiteName (excluding the current site)
                var siteName = siteNameElement.GetString();
                if (await _context.Sites.AnyAsync(s => s.SiteName == siteName && s.SiteId != id))
                {
                    _logger.LogWarning("Site name {SiteName} already exists.", siteName);
                    return BadRequest(new { message = "Tên toà nhà đã tồn tại." });
                }

                // Map DTO to entity
                site.SiteName = siteName;
                site.Address = addressElement.GetString();
                site.IsActive = isActive;
                site.ModifiedDate = DateTime.Now;
                _context.Sites.Update(site);
                await _context.SaveChangesAsync();

                // Map updated entity back to DTO
                var updatedSiteDTOResponse = new SiteDTO
                {
                    SiteId = site.SiteId,
                    SiteName = site.SiteName,
                    Address = site.Address,
                    IsActive = site.IsActive,
                    CreatedDate = site.CreatedDate,
                    ModifiedDate = site.ModifiedDate,
                    AccessPoints = new List<AccessPointDTO>()
                };

                _logger.LogInformation("Updated site: {@Site}", site);
                return Ok(new { message = "Cập nhật toà nhà thành công.", site = updatedSiteDTOResponse });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating site with ID {Id}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống, vui lòng thử lại sau." });
            }
        }

        // DELETE: api/Site/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSite(int id)
        {
            try
            {
                var site = await _context.Sites.FindAsync(id);
                if (site == null)
                {
                    _logger.LogWarning("Site with ID {Id} not found.", id);
                    return NotFound(new { message = $"Không tìm thấy toà nhà với ID {id}." });
                }
                _context.Sites.Remove(site);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Xóa toà nhà thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting site with ID {Id}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống, vui lòng thử lại sau." });
            }
        }
    }
}
