# Documentation Consolidation — 2026-04-28

## Purpose

Reduce context noise in `docs/operations/` by archiving completed sponsor-worker migration and cutover evidence, keeping current operational docs active, and updating the live source-of-truth references for future agents.

## Files archived

Moved to `docs/archive/sponsor-worker-20260428/`:

- `docs/archive/sponsor-worker-20260428/sponsor-signer-migration-plan-20260427.md`
- `docs/archive/sponsor-worker-20260428/sponsor-worker-deploy-readiness-20260427.md`
- `docs/archive/sponsor-worker-20260428/sponsor-worker-runtime-discovery-20260427.md`
- `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-plan-20260428.md`
- `docs/archive/sponsor-worker-20260428/sponsor-worker-cutover-validation-20260428.md`
- `docs/archive/sponsor-worker-20260428/sponsor-worker-production-cutover-20260428.md`
- `docs/archive/sponsor-worker-20260428/production-sponsor-fallback-diagnostic-20260428.md`

Moved to `docs/archive/hackathon-2026/operations/`:

- `docs/archive/hackathon-2026/operations/hackathon-archive-cleanup-20260427.md`

## Files intentionally kept active

- `docs/operations/sponsor-worker-runbook.md`
- `docs/operations/submodule-refresh-prompt.md`
- `docs/operations/migrate-to-stillness.md`
- `docs/operations/sui-upgrade-type-origin-guide.md`
- `docs/operations/gate-lifecycle-runbook.md`
- `docs/operations/extension-freeze-safety-guide.md`
- `docs/operations/gate-control-web-capabilities.md`
- `docs/operations/post-hackathon-repo-readiness-audit.md`
- `docs/operations/submodule-refresh-20260425.md`
- `docs/README.md`
- `docs/llm-reference-guide.md`
- `docs/decision-log.md`

## Uncertain files left for later review

- `docs/core/day1-checklist.md`
- `docs/core/march-11-reimplementation-checklist.md`
- `docs/core/CARRY_FORWARD_INDEX.md`

Reason:

- these are clearly historical, but they are still referenced as current authority or implementation context by active core, analysis, and pattern docs
- archiving them safely needs a separate authority-chain refresh rather than a narrow sponsor-ops consolidation pass

## Active source-of-truth docs after cleanup

- `docs/operations/sponsor-worker-runbook.md`
- `docs/archive/sponsor-worker-20260428/README.md`
- `docs/llm-reference-guide.md`
- `docs/README.md`
- `docs/decision-log.md`

## Validation results

- `git diff --check` passed
- `git status --short --branch` showed only the expected docs moves and source-of-truth doc updates on `docs/consolidate-sponsor-ops-archive`
- `git diff --stat` and `git diff --name-status` matched the intended archive, index, and guide changes
- `npm run typecheck` passed
- `npm run build` passed with only the known Vite large-chunk warning
- `npm run sponsor:validate-policy` passed
- `npm run sponsor:test` passed
- `npm run sponsor:typecheck` passed

## Recommended future doc hygiene rule

- dated operational evidence reports should be archived once the task is complete and the current state has been folded into a runbook, LLM guide, or decision log
- `docs/operations/` should stay focused on active procedures and current operational references