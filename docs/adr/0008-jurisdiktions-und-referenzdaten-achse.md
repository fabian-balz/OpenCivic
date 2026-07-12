<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0008 — Jurisdiktions- und Referenzdaten-Achse

- **Status:** Accepted
- **Datum:** 2026-07-08
- **Bezug:** Qualitätsattribut QA10 (Internationalisierbarkeit); strategische Entscheidung
  „DACH-first, i18n-ready" ([Fundament](../foundation/README.md#getroffene-strategische-entscheidungen));
  Entscheidungsprinzip P2 (offene Standards), P6 (Standardschnittstellen)

## Kontext und Problemstellung

OpenCivic startet DACH-first, soll aber ohne Schema-Bruch auf weitere Länder erweiterbar sein.
Jede `Source` und jedes `Statement` braucht eine **abfragbare, vergleichbare** Jurisdiktions-
Zuordnung — nicht nur zur Anzeige, sondern um Aussagen zu filtern, zu aggregieren und rechtlich
korrekt einzuordnen (z. B. „Bundeshaushalt" vs. „Landeshaushalt Bayern" vs. „Kommune München").
Ebenso brauchen Zeit, Währung/Einheit und Lizenz **eindeutige, standardisierte** Repräsentationen,
damit Daten über Quellen und später über Länder hinweg konsistent bleiben.

## Betrachtete Optionen

- **Option A — Freitext-Jurisdiktion** (z. B. ein String-Feld „Bayern").
- **Option B — Hart codiertes deutsches Verwaltungsschema** (fest auf Bundesland/Landkreis/
  Gemeinde nach deutscher Struktur, ohne Auslandsoption).
- **Option C — Codierte, hierarchische, pluggable Jurisdiktions-Dimension** auf Basis von
  ISO 3166 (Länder/Subdivisionen) + nationalen Schlüsseln als austauschbare Code-Listen (für DE:
  Amtlicher Gemeindeschlüssel/Regionalschlüssel), plus durchgängige Nutzung offener
  Referenzstandards (ISO 8601, ISO 4217, SPDX, DCAT).

## Entscheidung

**Option C.**

- **Jurisdiction** ist eine eigene, hierarchische Entität (`country → state → district →
  municipality`), codiert (ISO 3166-1/-2 als Wurzel, nationale amtliche Schlüssel als Blätter),
  **pluggable**: neue Länder werden als neue Code-Listen ergänzt, ohne das Kernschema zu ändern.
- **Zeit:** ISO 8601 durchgängig (`valid_time`, `system_time`, Timestamps).
- **Währung/Einheit:** ISO 4217 für monetäre Werte in `Statement.unit`.
- **Lizenz:** SPDX-Identifier für `Source.default_license` und Lizenz-Overrides je `SourceVersion`.
- **Katalog-Metadaten:** Anlehnung an DCAT für die Beschreibung von `Source`/`Dataset`.
- **Labels/Übersetzungen** (menschenlesbare Namen von Jurisdiktionen, Aspekten etc.) werden
  **getrennt** von den Fakten im Localization-Kernbaustein gehalten ([ADR-0003](0003-plattformkern-und-modulschnitt.md)) —
  Daten sind sprachneutral, Darstellung ist es nicht.

Begründung: Codierte, standardbasierte Dimensionen sind maschinell vergleich- und aggregierbar
(nötig für Suche/Filter/Aggregation über QA1-belegte Statements) und halten die DACH-first-
Entscheidung um, ohne künftige Länder architektonisch auszuschließen (QA10).

## Konsequenzen

- **Positiv:** Vergleichbare, filterbare, aggregierbare Jurisdiktionsangaben; Erweiterung auf
  AT/CH/weitere Länder ist eine Datenerweiterung, keine Schemamigration; durchgängige
  Standardnutzung reduziert Zweideutigkeit (z. B. Datum-/Währungsformate).
- **Negativ / Kosten:** Die initiale Pflege der Code-Liste für Deutschland (Gemeindeschlüssel-
  Referenzdaten) ist ein eigener, kleiner Ingest-Aufwand (selbst eine `Source` im Sinne des
  Provenance-Modells — „amtliche Referenzdaten sind auch amtliche Daten").
- **Abgrenzung:** Übersetzung/Lokalisierung der Anzeige ist **nicht** Teil dieses ADRs (gehört zum
  Localization-Kernbaustein/i18n-Topic) — hier wird nur die Datenachse festgelegt.

## Vor- und Nachteile der Optionen

### Option A — Freitext-Jurisdiktion

- 👍 Trivial zu implementieren.
- 👎 Nicht zuverlässig filter-/aggregierbar (Tippfehler, Synonyme); keine Hierarchie; verletzt
  QA1 (schwer nachvollziehbare/vergleichbare Zuordnung).

### Option B — Hart codiertes deutsches Schema

- 👍 Einfach und exakt für den DACH-first-Startzustand.
- 👎 Verletzt „i18n-ready ab Tag 1"; spätere Internationalisierung erzwingt eine Schemamigration
  mit Breaking Changes für alle Module — widerspricht P7 (Daten sind langlebiger als Code).

### Option C — Codierte, hierarchische, pluggable Jurisdiktion *(gewählt)*

- 👍 Erfüllt DACH-first *und* i18n-ready gleichzeitig; nutzt offene Standards; keine
  Schemamigration bei Länder-Erweiterung.
- 👎 Etwas höherer initialer Modellierungs- und Referenzdaten-Aufwand als Option A/B.
