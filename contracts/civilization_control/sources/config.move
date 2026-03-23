/// Config — shared infrastructure types for CivilizationControl.
///
/// Holds `GateConfig` (shared object hosting all DFs). Policy presets,
/// treasury addresses, and posture state are stored as dynamic fields
/// keyed by gate ID. Authority for mutations comes from the operator's
/// per-structure `OwnerCap<Gate>`, not from a package-level admin cap.
module civilization_control::config;

// === Structs ===

/// Shared configuration object. Policy presets, per-gate treasury, and
/// per-gate posture state are stored as dynamic fields on this object's UID.
public struct GateConfig has key {
    id: UID,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    let config = GateConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

// === Package-Internal Config Accessors ===

/// Immutable UID reference — allows sibling modules to read DFs on GateConfig.
public(package) fun config_uid(config: &GateConfig): &UID { &config.id }

/// Mutable UID reference — allows sibling modules to write DFs on GateConfig.
public(package) fun config_uid_mut(config: &mut GateConfig): &mut UID { &mut config.id }

// === Test Helpers ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
