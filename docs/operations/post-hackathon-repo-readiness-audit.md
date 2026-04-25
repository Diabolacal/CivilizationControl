# Post-Hackathon Repo Readiness Audit

Date: 2026-04-25
Branch used for this audit: `docs/post-hackathon-readiness-audit`
Scope: audit/planning only. No stashes were applied or dropped, no submodules were updated, no runtime code was changed, no deploys or Move publishes were run.

## 1. Executive summary

The repo is close to being ready for normal Stillness-focused feature work, but it is not quite ready to resume as-is.

The blockers are operational, not product-architecture blockers:

- The new LLM guide is committed on `docs/llm-reference-guide` and this audit branch, but it is not yet on the base branch `master`.
- GitHub's default/base branch is `master`, while repo instructions and Cloudflare production deploy history repeatedly refer to `main`. That mismatch must be resolved before any production deploy.
- Preserved stashes remain in the parent repo and in `vendor/world-contracts`. They appear to be lockfile/pinning/path-format drift, but they should be kept until a focused cleanup confirms whether they matter.
- Active examples and diagnostics still contain stale Utopia-era IDs, especially `.env.example`, root JSON/text fixtures, and several scripts.
- Baseline validation has not been re-run after the post-hackathon docs work. This audit intentionally did not run build/test gates because the prior dirty state involved Move lockfiles and this task is planning-only.

Minimum cleanup before feature work:

1. Merge/adopt `docs/llm-reference-guide` and this audit onto the base branch.
2. Decide and document the branch naming policy: either standardize the repo on `main`, or update deployment instructions/Cloudflare expectations to match `master`.
3. Keep the preserved stashes until reviewed; do not apply them into a feature branch by accident.
4. Fix or clearly mark active stale Utopia setup files and diagnostics.
5. Run the baseline validation commands in section 7 from a clean base branch.

Defer submodule updates, sponsor-worker changes, package ID changes, and product feature work until the cleanup slice is complete.

## 2. Current git state

Current branch:

- `git status --short --branch` reported `## docs/post-hackathon-readiness-audit` before this document was authored.
- `docs/post-hackathon-readiness-audit` was created from `docs/llm-reference-guide` at commit `4088bea` so this audit can reference `docs/llm-reference-guide.md`.

Default/base branch situation:

- `git remote show origin` reports `HEAD branch: master`.
- `git branch -vv` shows local `master` tracking `origin/master` at `127bc1d`.
- No local or remote `main` branch was present in the command output.
- This conflicts with deployment guidance in `docs/decision-log.md`, `AGENTS.md`, and `.github/copilot-instructions.md`, which use `main` for production deploy protocol.

Recent commit state:

- `git log --oneline --decorate -n 10` shows `4088bea (HEAD -> docs/post-hackathon-readiness-audit, origin/docs/llm-reference-guide, docs/llm-reference-guide) docs: add civilizationcontrol llm reference guide`.
- The previous base branch commit is `127bc1d (origin/master, origin/HEAD, master) fix: Update vote CTA to link directly to project page`.
- Therefore `docs/llm-reference-guide.md` and its `docs/README.md` index entry are committed on `docs/llm-reference-guide` and inherited by this audit branch, but they are not yet on `master`.

Docs branch merge readiness:

- `docs/llm-reference-guide` is clean and pushed to `origin/docs/llm-reference-guide`.
- It contains one documentation commit, `4088bea`, adding `docs/llm-reference-guide.md` and updating `docs/README.md`.
- It is merge-ready as a documentation-only branch, subject to reviewer approval.

Current submodule status:

- `git submodule status --recursive` reported:
  - `vendor/builder-documentation` at `1f7317013ed13e929ba682324d0394f03ce54742`.
  - `vendor/builder-scaffold` at `ebc321a760e3701954e3d445fa92fe881267ea94`.
  - `vendor/evevault` at `3a6e63c64ddeca210fce5b24e74b8db2e64992f0`.
  - `vendor/world-contracts` at `f761a7f61abc770f0ef802d1fba626ed6c48a216`.
- `git -C vendor/world-contracts status --short --branch` reported `## main...origin/main` with no dirty entries.
- `vendor/builder-scaffold`, `vendor/builder-documentation`, and `vendor/evevault` also reported clean `main...origin/main` states.

Parent repo stash inventory:

- `stash@{0}`: `On main: wip before docs llm reference guide (resurfaced non-doc)`. `git stash show --stat 'stash@{0}'` shows `contracts/civilization_control/Move.lock` with 30 insertions.
- `stash@{1}`: `On main: wip before docs llm reference guide`. `git stash show --stat 'stash@{1}'` also shows `contracts/civilization_control/Move.lock` with 30 insertions.
- `stash@{2}`: `WIP on master: 5db5920 docs: Final README corrections for submission`. Normal `git stash show --stat 'stash@{2}'` produced no stat output during this audit.

Parent stash recommendations:

- `stash@{0}` and `stash@{1}`: keep for now; investigate together in a cleanup branch. They look like duplicate or near-duplicate Move.lock testnet pin additions from pre-audit work. Do not apply them into this docs branch.
- `stash@{2}`: keep and investigate before dropping because the stat command produced no visible summary. It may be an old empty/index-only stash or a stash whose useful content requires a fuller inspection.

`vendor/world-contracts` stash inventory:

- `stash@{0}`: `On main: wip before docs llm reference guide (resurfaced)`. Stat: `contracts/world/Move.lock`, 2 insertions and 2 deletions.
- `stash@{1}`: `On main: wip before docs llm reference guide`. Stat: `contracts/assets/Move.lock` and `contracts/world/Move.lock`, 4 insertions and 4 deletions.
- `stash@{2}`: `WIP on (no branch): f761a7f build: add the upgraded pacakge ids (#141)`. Stat: `contracts/extension_examples/Move.lock` and `contracts/world/Move.lock`, 5 insertions and 5 deletions.

Submodule stash recommendations:

- Keep all `vendor/world-contracts` stashes until explicitly reviewed. They appear to be lockfile path/quote drift, but tracked vendor modifications must not be applied or committed from this repo without a separate submodule policy decision.
- No stashes were reported for `vendor/builder-scaffold`, `vendor/builder-documentation`, or `vendor/evevault`.

Ignored/generated state:

- No untracked files were present before this audit document was authored.
- Known ignored/generated folders such as `node_modules/`, `dist/`, `.vite/`, and local `.env` may exist, but they are ignored and were not part of the working tree status.

## 3. Recommended branch/main cleanup sequence

Recommended sequence, not executed in this audit:

1. Leave all stashes untouched.
2. Review and merge `docs/llm-reference-guide` into the base branch first, or merge this audit branch if the team wants both docs commits together. The cleaner review order is guide first, audit second.
3. If merging the guide first, rebase or recreate `docs/post-hackathon-readiness-audit` on the updated base branch before merging this audit.
4. Decide the branch naming policy before any production deploy:
   - Current GitHub default is `master`.
   - Cloudflare production deploy history and agent instructions say production deploys use `--branch main`.
   - Recommended long-term cleanup: standardize on `main` across GitHub, local branches, docs, and Cloudflare. If that is too disruptive, update instructions and Cloudflare settings to consistently use `master`.
5. After docs are merged and branch naming is decided, switch to the chosen base branch and verify:
   - `git status --short --branch`
   - `git submodule status --recursive`
   - `git -C vendor/world-contracts status --short --branch`
6. Run the baseline validation commands in section 7.
7. Only after the base branch is clean and validated, create new feature branches from that base.

Do not use `git reset --hard`, `git clean`, stash drops, or submodule updates as part of this sequence unless explicitly requested in a later cleanup task.

## 4. Stillness-only readiness

Current code truth:

- `src/constants.ts` is Stillness-oriented and contains the active runtime IDs.
- `contracts/civilization_control/Published.toml` records Stillness v1 as the current publish and keeps Utopia v6 as history.
- `README.md` describes the app as deployed on Stillness and lists Stillness IDs.
- `contracts/civilization_control/Move.toml` maps `testnet_internal`, `testnet_utopia`, and `testnet_stillness` to the same Sui testnet chain ID `4c78adac`; world/package IDs distinguish environments.

Must fix before normal feature work:

- `.env.example` labels `VITE_EVE_WORLD_PACKAGE_ID` as Utopia and contains the Utopia world package. Current source does not appear to consume this variable, but it is an active setup file and a trap for future agents.
- The branch/default naming mismatch must be resolved or documented before deploy-related work: Git base is `master`; production deploy guidance says `main`.
- Sponsor allowlist status must be verified before any sponsored/gasless feature work or claims. `src/lib/sponsorship.ts` enables sponsorship with `VITE_SPONSOR_URL`, `src/hooks/useSponsoredExecution.ts` falls back silently, and `docs/operations/stillness-sponsor-worker-handoff.md` says worker policies live outside this repo.

Should fix soon:

- `gate_obj.json`, `playerprofile.json`, and `wallet_objects.txt` contain Utopia-era or mixed object IDs. They are root-level fixtures and should be clearly marked historical, moved under a fixture/archive area, refreshed for Stillness, or removed in a dedicated cleanup.
- `scripts/test-sponsor.mjs`, `scripts/test-turret-targeting.mjs`, and parts of `scripts/record-demo-scenes.mts` contain hardcoded Utopia-era IDs and should not be used for Stillness validation until refreshed.
- `src/lib/tribeCatalog.ts` has stale Utopia wording in comments while active data refresh scripts use Stillness World API endpoints.
- `docs/operations/stillness-sponsor-worker-handoff.md` still contains stale language saying some hooks need sponsorship rerouting, while current hooks such as `src/hooks/useGatePermit.ts`, `src/hooks/useCreateListing.ts`, `src/hooks/useCancelListing.ts`, and `src/hooks/useBuyListing.ts` already use `useSponsoredExecution`.
- `docs/operations/sui-upgrade-type-origin-guide.md` is Utopia-era and marked active. Revisit it before event/indexer/package upgrade work.

Safe historical doc references:

- The Utopia section in `contracts/civilization_control/Published.toml` is intentional publish history.
- Utopia mentions in `README.md` are framed as development history.
- `docs/operations/day1-validation.md`, `docs/operations/hackathon-submission-source.md`, and `docs/operations/operator-validation-checklist.md` are useful historical/runbook artifacts if not treated as current Stillness instructions.

Leave alone because intentionally historical:

- `vendor/*` content. Vendor submodules are upstream references and must remain read-only in this repo.
- Hackathon demo production assets under `docs/demo/` and `recordings/` unless a future demo refresh specifically targets them.
- Utopia migration chronology in `docs/decision-log.md`; decision history should not be rewritten.

## 5. Stillness wipe / ID refresh readiness

Stillness is expected to wipe/reset periodically. A wipe or republish can invalidate package, object, and sponsor allowlist IDs even though the Sui testnet chain ID remains `4c78adac`.

Runtime-critical files likely to need updates after a wipe:

- `src/constants.ts`: `WORLD_PACKAGE_ID`, `CC_PACKAGE_ID`, `CC_ORIGINAL_PACKAGE_ID`, `GATE_CONFIG_ID`, `ENERGY_CONFIG_ID`, `EVE_ASSETS_PACKAGE_ID`, and `EVE_COIN_TYPE`.
- `contracts/civilization_control/Published.toml`: new publish metadata, original/current package IDs, toolchain, and upgrade capability if republished or upgraded.
- `contracts/civilization_control/Move.lock`: may change after Move builds/publishes, but do not accept lockfile churn blindly.
- `src/lib/objectResolver.ts`, `src/lib/currency.ts`, and any transaction/read helpers that import constants.

External or environment-dependent refresh points:

- Sponsor worker `APP_POLICIES` in the external worker repo described by `docs/operations/stillness-sponsor-worker-handoff.md`.
- Cloudflare environment variables such as `VITE_SPONSOR_URL` and optional `VITE_SPONSOR_API_KEY` if the sponsor service changes.
- `.env.example` if it remains an operator-facing setup file.

Documentation-only or evidence refresh points:

- `README.md` Stillness ID table and validation claims.
- `docs/llm-reference-guide.md` runtime ID summary.
- `docs/operations/stillness-sponsor-worker-handoff.md` allowlist tables.
- `docs/operations/migrate-to-stillness.md` only if it is promoted from historical playbook to active runbook; otherwise mark historical.
- `docs/decision-log.md` for any new publish, wipe migration, or production deploy.

Fixtures/scripts needing refresh or quarantine:

- `gate_obj.json`
- `playerprofile.json`
- `wallet_objects.txt`
- `scripts/test-sponsor.mjs`
- `scripts/test-turret-targeting.mjs`
- `scripts/record-demo-scenes.mts`

Validation after a wipe:

1. Confirm target environment with `sui client active-env` and record whether the CLI environment name maps to Stillness.
2. Rebuild and test Move package: `sui move build --path contracts/civilization_control`, then `sui move test --path contracts/civilization_control`.
3. Republish or upgrade only through a dedicated high-risk branch and update `Published.toml`.
4. Refresh `src/constants.ts` and the sponsor allowlist together.
5. Run `npm run typecheck` and `npm run build`.
6. Perform live Stillness validation for wallet discovery, gate policy deployment, gate permit acquisition, TradePost listing/buy/cancel, posture switch, power controls, Signal Feed event parsing, DApp URL metadata update, and sponsor fallback/success behavior.
7. Update `README.md`, `docs/decision-log.md`, and `docs/llm-reference-guide.md` with the new validated state.

## 6. Submodule/vendor readiness

Submodule declarations live in `.gitmodules`.

### `vendor/world-contracts`

- Current pinned SHA: `f761a7f61abc770f0ef802d1fba626ed6c48a216`.
- Local status: clean, `main...origin/main`.
- Recent local log starts at `f761a7f (tag: v0.0.21) build: add the upgraded pacakge ids (#141)`.
- Remote `main` from `git ls-remote`: `db577cf9fd85c2310f6449a1cf42a4a84ba9d20b`.
- Used by: `contracts/civilization_control/Move.toml` depends on local `vendor/world-contracts/contracts/world` and `vendor/world-contracts/contracts/assets`.
- Risk of updating now: high. This submodule controls Move build inputs and world-contract function signatures/package metadata. The remote has newer commits, but this audit did not update or inspect them locally.
- Recommendation: audit first in a separate branch. Do not update as part of general cleanup.

### `vendor/builder-scaffold`

- Current pinned SHA: `ebc321a760e3701954e3d445fa92fe881267ea94`.
- Remote `main` from `git ls-remote`: `ebc321a760e3701954e3d445fa92fe881267ea94`.
- Local status: clean.
- Used by: reference/scaffold patterns and historical validation docs.
- Risk of updating now: low because local and remote match.
- Recommendation: leave pinned.

### `vendor/builder-documentation`

- Current pinned SHA: `1f7317013ed13e929ba682324d0394f03ce54742`.
- Remote `main` from `git ls-remote`: `21a95834281e32d71e0a0c2e69e8fde194436d4e`.
- Local status: clean.
- Used by: official builder documentation reference.
- Risk of updating now: low runtime risk, but it can shift documentation interpretation.
- Recommendation: defer until a documentation/reference refresh branch.

### `vendor/evevault`

- Current pinned SHA: `3a6e63c64ddeca210fce5b24e74b8db2e64992f0`.
- Remote `main` from `git ls-remote`: `266631d6261fcf93d940a25bd84f951a5a31112d`.
- Local status: clean.
- Used by: wallet/Eve Vault reference. The active frontend dependency is `@evefrontier/dapp-kit` from `package.json`, not this submodule directly.
- Risk of updating now: medium. Wallet/auth behavior is product-critical, and remote changes should be audited against installed extension and npm package behavior.
- Recommendation: audit first or defer; do not update during repo cleanup.

## 7. Build/test validation baseline

Recommended baseline commands before feature work resumes:

1. `npm ci` for a reproducible clean install because `package-lock.json` exists. If preserving an existing local `node_modules` workflow, `npm install` is the repo-documented command in `README.md` and `.github/copilot-instructions.md`.
2. `sui client active-env` to confirm the active CLI environment before any Move or chain validation.
3. `sui move build --path contracts/civilization_control`.
4. `sui move test --path contracts/civilization_control`.
5. `npm run typecheck`.
6. `npm run build`.

Notes:

- `package.json` has no `lint` or `test` script.
- Sui CLI is required. `contracts/civilization_control/Published.toml` records toolchain `1.68.1` for the current Stillness publish.
- Move builds depend on initialized `vendor/world-contracts` submodules.
- This audit did not run the optional build/test commands because it is audit-only and the preserved dirty state involved Move lockfiles. Run them in the first cleanup implementation slice from a clean base branch and stop if they modify tracked files.

## 8. Cloudflare/deploy readiness

Current deploy documentation:

- `templates/cloudflare/README.md` documents preview and production deploy patterns using `wrangler pages deploy dist`.
- `templates/cloudflare/wrangler.example.jsonc` is the only Wrangler config found, and it is a template.
- No active root `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc` exists.
- `package.json` has no deploy script and no Wrangler dependency.

Preview deploy expectations:

- Feature branches should deploy to Cloudflare Pages previews only.
- Template pattern: build first, then `wrangler pages deploy dist --project-name <project> --branch <feature-branch>`.
- Preview URLs may be more reliable than branch alias URLs for fresh cache behavior, per `templates/cloudflare/README.md`.

Production deploy protocol:

- Repo instructions say production deploys only come from `main` after merge.
- `docs/decision-log.md` records a real production pitfall: `--branch master` produced Preview deployments because Cloudflare Pages production branch was `main`.
- Current GitHub default is `master`, so production deploys are not readiness-clean until branch naming is reconciled.

Sponsor worker dependency:

- Sponsorship is frontend-configured through `VITE_SPONSOR_URL` and optional `VITE_SPONSOR_API_KEY` in `src/lib/sponsorship.ts`.
- The worker implementation and allowlist are external to this repo, documented in `docs/operations/stillness-sponsor-worker-handoff.md`.
- A stale worker allowlist can be hidden by graceful fallback in `src/hooks/useSponsoredExecution.ts`; verify sponsor success explicitly before claiming gasless operation.

Environment variable risks:

- `.env.example` contains a stale Utopia world package label/value.
- Real `.env` values must not be committed.
- Cloudflare secrets must be managed with Wrangler or dashboard secret mechanisms, not tracked files.

## 9. Documentation cleanup needs

Must update before feature work:

- `docs/README.md`: add this audit entry under Operations. This audit branch includes that index update.
- `.env.example`: change or remove stale Utopia `VITE_EVE_WORLD_PACKAGE_ID` guidance if it remains a setup file.
- Branch/deploy instructions: reconcile `master` Git default with `main` production deploy protocol in `AGENTS.md`, `.github/copilot-instructions.md`, and any deploy runbooks after the branch policy decision is made.

Update during next relevant work:

- `docs/operations/stillness-sponsor-worker-handoff.md`: remove or mark stale hook-reroute TODOs; refresh allowlist status only after checking the external worker.
- `docs/operations/sui-upgrade-type-origin-guide.md`: revisit before package upgrade or event/indexer work.
- `docs/strategy/civilization-control/where-civilizationcontrol-goes-next.md`: it still says Utopia is deployed and Stillness is next; update when roadmap docs are being refreshed.
- `docs/ux/civilizationcontrol-ux-architecture-spec.md`: stale on `Coin<SUI>` vs current `Coin<EVE>` commerce and some responsive assumptions.
- `docs/ux/strategic-network-map-implementation-audit.md` and `docs/core/demo-readiness-tranches.md`: reconcile map zoom/pan implementation status before topology work.
- `docs/core/civilizationcontrol-claim-proof-matrix.md`: refresh with Stillness evidence or mark historical before external claims.

Historical, do not rewrite broadly:

- `docs/decision-log.md`: preserve historical Utopia and hackathon decisions.
- `docs/demo/` and recording/capture docs: retain unless creating a new post-hackathon demo package.
- `docs/operations/day1-validation.md` and `docs/operations/hackathon-submission-source.md`: keep as historical evidence unless a cleanup branch archives or labels them.

Delete/archive candidates, but do not delete in this task:

- Root debug fixtures: `gate_obj.json`, `playerprofile.json`, `wallet_objects.txt`.
- Stale diagnostics: `scripts/test-sponsor.mjs`, `scripts/test-turret-targeting.mjs`, and hardcoded demo scene IDs in `scripts/record-demo-scenes.mts`.
- Only archive/delete after confirming they are not used by current validation or demo workflows.

## 10. Recommended first cleanup implementation slice

Recommended first slice: `docs/normalize-post-hackathon-base`.

Goal: make the base branch safe for future Stillness feature work without touching runtime code.

Likely steps:

1. Merge or cherry-pick `docs/llm-reference-guide` and `docs/post-hackathon-readiness-audit` onto the chosen base branch.
2. Decide branch naming policy with the operator: standardize on `main` or keep `master` and update deploy docs accordingly.
3. Update `.env.example` to remove Utopia as an active setup default, or clearly mark the world package value as historical/unused if the app no longer consumes it.
4. Add a short note to `docs/operations/migrate-to-stillness.md` or `docs/README.md` identifying older migration docs as historical when appropriate.
5. Run baseline validation from section 7.
6. Produce a short decision log entry if branch naming or environment setup docs change.

Files likely touched:

- `docs/llm-reference-guide.md`
- `docs/operations/post-hackathon-repo-readiness-audit.md`
- `docs/README.md`
- `.env.example`
- Possibly `AGENTS.md`, `.github/copilot-instructions.md`, or deploy docs only after a branch naming decision.

Expected output:

- A clean base branch with current Stillness reference docs.
- No runtime code changes.
- No stash drops.
- No vendor changes.
- Baseline validation results recorded in the final response or `docs/decision-log.md` if behavior/process changed.

## 11. Risks and non-goals

Do not do these yet:

- Do not start new product features.
- Do not change package IDs, world IDs, object IDs, or sponsor allowlists without a Stillness validation/publish task.
- Do not update submodules without a separate submodule audit branch, especially `vendor/world-contracts`.
- Do not apply or drop stashes until a focused cleanup inspects exact diffs and confirms they are redundant or useful.
- Do not modify `vendor/*` tracked contents.
- Do not change Cloudflare configuration or production deploy settings from this repo without a coordinated deploy task.
- Do not production deploy until branch naming, base branch cleanliness, and baseline validation are settled.
- Do not claim live Stillness validation for README capabilities unless those flows are actually run and recorded.
- Do not treat old Utopia docs as automatically wrong when they are clearly historical; do treat active examples/scripts/config as cleanup candidates.

## 12. Final recommendation

Ask the next agent to do this, in order:

1. Merge the LLM reference guide and this audit into the base branch, preserving a clean docs-only history.
2. Resolve the `master` vs `main` branch policy before any deployment work.
3. Inspect, summarize, and either retain or safely drop the preserved parent and `vendor/world-contracts` stashes in a dedicated cleanup branch; do not apply them blindly.
4. Fix active stale Utopia setup files, starting with `.env.example`, and quarantine or label root fixtures/scripts that contain Utopia IDs.
5. Run the baseline validation commands: `npm ci` or `npm install`, `sui client active-env`, `sui move build --path contracts/civilization_control`, `sui move test --path contracts/civilization_control`, `npm run typecheck`, and `npm run build`.
6. Verify the external sponsor worker allowlist against current Stillness IDs before any gasless UX claims or sponsor-dependent roadmap work.
7. Create new feature branches only after the base branch is clean, branch policy is clear, stashes are understood, and baseline validation passes.