/**
 * useBuyListing — Sign-and-execute hook for marketplace purchases.
 *
 * Wraps the buy PTB builder with dAppKit signing, status tracking,
 * and automatic listing cache invalidation on success.
 */

import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { buildBuyListingTx } from "@/lib/tradePostTx";
import { fetchEveCoinObjects, selectEveCoin } from "@/lib/currency";
import { useInvalidateListings } from "@/hooks/useListings";
import { CHARACTER_ID } from "@/constants";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

export function useBuyListing(storageUnitId: ObjectId) {
  const dAppKit = useDAppKit();
  const { walletAddress } = useConnection();
  const invalidate = useInvalidateListings();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(
    async (listingId: ObjectId, price: number) => {
      if (!walletAddress) {
        setError("Wallet not connected");
        setStatus("error");
        return;
      }

      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        // Discover EVE coins in the buyer's wallet
        const eveCoins = await fetchEveCoinObjects(walletAddress);
        const selected = selectEveCoin(eveCoins, price);
        if (!selected) {
          throw new Error("Insufficient EVE balance for this purchase");
        }

        const tx = buildBuyListingTx(
          storageUnitId,
          CHARACTER_ID,
          listingId,
          price,
          walletAddress,
          selected.coinObjectId,
        );

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

  return { status, result, error, buy, reset };
}
