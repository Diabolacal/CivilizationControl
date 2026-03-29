/**
 * Solar-system catalog — static dataset, bundled at build time.
 *
 * Source: World API v2/solarsystems, fetched offline by scripts/fetch-solar-systems.mjs
 * and committed as src/data/solarSystems.json (~24.5k entries).
 *
 * All lookups are synchronous and instant — no runtime fetch required.
 * To refresh the dataset, run:  node scripts/fetch-solar-systems.mjs
 */

import type { SolarSystem } from "@/types/domain";
import rawCatalog from "@/data/solarSystems.json";

// Cast the JSON import — it matches SolarSystem[] by construction.
const catalog: SolarSystem[] = rawCatalog as SolarSystem[];

// Build lookup indexes once at module init.
const byId = new Map<number, SolarSystem>();
const byName = new Map<string, SolarSystem>();
for (const s of catalog) {
  byId.set(s.solarSystemId, s);
  if (s.solarSystemName) {
    byName.set(s.solarSystemName.toLowerCase(), s);
  }
}

/**
 * Return the full catalog array (always available synchronously).
 * Kept async-compatible for backward compatibility with useSolarSystemCatalog.
 */
export async function fetchSolarSystemCatalog(): Promise<SolarSystem[]> {
  return catalog;
}

/** Look up a solar system by numeric ID. */
export function getSolarSystemById(id: number): SolarSystem | undefined {
  return byId.get(id);
}

/** Look up a solar system by exact name (case-insensitive). */
export function getSolarSystemByName(name: string): SolarSystem | undefined {
  return byName.get(name.toLowerCase());
}

/**
 * Search solar systems by partial name (case-insensitive).
 * Returns up to `limit` matches.
 */
export function searchSolarSystems(
  query: string,
  limit = 20,
): SolarSystem[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const results: SolarSystem[] = [];
  for (const s of catalog) {
    if (s.solarSystemName.toLowerCase().includes(lower)) {
      results.push(s);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/** Always true — data is bundled at build time. */
export function isCatalogLoaded(): boolean {
  return true;
}

/** Return the full catalog array synchronously. */
export function getSolarSystemCatalog(): SolarSystem[] {
  return catalog;
}

/** Total count of systems in the catalog. */
export function getCatalogSize(): number {
  return catalog.length;
}
