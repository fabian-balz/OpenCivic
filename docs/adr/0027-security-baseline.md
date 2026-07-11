<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0027 — Security-Baseline (SBOM, Scanning, Sigstore, reproduzierbare Builds)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** [Architekturziel 8](../foundation/07-architekturziele.md) (Sicherheit architektonisch
  verankert, Zero-Trust/Least Privilege);
  [Architekturziel 5](../foundation/07-architekturziele.md) (Reproduzierbarkeit);
  Qualitätsattribute QA1 (Nachvollziehbarkeit), QA4 (Sicherheit/Datenschutz);
  Entscheidungsprinzipien P9 (secure by default), P2 (offene Standards), P4 (lizenzkompatibel);
  [Leitprinzip 4](../foundation/03-leitprinzipien.md) (Reproduzierbarkeit);
  Risiken [R11](../foundation/09-risiken.md) (Angriffe auf die Datenintegrität);
  knüpft an [ADR-0001](0001-lizenzmodell-split.md) (SPDX/Lizenzen),
  [ADR-0006](0006-provenance-modell-w3c-prov.md) / [ADR-0007](0007-bitemporal-append-only-lifecycle.md)
  (Provenance-Hashes) und [ADR-0018](0018-authn-authz-oidc-rbac.md) (OIDC) an.

## Kontext und Problemstellung

OpenCivic ist eine Vertrauensplattform: Nutzende glauben einer Aussage nur, weil sie deren Herkunft
prüfen können (QA1; [Leitprinzip 2](../foundation/03-leitprinzipien.md) Quellenzwang). Diese
Vertrauenskette ist aber nur so stark wie ihr schwächstes Glied — und ein manipuliertes
Container-Image oder eine kompromittierte Abhängigkeit würde die Kette **unterhalb** des
Provenance-Modells brechen, ohne dass es an den Daten sichtbar wäre
([R11](../foundation/09-risiken.md)). Die Sicherheits-Baseline muss daher die **Software- und
Artefaktkette** ebenso prüfbar machen wie die Datenkette — mit offenen Werkzeugen (P2, P4), sicheren
Voreinstellungen (P9) und ohne die kleinen Betreiber zu überfordern.

## Betrachtete Optionen

- **Option A — offene Supply-Chain-Baseline:** SBOM (SPDX) je Build, Dependency-/Secret-Scanning in
  CI, Container-Signatur via Sigstore/cosign (keyless, OIDC), Verifikation vor Deploy,
  reproduzierbare Builds über gepinnte Lockfiles + Image-Digests.
- **Option B — keine Signatur / kein SBOM:** auf Supply-Chain-Verifikation verzichten.
- **Option C — Notary v1 / Docker Content Trust (DCT)** für Image-Signatur.
- **Option D — proprietäre Scanner-Suite** statt offener Werkzeuge.

## Entscheidung

**Option A — die offene Supply-Chain-Baseline.**

Jeder Build erzeugt eine **SBOM im SPDX-Format** — konsistent mit dem Lizenzmodell aus
[ADR-0001](0001-lizenzmodell-split.md) und der LICENSING.md, und die Grundlage für
Lieferketten-Transparenz ([R11](../foundation/09-risiken.md)). In der CI laufen
**Dependency-Scanning** (Trivy/Grype) und **Secret-Scanning** (gitleaks) als Gates (P9; QA4).

Container-Images werden mit **Sigstore/cosign keyless via OIDC** signiert. „Keyless" heißt: Es gibt
keine langlebigen Signierschlüssel zu verwalten — die Identität kommt über OIDC, womit diese
Baseline die **OIDC-Investition aus [ADR-0018](0018-authn-authz-oidc-rbac.md) mitnutzt**. Vor jedem
Deploy wird die Signatur **verifiziert**; deployt werden nur signierte, per **Digest** (nicht Tag)
referenzierte Images.

**Reproduzierbare Builds** über gepinnte Lockfiles und Image-Digests machen Artefakte
deterministisch und damit verifizierbar ([Leitprinzip 4](../foundation/03-leitprinzipien.md);
Architekturziel 5). Damit schließt sich der Kreis zur Datenschicht: Die Signatur der Artefakte und
die **Provenance-Hashes** aus [ADR-0006](0006-provenance-modell-w3c-prov.md) /
[ADR-0007](0007-bitemporal-append-only-lifecycle.md) bilden zusammen eine durchgehend prüfbare Kette
von der Rohquelle bis zum ausgelieferten Container (QA1/QA4). Zwischen den Modulen gilt Least
Privilege ([Architekturziel 8](../foundation/07-architekturziele.md)).

## Konsequenzen

- **Positiv:** Verifizierbare Lieferkette; keine Schlüsselverwaltung dank keyless (nutzt vorhandenes
  OIDC); deterministische Artefakte (Leitprinzip 4); offene, lizenzkompatible Werkzeuge (P2/P4);
  die Plattform-Sicherheit schützt genau die Kette, die das Vertrauen trägt (QA1).
- **Negativ / Kosten (ehrlich benannt):** SBOM-Erzeugung, Scanning und Signatur/Verifikation
  **erhöhen die CI-Komplexität und die Build-Zeit** spürbar; Scanner können Rauschen (False
  Positives) erzeugen, das gepflegt werden muss. Das ist der bewusst akzeptierte Preis für
  Integrität — für eine Plattform, deren Wert auf Verifizierbarkeit beruht, ist eine unverifizierbare
  Lieferkette keine Option.
- **Reversibilität (P8):** Hoch — SBOM (SPDX), Signatur (Sigstore) und Scanner sind offene Standards
  bzw. austauschbare Werkzeuge; einzelne Bausteine sind ersetzbar, ohne die Baseline aufzugeben.

## Vor- und Nachteile der Optionen

### Option A — offene Supply-Chain-Baseline *(gewählt)*

- 👍 Vollständige, prüfbare Lieferkette mit offenen Werkzeugen; keyless-Signatur ohne
  Schlüssellast; deterministische Artefakte; direkte Stütze für QA1/QA4 und R11.
- 👎 Höhere CI-Komplexität und Build-Zeit; Pflegeaufwand für Scanner-Ergebnisse.

### Option B — kein Signieren / kein SBOM

- 👍 Einfachste, schnellste Pipeline ohne zusätzliche Werkzeuge — der einzige ehrliche Vorteil ist
  geringere Komplexität.
- 👎 Keinerlei Lieferketten-Verifikation: Ein manipuliertes Image oder eine kompromittierte
  Abhängigkeit bliebe unentdeckt (R11). Für eine Vertrauensplattform **inakzeptabel** — es
  untergräbt QA1 an der Wurzel.

### Option C — Notary v1 / Docker Content Trust

- 👍 Etablierter, lange verfügbarer Signaturmechanismus für Container — ein realer, erprobter Ansatz.
- 👎 Praktisch abgelöst; schwächeres, schrumpfendes Ökosystem und höhere Schlüsselverwaltungslast
  gegenüber Sigstore. Sigstores keyless-OIDC-Modell ist zukunftssicherer und passt zur
  vorhandenen OIDC-Investition (ADR-0018) — Notary v1 widerspräche P1 (bewährt, aber hier eher
  „veraltend") im Vergleich zum lebendigeren Standard.

### Option D — proprietäre Scanner-Suite

- 👍 Komfort: gebündelte UI, kuratierte Vulnerability-Datenbanken, Support, oft weniger
  Konfigurationsaufwand — der ehrliche Bequemlichkeitsvorteil.
- 👎 Kosten und Lock-in; nicht durchgängig self-hostbar/lizenzkompatibel — Spannung zu P2/P4/QA5.
  Offene Werkzeuge (Trivy, Grype, gitleaks) decken die Baseline ab und bleiben anbieterneutral.
