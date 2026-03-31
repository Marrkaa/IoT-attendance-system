using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

public enum ConnectionEventType
{
    Connected,
    Disconnected,
    SignalUpdate
}

[Table("wifi_connection_logs")]
public class WifiConnectionLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("iot_node_id")]
    public Guid IoTNodeId { get; set; }

    [Required]
    [MaxLength(17)]
    [Column("client_mac_address")]
    public string ClientMacAddress { get; set; } = string.Empty;

    [MaxLength(45)]
    [Column("client_ip_address")]
    public string? ClientIpAddress { get; set; }

    [MaxLength(200)]
    [Column("client_hostname")]
    public string? ClientHostname { get; set; }

    [Column("signal_strength_dbm")]
    public int SignalStrengthDbm { get; set; }

    [Column("event_type")]
    public ConnectionEventType EventType { get; set; }

    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(20)]
    [Column("wifi_interface")]
    public string? WifiInterface { get; set; } // wlan0, wlan1

    // Navigation
    [ForeignKey("IoTNodeId")]
    public IoTNode IoTNode { get; set; } = null!;
}
