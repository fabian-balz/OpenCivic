// SPDX-FileCopyrightText: 2026 OpenCivic Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Modul-SDK (ADR-0003/0020): Ein Fachmodul ist ein Paket, das ein ModuleManifest exportiert.
// Der Erweiterungspunkt IST der Fastify-Plugin-Mechanismus (ADR-0010) — kein eigenes
// Plugin-Framework. Module werden zur Build-/Deploy-Zeit registriert, nicht zur Laufzeit
// nachgeladen (kein Runtime-Hot-Loading, R11).

import type { FastifyPluginAsync } from 'fastify';

export type ModuleManifest = {
  /** Stabile Modul-ID, z. B. 'openbudget'. */
  id: string;
  /** Menschenlesbarer Titel. */
  title: string;
  /** Semantische Version des Modul-Contracts. */
  version: string;
  /** Fastify-Plugin, das die Routen des Moduls beisteuert (nur öffentliche Contracts). */
  apiPlugin: FastifyPluginAsync;
};

/** Registry der aktiven Fachmodule. Deterministische Reihenfolge (Registrierungsreihenfolge). */
export class ModuleRegistry {
  #modules: ModuleManifest[] = [];

  register(manifest: ModuleManifest): this {
    if (this.#modules.some((m) => m.id === manifest.id)) {
      throw new Error(`Modul bereits registriert: ${manifest.id}`);
    }
    this.#modules.push(manifest);
    return this;
  }

  all(): readonly ModuleManifest[] {
    return [...this.#modules];
  }

  get(id: string): ModuleManifest | undefined {
    return this.#modules.find((m) => m.id === id);
  }
}
