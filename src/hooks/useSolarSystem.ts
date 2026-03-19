/**
 * Hook: solar-system catalog search and lookup.
 *
 * Data is bundled at build time (static JSON import).
 * All operations are synchronous — no loading states.
 */

import { useState, useMemo } from "react";
import {
  searchSolarSystems,
  getSolarSystemById,
  getCatalogSize,
} from "@/lib/solarSystemCatalog";
import type { SolarSystem } from "@/types/domain";

export function useSolarSystemCatalog() {
  return {
    systems: [] as SolarSystem[], // full array rarely needed by consumers
    isLoading: false,
    isError: false,
    error: null as Error | null,
    catalogSize: getCatalogSize(),
  };
}

export function useSolarSystemSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const results: SolarSystem[] = useMemo(
    () => (searchQuery.length >= 2 ? searchSolarSystems(searchQuery, 20) : []),
    [searchQuery],
  );

  return {
    searchQuery,
    setSearchQuery,
    results,
    isLoading: false,
  };
}

export function useSolarSystemLookup(id: number | undefined) {
  return useMemo(() => {
    if (id === undefined) return null;
    return getSolarSystemById(id) ?? null;
  }, [id]);
}
