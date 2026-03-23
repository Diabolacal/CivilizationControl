/// TurretBouncer — commercial-posture turret extension for CivilizationControl.
///
/// Passive-until-aggression doctrine: turrets stand down for all neutral
/// traffic (same-tribe AND non-tribe) and engage ONLY aggressors. This
/// keeps commercial zones safe for visiting traders while still defending
/// against hostile action.
///
/// Emits `BouncerTargetingEvent` for diagnostic observability, plus
/// `TurretResponseEvent` (from turret_events) when aggressors are engaged.
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
use civilization_control::turret_events;

// === Constants ===

const AGGRESSOR_BOOST: u64 = 10_000;

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

/// Bouncer-mode targeting: passive until aggression.
/// Non-aggressors (any tribe) → excluded (stand down).
/// Aggressors (any tribe) → targeted at boosted priority.
/// Uses is_aggressor only — tribe membership is irrelevant for engagement.
/// BehaviourChangeReason is module-private in world::turret and inaccessible.
public fun get_target_priority_list(
    turret: &Turret,
    _owner_character: &Character,
    target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
): vector<u8> {
    assert!(receipt.turret_id() == object::id(turret), EInvalidReceipt);

    let candidates = turret::unpack_candidate_list(target_candidate_list);
    let mut result = vector::empty<turret::ReturnTargetPriorityList>();
    let mut engaged = 0u64;
    let mut aggressor_count = 0u64;
    let mut top_target_id = 0u64;
    let mut top_priority = 0u64;

    let mut i = 0;
    let len = candidates.length();
    while (i < len) {
        let c = &candidates[i];
        let is_agg = c.is_aggressor();
        let weight = c.priority_weight();

        if (is_agg) { aggressor_count = aggressor_count + 1 };

        // Non-aggressor (any tribe) → excluded (passive toward all neutral traffic)
        if (!is_agg) {
            i = i + 1;
            continue
        };

        // Only aggressors reach here — engage at boosted priority
        let priority = weight + AGGRESSOR_BOOST;

        if (priority > top_priority) {
            top_priority = priority;
            top_target_id = c.item_id();
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

    // Emit shared response event only when aggressors are actually engaged
    if (engaged > 0) {
        turret_events::emit_response(
            object::id(turret),
            turret_events::doctrine_commercial(),
            len,
            engaged,
            aggressor_count,
            top_target_id,
        );
    };

    bytes
}
