# World v2 Runtime Migration Plan — 2026-04-29

## 1. Executive summary

World v2 is the newer Stillness/Testnet runtime publish of the external EVE Frontier World package. That runtime migration is now implemented: production frontend targets World v2 runtime `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`, `WORLD_ORIGINAL_PACKAGE_ID` remains anchored to `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`, and the shared sponsor worker temporarily allows both world runtime packages during soak.

This document remains active as the planning record that led to that cutover. Use it for the reasoning behind the runtime/original split, sponsorship sequencing, and rollback constraints. Use `docs/operations/world-v2-runtime-preview-validation-20260429.md` for preview evidence, production deploy evidence, and the remaining manual smoke gap.

## 2. Current state

| Surface | Current value | Notes |
|---|---|---|
| `src/constants.ts` `WORLD_RUNTIME_PACKAGE_ID` | `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` | Frontend runtime package now targets World v2 |
| `src/constants.ts` `WORLD_ORIGINAL_PACKAGE_ID` | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | Type-origin package remains on original Stillness lineage |
| MVR/latest `@evefrontier/world` | `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` | Resolved live by `npm run world:mvr:check` and `npm run world:mvr:ci` |
| Vendored Stillness world original-id | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | Matches current original/type-origin package |
| Sponsor policy world packages | `0xd2fd1224...` and `0x28b497...` | Shared worker overlap keeps old-runtime sponsorship available during soak |
| Worker wrangler world packages | `0xd2fd1224...` and `0x28b497...` | `workers/sponsor-service/wrangler.toml` |
| Worker validation test package set | `0xd2fd1224...`, `0x28b497...`, and CC runtime | `workers/sponsor-service/src/__tests__/validation.test.ts` |
| Validation script expected package set | `0xd2fd1224...`, `0x28b497...`, and CC runtime | `scripts/validate-sponsor-policy.mjs` |
| Current Sui active env | `testnet_stillness` | `sui client active-env` returned this successfully |
| Strict-mode status | passing | `world:mvr:strict` now passes on `master` after runtime and sponsor surfaces aligned |

Preview and production cutover are complete. Production manual wallet smoke is still pending.

## 3. Why this migration matters

This migration is about CivilizationControl’s external EVE Frontier World runtime calls, not about upgrading CivilizationControl’s own Move package. CivilizationControl still publishes and targets its own CC package separately; the World v2 question is whether browser-built PTBs and sponsor validation should keep calling the older world runtime package or move to the newer Stillness runtime publish.

Even if CivilizationControl does not need any World v2-only feature today, it still calls World package functions for owner-cap borrow/return flows, extension authorization, metadata URL updates, and structure power operations. Those runtime targets are concrete package IDs. If the runtime package moves but sponsorship and validation stay on the old ID, sponsored execution will reject otherwise-valid PTBs or fall back to player-paid execution.

At the same time, type-origin-sensitive reads should not be changed blindly. Sui type lineage is anchored to the package where a struct or event type was first defined, not necessarily the latest runtime package. That is why `WORLD_ORIGINAL_PACKAGE_ID` now exists and why exact event type strings, `StructType` filters, and deterministic type tags should stay on the original lineage unless separate proof shows the defining package origin changed.

## 4. Runtime surfaces to change if migration proceeds

| File | Current value/source | Future v2 value/source | Reason | Validation needed |
|---|---|---|---|---|
| `src/constants.ts` | `WORLD_RUNTIME_PACKAGE_ID = 0x28b497...` | `WORLD_RUNTIME_PACKAGE_ID = 0xd2fd1224...` from live MVR/latest and vendored Stillness metadata | Frontend runtime switch point for all world MoveCall targets | `world:mvr:strict`, preview PTB smoke, sponsorship proof |
| `config/chain/stillness.ts` | `WORLD_RUNTIME_PACKAGE_ID = 0x28b497...` | `WORLD_RUNTIME_PACKAGE_ID = 0xd2fd1224...` | Chain/runtime config must stay aligned with frontend constant and drift checker | `world:mvr:check`, `world:mvr:ci`, `world:mvr:strict` |
| `config/sponsorship/civilizationControlPolicy.ts` | allowlist key `0x28b497...` | allowlist key `0xd2fd1224...` | Worker must accept World v2 runtime package in sponsored TransactionKind | sponsor validation, worker preview smoke, fallback proof |
| `workers/sponsor-service/wrangler.toml` | `APP_POLICIES` world key `0x28b497...` | `APP_POLICIES` world key `0xd2fd1224...` | Deployed worker config must match committed sponsor policy | worker deploy, preview sponsor proof |
| `workers/sponsor-service/src/__tests__/validation.test.ts` | `WORLD_PACKAGE = 0x28b497...` | `WORLD_PACKAGE = 0xd2fd1224...` | Tests must validate the migrated runtime package | `npm run sponsor:test` |
| `scripts/validate-sponsor-policy.mjs` | expected world package `0x28b497...` | expected world package `0xd2fd1224...` | Validator must enforce the new runtime package across frontend/config/worker surfaces | `npm run sponsor:validate-policy` |
| `scripts/check-world-mvr-drift.mjs` | no direct runtime literal change expected | likely no direct code change; strict mode should pass after aligned runtime surfaces move | This script already models runtime vs original separately; it becomes the migration guard rather than the migration target | `npm run world:mvr:strict` must turn green |
| `docs/operations/sponsor-worker-runbook.md` | still describes current sponsor-worker layout and guardrails | update after migration proof | Operational record of worker package cutover and preview/prod order | docs review after implementation |
| `docs/operations/mvr-world-package-audit-20260429.md` | audit/planning history | update after migration branch concludes | Historical audit should record runtime cutover result | docs review after implementation |
| `docs/llm-reference-guide.md` | current repo state briefing still says no migration has happened | update after migration proof | Future-agent context should reflect new runtime package once cutover succeeds | docs review after implementation |
| `docs/decision-log.md` | current latest entry ends at planning-only | add migration decision after implementation | Keeps rollout evidence durable | implementation branch closeout |

Runtime-facing PTB builders such as `src/lib/gatePolicyTx.ts`, `src/lib/postureSwitchTx.ts`, `src/lib/structurePowerTx.ts`, and `src/hooks/useAuthorizeExtension.ts` are validation targets, not expected direct-edit targets, because they already consume `WORLD_RUNTIME_PACKAGE_ID`. They only need direct code changes if live or vendored evidence later proves a module name or function signature changed.

## 5. Surfaces not to change blindly

| File | Surface | Why it likely remains original/type-origin | Evidence needed before changing |
|---|---|---|---|
| `src/constants.ts` | `WORLD_ORIGINAL_PACKAGE_ID` | Vendored Stillness world v2 keeps original-id on `0x28b497...` while only `published-at` moved | Exact Stillness package lineage evidence proving original-id changed |
| `config/chain/stillness.ts` | `WORLD_ORIGINAL_PACKAGE_ID` | Chain config should preserve the same original/type-origin split as frontend constants | Same lineage proof as above |
| `src/lib/suiReader.ts` | `PlayerProfile` `StructType` filter | Wallet-to-profile discovery depends on the original defining package for `character::PlayerProfile` | Live `getOwnedObjects` proof that v2 package owns the defining `PlayerProfile` type |
| `src/lib/suiReader.ts` | any future world dynamic-field key types | World package key types follow defining package lineage, not latest runtime, if they are added later | On-chain DF key type lineage proof |
| `src/lib/eventParser.ts` | exact world event type strings | Parser uses exact string matching; current world event structs are still defined under original lineage | Live event payload proof plus lineage metadata showing the defining package changed |
| `src/lib/objectResolver.ts` | `TenantItemId` type tag | Deterministic object derivation changes if the package/type tag changes; this is not a runtime-only lookup | Live derivation proof that v2 package is now the defining type origin |
| `src/lib/gatePolicyTx.ts` | `Gate` type argument | Owner-cap type arguments are type-origin-sensitive even when the borrow/return targets move with runtime | Sui type lineage proof for `world::gate::Gate` |
| `src/lib/postureSwitchTx.ts` | `Gate` and `Turret` type arguments | Same type-origin rule as above | Sui lineage proof for both structs |
| `src/lib/structurePowerTx.ts` | assembly `typeStr` values and `NetworkNode` type | Type arguments should stay on original lineage unless the defining package changed | Sui lineage proof for assembly structs |
| `src/hooks/useAuthorizeExtension.ts` | gate/storage-unit/turret type strings | World authorization type arguments remain original/type-origin sensitive | Same lineage proof for relevant structs |

Current repo evidence supports changing runtime targets without changing original/type-origin surfaces. Any proposal to move `WORLD_ORIGINAL_PACKAGE_ID`, exact event type strings, `StructType` filters, or deterministic type tags should be treated as a separate evidence-based decision, not an automatic consequence of a runtime package cutover.

## 6. Event/query semantics to validate

Current code intentionally uses world `MoveModule` queries in `src/lib/suiReader.ts` for turret, gate, and storage-unit event polling, while `src/lib/eventParser.ts` keeps exact world event type strings anchored to `WORLD_ORIGINAL_PACKAGE_ID`. That means the migration plan assumes:

- world `MoveModule` queries follow runtime or emitter semantics and should move with `WORLD_RUNTIME_PACKAGE_ID`
- exact world event type parsing follows original/type-origin semantics and should stay on `WORLD_ORIGINAL_PACKAGE_ID`

This split is plausible and already modeled in the codebase, but it still needs empirical validation on live Stillness before a production cutover. Read-only proof should include:

- exact `MoveEventType` queries for `WORLD_ORIGINAL_PACKAGE_ID::status::StatusChangedEvent`
- paired `MoveModule` queries against old runtime package and new v2 runtime package for `gate`, `storage_unit`, and `turret`
- the same paired check for turret extension authorize/revoke events
- a direct transaction-event inspection for at least one preview digest to confirm payload shape still matches parser expectations

Manual preview smoke should verify that Recent Signals still folds and labels events correctly after the runtime cutover. Failure symptoms would include:

- missing gate, turret, or trade-post power signals
- generic or mis-labeled status signals because `_assemblyType` tagging no longer matches raw events
- missing turret doctrine signals after authorize/revoke flows
- signals appearing only in raw RPC but not in the UI parser map
- signals disappearing entirely when `WORLD_RUNTIME_PACKAGE_ID` moves but `WORLD_ORIGINAL_PACKAGE_ID` stays pinned

Because the feed currently polls browser-side and scopes signals client-side, preview smoke should also confirm unrelated world-module activity does not leak into the operator feed after the package switch.

## 7. Sponsor worker migration requirements

World v2 runtime migration requires a coordinated sponsorship update. At minimum, these surfaces must move together:

- `config/sponsorship/civilizationControlPolicy.ts`
- `workers/sponsor-service/wrangler.toml`
- `workers/sponsor-service/src/__tests__/validation.test.ts`
- `scripts/validate-sponsor-policy.mjs`

Worker deploy is required before preview sponsorship can succeed, because the worker validates submitted TransactionKind packages against concrete allowlists. Frontend preview deploy is also required, because `WORLD_RUNTIME_PACKAGE_ID` is compiled into the browser bundle and controls which package the generated PTBs target.

The current repo shape makes release order important. The current worker URL is shared operationally between preview and production paths, so the safest migration sequence is:

1. prepare the feature branch and align all runtime-target files locally
2. run local validation and ensure `world:mvr:strict` turns green on that branch
3. deploy a preview-safe worker configuration first
4. deploy a feature-branch Pages preview build
5. run manual sponsor smoke on preview only
6. cut over production only after preview proof succeeds

Proof required to rule out fallback:

- a world-touching sponsored preview transaction succeeds against the updated worker
- browser console does not emit fallback-to-player-paid warnings
- final transaction data shows sponsor-paid gas rather than player-paid gas
- worker-side logs show the sponsor-approved path for the same request/digest

Strongest sponsor-gas proof is a preview transaction from a wallet that cannot silently self-fund gas. If the transaction still succeeds and the sponsor wallet is the gas payer, the migration proof is materially stronger.

## 8. Read-only evidence collected

- `npm run world:mvr:check` and `npm run world:mvr:ci` both passed and resolved `@evefrontier/world` to `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`.
- Both commands also confirmed vendored Stillness metadata matches that same v2 runtime package and that original/type-origin remains `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`.
- `npm run world:mvr:strict` failed exactly as expected because runtime config, sponsor policy, worker wrangler config, worker tests, and validation expectations all intentionally remain on the older world runtime package.
- `sui client active-env` returned `testnet_stillness`. The terminal printed an unrelated local PowerShell profile parse warning first, but the command still completed and returned the expected environment.
- Vendored Stillness world source still exposes the module and function names CivilizationControl currently depends on: `character::borrow_owner_cap`, `character::return_owner_cap`, `gate::authorize_extension`, `gate::online`, `gate::offline`, `gate::update_metadata_url`, `storage_unit::authorize_extension`, `storage_unit::online`, `storage_unit::offline`, `storage_unit::update_metadata_url`, `turret::authorize_extension`, `turret::online`, `turret::offline`, `turret::update_metadata_url`, and `network_node::online`.
- Shared object IDs such as `GATE_CONFIG_ID` and `ENERGY_CONFIG_ID` are internally consistent across repo surfaces today, but there is no read-only proof yet that they remain correct after a runtime-only World v2 cutover.
- There is no read-only evidence that the older runtime package has stopped working. Current evidence frames the migration as coordinated alignment and future-proofing work rather than a proven live break.
- The main unresolved question is live event/query semantics for world `MoveModule` polling after a package upgrade. The code model is plausible, but preview proof is still required.
- A later operator-driven preview smoke on `feat/world-v2-runtime-preview` succeeded with a real wallet-driven action and sponsor wallet payment observed, but no digest was captured in current local docs or transcript.

## 9. Preview smoke test plan

Required manual preview checks before production:

1. wallet connects successfully on the preview deployment
2. owner caps are discovered for the connected operator
3. gate, storage-unit/trade-post, turret, and network-node structures resolve correctly
4. one gate or trade-post extension authorization succeeds on preview
5. one in-game metadata URL update succeeds on preview
6. one safe structure power online/offline check succeeds on a non-critical owned structure
7. Recent Signals updates correctly for power or posture activity within the expected polling window
8. one real sponsored preview transaction succeeds end to end
9. the final digest or wallet/SuiScan evidence shows sponsor-paid gas, not player-paid gas
10. browser console shows no fallback-to-player-paid warnings for the validated transaction

Recommended first sponsored smoke remains the lowest-risk world-touching write: a gate or SSU “Set On-Chain” metadata URL update on preview. It exercises the world runtime package, sponsor allowlist, and browser-to-worker execution path without combining as many gameplay preconditions as a larger batch flow.

## 10. Rollback plan

If preview or production migration fails, rollback should restore the previous runtime package and sponsor policy together while preserving `WORLD_ORIGINAL_PACKAGE_ID`.

Rollback steps:

1. revert `WORLD_RUNTIME_PACKAGE_ID` in `src/constants.ts` to `0x28b497...`
2. revert `WORLD_RUNTIME_PACKAGE_ID` in `config/chain/stillness.ts` to `0x28b497...`
3. revert sponsor allowlist world package in `config/sponsorship/civilizationControlPolicy.ts`
4. revert `APP_POLICIES` world package in `workers/sponsor-service/wrangler.toml`
5. revert worker test constant in `workers/sponsor-service/src/__tests__/validation.test.ts`
6. revert expected world package in `scripts/validate-sponsor-policy.mjs`
7. redeploy the worker configuration that matches the reverted allowlist
8. redeploy the previous frontend preview or production bundle, depending on where failure occurred

Rollback should preserve:

- `WORLD_ORIGINAL_PACKAGE_ID`
- original/type-origin event/type parsing
- deterministic type tags and object-resolution logic

If operationally possible, keep the pre-migration worker deployment or configuration available during the soak window so rollback is fast and low-risk.

Rollback criteria:

- sponsored preview transactions fail or fall back to player-paid execution
- sponsor worker rejects the migrated world package
- owner-cap flows, extension authorization, or metadata URL updates regress
- structure power toggles fail unexpectedly
- Recent Signals stops surfacing expected power/doctrine/posture behavior
- shared object assumptions prove wrong after the runtime cutover

Production cutover criteria:

- all aligned runtime-target files are updated together
- `npm run world:mvr:strict` passes on the implementation branch
- sponsorship validation/tests pass
- typecheck/build pass
- preview sponsor smoke passes with gas-payer proof
- event/query smoke passes on preview
- rollback patch or commit is ready before production cutover

## 11. Implementation branch prompt

Implement World v2 runtime migration on a feature branch, update runtime package surfaces and sponsor policy together, deploy preview only, and require manual smoke proof before production.

## 12. Decision recommendation

Run a narrow preview experiment first.

Justification:

- there is no current evidence that the older runtime package has stopped working, so an immediate production migration is not forced
- strict-mode failure already proves the repo is intentionally out of alignment with live MVR/latest World v2, so the migration should not be ignored indefinitely
- vendored world source still appears call-compatible, which lowers migration risk for runtime entrypoints
- the material uncertainty is not module names; it is live event/query behavior plus sponsorship proof after the runtime package changes
- preview can answer those uncertainties safely without changing `WORLD_ORIGINAL_PACKAGE_ID`, production sponsor policy, or production Pages immediately

Preview proof is now clean enough to justify merge and explicit production frontend cutover, but production deployment still has to happen separately because this repo uses manual Cloudflare Pages deployment. If later production or event/query proof is not clean, defer further rollout work and keep rollback ready while the shared worker overlap preserves old-runtime sponsorship during soak.