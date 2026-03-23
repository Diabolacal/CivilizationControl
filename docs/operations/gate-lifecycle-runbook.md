# Gate Lifecycle Runbook — Local Sui Devnet

**Retention:** Carry-forward

Complete step-by-step procedure to reproduce the full EVE Frontier gate lifecycle on a local Sui devnet using `world-contracts`. Validated 2026-02-16 against Sui CLI v1.65.2.

---

## Prerequisites

| Component | Version | Notes |
|---|---|---|
| Docker | ≥28.x | With Docker Compose v2 |
| Sui CLI | 1.65.2 | Inside `sui-docker:latest` container |
| Node.js | ≥20 | Inside container, for proof generation |
| `@noble/hashes` | 2.x | ESM-only, installed at `/tmp/node_modules` |
| `world-contracts` | latest | Mounted read-only at `/workspace/world-contracts` |

## Sponsored Tx Smoke Test (15 seconds)

Run this immediately after registering a sponsor address in AdminACL (Step 3a/3c) to verify sponsored transactions work before proceeding to fuel deposit or jump steps.

```bash
# Sender = ADMIN, Sponsor = PLAYER_A (must be different addresses)
sui client ptb \
  --move-call ${WORLD_PKG}::access::verify_sponsor \
    "@${ADMIN_ACL}" \
  --gas-budget 100000000 \
  --gas-sponsor "@${PLAYER_A_ADDR}" \
  --json
```

**Expected success:** Transaction status `"success"`. The `verify_sponsor` function checks that `ctx.sponsor()` is present and registered in `AdminACL.authorized_sponsors`.

**Most common failure:** `MoveAbort` in `verify_sponsor` — causes:
- Sponsor address not registered in AdminACL (re-run Step 3a/3c)
- Sender not in AdminACL and no separate sponsor — `verify_sponsor` falls back to `ctx.sender()` when no sponsor is present; the resolved address must exist in `AdminACL.authorized_sponsors`
- Used `sui client call` instead of `sui client ptb` (only PTB supports `--gas-sponsor`)

---

## Key Discoveries & Gotchas

These are critical findings from the rehearsal. **Read before executing.**

### PTB Syntax (sui client ptb)
- Type parameters use **inline angle brackets**: `--move-call pkg::mod::func<pkg::mod::Type>` — `--type-args` does NOT exist for PTB
- `vector<u8>` must use `"vector[0xHH,0xHH,...]"` literal format, NOT `0xHEXSTRING`
- Assign destructured results with `--assign varname`, access with `varname.0`, `varname.1`

### Sponsored Transactions
- `--gas-sponsor "@0xADDR"` (note the `@` prefix)
- **`verify_sponsor` has sender fallback.** When sender == gas payer, `ctx.sponsor()` returns `None` and `verify_sponsor` falls back to `ctx.sender()`. If the sender's address is in AdminACL, a non-sponsored transaction succeeds. A dedicated sponsor address is recommended for CLI testing clarity
- Sponsor address must be registered in AdminACL via `access::add_access`

### Object Abilities
- `Character`, `NetworkNode`, `Gate` have only `key` ability (no `store`/`drop`)
- Must use PTB with explicit `share_object` after creation — `sui client call` can't auto-handle return values
- OwnerCaps use the Receiving pattern: `borrow_owner_cap<T>` → use → `return_owner_cap<T>`

### Move Publishing
- World package uses `edition = "2024.beta"` — publish with `sui client test-publish --build-env local`
- Extension packages need `[environments]` section with chain-id: `local = "<chain-id>"`
- Extension's `Pub.local.toml` must reference already-published dependencies
- Delete stale `Pub.local.toml` and `Move.lock` before re-publishing

### Distance Proofs
- `verify_distance` does NOT check deadline (unlike `verify_proximity`)
- Signature: `digest = blake2b256(0x030000 || bcs_message_bytes)`, then Ed25519 sign
- Proof format: `[0x00 flag] + [64-byte sig] + [32-byte pubkey]` = 97 bytes total
- BCS message: `player_address(32) + target_location_hash(32) + distance(u64 LE) + deadline(u64 LE)`

### Fuel & Energy
- Fuel capacity check: `unit_volume × quantity ≤ max_capacity`
- NWN must have fuel deposited AND be online before gates can go online
- `deposit_fuel` requires sponsored transaction

### Single Extension Constraint
- Each gate, SSU, and turret supports **exactly one** extension type at a time (`extension: Option<TypeName>`)
- Calling `authorize_extension<NewAuth>()` **replaces** any previously authorized extension (via `swap_or_fill`)
- **v0.0.19:** `revoke_extension_authorization()` now exists — clears the extension slot entirely (restores default behavior). Blocked after `freeze_extension_config`. CivilizationControl does not currently use revocation.
- Extension identity uses `type_name::with_defining_ids<Auth>()` — includes the **defining package ID**, making it stable across upgrades but package-specific
- **Design consequence:** All rule types (tribe filter, coin toll, ZK proof, time window) must be composed within a single extension package sharing one `Auth` witness type. Multiple extensions on the same gate/SSU/turret are not possible.
- Verified in source: `gate.move` L73 (`extension: Option<TypeName>`), `storage_unit.move` L67, `turret.move` (same pattern), `gate.move` L117 (`swap_or_fill`)

> **v0.0.18 update:** `authorize_extension` now checks a freeze guard (`EExtensionFrozen`). If an assembly owner has frozen the extension slot, re-authorization will abort. This does not affect initial authorization in this runbook but matters for extension replacement scenarios.

---

## Environment Setup

### 1. Start Docker Container

```bash
docker compose -f vendor/builder-scaffold/docker/compose.yml run -d --rm \
  --name sui-rehearsal \
  -v "$(pwd)/vendor/world-contracts/contracts:/workspace/world-contracts" \
  -v "$(pwd)/sandbox/validation:/workspace/sandbox" \
  -v "$(pwd)/notes:/workspace/notes" \
  sui-local tail -f /dev/null
```

### 2. Create Funded Accounts

```bash
docker exec sui-rehearsal bash -c '
  # Three accounts: ADMIN (active), PLAYER_A, PLAYER_B
  sui client envs  # verify local devnet
  sui client active-address  # ADMIN address

  # Create additional accounts
  sui client new-address ed25519  # PLAYER_A
  sui client new-address ed25519  # PLAYER_B

  # Fund all via faucet (local devnet auto-funds)
  sui client faucet --address <PLAYER_A>
  sui client faucet --address <PLAYER_B>
'
```

### 3. Install Node.js Dependencies

```bash
docker exec sui-rehearsal bash -c '
  cd /tmp
  npm init -y
  npm install @noble/hashes@2 @noble/ed25519@2
'
```

---

## Lifecycle Steps

### Step 1: Publish World Package

```bash
cd /workspace/world-contracts/world
rm -f Pub.local.toml Move.lock  # Clean stale files
sui client test-publish --build-env local --gas-budget 500000000 --json
```

**Outputs:** `WORLD_PKG`, `GOVERNOR_CAP`, `ADMIN_ACL`, `SERVER_REGISTRY`, `OBJECT_REGISTRY`, `GATE_CONFIG`, `FUEL_CONFIG`, `ENERGY_CONFIG`

### Step 2: Create AdminCap

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module access \
  --function create_admin_cap \
  --args ${GOVERNOR_CAP} \
  --gas-budget 100000000 --json
```

**Output:** `ADMIN_CAP`

### Step 3a: Register ADMIN as Sponsor

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module access \
  --function add_access \
  --args ${ADMIN_ACL} ${ADMIN_CAP} "@${ADMIN_ADDR}" \
  --gas-budget 100000000 --json
```

### Step 3b: Register Server Address

Generate server address from a test private key:
```bash
# Using derive_server_address.mjs
cd /tmp && node /workspace/sandbox/derive_server_address.mjs ${SERVER_PRIVKEY}
```

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module server \
  --function register \
  --args ${SERVER_REGISTRY} ${ADMIN_CAP} "@${SERVER_ADDR}" \
  --gas-budget 100000000 --json
```

### Step 3c: Register PLAYER_A as Sponsor

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module access \
  --function add_access \
  --args ${ADMIN_ACL} ${ADMIN_CAP} "@${PLAYER_A_ADDR}" \
  --gas-budget 100000000 --json
```

### Step 4a: Set Fuel Efficiency

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module fuel \
  --function set_fuel_efficiency \
  --args ${FUEL_CONFIG} ${ADMIN_CAP} 1 100 \
  --gas-budget 100000000 --json
```

### Step 4b: Set Energy Config

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module energy \
  --function set_energy_config \
  --args ${ENERGY_CONFIG} ${ADMIN_CAP} 8888 50 \
  --gas-budget 100000000 --json
```

**Note:** `8888` is the Gate type ID, `50` is energy per gate.

### Step 4c: Set Gate Max Distance

```bash
sui client call \
  --package ${WORLD_PKG} \
  --module gate \
  --function set_max_distance \
  --args ${GATE_CONFIG} ${ADMIN_CAP} 8888 1000000000 \
  --gas-budget 100000000 --json
```

### Step 5: Create & Share Character (PTB)

Character has only `key` ability — must use PTB:

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::character::create_character \
    1 "vector[0x41,0x42]" 0 \
  --assign char \
  --move-call ${WORLD_PKG}::character::share_character char.0 \
  --gas-budget 100000000 --json
```

**Outputs:** `CHARACTER_ID`, `CHAR_OWNER_CAP` (transferred to sender)

### Step 6: Create & Share NetworkNode (PTB)

NetworkNode also has only `key` ability:

```bash
# Location hash as vector<u8> — 32 bytes
LOCATION_VEC="vector[0x16,0x21,0x7d,...]"  # SHA-256 of location data

sui client ptb \
  --move-call ${WORLD_PKG}::network_node::anchor \
    "@${CHARACTER_ID}" 111000 "vector[0x01]" ${LOCATION_VEC} 1000000 \
  --assign nwn \
  --move-call ${WORLD_PKG}::network_node::share_network_node nwn \
  --gas-budget 100000000 --json
```

**Outputs:** `NWN_ID`, `NWN_OWNER_CAP` (sent to Character as Receiving object)

### Step 6b: Deposit Fuel (Sponsored)

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::network_node::deposit_fuel \
    "@${NWN_ID}" "@${FUEL_CONFIG}" "@${ADMIN_ACL}" 1 1 100000 \
  --gas-budget 100000000 \
  --gas-sponsor "@${PLAYER_A_ADDR}" \
  --json
```

**Critical:** `unit_volume(1) × quantity(100000) ≤ max_capacity(1000000)` must hold.

### Step 7: NetworkNode Online (PTB + OwnerCap)

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::character::borrow_owner_cap<${WORLD_PKG}::network_node::NetworkNode> \
    "@${CHARACTER_ID}" "@${NWN_OWNER_CAP}" \
  --assign borrow \
  --move-call ${WORLD_PKG}::network_node::online \
    "@${NWN_ID}" "@${FUEL_CONFIG}" "@${ENERGY_CONFIG}" borrow.0 \
  --move-call ${WORLD_PKG}::character::return_owner_cap<${WORLD_PKG}::network_node::NetworkNode> \
    "@${CHARACTER_ID}" borrow.0 borrow.1 \
  --gas-budget 100000000 --json
```

### Step 8: Anchor & Share Two Gates (PTB)

Repeat twice (Gate A and Gate B) with matching location hash:

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::gate::anchor \
    "@${CHARACTER_ID}" "@${NWN_ID}" 8888 "vector[0x01]" ${LOCATION_VEC} \
  --assign g \
  --move-call ${WORLD_PKG}::gate::share_gate g \
  --gas-budget 100000000 --json
```

**Outputs per gate:** `GATE_ID`, `GATE_CAP` (sent to Character)

### Step 9: Link Gates (Distance Proof)

Generate BCS-serialized distance proof:

```bash
cd /tmp && node /workspace/sandbox/generate_distance_proof.mjs \
  --server-privkey ${SERVER_PRIVKEY} \
  --player-address ${ADMIN_ADDR} \
  --gate-location-hash ${LOCATION_HASH} \
  --distance 0 \
  --deadline-ms 9999999999999
```

Execute link with dual OwnerCap borrow:

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::character::borrow_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" "@${GATE_A_CAP}" \
  --assign ba \
  --move-call ${WORLD_PKG}::character::borrow_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" "@${GATE_B_CAP}" \
  --assign bb \
  --move-call ${WORLD_PKG}::gate::link_gates \
    "@${GATE_A}" "@${GATE_B}" "@${SERVER_REGISTRY}" "@${GATE_CONFIG}" \
    "vector[${PROOF_BYTES}]" ba.0 bb.0 \
  --move-call ${WORLD_PKG}::character::return_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" ba.0 ba.1 \
  --move-call ${WORLD_PKG}::character::return_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" bb.0 bb.1 \
  --gas-budget 100000000 --json
```

### Step 10: Gates Online (PTB + OwnerCap)

Repeat for each gate:

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::character::borrow_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" "@${GATE_CAP}" \
  --assign b \
  --move-call ${WORLD_PKG}::gate::online \
    "@${GATE_ID}" "@${NWN_ID}" "@${ENERGY_CONFIG}" b.0 \
  --move-call ${WORLD_PKG}::character::return_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" b.0 b.1 \
  --gas-budget 100000000 --json
```

### Step 11: Publish Extension & Authorize

#### 11a: Create Test Extension Package

Minimal Move module with a witness type (`TestAuth has drop`) and `issue_permit` function that calls `gate::issue_jump_permit<TestAuth>`.

**Move.toml:**
```toml
[package]
name = "test_extension"
edition = "2024"

[dependencies]
world = { local = "/workspace/world-contracts/world" }

[environments]
local = "<chain-id>"
```

**Pub.local.toml** (reference already-published World dependency):
```toml
build-env = "local"
chain-id = "<chain-id>"

[[published]]
source = { local = "/workspace/world-contracts/world" }
published-at = "<WORLD_PKG>"
original-id = "<WORLD_PKG>"
version = 1
toolchain-version = "1.65.2"
build-config = { flavor = "sui", edition = "2024" }
upgrade-capability = "<world-upgrade-cap>"
```

#### 11b: Publish

```bash
cd /path/to/test_extension
sui client test-publish --build-env local --gas-budget 500000000 --json
```

**Outputs:** `EXT_PKG`, `ExtAdminCap`, `TestGateRules`

#### 11c-d: Authorize on Both Gates

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::character::borrow_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" "@${GATE_CAP}" \
  --assign b \
  --move-call ${WORLD_PKG}::gate::authorize_extension<${EXT_PKG}::test_gate_ext::TestAuth> \
    "@${GATE_ID}" b.0 \
  --move-call ${WORLD_PKG}::character::return_owner_cap<${WORLD_PKG}::gate::Gate> \
    "@${CHARACTER_ID}" b.0 b.1 \
  --gas-budget 100000000 --json
```

**Critical:** Must authorize on **both** source and destination gates with the same `Auth` type.

### Step 12: Issue Jump Permit

```bash
sui client ptb \
  --move-call ${EXT_PKG}::test_gate_ext::issue_permit \
    "@${GATE_A}" "@${GATE_B}" "@${CHARACTER_ID}" "@${EXT_ADMIN_CAP}" "@0x6" \
  --gas-budget 100000000 --json
```

**Output:** `JumpPermit` (transferred to character's address, single-use)

### Step 13: Jump With Permit (Sponsored)

```bash
sui client ptb \
  --move-call ${WORLD_PKG}::gate::jump_with_permit \
    "@${GATE_A}" "@${GATE_B}" "@${CHARACTER_ID}" "@${PERMIT_ID}" "@${ADMIN_ACL}" "@0x6" \
  --gas-budget 100000000 \
  --gas-sponsor "@${PLAYER_A_ADDR}" \
  --json
```

**Critical:** JumpPermit is **consumed** (deleted) — single use only.

---

## Evidence — Rehearsal Run (2026-02-16)

### Object IDs

| Object | ID |
|---|---|
| WORLD_PKG | `0x060633cec8d5e74b2d518f364aef87d4adf4cd87e3e6b9f712d15f0c996386f1` |
| GOVERNOR_CAP | `0xf8e599b2dfa05df8235bb13da150ccaea28e24b3b80504c7d2774a513b164bfd` |
| ADMIN_CAP | `0x5f72ed01230a904bf76497ae97a5ea58b2411a7e7ba84b5552990c8e12954559` |
| ADMIN_ACL | `0x1e83339450703266605be88b25e16421fde63c25adc370bd3169ee673fdf4429` |
| SERVER_REGISTRY | `0x7df06997b37c8d2393d75090c8c5b1fcf122bc6d8d72690a9684341cb03d2168` |
| OBJECT_REGISTRY | `0x56a5c94eb14c9187fc47d0ee70261c6802fea7e8f8e6d13ebb4be23755b9bad3` |
| GATE_CONFIG | `0xf6d5052d02fbe95d30047351fc2caf3552ef0c0ba2a3bda7d056b4e7c0c30489` |
| FUEL_CONFIG | `0xa0427a1015e24a0c15d373ae3ce8e832fdf0afd3a9a4b376662625eed5085fe0` |
| ENERGY_CONFIG | `0x4b889dc5dac92e1b2b8fba4451d589782de914d040138e7728d08fcfab6661b0` |
| CHARACTER | `0x37c8b4e4dd0cdf7c6dd88f9b75d799ce38bcc1b3b410e9838c183e5e744034b9` |
| CHAR_OWNER_CAP | `0xad0f540f4b751949dd3d03fe6214116b2931e148b3a0237f9e7b797257191679` |
| NETWORK_NODE | `0xb045ce813b60f21ccc97efda39668b8b00315aa0b7f500adbab191e771dfc19c` |
| NWN_OWNER_CAP | `0x1a5e8ff78244f0586dac24075b914fe6b90a7ffd0f8b5476a1b1d8ba2eac20c7` |
| GATE_A | `0x620638f603dab2bffb2dc1d2b7bb3c53f2121ee6c2dd5c1385ff692792534aa0` |
| GATE_A_CAP | `0xb3cd16e364d22249096858b44dc8009ca7c4379d763b3d615f6d744eca8b4a00` |
| GATE_B | `0x09eeb540a1221fa60d654a9f64fdc59ade9c814de695969583e2a7b10628bb58` |
| GATE_B_CAP | `0x89183fcb02c940b2eac1a94aa099602d00882e11fa44ae31c82042b0d95b9a41` |
| EXT_PKG | `0x71edd82b91e4256472987b853cfab3ccf6c97a01d9e000a5abc0744984e7aa81` |
| EXT_ADMIN_CAP | `0x3ae6e6bf6e327c006ebaf4b03e94d2659d23647ccc57639ef334308edb5cb6d4` |
| JUMP_PERMIT | `0xc473eefcf5d30e222cdac1913f2e68c34fdb33ca56a750b049cb5120cef8c012` |

### Addresses

| Role | Address |
|---|---|
| ADMIN | `0x85483f9da07887da6024fdfbc22c1a0eb53475c70c7033aaca9ff06c13a688fe` |
| PLAYER_A | `0x075c99b3eedd7ae54e41b2e8ed61a5069c28742c381bf313b9a254c5ad07ee1c` |
| SERVER | `0x67a0e8949ab36b4f3e22af946c450cd4e292aba08edf3f637b786c9248da9142` |

### Transaction Digests

| Step | Description | Digest |
|---|---|---|
| 2 | Create AdminCap | `9vdm1doNEQBTQvWWDLBfTppphcac5ihSgdLUSEpprXAP` |
| 3b | Register server | `B4iFC1d9W6FvA43ir8oZheMHcp3JFrUvW2FgVh2zRGNi` |
| 3c | Add PLAYER_A sponsor | `HkUSyJKHLqN8ZGPPDreaRWz2dizJtCoGqwtDeyDsVjJJ` |
| 4a | Set fuel efficiency | `5azEsjaAzKnryCpjpLWbDs7Hf3nge1oV7fcSKpvyyVka` |
| 4b | Set energy config | `AxyYZdFMGftaTJSeLjg3jzDmQu5MwNo6qGTJpSbjkLR` |
| 4c | Set gate max distance | `FcpQcbV3vWTdx61YJbkxjvEAsV1w6gSYBeTKRwGdJHHg` |
| 5 | Create character | `7UopcnYn3GeinjnRVf1SUPjMBs9dZ6LDE9PrbKennKdz` |
| 6 | Create network node | `4pvPfPRh4GQEWHD3PmyvqthDajtC9CfPVTcwJGeKA4do` |
| 6b | Deposit fuel | `33zTDxabKm7KSTJxCH724YU2wCPjBW7RBUzVL8zTQ8EE` |
| 7 | NWN online | `Fo2Xc4covXmdrkpFKocitQeTx4jU6FsSjGWzb98mStK9` |
| 8a | Anchor Gate A | `G5gGJHJGHHo5gbkRnDTdCjRUyHFv1acoJk6dwZaeQa1x` |
| 8b | Anchor Gate B | `6qLHXKLm1yfnrchpEKrBzFw8LFM4gfenY412rKNygPJr` |
| 9 | Link gates | `3Jy29FmWrkoLQ7XdDdQyp48ZGW9BMvjqZqznSJS5Keoh` |
| 10a | Gate A online | `364sg3TzPJo93s8eeh4uRwwpsMMWhHJZwbrHKRQFUs8Y` |
| 10b | Gate B online | `QKDDuZKAaBB39HpF3z7mAdYHdQXzFJbv8xC9ax4UvQM` |
| 11b | Publish extension | `iAfR5E1hNHCnXbEEG7fenUsPyivQ44fchkpcRXpyXSF` |
| 11c | Auth ext Gate A | `2miDiePXprTSj1Hfso88fHnwTUrE8ZbgaTVCiRLHF75x` |
| 11d | Auth ext Gate B | `FPDV7Ur72fhEGfdVSi6kkTRyjntKfjidU23tcHYDZcS2` |
| 12 | Issue permit | `HTAR5Hmsj8LsFfzuunDJxNBEk2amHisCi95nzsMLetRa` |
| 13 | Jump with permit | `CzjEQmyRnKmUuCCLyEn8SmVVFogG4mmp6iZMPtvrXGs6` |

---

## Utility Scripts

All located in `sandbox/validation/`:

| Script | Purpose |
|---|---|
| `derive_server_address.mjs` | Derive Sui address from Ed25519 private key |
| `generate_distance_proof.mjs` | Generate BCS-serialized distance proof for `link_gates` |
| `extract_objects.py` | Parse sui client JSON output, list created objects |
| `parse_step.py` | Lighter object parser for step scripts |
| `step2.sh` – `step13.sh` | Individual lifecycle step scripts |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `MoveAbort(_, 3)` in gate/NWN | OwnerCap doesn't match object | Verify cap was received to Character, use correct cap ID |
| `MoveAbort(_, 5)` in gate | Gate not online | Execute Step 10 first |
| `MoveAbort(_, 8)` in gate | Gates not linked | Execute Step 9 first |
| `MoveAbort(_, 4)` in gate | Extension not authorized or wrong Auth type | Execute Step 11c/d, check EXT_PKG matches |
| `MoveAbort(_, 10)` in gate | JumpPermit expired | Increase expiry in extension's `issue_permit` |
| `verify_sponsor` fails | Missing or invalid sponsor | Ensure sponsor is in AdminACL and `--gas-sponsor` uses different address than sender |
| `fuel capacity exceeded` | `volume × qty > max_capacity` | Reduce quantity or increase max_capacity in anchor |
| `Pub.local.toml` stale | Previous publish left artifacts | Delete `Pub.local.toml` and `Move.lock` before re-publishing |
| Non-JSON output from publish | Build progress lines prefix JSON | Pipe through `python3 -c` to strip prefix (see step11.sh) |
