# World Runtime vs Original Split — 2026-04-29

## Goal

- make the frontend world package model explicit before any deliberate World v2 migration
- keep current live behavior unchanged by leaving both world constants on the existing Stillness world package
- let a future migration branch update runtime targets without reintroducing type-origin bugs in reads, event parsing, or type tags

## Constraints kept in place

- no world runtime value change
- no sponsor allowlist or worker wrangler package change
- no Move.toml or Move.lock dependency change
- no vendor edits
- no deploys

## Result

- `src/constants.ts` now exports `WORLD_RUNTIME_PACKAGE_ID` and `WORLD_ORIGINAL_PACKAGE_ID`
- both constants intentionally remain `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`
- `WORLD_PACKAGE_ID` remains only as a transitional compatibility alias to the runtime package
- runtime MoveCall targets now read from `WORLD_RUNTIME_PACKAGE_ID`
- world type strings, exact event type strings, `StructType` filters, and deterministic type tags now read from `WORLD_ORIGINAL_PACKAGE_ID`

## Surface classification applied

| Surface | Runtime package use | Original/type-origin use | Notes |
|---|---|---|---|
| `src/constants.ts` | `WORLD_RUNTIME_PACKAGE_ID` | `WORLD_ORIGINAL_PACKAGE_ID` | `WORLD_PACKAGE_ID` kept as compatibility alias only |
| `src/lib/gatePolicyTx.ts` | `character::borrow_owner_cap`, `character::return_owner_cap` targets | `Gate` type argument | separates owner-cap entrypoint package from `Gate` type origin |
| `src/lib/postureSwitchTx.ts` | `character::*` and `turret::authorize_extension` targets | `Gate` and `Turret` type strings | no behavior change because both IDs still match |
| `src/lib/structurePowerTx.ts` | `character::*`, `gate::*`, `storage_unit::*`, `turret::*`, `network_node::online` targets | assembly `typeStr` values and `NetworkNode` type | keeps type arguments pinned to original package lineage |
| `src/hooks/useAuthorizeExtension.ts` | world borrow/return, authorize, and metadata-update entrypoints | gate, storage-unit, and turret type strings | sponsor-flow builders stay on concrete runtime targets |
| `src/lib/suiReader.ts` | world `MoveModule` event queries for turret, gate, and storage unit | `PlayerProfile` `StructType` filter | `MoveModule` filters follow emitting module package semantics |
| `src/lib/eventParser.ts` | none | world exact event type strings | exact event types stay anchored to original defining package |
| `src/lib/objectResolver.ts` | none | `world::in_game_id::TenantItemId` type tag | deterministic object derivation must use the defining package |
| `scripts/check-world-mvr-drift.mjs` | validates/report frontend runtime package separately | validates/report frontend original package separately | future migration alarms can now distinguish the two surfaces |
| `scripts/validate-sponsor-policy.mjs` | validates frontend runtime constant against sponsor policy surfaces | validates frontend original constant against chain config | sponsor policy still only cares about runtime packages |

## Semantics to preserve in future migrations

- change `WORLD_RUNTIME_PACKAGE_ID` when a deliberate World v2 runtime migration is validated
- do not change `WORLD_ORIGINAL_PACKAGE_ID` unless the defining package lineage actually changes
- keep sponsor allowlists, worker config, and PTB targets aligned to the runtime package
- keep type strings, event type strings, dynamic-field key types, and deterministic type tags aligned to the original package

## Remaining follow-up

- a future World v2 migration branch should change runtime surfaces together: frontend runtime constants, sponsor allowlists, worker config, and validation expectations
- that later branch should also revalidate world `MoveModule` event queries against live upgraded Stillness behavior, even though they remain runtime/emitter-oriented in the current model