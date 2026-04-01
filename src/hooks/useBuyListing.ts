/**
 * useBuyListing — Sign-and-execute hook for marketplace purchases.
 *
 * Wraps the buy PTB builder with dAppKit signing, status tracking,
 * and automatic listing cache invalidation on success.
 */

import { useCallback, useState } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import { buildBuyListingTx } from "@/lib/tradePostTx";
import { fetchEveCoinObjects, selectEveCoin } from "@/lib/currency";
import { useInvalidateListings } from "@/hooks/useListings";
import { useCharacterId } from "@/hooks/useCharacter";
import { fetchPlayerProfile } from "@/lib/suiReader";
import type { ObjectId, TxStatus, TxResult } from "@/types/domain";

export function useBuyListing(storageUnitId: ObjectId) {
  const executeTx = useSponsoredExecution();
  const { walletAddress } = useConnection();
  const invalidate = useInvalidateListings();
  const contextCharacterId = useCharacterId();

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
        // Resolve character: prefer context (operator shell), fall back to wallet discovery
        let resolvedCharacterId = contextCharacterId;
        if (!resolvedCharacterId) {
          const profile = await fetchPlayerProfile(walletAddress);
          resolvedCharacterId = profile?.characterId ?? null;
        }
        if (!resolvedCharacterId) {
          throw new Error("No EVE Frontier character found for this wallet.");
        }

        // Discover EVE coins in the buyer's wallet
        const eveCoins = await fetchEveCoinObjects(walletAddress);
        const selected = selectEveCoin(eveCoins, price);
        if (!selected) {
          throw new Error("Insufficient EVE balance for this purchase");
        }

        const tx = buildBuyListingTx(
          storageUnitId,
          resolvedCharacterId,
          listingId,
          price,
          selected.coinObjectId,
        );

        const res = await executeTx(tx);

        setResult({ digest: res.digest });
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

  return { status, result, error, buy, reset };
}
