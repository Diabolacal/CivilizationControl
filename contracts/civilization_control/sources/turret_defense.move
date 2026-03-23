/// TurretDefense — defense-posture turret extension for CivilizationControl.
///
/// Active territorial defense: all non-tribe targets are treated as hostile
/// and engaged at elevated priority (+5000). Aggressors receive highest
/// priority (+15000). Same-tribe non-aggressors are excluded.
///
/// Contrast with BouncerAuth (commercial posture): bouncer is passive
/// toward ALL non-aggressors and only engages active threats.
///
/// Activated by `turret::authorize_extension<DefenseAuth>(turret, cap)`.
/// Swapped back to bouncer via `authorize_extension<BouncerAuth>` on posture
/// change to commercial.
module civilization_control::turret_defense;

use sui::{bcs, event};
use world::{
    character::Character,
    turret::{
        Self, Turret, OnlineReceipt,
    },
};
use civilization_control::turret_events;

// === Constants ===

const HOSTILE_BOOST: u64 = 5_000;
const AGGRESSOR_BOOST: u64 = 15_000;

// === Errors ===

#[error(code = 0)]
const EInvalidReceipt: vector<u8> = b"OnlineReceipt turret_id does not match turret";

// === Structs ===

/// Auth witness for defense-mode turret extension.
public struct DefenseAuth has drop {}

// === Events ===

/// Emitted each time the game engine evaluates targeting through defense mode.
/// `hostile_count` indicates how many non-tribal targets were engaged.
public struct DefenseTargetingEvent has copy, drop {
    turret_id: ID,
    candidate_count: u64,
    hostile_count: u64,
}

// === Extension Entry Point ===

/// Defense-mode targeting: aggressive non-tribal enforcement.
/// Same-tribe non-aggressors → excluded (protect friendlies).
/// Aggressors → highest priority.
/// Non-tribe visitors → high priority (hostile by default).
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
    let mut hostile_count = 0u64;
    let mut aggressor_count = 0u64;
    let mut top_target_id = 0u64;
    let mut top_priority = 0u64;

    let mut i = 0;
    let len = candidates.length();
    while (i < len) {
        let c = &candidates[i];
        let tribe = c.character_tribe();
        let is_agg = c.is_aggressor();
        let weight = c.priority_weight();

        if (is_agg) { aggressor_count = aggressor_count + 1 };

        // Same tribe, not aggressor → exclude (protect friendlies)
        if (tribe == owner_tribe && !is_agg) {
            i = i + 1;
            continue
        };

        let priority = if (is_agg) {
            // Aggressors get highest priority regardless of tribe
            weight + AGGRESSOR_BOOST
        } else {
            // Non-tribe non-aggressor — hostile in defense mode
            weight + HOSTILE_BOOST
        };

        if (priority > top_priority) {
            top_priority = priority;
            top_target_id = c.item_id();
        };

        result.push_back(
            turret::new_return_target_priority_list(c.item_id(), priority),
        );
        hostile_count = hostile_count + 1;
        i = i + 1;
    };

    let bytes = bcs::to_bytes(&result);

    turret::destroy_online_receipt(receipt, DefenseAuth {});

    event::emit(DefenseTargetingEvent {
        turret_id: object::id(turret),
        candidate_count: len,
        hostile_count,
    });

    // Emit shared response event only when targets are actually engaged
    if (hostile_count > 0) {
        turret_events::emit_response(
            object::id(turret),
            turret_events::doctrine_defense(),
            len,
            hostile_count,
            aggressor_count,
            top_target_id,
        );
    };

    bytes
}
