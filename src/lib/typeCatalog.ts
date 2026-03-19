/**
 * Item-type catalog — static dataset, bundled at build time.
 *
 * Source: World API v2/types, fetched offline by scripts/fetch-types.mjs
 * and committed as src/data/itemTypes.json (~390 entries).
 *
 * All lookups are synchronous and instant — no runtime fetch required.
 * To refresh the dataset, run:  npm run generate:types
 */

import type { ItemType } from "@/types/domain";
import rawCatalog from "@/data/itemTypes.json";

// Cast the JSON import — it matches ItemType[] by construction.
const catalog: ItemType[] = rawCatalog as ItemType[];

// Build lookup indexes once at module init.
const byId = new Map<number, ItemType>();
const byName = new Map<string, ItemType>();
for (const t of catalog) {
  byId.set(t.typeId, t);
  if (t.name) {
    byName.set(t.name.toLowerCase(), t);
  }
}

/** Look up an item type by numeric type ID. O(1). */
export function getItemTypeById(id: number): ItemType | undefined {
  return byId.get(id);
}

/** Look up an item type by exact name (case-insensitive). O(1). */
export function getItemTypeByName(name: string): ItemType | undefined {
  return byName.get(name.toLowerCase());
}

/**
 * Resolve a type ID to a human-readable name.
 * Returns the item name if found, or a graceful fallback like "Unknown Type #12345".
 */
export function resolveItemTypeName(typeId: number): string {
  const item = byId.get(typeId);
  return item ? item.name : `Unknown Type #${typeId}`;
}

/**
 * Search item types by partial name (case-insensitive).
 * Returns up to `limit` matches.
 */
export function searchItemTypes(query: string, limit = 20): ItemType[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const results: ItemType[] = [];
  for (const t of catalog) {
    if (t.name.toLowerCase().includes(lower)) {
      results.push(t);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/** Return the full catalog array. */
export function getAllItemTypes(): ItemType[] {
  return catalog;
}

/** Always true — data is bundled at build time. */
export function isTypeCatalogLoaded(): boolean {
  return true;
}

/** Total count of item types in the catalog. */
export function getTypeCatalogSize(): number {
  return catalog.length;
}
