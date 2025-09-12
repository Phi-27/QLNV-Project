using System;
using System.Collections.Generic;

namespace QLNV.Models;

public partial class Site
{
    public int SiteId { get; set; }

    public string? SiteName { get; set; }

    public string? Address { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedDate { get; set; }

    public DateTime? ModifiedDate { get; set; }

    public virtual ICollection<AccessPoint> AccessPoints { get; set; } = new List<AccessPoint>();
}
