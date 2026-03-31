using IoTAttendance.API.Data;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class AuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db) => _db = db;

    public async Task LogAsync(
        AuditAction action,
        Guid? userId,
        string description,
        string? ipAddress = null,
        string? entityType = null,
        Guid? entityId = null)
    {
        var user = userId.HasValue
            ? await _db.Users.FindAsync(userId.Value)
            : null;

        var log = new AuditLog
        {
            Action = action,
            UserId = userId,
            UserEmail = user?.Email,
            UserRole = user?.Role.ToString(),
            Description = description,
            IpAddress = ipAddress,
            EntityType = entityType,
            EntityId = entityId
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task<List<AuditLog>> GetRecentAsync(int count = 50)
    {
        return await _db.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByUserAsync(Guid userId, int count = 50)
    {
        return await _db.AuditLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByActionAsync(AuditAction action, int count = 50)
    {
        return await _db.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Action == action)
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByDateRangeAsync(
        DateTime from, DateTime to, int count = 200)
    {
        return await _db.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Timestamp >= from && a.Timestamp <= to)
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .ToListAsync();
    }
}
