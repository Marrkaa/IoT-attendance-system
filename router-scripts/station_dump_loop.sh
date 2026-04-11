#!/bin/sh
INTERVAL="${STATION_DUMP_INTERVAL:-5}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DUMP_SCRIPT="${STATION_DUMP_SCRIPT:-$SCRIPT_DIR/station_dump.sh}"

while true; do
	if [ -f "$DUMP_SCRIPT" ]; then
		sh "$DUMP_SCRIPT" || logger -t station_dump_loop "station_dump.sh failed ($?)"
	else
		logger -t station_dump_loop "Nerastas: $DUMP_SCRIPT"
		sleep 60
		continue
	fi
	sleep "$INTERVAL"
done
