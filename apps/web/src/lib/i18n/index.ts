// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// i18n (ADR-0021): ICU MessageFormat über den offenen Standard `intl-messageformat`.
// DACH-first (Default de), aber jede weitere Locale ist eine Katalog-Datei — keine Codeänderung.

import { IntlMessageFormat } from 'intl-messageformat';
import de from './de.json';
import en from './en.json';

export const SUPPORTED_LOCALES = ['de', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

const CATALOGS: Record<Locale, Record<string, string>> = { de, en };

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Ermittelt die Locale aus `?lang` (Vorrang) oder Accept-Language; sonst Default. */
export function resolveLocale(langParam: string | null, acceptLanguage: string | null): Locale {
  if (isLocale(langParam)) return langParam;
  const first = (acceptLanguage ?? '').split(',')[0]?.trim().slice(0, 2).toLowerCase();
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

export type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Liefert eine Übersetzungsfunktion für die Locale (mit Fallback auf de, dann Key). */
export function translator(locale: Locale): Translate {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  return (key, values) => {
    const message = catalog[key] ?? CATALOGS[DEFAULT_LOCALE][key] ?? key;
    try {
      return new IntlMessageFormat(message, locale).format(values) as string;
    } catch {
      return message;
    }
  };
}
