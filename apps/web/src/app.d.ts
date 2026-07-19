// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Locale } from '$lib/i18n';

declare global {
  namespace App {
    interface Locals {
      locale: Locale;
    }
  }
}

export {};
