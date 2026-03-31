using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

[Table("lectures")]
public class Lecture
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(300)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("lecturer_id")]
    public Guid LecturerId { get; set; }

    [Required]
    [Column("room_id")]
    public Guid RoomId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("LecturerId")]
    public User Lecturer { get; set; } = null!;

    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
}
