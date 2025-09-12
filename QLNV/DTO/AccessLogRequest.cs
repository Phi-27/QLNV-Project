namespace QLNV.DTO
{
    public class AccessLogRequest
    {
        public int? EmployeeId { get; set; }
        public int? AccessPointId { get; set; }
        public DateTime? AccessTime { get; set; }
        public string AccessType { get; set; }
        public string Note { get; set; }
    }
}
