#!/bin/sh
API_URL="http://192.168.1.119:5000/api/iot-nodes/station-dump"
API_KEY="rutx11-station-dump-secret-key"
IOT_NODE_ID="7292d7e9-37fe-463e-ad4a-80349432f049"

IFACES=""

if [ -z "$IOT_NODE_ID" ] || [ "$IOT_NODE_ID" = "00000000-0000-0000-0000-000000000000" ]; then
	logger -t station_dump "Nustatyk IOT_NODE_ID station_dump.sh"
	exit 1
fi

if [ -z "$IFACES" ]; then
	IFACES=$(iw dev 2>/dev/null | awk '/Interface/{print $2}')
fi

TMP="/tmp/station_dump_lines.$$"
trap 'rm -f "$TMP"' EXIT INT TERM
: >"$TMP"

for iface in $IFACES; do
	iw dev "$iface" station dump 2>/dev/null | awk -v IFACE="$iface" '
		/^Station / { mac = toupper($2) }
		/^[[:space:]]*signal:/ && !/signal avg/ {
			if (mac != "" && match($0, /-?[0-9]+/)) {
				sig = substr($0, RSTART, RLENGTH)
				print mac " " sig " " IFACE
				mac = ""
			}
		}
	' >>"$TMP"
done

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
STATIONS="["
FIRST=true

while read -r mac sig iface_name; do
	[ -z "$mac" ] && continue
	ip=$(grep -i "$mac" /proc/net/arp 2>/dev/null | awk '{print $1}' | head -1)
	hostname=$(grep -i "$mac" /var/dhcp.leases 2>/dev/null | awk '{print $4}' | head -1)
	[ -z "$ip" ] && ip_json="null" || ip_json="\"$ip\""
	if [ -z "$hostname" ] || [ "$hostname" = "*" ]; then
		host_json="null"
	else
		escaped=$(echo "$hostname" | sed 's/"/\\"/g')
		host_json="\"$escaped\""
	fi
	if [ "$FIRST" = true ]; then
		FIRST=false
	else
		STATIONS="$STATIONS,"
	fi
	STATIONS="$STATIONS{\"macAddress\":\"$mac\",\"ipAddress\":$ip_json,\"hostname\":$host_json,\"signalStrengthDbm\":$sig,\"interface\":\"$iface_name\"}"
done <"$TMP"

STATIONS="$STATIONS]"
JSON="{\"ioTNodeId\":\"$IOT_NODE_ID\",\"stations\":$STATIONS,\"timestamp\":\"$TIMESTAMP\"}"

curl -sS -X POST "$API_URL" \
	-H "Content-Type: application/json" \
	-H "X-Api-Key: $API_KEY" \
	-d "$JSON" \
	--connect-timeout 3 --max-time 15 \
	-o /dev/null -w "" || logger -t station_dump "curl failed"
