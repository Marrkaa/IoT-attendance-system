using IoTAttendance.API.DTOs;

namespace IoTAttendance.API.Services;

/// <summary>
/// Parses raw output from the Teltonika RUTX11 router's
/// "iw dev {interface} station dump" command.
///
/// The router runs this shell script (station_dump.sh) via cron:
///   #!/bin/ash
///   ifaces="wlan0 wlan1"
///   for iface in $ifaces; do
///       stations=$(iw dev $iface station dump | grep Station | awk '{print $2}')
///       for sta in $stations; do
///           iw dev $iface station get $sta
///           grep $sta /proc/net/arp
///           grep -i $sta /var/dhcp.leases
///       done
///   done
///
/// The script collects MAC addresses, signal strength (dBm), IP addresses,
/// and hostnames for all connected WiFi clients, then sends them as JSON
/// to the backend API endpoint POST /api/iot-nodes/station-dump.
/// </summary>
public class StationDumpParser
{
    /// <summary>
    /// Parse raw station dump text output into structured StationEntry objects.
    /// Used when the router sends raw text instead of pre-formatted JSON.
    /// </summary>
    public List<StationEntry> ParseRawDump(string rawOutput)
    {
        var entries = new List<StationEntry>();
        StationEntry? current = null;

        foreach (var line in rawOutput.Split('\n'))
        {
            var trimmed = line.Trim();

            if (trimmed.StartsWith("Station"))
            {
                if (current != null) entries.Add(current);
                var mac = trimmed.Split(' ')[1];
                var iface = trimmed.Contains("wlan") ? ExtractInterface(trimmed) : "wlan0";
                current = new StationEntry { MacAddress = mac.ToUpper(), Interface = iface };
            }
            else if (current != null)
            {
                if (trimmed.StartsWith("signal:"))
                    current.SignalStrengthDbm = ParseSignal(trimmed);
                else if (trimmed.StartsWith("signal avg:"))
                    current.SignalAvgDbm = ParseSignal(trimmed);
                else if (trimmed.StartsWith("rx bytes:"))
                    current.RxBytes = ParseLong(trimmed);
                else if (trimmed.StartsWith("tx bytes:"))
                    current.TxBytes = ParseLong(trimmed);
                else if (trimmed.StartsWith("connected time:"))
                    current.ConnectedTimeSeconds = ParseInt(trimmed);
                else if (trimmed.Contains("IP:") && trimmed.Contains("ARP"))
                    current.IpAddress = ExtractIpFromArp(trimmed);
                else if (trimmed.Contains("IP:") && trimmed.Contains("DHCP"))
                    current.IpAddress ??= ExtractIpFromDhcp(trimmed);
                else if (trimmed.Contains("NAME:") && trimmed.Contains("DHCP"))
                    current.Hostname = ExtractHostname(trimmed);
            }
        }

        if (current != null) entries.Add(current);
        return entries;
    }

    /// <summary>
    /// Convert parsed station entries to the DTO format expected by RouterPollingService.
    /// </summary>
    public RouterStationDumpRequest ToRequest(
        Guid iotNodeId,
        List<StationEntry> entries,
        DateTime? timestamp = null)
    {
        var stations = entries.Select(e => new RouterStationInfo(
            e.MacAddress,
            e.IpAddress,
            e.Hostname,
            e.SignalStrengthDbm,
            e.Interface
        )).ToList();

        return new RouterStationDumpRequest(
            iotNodeId,
            stations,
            timestamp ?? DateTime.UtcNow
        );
    }

    /// <summary>
    /// Determine attendance eligibility based on signal strength.
    /// Signal must be above the threshold (e.g., -70 dBm) to count.
    /// </summary>
    public static bool IsSignalSufficient(int signalDbm, int thresholdDbm)
    {
        return signalDbm >= thresholdDbm;
    }

    /// <summary>
    /// Classify signal quality for UI display.
    /// </summary>
    public static string ClassifySignal(int dbm)
    {
        return dbm switch
        {
            >= -30 => "Excellent",
            >= -50 => "Very Good",
            >= -60 => "Good",
            >= -70 => "Fair",
            >= -80 => "Weak",
            _ => "Very Weak"
        };
    }

    private static int ParseSignal(string line) =>
        int.TryParse(line.Split(':').Last().Trim().Split(' ')[0], out var v) ? v : -90;

    private static int ParseInt(string line) =>
        int.TryParse(line.Split(':').Last().Trim().Split(' ')[0], out var v) ? v : 0;

    private static long ParseLong(string line) =>
        long.TryParse(line.Split(':').Last().Trim().Split(' ')[0], out var v) ? v : 0;

    private static string ExtractInterface(string line)
    {
        var parts = line.Split(' ');
        return parts.Length > 3 ? parts[3] : "wlan0";
    }

    private static string? ExtractIpFromArp(string line)
    {
        var idx = line.IndexOf("IP:", StringComparison.Ordinal);
        if (idx < 0) return null;
        return line[(idx + 3)..].Trim().Split(' ')[0];
    }

    private static string? ExtractIpFromDhcp(string line)
    {
        var idx = line.IndexOf("IP:", StringComparison.Ordinal);
        if (idx < 0) return null;
        return line[(idx + 3)..].Trim().Split(' ')[0];
    }

    private static string? ExtractHostname(string line)
    {
        var idx = line.IndexOf("NAME:", StringComparison.Ordinal);
        if (idx < 0) return null;
        return line[(idx + 5)..].Trim().Split(' ')[0];
    }
}

/// <summary>
/// Represents a single connected WiFi station as parsed from "iw station dump".
/// </summary>
public class StationEntry
{
    public string MacAddress { get; set; } = string.Empty;
    public string Interface { get; set; } = "wlan0";
    public int SignalStrengthDbm { get; set; } = -90;
    public int? SignalAvgDbm { get; set; }
    public string? IpAddress { get; set; }
    public string? Hostname { get; set; }
    public long RxBytes { get; set; }
    public long TxBytes { get; set; }
    public int ConnectedTimeSeconds { get; set; }
}
