/**
 * useSsuInventory — TanStack Query hook for SSU inventory enumeration.
 *
 * Reads inventory dynamic fields from the StorageUnit on-chain object.
 * Returns flattened inventory entries from all inventory slots.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSsuInventory } from "@/lib/suiReader";
import type { ObjectId, InventorySlot, InventoryEntry } from "@/types/domain";
import { useMemo } from "react";

const INVENTORY_KEY = "ssu-inventory";

export function useSsuInventory(storageUnitId?: ObjectId) {
  const query = useQuery<InventorySlot[]>({
    queryKey: [INVENTORY_KEY, storageUnitId ?? "none"],
    queryFn: () => fetchSsuInventory(storageUnitId!),
    enabled: !!storageUnitId,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  /** Flatten all items from all inventory slots into a single list. */
  const items: InventoryEntry[] = useMemo(() => {
    if (!query.data) return [];
    const all: InventoryEntry[] = [];
    for (const slot of query.data) {
      for (const item of slot.items) {
        // Merge duplicates (same typeId across slots)
        const existing = all.find((e) => e.typeId === item.typeId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          all.push({ ...item });
        }
      }
    }
    return all.sort((a, b) => a.typeId - b.typeId);
  }, [query.data]);

  return {
    slots: query.data ?? [],
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useInvalidateSsuInventory() {
  const queryClient = useQueryClient();
  return (storageUnitId?: ObjectId) =>
    queryClient.invalidateQueries({
      queryKey: storageUnitId
        ? [INVENTORY_KEY, storageUnitId]
        : [INVENTORY_KEY],
    });
}
