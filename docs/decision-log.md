## Decision Log

Newest first. Use the template in `docs/operations/DECISIONS_TEMPLATE.md`.

---

## 2026-05-01 – Clarify network node icon taxonomy precision pass
- Goal: Make one final precision pass on the network-node icon plan so turret handling, amber state doctrine, shelter geometry, and SVG acceptance criteria are internally consistent before any implementation branch starts.
- Files: `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`, `docs/decision-log.md`
- Diff: docs-only precision refinement of the existing plan
- Risk: low — planning/docs only, no runtime/package/deploy/vendor/submodule changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: removed unsupported Smart Turret icon treatment, tightened amber to reserved warning/defense usage, clarified shelters as a rounded/vaulted hangar family, and added explicit SVG icon acceptance criteria for the icon-catalogue/static-preview branch.
- Follow-ups: merge the finalized planning branch to `master`, then open the dedicated icon-catalogue implementation branch for the static icon/legend preview work.

## 2026-05-01 – Refine network node icon plan after user review
- Goal: Refine the network-node posture planning document so iconography, badge grammar, and legend requirements are locked before any drilldown-shell implementation work.
- Files: `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`, `docs/decision-log.md`
- Diff: docs-only refinement of the existing plan
- Risk: low — planning/docs only, no runtime/package/deploy/vendor/submodule changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: reclassified families into first-wave, provisional-but-important, and deferred groups; promoted Shelter / Heavy Shelter into an explicit provisional hangar family; deferred field variants; added compact legend requirements; and changed the next implementation slice from drilldown-shell-first to icon-catalogue-first.
- Follow-ups: merge the refined planning branch to `master`, then start a dedicated implementation branch for the icon catalogue/components and static icon/legend preview.

## 2026-05-01 – Plan network node posture icons
- Goal: Produce an implementation-ready planning document for network-node-level structure icons and node-local posture drilldown without changing runtime code, sponsorship, package IDs, Move contracts, or vendor state.
- Files: `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only planning memo, docs index update, and decision-log note
- Risk: low — planning/docs only, no runtime/package/deploy/vendor/submodule changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: catalogued the current macro-map constraints, enumerated the strong-set and provisional node-connected structure families, defined a future icon taxonomy and calm node-drilldown UX, and proposed a narrow phased implementation path anchored to the existing `/nodes/:id` route and direct-chain authority.
- Follow-ups: hand the recommended first implementation slice to a separate feature branch without changing strategic-map behavior or write paths in the same prompt.

## 2026-05-01 – Review VS Code 1.118 workspace tooling
- Goal: Review official VS Code 1.118 release notes against the current CivilizationControl VS Code/Copilot workflow, apply only safe repo-level tooling changes, and document manual guidance for prompt/instruction analysis without touching runtime code.
- Files: `.vscode/extensions.json`, `docs/operations/vscode-1-118-tooling-review-20260501.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs plus one workspace extension recommendation
- Risk: low — no runtime/package/deploy/vendor/MCP/settings behavior changes; extension recommendations and documentation only
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: added `ms-vscode.vscode-chat-customizations-evaluations` to workspace recommendations, documented the supported Analyze workflow for repo prompt and instruction files, and classified the main 1.118 features as repo-level, user-level, optional/manual, or deferred.
- Follow-ups: if desired, do a separate customization-maintenance branch to modernize repo `SKILL.md` metadata before considering 1.118 skill-context features.

## 2026-04-29 – Review local VS Code tooling
- Goal: Create a tracked, read-only audit of the local VS Code, Copilot, MCP, extension, and CLI/tooling environment for CivilizationControl without changing settings, extensions, MCP config, or runtime code.
- Files: `docs/operations/local-vscode-tooling-review-20260429.md`, `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/decision-log.md`, `docs/README.md`
- Diff: docs-only local-tooling review and follow-up notes
- Risk: low — documentation only, no runtime/package/settings/vendor/submodule changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: recorded the current workspace settings, installed extensions, MCP visibility, browser-tool overlap, Autopilot/token-noise risks, and local CLI/toolchain drift; confirmed that nothing was changed locally; and documented the next decisions as manual reviews or later dedicated branches.
- Follow-ups: decide whether to do a dedicated workspace-settings cleanup branch, a manual global-extension cleanup pass, and a separate runtime-pinning/toolchain-policy branch.

## 2026-04-29 – Retire stale bootstrap prompt
- Goal: Remove the misleading scaffold-era bootstrap prompt from the active repo prompt surface without changing runtime code or VS Code settings.
- Files: `.github/prompts/archive/vibe-bootstrap.prompt.md`, `docs/README.md`, `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/decision-log.md`
- Diff: prompt archival banner plus small docs/index cleanup
- Risk: low — prompt/docs only, no runtime/package/settings/vendor/submodule changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: archived `vibe-bootstrap.prompt.md` under `.github/prompts/archive/`, added a banner telling agents not to use it for CivilizationControl work, kept the active prompt surface limited to `plan.prompt.md` and `rehydrate.prompt.md`, and updated the live docs to stop presenting the bootstrap prompt as active.
- Follow-ups: keep the local VS Code/tooling review separate from prompt cleanup; consider pruning archived prompt files later only if preserving the historical prompt surface stops being useful.

## 2026-04-29 – Standardize prompt path guidance
- Goal: Make the reusable repo prompt surface easier to find by moving the hidden local planning prompt into the shared `.github/prompts/` path and updating the live guidance that points people at prompt files.
- Files: `.github/prompts/plan.prompt.md`, `AGENTS.md`, `GITHUB-COPILOT.md`, `llms.txt`, `docs/README.md`, `docs/core/hackathon-repo-conventions.md`, `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/decision-log.md`
- Diff: docs and prompt-surface cleanup only
- Risk: low — prompt/docs only, no runtime/package/settings/vendor/submodule changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: moved `plan.prompt.md` from `.vscode/prompts/` to `.github/prompts/`, rewrote it as a concise planning-only prompt that defers to canonical repo instructions, surfaced `.github/prompts/` in the live orientation docs, and stopped treating `.vscode/prompts/` as a shared repo prompt surface.
- Follow-ups: stale bootstrap-prompt handling now lives in the later retirement pass; keep local VS Code/tooling review separate.

## 2026-04-29 – Archive stale authority docs
- Goal: Reduce agent and maintainer context noise by moving high-confidence stale March-era and superseded docs out of the live authority chain while keeping historical evidence and current runbooks easy to find.
- Files: `README.md`, `docs/README.md`, `docs/core/spec.md`, `docs/core/validation.md`, `docs/llm-reference-guide.md`, `docs/analysis/assumption-registry-and-demo-fragility-audit.md`, `docs/architecture/read-provider-abstraction.md`, `docs/architecture/sui-playground-capabilities.md`, `docs/ux/civilizationcontrol-ux-architecture-spec.md`, `docs/ptb/README.md`, `docs/ptb/ptb-patterns.md`, `docs/strategy/civilization-control/civilizationcontrol-strategy-memo.md`, `docs/core/hackathon-repo-conventions.md`, `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md`, `docs/operations/submodule-refresh-prompt.md`, `docs/operations/mvr-world-package-audit-20260429.md`, `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/operations/stale-docs-archive-20260429.md`, `docs/archive/hackathon-2026/core/march-11-reimplementation-checklist.md`, `docs/archive/hackathon-2026/core/day1-checklist.md`, `docs/archive/hackathon-2026/core/CARRY_FORWARD_INDEX.md`, `docs/archive/hackathon-2026/core/civilizationcontrol-implementation-plan.md`, `docs/archive/hackathon-2026/analysis/must-work-claim-registry.md`, `docs/archive/hackathon-2026/operations/migrate-to-stillness.md`, `docs/archive/hackathon-2026/operations/efmap-indexer-awareness-20260428.md`, `docs/archive/hackathon-2026/operations/post-hackathon-repo-readiness-audit.md`, `docs/archive/hackathon-2026/operations/submodule-refresh-20260425.md`, `docs/archive/hackathon-2026/operations/documentation-consolidation-20260428.md`, `docs/decision-log.md`
- Diff: docs-only archive move, authority-chain retargeting, historical banners, and archive summary note
- Risk: low — documentation only, no runtime/package/deploy/settings/vendor changes staged from this task
- Gates: diff-check ✅ typecheck ✅ build ✅ sanity grep ✅
- Result: moved ten high-confidence stale docs into `docs/archive/hackathon-2026`, added short historical banners to the moved docs plus status/history notes on `docs/core/spec.md`, `docs/core/validation.md`, and the EF-Map replacement plan, rewired active references to either the new archive locations or current authority docs, rewrote `docs/README.md` so active operations and historical material are separated, and added `docs/operations/stale-docs-archive-20260429.md` as the cleanup report.
- Follow-ups: the whole-repo `git diff --check` and changed-files sanity pass still surface an unrelated unstaged `contracts/civilization_control/Move.lock` diff/warning outside this docs-only change set; leave it to the owner task unless a later repo-state cleanup explicitly claims it again.

## 2026-04-29 – Record repo state cleanup
- Goal: Return the repo to a cleaner post-merge baseline without changing runtime code by resolving safe generated submodule lockfile churn and deleting only fully merged stale branches.
- Files: `docs/decision-log.md`
- Diff: docs-only cleanup record
- Risk: low — no runtime/package/deploy/settings changes; vendor source left untouched and unstaged
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: classified `vendor/world-contracts/contracts/world/Move.lock` as safe generated churn caused by Windows-style path rewriting, backed up the exact diff to `C:/dev/CivilizationControl-world-contracts-Move-lock-dirt-20260429.patch`, restored the submodule worktree file to clean, deleted the fully merged `docs/world-v2-runtime-migration-plan` branch locally and on origin, preserved `feat/stillness-migration` because it still has unique commits ahead of `master`, and preserved `hackathon`.
- Follow-ups: use `docs/operations/agent-environment-and-guidance-audit-20260429.md` as the candidate list for the next stale docs/archive pass.

## 2026-04-29 – Clarify deploy and secret guidance
- Goal: Refresh repo-local deploy guidance, Cloudflare template wording, and secret-handling instructions so future agents distinguish public `VITE_*` config from Wrangler or Worker secrets without changing runtime code, deploy state, settings, or vendor state.
- Files: `.github/skills/deploy/SKILL.md`, `.github/skills/docker-ops/SKILL.md`, `.github/instructions/deployment.instructions.md`, `.github/copilot-instructions.md`, `templates/cloudflare/README.md`, `.env.example`, `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/decision-log.md`
- Diff: docs and instructions only
- Risk: low — wording and template guidance only, no runtime/package/deploy/settings/vendor changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: aligned the deploy skill with repo-root preview and production rules, clarified that `VITE_*` values are public browser config, tightened the Cloudflare template so `pages secret put` is documented without a stale `--branch` flag, added a small non-authoritative disclaimer to the generic Docker skill, recorded the Cloudflare docs recheck in the audit trail, and kept the existing large-chunk frontend build warning as unchanged non-blocking build output.
- Follow-ups: later decide whether to refresh `templates/cloudflare/env.example`, `README.md`, and `docs/llm-reference-guide.md` in a broader docs cleanup pass.

## 2026-04-29 – Refresh repo-local agent guidance instructions
- Goal: Refresh the repo-local instruction layer so future VS Code/Copilot agents start from current project truth and clearer guardrails without changing runtime code, settings, tooling, vendor state, or deploy state.
- Files: `AGENTS.md`, `GITHUB-COPILOT.md`, `llms.txt`, `.github/copilot-instructions.md`, `.github/instructions/design.instructions.md`, `.github/instructions/deployment.instructions.md`, `.github/instructions/shared-backend.instructions.md`, `.github/instructions/move.instructions.md`, `.github/instructions/typescript-react.instructions.md`, `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/decision-log.md`
- Diff: docs/instructions-only refresh plus follow-up audit note
- Risk: low — guidance and documentation only, no runtime/package/sponsor/deploy/settings/vendor changes
- Gates: diff-check ✅ typecheck ✅ build ✅ sanity grep ✅
- Result: shortened the pointer surfaces, refreshed the canonical repo-wide instructions with current live architecture and guardrails, added focused design/deployment/shared-backend instruction files, kept Sui TypeScript guidance in the existing TS/React instruction file for now, and verified that stale strings only remain where they are explicitly called out as banned or historical values to avoid.
- Follow-ups: refresh the deploy skill, decide on prompt-file location cleanup, and handle archive/tool-cleanup follow-ups on separate branches.

## 2026-04-29 – Audit agent environment and guidance
- Goal: Create a planning-only tracked audit of repo guidance files, local VS Code/Copilot/tooling surfaces, documentation sprawl, security guidance, and follow-up implementation tasks without changing runtime code, worker code, deploy state, vendor files, settings, or local tooling.
- Files: `docs/operations/agent-environment-and-guidance-audit-20260429.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only audit, docs index update, and decision-log entry
- Risk: low — documentation only, no runtime/package/sponsor/deploy/vendor/settings changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: recorded a single current-state audit covering repo instruction quality, live-vs-stale guidance drift, design-guidance discoverability, local VS Code/Copilot and extension inventory, MCP/browser-tool overlap, secret-handling guidance, documentation sprawl, and recommended follow-up branches, then validated the repo with `git diff --check`, `npm run typecheck`, and `npm run build`.
- Follow-ups: use this audit as the implementation brief for later instruction refresh, design-guidance consolidation, workspace-tool review, archive pass, and tooling-policy branches.

## 2026-04-29 – Record shared-backend enrichment production cutover
- Goal: Merge `feat/shared-backend-assembly-enrichment` into `master`, push `origin/master`, deploy the production frontend with explicit public sponsor/shared-backend overrides, and record live bundle plus browser-origin endpoint proof without changing sponsor worker code, package IDs, Move code, or write paths.
- Files: `docs/operations/shared-backend-assembly-enrichment-20260429.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: production deploy evidence and current-truth documentation updates
- Risk: medium — production Pages deploy plus docs updates, but no runtime code change, no worker policy change, no package ID change, no Move change, and no vendor edit
- Gates: active-env ✅ typecheck ✅ build ✅ world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ production deploy ✅ production bundle proof ✅ production browser fetch proof ✅
- Result: fast-forwarded `master` to `d1eea24745e58ec53222011ad4ab47c6aabb3545`, pushed `origin/master`, rebuilt from the repo root with explicit `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, `VITE_SHARED_BACKEND_URL=https://ef-map.com`, and blank `VITE_SPONSOR_API_KEY`, deployed Pages production on branch `main` to `https://1c96b5a7.civilizationcontrol.pages.dev`, verified that `https://civilizationcontrol.com` and `https://civilizationcontrol.pages.dev` now serve `index-CGzlLlzq.js`, verified that the live asset contains `https://ef-map.com` and `civilizationcontrol-sponsor` and contains neither `flappy-frontier-sponsor` nor `ASSEMBLY_API_TOKEN`, and confirmed from both public browser origins that live `fetch()` calls to `/api/civilization-control/assemblies` returned readable `200` CORS JSON envelopes.
- Follow-ups: if desired, capture a manual wallet-driven production smoke for this slice, then delete `feat/shared-backend-assembly-enrichment` locally and on origin after confirming no remaining branch-only commits.

## 2026-04-29 – Record shared-backend enrichment preview smoke
- Goal: Record the user-confirmed manual preview smoke for `feat/shared-backend-assembly-enrichment` after the sponsor URL correction without changing runtime code, sponsor config, package IDs, or deploy targets.
- Files: `docs/operations/shared-backend-assembly-enrichment-20260429.md`, `docs/decision-log.md`
- Diff: docs-only preview smoke evidence update
- Risk: low — documentation only, no code, worker, package, vendor, or deploy changes
- Gates: corrected preview bundle proof ✅ browser-origin endpoint proof ✅ user manual preview smoke ✅
- Result: the user manually tested `https://e9308288.civilizationcontrol.pages.dev`, confirmed wallet connection, observed `civilization-control/assemblies` activity in DevTools Network, confirmed sponsor traffic used `civilizationcontrol-sponsor`, did not observe `flappy-frontier-sponsor`, and confirmed that minimal visible UI change remains expected for this additive fallback-only slice. Production had not yet been deployed from this branch at the time of the preview smoke.
- Follow-ups: rerun the branch validation gates, merge to `master`, deploy production with explicit public env overrides, and then verify the served production bundle.

## 2026-04-29 – Revalidate shared-backend enrichment preview build
- Goal: Harden the `feat/shared-backend-assembly-enrichment` preview, confirm the shared-backend browser request path, and correct any stale sponsor URL embedded in the preview bundle without touching production, sponsor worker code, allowlists, package IDs, or Move contracts.
- Files: `docs/operations/shared-backend-assembly-enrichment-20260429.md`, `docs/decision-log.md`
- Diff: docs-only validation evidence plus preview redeploy record
- Risk: low — preview-only Pages redeploy and docs update, no code, worker policy, package, vendor, or production changes
- Gates: typecheck ✅ build ✅ world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ diff-check ✅ preview redeploy ✅ browser-origin endpoint check ✅
- Result: found that the first preview alias still served `index-COLKeVim.js` with `flappy-frontier-sponsor` because the local untracked `.env` still set `VITE_SPONSOR_URL` to the old worker; rebuilt with explicit public overrides for `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `VITE_SHARED_BACKEND_URL=https://ef-map.com`; redeployed preview to `https://e9308288.civilizationcontrol.pages.dev` with alias `https://feat-shared-backend-assembly.civilizationcontrol.pages.dev`; verified both served `index-CGzlLlzq.js`; confirmed the served bundle contains `civilizationcontrol-sponsor`, contains `https://ef-map.com`, contains no `flappy-frontier-sponsor`, contains no `ASSEMBLY_API_TOKEN`, and the browser-origin request to `/api/civilization-control/assemblies` returned `200` with no `Authorization` or `X-API-Key` header.
- Follow-ups: perform one wallet-connected human smoke on the corrected preview if desired, then merge to `master` when satisfied.

## 2026-04-29 – Enrich structures from shared backend summaries
- Goal: Consume the production shared-backend assembly summary endpoint from CivilizationControl as an additive read-path enhancement while preserving the existing direct Sui discovery and all authority/write behavior.
- Files: `src/types/domain.ts`, `src/lib/suiReader.ts`, `src/lib/assemblySummaryClient.ts`, `src/lib/assemblyEnrichment.ts`, `src/hooks/useAssemblySummaryEnrichment.ts`, `src/hooks/useAssetDiscovery.ts`, `src/components/StructureDetailHeader.tsx`, `src/screens/GateListScreen.tsx`, `src/screens/NetworkNodeListScreen.tsx`, `src/screens/TradePostListScreen.tsx`, `src/screens/TurretListScreen.tsx`, `src/vite-env.d.ts`, `docs/operations/shared-backend-assembly-enrichment-20260429.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`, `docs/README.md`
- Diff: additive shared-backend client, optional structure enrichment, minimal location fallback, and docs
- Risk: medium — new browser read-path integration, but no write-path, sponsorship, package ID, Move, or vendor changes
- Gates: typecheck ✅ build ✅ world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ diff-check ✅ preview browser request ✅
- Result: derived decimal `assemblyId` from each structure's on-chain `TenantItemId`, added a browser-safe client for `https://ef-map.com/api/civilization-control/assemblies`, chunked and validated requests defensively, merged shared-backend summaries only after direct-chain discovery, preserved direct-chain fallback on missing/failed backend responses, and limited visible UI use to safe name/location fallback surfaces.
- Follow-ups: if desired, do one wallet-connected smoke on the corrected preview branch alias before merging, then consider later additive slices such as network-node summaries or filtered recent-activity enrichment.

## 2026-04-29 – Record world v2 production smoke success
- Goal: Record the operator-confirmed manual production smoke result after the World v2 runtime cutover without changing runtime code, package IDs, sponsor policy, or deploy state.
- Files: `docs/operations/world-v2-runtime-preview-validation-20260429.md`, `docs/operations/world-v2-runtime-migration-plan-20260429.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: targeted documentation update only
- Risk: low — documentation only, no runtime/package/sponsor/deploy changes
- Gates: operator production smoke ✅ digest unavailable-but-not-invented ✅
- Result: recorded that a wallet-driven production transaction succeeded after the World v2 frontend cutover, sponsor wallet payment was observed, fallback-to-player-paid was not observed, no digest was provided so none is recorded, and the temporary old World runtime allowlist remains in place during soak.
- Follow-ups: after soak, remove the temporary old World runtime allowlist only after confirming no live frontend bundle still targets it; capture a future digest if one becomes available.

## 2026-04-29 – Record world v2 production cutover
- Goal: Merge the validated World v2 runtime branch into `master`, push `origin/master`, deploy the production frontend with the repo-owned sponsor worker URL explicitly overridden at build time, and record bundle/CORS proof without performing a live wallet transaction from the agent.
- Files: `docs/operations/world-v2-runtime-preview-validation-20260429.md`, `docs/operations/world-v2-runtime-migration-plan-20260429.md`, `docs/operations/mvr-world-package-audit-20260429.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: production cutover evidence and current-truth documentation updates
- Risk: medium — production Pages deploy plus docs updates, but no Move dependency change, no vendor edit, no contract publish, no original/type-origin change, and no worker removal of old-runtime support
- Gates: world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ typecheck ✅ build ✅ production deploy ✅ production bundle proof ✅ production CORS proof ✅
- Result: fast-forwarded `master` to `feat/world-v2-runtime-preview`, pushed `origin/master`, deployed Pages production on branch `main` from commit `ebc052d91d93ef545a95f7decf81de49a3740721` to `https://7f8cbcd7.civilizationcontrol.pages.dev`, verified that `https://civilizationcontrol.com` and `https://civilizationcontrol.pages.dev` now serve `index-MUH2Qmi3.js`, verified that the served asset contains World v2 runtime `0xd2fd1224...`, preserves world original/type-origin `0x28b497...`, uses `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, and contains no `flappy-frontier-sponsor` reference, and confirmed worker CORS `204` responses for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, and `https://civilizationcontrol.pages.dev`.
- Follow-ups: capture the manual production wallet smoke, including digest if available, then decide when the temporary old-runtime sponsor allowlist entry can be removed in a separate soak-exit task.

## 2026-04-29 – Record world v2 preview smoke success
- Goal: Record the operator-confirmed preview smoke result for the World v2 runtime experiment before merge and production frontend cutover.
- Files: `docs/operations/world-v2-runtime-preview-validation-20260429.md`, `docs/operations/world-v2-runtime-migration-plan-20260429.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: targeted documentation update only
- Risk: low — documentation only, no runtime, sponsor policy, worker config, Move dependency, vendor, or deploy changes
- Gates: operator preview smoke ✅ digest unavailable-but-not-invented ✅
- Result: recorded that the preview deployment was manually tested with a real wallet, the wallet-driven action succeeded, sponsor wallet payment was observed, fallback-to-player-paid was not observed, no digest was captured in current local docs or transcript, and production frontend had not yet been deployed at the time of smoke.
- Follow-ups: validate the branch, merge to `master`, deploy the production frontend with explicit `VITE_SPONSOR_URL`, verify the served bundle, and then capture a later production manual smoke separately.

## 2026-04-29 – Run world v2 runtime preview experiment
- Goal: Implement the preview-only World v2 runtime migration experiment on `feat/world-v2-runtime-preview`, keep original/type-origin handling pinned to the old Stillness lineage, preserve old-runtime sponsorship compatibility on the shared worker, deploy preview only, and stop before any production cutover.
- Files: `src/constants.ts`, `config/chain/stillness.ts`, `config/sponsorship/civilizationControlPolicy.ts`, `workers/sponsor-service/wrangler.toml`, `workers/sponsor-service/src/__tests__/validation.test.ts`, `scripts/validate-sponsor-policy.mjs`, `scripts/check-world-mvr-drift.mjs`, `docs/operations/world-v2-runtime-preview-validation-20260429.md`, `docs/operations/sponsor-worker-runbook.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: runtime/policy alignment for preview plus preview deploy evidence and rollback/smoke documentation
- Risk: medium — shared worker redeploy and preview frontend deploy, but no production frontend deploy, no Move dependency change, no vendor edit, no contract publish, and no change to original/type-origin surfaces
- Gates: active-env ✅ world:mvr:check ✅ world:mvr:strict ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ typecheck ✅ build ✅
- Result: moved frontend runtime targets to World v2 `0xd2fd1224...` while keeping `WORLD_ORIGINAL_PACKAGE_ID` on `0x28b497...`, updated sponsor policy/wrangler/tests/validators to accept both world runtimes plus CC, redeployed `civilizationcontrol-sponsor` as version `82c2ef52-aad8-4f8d-8ee8-a7bcf118acd1`, rebuilt preview with explicit `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, deployed preview to `https://1fa70e47.civilizationcontrol.pages.dev` with alias `https://feat-world-v2-runtime-previe.civilizationcontrol.pages.dev`, and verified CORS plus bundle proof.
- Follow-ups: run the real preview sponsored smoke, capture digest and gas-payer proof, verify Recent Signals against raw events, and only then consider any production rollout.

## 2026-04-29 – Plan world v2 runtime migration
- Goal: Produce a planning-only World v2 runtime migration document that identifies the exact runtime-target surfaces, preserved original/type-origin surfaces, sponsorship requirements, preview proof, and rollback path without executing any migration.
- Files: `docs/operations/world-v2-runtime-migration-plan-20260429.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/operations/mvr-world-package-audit-20260429.md`, `docs/decision-log.md`
- Diff: new planning document plus minimal docs index and future-agent context updates
- Risk: low — documentation only, no runtime package, sponsor policy, worker config, Move dependency, vendor, or deploy changes
- Gates: world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict expected-fail ✅ typecheck ✅ build ✅ diff-check ✅
- Result: captured the current World v2 migration state, identified direct runtime-target files versus preserved original/type-origin surfaces, documented sponsorship and signal-feed proof requirements, and recommended a narrow preview experiment before any production cutover.
- Follow-ups: a future implementation branch should use this plan as the source of truth and should not change `WORLD_ORIGINAL_PACKAGE_ID` without explicit lineage evidence.

## 2026-04-29 – Update world v2 migration next step
- Goal: Correct the stale follow-up guidance in the MVR world package audit now that Phase 2 runtime/original split work is already complete.
- Files: `docs/operations/mvr-world-package-audit-20260429.md`, `docs/decision-log.md`
- Diff: docs-only correction of the recommended next prompt
- Risk: low — documentation only, no runtime, sponsor policy, worker config, Move dependency, vendor, or deploy changes
- Gates: world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict expected-fail ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ typecheck ✅ build ✅ diff-check ✅
- Result: replaced the stale “implement Phase 2” prompt with a planning-only World v2 runtime migration prompt that keeps original/type-origin handling explicit, requires aligned runtime-surface updates, and calls for preview smoke validation before any production cutover.
- Follow-ups: merge this docs correction together with the Phase 2 branch so the next task starts from a planning-only World v2 migration brief rather than already-completed Phase 2 work.

## 2026-04-29 – Split world runtime and original package IDs
- Goal: Implement the app-layer Phase 2 split between world runtime targets and original/type-origin surfaces without changing live behavior, sponsor allowlists, Move dependencies, vendor files, or deployments.
- Files: `src/constants.ts`, `src/lib/gatePolicyTx.ts`, `src/lib/postureSwitchTx.ts`, `src/lib/structurePowerTx.ts`, `src/hooks/useAuthorizeExtension.ts`, `src/lib/suiReader.ts`, `src/lib/eventParser.ts`, `src/lib/objectResolver.ts`, `scripts/check-world-mvr-drift.mjs`, `scripts/validate-sponsor-policy.mjs`, `docs/operations/world-runtime-original-split-20260429.md`, `docs/operations/mvr-world-package-audit-20260429.md`, `docs/llm-reference-guide.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: explicit world runtime/original split across app call sites and validation scripts, plus targeted documentation updates
- Risk: medium — multi-file refactor across PTB builders, read/event helpers, and validation scripts, but with no package value changes and no sponsor or deployment changes
- Gates: world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict expected-fail ✅ sponsor:validate-policy ✅ sponsor:test ✅ sponsor:typecheck ✅ typecheck ✅ build ✅ diff-check ✅
- Result: `src/constants.ts` now exposes `WORLD_RUNTIME_PACKAGE_ID` and `WORLD_ORIGINAL_PACKAGE_ID`, runtime MoveCall targets and world `MoveModule` queries use the runtime constant, type strings and exact event/type-origin surfaces use the original constant, and both supporting validation scripts now report and validate the split explicitly while the repo remains intentionally pinned to the current Stillness world package.
- Follow-ups: a future World v2 migration branch should change only runtime-target surfaces, sponsor allowlists, and validation expectations together, while keeping original/type-origin surfaces pinned unless the defining lineage actually changes.

## 2026-04-29 – Fix world package drift workflow submodule checkout
- Goal: Fix the GitHub Actions world-package drift check after the first manual run failed on the runner because `vendor/world-contracts/contracts/world/Published.toml` was unavailable, and harden the script so missing required vendor metadata reports a clear actionable error instead of a generic internal `ENOENT`.
- Files: `.github/workflows/world-package-drift.yml`, `scripts/check-world-mvr-drift.mjs`, `docs/operations/mvr-world-package-audit-20260429.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: workflow checkout fix plus script error-hardening and targeted docs updates
- Risk: low — CI/workflow fix only, no runtime package-ID, sponsor allowlist, Move dependency, vendor, or deploy changes
- Gates: world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict expected-fail ✅ diff-check ✅ typecheck ✅ build ✅
- Result: changed the workflow checkout step to recursive submodules so vendored world metadata is available in GitHub Actions, and changed the drift checker to emit `MISSING_REQUIRED_FILE` with CI/local remediation guidance when required local files are absent.
- Follow-ups: rerun the GitHub Actions workflow from this branch or after merge to confirm the runner now reaches the expected known-drift report instead of failing before vendor metadata is loaded.

## 2026-04-29 – Add world package drift automation
- Goal: Add a read-only Phase 1 drift-check alarm for `@evefrontier/world` that verifies repo-internal package consistency, detects unexpected vendor/MVR baseline drift, and keeps the current known Stillness v1-versus-v2 migration gap warning-only until a deliberate World v2 migration branch.
- Files: `config/chain/worldMvrBaseline.json`, `scripts/check-world-mvr-drift.mjs`, `.github/workflows/world-package-drift.yml`, `package.json`, `docs/operations/mvr-world-package-audit-20260429.md`, `docs/llm-reference-guide.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: new read-only baseline/script/workflow plus targeted docs updates
- Risk: medium — new repo automation and CI workflow, but no runtime package-ID, sponsor allowlist, Move dependency, vendor, or deploy changes
- Gates: world:mvr:check ✅ world:mvr:ci ✅ world:mvr:strict expected-fail ✅ typecheck ✅ build ✅
- Result: added a baseline-backed `@evefrontier/world` drift checker, npm entry points for default/CI/strict modes, and a scheduled/manual GitHub Action that runs `npm run world:mvr:ci`; the automation fails on internal consistency errors and unexpected vendor/MVR baseline drift, warns on the current known World v2 migration-pending gap, and reserves strict alignment for later migration branches.
- Follow-ups: Phase 2 should split frontend world runtime versus original/type-origin modeling explicitly before any deliberate World v2 runtime migration branch updates sponsor policy and PTB targets.

## 2026-04-29 – Audit MVR world package strategy
- Goal: Audit how CivilizationControl should use Move Registry / MVR for `@evefrontier/world`, compare that against the current Stillness package-ID model, and recommend a safe path without changing runtime IDs, sponsor allowlists, Move dependencies, or deployments.
- Files: `docs/operations/mvr-world-package-audit-20260429.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: docs-only audit plus targeted docs index and future-agent guidance updates
- Risk: low — documentation only, no runtime, package-ID, sponsor-policy, Move, or deployment changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: recorded that public MVR currently resolves `@evefrontier/world` to Stillness/Testnet version 2 at `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`, while CivilizationControl still uses committed concrete world IDs rooted at `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`; recommended MVR first as audit/build-time validation, keep runtime config concrete, keep `vendor/world-contracts` for source review, and handle World v2 migration in a separate high-risk branch.
- Follow-ups: implement a Phase 1 read-only MVR world-resolution audit script before attempting any World v2 runtime migration, direct named-package PTB experiment, or Move.toml MVR dependency experiment.

## 2026-04-28 – Reframe indexer docs as shared Frontier backend
- Goal: Correct the EF-Map/indexer documentation so it describes one shared EVE Frontier backend currently source-controlled and operated through the EF-Map repo/runtime, rather than framing CivilizationControl as consuming EF-Map as a subordinate app.
- Files: `docs/operations/efmap-indexer-awareness-20260428.md`, `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md`, `docs/llm-reference-guide.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only reframing of backend ownership, integration boundaries, privacy scope, and next-prompt wording
- Risk: low — documentation only, no runtime, contract, VPS, database, or deployment changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: the docs now frame the live indexer/runtime as a shared Frontier backend currently implemented in the EF-Map repo/runtime, clarify that EF-Map is the original/current primary consumer and operator rather than the sole conceptual data owner, and record that future backend endpoints should be committed to the backend source repo rather than hand-edited on the VPS.
- Follow-ups: the next backend implementation task should define a preview-only shared-backend structure-summary endpoint in the current backend source repo, currently EF-Map, with scoped payloads that avoid broad intelligence leaks.

## 2026-04-28 – Map CC read paths to EF-Map indexer
- Goal: Document CivilizationControl's current browser-side read and polling model, map which paths should stay direct-on-chain versus move to EF-Map enrichment, and define the safest first replacement slice without implementing integration yet.
- Files: `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md`, `docs/operations/efmap-indexer-awareness-20260428.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: docs-only replacement matrix plus awareness/index/LLM-guide updates
- Risk: low — documentation only, no runtime, contract, VPS, database, or deployment changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: recorded the current CC JSON-RPC, polling, static catalog, and World API read paths; mapped them against EF-Map structure, event, type, tribe, inventory, and snapshot surfaces; and chose a preview-only EF-Map structure-summary endpoint by assembly IDs as the best first slice.
- Follow-ups: the next implementation task should happen in the EF-Map repo first by defining the preview-only read-only structure-summary endpoint and its browser-safe auth/CORS contract.

## 2026-04-28 – Document EF-Map indexer awareness
- Goal: Record that EF-Map already exists as a richer local/VPS indexer capability, inspect its repo and runtime read-only, and document what CivilizationControl could later consume without implementing integration now.
- Files: `docs/operations/efmap-indexer-awareness-20260428.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: docs-only awareness report plus targeted docs index and LLM guide updates
- Risk: low — documentation only, no runtime, contract, VPS, database, or deployment changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Result: confirmed the local EF-Map repo at `C:/EF-Map-main`, confirmed read-only SSH access through `ef-map-vps`, verified a live Postgres-backed EF-Map runtime under `/opt/ef-map`, documented populated `ef_sui` and `world_api_dlt` data surfaces, and recorded the current boundary that CC should consume EF-Map through Worker/API/snapshot/proxy surfaces rather than direct browser-to-DB access.
- Follow-ups: the most likely next implementation slice is a preview-only read-only EF-Map endpoint for CC structure/node enrichment keyed by structure IDs or system IDs.

## 2026-04-28 – Consolidate completed sponsor operations docs
- Goal: Reduce context noise in `docs/operations/` by archiving completed sponsor-worker migration and cutover evidence, keeping the sponsor-worker runbook active, and updating the LLM guide and docs index with current sponsor-worker truth.
- Files: `docs/archive/sponsor-worker-20260428/README.md`, `docs/archive/sponsor-worker-20260428/sponsor-signer-migration-plan-20260427.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-deploy-readiness-20260427.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-runtime-discovery-20260427.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-plan-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-validation-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-production-cutover-20260428.md`, `docs/archive/sponsor-worker-20260428/production-sponsor-fallback-diagnostic-20260428.md`, `docs/archive/hackathon-2026/operations/hackathon-archive-cleanup-20260427.md`, `docs/operations/sponsor-worker-runbook.md`, `docs/operations/documentation-consolidation-20260428.md`, `docs/llm-reference-guide.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: archive moves for completed sponsor-worker evidence plus compact source-of-truth updates for the runbook, LLM guide, docs index, and consolidation report
- Risk: low — documentation only, no runtime, contract, policy, or deployment changes
- Gates: diff-check ✅ status/diff-review ✅ typecheck ✅ build ✅ sponsor-policy-check ✅ sponsor-test ✅ sponsor-typecheck ✅
- Result: completed sponsor-worker planning, readiness, cutover, validation, and incident reports now live under `docs/archive/sponsor-worker-20260428/`, the active sponsor-worker source of truth remains `docs/operations/sponsor-worker-runbook.md`, `docs/llm-reference-guide.md` now reflects the in-repo worker, completed production cutover, and custom-domain CORS fix, and the completed hackathon cleanup report was moved out of `docs/operations/`.
- Follow-ups: consider a separate authority-chain cleanup for `docs/core/day1-checklist.md`, `docs/core/march-11-reimplementation-checklist.md`, and `docs/core/CARRY_FORWARD_INDEX.md`, which remain active for now because other live docs still treat them as current authority or implementation context.

## 2026-04-28 – Record production sponsor smoke success after CORS fix
- Goal: Record the operator-confirmed production sponsor-paid smoke after the custom-domain CORS fix on `civilizationcontrol-sponsor`, without changing runtime IDs, allowlists, or frontend deployment state.
- Files: `docs/archive/sponsor-worker-20260428/production-sponsor-fallback-diagnostic-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-production-cutover-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-validation-20260428.md`, `docs/decision-log.md`
- Diff: docs-only update recording manual production success after the live worker-only CORS fix
- Risk: low — documentation only, grounded in the already-deployed worker fix and operator manual production evidence
- Gates: diff-check ✅ policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Result: the production sponsor failure root cause remained the missing custom-domain CORS allowlist entries on `civilizationcontrol-sponsor`; after the worker-only redeploy, the operator manually tested from `https://civilizationcontrol.com` and confirmed sponsor-paid production transactions by observing sponsor-wallet activity. No frontend redeploy was required because the production bundle already pointed at `civilizationcontrol-sponsor`, the digest was not captured in the agent transcript, and `flappy-frontier-sponsor` remains deployed as rollback during soak.
- Follow-ups: merge the completed fix branch back to `master`, preserve the old Worker during soak, and handle any later sponsor-doc consolidation in a separate archive pass.

## 2026-04-28 – Fix sponsor worker CORS for production custom domains
- Goal: Eliminate silent player-paid fallback on the real production domain by allowing sponsor-worker CORS preflight from `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com` while preserving existing Pages and preview support.
- Files: `workers/sponsor-service/wrangler.toml`, `workers/sponsor-service/src/index.ts`, `workers/sponsor-service/src/__tests__/index.test.ts`, `docs/operations/sponsor-worker-runbook.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-validation-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-production-cutover-20260428.md`, `docs/archive/sponsor-worker-20260428/production-sponsor-fallback-diagnostic-20260428.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: narrow worker origin-list update, new worker preflight tests, and operational documentation of the custom-domain root cause plus deployed fix evidence
- Risk: medium — live sponsor-worker runtime change on production traffic, but no package-id, world-id, object-id, or Move allowlist change
- Gates: diff-check ✅ policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅ post-deploy-options ✅
- Result: root cause was confirmed as a missing custom-domain CORS allowlist entry on `civilizationcontrol-sponsor`; worker version `74bdc428-4d0c-4df6-b5dc-077335979db1` is now deployed with explicit origins for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, and `https://civilizationcontrol.pages.dev`, and post-deploy `OPTIONS /sponsor` checks returned `204` with matching `Access-Control-Allow-Origin` for all three.
- Follow-ups: repeat one real production action from `https://civilizationcontrol.com`, confirm `/sponsor` returns a real status without browser CORS failure, confirm fallback logs disappear, capture the final digest, and confirm sponsor-wallet activity.

## 2026-04-28 – Record sponsor worker production cutover
- Goal: Cut the production CivilizationControl frontend over from `flappy-frontier-sponsor` to `civilizationcontrol-sponsor` after preview validation and operator-confirmed manual preview sponsorship proof.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-worker-production-cutover-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-validation-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-plan-20260428.md`, `docs/operations/sponsor-worker-runbook.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only production cutover record plus updated validation status, runbook status, and docs index
- Risk: medium — documentation only, but grounded in a real production Pages deploy and manual operator smoke evidence
- Gates: diff-check ✅ policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Result: Cloudflare Pages production was redeployed to `main` using a bundle built against `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, `https://civilizationcontrol.pages.dev` now serves a bundle that references `civilizationcontrol-sponsor` and not `flappy-frontier-sponsor`, the operator-reported manual preview smoke is recorded as passed, production live transaction smoke was not performed by the agent, and the old Worker remains alive for rollback.
- Follow-ups: keep the old Worker during the soak period, capture a manual production digest if possible, retire the old Worker only later, and keep World v2 runtime-ID work separate.

## 2026-04-28 – Record sponsor worker preview cutover
- Goal: Execute the preview-first runtime cutover for the new `civilizationcontrol-sponsor` Worker without touching production frontend configuration.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-validation-20260428.md`, `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-plan-20260428.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only validation record plus cutover-plan link and index update
- Risk: medium — documentation only, but grounded in real Cloudflare Worker deploy, secret provisioning, preview deployment, and smoke-attempt evidence
- Gates: diff-check ✅ policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Result: `civilizationcontrol-sponsor` was created at `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, `SPONSOR_PRIVATE_KEY` now exists by name, endpoint checks passed, preview frontend was redeployed to `https://59a237d5.civilizationcontrol.pages.dev` and now references the new Worker, production frontend remained unchanged, and the old `flappy-frontier-sponsor` Worker was left untouched. Real sponsorship is still unproven because wallet connection failed before any governance transaction could be sent.
- Follow-ups: run one real preview governance smoke in a working wallet/browser environment, prove sponsor gas payment rather than fallback, and only then consider a separate production frontend cutover.

## 2026-04-28 – Plan sponsor worker runtime cutover
- Goal: Capture a precise, no-deploy implementation plan for moving live sponsorship from `flappy-frontier-sponsor` to a new `civilizationcontrol-sponsor` Worker with preview-first validation and rollback preserved.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-plan-20260428.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only cutover plan plus index update
- Risk: low — planning only, but grounded in prior runtime discovery, deploy-readiness evidence, Wrangler command-surface inspection, and smoke-test design
- Gates: policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Result: the plan now separates source ownership from runtime cutover, treats new Worker creation as safer than rename, keeps production on the old Worker until preview proof succeeds, and defines the exact secret-handling, preview env, smoke-test, rollback, and production criteria for the next implementation task.
- Follow-ups: execute the cutover plan on a dedicated implementation branch, create `civilizationcontrol-sponsor`, provision secrets by name, point preview at the new Worker, and capture one real sponsorship proof before any production change.

## 2026-04-27 – Record sponsor worker runtime discovery
- Goal: Determine which sponsor worker CivilizationControl is currently using in practice, without deploying or changing runtime state.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-worker-runtime-discovery-20260427.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only runtime discovery report plus index update
- Risk: low — documentation only, grounded in local env inspection, Cloudflare read-only checks, and non-destructive endpoint probing
- Gates: policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Result: CivilizationControl is still pointed at `flappy-frontier-sponsor`, that worker exists on the active Cloudflare account and exposes the expected `/sponsor` behavior for the production origin, while `civilizationcontrol-sponsor` still does not exist. Recommendation: keep the live Flappy worker temporarily and perform a separate explicit deploy-and-cutover task later.
- Follow-ups: create `civilizationcontrol-sponsor` in a later migration task, provision secrets there, cut preview first, and validate with one real sponsored governance smoke before any production switch.

## 2026-04-27 – Record sponsor worker deploy readiness
- Goal: Resolve the last preserved parent stash safely and inspect whether the in-repo sponsor worker is ready for Cloudflare deploy and frontend cutover from `master` without changing runtime IDs or deploying by default.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-worker-deploy-readiness-20260427.md`, `docs/README.md`, `docs/decision-log.md`
- Diff: docs-only readiness report plus index update
- Risk: low-medium — docs only, but grounded in Cloudflare account inspection, stash cleanup, and deploy/cutover decision criteria
- Gates: policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Result: Wrangler is authenticated to `Michael.davis.home@gmail.com's Account`, but Worker `civilizationcontrol-sponsor` does not exist yet, secret names could not be verified, local `.env` still classifies `VITE_SPONSOR_URL` as the older Flappy-hosted worker, and deploy/cutover remains a no-go until a separate explicit Worker deploy and preview cutover task.
- Follow-ups: deploy `civilizationcontrol-sponsor` from `workers/sponsor-service/`, capture the exact worker base URL, set preview `VITE_SPONSOR_URL`, and run one real sponsored governance smoke before any production cutover.

## 2026-04-27 – Reconcile sponsor worker ownership docs
- Goal: Update the docs to match the post-implementation state where CivilizationControl owns the sponsor-worker source, while keeping deployment and live cutover explicitly out of scope.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-signer-migration-plan-20260427.md`, `docs/operations/sponsor-worker-runbook.md`, `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/operations/post-hackathon-repo-readiness-audit.md`, `docs/operations/submodule-refresh-20260425.md`, `docs/archive/hackathon-2026/operations/hackathon-archive-cleanup-20260427.md`, `docs/decision-log.md`
- Diff: docs-only status reconciliation plus archive move and link updates
- Risk: low — documentation only, no runtime/package-ID/deploy changes
- Gates: diff-check ✅ policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Follow-ups: verify preview or production Worker deployment separately, verify frontend env cutover separately, and handle Stillness world v2 runtime-ID migration in a dedicated later task.

## 2026-04-27 – Bring sponsor worker into CivilizationControl
- Goal: Copy the stabilized sponsor worker from Flappy Frontier into this repo, adapt it to CivilizationControl ownership, add committed Stillness and policy config, and add local validation without changing runtime package IDs or deploying anything.
- Files: `workers/sponsor-service/`, `config/chain/stillness.ts`, `config/sponsorship/civilizationControlPolicy.ts`, `scripts/validate-sponsor-policy.mjs`, `.env.example`, `README.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`, `docs/operations/sponsor-worker-runbook.md`, `package.json`
- Diff: new worker package plus targeted docs/env/script updates
- Risk: medium — new worker package and security-sensitive config, but no contract or runtime-ID changes
- Gates: policy-check ✅ worker-test ✅ worker-typecheck ✅ typecheck ✅ build ✅
- Follow-ups: preview-only worker deploy, preview frontend URL cutover, and a later separate Stillness world v2 runtime-ID task.

## 2026-04-27 – Plan sponsor signer migration
- Goal: Investigate the current sponsor-worker ownership split between CivilizationControl and Flappy Frontier, then document a phased migration plan for moving sponsor-worker ownership into this repo without changing runtime IDs or deploying anything yet.
- Files: `docs/archive/sponsor-worker-20260428/sponsor-signer-migration-plan-20260427.md`, `docs/README.md`, `docs/llm-reference-guide.md`, `docs/decision-log.md`
- Diff: docs-only planning artifact plus targeted index/reference updates
- Risk: medium — planning only, but centered on sponsorship security, worker ownership, and future runtime-ID coordination
- Gates: diff-check ✅ typecheck ✅ build ✅
- Follow-ups: implementation should pin the intended Flappy worker source revision before copying because the inspected local `C:/dev/flappy-frontier` checkout was dirty.

## 2026-04-27 – Archive hackathon demo material
- Goal: Move clear hackathon submission, demo-production, recording, and one-off validation material under `docs/archive/hackathon-2026/` so future work starts from current product context rather than old demo packages.
- Files: archived docs from `docs/core/`, `docs/demo/`, and `docs/operations/`; archived demo scripts and `recordings/README.md`; updated `docs/README.md`, `README.md`, `docs/llm-reference-guide.md`, and active cross-links; added archive README and cleanup report.
- Diff: git moves plus targeted index/link updates
- Risk: low — documentation/archive only, no runtime or contract changes
- Gates: diff-check ✅ typecheck ✅ build ✅
- Follow-ups: review a small set of uncertain Stillness-era runbooks and stale diagnostic scripts separately from this archive pass.

## 2026-04-25 – Refresh vendor submodule pointers
- Goal: Refresh vendor references after post-hackathon cleanup and document Stillness-focused compatibility impact.
- Files: `vendor/world-contracts`, `vendor/evevault`, `vendor/builder-documentation`, docs under `docs/operations/`, `docs/llm-reference-guide.md`, `README.md`
- Diff: submodule pointers plus targeted docs
- Risk: medium-high — `world-contracts` source APIs stayed stable, but upstream Stillness world metadata now records v2 `published-at`; Eve Vault changed wallet/auth/sponsorship internals.
- Gates: diff-check ✅ active-env ✅ Move build ✅ Move tests ✅ (26/26) typecheck ✅ build ✅
- Follow-ups: separate world-v2 runtime-ID audit, sponsor allowlist verification, headed Eve Vault smoke

## 2026-04-01 – Architecture correction: remove player-specific constants
- Goal: CHARACTER_ID, GATE_ID, GATE_OWNER_CAP_ID, SSU_ID, SSU_OWNER_CAP_ID were treated as deployment constants to fill in. They are per-wallet dynamic values. 15-flow audit confirmed all production paths were already dynamic. Removed constants and legacy single-target functions.
- Files: `src/constants.ts`, `src/hooks/useAuthorizeExtension.ts`, `src/screens/AuthHarness.tsx`, `docs/operations/migrate-to-stillness.md`
- Diff: ~−50 lines (constants, legacy functions, broken imports)
- Risk: low — all production flows unchanged, only removed dead code and dev-only harness references
- Gates: typecheck ✅ build ✅

## 2026-04-01 – Migrate CivilizationControl from Utopia to Stillness
- Goal: Fresh publish of CC package to Stillness testnet world. Migrate all frontend constants, URLs, tenant defaults, and tribe catalog.
- Files: 15 files modified (5 Move, 10 frontend/scripts)
- Diff: ~+54 −183
- Risk: **high** — full environment migration, new package publish, all IDs changed
- Gates: Move build ✅ Move tests ✅ (26/26) typecheck ✅ build ✅
- Key adaptation: `gate::issue_jump_permit_with_id` → `gate::issue_jump_permit` (Stillness world is v1, pre-v0.0.20)
- Publish tx: `Exixj2g847Cf54cQGx6iyRdHGevFY3372nkHLxJ6qX6X`
- CC_PACKAGE_ID: `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` (v1)
- CC_ORIGINAL_PACKAGE_ID: same (fresh publish)
- GATE_CONFIG_ID: `0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e`
- Bug fix: eventParser TURRET_TARGETING type now uses CC_ORIGINAL_PACKAGE_ID (was CC_PACKAGE_ID)
- Preview: https://feat-stillness-migration.civilizationcontrol.pages.dev
- Follow-ups: Sponsor worker APP_POLICIES update, README update, production deploy from main

## 2026-03-30 – CC v6 upgrade: add buy_to_inventory for correct item delivery
- Goal: Sui's `compatible` upgrade policy rejects public function signature changes. Original plan to change `buy()` return type (Item → void) was incompatible. Revised approach: keep `buy()` unchanged, add new `buy_to_inventory()` that calls `deposit_to_owned<TradeAuth>()` for proper in-game delivery. Frontend targets new function.
- Files: contracts/civilization_control/sources/trade_post.move, src/lib/tradePostTx.ts, src/constants.ts
- Diff: ~+60 −3 (contract: +55 new function, frontend: target + package ID update)
- Risk: **high** — on-chain contract upgrade (v5 → v6). Additive-only change, original `buy()` preserved.
- Gates: Move build ✅ Move tests ✅ (26/26) typecheck ✅ build ✅
- Upgrade tx: `HjV7RCtqs7wGiKuDi88ScLytsudYQzZ5de8Ng1XDa13k` (epoch 1054)
- New CC_PACKAGE_ID: `0x656006a3a68da4465dc60efc3a5d72154bdbf2dc31ac9b21c4f9fe475581b941` (v6)
- Sui CLI upgraded: 1.68.0 → 1.68.1 (protocol v118 support required by Utopia network)
- **Initial deploy was to Preview only** (`--branch master`), not Production. Cloudflare Pages production branch is `main`; all prior `--branch master` deploys were Preview-only. Live purchase tx `3Vuvzkvf1AgMmtK5aUaQaNVdob8dJXP27ZpGbrAb3WiT` confirmed old v5 code ran: package `0xeffb45b2...`, function `buy()`, `transferObjects` to buyer wallet.
- Production fix: redeployed with `--branch main` to promote to Production. Production URL `civilizationcontrol.pages.dev` now serves v6 code with `buy_to_inventory` target. Verified by inspecting production JS bundle.
- Extension auth: SSU `TradeAuth` authorization **does NOT** need re-authorization post-upgrade. World contracts use `type_name::with_defining_ids<Auth>()` for both storage and runtime check — the defining ID is anchored to v1 (`0xf2f1e8ea...`) and never changes across upgrades.
- Follow-ups: (1) TURRET_TARGETING event type string pre-existing bug, (2) **All future deploys must use `--branch main`** for Production, (3) operator re-test required from production URL.

## 2026-03-30 – TradePost: fix item delivery to buyer's owned inventory
- Goal: Purchased items were transferred as raw Sui objects to the buyer's wallet via `transferObjects`. In EVE Frontier, characters have no standalone inventory — all items live inside SSU dynamic fields. Raw `Item` objects in a wallet are invisible in-game. Fix: contract `buy()` now calls `deposit_to_owned<TradeAuth>()` to deposit into the buyer's per-character owned inventory on the same SSU (auto-created on first use). Frontend PTB builder updated to remove `transferObjects` step.
- Files: contracts/civilization_control/sources/trade_post.move, src/lib/tradePostTx.ts, src/hooks/useBuyListing.ts
- Diff: ~+20 −15 (contract: +7 −6, frontend: +8 −9)
- Risk: **high** — changes Move contract entry function signature (return type Item → void). Requires package upgrade on Utopia testnet before the frontend fix takes effect.
- Gates: Move build ✅ Move tests ✅ (26/26) typecheck ✅ build ✅
- Source truth: world-contracts `storage_unit_tests::swap_ammo_for_lens_via_extension` pattern — withdraw from main inventory, deposit_to_owned for buyer delivery.
- **Superseded by v6 upgrade entry above** — original approach was incompatible with Sui's upgrade policy. Revised to additive function.
- Follow-ups: re-authorize TradeAuth extension on the SSU after upgrade if type-origin changes.

---

## 2026-03-30 – Signal Feed: accelerated polling during posture transitions
- Goal: Recent Telemetry Signals preview on Command Overview now polls at 4s (matching posture read-path) during posture transitions, so the PostureChangedEvent appears in sync with the topology color shift instead of lagging up to 30s.
- Files: src/hooks/useSignalFeed.ts, src/components/PostureControl.tsx, src/components/topology/StrategicMapPanel.tsx, src/screens/Dashboard.tsx, src/types/domain.ts, src/lib/eventParser.ts
- Diff: ~+20 −8
- Risk: low (UI polling cadence only, no contract/schema change)
- Gates: typecheck ✅ build ✅
- Also fixed: ListingPurchasedEvent/ListingCancelledEvent ownership scoping — events lacked `storage_unit_id` field, now scoped via `seller` address match (ownerAddressField).

---

## 2026-03-29 – Audio: Beat 6C phrase-splice chosen, Beat 1 extended to ~22s
- Goal: Lock two operator decisions into durable docs: (1) Beat 6C uses phrase-splice path (c1→400ms silence→c2→400ms silence→c3), not the combined c.mp3. (2) Beat 1 extended from 18s to ~22s — slower delivery accepted.
- Files: capture-readiness-checklist.md, civilizationcontrol-demo-beat-sheet.md, demo-production-pipeline-plan.md, tts-generation-guide.md
- Diff: ~+50 −60 across 5 docs
- Risk: low (documentation only, timing adjustments)
- Runtime impact: Total demo ~3:04 (was 3:00). Under 3:05 ceiling. No compensating trims needed.
- Beat 6 audio: c1 + 400ms silence + c2 + 400ms silence + c3 (controlled inter-phrase pacing). Combined c.mp3 retained but not used.

---

## 2026-03-29 – Audio: TTS narration package complete — project enters pre-capture state
- Goal: Verify generated TTS audio inventory against guide, update pipeline docs to reflect audio-ready status.
- Files: docs/demo/demo-production-pipeline-plan.md (status + voiceover status + risk tracker updated)
- Audio inventory: 14 narration MP3s + 7 silence WAVs + 3 Beat 6C fallback files = 24 files in `recordings/voiceovers/`. All match `tts-generation-guide.md` naming and location spec. Beat 6C fallback was exercised (inter-phrase pauses collapsed as predicted).
- Measured durations: b01=21s, b02a=1s, b02b=9s, b03a=3s, b03b=10s, b04a=4s, b04b=5s, b05=10s, b06a=1s, b06b=1s, b06c=4s, b07=12s, b08a=5s, b08b=3s.
- Risk: low (no code changes)
- State transition: script-locked → audio-ready → pre-capture

## 2026-03-29 – Docs: Pre-lock tightening — Beat 2/7/8 wording, 1.6s defense timing, visual simplification
- Goal: Final tightening pass before script lock. Five operator feedback items: (1) Beat 2 keeps "one view" (not "one surface"). (2) Beat 7 geography: "far side of the gate" → "far side of the network." (3) Beat 8 avoids narrated structure counts (already count-free in prior pass). (4) Defense transition timing corrected ~800ms → ~1.6s across all docs. (5) TTS baseline unchanged. Also tightened: Beat 4 narration ("Denied. The chain enforced it."), Beat 6 narration ("Threat inbound" + "Gates locked. Turrets armed."), Beat 3 visual direction simplified (removed zoom/dim/crop — static holds only).
- Files: docs/core/civilizationcontrol-demo-beat-sheet.md, docs/demo/narration-direction-spec.md, docs/demo/demo-production-pipeline-plan.md
- Diff: ~+30 −30 across 3 docs
- Risk: low (documentation only)

## 2026-03-29 – Docs: Script-lock pass — command-count audit, tiered pricing, visual direction
- Goal: Lock narration + visual direction for all 9 demo beats. Resolve three operator-flagged issues: (1) "thirteen commands" claim unjustifiable for single-gate config, (2) Beat 3 narration described binary allow/deny — actual UI shows tiered commercial pricing, (3) Beat 7 commerce amount too low (1,000 → 100,000 Lux).
- Files: docs/core/civilizationcontrol-demo-beat-sheet.md, docs/demo/narration-direction-spec.md
- Diff: ~+250 −80 across 2 docs
- Risk: low (documentation only)
- Key decisions: (1) "Thirteen commands" replaced with "Every rule, every gate — a manual transaction" — structural pain claim is unchallengeable. Audit found 13 steps cover *full lifecycle from world-publish*; per-gate policy config is 4–6 CLI transactions. (2) Beat 3 completely rewritten around tiered commercial pricing per operator gate screenshot: allies 1K, rivals 25K, neutral 5K, default 10K Lux. (3) Beat 7 commerce: 1,000 → 100,000 Lux (= 1,000 EVE). (4) Locked visual direction added to all 9 beats with exact shot counts, timestamps, emphasis guidance, and silence windows.

## 2026-03-29 – Docs: Phase 2 capture validation findings + demo script alignment
- Goal: Write validated operational truth from Phase 2 Playwright testing into all demo docs. Correct stale demo narrative (gate count 9→10, EVE→Lux-first currency, generic tribe→ally naming). Add validated recording environment section to pipeline plan.
- Files: docs/demo/demo-production-pipeline-plan.md, docs/core/civilizationcontrol-demo-beat-sheet.md, docs/demo/narration-direction-spec.md, docs/core/civilizationcontrol-claim-proof-matrix.md
- Diff: ~+120 −40 across 4 docs
- Risk: low (documentation only)
- Gates: N/A (no code changes)
- Key findings captured: (1) Headed Chromium + Eve Vault is the viable recording path. (2) Wallet popup opens in separate OS window — no viewport contamination. (3) localStorage persists across reload/navigation/relaunch. (4) Wallet does NOT persist across relaunch. (5) Per-scene short recordings (<60s) at 2560×1440 recommended. (6) Structure counts: 10 gates, 10 governed, 2 trade posts, 36 turrets, 6 network nodes.

## 2026-03-29 – Feat: Transaction proof hover card on digest links
- Goal: Replace browser-default title tooltip on transaction digests with an in-app proof summary card. Lazy-fetches tx details from Sui JSON-RPC on ~500ms hover, caches by digest. Shows status, type, digest, checkpoint, timestamp, gas. Click still opens SuiScan.
- Files: src/components/DigestHoverLink.tsx (new), src/components/TxProofCard.tsx (new), src/hooks/useTxDetails.ts (new), src/lib/txDetails.ts (new), src/components/SignalEventRow.tsx (modified)
- Diff: +347 −6
- Risk: low (UI-only, no contract or state changes)
- Gates: typecheck ✅ build ✅

## 2026-03-28 – Fix: Assembly-aware power telemetry, banner fixes, directive wording, low-fuel alert
- Goal: Fix 5 live operator-reported telemetry/copy bugs and add low-fuel attention alert.
- Fixes: (1) Single-gate directive wording: "Policy Preset Set" → "Gate Directive Updated" / "Commercial directive updated". (2) Turret power banner reversed: added useRef pattern (same fix as gate). (3) Trade post power banner reversed + "TradePost" → "Trade post": added useRef pattern. (4) Power telemetry labels hardcoded as "Gate": StatusChangedEvents now tagged with `_assemblyType` based on MoveModule query source → "Gate/Turret/Trade Post Brought Online/Taken Offline". (5) SSU power events not fetched: added world::storage_unit MoveModule query (9th parallel query). (6) Low-fuel attention alert: network nodes with <24h runtime show in Attention Required.
- Files: src/lib/eventParser.ts, src/lib/signalFolder.ts, src/lib/suiReader.ts, src/screens/TurretDetailScreen.tsx, src/screens/TradePostDetailScreen.tsx, src/screens/Dashboard.tsx
- Diff: +84 −13
- Risk: low (copy/label changes + client-side derived alert)
- Gates: typecheck ✅ build ✅

## 2026-03-23 – Feat: Wire CivilizationControl to live shared sponsor worker
- Goal: Connect CC's sponsorship frontend to the deployed multi-app sponsor worker at flappy-frontier-sponsor.michael-davis-home.workers.dev. Fix two integration bugs found during wiring.
- Fixes: (1) Sponsor worker expects POST /sponsor — CC was posting to root URL. Added /sponsor path derivation. (2) Worker has no SPONSOR_API_KEY set (auth open, CORS-protected). CC required API key to enable sponsorship. Made API key optional — sponsorship activates with VITE_SPONSOR_URL alone.
- Files modified: src/lib/sponsorship.ts
- Files created: .env.example
- Config: Added VITE_SPONSOR_URL to .env (gitignored)
- Diff: ~10 LoC changed in sponsorship.ts, .env.example created
- Risk: low (client-side env + fetch URL fix; fallback unchanged)
- Gates: typecheck ✅ build ✅ preview deployed ✅
- Preview: https://feat-sponsored-governance.civilizationcontrol.pages.dev
- Follow-ups: (1) Set SPONSOR_API_KEY on worker if auth hardening desired. (2) Commit sponsorship files to feature branch.

## 2026-03-23 – Feat: Sponsored transaction frontend integration
- Goal: Add gas sponsorship support so governance operations are gas-free for the tribe leader. Transparent fallback: when no sponsor is configured, standard wallet-pays-gas flow continues.
- Files created: src/lib/sponsorship.ts (sponsor API client), src/hooks/useSponsoredExecution.ts (unified execution hook)
- Files modified: src/hooks/useAuthorizeExtension.ts, src/hooks/useGatePolicyMutation.ts, src/hooks/usePosture.ts, src/hooks/useStructurePower.ts
- Diff: +151 LoC added (2 new), -95 LoC removed / +42 LoC added (4 modified) = net +98 LoC
- Risk: medium (new execution path, but graceful fallback to existing behavior when env vars absent)
- Architecture: `useSponsoredExecution()` hook wraps dAppKit. If `VITE_SPONSOR_URL` + `VITE_SPONSOR_API_KEY` env vars set → builds TransactionKind only → POST to sponsor worker → player signs sponsored TX → execute with dual signatures. If not configured or sponsor unreachable → standard signAndExecuteTransaction.
- NOT wired (by design): useGatePermit, useBuyListing, useCreateListing, useCancelListing, useTransitProof — these involve value transfer (splitCoins from GasCoin) and must NOT be sponsored.
- Gates: typecheck ✅ build ✅
- Follow-ups: (1) Deploy a CC sponsor worker (separate from FF). (2) Set VITE_SPONSOR_URL + VITE_SPONSOR_API_KEY env vars. (3) Worker must allowlist both WORLD_PACKAGE_ID and CC_PACKAGE_ID targets, block GasCoin manipulation, enforce origin checking.

## 2026-03-23 – Fix: TradeAuth missing from VALID_AUTH_SUFFIXES (SSU always shows stale)
- Goal: SSU/Trade Post extension status always showed "stale" even after successful re-authorization — blocking listing creation and showing misleading STALE badge.
- Root cause: `resolveExtensionAuth()` in suiReader.ts uses suffix matching against `VALID_AUTH_SUFFIXES`. The list contained `::gate_control::GateAuth`, `::turret::CommercialAuth`, `::turret::DefenseAuth` — but NOT `::trade_post::TradeAuth`. Every SSU with a valid TradeAuth extension fell through to the `"stale"` return.
- Fix: Added `"::trade_post::TradeAuth"` to `VALID_AUTH_SUFFIXES` (1 line).
- Files: src/lib/suiReader.ts
- Diff: +1 LoC
- Risk: low (read-path only, no PTB or contract change)
- Gates: typecheck ✅ build ✅
- Follow-ups: None. The re-auth PTB was already correct — `authorizeSsus()` uses `CC_ORIGINAL_PACKAGE_ID::trade_post::TradeAuth` which matches the v1 type-origin.

## 2026-03-23 – Feat: SSU auto DApp URL + metadata URL capability audit
- Goal: Extend on-chain DApp URL setting from gates to SSUs/Trade Posts. Audit turret and other assembly metadata capabilities.
- Files: src/hooks/useAuthorizeExtension.ts, src/screens/TradePostDetailScreen.tsx, src/screens/TradePostListScreen.tsx
- Diff: ~80 LoC added across 3 files
- Risk: medium (new PTB calls to storage_unit::update_metadata_url)
- Changes:
  - `authorizeSsus()` now accepts optional `dappBaseUrl` — when provided, adds `storage_unit::update_metadata_url` MoveCall per SSU in the same PTB
  - New `setSsuDappUrl()` standalone function for already-authorized SSUs
  - TradePostDetailScreen: InGameDAppUrlSection upgraded from copy-only to "Set On-Chain" (primary) + "Copy URL" (secondary) + TxFeedbackBanner
  - TradePostDetailScreen: ExtensionSection re-auth now passes `window.location.origin` to auto-set DApp URL
  - TradePostListScreen: batch "Authorize All" passes `window.location.origin`
- Audit findings:
  - **Turrets**: `turret::update_metadata_url` exists (L367) but no player interaction surface reads turret metadata URLs. Players don't press F on turrets to open a DApp. Recommendation: do not implement.
  - **Other gate capabilities**: `freeze_extension_config` (permanent, irreversible lock), `update_metadata_name/description`, `link/unlink_gates` (requires AdminACL, not operator-callable), `delete_jump_permit/delete_jump_permit_with_auth`. None needed for hackathon scope.
  - **Other SSU capabilities**: `freeze_extension_config` (same permanent lock), `update_metadata_name/description`, `revoke_extension_authorization`. None needed for hackathon scope.
- Gates: typecheck ✅ build ✅
- Follow-ups: If CCP adds turret interaction DApp surface, revisit turret metadata URL support.

## 2026-03-23 – UI: Command Overview polish pass (hierarchy + 1440p fit)
- Goal: Calm the Command Overview page — improve hierarchy, reduce visual noise, ensure no page scrollbar at 1440p demo capture.
- Files: Dashboard.tsx, Sidebar.tsx, App.tsx, StrategicMapPanel.tsx, theme.css + new docs/ux/ui-polish-reference-brief.md
- Diff: ~30 LoC changed across 5 source files, 1 new doc
- Risk: low (layout/styling only, no logic or contract changes)
- Changes: (A) sidebar sections collapsed by default, (B) main padding reduced py-8→py-6 + narrower gaps, (C) telemetry preview capped at 6 items with .slice(), (D) attention alerts compacted to single-line rows + reduced empty-state padding, (E) topology canvas 360→400px, (F) grid opacity halved 0.04→0.02 + background darkened + defensive overlay reduced 5%→3%
- Gates: typecheck ✅ build ✅
- Follow-ups: Apply similar polish to Gate Detail, TradePost Detail, and Signal Feed screens in future passes.

## 2026-03-23 – Docs: Demo evidence framing correction (beat-sheet-driven sync)
- Goal: Align all demo/rehearsal docs to two corrected truths established in the beat sheet: (1) hostile denial is NOT observable in the operator's Signal Feed — evidence must be post-prod inset from hostile wallet, (2) turret engagement is NOT dashboard telemetry — evidence is world footage, CC proves doctrine via ExtensionAuthorizedEvent only.
- Principle: CC claims command over infrastructure, not omniscient visibility. Two honest framing techniques: post-prod inset (Beat 4) and world footage (Beat 6).
- Files: civilizationcontrol-demo-beat-sheet.md, civilizationcontrol-claim-proof-matrix.md, demo-readiness-tranches.md, operator-validation-checklist.md, demo-evidence-appendix.md, localnet-validation-backlog.md
- Diff: ~50 lines changed across 6 files (targeted wording fixes, no structural changes)
- Risk: low (documentation only, no code or contract changes)
- Gates: N/A (documentation)
- Follow-ups: Canonical beat sheet (`docs/core/civilizationcontrol-demo-beat-sheet.md`) is source of truth for all demo framing decisions.

---

## 2026-03-23 – Fix: Posture DF read uses wrong package ID (type-origin bug)
- Goal: Posture switch tx succeeds on-chain (DFs show mode=1 DEFENSE) but UI always displays "Commercial / Bouncer" — `fetchPosture` silently returns the default. Third instance of the type-origin class of bug.
- Root cause: `fetchPosture` in suiReader.ts queried `getDynamicFieldObject` with type `{CC_PACKAGE_ID}::posture::PostureKey` (v4). On-chain, `PostureKey` was first defined in v1, so its type origin is `{CC_ORIGINAL_PACKAGE_ID}::posture::PostureKey`. The v4-addressed query never matches, catch block returns `"commercial"` always.
- Fix: Changed DF key type from `CC_PACKAGE_ID` to `CC_ORIGINAL_PACKAGE_ID` on line 531 of suiReader.ts. Also updated blocker label in useOperatorReadiness.ts and improved comment in constants.ts.
- Files: suiReader.ts, useOperatorReadiness.ts, constants.ts
- Diff: +8 / −4
- Risk: low (frontend read-path only, no contract changes)
- Gates: typecheck ✅ build ✅
- Follow-ups: Live validation — switch posture, confirm UI reflects "Defense" immediately after tx. Turret rows should show "Defense" label.

---

## 2026-03-23 – Fix: Turret stale-detection type-origin mismatch
- Goal: After successful turret rebind, turrets still showed "STALE — REBIND" and posture switching remained blocked. Root cause: `resolveExtensionAuth` whitelist checked prefix against `CC_ORIGINAL_PACKAGE_ID` (v1, `0xf2f1e8ea...`) and `CC_PACKAGE_ID` (v4, `0xeffb45b2...`), but `turret::CommercialAuth` and `turret::DefenseAuth` were first defined in v3 (`0xb3fd08b7...`). On Sui, type origins anchor to the version where a type was first introduced — not the original package or latest upgrade. So the on-chain TypeName after rebind was `b3fd08b7...::turret::CommercialAuth`, matching neither prefix.
- Fix: Switched `resolveExtensionAuth` from prefix+suffix matching to suffix-only matching (`.endsWith()`). Suffix matching is safe because only our package can mint auth witnesses to register them as extensions. Also updated stale blocker label from legacy "BouncerAuth" to "CC doctrine".
- Files: suiReader.ts, useOperatorReadiness.ts
- Diff: +6 / −8
- Risk: low (frontend read-path logic only, no contract changes)
- Gates: typecheck ✅ build ✅
- Follow-ups: Live validation — rebind turrets, confirm "CC ACTIVE" appears immediately, confirm posture switch is unblocked.

---

## 2026-03-23 – Fix: Idempotent posture switch + v4 contract upgrade
- Goal: Posture switch failed with `EAlreadyInPosture` when any gate was already in the target posture. The PTB builder sends `set_posture` for ALL gates without filtering; if even one was already at the target, the entire transaction aborted.
- Fix: Made `set_posture` idempotent — replaced `assert!(old != mode, EAlreadyInPosture)` with early return `if (old == mode) return;`. Also added early return for first-time commercial (default, no-op). Removed `EAlreadyInPosture` error constant. Removed stale error handling from frontend `parseMoveAbort`.
- Files: posture.move, usePosture.ts, constants.ts, Published.toml
- Artifacts: CC_PACKAGE_ID v4 → `0xeffb45b2b2e5419e05fc863ff25d2a593d55edb6e9e68c7e10ecef07c0b6aaed`, tx=`3sr3pVcA2Yi7x78THP69PHTAmtYNM3fqUQaaabLDzizm`
- Diff: +7 / −9
- Risk: medium (Move contract logic change, minimal surface)
- Gates: Move build ✅ Move test ✅ (26/26) typecheck ✅ build ✅
- Deploy: https://feature-ui-polish-sdp8.civilizationcontrol.pages.dev
- Follow-ups: Live validation — switch posture back and forth on both operator wallets, confirm no abort.

---

## 2026-03-22 – Fix: Turret stale-detection + rebind UX
- Goal: Turrets were not showing as stale/unbound after v3 upgrade — operator had no signal to rebind doctrine. Stale detection used blacklist approach that could miss edge cases; authorize button was conditional and not prominent enough; authorization always hardcoded CommercialAuth ignoring current posture.
- Fix: (1) Switched `resolveExtensionAuth` to whitelist approach — only exact `::turret::CommercialAuth`, `::turret::DefenseAuth`, `::gate_control::GateAuth` return "authorized"; all other extensions return "stale". (2) Added prominent amber "Turret Doctrine Rebind Required" banner with inline "Rebind Doctrine (N)" button when any turret is unbound/stale. (3) Made `authorizeTurrets` posture-aware — uses `DefenseAuth` in defense mode, `CommercialAuth` in commercial. (4) Updated per-row tags: "CC ACTIVE" / "STALE — REBIND" / "UNBOUND".
- Files: suiReader.ts, useAuthorizeExtension.ts, TurretListScreen.tsx
- Diff: ~30 changed
- Risk: medium (frontend-only, no contract changes)
- Gates: typecheck ✅ build ✅
- Follow-ups: Live validation — confirm rebind banner appears, rebind succeeds, turrets show CC ACTIVE after.

---

## 2026-03-23 – Fix: Turret module name mismatch + v3 upgrade
- Goal: Fix root cause of turrets ignoring CC doctrine. Game engine hardcodes `moduleName = "turret"` when resolving extensions (see `vendor/world-contracts/ts-scripts/turret/get-priority-list.ts:109`). CC's modules were named `turret_bouncer` / `turret_defense` — the game could never find them. Turrets were using the game's default targeting (shoot non-tribe), not CC code.
- Fix: Created a unified `turret.move` module (correct name for engine resolution) with `CommercialAuth` / `DefenseAuth` auth witnesses and dual-mode dispatch. Reads stored TypeName to determine doctrine. Upgraded to v3 on Utopia.
- Operator action required: Re-authorize all turrets via "Authorize All" (or posture switch) in the CC app. Old `turret_bouncer::BouncerAuth` TypeNames are now detected as "stale" to prompt this.
- Files: turret.move (new), postureSwitchTx.ts, useAuthorizeExtension.ts, suiReader.ts, eventParser.ts, constants.ts, Published.toml
- Artifacts: CC_PACKAGE_ID v3 → `0xb3fd08b7b3a1d2d964c6fc0952955f0ad7a796a6bb174a934522a818a0cc93e7`, tx=`2HuJmaTRXg5y5hNCEQpH4YyEkPu5HV862ap2HBySdQqH`
- Diff: ~170 added, ~20 removed
- Risk: high (Move contract + publish + frontend PTB changes)
- Gates: Move build ✅ Move test ✅ (26/26) typecheck ✅
- Follow-ups: Live validation — re-authorize turrets, fly neutral outsider to gate, confirm not targeted in commercial mode.

---

## 2026-03-23 – TurretResponseEvent + Contract v2 Upgrade
- Goal: Add a CC-specific `TurretResponseEvent` (turret_id, doctrine, candidate/engaged/aggressor counts, top_target_id) emitted when turrets engage targets. Upgrade contract once on Utopia (doctrine fix + event in single publish).
- Design: Created shared `turret_events.move` module with `public(package)` emitter. Both `turret_bouncer.move` and `turret_defense.move` emit conditionally (only when engaged > 0). Frontend parser wired with doctrine-aware descriptions.
- Persistence caveat: Game engine calls `get_target_priority_list` via devInspect (read-only) — events emitted during devInspect are NOT persisted on-chain. Event is structurally correct but won't appear in `queryEvents` under current game engine architecture. Added anyway for testing/future-proofing.
- Publish: Upgrade via `sui client upgrade` — preserves all configs (GateConfig, extension auth, presets, treasury). No re-authorization needed.
- Files: turret_events.move (new), turret_bouncer.move, turret_defense.move, eventParser.ts, constants.ts, Published.toml
- Artifacts: CC_PACKAGE_ID → `0x009419a8ba36423a20ba983f0efe3aae6cdf251a10be98820761ada9e962b62e`, CC_ORIGINAL_PACKAGE_ID unchanged, version=2, tx=`DdyEoGPt5WFAHfvGF7KJhqHqnWGd96yoWRqo9XbMcBm9`
- Diff: ~80 added, ~10 removed
- Risk: high (Move contract + publish)
- Gates: Move build ✅ Move test ✅ (26/26) typecheck ✅

---

## 2026-03-23 – Turret Doctrine Correction: Bouncer → Passive Until Aggression
- Goal: Correct turret_bouncer.move (BouncerAuth) from active non-tribe targeting (+1000) to passive-until-aggression (exclude all non-aggressors). CC's commercial posture should welcome neutral visitors, not shoot them.
- Root cause: Prior implementation mirrored the world-contracts default turret behavior (target non-tribe at low priority). The world default is a generic tribe-perimeter, but CC's product intent is a commerce-friendly zone where only aggressors are engaged.
- Change: turret_bouncer.move now excludes ALL non-aggressors (regardless of tribe). Only aggressors are targeted at +10000. Removed NON_TRIBE_BOOST constant. turret_defense.move unchanged behaviorally (dead-code branch removed, doc comments updated).
- Files: contracts/civilization_control/sources/turret_bouncer.move, contracts/civilization_control/sources/turret_defense.move, src/components/PostureControl.tsx, src/lib/eventParser.ts, 8+ docs
- Diff: ~15 added, ~20 removed code; ~40 added, ~40 removed docs
- Risk: high (Move contract behavior change — requires republish)
- Gates: Move build ✅ Move test ✅ (26/26) typecheck ✅ build ✅
- Follow-ups: Republish contract on Utopia. Live validation: verify empty return list (no aggressors in range) doesn't cause game engine issues. Fallback: turrets offline in commercial if passive mode fails.

---

## 2026-03-22 – Fix: Signal Feed Scope Leak + Turret Doctrine Semantics + Missing Turret Signal
- Goal: Fix three issues from real second-operator testing: (A) Signal Feed showed events from another operator's infrastructure, (B) Turret "Bouncer" mode unexpectedly engaged a non-tribe visitor, (C) No turret engagement signal appeared in CC.
- Root causes:
  - (A) `fetchRecentEvents()` used `MoveModule` filter returning ALL events globally — zero ownership scoping.
  - (B) Both BouncerAuth and DefenseAuth target non-tribe visitors in range. "Bouncer" = tribe bouncer (let friendlies through, target strangers at +1000 priority). This is correct behavior per design.
  - (C) No on-chain "turret fired/engaged" event exists. The game engine calls `get_target_priority_list` via devInspect (read-only) — events emitted during devInspect are not persisted to the chain event store.
- Fix (A): Added `ownedObjectIds` + `walletAddress` params to `useSignalFeed`. Events are client-side filtered: keep only events where `relatedObjectId ∈ ownedIds` OR `sender === walletAddress`. Also fixed missing `relatedIdField` on `TREASURY_SET` and `POSTURE_CHANGED`, and changed trade event `relatedIdField` from `listing_id` to `storage_unit_id` (structure ID).
- Fix (B): Behavior is correct per spec — no code change needed. Labels remain canonical "Bouncer" per product docs.
- Fix (C): No code fix needed — the event doesn't exist on-chain. Updated claim-proof-matrix, demo-beat-sheet, and operator-validation-checklist to reflect reality. Downgraded turret engagement from "provable via Signal Feed" to "observable in game client only."
- Files: src/hooks/useSignalFeed.ts, src/lib/eventParser.ts, src/types/domain.ts, src/screens/ActivityFeedScreen.tsx, src/screens/Dashboard.tsx, docs/decision-log.md, docs/core/civilizationcontrol-claim-proof-matrix.md, docs/core/civilizationcontrol-demo-beat-sheet.md, docs/operations/operator-validation-checklist.md
- Diff: ~80 added, ~60 removed code; ~40 added, ~30 removed docs
- Risk: medium
- Gates: typecheck ✅ build ✅
- Follow-ups: None. Turret targeting events remain in the parser for completeness but are expected to never appear in practice.

---

## 2026-03-22 – Fix: Multi-Operator Action Path (Hardcoded CHARACTER_ID)
- Goal: Fix critical bug where second-operator actions failed with ESenderCannotAccessCharacter because all PTB builders used a hardcoded CHARACTER_ID constant (first operator's character) instead of dynamically resolving the connected wallet's character.
- Root cause: Read path (structure discovery) correctly resolved character per wallet via fetchPlayerProfile(walletAddress). Write path (all admin mutations) imported a static CHARACTER_ID from constants.ts, causing borrow_owner_cap to fail when sender ≠ character owner.
- Files: src/hooks/useCharacter.ts (new), src/App.tsx, src/lib/gatePolicyTx.ts, src/lib/postureSwitchTx.ts, src/lib/transitProofTx.ts, src/lib/structurePowerTx.ts, src/hooks/useAuthorizeExtension.ts, src/hooks/useGatePolicyMutation.ts, src/hooks/usePosture.ts, src/hooks/useTransitProof.ts, src/hooks/useStructurePower.ts, src/hooks/useBuyListing.ts
- Diff: ~80 added, ~60 removed across 12 files (1 new)
- Risk: high (all operator action paths)
- Gates: typecheck ✅ build ✅
- Operator-visible change: Character is now resolved dynamically per wallet. No configuration needed — any Utopia player with structures can operate them. CHARACTER_ID constant retained only for AuthHarness debug display.
- Follow-ups: None — inherently wallet-scoped via TanStack Query cache keyed on walletAddress.

---

## 2026-03-24 – Demo Closure: SSU Marketplace Page + Turret Event Capture
- Goal: Close demo gaps — player-facing SSU marketplace page, turret doctrine change events in Signal Feed, in-game DApp URL for SSUs, demo doc alignment
- Files: src/screens/SsuMarketplacePage.tsx (new), src/hooks/useResolveSsuId.ts (new), src/App.tsx, src/screens/TradePostDetailScreen.tsx, src/lib/eventParser.ts, src/lib/suiReader.ts, docs/core/civilizationcontrol-demo-beat-sheet.md, docs/core/civilizationcontrol-claim-proof-matrix.md
- Diff: +372/-21 across 8 files (2 new)
- Risk: low
- Gates: typecheck ✅ build ✅
- Follow-ups: Capture Utopia testnet tx digests for claim-proof matrix [TBD-digest] entries

---

## 2026-03-22 – Batch Preset Deployment Workflow
- Goal: Enable "author once, apply to many gates" for policy presets
- Files: src/lib/gatePolicyTx.ts, src/hooks/useGatePolicyMutation.ts, src/components/PolicyPresetEditor.tsx, src/screens/GateDetailScreen.tsx, src/types/domain.ts
- Diff: ~180 added LoC across 5 files
- Risk: medium
- Gates: typecheck ✅ build ✅
- Follow-ups: None — completes Gate Policy v2 operator workflow

---

## 2026-03-23 – Authority Model Refactor: AdminCap → OwnerCap<Gate>
- Goal: Replace centralized AdminCap (package-deployer-owned singleton) with decentralized OwnerCap<Gate> (per-structure, operator-owned) authority model. Any player who owns a gate now manages it — no admin-cap transfer needed.
- Files: **Contracts** — `config.move`, `gate_control.move`, `posture.move`, `trade_post.move`, `gate_control_tests.move`, `trade_post_tests.move`. **Frontend** — `constants.ts`, `gatePolicyTx.ts`, `postureSwitchTx.ts`, `suiReader.ts`, `usePosture.ts`, `useGatePolicyMutation.ts`, `useGatePermit.ts`, `useOperatorReadiness.ts`, `PostureControl.tsx`, `GateDetailScreen.tsx`, `GateListScreen.tsx`, `TurretListScreen.tsx`, `StrategicMapPanel.tsx`, `domain.ts`. **Deleted** — `useAdminCapOwner.ts`.
- Diff: ~600 LoC across 20 files (1 deleted)
- Risk: high (core authority model + Move contracts + full frontend data layer)
- Gates: typecheck ✅ build ✅ move build ✅ move test ✅ (26/26 pass, incl. 3 wrong-owner + 1 multi-operator isolation test)
- Key changes: (1) AdminCap struct removed from config.move, (2) all gate_control + posture admin fns take &OwnerCap<Gate> + assert access::is_authorized(), (3) treasury and posture are now per-gate (keyed by gate_id), (4) TradePostAdminCap removed, (5) frontend uses borrow/return OwnerCap<Gate> PTB pattern (same as extension auth), (6) AdminCap mismatch blocker UI removed, (7) useAdminCapOwner hook deleted.
- Follow-ups: Fresh publish required (breaking contract changes). Update CC_PACKAGE_ID + CC_ORIGINAL_PACKAGE_ID + GATE_CONFIG_ID after publish.

---

## 2026-03-22 – AdminCap Ownership Blocker Fix
- Goal: Diagnose and fix "AdminCap owned by a different wallet" blocker in Gate Directive UI
- Files: `src/screens/GateDetailScreen.tsx`
- Diff: ~20 LoC replaced (mismatch block made actionable)
- Risk: low (UI copy/layout only, no logic change to ownership check)
- Gates: typecheck ✅ build ✅
- Root cause: AdminCap is owned by the CLI publish wallet (`0xacff13b…54b1`), but the browser connects via EVE Vault (different wallet address). This is expected cross-wallet behavior, not a bug — the operator uses two different wallets (Sui CLI vs EVE Vault) without realizing they have different addresses.
- Fix: Replaced opaque error with diagnostic panel showing both addresses (AdminCap owner + connected wallet), a copyable `sui client transfer` CLI command, and a "Retry ownership check" button. The safety check is preserved — only the UX of the mismatch state was improved.
- Post-publish operator step: After `sui client publish`, run `sui client transfer --to <EVE_VAULT_ADDRESS> --object-id <ADMIN_CAP_ID>` to move the AdminCap to the browser wallet.
- Follow-ups: None — this is a one-time post-publish step.

---

## 2026-03-22 – Gate Policy v2a Implementation Tranche
- Goal: Implement full v2a preset-based gate policy model end-to-end (contract → frontend → deploy)
- Files: `contracts/civilization_control/sources/config.move` (new), `gate_control.move` (rewrite), `posture.move` (import fix), `tests/gate_control_tests.move` (rewrite), `src/lib/suiReader.ts`, `src/lib/gatePolicyTx.ts`, `src/lib/eventParser.ts`, `src/lib/policyResolver.ts` (new), `src/hooks/useGatePolicy.ts`, `src/hooks/useGatePolicyMutation.ts`, `src/hooks/useGatePermit.ts`, `src/hooks/useTransitProof.ts`, `src/types/domain.ts`, `src/components/PolicyPresetEditor.tsx` (new), `src/components/TreasuryEditor.tsx` (new), `src/screens/GateDetailScreen.tsx`, `src/screens/GatePermitPage.tsx`, `src/constants.ts`
- Diff: ~1200 LoC added/replaced across 18 files, 2 v1 components deleted
- Risk: high (core Move contract + frontend data layer + UI)
- Gates: typecheck ✅ build ✅ move build ✅ move test ✅ (24 tests pass)
- Key decisions:
  - Extracted `config.move` module (GateConfig, AdminCap) to break circular gate_control↔posture dependency
  - Fresh publish (not upgrade) due to structural module changes; new package ID `0x53cc62c6...`
  - Global treasury on GateConfig (not per-gate) — simpler PTB, single address for all toll payouts
  - Max 20 entries per preset enforced on-chain
  - PolicyPresetEditor component replaces TribeRuleEditor + CoinTollEditor with posture-tabbed preset composer
- Artifacts:
  - PackageID: `0x53cc62c6ca8bcb741400aa9ba80f4d43e79002a59ce3f4869034dfb4fd2ce63d`
  - GateConfig: `0x9e40aba6a8313784dc5756fb826b425ce825cc928b156519bffb71cc43e784b1`
  - AdminCap: `0xdf1938869b21796e750014bf1007f6ae74f5aefbcb0b598ffbcb0b1c96de38e0`
  - Tx Digest: `924M2zmLY6db3siKBEfPpWr7h6zqgqxQwdf2cEFnghn5`
- Follow-ups: Cloudflare Pages preview deploy, demo smoke test, v2b (subscriptions) deferred

---

## 2026-03-22 – Submodule Refresh (world-contracts v0.0.19→v0.0.21, builder-docs)
- Goal: Sync vendor submodules to latest upstream; audit jump permit improvements and package ID changes for Gate Policy v2 impact
- Files: `vendor/*` (submodule pointers), `docs/decision-log.md`, `docs/core/gate-policy-v2-design.md`, `docs/core/demo-readiness-tranches.md`
- Diff: submodule pointer updates + ~30 LoC doc addenda
- Risk: low (documentation and submodule pointers only, no code changes)
- Gates: N/A (no code changes)
- Submodule changes:
  - **world-contracts:** `0642c7b` (v0.0.19) → `f761a7f` (v0.0.21). Two commits: `feat(gate): jump permit improvements (#140)` (v0.0.20) + `build: add the upgraded package ids (#141)` (v0.0.21). World package upgraded v1→v2 on Utopia (`published-at` = `0x07e6b8...`, `original-id` = `0xd12a70...` unchanged).
  - **builder-documentation:** `07364c4` → `1f73170`. 11 commits. New pages: `tools/world-upgrades.md` (upgrade sync guide), `tools/resources.md` (canonical package IDs). EveVault image updates.
  - **builder-scaffold:** `8072eac` → `ebc321a`. 1 commit. ZkLogin + dapp dependency bumps.
  - **evevault:** `8f184c5` → `3a6e63c`. 6 commits. Wallet request queue, auth improvements, sponsored tx handler, v0.0.6 tag.
- Key findings:
  - **`gate::issue_jump_permit_with_id<Auth>()`** — new function returns permit `ID` + emits `JumpPermitIssuedEvent`. CC v2a should use this.
  - **`JumpPermitIssuedEvent`** — new event with full permit metadata (jump_permit_id, route_hash, extension_type, expiry). Available for signal feed in v2a.
  - **`gate::issue_jump_permit()`** — unchanged signature, refactored to internal helper. Current CC on-chain contract unaffected.
  - **`assert_gate_extension_matches<Auth>()`** — new internal helper. No external API change.
  - **`assert_jump_permit_extension_authorization<Auth>()`** — new internal helper for both-gate validation. Cleaner code, same behavior.
  - **No breaking changes** to current CC gate permit flow. CC v1 compiled against world v1 remains functional.
  - **EVE assets package unchanged** (still v1, `0xf0446b...`).
  - **Treasury semantics clarified** in design doc — global treasury = operator-controlled payout address, direct transfer, no escrow.
- Follow-ups: None blocking. v2a contract implementation can proceed with `issue_jump_permit_with_id`.

---

## 2026-03-22 – Gate Policy v2 Design Confirmed
- Goal: Finalize gate-policy-v2 contract design with all operator decisions confirmed; capture "author once, apply to many gates" UX requirement
- Files: `docs/core/gate-policy-v2-design.md` (EDIT), `docs/core/demo-readiness-tranches.md` (EDIT), `docs/decision-log.md` (EDIT)
- Diff: ~60 LoC edited
- Risk: low (documentation only, no code changes)
- Gates: N/A (no code changes)
- Decisions (all 6 open questions resolved):
  - **v2a/v2b split confirmed.** v2a = policy richness + posture presets (demo-critical). v2b = subscription permits (deferred).
  - **Abort on missing preset confirmed.** If no `PolicyPreset` DF exists for active mode + gate, `request_jump_permit` aborts. Frontend validates preset completeness.
  - **Fresh publish confirmed.** No deprecated stubs. Clean package with re-authorization.
  - **One global treasury** on `GateConfig` (sufficient for demo). Not per-preset.
  - **Cap at 20 entries** per preset (gas safety, enforced on-chain).
  - **Fixed 2 posture modes** (Commercial / Defensive) for demo.
  - **Author-once workflow (NEW).** Operator authors a policy template in UI, selects target gates, frontend generates a single PTB with N × `set_policy_preset` calls. On-chain: per-gate storage. UX: batch deploy.
- Follow-ups: Contract implementation (v2a) can begin. Defense Mode visual tranche can proceed in parallel.

---

## 2026-03-22 – Demo Readiness Audit + Gate Policy v2 Design Kickoff
- Goal: Systematic audit of map, signal feed, posture, gate policy, and attention markers to establish demo truth; design richer gate policy contract to close the biggest product-model gap
- Files: `docs/core/demo-readiness-tranches.md` (NEW), `docs/core/gate-policy-v2-design.md` (NEW), `docs/README.md` (EDIT), `docs/decision-log.md` (EDIT)
- Diff: +380 LoC added
- Risk: low (documentation and design only, no code changes)
- Gates: N/A (no code changes)
- Decisions:
  - **Gate policy richness is the primary contract gap.** Current model (1 tribe + 1 flat toll per gate) cannot express the operator's intended commercial or defensive policy scenarios. Next major tranche is contract-design / contract-upgrade before more UI polish.
  - **v2a/v2b scope split proposed.** v2a = policy richness + posture presets (demo-critical). v2b = subscription permits (deferred).
  - **Recommended data model: vector-in-preset.** `PolicyPresetKey { gate_id, mode }` → `PolicyPreset { entries, default_access, default_toll, treasury }`. Posture switch flips active mode; permit issuance reads dynamically. No batch gate rewrite in PTB.
  - **Fresh publish likely required.** Old DF types (`TribeRuleKey`, `CoinTollKey`) replaced; maintaining stubs is messier than fresh publish + re-authorization.
  - **Defense Mode visual tranche (UI) can proceed in parallel** with contract design — ~20 lines to make gate glyphs + link colors respond to posture.
- Follow-ups: Operator confirmation on 6 open questions in gate-policy-v2-design.md before contract implementation begins.

---

## 2026-03-21 – Gate Detail: In-Game DApp URL + Probe Cleanup
- Goal: Expose copyable per-gate in-game URL on gate detail page; remove abandoned probe/debug pages
- Files: `src/screens/GateDetailScreen.tsx` (EDIT), `src/main.tsx` (EDIT), `src/screens/ProbePage.tsx` (DELETE), `src/screens/DeepProbePage.tsx` (DELETE), `src/screens/BridgeProbePage.tsx` (DELETE), `src/screens/bridge-probe/` (DELETE)
- Diff: +40 LoC added, ~1540 LoC removed
- Risk: low (UI addition + dead code removal, no contract changes)
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Bridge-context path abandoned** for hackathon purposes. Source audit confirmed all 5 bridge globals (`eveFrontierRpcRequest`, `_eveFrontierRpcRequest`, `callWallet`, `ccpPython`, `__pythonCall`) are undocumented game-client internals with zero source/docs/types in any vendor repo.
  - **Operator setup model:** Gate detail page now shows an "In-Game DApp URL" section with a one-click copy button. URL format: `https://<origin>/gate/<gateObjectId>`. Operator pastes this into the gate's custom DApp URL field in-game.
  - **Probe routes removed:** `/probe`, `/probe/deep`, `/probe/bridge` deleted from app surface. Probe code was diagnostic-only with no reuse value.
- Follow-ups: None required for hackathon scope.

---

## 2026-03-22 – Bridge Probe: In-Game CEF Bridge Discovery
- Goal: Probe undocumented in-game browser globals to determine if assembly context can be discovered without URL-embedded object IDs
- Files: `src/screens/BridgeProbePage.tsx` (NEW), `src/main.tsx` (EDIT)
- Diff: +320 LoC added, ~2 LoC edited
- Risk: low (read-only probe page, no contract changes, code-split standalone)
- Gates: typecheck ✅ build ✅ deploy ✅
- Decisions:
  - **Discovery from /probe/deep:** Game client injects 5 undocumented globals: `eveFrontierRpcRequest`, `_eveFrontierRpcRequest`, `callWallet`, `ccpPython`, `__pythonCall`. URL query params are NOT appended to custom dApp URLs.
  - **Previous audit invalidated:** 2026-03-21 audit concluded "no JS globals injected" — this is now proven wrong. Bridge functions exist but remain undocumented in vendor code and builder docs.
  - **Wallet Standard confirmed in-game:** Game registers "EVE Frontier Client Wallet" via standard CustomEvent protocol. Wallet identity IS available.
  - **ccpPython most promising for assembly context:** Follows CCP's EVE Online CCPEVE pattern (Python bridge exposing session.characterId, solarSystemId, etc.).
  - **Zero references in workspace:** None of these globals appear anywhere in vendor/world-contracts, @evefrontier/dapp-kit, or builder-documentation.
- Follow-ups: Run bridge probe in-game to test actual responses. If context found, update `/gate` to use bridge instead of URL params.

---

## 2026-03-21 – Gate Permit: /gate Query-Context Resolution
- Goal: Make `/gate` the preferred builder setup path by resolving gate identity from in-game query params instead of requiring per-gate URLs
- Files: `src/lib/objectResolver.ts` (NEW), `src/hooks/useResolveGateId.ts` (NEW), `src/screens/GatePermitPage.tsx` (EDIT), `src/App.tsx` (EDIT)
- Diff: +60 LoC added, ~15 LoC edited
- Risk: medium (new resolution logic, no contract changes)
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Preferred setup:** Operator configures all gates with URL `/gate`. Game client appends `?itemId=<inGameId>&tenant=utopia`. Page derives the Sui object ID via deterministic BCS + blake2b derivation (same algorithm as @evefrontier/dapp-kit SmartObjectProvider).
  - **Fallback:** `/gate/:gateId` still works for debug/manual access with a direct Sui object ID.
  - **Resolution:** Pure client-side derivation using `deriveObjectID` from `@mysten/sui/utils` and hardcoded ObjectRegistry address (`0xc2b9...dc57`). Zero RPC calls — derivation is pure math.
  - **Verified:** Roundtrip test confirmed `itemId=1000000015746 + tenant=utopia` derives to known gate `0xf130...1b68`.
  - **No env vars required:** Uses `WORLD_PACKAGE_ID` from constants.ts directly, avoiding dependency on `VITE_EVE_WORLD_PACKAGE_ID`.

---

## 2026-03-21 – Gate Permit URL Model Audit
- Goal: Determine whether the in-game browser auto-injects gate context or requires URL-encoded identity
- Files: (no code changed — audit only)
- Diff: 0 LoC
- Risk: low (documentation)
- Gates: N/A
- Decisions:
  - **Confirmed:** The in-game browser does NOT inject assembly context via JS globals, postMessage, or window properties. URL is the sole context source.
  - **Standard dapp-kit model:** Game client appends `?itemId=<inGameId>&tenant=<env>` to the assembly's configured DApp URL. `SmartObjectProvider` reads these params and resolves itemId → Sui object ID via `ObjectRegistry` DF.
  - **CivilizationControl model:** We embed the Sui object ID directly in the URL path (`/gate/:gateId`). This is simpler (no itemId→objectId resolution), requires one `update_metadata_url` call per gate.
  - **MVP recommendation: KEEP `/gate/:gateId`.** The operator configures the URL once per gate. The player presses F in-game, the browser opens the URL, and the page loads with the correct gate context. Players never see or type an object ID.
  - **Future option:** Accept `?itemId=&tenant=` as a secondary input path (standard dapp-kit compatibility). Not needed for MVP.

---

## 2026-03-21 – Player-Facing Gate Permit Page
- Goal: Build a standalone /gate/:gateId page where players acquire JumpPermits in the in-game browser
- Files: `src/hooks/useAutoConnect.ts` (NEW), `src/lib/gatePermitTx.ts` (NEW), `src/hooks/useGatePermit.ts` (NEW), `src/screens/GatePermitPage.tsx` (NEW), `src/App.tsx` (EDIT)
- Diff: +240 LoC added, ~10 LoC restructured in App.tsx
- Risk: medium (new route + PTB builders, no contract changes)
- Gates: typecheck ✅ build ✅
- Decisions:
  - Route `/gate/:gateId` renders standalone (no operator sidebar/header) — it's a player utility, not a dashboard screen.
  - `useAutoConnect` hook auto-connects "EVE Frontier Client Wallet" on first visit (VaultProvider only handles reconnect from localStorage).
  - PTB builders parameterized with `characterId` (unlike operator self-test which hardcodes CHARACTER_ID).
  - App.tsx split into top-level `App()` (BrowserRouter + route split) and `OperatorShell()` (sidebar/header + operator routes).
  - Supports both free and toll permit paths. Tribe mismatch shown as blocked with explanation.

---

## 2026-03-21 – Gate Jump Failure Diagnosis: Extension Persists After Rule Removal
- Goal: Diagnose why a linked, online gate pair produces "failed to jump" in-game
- Files: (no code changed — diagnosis only; docs updated)
- Diff: 0 LoC (investigation)
- Risk: high (live gate traversal blocked)
- Gates: N/A (investigation)
- Decisions:
  - **Root cause:** Removing tribe rules and coin tolls from GateConfig does NOT deregister the `gate_control::GateAuth` extension from the Gate object. The extension field lives on the Gate shared object independently. With `gate.extension = Some(GateAuth)`, the default `gate::jump()` aborts with `EExtensionNotAuthorized` (code 4). No JumpPermit existed for the character, so `jump_with_permit()` was also unusable.
  - **UX blind spot:** CivilizationControl's UI allows removing all rules but does not make it obvious that the extension registration still blocks default jumps. "All rules removed" ≠ "gate is open."
  - **Fix:** Call `gate::revoke_extension_authorization()` on both source and destination gates to clear the extension slot. This restores default `jump()` behavior.
  - **Follow-up:** Add an "Extension Status" indicator to gate management UI that distinguishes "authorized + no rules" from "no extension." Consider adding a "Revoke Extension" action button to the gate detail screen.

---

## 2026-03-21 – Strategic Network Control Strip Visual Refinement
- Goal: Match Figma-intent for posture mode selector chips, make "Save Preset" text-visible, remove "6 nodes" clutter
- Files: `src/components/PostureControl.tsx`, `src/components/topology/StrategicMapPanel.tsx`
- Diff: ~15 LoC changed across 2 files
- Risk: low (UI-only, styling refinements)
- Gates: typecheck ✅ build ✅
- Decisions:
  - Chip icons sized `w-3.5 h-3.5`, gap `gap-2` to match Figma spec
  - Save Preset upgraded from icon-only disabled to visible "Save Preset" text label (still placeholder)
  - Removed "6 nodes" counter from control strip — duplicate information
  - Header padding adjusted to `py-4` per Figma
  - Divider margin `mx-2` per Figma

---

## 2026-03-21 – Command Overview Refinement: Mode Selector Tabs + Hex Demotion
- Goal: Replace loud orange CTA posture button with calm Figma-style mode selector chips; demote raw hex IDs to secondary treatment on overview surfaces
- Files: `src/components/PostureControl.tsx`, `src/components/topology/StrategicMapPanel.tsx`, `src/components/Sidebar.tsx`
- Diff: ~+50 LoC added, ~20 LoC removed across 3 files
- Risk: low (UI-only, no contract/state/PTB changes)
- Gates: typecheck ✅ build ✅
- Decisions:
  - PostureControl inline variant now renders Commercial/Defensive chip tabs (translucent active state, ghost inactive) matching Figma mock, replacing filled CTA button
  - Added Save Preset ghost placeholder (disabled, Settings2 icon) after vertical divider
  - Posture state label ("Commercial" / "Defense Mode") promoted to Strategic Network header title area (left-aligned)
  - Header subtitle updated to "Infrastructure Posture & Topology Control"
  - NodeOverlayLabel: hex suffix from fallback names now demoted to muted/mono secondary text
  - Sidebar structure entries: same hex demotion treatment
- Follow-ups: Save Preset feature implementation; consider renaming structures on-chain

---

## 2026-03-21 – UI Polish Fix: Posture Dedup, Summary-Surface Labels, Map Label Hierarchy
- Goal: Eliminate duplicate posture controls in Strategic Network; promote solar system context on sidebar + map labels; enforce Name → Solar System → Short ID hierarchy on summary surfaces
- Files: `src/components/PostureControl.tsx`, `src/components/topology/StrategicMapPanel.tsx`, `src/components/Sidebar.tsx`
- Diff: ~+70 LoC added, ~40 LoC removed across 3 files
- Risk: low (UI-only, no contract/state/PTB changes)
- Gates: typecheck ✅ build ✅
- Decisions:
  - Removed `PostureIndicator` read-only badges from Strategic Network header — was redundant with PostureControl
  - Removed separate PostureControl compact strip below header — was a second stacked posture display
  - Added PostureControl `inline` variant: state dot + label + action button rendered directly in header row
  - Result: single integrated posture control surface, no duplication
  - Sidebar structure entries now show solar system name (from spatial pin) as secondary text below structure name
  - Map node overlay labels: solar system promoted to primary label when pinned, node name becomes secondary
  - Raw IDs intentionally kept on detail screens for operator matching
- Follow-ups: None

---

## 2026-03-18 – UI Polish: Posture Integration, Solar System Context, Location Columns
- Goal: Integrate PostureControl into Strategic Network panel; surface solar system context on all list/detail screens; replace raw Object IDs with meaningful Location columns; extract shared utilities (formatAddress, NodeContextBanner)
- Files: `src/lib/formatAddress.ts` (NEW), `src/components/NodeContextBanner.tsx` (NEW), `src/components/PostureControl.tsx`, `src/components/topology/StrategicMapPanel.tsx`, `src/components/StructureDetailHeader.tsx`, `src/screens/Dashboard.tsx`, `src/screens/GateDetailScreen.tsx`, `src/screens/TradePostDetailScreen.tsx`, `src/screens/TurretDetailScreen.tsx`, `src/screens/NetworkNodeDetailScreen.tsx`, `src/screens/GateListScreen.tsx`, `src/screens/TradePostListScreen.tsx`, `src/screens/TurretListScreen.tsx`, `src/screens/NetworkNodeListScreen.tsx`
- Diff: ~+180 LoC added, ~100 LoC removed across 14 files (2 new, 12 modified)
- Risk: low (UI-only, no contract/state/PTB changes)
- Gates: typecheck ✅ build ✅
- Decisions:
  - PostureControl integrated into StrategicMapPanel via `compact` prop — removed standalone card from Dashboard
  - Display hierarchy rule: Name (from Metadata.name) → Solar System (from spatial pin) → Short ID (fallback)
  - List screen "Object ID" columns → "Location" columns showing solar system or dimmed shortId
  - NodeContextBanner extracted from GateDetailScreen as shared component, added to TradePost + Turret detail screens
  - Solar system resolved via `getSpatialPin()` on parent network node — no prop drilling needed
- Follow-ups: None — coherent visual polish tranche, no behavioral changes

---

## 2026-03-21 – world-contracts Submodule Refresh to v0.0.19
- Goal: Update vendor/world-contracts from v0.0.18+1 (8e2e97b) to v0.0.19 (0642c7b) and audit impact.
- Files: vendor/world-contracts (submodule pointer), decision-log.md, assumption-registry, gate-lifecycle-runbook, extension-freeze-safety-guide
- Diff: submodule pointer update + doc callouts (~30 LoC)
- Risk: low (no code changes; submodule is read-only dependency; Move build + 21 tests pass)
- Upstream delta: 1 commit (feat: qol functions #137), +1001/-57 lines
- Key v0.0.19 additions:
  - `revoke_extension_authorization` on Gate, Turret, SSU (new — previously no deauthorize existed)
  - `delete_jump_permit` and `delete_jump_permit_with_auth` (permit cleanup)
  - `route_hash()` public view function on Gate
  - `receive_owner_cap` promoted from `public(package)` to `public`
  - `turret.metadata()` promoted from `#[test_only]` to `public`
  - `turret.extension()` (non-aborting) alongside existing `extension_type()` (aborting)
  - `hp_ratio()`, `shield_ratio()`, `armor_ratio()` on TargetCandidate
  - `ExtensionRevokedEvent` on Gate, Turret, SSU
  - `id()` view functions on 15+ shared objects/structs
  - Extension freeze updated docs: revocation also blocked after freeze
  - New tests: gate, storage_unit, turret test suites (241+128+82 lines)
  - New scripts: delete-jump-permit.ts, delete-jump-permit-extension.ts
- Impact on CivilizationControl: **No breaking changes. No code adoption required.**
  - ADOPT NOW: None (refresh + doc corrections only)
  - DOCUMENT FOR LATER: `revoke_extension_authorization` (enables "clear extension" UI), `ExtensionRevokedEvent` (signal feed), `delete_jump_permit` (stale permit cleanup), `hp/shield/armor_ratio` (richer targeting)
  - IGNORE FOR HACKATHON: `receive_owner_cap` visibility change (we use `borrow_owner_cap`), `id()` view functions (we use `object::id()`)
- Gates: Move build ✅ Move tests (21/21) ✅
- Follow-ups: Consider adopting `revoke_extension_authorization` and `ExtensionRevokedEvent` in future extension management UI.

---

## 2026-03-19 – Regression Fix: Spatial Orientation + @theme inline + NodeLocationPanel
- Goal: Fix two operator-reported regressions from UI Polish Tranche 1 and a latent CSS infrastructure defect.
- Files: theme.css, App.tsx
- Diff: ~70 LoC added
- Risk: low (restoration of previously-working capability + CSS infrastructure fix)
- Root causes:
  - **Sidebar active state not orange:** The `@theme inline` block that bridges CSS variables (`--primary`, `--foreground`, `--muted-foreground`, etc.) to Tailwind v4 utility classes (`text-primary`, `bg-primary/10`, `border-primary`, `text-foreground`, `text-muted-foreground`) was never present in the project's theme.css. The Figma Make export had it; the project copy did not. This means ALL theme-variable-based Tailwind utilities were silently generating no CSS. Compiled CSS jumped from 36KB → 43KB after the fix — ~7KB of previously-missing utility rules.
  - **Spatial orientation lost:** NodeLocationPanel (the only UI for creating/editing solar system → network node assignments) was removed from Dashboard in Tranche 1. No replacement surface was created. Spatial pins in localStorage were preserved but operators could no longer create or modify them.
- Fixes:
  - **Added `@theme inline` block** to src/styles/theme.css — bridges all 30+ CSS variables to Tailwind v4 color/radius utilities. This fixes not just the sidebar but every `text-primary`, `text-foreground`, `text-muted-foreground`, `bg-primary/*`, `border-primary`, `bg-muted`, `text-destructive` usage across the entire codebase.
  - **Moved NodeLocationPanel** to the Configuration page (`/settings` route). Previously a placeholder — now a real surface with spatial assignment capability. Dashboard remains clean; spatial pin creation is accessible via Configuration nav item.
- Required product behaviors established:
  - Approximate spatial orientation on the Strategic Network Map is a **required product behavior**, not optional polish.
  - Solar-system-per-network-node context is a **required retained capability**.
  - Sidebar active route emphasis must visibly render as orange per design tokens.
  - The `@theme inline` block is mandatory CSS infrastructure — do not remove.
- Gates: typecheck ✅ build ✅
- Follow-ups: None — spatial pin CRUD is restored, sidebar is now correctly orange.

---

## 2026-03-19 – UI Polish Tranche 1: Demo Readability Pass
- Goal: Tighten the Command Overview for the 3-Second Check and eliminate placeholder scaffolding before demo.
- Files: Dashboard.tsx, App.tsx, Sidebar.tsx, PostureControl.tsx, Header.tsx, GateDetailScreen.tsx
- Diff: ~120 LoC changed
- Risk: low
- Decisions:
  - **Removed NodeLocationPanel** from Dashboard (setup-only tool, not demo-relevant, pushed below fold).
  - **Sidebar dimming:** inactive nav items changed to `text-muted-foreground` so active state pops more.
  - **PostureControl surface:** `bg-zinc-900/60` → `bg-[var(--card)]` for consistent card tokens.
  - **Header brand:** `font-semibold` → `font-medium` per Figma Pass 5.
  - **Revenue cold-start:** "—" → "0", "Revenue from tolls and trades" → "Awaiting toll and trade events".
  - **Grid Status subtitle:** static "Online / Deployed" → computed "All operational" / "N structures offline".
  - **Signal empty state:** governance-voiced copy replacing generic SaaS text.
  - **Attention Required:** replaced 2 static placeholders (fuel/extension audit) with computed alerts from real data (offline count, extension gaps). Shows "All clear" when no issues.
  - **Gate Detail:** added "Powered by [NodeName]" banner with node status + fuel context. Gates don't own fuel — this shows truthful attribution to parent network node.
- Gates: typecheck ✅ build ✅
- Follow-ups: NodeLocationPanel may move to Network Nodes page if needed.

---

## 2026-03-19 – Dashboard Foundation Tranche Merged to Master
- Goal: Close the `feature/dashboard-foundation` branch. Squash merge all work into `master` and open `feature/ui-polish` for the next tranche.
- Decisions:
  - **Squash merged** 204 files (+20,909/−600 LoC) into a single commit on `master` (8a1030f).
  - **Feature scope:** asset discovery, gate/turret/SSU/network-node detail screens, posture switch, trade post (seller + buyer), signal feed (8 event types), transit proof builder, topology map, fuel runtime gauges, denomination correction, admin ownership checks, tribe catalog, operator validation checklist, 800ms posture confirmation transitions.
  - **New branch** `feature/ui-polish` created from merged `master` for the next tranche.
  - **No UI polish implementation started** — branch is clean, ready for work.
- Files: entire src/, contracts/, docs/ trees (see commit for full diff)
- Diff: +20,909 / −600 LoC (squash of 10 feature-branch commits)
- Risk: low (merge of already-verified code)
- Gates: typecheck ✅ build ✅ preview-deploy ✅

## 2026-03-19 – Posture Visual Confirmation Flow + Extension Event Decision
- Goal: Make posture switch visuals update on confirmed chain state rather than appearing as an instant local toggle. Assess whether world-level extension events should be surfaced in Signal Feed.
- Decisions:
  - **Posture colors were ALREADY chain-confirmed** — `usePostureState()` reads GateConfig DF via chain RPC; colors update only when refetch returns new data after `invalidateQueries(["posture"])`. The problem was purely visual: no CSS transition, so the color snap looked fake.
  - **Added 800ms CSS transitions** to all posture-dependent visual elements: topology glyph colors (SVG `color` property), defense overlay (opacity), node overlay label borders, PostureIndicator badges, PostureControl dot and button, TurretListScreen PostureBadge.
  - **Added "Confirming…" transient label** on PostureControl between tx success and posture refetch completion (uses `isFetching` from TanStack Query after invalidation).
  - **Extension events deferred from Signal Feed.** `ExtensionAuthorizedEvent` is emitted by world-contracts (gate.move, turret.move, storage_unit.move) — different package from CC. Would require 3 additional `queryEvents` RPCs per poll cycle. `PostureChangedEvent` (CC module, already surfaced) proves posture switch; turret extension swap is atomic in the same PTB. Extension event parsing also requires decoding `TypeName::with_defining_ids<Auth>()` strings. Cost exceeds demo value; deferred.
- Files: src/components/topology/StrategicMapPanel.tsx, src/components/PostureControl.tsx, src/screens/TurretListScreen.tsx
- Diff: ~15 LoC changed across 3 files
- Risk: low (CSS transitions only, no logic changes)
- Gates: typecheck ✅ build ✅

## 2026-03-18 – Transit Proof Builder: Live TribeCheckPassed + TollCollected Events
- Goal: Build minimal PTB + UI path so operator can trigger `request_jump_permit` from the dashboard, generating live transit-related proof events (TribeCheckPassedEvent, TollCollectedEvent) during rehearsal/demo.
- Decisions:
  - **Transit proof is operator-self-testable.** `request_jump_permit` is public (no AdminCap, no verify_sponsor). The operator's own character can request a permit on their own gate, producing real on-chain events observable in Signal Feed.
  - **Free vs toll paths both supported.** `buildTransitProofFreeTx` (no toll configured) and `buildTransitProofWithTollTx` (splits EVE coin for toll payment) cover both demo scenarios.
  - **This does NOT prove actual jump execution.** `JumpPermit` is created and transferred to the character, but `jump_with_permit` (which consumes the permit and moves the character) requires AdminACL co-signature. Transit proof = permit issuance + toll collection, not character movement.
  - **Hostile denial remains unobservable.** MoveAbort from `ETribeNotAllowed` reverts all events — no Signal Feed entry. This is structural and cannot be fixed from the frontend.
- Files: src/lib/transitProofTx.ts (new), src/hooks/useTransitProof.ts (new), src/lib/suiReader.ts (+fetchLinkedGateId), src/screens/GateDetailScreen.tsx (+TransitProofSection)
- Diff: ~200 LoC added across 4 files
- Risk: medium (new PTB builder + hook, no contract changes)
- Gates: typecheck ✅

## 2026-03-18 – Strict Verification Pass + Signal Feed Invalidation Fix
- Goal: Code-traced verification of all 14 demo event paths. Produce definitive yes/no for each claim.
- Decisions:
  - **Transit events (TribeCheckPassed, TollCollected) are triggerable** — `JumpPermit` has `key, store` (not hot potato). `request_jump_permit` is public, no verify_sponsor needed. No PTB builder exists yet. Building one (~30 LoC) would enable live transit proof.
  - **Signal feed invalidation key bug fixed** — `usePosture.ts` invalidated `["signals"]` instead of `["signalFeed"]`. Caused 30s stale state after posture switch. Fixed to `["signalFeed"]`.
  - **14-path verification matrix completed** — 8 paths fully wired (operator-callable with full UI pipeline), 2 triggerable but not wired (transit events), 1 impossible (hostile denied), 2 game-engine-only (turret targeting), 1 invisible (turret extension swap — world event not parsed).
- Files: src/hooks/usePosture.ts, decision-log.md
- Diff: 1 LoC changed
- Risk: low (bug fix)
- Gates: typecheck pass

## 2026-03-18 – Demo Scope Lock: Freeze Excluded, Hostile Denied via Narration, Turret Targeting Untested
- Goal: Lock demo scope based on beat-sheet alignment audit. Stop repeating analysis; capture corrected decisions.
- Decisions:
  - **Freeze excluded from demo.** `freeze_extension_config` is irreversible — freezing turrets permanently breaks posture switching (BouncerAuth ↔ DefenseAuth). The project's own `extension-freeze-safety-guide.md` already says "Do NOT freeze" during demo. Beat sheet narration referencing live freeze must be rewritten.
  - **Hostile denied handled via narration, not UI.** `request_jump_permit` uses `assert!(..., ETribeNotAllowed)`, which aborts the entire tx — no events fire. The MoveAbort trace exists only in the hostile's wallet response, not in the operator's Signal Feed. Evidence is structurally unobservable from the operator dashboard. Beat 4 narration should acknowledge this honestly.
  - **Turret targeting treated as external/untested.** `get_target_priority_list` is game-engine-initiated. `BouncerTargetingEvent` / `DefenseTargetingEvent` fire only when the game engine evaluates targeting with hostiles in proximity. The operator cannot trigger this. Never validated live. Beat 6 narration should frame posture switch as the operator's provable action, not turret targeting.
  - **Focus shifted to reset/rehearsal reliability.** No mock/demo mode. Frontend reads live Sui RPC with no replay capability. Every rehearsal run = real on-chain transactions. A pre-take reset procedure is the critical deliverable.
  - **Functional demo spine confirmed:** wallet connect → structure discovery → extension auth → tribe rule → coin toll → posture switch → trade listing create → trade listing buy. All 8 steps are implemented with functional PTB builders and UI surfaces.
- Files: decision-log.md, operator-validation-checklist.md, civilizationcontrol-demo-beat-sheet.md
- Risk: low (doc-only, no code changes)
- Gates: N/A (documentation)

---

## 2026-03-18 – Network Node Fuel Row: Compact Gauge Layout
- Goal: Replace text-heavy fuel row with scannable gauge-first layout.
- Before: `D1 • 2,897 / 3,571 units • ~12d 2h` — unit counts dominate, no visual gauge.
- After: `[████░░░░] D1 ~12d 2h` — compact horizontal fill gauge, then fuel type, then runtime. Unit counts available as tooltip hover.
- Gauge represents tank fullness only (quantity / maxUnits). Runtime remains separate text.
- Files: NetworkNodeListScreen.tsx (list-row fuel cell)
- Diff: ~15 LoC changed in 1 file
- Risk: low
- Gates: typecheck ✅ build ✅

---

## 2026-03-18 – Denomination Correction & Fuel Type Resolution

### A. EVE/Lux conversion bug fixed
- Root cause: CoinTollEditor labeled on-chain base units as "EVE". Chain stores EVE base units (1 EVE = 10^9 base units, like SUI/MIST). The editor passed `parseInt(input)` raw to the chain and labeled the field "Price in EVE", so "100,000,000 EVE" was actually 0.1 EVE. Lux conversion (÷10M) was correct for base units but wrong given the "EVE" label.
- Corrected exchange rate: **1 EVE = 100 Lux = 1,000,000,000 base units. 1 Lux = 10,000,000 base units.**
- Fix: CoinTollEditor now inputs in human-readable EVE (e.g., "100" = 100 EVE). On submit converts to base units via `eveToBaseUnits()`. On display converts from base units via `baseUnitsToEve()`. Lux shown as `eve × 100`.
- Before: Operator enters "100000000" labeled "EVE" → "100,000,000 EVE (10 Lux)". Confusing/wrong.
- After: Operator enters "100" → "100 EVE (10,000 Lux)". Chain receives 100,000,000,000 base units.
- Denomination flow: User types EVE → UI displays EVE (Lux secondary) → chain receives base units.
- Also centralized inline `/ 10_000_000` in eventParser.ts and SignalEventRow.tsx to use `formatLux()` from currency.ts. Centralized `* 10_000_000` in CreateListingForm.tsx to use `luxToBaseUnits()`.
- Files: CoinTollEditor.tsx, eventParser.ts, SignalEventRow.tsx, CreateListingForm.tsx

### B. Fuel runtime now uses actual fuel type efficiency
- Root cause: `formatRuntime()` computed `quantity × burnRateMs` (treating all fuel as 100% efficiency). On-chain formula: `actual_rate = burnRateMs × efficiency / 100`. D1 Fuel (10%) burns 10× faster than 100% baseline → displayed runtime was ~10× too long.
- Fix: Added `typeId` and `unitVolume` to FuelState. `resolveFuel()` now reads `type_id` (Option<u64>) and `unit_volume` from on-chain Fuel struct. Created `src/lib/fuelRuntime.ts` with efficiency map (D1=10%, D2=15%, EU-40/SOF-40=40%, SOF-80=80%, EU-90=90%), runtime computation, and shared formatting.
- Type resolution: Uses existing `typeCatalog.ts` → `getItemTypeById(typeId)` → name. Efficiency looked up by type_id from hardcoded map (sourced from FuelConfig on-chain values).
- Fallback: If fuel type lookup fails, shows "unknown fuel type" warning instead of fake runtime.
- Display format: `D1 • 3,571 / 3,571 units • ~14d 21h` with fill bar based on tank fullness (quantity/maxUnits).
- Before: "3,571 units (~148d 19h)" — 10× too long for D1.
- After: "D1 • 3,571 / 3,571 units • ~14d 21h" — correct for D1 at 10%.
- Files: domain.ts, suiReader.ts, fuelRuntime.ts (new), NetworkNodeListScreen.tsx, NetworkNodeDetailScreen.tsx, StructureDetailHeader.tsx
- Risk: medium — changes domain type shape, new file
- Gates: typecheck ✅ build ✅

---

## 2026-03-18 – Product Logic Corrections: Posture Toll Decoupling, EVE-Primary UX, Fuel Runtime

### A. Posture switch no longer mutates gate tolls
- Root cause: `PostureControl.tsx` hardcoded `{ price: 100_000_000, treasury: TREASURY_ADDRESS }` (flat 10 Lux) as the toll restore when switching defense → commercial. This silently overwrote any operator-configured per-gate toll values.
- Fix: Posture switching now only records posture state + swaps turret extensions. Gate toll configuration is **not modified** by posture changes — tolls are an independent operator concern managed via the gate policy composer. `postureSwitchTx.ts` no longer contains `set_coin_toll` or `remove_coin_toll` calls. `usePosture.ts` no longer pre-reads gate policies.
- Before: Commercial→Defense removes all tolls. Defense→Commercial restores flat 10 Lux on all gates.
- After: Posture switch preserves existing toll config unchanged in both directions.
- Files: postureSwitchTx.ts, usePosture.ts, PostureControl.tsx

### B. Toll UX converted to EVE-primary / Lux-secondary
- Root cause: CoinTollEditor used Lux as the input unit and displayed Lux-only. EVE Frontier is EVE-denominated; Lux is a derived display unit (1 Lux = 10,000,000 EVE).
- Fix: Input field now accepts raw EVE units. Lux shown as secondary helper text below the input (≈ X Lux). Display readback shows "Price: X EVE (Y Lux)". No conversion math on write — value goes to chain as-is.
- Before: Operator enters "10" meaning 10 Lux → multiplied by 10,000,000 → stored as 100,000,000 EVE.
- After: Operator enters "100000000" meaning 100,000,000 EVE → stored as-is. Lux shown as "≈ 10 Lux".
- Files: CoinTollEditor.tsx

### C. Network node fuel display replaced with truthful runtime
- Root cause: `resolveFuel()` computed `quantity / max_capacity * 100` as a percentage, but `quantity` is a unit count and `max_capacity` is a volume limit (unit_volume × max_units). The ratio is dimensionally wrong — a misleading percentage.
- Fix: Replaced `fuelPercent: number` with `fuel: FuelState` on Structure type. `FuelState` contains `{ quantity, maxCapacity, burnRateMs, isBurning }` read directly from on-chain Fuel struct fields. Display shows "X units loaded" with estimated runtime "~Xd Xh" based on `quantity × burn_rate_in_ms`. Runtime labeled as approximate — actual varies by fuel type efficiency (10-100%).
- Before: "3%" bar (meaningless ratio of units to volume).
- After: "3,571 units (~148d 19h)" at base burn rate.
- Files: domain.ts (+FuelState), suiReader.ts (resolveFuel rewrite), StructureDetailHeader.tsx, NetworkNodeListScreen.tsx, NetworkNodeDetailScreen.tsx

### D. Gate posture visual indicator
- Fix: GateListScreen header now shows a posture TagChip (DEFENSE MODE / COMMERCIAL) read via `usePostureState()`.
- Files: GateListScreen.tsx
- Risk: low

- Diff: ~120 LoC changed across 10 files
- Risk: medium (A touches PTB builder, C changes domain type shape)
- Gates: typecheck ✅ build ✅

---

## 2026-03-17 – TradePost Stale-Extension Recovery Path + Toll Behavior Documentation
- Goal: Add batch and individual re-authorize buttons for TradePosts (SSUs) with stale extensions, mirroring the gate re-auth pattern. Document toll posture-restore behavior.
- Root cause (re-auth): `authorizeSsu()` in useAuthorizeExtension was hardcoded to a single SSU_ID constant. No batch method existed, and no UI buttons triggered re-auth on TradePost screens.
- Root cause (toll): Posture restore (defense → commercial) hardcodes 10 Lux (100,000,000 base units) as the coin toll, overwriting per-gate custom toll values. The Lux ↔ base-unit pipeline (×10,000,000) is mathematically correct — the "10,000 → 10 Lux" observation was the flat restore, not a conversion bug.
- Files: domain.ts (+SsuAuthTarget), useAuthorizeExtension.ts (+authorizeSsus batch, +resetSsu), TradePostListScreen.tsx (+batch authorize button), TradePostDetailScreen.tsx (+individual re-auth button in ExtensionSection), decision-log.md
- Diff: ~70 LoC added across 5 files
- Risk: medium — new PTB construction for SSU extension auth
- Gates: typecheck ✅ build ✅
- Known behavior: Posture commercial restore uses flat 10 Lux toll. Future improvement: read current gate tolls before defense switch, store them, and restore on commercial switch.

---

## 2026-03-17 – AdminCap Ownership Readiness Gate
- Goal: Prevent signer-mismatch transaction failures when AdminCap is owned by publisher wallet instead of operator wallet (fresh-publish authority regression).
- Root cause: `init()` transfers AdminCap to `ctx.sender()` (publisher). After fresh publish, the operator wallet is different from the publisher, so all PTBs referencing AdminCap as owned object fail with "not signed by the correct sender".
- Files: suiReader.ts (fetchAdminCapOwner), useAdminCapOwner.ts (new hook), useOperatorReadiness.ts (+adminCap blocker), PostureControl.tsx (wired ownership check), GateDetailScreen.tsx (policy composer blocker), operator-validation-checklist.md (transfer commands + readiness gate docs), decision-log.md
- Diff: ~75 LoC added across 7 files
- Risk: medium — touches readiness gating + policy composer + posture control
- Gates: typecheck ✅ build ✅
- Transfer required: `sui client transfer --object-id <GateControlAdminCap> --to <operator-wallet>` from publisher wallet
- Follow-ups: Execute AdminCap transfer from publisher wallet, TradePostAdminCap transfer (not currently blocking)

---

## 2026-03-17 – Truthful Extension Detection + Operator UX Fixes
- Goal: Make authorization detection truthful to the fresh EVE publish. Structures with old-package extensions were falsely showing "authorized". Also: treasury address autofill, curated tribe names for Utopia demo.
- Files: domain.ts, suiReader.ts, StructureDetailHeader.tsx, GateListScreen.tsx, GateDetailScreen.tsx, TurretListScreen.tsx, TurretDetailScreen.tsx, TradePostListScreen.tsx, TradePostDetailScreen.tsx, useOperatorReadiness.ts, useAssetDiscovery.ts, CoinTollEditor.tsx, tribes.json, operator-validation-checklist.md
- Diff: ~120 LoC changed across 14 files
- Risk: medium — changes core extension detection logic + UI rendering across all structure types
- Gates: typecheck ✅ build ✅ deploy ✅
- Changes:
  - `extensionAuthorized: boolean` → `extensionStatus: "authorized" | "stale" | "none"` across domain type + all consumers
  - `resolveExtensionAuth` now reads TypeName from on-chain extension field and compares package prefix against CC_ORIGINAL_PACKAGE_ID
  - "STALE — RE-AUTH" tag shown for old-package extensions; re-authorize buttons on both list and detail screens
  - CoinTollEditor: `defaultTreasury` prop auto-fills from connected wallet address
  - tribes.json populated with 20 curated tribes from EVE Frontier API (verified: tribe ID 1000167 = "Clonebank 86" matches our Utopia character)
- Follow-ups: End-to-end re-authorization test, coin toll + tribe rule creation, trade listing creation with EVE

---

## 2026-03-17 – EVE Settlement: Fresh Publish (Compatible Upgrade Blocked)
- Goal: Deploy EVE-settlement Move package on-chain. Compatible upgrade from v2 (Coin\<SUI\>) was rejected by Sui's upgrade verifier — changing public entry function parameter types (`Coin<SUI>` → `Coin<EVE>`) is a breaking signature change. Fresh publish executed instead.
- Files: Published.toml, Move.toml (added `testnet_utopia` env), constants.ts (4 IDs updated), docs/decision-log.md, vendor assets Published.toml (local-only)
- Diff: ~10 LoC config
- Risk: high — new package deployment, all on-chain state is fresh
- Gates: Move build ✅ Move tests 21/21 ✅ publish ✅ (tx: H2qQzsyu25YpmCaHQ2oc9xfPyLMgCYye8wL3sJteSvKL)
- New deployment artifacts:
  - **Package ID**: `0x0f2846d52cdd9c52ec9ced3f0378032718a7ccda013b36d0f6796fcf1bee9adc`
  - **Original ID**: `0x0f2846d52cdd9c52ec9ced3f0378032718a7ccda013b36d0f6796fcf1bee9adc` (same — fresh v1)
  - **GateConfig (shared)**: `0x81e3ef33f489a049df27f5464a3c25dd865991d4e5e9d70a58413feab29d8d4f`
  - **GateControl AdminCap**: `0xeba584423e82098457628c43295ef25a3e048b4cceaa486783e1ee841093f067`
  - **TradePostAdminCap**: `0x1e3b214a00c7094ac77559f37e13199c8e6bb38bd903d6ceeb53d3219d2641cf`
  - **UpgradeCap**: `0x986a2d2061b33a5204411a6b52c123675cdd6993c1c56ccb40cc86cdccdeb04b`
- State impact: **All previous on-chain state (gate policies, listings, extension authorizations) is orphaned.** Fresh state — no old Coin\<SUI\>-typed DFs to clean up. Extensions must be re-authorized against the new package's witness types (GateAuth, TradeAuth, BouncerAuth, DefenseAuth).
- Follow-ups: Re-authorize extensions on demo structures, set demo policies (toll, tribe filter), create demo listings, end-to-end validation with EVE coins

---

## 2026-03-20 – True EVE Settlement Implementation
- Goal: Change actual on-chain settlement token from SUI to EVE. Not a relabeling — the Move contracts now use `Coin<EVE>` from the EVE Frontier assets package. All UI surfaces display Lux (primary) and EVE (secondary). SUI is hidden gas only.
- Files: gate_control.move, trade_post.move, trade_post_tests.move, Move.toml, currency.ts (NEW), constants.ts, tradePostTx.ts, useBuyListing.ts, postureSwitchTx.ts, ListingCard.tsx, CreateListingForm.tsx, CoinTollEditor.tsx, PostureControl.tsx, SignalEventRow.tsx, eventParser.ts, Dashboard.tsx, domain.ts, README.md, docs/README.md, docs/core/spec.md
- Diff: ~150 LoC changed (Move: SUI→EVE, assets dependency), ~200 LoC changed (frontend: EVE coin discovery, Lux conversion, display), ~50 LoC docs
- Risk: high — core contract + settlement token change across full stack
- Gates: Move build ✅ Move tests 21/21 ✅ typecheck ✅
- Decisions:
  - **Settlement token**: `Coin<EVE>` (package `0xf0446b93345c1118f21239d7ac58fb82d005219b2016e100f074e4d17162a465::EVE::EVE`)
  - **Denomination**: 100 Lux = 1 EVE = 1,000,000,000 base units. 1 Lux = 10,000,000 base units.
  - **Move dependency**: `assets = { local = "../../vendor/world-contracts/contracts/assets" }` — no Published.toml needed
  - **PTB change**: Buy listing now uses `tx.splitCoins(tx.object(eveCoinId), ...)` — requires EVE coin object discovery via `suix_getCoins`
  - **Package republish required**: v2→v3 upgrade needed to deploy EVE settlement on Utopia
- Follow-ups: Republish contract (upgrade), update remaining historical docs (architecture, ptb-patterns), end-to-end demo validation with EVE coins

---

## 2026-03-20 – Canonical Denomination & Tribe Sourcing Doctrine
- Goal: Correct Lux/EVE conversion rate, fix display hierarchy (Lux primary, EVE secondary), rework tribe picker to chain-derived IDs with curated name map.
- Files: docs/core/spec.md, docs/strategy/civilization-control/civilizationcontrol-product-vision.md, docs/ux/civilizationcontrol-ux-architecture-spec.md, docs/core/civilizationcontrol-claim-proof-matrix.md, docs/architecture/read-path-architecture-validation.md, docs/architecture/in-game-dapp-surface.md, docs/operations/operator-validation-checklist.md, src/data/tribes.json, src/lib/tribeCatalog.ts, src/components/TribePicker.tsx, scripts/fetch-tribes.mjs
- Diff: ~60 LoC changed (docs), ~40 LoC changed (tribe code)
- Risk: low — doc corrections + tribe picker UX fix, no contract changes
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Lux/EVE rate corrected**: 100 Lux = 1 EVE (was incorrectly 10,000 Lux = 1 EVE across all docs)
  - **Display hierarchy**: Lux is PRIMARY player-facing denomination. EVE is secondary (demo narration, proof overlays). No SUI labels in player-facing UI.
  - **Tribe sourcing**: Chain/RPC is source of truth for tribe IDs (Character.tribe_id). Curated name map for active environment. Stillness API is optional enrichment only. Fallback to "Tribe #<id>".
  - **TribePicker**: Now accepts direct numeric tribe ID entry alongside autocomplete search. tribes.json is environment-specific curated map (empty for Utopia until populated).
  - **Turret controls**: Future tranche. Current scope is visibility only (power, stance, behavioral explainer). No fake mutable policy controls.
  - **Denomination code changes deferred**: UI still displays raw MIST values in several places. Fix scheduled for separate tranche.

---

## 2026-03-19 – Infrastructure-Control Doctrine Revision (Direct Power + Tribes Autocomplete)
- Goal: Add direct online/offline power control for ALL web-controllable structure types (gates, turrets, SSUs/trade posts, network nodes), bulk power operations from list screens, posture hardening, tribe autocomplete selector replacing raw numeric input.
- Files:
  - `src/lib/structurePowerTx.ts` (NEW: generic PTB builders for all structure online/offline)
  - `src/hooks/useStructurePower.ts` (NEW: generic power hook — single, batch, node-online)
  - `src/screens/TurretDetailScreen.tsx` (NEW: per-turret power control + extension info)
  - `src/screens/NetworkNodeListScreen.tsx` (NEW: node list with bulk online, fuel, attached counts)
  - `src/screens/NetworkNodeDetailScreen.tsx` (NEW: per-node online control, attached structures)
  - `src/screens/TurretListScreen.tsx` (REWRITTEN: +bulk online/offline, linked rows to detail page)
  - `src/screens/GateListScreen.tsx` (UPDATED: +bulk online/offline buttons)
  - `src/screens/GateDetailScreen.tsx` (UPDATED: migrated to useStructurePower from deprecated hook)
  - `src/screens/TradePostDetailScreen.tsx` (UPDATED: +PowerControlSection for SSU online/offline)
  - `src/screens/TradePostListScreen.tsx` (UPDATED: +bulk online/offline buttons)
  - `src/components/PostureControl.tsx` (UPDATED: fixed success label inversion via useRef)
  - `src/hooks/usePosture.ts` (UPDATED: +parseMoveAbort for friendly error messages)
  - `src/components/TribePicker.tsx` (NEW: autocomplete tribe selector)
  - `src/components/TribeRuleEditor.tsx` (UPDATED: replaced numeric input with TribePicker)
  - `src/lib/tribeCatalog.ts` (NEW: tribes catalog with search/lookup)
  - `src/hooks/useTribe.ts` (NEW: tribe search/lookup hooks)
  - `src/data/tribes.json` (NEW: static tribe catalog from World API)
  - `scripts/fetch-tribes.mjs` (NEW: fetch script for tribes)
  - `src/types/domain.ts` (UPDATED: +Tribe interface)
  - `src/App.tsx` (UPDATED: +routes for turret detail, node list/detail)
  - `src/components/Sidebar.tsx` (UPDATED: +Network Nodes nav, structurePath for network_node)
  - `package.json` (UPDATED: +generate:tribes script)
  - DELETED: `src/hooks/useGateOnlineOffline.ts`, `src/lib/gateOnlineOfflineTx.ts` (superseded)
- Diff: ~600 LoC added, ~80 LoC removed
- Risk: medium — new command surfaces, generic power infra, no contract changes
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Direct power control is now canonical** — posture remains the network-wide behavioral layer, but operators also get per-structure and bulk power toggles for all types.
  - **NWN offline not implemented for web** — the hot-potato `OfflineAssemblies` pattern requires knowing all connected assembly types for chained offline calls. Documented as in-game-only.
  - **Generic power infra** — `useStructurePower` replaces per-type hooks. MODULE_MAP dispatches to correct Move modules.
  - **Tribes autocomplete** — replaces raw numeric input. Static JSON catalog from World API v2/tribes (20 entries). TribePicker with search, keyboard nav, displays name + short tag + ID.
- Follow-ups: Preview deploy, live-test bulk power operations, verify tribes catalog refresh cadence.

---

## 2026-03-19 – AdminCap Transfer + Posture Readiness Layer
- Goal: Fix authority model mismatch (AdminCap owned by publisher wallet, not operator) and add truthful readiness gating to PostureControl so the posture switch only activates when actually executable.
- Files:
  - On-chain: AdminCap (0xaedc…3e) transferred publisher→operator; TradePostAdminCap (0x1ffb…06) transferred publisher→operator
  - `src/hooks/useOperatorReadiness.ts` (NEW: readiness check — wallet, turret extension status, gate extension status)
  - `src/hooks/useAuthorizeExtension.ts` (UPDATED: +batch turret BouncerAuth authorization via `authorizeTurrets()`)
  - `src/components/PostureControl.tsx` (UPDATED: readiness gate — blockers UI, disabled switch when not ready)
  - `src/screens/TurretListScreen.tsx` (UPDATED: +batch "Authorize BouncerAuth" button + TxFeedbackBanner)
  - `src/screens/Dashboard.tsx` (UPDATED: pass isConnected to PostureControl)
- Diff: +85 LoC new hook, ~80 LoC additions across 4 files
- Risk: medium — authority model fix (on-chain transfer), new UX gating for critical posture path
- Gates: typecheck ✅ build ✅
- Decisions:
  - **AdminCap must be owned by operator wallet** — contract init() sends AdminCap to publisher. Publisher and operator are different wallets. Posture PTB requires sender to own AdminCap AND match character_address. Transfer is the correct fix (not delegation).
  - **Readiness gating over optimistic UI** — PostureControl now shows specific blockers (turrets without extensions, wallet not connected) instead of silently failing. Switch button disabled until all blockers cleared.
  - **Batch turret authorization** — all unauthorized turrets authorized in a single PTB (borrow/authorize/return per turret). BouncerAuth type origin is CC_PACKAGE_ID (v2, where module was introduced).
- Follow-ups: Live test posture switch with operator wallet after turrets are authorized.

---

## 2026-03-19 – Package v2 Upgrade + Type-Origin Discovery + Doc Truth Sweep
- Goal: Convert TurretControl+Posture tranche from "code-proven" to "live-runtime-validated / documentation-truthful / demo-usable." Republish package with new modules, validate on-chain, fix all stale turret doctrine.
- Files:
  - `contracts/civilization_control/Published.toml` (AUTO-UPDATED: v2 address, version 2, toolchain 1.67.2)
  - `src/constants.ts` (UPDATED: CC_PACKAGE_ID → v2 address; +CC_ORIGINAL_PACKAGE_ID for v1 type origins)
  - `src/lib/eventParser.ts` (UPDATED: v1 module events use CC_ORIGINAL_PACKAGE_ID, v2 module events use CC_PACKAGE_ID)
  - `src/lib/suiReader.ts` (UPDATED: per-module package IDs for type filters + event queries; +dummy_field fix for PostureKey)
  - `src/lib/postureSwitchTx.ts` (UPDATED: CC_PACKAGE_ID for targets + type args — all v2 types)
  - `src/hooks/useAuthorizeExtension.ts` (UPDATED: CC_ORIGINAL_PACKAGE_ID for GateAuth/TradeAuth type args — v1 types)
  - 13 documentation files: spec.md, README.md, product-vision.md, implementation-plan.md, strategy-memo.md, demo-beat-sheet.md, assumption-registry.md, must-work-claim-registry.md, demo-evidence-appendix.md, day1-checklist.md, narration-direction-spec.md, PTB docs (4), architecture docs (3)
- Diff: ~60 LoC code changes, ~100 LoC doc replacements across 13+ files
- Risk: high — on-chain upgrade, type-origin nuance affects every RPC query and PTB type arg
- Gates: move build ✅ move tests ✅ (21/21) typecheck ✅ build ✅ live validation ✅
- Decisions:
  - **Dual-constant pattern for Sui type origins after upgrade** — v1-introduced modules (gate_control, trade_post) have type origin = v1 package address; v2-introduced modules (posture, turret_bouncer, turret_defense) have type origin = v2 package address. CC_PACKAGE_ID (v2) used for MoveCall targets + v2 types; CC_ORIGINAL_PACKAGE_ID (v1) used for v1 types/events. Empirically verified via DF queries, event queries, and dynamic field listing.
  - **Empty struct DF serialization** — unit structs like PostureKey require `{dummy_field: false}` in Sui RPC getDynamicFieldObject queries. Without it: "Missing field dummy_field" error.
  - **Upgrade via `sui client upgrade -e testnet_utopia`** — the `-e` environment flag is mandatory when Published.toml uses [environments] sections. Without it: "Cannot upgrade package without having a published id."
- Live validation:
  - set_posture(mode=0) on GateConfig: tx B6X4YaQ1bzjqYZePMpGtyxT5RE1HrTJrTt3pRHHbQvYd ✅
  - PostureKey DF read returns PostureState{mode: 0} ✅
  - PostureChangedEvent query returns event ✅
  - TribeRuleKey DF read (v1 origin) ✅
- Deployment artifacts:
  - v2 PackageID: 0x698d78b09a7009083ee71e026711ac598ed5f67217f1339ad76505bf58a2c5a5
  - Upgrade tx: AFeJrvreGKeuUbGTuZ6vTZFw6iP8MDRaiRPWWnuuqozc
  - v1 (original): 0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04
  - UpgradeCap: 0x1dea9aedbd461969de0358da66368bd2cc3a140983c17a205ee0ec66ce09efa3
- Follow-ups:
  - Extension freeze assessment post-demo (leave unfrozen during iteration)
  - Demo capture for Beat 6 defense mode moment with live on-chain posture

---

## 2026-03-18 – TurretControl + Posture Presets (Move + Frontend)
- Goal: Implement operator-facing posture switching — one action, one transaction, network-wide gate + turret state change. Proves Beat 6 demo moment: Defense Mode.
- Files:
  - `contracts/civilization_control/sources/turret_bouncer.move` (NEW: bouncer extension — commercial posture targeting)
  - `contracts/civilization_control/sources/turret_defense.move` (NEW: defense extension — hostile-aggressive targeting)
  - `contracts/civilization_control/sources/posture.move` (NEW: on-chain posture state as DF on GateConfig)
  - `contracts/civilization_control/sources/gate_control.move` (UPDATED: +public(package) config_uid/config_uid_mut accessors)
  - `src/lib/postureSwitchTx.ts` (NEW: single-PTB builder for atomic posture switch)
  - `src/hooks/usePosture.ts` (NEW: posture read + switch mutation hooks)
  - `src/components/PostureControl.tsx` (NEW: operator posture command surface)
  - `src/screens/TurretListScreen.tsx` (NEW: turret inventory screen with posture badges)
  - `src/components/topology/StrategicMapPanel.tsx` (UPDATED: reads on-chain posture, turret glyphs posture-aware)
  - `src/screens/Dashboard.tsx` (UPDATED: PostureControl integrated)
  - `src/components/Sidebar.tsx` (UPDATED: +Turrets nav item + turret deep links)
  - `src/App.tsx` (UPDATED: +/turrets route)
  - `src/lib/suiReader.ts` (UPDATED: +fetchPosture, expanded event module list)
  - `src/lib/eventParser.ts` (UPDATED: +3 new event types: PostureChanged, BouncerTargeting, DefenseTargeting)
  - `src/types/domain.ts` (UPDATED: +PostureMode, PostureState, TurretSwitchTarget)
- Diff: +~700 LoC added, ~40 replaced
- Risk: high — new Move modules (2 turret extensions + posture), new write path (PTB), new core UI surface
- Gates: typecheck ✅ build ✅ move build ✅ move tests ✅ (21/21)
- Decisions:
  - **Turrets always online** — old assumption was turrets offline in commercial, online in defense. New doctrine: turrets always powered, posture changes which extension is active (bouncer vs defense targeting)
  - **Two-extension swap pattern** — no deauthorize/clear function exists in world-contracts; once configured, swap-only. BouncerAuth (commercial: aggressors +10000, non-tribe +1000) vs DefenseAuth (defense: aggressors +15000, non-tribe +5000)
  - **BehaviourChangeReason is module-private** — Move 2024 enums cannot be constructed or matched outside defining module. Targeting redesigned to use only `is_aggressor` (bool) + `character_tribe` (u32), which captures ~95% of default behavior
  - **Posture state as DF on GateConfig** — reuses existing shared object; turret has no uid() accessor so cannot host DFs. PostureKey singleton DF with PostureState{mode: u8}
  - **Topology now reads real on-chain posture** — StrategicMapPanel no longer has local toggle state; posture indicator is display-only reflecting chain truth
- Follow-ups:
  - Package republish required (new modules) — CC_PACKAGE_ID will change
  - PriorityListUpdatedEvent observability: custom extensions must emit equivalent events (BouncerTargetingEvent, DefenseTargetingEvent already included)
  - Demo capture for Beat 6 defense mode moment
  - Extension freeze after initial authorize (prevents rugpull)

---

## 2026-03-17 – Item-Type Catalog + SSU Inventory Browser + Type Resolution
- Goal: Eliminate raw type-ID entry in TradePost seller flow by (1) shipping a build-time item-type catalog from the World API, (2) implementing SSU inventory reading from chain, and (3) threading resolved item names through all TradePost surfaces and Signal Feed.
- Files:
  - `scripts/fetch-types.mjs` (NEW: offline World API paginator, ~80 LoC)
  - `src/data/itemTypes.json` (NEW: 390 item types, 99 KB bundled artifact)
  - `src/lib/typeCatalog.ts` (NEW: sync index module — byId, byName, search, resolveItemTypeName)
  - `src/hooks/useItemType.ts` (NEW: React hooks for catalog search/lookup)
  - `src/hooks/useSsuInventory.ts` (NEW: TanStack Query hook for SSU inventory enumeration)
  - `src/components/InventoryBrowser.tsx` (NEW: inventory item selector with resolved names)
  - `src/components/CreateListingForm.tsx` (REWRITE: inventory-backed item selection replaces raw type-ID input; manual entry demoted to advanced fallback)
  - `src/components/ListingCard.tsx` (UPDATED: displays resolved item name as primary, raw ID as subdued metadata)
  - `src/screens/TradePostDetailScreen.tsx` (UPDATED: wires SSU inventory to create listing form)
  - `src/lib/suiReader.ts` (UPDATED: +fetchSsuInventory, +parseInventoryItems — reads inventory DFs via getDynamicFieldObject)
  - `src/lib/eventParser.ts` (UPDATED: trade events now resolve item names in descriptions)
  - `src/types/domain.ts` (UPDATED: +ItemType, +InventoryEntry, +InventorySlot interfaces)
  - `package.json` (UPDATED: +generate:types script)
- Diff: +~550 LoC added, ~120 replaced
- Risk: medium — new chain read path (inventory DFs) and new create listing UX flow
- Gates: typecheck ✅ build ✅
- Decisions:
  - Build-time static catalog chosen over runtime browser fetch — mirrors proven solar-system pattern, zero runtime dependency on World API availability
  - World API v2/types returns 390 types with offset/limit pagination; all fit in one 500-limit page but script paginates defensively
  - Fields preserved: typeId, name, description, mass, volume, portionSize, groupName, groupId, categoryName, categoryId
  - iconUrl and radius dropped (empty/unused in current API)
  - Unknown type IDs degrade to "Unknown Type #12345" — never crash, never blank
  - SSU inventory read path: StorageUnit.inventory_keys → getDynamicFieldObject per key → parse VecMap<u64, ItemEntry>
  - Manual raw type-ID entry retained as toggled fallback ("Manual entry →") for edge cases
  - Listing creation validates quantity against inventory stock when using inventory selection
- Follow-ups:
  - TurretControl / Posture Presets is the correct next tranche (S14b, S44)
  - SSU inventory read path should be smoke-tested against live Utopia SSU with actual items
  - Chunk splitting for build size (solar systems 4.4 MB dominates — not caused by this tranche)
  - Consider periodic catalog refresh automation (npm run generate:types)

---

## 2026-03-16 – Seller-Side Listing Create + Cancel tranche
- Goal: Complete the TradePost write surface by adding seller-side listing creation and cancellation from the browser. Item type entered manually (SSU inventory browser deferred).
- Files: `src/lib/tradePostTx.ts` (+buildCreateListingTx, +buildCancelListingTx), `src/hooks/useCreateListing.ts` (NEW: mutation hook), `src/hooks/useCancelListing.ts` (NEW: mutation hook), `src/components/CreateListingForm.tsx` (NEW: item type + qty + price form), `src/components/ListingCard.tsx` (extended: cancel button for seller-owned listings), `src/components/TxFeedbackBanner.tsx` (upgraded: action-specific successLabel/pendingLabel), `src/screens/TradePostDetailScreen.tsx` (Create Listing section + cancel wiring), `src/screens/GateDetailScreen.tsx` (action-specific feedback labels)
- Diff: +~260 LoC added, ~80 replaced
- Risk: med (new write paths — create_listing+share_listing and cancel_listing PTBs)
- Gates: typecheck ✅ build ✅
- Limitations: Item type ID is manual entry (no inventory browser yet). Price entered in SUI, converted to MIST. Full-item listings only (no split_item).
- Follow-ups: SSU inventory browser for item selection, TurretControl posture module, demo capture, narrative label audit

---

## 2026-03-16 – Signal Feed + Event Polling tranche
- Goal: Replace placeholder Signal Feed with real on-chain event-driven content. Implement event polling for all 8 CivilizationControl custom events, parse into categorized signals, display in dedicated feed and dashboard.
- Files: `src/types/domain.ts` (+SignalEvent, SignalCategory, SignalVariant), `src/lib/eventParser.ts` (NEW: event type map + parser for 8 CC events), `src/lib/suiReader.ts` (+fetchRecentEvents via MoveModule queries), `src/hooks/useSignalFeed.ts` (NEW: TanStack Query hook with 30s polling + invalidation), `src/components/SignalEventRow.tsx` (NEW: shared signal row with variant styling), `src/screens/ActivityFeedScreen.tsx` (REWRITTEN: real feed with category filters), `src/screens/Dashboard.tsx` (wired real signals into Recent Telemetry + revenue metric)
- Event types supported: TribeCheckPassedEvent, TollCollectedEvent, TribeRuleSetEvent, CoinTollSetEvent, RuleRemovedEvent, ListingCreatedEvent, ListingPurchasedEvent, ListingCancelledEvent
- Categories: Governance (rule CRUD), Trade (listing lifecycle), Transit (passage + tolls), Status (reserved for future)
- Approach: Polling via `suix_queryEvents` with `MoveModule` filter (2 RPC calls per cycle), 30s interval, TanStack Query cache
- Diff: +~440 LoC added, ~80 replaced
- Risk: low (read-only event queries, no write path changes)
- Gates: typecheck ✅ build ✅
- Follow-ups: Create listing flow (seller side), turret posture module, WebSocket subscription upgrade, revenue aggregation over 24h window

---

## 2026-03-16 – TradePost Buy Flow tranche
- Goal: Implement browser-based marketplace listing discovery and buy flow (discover live listings via events, display in listing browser, execute buy PTB, tx feedback).
- Files: `src/types/domain.ts` (+Listing type), `src/lib/suiReader.ts` (+fetchListings via queryEvents→multiGetObjects), `src/lib/tradePostTx.ts` (NEW: buy PTB builder with coin split + item transfer), `src/hooks/useListings.ts` (NEW: TanStack Query read hook), `src/hooks/useBuyListing.ts` (NEW: mutation hook), `src/components/ListingCard.tsx` (NEW: listing display + buy action), `src/screens/TradePostDetailScreen.tsx` (rewritten with MarketplaceSection + buy flow)
- Diff: +~350 LoC added, ~90 replaced
- Risk: med (new write path — buy() consumes shared Listing by value, splits coin, transfers Item)
- Gates: typecheck ✅ build ✅
- Follow-ups: Create listing flow (seller side), cancel listing, batch posture switch (S46), event subscription

## 2026-03-16 – Gate Policy Composer + Live Rule Deploy tranche
- Goal: Implement browser-based gate policy authoring (read on-chain rules, edit, deploy via signed tx, see feedback).
- Files: `src/constants.ts` (+GATE_CONFIG_ID, GATE_ADMIN_CAP_ID), `src/types/domain.ts` (+GatePolicy types), `src/lib/suiReader.ts` (+fetchGateRules), `src/lib/gatePolicyTx.ts` (NEW: PTB builders), `src/hooks/useGatePolicy.ts` (NEW: read hook), `src/hooks/useGatePolicyMutation.ts` (NEW: mutation hook), `src/components/TribeRuleEditor.tsx` (NEW), `src/components/CoinTollEditor.tsx` (NEW), `src/components/TxFeedbackBanner.tsx` (NEW), `src/screens/GateDetailScreen.tsx` (rewritten with live data + composer)
- Diff: +~600 LoC added, ~165 replaced
- Risk: med (new write path via AdminCap, but AdminCap ownership is gated to operator wallet)
- Gates: typecheck ✅ build ✅
- Follow-ups: TradePost buy flow (S24), batch posture switch (S46), event subscription

## 2026-03-16 – Static solar-system catalog: build-time snapshot replaces runtime API fetch
- Goal: Fix broken autocomplete (no search results) and eliminate runtime dependency on paginated World API.
- Root cause: Two bugs — (1) API field names are `id`/`name` but code read `solarSystemId`/`solarSystemName` → every field `undefined`; (2) API uses `limit`/`offset` pagination, code sent `page`/`pageSize` → only 100 rows returned.
- Fix: Replaced runtime fetch+cache architecture with build-time static snapshot:
  - `scripts/fetch-solar-systems.mjs` — offline Node script, fetches all ~24.5k systems via correct `limit`/`offset` pagination, maps to SolarSystem shape, writes `src/data/solarSystems.json`.
  - `src/lib/solarSystemCatalog.ts` — imports static JSON at build time, builds indexes synchronously at module init. Zero runtime fetch.
  - `src/hooks/useSolarSystem.ts` — simplified: no `useQuery`, no loading states.
  - `src/App.tsx` — removed prefetch call (no longer needed).
  - `package.json` — added `generate:solar-systems` script.
- Refresh: Run `npm run generate:solar-systems` then rebuild to update the dataset.
- Files: `scripts/fetch-solar-systems.mjs` (new), `src/data/solarSystems.json` (new, 4.4 MB, 24,502 systems), `src/lib/solarSystemCatalog.ts`, `src/hooks/useSolarSystem.ts`, `src/App.tsx`, `package.json`
- Diff: +119 / -144
- Risk: medium (architecture change to data ingestion path)
- Gates: typecheck ✅ build ✅ preview ✅ (ERM-JB3 confirmed in dataset)

---

## 2026-03-16 – Spatial positioning tranche: uniform-scale normalization + label context
- Goal: Make topology node positioning spatially truthful when solar system assignments exist
- Changes:
  1. `normalizeCoords` now uses uniform scaling (same scale both axes) to preserve relative distances and orientations. Accepts `aspectRatio` param for non-square viewports.
  2. Overlay labels show assigned solar system name below node name.
  3. Unpositioned nodes show "· unassigned" indicator; positioned/unpositioned groups visually separated.
  4. Link lines only connect spatially-positioned nodes (not unassigned ones).
- Context: Catalog ingestion, coordinate transform `(x,y,z)→(x,-z)`, SolarSystemPicker autocomplete, pin persistence to localStorage, and `computeNodePositions` pipeline all already existed and were fully wired. The gap was spatial distortion from independent X/Y normalization.
- Files: `src/lib/coordinates.ts`, `src/components/topology/StrategicMapPanel.tsx`
- Diff: +91 / -27
- Risk: low (UI-only, no data/contract changes)
- Gates: typecheck ✅ build ✅ preview ✅

---

## 2026-03-16 – Topology doctrine conformance: color tokens + layout + turret stacking
- Goal: Align Strategic Network panel with SVG Topology Layer Spec §4 (color doctrine) and §6 (cluster layout)
- Mismatches fixed (8 items):
  1. Green used for "online" → muted teal `hsl(175, 45%, 50%)` — green reserved for economic events only
  2. Node overlay label `text-green-500/70` → teal `hsl(175,45%,50%)`
  3. Halo fills used green → teal for online, red for offline
  4. Grid at 10% opacity → 4% (governance schematic, not star map)
  5. No child ordering → Gates first (12 o'clock CW), then TradePosts, then Turrets
  6. No turret stacking → 1-3 individual, 4+ collapse with `+N` badge
  7. Gates same size as other glyphs → larger (24 vs 20) with thicker link lines
  8. Missing `--topo-state-online`, `--topo-glyph-neutral` tokens → added 13 spec-conformant tokens
- Files: `src/styles/theme.css`, `src/components/topology/StrategicMapPanel.tsx`
- Diff: ~50 LoC added, ~40 LoC removed
- Risk: low (UI-only, no data/contract changes)
- Gates: typecheck ✅ build ✅

---

## 2026-03-16 – Fix asset discovery: wrong module name + missing pagination
- Goal: Fix wallet→asset discovery that was stuck at "Resolving chain state…" after wallet connect
- Root cause: `fetchPlayerProfile` used type filter `player::PlayerProfile` — correct module is `character::PlayerProfile`. Query returned empty, discovery silently returned no structures.
- Secondary fix: `fetchOwnerCaps` only fetched page 1 (50 results). Character owns 70 OwnerCaps across 2 pages. Added cursor-based pagination loop.
- Tertiary fix: PlayerProfile has no `name`/`tribe_id` — those live on the shared Character object. Added a second RPC call to resolve them.
- UI fix: Sidebar "Resolving chain state…" did not distinguish loading from loaded-empty. Now shows "No structures discovered" when query completes with empty results.
- Diagnostics: Added console.log breadcrumbs to `discoverAssets` for step-by-step visibility.
- Files: `suiReader.ts`, `Sidebar.tsx`, `App.tsx`
- Diff: ~60 LoC added, ~30 LoC removed
- Risk: medium (data layer fix, read-only)
- Gates: typecheck ✅ build ✅ preview ✅
- Evidence: Live RPC verified full chain — 70 OwnerCaps discovered, structures resolve correctly

---

## 2026-03-17 – Data Wiring Tranche: suiReader fixes + wallet-aware UI
- Goal: Wire live chain data into the dashboard shell — correct on-chain field parsing, thread wallet connection state through UI, compute real metrics
- Files: `suiReader.ts` (all helpers rewritten), `useAssetDiscovery.ts` (isConnected + enforcedDirectives), `App.tsx` (prop threading), `Sidebar.tsx` (wallet-aware inventory), `Dashboard.tsx` (wallet-aware status pill + profile name)
- Diff: ~80 LoC added, ~40 LoC removed
- Risk: medium (data layer rewrite, but read-only — no contract or state changes)
- Gates: typecheck ✅ build ✅ preview ✅
- Key changes:
  - suiReader: resolveStatus, resolveName, resolveFuel, resolveExtensionAuth all rewritten for actual on-chain JSON shape; new resolveNetworkNodeId extracts energy_source_id
  - enforcedDirectives now computed from structures with extensionAuthorized=true
  - Sidebar: shows "Connect wallet" / "Resolving…" / real inventory based on connection state
  - Dashboard: status pill differentiates disconnected/resolving/active; subtitle shows character name when profile is available
- Preview: https://feature-dashboard-foundation.civilizationcontrol.pages.dev

---

## 2026-03-17 – Visual Fidelity & Topology Shell Correction Pass
- Goal: Correct biggest visual/structural mismatches between preview and Figma/UX spec before further feature wiring
- Files: `Dashboard.tsx` (restructured), `MetricCard.tsx` (hero variant), `StrategicMapPanel.tsx` (enriched), `Header.tsx` (network indicator), `ActivityFeedScreen.tsx` (heading fix), `theme.css` (grid opacity)
- Diff: ~250 LoC added, ~90 LoC removed
- Risk: low (pure presentational, no contract/state changes)
- Gates: typecheck ✅ build ✅
- Key corrections:
  - Dashboard: 4-col uniform → 5-col with hero revenue card (col-span-2) + lower signals/alerts section
  - Topology: HTML overlay node labels with backdrop-blur, posture toggle (Commercial/Defensive), defense overlay, subtle halos
  - Header: Added "Utopia Testnet" network indicator
  - Theme: Grid opacity 6% → 10% via --topo-grid token

---

## 2026-03-17 – UI Follow-up Screens + Cloudflare Preview (Frontend Tranche 1b)
- Goal: Complete screen follow-ups from dashboard foundation — Gate list/detail, TradePost list/detail, Activity feed; wire into App.tsx routes; deploy CF Pages preview
- Files: new `src/screens/TradePostDetailScreen.tsx`, `src/screens/ActivityFeedScreen.tsx`, `src/components/StructureDetailHeader.tsx`, `src/screens/GateListScreen.tsx`, `src/screens/GateDetailScreen.tsx`, `src/screens/TradePostListScreen.tsx`; modified `src/App.tsx` (route wiring)
- Diff: ~550 LoC added, ~30 LoC removed (placeholder routes)
- Risk: low (UI screens, no contract or state changes)
- Gates: typecheck ✅ build ✅ CF deploy ✅
- Design choices:
  - StructureDetailHeader shared between gate/tradepost detail screens
  - GateDetailScreen shows policy config (tribe filter + coin toll) when extension authorized
  - ActivityFeedScreen is a structured placeholder with event taxonomy (awaiting Sui event subscription)
  - Governance vocabulary: "Signal Feed", "Commerce Post", "Inventory Holdings", "Trade Extension"
- Cloudflare: preview at `https://feature-dashboard-foundation.civilizationcontrol.pages.dev`
- Follow-ups: Wire Sui event subscription to Activity feed, deep inventory read for TradePost, Settings screen

---

## 2026-03-17 – Dashboard Foundation (Frontend Tranche 1)
- Goal: Build the full dashboard/frontend foundation: design tokens, layout shell, asset discovery, topology visualization, spatial pinning, solar system catalog
- Files: 23 new/modified files in `src/` — App.tsx routing shell, theme.css/index.css (Tailwind v4), types/domain.ts, lib/ (suiReader, solarSystemCatalog, spatialPins, coordinates, utils), hooks/ (useAssetDiscovery, useSolarSystem, useSpatialPins), components/ (Header, Sidebar, MetricCard, StatusDot, TagChip, SolarSystemPicker, NodeLocationPanel, Glyphs.tsx, StrategicMapPanel.tsx), screens/ (Dashboard, AuthHarness)
- Diff: ~1800 LoC added
- Risk: medium (new frontend layer, no contract changes)
- Gates: typecheck ✅ build ✅
- Design choices:
  - Tailwind CSS v4 with `@import "tailwindcss" source(none)` + explicit `@source` for tree-shaking
  - Design tokens reconciled from Figma export + SVG Topology Layer Spec §4 (ISA-101/MIL-STD-2525D overlay colors)
  - Coordinate transform: `(x,y,z) → render(x, -z)` per Scetrov docs
  - SuiJsonRpcClient from `@mysten/sui/jsonRpc` (replaced deprecated SuiClient)
  - useConnection from `@evefrontier/dapp-kit` for wallet (not useDAppKit)
  - Solar system catalog: World API v2 with 1000-page pagination + in-memory cache
  - Spatial pins: localStorage-persisted Map for manual solar-system-to-node assignment
  - Old auth harness preserved as `screens/AuthHarness.tsx`
- Follow-ups: Gate detail screen, TradePost detail screen, activity feed, Cloudflare preview deploy

---

## 2026-03-16 – JWT Nonce Mismatch Diagnosis + Error Handling
- Goal: Debug "JWT nonce mismatch" error in owner-auth harness; determine if harness or Vault issue
- Files: `src/App.tsx` (StatusDisplay improved)
- Diff: +18 LoC
- Risk: low (UI error messaging only)
- Gates: typecheck ✅ build ✅
- Root cause: EVE Vault internal state — device data (ephemeralKey + randomness + epoch) regenerated after login, causing stored nonce to diverge from JWT's nonce. This is a known race condition inside `vendor/evevault/packages/shared/src/stores/deviceStore.ts` `getZkProof()` (L578). **Not fixable from dApp code.** Recovery requires full Vault sign-out + sign-in to re-derive both JWT and device data atomically.
- Changes: Added nonce-mismatch-specific recovery instructions in the UI error display
- Follow-ups: User must sign out of EVE Vault and sign back in to clear stale state, then retry

---

## 2026-03-12 – Browser Auth Harness for Owner-Signed Transactions
- Goal: Build minimal browser harness to execute the two blocked authorize_extension PTBs via EVE Vault wallet signing (game wallet not in local Sui keystore)
- Files: `src/` (10 new files), `package.json`, `tsconfig.json`, `vite.config.mts`, `index.html`, `.env`
- Diff: ~350 LoC added (new harness scaffold)
- Risk: low (operational tooling only, no contract changes, no production deploy)
- Gates: typecheck ✅ build ✅
- Design choices: Standard signing (not sponsored) — owner operations don't use `verify_sponsor`; `tx.object()` auto-resolves `Receiving<T>` types; `signAndExecuteTransaction` (not `signAndExecute`) is the correct DAppKit method; `optimizeDeps.entries` limited to `index.html` to prevent Vite scanning vendor `.html` files
- Follow-ups: Run harness in browser with EVE Vault to execute authorize_extension on gate + SSU

---

## 2026-03-12 – Hour 5 Live Integration Execution (Utopia)
- Goal: Execute smallest credible live mutation sequence to prove CivilizationControl is wired into real Utopia assets
- Files: `docs/operations/day1-validation.md` (Hour 5 execution section added)
- Diff: +120 LoC docs
- Risk: medium (on-chain state mutations — tribe rule DF + shared Listing object)
- Gates: N/A (no code changes, PTB-only operations)
- Results:
  - Phase 3 `set_tribe_rule`: tribe=1000167 on gate `0xf130…` — TX `DXGsGVq8rVeGzUJkcRRkxMW4NvuZjUPY6uhBR5SyKtiK` ✅
  - Phase 4 `create_listing` + `share_listing`: item=78437, qty=1, price=1000 — TX `C3t5MJ5xtUsNyUe1B6nERFUYw2AHja4EbyNjQFNFMcJZ` ✅
  - Phases 1-2 (authorize extensions): PTBs prepared, blocked on game wallet `0xad02…` not in local keystore
- Follow-ups: Import game wallet or use EVE Vault to execute extension authorization; then test end-to-end jump/trade flows

---

## 2026-03-12 – Hour 5 Asset Discovery (Utopia)
- Goal: Map all live Utopia assets for wallet `0xad02…fb71` from chain data alone; select test candidates for GateControl + TradePost integration
- Files: `docs/operations/day1-validation.md` (Hour 5 section added)
- Diff: +130 LoC docs
- Risk: low (read-only chain discovery, no mutations)
- Gates: N/A (no code changes)
- Findings: 70 OwnerCaps (12 gates, 5 SSUs, 41 turrets, 9 nodes, 2 assemblies, 1 character). Primary test pair: Gate `0xf130…` + SSU `0x73a2…` (ONLINE, 5 items) co-located at Node `0x8bad…`
- Follow-ups: Authorize extensions via PTB (requires wallet signing); test tribe rule + listing creation

---

## 2026-03-12 – Package Published to Utopia Testnet
- Goal: Publish civilization_control package (gate_control + trade_post) to Utopia testnet for integration testing
- Files: `contracts/civilization_control/Published.toml` (generated), `contracts/civilization_control/Move.lock` (updated), `docs/operations/day1-validation.md` (publish record added)
- Diff: +40 LoC docs, generated publish metadata
- Risk: medium (first on-chain deployment)
- Gates: move-build ✅ move-test ✅ (21/21) publish ✅ (tx digest `EBU5T9cDymgUnyGTdtXkfBWuUmfWLKEMLJT5VXU8p5QU`)
- Artifacts: Package `0xb41a…6a04`, GateConfig (shared) `0x8655…45f2`, GateControl AdminCap `0xaedc…9b3e`, TradePostAdminCap `0x1ffb…df06`, UpgradeCap `0x1dea…fa3`
- Follow-ups: Authorize extensions on test gates/SSUs (requires OwnerCap — manual step); Hour 5 integration testing

---

## 2026-03-12 – TradePost Foundation Implementation
- Goal: Implement TradePost SSU extension — listing lifecycle (create/buy/cancel) with typed witness pattern for cross-address atomic trading
- Files: `contracts/civilization_control/sources/trade_post.move` (created), `contracts/civilization_control/tests/trade_post_tests.move` (created), `docs/core/march-11-reimplementation-checklist.md` (updated)
- Diff: +280 LoC source, +260 LoC tests
- Risk: medium (new Move module, SSU extension integration)
- Gates: move-build ✅ move-test ✅ (21/21 pass: 11 GateControl + 10 TradePost)
- Decisions:
  - Separate `TradePostAdminCap` from GateControl's `AdminCap` — independent admin control per module
  - `TradeAuth` witness mint is `public(package)` per builder-scaffold convention
  - `Listing` has `key` only (no `store`) — shared via `share_listing()` which calls `transfer::share_object`
  - `create_listing` returns `Listing` (composable) — caller shares via PTB calling `share_listing()`
  - `buy()` returns `Item` to caller — composable PTB pattern, buyer handles final transfer
  - Items delivered via direct transfer (not `deposit_item<Auth>`) because v0.0.15 `parent_id` validation prevents cross-SSU deposit
  - Exact payment required in `buy()` — caller splits coin in PTB (`txb.splitCoins`)
  - No item locking — seller retains full SSU access; buy fails if inventory insufficient
  - SSU must be online for trades (enforced by `withdraw_item` online guard)
  - `quantity: u32` field in Listing supports partial inventory listings
- Follow-ups: Integration test on Utopia testnet; extension freeze demo integration; TurretControl module

---

## 2026-03-12 – GateControl Foundation Implementation
- Goal: Implement GateControl typed witness extension — tribe filter + coin toll rules with per-gate dynamic field config
- Files: `contracts/civilization_control/Move.toml` (modified), `contracts/civilization_control/sources/gate_control.move` (created, replaced placeholder), `contracts/civilization_control/tests/gate_control_tests.move` (created)
- Diff: +315 LoC source, +215 LoC tests, placeholder removed
- Risk: medium (new Move module, world dependency wired)
- Gates: move-build ✅ move-test ✅ (11/11 pass)
- Decisions:
  - Kept existing `contracts/civilization_control/` path (checklist referenced `civcontrol/` but repo convention is canonical)
  - Removed `[addresses]` from Move.toml — required for compatibility with world dependency (new-style Move.toml format)
  - Added `[environments]` with Utopia chain ID `4c78adac` matching builder-scaffold convention
  - `GateAuth` witness mint is `public(package)` per builder-scaffold security convention (not `public`)
  - Per-gate config via compound DF keys (`TribeRuleKey { gate_id }`, `CoinTollKey { gate_id }`) on shared `GateConfig`
  - Permissionless permit issuance (no AdminCap on `request_jump_permit`) — gate rules themselves are the access control, matching builder-scaffold `tribe_permit.move` pattern
  - AdminCap guards config mutation only (set/remove rules)
  - 5-day permit expiry with overflow protection
  - Two permit paths: `request_jump_permit` (with payment) and `request_jump_permit_free` (no toll gates)
- Follow-ups: End-to-end integration test on devnet/testnet; TradePost foundation; extension freeze UX integration

---

## 2026-03-12 – EVE Vault Sponsorship Analysis: AdminACL Blocker Reclassified
- Goal: Determine whether EVE Vault's sponsored tx relay resolves the AdminACL blocker for CivilizationControl
- Files: `docs/architecture/evevault-sponsorship-analysis.md` (created), `docs/operations/day1-validation.md` (updated), `docs/README.md` (updated)
- Diff: +95 LoC (analysis doc), Day 1 Check 5 reclassified from BLOCKED → PASS
- Risk: low (research/documentation only, no code changes)
- Gates: N/A (no code changes)
- Decisions:
  - AdminACL sponsorship is **not required** for CivilizationControl's own functions — none call `verify_sponsor`
  - Game-level sponsored operations (`jump_with_permit`, etc.) are handled by EVE Frontier backend via Vault relay
  - Day 1 validation reclassified: no blockers remain for CC contract/app implementation
  - Live validation of end-to-end extended-gate jump flow remains a follow-up item (not a blocker)
- Follow-ups: Deploy extension to Utopia, test extended-gate jump with EVE Vault

---

## 2026-03-12 – Day 1 Chain Validation on Utopia Testnet
- Goal: Execute Day 1 checklist against live Utopia testnet, validate all source assumptions and environment IDs
- Files: `docs/operations/day1-validation.md` (created), `docs/decision-log.md` (updated)
- Diff: +180 LoC (validation results file)
- Risk: low
- Gates: move-build ✅ move-test ✅ (no frontend gates yet)
- Decisions:
  - Adopted Utopia testnet IDs as initial live baseline (all 8 LIVE-VERIFIED)
  - Feature branch `feature/day1-chain-validation` used for safe Day 1 execution
  - AdminACL sponsor enrollment marked BLOCKED — requires organizer action or EVE Vault confirmation
- Follow-ups: Confirm dapp-kit sponsored tx relay; request organizer AdminACL enrollment if needed

---

## 2026-03-17 – Posture Switch Idempotency Fix + Gate Online/Offline + Sponsor Semantics
- Goal: Fix ECoinTollNotSet abort on posture switch; unblock gate online/offline; refine link_gates conclusion
- Files: `src/lib/postureSwitchTx.ts` (filtered gate lists), `src/hooks/usePosture.ts` (pre-read gate policies), `src/lib/suiReader.ts` (batch policy fetch), `src/constants.ts` (+ENERGY_CONFIG_ID), `src/lib/gateOnlineOfflineTx.ts` (NEW), `src/hooks/useGateOnlineOffline.ts` (NEW), `src/screens/GateDetailScreen.tsx` (power control), `src/screens/GateListScreen.tsx` (fix invalidation key), `src/screens/TurretListScreen.tsx` (fix invalidation key)
- Diff: ~+200 LoC across 9 files (2 new, 7 modified)
- Risk: medium (posture PTB redesign, new online/offline PTB)
- Gates: typecheck ✅ build ✅
- Decisions:
  - Posture switch pre-reads gate policies via `fetchBatchGatePolicies()` before building PTB — gates split into `gatesWithToll` / `gatesWithoutToll` to avoid ECoinTollNotSet
  - EnergyConfig ID was already LIVE-VERIFIED in day1-validation.md (`0x9285…9c62`) — just never added to constants
  - Gate online/offline implemented as per-gate control on GateDetailScreen (not batch — online/offline is a deliberate per-gate decision)
  - `link_gates` conclusion refined: not possible from **any** web client without CCP-enrolled sponsor. `verify_sponsor` checks `AdminACL.authorized_sponsors` table — enrollment requires GovernorCap held only by CCP. Source TODO confirms this is a temporary guard for distance proofs.
  - Query invalidation key fixed: `"assets"` → `"assetDiscovery"` (was a complete no-op, causing 60s stale state after auth)
- Follow-ups: Test posture switch end-to-end on Utopia; batch online/offline if needed; unlink_gates implementation

---

## 2026-03-13 – Gate Auth Feasibility & Batch Authorization UI
- Goal: Determine which gate operations are possible from the web dashboard and implement batch gate extension authorization
- Files: `src/hooks/useAuthorizeExtension.ts` (added `authorizeGates`, `resetGate`, `resetTurret`), `src/screens/GateListScreen.tsx` (batch auth button + TxFeedbackBanner), `src/hooks/useOperatorReadiness.ts` (added `link` field to blockers), `src/components/PostureControl.tsx` (blocker → route links), `src/types/domain.ts` (added `GateAuthTarget`)
- Diff: ~+80 LoC across 5 files
- Risk: medium (new PTB construction for gate auth, touches readiness logic)
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Gate authorize_extension**: POSSIBLE from web PTB — same borrow/authorize/return pattern as turrets. No online requirement. Implemented as batch.
  - **Gate online/offline**: POSSIBLE in contract (`gate::online/offline` exist, no `verify_sponsor`). BLOCKED in practice — requires `EnergyConfig` shared singleton object ID, which is not discoverable from codebase or standard RPC queries. Deferred.
  - **Gate link_gates**: IMPOSSIBLE from web — requires `admin_acl.verify_sponsor(ctx)` (server-sponsored tx). In-game only. `unlink_gates` IS callable from web (no sponsor check).
  - Gate auth blockers are severity `"warning"` (not `"error"`) — they surface advice but do NOT block posture switch. Only turret auth blocks `isReady`.
  - Blocker items in PostureControl now include navigation links to the relevant screen (/gates, /turrets).
- Follow-ups: Discover EnergyConfig object ID for online/offline control; test batch gate auth on Utopia

---

<!-- New entries above this line -->
