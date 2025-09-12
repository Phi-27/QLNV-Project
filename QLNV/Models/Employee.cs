using System;
using System.Collections.Generic;

namespace QLNV.Models;

public partial class Employee
{
    public int EmployeeId { get; set; }

    public string? FullName { get; set; }

    public string? EmployeeCode { get; set; }

    public string? Department { get; set; }

    public string? Role { get; set; }

    public int? AccessPointId { get; set; }

    public string? Email { get; set; }

    public string? Password { get; set; }

    public string? Phone { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedDate { get; set; }

    public DateTime? ModifiedDate { get; set; }
    public string? MemberCard { get; set; }// Thêm trường mới

    public virtual ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();
}
