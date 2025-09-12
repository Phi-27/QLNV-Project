using QLNV.Models;
using System.Text.Json.Serialization;

namespace QLNV.DTO
{
    public partial class SiteDTO
    {
        public int SiteId { get; set; }
        public string? SiteName { get; set; }
        public string? Address { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        [JsonIgnore] // Ignore the reverse navigation to prevent cycles
        public virtual ICollection<AccessPointDTO> AccessPoints { get; set; } = new List<AccessPointDTO>();
    }
}
