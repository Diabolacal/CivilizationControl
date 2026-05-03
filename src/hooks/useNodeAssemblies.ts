import { useQuery } from "@tanstack/react-query";

import { fetchNodeAssembliesLookup, normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";

interface UseNodeAssembliesOptions {
  enabled?: boolean;
}

export function useNodeAssemblies(networkNodeId: string | null, options: UseNodeAssembliesOptions = {}) {
  const normalizedNodeId = normalizeCanonicalObjectId(networkNodeId);
  const isEnabled = options.enabled ?? true;

  const query = useQuery({
    queryKey: ["nodeAssemblies", normalizedNodeId],
    queryFn: () => fetchNodeAssembliesLookup(normalizedNodeId!),
    enabled: isEnabled && normalizedNodeId != null && normalizedNodeId !== `0x${"0".repeat(64)}`,
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