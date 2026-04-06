#!/usr/bin/env bash
# Paleisk iš projekto šaknies: sudo ./infra/freeradius/apply-to-host.sh
# Reikia: Docker API ant 127.0.0.1:5000 (arba redaguok rest_iot_api prieš kopijuodamas).
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Paleisk su sudo: sudo $0" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RADDB="${RADDB:-/etc/raddb}"
SITE="${RADDB}/sites-enabled/default"

install -d -m 755 "${RADDB}/clients.d"
install -m 644 "${ROOT}/infra/freeradius/clients.d/99-teltonika.conf" "${RADDB}/clients.d/99-teltonika.conf"
install -m 644 "${ROOT}/infra/freeradius/mods-available/rest_iot_api" "${RADDB}/mods-available/rest_iot_api"
ln -sf ../mods-available/rest_iot_api "${RADDB}/mods-enabled/rest_iot_api"

if [[ ! -f "${SITE}" ]]; then
  echo "Nerasta ${SITE}" >&2
  exit 1
fi

# Ne į sites-enabled/ – radiusd įkelia VISUS failus iš ten (įskaitant .bak).
cp -a "${SITE}" "${RADDB}/default.site.bak.$(date +%Y%m%d%H%M%S)"
python3 "${ROOT}/infra/freeradius/patch-site-default.py" "${SITE}"

# EAP modulis reikalauja /etc/raddb/certs/server.pem (ne susiję su IoT REST).
bash "${ROOT}/infra/freeradius/eap-certs.sh"

echo "Tikrinu sintaksę..."
if ! radiusd -CX; then
  echo "radiusd -CX nepavyko. Jei EAP: paleisk ranka sudo ${ROOT}/infra/freeradius/eap-certs.sh" >&2
  echo "Atsarginė site kopija: ${RADDB}/default.site.bak.*" >&2
  exit 1
fi

echo "Paleidžiama FreeRADIUS tarnyba..."
# Arch: freeradius.service; kitur kartais radiusd.service
if [[ -f /usr/lib/systemd/system/freeradius.service ]]; then
  systemctl enable --now freeradius.service
  systemctl --no-pager --full status freeradius.service || true
elif [[ -f /usr/lib/systemd/system/radiusd.service ]]; then
  systemctl enable --now radiusd.service
  systemctl --no-pager --full status radiusd.service || true
else
  echo "Nepavyko rasti systemd unit. Paleisk ranka: sudo radiusd -d /etc/raddb" >&2
fi
echo ""
echo "Patikra (secret iš: grep -A8 'client localhost' /etc/raddb/clients.conf):"
echo "  radtest student1@school.edu password 127.0.0.1 0 <SECRET>"
echo "Turi būti Access-Accept, jei API 127.0.0.1:5000 ir DB turi student1."
