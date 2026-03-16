# Day 1 Chain Validation Results — CivilizationControl

**Date:** 2026-03-12  
**Branch:** `feature/day1-chain-validation`  
**Operator:** Agent-assisted  
**Environment target:** Utopia (Sui Testnet via `https://fullnode.testnet.sui.io:443`)

---

## Environment State

| Key | Value |
|-----|-------|
| Sui CLI active-env | `testnet` |
| RPC URL | `https://fullnode.testnet.sui.io:443` |
| World Package | `0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75` |
| Object Registry | `0xc2b969a72046c47e24991d69472afb2216af9e91caf802684514f39706d7dc57` |
| Killmail Registry | `0xa92de75fde403a6ccfcb1d5a380f79befaed9f1a2210e10f1c5867a4cd82b84e` |
| Server Address Registry | `0x9a9f2f7d1b8cf100feb532223aa6c38451edb05406323af5054f9d974555708b` |
| Location Registry | `0x62e6ec4caea639e21e4b8c3cf0104bace244b3f1760abed340cc3285905651cf` |
| Energy Config | `0x9285364e8104c04380d9cc4a001bbdfc81a554aad441c2909c2d3bd52a0c9c62` |
| Fuel Config | `0x0f354c803af170ac0d1ac9068625c6321996b3013dc67bdaf14d06f93fa1671f` |
| Gate Config | `0x69a392c514c4ca6d771d8aa8bf296d4d7a021e244e792eb6cd7a0c61047fc62b` |
| AdminACL | `0xa8655c6721967e631d8fd157bc88f7943c5e1263335c4ab553247cd3177d4e86` |

---

## Check 1: Hackathon Start Date — PASS

Hackathon coding period started. Current date (2026-03-12) is after hack start. Repo was created appropriately.

---

## Check 2: Fresh Repo + Submodules — PASS

| Submodule | Status | Ref |
|-----------|--------|-----|
| `vendor/world-contracts` | Initialized | `8e2e97b` (v0.0.18+1) |
| `vendor/builder-scaffold` | Initialized | `8072eac` (v0.0.2+1) |
| `vendor/evevault` | Initialized | `8f184c5` (v0.0.5+7) |
| `vendor/builder-documentation` | Initialized | `07364c4` (heads/main) |

Commit history is clean (3 commits on master: scaffold, packaging, submodules).

---

## Check 3: Critical Function Signatures — All PASS

### A1: `gate::authorize_extension<Auth: drop>` — PASS

**File:** `vendor/world-contracts/contracts/world/sources/assemblies/gate.move` L126  
**Signature:** `public fun authorize_extension<Auth: drop>(gate: &mut Gate, owner_cap: &OwnerCap<Gate>)`  
**Freeze guard:** Present — asserts `!extension_freeze::is_extension_frozen(&gate.id)` (L129)  
**OwnerCap check:** `access::is_authorized(owner_cap, gate_id)` (L128)

### A2: `gate::issue_jump_permit<Auth: drop>` — PASS

**File:** `vendor/world-contracts/contracts/world/sources/assemblies/gate.move` L229  
**Signature:** `public fun issue_jump_permit<Auth: drop>(source_gate: &Gate, destination_gate: &Gate, character: &Character, _: Auth, expires_at_timestamp_ms: u64, ctx: &mut TxContext)`  
**Visibility:** `public` — callable from external packages  
**Does NOT require OwnerCap** — witness is the auth mechanism  
**Both gates must have matching extension type** (L237-247)

### A3: `storage_unit::withdraw_item<Auth: drop>` — PASS

**File:** `vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move` L189  
**Signature:** `public fun withdraw_item<Auth: drop>(storage_unit: &mut StorageUnit, character: &Character, _: Auth, type_id: u64, quantity: u32, ctx: &mut TxContext): Item`  
**Does NOT require OwnerCap**  
**Has `quantity: u32` param** (v0.0.15+)  
**Online guard:** SSU must be online (L199)

### A4: `Item` has `key, store` — PASS

**File:** `vendor/world-contracts/contracts/world/sources/primitives/inventory.move` L93  
**Definition:** `public struct Item has key, store { id: UID, parent_id: ID, tenant: String, type_id: u64, item_id: u64, volume: u64, quantity: u32, location: Location }`  
**ItemEntry split confirmed** at L77: `public struct ItemEntry has copy, drop, store { ... }`  
**`transfer::public_transfer`** is valid for `Item`

### A5: `jump` / `jump_with_permit` require sponsored tx — PASS

Both functions call `admin_acl.verify_sponsor(ctx)` as first operation.  
`jump` at L269; `jump_with_permit` at L282.

### A8: Extension field is `Option<TypeName>` — PASS

Gate struct L85: `extension: Option<TypeName>` — single extension per gate confirmed.

---

## Check 4: Test Server Connection — PASS

**RPC URL:** `https://fullnode.testnet.sui.io:443` — already configured in local Sui CLI as `testnet` env.  
**Active env:** `testnet` confirmed.  
**Object queries:** All 8 provided Utopia IDs verified on live testnet RPC.

### 4a: World Package Discovery — PASS (LIVE-VERIFIED)

Package `0xd12a...f75` confirmed as on-chain Package object. Module map includes: `access`, `gate`, `energy`, `fuel`, `object_registry`, `killmail_registry`, `location`, etc.

### 4b: RPC Capabilities — PASS

`sui client object` queries return structured data for all object types. Basic RPC operational.

---

## Check 4 Addendum: Live Object-ID Validation

All 8 provided Utopia IDs verified against live testnet:

| Object | Expected Type | On-chain Type | Status |
|--------|--------------|---------------|--------|
| World Package | Package | Package (id confirmed) | LIVE-VERIFIED |
| ObjectRegistry | `object_registry::ObjectRegistry` | `0xd12a...::object_registry::ObjectRegistry` | LIVE-VERIFIED |
| KillmailRegistry | `killmail_registry::KillmailRegistry` | `0xd12a...::killmail_registry::KillmailRegistry` | LIVE-VERIFIED |
| ServerAddressRegistry | `access::ServerAddressRegistry` | `0xd12a...::access::ServerAddressRegistry` | LIVE-VERIFIED |
| LocationRegistry | `location::LocationRegistry` | `0xd12a...::location::LocationRegistry` | LIVE-VERIFIED |
| EnergyConfig | `energy::EnergyConfig` | `0xd12a...::energy::EnergyConfig` | LIVE-VERIFIED |
| FuelConfig | `fuel::FuelConfig` | `0xd12a...::fuel::FuelConfig` | LIVE-VERIFIED |
| GateConfig | `gate::GateConfig` | `0xd12a...::gate::GateConfig` | LIVE-VERIFIED |
| AdminACL | `access::AdminACL` | `0xd12a...::access::AdminACL` | LIVE-VERIFIED |

All objects belong to the same World Package (`0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75`).

---

## Check 5: AdminACL Sponsor-Path — PASS (reclassified)

### Source-level findings

- `verify_sponsor(admin_acl, ctx)` checks either the tx sponsor or sender against `authorized_sponsors: Table<address, bool>`.
- `add_sponsor_to_acl(admin_acl, governor_cap, sponsor)` requires GovernorCap — only the world deployer can enroll.
- **No remove capability** — enrollment is add-only.
- Extension functions (`authorize_extension`, `issue_jump_permit`, DF policy config) do NOT call `verify_sponsor` — witness type / OwnerCap is the auth mechanism. All CivilizationControl-owned operations work without AdminACL enrollment.
- `jump` / `jump_with_permit` / `link_gates` / `share_gate` DO call `verify_sponsor` — these are game-level operations, not builder-extension operations.

### Sponsorship responsibility analysis

| Function | Calls `verify_sponsor`? | Caller responsibility |
|----------|------------------------|-----------------------|
| `authorize_extension<Auth>` | No (OwnerCap) | CivilizationControl |
| `issue_jump_permit<Auth>` | No (witness) | CivilizationControl |
| Extension DF config writes | No | CivilizationControl |
| `jump` / `jump_with_permit` | Yes | Game / EVE Frontier backend |
| `link_gates` / `share_gate` | Yes | Game / EVE Frontier backend |

### EVE Vault sponsorship relay (source-verified)

EVE Vault provides a **server-managed sponsorship relay** for player-facing sponsored transactions:
1. EVE Frontier backend builds the PTB, pays gas as sponsor (its address is in AdminACL)
2. User counter-signs via zkLogin popup in the Vault extension
3. Server executes the dual-signed transaction on Sui

The dApp never handles gas and never needs AdminACL enrollment. Full analysis: `docs/architecture/evevault-sponsorship-analysis.md`.

### Reclassification

- **Previously:** BLOCKED — framed as requiring GovernorCap access or organizer enrollment.
- **Updated conclusion:** CivilizationControl's own extension/governance functions do NOT require `verify_sponsor`. The AdminACL-gated operations (`jump_with_permit`, etc.) are game-level functions handled by the EVE Frontier backend via the Vault sponsorship relay.
- **Follow-up:** Live confirmation that the end-to-end extended-gate jump flow works on Utopia (EVE Vault + custom extension). This is a validation item, not a blocker.

### Status: PASS — CivilizationControl implementation is not blocked by AdminACL

---

## Check 6: Builder-Scaffold Reference Paths — PASS

| Path | Exists | Notes |
|------|--------|-------|
| `vendor/builder-scaffold/move-contracts/smart_gate_extension/` | YES | Canonical gate extension reference (sources/, tests/, Move.toml) |
| `vendor/builder-scaffold/ts-scripts/smart_gate_extension/` | YES | Canonical TS scripts (authorise, configure, jump, issue-permit, etc.) |
| `vendor/builder-scaffold/ts-scripts/utils/` | YES | Config, constants, derive-object-id, transaction helpers |
| `vendor/builder-scaffold/move-contracts/smart_gate/` (old) | NO | Removed — correct per 3c65b22 rename |
| `vendor/builder-scaffold/ts-scripts/smart_gate/` (old) | NO | Removed — correct per 3c65b22 rename |

---

## Check 7: Extension Freeze (v0.0.18 feature) — PASS (source-verified)

- `extension_freeze.move` exists in `vendor/world-contracts/contracts/world/sources/assemblies/`
- `is_extension_frozen(object: &UID): bool` — public read function
- `freeze_extension_config(parent: &mut UID, assembly_id: ID)` — package-internal, irreversible
- `remove_frozen_marker_if_present(parent: &mut UID)` — cleanup on unanchor only
- Gate `authorize_extension` guarded by freeze check (L129)
- Demo narrative upgrade: operator freezes gate after configuring policy = proof of immutability

---

## Check 8: SSU Open Inventory (v0.0.18 feature) — PASS (source-verified)

- `deposit_to_open_inventory<Auth: drop>` at storage_unit.move L217
- `withdraw_from_open_inventory<Auth: drop>` at storage_unit.move L241
- Extension-only (require Auth witness matching `storage_unit.extension`)
- Enables escrow, prize pools, courier handoffs

---

## Check 9: Move Package Sanity — PASS

| Item | Status |
|------|--------|
| Package path | `contracts/civilization_control/` — matches repo conventions |
| `Move.toml` name | `civilization_control` |
| Edition | `2024.beta` |
| Address | `civilization_control = "0x0"` (unpublished) |
| World dependency | Commented out (TODO) — expected for Day 1 |
| Sources | Single placeholder module: `placeholder.move` |
| `sui move build` | EXIT 0 — compiles clean |
| `sui move test` | EXIT 0 — 0 tests, 0 failures |
| Tests dir | Does not exist yet — expected |

---

## Summary

| Check | Status | Evidence |
|-------|--------|----------|
| 1. Hackathon start date | PASS | Current date 2026-03-12 |
| 2. Fresh repo + submodules | PASS | 3 commits, 4 submodules initialized |
| 3. Critical function signatures (A1-A4) | PASS | All verified against v0.0.18 source |
| 4. Test server connection | PASS | Testnet RPC active, all objects queryable |
| 4a. World Package discovery | PASS | LIVE-VERIFIED on-chain |
| 4b. RPC capabilities | PASS | Object queries functional |
| 5. AdminACL sponsor path | PASS (reclassified) | CC-owned functions don't require sponsorship; game-level ops handled by EVE Vault relay |
| 6. Builder-scaffold paths | PASS | Canonical `_extension` paths confirmed |
| 7. Extension freeze | PASS | Source-verified v0.0.18 |
| 8. SSU open inventory | PASS | Source-verified v0.0.18 |
| 9. Move package sanity | PASS | Build + test clean |

### Blockers

None. All Day 1 checks pass. CivilizationControl implementation can proceed.

### Follow-up validation (not blocking)

1. **End-to-end extended-gate jump on Utopia** — Confirm that the game/base dApp correctly handles the 2-TX jump flow (`issue_jump_permit` → `jump_with_permit`) for gates with custom extensions, using EVE Vault's sponsored transaction relay. This requires a deployed extension + live Utopia test with EVE Vault.

### Next Steps

1. ~~Uncomment World dependency in `Move.toml` and begin GateControl implementation~~ — DONE (Hour 1)
2. ~~Build extension, test on localnet, publish to Utopia~~ — DONE (see below)

---

## Publish Record — Utopia Testnet (2026-03-12)

| Key | Value |
|-----|-------|
| Transaction Digest | `EBU5T9cDymgUnyGTdtXkfBWuUmfWLKEMLJT5VXU8p5QU` |
| Status | Success |
| Executed Epoch | 1036 |
| Build Env | `testnet_utopia` |
| Gas Budget | 500,000,000 MIST |
| Gas Used | ~54.26 MIST (storage 53.83 + compute 1.41 − rebate 0.98) |
| Modules Published | `gate_control`, `trade_post` |
| Tests at publish | 21/21 pass (11 GateControl + 10 TradePost) |

### Published Objects

| Object | ID | Owner |
|--------|----|-------|
| **Package** | `0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04` | Immutable |
| **GateConfig** (shared) | `0x8655eb39017766ef275ba0104819228bff90e25d997a38385f2eb4ddf65d45f2` | Shared |
| **GateControl AdminCap** | `0xaedc8ce4e44ed195d58ae12e433e1fa7fb9126403f930f2b41dbc3a0c8c09b3e` | Publisher (`0xacff…b1`) |
| **TradePostAdminCap** | `0x1ffbb24485a838b562e815f34b9a965493e9d056a857264ad3e43b9dd7e3df06` | Publisher (`0xacff…b1`) |
| **UpgradeCap** | `0x1dea9aedbd461969de0358da66368bd2cc3a140983c17a205ee0ec66ce09efa3` | Publisher (`0xacff…b1`) |

### Integration Readiness

Package is live on Utopia. Next steps require **human/manual world setup**:

1. **Authorize `GateAuth`** on target gates: `gate::authorize_extension<GateAuth>(gate, owner_cap)` — requires gate OwnerCap
2. **Authorize `TradeAuth`** on target SSUs: `storage_unit::authorize_extension<TradeAuth>(ssu, owner_cap)` — requires SSU OwnerCap
3. **Identify test assets**: gates, SSUs, characters, and items on Utopia for end-to-end flow
4. **Configure policies**: set tribe rules / coin tolls via AdminCap + GateConfig
5. **Create test listings**: create and share Listing objects for trade flows
6. **End-to-end validation**: jump permits + item trades on live Utopia
3. Run live validation: confirm extended-gate jump works end-to-end with EVE Vault on Utopia
4. If extended-gate jump flow is not handled by the base dApp, evaluate building a jump UI using the `evefrontier:sponsoredTransaction` wallet feature

---

## Hour 5: Live Asset Discovery — Utopia (2026-03-12)

**Wallet:** `0xad0221857e57908707762a74b68e6f340b06a6e9f991c270ae9c06cf1a92fb71`
**Method:** Chain-only (Sui JSON-RPC `suix_getOwnedObjects`, `sui_getObject`, `suix_getDynamicFields`)
**Mutation:** None — read-only discovery pass

### Ownership Chain Discovery

| Hop | Object | ID |
|-----|--------|----|
| Wallet → | PlayerProfile | `0xd6d20121f2c117fcfa2ff69b637774b8c0ae66925ac4d8de635b58ae442a369b` |
| → | Character | `0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110` |
| Character name | "lacal" | tribe_id=1000167, tenant="utopia", item_id=2112000069 |
| Character OwnerCap | `0xbcab2c0f6266d5af8d09d70dfa7ec7783a848cebbb5e92c2b8b534f3dd83c309` | auth → Character |

**Key finding:** OwnerCaps are child objects of the Character (transferred to Character's address via `transfer::transfer`), not the wallet. Discovery chain: `wallet → PlayerProfile → Character → OwnerCaps → shared Assemblies`.

### Asset Inventory (70 OwnerCaps)

| Type | Count | Notes |
|------|-------|-------|
| Gate | 12 | 10 valid (type_id=88086), 2 empty/uninitialized |
| StorageUnit (SSU) | 5 | 2 populated (type_id=77917), 3 empty |
| Turret | 41 | Not needed for CC testing |
| NetworkNode | 9 | Energy sources for co-located assemblies |
| Assembly (generic) | 2 | Generic assembly type |
| Character | 1 | Self-reference |

### Gate Inventory (12 gates, all extension=NO, all linked=NO)

| Gate ID (short) | Full Gate ID | Status | Energy Node | Item ID |
|-----------------|-------------|--------|-------------|---------|
| 0x7cb4… | `0x7cb497b194e1874ea5d6deaf9b192f92d16f8afacac27c265dc9cbbe51253ebb` | UNKNOWN | — | — |
| 0x1b91… | `0x1b911c2e7aac7167d67efc6f52ce097b87af9544cfa0bb64bb1faa246701bee1` | OFFLINE | 0x0ec2… | 1000000015913 |
| 0xfade… | `0xfade51df5572c1cb34faa33dbae65630a600eea2515681294ce757da9d06000b` | OFFLINE | 0xa33e… | 1000000015813 |
| 0xc701… | `0xc701fd459f2f2f83e8395e74474f01ae4a8d63a65194567f59c79c1c619e996c` | OFFLINE | 0xccf2… | 1000000015850 |
| 0x01f6… | `0x01f62b7cc08d5ed48d164afb210b3d6ab6b8a3175e93a6209ddcee6fc896e825` | OFFLINE | 0xa33e… | 1000000015815 |
| 0xf130… | `0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68` | OFFLINE | 0x8bad… | 1000000015746 |
| 0x79b0… | `0x79b02eb6db234e9b4421e5515bce033593fc6ded6700a3c14ded8acb19080c19` | OFFLINE | 0x0e42… | 1000000015778 |
| 0xb700… | `0xb7007baf5045eb43a663b29f54636148124c5565ed96741192ad987fc66df220` | OFFLINE | 0x0e42… | 1000000015776 |
| 0x6c08… | `0x6c08c38c8a73bbc193c2b7a9a197378f6b6dd97a756f20e36b9a497b7ffff47d` | UNKNOWN | — | — |
| 0x34fa… | `0x34fae853ecf459e8071fa7bf57211b501117b77efba1821240f62891eb9ffbb8` | OFFLINE | 0x13a1… | 1000000015956 |
| 0xee30… | `0xee30dc58a600f1827870633746bfefb9a31de1d91f7f2bd4d1af16196b01c6d6` | OFFLINE | 0x0ec2… | 1000000015934 |
| 0xce59… | `0xce5973c0f945ec94dce2b947e92cbcc1f0a963c3910377934907d4265f5b0ad3` | OFFLINE | 0xccf2… | 1000000015874 |

### SSU Inventory (5 SSUs)

| SSU ID (short) | Full SSU ID | Status | Items | Capacity Used | Energy Node | Item ID |
|----------------|------------|--------|-------|---------------|-------------|---------|
| 0x73a2… | `0x73a260bd3de57c46d390a18abe797dc1d24a166c383e871e2abc46ba996bf121` | **ONLINE** | **5** | 3,441,520 / 2.5B | 0x8bad… | 1000000015748 |
| 0x6017… | `0x6017557b92a2f3cd7e616eabfcae005e32d50beff702b37833043917a3300134` | UNKNOWN | 0 | — | — | — |
| 0xd080… | `0xd0808811ff83e517be7cdcada463456403a4112605608c9af0fb6bd07f8c06df` | OFFLINE | 0 | 0 / 2.5B | 0x13a1… | 1000000015977 |
| 0x107c… | `0x107cd2d765b2c85599dcfdfc3594a5de967d4c28c0d75e761d238be190965085` | UNKNOWN | 0 | — | — | — |
| 0x669b… | `0x669b25fe8d85e42e182769e04c069380bbfa3b45c34b83de479d578a9089c441` | UNKNOWN | 0 | — | — | — |

### SSU Inventory Contents (0x73a2… — ONLINE)

| Type ID | Quantity | Volume |
|---------|----------|--------|
| 89089 | 710 | 4,700 |
| 78437 | 840 | 28 |
| 84180 | 40 | 400 |
| 84182 | 60 | 1,000 |
| 77810 | 50 | 100 |

### Co-Location Map (Gate ↔ SSU ↔ NetworkNode)

| Network Node (short) | Full Node ID | Gates | SSUs |
|----------------------|-------------|-------|------|
| 0xa33e… | `0xa33ebcf674ee15b2c7c3254a1a5424684cbcd067c84a7fbe97458d3ad2e0d737` | 0xfade…, 0x01f6… | — |
| 0x0e42… | `0x0e42d9255ef0543d8fb695116690c6580a6da6761d25f1161685dbe241cdd745` | 0x79b0…, 0xb700… | — |
| 0x0ec2… | `0x0ec225750297ded91623f487fc316aacee776b40f06817de0be8fb3c815e6311` | 0x1b91…, 0xee30… | — |
| **0x8bad…** | `0x8bad0caba44cb8400c50e95c15fbfc370ec48b1ce35daf8e1365376382940c4c` | **0xf130…** | **0x73a2… (ONLINE)** |
| 0x13a1… | `0x13a1c30f11df0b93344b7806fee2c3f706e9fdf5201782d4f329c91435803c5c` | 0x34fa… | 0xd080… (empty) |
| 0xccf2… | `0xccf2cb9b60ccdf063dde102ef69f441026f84fc368e00462964aa39f4048e806` | 0xc701…, 0xce59… | — |

### Selected Test Candidates

**Primary GateControl candidate:**
- **Gate:** `0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68`
- **OwnerCap:** `0xa107699ef73b9ed369dfb15dbebdaa2ab9f36da0b63616a2af94c0117906f80a`
- **Rationale:** Co-located at Node 0x8bad… with the ONLINE SSU — allows testing both GateControl and TradePost at the same location

**Secondary GateControl candidate:**
- **Gate:** `0x34fae853ecf459e8071fa7bf57211b501117b77efba1821240f62891eb9ffbb8`
- **OwnerCap:** `0xe0c2f8e19f314b8a809ec90c17dca9a01f59a9539d690e5fde4ec420f5532233`

**TradePost candidate:**
- **SSU:** `0x73a260bd3de57c46d390a18abe797dc1d24a166c383e871e2abc46ba996bf121`
- **OwnerCap:** `0x3865b72888b59d05d18fda3bf590afe4e04d7721bb989cd59f30e4e0a3d36e6d`
- **Status:** ONLINE, 5 items in inventory, co-located with primary gate candidate

**Character (for both flows):**
- **Character:** `0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110`
- **OwnerCap:** `0xbcab2c0f6266d5af8d09d70dfa7ec7783a848cebbb5e92c2b8b534f3dd83c309`

### Next Actions (Hour 5+ Integration)

1. **Authorize GateControl extension on primary gate:**
   ```
   gate::authorize_extension<GateAuth>(gate=0xf130…, owner_cap=0xa107…)
   ```
   Requires PTB with Character + OwnerCap Receiving pattern (`borrow_owner_cap` / `return_owner_cap`)

2. **Authorize TradePost extension on primary SSU:**
   ```
   storage_unit::authorize_extension<TradeAuth>(ssu=0x73a2…, owner_cap=0x3865…)
   ```
   Same Receiving pattern

3. **Set a tribe rule** on the gate via `GateConfig` + `AdminCap`
4. **Create a test Listing** for one of the SSU's items
5. **End-to-end jump permit** flow on the authorized gate
6. **End-to-end trade** flow using the authorized SSU

### Manual Inputs Still Required

- **EVE Vault wallet signing:** The `borrow_owner_cap` → `authorize_extension` → `return_owner_cap` PTB must be signed by the wallet. The agent can build the PTB but the operator must sign.
- **In-game gate linking:** `linked_gate_id` is null on all gates. Gate linking happens in-game and may need to be done before jump testing (or may not be strictly required for extension authorization).

---

## Hour 5: Live Integration Execution — Utopia (2026-03-12)

**Publisher/Signer:** `0xacff13b0630890ac9de62c57ec542de7cad8778aec1fe24f9db19f2457ad54b1`
**Game Wallet:** `0xad0221857e57908707762a74b68e6f340b06a6e9f991c270ae9c06cf1a92fb71` (NOT in local keystore)
**Package:** `0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04`
**Method:** `sui client ptb` — direct CLI execution

### Signing Boundary

`character::borrow_owner_cap` requires `ctx.sender() == character.character_address` (`0xad02…`). That address is the game wallet, which is NOT in the local Sui keystore — only the publisher wallet (`0xacff…`) is available. Therefore:
- **Autonomous phases:** AdminCap-gated operations (tribe rules, config) and permissionless operations (create listing)
- **Manual phases:** OwnerCap-gated operations (authorize extensions) — require importing or signing with game wallet

### Phase 3: Set Tribe Rule — SUCCESS ✅

| Key | Value |
|-----|-------|
| Transaction | `DXGsGVq8rVeGzUJkcRRkxMW4NvuZjUPY6uhBR5SyKtiK` |
| Function | `gate_control::set_tribe_rule` |
| Gate | `0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68` |
| GateConfig | `0x8655eb39017766ef275ba0104819228bff90e25d997a38385f2eb4ddf65d45f2` |
| AdminCap | `0xaedc8ce4e44ed195d58ae12e433e1fa7fb9126403f930f2b41dbc3a0c8c09b3e` |
| Tribe | `1000167` (lacal's tribe) |
| DF Object Created | `0x620932ebce2fb83884ad12b1ce7d23fccde9ec22c66806711700f5d776e9c90a` |
| Verified On-Chain | TribeRuleKey DF on GateConfig → `{tribe: 1000167}` ✅ |

### Phase 4: Create TradePost Listing — SUCCESS ✅

| Key | Value |
|-----|-------|
| Transaction | `C3t5MJ5xtUsNyUe1B6nERFUYw2AHja4EbyNjQFNFMcJZ` |
| Functions | `trade_post::create_listing` → `trade_post::share_listing` (chained PTB) |
| SSU | `0x73a260bd3de57c46d390a18abe797dc1d24a166c383e871e2abc46ba996bf121` |
| Listing | `0x5b7da28f2ee1562a32c574702c057fa81be584457b697dd198d2a1c11783f2b5` (shared) |
| Item Type | 78437 |
| Quantity | 1 |
| Price | 1000 MIST |
| Seller | `0xacff13b0630890ac9de62c57ec542de7cad8778aec1fe24f9db19f2457ad54b1` |
| Event | `ListingCreatedEvent` emitted ✅ |
| Verified On-Chain | Listing is shared object of type `trade_post::Listing` ✅ |

### Phase 5: Post-State Verification ✅

| Object | Field | Value |
|--------|-------|-------|
| Gate `0xf130…` | extension | `null` (auth pending — needs game wallet) |
| Gate `0xf130…` | status | OFFLINE |
| SSU `0x73a2…` | extension | `null` (auth pending — needs game wallet) |
| SSU `0x73a2…` | status | ONLINE |
| GateConfig | TribeRule DF | tribe=1000167 on gate `0xf130…` ✅ |
| Listing `0x5b7d…` | shared object | item=78437, qty=1, price=1000 ✅ |

### Phases 1-2: Extension Authorization — PREPARED (Manual Boundary)

Both commands require the game wallet `0xad02…` to sign. Import key or sign via EVE Vault.

**Phase 1 — Authorize GateAuth on Gate:**
```bash
sui client ptb \
  --move-call "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::character::borrow_owner_cap<0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::gate::Gate>" \
    @0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110 \
    @0xa107699ef73b9ed369dfb15dbebdaa2ab9f36da0b63616a2af94c0117906f80a \
  --assign cap_receipt \
  --move-call "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::gate::authorize_extension<0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04::gate_control::GateAuth>" \
    @0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68 \
    cap_receipt.0 \
  --move-call "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::character::return_owner_cap<0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::gate::Gate>" \
    @0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110 \
    cap_receipt.0 cap_receipt.1 \
  --gas-budget 10000000
```

**Phase 2 — Authorize TradeAuth on SSU:**
```bash
sui client ptb \
  --move-call "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::character::borrow_owner_cap<0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::storage_unit::StorageUnit>" \
    @0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110 \
    @0x3865b72888b59d05d18fda3bf590afe4e04d7721bb989cd59f30e4e0a3d36e6d \
  --assign cap_receipt \
  --move-call "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::storage_unit::authorize_extension<0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04::trade_post::TradeAuth>" \
    @0x73a260bd3de57c46d390a18abe797dc1d24a166c383e871e2abc46ba996bf121 \
    cap_receipt.0 \
  --move-call "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::character::return_owner_cap<0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75::storage_unit::StorageUnit>" \
    @0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110 \
    cap_receipt.0 cap_receipt.1 \
  --gas-budget 10000000
```

### Transaction Log

| Phase | Action | TX Digest | Status |
|-------|--------|-----------|--------|
| 3 | `set_tribe_rule(gate=0xf130…, tribe=1000167)` | `DXGsGVq8rVeGzUJkcRRkxMW4NvuZjUPY6uhBR5SyKtiK` | ✅ Success |
| 4 | `create_listing(ssu=0x73a2…, item=78437, qty=1, price=1000)` + `share_listing` | `C3t5MJ5xtUsNyUe1B6nERFUYw2AHja4EbyNjQFNFMcJZ` | ✅ Success |
| 1 | Authorize `GateAuth` on gate `0xf130…` | — | ⏸️ Prepared (needs game wallet) |
| 2 | Authorize `TradeAuth` on SSU `0x73a2…` | — | ⏸️ Prepared (needs game wallet) |

### What Was Proved

1. **GateControl config writes work on Utopia.** `set_tribe_rule` creates a persistent DF on the shared `GateConfig`, keyed by gate ID. The published package correctly creates and stores `TribeRule{tribe: 1000167}` for a real Utopia gate.
2. **TradePost listing creation works on Utopia.** The 2-step PTB (`create_listing` → `share_listing`) produces a shared `Listing` object with correct fields (item, quantity, price, seller, SSU reference) and emits a `ListingCreatedEvent`.
3. **The package has live state on Utopia.** Both the CC-owned `GateConfig` and the new `Listing` object are live, verified, and readable on the Utopia testnet.

### What Remains (from Phase 3-4)

~~1. **Import game wallet** (or use EVE Vault signing) to execute Phases 1-2 (extension authorization).~~ **DONE** — see Hour 5 Phase 2 below.
2. **End-to-end jump permit flow** — gate is OFFLINE with no linked destination. Requires admin `link_gates` + game activation. **Manual / in-game step.**
3. **End-to-end trade flow** — `buy` requires a second identity (buyer ≠ seller). **Manual step with second wallet.**
- **Power status:** All gates are OFFLINE. The SSU is ONLINE.

---

## Hour 5 Phase 2: Extension Authorization — Utopia (2026-03-13)

### Context

Phases 1-2 (authorize GateAuth + TradeAuth) were blocked in Phase 3-4 because the game wallet (`0xad02…fb71`) — which holds the Character OwnerCap — is not in the local CLI keystore. A browser auth harness using EVE Vault (`@evefrontier/dapp-kit`) was built to sign these transactions via the in-game wallet.

**JWT nonce mismatch** was encountered and resolved (full root cause in `docs/decision-log.md`). After Vault re-auth, both authorization transactions succeeded.

### Transaction Log

| Phase | Action | TX Digest | Status | Epoch |
|-------|--------|-----------|--------|-------|
| 1 | Authorize `GateAuth` extension on gate `0xf130…1b68` | `6uYvFUmYa1JRobV6HW1Cup9tG2k2zGfw8YwxAg2XBnv9` | ✅ Success | 1040 |
| 2 | Authorize `TradeAuth` extension on SSU `0x73a2…f121` | `5j5xU7Fx3xrLhC9Vi3YGY8gNqVxifCaCkBQd6JjXBUeu` | ✅ Success | 1040 |

**Sender:** `0xad0221857e57908707762a74b68e6f340b06a6e9f991c270ae9c06cf1a92fb71` (game wallet via EVE Vault)

### Post-Authorization Verified State

| Object | Key Field | Value |
|--------|-----------|-------|
| Gate `0xf130…1b68` | `extension` | `b41a7ce1…::gate_control::GateAuth` ✅ |
| Gate `0xf130…1b68` | `status` | ONLINE (updated Phase 4) |
| Gate `0xf130…1b68` | `linked_gate_id` | `0xb700…f220` (updated Phase 4) |
| SSU `0x73a2…f121` | `extension` | `b41a7ce1…::trade_post::TradeAuth` ✅ |
| SSU `0x73a2…f121` | `status` | ONLINE |
| SSU `0x73a2…f121` | `inventory_keys` | 2 entries (main + open) |
| GateConfig `0x8655…45f2` | Dynamic field | TribeRuleKey(gate=0xf130…) → TribeRule { tribe: 1000167 } ✅ |
| Listing `0x5b7d…f2b5` | All fields | item=78437, qty=1, price=1000, seller=0xacff…54b1, ssu=0x73a2… ✅ |

---

## Hour 5 Phase 3: cancel_listing Proof — Utopia (2026-03-13)

### Purpose

Prove the `cancel_listing` flow end-to-end on live Utopia: sender check (seller only), listing destruction, `ListingCancelledEvent` emission, and storage rebate return.

### Execution

```bash
sui client call \
  --package 0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04 \
  --module trade_post --function cancel_listing \
  --args 0x5b7da28f2ee1562a32c574702c057fa81be584457b697dd198d2a1c11783f2b5 \
  --gas-budget 50000000
```

### Transaction Log

| Action | TX Digest | Status | Epoch |
|--------|-----------|--------|-------|
| `cancel_listing(listing=0x5b7d…f2b5)` | `E5791FGSn3VPWYgU9BtMagstQewkm7FgKArJk2q42R3Q` | ✅ Success | 1040 |

**Sender:** `0xacff13b0630890ac9de62c57ec542de7cad8778aec1fe24f9db19f2457ad54b1` (CLI publisher = listing seller)

### Proof Points

1. **Listing `0x5b7d…f2b5` deleted on-chain** — confirmed in `effects.deleted[]`
2. **`ListingCancelledEvent` emitted** — `listing_id=0x5b7d…f2b5`, `seller=0xacff…54b1`, `item_type_id=78437`
3. **Storage rebate returned** — net balance change: +931,312 MIST
4. **Sender check enforced** — only the original seller address could call this function

### Demo State Restoration

After the cancel proof, the listing was re-created to restore clean demo state:

| Action | TX Digest | Status | New Listing ID |
|--------|-----------|--------|----------------|
| `create_listing` + `share_listing` (PTB) | `TWQZdJC2Wfx9ywcQM1pjozQh7W2WGu3w4xWjgfL3eL4` | ✅ Success | `0x6b96b2570d4ca5097fa2ba3678ccafe7f7464ade555ca0598b1b7d7cb4efb591` |

New listing verified: item=78437, qty=1, price=1000, seller=0xacff…54b1, ssu=0x73a2…f121.

---

## Hour 5 Summary: What Has Been Proved

### GateControl ✅ (max provable without game-server extension invocation)

| Proof | Status | Evidence |
|-------|--------|----------|
| Package published | ✅ | TX `EBU5T9c…` |
| GateAuth extension authorized on live gate | ✅ | TX `6uYvFUm…` → gate.extension = GateAuth |
| Tribe rule set (tribe 1000167) | ✅ | TX `DXGsGVq…` → GateConfig DF verified |
| Gate ONLINE + bidirectionally linked | ✅ | `0xf130…` ↔ `0xb700…`, both ONLINE |
| Manual jump confirmed | ✅ | Operator jumped through linked gate pair in-game |
| Extension logic (unit tests) | ✅ | 11/11 tests pass (tribe check, toll, wrong-tribe abort) |
| Wrong-tribe abort | ⚠️ Unit-tested | Requires different-tribe character for live proof |
| Coin toll flow | ⚠️ Not configured | Tribe rule set; toll can be added via `set_coin_toll` |

### TradePost ✅ (6/6 flows proved)

| Proof | Status | Evidence |
|-------|--------|----------|
| Package published | ✅ | TX `EBU5T9c…` |
| TradeAuth extension authorized on live SSU | ✅ | TX `5j5xU7F…` → ssu.extension = TradeAuth |
| Listing created (create + share) | ✅ | TX `C3t5MJ5…` → shared Listing with correct fields |
| Listing cancelled (seller-only) | ✅ | TX `E5791FG…` → listing deleted + event emitted |
| Buy flow (buyer ≠ seller) | ✅ | TX `C8rWTqz…` + 2 more → Item transferred, payment to seller |
| Event indexing | ✅ | All 3 event types indexed via `suix_queryEvents` |

### What Remains (Manual / In-Game Steps)

1. ~~**GateControl jump permit E2E:** Requires admin to `link_gates(gate_a, gate_b)` and the game to set gate status to ONLINE.~~ **Gates now ONLINE + bidirectionally linked** — see Phase 4 below. Manual jump confirmed by operator.
2. ~~**TradePost buy E2E:** Requires a second wallet (buyer ≠ seller) with SUI balance.~~ **PROVEN** — see Phase 4 below.
3. **Event indexing:** Verified via `suix_queryEvents` — `ListingCreatedEvent`, `ListingPurchasedEvent`, `ListingCancelledEvent` all indexed and queryable. ✅

---

## Hour 5 Phase 4: Buy Proof + Gate Status Refresh — Utopia (2026-03-14)

### Context

Gates became ONLINE + bidirectionally linked via in-game action. Operator confirmed manual jump through gate pair. A second CLI identity (clever-hematite `0x0d6f…a01f`, ~15 SUI) was used as buyer for TradePost E2E.

### Refreshed On-Chain State

| Object | Key Field | Previous | Current |
|--------|-----------|----------|---------|
| Gate `0xf130…1b68` | status | OFFLINE | **ONLINE** ✅ |
| Gate `0xf130…1b68` | linked_gate_id | null | `0xb700…f220` ✅ |
| Linked Gate `0xb700…f220` | linked_gate_id | (unknown) | `0xf130…1b68` (bidirectional) ✅ |
| SSU `0x73a2…f121` | status | ONLINE | ONLINE ✅ |
| GateConfig `0x8655…45f2` | TribeRuleKey DF | tribe=1000167 | tribe=1000167 ✅ |

### GateControl Evidence Update

- Gate `0xf130…` is now **ONLINE** with extension=GateAuth and linked destination `0xb700…`
- Bidirectional link confirmed (`0xb700…` links back to `0xf130…`)
- Tribe rule (1000167) still active on GateConfig
- **Operator confirmed manual jump** through the linked gate pair in-game
- Extension invocation during jump depends on game server calling `check_extension_for_gate_activation_v2`; 11/11 unit tests cover all logic paths
- This is the **strongest achievable GateControl evidence** for hackathon scope

### Buy Proof — SUCCESS ✅ (3 Transactions)

**Buyer:** `0x0d6fa6c31dba20dd18a828c08c46ca20f81d96bf24180fb64dfdceb474aca01f` (clever-hematite)
**Seller:** `0xacff13b0630890ac9de62c57ec542de7cad8778aec1fe24f9db19f2457ad54b1` (jolly-plasma)
**Character (shared ref):** `0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110`

| # | TX Digest | Listing | Price | Item Received | Owner |
|---|-----------|---------|-------|---------------|-------|
| 1 | `4Hw21nVU7TTAu8YiQqxGnacXFMrwUy47Hx9eKLH8BUpN` | `0x6b96…b591` | 1000 MIST | `0x0c63…e65d` | clever-hematite ✅ |
| 2 | `8kjALbrsAyzaJKe3pqHVoJk6qeEwgzcwsGNARbsTpTuK` | `0x9604…af3a` | 1000 MIST | `0x7c81…7244` | clever-hematite ✅ |
| 3 | `C8rWTqz81uy1VbYA2Zg13RrHcfLUw6hsLp3YXvaHAJ7v` | `0xbae2…6660` | 10 SUI | `0x28d4…9d05` | clever-hematite ✅ |

**Primary proof TX (strongest):** `C8rWTqz81uy1VbYA2Zg13RrHcfLUw6hsLp3YXvaHAJ7v`
- PTB: `SplitCoins(gas, 10_000_000_000)` → `buy(ssu, character, listing, payment)` → `TransferObjects(item, buyer)`
- Item `0x28d4…9d05`: type=`inventory::Item`, type_id=78437, parent_id=SSU `0x73a2…`, owned by buyer
- Payment `0x6331…14c3`: 10 SUI Coin, transferred to seller `0xacff…54b1`
- `ListingPurchasedEvent` emitted and indexed on-chain

### Proof Points

1. **Buyer ≠ Seller** — clever-hematite (`0x0d6f…`) purchased from jolly-plasma (`0xacff…`) ✅
2. **Item transferred to buyer** — `inventory::Item` objects owned by buyer address ✅
3. **Payment transferred to seller** — Coin objects created for seller ✅
4. **`ListingPurchasedEvent` emitted** — all 3 purchases indexed via `suix_queryEvents` ✅
5. **Listing consumed** — shared Listing objects destroyed on purchase ✅
6. **Character ref is permissionless** — Character is shared; any wallet can reference it for buy ✅

### Demo State After Phase 4

- **4 live listings remain** on SSU `0x73a2…` (from earlier create operations)
- **3 Items** now owned by clever-hematite (from purchases)
- **Gate pair** ONLINE + bidirectionally linked + GateAuth authorized + tribe rule active
