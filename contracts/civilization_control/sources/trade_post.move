/// TradePost — SSU extension for cross-address marketplace trading.
///
/// Sellers authorize `TradeAuth` on their SSU, then create shared `Listing`
/// objects advertising items at a `Coin<EVE>` price. Buyers call `buy()` to
/// atomically withdraw the item from the seller's SSU and receive it via
/// `transfer::public_transfer`, while payment goes to the seller.
///
/// Key upstream dependency: `storage_unit::withdraw_item<Auth>` requires the
/// SSU to be online and the extension type to match `TradeAuth`. Items are
/// delivered directly to the buyer's address (not deposited into another SSU)
/// because `deposit_item<Auth>` enforces `parent_id == storage_unit_id`.
///
/// Pattern reference: world-contracts `storage_unit_tests::test_swap_ammo_for_lens`,
/// builder-scaffold `smart_gate_extension`. Witness mint is `public(package)`.
#[allow(lint(self_transfer))]
module civilization_control::trade_post;

use sui::{
    coin::Coin,
    event,
};
use assets::EVE::EVE;
use world::{
    character::Character,
    inventory::Item,
    storage_unit::{Self, StorageUnit},
};

// === Errors ===

#[error(code = 0)]
const ENotSeller: vector<u8> = b"Only the listing seller can perform this action";

#[error(code = 1)]
const EInsufficientPayment: vector<u8> = b"Payment coin value is less than the listing price";

#[error(code = 2)]
const ESsuMismatch: vector<u8> = b"Storage unit does not match the listing";

#[error(code = 3)]
const EQuantityZero: vector<u8> = b"Listing quantity must be greater than zero";

#[error(code = 4)]
const EPriceZero: vector<u8> = b"Listing price must be greater than zero";

// === Structs ===

/// Typed witness for SSU extension registration.
/// Only this package can instantiate it via `trade_auth()`.
public struct TradeAuth has drop {}

/// A marketplace listing. Shared object for discoverability.
/// Each listing represents a fixed-price offer for items in the seller's SSU.
public struct Listing has key {
    id: UID,
    /// The SSU containing the listed items.
    storage_unit_id: ID,
    /// Seller's address — receives payment on purchase.
    seller: address,
    /// Item type being sold (matches world inventory `type_id`).
    item_type_id: u64,
    /// Number of items offered in this listing.
    quantity: u32,
    /// Price in EVE base units for the entire listing.
    price: u64,
}

// === Events ===

public struct ListingCreatedEvent has copy, drop {
    listing_id: ID,
    storage_unit_id: ID,
    seller: address,
    item_type_id: u64,
    quantity: u32,
    price: u64,
}

public struct ListingPurchasedEvent has copy, drop {
    listing_id: ID,
    buyer: address,
    seller: address,
    item_type_id: u64,
    quantity: u32,
    price: u64,
}

public struct ListingCancelledEvent has copy, drop {
    listing_id: ID,
    seller: address,
    item_type_id: u64,
}

// === Package-internal witness mint ===

/// Mint the `TradeAuth` witness. Only callable within this package.
public(package) fun trade_auth(): TradeAuth { TradeAuth {} }

// === Public: Listing Lifecycle ===

/// Create a new listing for items in the caller's SSU.
///
/// The SSU must already have `TradeAuth` authorized as its extension.
/// The listing is shared so buyers can discover and purchase it.
/// This does NOT lock items — the seller retains full SSU access. If the
/// seller removes items before a buyer calls `buy()`, the buy will fail
/// at the `withdraw_item` step (insufficient quantity).
public fun create_listing(
    storage_unit: &StorageUnit,
    item_type_id: u64,
    quantity: u32,
    price: u64,
    ctx: &mut TxContext,
): Listing {
    assert!(quantity > 0, EQuantityZero);
    assert!(price > 0, EPriceZero);

    let storage_unit_id = object::id(storage_unit);
    let seller = ctx.sender();

    let listing = Listing {
        id: object::new(ctx),
        storage_unit_id,
        seller,
        item_type_id,
        quantity,
        price,
    };

    event::emit(ListingCreatedEvent {
        listing_id: object::id(&listing),
        storage_unit_id,
        seller,
        item_type_id,
        quantity,
        price,
    });

    listing
}

/// Purchase a listing. The buyer's transaction atomically:
/// 1. Withdraws the item from the seller's SSU (via `TradeAuth` extension)
/// 2. Transfers the item to the buyer
/// 3. Transfers payment to the seller
/// 4. Destroys the listing
///
/// Requirements:
/// - `storage_unit` must match `listing.storage_unit_id`
/// - `payment` must have value >= `listing.price`
/// - SSU must be online
/// - SSU must have sufficient inventory
///
/// Overpayment: exact change only. Caller should split the coin in the PTB.
public fun buy(
    storage_unit: &mut StorageUnit,
    character: &Character,
    listing: Listing,
    payment: Coin<EVE>,
    ctx: &mut TxContext,
): Item {
    let Listing {
        id,
        storage_unit_id,
        seller,
        item_type_id,
        quantity,
        price,
    } = listing;

    // Validate listing matches the provided SSU
    assert!(object::id(storage_unit) == storage_unit_id, ESsuMismatch);
    assert!(payment.value() >= price, EInsufficientPayment);

    // Withdraw item from seller's SSU via extension witness
    let item = storage_unit::withdraw_item<TradeAuth>(
        storage_unit,
        character,
        trade_auth(),
        item_type_id,
        quantity,
        ctx,
    );

    let buyer = ctx.sender();

    event::emit(ListingPurchasedEvent {
        listing_id: id.to_inner(),
        buyer,
        seller,
        item_type_id,
        quantity,
        price,
    });

    // Transfer payment to seller
    transfer::public_transfer(payment, seller);

    // Destroy listing
    id.delete();

    // Return item to caller — PTB or caller handles final transfer
    item
}

/// Cancel a listing. Only the original seller can cancel.
/// Items remain in the SSU (they were never locked).
public fun cancel_listing(
    listing: Listing,
    ctx: &mut TxContext,
) {
    let Listing {
        id,
        storage_unit_id: _,
        seller,
        item_type_id,
        quantity: _,
        price: _,
    } = listing;

    assert!(ctx.sender() == seller, ENotSeller);

    event::emit(ListingCancelledEvent {
        listing_id: id.to_inner(),
        seller,
        item_type_id,
    });

    id.delete();
}

/// Share a listing object. Call after `create_listing` in the PTB to make
/// the listing globally accessible for buyers.
public fun share_listing(listing: Listing) {
    transfer::share_object(listing);
}

// === View Functions ===

/// The SSU this listing is for.
public fun listing_storage_unit_id(listing: &Listing): ID {
    listing.storage_unit_id
}

/// The seller's address.
public fun listing_seller(listing: &Listing): address {
    listing.seller
}

/// The item type being sold.
public fun listing_item_type_id(listing: &Listing): u64 {
    listing.item_type_id
}

/// Number of items in the listing.
public fun listing_quantity(listing: &Listing): u32 {
    listing.quantity
}

/// Total price for the listing.
public fun listing_price(listing: &Listing): u64 {
    listing.price
}

// === Test Helpers ===

/// Create a listing without a real StorageUnit reference.
/// Allows unit testing listing lifecycle and validation independently
/// of world infrastructure.
#[test_only]
public fun create_listing_for_testing(
    storage_unit_id: ID,
    item_type_id: u64,
    quantity: u32,
    price: u64,
    ctx: &mut TxContext,
): Listing {
    assert!(quantity > 0, EQuantityZero);
    assert!(price > 0, EPriceZero);

    let seller = ctx.sender();
    let listing = Listing {
        id: object::new(ctx),
        storage_unit_id,
        seller,
        item_type_id,
        quantity,
        price,
    };

    event::emit(ListingCreatedEvent {
        listing_id: object::id(&listing),
        storage_unit_id,
        seller,
        item_type_id,
        quantity,
        price,
    });

    listing
}

/// Validate payment against a listing. Aborts with EInsufficientPayment
/// if the coin value is below the listing price. Used for isolated
/// payment validation testing without a real SSU.
#[test_only]
public fun buy_validate_payment_for_testing(
    listing: &Listing,
    payment: &Coin<EVE>,
) {
    assert!(payment.value() >= listing.price, EInsufficientPayment);
}
