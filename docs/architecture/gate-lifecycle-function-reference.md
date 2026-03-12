# Gate Lifecycle — Complete Function Call Reference

**Retention:** Carry-forward

> Derived from canonical source: `vendor/world-contracts/contracts/world/` Move modules  
> Date: 2026-02-16

---

## Table of Contents

1. [Package Publish — init Functions & Shared Objects](#1-package-publish--init-functions--shared-objects)
2. [Governance Setup](#2-governance-setup)
3. [Character Creation](#3-character-creation)
4. [NetworkNode Creation](#4-networknode-creation)
5. [Gate Creation (Anchoring)](#5-gate-creation-anchoring)
6. [Gate Linking](#6-gate-linking)
7. [Gates Online](#7-gates-online)
8. [Extension Authorization](#8-extension-authorization-typed-witness)
9. [Issue Jump Permit](#9-issue-jump-permit)
10. [Jump Execution](#10-jump-execution)
11. [Object Dependency Chain](#11-object-dependency-chain)
12. [Shared vs Owned Objects](#12-shared-vs-owned-objects)
13. [OwnerCap Borrow/Return Pattern](#13-ownercap-borrowreturn-pattern)
14. [Complete Lifecycle Sequence Diagram](#14-complete-lifecycle-sequence-diagram)

---

## 1. Package Publish — init Functions & Shared Objects

When the `world` package is published, these `init` functions run automatically, creating shared and owned objects:

| Module | Function | Objects Created | Object Kind |
|--------|----------|----------------|-------------|
| `world::world` | `init(ctx)` | `GovernorCap` | **Owned** (transferred to deployer) |
| `world::access` | `init(ctx)` | `ServerAddressRegistry`, `AdminACL` | **Shared** (both) |
| `world::object_registry` | `init(ctx)` | `ObjectRegistry` | **Shared** |
| `world::fuel` | `init(ctx)` | `FuelConfig` | **Shared** |
| `world::energy` | `init(ctx)` | `EnergyConfig` | **Shared** |
| `world::gate` | `init(ctx)` | `GateConfig` | **Shared** |

### GovernorCap (world.move)
```move
public struct GovernorCap has key {
    id: UID,
    governor: address,
}
```
Singleton. The deployer address receives this. Required to create AdminCaps and configure server addresses.

### AdminACL (access_control.move)
```move
public struct AdminACL has key {
    id: UID,
    authorized_sponsors: Table<address, bool>,
}
```
Shared. Used by `jump()` and `jump_with_permit()` to verify sponsored transactions.

### GateConfig (gate.move)
```move
public struct GateConfig has key {
    id: UID,
    max_distance_by_type: Table<u64, u64>,
}
```
Shared. Maps gate `type_id` → max allowed linking distance.

---

## 2. Governance Setup

### 2a. Create AdminCap

```move
// Module: world::access
public fun create_admin_cap(
    _: &GovernorCap,       // proof of governor authority
    admin: address,        // recipient address
    ctx: &mut TxContext,
)
```

**Effect:** Creates `AdminCap` and transfers to `admin`.

```move
public struct AdminCap has key {
    id: UID,
    admin: address,
}
```

**Dependency:** Requires `GovernorCap` (from publish/init).

### 2b. Add Sponsor to AdminACL

```move
// Module: world::access
public fun add_sponsor_to_acl(
    admin_acl: &mut AdminACL,   // shared
    _: &GovernorCap,            // governor proof
    sponsor: address,           // sponsor address to authorize
)
```

**Effect:** Adds `sponsor` to `admin_acl.authorized_sponsors`. Required for `jump()` and `jump_with_permit()` which call `admin_acl.verify_sponsor(ctx)`.

### 2c. Register Server Address

```move
// Module: world::access
public fun register_server_address(
    server_address_registry: &mut ServerAddressRegistry,  // shared
    _: &GovernorCap,
    server_address: address,
)
```

**Effect:** Authorizes a server address to sign location/distance proofs. Required for `link_gates()`.

### 2d. Set Gate Max Distance

```move
// Module: world::gate
public fun set_max_distance(
    gate_config: &mut GateConfig,  // shared
    _: &AdminCap,
    type_id: u64,                  // gate type ID
    max_distance: u64,             // max distance for linking
)
```

**Effect:** Configures allowed linking distance for a gate type. Must be set before `link_gates()`.

### 2e. Configure Fuel Efficiency

```move
// Module: world::fuel
public fun set_fuel_efficiency(
    fuel_config: &mut FuelConfig,  // shared
    _: &AdminCap,
    fuel_type_id: u64,
    efficiency: u64,
)
```

**Effect:** Needed for NetworkNode fuel system, which Gates depend on for energy.

### 2f. Configure Assembly Energy

```move
// Module: world::energy
public fun set_energy_config(
    energy_config: &mut EnergyConfig,  // shared
    _: &AdminCap,
    assembly_type_id: u64,             // gate type ID (e.g., 8888)
    energy_required: u64,              // energy reservation per gate
)
```

**Effect:** Defines how much energy a gate type requires from its NetworkNode when going online.

---

## 3. Character Creation

```move
// Module: world::character
public fun create_character(
    registry: &mut ObjectRegistry,  // shared
    admin_cap: &AdminCap,           // owned by admin
    game_character_id: u32,         // unique game ID (nonzero)
    tenant: String,                 // tenant namespace (e.g., "TEST")
    tribe_id: u32,                  // tribe ID (nonzero)
    character_address: address,     // the player's wallet address
    name: String,
    ctx: &mut TxContext,
): Character
```

**Effect:** Creates a `Character` object with a deterministic derived ID. Also creates an `OwnerCap<Character>` transferred to the Character's address (object-to-object transfer).

**Important:** Must be followed by:
```move
// Module: world::character
public fun share_character(character: Character, _: &AdminCap)
```

**Character struct:**
```move
public struct Character has key {
    id: UID,
    key: TenantItemId,
    tribe_id: u32,
    character_address: address,      // the player wallet that can borrow OwnerCaps
    metadata: Option<Metadata>,
    owner_cap_id: ID,
}
```

**Dependency:** `ObjectRegistry` (shared, from init), `AdminCap`.

---

## 4. NetworkNode Creation

```move
// Module: world::network_node
public fun anchor(
    registry: &mut ObjectRegistry,        // shared
    character: &Character,                // shared (ref)
    admin_cap: &AdminCap,
    item_id: u64,                         // unique game item ID (nonzero)
    type_id: u64,                         // network node type (nonzero)
    location_hash: vector<u8>,            // location proof hash
    fuel_max_capacity: u64,
    fuel_burn_rate_in_ms: u64,
    max_energy_production: u64,           // max energy this node can produce
    ctx: &mut TxContext,
): NetworkNode
```

**Effect:** Creates a `NetworkNode` with an `OwnerCap<NetworkNode>` transferred to the character. Must be followed by:
```move
public fun share_network_node(nwn: NetworkNode, _: &AdminCap)
```

**Dependency:** `ObjectRegistry`, `AdminCap`, `Character`.

### Bring NetworkNode Online

After fueling:
```move
// Module: world::network_node
public fun online(
    nwn: &mut NetworkNode,
    owner_cap: &OwnerCap<NetworkNode>,
    clock: &Clock,
)
```

Requires `OwnerCap<NetworkNode>` (borrowed from Character). Must deposit fuel first via `deposit_fuel` (admin/test function).

---

## 5. Gate Creation (Anchoring)

```move
// Module: world::gate
public fun anchor(
    registry: &mut ObjectRegistry,        // shared
    network_node: &mut NetworkNode,       // shared (mut — connects gate)
    character: &Character,                // shared (ref — derives tenant)
    admin_cap: &AdminCap,                 // owned
    item_id: u64,                         // unique gate item ID (nonzero)
    type_id: u64,                         // gate type (e.g., 8888; nonzero)
    location_hash: vector<u8>,            // location hash
    ctx: &mut TxContext,
): Gate
```

**Effect:**
1. Derives a deterministic `Gate` object ID from `ObjectRegistry` + `TenantItemId(item_id, tenant)`
2. Creates `OwnerCap<Gate>` authorized for this gate's ID
3. Transfers `OwnerCap<Gate>` to the Character object (object-to-object via `transfer_owner_cap`)
4. Connects gate to NetworkNode (`network_node.connect_assembly(gate_id)`)
5. Emits `GateCreatedEvent`

**Must be followed by:**
```move
// Module: world::gate
public fun share_gate(gate: Gate, _: &AdminCap)
```

**Gate struct:**
```move
public struct Gate has key {
    id: UID,
    key: TenantItemId,
    owner_cap_id: ID,
    type_id: u64,
    linked_gate_id: Option<ID>,
    status: AssemblyStatus,
    location: Location,
    energy_source_id: Option<ID>,
    metadata: Option<Metadata>,
    extension: Option<TypeName>,
}
```

**Dependency:** `ObjectRegistry`, `NetworkNode` (shared, already created), `Character` (shared), `AdminCap`.

---

## 6. Gate Linking

```move
// Module: world::gate
public fun link_gates(
    source_gate: &mut Gate,                              // shared (mut)
    destination_gate: &mut Gate,                         // shared (mut)
    _: &Character,                                       // shared (ref) — unused but required
    gate_config: &GateConfig,                            // shared (ref)
    server_registry: &ServerAddressRegistry,             // shared (ref)
    source_gate_owner_cap: &OwnerCap<Gate>,              // borrowed from character
    destination_gate_owner_cap: &OwnerCap<Gate>,         // borrowed from character
    distance_proof: vector<u8>,                          // BCS-serialized LocationProof
    clock: &Clock,                                       // system object
    ctx: &mut TxContext,
)
```

**Effect:**
1. Verifies both OwnerCaps are authorized for their respective gates
2. Asserts neither gate is already linked
3. Verifies distance between gates using server-signed `distance_proof` against `gate_config.max_distance_by_type`
4. Sets `source_gate.linked_gate_id = Some(destination_gate_id)` and vice versa

**distance_proof format:** BCS-serialized `LocationProof` struct:
```move
// Module: world::location
public struct LocationProof has copy, drop {
    server_address: address,
    player_address: address,
    source_object_id: ID,
    source_location_hash: vector<u8>,
    target_object_id: ID,
    target_location_hash: vector<u8>,
    distance: u64,
    data: vector<u8>,
    deadline_ms: u64,
    signature: vector<u8>,
}
```

**Dependency:** Both gates (shared), both OwnerCaps (borrowed from Character), `GateConfig`, `ServerAddressRegistry`, `Clock`.

**Pre-requisites:**
- Gate max distance must be configured for the gate's `type_id`
- Server address must be registered
- A valid server-signed distance proof must be provided

---

## 7. Gates Online

```move
// Module: world::gate
public fun online(
    gate: &mut Gate,                    // shared (mut)
    network_node: &mut NetworkNode,     // shared (mut)
    energy_config: &EnergyConfig,       // shared (ref)
    owner_cap: &OwnerCap<Gate>,         // borrowed from character
)
```

**Effect:**
1. Verifies OwnerCap is authorized for this gate
2. Asserts `gate.energy_source_id` matches the provided NetworkNode
3. Reserves energy from NetworkNode (`network_node.borrow_energy_source().reserve_energy(...)`)
4. Sets gate status to online

**Must be called for BOTH gates after linking.**

**Dependency:** Gate (shared), NetworkNode (shared, must be online with fuel), EnergyConfig (shared), OwnerCap (borrowed).

---

## 8. Extension Authorization (Typed Witness)

```move
// Module: world::gate
public fun authorize_extension<Auth: drop>(
    gate: &mut Gate,                  // shared (mut)
    owner_cap: &OwnerCap<Gate>,       // borrowed from character
)
```

**Type parameter:** `Auth` must have `drop` ability. This is the witness type from your extension module.

**Effect:**
1. Verifies OwnerCap is authorized for this gate
2. Sets `gate.extension = Some(type_name::with_defining_ids<Auth>())` — stores the **full TypeName** including package ID
3. Blocks default `jump()` from this point on
4. Can be called multiple times to swap the extension type (uses `swap_or_fill`)

**CRITICAL:** Both source AND destination gates must be authorized with the **same `Auth` type** from the **same package** for `issue_jump_permit` to work. `type_name::with_defining_ids<Auth>()` includes the package ID, so the exact same deployed package must control both gates.

**Must be called for BOTH gates in the linked pair.**

**Dependency:** Gate (shared), OwnerCap (borrowed from Character).

---

## 9. Issue Jump Permit

```move
// Module: world::gate
public fun issue_jump_permit<Auth: drop>(
    source_gate: &Gate,               // shared (ref)
    destination_gate: &Gate,           // shared (ref)
    character: &Character,             // shared (ref)
    _: Auth,                           // witness value (consumed/dropped)
    expires_at_timestamp_ms: u64,      // permit expiry timestamp
    ctx: &mut TxContext,
)
```

**Effect:**
1. Asserts BOTH gates have an extension configured
2. Asserts source gate extension matches `type_name::with_defining_ids<Auth>()`
3. Asserts destination gate extension matches the same type
4. Computes a direction-agnostic `route_hash = blake2b256(gate_a_id || gate_b_id)`
5. Creates `JumpPermit` and transfers it to `character.character_address()`

**JumpPermit struct:**
```move
public struct JumpPermit has key, store {
    id: UID,
    character_id: ID,
    route_hash: vector<u8>,            // direction-agnostic
    expires_at_timestamp_ms: u64,
}
```

**Route hash is direction-agnostic:** The validation in `validate_jump_permit` checks BOTH orderings, so a permit issued for A→B also works for B→A.

**Dependency:** Both gates (shared), Character (shared), a witness value of type `Auth` (instantiated by the extension module).

**Who calls this:** Your extension module, not the player directly. The extension module has access to `Auth {}` instantiation (since it defines the type), applies custom rules, then calls this core function.

### Extension Module Example (extension_examples::gate)

```move
public struct XAuth has drop {}

public fun issue_jump_permit(
    gate_rules: &GateRules,               // custom shared config
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    _: &AdminCap,                          // extension's own AdminCap
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(character.tribe() == gate_rules.tribe, ENotStarterTribe);
    let expires_at = clock.timestamp_ms() + 5 * 24 * 60 * 60 * 1000; // 5 days
    gate::issue_jump_permit<XAuth>(
        source_gate, destination_gate, character,
        XAuth {},     // witness value — only this module can instantiate
        expires_at, ctx,
    );
}
```

---

## 10. Jump Execution

### 10a. Default Jump (No Extension)

```move
// Module: world::gate
public fun jump(
    source_gate: &Gate,             // shared (ref)
    destination_gate: &Gate,        // shared (ref)
    character: &Character,          // shared (ref)
    admin_acl: &AdminACL,           // shared (ref) — sponsor verification
    ctx: &mut TxContext,
)
```

**Effect:**
1. Calls `admin_acl.verify_sponsor(ctx)` — transaction MUST be sponsored by an authorized address
2. Asserts `source_gate.extension` is `None` — fails if extension is configured
3. Calls `jump_internal` which verifies both gates online, linked, then emits `JumpEvent`

### 10b. Jump with Permit (Extension Required)

```move
// Module: world::gate
public fun jump_with_permit(
    source_gate: &Gate,             // shared (ref)
    destination_gate: &Gate,        // shared (ref)
    character: &Character,          // shared (ref)
    jump_permit: JumpPermit,        // owned (consumed — by value)
    admin_acl: &AdminACL,           // shared (ref)
    clock: &Clock,                  // system object
    ctx: &mut TxContext,
)
```

**Effect:**
1. Calls `admin_acl.verify_sponsor(ctx)` — must be sponsored
2. Validates permit:
   - `expires_at_timestamp_ms > clock.timestamp_ms()` (not expired)
   - `permit.character_id == object::id(character)` (bound to this character)
   - `permit.route_hash` matches either direction of `(source_gate_id, destination_gate_id)`
3. **Deletes** the permit (single-use)
4. Calls `jump_internal` — verifies both gates online and linked, emits `JumpEvent`

**JumpEvent:**
```move
public struct JumpEvent has copy, drop {
    source_gate_id: ID,
    source_gate_key: TenantItemId,
    destination_gate_id: ID,
    destination_gate_key: TenantItemId,
    character_id: ID,
    character_key: TenantItemId,
}
```

---

## 11. Object Dependency Chain

```
Package Publish
  ├── GovernorCap (owned → deployer)
  ├── ServerAddressRegistry (shared)
  ├── AdminACL (shared)
  ├── ObjectRegistry (shared)
  ├── FuelConfig (shared)
  ├── EnergyConfig (shared)
  └── GateConfig (shared)
       │
       ▼
Governance Setup (requires GovernorCap)
  ├── create_admin_cap → AdminCap (owned → admin address)
  ├── add_sponsor_to_acl → modifies AdminACL
  ├── register_server_address → modifies ServerAddressRegistry
  │
  └── (requires AdminCap):
      ├── set_max_distance → modifies GateConfig
      ├── set_fuel_efficiency → modifies FuelConfig
      └── set_energy_config → modifies EnergyConfig
           │
           ▼
Character Creation (requires AdminCap, ObjectRegistry)
  └── create_character + share_character
      └── Character (shared) + OwnerCap<Character> (owned → character obj)
           │
           ▼
NetworkNode Creation (requires AdminCap, ObjectRegistry, Character)
  └── anchor + share_network_node
      └── NetworkNode (shared) + OwnerCap<NetworkNode> (owned → character obj)
           │
           ├── deposit_fuel (requires OwnerCap<NetworkNode>)
           └── online (requires OwnerCap<NetworkNode>, Clock)
                │
                ▼
Gate Creation × 2 (requires AdminCap, ObjectRegistry, NetworkNode, Character)
  └── anchor + share_gate
      └── Gate A (shared) + OwnerCap<Gate A> (owned → character obj)
      └── Gate B (shared) + OwnerCap<Gate B> (owned → character obj)
           │
           ▼
Link Gates (requires both OwnerCap<Gate>, GateConfig, ServerAddressRegistry, Character, Clock)
  └── link_gates(gate_a, gate_b, ...)
           │
           ▼
Online × 2 (requires OwnerCap<Gate>, NetworkNode, EnergyConfig)
  └── online(gate_a, ...) + online(gate_b, ...)
           │
           ▼
[Optional] Authorize Extension × 2 (requires OwnerCap<Gate>)
  └── authorize_extension<MyAuth>(gate_a, ...) + authorize_extension<MyAuth>(gate_b, ...)
           │
           ▼
[If extension] Issue Jump Permit (requires extension witness, both gates, character)
  └── issue_jump_permit<MyAuth>(gate_a, gate_b, character, MyAuth{}, expiry, ctx)
      └── JumpPermit (owned → character_address)
           │
           ▼
Jump (requires gates, character, AdminACL, [JumpPermit, Clock])
  └── jump() or jump_with_permit()
      └── JumpEvent emitted
```

---

## 12. Shared vs Owned Objects

| Object | Kind | Notes |
|--------|------|-------|
| `GovernorCap` | **Owned** | Deployer-only; singleton |
| `AdminCap` | **Owned** | Created by governor; held by admin address |
| `AdminACL` | **Shared** | Sponsor whitelist; passed to `jump`/`jump_with_permit` |
| `ServerAddressRegistry` | **Shared** | Server address whitelist |
| `ObjectRegistry` | **Shared** | Deterministic ID derivation for all game objects |
| `FuelConfig` | **Shared** | Fuel efficiency mapping |
| `EnergyConfig` | **Shared** | Assembly energy requirements |
| `GateConfig` | **Shared** | Max distance per gate type |
| `Character` | **Shared** | Created then explicitly shared; holds OwnerCaps as child objects |
| `NetworkNode` | **Shared** | Created then explicitly shared |
| `Gate` | **Shared** | Created then explicitly shared |
| `OwnerCap<T>` | **Owned** | Transferred to Character's object address; borrowed via `Receiving<T>` |
| `JumpPermit` | **Owned** | Transferred to `character.character_address()` (player wallet) |

**Key insight:** `OwnerCap<Gate>` objects are owned by the `Character` object (not the player wallet). They must be borrowed via `character.borrow_owner_cap<Gate>(receiving_ticket, ctx)` and returned via `character.return_owner_cap(cap, receipt)` within the same transaction. The player wallet address (`character.character_address`) must match `ctx.sender()` to borrow.

---

## 13. OwnerCap Borrow/Return Pattern

Every operation requiring `OwnerCap<Gate>` follows this pattern:

```move
// 1. Get the owner_cap_id from the gate
let owner_cap_id = gate.owner_cap_id();

// 2. Create a receiving ticket for the OwnerCap held by the Character
let ticket = ts::receiving_ticket_by_id<OwnerCap<Gate>>(owner_cap_id);

// 3. Borrow the OwnerCap from within the Character
//    - Checks ctx.sender() == character.character_address
//    - Returns the cap + a receipt (hot-potato)
let (owner_cap, receipt) = character.borrow_owner_cap<Gate>(ticket, ctx);

// 4. Use the OwnerCap
gate.authorize_extension<MyAuth>(&owner_cap);

// 5. Return the OwnerCap (MUST happen in the same tx; receipt is consumed)
character.return_owner_cap(owner_cap, receipt);
```

The `ReturnOwnerCapReceipt` is a hot-potato (no abilities) that must be consumed by calling `return_owner_cap` or `transfer_owner_cap_with_receipt`.

---

## 14. Complete Lifecycle Sequence Diagram

For a test scenario showing the full flow with extension-gated jump:

```
Step 1: setup_world
  ├── world::init → GovernorCap → deployer
  ├── access::init → ServerAddressRegistry (shared), AdminACL (shared)
  ├── object_registry::init → ObjectRegistry (shared)
  ├── fuel::init → FuelConfig (shared)
  ├── energy::init → EnergyConfig (shared)
  └── gate::init → GateConfig (shared)

Step 2: configure (as governor)
  ├── access::create_admin_cap(gov_cap, admin_addr) → AdminCap → admin
  └── access::add_sponsor_to_acl(admin_acl, gov_cap, sponsor_addr)

Step 3: configure (as admin)
  ├── gate::set_max_distance(gate_config, admin_cap, 8888, 1_000_000_000)
  ├── fuel::set_fuel_efficiency(fuel_config, admin_cap, fuel_type, efficiency)
  └── energy::set_energy_config(energy_config, admin_cap, 8888, 50)

Step 4: register_server_address (as governor)
  └── access::register_server_address(server_registry, gov_cap, server_addr)

Step 5: create_character (as admin)
  ├── character::create_character(registry, admin_cap, 101, "TEST", 100, user_wallet, "name", ctx) → Character
  └── character::share_character(character, admin_cap)

Step 6: create_network_node (as admin)
  ├── network_node::anchor(registry, character, admin_cap, 5000, 111000, loc_hash, 1000, 3600000, 100, ctx) → NetworkNode
  └── network_node::share_network_node(nwn, admin_cap)

Step 7: bring_network_node_online (as user — character owner)
  ├── character.borrow_owner_cap<NetworkNode>(ticket, ctx) → (owner_cap, receipt)
  ├── nwn.deposit_fuel(owner_cap, fuel_type, volume, amount, clock)
  ├── nwn.online(owner_cap, clock)
  └── character.return_owner_cap(owner_cap, receipt)

Step 8: create_gate × 2 (as admin)
  ├── gate::anchor(registry, nwn, character, admin_cap, 7001, 8888, loc_hash, ctx) → Gate A
  ├── gate::share_gate(gate_a, admin_cap)
  ├── gate::anchor(registry, nwn, character, admin_cap, 7002, 8888, loc_hash, ctx) → Gate B
  └── gate::share_gate(gate_b, admin_cap)

Step 9: link_gates + online (as user — character owner)
  ├── borrow OwnerCap<Gate> for A and B (from Character)
  ├── gate_a.link_gates(gate_b, character, gate_config, server_registry, owner_cap_a, owner_cap_b, distance_proof_bcs, clock, ctx)
  ├── gate_a.online(nwn, energy_config, owner_cap_a)
  ├── gate_b.online(nwn, energy_config, owner_cap_b)
  └── return both OwnerCaps to Character

Step 10: authorize_extension × 2 (as user — character owner)
  ├── borrow OwnerCap<Gate> for A
  ├── gate_a.authorize_extension<MyAuth>(owner_cap_a)
  ├── return OwnerCap A
  ├── borrow OwnerCap<Gate> for B
  ├── gate_b.authorize_extension<MyAuth>(owner_cap_b)
  └── return OwnerCap B

Step 11: issue_jump_permit (as extension logic / user)
  └── gate::issue_jump_permit<MyAuth>(gate_a, gate_b, character, MyAuth{}, expiry_ms, ctx)
      → JumpPermit transferred to character.character_address()

Step 12: jump_with_permit (as user, sponsored tx)
  └── gate::jump_with_permit(gate_a, gate_b, character, permit, admin_acl, clock, ctx)
      → JumpPermit consumed (deleted)
      → JumpEvent emitted
```

---

## Key Constraints & Gotchas

1. **Sponsored transactions required:** Both `jump()` and `jump_with_permit()` call `admin_acl.verify_sponsor(ctx)`. The transaction MUST be gas-sponsored by an address in the AdminACL's `authorized_sponsors` table.

2. **Same extension type on both gates:** `issue_jump_permit` checks BOTH gates' extension fields match `type_name::with_defining_ids<Auth>()`. Since this includes the package ID, both gates must be configured with a witness from the same deployed package.

3. **OwnerCaps live inside Character objects:** They are NOT in the player's wallet. They must be borrowed via `Receiving<OwnerCap<T>>` from the Character and returned in the same transaction.

4. **JumpPermit is single-use:** Consumed (object deleted) on use. A new permit must be issued for each jump.

5. **Route hash is direction-agnostic:** A permit issued for (A, B) also validates for (B, A). The validation checks both orderings.

6. **NetworkNode must be online with fuel:** Gates draw energy from their NetworkNode. If the NetworkNode has no fuel or is offline, gates cannot go online.

7. **Distance proof is server-signed:** `link_gates` requires a BCS-serialized `LocationProof` signed by a registered server address. This is an off-chain component.

8. **Gate type_id must be preconfigured:** Energy config and max distance must be set for the gate's `type_id` before onlining or linking.

9. **Gates must be unlinked before unanchoring:** `unanchor()` asserts `linked_gate_id` is `None`.

10. **Extension can be swapped:** `authorize_extension` uses `swap_or_fill`, so it can replace a previously configured extension type.
