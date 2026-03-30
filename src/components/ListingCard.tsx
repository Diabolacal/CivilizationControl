/**
 * ListingCard — Marketplace listing display with buy and cancel actions.
 *
 * Shows resolved item name, quantity, price, and seller address.
 * Buy button for non-seller viewers, cancel button for the listing seller.
 */

import { useQuery } from "@tanstack/react-query";
import type { Listing, TxStatus } from "@/types/domain";
import { resolveItemTypeName } from "@/lib/typeCatalog";
import { formatLux, formatEve } from "@/lib/currency";
import { fetchPlayerProfile } from "@/lib/suiReader";
import { resolveTribeName } from "@/lib/tribeCatalog";

interface ListingCardProps {
  listing: Listing;
  txStatus: TxStatus;
  onBuy: (listingId: string, price: number) => void;
  walletAddress?: string;
  onCancel?: (listingId: string) => void;
  cancelTxStatus?: TxStatus;
}

export function ListingCard({
  listing,
  txStatus,
  onBuy,
  walletAddress,
  onCancel,
  cancelTxStatus = "idle",
}: ListingCardProps) {
  const isBuyBusy = txStatus === "pending";
  const isCancelBusy = cancelTxStatus === "pending";
  const isSeller =
    walletAddress != null &&
    listing.seller.toLowerCase() === walletAddress.toLowerCase();

  const { data: sellerProfile } = useQuery({
    queryKey: ["playerProfile", listing.seller],
    queryFn: () => fetchPlayerProfile(listing.seller),
    staleTime: 60_000,
  });

  return (
    <div className="border border-border rounded p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">Item</p>
          <p className="text-foreground">{resolveItemTypeName(listing.itemTypeId)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">Quantity</p>
          <p className="font-mono text-foreground">{listing.quantity}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">Price</p>
          <p className="font-mono text-foreground">
            {formatLux(listing.price)} Lux
            <span className="text-[10px] text-muted-foreground ml-1">
              ({formatEve(listing.price)} EVE)
            </span>
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">Seller</p>
          <p className="text-[11px] text-foreground truncate" title={listing.seller}>
            {sellerProfile?.characterName || `${listing.seller.slice(0, 10)}…${listing.seller.slice(-6)}`}
            {sellerProfile?.tribeId ? (
              <span className="text-muted-foreground ml-1.5 text-[10px]">
                {resolveTribeName(sellerProfile.tribeId)}
              </span>
            ) : null}
            {isSeller && (
              <span className="ml-1.5 text-[9px] text-primary/70">(you)</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex-1" />
        <div className="flex gap-2">
          {isSeller && onCancel ? (
            <button
              onClick={() => onCancel(listing.objectId)}
              disabled={isCancelBusy}
              className="text-xs px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCancelBusy ? "Cancelling…" : "Cancel Listing"}
            </button>
          ) : (
            <button
              onClick={() => onBuy(listing.objectId, listing.price)}
              disabled={isBuyBusy}
              className="text-xs px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBuyBusy ? "Executing…" : "Buy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
