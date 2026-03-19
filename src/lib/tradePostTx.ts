/**
 * TradePost PTB builders.
 *
 * Constructs Programmable Transaction Blocks for marketplace operations:
 *   - create_listing: seller creates a shared Listing object
 *   - cancel_listing: seller destroys their own Listing
 *   - buy: buyer purchases a listing, receives Item
 *
 * Settlement token: EVE (Coin<EVE> from assets package).
 *
 * Move signatures:
 *   create_listing(&StorageUnit, u64, u32, u64, &mut TxContext) -> Listing
 *   share_listing(Listing)
 *   cancel_listing(Listing, &mut TxContext)
 *   buy(&mut StorageUnit, &Character, Listing, Coin<EVE>, &mut TxContext) -> Item
 */

import { Transaction } from "@mysten/sui/transactions";
import { CC_PACKAGE_ID } from "@/constants";
import type { ObjectId } from "@/types/domain";

/**
 * Build PTB: buy listing with EVE payment.
 *
 * The caller must provide `eveCoinId` — the object ID of an EVE coin
 * with sufficient balance. Use `fetchEveCoinObjects` + `selectEveCoin`
 * from `@/lib/currency` to discover it before building the PTB.
 */
export function buildBuyListingTx(
  storageUnitId: ObjectId,
  characterId: ObjectId,
  listingId: ObjectId,
  price: number,
  buyerAddress: string,
  eveCoinId: ObjectId,
): Transaction {
  const tx = new Transaction();

  // Split exact payment from the buyer's EVE coin object
  const [payment] = tx.splitCoins(tx.object(eveCoinId), [tx.pure.u64(BigInt(price))]);

  // Call buy() — consumes listing, returns Item
  const item = tx.moveCall({
    target: `${CC_PACKAGE_ID}::trade_post::buy`,
    arguments: [
      tx.object(storageUnitId),
      tx.object(characterId),
      tx.object(listingId),
      payment,
    ],
  });

  // Transfer the returned Item to the buyer
  tx.transferObjects([item], tx.pure.address(buyerAddress));

  return tx;
}

/**
 * Build PTB: create_listing + share_listing.
 *
 * Seller creates a new Listing for an item in their SSU, then shares it
 * so it becomes discoverable on-chain.
 */
export function buildCreateListingTx(
  storageUnitId: ObjectId,
  itemTypeId: number,
  quantity: number,
  price: number,
): Transaction {
  const tx = new Transaction();

  // create_listing returns a Listing object (not yet shared)
  const listing = tx.moveCall({
    target: `${CC_PACKAGE_ID}::trade_post::create_listing`,
    arguments: [
      tx.object(storageUnitId),
      tx.pure.u64(BigInt(itemTypeId)),
      tx.pure.u32(quantity),
      tx.pure.u64(BigInt(price)),
    ],
  });

  // share_listing makes it discoverable
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::trade_post::share_listing`,
    arguments: [listing],
  });

  return tx;
}

/**
 * Build PTB: cancel_listing.
 *
 * Seller cancels their own listing, destroying the shared object.
 * On-chain asserts ctx.sender() == listing.seller.
 */
export function buildCancelListingTx(listingId: ObjectId): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CC_PACKAGE_ID}::trade_post::cancel_listing`,
    arguments: [tx.object(listingId)],
  });

  return tx;
}
