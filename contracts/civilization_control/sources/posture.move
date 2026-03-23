/// Posture — per-gate operational stance for CivilizationControl.
///
/// Records each operator's chosen posture (Commercial or Defense) as a
/// dynamic field on the shared `GateConfig` object, keyed by gate ID.
/// Emits `PostureChangedEvent` for Signal Feed integration and
/// single-digest proof moments.
///
/// Authority: requires the operator's `OwnerCap<Gate>` for the targeted
/// gate. No package-publisher admin capability needed.
///
/// Posture is an intent label — the actual gate rule changes and turret
/// extension swaps are orchestrated by the PTB builder on the frontend.
/// This module records the fact that the posture changed, providing the
/// audit trail and event emission CivilizationControl needs for its
/// command-layer demo.
module civilization_control::posture;

use sui::{dynamic_field as df, event};
use world::access::{Self, OwnerCap};
use world::gate::Gate;
use civilization_control::config::{Self, GateConfig};

// === Constants ===

const COMMERCIAL: u8 = 0;
const DEFENSE: u8 = 1;

// === Errors ===

#[error(code = 0)]
const EInvalidPosture: vector<u8> = b"Invalid posture mode — must be 0 (Commercial) or 1 (Defense)";

#[error(code = 2)]
const ENotGateOwner: vector<u8> = b"OwnerCap does not match the targeted gate";

// === Structs ===

/// Per-gate DF key for posture state on GateConfig.
public struct PostureKey has copy, drop, store {
    gate_id: ID,
}

/// Current posture state.
public struct PostureState has copy, drop, store {
    mode: u8,
}

// === Events ===

/// Emitted on every posture change. The single-PTB proof moment.
public struct PostureChangedEvent has copy, drop {
    gate_id: ID,
    old_mode: u8,
    new_mode: u8,
}

// === Public Functions ===

/// Set the posture for a specific gate. Requires the operator's OwnerCap.
/// Idempotent: silently returns if the gate is already in the target posture.
/// Emits PostureChangedEvent only when the posture actually changes.
public fun set_posture(
    config: &mut GateConfig,
    owner_cap: &OwnerCap<Gate>,
    gate_id: ID,
    mode: u8,
) {
    assert!(access::is_authorized(owner_cap, gate_id), ENotGateOwner);
    assert!(mode == COMMERCIAL || mode == DEFENSE, EInvalidPosture);

    let uid = config::config_uid_mut(config);
    let key = PostureKey { gate_id };

    if (df::exists_(uid, key)) {
        let state: &mut PostureState = df::borrow_mut(uid, key);
        let old = state.mode;
        if (old == mode) return;
        state.mode = mode;
        event::emit(PostureChangedEvent { gate_id, old_mode: old, new_mode: mode });
    } else {
        // First posture set — default was implicitly Commercial
        if (mode == COMMERCIAL) return;
        df::add(uid, key, PostureState { mode });
        event::emit(PostureChangedEvent { gate_id, old_mode: COMMERCIAL, new_mode: mode });
    };
}

// === View Functions ===

/// Read the current posture for a specific gate. Returns COMMERCIAL (0) if not yet set.
public fun current_posture(config: &GateConfig, gate_id: ID): u8 {
    let uid = config::config_uid(config);
    let key = PostureKey { gate_id };
    if (df::exists_(uid, key)) {
        let state: &PostureState = df::borrow(uid, key);
        state.mode
    } else {
        COMMERCIAL
    }
}

/// Whether a specific gate is in defense posture.
public fun is_defense(config: &GateConfig, gate_id: ID): bool {
    current_posture(config, gate_id) == DEFENSE
}

// === Constant Accessors ===

/// Commercial posture constant (0).
public fun commercial(): u8 { COMMERCIAL }

/// Defense posture constant (1).
public fun defense(): u8 { DEFENSE }
