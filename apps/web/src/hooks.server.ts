// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Setzt die Locale je Request (?lang oder Accept-Language) und schreibt sie ins <html lang>.

import type { Handle } from '@sveltejs/kit';
import { resolveLocale } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
  const locale = resolveLocale(event.url.searchParams.get('lang'), event.request.headers.get('accept-language'));
  event.locals.locale = locale;
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', locale),
  });
};
