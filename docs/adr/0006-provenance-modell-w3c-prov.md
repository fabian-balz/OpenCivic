<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0006 — Provenance-Modell auf Basis von W3C PROV

- **Status:** Accepted
- **Datum:** 2026-07-08
- **Bezug:** Qualitätsattribut QA1 (Nachvollziehbarkeit); Leitprinzip 2 (Quellenzwang), 8 (offene
  Standards); Entscheidungsprinzip P2 (offene Standards zuerst), P6 (Standardschnittstellen)

## Kontext und Problemstellung

OpenCivic braucht ein Modell, um Herkunft, Ableitung und Verantwortlichkeit jeder Aussage
maschinenlesbar festzuhalten (*Quelle → Version → Aussage*, [ADR-0004](0004-kanonischer-datenfluss-medallion-provenance.md)).
Ein Eigenmodell wäre schnell entworfen, aber eine Insellösung. Provenance ist ein seit Langem
bearbeitetes Standardproblem — es existiert mit **W3C PROV** ein etablierter, offener Standard.

## Betrachtete Optionen

- **Option A — Eigenes, proprietäres Provenance-Schema.**
- **Option B — Volles W3C PROV (PROV-O) mit RDF/Triple-Store.**
- **Option C — Pragmatischer PROV-Subset:** die Kernkonzepte *Entity/Activity/Agent* und die
  Relationen `wasGeneratedBy`, `wasDerivedFrom`, `wasAttributedTo`, `used`, `wasRevisionOf` werden
  in relationale/dokumentbasierte Strukturen übernommen; Export als PROV-JSON/JSON-LD bei Bedarf.

## Entscheidung

**Option C.**

OpenCivic-Entitäten (`Source`, `SourceVersion`, `DatasetVersion`, `Statement`, `Agent`, `Activity`)
mappen auf PROV-Konzepte (siehe [02-provenance-model.md](../architecture/02-provenance-model.md#3-abbildung-auf-w3c-prov)).
Die Speicherung selbst ist **technologiefrei** (kein RDF-Zwang) — das Mapping ist eine
*Interpretationsschicht*, kein Speicherformat. Für Interoperabilität (Export, Audits, externe
Tools) kann die Provenance-Kette als **PROV-JSON/JSON-LD** exportiert werden.

Begründung: Ein offener, weit verbreiteter Standard verhindert eine Insellösung (P2), ist von
Dritten (Auditoren, Forschung, andere Transparenz-Tools) interpretierbar, und die Kernkonzepte
sind schlank genug, um ohne RDF-Overhead in gewöhnlichen Datenbanken abgebildet zu werden — passt
zu „boring & bewährt" und zur Self-Hosting-Anforderung.

## Konsequenzen

- **Positiv:** Anschlussfähigkeit an ein etabliertes Vokabular; Exportierbarkeit; klare,
  dokumentierte Semantik für „erzeugt von", „abgeleitet von", „attributiert an", „revidiert".
- **Negativ / Kosten:** Entwickler:innen müssen PROV-Grundbegriffe lernen (mitigiert durch die
  Mapping-Tabelle im Architekturdokument); nicht jede PROV-Feinheit (z. B. Bündel/Pläne) wird
  übernommen — bewusst nur der pragmatische Kern.
- **Reversibilität:** Da PROV nur als Interpretations-/Exportschicht dient, ist ein späterer
  Wechsel der physischen Speicherung unabhängig davon möglich (P8).

## Vor- und Nachteile der Optionen

### Option A — Eigenes Schema

- 👍 Volle Kontrolle, keine Lernkurve für ein externes Vokabular.
- 👎 Keine Interoperabilität, keine Anschlussfähigkeit an bestehende Tools/Auditverfahren;
  widerspricht P2 („offene Standards zuerst").

### Option B — Volles PROV/RDF/Triple-Store

- 👍 Maximale Ausdruckskraft und Standardtreue.
- 👎 Hoher Betriebs- und Lernaufwand für Self-Hoster (Triple-Store als zusätzliche Infrastruktur);
  Overkill für die benötigten Kernrelationen; widerspricht „einfacher Standardpfad" (R9).

### Option C — Pragmatischer PROV-Subset *(gewählt)*

- 👍 Standardtreue ohne Infrastruktur-Overhead; exportierbar bei Bedarf; passt zu jeder
  relationalen/dokumentbasierten Speicherung.
- 👎 Kein vollständiges PROV — Erweiterung um weitere PROV-Konzepte muss bei Bedarf bewusst
  nachgezogen werden.
