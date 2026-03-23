# Working Memory — March 11 Foundation Sprint

**Date:** 2026-03-12 
**Task Name:** March 11 Foundation — GateControl + TradePost Move implementation
**Version:** 1
**Maintainer:** Agent + Operator
**Active Branch:** `feature/march11-foundation`
**Environment:** Utopia testnet (`https://fullnode.testnet.sui.io:443`)

## Objective

Implement the Move contract foundation for CivilizationControl (GateControl first, then TradePost) on branch `feature/march11-foundation`, following the March 11 reimplementation checklist as execution authority.

## Environment Baseline

All live environment IDs recorded in [`docs/operations/day1-validation.md`](../operations/day1-validation.md). Key references:

| Key | Value |
|-----|-------|
| World Package | `0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75` |
| AdminACL | `0xa8655c6721967e631d8fd157bc88f7943c5e1263335c4ab553247cd3177d4e86` |
| Gate Config | `0x69a392c514c4ca6d771d8aa8bf296d4d7a021e244e792eb6cd7a0c61047fc62b` |

## Progress

### Completed

- [x] Branch `feature/march11-foundation` created from `master`
- [x] **Hour 1 — GateControl foundation** (complete):
  - `Move.toml` updated: world dependency, `[environments]`, removed `[addresses]`
  - `gate_control.move` created: `GateAuth`, `GateConfig`, tribe rule, coin toll, permit issuance, admin CRUD, events, view functions
  - `gate_control_tests.move` created: 11 passing unit tests
  - `placeholder.move` deleted
  - `sui move build` PASS, `sui move test` 11/11 PASS
  - Decision log entry added
- [x] **Hour 7 — GateControl events** (partial — GateControl events shipped with Hour 1):
  - `TribeCheckPassedEvent`, `TollCollectedEvent`, `TribeRuleSetEvent`, `CoinTollSetEvent`, `RuleRemovedEvent`

### Next — Not Yet Started

- [ ] **Hour 3 — TradePost foundation**
  - `TradeAuth has drop {}` witness
  - `Listing` shared object
  - `create_listing`, `buy`, `cancel_listing`
  - Unit tests
  - Build + test pass
- [ ] **Hour 5 — Integration testing** on devnet/testnet
- [ ] **Hour 7 — TradePost events** (remaining)
- [ ] **Hour 8+ — Frontend** (awaiting Figma Make export)

## Commits on This Branch

| Hash | Message |
|------|---------|
| `d7d104e` | `feat: Add GateControl foundation with tribe filter and coin toll rules` |
| `d40347b` | `docs: Add GateControl foundation decision log entry` |

## Files Changed (vs master)

| File | Action |
|------|--------|
| `contracts/civilization_control/Move.toml` | Modified — world dep, environments, no addresses |
| `contracts/civilization_control/Move.lock` | Modified — regenerated |
| `contracts/civilization_control/sources/gate_control.move` | Created (+315 LoC) |
| `contracts/civilization_control/sources/placeholder.move` | Deleted |
| `contracts/civilization_control/tests/gate_control_tests.move` | Created (+215 LoC) |
| `docs/decision-log.md` | Updated — new entry |

## Key Decisions

See full details in [`docs/decision-log.md`](../decision-log.md) entry "2026-03-12 — GateControl Foundation Implementation".

Summary:
- **Package path:** Kept `contracts/civilization_control/` (checklist said `civcontrol/` — repo convention is canonical)
- **Config object:** Named `GateConfig` (not `CivControlConfig`) — single-responsibility; TradePost will get its own config if needed
- **Witness security:** `public(package)` mint, matching builder-scaffold convention
- **Permit issuance:** Permissionless (no AdminCap) — rules themselves are the access control
- **Per-gate rules:** Compound DF keys `{ gate_id: ID }` for tribe and toll, enabling independent per-gate configuration

## Build/Test Status

| Gate | Status |
|------|--------|
| `sui move build` | PASS |
| `sui move test` | PASS (21/21) |
| `npm run typecheck` | N/A (no frontend yet) |
| `npm run build` | N/A (no frontend yet) |

## Live Utopia State (Hour 5)

| Object | ID | Status |
|--------|----|--------|
| Package | `0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04` | Published |
| GateConfig (shared) | `0x8655eb39017766ef275ba0104819228bff90e25d997a38385f2eb4ddf65d45f2` | Live |
| AdminCap | `0xaedc8ce4e44ed195d58ae12e433e1fa7fb9126403f930f2b41dbc3a0c8c09b3e` | Publisher-owned |
| TradePostAdminCap | `0x1ffbb24485a838b562e815f34b9a965493e9d056a857264ad3e43b9dd7e3df06` | Publisher-owned |
| TribeRule DF | `0x620932ebce2fb83884ad12b1ce7d23fccde9ec22c66806711700f5d776e9c90a` | tribe=1000167 on gate 0xf130… |
| Listing | `0x5b7da28f2ee1562a32c574702c057fa81be584457b697dd198d2a1c11783f2b5` | Shared, item=78437, qty=1, price=1000 |

### Transaction Log

| Phase | TX Digest | Status |
|-------|-----------|--------|
| Publish | `EBU5T9cDymgUnyGTdtXkfBWuUmfWLKEMLJT5VXU8p5QU` | ✅ |
| set_tribe_rule | `DXGsGVq8rVeGzUJkcRRkxMW4NvuZjUPY6uhBR5SyKtiK` | ✅ |
| create_listing + share_listing | `C3t5MJ5xtUsNyUe1B6nERFUYw2AHja4EbyNjQFNFMcJZ` | ✅ |
| Authorize GateAuth | — | ⏸️ Needs game wallet |
| Authorize TradeAuth | — | ⏸️ Needs game wallet |

## Next Action

**Import game wallet** `0xad02…` into Sui keystore (or use EVE Vault) to execute the extension authorization PTBs documented in `docs/operations/day1-validation.md`. Then test end-to-end jump permit and trade flows on live Utopia.
