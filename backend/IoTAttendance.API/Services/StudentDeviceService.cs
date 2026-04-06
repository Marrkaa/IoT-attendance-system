using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class StudentDeviceService
{
    private readonly AppDbContext _db;

    public StudentDeviceService(AppDbContext db) => _db = db;

    public async Task<List<StudentDeviceDto>> GetByStudentAsync(Guid studentId)
    {
        var devices = await _db.StudentDevices
            .Include(d => d.Student)
            .Where(d => d.StudentId == studentId)
            .OrderByDescending(d => d.RegisteredAt)
            .ToListAsync();

        return devices.Select(MapToDto).ToList();
    }

    public async Task<List<StudentDeviceDto>> GetAllAsync()
    {
        var devices = await _db.StudentDevices
            .Include(d => d.Student)
            .OrderBy(d => d.Student.LastName)
            .ToListAsync();

        return devices.Select(MapToDto).ToList();
    }

    public async Task<StudentDeviceDto> RegisterAsync(RegisterDeviceRequest request)
    {
        var macNormalized = TryNormalizeMacAddress(request.MacAddress)
            ?? throw new InvalidOperationException("Neteisingas MAC formatas.");

        var existing = await _db.StudentDevices
            .FirstOrDefaultAsync(d => d.MacAddress == macNormalized);
        if (existing != null)
            throw new InvalidOperationException("Šis MAC adresas jau registruotas sistemoje.");

        var device = new StudentDevice
        {
            StudentId = request.StudentId,
            MacAddress = macNormalized,
            DeviceName = request.DeviceName
        };

        _db.StudentDevices.Add(device);
        await _db.SaveChangesAsync();

        return MapToDto(device);
    }

    public async Task<StudentDeviceDto> UpdateAsync(Guid id, UpdateDeviceRequest request)
    {
        var device = await _db.StudentDevices.Include(d => d.Student).FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new KeyNotFoundException("Įrenginys nerastas.");

        if (request.DeviceName != null) device.DeviceName = request.DeviceName;
        if (request.IsActive.HasValue) device.IsActive = request.IsActive.Value;

        await _db.SaveChangesAsync();
        return MapToDto(device);
    }

    public async Task DeleteAsync(Guid id)
    {
        var device = await _db.StudentDevices.FindAsync(id)
            ?? throw new KeyNotFoundException("Įrenginys nerastas.");
        _db.StudentDevices.Remove(device);
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Find which student a MAC address belongs to
    /// </summary>
    public async Task<StudentDevice?> FindByMacAsync(string macAddress)
    {
        var normalized = TryNormalizeMacAddress(macAddress);
        if (normalized == null) return null;
        return await _db.StudentDevices
            .Include(d => d.Student)
            .FirstOrDefaultAsync(d => d.MacAddress == normalized && d.IsActive);
    }

    /// <summary>
    /// Registers or updates device MAC after RADIUS Accounting-Start (Calling-Station-Id).
    /// Links the phone’s Wi‑Fi MAC to the same student as <see cref="RadiusAccount"/>.
    /// </summary>
    public async Task UpsertFromRadiusAccountingAsync(Guid studentId, string rawCallingStationId)
    {
        var mac = TryNormalizeMacAddress(rawCallingStationId);
        if (mac == null) return;

        var existing = await _db.StudentDevices.FirstOrDefaultAsync(d => d.MacAddress == mac);
        if (existing != null)
        {
            if (existing.StudentId != studentId) return;
            existing.LastSeen = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return;
        }

        _db.StudentDevices.Add(new StudentDevice
        {
            StudentId = studentId,
            MacAddress = mac,
            DeviceName = "Hotspot (RADIUS)",
            IsActive = true
        });
        await _db.SaveChangesAsync();
    }

    public static string? TryNormalizeMacAddress(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var hex = string.Concat(raw.Where(Uri.IsHexDigit));
        if (hex.Length != 12) return null;
        return string.Join(":",
            Enumerable.Range(0, 6).Select(i => hex.Substring(i * 2, 2))).ToUpperInvariant();
    }

    public static StudentDeviceDto MapToDto(StudentDevice d) => new(
        d.Id, d.StudentId, d.MacAddress, d.DeviceName,
        d.IsActive, d.RegisteredAt, d.LastSeen,
        d.Student != null ? $"{d.Student.FirstName} {d.Student.LastName}" : null
    );
}
