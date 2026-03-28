/**
 * useGatePolicyMutation — Sign-and-execute hook for gate policy changes.
 *
 * Wraps the PTB builders with dAppKit signing, status tracking, and
 * automatic cache invalidation on success. Requires the gate's
 * OwnerCap ID for authority via the borrow/return pattern.
 */

import { useCallback, useState } from "react";
import {
  buildSetPolicyPresetTx,
  buildRemovePolicyPresetTx,
  buildSetTreasuryTx,
  buildBatchSetPolicyPresetTx,
} from "@/lib/gatePolicyTx";
import { useInvalidateGatePolicy } from "@/hooks/useGatePolicy";
import { useCharacterId } from "@/hooks/useCharacter";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import type { ObjectId, TxStatus, TxResult, TribePolicyEntry, GatePolicyTarget } from "@/types/domain";

export function useGatePolicyMutation(gateId: ObjectId, ownerCapId: string) {
  const executeTx = useSponsoredExecution();
  const invalidate = useInvalidateGatePolicy();
  const characterId = useCharacterId();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (buildTx: () => ReturnType<typeof buildSetPolicyPresetTx>) => {
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildTx();
        const { digest } = await executeTx(tx);
        setResult({ digest });
        setStatus("success");
        invalidate(gateId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [executeTx, gateId, invalidate],
  );

  const setPreset = useCallback(
    (mode: number, entries: TribePolicyEntry[], defaultAccess: boolean, defaultToll: number) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildSetPolicyPresetTx(gateId, mode, entries, defaultAccess, defaultToll, ownerCapId, characterId));
    },
    [execute, gateId, ownerCapId, characterId],
  );

  const removePreset = useCallback(
    (mode: number) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildRemovePolicyPresetTx(gateId, mode, ownerCapId, characterId));
    },
    [execute, gateId, ownerCapId, characterId],
  );

  const setTreasury = useCallback(
    (treasury: string) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildSetTreasuryTx(gateId, treasury, ownerCapId, characterId));
    },
    [execute, gateId, ownerCapId, characterId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    setPreset,
    removePreset,
    setTreasury,
    reset,
  };
}

/**
 * useBatchPresetMutation — Sign-and-execute hook for deploying a preset
 * to multiple owned gates in a single PTB.
 *
 * Invalidates policy cache for all affected gates on success.
 */
export function useBatchPresetMutation() {
  const executeTx = useSponsoredExecution();
  const invalidate = useInvalidateGatePolicy();
  const characterId = useCharacterId();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deployPreset = useCallback(
    async (
      targets: GatePolicyTarget[],
      mode: number,
      entries: TribePolicyEntry[],
      defaultAccess: boolean,
      defaultToll: number,
    ) => {
      if (targets.length === 0) return;
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildBatchSetPolicyPresetTx(targets, mode, entries, defaultAccess, defaultToll, characterId);
        const { digest } = await executeTx(tx);
        setResult({ digest });
        setStatus("success");
        for (const target of targets) {
          invalidate(target.gateId);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [executeTx, invalidate, characterId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, deployPreset, reset };
}
