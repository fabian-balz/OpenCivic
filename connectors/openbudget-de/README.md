<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Connector: `openbudget-de`

OpenData-Connector für den Bundeshaushalt (im MVP: committetes Beispiel-Sample). Erzeugt einen
**Bronze-Snapshot** — unveränderliche Rohbytes + Metadaten + sha-256-Hash — und gibt ihn als JSON
auf stdout aus. Er transformiert nicht; Normalisierung/Modellierung übernimmt die Node-Orchestrierung
(`@opencivic/provenance`). Damit liegt die Sprachgrenze exakt auf der Architektur-Naht
(ADR-0003/0009/0016).

Der Connector nutzt **nur die Python-Standardbibliothek** → reproduzierbar und ohne Installation
lauffähig.

## Nutzung

```bash
python3 -m openbudget_de --source ../../data/samples/bundeshaushalt-2025-excerpt.csv
# optional für deterministische Tests:
python3 -m openbudget_de --source <csv> --retrieved-at 2026-02-01T09:00:00+00:00
```

## Bronze-Envelope (JSON-Contract)

```jsonc
{
  "connector": "openbudget-de",
  "connector_version": "0.1.0",
  "source": { "urn": "...", "name": "...", "publisher": { "..." }, "jurisdiction": "DE", "license": "..." },
  "retrieved_at": "2026-02-01T09:00:00+00:00",
  "upstream_version_label": "Haushaltsjahr 2025 (Sample)",
  "media_type": "text/csv",
  "byte_size": 1234,
  "content_hash": "sha256:…",
  "content_base64": "…"   // verlustfreie Rohbytes
}
```

## Tests

```bash
poetry install && poetry run pytest        # oder: pytest -q
```
