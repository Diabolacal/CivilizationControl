import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchGatePolicies } from "@/lib/suiReader";
import type { GatePolicy } from "@/types/domain";

export function useGatePolicyBatch(gateIds: string[]) {
  const gateKey = gateIds.join("|");
  const uniqueGateIds = useMemo(() => Array.from(new Set(gateIds)), [gateKey]);

  return useQuery<GatePolicy[]>({
    queryKey: ["gatePolicyBatch", uniqueGateIds],
    queryFn: () => fetchBatchGatePolicies(uniqueGateIds),
    enabled: uniqueGateIds.length > 0,
    staleTime: 15_000,
  });
}