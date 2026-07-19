<!--
  SPDX-FileCopyrightText: 2026 OpenCivic Contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script lang="ts">
  import { formatEur } from '$lib/format';
  import { translator } from '$lib/i18n';
  let { data } = $props();
  const t = $derived(translator(data.locale));
</script>

<svelte:head>
  <title>{t('home.title')}</title>
</svelte:head>

<h1>{t('home.title')}</h1>
<p>{t('home.intro')}</p>

<!-- GET-Formular: funktioniert ohne JavaScript; progressive Anreicherung optional. -->
<form class="search-form" method="GET" action="/" role="search">
  <label for="q">{t('home.searchLabel')}</label>
  <input
    id="q"
    type="search"
    name="q"
    value={data.q}
    placeholder={t('home.searchPlaceholder')}
    autocomplete="off"
  />
  <input type="hidden" name="lang" value={data.locale} />
  <button type="submit">{t('home.searchButton')}</button>
</form>

<p aria-live="polite">
  {t('home.result', { count: data.count, hasQuery: data.q ? 'yes' : 'no', q: data.q })}
</p>

{#if data.items.length === 0}
  <p>{t('home.empty')}</p>
{:else}
  <ul class="budget">
    {#each data.items as item (item.id)}
      <li>
        <span class="amount">{formatEur(item.value.amount)}</span>
        <div>{item.subjectLabel}</div>
        <div class="meta">
          {t('home.meta', {
            epl: item.value.einzelplan,
            name: item.value.einzelplan_bezeichnung,
            loc: item.recordLocator,
          })}
        </div>
        <a
          class="source-link"
          href={`/statement/${encodeURIComponent(item.id)}?lang=${data.locale}`}
        >
          {t('home.sourceLink')}
        </a>
      </li>
    {/each}
  </ul>
{/if}
