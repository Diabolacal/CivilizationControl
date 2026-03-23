/**
 * useTransitProof — Operator self-test for transit proof events.
 *
 * Provides:
 *   - Linked gate discovery (query)
 *   - Transit proof execution (sign-and-execute)
 *
 * Generates TribeCheckPassedEvent (if tribe rule set) and
 * TollCollectedEvent (if coin toll set) by calling request_jump_permit
 * on the operator's own character.
 */

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { fetchLinkedGateId } from "@/lib/suiReader";
import {
  buildTransitProofFreeTx,
  buildTransitProofWithTollTx,
} from "@/lib/transitProofTx";
import { fetchEveCoinObjects, selectEveCoin } from "@/lib/currency";
import { useCharacterId } from "@/hooks/useCharacter";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

/** Query the linked destination gate for a given gate. */
export function useLinkedGate(gateId: ObjectId | undefined) {
  return useQuery({
    queryKey: ["linkedGate", gateId],
    queryFn: () => fetchLinkedGateId(gateId!),
    enabled: !!gateId,
    staleTime: 60_000,
  });
}

/** Execute a transit proof transaction. */
export function useTransitProofAction() {
  const dAppKit = useDAppKit();
  const { walletAddress } = useConnection();
  const queryClient = useQueryClient();
  const characterId = useCharacterId();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      sourceGateId: ObjectId,
      destinationGateId: ObjectId,
      effectiveToll: number,
    ) => {
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        let tx;
        if (effectiveToll > 0) {
          if (!walletAddress) throw new Error("Wallet not connected");
          const eveCoins = await fetchEveCoinObjects(walletAddress);
          const selected = selectEveCoin(eveCoins, effectiveToll);
          if (!selected) throw new Error("Insufficient EVE balance for toll");

          tx = buildTransitProofWithTollTx({
            sourceGateId,
            destinationGateId,
            eveCoinId: selected.coinObjectId,
            tollPrice: effectiveToll,
            characterId,
          });
        } else {
          tx = buildTransitProofFreeTx({ sourceGateId, destinationGateId, characterId });
        }

        const res = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          res.$kind === "Transaction" ? res.Transaction : res.FailedTransaction;
        if (!txData || res.$kind === "FailedTransaction") {
          throw new Error("Transit proof transaction failed on-chain");
        }

        setResult({ digest: txData.digest });
        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["signalFeed"] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(parseTransitError(message));
        setStatus("error");
      }
    },
    [dAppKit, walletAddress, queryClient, characterId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, execute, reset };
}

function parseTransitError(raw: string): string {
  if (raw.includes("EAccessDenied"))
    return "Character tribe is denied access by the active policy preset.";
  if (raw.includes("EInsufficientToll"))
    return "EVE payment is less than the required toll.";
  if (raw.includes("ETollRequired"))
    return "A toll is required for this route but was not provided.";
  if (raw.includes("EExtensionNotAuthorized"))
    return "Both gates must have GateAuth extension authorized.";
  return raw;
}
