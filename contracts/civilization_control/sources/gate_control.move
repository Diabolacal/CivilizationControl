/// GateControl — typed witness gate extension for CivilizationControl.
///
/// Registers a `GateAuth` witness on Smart Gates. Intercepts all jump attempts
/// and enforces configurable rules (tribe filter, coin toll) before issuing a
/// `JumpPermit`. Rules are stored as dynamic fields on a shared `GateConfig`
/// object, keyed by gate ID for per-gate differentiation.
///
/// Pattern reference: builder-scaffold `smart_gate_extension` + world-contracts
/// extension_examples. Witness mint is `public(package)` per convention.
#[allow(lint(self_transfer))]
module civilization_control::gate_control;

use sui::{
    clock::Clock,
    coin::Coin,
    dynamic_field as df,
    event,
};
use assets::EVE::EVE;
use world::{
    character::Character,
    gate::{Self, Gate},
};

// === Errors ===

#[error(code = 0)]
const ETribeNotAllowed: vector<u8> = b"Character tribe does not match the gate tribe rule";

#[error(code = 1)]
const EInsufficientToll: vector<u8> = b"Payment coin value is less than the required toll";

#[error(code = 2)]
const ETribeRuleNotSet: vector<u8> = b"No tribe rule configured for this gate";

#[error(code = 3)]
const ECoinTollNotSet: vector<u8> = b"No coin toll configured for this gate";

#[error(code = 4)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp would overflow";

// === Structs ===

/// Shared configuration object. Per-gate rules stored as dynamic fields
/// keyed by `TribeRuleKey { gate_id }` / `CoinTollKey { gate_id }`.
public struct GateConfig has key {
    id: UID,
}

/// Admin capability — created during `init`, authorizes rule mutations.
public struct AdminCap has key, store {
    id: UID,
}

/// Typed witness for gate extension registration and permit issuance.
/// Only this package can instantiate it via `gate_auth()`.
public struct GateAuth has drop {}

// === Rule Key / Value Structs ===

/// Per-gate tribe filter rule. When present, only characters whose
/// `tribe_id` matches `tribe` may receive a jump permit.
public struct TribeRuleKey has copy, drop, store { gate_id: ID }
public struct TribeRule has drop, store { tribe: u32 }

/// Per-gate coin toll rule. When present, a `Coin<EVE>` of at least
/// `price` must accompany the permit request. Payment is forwarded
/// to `treasury`.
public struct CoinTollKey has copy, drop, store { gate_id: ID }
public struct CoinTollRule has drop, store {
    price: u64,
    treasury: address,
}

// === Events ===

public struct TribeCheckPassedEvent has copy, drop {
    gate_id: ID,
    character_id: ID,
    tribe_id: u32,
}

public struct TollCollectedEvent has copy, drop {
    gate_id: ID,
    character_id: ID,
    amount: u64,
    treasury: address,
}

public struct TribeRuleSetEvent has copy, drop {
    gate_id: ID,
    tribe: u32,
}

public struct CoinTollSetEvent has copy, drop {
    gate_id: ID,
    price: u64,
    treasury: address,
}

public struct RuleRemovedEvent has copy, drop {
    gate_id: ID,
    rule_type: std::string::String,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());

    let config = GateConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

// === Package-internal witness mint ===

/// Mint the `GateAuth` witness. Only callable within this package.
public(package) fun gate_auth(): GateAuth { GateAuth {} }

// === Public: Permit Issuance ===

/// Request a jump permit for a character traversing between two gates.
/// Checks all active rules for the source gate. If a tribe rule is set,
/// verifies the character's tribe. If a coin toll is set, verifies
/// and forwards payment. Then issues a `JumpPermit` via world-contracts.
///
/// The caller must supply `payment` only when a coin toll is active.
/// When no toll is configured, pass a zero-value coin (or use the
/// no-toll variant `request_jump_permit_free`).
public fun request_jump_permit(
    config: &GateConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    payment: Coin<EVE>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let gate_id = object::id(source_gate);

    // --- Tribe rule check ---
    if (has_tribe_rule(config, gate_id)) {
        let rule = borrow_tribe_rule(config, gate_id);
        assert!(character.tribe() == rule.tribe, ETribeNotAllowed);

        event::emit(TribeCheckPassedEvent {
            gate_id,
            character_id: object::id(character),
            tribe_id: character.tribe(),
        });
    };

    // --- Coin toll check ---
    if (has_coin_toll(config, gate_id)) {
        let toll = borrow_coin_toll(config, gate_id);
        assert!(payment.value() >= toll.price, EInsufficientToll);

        event::emit(TollCollectedEvent {
            gate_id,
            character_id: object::id(character),
            amount: payment.value(),
            treasury: toll.treasury,
        });

        transfer::public_transfer(payment, toll.treasury);
    } else {
        // No toll — destroy or return the coin.
        // If caller passed a zero-value coin, destroy it cleanly.
        if (payment.value() == 0) {
            payment.destroy_zero();
        } else {
            // Return non-zero coins to sender when no toll is set.
            transfer::public_transfer(payment, ctx.sender());
        };
    };

    // --- Issue permit ---
    let expiry_ms = 5 * 24 * 60 * 60 * 1000; // 5 days
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - expiry_ms), EExpiryOverflow);

    gate::issue_jump_permit<GateAuth>(
        source_gate,
        destination_gate,
        character,
        gate_auth(),
        ts + expiry_ms,
        ctx,
    );
}

/// Convenience: request a permit when no payment is needed.
/// Aborts if a coin toll rule IS active on the source gate (caller
/// must use the payment variant instead).
public fun request_jump_permit_free(
    config: &GateConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let gate_id = object::id(source_gate);

    // --- Tribe rule check ---
    if (has_tribe_rule(config, gate_id)) {
        let rule = borrow_tribe_rule(config, gate_id);
        assert!(character.tribe() == rule.tribe, ETribeNotAllowed);

        event::emit(TribeCheckPassedEvent {
            gate_id,
            character_id: object::id(character),
            tribe_id: character.tribe(),
        });
    };

    // --- Coin toll must NOT be active for the free path ---
    assert!(!has_coin_toll(config, gate_id), ECoinTollNotSet);

    // --- Issue permit ---
    let expiry_ms = 5 * 24 * 60 * 60 * 1000;
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - expiry_ms), EExpiryOverflow);

    gate::issue_jump_permit<GateAuth>(
        source_gate,
        destination_gate,
        character,
        gate_auth(),
        ts + expiry_ms,
        ctx,
    );
}

// === Admin: Rule CRUD ===

/// Set or update the tribe rule for a specific gate.
/// Only the AdminCap holder may call this.
public fun set_tribe_rule(
    config: &mut GateConfig,
    _: &AdminCap,
    gate_id: ID,
    tribe: u32,
) {
    let key = TribeRuleKey { gate_id };
    let value = TribeRule { tribe };
    if (df::exists_(&config.id, key)) {
        *df::borrow_mut<TribeRuleKey, TribeRule>(&mut config.id, key) = value;
    } else {
        df::add(&mut config.id, key, value);
    };

    event::emit(TribeRuleSetEvent { gate_id, tribe });
}

/// Set or update the coin toll rule for a specific gate.
public fun set_coin_toll(
    config: &mut GateConfig,
    _: &AdminCap,
    gate_id: ID,
    price: u64,
    treasury: address,
) {
    let key = CoinTollKey { gate_id };
    let value = CoinTollRule { price, treasury };
    if (df::exists_(&config.id, key)) {
        *df::borrow_mut<CoinTollKey, CoinTollRule>(&mut config.id, key) = value;
    } else {
        df::add(&mut config.id, key, value);
    };

    event::emit(CoinTollSetEvent { gate_id, price, treasury });
}

/// Remove the tribe rule from a specific gate.
public fun remove_tribe_rule(
    config: &mut GateConfig,
    _: &AdminCap,
    gate_id: ID,
) {
    let key = TribeRuleKey { gate_id };
    assert!(df::exists_(&config.id, key), ETribeRuleNotSet);
    df::remove<TribeRuleKey, TribeRule>(&mut config.id, key);

    event::emit(RuleRemovedEvent {
        gate_id,
        rule_type: b"TribeRule".to_string(),
    });
}

/// Remove the coin toll rule from a specific gate.
public fun remove_coin_toll(
    config: &mut GateConfig,
    _: &AdminCap,
    gate_id: ID,
) {
    let key = CoinTollKey { gate_id };
    assert!(df::exists_(&config.id, key), ECoinTollNotSet);
    df::remove<CoinTollKey, CoinTollRule>(&mut config.id, key);

    event::emit(RuleRemovedEvent {
        gate_id,
        rule_type: b"CoinToll".to_string(),
    });
}

// === View Functions ===

/// Whether a tribe rule exists for the given gate.
public fun has_tribe_rule(config: &GateConfig, gate_id: ID): bool {
    df::exists_(&config.id, TribeRuleKey { gate_id })
}

/// Whether a coin toll rule exists for the given gate.
public fun has_coin_toll(config: &GateConfig, gate_id: ID): bool {
    df::exists_(&config.id, CoinTollKey { gate_id })
}

/// Read the tribe rule for a gate. Aborts if not set.
public fun tribe_rule(config: &GateConfig, gate_id: ID): u32 {
    assert!(has_tribe_rule(config, gate_id), ETribeRuleNotSet);
    borrow_tribe_rule(config, gate_id).tribe
}

/// Read the coin toll price for a gate. Aborts if not set.
public fun toll_price(config: &GateConfig, gate_id: ID): u64 {
    assert!(has_coin_toll(config, gate_id), ECoinTollNotSet);
    borrow_coin_toll(config, gate_id).price
}

/// Read the coin toll treasury for a gate. Aborts if not set.
public fun toll_treasury(config: &GateConfig, gate_id: ID): address {
    assert!(has_coin_toll(config, gate_id), ECoinTollNotSet);
    borrow_coin_toll(config, gate_id).treasury
}

// === Package-Internal Config Accessors ===

/// Immutable UID reference — allows sibling modules to read DFs on GateConfig.
public(package) fun config_uid(config: &GateConfig): &UID { &config.id }

/// Mutable UID reference — allows sibling modules to write DFs on GateConfig.
public(package) fun config_uid_mut(config: &mut GateConfig): &mut UID { &mut config.id }

// === Private Helpers ===

fun borrow_tribe_rule(config: &GateConfig, gate_id: ID): &TribeRule {
    df::borrow<TribeRuleKey, TribeRule>(&config.id, TribeRuleKey { gate_id })
}

fun borrow_coin_toll(config: &GateConfig, gate_id: ID): &CoinTollRule {
    df::borrow<CoinTollKey, CoinTollRule>(&config.id, CoinTollKey { gate_id })
}

// === Test Helpers ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
