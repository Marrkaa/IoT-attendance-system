using IoTAttendance.API.Data;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

/// <summary>
/// Manages RADIUS authentication accounts for hotspot access.
/// The Teltonika RUTX11 router is configured to use RADIUS authentication
/// for its hotspot. When a student connects, the router sends authentication
/// request to the RADIUS server, which validates against these accounts.
/// </summary>
public class RadiusService
{
    private readonly AppDbContext _db;

    public RadiusService(AppDbContext db) => _db = db;

    /// <summary>
    /// Validate RADIUS authentication request.
    /// Called by the RADIUS server when a student tries to connect to the hotspot.
    /// </summary>
    public async Task<bool> ValidateCredentialsAsync(string username, string password)
    {
        var account = await _db.RadiusAccounts
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RadiusUsername == username && r.IsEnabled);

        if (account == null) return false;
        if (!account.User.IsActive) return false;

        return BCrypt.Net.BCrypt.Verify(password, account.RadiusPasswordHash);
    }

    /// <summary>
    /// Create a RADIUS account for a student.
    /// </summary>
    public async Task<RadiusAccount> CreateAccountAsync(Guid userId, string username, string password)
    {
        var existing = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == userId);
        if (existing != null)
            throw new InvalidOperationException("RADIUS paskyra jau sukurta šiam naudotojui.");

        var account = new RadiusAccount
        {
            UserId = userId,
            RadiusUsername = username,
            RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
        };

        _db.RadiusAccounts.Add(account);
        await _db.SaveChangesAsync();
        return account;
    }

    /// <summary>
    /// Update RADIUS account password.
    /// </summary>
    public async Task UpdatePasswordAsync(Guid userId, string newPassword)
    {
        var account = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == userId)
            ?? throw new KeyNotFoundException("RADIUS paskyra nerasta.");

        account.RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Enable or disable a RADIUS account.
    /// </summary>
    public async Task SetEnabledAsync(Guid userId, bool enabled)
    {
        var account = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == userId)
            ?? throw new KeyNotFoundException("RADIUS paskyra nerasta.");

        account.IsEnabled = enabled;
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Get RADIUS account info for a user.
    /// </summary>
    public async Task<RadiusAccount?> GetByUserIdAsync(Guid userId)
    {
        return await _db.RadiusAccounts
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.UserId == userId);
    }
}
