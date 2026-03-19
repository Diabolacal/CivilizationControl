/**
 * useListings — TanStack Query hook for fetching live marketplace listings.
 *
 * Discovers listings via ListingCreatedEvent queries, then verifies
 * which are still alive (not bought/cancelled). Optionally filters
 * by a specific storage unit.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchListings } from "@/lib/suiReader";
import type { ObjectId, Listing } from "@/types/domain";

const LISTINGS_KEY = "listings";

export function useListings(storageUnitId?: ObjectId) {
  const query = useQuery<Listing[]>({
    queryKey: [LISTINGS_KEY, storageUnitId ?? "all"],
    queryFn: () => fetchListings(storageUnitId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  return {
    listings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Invalidate listings cache — call after successful buy/cancel. */
export function useInvalidateListings() {
  const queryClient = useQueryClient();
  return (storageUnitId?: ObjectId) =>
    queryClient.invalidateQueries({
      queryKey: storageUnitId ? [LISTINGS_KEY, storageUnitId] : [LISTINGS_KEY],
    });
}
