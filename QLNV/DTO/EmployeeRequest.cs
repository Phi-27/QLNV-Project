namespace QLNV.DTO
{
    public class EmployeeRequest
    {
        public string FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public string? MemberCard {  get; set; }
        public string? Department { get; set; }
        public string? Role { get; set; }
        public int? AccessPointId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Phone { get; set; }
        public bool? IsActive { get; set; }
    }
}
