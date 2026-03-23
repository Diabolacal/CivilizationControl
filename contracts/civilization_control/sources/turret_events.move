/// Shared turret response event for CivilizationControl.
///
/// Emitted by turret extension modules (bouncer, defense) when the turret
/// engages targets — i.e., returns a non-empty priority list. NOT emitted
/// on passive evaluations where all candidates are excluded.
///
/// Designed for frontend Signal Feed ingestion. All fields derive from
/// data available within the turret extension's closed-world call.
module civilization_control::turret_events;

use sui::event;

// === Constants ===

const DOCTRINE_COMMERCIAL: u8 = 0;
const DOCTRINE_DEFENSE: u8 = 1;

// === Events ===

/// Emitted when a turret extension returns a non-empty target priority list.
/// Provides doctrine context and top-target data for the Signal Feed.
public struct TurretResponseEvent has copy, drop {
    turret_id: ID,
    doctrine: u8,
    candidate_count: u64,
    engaged_count: u64,
    aggressor_count: u64,
    top_target_id: u64,
}

// === Package-Internal Emitter ===

/// Emit a turret response event. Called by extension modules only when
/// the turret has targets to engage (engaged_count > 0).
public(package) fun emit_response(
    turret_id: ID,
    doctrine: u8,
    candidate_count: u64,
    engaged_count: u64,
    aggressor_count: u64,
    top_target_id: u64,
) {
    event::emit(TurretResponseEvent {
        turret_id,
        doctrine,
        candidate_count,
        engaged_count,
        aggressor_count,
        top_target_id,
    });
}

// === Doctrine Accessors ===

/// Commercial/bouncer doctrine constant (0).
public(package) fun doctrine_commercial(): u8 { DOCTRINE_COMMERCIAL }

/// Defense doctrine constant (1).
public(package) fun doctrine_defense(): u8 { DOCTRINE_DEFENSE }
