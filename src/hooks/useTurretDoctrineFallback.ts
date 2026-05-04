import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostureMode } from "@/types/domain";

const TURRET_DOCTRINE_FALLBACK_KEY = ["turretDoctrineFallback"] as const;

export function useTurretDoctrineFallback() {
  const queryClient = useQueryClient();
  const query = useQuery<PostureMode | null>({
    queryKey: TURRET_DOCTRINE_FALLBACK_KEY,
    queryFn: async () => null,
    enabled: false,
    initialData: null,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const setMode = useCallback((mode: PostureMode | null) => {
    queryClient.setQueryData(TURRET_DOCTRINE_FALLBACK_KEY, mode);
  }, [queryClient]);

  return {
    mode: query.data ?? null,
    setMode,
  };
}