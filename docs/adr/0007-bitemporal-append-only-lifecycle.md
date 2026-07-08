<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0007 — Bitemporalität, Append-Only-Historie und Statement-Lifecycle

- **Status:** Accepted
- **Datum:** 2026-07-08
- **Bezug:** Qualitätsattribut QA1 (Nachvollziehbarkeit); Leitprinzipien 1 (Faktentreue/Neutralität),
  4 (Reproduzierbarkeit); Risiken R3 (Link-Rot/Quellenänderung), R11 (Integrität)

## Kontext und Problemstellung

Amtliche Fakten ändern sich (Nachtragshaushalte, Gesetzesnovellen, Korrekturen). OpenCivic muss
gleichzeitig zeigen können, **was real zu einem Zeitpunkt galt** (z. B. Haushaltsjahr 2025) und
**was die Plattform zu einem Zeitpunkt angezeigt hat** (Auditierbarkeit, Nachweis gegenüber R3).
Korrekturen dürfen nicht spurlos verschwinden — das würde die geforderte Neutralität und
Nachvollziehbarkeit (QA1, Leitprinzip 1) untergraben und wäre bei Vorwürfen der „Manipulation"
nicht widerlegbar.

## Betrachtete Optionen

- **Option A — Mutable Records + separater Audit-Log:** Statements werden direkt überschrieben;
  ein Nebenlog protokolliert Änderungen.
- **Option B — Volles Event-Sourcing:** der gesamte Zustand wird ausschließlich aus einem
  Event-Strom rekonstruiert.
- **Option C — Bitemporale, append-only Statements mit explizitem Lifecycle:** zwei Zeitachsen
  (`valid_time`, `system_time`), Statements werden nie verändert/gelöscht, sondern per
  `wasRevisionOf` fortgeschrieben; Zustände `active → superseded/retracted`.

## Entscheidung

**Option C.**

- **`valid_time`** (Realwelt-Gültigkeit, z. B. Haushaltsjahr) getrennt von **`system_time`**
  (Erfassungszeitpunkt bei OpenCivic) — bitemporales Modell.
- **Append-only:** Statements und SourceVersions werden nie in-place verändert. Eine Korrektur
  erzeugt eine neue SourceVersion/ein neues Statement, verknüpft über `wasRevisionOf`.
- **Lifecycle** je Statement: `active → superseded` (durch neuere Version ersetzt) oder
  `active → retracted` (zurückgezogen). Beide Übergänge sind selbst Provenance-Ereignisse mit
  Zeitpunkt, verantwortlichem `Agent` und **Begründung** — nie ein stiller Hard-Delete.

Begründung: So sind beide Fragen beantwortbar — „was galt real" und „was zeigten wir wann" — und
jede Korrektur ist selbst dokumentiert statt zu verschwinden. Das macht Korrekturen zu einem
*Vertrauensbeweis* statt zu einem Risiko (Leitprinzip 1) und liefert den Audit-Trail gegen R3/R11.

## Konsequenzen

- **Positiv:** Volle Historie abfragbar; Korrekturen sind nachvollziehbar statt verdächtig;
  Reproduzierbarkeit „Zustand zu Zeitpunkt X" ohne Zusatzsystem.
- **Negativ / Kosten:** Datenvolumen wächst monoton (nichts wird je gelöscht) → Gegenmaßnahme:
  Retention-/Archivierungs-Policies für sehr alte, mehrfach überholte Historie können später
  eingeführt werden, ohne das Modell zu brechen (nur Verschiebung in Kaltspeicher, keine Löschung
  der Kette an sich); Abfragen müssen bitemporal filtern (Mehraufwand in Anwendungslogik/DB-Layer,
  wird im DB-Topic konkretisiert).
- **Rechtlich:** Ein expliziter, öffentlich nachvollziehbarer Retraction-Prozess (Grund + Agent)
  unterstützt auch den Melde-/Korrekturprozess aus Risiko R5.

## Vor- und Nachteile der Optionen

### Option A — Mutable Records + separater Audit-Log

- 👍 Einfachstes Datenmodell für aktuelle Abfragen.
- 👎 Zwei Wahrheitsquellen (Live-Daten vs. Log) können divergieren; „was zeigten wir am Tag D"
  ist nur rekonstruierbar, wenn der Log lückenlos und korrekt referenziert ist — höheres Risiko
  bei Bugs; schwächerer Beweis bei Streitfällen.

### Option B — Volles Event-Sourcing

- 👍 Maximale Nachvollziehbarkeit, jede Änderung ist ein Event.
- 👎 Hoher konzeptioneller und betrieblicher Overhead (Projektionen, Replay-Infrastruktur);
  Overkill für das Solo-Deployment-Profil (R9); Lernkurve für Contributor.

### Option C — Bitemporale, append-only Statements mit Lifecycle *(gewählt)*

- 👍 Beantwortet beide Zeitfragen direkt im Kernmodell; keine Zusatzinfrastruktur nötig;
  Korrekturen sind Erstklasse-Bürger, nicht Nebeneffekt.
- 👎 Erfordert Disziplin beim Schreiben (nie in-place update) — wird über das Kern-SDK erzwungen,
  nicht dem einzelnen Modul überlassen.
