using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class RoomService
{
    private readonly AppDbContext _db;

    public RoomService(AppDbContext db) => _db = db;

    public async Task<List<RoomDto>> GetAllAsync()
    {
        var rooms = await _db.Rooms
            .Include(r => r.IoTNode)
            .OrderBy(r => r.Name)
            .ToListAsync();

        return rooms.Select(MapToDto).ToList();
    }

    public async Task<RoomDto> GetByIdAsync(Guid id)
    {
        var room = await _db.Rooms
            .Include(r => r.IoTNode)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new KeyNotFoundException("Auditorija nerasta.");
        return MapToDto(room);
    }

    public async Task<RoomDto> CreateAsync(CreateRoomRequest request)
    {
        var room = new Room
        {
            Name = request.Name,
            Capacity = request.Capacity,
            Location = request.Location
        };

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();
        return MapToDto(room);
    }

    public async Task<RoomDto> UpdateAsync(Guid id, UpdateRoomRequest request)
    {
        var room = await _db.Rooms.Include(r => r.IoTNode).FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new KeyNotFoundException("Auditorija nerasta.");

        if (request.Name != null) room.Name = request.Name;
        if (request.Capacity.HasValue) room.Capacity = request.Capacity.Value;
        if (request.Location != null) room.Location = request.Location;

        await _db.SaveChangesAsync();
        return MapToDto(room);
    }

    public async Task DeleteAsync(Guid id)
    {
        var room = await _db.Rooms.FindAsync(id)
            ?? throw new KeyNotFoundException("Auditorija nerasta.");

        var hasLectures = await _db.Lectures.AnyAsync(l => l.RoomId == id);
        if (hasLectures)
            throw new InvalidOperationException("Negalima pašalinti auditorijos, kuri turi priskirtų paskaitų.");

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();
    }

    public static RoomDto MapToDto(Room room) => new(
        room.Id, room.Name, room.Capacity, room.Location,
        room.IoTNode != null ? IoTNodeService.MapToDto(room.IoTNode, 0) : null,
        room.CreatedAt
    );
}
