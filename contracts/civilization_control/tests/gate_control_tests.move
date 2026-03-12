/// Tests for the gate_control module.
///
/// Rule CRUD and view functions are tested with in-module config objects.
/// End-to-end permit issuance requires full world infrastructure
/// (Gate, Character, NetworkNode, AdminACL) — covered by integration
/// tests on devnet/testnet.
#[test_only]
module civilization_control::gate_control_tests;

use civilization_control::gate_control;
use sui::test_scenario as ts;

const ADMIN: address = @0xAD;
const TREASURY: address = @0xFEE1;
const TREASURY_2: address = @0xFEE2;
const GATE_ID_1: address = @0x1001;
const GATE_ID_2: address = @0x2002;

fun begin(): ts::Scenario {
    ts::begin(ADMIN)
}

fun setup_config(scenario: &mut ts::Scenario) {
    ts::next_tx(scenario, ADMIN);
    gate_control::init_for_testing(scenario.ctx());
}

// === Rule CRUD Tests ===

#[test]
fun set_and_read_tribe_rule() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        // Initially no rule
        assert!(!gate_control::has_tribe_rule(&config, gate_id));

        // Set tribe rule
        gate_control::set_tribe_rule(&mut config, &admin_cap, gate_id, 42);
        assert!(gate_control::has_tribe_rule(&config, gate_id));
        assert!(gate_control::tribe_rule(&config, gate_id) == 42);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test]
fun update_tribe_rule_overwrites() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        gate_control::set_tribe_rule(&mut config, &admin_cap, gate_id, 10);
        assert!(gate_control::tribe_rule(&config, gate_id) == 10);

        // Overwrite
        gate_control::set_tribe_rule(&mut config, &admin_cap, gate_id, 20);
        assert!(gate_control::tribe_rule(&config, gate_id) == 20);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test]
fun set_and_read_coin_toll() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        assert!(!gate_control::has_coin_toll(&config, gate_id));

        gate_control::set_coin_toll(&mut config, &admin_cap, gate_id, 1000, TREASURY);
        assert!(gate_control::has_coin_toll(&config, gate_id));
        assert!(gate_control::toll_price(&config, gate_id) == 1000);
        assert!(gate_control::toll_treasury(&config, gate_id) == TREASURY);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test]
fun update_coin_toll_overwrites() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        gate_control::set_coin_toll(&mut config, &admin_cap, gate_id, 500, TREASURY);
        assert!(gate_control::toll_price(&config, gate_id) == 500);

        gate_control::set_coin_toll(&mut config, &admin_cap, gate_id, 750, TREASURY_2);
        assert!(gate_control::toll_price(&config, gate_id) == 750);
        assert!(gate_control::toll_treasury(&config, gate_id) == TREASURY_2);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test]
fun remove_tribe_rule_clears() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        gate_control::set_tribe_rule(&mut config, &admin_cap, gate_id, 5);
        assert!(gate_control::has_tribe_rule(&config, gate_id));

        gate_control::remove_tribe_rule(&mut config, &admin_cap, gate_id);
        assert!(!gate_control::has_tribe_rule(&config, gate_id));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test]
fun remove_coin_toll_clears() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        gate_control::set_coin_toll(&mut config, &admin_cap, gate_id, 100, @0xABC);
        assert!(gate_control::has_coin_toll(&config, gate_id));

        gate_control::remove_coin_toll(&mut config, &admin_cap, gate_id);
        assert!(!gate_control::has_coin_toll(&config, gate_id));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ETribeRuleNotSet)]
fun remove_tribe_rule_fails_when_unset() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        gate_control::remove_tribe_rule(&mut config, &admin_cap, gate_id);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ECoinTollNotSet)]
fun remove_coin_toll_fails_when_unset() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        gate_control::remove_coin_toll(&mut config, &admin_cap, gate_id);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test]
fun per_gate_rules_are_independent() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let admin_cap = ts::take_from_sender<gate_control::AdminCap>(&scenario);
        let gate_a = object::id_from_address(GATE_ID_1);
        let gate_b = object::id_from_address(GATE_ID_2);

        // Set different tribes on different gates
        gate_control::set_tribe_rule(&mut config, &admin_cap, gate_a, 1);
        gate_control::set_tribe_rule(&mut config, &admin_cap, gate_b, 2);

        assert!(gate_control::tribe_rule(&config, gate_a) == 1);
        assert!(gate_control::tribe_rule(&config, gate_b) == 2);

        // Set toll only on gate_a
        gate_control::set_coin_toll(&mut config, &admin_cap, gate_a, 999, TREASURY);
        assert!(gate_control::has_coin_toll(&config, gate_a));
        assert!(!gate_control::has_coin_toll(&config, gate_b));

        // Remove tribe from gate_a, gate_b unaffected
        gate_control::remove_tribe_rule(&mut config, &admin_cap, gate_a);
        assert!(!gate_control::has_tribe_rule(&config, gate_a));
        assert!(gate_control::has_tribe_rule(&config, gate_b));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ETribeRuleNotSet)]
fun tribe_rule_view_aborts_when_unset() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        // Should abort — no rule set
        let _ = gate_control::tribe_rule(&config, gate_id);

        ts::return_shared(config);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = gate_control::ECoinTollNotSet)]
fun toll_price_view_aborts_when_unset() {
    let mut scenario = begin();
    setup_config(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config = ts::take_shared<gate_control::GateConfig>(&scenario);
        let gate_id = object::id_from_address(GATE_ID_1);

        let _ = gate_control::toll_price(&config, gate_id);

        ts::return_shared(config);
    };

    scenario.end();
}
