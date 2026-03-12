# SSU Extension E2E Validation Report (TP-05)

**Retention:** Carry-forward

## Summary

**All 7 test claims PASS** — cross-package extension withdrawal from real world-contracts `StorageUnit` is fully functional with world-contracts v0.0.15. This validates the complete TradePost/SSU integration pattern.

## Claims Validated

| Claim | Test | Status | Description |
|-------|------|--------|-------------|
| TP-05 | `test_cross_package_withdraw_item` | **PASS** | `withdraw_item<TradeAuth>` succeeds against real StorageUnit |
| TP-05 | `test_non_owner_withdraw_via_extension` | **PASS** | Non-owner (buyer) withdraws via authorized extension |
| TP-05a | `test_deposit_to_owned_delivery` | **PASS** | `deposit_to_owned<TradeAuth>` delivers items to buyer's SSU |
| TP-05b | `test_partial_quantity_withdraw` | **PASS** | Partial quantity withdrawal (v0.0.15 `quantity: u32` param) |
| TP-05c | `test_wrong_extension_aborts` | **PASS** | Unauthorized witness type aborts with expected error |
| TP-05d | `test_parent_id_set_correctly` | **PASS** | `parent_id` field populated correctly on created items |
| TP-05e | `test_full_trade_flow` | **PASS** | End-to-end: authorize → deposit → withdraw → deliver → verify balances |

## Environment

- **Sui CLI:** v1.66.1-bac3f508b83b
- **Test mode:** `sui move test` (in-memory `test_scenario`, no chain connection)
- **world-contracts:** v0.0.15 (commit `74d30c8eef5d327b8477334326d195750c886900`)

> **v0.0.17 update:** This validation was performed against v0.0.15. world-contracts is now at v0.0.17 (26d0a8c). SSU `withdraw_item` now has an online guard (`ENotOnline`). Extension auth and deposit/withdraw patterns remain structurally valid.
>
> **v0.0.18 update:** SSU now supports open inventory (`deposit_to_open_inventory<Auth>` / `withdraw_from_open_inventory<Auth>`). Two inventory keys created at anchor (main + open). `ensure_open_inventory()` provides backward compat for pre-v0.0.18 anchored SSUs.
- **Test package:** `sandbox/validation/ssu_extension_test/`
- **Active env workaround:** Switched to `testnet` env before running `sui move test` to avoid CLI v1.66.1 environment hash mismatch with dependency `[environments] local = "0x0"` placeholder

## Test Output (verbatim)

```
INCLUDING DEPENDENCY MoveStdlib
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY World
BUILDING ssu_extension_test
Running Move unit tests
[ PASS    ] ssu_extension_test::ssu_tests::test_cross_package_withdraw_item
[ PASS    ] ssu_extension_test::ssu_tests::test_deposit_to_owned_delivery
[ PASS    ] ssu_extension_test::ssu_tests::test_full_trade_flow
[ PASS    ] ssu_extension_test::ssu_tests::test_non_owner_withdraw_via_extension
[ PASS    ] ssu_extension_test::ssu_tests::test_parent_id_set_correctly
[ PASS    ] ssu_extension_test::ssu_tests::test_partial_quantity_withdraw
[ PASS    ] ssu_extension_test::ssu_tests::test_wrong_extension_aborts
Test result: OK. Total tests: 7; passed: 7; failed: 0
```

## Architecture Validated

### Extension Witness Pattern
```
[ssu_extension_test package]         [world-contracts package]
  trade_auth::TradeAuth (has drop) ──→ storage_unit::withdraw_item<TradeAuth>()
  public(package) fun trade_auth()     storage_unit::authorize_extension<TradeAuth>()
                                       storage_unit::deposit_to_owned<TradeAuth>()
```

### Key v0.0.15 Behaviors Confirmed

1. **`withdraw_item<Auth>(ssu, auth, item_type_id, quantity, ctx)`**
   - Requires prior `authorize_extension<Auth>(ssu, owner_cap)` call
   - Caller does NOT need OwnerCap — extension witness is sufficient
   - Returns `Item` object with correct `parent_id` (the SSU's UID)
   - Supports partial quantity extraction (extracts subset, leaves remainder)

2. **`deposit_to_owned<Auth>(ssu, auth, item, ctx)`**
   - Deposits item into SSU controlled by a different owner
   - Requires authorized extension on the TARGET SSU
   - Item correctly appears in target SSU's inventory

3. **Authorization enforcement:**
   - `authorize_extension<Auth>(ssu, owner_cap)` registers the extension
   - Using an unauthorized witness type (e.g., `FakeAuth`) aborts at runtime
   - Extension authorization is type-scoped — only the EXACT witness type is accepted

4. **parent_id semantics:**
   - Items created via `inventory::mint_test_item` get `parent_id` set to the SSU's UID
   - Confirms deposit_item validates origin SSU

### Bootstrap Chain (test_scenario)
```
admin() → setup_world()
         → create_character(user_a)
         → create_network_node(user_a)
         → create_ssu(user_a)
         → bring_online(user_a)           # NWN online → SSU anchor + online
         → mint_items(user_a)             # Stock SSU with test items
         → authorize_extension<TradeAuth>(user_a)  # Via OwnerCap borrow/return
```

## Files

| File | Purpose |
|------|---------|
| `sandbox/validation/ssu_extension_test/Move.toml` | Package manifest, depends on world-contracts v0.0.15 |
| `sandbox/validation/ssu_extension_test/sources/trade_auth.move` | Extension witness definition (`TradeAuth has drop`) |
| `sandbox/validation/ssu_extension_test/tests/ssu_extension_tests.move` | 7 Move unit tests (607 lines) |

## Impact on CivilizationControl

This validation confirms:
- **TradePost architecture is sound:** A separate CC extension package can withdraw from player SSUs using its own witness type, without OwnerCap sharing
- **Cross-player delivery works:** `deposit_to_owned<Auth>` enables buyer-side fulfillment (seller SSU → buyer SSU)
- **Partial fills supported:** v0.0.15's `quantity` parameter enables partial order fulfillment
- **Security boundary intact:** Only the package that defines the witness can mint it (`public(package)`)

## Known Limitation: CLI Environment Workaround

`sui move test` with world-contracts dependency requires switching active env to one NOT listed in any Move.toml `[environments]` section. This is a CLI v1.66.1 design issue — the CLI validates chain hash across all transitive dependencies, and world-contracts uses `"0x0"` as a placeholder hash.

**Workaround:** `sui client switch --env testnet && sui move test --path <pkg>`

This only affects `sui move test` execution, not test correctness. Tests run in the Move VM simulator (`test_scenario`) with no chain connection.

## Reproduction

```powershell
# From repository root (c:\dev\sui-playground)
sui client switch --env testnet
sui move test --path sandbox/validation/ssu_extension_test
# Expected: Test result: OK. Total tests: 7; passed: 7; failed: 0
```
