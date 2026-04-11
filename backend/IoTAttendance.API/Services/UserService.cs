using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class UserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db) => _db = db;

    public async Task<List<UserDto>> GetAllAsync(string? role = null, string? search = null)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var r))
            query = query.Where(u => u.Role == r);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u =>
                u.FirstName.Contains(search) ||
                u.LastName.Contains(search) ||
                u.Email.Contains(search));

        var users = await query.OrderBy(u => u.LastName).ToListAsync();
        return users.Select(AuthService.MapToDto).ToList();
    }

    public async Task<UserDto> GetByIdAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found.");
        return AuthService.MapToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = Enum.Parse<UserRole>(request.Role)
        };

        _db.Users.Add(user);

        // Auto-create a RADIUS account for Students so they can authenticate
        // on the captive portal with the same email/password.
        if (user.Role == UserRole.Student)
        {
            _db.RadiusAccounts.Add(new RadiusAccount
            {
                UserId = user.Id,
                RadiusUsername = user.Email,
                RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsEnabled = true
            });
        }

        await _db.SaveChangesAsync();
        return AuthService.MapToDto(user);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found.");

        if (request.FirstName != null) user.FirstName = request.FirstName;
        if (request.LastName != null) user.LastName = request.LastName;
        if (request.Email != null) user.Email = request.Email;
        if (request.Role != null) user.Role = Enum.Parse<UserRole>(request.Role);
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return AuthService.MapToDto(user);
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found.");

        var radiusAccount = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == id);
        if (radiusAccount != null)
            _db.RadiusAccounts.Remove(radiusAccount);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
    }
}
