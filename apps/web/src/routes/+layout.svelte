<!--
  SPDX-FileCopyrightText: 2026 OpenCivic Contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script>
  import '../app.css';
  let { children } = $props();
</script>

<a class="skip-link" href="#main">Zum Inhalt springen</a>

<header class="site">
  <div class="container">
    <a href="/">OpenCivic · OpenBudget</a>
  </div>
</header>

<main id="main" class="container" tabindex="-1">
  {@render children()}
</main>

<footer class="site">
  <div class="container">
    <p>
      OpenCivic — staatliches Handeln nachvollziehbar machen. Jede Zahl ist quellenbelegt.
      Freie Software (AGPL-3.0). Angezeigte Werte stammen aus einem Beispiel-Sample und sind
      <strong>nicht amtlich</strong>.
    </p>
  </div>
</footer>
