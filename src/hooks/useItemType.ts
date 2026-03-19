/**
 * Hooks: item-type catalog search and lookup.
 *
 * Data is bundled at build time (static JSON import).
 * All operations are synchronous — no loading states.
 */

import { useState, useMemo } from "react";
import {
  searchItemTypes,
  getItemTypeById,
  resolveItemTypeName,
  getTypeCatalogSize,
} from "@/lib/typeCatalog";
import type { ItemType } from "@/types/domain";

export function useItemTypeCatalog() {
  return {
    isLoading: false,
    isError: false,
    error: null as Error | null,
    catalogSize: getTypeCatalogSize(),
  };
}

export function useItemTypeSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const results: ItemType[] = useMemo(
    () => (searchQuery.length >= 1 ? searchItemTypes(searchQuery, 30) : []),
    [searchQuery],
  );

  return {
    searchQuery,
    setSearchQuery,
    results,
    isLoading: false,
  };
}

export function useItemTypeLookup(typeId: number | undefined) {
  return useMemo(() => {
    if (typeId === undefined) return null;
    return getItemTypeById(typeId) ?? null;
  }, [typeId]);
}

export { resolveItemTypeName };
