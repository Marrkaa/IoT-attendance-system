#!/usr/bin/env python3
"""
Pataiso /etc/raddb/sites-enabled/default:
  - authorize: po „pap“ prideda Auth-Type := PAP, jei yra User-Password (be to REST
    niekada neiškviečiamas – „pap“ modulis neranda vietinio Cleartext-Password).
  - authenticate: Auth-Type PAP { pap } -> rest_iot_api
  - accounting: po pirmosios „accounting {“ eilutės prideda rest_iot_api (jei dar nėra)
Pakartotinis paleidimas saugus (idempotent).
"""
import re
import sys
from pathlib import Path


def _find_matching_brace(s: str, open_pos: int) -> int:
    """open_pos – '{' pozicija; grąžina atitinkančios '}' indeksą."""
    if open_pos >= len(s) or s[open_pos] != "{":
        return -1
    depth = 0
    i = open_pos
    while i < len(s):
        c = s[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _insert_authorize_auth_type_pap(text: str, marker: str, block: str) -> tuple[str, bool]:
    """
    Įterpia bloką į server default → authorize kūną po paskutinės „pap“ / „[pap]“ eilutės.
    Veikia ir kai authenticate sekcija eina prieš authorize (Arch).
    """
    if marker in text:
        return text, False

    sd = re.search(r"server\s+default\s*\{", text)
    if not sd:
        return text, False

    chunk = text[sd.start() : sd.start() + 200000]
    auz = re.search(r"\bauthorize\s*\{", chunk)
    if not auz:
        return text, False

    open_brace = auz.end() - 1
    close_brace = _find_matching_brace(chunk, open_brace)
    if close_brace < 0:
        return text, False

    body = chunk[auz.end() : close_brace]
    last_pap = None
    for m in re.finditer(r"^[\t ]*(\[pap\]|pap)[\t ]*$", body, re.MULTILINE):
        last_pap = m
    if not last_pap:
        return text, False

    insert = sd.start() + auz.end() + last_pap.end()
    return text[:insert] + block + text[insert:], True


def main() -> int:
    if len(sys.argv) != 2:
        print("Naudojimas: patch-site-default.py /etc/raddb/sites-enabled/default", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")
    text = text.replace("\r\n", "\n")
    orig = text

    MARKER = "# IoT-Attendance: force Auth-Type PAP for REST (no local user in files)"

    # 0) authorize: po paskutinės „pap“ / „[pap]“ (server default → authorize { … }).
    block = (
        f"\t{MARKER}\n"
        "\tif (&User-Password) {\n"
        "\t\tupdate control {\n"
        "\t\t\t&Auth-Type := PAP\n"
        "\t\t}\n"
        "\t}\n"
    )
    if MARKER in text:
        print("authorize: Auth-Type PAP blokas jau yra (praleidžiama).")
    else:
        text, ok = _insert_authorize_auth_type_pap(text, MARKER, block)
        if not ok:
            print(
                "Klaida: nerasta „server default“ → „authorize { … }“ su „pap“ / „[pap]“. "
                "Ranka į authorize po „pap“ / „[pap]“ įdėk:\n"
                "  if (&User-Password) { update control { &Auth-Type := PAP } }",
                file=sys.stderr,
            )
            return 1

    # 1) PAP -> rest_iot_api (Arch: „pap“ arba „[pap]“)
    if re.search(r"Auth-Type PAP\s*\{\s*\n\s*\[pap\]\s*\n", text) or re.search(
        r"Auth-Type PAP\s*\{\s*\n\s*pap\s*\n", text
    ):

        def repl_pap(m: re.Match[str]) -> str:
            indent = m.group(2)
            return m.group(1) + "\n" + indent + "rest_iot_api\n"

        text, n = re.subn(
            r"(Auth-Type PAP\s*\{)\s*\n(\s*)(\[pap\]|pap)\s*\n",
            repl_pap,
            text,
            count=1,
        )
        if n != 1:
            print("Klaida: nepavyko pakeisti pap/[pap] -> rest_iot_api.", file=sys.stderr)
            return 1
    else:
        if "rest_iot_api" in text and "Auth-Type PAP" in text:
            print("Auth-Type PAP: jau naudojamas rest_iot_api (praleidžiama).")
        else:
            print(
                "Klaida: nerasta „Auth-Type PAP { … pap / [pap] … }“. Redaguok ranka.",
                file=sys.stderr,
            )
            return 1

    # 2) Accounting: pirma „accounting {“
    if re.search(r"^\s*accounting\s*\{\s*\n\s*rest_iot_api\s*\n", text, re.MULTILINE):
        print("Accounting: rest_iot_api jau yra (praleidžiama).")
    elif re.search(r"^\s*accounting\s*\{\s*\n", text, re.MULTILINE):
        text, n2 = re.subn(
            r"(^\s*accounting\s*\{\s*\n)",
            r"\1\trest_iot_api\n",
            text,
            count=1,
            flags=re.MULTILINE,
        )
        if n2 != 1:
            print("Klaida: nepavyko įterpti rest_iot_api į accounting.", file=sys.stderr)
            return 1
    else:
        print("Įspėjimas: nerasta „accounting {“ – pridėk rest_iot_api ranka.", file=sys.stderr)
        return 1

    if text == orig:
        print("Failas jau atitiko norimą būseną.")
        return 0

    path.write_text(text, encoding="utf-8")
    print(f"Atnaujinta: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
