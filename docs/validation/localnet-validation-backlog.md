# Localnet Validation Backlog

**Retention:** Carry-forward
**Created:** 2026-03-03
**Purpose:** Prioritized inventory of what can be validated on localnet NOW to reduce March 11 test-server risk.

---

## 1. Project Inventory

| # | Project | Path | Type | Primary Claim | Demo-Critical? | Status |
|---|---------|------|------|---------------|:-:|--------|
| 1 | **CivilizationControl (GateControl)** | `sandbox/validation/gate_toll_validation/` | Move | Tribe filter + coin toll enforces access policy atomically | YES | Validated (standalone mock) |
| 2 | **CivilizationControl (TradePost)** | `sandbox/validation/trade_post_validation/` | Move | Cross-address atomic buy settles item + payment in one tx | YES | Validated (standalone mock) |
| 3 | **CivilizationControl (Posture Switch)** | `sandbox/posture-switch-validation/` | Move + TS | Single PTB switches gate posture + toggles turrets | YES | Validated on localnet |
| 4 | **Atomic Courier Experiment** | `experiments/atomic_courier_experiment/` | Move + TS | Escrow state machine (post/accept/complete/expire/cancel) | NO | Validated on localnet (3 flows) |
| 5 | **ZK GatePass** | `sandbox/validation/zk_gatepass_validation/` | Move + Circom | Groth16 proof verifies on-chain; composes with gate witness | NO (stretch) | Validated on devnet |
| 6 | **ZK Membership** | `sandbox/validation/zk_membership/` | JS + Circom | Merkle membership proof generates valid ZK proof | NO (stretch) | Circuit compiled, proofs generated |
| 7 | **ZK Gate** | `sandbox/validation/zk_gate/` | Move | ZK gate extension stub | NO (stretch) | Built, standalone |
| 8 | **Gate Lifecycle Scripts** | `sandbox/validation/step*.sh` | Shell | Full 13-step gate lifecycle reproducible on localnet | YES (reference) | Partial evidence captured |
| 9 | **EVE Vault Signing Smoke** | `sandbox/evevault-signing-smoke/` | React | Wallet adapter connects and signs | NO | Built, not validated |
| 10 | **Minimal Extension Test** | `sandbox/minimal-extension-test/` | Move | World-contracts dependency compiles | YES (infra) | Probe only |
| 11 | **World Contracts** | `vendor/world-contracts/` | Move (vendor) | Gate/SSU/Turret assembly + extension system | YES (upstream) | Read-only reference, v0.0.15 (was v0.0.14) |
| 12 | **Builder Scaffold** | `vendor/builder-scaffold/` | Move + Docker + TS (vendor) | Localnet devnet + reference extensions | YES (infra) | Read-only reference |
| 13 | **EVE Vault** | `vendor/evevault/` | TS monorepo (vendor) | Sponsored tx flow + zkLogin | NO (reference) | Read-only reference |

---

## 2. Claims List per Project

### CivilizationControl — GateControl

| ID | Claim | Demo-Critical | Already Validated |
|----|-------|:---:|:---:|
| GC-01 | Tribe filter blocks non-matching tribes with MoveAbort | YES | YES (standalone mock, devnet) |
| GC-02 | Matching tribe passes and toll is collected atomically | YES | YES (standalone mock, devnet) |
| GC-03 | Rules compose as independent DFs on shared config | YES | YES (devnet) |
| GC-04 | `gate::authorize_extension<Auth>` registers extension on Gate | YES | YES (devnet, 13-step lifecycle) |
| GC-05 | `gate::issue_jump_permit<Auth>` issues transferable JumpPermit | YES | YES (devnet, lifecycle step 12) |
| GC-06 | `jump_with_permit` consumes permit and emits JumpEvent | YES | YES (devnet, lifecycle step 13) |
| GC-07 | Default jump blocked when extension is set | YES | YES (code analysis + tests) |
| GC-08 | Policy change is a single PTB (set tribe + toll DFs) | YES | YES (pattern proven) |
| GC-09 | Per-gate compound DF keys produce independent DFs on shared config | MEDIUM | YES (localnet, 6/6 tests pass — `compound-df-key-validation.md`) |
| GC-10 | Extension wire against real `world` Gate objects (not mocks) | YES | YES (localnet, 4/4 E2E pass — `extension-integration-e2e-validation.md`) |
| GC-11 | `issue_jump_permit` works from our extension package against world-contracts Gate | YES | YES (localnet, JumpPermit issued cross-package — `extension-integration-e2e-validation.md`) |
| GC-12 | AdminACL sponsor enrollment | HIGH | PARTIAL — GC-12a (self-enrollment) validated on localnet (`admin-acl-enrollment-validation.md`) |
| GC-13 | Sponsored transaction with AdminACL passes `verify_sponsor` | HIGH | NOT VALIDATED |

> **v0.0.15 update:** AdminACL removed from owner-path SSU operations (`deposit_by_owner`, `withdraw_by_owner`) and `update_energy_source_connected_*`. GC-12/GC-13 remain relevant for `jump`, `jump_with_permit`, `deposit_fuel`, and other sponsored-path functions.
| GC-14 | Distance proof / `link_gates` succeeds | HIGH | NOT VALIDATED (requires server key) |

### CivilizationControl — TradePost

| ID | Claim | Demo-Critical | Already Validated |
|----|-------|:---:|:---:|
| TP-01 | Cross-address atomic buy: buyer pays, receives item in one tx | YES | YES (standalone mock, 3 buys) |
| TP-02 | Seller receives payment without being online | YES | YES (devnet) |
| TP-03 | Listing deactivated after purchase | YES | YES (devnet) |
| TP-04 | SSU-backed storefront: `withdraw_item<TradeAuth>` without OwnerCap | YES | YES (mock SSU, devnet) |
| TP-05 | Extension witness enables cross-address withdrawal from real world-contracts SSU | YES | YES (localnet, 7/7 tests pass — `ssu-extension-e2e-validation.md`) |
| TP-06 | Split-coins + buy compose in single PTB | YES | YES (devnet) |
| TP-07 | Balance deltas verified (seller +, buyer -) | YES | YES (devnet) |

### CivilizationControl — Posture Switch

| ID | Claim | Demo-Critical | Already Validated |
|----|-------|:---:|:---:|
| PS-01 | Single PTB switches posture (BUSINESS ↔ DEFENSE) | YES | YES (localnet, TS scripts) |
| PS-02 | Gate DF mutations + turret toggles compose in one tx | YES | YES (localnet) |
| PS-03 | PostureChangedEvent + StatusChangedEvent emitted | YES | YES (localnet) |
| PS-04 | OwnerCap borrow/return hot-potato composes for multiple turrets | YES | YES (localnet) |
| PS-05 | Fuel/energy prerequisite chain works (efficiency → fuel → NWN online → turret online) | MEDIUM | YES (localnet) |
| PS-06 | Turret state guards abort if already in target state | LOW | YES (source analysis) |

### Atomic Courier Experiment

| ID | Claim | Demo-Critical | Already Validated |
|----|-------|:---:|:---:|
| AC-01 | Post → Accept → Complete (happy path, courier gets reward + collateral back) | NO | YES (localnet) |
| AC-02 | Post → Accept → Expire (slashing: creator gets slashed collateral + reward) | NO | YES (localnet) |
| AC-03 | Post → Cancel (before accept) | NO | YES (localnet) |
| AC-04 | SSU-to-SSU atomic item transfer in single PTB | NO | YES (localnet) |

### ZK GatePass (Stretch)

| ID | Claim | Demo-Critical | Already Validated |
|----|-------|:---:|:---:|
| ZK-01 | Groth16 proof verifies on Sui (valid proof → true) | NO | YES (devnet) |
| ZK-02 | Invalid ZK proof correctly rejected | NO | YES (devnet) |
| ZK-03 | ZK verification + gate witness consumption in single tx | NO | YES (devnet) |
| ZK-04 | Membership circuit (Merkle depth 10, Poseidon(2)) works on-chain | NO | YES (devnet) |
| ZK-05 | ZK verification gas ≤ 0.001 SUI | NO | YES (devnet, ~1M MIST) |
| ZK-06 | Browser WASM proof generation < 2s | NO | NOT VALIDATED |

### Infrastructure / Cross-Cutting

| ID | Claim | Demo-Critical | Already Validated |
|----|-------|:---:|:---:|
| INF-01 | World-contracts publishes cleanly on localnet | YES | YES (multiple times) |
| INF-02 | Our extension packages compile against world-contracts | YES | YES (cc_posture, gate_toll, trade_post) |
| INF-03 | Events queryable via `suix_queryEvents` | MEDIUM | PARTIAL (localnet yes, test server unknown) |
| INF-04 | Function signatures (A1-A4) match documented | YES | YES (source analysis, current commit) |
| INF-05 | Dynamic fields readable/writable via RPC | YES | YES (devnet) |
| INF-06 | Typed witness extension pattern works cross-package | YES | YES (devnet, multiple packages) |
| INF-07 | `@mysten/sui` TS SDK connects to localnet | YES | YES (posture-switch scripts) |
| INF-08 | BCS encoding for `vector<u8>` uses `tx.pure.vector('u8', Array.from(...))` | MEDIUM | YES (discovered via debugging) |
| INF-09 | `waitForTransaction` needed after `signAndExecuteTransaction` | MEDIUM | YES (discovered via debugging) |
| INF-10 | World-contracts version is stable for March 11 | HIGH | YES — v0.0.15 pinned, signatures verified (`version-pinning-verification.md`) |

---

## 3. Validation Matrix

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ NOW | Can validate on localnet immediately |
| ⏳ MAR11 | Requires hackathon test server (March 11+) |
| 🔒 BLOCKED | Requires external infrastructure/access |
| ⭐ DONE | Already validated with evidence |

| Claim ID | Claim Summary | Classification | Reason (if not NOW) |
|----------|--------------|:-:|------|
| GC-01 | Tribe filter blocks | ⭐ DONE | Standalone mock validated |
| GC-02 | Toll collected | ⭐ DONE | Standalone mock validated |
| GC-03 | Rules compose as DFs | ⭐ DONE | Devnet validated |
| GC-04 | authorize_extension registers | ⭐ DONE | 13-step lifecycle |
| GC-05 | issue_jump_permit works | ⭐ DONE | 13-step lifecycle |
| GC-06 | jump_with_permit consumes | ⭐ DONE | 13-step lifecycle |
| GC-07 | Default jump blocked | ⭐ DONE | Code analysis |
| GC-08 | Policy change = single PTB | ⭐ DONE | Pattern proven |
| **GC-09** | **Per-gate compound DF keys** | **⭐ DONE** | 6/6 tests pass — compound-df-key-validation.md |
| **GC-10** | **Extension against real Gate objects** | **⭐ DONE** | 4/4 E2E pass — extension-integration-e2e-validation.md |
| **GC-11** | **issue_jump_permit from our package** | **⭐ DONE** | JumpPermit issued cross-package — extension-integration-e2e-validation.md |
| GC-12 | AdminACL enrollment | ⭐ DONE (12a) | GC-12a self-enrollment validated — admin-acl-enrollment-validation.md |
| GC-13 | Sponsored tx with AdminACL | ⏳ MAR11 | Dual-sign flow needs external sponsor infra |
| GC-14 | Distance proof / link_gates | 🔒 BLOCKED | Requires server-signed proof (game server key) |
| TP-01 | Cross-address atomic buy | ⭐ DONE | 3 buys validated |
| TP-02 | Seller offline payment | ⭐ DONE | Devnet validated |
| TP-03 | Listing deactivated | ⭐ DONE | Devnet validated |
| TP-04 | SSU-backed buy with mock | ⭐ DONE | 6-tx chain validated |
| **TP-05** | **withdraw_item from real world SSU** | **⭐ DONE** | 7/7 tests pass — ssu-extension-e2e-validation.md |
| TP-06 | Split-coins + buy PTB | ⭐ DONE | Devnet validated |
| TP-07 | Balance deltas | ⭐ DONE | Devnet validated |
| PS-01 | Single PTB posture switch | ⭐ DONE | Localnet validated |
| PS-02 | Gate DF + turret compose | ⭐ DONE | Localnet validated |
| PS-03 | Events emitted | ⭐ DONE | Localnet validated |
| PS-04 | OwnerCap borrow/return | ⭐ DONE | Localnet validated |
| PS-05 | Fuel/energy chain | ⭐ DONE | Localnet validated |
| PS-06 | State guards | ⭐ DONE | Source analysis |
| AC-01..04 | Courier escrow flows | ⭐ DONE | Localnet validated |
| ZK-01..05 | ZK Groth16 flows | ⭐ DONE | Devnet validated |
| ZK-06 | Browser WASM prover | ⏳ MAR11 | Requires frontend build |
| INF-01..09 | Infrastructure baseline | ⭐ DONE | Multiple localnet runs |
| **INF-10** | **World-contracts version stability** | **⭐ DONE** | v0.0.15 pinned, signatures verified — version-pinning-verification.md |
| **GC-12a** | **AdminACL self-enrollment on localnet** | **⭐ DONE** | Self-enrollment validated — admin-acl-enrollment-validation.md |

---

## 4. Top 10 Validations to Run NOW (Ordered by Risk Reduction)

### Priority 1: Extension Integration Against Real World-Contracts (GC-10, GC-11)

**Risk:** All sandbox validations use standalone mock objects. If our extension code doesn't compose correctly with real `world::gate::Gate` objects, the entire demo fails on March 11.

**What to test:**
1. Publish world-contracts on localnet
2. Publish a minimal gate extension package that depends on `world`
3. Create Gate objects, authorize our extension
4. Call `issue_jump_permit<OurAuth>` from our extension package
5. Call `jump_with_permit` with the issued permit

**Pass criteria:**
- Extension registers on Gate (extension field = `Some(TypeName)`)
- `issue_jump_permit` returns a JumpPermit with correct fields
- `jump_with_permit` consumes permit, emits JumpEvent
- Default jump (no permit) aborts

**Estimated time:** 2–3 hours
**Impact:** CRITICAL — validates the entire GateControl architecture against real contracts

---

### Priority 2: Per-Gate Compound DF Keys (GC-09)

**Risk:** CivilizationControl uses one shared `ExtensionConfig` with per-gate rules stored as dynamic fields keyed by `{ gate_id: ID }`. If compound keys don't produce independent DFs, all per-gate configuration breaks.

**What to test:**
1. Create a shared object
2. Add DF with key `RuleKey { gate_id: gate_a_id }` → value A
3. Add DF with key `RuleKey { gate_id: gate_b_id }` → value B
4. Read back both — verify independent values

**Pass criteria:**
- Two DFs exist on same object with different compound keys
- Each DF returns its own independent value
- Updating one doesn't affect the other

**Estimated time:** 30 min (Move test module)
**Impact:** HIGH — per-gate config is foundational to multi-gate management

---

### Priority 3: SSU withdraw_item Against Real World-Contracts (TP-05)

**Risk:** TradePost's "SSU-backed storefront" was validated against `mock_ssu.move`, not real `world::storage_unit`. If the real SSU's `withdraw_item<Auth>` has different semantics (e.g., requires OwnerCap, different inventory structure), the trade flow breaks.

**What to test:**
1. Publish world-contracts on localnet
2. Create SSU, stock items via OwnerCap holder
3. Authorize our TradeAuth extension on the SSU
4. Call `withdraw_item<TradeAuth>()` from a different address (buyer)
5. Verify item transferred to buyer without OwnerCap

**Pass criteria:**
- `withdraw_item<TradeAuth>` succeeds from non-owner address
- Item object ownership transfers to caller
- SSU inventory decremented

**Estimated time:** 2–3 hours
**Impact:** HIGH — validates the entire TradePost/SSU integration pattern

---

### Priority 4: AdminACL Self-Enrollment on Localnet (GC-12a)

**Risk:** On localnet we own GovernorCap and can self-enroll as sponsor. If this flow works, it de-risks the March 11 AdminACL check (we understand the exact enrollment mechanics).

**What to test:**
1. Publish world-contracts on localnet
2. Use GovernorCap to call `access::add_sponsor_to_acl(&GovernorCap, &mut AdminACL, our_address)`
3. Verify our address appears in AdminACL
4. Attempt a sponsored-style transaction (or verify `verify_sponsor` passes for our sender)

**Pass criteria:**
- Address added to AdminACL without error
- Transactions from enrolled address pass `verify_sponsor` checks
- `verify_sponsor` sender fallback confirmed (non-sponsored tx from enrolled sender works)

**Estimated time:** 1–2 hours
**Impact:** HIGH — de-risks the #1 structural risk (SR-1) identified in fragility audit

---

### Priority 5: Full GateControl E2E with Toll + Tribe on Real World-Contracts (GC-01+02+10+11)

**Risk:** The standalone toll/tribe mock was validated but never composed with real world-contracts objects. A full end-to-end flow (publish world → create gates → authorize ext → set tribe rule → set toll → attempt wrong-tribe jump → attempt correct-tribe jump with toll) is the ultimate integration test.

**What to test:**
1. Publish world + our entire CivControl extension
2. Create gate pair (or two independent gates)
3. Authorize extension, set tribe + toll rules via DFs
4. Wrong-tribe character attempts jump → expect abort
5. Correct-tribe character jumps → toll collected, permit issued, jump completes

**Pass criteria:**
- Wrong tribe: MoveAbort with expected code
- Correct tribe: toll coin transferred, JumpPermit issued, JumpEvent emitted
- Gate extension field populated
- DFs readable via RPC

**Estimated time:** 3–4 hours (depends on Priorities 1+4)
**Impact:** CRITICAL — proves the demo can work end-to-end

---

### Priority 6: Version Pinning Verification (INF-10)

**Risk:** If world-contracts changes between now and March 11, any validated signature could break. Need to verify current commit hash and document it.

**What to test:**
1. Record exact git commit of `vendor/world-contracts`
2. Verify all function signatures (A1–A4 from Day-1 checklist) match
3. Diff against any upstream changes since last submodule update
4. Document expected signatures for March 11 re-verification

**Pass criteria:**
- All 4 function signatures match documented expectations
- No breaking changes since last verified commit
- Commit hash recorded for March 11 comparison

**Estimated time:** 15 min
**Impact:** MEDIUM — early detection of upstream breaking changes

---

### Priority 7: Event Schema Validation on Localnet (INF-03)

**Risk:** Signal Feed depends on `suix_queryEvents`. If event schema or queryability differs between localnet and test server, the monitoring UI breaks.

**What to test:**
1. Run any transaction that emits events (gate lifecycle, posture switch)
2. Query events via `suix_queryEvents` with MoveEventType filter
3. Query events via transaction digest
4. Verify field structure matches expected schema

**Pass criteria:**
- `suix_queryEvents` returns events by type
- Transaction digest query returns events with full field structure
- `JumpEvent`, `StatusChangedEvent`, `PostureChangedEvent` all queryable

**Estimated time:** 30 min (piggyback on Priority 1 or 5)
**Impact:** MEDIUM — Signal Feed is a demo surface

---

### Priority 8: Full Posture Switch Repeatability (PS-01 regression)

**Risk:** Posture switch was validated once. If the localnet gets regenerated (force-regenesis), can the entire flow be re-run from scratch deterministically?

**What to test:**
1. Start fresh localnet (`sui start --with-faucet --force-regenesis`)
2. Run `setup.ts` (publish world, publish cc_posture, create gates/turrets, fuel/online)
3. Run `posture-switch.ts` (both directions)
4. Verify same events and state transitions as documented

**Pass criteria:**
- Setup completes without manual intervention
- Both posture directions succeed
- Events match documented schema
- Total time < 5 min (automated)

**Estimated time:** 1 hour (mostly waiting for setup)
**Impact:** MEDIUM — proves harness repeatability for March 11

---

### Priority 9: Compound DF Key with Multiple Rule Types (GC-09 extended)

**Risk:** CivilizationControl stores both `TribeRuleKey { gate_id }` and `TollRuleKey { gate_id }` on the same `ExtensionConfig`. Need to verify two different key types with same `gate_id` field are independently addressable.

**What to test:**
1. Create shared config
2. Add `TribeRuleKey { gate_id: X }` → tribe_id value
3. Add `TollRuleKey { gate_id: X }` → toll_amount value (same gate_id!)
4. Read both back independently
5. Update one, verify other unchanged

**Pass criteria:**
- Both DFs exist simultaneously on same object
- Same `gate_id` in different key structs produces different DF slots
- Independent read/write confirmed

**Estimated time:** 30 min (extend Priority 2 Move test)
**Impact:** MEDIUM — validates multi-rule composition pattern

---

### Priority 10: Courier Escrow Repeatability (AC regression)

**Risk:** Courier escrow was validated on a previous localnet. Verify harness scripts still work on fresh localnet.

**What to test:**
1. Fresh localnet
2. Run `phase2-test.ts` (3 escrow scenarios)
3. Verify all 3 pass with expected balances

**Pass criteria:**
- All 3 flows (happy/expire/cancel) pass
- Gas costs within expected range
- No new aborts

**Estimated time:** 1 hour
**Impact:** LOW — not demo-critical, but proves project quality

---

## 5. Exact Commands / Scripts / Pass-Fail Checks

### Priority 1 & 5: Gate Extension Integration E2E

```powershell
# 1. Start fresh localnet
sui start --with-faucet --force-regenesis

# 2. Fund addresses
sui client faucet --address <ADDR>

# 3. Publish world-contracts
sui client publish --path vendor/world-contracts/contracts/world --gas-budget 500000000 --json > notes/world-publish-localnet.json

# 4. Extract package ID and object IDs
# (parse JSON output for packageId, GovernorCap, AdminACL, ObjectRegistry)

# 5. Publish CivControl extension (must depend on world)
sui client publish --path <civcontrol-path> --gas-budget 200000000 --json

# 6. Create Gate objects
# sui client ptb --move-call <world>::gate::create_gate ...

# 7. Authorize extension on gates
# sui client ptb --move-call <world>::gate::authorize_extension<CivAuth> ...

# 8. Set tribe + toll rules via DF
# sui client ptb --move-call <civcontrol>::gate_permit::set_tribe_rule ...
# sui client ptb --move-call <civcontrol>::gate_permit::set_coin_toll ...

# 9. Wrong-tribe jump attempt
# Expect: MoveAbort from gate_permit module

# 10. Correct-tribe jump
# Expect: JumpPermit issued, JumpEvent emitted, toll transferred
```

**Pass:** Steps 9 abort expected, step 10 succeeds with toll payment.
**Fail:** Any unexpected abort, missing events, or toll not transferred.

### Priority 2 & 9: Compound DF Keys (Move Test)

```move
// Test module — publish and run
module df_key_test::compound_keys {
    use sui::dynamic_field as df;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::TxContext;
    use sui::transfer;

    public struct Config has key { id: UID }
    public struct TribeKey has copy, drop, store { gate_id: ID }
    public struct TollKey has copy, drop, store { gate_id: ID }

    public fun test_compound_keys(ctx: &mut TxContext) {
        let mut config = Config { id: object::new(ctx) };
        let gate_a = object::id_from_address(@0xA);
        let gate_b = object::id_from_address(@0xB);

        // Same key type, different gate IDs
        df::add(&mut config.id, TribeKey { gate_id: gate_a }, 1u64);
        df::add(&mut config.id, TribeKey { gate_id: gate_b }, 2u64);

        // Different key type, same gate ID
        df::add(&mut config.id, TollKey { gate_id: gate_a }, 100u64);

        assert!(*df::borrow(&config.id, TribeKey { gate_id: gate_a }) == 1, 0);
        assert!(*df::borrow(&config.id, TribeKey { gate_id: gate_b }) == 2, 1);
        assert!(*df::borrow(&config.id, TollKey { gate_id: gate_a }) == 100, 2);

        transfer::share_object(config);
    }
}
```

**Pass:** All 3 asserts pass. Shared object created with 3 independent DFs.
**Fail:** Any assert fires, or DF collisions detected.

### Priority 4: AdminACL Self-Enrollment

```powershell
# After publishing world-contracts (step 3 above):
# Extract GovernorCap and AdminACL IDs from publish output

# Enroll our address as sponsor
sui client ptb \
  --move-call <world>::access::add_sponsor_to_acl \
  --args <GovernorCap> <AdminACL> <our_address>

# Verify enrollment
sui client object <AdminACL> --json
# Check authorized_sponsors field includes our address

# Test verify_sponsor by executing a gate function that calls it
# (e.g., gate operations that check AdminACL)
```

**Pass:** Address appears in AdminACL sponsors. Subsequent operations pass `verify_sponsor`.
**Fail:** Enrollment aborts, or subsequent operations still fail `verify_sponsor`.

### Priority 6: Version Pinning

```powershell
# Record current submodule state
cd c:\dev\sui-playground
git -C vendor/world-contracts log -1 --format="%H %s"
git -C vendor/world-contracts describe --tags --always

# Verify A1-A4 signatures
Select-String -Path "vendor/world-contracts/contracts/world/sources/assemblies/gate.move" -Pattern "fun authorize_extension|fun issue_jump_permit"
Select-String -Path "vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move" -Pattern "fun withdraw_item"
Select-String -Path "vendor/world-contracts/contracts/world/sources/primitives/inventory.move" -Pattern "struct Item"
```

**Pass:** All 4 signatures match Day-1 checklist expectations. Commit hash recorded.
**Fail:** Any signature differs from documented expectations.

### Priority 8: Posture Switch Repeatability

```powershell
# Fresh localnet (in background terminal)
sui start --with-faucet --force-regenesis

# In another terminal:
cd sandbox/posture-switch-validation/ts
npx tsx src/setup.ts          # Publish + create objects
npx tsx src/full-test.ts      # Run posture switch both directions

# Verify output matches documented events
```

**Pass:** Setup completes, both switch directions succeed, events match.
**Fail:** Any script error, missing events, or state mismatch.

---

## 6. Open Questions to Carry to March 11

| # | Question | Impact | How to Resolve |
|---|----------|--------|---------------|
| Q1 | Will hackathon test server provide GovernorCap / AdminACL enrollment path? | CRITICAL — blocks sponsored tx, gate jumps | Ask organizers Day 1. If no: use sender-in-AdminACL fallback. |
| Q2 | Will `link_gates` / distance proof mechanism work without game server keys? | HIGH — blocks gate pair linking | Check if test server provides distance proof endpoint. If no: use unlinked gates for demo. |
| Q3 | Has world-contracts updated since our last submodule pin? | HIGH — signature breakage risk | `git -C vendor/world-contracts fetch; git log HEAD..origin/main` on Day 1. |
| Q4 | Which Character objects will be available on test server? | MEDIUM — demo needs tribe assignments | Check test server setup docs/discord for character creation flow. |
| Q5 | Will `suix_queryEvents` work on test server RPC? | MEDIUM — Signal Feed depends on this | `curl` event query Day 1. If no: fallback to tx-digest polling. |
| Q6 | Is EVE token (Coin<EVE>) usable on test server, or SUI-only? | LOW — toll denomination | Check `assets` package deployment. Default to SUI<> if EVE unavailable. |
| Q7 | Can we set DApp URL on SSU/Gate objects for in-game browser? | LOW — "Best Integration" bonus | Check via test server admin tools. |
| Q8 | ~~Will sponsored tx dual-sign flow work without EVE Vault?~~ | ~~MEDIUM~~ **RESOLVED** | *(Resolved 2026-03-04: (1) Non-sponsored path: sender in AdminACL, `verify_sponsor` falls back to `ctx.sender()` — validated on localnet 2026-02-28. (2) EVE Vault sponsored tx via `evefrontier:sponsoredTransaction` wallet feature works end-to-end (v0.0.4, 30f74ef). No custom sponsor service needed.)* |
| Q9 | Are there pre-spawned assemblies (Gates, SSUs, Turrets) on test server? | MEDIUM — saves setup time | Check test server state on Day 1. If yes: use existing. If no: create from scratch. |
| Q10 | Test server Sui version — same as our localnet (v1.65+)? | LOW — subtle behavior diffs | `sui --version` on both. |

---

## 7. Already-Validated Summary (No Re-Test Needed Unless Upstream Changes)

These items have strong evidence and don't need re-validation unless world-contracts changes:

| Domain | Evidence Location | Confidence |
|--------|------------------|:---:|
| Posture switch (single PTB, both directions) | `docs/sandbox/posture-switch-localnet-validation.md` | HIGH |
| Gate toll standalone (tribe + coin) | `docs/operations/shortlist-viability-validation-report.md` Test 2-3 | HIGH |
| Trade post standalone (escrow + SSU mock) | `docs/operations/shortlist-viability-validation-report.md` Test 5-7 | HIGH |
| ZK Groth16 verify (standalone + compose) | `docs/operations/zk-gatepass-feasibility-report.md` | HIGH |
| ZK Membership circuit | Devnet package `0xc0af...` | MEDIUM |
| Courier escrow (3 scenarios) | `experiments/atomic_courier_experiment/FEASIBILITY-REPORT.md` | HIGH |
| 13-step gate lifecycle (manual) | `notes/gate-lifecycle-evidence.md` (partial) | MEDIUM |
| TS SDK pitfalls (BCS, waitForTransaction) | `sandbox/posture-switch-validation/ts/src/utils.ts` | HIGH |

---

## 8. Validation Harness Architecture (For New Tests)

All new validation harnesses should follow this pattern:

```
sandbox/validation/<test-name>/
├── Move.toml                  # Dependencies: world + sui
├── sources/
│   └── <module>.move          # Minimal test contract
├── scripts/
│   ├── setup.ts               # Publish + create objects
│   ├── run.ts                 # Execute test transactions
│   └── verify.ts              # Read objects + assert invariants
├── README.md                  # What this tests, pass/fail criteria
└── results/
    └── <date>-localnet.json   # Captured tx digests + object state
```

**Prerequisites for all harnesses:**
1. Local Sui devnet running (`sui start --with-faucet --force-regenesis`)
2. World-contracts published (capture package ID)
3. Test addresses funded via faucet
4. Node.js + `@mysten/sui` installed

**TS SDK pattern (from posture-switch-validation):**
```typescript
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new SuiClient({ url: 'http://127.0.0.1:9000' });
// ... build PTB, sign, execute, waitForTransaction, read objects
```
