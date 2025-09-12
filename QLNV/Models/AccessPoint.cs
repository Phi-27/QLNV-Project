using System;
using System.Collections.Generic;

namespace QLNV.Models;

public partial class AccessPoint
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

    public virtual ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();

    public virtual Site? Site { get; set; }
}
