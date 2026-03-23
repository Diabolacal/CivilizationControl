/// Turret — unified extension dispatcher for CivilizationControl.
///
/// The EVE Frontier game engine resolves turret extensions by extracting
/// the package address from the stored TypeName and calling
/// `{package}::turret::get_target_priority_list`.
/// The module MUST be named `turret` (hardcoded in the engine's SDK
/// resolution path — see vendor get-priority-list.ts line 109).
///
/// Defines two auth witnesses for posture-based doctrine dispatch:
///   - CommercialAuth — passive-until-aggression (bouncer)
///   - DefenseAuth   — active territorial defense
///
/// The stored TypeName on the Turret object determines which doctrine
/// is applied at evaluation time.
module civilization_control::turret;

use std::type_name;
use sui::{bcs, event};
use world::{
    character::Character,
    turret::{Self, Turret, OnlineReceipt},
};
use civilization_control::turret_events;

// === Constants ===

const AGGRESSOR_BOOST: u64 = 10_000;
const HOSTILE_BOOST: u64 = 5_000;
const DEFENSE_AGGRESSOR_BOOST: u64 = 15_000;

// === Errors ===

#[error(code = 0)]
const EInvalidReceipt: vector<u8> =
    b"OnlineReceipt turret_id does not match turret";

// === Auth Witnesses ===

/// Auth witness for commercial/bouncer posture.
/// Passive-until-aggression: only engage active threats.
public struct CommercialAuth has drop {}

/// Auth witness for defense posture.
/// Active territorial: engage all non-tribe, prioritize aggressors.
public struct DefenseAuth has drop {}

// === Events ===

/// Emitted each evaluation cycle (diagnostic only — devInspect events
/// are NOT persisted on-chain under the current game engine architecture).
public struct TurretTargetingEvent has copy, drop {
    turret_id: ID,
    doctrine: u8,
    candidate_count: u64,
    engaged_count: u64,
}

// === Extension Entry Point ===

/// Unified turret targeting dispatcher.
///
/// Reads the stored extension TypeName to determine doctrine:
///   CommercialAuth → passive until aggression (bouncer)
///   DefenseAuth    → active territorial defense
///
/// Returns BCS-encoded vector<ReturnTargetPriorityList>.
public fun get_target_priority_list(
    turret_obj: &Turret,
    owner_character: &Character,
    target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
): vector<u8> {
    assert!(receipt.turret_id() == object::id(turret_obj), EInvalidReceipt);

    let ext_type = turret::extension_type(turret_obj);
    let is_commercial =
        (ext_type == type_name::with_defining_ids<CommercialAuth>());

    let candidates = turret::unpack_candidate_list(target_candidate_list);
    let owner_tribe = owner_character.tribe();
    let mut result = vector::empty<turret::ReturnTargetPriorityList>();
    let mut engaged = 0u64;
    let mut aggressor_count = 0u64;
    let mut top_target_id = 0u64;
    let mut top_priority = 0u64;

    let len = candidates.length();
    let mut i = 0;
    while (i < len) {
        let c = &candidates[i];
        let is_agg = c.is_aggressor();
        let weight = c.priority_weight();
        let tribe = c.character_tribe();

        if (is_agg) { aggressor_count = aggressor_count + 1 };

        if (is_commercial) {
            // ── Commercial / Bouncer ──
            // Non-aggressor (any tribe) → excluded (passive toward all neutral traffic)
            if (!is_agg) { i = i + 1; continue };

            // Only aggressors → engage at boosted priority
            let priority = weight + AGGRESSOR_BOOST;
            if (priority > top_priority) {
                top_priority = priority;
                top_target_id = c.item_id();
            };
            result.push_back(
                turret::new_return_target_priority_list(c.item_id(), priority),
            );
            engaged = engaged + 1;
        } else {
            // ── Defense / Territorial ──
            // Same-tribe non-aggressor → exclude (protect friendlies)
            if (tribe == owner_tribe && !is_agg) { i = i + 1; continue };

            let priority = if (is_agg) {
                weight + DEFENSE_AGGRESSOR_BOOST
            } else {
                weight + HOSTILE_BOOST
            };
            if (priority > top_priority) {
                top_priority = priority;
                top_target_id = c.item_id();
            };
            result.push_back(
                turret::new_return_target_priority_list(c.item_id(), priority),
            );
            engaged = engaged + 1;
        };
        i = i + 1;
    };

    let doctrine = if (is_commercial) {
        turret_events::doctrine_commercial()
    } else {
        turret_events::doctrine_defense()
    };

    let bytes = bcs::to_bytes(&result);
    turret::destroy_online_receipt(receipt, CommercialAuth {});

    event::emit(TurretTargetingEvent {
        turret_id: object::id(turret_obj),
        doctrine,
        candidate_count: len,
        engaged_count: engaged,
    });

    if (engaged > 0) {
        turret_events::emit_response(
            object::id(turret_obj),
            doctrine,
            len,
            engaged,
            aggressor_count,
            top_target_id,
        );
    };

    bytes
}
