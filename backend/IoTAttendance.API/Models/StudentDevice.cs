using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

[Table("student_devices")]
public class StudentDevice
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("student_id")]
    public Guid StudentId { get; set; }

    [Required]
    [MaxLength(17)] // XX:XX:XX:XX:XX:XX
    [Column("mac_address")]
    public string MacAddress { get; set; } = string.Empty;

    [MaxLength(200)]
    [Column("device_name")]
    public string? DeviceName { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("registered_at")]
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    [Column("last_seen")]
    public DateTime? LastSeen { get; set; }

    // Navigation
    [ForeignKey("StudentId")]
    public User Student { get; set; } = null!;
}
