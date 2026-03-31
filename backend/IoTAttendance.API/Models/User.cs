using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

public enum UserRole
{
    Student,
    Lecturer,
    Administrator
}

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [Column("role")]
    public UserRole Role { get; set; }

    [MaxLength(500)]
    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(255)]
    [Column("password_reset_token")]
    public string? PasswordResetToken { get; set; }

    [Column("password_reset_expires")]
    public DateTime? PasswordResetExpires { get; set; }

    // Navigation properties
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<Lecture> LecturesAsLecturer { get; set; } = new List<Lecture>();
    public ICollection<StudentDevice> StudentDevices { get; set; } = new List<StudentDevice>();
    public RadiusAccount? RadiusAccount { get; set; }
}
