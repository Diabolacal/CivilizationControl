/// GateControl v3 — operator-owned gate policy extension for CivilizationControl.
///
/// Registers a `GateAuth` witness on Smart Gates. Enforces per-gate policy
/// presets keyed by posture mode (Commercial / Defensive). Each preset
/// contains up to 20 tribe-specific entries (tribe, access, toll) plus a
/// default fallback. Posture switch instantly changes which preset is
/// enforced without rewriting per-gate rules.
///
/// Authority: all management actions require the operator's `OwnerCap<Gate>`
/// for the targeted gate — no package-publisher admin capability needed.
///
/// Treasury: one operator-controlled payout address per gate. All toll
/// revenue transfers directly to that address — no escrow, no claim flow.
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
    access::{Self, OwnerCap},
    character::Character,
    gate::{Self, Gate},
};
use civilization_control::config::{Self, GateConfig};
use civilization_control::posture;

// === Constants ===

const MAX_ENTRIES: u64 = 20;
const PERMIT_TTL_MS: u64 = 5 * 24 * 60 * 60 * 1000; // 5 days

// === Errors ===

#[error(code = 0)]
const EAccessDenied: vector<u8> = b"Character access denied by gate policy";

#[error(code = 1)]
const EInsufficientToll: vector<u8> = b"Payment coin value is less than the required toll";

#[error(code = 2)]
const EPresetNotSet: vector<u8> = b"No policy preset configured for this gate and mode";

#[error(code = 3)]
const ETreasuryNotSet: vector<u8> = b"No treasury payout address configured for this gate";

#[error(code = 4)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp would overflow";

#[error(code = 5)]
const ETooManyEntries: vector<u8> = b"Preset exceeds maximum entry count (20)";

#[error(code = 6)]
const EInvalidMode: vector<u8> = b"Invalid posture mode — must be 0 (Commercial) or 1 (Defense)";

#[error(code = 7)]
const ENotGateOwner: vector<u8> = b"OwnerCap does not match the targeted gate";

// === Structs ===

/// Typed witness for gate extension registration and permit issuance.
public struct GateAuth has drop {}

// === Policy Preset Key / Value Structs ===

/// DF key: (gate_id, mode) → PolicyPreset
public struct PolicyPresetKey has copy, drop, store {
    gate_id: ID,
    mode: u8,
}

/// A tribe-specific policy entry within a preset.
public struct TribePolicyEntry has copy, drop, store {
    tribe: u32,
    access: bool,
    toll: u64,
}

/// Full policy preset for one gate under one posture mode.
public struct PolicyPreset has copy, drop, store {
    entries: vector<TribePolicyEntry>,
    default_access: bool,
    default_toll: u64,
}

/// DF key for per-gate treasury payout address.
public struct TreasuryKey has copy, drop, store {
    gate_id: ID,
}

// === Events ===

public struct PolicyPresetSetEvent has copy, drop {
    gate_id: ID,
    mode: u8,
    entry_count: u64,
    default_access: bool,
    default_toll: u64,
}

public struct PolicyPresetRemovedEvent has copy, drop {
    gate_id: ID,
    mode: u8,
}

public struct TreasurySetEvent has copy, drop {
    gate_id: ID,
    treasury: address,
}

public struct TollCollectedEvent has copy, drop {
    gate_id: ID,
    character_id: ID,
    amount: u64,
    treasury: address,
}

public struct PermitIssuedEvent has copy, drop {
    gate_id: ID,
    character_id: ID,
    tribe_id: u32,
    mode: u8,
    toll: u64,
    permit_id: ID,
}

// === Package-internal witness mint ===

/// Mint the `GateAuth` witness. Only callable within this package.
public(package) fun gate_auth(): GateAuth { GateAuth {} }

// === Public: Permit Issuance ===

/// Request a jump permit with toll payment. Reads the active posture,
/// resolves the preset for the source gate under that mode, evaluates
/// tribe-specific or default policy, collects toll, and issues the permit.
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
    let mode = posture::current_posture(config, gate_id);
    let preset = borrow_preset(config, gate_id, mode);
    let tribe_id = character.tribe();
    let (access_allowed, toll) = resolve_policy(preset, tribe_id);

    assert!(access_allowed, EAccessDenied);

    // Collect toll
    if (toll > 0) {
        assert!(payment.value() >= toll, EInsufficientToll);
        let treasury_addr = treasury(config, gate_id);
        event::emit(TollCollectedEvent {
            gate_id,
            character_id: object::id(character),
            amount: payment.value(),
            treasury: treasury_addr,
        });
        transfer::public_transfer(payment, treasury_addr);
    } else {
        if (payment.value() == 0) {
            payment.destroy_zero();
        } else {
            transfer::public_transfer(payment, ctx.sender());
        };
    };

    // Issue permit
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - PERMIT_TTL_MS), EExpiryOverflow);

    let permit_id = gate::issue_jump_permit_with_id<GateAuth>(
        source_gate,
        destination_gate,
        character,
        gate_auth(),
        ts + PERMIT_TTL_MS,
        ctx,
    );

    event::emit(PermitIssuedEvent {
        gate_id,
        character_id: object::id(character),
        tribe_id,
        mode,
        toll,
        permit_id,
    });
}

/// Request a permit when no payment is needed (toll must be 0).
public fun request_jump_permit_free(
    config: &GateConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let gate_id = object::id(source_gate);
    let mode = posture::current_posture(config, gate_id);
    let preset = borrow_preset(config, gate_id, mode);
    let tribe_id = character.tribe();
    let (access_allowed, toll) = resolve_policy(preset, tribe_id);

    assert!(access_allowed, EAccessDenied);
    assert!(toll == 0, EInsufficientToll);

    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - PERMIT_TTL_MS), EExpiryOverflow);

    let permit_id = gate::issue_jump_permit_with_id<GateAuth>(
        source_gate,
        destination_gate,
        character,
        gate_auth(),
        ts + PERMIT_TTL_MS,
        ctx,
    );

    event::emit(PermitIssuedEvent {
        gate_id,
        character_id: object::id(character),
        tribe_id,
        mode,
        toll: 0,
        permit_id,
    });
}

// === Operator: Policy Preset CRUD (requires OwnerCap<Gate>) ===

/// Set or replace the full policy preset for a gate under a specific mode.
/// Requires the operator's OwnerCap for the targeted gate.
/// Accepts the complete entry vector and default fallback in one call,
/// enabling PTB-batched "author once, apply to many gates" workflows.
public fun set_policy_preset(
    config: &mut GateConfig,
    owner_cap: &OwnerCap<Gate>,
    gate_id: ID,
    mode: u8,
    tribes: vector<u32>,
    accesses: vector<bool>,
    tolls: vector<u64>,
    default_access: bool,
    default_toll: u64,
) {
    assert!(access::is_authorized(owner_cap, gate_id), ENotGateOwner);
    assert!(mode == posture::commercial() || mode == posture::defense(), EInvalidMode);
    let len = tribes.length();
    assert!(len <= MAX_ENTRIES, ETooManyEntries);
    assert!(len == accesses.length() && len == tolls.length(), ETooManyEntries);

    let mut entries = vector::empty<TribePolicyEntry>();
    let mut i = 0;
    while (i < len) {
        entries.push_back(TribePolicyEntry {
            tribe: tribes[i],
            access: accesses[i],
            toll: tolls[i],
        });
        i = i + 1;
    };

    let preset = PolicyPreset { entries, default_access, default_toll };
    let key = PolicyPresetKey { gate_id, mode };

    let uid = config::config_uid_mut(config);
    if (df::exists_(uid, key)) {
        *df::borrow_mut<PolicyPresetKey, PolicyPreset>(uid, key) = preset;
    } else {
        df::add(uid, key, preset);
    };

    event::emit(PolicyPresetSetEvent {
        gate_id,
        mode,
        entry_count: len,
        default_access,
        default_toll,
    });
}

/// Remove the policy preset for a gate under a specific mode.
/// Requires the operator's OwnerCap for the targeted gate.
public fun remove_policy_preset(
    config: &mut GateConfig,
    owner_cap: &OwnerCap<Gate>,
    gate_id: ID,
    mode: u8,
) {
    assert!(access::is_authorized(owner_cap, gate_id), ENotGateOwner);
    let key = PolicyPresetKey { gate_id, mode };
    let uid = config::config_uid_mut(config);
    assert!(df::exists_(uid, key), EPresetNotSet);
    df::remove<PolicyPresetKey, PolicyPreset>(uid, key);

    event::emit(PolicyPresetRemovedEvent { gate_id, mode });
}

/// Set or update the per-gate treasury payout address.
/// Requires the operator's OwnerCap for the targeted gate.
public fun set_treasury(
    config: &mut GateConfig,
    owner_cap: &OwnerCap<Gate>,
    gate_id: ID,
    treasury_address: address,
) {
    assert!(access::is_authorized(owner_cap, gate_id), ENotGateOwner);
    let key = TreasuryKey { gate_id };
    let uid = config::config_uid_mut(config);
    if (df::exists_(uid, key)) {
        *df::borrow_mut<TreasuryKey, address>(uid, key) = treasury_address;
    } else {
        df::add(uid, key, treasury_address);
    };
    event::emit(TreasurySetEvent { gate_id, treasury: treasury_address });
}

// === View Functions ===

/// Whether a policy preset exists for the given gate and mode.
public fun has_preset(config: &GateConfig, gate_id: ID, mode: u8): bool {
    df::exists_(config::config_uid(config), PolicyPresetKey { gate_id, mode })
}

/// Read the policy preset for a gate and mode. Aborts if not set.
public fun preset(config: &GateConfig, gate_id: ID, mode: u8): PolicyPreset {
    assert!(has_preset(config, gate_id, mode), EPresetNotSet);
    *borrow_preset(config, gate_id, mode)
}

/// Whether a per-gate treasury payout address is configured.
public fun has_treasury(config: &GateConfig, gate_id: ID): bool {
    df::exists_(config::config_uid(config), TreasuryKey { gate_id })
}

/// Read the per-gate treasury payout address. Aborts if not set.
public fun treasury(config: &GateConfig, gate_id: ID): address {
    assert!(has_treasury(config, gate_id), ETreasuryNotSet);
    *df::borrow<TreasuryKey, address>(config::config_uid(config), TreasuryKey { gate_id })
}

/// Read preset entry count for a gate and mode.
public fun preset_entry_count(config: &GateConfig, gate_id: ID, mode: u8): u64 {
    borrow_preset(config, gate_id, mode).entries.length()
}

// === Private Helpers ===

fun borrow_preset(config: &GateConfig, gate_id: ID, mode: u8): &PolicyPreset {
    assert!(has_preset(config, gate_id, mode), EPresetNotSet);
    df::borrow<PolicyPresetKey, PolicyPreset>(config::config_uid(config), PolicyPresetKey { gate_id, mode })
}

/// Linear scan of entries for matching tribe. Returns (access, toll).
/// Falls back to default if no match found.
fun resolve_policy(preset: &PolicyPreset, tribe_id: u32): (bool, u64) {
    let mut i = 0;
    let len = preset.entries.length();
    while (i < len) {
        let entry = &preset.entries[i];
        if (entry.tribe == tribe_id) {
            return (entry.access, entry.toll)
        };
        i = i + 1;
    };
    (preset.default_access, preset.default_toll)
}


