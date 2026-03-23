/**
 * useGatePolicy — TanStack Query hook for fetching gate policy presets.
 *
 * Reads PolicyPreset and TreasuryKey dynamic fields from the shared
 * GateConfig object for a specific gate.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGateRules } from "@/lib/suiReader";
import type { ObjectId, GatePolicy } from "@/types/domain";

const GATE_POLICY_KEY = "gatePolicy";

export function useGatePolicy(gateId: ObjectId | undefined) {
  const query = useQuery<GatePolicy>({
    queryKey: [GATE_POLICY_KEY, gateId],
    queryFn: () => fetchGateRules(gateId!),
    enabled: !!gateId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    policy: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Invalidate gate policy cache — call after successful mutation. */
export function useInvalidateGatePolicy() {
  const queryClient = useQueryClient();
  return (gateId: ObjectId) =>
    queryClient.invalidateQueries({ queryKey: [GATE_POLICY_KEY, gateId] });
}
