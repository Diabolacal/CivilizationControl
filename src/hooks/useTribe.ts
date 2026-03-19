/**
 * Hook: tribe catalog search and lookup.
 *
 * Data is bundled at build time (static JSON import).
 * All operations are synchronous — no loading states.
 */

import { useState, useMemo } from "react";
import { searchTribes, getTribeById } from "@/lib/tribeCatalog";
import type { Tribe } from "@/types/domain";

export function useTribeSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const results: Tribe[] = useMemo(
    () => (searchQuery.length >= 1 ? searchTribes(searchQuery, 20) : []),
    [searchQuery],
  );

  return { searchQuery, setSearchQuery, results, isLoading: false };
}

export function useTribeLookup(id: number | undefined) {
  return useMemo(() => {
    if (id === undefined) return null;
    return getTribeById(id) ?? null;
  }, [id]);
}
