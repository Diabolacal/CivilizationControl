/**
 * useCancelListing — Sign-and-execute hook for cancelling marketplace listings.
 *
 * Wraps the cancel_listing PTB with dAppKit signing, status tracking,
 * and automatic listing cache invalidation on success.
 */

import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { buildCancelListingTx } from "@/lib/tradePostTx";
import { useInvalidateListings } from "@/hooks/useListings";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

export function useCancelListing(storageUnitId: ObjectId) {
  const dAppKit = useDAppKit();
  const { walletAddress } = useConnection();
  const invalidate = useInvalidateListings();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelListing = useCallback(
    async (listingId: ObjectId) => {
      if (!walletAddress) {
        setError("Wallet not connected");
        setStatus("error");
        return;
      }

      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        const tx = buildCancelListingTx(listingId);
        const res = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          res.$kind === "Transaction" ? res.Transaction : res.FailedTransaction;
        if (!txData || res.$kind === "FailedTransaction") {
          throw new Error("Transaction failed on-chain");
        }

        setResult({ digest: txData.digest });
        setStatus("success");
        invalidate(storageUnitId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [dAppKit, walletAddress, storageUnitId, invalidate],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, cancelListing, reset };
}
