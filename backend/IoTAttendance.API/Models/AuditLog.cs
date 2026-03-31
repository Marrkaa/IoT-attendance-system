using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

public enum AuditAction
{
    Login,
    Logout,
    Register,
    PasswordChange,
    PasswordReset,
    UserCreated,
    UserUpdated,
    UserDeactivated,
    RoomCreated,
    RoomUpdated,
    RoomDeleted,
    LectureCreated,
    LectureUpdated,
    LectureDeleted,
    EnrollmentCreated,
    EnrollmentDeleted,
    AttendanceMarked,
    AttendanceOverridden,
    DeviceRegistered,
    DeviceRemoved,
    RadiusAccountToggled,
    RouterDataReceived,
    AttendanceFinalized
}

[Table("audit_logs")]
public class AuditLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("action")]
    public AuditAction Action { get; set; }

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [MaxLength(255)]
    [Column("user_email")]
    public string? UserEmail { get; set; }

    [MaxLength(50)]
    [Column("user_role")]
    public string? UserRole { get; set; }

    [MaxLength(500)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [MaxLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("entity_type")]
    [MaxLength(100)]
    public string? EntityType { get; set; }

    [Column("entity_id")]
    public Guid? EntityId { get; set; }

    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("UserId")]
    public User? User { get; set; }
}
