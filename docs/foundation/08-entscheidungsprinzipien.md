<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 8. Technische Entscheidungsprinzipien

Diese Prinzipien steuern **jede** Technologiewahl in der Architekturphase. Sie sind der Maßstab,
an dem Optionen begründet werden — jede wichtige Entscheidung wird als [ADR](../adr/) mit
Alternativen und Vor-/Nachteilen festgehalten.

1. **Boring & bewährt vor neu & spannend.** Bevorzugt werden Technologien mit langem Track Record,
   breiter Community, mehreren unabhängigen Maintainern/Anbietern und klarem Support-Horizont.
2. **Offene Standards > offene Implementierung > proprietär.** In dieser Reihenfolge.
3. **Keine harten Cloud-Anbieter-Abhängigkeiten.** Managed Services nur, wenn ein portabler
   Open-Source-Unterbau existiert — Austauschbarkeit ist Pflicht.
4. **Lizenzkompatible Abhängigkeiten.** Keine Bausteine, die Self-Hosting oder das
   Split-Lizenzmodell gefährden.
5. **Wenige Sprachen, klar begründet.** Sprachwildwuchs ist ein Wartungsrisiko; jede zusätzliche
   Sprache muss sich rechtfertigen.
6. **Standardschnittstellen statt Eigenbau.** OpenAPI/JSON Schema, OpenTelemetry, OCI, SQL,
   OAuth2/OIDC, ISO/W3C-Formate — bevorzugt.
7. **Daten sind langlebiger als Code.** Datenmodelle, Schemata und Formate werden mit besonderer
   Sorgfalt und Rückwärtskompatibilität entworfen; Migrationen sind versioniert.
8. **Reversibilität.** Entscheidungen so treffen, dass ein späterer Ausstieg möglich bleibt.
9. **Sichere Voreinstellungen (secure & private by default).**
10. **Automatisierung vor Konvention vor Dokumentation** — aber alle drei vorhanden.
11. **Total Cost of Ownership über 10 Jahre** schlägt Anschaffungs- oder
    Entwicklungsgeschwindigkeit.

## ADR-Prozess

Architekturentscheidungen werden im [MADR](https://adr.github.io/madr/)-Format unter
[`docs/adr/`](../adr/) dokumentiert: Kontext, betrachtete Optionen, Entscheidung, Konsequenzen.
Jede Entscheidung nennt mindestens eine ernsthafte Alternative mit ihren Vor- und Nachteilen.
