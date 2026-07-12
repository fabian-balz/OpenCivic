# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: Apache-2.0
"""Bronze-Snapshot-Erzeugung für den OpenBudget-DE-Connector.

Der Connector *holt* die Rohdaten (hier: liest die committete Sample-CSV) und gibt einen
Bronze-Envelope als JSON auf stdout aus. Er transformiert **nicht** — Normalisierung (Silver)
und Modellierung (Gold) übernimmt die Node-Orchestrierung. So bleibt die Sprachgrenze exakt auf
der Architektur-Naht (ADR-0003/0009/0016).
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import __version__

# Stabile Metadaten der (Beispiel-)Quelle. Bei Umstellung auf die echte Quelle ändern sich nur
# diese Felder + die Bezugsart der Rohbytes — das Provenance-Modell bleibt gleich.
SOURCE = {
    "urn": "urn:oc:source:de-bund-haushalt-sample",
    "name": "Bundeshaushalt (Beispiel-Sample)",
    "type": "sample-file",
    "canonical_uri": "https://github.com/balzdance/OpenCivic/blob/main/data/samples/bundeshaushalt-2025-excerpt.csv",
    "license": "Apache-2.0",
    "jurisdiction": "DE",
    "publisher": {
        "kind": "organization",
        "name": "OpenCivic Sample (synthetisch — keine amtliche Quelle)",
        "identifier": "urn:oc:agent:sample-publisher",
    },
}


def build_bronze(source_path: Path, retrieved_at: str | None = None) -> dict:
    """Liest die Rohdatei und baut den Bronze-Envelope (Rohbytes + Hash + Metadaten)."""
    raw = source_path.read_bytes()
    content_hash = "sha256:" + hashlib.sha256(raw).hexdigest()
    ts = retrieved_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return {
        "connector": "openbudget-de",
        "connector_version": __version__,
        "source": SOURCE,
        "retrieved_at": ts,
        "upstream_version_label": "Haushaltsjahr 2025 (Sample)",
        "media_type": "text/csv",
        "byte_size": len(raw),
        "content_hash": content_hash,
        "content_base64": base64.b64encode(raw).decode("ascii"),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="openbudget-de", description="OpenBudget-DE Bronze-Connector")
    parser.add_argument("--source", required=True, help="Pfad zur Quell-CSV")
    parser.add_argument(
        "--retrieved-at",
        default=None,
        help="ISO-8601-Zeitstempel des Abrufs (für deterministische Tests); Default: jetzt (UTC)",
    )
    args = parser.parse_args(argv)

    source_path = Path(args.source)
    if not source_path.is_file():
        print(f"FEHLER: Quelldatei nicht gefunden: {source_path}", file=sys.stderr)
        return 1

    bronze = build_bronze(source_path, args.retrieved_at)
    json.dump(bronze, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
