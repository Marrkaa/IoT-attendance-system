using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

/// <summary>
/// Represents a student's WiFi hotspot connection session.
/// A session starts when a student connects to the Teltonika RUTX11 hotspot
/// via RADIUS authentication and ends when they disconnect or leave range.
/// Used to track presence duration and calculate attendance.
/// </summary>
[Table("hotspot_sessions")]
public class HotspotSession
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("student_id")]
    public Guid StudentId { get; set; }

    [Required]
    [Column("iot_node_id")]
    public Guid IoTNodeId { get; set; }

    [Required]
    [Column("device_mac")]
    [MaxLength(17)]
    public string DeviceMac { get; set; } = string.Empty;

    [Column("radius_username")]
    [MaxLength(255)]
    public string? RadiusUsername { get; set; }

    [Column("assigned_ip")]
    [MaxLength(45)]
    public string? AssignedIp { get; set; }

    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    [Column("duration_minutes")]
    public double? DurationMinutes { get; set; }

    [Column("initial_signal_dbm")]
    public int InitialSignalDbm { get; set; }

    [Column("avg_signal_dbm")]
    public double? AvgSignalDbm { get; set; }

    [Column("min_signal_dbm")]
    public int? MinSignalDbm { get; set; }

    [Column("max_signal_dbm")]
    public int? MaxSignalDbm { get; set; }

    [Column("signal_readings_count")]
    public int SignalReadingsCount { get; set; } = 1;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("disconnect_reason")]
    [MaxLength(200)]
    public string? DisconnectReason { get; set; }

    /// <summary>RADIUS Acct-Unique-Session-Id – susieti Start / Interim / Stop.</summary>
    [Column("acct_unique_session_id")]
    [MaxLength(128)]
    public string? AcctUniqueSessionId { get; set; }

    /// <summary>Paskutinio accounting paketo laikas (arba Start).</summary>
    [Column("last_accounting_at")]
    public DateTime? LastAccountingAt { get; set; }

    // Navigation
    [ForeignKey("StudentId")]
    public User Student { get; set; } = null!;

    [ForeignKey("IoTNodeId")]
    public IoTNode IoTNode { get; set; } = null!;
}
