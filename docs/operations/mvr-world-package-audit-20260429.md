# MVR / World Package Audit — 2026-04-29

Status: planning/audit only. No runtime IDs, sponsor allowlists, Move manifests, vendor files, or deployments were changed in this task.

Scope:
- investigate how CivilizationControl should use Move Registry / MVR for `@evefrontier/world`
- compare that with the repo's current hardcoded Stillness package model
- analyze World v2 implications for frontend PTBs, sponsor policy, and Move dependencies
- recommend a safe adoption sequence without changing runtime behavior now

Non-goals:
- no World v2 runtime migration
- no runtime package-ID changes
- no sponsor allowlist changes
- no Move package dependency changes
- no Move publish or upgrade
- no deploys

## 1. Executive summary

- MVR gives CivilizationControl two new capabilities it does not use today: registry-backed latest-package resolution for `@evefrontier/world`, and named-package support in Move and TypeScript tooling.
- Public MVR and `vendor/world-contracts/contracts/world/Published.toml` currently agree that Stillness/Testnet world v2 is `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`, while the app and sponsor policy still target `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`.
- That mismatch does not justify an immediate swap. The repo still models world as one frontend constant, while sponsorship, event queries, object-type strings, and transaction builders remain concrete-ID based.
- Safest path: use MVR first for audit/validation, keep runtime config concrete and committed, explicitly model world runtime versus world original/type-origin IDs, then handle World v2 in a separate high-risk branch.
- Recommended first implementation slice: add a read-only MVR resolution/check script that compares `@evefrontier/world` against `config/chain/stillness.ts`, `src/constants.ts`, `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, and `scripts/validate-sponsor-policy.mjs`, then fails loudly on drift.

## 2. Current package-ID model in CivilizationControl

### Current values

| Surface | Meaning | Current value | Lives in | Notes |
|---|---|---|---|---|
| `WORLD_RUNTIME_PACKAGE_ID` | Frontend and config runtime world package | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `src/constants.ts`, `config/chain/stillness.ts` | Runtime entrypoints, sponsor allowlists, and emitter-sensitive queries follow this. |
| `WORLD_ORIGINAL_PACKAGE_ID` | Frontend and config original/type-origin world package | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `src/constants.ts`, `config/chain/stillness.ts` | Type strings, exact event types, `StructType` filters, and type tags follow this. |
| `WORLD_PACKAGE_ID` | Transitional frontend compatibility alias | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `src/constants.ts` | Alias to `WORLD_RUNTIME_PACKAGE_ID`; new code should not use it for new world surfaces. |
| `CC_PACKAGE_ID` | Current CC runtime package | `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` | `src/constants.ts`, `config/chain/stillness.ts`, `contracts/civilization_control/Published.toml` | Stillness v1 fresh publish. |
| `CC_ORIGINAL_PACKAGE_ID` | Current CC original/type-origin package | `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` | same as above | Equal to runtime because Stillness CC has not upgraded yet. |
| Sponsor allowlist world package | Worker-approved world package | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, `scripts/validate-sponsor-policy.mjs`, `workers/sponsor-service/src/__tests__/validation.test.ts` | Concrete ID only. |
| Sponsor allowlist CC package | Worker-approved CC package | `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` | same as above | Concrete ID only. |

### Where package IDs matter now

- PTB targets: `src/lib/gatePolicyTx.ts`, `src/lib/gatePermitTx.ts`, `src/lib/postureSwitchTx.ts`, `src/lib/structurePowerTx.ts`, `src/lib/tradePostTx.ts`, `src/lib/transitProofTx.ts`, `src/hooks/useAuthorizeExtension.ts`
- Read/query/event surfaces: `src/lib/suiReader.ts`, `src/lib/eventParser.ts`, `src/lib/objectResolver.ts`
- Sponsor enforcement: `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, `workers/sponsor-service/src/validation.ts`, `scripts/validate-sponsor-policy.mjs`
- Move dependencies: `contracts/civilization_control/Move.toml`, `contracts/civilization_control/Move.lock`

### Runtime IDs versus original/type-origin IDs

CivilizationControl already handles this distinction for its own package: `CC_PACKAGE_ID` is used for runtime `moveCall` targets, while `CC_ORIGINAL_PACKAGE_ID` is used for type strings, dynamic-field key types, and event parsing. Phase 2 now applies the same split to world surfaces in the app layer: runtime entrypoints use `WORLD_RUNTIME_PACKAGE_ID`, while type-origin-sensitive reads and type strings use `WORLD_ORIGINAL_PACKAGE_ID`. The transitional `WORLD_PACKAGE_ID` alias remains only for compatibility.

### Current Move dependency model

The Move package does not use MVR today. `contracts/civilization_control/Move.toml` depends on local vendored source paths:

- `world = { local = "../../vendor/world-contracts/contracts/world" }`
- `assets = { local = "../../vendor/world-contracts/contracts/assets" }`

`Move.lock` then pins those local dependencies for reproducible builds.

### Existing Stillness v1 assumptions

- both world constants intentionally still point at the older Stillness package until a deliberate World v2 runtime migration branch is approved
- sponsor allowlists, worker config, tests, and validation scripts still intentionally target the current runtime package
- `src/lib/suiReader.ts` keeps world `MoveModule` event queries on runtime/emitter semantics even after the split
- sponsor allowlists assume the same concrete world package the frontend targets
- worker validation rejects any package not explicitly allowlisted

### Docs already warning about World v2

- `docs/operations/submodule-refresh-20260425.md`
- `docs/operations/sponsor-worker-runbook.md`
- `docs/llm-reference-guide.md`
- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`

## 3. Current World v2 / world-contracts findings

- `vendor/world-contracts/contracts/world/Published.toml` records Stillness/Testnet world as `published-at = 0xd2fd1224...6e4780`, `original-id = 0x28b49755...27448c`, `version = 2`.
- `vendor/world-contracts/README.md` says the repo is future-facing and not guaranteed to be the exact current in-game contract source. It is still strong evidence for package lineage and source compatibility.
- There is no separate architectural split into different packages for "world runtime" versus "world API". The meaningful split here is latest runtime (`published-at`) versus original/type-origin (`original-id`), plus separate `world` and `assets` packages.
- `docs/operations/submodule-refresh-20260425.md` found no relevant source changes in the `world-contracts` modules CivilizationControl uses between the previous reviewed pin and the current submodule pin. The main risk is runtime-ID drift, not known API breakage.
- Relevant world functions still exist in the current vendor source: `character::borrow_owner_cap`, `character::return_owner_cap`, `gate::issue_jump_permit`, `gate/storage_unit/turret::authorize_extension`, `gate/storage_unit::update_metadata_url`, assembly `online` / `offline`, and `network_node::online`.
- What remains unproven before any runtime-ID change: live Stillness target package, shared object IDs such as `GATE_CONFIG_ID` and `ENERGY_CONFIG_ID`, read-path/event-path world runtime versus original semantics, sponsor allowlist alignment, and whether any live runtime surface disagrees with vendor metadata.

## 4. MVR findings

### Registry result

- `https://www.moveregistry.com/package/@evefrontier/world` currently shows `@evefrontier/world`, `Testnet`, version `2`, resolved package `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`.
- That matches the Stillness/Testnet `published-at` value in `vendor/world-contracts/contracts/world/Published.toml`.

### Resolution semantics

- Official MVR docs say unversioned names resolve to the latest available version.
- Version pinning exists via an optional `/<version>` suffix such as `@myname/mypackage/2`.
- The public MVR package page exposes latest-package resolution, not the original/type-origin package needed for lineage-sensitive reads.

### Network support

- Official docs say the default service currently supports Mainnet and Testnet.
- CivilizationControl Stillness is on Sui Testnet chain ID `4c78adac`, so MVR works at the network level.
- MVR does not distinguish the repo's app-level aliases `testnet_stillness`, `testnet_utopia`, and `testnet_internal`; all three share the same chain ID and need app-side handling.

### TypeScript SDK support

- Local checks found `@mysten/sui@2.8.0` at the repo root and `@mysten/sui@2.7.0` in the sponsor worker package.
- Official TypeScript MVR docs describe named package resolution through the named-packages plugin and recommend `@mysten/mvr-static` when builders want build-time cached resolution instead of live runtime lookups.
- Repo-local SDK source confirms that the current installed `Transaction` implementation automatically adds the named-packages serialization plugin during build. If named packages are present and no client is passed to `build()`, the build errors.
- Result: PTB targets such as `@evefrontier/world::gate::authorize_extension` are technically possible in the current SDK, but the app does not use them today.

### Move.toml support

- Official Sui Move package-management docs explicitly support MVR dependencies such as `world = { r.mvr = "@evefrontier/world" }`.
- Those same docs confirm that `Move.lock` pins dependency resolution, environments can share a chain ID while still keeping separate `Published.toml` entries, and dependency replacements can override `published-at` / `original-id` when needed.

### Tooling availability in this task

- `mvr --version` failed because `mvr` is not installed on this machine.
- `sui move build --help` is available and shows the current package-management flags.
- `npm ls @mysten/sui --depth=0` reported `@mysten/sui@2.8.0`.
- Implication: a Phase 1 audit can use either an installed `mvr` CLI later or a lightweight HTTP/script fallback. Direct CLI-based `mvr resolve` was not verifiable in this task.

### External sources used for this section

- `https://www.moveregistry.com/package/@evefrontier/world`
- `https://docs.suins.io/move-registry`
- `https://docs.suins.io/move-registry/mvr-names`
- `https://docs.suins.io/move-registry/tooling/typescript-sdk`
- `https://docs.sui.io/guides/developer/packages/move-package-management`

## 5. Impact on frontend transaction builders

- Named package PTB targets are technically usable with the installed SDK.
- They are not a good first move for this repo because the app already builds many browser-side transactions from concrete IDs, lacks a world runtime/original split in `src/constants.ts`, and would add a new runtime lookup dependency during transaction build.
- Current sponsored flow is concrete-ID based: `src/hooks/useSponsoredExecution.ts` builds `TransactionKind` bytes in the browser, `src/lib/sponsorship.ts` sends `txKindB64` to the worker, `workers/sponsor-service/src/index.ts` reconstructs `Transaction.fromKind(kindBytes)`, and `workers/sponsor-service/src/validation.ts` validates decoded `MoveCall.package`, `module`, and `function`.
- If the frontend used named package targets, the SDK would resolve them before serializing the transaction kind. The worker would still see concrete package IDs.
- Direct MVR lookups in browser PTB building add latency and availability risk. Official docs recommend build-time/static resolution when builders want the ergonomics without the runtime dependency.
- Code areas that would change in any direct named-package experiment: `src/constants.ts`, all PTB builders under `src/lib/`, `src/hooks/useAuthorizeExtension.ts`, and any shared transaction setup added for overrides or static resolution output.

## 6. Impact on sponsor worker policy

- Policy should stay concrete-ID based. The worker validates decoded concrete packages after reconstructing the transaction kind, which is deterministic and reviewable.
- MVR is suitable as an audit input, not as the worker's real-time source of truth.
- Safe anti-drift pattern: keep committed concrete allowlists, add an MVR-aware validation check that compares `config/chain/stillness.ts`, `src/constants.ts`, `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, `workers/sponsor-service/src/__tests__/validation.test.ts`, `vendor/world-contracts/contracts/world/Published.toml`, and MVR resolution for `@evefrontier/world`, then fail on disagreement.
- Safe World v2 staging order: model world runtime/original explicitly, update the frontend runtime target, update committed sponsor policy and `wrangler.toml` to the same concrete runtime ID, rerun sponsor validation and worker tests, prove one real sponsored preview transaction, then consider production.

## 7. Impact on Move dependencies

- Current state: `contracts/civilization_control/Move.toml` uses local vendored `world` and `assets` dependencies, and `vendor/world-contracts` is treated as canonical for signature review.
- MVR dependency mode is technically possible but does not solve the repo's main runtime-ID problem; it changes how the extension compiles, not how the frontend chooses runtime world IDs or how the sponsor worker validates package IDs.
- Keeping the vendor submodule is better for CivilizationControl right now because it preserves inspectable pinned source, consistent signature review, and a clean audit trail for submodule refreshes and world metadata changes.
- Official docs make MVR dependencies reproducible through `Move.lock`, but that benefit alone is not enough to justify switching away from local vendor dependencies before the world runtime/original model is cleaned up.
- Recommendation: keep `vendor/world-contracts` for now. If MVR dependencies are explored later, do so in a proof branch with `sui move build --path contracts/civilization_control`, `sui move test --path contracts/civilization_control`, and explicit source-review sanity checks.

## 8. Adoption options

| Option | Benefits | Risks | Likely files affected | Validation needed | Recommendation |
|---|---|---|---|---|---|
| A. MVR as audit/validation only | Lowest-risk first use; catches drift; no runtime behavior change | Still requires humans to decide when to migrate runtime IDs | new audit/check script, `package.json`, optionally `scripts/validate-sponsor-policy.mjs`, docs | script review, `git diff --check`, `npm run typecheck`, `npm run build` | Yes, first slice |
| B. MVR as build-time generation | Reduces manual drift while keeping runtime values concrete; pairs well with static resolution | Still requires explicit world runtime/original model; generated output can drift | `src/constants.ts`, `config/chain/stillness.ts`, generation script(s), `package.json`, docs | generation check, sponsor-policy validation, typecheck, build | Good second step |
| C. MVR as direct frontend PTB names | Hides concrete IDs from PTB call sites | Adds runtime lookup dependency; does not solve read/type-origin handling; does not simplify worker validation | all PTB builders, transaction setup, possibly static-resolution plumbing | sponsored/non-sponsored smoke, offline failure behavior, allowlist regression checks | No for now |
| D. MVR as Move.toml dependency | Aligns with official Move package-management direction | Solves compile-time sourcing, not the main runtime-ID problem; may weaken local source review if done early | `contracts/civilization_control/Move.toml`, `Move.lock`, related docs | Move build/test, publish/test-publish proof branch, source-review check | Defer |
| E. Full immediate World v2 migration | Aligns runtime calls with current upstream Stillness/Testnet world v2 metadata | Highest-risk path; impacts PTBs, reads, events, sponsor allowlists, and smoke coverage together | runtime constants, read/event helpers, all world PTBs, sponsor config, docs | full local gates plus preview/live Stillness smoke | Not now |

## 9. Recommended strategy

1. Do not immediately replace all hardcoded world IDs.
2. Add an MVR resolution/check script first.
3. Compare `@evefrontier/world` against `config/chain/stillness.ts`, `src/constants.ts`, `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, and `scripts/validate-sponsor-policy.mjs`.
4. Keep runtime config concrete and committed until the repo explicitly models world runtime ID versus world original/type-origin ID.
5. Keep `vendor/world-contracts` as the compile-time/source-review dependency for now.
6. Perform World v2 adoption as a separate high-risk branch only after the MVR check exists and preview smoke criteria are defined.
7. Treat direct frontend named-package PTBs and Move.toml MVR dependencies as optional later experiments, not the first migration path.

In short: use MVR first as truth-checking infrastructure, not as a drop-in runtime replacement.

## 10. Proposed implementation sequence

| Phase | Likely files | Likely commands | Validation | Stop conditions |
|---|---|---|---|---|
| 1. MVR resolution/audit script | `scripts/resolve-world-mvr.mjs` or similar, `package.json`, optionally `scripts/validate-sponsor-policy.mjs`, docs | `mvr --version` if available, `node scripts/resolve-world-mvr.mjs`, `npm run sponsor:validate-policy` | confirm latest package and lineage assumptions, `git diff --check`, typecheck, build | resolution cannot be reproduced, or MVR and committed upstream metadata disagree for unclear reasons |
| 2. Config cleanup for runtime versus type-origin IDs | `src/constants.ts`, `config/chain/stillness.ts`, `src/lib/suiReader.ts`, `src/lib/eventParser.ts`, docs | `npm run typecheck`, `npm run build` | verify runtime-target surfaces versus type-origin surfaces are explicit | not enough proof for which world reads should stay original versus latest runtime |
| 3. Sponsor policy drift validation | `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, `workers/sponsor-service/src/__tests__/validation.test.ts`, `scripts/validate-sponsor-policy.mjs` | `npm run sponsor:validate-policy`, `npm run sponsor:test`, `npm run sponsor:typecheck`, typecheck, build | worker config, committed policy, tests, frontend targets, and MVR comparison all agree | policy cannot be proven against the same package the frontend builds into `TransactionKind` |
| 4. Explicit World v2 migration branch | all world-targeting PTBs, runtime constants, read/event helpers, sponsor policy, docs | sponsor-policy validation, typecheck, build, preview smoke steps | wallet discovery, owner-cap flows, extension authorization, metadata URLs, power toggles, signal feed, one real sponsored preview tx | preview smoke and expected runtime package disagree, or sponsorship falls back |
| 5. Optional frontend named-package PTB experiment | PTB builders, transaction setup, possibly static MVR resolution config | typecheck, build, targeted preview smoke | compare reliability and latency versus concrete-ID PTBs | runtime lookup availability or performance is worse than explicit IDs |
| 6. Optional Move.toml MVR dependency experiment | `contracts/civilization_control/Move.toml`, `Move.lock`, related docs | `sui move build --path contracts/civilization_control`, `sui move test --path contracts/civilization_control` | deterministic resolution for the intended environment and acceptable source review | same-chain environment resolution is ambiguous or auditability gets worse |

## Phase 1 automation result

- Added baseline file: `config/chain/worldMvrBaseline.json`
- Added read-only drift checker: `scripts/check-world-mvr-drift.mjs`
- Added npm entry points:
	- `npm run world:mvr:check`
	- `npm run world:mvr:ci`
	- `npm run world:mvr:strict`
- Added scheduled/manual GitHub Action: `.github/workflows/world-package-drift.yml`

Behavior:

- `world:mvr:check` reports the committed world runtime/original packages, sponsor policy package, worker config package, test expectations, vendor `Published.toml` values, and live MVR resolution when available.
- `world:mvr:ci` fails on internal consistency errors and unexpected vendor/MVR baseline drift, but keeps the current known Stillness v1-versus-v2 migration gap as warning-only.
- `world:mvr:strict` is reserved for later World v2 migration branches. It fails if the committed runtime package, sponsor policy, worker config, tests, or validation script are not aligned to MVR latest.

What the automation catches:

- repo-internal mismatches across frontend config, chain config, sponsor policy, worker wrangler config, worker validation tests, validation script expectations, and Move dependency mode
- vendor baseline drift in `vendor/world-contracts/contracts/world/Published.toml`
- live registry drift for `@evefrontier/world` when the MVR endpoint is reachable
- divergence between vendor Stillness metadata and live MVR resolution

What it does not catch:

- live gameplay smoke regressions such as owner-cap flows, structure power, signal-feed event behavior, or sponsored preview transactions
- object-ID drift for non-package shared objects such as `GATE_CONFIG_ID` or `ENERGY_CONFIG_ID`
- any runtime migration correctness beyond the explicit package relationships it checks

Notes:

- CI intentionally treats MVR availability as required because the purpose of Phase 1 is an automated alarm bell for live registry drift.
- The first manual GitHub Actions run failed before reporting known drift because the workflow checked out the repo without submodules, which left `vendor/world-contracts/contracts/world/Published.toml` unavailable on the runner.
- The workflow now uses recursive submodule checkout so the drift checker can read vendored Stillness metadata in CI.
- The drift checker now emits an actionable missing-vendor-file error instead of a generic internal `ENOENT` when required local metadata is absent.
- No World v2 migration was performed by this automation. The repo remains intentionally pinned to the older Stillness world package until an explicit later migration branch updates runtime config and sponsor policy together.

## Phase 2 implementation result

- Phase 2 is now implemented in the app layer at `docs/operations/world-runtime-original-split-20260429.md`.
- `src/constants.ts` now exposes `WORLD_RUNTIME_PACKAGE_ID` and `WORLD_ORIGINAL_PACKAGE_ID` explicitly, while keeping both values pinned to the current Stillness world package `0x28b497...`.
- Runtime entrypoints now read from the runtime constant, while world type strings, exact event types, `StructType` filters, and deterministic type tags now read from the original/type-origin constant.
- Sponsor allowlists, worker config, Move dependencies, and vendor files were intentionally left unchanged in Phase 2.

## 11. Risks and open questions

- unversioned MVR names resolve latest and can change underneath us
- version pinning exists, but CivilizationControl must decide whether pinning belongs in script output, generated config, or explicit names
- sponsor policy drift remains a real risk while world IDs are duplicated across config, worker config, tests, and validation scripts
- world runtime versus original/type-origin confusion is the central migration hazard
- current SDK support is good enough for named packages, but the repo still needs a deliberate reliability choice between runtime lookups and build-time/static resolution
- MVR supports Mainnet/Testnet, but CivilizationControl also uses same-chain custom environment names that MVR does not model directly
- package upgrade timing can make public latest resolution lead or lag the exact runtime the app should target
- registry availability is an extra dependency if used directly in browser PTB construction
- the public MVR package page gives latest package resolution, not the full original/type-origin lineage needed by this app
- `vendor/world-contracts` metadata may still differ from the live in-game runtime the app should ultimately follow, so a live runtime decision still needs empirical validation

## 12. Recommended next prompt

> Phase 2 is complete. Plan the explicit World v2 runtime migration branch only; do not execute it yet. Define exactly which runtime surfaces must change together when moving `WORLD_RUNTIME_PACKAGE_ID` to the MVR/latest world package: `src/constants.ts`, `config/chain/stillness.ts` runtime field, sponsor policy package, worker wrangler config package, worker validation tests, and validation script expectations. Keep `WORLD_ORIGINAL_PACKAGE_ID` unchanged unless package-lineage evidence proves the defining type origin also changed. Require preview smoke coverage before any production cutover: wallet discovery, owner-cap borrow/return flows, extension authorization, metadata URL updates, safe structure power online/offline checks, signal/event behavior, and one real sponsored preview transaction. `npm run world:mvr:strict` should be expected to pass only after that runtime migration is complete and all aligned runtime surfaces have been updated together.