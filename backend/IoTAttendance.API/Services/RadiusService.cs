using IoTAttendance.API.Data;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

/// <summary>
/// RADIUS accounts + accounting: sessions in DB from RADIUS packets (not station dump).
/// </summary>
public class RadiusService
{
    private readonly AppDbContext _db;
    private readonly StudentDeviceService _studentDevices;
    private readonly IConfiguration _config;

    public RadiusService(AppDbContext db, StudentDeviceService studentDevices, IConfiguration config)
    {
        _db = db;
        _studentDevices = studentDevices;
        _config = config;
    }

    public async Task<bool> ValidateCredentialsAsync(string username, string password)
    {
        var account = await _db.RadiusAccounts
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RadiusUsername == username && r.IsEnabled);

        if (account == null) return false;
        if (!account.User.IsActive) return false;

        return BCrypt.Net.BCrypt.Verify(password, account.RadiusPasswordHash);
    }

    public async Task<RadiusAccount> CreateAccountAsync(Guid userId, string username, string password)
    {
        var existing = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == userId);
        if (existing != null)
            throw new InvalidOperationException("RADIUS account already exists for this user.");

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

    public async Task UpdatePasswordAsync(Guid userId, string newPassword)
    {
        var account = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == userId)
            ?? throw new KeyNotFoundException("RADIUS account not found.");

        account.RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task SetEnabledAsync(Guid userId, bool enabled)
    {
        var account = await _db.RadiusAccounts.FirstOrDefaultAsync(r => r.UserId == userId)
            ?? throw new KeyNotFoundException("RADIUS account not found.");

        account.IsEnabled = enabled;
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<RadiusAccount?> GetByUserIdAsync(Guid userId)
    {
        return await _db.RadiusAccounts
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.UserId == userId);
    }

    /// <summary>
    /// Full RADIUS accounting: Start / Stop / Interim-Update → HotspotSession + MAC on StudentDevice.
    /// </summary>
    public async Task ProcessAccountingAsync(
        string? userName,
        string? callingStationId,
        string? acctStatusType,
        string? acctUniqueSessionId,
        string? acctSessionTime,
        string? framedIpAddress)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return;

        var status = ParseAcctStatus(acctStatusType);
        if (status == null)
            return;

        var account = await _db.RadiusAccounts
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RadiusUsername == userName && r.IsEnabled);

        if (account == null || !account.User.IsActive)
            return;

        var iotNodeId = await ResolveDefaultIoTNodeIdAsync();
        var sessionSeconds = ParseUnsignedInt(acctSessionTime);
        var now = DateTime.UtcNow;
        var mac = StudentDeviceService.TryNormalizeMacAddress(callingStationId);

        switch (status.Value)
        {
            case 1: // Start
                if (mac != null)
                    await _studentDevices.UpsertFromRadiusAccountingAsync(account.UserId, callingStationId!);

                if (!string.IsNullOrEmpty(acctUniqueSessionId))
                {
                    var existing = await _db.HotspotSessions.FirstOrDefaultAsync(h =>
                        h.AcctUniqueSessionId == acctUniqueSessionId);
                    if (existing != null)
                    {
                        existing.LastAccountingAt = now;
                        if (sessionSeconds.HasValue)
                            existing.DurationMinutes = sessionSeconds.Value / 60.0;
                        await _db.SaveChangesAsync();
                        return;
                    }
                }

                if (mac == null)
                    return;

                _db.HotspotSessions.Add(new HotspotSession
                {
                    StudentId = account.UserId,
                    IoTNodeId = iotNodeId,
                    DeviceMac = mac,
                    RadiusUsername = userName,
                    AssignedIp = framedIpAddress,
                    StartTime = now,
                    IsActive = true,
                    AcctUniqueSessionId = acctUniqueSessionId,
                    LastAccountingAt = now,
                    InitialSignalDbm = 0,
                    DurationMinutes = sessionSeconds.HasValue ? sessionSeconds.Value / 60.0 : null
                });
                await _db.SaveChangesAsync();
                break;

            case 2: // Stop
                {
                    HotspotSession? sess = null;
                    if (!string.IsNullOrEmpty(acctUniqueSessionId))
                        sess = await _db.HotspotSessions.FirstOrDefaultAsync(h =>
                            h.AcctUniqueSessionId == acctUniqueSessionId);
                    if (sess == null && mac != null)
                        sess = await _db.HotspotSessions
                            .Where(h => h.StudentId == account.UserId && h.DeviceMac == mac && h.EndTime == null)
                            .OrderByDescending(h => h.StartTime)
                            .FirstOrDefaultAsync();

                    if (sess == null)
                        return;

                    sess.EndTime = now;
                    sess.IsActive = false;
                    sess.LastAccountingAt = now;
                    sess.DurationMinutes = sessionSeconds.HasValue
                        ? sessionSeconds.Value / 60.0
                        : (now - sess.StartTime).TotalMinutes;
                    sess.DisconnectReason = "RADIUS Accounting-Stop";
                    await _db.SaveChangesAsync();
                    break;
                }

            case 3: // Interim-Update
                {
                    HotspotSession? sess = null;
                    if (!string.IsNullOrEmpty(acctUniqueSessionId))
                        sess = await _db.HotspotSessions.FirstOrDefaultAsync(h =>
                            h.AcctUniqueSessionId == acctUniqueSessionId && h.EndTime == null);
                    if (sess == null && mac != null)
                        sess = await _db.HotspotSessions
                            .Where(h => h.StudentId == account.UserId && h.DeviceMac == mac && h.EndTime == null)
                            .OrderByDescending(h => h.StartTime)
                            .FirstOrDefaultAsync();

                    if (sess == null)
                        return;

                    sess.LastAccountingAt = now;
                    if (sessionSeconds.HasValue)
                        sess.DurationMinutes = sessionSeconds.Value / 60.0;
                    await _db.SaveChangesAsync();
                    break;
                }
        }
    }

    private async Task<Guid> ResolveDefaultIoTNodeIdAsync()
    {
        var configured = _config["Radius:DefaultIoTNodeId"];
        if (!string.IsNullOrWhiteSpace(configured) && Guid.TryParse(configured, out var id))
        {
            if (await _db.IoTNodes.AnyAsync(n => n.Id == id))
                return id;
        }

        var first = await _db.IoTNodes.OrderBy(n => n.Hostname).Select(n => n.Id).FirstOrDefaultAsync();
        if (first == Guid.Empty)
            throw new InvalidOperationException(
                "No IoT node in the database. Create one (admin) or set Radius:DefaultIoTNodeId.");
        return first;
    }

    private static int? ParseAcctStatus(string? acctStatusType)
    {
        if (string.IsNullOrWhiteSpace(acctStatusType)) return null;
        var s = acctStatusType.Trim();
        if (int.TryParse(s, out var n) && n is >= 1 and <= 3)
            return n;
        if (s.Equals("Start", StringComparison.OrdinalIgnoreCase)) return 1;
        if (s.Equals("Stop", StringComparison.OrdinalIgnoreCase)) return 2;
        if (s.Equals("Interim-Update", StringComparison.OrdinalIgnoreCase)) return 3;
        return null;
    }

    private static int? ParseUnsignedInt(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return int.TryParse(raw.Trim(), out var v) ? v : null;
    }
}
