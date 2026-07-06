<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 6. Qualitätsattribute (priorisiert)

Die Reihenfolge ist bewusst gewählt — sie steuert Architektur-Trade-offs. Bei Zielkonflikten
gewinnt das höher priorisierte Attribut.

1. **Glaubwürdigkeit / Nachvollziehbarkeit (Provenance & Auditability)** — höchste Priorität.
   Ohne Vertrauen ist die Plattform wertlos.
2. **Barrierefreiheit & Zugänglichkeit** — WCAG 2.2 AA, Mobile-First, i18n, einfache Sprache.
3. **Wartbarkeit & Evolvierbarkeit** — die Plattform muss in 10+ Jahren erweiterbar bleiben.
4. **Sicherheit & Datenschutz** — Stand der Technik, DSGVO, Datensparsamkeit.
5. **Portabilität / Cloud-Neutralität / Self-Hostbarkeit.**
6. **Testbarkeit.**
7. **Interoperabilität** — offene Standards, API-first.
8. **Performance & Skalierbarkeit** — wichtig, aber nachrangig gegenüber Korrektheit &
   Zugänglichkeit.
9. **Beobachtbarkeit (Observability).**
10. **Internationalisierbarkeit.**

## Leitregel bei Konflikten

> **Korrektheit & Nachvollziehbarkeit schlagen Geschwindigkeit.**
> **Zugänglichkeit schlägt Feature-Umfang.**
> **Wartbarkeit schlägt Eleganz.**

Diese Prioritäten werden in der Architekturphase konkretisiert (Service Level Objectives,
a11y-Testgates, Provenance-Pflichtfelder) und in ADRs referenziert.
