/**
 * Tribe catalog — name map for the active environment (Utopia).
 *
 * Initial data: src/data/tribes.json (bundled at build time via
 * scripts/fetch-tribes.mjs from the Utopia World API).
 *
 * At runtime, mergeFreshTribes() can be called to inject live API data.
 * Fresh data wins on tribeId conflict; the bundled snapshot remains as
 * fallback for any IDs not returned by the API.
 *
 * Chain/RPC is the source of truth for tribe IDs (Character.tribe_id).
 * This catalog provides name enrichment — unknown IDs fall back to
 * "Tribe #<id>" via resolveTribeName().
 */

import type { Tribe } from "@/types/domain";
import rawCatalog from "@/data/tribes.json";

let catalog: Tribe[] = [...(rawCatalog as Tribe[])];
const byId = new Map<number, Tribe>();
for (const t of catalog) {
  byId.set(t.tribeId, t);
}

// ─── Version signal for React reactivity ───────────────────────

let catalogVersion = 0;
type Listener = () => void;
const listeners = new Set<Listener>();

/** Current catalog version (increments on merge). */
export function getCatalogVersion(): number {
  return catalogVersion;
}

/** Subscribe to catalog version changes. Returns unsubscribe function. */
export function subscribeCatalog(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Core API ──────────────────────────────────────────────────

/** Look up a tribe by numeric ID. */
export function getTribeById(id: number): Tribe | undefined {
  return byId.get(id);
}

/** Resolve a tribe ID to its display name, or a fallback string. */
export function resolveTribeName(id: number): string {
  return byId.get(id)?.name ?? `Tribe #${id}`;
}

/**
 * Search tribes by partial name or short tag (case-insensitive).
 * Returns up to `limit` matches.
 */
export function searchTribes(query: string, limit = 20): Tribe[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const results: Tribe[] = [];
  for (const t of catalog) {
    if (
      t.name.toLowerCase().includes(lower) ||
      t.nameShort.toLowerCase().includes(lower)
    ) {
      results.push(t);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/** Total count of tribes in the catalog. */
export function getCatalogSize(): number {
  return catalog.length;
}

/** Return all tribes in the catalog (for listing in empty-query state). */
export function getAllTribes(): Tribe[] {
  return catalog;
}

// ─── Runtime merge ─────────────────────────────────────────────

/**
 * Merge fresh tribe data from the Utopia API into the catalog.
 * API entries win on tribeId conflict. Snapshot entries absent from
 * the API response are preserved (the snapshot is the safety net).
 */
export function mergeFreshTribes(fresh: Tribe[]): void {
  for (const t of fresh) {
    byId.set(t.tribeId, t);
  }
  catalog = Array.from(byId.values());
  catalogVersion++;
  for (const fn of listeners) fn();
}
