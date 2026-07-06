<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Lizenzierung von OpenCivic

OpenCivic verwendet ein **Split-Lizenzmodell**. Die Begründung steht in
[ADR-0001](docs/adr/0001-lizenzmodell-split.md).

## Die Regel

| Komponententyp | Lizenz | Warum |
|---|---|---|
| **Anwendungen & Server** (deploybare Fachmodule, Plattformkern) | `AGPL-3.0-or-later` | Netzwerk-Copyleft schützt das Gemeingut vor proprietärer SaaS-Übernahme. |
| **Bibliotheken, SDKs, API-Clients** | `Apache-2.0` | Permissiv + Patentlizenz → maximale Integration & Interoperabilität. |
| **Datenmodelle & Schemata** (JSON Schema, OpenAPI, Protobuf …) | `Apache-2.0` | Sollen von jedem — auch proprietär — genutzt werden können. |
| **Dokumentation** (dieses Verzeichnis, `docs/`) | `Apache-2.0` (Code-Snippets) bzw. `CC-BY-4.0` (Fließtext, sobald eingeführt) | Weite Nachnutzung erwünscht. |
| **Öffentliche Daten / importierte Datensätze** | Lizenz der jeweiligen Quelle, als Metadatum pro Datensatz geführt | Rechte Dritter, siehe Risiko R4. |

> Faustregel: **Läuft es als Dienst? → AGPL.** **Wird es von anderen eingebettet? → Apache-2.0.**
> Im Zweifel wird die Zuordnung pro Paket in dessen `README`/Paketmetadaten dokumentiert und
> ggf. per ADR geklärt.

## Umsetzung: REUSE-Konformität

OpenCivic strebt [REUSE](https://reuse.software/)-Konformität an:

- **Jede** Datei trägt einen SPDX-Header, z. B.
  `SPDX-License-Identifier: AGPL-3.0-or-later` oder `SPDX-License-Identifier: Apache-2.0`,
  sowie `SPDX-FileCopyrightText`.
- Die **Volltexte** aller verwendeten Lizenzen liegen unter [`LICENSES/`](LICENSES/) mit den
  offiziellen SPDX-Dateinamen (`LICENSES/AGPL-3.0-or-later.txt`, `LICENSES/Apache-2.0.txt`).
- Ein CI-Check (`reuse lint`) erzwingt die Konformität, sobald die Toolchain in Phase 1 steht.

## Beitragende (Contributor)

Mit einem Beitrag stimmst du zu, deinen Beitrag unter der Lizenz der jeweiligen Komponente
beizusteuern (AGPL-3.0-or-later bzw. Apache-2.0). Ein formales Contributor-Modell (DCO/`Signed-off-by`
bevorzugt gegenüber CLA, um die Hürde niedrig und die Governance neutral zu halten) wird in
Phase 0/1 finalisiert und in `CONTRIBUTING.md` beschrieben.
