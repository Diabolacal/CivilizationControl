/**
 * useTxDetails — Lazy-fetch hook for transaction proof data.
 *
 * Fetches on demand (not on mount), caches by digest so repeated
 * hovers are instant. Uses TanStack Query with `enabled: false` +
 * manual `refetch()`.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchTxProofData, type TxProofData } from "@/lib/txDetails";

export function useTxDetails(digest: string | null) {
  const query = useQuery<TxProofData>({
    queryKey: ["txProof", digest],
    queryFn: () => fetchTxProofData(digest!),
    enabled: false,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isFetching,
    isError: query.isError,
    fetch: query.refetch,
  };
}
