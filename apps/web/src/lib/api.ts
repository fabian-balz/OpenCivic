// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Dünner Client für die OpenCivic-API. Das Frontend ist reiner API-Konsument (Architekturziel 2).

const API_BASE = process.env.OPENCIVIC_API_URL ?? 'http://127.0.0.1:3001';

export type BudgetStatement = {
  id: string;
  subjectRef: string;
  subjectLabel: string;
  aspect: string;
  value: { amount: number; currency: string; label: string; einzelplan: string; einzelplan_bezeichnung: string };
  unit: string | null;
  validFrom: string;
  validTo: string | null;
  jurisdictionCode: string;
  nature: string;
  recordLocator: string;
  provenance: { href: string };
};

export type Citation = {
  statementId: string;
  source: {
    name: string;
    type: string;
    canonicalUri: string | null;
    jurisdiction: string;
    publisher: { name: string; kind: string };
  };
  sourceVersion: {
    id: string;
    retrievedAt: string;
    contentHash: string;
    mediaType: string;
    upstreamVersionLabel: string | null;
    license: string | null;
  };
  datasetVersion: { id: string; layer: string; codeVersion: string; producedAt: string };
};

type Fetch = typeof globalThis.fetch;

export async function fetchBudgetStatements(
  fetch: Fetch,
  q: string,
): Promise<{ count: number; items: BudgetStatement[] }> {
  const url = new URL('/v1/budget/statements', API_BASE);
  if (q) url.searchParams.set('q', q);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API-Fehler ${res.status}`);
  return res.json();
}

export async function fetchStatement(fetch: Fetch, id: string): Promise<BudgetStatement | null> {
  const res = await fetch(new URL(`/v1/statements/${encodeURIComponent(id)}`, API_BASE));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API-Fehler ${res.status}`);
  return res.json();
}

export async function fetchProvenance(
  fetch: Fetch,
  id: string,
): Promise<{ citation: Citation; provJson: unknown } | null> {
  const res = await fetch(new URL(`/v1/provenance/${encodeURIComponent(id)}`, API_BASE));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API-Fehler ${res.status}`);
  return res.json();
}
