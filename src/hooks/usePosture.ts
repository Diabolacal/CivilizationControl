/**
 * usePosture — Read + mutate per-gate posture state.
 *
 * Reads the current posture from a specific gate's GateConfig DF.
 * Provides a single `switchPosture` function that builds and executes
 * the posture switch PTB (gates + turrets in one transaction).
 */

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPosture } from "@/lib/suiReader";
import { buildPostureSwitchTx } from "@/lib/postureSwitchTx";
import { useCharacterId } from "@/hooks/useCharacter";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import type {
  PostureMode,
  TxStatus,
  TxResult,
  TurretSwitchTarget,
  GatePostureTarget,
} from "@/types/domain";

/**
 * Hook to read the current posture for a specific gate.
 * When gateId is undefined, the query is disabled and returns 'commercial'.
 *
 * Pass `aggressiveRefetch: true` during posture transitions to poll
 * every 4 seconds instead of the normal 30-second interval.
 */
export function usePostureState(gateId?: string, aggressiveRefetch = false) {
  return useQuery({
    queryKey: ["posture", gateId],
    queryFn: () => fetchPosture(gateId!),
    enabled: !!gateId,
    staleTime: aggressiveRefetch ? 2_000 : 15_000,
    refetchInterval: aggressiveRefetch ? 4_000 : 30_000,
  });
}

interface SwitchPostureParams {
  targetMode: PostureMode;
  gates: GatePostureTarget[];
  turrets: TurretSwitchTarget[];
}

/** Hook to execute a posture switch transaction. */
export function usePostureSwitch() {
  const executeTx = useSponsoredExecution();
  const queryClient = useQueryClient();
  const characterId = useCharacterId();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const switchPosture = useCallback(
    async (params: SwitchPostureParams) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildPostureSwitchTx({
          targetMode: params.targetMode,
          gates: params.gates,
          turrets: params.turrets,
          characterId,
        });
        const { digest } = await executeTx(tx);
        setResult({ digest });
        setStatus("success");
        // Invalidate posture + signal feed + asset caches
        queryClient.invalidateQueries({ queryKey: ["posture"] });
        queryClient.invalidateQueries({ queryKey: ["signalFeed"] });
        queryClient.invalidateQueries({ queryKey: ["gatePolicy"] });
        queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(parseMoveAbort(message));
        setStatus("error");
      }
    },
    [executeTx, queryClient, characterId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, switchPosture, reset };
}

/** Map known Move abort codes to user-friendly messages. */
function parseMoveAbort(raw: string): string {
  if (raw.includes("ECoinTollNotSet")) return "A gate was missing its toll setting — try again.";
  if (raw.includes("EInvalidPosture")) return "Invalid posture mode.";
  if (raw.includes("ETribeNotAllowed")) return "Tribe filter mismatch.";
  if (raw.includes("EAssemblyInvalidStatus")) return "A structure is already in the target state.";
  return raw;
}
