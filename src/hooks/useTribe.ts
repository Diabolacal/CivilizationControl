/**
 * Hook: tribe catalog search and lookup.
 *
 * Data starts from the bundled snapshot and becomes reactive when
 * useTribesRefresh() merges live API data into the catalog.
 */

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  searchTribes,
  getTribeById,
  subscribeCatalog,
  getCatalogVersion,
} from "@/lib/tribeCatalog";
import type { Tribe } from "@/types/domain";

export function useTribeSearch() {
  const version = useSyncExternalStore(subscribeCatalog, getCatalogVersion);
  const [searchQuery, setSearchQuery] = useState("");

  const results: Tribe[] = useMemo(
    () => (searchQuery.length >= 1 ? searchTribes(searchQuery, 20) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, version],
  );

  return { searchQuery, setSearchQuery, results, isLoading: false };
}

export function useTribeLookup(id: number | undefined) {
  const version = useSyncExternalStore(subscribeCatalog, getCatalogVersion);

  return useMemo(() => {
    if (id === undefined) return null;
    return getTribeById(id) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, version]);
}
