<!--
  SPDX-FileCopyrightText: 2026 OpenCivic Contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script lang="ts">
  import { formatEur } from '$lib/format';
  let { data } = $props();
</script>

<svelte:head>
  <title>OpenBudget — Bundeshaushalt (Beispiel) durchsuchen</title>
</svelte:head>

<h1>Bundeshaushalt durchsuchen</h1>
<p>
  Ansätze (Soll) für das Haushaltsjahr 2025. Jede Position lässt sich bis zur Quelle
  nachvollziehen.
</p>

<!-- GET-Formular: funktioniert ohne JavaScript; progressive Anreicherung optional. -->
<form class="search-form" method="GET" action="/" role="search">
  <label for="q">Nach Zweckbestimmung suchen</label>
  <input
    id="q"
    type="search"
    name="q"
    value={data.q}
    placeholder="z. B. Kommunen, Bildung, Verkehr"
    autocomplete="off"
  />
  <button type="submit">Suchen</button>
</form>

<p aria-live="polite">
  {data.count}
  {data.count === 1 ? 'Position' : 'Positionen'}
  {data.q ? `für „${data.q}“` : 'insgesamt'}.
</p>

{#if data.items.length === 0}
  <p>Keine Positionen gefunden.</p>
{:else}
  <ul class="budget">
    {#each data.items as item (item.id)}
      <li>
        <span class="amount">{formatEur(item.value.amount)}</span>
        <div>{item.subjectLabel}</div>
        <div class="meta">
          Einzelplan {item.value.einzelplan} — {item.value.einzelplan_bezeichnung} ·
          {item.recordLocator}
        </div>
        <a class="source-link" href={`/statement/${encodeURIComponent(item.id)}`}>
          Quelle &amp; Beleg ansehen →
        </a>
      </li>
    {/each}
  </ul>
{/if}
