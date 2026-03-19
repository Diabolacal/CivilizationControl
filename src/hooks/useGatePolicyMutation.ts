/**
 * useGatePolicyMutation — Sign-and-execute hook for gate policy changes.
 *
 * Wraps the PTB builders with dAppKit signing, status tracking, and
 * automatic cache invalidation on success.
 */

import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import {
  buildSetTribeRuleTx,
  buildRemoveTribeRuleTx,
  buildSetCoinTollTx,
  buildRemoveCoinTollTx,
} from "@/lib/gatePolicyTx";
import { useInvalidateGatePolicy } from "@/hooks/useGatePolicy";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

export function useGatePolicyMutation(gateId: ObjectId) {
  const dAppKit = useDAppKit();
  const invalidate = useInvalidateGatePolicy();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (buildTx: () => ReturnType<typeof buildSetTribeRuleTx>) => {
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildTx();
        const res = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          res.$kind === "Transaction" ? res.Transaction : res.FailedTransaction;
        if (!txData || res.$kind === "FailedTransaction") {
          throw new Error("Transaction failed on-chain");
        }
        setResult({ digest: txData.digest });
        setStatus("success");
        invalidate(gateId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [dAppKit, gateId, invalidate],
  );

  const setTribeRule = useCallback(
    (tribe: number) => execute(() => buildSetTribeRuleTx(gateId, tribe)),
    [execute, gateId],
  );

  const removeTribeRule = useCallback(
    () => execute(() => buildRemoveTribeRuleTx(gateId)),
    [execute, gateId],
  );

  const setCoinToll = useCallback(
    (price: number, treasury: string) =>
      execute(() => buildSetCoinTollTx(gateId, price, treasury)),
    [execute, gateId],
  );

  const removeCoinToll = useCallback(
    () => execute(() => buildRemoveCoinTollTx(gateId)),
    [execute, gateId],
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
    setTribeRule,
    removeTribeRule,
    setCoinToll,
    removeCoinToll,
    reset,
  };
}
