/// TurretBouncer — commercial-posture turret extension for CivilizationControl.
///
/// Mirrors default turret targeting behavior (tribe-friendly bouncer):
/// same-tribe non-aggressors are excluded, aggressors are prioritized.
/// Emits `BouncerTargetingEvent` for Signal Feed observability — the
/// default world-module `PriorityListUpdatedEvent` only fires on the
/// un-extended path, so we emit our own.
///
/// Activated by `turret::authorize_extension<BouncerAuth>(turret, cap)`.
/// Deactivated by swapping to `turret_defense::DefenseAuth` on posture change.
module civilization_control::turret_bouncer;

use sui::{bcs, event};
use world::{
    character::Character,
    turret::{
        Self, Turret, OnlineReceipt,
    },
};

// === Constants ===

const AGGRESSOR_BOOST: u64 = 10_000;
const NON_TRIBE_BOOST: u64 = 1_000;

// === Errors ===

#[error(code = 0)]
const EInvalidReceipt: vector<u8> = b"OnlineReceipt turret_id does not match turret";

// === Structs ===

/// Auth witness for bouncer-mode turret extension.
public struct BouncerAuth has drop {}

// === Events ===

/// Emitted each time the game engine evaluates targeting through this extension.
public struct BouncerTargetingEvent has copy, drop {
    turret_id: ID,
    candidate_count: u64,
    engaged_count: u64,
}

// === Extension Entry Point ===

/// Bouncer-mode targeting: tribe-friendly, aggressor-focused.
/// Same-tribe non-aggressors → excluded.
/// Aggressors → high priority. Non-tribal visitors → medium priority.
/// Uses is_aggressor + character_tribe (BehaviourChangeReason is
/// module-private in world::turret and inaccessible from extensions).
public fun get_target_priority_list(
    turret: &Turret,
    owner_character: &Character,
    target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
): vector<u8> {
    assert!(receipt.turret_id() == object::id(turret), EInvalidReceipt);

    let candidates = turret::unpack_candidate_list(target_candidate_list);
    let owner_tribe = owner_character.tribe();
    let mut result = vector::empty<turret::ReturnTargetPriorityList>();
    let mut engaged = 0u64;

    let mut i = 0;
    let len = candidates.length();
    while (i < len) {
        let c = &candidates[i];
        let tribe = c.character_tribe();
        let is_agg = c.is_aggressor();
        let weight = c.priority_weight();

        // Same tribe, not aggressor → exclude (protect friendlies)
        if (tribe == owner_tribe && !is_agg) {
            i = i + 1;
            continue
        };

        let priority = if (is_agg) {
            weight + AGGRESSOR_BOOST
        } else if (tribe != owner_tribe) {
            weight + NON_TRIBE_BOOST
        } else {
            // Same-tribe aggressor — engage but no extra boost
            weight
        };

        result.push_back(
            turret::new_return_target_priority_list(c.item_id(), priority),
        );
        engaged = engaged + 1;
        i = i + 1;
    };

    let bytes = bcs::to_bytes(&result);

    turret::destroy_online_receipt(receipt, BouncerAuth {});

    event::emit(BouncerTargetingEvent {
        turret_id: object::id(turret),
        candidate_count: len,
        engaged_count: engaged,
    });

    bytes
}
