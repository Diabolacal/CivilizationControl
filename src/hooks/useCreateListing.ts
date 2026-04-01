/**
 * useCreateListing — Sign-and-execute hook for creating marketplace listings.
 *
 * Wraps the create_listing + share_listing PTB with dAppKit signing,
 * status tracking, and automatic listing cache invalidation on success.
 */

import { useCallback, useState } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import { buildCreateListingTx } from "@/lib/tradePostTx";
import { useInvalidateListings } from "@/hooks/useListings";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

export function useCreateListing(storageUnitId: ObjectId) {
  const executeTx = useSponsoredExecution();
  const { walletAddress } = useConnection();
  const invalidate = useInvalidateListings();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createListing = useCallback(
    async (itemTypeId: number, quantity: number, price: number) => {
      if (!walletAddress) {
        setError("Wallet not connected");
        setStatus("error");
        return;
      }

      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        const tx = buildCreateListingTx(storageUnitId, itemTypeId, quantity, price);
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

  return { status, result, error, createListing, reset };
}
