namespace QLNV.DTO
{
    public class AccessLogDTO
    {
        public int LogId { get; set; }
        public int? EmployeeId { get; set; }
        public string FullName { get; set; } 
        public string EmployeeCode { get; set; }
        public int? AccessPointId { get; set; }
        public string AccessPointName { get; set; }
        public DateTime? AccessTime { get; set; }
        public string AccessResult { get; set; }
        public string AccessStatus { get; set; }
        public string AccessType { get; set; }
        public string Note { get; set; }
    }
}