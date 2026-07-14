// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Stellt die Locale allen Seiten bereit (wird in die `data`-Prop der Kindrouten gemerged).

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({ locale: locals.locale });
