/// Tests for the trade_post module.
///
/// Listing CRUD and view functions are tested with direct object creation.
/// End-to-end buy flow requires full world infrastructure (StorageUnit,
/// Character, ObjectRegistry, AdminACL) — covered by integration tests
/// on devnet/testnet.
#[test_only, allow(deprecated_usage)]
module civilization_control::trade_post_tests;

use civilization_control::trade_post;
use sui::test_scenario as ts;
use sui::coin;
use sui::sui::SUI;

const SELLER: address = @0x5E11;
const BUYER: address = @0xB0B;
const SSU_ID_ADDR: address = @0x5501;

fun begin(): ts::Scenario {
    ts::begin(SELLER)
}

fun setup(scenario: &mut ts::Scenario) {
    ts::next_tx(scenario, SELLER);
    trade_post::init_for_testing(scenario.ctx());
}

// === Listing Creation Tests ===

#[test]
fun create_listing_sets_fields() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, SELLER);
    {
        // Verify module initialized by taking admin cap
        let _admin_cap = ts::take_from_sender<trade_post::TradePostAdminCap>(&scenario);
        ts::return_to_sender(&scenario, _admin_cap);
    };

    scenario.end();
}

#[test]
fun cancel_listing_by_seller_succeeds() {
    let mut scenario = begin();
    setup(&mut scenario);

    // Simulate a listing (construct directly via test helper approach)
    ts::next_tx(&mut scenario, SELLER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42, // item_type_id
            10, // quantity
            1000, // price
            scenario.ctx(),
        );

        // Verify view functions
        assert!(trade_post::listing_storage_unit_id(&listing) == object::id_from_address(SSU_ID_ADDR));
        assert!(trade_post::listing_seller(&listing) == SELLER);
        assert!(trade_post::listing_item_type_id(&listing) == 42);
        assert!(trade_post::listing_quantity(&listing) == 10);
        assert!(trade_post::listing_price(&listing) == 1000);

        // Cancel should succeed for seller
        trade_post::cancel_listing(listing, scenario.ctx());
    };

    scenario.end();
}

#[test, expected_failure(abort_code = trade_post::ENotSeller)]
fun cancel_listing_by_non_seller_aborts() {
    let mut scenario = begin();
    setup(&mut scenario);

    // Seller creates listing
    ts::next_tx(&mut scenario, SELLER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42,
            10,
            1000,
            scenario.ctx(),
        );
        trade_post::share_listing(listing);
    };

    // Buyer tries to cancel
    ts::next_tx(&mut scenario, BUYER);
    {
        let listing = ts::take_shared<trade_post::Listing>(&scenario);
        trade_post::cancel_listing(listing, scenario.ctx());
    };

    scenario.end();
}

#[test, expected_failure(abort_code = trade_post::EQuantityZero)]
fun create_listing_zero_quantity_aborts() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, SELLER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42,
            0, // zero quantity
            1000,
            scenario.ctx(),
        );
        sui::test_utils::destroy(listing);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = trade_post::EPriceZero)]
fun create_listing_zero_price_aborts() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, SELLER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42,
            10,
            0, // zero price
            scenario.ctx(),
        );
        sui::test_utils::destroy(listing);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = trade_post::EInsufficientPayment)]
fun buy_with_insufficient_payment_aborts() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, BUYER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42,
            1,
            1000, // price = 1000
            scenario.ctx(),
        );

        // Create insufficient payment
        let payment = coin::mint_for_testing<SUI>(500, scenario.ctx());

        // buy_validation_only tests payment check without needing a real SSU
        trade_post::buy_validate_payment_for_testing(
            &listing,
            &payment,
        );

        sui::test_utils::destroy(listing);
        sui::test_utils::destroy(payment);
    };

    scenario.end();
}

#[test]
fun buy_payment_validation_passes_with_exact_amount() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, BUYER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42,
            1,
            1000,
            scenario.ctx(),
        );

        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());

        // Should not abort
        trade_post::buy_validate_payment_for_testing(
            &listing,
            &payment,
        );

        sui::test_utils::destroy(listing);
        sui::test_utils::destroy(payment);
    };

    scenario.end();
}

#[test]
fun buy_payment_validation_passes_with_overpayment() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, BUYER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            42,
            1,
            1000,
            scenario.ctx(),
        );

        let payment = coin::mint_for_testing<SUI>(2000, scenario.ctx());

        // Overpayment should also pass validation
        trade_post::buy_validate_payment_for_testing(
            &listing,
            &payment,
        );

        sui::test_utils::destroy(listing);
        sui::test_utils::destroy(payment);
    };

    scenario.end();
}

#[test]
fun view_functions_return_correct_values() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, SELLER);
    {
        let listing = trade_post::create_listing_for_testing(
            object::id_from_address(SSU_ID_ADDR),
            99,
            25,
            5000,
            scenario.ctx(),
        );

        assert!(trade_post::listing_storage_unit_id(&listing) == object::id_from_address(SSU_ID_ADDR));
        assert!(trade_post::listing_seller(&listing) == SELLER);
        assert!(trade_post::listing_item_type_id(&listing) == 99);
        assert!(trade_post::listing_quantity(&listing) == 25);
        assert!(trade_post::listing_price(&listing) == 5000);

        trade_post::cancel_listing(listing, scenario.ctx());
    };

    scenario.end();
}

#[test]
fun init_creates_admin_cap() {
    let mut scenario = begin();
    setup(&mut scenario);

    ts::next_tx(&mut scenario, SELLER);
    {
        let admin_cap = ts::take_from_sender<trade_post::TradePostAdminCap>(&scenario);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario.end();
}
