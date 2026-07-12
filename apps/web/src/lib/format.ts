// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Client-sichere Formatierung (nur Web-Intl, ADR-0021). Getrennt von api.ts, damit
// serverseitige Fetcher (process.env / API-Basis) nicht ins Client-Bundle geraten.

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
