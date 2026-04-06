#!/usr/bin/env bash
# Sugeneruoja /etc/raddb/certs/server.pem ir susijusius failus, kad užsikrautų mods-enabled/eap.
# Paleisk su sudo (iškviečiama iš apply-to-host.sh).
set -euo pipefail

CERT_DIR="${1:-/etc/raddb/certs}"

if [[ -f "$CERT_DIR/server.pem" ]] && [[ -f "$CERT_DIR/ca.pem" ]]; then
  echo "EAP sertifikatai jau yra: $CERT_DIR"
  exit 0
fi

mkdir -p "$CERT_DIR"

# Arch: šablonai būna /etc/raddb.default/certs/
DEFAULT_CERTS="/etc/raddb.default/certs"
if [[ -d "$DEFAULT_CERTS" ]]; then
  shopt -s dotglob nullglob
  for f in "$DEFAULT_CERTS"/*; do
    base="$(basename "$f")"
    [[ "$base" == "README.md" ]] && continue
    [[ -e "$CERT_DIR/$base" ]] || cp -a "$f" "$CERT_DIR/"
  done
  shopt -u dotglob nullglob
fi

if [[ ! -f "$CERT_DIR/Makefile" ]] || [[ ! -x "$CERT_DIR/bootstrap" ]]; then
  echo "Klaida: nerasta $DEFAULT_CERTS (Makefile / bootstrap). Įsitikink, kad įdiegtas freeradius." >&2
  exit 1
fi

chmod +x "$CERT_DIR/bootstrap" 2>/dev/null || true
echo "Generuojami EAP sertifikatai ($CERT_DIR)..."
(cd "$CERT_DIR" && { make || ./bootstrap; })

if [[ ! -f "$CERT_DIR/server.pem" ]]; then
  echo "Klaida: po „make“ vis dar nėra server.pem" >&2
  exit 1
fi

echo "EAP sertifikatai paruošti."
