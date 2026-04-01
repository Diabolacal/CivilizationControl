/**
 * useCancelListing — Sign-and-execute hook for cancelling marketplace listings.
 *
 * Wraps the cancel_listing PTB with dAppKit signing, status tracking,
 * and automatic listing cache invalidation on success.
 */

import { useCallback, useState } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import { buildCancelListingTx } from "@/lib/tradePostTx";
import { useInvalidateListings } from "@/hooks/useListings";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

export function useCancelListing(storageUnitId: ObjectId) {
  const executeTx = useSponsoredExecution();
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
        const { digest } = await executeTx(tx);

        setResult({ digest });
        setStatus("success");
        invalidate(storageUnitId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [executeTx, walletAddress, storageUnitId, invalidate],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, cancelListing, reset };
}
