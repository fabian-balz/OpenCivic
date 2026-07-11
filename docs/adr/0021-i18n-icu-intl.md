<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0021 — Internationalisierung (ICU MessageFormat + Web-Intl)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Qualitätsattribute QA10 (Internationalisierbarkeit), QA2 (Zugänglichkeit),
  QA7 (Interoperabilität); Leitprinzipien P6 (Standardschnittstellen statt Eigenbau),
  P2 (offene Standards), P3 (keine Anbieter-Abhängigkeit); Localization-Kernkomponente
  [ADR-0003](0003-plattformkern-und-modulschnitt.md); Referenzdaten-Achse
  [ADR-0008](0008-jurisdiktions-und-referenzdaten-achse.md); Provenance-Modell
  [ADR-0006](0006-provenance-modell-w3c-prov.md); Architektur-Doc
  [10-i18n-a11y-performance](../architecture/10-i18n-a11y-performance.md)

## Kontext und Problemstellung

OpenCivic ist DACH-first, aber laut QA10 muss **jede weitere Locale ohne Schema- oder Codeänderung**
ergänzbar sein. Zugleich stellt die Plattform belegte, oft numerische und datumsbehaftete Fakten dar
(Haushaltsbeträge in EUR/CHF, Gültigkeitszeiträume, Titel-/Positionszahlen). Die Darstellung dieser
Fakten muss den Konventionen der jeweiligen Sprache und Jurisdiktion folgen — Tausendertrennzeichen,
Datumsreihenfolge, Währungssymbol, **und korrekte Pluralregeln** —, ohne dass dabei der Fakt selbst
verändert wird.

Der Kern der Aufgabe ist also zweigeteilt: (1) **Übersetzen** von UI-Prosa und (2) **Formatieren**
von Werten nach Locale-Regeln. Naive Ansätze vermischen beides in flachen Zeichenketten und brechen
an Sprachen mit mehr als zwei Pluralformen oder mit genusabhängiger Wortwahl. Gesucht ist eine
Lösung, die auf **offenen Standards** ruht (P6/P2), keinen Anbieter bindet (P3) und die strikte
Trennung „Daten sprachneutral, Darstellung lokalisiert" trägt.

## Betrachtete Optionen

- **Option A — Einfache Key/Value-JSON-Kataloge** ohne Formatlogik.
- **Option B — gettext / PO-Dateien**, der klassische Übersetzungsstandard.
- **Option C — Vendor-Übersetzungs-SaaS** (gehostete Lokalisierungsplattform mit eigenem SDK).
- **Option D — ICU MessageFormat für Übersetzungen + native Web-`Intl`-API (ECMA-402) für
  Zahlen/Daten/Währungen/Pluralregeln.**

## Entscheidung

**Option D — ICU MessageFormat + Web-`Intl`.**

Übersetzungen werden als **ICU-MessageFormat**-Nachrichten in Katalogen gepflegt; sie beherrschen
Platzhalter, `plural`, `select` (Genus) und Verschachtelung und lösen damit korrekt auf, was
Sprachen mit komplexer Morphologie verlangen. **Zahlen, Beträge, Daten und relative Zeiten** werden
über die native **`Intl`-API** der Runtime formatiert (`Intl.NumberFormat`, `Intl.DateTimeFormat`,
`Intl.PluralRules`, `Intl.ListFormat`), die die CLDR-Locale-Daten der Plattform trägt — wir pflegen
**keine** eigenen Format-Tabellen.

Beides sind **offene Standards** (ICU/Unicode, ECMA-402) statt Eigenformat (P6, P2) und binden
keinen Anbieter (P3). Die Wahl passt direkt zur Localization-Kernkomponente aus
[ADR-0003](0003-plattformkern-und-modulschnitt.md) und zur codierten Referenzdaten-Achse aus
[ADR-0008](0008-jurisdiktions-und-referenzdaten-achse.md) (ISO 4217, ISO 8601): Der Fakt liegt als
`value`/`unit`/`valid_time` sprachneutral vor
([Provenance-Modell](0006-provenance-modell-w3c-prov.md)), und nur seine Projektion in eine Locale
wechselt. Eine neue Sprache ist damit ein **Datenbeitrag** (ein Katalog), kein Code-Change — die
QA10-Bedingung ist strukturell erfüllt.

## Konsequenzen

- **Positiv:** Korrekte Plural-/Genus-/Formatlogik für beliebige Sprachen; keine eigenen
  Format-Tabellen dank CLDR/`Intl`; strikte Trennung Fakt/Darstellung schützt QA1; neue Locale ohne
  Codeänderung (QA10); vollständig auf offenen Standards, kein Lock-in (P2/P3/P6).
- **Negativ / Kosten (ehrlich benannt):** ICU-MessageFormat-Syntax ist für Übersetzende
  **anspruchsvoller** als flaches Key/Value — verschachtelte `plural`/`select`-Blöcke haben eine
  Lernkurve und sind fehleranfälliger beim Handübersetzen. Gegenmaßnahme: Linting der Kataloge in
  CI (Syntax-/Platzhalter-Validierung), gute Beispiele im Beitragsleitfaden und Fallback auf die
  Quell-Locale bei defekten/fehlenden Schlüsseln. Zudem ist ein kleiner ICU-Parser als Abhängigkeit
  nötig, da MessageFormat nicht Teil von `Intl` ist.
- **Reversibilität (P8):** Hoch. Kataloge sind Daten, kein Code; ein späterer Wechsel des
  Message-Renderers ändert das Katalogformat, nicht das Datenmodell. Die `Intl`-Formatierung nutzt
  ohnehin die Plattform-API und wäre bei einem Frameworkwechsel unverändert weiterverwendbar.

## Vor- und Nachteile der Optionen

### Option A — Einfache Key/Value-JSON-Kataloge

- 👍 Denkbar simpel, sofort verständlich für jede:n Übersetzende:n, keine zusätzliche Abhängigkeit —
  der **stärkste** Punkt dieser Option und ein echtes Argument für kleine, einsprachige Projekte.
- 👎 Kennt keine Plural-, Genus- oder Formatregeln. Für Sprachen mit mehr als zwei Pluralformen
  (z. B. Slawisch, Arabisch) oder genusabhängiger Wortwahl bricht der Ansatz und provoziert
  grammatikalisch falsche UI — inakzeptabel für den QA10-Anspruch „jede Locale".

### Option B — gettext / PO-Dateien

- 👍 Sehr etablierter Übersetzungsstandard mit ausgereiftem Tooling (Poedit, Weblate, Übersetzer-
  Ökosystem) und breiter Vertrautheit in der Open-Source-Welt — die **ernsthafteste Alternative**,
  und in Sachen Werkzeug-/Community-Reife der gewählten Option tatsächlich voraus.
- 👎 Weniger web-nativ (stammt aus der C/Unix-Welt); die Plurallogik über `ngettext`/`Plural-Forms`
  ist schwächer und umständlicher als ICUs deklaratives `plural`/`select`, besonders bei
  verschachtelten oder mehrfach-pluralisierten Nachrichten. Für Zahlen/Daten braucht es ohnehin
  zusätzlich `Intl` — der Vorteil gegenüber Option D schrumpft damit auf das Tooling.

### Option C — Vendor-Übersetzungs-SaaS

- 👍 Komfortabler Workflow, Übersetzungsspeicher, teils maschinelle Vorübersetzung „out of the box".
- 👎 **Anbieter-Lock-in** (P3-Verstoß) und eine externe Abhängigkeit im Übersetzungspfad einer
  Plattform, die Souveränität und Self-Hosting zusagt (P2/P3); Kosten und Datenabfluss stehen im
  Widerspruch zum Community-/Open-Source-Charakter. Für OpenCivic disqualifizierend.

### Option D — ICU MessageFormat + Web-`Intl` *(gewählt)*

- 👍 Offene Standards (ICU/Unicode, ECMA-402); korrekte Plural-/Genus-/Formatregeln für beliebige
  Sprachen; CLDR-Formatdaten kostenlos über die Runtime; saubere Trennung Fakt/Darstellung; neue
  Locale ohne Codeänderung (QA10); kein Lock-in.
- 👎 Höhere Autoren-Komplexität der ICU-Syntax und eine ICU-Parser-Abhängigkeit — bewusst
  akzeptierter Trade-off, in CI durch Katalog-Linting und Fallbacks abgefedert; das
  überlegene Tooling von gettext (Option B) wird dafür in Kauf genommen.
