<!--
  SPDX-FileCopyrightText: 2026 OpenCivic Contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script lang="ts">
  import { formatEur } from '$lib/format';
  import { translator } from '$lib/i18n';
  let { data } = $props();
  const t = $derived(translator(data.locale));
  const s = data.statement;
  const c = data.citation;
  const year = s.validFrom?.slice(0, 4);

  // schema.org/JSON-LD direkt aus dem Provenance-Modell (ADR-0022) — keine separate SEO-Datenhaltung.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${s.subjectLabel} — ${year}`,
    description: `Haushaltsansatz (${s.recordLocator}) aus OpenBudget, quellenbelegt.`,
    identifier: s.id,
    temporalCoverage: `${s.validFrom}/${s.validTo ?? ''}`,
    license: c.sourceVersion.license ?? undefined,
    creator: { '@type': 'GovernmentOrganization', name: c.source.publisher.name },
    isBasedOn: c.source.canonicalUri ?? undefined,
    sha256: c.sourceVersion.contentHash.replace(/^sha256:/, ''),
    variableMeasured: { '@type': 'MonetaryAmount', currency: 'EUR', value: s.value.amount },
  });
</script>

<svelte:head>
  <title>{s.subjectLabel} — OpenBudget</title>
  {@html `<script type="application/ld+json">${jsonLd}</` + `script>`}
</svelte:head>

<p><a href={`/?lang=${data.locale}`}>{t('detail.back')}</a></p>

<h1>{s.subjectLabel}</h1>
<p class="amount" style="font-size:1.5rem">
  {formatEur(s.value.amount)}
  <span class="meta">{t('detail.ansatz', { year })}</span>
</p>
<p class="meta">
  {t('home.meta', {
    epl: s.value.einzelplan,
    name: s.value.einzelplan_bezeichnung,
    loc: s.recordLocator,
  })}
</p>

<h2>{t('detail.provTitle')}</h2>
<p>{t('detail.provIntro')}</p>

<dl class="citation">
  <dt>{t('detail.source')}</dt>
  <dd>{c.source.name}</dd>

  <dt>{t('detail.publisher')}</dt>
  <dd>{c.source.publisher.name}</dd>

  <dt>{t('detail.jurisdiction')}</dt>
  <dd>{c.source.jurisdiction}</dd>

  <dt>{t('detail.version')}</dt>
  <dd>{c.sourceVersion.upstreamVersionLabel ?? '—'}</dd>

  <dt>{t('detail.retrieved')}</dt>
  <dd>{new Date(c.sourceVersion.retrievedAt).toLocaleString(data.locale)}</dd>

  <dt>{t('detail.license')}</dt>
  <dd>{c.sourceVersion.license ?? '—'}</dd>

  <dt>{t('detail.hash')}</dt>
  <dd class="hash">{c.sourceVersion.contentHash}</dd>

  <dt>{t('detail.processing')}</dt>
  <dd class="hash">{c.datasetVersion.codeVersion} · {c.datasetVersion.layer}</dd>

  {#if c.source.canonicalUri}
    <dt>{t('detail.original')}</dt>
    <dd><a href={c.source.canonicalUri} rel="external nofollow">{c.source.canonicalUri}</a></dd>
  {/if}
</dl>

<p class="disclaimer">⚠️ {t('detail.disclaimer', { path: `/v1/provenance/${s.id}` })}</p>
