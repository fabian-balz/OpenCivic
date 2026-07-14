// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// WCAG-2.2-AA-Gate (ADR-0022, Leitprinzip 5): axe-core prüft die SSR-Seiten; serious/critical
// Verstöße lassen die CI scheitern.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function seriousViolations(results: { violations: Array<{ id: string; impact?: string | null }> }) {
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

test('Startseite: keine serious/critical WCAG-Verstöße', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const serious = seriousViolations(results);
  expect(serious.map((v) => v.id).join(', ') || 'keine').toBe('keine');
});

test('Detailseite: keine serious/critical WCAG-Verstöße', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.source-link').first().click();
  await page.waitForLoadState('domcontentloaded');
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const serious = seriousViolations(results);
  expect(serious.map((v) => v.id).join(', ') || 'keine').toBe('keine');
});
