/// Posture — network-wide operational stance for CivilizationControl.
///
/// Records the operator's chosen posture (Commercial or Defense) as a
/// dynamic field on the shared `GateConfig` object. Emits `PostureChangedEvent`
/// for Signal Feed integration and single-digest proof moments.
///
/// Posture is an intent label — the actual gate rule changes and turret
/// extension swaps are orchestrated by the PTB builder on the frontend.
/// This module records the fact that the posture changed, providing the
/// audit trail and event emission CivilizationControl needs for its
/// command-layer demo.
module civilization_control::posture;

use sui::{dynamic_field as df, event};
use civilization_control::gate_control::{Self, GateConfig, AdminCap};

// === Constants ===

const COMMERCIAL: u8 = 0;
const DEFENSE: u8 = 1;

// === Errors ===

#[error(code = 0)]
const EInvalidPosture: vector<u8> = b"Invalid posture mode — must be 0 (Commercial) or 1 (Defense)";

#[error(code = 1)]
const EAlreadyInPosture: vector<u8> = b"Network is already in the specified posture";

// === Structs ===

/// Singleton DF key for posture state on GateConfig.
public struct PostureKey has copy, drop, store {}

/// Current posture state.
public struct PostureState has copy, drop, store {
    mode: u8,
}

// === Events ===

/// Emitted on every posture change. The single-PTB proof moment.
public struct PostureChangedEvent has copy, drop {
    old_mode: u8,
    new_mode: u8,
}

// === Public Functions ===

/// Set the network posture. Requires AdminCap.
/// Emits PostureChangedEvent for Signal Feed and proof-of-command.
public fun set_posture(
    config: &mut GateConfig,
    _admin: &AdminCap,
    mode: u8,
) {
    assert!(mode == COMMERCIAL || mode == DEFENSE, EInvalidPosture);

    let uid = gate_control::config_uid_mut(config);
    let key = PostureKey {};

    if (df::exists_(uid, key)) {
        let state: &mut PostureState = df::borrow_mut(uid, key);
        let old = state.mode;
        assert!(old != mode, EAlreadyInPosture);
        state.mode = mode;
        event::emit(PostureChangedEvent { old_mode: old, new_mode: mode });
    } else {
        // First posture set — default was implicitly Commercial
        df::add(uid, key, PostureState { mode });
        event::emit(PostureChangedEvent { old_mode: COMMERCIAL, new_mode: mode });
    };
}

// === View Functions ===

/// Read the current posture mode. Returns COMMERCIAL (0) if not yet set.
public fun current_posture(config: &GateConfig): u8 {
    let uid = gate_control::config_uid(config);
    let key = PostureKey {};
    if (df::exists_(uid, key)) {
        let state: &PostureState = df::borrow(uid, key);
        state.mode
    } else {
        COMMERCIAL
    }
}

/// Whether the network is in defense posture.
public fun is_defense(config: &GateConfig): bool {
    current_posture(config) == DEFENSE
}

// === Constant Accessors ===

/// Commercial posture constant (0).
public fun commercial(): u8 { COMMERCIAL }

/// Defense posture constant (1).
public fun defense(): u8 { DEFENSE }
