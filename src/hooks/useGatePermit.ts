/**
 * useGatePermit — Player-facing gate data loading + permit execution.
 *
 * Orchestrates:
 *   1. Player profile discovery (wallet → character)
 *   2. Gate policy loading (tribe rule, coin toll)
 *   3. Linked gate discovery
 *   4. Permit transaction execution (free or paid)
 */

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import { fetchPlayerProfile, fetchGateRules, fetchLinkedGateId, fetchPosture } from "@/lib/suiReader";
import { fetchEveCoinObjects, selectEveCoin } from "@/lib/currency";
import { buildPermitFreeTx, buildPermitTollTx } from "@/lib/gatePermitTx";
import { resolveEffectivePolicy } from "@/lib/policyResolver";
import type { ObjectId, TxStatus, GatePolicy, PostureMode } from "@/types/domain";

/** Gate state assembled from multiple RPC reads. */
export interface GatePermitState {
  linkedGateId: ObjectId | null;
  policy: GatePolicy | null;
  posture: PostureMode;
  effectiveToll: number;
  accessAllowed: boolean;
  playerCharacterId: ObjectId | null;
  playerCharacterName: string;
  playerTribeId: number;
}

/** Load all data needed for the permit page. */
export function useGateData(gateId: ObjectId | undefined) {
  const { walletAddress } = useConnection();

  return useQuery({
    queryKey: ["gatePermit", gateId, walletAddress],
    queryFn: async (): Promise<GatePermitState> => {
      const [policy, linkedGateId, profile, posture] = await Promise.all([
        fetchGateRules(gateId!),
        fetchLinkedGateId(gateId!),
        walletAddress ? fetchPlayerProfile(walletAddress) : null,
        fetchPosture(gateId!),
      ]);

      const tribeId = profile?.tribeId ?? 0;
      const resolved = resolveEffectivePolicy(policy, posture, tribeId);

      return {
        linkedGateId,
        policy,
        posture,
        effectiveToll: resolved.toll,
        accessAllowed: resolved.access,
        playerCharacterId: profile?.characterId ?? null,
        playerCharacterName: profile?.characterName ?? "",
        playerTribeId: tribeId,
      };
    },
    enabled: !!gateId,
    staleTime: 30_000,
  });
}

/** Execute the permit acquisition transaction. */
export function usePermitAction() {
  const executeTx = useSponsoredExecution();
  const { walletAddress } = useConnection();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [digest, setDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (state: GatePermitState, sourceGateId: ObjectId) => {
      setStatus("pending");
      setError(null);
      setDigest(null);

      try {
        if (!state.playerCharacterId) throw new Error("No character found for this wallet.");
        if (!state.linkedGateId) throw new Error("Gate has no linked destination.");

        let tx;
        if (state.effectiveToll > 0) {
          if (!walletAddress) throw new Error("Wallet not connected.");
          const coins = await fetchEveCoinObjects(walletAddress);
          const selected = selectEveCoin(coins, state.effectiveToll);
          if (!selected) throw new Error("Insufficient EVE balance for toll.");

          tx = buildPermitTollTx({
            sourceGateId,
            destinationGateId: state.linkedGateId,
            characterId: state.playerCharacterId,
            eveCoinId: selected.coinObjectId,
            tollPrice: state.effectiveToll,
          });
        } else {
          tx = buildPermitFreeTx({
            sourceGateId,
            destinationGateId: state.linkedGateId,
            characterId: state.playerCharacterId,
          });
        }

        const { digest: txDigest } = await executeTx(tx);

        setDigest(txDigest);
        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["gatePermit"] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(parsePermitError(message));
        setStatus("error");
      }
    },
    [executeTx, walletAddress, queryClient],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setDigest(null);
    setError(null);
  }, []);

  return { status, digest, error, execute, reset };
}

function parsePermitError(raw: string): string {
  if (raw.includes("EAccessDenied"))
    return "Your tribe is not permitted to pass through this gate.";
  if (raw.includes("EInsufficientToll"))
    return "Insufficient EVE to pay the required toll.";
  if (raw.includes("ETollRequired"))
    return "A toll is required for this route but was not provided.";
  if (raw.includes("EExtensionNotAuthorized"))
    return "Gate extension is not authorized. Contact the gate operator.";
  return raw;
}
