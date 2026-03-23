/// Tests for the gate_control module (v3 — operator-owned authority).
///
/// Tests verify OwnerCap<Gate>-based authorization for preset CRUD,
/// per-gate treasury, multi-operator isolation, and wrong-owner rejection.
/// End-to-end permit issuance requires full world infrastructure
/// (Gate, Character, NetworkNode) — covered by integration tests.
#[test_only]
module civilization_control::gate_control_tests;

use civilization_control::gate_control;
use civilization_control::config::{Self, GateConfig};
use civilization_control::posture;
use sui::test_scenario as ts;
use world::world::{Self, GovernorCap};
use world::access::{Self, AdminACL};
use world::gate::Gate;

const ADMIN: address = @0xAD;
const OPERATOR_A: address = @0xBEEF;
const OPERATOR_B: address = @0xCAFE;
const TREASURY: address = @0xFEE1;
const TREASURY_2: address = @0xFEE2;
const GATE_ID_1: address = @0x1001;
const GATE_ID_2: address = @0x2002;

/// Bootstrap world infrastructure + CC config.
/// GovernorCap → ADMIN, AdminACL shared, GateConfig shared.
/// OPERATOR_A and OPERATOR_B enrolled as authorized sponsors.
fun setup_world(scenario: &mut ts::Scenario) {
    ts::next_tx(scenario, ADMIN);
    world::init_for_testing(scenario.ctx());

    ts::next_tx(scenario, ADMIN);
    access::init_for_testing(scenario.ctx());

    ts::next_tx(scenario, ADMIN);
    {
        let gov_cap = ts::take_from_sender<GovernorCap>(scenario);
        let mut admin_acl = ts::take_shared<AdminACL>(scenario);
        access::add_sponsor_to_acl(&mut admin_acl, &gov_cap, OPERATOR_A);
        access::add_sponsor_to_acl(&mut admin_acl, &gov_cap, OPERATOR_B);
        ts::return_to_sender(scenario, gov_cap);
        ts::return_shared(admin_acl);
    };

    ts::next_tx(scenario, ADMIN);
    config::init_for_testing(scenario.ctx());
}

// === Preset CRUD Tests ===

#[test]
fun set_and_read_commercial_preset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());
        let mode = posture::commercial();

        assert!(!gate_control::has_preset(&config, gate_id, mode));

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, mode,
            vector[42, 99],      // tribes
            vector[true, false], // accesses
            vector[100, 0],      // tolls
            true,                // default_access
            50,                  // default_toll
        );

        assert!(gate_control::has_preset(&config, gate_id, mode));
        assert!(gate_control::preset_entry_count(&config, gate_id, mode) == 2);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test]
fun set_and_read_defense_preset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());
        let mode = posture::defense();

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, mode,
            vector[10],    // tribes
            vector[true],  // accesses
            vector[0],     // tolls
            false,         // default_access
            0,             // default_toll
        );

        assert!(gate_control::has_preset(&config, gate_id, mode));
        assert!(gate_control::preset_entry_count(&config, gate_id, mode) == 1);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test]
fun update_preset_overwrites() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());
        let mode = posture::commercial();

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, mode,
            vector[1], vector[true], vector[100],
            true, 50,
        );
        assert!(gate_control::preset_entry_count(&config, gate_id, mode) == 1);

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, mode,
            vector[1, 2, 3], vector[true, false, true], vector[100, 0, 200],
            false, 0,
        );
        assert!(gate_control::preset_entry_count(&config, gate_id, mode) == 3);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test]
fun remove_preset_clears() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());
        let mode = posture::commercial();

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, mode,
            vector[1], vector[true], vector[0],
            true, 0,
        );
        assert!(gate_control::has_preset(&config, gate_id, mode));

        gate_control::remove_policy_preset(&mut config, &owner_cap, gate_id, mode);
        assert!(!gate_control::has_preset(&config, gate_id, mode));

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::EPresetNotSet)]
fun remove_preset_fails_when_unset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        gate_control::remove_policy_preset(
            &mut config, &owner_cap, gate_id, posture::commercial(),
        );

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::EPresetNotSet)]
fun preset_view_aborts_when_unset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let config = ts::take_shared<GateConfig>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        let _ = gate_control::preset(&config, gate_id, posture::commercial());

        ts::return_shared(config);
    };

    scenario.end();
}

// === Per-Gate Treasury Tests ===

#[test]
fun set_and_read_treasury() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        assert!(!gate_control::has_treasury(&config, gate_id));

        gate_control::set_treasury(&mut config, &owner_cap, gate_id, TREASURY);
        assert!(gate_control::has_treasury(&config, gate_id));
        assert!(gate_control::treasury(&config, gate_id) == TREASURY);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test]
fun update_treasury_overwrites() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        gate_control::set_treasury(&mut config, &owner_cap, gate_id, TREASURY);
        assert!(gate_control::treasury(&config, gate_id) == TREASURY);

        gate_control::set_treasury(&mut config, &owner_cap, gate_id, TREASURY_2);
        assert!(gate_control::treasury(&config, gate_id) == TREASURY_2);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ETreasuryNotSet)]
fun treasury_view_aborts_when_unset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let config = ts::take_shared<GateConfig>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        let _ = gate_control::treasury(&config, gate_id);

        ts::return_shared(config);
    };

    scenario.end();
}

// === Multi-Operator Isolation ===

#[test]
fun operators_manage_independent_gates() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    let gate_a = object::id_from_address(GATE_ID_1);
    let gate_b = object::id_from_address(GATE_ID_2);

    // Operator A manages gate_a
    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let owner_cap_a = access::create_owner_cap_by_id<Gate>(gate_a, &admin_acl, scenario.ctx());

        gate_control::set_policy_preset(
            &mut config, &owner_cap_a, gate_a, posture::commercial(),
            vector[1], vector[true], vector[100],
            true, 50,
        );
        gate_control::set_treasury(&mut config, &owner_cap_a, gate_a, TREASURY);

        access::transfer_owner_cap(owner_cap_a, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    // Operator B manages gate_b
    ts::next_tx(&mut scenario, OPERATOR_B);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let owner_cap_b = access::create_owner_cap_by_id<Gate>(gate_b, &admin_acl, scenario.ctx());

        gate_control::set_policy_preset(
            &mut config, &owner_cap_b, gate_b, posture::defense(),
            vector[2], vector[false], vector[0],
            false, 0,
        );
        gate_control::set_treasury(&mut config, &owner_cap_b, gate_b, TREASURY_2);

        access::transfer_owner_cap(owner_cap_b, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    // Verify isolation
    ts::next_tx(&mut scenario, ADMIN);
    {
        let config = ts::take_shared<GateConfig>(&scenario);

        assert!(gate_control::has_preset(&config, gate_a, posture::commercial()));
        assert!(!gate_control::has_preset(&config, gate_a, posture::defense()));
        assert!(!gate_control::has_preset(&config, gate_b, posture::commercial()));
        assert!(gate_control::has_preset(&config, gate_b, posture::defense()));

        assert!(gate_control::treasury(&config, gate_a) == TREASURY);
        assert!(gate_control::treasury(&config, gate_b) == TREASURY_2);

        ts::return_shared(config);
    };

    scenario.end();
}

// === Wrong-Owner Rejection ===

#[test, expected_failure(abort_code = gate_control::ENotGateOwner)]
fun wrong_owner_cannot_set_preset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_a = object::id_from_address(GATE_ID_1);
        let gate_b = object::id_from_address(GATE_ID_2);
        let owner_cap_a = access::create_owner_cap_by_id<Gate>(gate_a, &admin_acl, scenario.ctx());

        // Attempt to set preset on gate_b using gate_a's OwnerCap — must abort
        gate_control::set_policy_preset(
            &mut config, &owner_cap_a, gate_b, posture::commercial(),
            vector[], vector[], vector[],
            true, 0,
        );

        access::transfer_owner_cap(owner_cap_a, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ENotGateOwner)]
fun wrong_owner_cannot_set_treasury() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_a = object::id_from_address(GATE_ID_1);
        let gate_b = object::id_from_address(GATE_ID_2);
        let owner_cap_a = access::create_owner_cap_by_id<Gate>(gate_a, &admin_acl, scenario.ctx());

        gate_control::set_treasury(&mut config, &owner_cap_a, gate_b, TREASURY);

        access::transfer_owner_cap(owner_cap_a, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ENotGateOwner)]
fun wrong_owner_cannot_remove_preset() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    let gate_a = object::id_from_address(GATE_ID_1);
    let gate_b = object::id_from_address(GATE_ID_2);

    // Set up a preset on gate_a
    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let owner_cap_a = access::create_owner_cap_by_id<Gate>(gate_a, &admin_acl, scenario.ctx());

        gate_control::set_policy_preset(
            &mut config, &owner_cap_a, gate_a, posture::commercial(),
            vector[1], vector[true], vector[0],
            true, 0,
        );

        access::transfer_owner_cap(owner_cap_a, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    // Operator B tries to remove gate_a's preset with gate_b's cap — must abort
    ts::next_tx(&mut scenario, OPERATOR_B);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let owner_cap_b = access::create_owner_cap_by_id<Gate>(gate_b, &admin_acl, scenario.ctx());

        gate_control::remove_policy_preset(&mut config, &owner_cap_b, gate_a, posture::commercial());

        access::transfer_owner_cap(owner_cap_b, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

// === Entry Cap / Validation Tests ===

#[test, expected_failure(abort_code = gate_control::ETooManyEntries)]
fun preset_rejects_over_20_entries() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        let mut tribes = vector::empty<u32>();
        let mut accesses = vector::empty<bool>();
        let mut tolls = vector::empty<u64>();
        let mut i = 0u32;
        while (i < 21) {
            tribes.push_back(i);
            accesses.push_back(true);
            tolls.push_back(0);
            i = i + 1;
        };

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, posture::commercial(),
            tribes, accesses, tolls,
            true, 0,
        );

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::EInvalidMode)]
fun preset_rejects_invalid_mode() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, 99, // invalid mode
            vector[], vector[], vector[],
            true, 0,
        );

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

// === Empty Preset (Default-Only) ===

#[test]
fun empty_preset_with_defaults_is_valid() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, posture::commercial(),
            vector[], vector[], vector[],
            true, 200,
        );

        assert!(gate_control::has_preset(&config, gate_id, posture::commercial()));
        assert!(gate_control::preset_entry_count(&config, gate_id, posture::commercial()) == 0);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}

// === Exactly 20 Entries (Boundary) ===

#[test]
fun preset_accepts_exactly_20_entries() {
    let mut scenario = ts::begin(ADMIN);
    setup_world(&mut scenario);

    ts::next_tx(&mut scenario, OPERATOR_A);
    {
        let mut config = ts::take_shared<GateConfig>(&scenario);
        let admin_acl = ts::take_shared<AdminACL>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);
        let owner_cap = access::create_owner_cap_by_id<Gate>(gate_id, &admin_acl, scenario.ctx());

        let mut tribes = vector::empty<u32>();
        let mut accesses = vector::empty<bool>();
        let mut tolls = vector::empty<u64>();
        let mut i = 0u32;
        while (i < 20) {
            tribes.push_back(i);
            accesses.push_back(true);
            tolls.push_back(0);
            i = i + 1;
        };

        gate_control::set_policy_preset(
            &mut config, &owner_cap, gate_id, posture::commercial(),
            tribes, accesses, tolls,
            true, 0,
        );

        assert!(gate_control::preset_entry_count(&config, gate_id, posture::commercial()) == 20);

        access::transfer_owner_cap(owner_cap, @0x0);
        ts::return_shared(admin_acl);
        ts::return_shared(config);
    };

    scenario.end();
}
