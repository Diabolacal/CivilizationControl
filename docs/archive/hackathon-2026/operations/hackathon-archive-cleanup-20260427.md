# Hackathon Archive Cleanup — 2026-04-27

- Date: 2026-04-27
- Branch: `docs/archive-hackathon-material`

## Summary

Moved clear hackathon submission, demo-production, recording, and one-off validation material into `docs/archive/hackathon-2026/` to reduce future LLM/context noise while preserving git history. Active product, architecture, UX, and current operations references were left in place.

## Files Moved

### Core

- `docs/core/civilizationcontrol-demo-beat-sheet.md` → `docs/archive/hackathon-2026/core/civilizationcontrol-demo-beat-sheet.md`
- `docs/core/civilizationcontrol-claim-proof-matrix.md` → `docs/archive/hackathon-2026/core/civilizationcontrol-claim-proof-matrix.md`
- `docs/core/demo-readiness-tranches.md` → `docs/archive/hackathon-2026/core/demo-readiness-tranches.md`

### Demo

- `docs/demo/capture-readiness-checklist.md` → `docs/archive/hackathon-2026/demo/capture-readiness-checklist.md`
- `docs/demo/demo-production-pipeline-plan.md` → `docs/archive/hackathon-2026/demo/demo-production-pipeline-plan.md`
- `docs/demo/manual-obs-capture-runbook.md` → `docs/archive/hackathon-2026/demo/manual-obs-capture-runbook.md`
- `docs/demo/narration-direction-spec.md` → `docs/archive/hackathon-2026/demo/narration-direction-spec.md`
- `docs/demo/tts-generation-guide.md` → `docs/archive/hackathon-2026/demo/tts-generation-guide.md`
- `docs/demo/video-production-guide-reference.md` → `docs/archive/hackathon-2026/demo/video-production-guide-reference.md`

### Operations

- `docs/operations/day1-validation.md` → `docs/archive/hackathon-2026/operations/day1-validation.md`
- `docs/operations/demo-evidence-appendix.md` → `docs/archive/hackathon-2026/operations/demo-evidence-appendix.md`
- `docs/operations/hackathon-submission-source.md` → `docs/archive/hackathon-2026/operations/hackathon-submission-source.md`
- `docs/operations/operator-validation-checklist.md` → `docs/archive/hackathon-2026/operations/operator-validation-checklist.md`

### Recordings

- `recordings/README.md` → `docs/archive/hackathon-2026/recordings/README.md`

### Scripts

- `scripts/assemble-trailer.ps1` → `docs/archive/hackathon-2026/scripts/assemble-trailer.ps1`
- `scripts/beat6-rehearsal.mts` → `docs/archive/hackathon-2026/scripts/beat6-rehearsal.mts`
- `scripts/pre-capture-startup.mts` → `docs/archive/hackathon-2026/scripts/pre-capture-startup.mts`
- `scripts/record-demo-scenes.mts` → `docs/archive/hackathon-2026/scripts/record-demo-scenes.mts`
- `scripts/smoke-test-manual-connect.mts` → `docs/archive/hackathon-2026/scripts/smoke-test-manual-connect.mts`
- `scripts/smoke-test-phase2-persistence.mts` → `docs/archive/hackathon-2026/scripts/smoke-test-phase2-persistence.mts`
- `scripts/smoke-test-recording-env.mts` → `docs/archive/hackathon-2026/scripts/smoke-test-recording-env.mts`
- `scripts/smoke-test-wallet-ext.mts` → `docs/archive/hackathon-2026/scripts/smoke-test-wallet-ext.mts`

## Active Docs Intentionally Left In Place

- `docs/llm-reference-guide.md`
- `docs/README.md`
- `docs/decision-log.md`
- `README.md`
- `docs/strategy/civilization-control/*`
- `docs/ux/*`
- `docs/architecture/*`
- `docs/operations/post-hackathon-repo-readiness-audit.md`
- `docs/operations/submodule-refresh-20260425.md`
- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`
- `docs/operations/migrate-to-stillness.md`
- `docs/operations/sui-upgrade-type-origin-guide.md`
- `docs/operations/extension-freeze-safety-guide.md`
- `docs/operations/gate-control-web-capabilities.md`
- `docs/operations/gate-lifecycle-runbook.md`
- `docs/core/spec.md`
- `docs/core/validation.md`
- `docs/core/gate-policy-v2-design.md`
- `docs/core/CARRY_FORWARD_INDEX.md`

## Uncertain Files Left For Later Review

- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`
- `docs/operations/migrate-to-stillness.md`
- `docs/strategy/civilization-control/where-civilizationcontrol-goes-next.md`
- `docs/core/spec.md`
- `docs/core/validation.md`
- `docs/architecture/gatecontrol-feasibility-report.md`
- `docs/architecture/sui-playground-capabilities.md`
- `scripts/test-sponsor.mjs`
- `scripts/test-turret-targeting.mjs`

## Index / Link Updates Made

- Added `docs/archive/hackathon-2026/README.md`
- Updated `docs/README.md` to remove archived files from active sections and add an archive entry
- Updated `README.md` to point key readers at the archive instead of direct demo/evidence docs
- Updated `docs/llm-reference-guide.md` repository map and historical-doc references
- Retargeted active links in `docs/core/spec.md`, `docs/core/validation.md`, `docs/core/march-11-reimplementation-checklist.md`, `docs/strategy/civilization-control/civilizationcontrol-product-vision.md`, `docs/strategy/civilization-control/civilizationcontrol-strategy-memo.md`, `docs/architecture/spatial-embed-requirements.md`, `docs/ux/svg-topology-layer-spec.md`, `docs/analysis/must-work-claim-registry.md`, and `docs/archive/hackathon-2026/recordings/README.md`

## Validation Run

- `git diff --check` ✅
- `git status --short --branch` ✅ docs/archive-only diff on `docs/archive-hackathon-material`
- `git diff --stat` ✅ archive moves plus targeted link/index updates only
- `git diff --name-status` ✅ docs/archive moves, doc index updates, and archived demo scripts only
- `npm run typecheck` ✅
- `npm run build` ✅ (existing Vite large chunk warning only)

## Remaining Cleanup Recommendations

- Decide later whether `scripts/test-sponsor.mjs` and `scripts/test-turret-targeting.mjs` should be archived or rewritten for Stillness-era diagnostics.
- Refresh `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` and `docs/operations/migrate-to-stillness.md` only in a dedicated Stillness/runtime follow-up.
- If a future post-hackathon demo package is created, build it from the archive rather than treating archived demo docs as active source-of-truth.