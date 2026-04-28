# Sponsor Signer Migration Plan — 2026-04-27

Status: phases 1 through 4 implemented locally; deploy and cutover remain separate follow-up work

## Status Update — 2026-04-27

- Implementation commit: `9fa2144`
- Worker source provenance: copied from Flappy Frontier commit `de2fbbd03a32464c29729fe561314fd676029e1f`
- Implemented locally in CivilizationControl:
	- `workers/sponsor-service/` now contains the worker runtime, tests, package metadata, and Wrangler config
	- `config/chain/stillness.ts` is the committed chain and package-ID source of truth for sponsor-worker updates
	- `config/sponsorship/civilizationControlPolicy.ts` is the committed CivilizationControl allowlist source of truth
	- `scripts/validate-sponsor-policy.mjs` plus `npm run sponsor:validate-policy` validate repo drift against current config/runtime metadata
	- `docs/operations/sponsor-worker-runbook.md` documents in-repo worker ownership and maintenance
	- Local validation passed: `npm run sponsor:validate-policy`, `npm run sponsor:test`, `npm run sponsor:typecheck`, `npm run typecheck`, `npm run build`
- Not implemented yet:
	- Cloudflare deploy from CivilizationControl
	- Frontend env cutover verification against the in-repo worker
	- Live sponsored transaction validation against a deployed worker URL
	- Stillness World v2 runtime-ID migration
- Operational clarification:
	- Moving worker source into CivilizationControl changes source ownership only. It does not automatically redeploy or cut over the live Cloudflare Worker.
	- Future package-ID or World v2 runtime-ID changes should update `config/chain/stillness.ts`, `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, and `scripts/validate-sponsor-policy.mjs` in this repo, not a Flappy Frontier handoff doc.
	- After this branch merges, Flappy Frontier is no longer needed for routine sponsor-worker edits.

The remainder of this file is preserved as the original pre-implementation planning artifact and describes the pre-copy state unless explicitly noted otherwise.

Historical planning guardrails from the original planning-only task:
- Do not copy implementation code into CivilizationControl yet.
- Do not change runtime code, Move contracts, package IDs, world IDs, object IDs, sponsor allowlists, or Cloudflare config in this task.
- Do not deploy, publish, or upgrade anything in this task.

Investigation inputs:
- CivilizationControl repo: `C:/dev/CivilizationControl`
- Flappy Frontier repo inspected read-only at: `C:/dev/flappy-frontier`
- Flappy Frontier local checkout state during inspection: branch `main`, working tree dirty, including sponsor-worker files under `workers/sponsor-service/`

The Flappy Frontier dirty state matters. This plan documents the currently inspected local worker implementation, not a clean, pinned upstream handoff. Before copying code in a later implementation task, reconcile the reviewed worker files against a stable Flappy Frontier commit or explicitly decide to treat the local working tree as the source of truth.

## 1. Executive summary

The sponsor signer currently lives outside CivilizationControl in the sibling Flappy Frontier repo at `workers/sponsor-service/`. It is a Cloudflare Worker that accepts base64-encoded `TransactionKind` bytes, validates the programmable transaction block against an allowlist policy, rebuilds the full transaction with sponsor-owned gas, signs it with a sponsor key, and returns `{ txB64, sponsorSignature }` to the frontend.

CivilizationControl already depends on that pattern from its frontend. The app posts to an external sponsor URL via `src/lib/sponsorship.ts`, routes governance PTBs through `src/hooks/useSponsoredExecution.ts`, and silently falls back to player-paid execution if sponsorship is unavailable or rejected. The missing ownership is the worker package, policy config, secret handling, and deployment workflow, which are still externalized to Flappy Frontier.

Migration appears mechanically straightforward but operationally medium-risk.

Straightforward parts:
- The frontend contract is already implemented in CivilizationControl.
- The worker is self-contained in Flappy Frontier as a small Cloudflare Worker package.
- The worker already contains a CivilizationControl-specific allowlist entry in its current local `wrangler.toml`.

Risky parts:
- The inspected Flappy Frontier checkout is dirty, including the worker files.
- The worker policy is the source of truth for sponsor eligibility today, but current docs duplicate those allowlists and have already drifted.
- CivilizationControl still uses a single `WORLD_PACKAGE_ID` constant while a future Stillness world v2 move will require separate runtime and type-origin handling.
- Silent fallback currently hides sponsorship breakage from operators.

Recommendation: migrate worker ownership into CivilizationControl before the separate Stillness world v2 runtime-ID task. That keeps future runtime package changes, sponsor allowlist updates, and frontend transaction-builder updates in one repo and one validation loop.

## 2. Current CivilizationControl sponsorship path

### Files involved

Core path:
- `src/lib/sponsorship.ts`
- `src/hooks/useSponsoredExecution.ts`
- `.env.example`
- `README.md`

Current sponsor-routed hooks:
- `src/hooks/useAuthorizeExtension.ts`
- `src/hooks/useGatePolicyMutation.ts`
- `src/hooks/usePosture.ts`
- `src/hooks/useStructurePower.ts`
- `src/hooks/useGatePermit.ts`
- `src/hooks/useCreateListing.ts`
- `src/hooks/useBuyListing.ts`
- `src/hooks/useCancelListing.ts`
- `src/hooks/useTransitProof.ts`

Transaction builder surfaces currently affected by sponsorship policy:
- `src/lib/gatePolicyTx.ts`
- `src/lib/gatePermitTx.ts`
- `src/lib/tradePostTx.ts`
- `src/lib/postureSwitchTx.ts`
- `src/lib/structurePowerTx.ts`
- `src/lib/transitProofTx.ts`

Supporting docs:
- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`
- `docs/operations/submodule-refresh-20260425.md`
- `docs/operations/post-hackathon-repo-readiness-audit.md`
- `docs/llm-reference-guide.md`

### Current request/response contract

Request path:
- Frontend calls `${VITE_SPONSOR_URL}/sponsor`
- Method: `POST`
- JSON body: `{ txKindB64, sender }`
- Optional header: `Authorization: Bearer ${VITE_SPONSOR_API_KEY}` when that env var is set

Response shape expected by CivilizationControl today:
- `{ txB64, sponsorSignature }`

Execution flow today:
1. `useSponsoredExecution` sets the player address as sender if needed.
2. It builds `TransactionKind` bytes with `onlyTransactionKind: true`.
3. It base64-encodes those bytes and sends them to the sponsor worker.
4. It reconstructs the sponsored transaction from `txB64`.
5. The player wallet signs the sponsored transaction.
6. The frontend submits dual signatures: player plus sponsor.

### Environment variables used

Current public client env inputs:
- `VITE_SPONSOR_URL`: enables sponsorship and defines worker base URL
- `VITE_SPONSOR_API_KEY`: optional bearer token forwarded by the browser client

Important constraint:
- Any `VITE_*` value is browser-visible. If `VITE_SPONSOR_API_KEY` contains a real token, it is public configuration, not a durable secret.

### Fallback behavior

Fallback behavior is quiet by design:
- If sponsorship is not configured, the app uses standard wallet-paid execution.
- If the worker rejects, errors, or is unreachable, the app logs a warning and falls back to standard wallet-paid execution.

Operational consequence:
- Sponsorship policy drift can remain invisible to the user while the app still "works" and simply charges the operator gas.

### What operations are currently routed through sponsorship

Current code already routes these operation families through `useSponsoredExecution`:
- Gate policy preset changes and treasury updates
- Posture switching
- Structure online and offline operations
- Gate, storage-unit, and turret extension authorization
- DApp metadata URL updates
- Gate permit issuance, including free and toll-paid branches
- Trade-post listing create, share, cancel, and buy-to-inventory flows
- Transit-proof helper flows

This is broader than the older Stillness handoff doc suggests. The handoff remains useful for historical allowlist inventory and failure history, but its "pending hook changes" section is stale against current `src/`.

### What is currently externalized to Flappy Frontier

Still external to CivilizationControl:
- Sponsor worker source package
- Worker deployment config
- Current `APP_POLICIES` allowlist
- Current worker CORS/origin configuration
- Sponsor secret handling and runtime deployment workflow

### What matters later for World v2/runtime package updates

Current front-end package assumptions:
- CivilizationControl already models `CC_PACKAGE_ID` separately from `CC_ORIGINAL_PACKAGE_ID`.
- World still uses a single `WORLD_PACKAGE_ID` constant.

Later implication:
- Sponsor allowlists must match the world runtime package that frontend Move calls actually target.
- Event types and dynamic-field key types need original/type-origin IDs tracked separately.
- The sponsor migration should prepare the worker policy model for both values now, even though it should not change them in this task.

## 3. Flappy Frontier sponsor worker inventory

### Exact source paths found

Worker package root:
- `C:/dev/flappy-frontier/workers/sponsor-service/`

Core source:
- `C:/dev/flappy-frontier/workers/sponsor-service/src/index.ts`
- `C:/dev/flappy-frontier/workers/sponsor-service/src/validation.ts`

Tests:
- `C:/dev/flappy-frontier/workers/sponsor-service/src/__tests__/validation.test.ts`

Package/config:
- `C:/dev/flappy-frontier/workers/sponsor-service/package.json`
- `C:/dev/flappy-frontier/workers/sponsor-service/tsconfig.json`
- `C:/dev/flappy-frontier/workers/sponsor-service/wrangler.toml`

Related frontend comparison paths:
- `C:/dev/flappy-frontier/frontend/src/lib/sponsorship.ts`
- `C:/dev/flappy-frontier/frontend/src/features/auth/hooks/useGameTransaction.ts`
- `C:/dev/flappy-frontier/frontend/.env.example`

Related docs:
- `C:/dev/flappy-frontier/docs/architecture/sponsor-handoff-civilizationcontrol.md`
- `C:/dev/flappy-frontier/docs/plans/flappy-frontier-chain-integration-plan.md`
- `C:/dev/flappy-frontier/docs/decision-log.md`

### Runtime platform and entry point

Platform:
- Cloudflare Worker

Entry point:
- `workers/sponsor-service/src/index.ts`

Current worker name:
- `flappy-frontier-sponsor`

Runtime dependencies from `package.json`:
- `@mysten/sui`

Dev/deploy tooling from `package.json`:
- `wrangler`
- `vitest`
- `@cloudflare/workers-types`

### Cloudflare Worker configuration

Current committed config is in `workers/sponsor-service/wrangler.toml`.

Observed configuration model:
- `SUI_RPC_URL`
- `GAS_BUDGET`
- `ALLOWED_ORIGINS`
- `ALLOWED_ORIGIN_SUFFIXES`
- `APP_POLICIES`
- `SPONSOR_ENABLED`
- optional `BLOCKED_SENDERS`
- secret placeholders for `SPONSOR_API_KEY` and `SPONSOR_PRIVATE_KEY`

Important current state note:
- The inspected local worker config includes both Flappy Frontier and CivilizationControl app policies in the same worker.
- The inspected local Flappy Frontier checkout is dirty, and the worker files show uncommitted edits that expand the service into a multi-app policy model.

### Current request/response API

Worker route surface:
- `POST /sponsor`
- `OPTIONS` preflight support
- all other paths return `404`

Request body currently accepted by the worker:
- `txKindB64: string`
- `sender: string`
- `timestamp?: number`

Success response:
- `200 { txB64, sponsorSignature }`

Observed failure responses:
- `400` invalid request fields or expired timestamp
- `401` auth failure
- `403` policy rejection or blocked sender
- `404` wrong path
- `413` request too large
- `500` generic sponsorship failure
- `503` service disabled or missing sponsor key

### Policy and allowlist model

Current local worker policy model:
- `APP_POLICIES` is JSON stored in `wrangler.toml`
- Supports both a legacy single-package form and a multi-package form
- Each policy has `id`, package/module/function targets, and optional `maxCommands`
- Cross-app PTBs are rejected

Current inspected CivilizationControl policy in Flappy Frontier `wrangler.toml`:
- world package runtime allowlist for `character`, `gate`, `storage_unit`, `turret`, and `network_node`
- CivilizationControl package allowlist for `gate_control`, `posture`, and `trade_post`
- `maxCommands = 200`

Current inspected hardcoded package IDs in the worker config:
- Flappy Frontier app package
- CivilizationControl runtime package
- Stillness world runtime package

### Security controls observed

Controls present in the inspected worker:
- kill switch via `SPONSOR_ENABLED`
- optional bearer auth via `SPONSOR_API_KEY`
- blocked sender deny-list
- body-size guard via `Content-Length`
- optional replay-window check when `timestamp` is provided
- command-kind allowlist
- package/module/function allowlist
- cross-app rejection
- recursive `GasCoin` detection to block sponsor gas theft
- generic rejection responses plus structured audit logging

Important security limitations:
- Origin handling is CORS behavior only; disallowed origins are not actively rejected server-side.
- Replay protection is optional because the check only runs when the request includes `timestamp`.
- If the worker-side API key is unset, auth is disabled.
- If the frontend ships a `VITE_SPONSOR_API_KEY`, that value is public.

### Logging and error handling

Observed patterns:
- structured audit logs for request approval, rejection, and errors
- `console.error` for internal failures
- generic client-facing error messages for validation failures

### Tests and deploy scripts

Tests found:
- unit tests for validation rules in `src/__tests__/validation.test.ts`
- no handler-level HTTP tests found in the inspected worker package

Known worker scripts from `workers/sponsor-service/package.json`:
- `npm run dev`
- `npm run deploy`
- `npm test`
- `npm run test:watch`

### Important drift note

The Flappy Frontier local worker files are not a clean upstream snapshot.

Observed local diff summary in the inspected checkout:
- `workers/sponsor-service/src/index.ts` modified
- `workers/sponsor-service/src/validation.ts` modified
- `workers/sponsor-service/src/__tests__/validation.test.ts` modified
- `workers/sponsor-service/wrangler.toml` modified

That diff expands the worker from a narrower Flappy-focused model toward the current multi-app `APP_POLICIES` model used by CivilizationControl. A future copy task should explicitly decide whether to copy from:
- the reviewed local working tree, or
- a clean committed Flappy Frontier revision after those changes are committed upstream

## 4. What should be migrated/copied

### Must copy

These files provide the actual worker runtime and validation baseline:
- `C:/dev/flappy-frontier/workers/sponsor-service/src/index.ts`
- `C:/dev/flappy-frontier/workers/sponsor-service/src/validation.ts`
- `C:/dev/flappy-frontier/workers/sponsor-service/package.json`
- `C:/dev/flappy-frontier/workers/sponsor-service/tsconfig.json`

Why:
- They define the Cloudflare Worker entry point, Sui signing flow, security checks, and package scripts.

### Should copy

These files are valuable starting points but can land as adapted equivalents:
- `C:/dev/flappy-frontier/workers/sponsor-service/src/__tests__/validation.test.ts`
- `C:/dev/flappy-frontier/workers/sponsor-service/wrangler.toml`

Why:
- The tests capture the intended validation model.
- The Wrangler file shows the operational surface: vars, kill switch, secret names, and policy layout.

### Should adapt/rewrite

These paths contain useful patterns but should not be copied verbatim:
- `C:/dev/flappy-frontier/workers/sponsor-service/wrangler.toml`
- `C:/dev/flappy-frontier/workers/sponsor-service/src/__tests__/validation.test.ts`
- `C:/dev/flappy-frontier/docs/architecture/sponsor-handoff-civilizationcontrol.md`

Adaptation reasons:
- worker name, origins, preview-domain handling, and `APP_POLICIES` must become CivilizationControl-owned
- test fixtures currently contain Flappy-specific and placeholder IDs
- the architecture doc is historically useful but partly stale and assumes Flappy ownership

### Should not copy

These files should remain reference-only:
- `C:/dev/flappy-frontier/frontend/src/lib/sponsorship.ts`
- `C:/dev/flappy-frontier/frontend/src/features/auth/hooks/useGameTransaction.ts`
- `C:/dev/flappy-frontier/frontend/.env.example`
- Flappy Frontier app policy entries inside `C:/dev/flappy-frontier/workers/sponsor-service/wrangler.toml`

Why not:
- CivilizationControl already has its own sponsorship client and execution hook.
- Frontend behavior is already implemented in this repo.
- Flappy-specific origins, package IDs, and browser env naming should not be imported blindly.

### Unknown / needs manual decision

These design decisions should be resolved during implementation, not during this planning task:
- keep multi-app policy parsing support or simplify the worker to CivilizationControl-only policy input
- keep optional bearer auth or treat it as a non-secret abuse throttle only
- require `timestamp` on every request or keep replay protection optional
- actively reject disallowed origins server-side or keep CORS-only behavior
- use one worker name plus Wrangler environments, or separate preview/production worker names

## 5. Recommended target structure in CivilizationControl

Recommended ownership structure:

- `workers/sponsor-service/`
- `workers/sponsor-service/src/`
- `workers/sponsor-service/src/index.ts`
- `workers/sponsor-service/src/validation.ts`
- `workers/sponsor-service/src/__tests__/validation.test.ts`
- `workers/sponsor-service/package.json`
- `workers/sponsor-service/tsconfig.json`
- `workers/sponsor-service/wrangler.toml`
- `workers/sponsor-service/README.md`
- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`
- `scripts/validate-sponsor-policy.mjs`
- `docs/operations/sponsor-worker-runbook.md`

Recommendation rationale:
- `workers/sponsor-service/` matches the shape already proven in Flappy Frontier and keeps Worker runtime logic isolated from the frontend app.
- A top-level `workers/` directory fits this repo better than `apps/`, because CivilizationControl is not otherwise organized as an apps monorepo.
- A top-level `config/` directory is the cleanest place for shared, non-frontend, non-worker-specific package and sponsorship policy metadata.
- `scripts/` is already the home for operational validation helpers, so `scripts/validate-sponsor-policy.mjs` fits existing layout.
- `docs/operations/` is the right home for the eventual worker runbook because this is deployment and configuration procedure, not product architecture.

Why not the other evaluated structures:
- `cloudflare/sponsor-worker/`: reads like infra scaffolding, not the owned application package
- `infra/sponsor-worker/`: too infrastructure-centric for logic that needs tests and policy code
- `apps/sponsor-worker/`: implies a broader monorepo shape the repo does not currently have
- `templates/cloudflare/sponsor-worker/`: appropriate for reusable scaffolding, not the live owned implementation

Separate package vs plain Worker source:
- Recommendation: separate package containing plain Worker source
- Reason: the worker needs its own dependency graph, scripts, and Wrangler config without polluting the frontend root package

## 6. Configuration and secrets model

### Committed example/config data

Safe to commit:
- worker source code
- worker tests
- `wrangler.toml` non-secret vars
- declarative allowlist/policy config
- origin allowlist config
- body-size and command-count limits
- `SPONSOR_ENABLED` default behavior
- example frontend env keys in `.env.example`

Recommended committed example surfaces:
- root `.env.example` should keep `VITE_SPONSOR_URL`
- if `VITE_SPONSOR_API_KEY` remains documented, it should stay blank and explicitly marked as public browser config, not a secret
- worker docs should list secret variable names and purposes only

### Cloudflare secrets

Must be Cloudflare secrets in deployed worker environments:
- `SPONSOR_PRIVATE_KEY`

May be a Cloudflare secret if the bearer model is retained:
- `SPONSOR_API_KEY`

Important caveat:
- If a matching API key is also injected into browser `VITE_*` env, it is not a true secret and should not be documented as one.

### Local dev env files

Do not commit:
- `.env`
- `.env.local`
- `.dev.vars`
- exported Worker secrets
- wallet key files or seed material

Planning recommendation:
- document local secret variable names only
- rely on ignored local secret stores for any developer-specific values

### Package allowlist config

Recommendation:
- keep package/module/function allowlists in committed declarative config owned by CivilizationControl
- do not keep the allowlist only in a hand-edited `wrangler.toml` blob without a higher-level source of truth

### Origin allowlist config

Recommendation:
- keep exact production origins and preview-domain suffix rules in committed worker config
- include localhost explicitly for dev
- track preview-domain patterns for CivilizationControl Pages deployments in the same repo as the worker

### Emergency disable flags

Retain the worker kill switch pattern:
- `SPONSOR_ENABLED`

Retain optional deny-list support if still useful:
- `BLOCKED_SENDERS`

### What must never be committed

Never commit:
- actual `SPONSOR_PRIVATE_KEY` values
- actual `SPONSOR_API_KEY` values
- wallet export JSON
- raw key bytes
- mnemonic phrases
- local `.env` or `.dev.vars` files
- pasted `wrangler secret put` values

## 7. Policy/allowlist synchronization model

### Recommended source-of-truth layout

Package and chain metadata source of truth:
- `config/chain/stillness.ts`

Sponsorship policy source of truth:
- `config/sponsorship/civilizationControlPolicy.ts`

Worker consumer:
- `workers/sponsor-service/src/index.ts`
- `workers/sponsor-service/src/validation.ts`

Frontend consumer or verifier:
- `src/constants.ts`
- transaction builders under `src/lib/*Tx.ts`
- `src/hooks/useAuthorizeExtension.ts`

### Data that must stay synchronized

The shared policy model should explicitly track:
- `CC_PACKAGE_ID`
- `CC_ORIGINAL_PACKAGE_ID`
- world runtime package ID
- world original/type-origin package ID
- `EVE_ASSETS_PACKAGE_ID`
- allowed modules and functions per runtime package
- allowed command count ceilings
- request body size ceiling
- exact origin domains
- preview-domain suffixes

Important modeling rule:
- runtime package IDs belong in worker MoveCall allowlists
- original/type-origin IDs belong in type-based read/query consumers and documentation, not in MoveCall allowlists unless a specific worker rule later requires them

### Synchronization mechanism recommendation

Recommended mechanism:
1. Keep the chain/package matrix in `config/chain/stillness.ts`.
2. Keep the sponsorship allowlist in `config/sponsorship/civilizationControlPolicy.ts`.
3. Have the worker consume that declarative policy rather than maintaining a separate manual `APP_POLICIES` blob as the only truth source.
4. Add `scripts/validate-sponsor-policy.mjs` to compare the declarative policy against current frontend transaction-builder targets and known package metadata.

Validation inputs the script should compare:
- `src/constants.ts`
- `contracts/civilization_control/Published.toml`
- `vendor/world-contracts/contracts/world/Published.toml`
- `src/lib/gatePolicyTx.ts`
- `src/lib/gatePermitTx.ts`
- `src/lib/tradePostTx.ts`
- `src/lib/postureSwitchTx.ts`
- `src/lib/structurePowerTx.ts`
- `src/lib/transitProofTx.ts`
- `src/hooks/useAuthorizeExtension.ts`

### Specific recommendation to avoid future handoff-doc drift

Do not keep a freehand allowlist table in docs as the only operational reference.

Instead:
- treat the declarative policy file as the source of truth
- keep docs focused on process and validation
- generate or summarize the current policy from code when documentation needs to show the allowlist

That replaces the current pattern where `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` preserves history while the live code and policy evolve in-repo.

## 8. World v2 readiness implications

Why migration should happen before the world v2 runtime-ID audit:
- the worker allowlist and the frontend runtime targets currently live in different repos
- moving worker ownership first lets the later world v2 task update runtime package IDs, allowlists, docs, and validation in one place
- it avoids doing the package-policy audit once in Flappy Frontier and then again after a copy into CivilizationControl

What world v2 will likely require from the worker later:
- update the world runtime package allowlist if frontend Move calls switch to the Stillness v2 runtime package
- keep world runtime and world original/type-origin IDs modeled separately
- re-run allowlist validation against the actual frontend runtime target

What should not change yet in this task:
- do not change `WORLD_PACKAGE_ID` in frontend runtime code
- do not change sponsor allowlists live
- do not change `CC_PACKAGE_ID`, `CC_ORIGINAL_PACKAGE_ID`, or object IDs
- do not start the world v2 runtime-ID implementation audit here

## 9. Implementation plan

### Phase 1: copy worker source and package skeleton into CivilizationControl

Goal:
- bring the Flappy Frontier worker package into this repo as a starting point

Expected files touched:
- `workers/sponsor-service/package.json`
- `workers/sponsor-service/tsconfig.json`
- `workers/sponsor-service/src/index.ts`
- `workers/sponsor-service/src/validation.ts`
- `workers/sponsor-service/src/__tests__/validation.test.ts`

Validation after phase:
- `git diff --check`
- `cd workers/sponsor-service && npm test`

### Phase 2: adapt package scripts and configuration to CivilizationControl ownership

Goal:
- rename the worker, replace Flappy-specific origins and policy entries, and establish CC-owned policy/config inputs

Expected files touched:
- `workers/sponsor-service/wrangler.toml`
- `workers/sponsor-service/README.md`
- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`
- `scripts/validate-sponsor-policy.mjs`

Validation after phase:
- `git diff --check`
- `cd workers/sponsor-service && npm test`

### Phase 3: wire documentation and env examples

Goal:
- document the new worker ownership and the public frontend env surface

Expected files touched:
- `.env.example`
- `README.md`
- `docs/README.md`
- `docs/operations/sponsor-worker-runbook.md`
- `docs/llm-reference-guide.md`

Validation after phase:
- `git diff --check`
- `npm run typecheck`
- `npm run build`

### Phase 4: local and unit validation

Goal:
- validate the copied worker package and the new policy synchronization checks locally before any deploy

Expected files touched:
- test fixtures or validation script output only if fixes are needed

Validation after phase:
- `cd workers/sponsor-service && npm test`
- `cd workers/sponsor-service && npm run dev`
- `npm run typecheck`
- `npm run build`

### Phase 5: Cloudflare preview deploy

Goal:
- deploy a non-production worker owned by CivilizationControl and verify configuration on preview domains

Expected files touched:
- worker config only if deployment naming or preview config adjustments are required

Validation after phase:
- exact preview deploy command is not yet known from the current repo state
- current source worker only proves `cd workers/sponsor-service && npm run deploy`
- preview naming and environment strategy must be decided during implementation

### Phase 6: update sponsor URL/env and validate sponsored transaction success

Goal:
- point a CivilizationControl preview frontend at the CC-owned preview worker and validate real sponsored traffic

Expected files touched:
- preview environment configuration
- possibly `.env.example` or docs if the env surface changes

Validation after phase:
- `npm run typecheck`
- `npm run build`
- manual preview smoke of one allowed sponsored transaction and one expected fallback case

### Phase 7: later world v2 package policy update

Goal:
- after worker ownership is local, update the world runtime package and worker allowlist together when the separate world v2 task happens

Expected files touched:
- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`
- `src/constants.ts`
- any world runtime consumers found during the dedicated audit

Validation after phase:
- rerun sponsorship policy validation
- rerun frontend typecheck/build
- validate one real sponsored governance PTB against the updated worker allowlist

## 10. Validation plan

### CivilizationControl frontend validation

Known commands:
- `npm run typecheck`
- `npm run build`

### Worker validation

Known commands from the source worker package:
- `cd workers/sponsor-service && npm test`

### Typecheck/build

Known commands today:
- `npm run typecheck`
- `npm run build`

Unknown for now:
- the Flappy Frontier worker package does not currently define a separate `typecheck` script
- if implementation adds one, it should become a required gate

### Local Worker dev

Known command from the source worker package:
- `cd workers/sponsor-service && npm run dev`

### Dry-run or test request

Unknown until the worker package is copied and a CC-owned local fixture/request path exists.

Current caution:
- `scripts/test-sponsor.mjs` in this repo is environment-stale and should not be treated as the canonical migration-validation script without rework.

### Cloudflare preview deploy

Known current source-worker command:
- `cd workers/sponsor-service && npm run deploy`

Unknown until implementation:
- exact preview-worker deploy naming strategy
- exact preview environment command, if different from the default deploy path

### Live sponsorship success and fallback validation

No exact command is available yet from current repo state.

Required future checks:
- verify one allowed sponsored governance transaction succeeds with sponsor gas
- verify a deliberately disallowed or misconfigured path does not silently masquerade as sponsored success
- verify fallback remains standard wallet-paid execution when sponsorship is unavailable

## 11. Risks and non-goals

Key risks:
- secret leakage if private key material or real API tokens are copied into Git
- stale package allowlists after package republish or world runtime changes
- silent fallback hiding sponsor failures from operators
- CORS/origin mistakes, especially preview-domain mismatches
- preview vs production deployment/domain confusion
- world runtime versus type-origin confusion during the future Stillness v2 task
- copying Flappy-specific assumptions that do not belong in CivilizationControl
- basing the migration on a dirty local Flappy checkout without pinning the intended source revision

Non-goals for this task:
- do not implement the worker migration yet
- do not change runtime package IDs yet
- do not change current sponsor allowlists yet
- do not deploy anything yet
- do not start the separate Stillness world v2 runtime-ID audit here

## 12. Recommended next prompt

Recommended next prompt topic:

"Implement phases 1 through 4 from `docs/operations/sponsor-signer-migration-plan-20260427.md`: copy the reviewed Flappy Frontier `workers/sponsor-service/` package into CivilizationControl, adapt it to a CC-owned `workers/sponsor-service/` layout with shared chain/policy config and a policy validation script, update docs and env examples, run local tests/typecheck/build, but do not deploy and do not change world/package IDs yet."