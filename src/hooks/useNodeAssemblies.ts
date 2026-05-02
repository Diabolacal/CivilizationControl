import { useQuery } from "@tanstack/react-query";

import { fetchNodeAssembliesLookup, normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";

export function useNodeAssemblies(networkNodeId: string | null) {
  const normalizedNodeId = normalizeCanonicalObjectId(networkNodeId);

  const query = useQuery({
    queryKey: ["nodeAssemblies", normalizedNodeId],
    queryFn: () => fetchNodeAssembliesLookup(normalizedNodeId!),
    enabled: normalizedNodeId != null && normalizedNodeId !== `0x${"0".repeat(64)}`,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    lookup: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}