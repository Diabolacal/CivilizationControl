/**
 * Tribe catalog — curated name map for the active environment.
 *
 * Source: Manually curated src/data/tribes.json (environment-specific).
 * The Stillness fetch script (scripts/fetch-tribes.mjs) can optionally
 * populate it, but those IDs are NOT valid for Utopia.
 *
 * Chain/RPC is the source of truth for tribe IDs (Character.tribe_id).
 * This catalog provides optional name enrichment — unknown IDs
 * fall back to "Tribe #<id>" via resolveTribeName().
 */

import type { Tribe } from "@/types/domain";
import rawCatalog from "@/data/tribes.json";

const catalog: Tribe[] = rawCatalog as Tribe[];

const byId = new Map<number, Tribe>();
for (const t of catalog) {
  byId.set(t.tribeId, t);
}

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
