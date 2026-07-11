<!--
SPDX-FileCopyrightText: 2026 OpenCivic Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 0018 — AuthN/AuthZ (OIDC + pluggable IdP, RBAC)

- **Status:** Accepted
- **Datum:** 2026-07-10
- **Bezug:** Leitprinzip 6 (Datensparsamkeit); Entscheidungsprinzipien P1 (boring & bewährt),
  P3 (keine Cloud-Anbieter-Bindung), P6 (Standardschnittstellen, OAuth2/OIDC ausdrücklich),
  P8 (Reversibilität), P9 (secure by default); Qualitätsattribute QA1 (Nachvollziehbarkeit),
  QA3 (Wartbarkeit), QA4 (Sicherheit/Datenschutz), QA5 (Self-Hosting), QA7 (Interoperabilität);
  Architekturziel 8 (Zero-Trust zwischen Modulen); verwandt mit
  [ADR-0002](0002-architekturstil-modular-monolith.md) (Deployment-Profile),
  [ADR-0003](0003-plattformkern-und-modulschnitt.md) (Identity-Baustein),
  [ADR-0006](0006-provenance-modell-w3c-prov.md) (Agent-Modell, keine Endnutzer-PII),
  [ADR-0010](0010-backend-framework-nodejs-fastify.md) (Plugin-Kapselung),
  [ADR-0012](0012-api-stil-rest-openapi.md) (anonyme Lesefläche). Ausformuliert in
  [07 — Authentifizierung & Autorisierung](../architecture/07-auth.md).

## Kontext und Problemstellung

OpenCivic ist eine Transparenzplattform: Der **weit überwiegende Teil** der Nutzung — Zahlen lesen,
filtern, ihre Herkunft bis zur amtlichen Quelle auflösen — ist **anonym und ohne Konto** möglich und
soll es bleiben ([ADR-0012](0012-api-stil-rest-openapi.md), Leitprinzip 6). Authentifizierung wird
nur für eine **schmale Fläche** benötigt: Kuration (Statements prüfen/freigeben), Betrieb
(Ingest/Pipelines steuern) und Verwaltung (Rollen, Registry, Konfiguration).

Zwei Fragen sind zu beantworten, ohne die Grundphilosophie zu verletzen:

1. **AuthN — woher kommt Identität?** OpenCivic läuft in drei Deployment-Profilen
   ([ADR-0002](0002-architekturstil-modular-monolith.md)): Solo (eine Einzelperson), Standard
   (Team/Verein), Scale (Mandantenbetrieb, ggf. Behörden). Ein fest verdrahteter Identity-Provider
   würde entweder die Einzelperson mit unnötigem Betriebsaufwand belasten oder die Behörden-Anbindung
   verbauen. Zugleich darf keine harte Bindung an eine proprietäre Identity-SaaS entstehen (P3, QA5).
2. **AuthZ — wie fein muss die Zugriffskontrolle sein?** Weil die schützenswerte Fläche schmal und
   rollenförmig ist, steht die Frage im Raum, ob eine ausdrucksstarke Policy-Engine überhaupt
   gerechtfertigt ist — oder ob sie Komplexität einführt, die dem Auditierbarkeits- und
   Verständlichkeitsanspruch (QA1/QA3, P1) zuwiderläuft.

Erschwerend: Die Lösung muss mit dem **Zero-Trust-Ziel zwischen Modulen** (Architekturziel 8)
zusammenpassen — jedes Modul prüft Autorisierung an seinem eigenen Contract, auch im modularen
Monolithen.

## Betrachtete Optionen

- **Option A — OIDC/OAuth2 mit pluggable IdP + RBAC je Modul** (eingebautes Minimal-Auth für Solo;
  Keycloak als self-hostbare Referenz; Behörden-SSO via OIDC).
- **Option B — Proprietäre Auth-SaaS/SDK** (Auth0, Clerk o. ä.).
- **Option C — ABAC via Policy-Engine** (Open Policy Agent / Cedar) als primäres Autorisierungsmodell.
- **Option D — Selbstgebautes Session-Auth ohne OIDC.**

## Entscheidung

**Option A — OIDC/OAuth2 mit pluggable IdP und RBAC je Modul.**

**AuthN:** Der Identity-Baustein des [Plattformkerns](0003-plattformkern-und-modulschnitt.md) ist ein
**OIDC/OAuth2-Consumer** — er verifiziert Tokens eines externen IdP und leitet Rollen ab, kennt aber
**keinen konkreten Anbieter**. OIDC/OAuth2 ist in P6 ausdrücklich als zu bevorzugende
Standardschnittstelle benannt und der einzige realistische Weg zu **Behörden-SSO ohne
Sonderentwicklung** (QA7). Das **Solo-Profil** bringt ein eingebautes **Minimal-Auth** für den
Einzel-Operator mit, das nach außen dieselbe OIDC-Kontur spricht; **Standard/Scale** binden jeden
OIDC-konformen IdP an, mit **Keycloak** (Apache-2.0, self-hostbar) als Referenz. Der Kern-Code ist
über alle Profile identisch — der Wechsel Solo → Standard → Behörden-SSO ist eine Konfigurations-,
keine Umbauentscheidung (P8, QA5).

**AuthZ:** **RBAC je Modul** mit Baseline-Rollen `reader`/`curator`/`operator`/`admin`. Weil der
Großteil der Daten ohnehin öffentlich lesbar ist, ist die schützenswerte Fläche schmal und
rollenförmig; RBAC ist „boring", verständlich (P1) und trivial auditierbar (QA1/QA3). Rollen sind
**je Modul** interpretiert, und jedes Modul prüft Autorisierung **an seinem eigenen Contract**
(Zero-Trust, Architekturziel 8) — die von der Fastify-Plugin-Kapselung
([ADR-0010](0010-backend-framework-nodejs-fastify.md)) erzwungene Modulgrenze wird so zur
Sicherheitsgrenze.

**Datensparsamkeit:** Es gibt **keine Endnutzer-Konten für reines Lesen** und damit keine
PII-Horte. Auth liefert Identität nur für die Zugriffsentscheidung; sie wird nicht ungefiltert in den
öffentlichen Herkunftsgraphen gespiegelt — konsistent mit dem Agent-Modell der Provenance
([ADR-0006](0006-provenance-modell-w3c-prov.md), das verantwortliche Rollen/Systeme statt
Endnutzer-PII verzeichnet).

## Konsequenzen

- **Positiv:** Keine Anbieter-Bindung und volle Self-Hostbarkeit (P3, QA5); Behörden-SSO ohne
  Sonderentwicklung anschließbar (QA7); ein einziger Code-Pfad über alle Profile; RBAC ist
  verständlich und auditierbar (P1, QA1/QA3); die anonyme, cachebare Lesefläche bleibt ohne
  Auth-Overhead (QA2/QA8); minimale PII-Fläche (QA4, Leitprinzip 6); Zero-Trust überlebt eine
  spätere Modul-Extraktion unverändert.
- **Negativ / Kosten (ehrlich benannt):**
  - **RBAC ist bewusst grobkörnig.** Kommen später echte feingranulare Anforderungen auf
    (z. B. „Kurator:in X darf nur Haushaltsposten der Jurisdiktion Y bearbeiten"), lässt sich das mit
    reinem RBAC nur über eine wachsende Zahl von Rollen abbilden — das ist der Punkt, an dem
    **ABAC (Option C) tatsächlich überlegen** ist. Wir akzeptieren diese Grobkörnigkeit heute
    bewusst, weil der Bedarf (noch) nicht existiert.
  - **Betriebslast eines IdP in Standard/Scale.** Ein self-hosteter Keycloak ist ein zusätzlicher
    Dienst mit eigener Wartung — mehr Aufwand als eine SaaS (Option B), die genau das abnimmt.
  - **Solo-Minimal-Auth ist Eigenverantwortung.** Das eingebaute Minimal-Auth muss selbst sorgfältig
    gehärtet und gepflegt werden; es ist bewusst minimal, kein vollwertiger IdP.
- **Reversibilität (P8):** Hoch. Weil AuthZ hinter einer klaren Modul-Contract-Prüfung liegt, kann
  RBAC **modulweise** durch ABAC (OPA/Cedar) ersetzt oder ergänzt werden, ohne die AuthN-Schicht
  anzutasten — der dokumentierte Ausbaupfad für komplexere Mandanten-/Kommunen-Szenarien. Weil AuthN
  reines OIDC ist, ist ein IdP-Wechsel Konfiguration. Ein späterer Umstieg ist über einen neuen ADR
  ohne Architekturbruch möglich.

## Vor- und Nachteile der Optionen

### Option A — OIDC/OAuth2 + pluggable IdP + RBAC je Modul *(gewählt)*

- 👍 Standardprotokoll (P6), keine Anbieter-Bindung (P3), voll self-hostbar (QA5); Behörden-SSO ohne
  Sonderentwicklung (QA7).
- 👍 RBAC ist boring, verständlich und leicht auditierbar (P1, QA1/QA3); passt zur schmalen,
  rollenförmigen Schutzfläche.
- 👍 Ein Code-Pfad über Solo/Standard/Scale; Zero-Trust am Modul-Contract übersteht Modul-Extraktion.
- 👎 RBAC ist grobkörnig — feingranulare, attributbasierte Regeln sind erst über einen späteren
  ABAC-Ausbau erreichbar; ein self-hosteter IdP ist zusätzliche Betriebslast.

### Option B — Proprietäre Auth-SaaS/SDK (Auth0, Clerk)

- 👍 **Sehr schnell integriert, minimale Ops** — kein eigener IdP-Betrieb, gepflegte SDKs,
  ausgereifte Features (MFA, Social Login) out of the box. Für ein Team ohne Betriebskapazität ist
  das ein realer, ehrlicher Vorteil.
- 👎 **Harte Anbieter-Abhängigkeit**, nicht self-hostbar, cloud-gebunden — direkter Verstoß gegen P3
  und QA5, die für eine souveräne, self-hostbare Transparenzplattform nicht verhandelbar sind. Bindet
  zudem betriebliche Identitätsdaten an einen Dritten. Ausschluss über P3/QA5.

### Option C — ABAC via Policy-Engine (OPA / Cedar)

- 👍 **Feingranular und ausdrucksstark** — Regeln über Attribute (Jurisdiktion, Zeitachse,
  Mandant, Ressourcen-Eigenschaften) statt nur Rollen; die überlegene Wahl, sobald echte
  mandanten-/attributabhängige Autorisierung gebraucht wird. Policies sind als Code versionierbar
  und zentral testbar.
- 👎 **Erhebliche Komplexität und Lernkurve** für einen Nutzen, den die heutige, überwiegend
  öffentliche Datenlage nicht rechtfertigt; eine Policy-Sprache ist schwerer zu auditieren als eine
  Rollenzuweisung (Spannung zu P1/QA3). Deshalb heute **überzogen** — aber ausdrücklich als
  **Ausbaupfad** (P8) für komplexere Kommunen-/Mandanten-Szenarien vorgesehen, modulweise
  nachrüstbar hinter der bestehenden Contract-Prüfung.

### Option D — Selbstgebautes Session-Auth ohne OIDC

- 👍 Volle Kontrolle, keine externe Protokoll-Abhängigkeit, im ersten Moment scheinbar einfach.
- 👎 **Sicherheits-Eigenrisiko** (selbstgebaute Krypto/Session-Handhabung), **kein Behörden-SSO**
  möglich, und ein Neuerfinden dessen, was OIDC als auditierter Standard bereits löst — Verstoß gegen
  P6 und gegen „boring & bewährt" (P1). Klar verworfen.
