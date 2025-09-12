using System;
using System.Collections.Generic;

namespace QLNV.Models;

public partial class AccessLog
{
    public int LogId { get; set; }

    public int? EmployeeId { get; set; }

    public int? AccessPointId { get; set; }

    public DateTime? AccessTime { get; set; }

    public string? AccessResult { get; set; }

    public string? AccessStatus { get; set; }

    public string? AccessType { get; set; }

    public string? Note { get; set; }

    public virtual AccessPoint? AccessPoint { get; set; }

    public virtual Employee? Employee { get; set; }
}
