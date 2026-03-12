# Authenticated User Surface Analysis — world-contracts

**Retention:** Carry-forward

---

## Purpose

Determine what on-chain data and operations are available to a real player wallet (Character owner) that authenticates via EVE Vault and signs transactions. This analysis answers whether CivilizationControl (or any dashboard) can function with direct on-chain reads, or must rely on off-chain indexing.

All claims are verified against Move source in `vendor/world-contracts/contracts/world/sources/`.

---

## Quick Answers

| Question | Answer | Confidence |
|----------|--------|------------|
| Can we enumerate a user's owned gates without indexing? | **PARTIAL YES** — via RPC on Character object address, not pure on-chain Move | 🟡 Yellow |
| Can a wallet owner retrieve their structure's raw location? | **NO** — only Poseidon2 hash stored | 🔴 Red |
| Can a player configure structures without server signing? | **YES** — online/offline, authorize extension, unlink gates | 🟢 Green |
| Does CivilizationControl require off-chain indexing? | **YES** — for location display; **PARTIAL** — for structure enumeration | 🟡 Yellow |

---

## 1. Structure Discovery Model

### 1.1 Ownership Architecture

All structures (Gate, NetworkNode, StorageUnit, Assembly) follow an identical pattern:

```
Player Wallet (address)
  │
  │ character.character_address == ctx.sender()
  │ (authorization check, NOT Sui object ownership)
  │
  ▼
Character (SHARED OBJECT)
  │
  ├── OwnerCap<Character>    ─┐
  ├── OwnerCap<Gate>          │  transfer-to-object children
  ├── OwnerCap<Gate>          │  (owned by Character's UID)
  ├── OwnerCap<NetworkNode>   │
  ├── OwnerCap<StorageUnit>   │
  └── OwnerCap<Assembly>     ─┘

Gate / NetworkNode / StorageUnit / Assembly → ALL SHARED OBJECTS
  └── owner_cap_id: ID  (records which OwnerCap controls it)
```

**Key facts:**
- Structures are **shared objects** — anyone can read them; mutation requires OwnerCap
- OwnerCaps use **Sui's transfer-to-object** pattern — they live under the Character's UID, not the player's wallet address
- There is **no on-chain mapping** from owner → structures
- ObjectRegistry provides only existence checks (`object_exists(key)`), not enumeration

**Source references:**
- Character struct: [character.move L33–L40](../vendor/world-contracts/contracts/world/sources/character/character.move)
- Gate struct: [gate.move L66–L78](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move)
- NetworkNode struct: [network_node.move L58–L70](../vendor/world-contracts/contracts/world/sources/network_node/network_node.move)
- StorageUnit struct: [storage_unit.move L59–L70](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move)
- OwnerCap struct: [access_control.move L49–L53](../vendor/world-contracts/contracts/world/sources/access/access_control.move)
- OwnerCap transfer to Character: [gate.move L432](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move), [network_node.move L232](../vendor/world-contracts/contracts/world/sources/network_node/network_node.move), [storage_unit.move L373](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move)

### 1.2 OwnerCap Storage Detail

```move
public struct OwnerCap<phantom T> has key {
    id: UID,
    authorized_object_id: ID,
}
```
— [access_control.move L49–L53](../vendor/world-contracts/contracts/world/sources/access/access_control.move)

- **Abilities:** `key` only (no `store` — cannot be freely wrapped)
- **`authorized_object_id`:** Points to the specific structure this cap controls
- **Location:** Owned by the Character object (transfer-to-object), NOT the player wallet

### 1.3 Discovery Chain (RPC-Based)

Since there is no on-chain enumeration, structure discovery requires **RPC queries**:

```
Step 1: Wallet Address → Character
        Method: suix_getOwnedObjects won't work (Character is shared)
        Required: Know the Character object ID via:
          (a) game_character_id + tenant → deterministic ID (if ObjectRegistry UID known)
          (b) Event indexing of CharacterCreatedEvent
          (c) Off-chain mapping maintained by game server

Step 2: Character Object ID → OwnerCaps
        Method: suix_getOwnedObjects(character_object_id_as_address,
                { filter: { StructType: "pkg::access::OwnerCap<pkg::gate::Gate>" }})
        Returns: All OwnerCap<Gate> objects owned by this Character

Step 3: OwnerCap.authorized_object_id → Structure Object IDs
        Method: Read each OwnerCap's authorized_object_id field

Step 4: Structure IDs → Full structure data
        Method: sui_getObject(structure_id)
```

**Critical gap at Step 1:** There is no on-chain index mapping wallet address → Character object ID. The `character_address` field on Character is readable, but you must already HAVE the Character object to read it. Options:
- Deterministic ID computation (requires ObjectRegistry UID + game_character_id + tenant string)
- Event indexing (`CharacterCreatedEvent` includes `character_id` and `character_address`)
- Game server API

**Step 2 is viable via Sui RPC** — `suix_getOwnedObjects` supports querying objects owned by another object's address. This returns OwnerCaps without on-chain Move enumeration.

🟡 **Unverified — requires live environment confirmation:** Whether `suix_getOwnedObjects` on a Character object address returns transfer-to-object children in the live EVE Frontier environment. Confirmed to work on local devnet but live behavior with custom indexer configuration is untested.

### 1.4 Events Available for Indexing

| Event | Key Fields | Source |
|-------|-----------|--------|
| `CharacterCreatedEvent` | `character_id`, `key`, `tribe_id`, `character_address` | [character.move L45](../vendor/world-contracts/contracts/world/sources/character/character.move) |
| `GateCreatedEvent` | `assembly_id`, `assembly_key`, `owner_cap_id`, `type_id`, `location_hash` | [gate.move L87](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| `NetworkNodeCreatedEvent` | `network_node_id`, `assembly_key`, `owner_cap_id`, `type_id` | [network_node.move L77](../vendor/world-contracts/contracts/world/sources/network_node/network_node.move) |
| `StorageUnitCreatedEvent` | `storage_unit_id`, `assembly_key`, `owner_cap_id`, `type_id`, `location_hash` | [storage_unit.move L80](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |

> **Extended event audit:** A complete inventory of all 31 event emissions across 16 event types and 9 modules — including signal-to-source mapping for CivilizationControl — is documented in [read-path-architecture-validation.md](read-path-architecture-validation.md) §2.

> **v0.0.18 update:** ~32 event types now (`ExtensionConfigFrozenEvent` added in `extension_freeze.move`).

---

## 2. Location Visibility Model

### 2.1 Location Data Structure

```move
public struct Location has store {
    location_hash: vector<u8>,  // Must be exactly 32 bytes
}
```
— [location.move L35–L37](../vendor/world-contracts/contracts/world/sources/primitives/location.move)

Comment at [L33–34](../vendor/world-contracts/contracts/world/sources/primitives/location.move): *"The location_hash should be a Poseidon2 hash of the location coordinates."*

**There are NO raw coordinate fields anywhere in world-contracts.** The on-chain representation is exclusively a 32-byte Poseidon2 hash.

### 2.2 What Is Publicly Readable

| Data | Accessible? | Method | Privacy |
|------|------------|--------|---------|
| `location_hash` (32-byte hash) | **YES** | `gate::location()` → `location::hash()` | Low impact — hash is not reversible |
| Raw coordinates (x, y, z) | **NO** | Not stored on-chain | N/A |
| Distance between structures | **YES** (in proof txs) | Revealed in `LocationProofMessage.distance` during `verify_distance()` | Medium — exact distance visible in transaction data |
| Whether two structures are at same location | **YES** | `verify_same_location()` — hash equality check | Low |

**Source references:**
- `location::hash()`: [location.move L171–L173](../vendor/world-contracts/contracts/world/sources/primitives/location.move)
- `gate::location()`: [gate.move L353](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move)
- `storage_unit::location()`: [storage_unit.move L315](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move)
- `assembly::location()`: **test_only** — [assembly.move L371–L373](../vendor/world-contracts/contracts/world/sources/assemblies/assembly.move)

### 2.3 Distance Verification Mechanism

```move
public fun verify_distance(
    location: &Location,
    server_registry: &ServerAddressRegistry,
    proof_bytes: vector<u8>,
    max_distance: u64,
    ctx: &mut TxContext,
)
```
— [location.move L140–L157](../vendor/world-contracts/contracts/world/sources/primitives/location.move)

**This is a SERVER-SIGNED ATTESTATION model, not ZK-based.**

Flow:
1. Server computes distance off-chain using raw coordinates
2. Server signs `LocationProofMessage` with Ed25519 key registered in `ServerAddressRegistry`
3. On-chain verification checks: server is authorized, player matches `ctx.sender()`, target hash matches, distance ≤ max_distance, proof not expired

`LocationProofMessage` contents (all visible in transaction data):
- `server_address`, `player_address`, `source_structure_id`, `source_location_hash`
- `target_structure_id`, `target_location_hash`, **`distance`** (exact value), `deadline_ms`

Source: [location.move L53–L64](../vendor/world-contracts/contracts/world/sources/primitives/location.move)

### 2.4 ZK Upgrade Path

The `vendor/eve-frontier-proximity-zk-poc/` repository provides Groth16 circuits for ZK location/distance attestation. This is a **separate PoC** not integrated into current world-contracts. A future upgrade could hide even distance values behind threshold proofs.

### 2.5 UX Implications for Map Display

A dashboard displaying structure locations on a map requires **one** of:

1. **Game server API** mapping `location_hash` → coordinates (requires CCP cooperation or reverse-engineering)
2. **Client-side coordinate cache** from game sessions where structures were visible
3. **Transaction data mining** — extract `LocationProofMessage` data from historical transactions (reveals hashes + distances but NOT raw coordinates)
4. **Brute-force Poseidon2** — computationally infeasible for real coordinate spaces

**Conclusion:** Location display is **not feasible** from on-chain data alone. The hash is one-way. Any map feature requires off-chain coordinate data.

> **Update 2026-02-19:** Spatial architecture resolved. Manual user pinning (option 2 above) adopted as the data source for a CivControl-native SVG topology (Strategic Network Map). EF-Map embed provides additional cosmic context. See [Spatial Embed Requirements](../architecture/spatial-embed-requirements.md).

---

## 3. Permission Model — Player vs Server

### 3.1 Capability Hierarchy

```
GovernorCap (deployer) — package init
  └── AdminCap (server) — created by Governor
       └── OwnerCap<T> (player) — created by Admin, held by Character
```

Plus:
- **AdminACL** — sponsorship whitelist (`verify_sponsor()`)
- **ServerAddressRegistry** — authorized server addresses for location proof signatures
- **Extension witness** (`Auth: drop`) — only callable from extension packages

### 3.2 Operations by Authorization Level

#### Player-Only Operations (OwnerCap — no server needed)

| Operation | Module | Source |
|-----------|--------|--------|
| Bring gate online/offline | gate | [gate.move L119, L131](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Bring NWN online/offline | network_node | [network_node.move L115, L124](../vendor/world-contracts/contracts/world/sources/network_node/network_node.move) |
| Bring SSU online/offline | storage_unit | [storage_unit.move L99, L114](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |
| Authorize extension on gate | gate | [gate.move L114](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Authorize extension on SSU | storage_unit | [storage_unit.move L91](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |
| Unlink gates (both owners) | gate | [gate.move L175](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Bring assembly online/offline | assembly | [assembly.move L54, L68](../vendor/world-contracts/contracts/world/sources/assemblies/assembly.move) |

**Auth flow:** Player wallet signs tx → `borrow_owner_cap()` checks `character_address == ctx.sender()` → OwnerCap borrowed → operation executed → OwnerCap returned.

#### Player + Server Proof (OwnerCap + ServerAddressRegistry)

| Operation | Module | Additional Requirement | Source |
|-----------|--------|----------------------|--------|
| Link gates | gate | Distance proof (server-signed) | [gate.move L143](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Deposit by owner (SSU) | storage_unit | Proximity proof (server-signed) | [storage_unit.move L225](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |
| Withdraw by owner (SSU) | storage_unit | Proximity proof (server-signed) | [storage_unit.move L270](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |
| Bridge chain→game items | storage_unit | Location proof (server-signed) | [storage_unit.move L140](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |

#### Sponsored Operations (verify_sponsor — requires AdminACL-listed sponsor)

| Operation | Module | Additional Auth | Source |
|-----------|--------|----------------|--------|
| Default jump | gate | No extension configured | [gate.move L259](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Jump with permit | gate | Valid JumpPermit + Clock | [gate.move L272](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Deposit fuel | network_node | OwnerCap<NWN> | [network_node.move L96](../vendor/world-contracts/contracts/world/sources/network_node/network_node.move) |
| Withdraw fuel | network_node | OwnerCap<NWN> | [network_node.move L111](../vendor/world-contracts/contracts/world/sources/network_node/network_node.move) |
| Bridge game→chain items | storage_unit | OwnerCap + sender check | [storage_unit.move L569](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |

**`verify_sponsor()` logic** ([access_control.move L164–L169](../vendor/world-contracts/contracts/world/sources/access/access_control.move)):
1. Transaction MUST be sponsored (sender ≠ gas_payer)
2. Sponsor address MUST be in `AdminACL.authorized_sponsors` table
3. Self-sponsorship fails — `ctx.sponsor()` returns `None` when sender == gas_payer

#### Admin-Only Operations (AdminCap — server/CCP controlled)

| Operation | Examples |
|-----------|---------|
| Create/delete characters | `create_character`, `delete_character` |
| Anchor/unanchor structures | `anchor`, `unanchor`, `unanchor_orphan` |
| Connect assemblies to NWN | `connect_assemblies` |
| Update fuel state | `update_fuel` |
| Share objects | `share_gate`, `share_network_node`, etc. |
| Set gate distance config | `set_max_distance` |
| Admin unlink gates | `unlink_gates_by_admin` |
| Update location | `location::update` |

Total: **~40 admin-gated functions** across all modules.

#### Extension-Controlled Operations (Auth witness — extension package only)

| Operation | Module | Source |
|-----------|--------|--------|
| Issue jump permit | gate | [gate.move L200](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) |
| Extension deposit item | storage_unit | [storage_unit.move L164](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |
| Extension withdraw item | storage_unit | [storage_unit.move L182](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) |

### 3.3 Hidden Permission Constraints

| Constraint | Location | Impact |
|-----------|----------|--------|
| OwnerCap transfer restricted to Character type only | [access_control.move L111–L119](../vendor/world-contracts/contracts/world/sources/access/access_control.move) | Cannot transfer Gate/NWN/SSU OwnerCaps via `transfer_owner_cap_to_address` |
| No `remove_sponsor_from_acl` function | access_control.move | Once a sponsor is added to AdminACL, it cannot be removed without package upgrade |
| Self-sponsorship silently fails | `ctx.sponsor()` returns None | Must use distinct sponsor address |
| Location proofs bind to sender | [location.move L114](../vendor/world-contracts/contracts/world/sources/primitives/location.move) | `message.player_address == ctx.sender()` — proofs are non-transferable |
| Inventory dual-path authorization | [storage_unit.move L695–L710](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move) | Accepts only `OwnerCap<StorageUnit>` or `OwnerCap<Character>` — runtime type check |
| Extension replacement allowed | `swap_or_fill()` on `gate.extension` | Owner can replace extension at any time |
| JumpPermit single-use | [gate.move L683](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move) | Permit deleted after use (TODO in code for multi-use) |

🟡 **Unverified — requires live environment confirmation:** Whether the live EVE Frontier deployment has additional server-side middleware that filters or gates transactions beyond what world-contracts enforces. Local devnet testing shows only the on-chain constraints documented here.

---

## 4. Required Off-Chain Infrastructure

### 4.1 Mandatory Off-Chain Components

| Component | Reason | Alternatives |
|-----------|--------|-------------|
| **Character ID resolution** | No on-chain wallet→Character mapping | Event indexing, game server API, or deterministic ID computation (requires ObjectRegistry UID) |
| **Location coordinate mapping** | Only Poseidon2 hash stored on-chain | Game server API, client cache, or pre-computed mapping table |
| **Sponsorship service** | Fuel and jump operations require AdminACL-listed sponsor | Must operate a sponsor relay registered in AdminACL |

### 4.2 Optional But Recommended

| Component | Reason |
|-----------|--------|
| **Event indexer** | Efficient discovery of all structures, tracking ownership changes, building wallet→Character→structures graph |
| **Structure state cache** | Reduces RPC calls for dashboard display (online/offline status, fuel levels, extension config) |

### 4.3 NOT Required

| Component | Why Not |
|-----------|---------|
| Structure enumeration indexer | **Possible via RPC** once Character ID is known — `suix_getOwnedObjects` on Character address returns OwnerCaps |
| Permission checking backend | All permission logic is on-chain — client can construct valid PTBs directly |
| Extension authorization backend | Player can authorize extensions with wallet signature alone |

---

## 5. Risk Assessment

### 🟢 Green — Validated

| Item | Evidence |
|------|----------|
| Player can bring own structures online/offline | OwnerCap-only auth, no AdminCap/sponsorship needed. Verified in source. |
| Player can authorize extensions without server | `authorize_extension` requires only OwnerCap. Verified in source. |
| Player can unlink their own gates | `unlink_gates` requires OwnerCaps for both gates. Verified in source. |
| Structure data is publicly readable | Shared objects — anyone can read via RPC. All view functions are permissionless. |
| OwnerCap discovery via RPC is architecturally sound | `suix_getOwnedObjects` on Character address with type filter retrieves OwnerCaps. Sui documentation confirms this pattern. |

### 🟡 Yellow — Unclear, Needs Live Confirmation

| Item | Concern |
|------|---------|
| RPC-based OwnerCap discovery on live network | `suix_getOwnedObjects` on Character object address may behave differently with EVE Frontier's custom indexer/RPC configuration |
| Character ID resolution without game server | Deterministic ID computation requires knowing ObjectRegistry UID + tenant string — may not be publicly documented |
| AdminACL sponsor list membership | Whether CivilizationControl's sponsor address can be added to AdminACL, or if CCP restricts this |
| Live transaction filtering | Whether CCP operates middleware that rejects non-game-client transactions |

### 🔴 Red — Structural Blocker

| Item | Impact |
|------|--------|
| **Location coordinates not on-chain** | Cannot display structure positions on a map from on-chain data alone. Poseidon2 hash is irreversible. Any map/location feature requires off-chain coordinate source. |
| **No wallet→Character on-chain mapping** | First step of discovery chain requires off-chain resolution. Without this, dashboard cannot bootstrap. |

---

## 6. Concrete Recommendations for CivilizationControl

### Can CivilizationControl list owned structures directly?

**PARTIAL YES.** Given a Character object ID, the dashboard can enumerate owned structures via RPC:
1. `suix_getOwnedObjects(character_address, { filter: { StructType: "...::OwnerCap<...::Gate>" }})` → OwnerCap list
2. Read `authorized_object_id` from each OwnerCap → structure IDs
3. `sui_getObject(structure_id)` → full structure data

**Blocker:** Resolving wallet address → Character ID requires off-chain data (event indexing or game server API).

### Must it rely on event indexer?

**For structure enumeration:** No, if Character ID is known (RPC is sufficient).
**For Character discovery:** Yes, unless deterministic ID computation inputs are available.
**For comprehensive dashboard:** Recommended but not strictly required.

### Is location display feasible or must it remain abstract?

**Must remain abstract** unless off-chain coordinate data is obtained.

**Feasible abstractions without coordinates:**
- Structure status (online/offline) — ✅ on-chain
- Extension configuration — ✅ on-chain
- Gate link status — ✅ on-chain (`linked_gate_id`)
- Fuel levels — ✅ on-chain (`fuel` field on NetworkNode)
- Inventory contents — ✅ on-chain (dynamic fields)
- Network topology (NWN → connected assemblies) — ✅ on-chain (`connected_assembly_ids`)
- Relative distances — 🟡 extractable from historical `verify_distance` transactions

**Not feasible without off-chain data:**
- Absolute position on map — ❌
- Coordinate-based spatial queries — ❌
- "Structures near me" without server proof — ❌

---

## 7. Architecture Diagram — Data Accessibility

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ON-CHAIN (readable)                          │
│                                                                     │
│  Character ──┬── character_address (wallet link)                    │
│              ├── tribe_id                                           │
│              └── owner_cap_id                                       │
│                                                                     │
│  Gate ───────┬── status (online/offline)                            │
│              ├── linked_gate_id (link partner)                      │
│              ├── location_hash (32-byte Poseidon2 — NOT coords)     │
│              ├── extension (TypeName or None)                       │
│              ├── type_id                                            │
│              └── owner_cap_id                                       │
│                                                                     │
│  NetworkNode ┬── status, fuel (capacity/amount/burn rate)           │
│              ├── location_hash                                      │
│              ├── connected_assembly_ids (topology)                  │
│              └── energy_source (max production)                     │
│                                                                     │
│  StorageUnit ┬── status, inventory_keys                             │
│              ├── location_hash                                      │
│              ├── extension (TypeName or None)                       │
│              └── type_id                                            │
│                                                                     │
│  OwnerCap<T> ─── authorized_object_id (structure pointer)          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                    OFF-CHAIN REQUIRED                                │
│                                                                     │
│  ✗ Raw coordinates (x, y, z)                                       │
│  ✗ Wallet → Character mapping (needs event index or server API)     │
│  ✗ Location hash → coordinate reverse mapping                      │
│  ✗ Sponsorship relay (for fuel/jump operations)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Companion Document

Detailed function-by-function authorization categorization (40+ admin functions, 18 player functions, 5 sponsored functions, 10 hot-potato functions) available in:
[world-contracts-auth-model.md](world-contracts-auth-model.md)

---

## Appendix A — Key Source File Index

| File | Path | Key Contents |
|------|------|-------------|
| access_control.move | `vendor/world-contracts/contracts/world/sources/access/access_control.move` | GovernorCap, AdminCap, AdminACL, OwnerCap<T>, verify_sponsor, ServerAddressRegistry |
| character.move | `vendor/world-contracts/contracts/world/sources/character/character.move` | Character struct, borrow_owner_cap, create_character |
| gate.move | `vendor/world-contracts/contracts/world/sources/assemblies/gate.move` | Gate struct, anchor, link/unlink, jump, authorize_extension |
| network_node.move | `vendor/world-contracts/contracts/world/sources/network_node/network_node.move` | NetworkNode struct, fuel management, connected_assemblies |
| storage_unit.move | `vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move` | StorageUnit struct, inventory, deposit/withdraw, extension auth |
| assembly.move | `vendor/world-contracts/contracts/world/sources/assemblies/assembly.move` | Assembly struct (generic), online/offline |
| location.move | `vendor/world-contracts/contracts/world/sources/primitives/location.move` | Location struct, verify_distance, verify_proximity, LocationProofMessage |
| object_registry.move | `vendor/world-contracts/contracts/world/sources/registry/object_registry.move` | ObjectRegistry singleton, deterministic ID derivation |

---

*Analysis performed: 2026-02-16. Source: vendor/world-contracts on main branch.*
*All claims verified against Move source. Items marked 🟡 require live environment confirmation.*
