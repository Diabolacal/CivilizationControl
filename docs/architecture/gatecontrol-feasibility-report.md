# GateControl Feasibility Validation Report

**Retention:** Carry-forward

> **Date:** 2026-02-16  
> **Source:** Sub-agent B — world-contracts gate system analysis  
> **Inputs:** `vendor/world-contracts/contracts/world/sources/assemblies/gate.move`, extension examples, access control, gate tests, hackathon shortlist  

---

## A. GateControl Architecture Summary

### How Smart Gates Work

A **Gate** is a shared Sui object representing an in-game interstellar jumpgate. Gates enable travel between two linked positions in space. The core lifecycle:

1. **Anchor** — Admin creates a Gate via `gate::anchor()`, binding it to a Character, NetworkNode (energy source), ObjectRegistry, type_id, and location hash. An `OwnerCap<Gate>` is created and transferred to the character.
2. **Link** — Two gates are linked via `gate::link_gates()`, requiring both OwnerCaps, a distance proof (server-signed), and the GateConfig max distance check.
3. **Online** — Each gate goes online via `gate::online()`, reserving energy from its NetworkNode.
4. **Jump** — Characters travel between linked, online gates via `gate::jump()` (default, no extension) or `gate::jump_with_permit()` (extension-gated).
5. **Extension** — Gate owner can set custom access rules via `gate::authorize_extension<Auth>()`, which stores a `TypeName` on the gate. Once set, `jump()` is blocked and only `jump_with_permit()` works.

### Gate Struct (Key Fields)

```
Gate {
    id: UID,
    key: TenantItemId,           // deterministic derived ID
    owner_cap_id: ID,            // OwnerCap that controls this gate
    type_id: u64,                // gate type (for energy/distance config)
    linked_gate_id: Option<ID>,  // the other gate in the pair
    status: AssemblyStatus,      // anchored/online/offline
    location: Location,          // location hash for distance proofs
    energy_source_id: Option<ID>,// NetworkNode providing energy
    extension: Option<TypeName>, // typed witness extension (if configured)
}
```

### Extension Pattern (Typed Witness)

The gate extension system uses Sui's **typed witness pattern**:

1. **Authorize**: Gate owner calls `gate::authorize_extension<MyAuth>(&mut gate, &owner_cap)` — stores `type_name::with_defining_ids<MyAuth>()` in `gate.extension`.
2. **Issue permit**: Extension module calls `gate::issue_jump_permit<MyAuth>(source_gate, dest_gate, character, MyAuth {}, expiry, ctx)` — only succeeds if `MyAuth`'s TypeName matches the gate's stored extension type.
3. **Consume**: Character calls `gate::jump_with_permit()` — validates permit (character match, route hash, expiry), then deletes it (single-use).

**Critical constraints:**
- Both source AND destination gates must have the same extension type authorized
- `issue_jump_permit` requires a **witness value** of the authorized type (`Auth` must have `drop`)
- The witness type's `with_defining_ids` (includes package ID) must match — so the **same package** must be deployed for both gates
- JumpPermit is single-use (deleted after validation)
- Route hash is direction-agnostic (A→B and B→A use the same permit)

### Capability Hierarchy

```
GovernorCap (singleton, deployer)
  └─ creates AdminCap (can create OwnerCaps, anchor gates, create characters)
       └─ creates OwnerCap<T> (per-object access: Gate, NetworkNode, etc.)
```

- **GovernorCap**: Top-level. Creates AdminCaps, registers server addresses, adds sponsors to AdminACL.
- **AdminCap**: Mid-level. Can anchor/unanchor/share gates, create OwnerCaps, create characters.
- **OwnerCap<Gate>**: Object-level. Gate-specific mutation: link, online, offline, authorize_extension.
- **AdminACL**: Shared object with authorized sponsor addresses. `jump()` and `jump_with_permit()` require `admin_acl.verify_sponsor(ctx)` — the transaction **must be sponsored** by an authorized address.

### Jump Flow (Complete)

```
Default jump (no extension):
  jump(source_gate, dest_gate, character, admin_acl, ctx)
    ├── verify_sponsor(ctx)         // tx must be sponsored
    ├── assert no extension set     // blocks if extension configured
    └── jump_internal()             // verify online + linked, emit JumpEvent

Extension-gated jump:
  1. Extension module: issue_jump_permit<Auth>(source, dest, char, Auth{}, expiry, ctx)
     ├── assert extension set on BOTH gates
     ├── assert TypeName matches Auth type
     ├── compute direction-agnostic route_hash
     └── transfer JumpPermit to character.character_address()
  
  2. jump_with_permit(source, dest, char, permit, admin_acl, clock, ctx)
     ├── verify_sponsor(ctx)
     ├── validate_jump_permit()
     │   ├── check expiry vs clock
     │   ├── check character_id match
     │   ├── check route_hash (either direction)
     │   └── DELETE permit (single-use)
     └── jump_internal()
```

---

## B. Minimal Validation Steps

### Prerequisites

The full world-contracts system has deep dependencies: ObjectRegistry, NetworkNode, EnergyConfig, fuel system, location proofs, server address registry, AdminACL sponsorship. **Every gate operation requires these to be initialized.** The test file (`gate_tests.move`) shows the setup chain clearly.

### Step 1: Deploy World-Contracts (Or Minimal Subset)

**Goal:** Get the `world` package published to local devnet.

**Functions:** Package publish via `sui client publish`  
**Arguments:** The `world` package at `vendor/world-contracts/contracts/world/`  
**Expected result:** Package ID published, shared objects created: `ObjectRegistry`, `GateConfig`, `ServerAddressRegistry`, `AdminACL`, `EnergyConfig`, `GovernorCap`  
**Verification:** `sui client objects` shows GovernorCap owned by deployer; shared objects queryable via `sui client object <id>`

**Key setup steps after publish:**
1. Create AdminCap: `access::create_admin_cap(&governor_cap, admin_address, ctx)`
2. Register server address: `access::register_server_address(&mut server_registry, &governor_cap, server_addr)`
3. Add sponsor to ACL: `access::add_sponsor_to_acl(&mut admin_acl, &governor_cap, sponsor_addr)`
4. Configure fuel type: via `fuel::configure_fuel()`
5. Configure energy: via `energy::configure_assembly_energy()`
6. Set gate max distance: `gate::set_max_distance(&mut gate_config, &admin_cap, type_id, max_distance)`

### Step 2: Create Characters

**Goal:** Create two characters with different tribes for testing pass/fail scenarios.

**Function:** `character::create_character(&mut registry, &admin_cap, game_char_id, tenant, tribe_id, char_address, name, ctx)`  
**Arguments:**
- Character A: `game_char_id=101, tenant="evefrontier", tribe_id=1, char_address=addr_A`
- Character B: `game_char_id=102, tenant="evefrontier", tribe_id=2, char_address=addr_B`

Then: `character::share_character(character, &admin_cap)`

**Expected result:** Two shared Character objects, each with OwnerCap transferred to the character object itself  
**Verification:** `sui client object <char_id>` shows `tribe_id` field; CharacterCreatedEvent emitted

### Step 3: Create and Configure Gates

**Sub-steps:**

**3a. Create NetworkNode (energy source):**
```
network_node::anchor(&mut registry, &character, &admin_cap, 
    nwn_item_id, nwn_type_id, location_hash, 
    fuel_max_capacity, fuel_burn_rate, max_production, ctx)
network_node::share_network_node(nwn, &admin_cap)
```

**3b. Create two gates:**
```
gate::anchor(&mut registry, &mut nwn, &character, &admin_cap,
    item_id, type_id, location_hash, ctx)
gate::share_gate(gate, &admin_cap)
```
Repeat for gate B with different item_id.

**3c. Fuel the NetworkNode and bring online:**
- Deposit fuel via `network_node.deposit_fuel()` (requires OwnerCap borrow from character)
- `network_node.online(&owner_cap, &clock)`

**3d. Link gates:**
```
gate::link_gates(&mut gate_a, &mut gate_b, &character, &gate_config,
    &server_registry, &owner_cap_a, &owner_cap_b, distance_proof, &clock, ctx)
```
⚠️ **Requires a valid server-signed distance proof.** On local devnet, this is the hardest part — the proof must be signed by an address in ServerAddressRegistry.

**3e. Online both gates:**
```
gate::online(&mut gate_a, &mut nwn, &energy_config, &owner_cap_a)
gate::online(&mut gate_b, &mut nwn, &energy_config, &owner_cap_b)
```

**Verification:** Both gates show `status: online`, `linked_gate_id` points to each other

### Step 4: Deploy Custom Extension (Tribe Filter)

**Goal:** Deploy the extension_examples package (or our own GateControl extension).

**Option A — Use existing extension_examples:**
Publish `vendor/world-contracts/contracts/extension_examples/`. This deploys:
- `ExtensionConfig` (shared object)
- `AdminCap` for the extension
- `XAuth` witness type

Then call: `tribe_permit::set_tribe_config(&mut config, &admin_cap, tribe_id=1)`

**Option B — Deploy our own GateControl module:**
Create a new Move package that:
1. Defines its own `GateAuth has drop {}` witness type
2. Defines rule structs as dynamic fields
3. Calls `gate::issue_jump_permit<GateAuth>(...)` when rules pass

**Expected result:** Extension package published, ExtensionConfig shared, tribe rule configured  
**Verification:** `sui client object <config_id>` shows the shared ExtensionConfig; dynamic field for TribeConfigKey exists

### Step 5: Register Extension on Gates

**Function:** `gate::authorize_extension<XAuth>(&mut gate, &owner_cap)`

Must be called on BOTH gates by the gate owner (borrowing OwnerCap from character):
```
character.borrow_owner_cap<Gate>(receiving_ticket) → (owner_cap, receipt)
gate.authorize_extension<extension_examples::config::XAuth>(&owner_cap)
character.return_owner_cap(owner_cap, receipt)
```

**Critical:** The `XAuth` type used here must be from the **same published package** as the one calling `issue_jump_permit<XAuth>`. TypeName includes defining package ID.

**Expected result:** `gate.extension` is `Some(TypeName)` matching XAuth  
**Verification:** `sui client object <gate_id>` shows `extension` field populated; default `jump()` now fails with `EExtensionNotAuthorized`

### Step 6: Test Pass Scenario (Correct Tribe)

**Setup:** Character A has `tribe_id=1`, tribe rule is set to `1`

**Function:** `tribe_permit::issue_jump_permit(&config, &source_gate, &dest_gate, &character_a, &admin_cap, &clock, ctx)`

**Expected result:** JumpPermit object created, transferred to character_a's address  
**Verification:** `sui client objects <char_a_addr>` shows JumpPermit; fields show correct `route_hash`, `character_id`, `expires_at_timestamp_ms`

**Then jump:**
```
gate::jump_with_permit(&source_gate, &dest_gate, &character_a, permit, &admin_acl, &clock, ctx)
```

**Expected result:** JumpEvent emitted, JumpPermit deleted  
**Verification:** Transaction succeeds; event log contains JumpEvent with correct gate and character IDs; JumpPermit object no longer exists

### Step 7: Test Fail Scenario (Wrong Tribe)

**Setup:** Character B has `tribe_id=2`, tribe rule is set to `1`

**Function:** `tribe_permit::issue_jump_permit(&config, &source_gate, &dest_gate, &character_b, &admin_cap, &clock, ctx)`

**Expected result:** Transaction **aborts** with error code `ENotStarterTribe` (code 0)  
**Verification:** Transaction fails; error message contains "Character is not a starter tribe"

### Step 8: Deploy Toll Extension Variant (Corpse Bounty)

**Function:** `corpse_gate_bounty::set_bounty_type_id(&mut config, &admin_cap, bounty_type_id)`

Then test: `corpse_gate_bounty::collect_corpse_bounty<T>(...)` requires:
- ExtensionConfig with BountyConfig set
- StorageUnit with the corpse item
- OwnerCap for the player's inventory
- Proximity proof (server-signed)
- Source/dest gates with XAuth extension

**Expected result:** Corpse withdrawn from player inventory, deposited to owner's StorageUnit, JumpPermit issued  
**Verification:** StorageUnit balances change; JumpPermit created

**⚠️ This step has high complexity** — requires a populated StorageUnit with correctly-typed items and valid proximity proofs.

> **⚠️ v0.0.15 version note:** The `corpse_gate_bounty` example's `deposit_item()` call may be affected by a v0.0.15 change: `deposit_item<Auth>` now validates `parent_id`, restricting items to deposit only to their origin SSU. If the corpse originated from a different SSU, the deposit step would fail. v0.0.15 adds `deposit_to_owned<Auth>` as an alternative path for cross-SSU item delivery. Verify against current contract source before relying on this example's pattern directly.

---

## C. Toll Mechanism Options

### Current State: Item-Based Toll Only

The existing `corpse_gate_bounty` module implements an **item-based toll** — the traveler must deposit a specific item type from their StorageUnit to get a JumpPermit. This works through:
1. `storage_unit.withdraw_by_owner()` — pulls item from player's inventory
2. Type check against `bounty_type_id`
3. `storage_unit.deposit_item()` — places item in gate owner's storage
4. `gate::issue_jump_permit()` — grants passage

### Can We Implement a Coin Toll (Pay SUI to Jump)?

**Yes, absolutely.** The extension pattern is fully composable. A coin toll extension would look like:

```move
module gatecontrol::coin_toll;

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::clock::Clock;
use world::{character::Character, gate::{Self, Gate}};
use gatecontrol::config::{Self, GateAuth, AdminCap, GateConfig};

/// Dynamic field value for coin toll configuration
public struct CoinTollRule has drop, store {
    price_mist: u64,           // toll amount in MIST (1 SUI = 10^9 MIST)
    treasury: address,         // address receiving toll payments
}

public struct CoinTollKey has copy, drop, store {}

/// Pay SUI toll to receive a JumpPermit
public fun pay_toll_and_jump(
    config: &GateConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    payment: Coin<SUI>,       // exact amount or split beforehand
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Read toll config from dynamic field
    let toll = config.borrow_rule<CoinTollKey, CoinTollRule>(CoinTollKey {});
    
    // Verify payment amount
    assert!(coin::value(&payment) >= toll.price_mist, ETollInsufficient);
    
    // Transfer payment to treasury
    transfer::public_transfer(payment, toll.treasury);
    
    // Issue jump permit (5 day expiry)
    let expires_at = clock.timestamp_ms() + 5 * 24 * 60 * 60 * 1000;
    gate::issue_jump_permit<GateAuth>(
        source_gate,
        destination_gate,
        character,
        config::gate_auth(),
        expires_at,
        ctx,
    );
}
```

**Key design points:**
- The caller splits the Coin before calling (or PTB composes `SplitCoins` + `pay_toll_and_jump` in one transaction)
- Treasury address is configurable per-gate via dynamic field
- Works with `Coin<SUI>` or any `Coin<T>` — including faction currencies (`Coin<TribeToken>`)
- No interaction with StorageUnit/proximity needed — pure Coin transfer

### Coin Toll vs Item Toll Comparison

| Aspect | Coin Toll | Item Toll (Corpse Bounty) |
|--------|-----------|--------------------------|
| **Complexity** | Low — standard Coin transfer | High — StorageUnit withdraw + proximity proof |
| **Dependencies** | Coin only | StorageUnit, OwnerCap, proximity proof, server signature |
| **User experience** | Simple: pay and jump | Complex: must have specific item in inventory |
| **Testability** | Easy on devnet (mint test coins) | Hard (need populated StorageUnit + signed proofs) |
| **Economic hooks** | Direct SUI or faction currency | In-game item economy |
| **Best for GateControl MVP** | ✅ Yes | ❌ Too many dependencies |

### Recommendation for GateControl

Implement **both** as composable rule types under a single extension:
1. **TribeTollRule** — check tribe + coin payment (simplest, most testable)
2. **ItemTollRule** — require specific item deposit (stretch, needs StorageUnit integration)
3. **TimeWindowRule** — check clock timestamp (easy to layer on)

All rules stored as dynamic fields under a shared config object (following the `extension_examples::config` pattern).

---

## D. Risk Assessment

### 🔴 High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Sponsored transaction requirement** | `jump()` and `jump_with_permit()` both call `admin_acl.verify_sponsor(ctx)` — the tx MUST be sponsored by an authorized address. On devnet, we must register a sponsor AND use Sui's sponsored transaction API. | Register our devnet address as sponsor via `add_sponsor_to_acl()`. Use `sui client call` with `--sponsor` flag, or implement custom sponsorship flow. **This is a devnet blocker if not handled.** |
| **Location/distance proofs** | `link_gates()` requires a server-signed distance proof validated against `ServerAddressRegistry`. No real game server exists on devnet to produce these. | For testing: register our own keypair as a "server address" and forge valid proofs locally. The test suite shows `test_helpers::construct_location_proof()` pattern. |
| **NetworkNode dependency chain** | Gates require: ObjectRegistry → NetworkNode → fuel deposit → online → gate anchor → gate online. ~6 sequential admin operations before a gate can accept jumps. | Script the full setup as a PTB or sequential CLI calls. The Docker devnet in `vendor/builder-scaffold` may pre-deploy some of this. |

### 🟡 Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **OwnerCap borrow/return ceremony** | Every gate mutation requires `character.borrow_owner_cap()` → operation → `character.return_owner_cap()`. This is a hot-potato pattern — forgetting the return aborts the tx. | Follow the test patterns exactly. PTB composition handles this well. |
| **Extension TypeName binding** | The extension `TypeName` includes the defining package ID. If we redeploy our extension package, existing gates must be reconfigured. | Plan for single deployment; don't redeploy during testing. |
| **Energy system configuration** | Gates need energy reserved from NetworkNode, which needs fuel configured via EnergyConfig. Missing configuration = gates can't go online. | Follow `test_helpers::configure_fuel()` and `test_helpers::configure_assembly_energy()` patterns. |

### 🟢 Low Risk  

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Tribe filter logic** | Simple `u32` comparison. Well-tested in existing examples. | Direct port from `tribe_permit.move` |
| **Coin toll logic** | Standard `Coin<T>` handling — well-documented Sui pattern. | Use `sui::coin` and `sui::pay` modules |
| **Dynamic field composition** | `extension_examples::config` proves the pattern works. | Mirror existing `set_rule`/`borrow_rule` pattern |
| **JumpPermit mechanics** | Single-use permit with expiry. Thoroughly tested. | Follow existing test patterns |

### Cross-Cutting Concerns

1. **Hackathon test server provides gate access** — the dedicated hackathon test server (available from March 11) provides admin-spawnable structures with pre-published world-contracts. Extensions can be tested against real gate objects without needing Stillness (live server) gate ownership. Local devnet is a fallback.
2. **AdminACL sponsorship constraint** — every jump involves CCP's sponsorship infrastructure. Extensions don't bypass this; they add rules on top. Test server AdminACL access depends on organizer configuration.
3. **Location proofs are server-signed** — linking gates requires the game server. On local devnet, we self-sign. On hackathon test server, check if admin tools provide distance proofs.

---

## E. Success Criteria

### Minimum Viable Proof (MVP) — GateControl Works

| # | Criterion | Evidence | How to Verify |
|---|-----------|----------|---------------|
| 1 | World package deploys | Package ID assigned | `sui client publish` succeeds; GovernorCap in wallet |
| 2 | Extension package deploys | Package ID assigned | `sui client publish` succeeds; ExtensionConfig shared object exists |
| 3 | Gate created and online | Gate shared object with `is_online=true` | `sui client object <gate_id>` shows online status |
| 4 | Gates linked | `linked_gate_id` set on both gates | `sui client object <gate_a>` shows `linked_gate_id = <gate_b>` and vice versa |
| 5 | Extension authorized | `extension` field = `Some(TypeName)` | `sui client object <gate_id>` shows extension TypeName |
| 6 | Permit issued (pass) | JumpPermit object created | `sui client objects <char_address>` shows JumpPermit |
| 7 | Jump succeeds | JumpEvent emitted, JumpPermit deleted | Transaction digest shows JumpEvent in events; permit object gone |
| 8 | Wrong tribe blocked | Transaction aborts | `sui client call` fails with `ENotStarterTribe` |
| 9 | Coin toll works | Payment transferred, JumpPermit issued | Treasury balance increases; JumpPermit created |

### Tx Digests to Collect

For the demo/submission, capture transaction digests for:
- Gate creation (GateCreatedEvent)
- Extension authorization
- Successful jump (JumpEvent)  
- Failed jump (abort with tribe error)
- Toll payment + permit issuance

### Object States to Screenshot

- Gate objects showing `extension: Some(...)` and `linked_gate_id: Some(...)`
- JumpPermit object fields (character_id, route_hash, expires_at)
- ExtensionConfig with dynamic field rules visible

---

## F. Recommended Validation Sequence (Prioritized)

Given the complexity of the full setup chain, here's the recommended order for de-risking:

### Phase 1: Unit Tests (Move test framework) — Day 1
1. Write a GateControl extension module with tribe filter + coin toll
2. Write Move `#[test]` functions mirroring `gate_tests.move` patterns
3. Use `test_scenario`, `clock::create_for_testing`, `init_for_testing` helpers
4. **This avoids all networking/proof/sponsor dependencies**
5. Validate: tribe pass, tribe fail, coin toll pass, coin toll insufficient

### Phase 2: Local Devnet Integration — Day 1-2
1. Start local devnet via Docker (`vendor/builder-scaffold/docker/`)
2. Publish world package
3. Run full setup chain (governor → admin → characters → nwn → gates)
4. Self-sign location proofs for `link_gates`
5. Register self as sponsor for `jump()`
6. Test end-to-end jump flow

### Phase 3: Custom Extension Deployment — Day 2
1. Publish GateControl extension package to local devnet
2. Authorize extension on test gates
3. Test tribe filter + coin toll via CLI
4. Capture tx digests and events

### Phase 4: Dashboard Integration — Day 3+
1. TypeScript client calling Move functions via `@mysten/sui` SDK
2. Web UI for gate policy configuration
3. Event subscription for jump monitoring

---

## G. Key Code References

| File | Purpose |
|------|---------|
| [gate.move](../../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) | Core Gate struct, jump flow, extension pattern |
| [access_control.move](../../vendor/world-contracts/contracts/world/sources/access/access_control.move) | Capability hierarchy (Governor → Admin → Owner) |
| [character.move](../../vendor/world-contracts/contracts/world/sources/character/character.move) | Character struct, tribe field, OwnerCap borrow |
| [extension gate.move](../../vendor/world-contracts/contracts/extension_examples/sources/gate.move) | Simple tribe filter extension example |
| [tribe_permit.move](../../vendor/world-contracts/contracts/extension_examples/sources/tribe_permit.move) | Tribe permit with shared config pattern |
| [corpse_gate_bounty.move](../../vendor/world-contracts/contracts/extension_examples/sources/corpse_gate_bounty.move) | Item toll pattern (withdraw → deposit → permit) |
| [config.move](../../vendor/world-contracts/contracts/extension_examples/sources/config.move) | Shared ExtensionConfig with dynamic field helpers |
| [gate_tests.move](../../vendor/world-contracts/contracts/world/tests/assemblies/gate_tests.move) | Complete test patterns for all gate operations |
| [world.move](../../vendor/world-contracts/contracts/world/sources/world.move) | GovernorCap creation |

---

## H. Bottom Line

**GateControl is technically feasible and well-supported by the existing codebase.** The extension pattern is clean, the test coverage is thorough, and the examples provide clear templates. The main de-risking targets are:

1. **Sponsored transaction setup** (AdminACL) — must be solved for any jump to work
2. **Location proof forgery** for devnet testing — no real game server available
3. **NetworkNode/energy setup chain** — verbose but mechanical, scriptable

A coin toll extension is straightforward to implement and dramatically simpler than the item-based corpse bounty. Start with tribe filter + coin toll as the MVP rule types.
