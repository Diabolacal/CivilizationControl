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
