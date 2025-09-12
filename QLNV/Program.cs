using Microsoft.EntityFrameworkCore;
using QLNV.Models;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Add authentication based on cookies
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login_page/login.html";
        options.AccessDeniedPath = "/login_page/login.html";
    });

// Register DbContext
builder.Services.AddDbContext<QlnvContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole(); // Log to console
    logging.AddDebug();   // Log to debug output
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins("http://localhost:33135") // Match the frontend origin
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Serve static files from wwwroot
app.UseRouting();

app.UseCors("AllowLocalhost"); // Apply CORS policy

app.UseAuthentication();
app.UseSession();
app.UseAuthorization();
app.MapControllers();

// Fallback route for redirection
app.MapFallback(async context =>
{
    var session = context.Session;
    var response = context.Response;

    var userEmail = session.GetString("UserEmail");
    if (string.IsNullOrEmpty(userEmail))
    {
        response.Redirect("/login_page/login.html");
        return;
    }

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<QlnvContext>();
    var user = await dbContext.Employees.FirstOrDefaultAsync(u => u.Email == userEmail);

    if (user == null)
    {
        response.Redirect("/login_page/login.html");
        return;
    }

    if (user.Role == "1") // Admin
    {
        response.Redirect("/home_page/index.html");
    }
    else // Nhân viên
    {
        response.Redirect("/nhanvien_page/home.html");
    }
});

app.Run();