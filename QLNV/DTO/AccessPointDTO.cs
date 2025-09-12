using QLNV.Models;
using System.Text.Json.Serialization;

namespace QLNV.DTO
{
    public class AccessPointDTO
    {
        public int AccessPointId { get; set; }
        public string? AccessName { get; set; }
        public string? Location { get; set; }
        public int? SiteId { get; set; }
        public string? DeviceType { get; set; }
        public string? DeviceData { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? SiteName { get; set; } 
        public string? Address { get; set; }

        [JsonIgnore]
        public virtual ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();

        [JsonIgnore]
        public virtual Site? Site { get; set; }
    }
}