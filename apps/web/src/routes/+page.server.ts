// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Server-Load: Budget-Aussagen aus der API holen. Läuft serverseitig (SSR) — die Seite
// funktioniert vollständig ohne JavaScript (Architekturziel 7, ADR-0011/0022).

import { fetchBudgetStatements } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
  const q = url.searchParams.get('q') ?? '';
  const { items, count } = await fetchBudgetStatements(fetch, q);
  return { q, items, count };
};
