using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLNV.Models;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;

namespace QLNV.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly QlnvContext _context;

        public AuthController(QlnvContext context)
        {
            _context = context;
        }

        private string HashWithSHA256(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(password);
                byte[] hashBytes = sha256.ComputeHash(inputBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ email và mật khẩu." });
            }

            var user = await _context.Employees
                .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Email không tồn tại." });
            }

            var hashedInput = HashWithSHA256(model.Password);

            if (user.Password != hashedInput)
            {
                return Unauthorized(new { message = "Mật khẩu không đúng." });
            }

            // Debug giá trị Role từ CSDL
            Console.WriteLine($"Role từ CSDL: {user.Role}");

            // Chuẩn hóa Role
            var role = user.Role?.Trim() ?? "nhân viên";
            if (role != "admin" && role != "nhân viên")
            {
                role = "nhân viên"; // Mặc định là nhân viên nếu Role không hợp lệ
            }

            // Debug giá trị Role sau khi chuẩn hóa
            Console.WriteLine($"Role sau chuẩn hóa: {role}");

            // Lưu thông tin vào session
            HttpContext.Session.SetString("UserEmail", user.Email);
            HttpContext.Session.SetString("UserName", user.FullName ?? "Unknown");
            HttpContext.Session.SetString("UserRole", role);

            // Tạo claims cho xác thực
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.FullName ?? "Unknown"),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, role)
            };
            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30)
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            return Ok(new
            {
                //message = "Đăng nhập thành công",
                name = user.FullName,
                email = user.Email,
                role = role
            });
        }

        [HttpGet("user")]
        public IActionResult GetCurrentUser()
        {
            var email = HttpContext.Session.GetString("UserEmail");
            var name = HttpContext.Session.GetString("UserName");
            var role = HttpContext.Session.GetString("UserRole");

            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "Chưa đăng nhập." });
            }

            // Debug giá trị Role từ session
            Console.WriteLine($"Role từ session: {role}");

            return Ok(new
            {
                email = email,
                name = name,
                role = role
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            HttpContext.Session.Clear();
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { message = "Đăng xuất thành công." });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}