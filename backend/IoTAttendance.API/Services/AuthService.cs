using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace IoTAttendance.API.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Neteisingas el. pašto adresas arba slaptažodis.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Paskyra yra deaktyvuota.");

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, MapToDto(user));
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Naudotojas su šiuo el. pašto adresu jau egzistuoja.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = UserRole.Student // default role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Create RADIUS account for students
        var radiusAccount = new RadiusAccount
        {
            UserId = user.Id,
            RadiusUsername = user.Email,
            RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };
        _db.RadiusAccounts.Add(radiusAccount);
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, MapToDto(user));
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Naudotojas nerastas.");
        return MapToDto(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Naudotojas nerastas.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Neteisingas dabartinis slaptažodis.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<string> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return "reset-token-placeholder";

        var token = Convert.ToBase64String(
            System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

        user.PasswordResetToken = BCrypt.Net.BCrypt.HashPassword(token);
        user.PasswordResetExpires = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // TODO: Send email via NotificationService with reset link containing token
        return token;
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var users = await _db.Users
            .Where(u => u.PasswordResetExpires > DateTime.UtcNow)
            .ToListAsync();

        var user = users.FirstOrDefault(u =>
            u.PasswordResetToken != null &&
            BCrypt.Net.BCrypt.Verify(request.Token, u.PasswordResetToken));

        if (user == null)
            throw new InvalidOperationException("Neteisingas arba pasibaigęs slaptažodžio atkūrimo raktas.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpires = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "DefaultSecretKey12345678901234567890"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "IoTAttendance",
            audience: _config["Jwt:Audience"] ?? "IoTAttendanceApp",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static UserDto MapToDto(User user) => new(
        user.Id, user.Email, user.FirstName, user.LastName,
        user.Role.ToString(), user.AvatarUrl, user.IsActive, user.CreatedAt
    );
}
