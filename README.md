# 🧾 THUCTAP-SPEED-POS

Dự án **Quản lý chấm công nhân viên** được xây dựng trong quá trình thực tập tại **Speed POS**.  
- **Backend**: Viết bằng C# (.NET API / MVC)  
- **Frontend**: Viết bằng ReactJS  
- **Database**: SQL Server  
Mục tiêu: Giúp quản lý thông tin nhân viên, ca làm, và chấm công một cách trực quan, dễ mở rộng.

---

## ⚙️ Công nghệ sử dụng
- ASP.NET MVC / Web API  
- Entity Framework Core  
- SQL Server  
- ReactJS  
- Bootstrap / CSS
## 🚀 Cách cài đặt và chạy dự án
### 🔹 1. Chuẩn bị cơ sở dữ liệu (Database)
1. Mở **SQL Server Management Studio (SSMS)**  
2. Tạo database mới tên là `QLNV`  
3. Mở file **`QLNV.sql`** trong thư mục gốc của dự án  
4. Nhấn **Execute (F5)** để chạy toàn bộ script và khởi tạo dữ liệu
> ✅ Sau khi chạy thành công, database QLNV sẽ có đầy đủ bảng và dữ liệu mẫu.
---
### 🔹 2. Cấu hình Backend (.NET)
1. Mở thư mục **QLNV** bằng **Visual Studio 2022**  
2. Kiểm tra file `appsettings.json`, đảm bảo chuỗi kết nối chính xác:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=PHI;Database=QLNV;Trusted_Connection=True;TrustServerCertificate=True;"
   }
Thay PHI bằng tên server SQL trên máy bạn
Chạy backend F5
3. Chạy Frontend (ReactJS)
Mở thư mục client/ trong Command Prompt / Terminal
Cài đặt thư viện:
npm install
Chạy ứng dụng:
npm start
