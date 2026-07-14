<!--
  SPDX-FileCopyrightText: 2026 OpenCivic Contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script>
  import '../app.css';
  import { translator } from '$lib/i18n';
  let { children, data } = $props();
  const t = $derived(translator(data.locale));
</script>

<a class="skip-link" href="#main">{t('skip')}</a>

<header class="site">
  <div class="container">
    <a href="/">{t('brand')}</a>
  </div>
</header>

<main id="main" class="container" tabindex="-1">
  {@render children()}
</main>

<footer class="site">
  <div class="container">
    <p>{t('footer')}</p>
  </div>
</footer>
