<!--
  SPDX-FileCopyrightText: 2026 OpenCivic Contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script lang="ts">
  import { formatEur } from '$lib/format';
  let { data } = $props();
  const s = data.statement;
  const c = data.citation;

  // schema.org/JSON-LD direkt aus dem Provenance-Modell (ADR-0022) — keine separate SEO-Datenhaltung.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${s.subjectLabel} — Ansatz ${s.validFrom?.slice(0, 4)}`,
    description: `Haushaltsansatz (${s.recordLocator}) aus OpenBudget, quellenbelegt.`,
    identifier: s.id,
    temporalCoverage: `${s.validFrom}/${s.validTo ?? ''}`,
    license: c.sourceVersion.license ?? undefined,
    creator: { '@type': 'GovernmentOrganization', name: c.source.publisher.name },
    isBasedOn: c.source.canonicalUri ?? undefined,
    sha256: c.sourceVersion.contentHash.replace(/^sha256:/, ''),
    variableMeasured: {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: s.value.amount,
    },
  });
</script>

<svelte:head>
  <title>{s.subjectLabel} — Beleg | OpenBudget</title>
  {@html `<script type="application/ld+json">${jsonLd}</` + `script>`}
</svelte:head>

<p><a href="/">← Zurück zur Übersicht</a></p>

<h1>{s.subjectLabel}</h1>
<p class="amount" style="font-size:1.5rem">
  {formatEur(s.value.amount)}
  <span class="meta">(Ansatz {s.validFrom?.slice(0, 4)})</span>
</p>
<p class="meta">
  Einzelplan {s.value.einzelplan} — {s.value.einzelplan_bezeichnung} · Position {s.recordLocator}
</p>

<h2>Beleg (Provenance)</h2>
<p>Diese Zahl ist auf folgende Quelle zurückführbar:</p>

<dl class="citation">
  <dt>Quelle</dt>
  <dd>{c.source.name}</dd>

  <dt>Herausgeber</dt>
  <dd>{c.source.publisher.name}</dd>

  <dt>Jurisdiktion</dt>
  <dd>{c.source.jurisdiction}</dd>

  <dt>Fassung</dt>
  <dd>{c.sourceVersion.upstreamVersionLabel ?? '—'}</dd>

  <dt>Abgerufen am</dt>
  <dd>{new Date(c.sourceVersion.retrievedAt).toLocaleString('de-DE')}</dd>

  <dt>Lizenz</dt>
  <dd>{c.sourceVersion.license ?? '—'}</dd>

  <dt>Integritäts-Hash</dt>
  <dd class="hash">{c.sourceVersion.contentHash}</dd>

  <dt>Verarbeitungsstand</dt>
  <dd class="hash">{c.datasetVersion.codeVersion} · {c.datasetVersion.layer}</dd>

  {#if c.source.canonicalUri}
    <dt>Originalquelle</dt>
    <dd><a href={c.source.canonicalUri} rel="external nofollow">{c.source.canonicalUri}</a></dd>
  {/if}
</dl>

<p class="disclaimer">
  ⚠️ Beispiel-Sample zu Demonstrationszwecken — <strong>keine amtlichen Zahlen</strong>. Der
  vollständige maschinenlesbare Beleg (W3C-PROV) ist über die API unter
  <code>/v1/provenance/{s.id}</code> abrufbar.
</p>
