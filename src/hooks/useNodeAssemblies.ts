import { useQuery } from "@tanstack/react-query";

import { getSharedBackendBaseUrl } from "@/lib/assemblySummaryClient";
import { fetchNodeAssembliesLookup, normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";

interface UseNodeAssembliesOptions {
  enabled?: boolean;
}

export function useNodeAssemblies(networkNodeId: string | null, options: UseNodeAssembliesOptions = {}) {
  const normalizedNodeId = normalizeCanonicalObjectId(networkNodeId);
  const isEnabled = options.enabled ?? true;
  const sharedBackendBaseUrl = getSharedBackendBaseUrl();

  const query = useQuery({
    queryKey: ["nodeAssemblies", sharedBackendBaseUrl, normalizedNodeId],
    queryFn: () => fetchNodeAssembliesLookup(normalizedNodeId!, { baseUrl: sharedBackendBaseUrl }),
    enabled: isEnabled && normalizedNodeId != null && normalizedNodeId !== `0x${"0".repeat(64)}`,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: "always",
    retry: false,
  });

  return {
    lookup: query.data ?? null,
    isLoading: query.isLoading,
    hasAttempted: query.fetchStatus !== "idle" || query.data != null || query.isError,
    refetch: query.refetch,
  };
}