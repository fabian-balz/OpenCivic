// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import { error } from '@sveltejs/kit';
import { fetchStatement, fetchProvenance } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const [statement, prov] = await Promise.all([
    fetchStatement(fetch, params.id),
    fetchProvenance(fetch, params.id),
  ]);
  if (!statement || !prov) {
    throw error(404, 'Aussage nicht gefunden');
  }
  return { statement, citation: prov.citation };
};
