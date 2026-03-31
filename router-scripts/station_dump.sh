#!/bin/ash
# =============================================================================
# Teltonika RUTX11 - WiFi Station Dump Script
# =============================================================================
# This script runs on the Teltonika RUTX11 router via cron.
# It collects connected WiFi client data (MAC, IP, signal strength)
# and sends it to the backend API for attendance processing.
#
# Cron setup (every 30 seconds):
#   * * * * * /root/station_dump.sh
#   * * * * * sleep 30 && /root/station_dump.sh
#
# Configuration:
API_URL="https://your-server.com/api/iot-nodes/station-dump"
API_KEY="rutx11-station-dump-secret-key"
IOT_NODE_ID="your-iot-node-guid-here"

# WiFi interfaces to scan
IFACES="wlan0 wlan1"

# Build JSON payload
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
STATIONS="["
FIRST=true

for iface in $IFACES; do
    # Get connected stations using iw
    stations=$(iw dev "$iface" station dump | grep "Station" | awk '{print $2}')

    for sta in $stations; do
        # Get signal strength
        signal=$(iw dev "$iface" station get "$sta" | grep "signal:" | awk '{print $2}')

        # Get IP from ARP table
        ip=$(grep "$sta" /proc/net/arp | awk '{print $1}')

        # Get hostname from DHCP leases
        hostname=$(grep -i "$sta" /var/dhcp.leases | awk '{print $4}')

        if [ -n "$signal" ]; then
            if [ "$FIRST" = true ]; then
                FIRST=false
            else
                STATIONS="$STATIONS,"
            fi

            STATIONS="$STATIONS{\"macAddress\":\"$(echo "$sta" | tr 'a-f' 'A-F')\",\"ipAddress\":\"$ip\",\"hostname\":\"$hostname\",\"signalStrengthDbm\":$signal,\"interface\":\"$iface\"}"
        fi
    done
done

STATIONS="$STATIONS]"

# Send to backend API
JSON="{\"ioTNodeId\":\"$IOT_NODE_ID\",\"stations\":$STATIONS,\"timestamp\":\"$TIMESTAMP\"}"

curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "X-Api-Key: $API_KEY" \
    -d "$JSON"
