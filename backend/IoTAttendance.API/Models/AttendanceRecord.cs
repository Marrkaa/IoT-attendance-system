using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

public enum AttendanceStatus
{
    Present,
    Late,
    Absent
}

[Table("attendance_records")]
public class AttendanceRecord
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("lecture_id")]
    public Guid LectureId { get; set; }

    [Required]
    [Column("student_id")]
    public Guid StudentId { get; set; }

    [Column("schedule_id")]
    public Guid? ScheduleId { get; set; }

    [Column("date")]
    public DateOnly Date { get; set; }

    [Column("status")]
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Absent;

    [Column("check_in_time")]
    public DateTime? CheckInTime { get; set; }

    [Column("check_out_time")]
    public DateTime? CheckOutTime { get; set; }

    [Column("signal_strength_dbm")]
    public int? SignalStrengthDbm { get; set; }

    [Column("avg_signal_strength_dbm")]
    public double? AvgSignalStrengthDbm { get; set; }

    [Column("connection_duration_minutes")]
    public double? ConnectionDurationMinutes { get; set; }

    [Column("is_manual_override")]
    public bool IsManualOverride { get; set; } = false;

    [Column("override_by")]
    public Guid? OverrideBy { get; set; }

    [Column("override_reason")]
    [MaxLength(500)]
    public string? OverrideReason { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("LectureId")]
    public Lecture Lecture { get; set; } = null!;

    [ForeignKey("StudentId")]
    public User Student { get; set; } = null!;

    [ForeignKey("ScheduleId")]
    public Schedule? Schedule { get; set; }
}
