/**
 * usePosture — Read + mutate network posture state.
 *
 * Reads the current posture from GateConfig DF. Provides a single
 * `switchPosture` function that builds and executes the posture switch
 * PTB (gates + turrets + posture record in one transaction).
 */

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { fetchPosture } from "@/lib/suiReader";
import { buildPostureSwitchTx } from "@/lib/postureSwitchTx";
import type {
  PostureMode,
  TxStatus,
  TxResult,
  TurretSwitchTarget,
} from "@/types/domain";

/** Hook to read the current network posture. */
export function usePostureState() {
  return useQuery({
    queryKey: ["posture"],
    queryFn: fetchPosture,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

interface SwitchPostureParams {
  targetMode: PostureMode;
  turrets: TurretSwitchTarget[];
}

/** Hook to execute a posture switch transaction. */
export function usePostureSwitch() {
  const dAppKit = useDAppKit();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const switchPosture = useCallback(
    async (params: SwitchPostureParams) => {
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildPostureSwitchTx({
          targetMode: params.targetMode,
          turrets: params.turrets,
        });
        const res = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          res.$kind === "Transaction" ? res.Transaction : res.FailedTransaction;
        if (!txData || res.$kind === "FailedTransaction") {
          throw new Error("Posture switch transaction failed on-chain");
        }
        setResult({ digest: txData.digest });
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
    [dAppKit, queryClient],
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
  if (raw.includes("EAlreadyInPosture")) return "Network is already in this posture.";
  if (raw.includes("ECoinTollNotSet")) return "A gate was missing its toll setting — try again.";
  if (raw.includes("EInvalidPosture")) return "Invalid posture mode.";
  if (raw.includes("ETribeNotAllowed")) return "Tribe filter mismatch.";
  if (raw.includes("EAssemblyInvalidStatus")) return "A structure is already in the target state.";
  return raw;
}
