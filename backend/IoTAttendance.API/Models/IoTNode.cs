using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

public enum IoTNodeStatus
{
    Online,
    Offline,
    Maintenance
}

[Table("iot_nodes")]
public class IoTNode
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("room_id")]
    public Guid RoomId { get; set; }

    [Required]
    [MaxLength(17)] // MAC address format: XX:XX:XX:XX:XX:XX
    [Column("mac_address")]
    public string MacAddress { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [Column("hostname")]
    public string Hostname { get; set; } = string.Empty;

    [MaxLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("status")]
    public IoTNodeStatus Status { get; set; } = IoTNodeStatus.Offline;

    [Column("last_seen")]
    public DateTime? LastSeen { get; set; }

    [MaxLength(100)]
    [Column("firmware_version")]
    public string? FirmwareVersion { get; set; }

    [MaxLength(100)]
    [Column("model")]
    public string Model { get; set; } = "Teltonika RUTX11";

    [Column("hotspot_ssid")]
    [MaxLength(32)]
    public string HotspotSsid { get; set; } = string.Empty;

    [Column("signal_threshold_dbm")]
    public int SignalThresholdDbm { get; set; } = -70;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;
    public ICollection<WifiConnectionLog> WifiConnectionLogs { get; set; } = new List<WifiConnectionLog>();
}
