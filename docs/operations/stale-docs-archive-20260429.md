# Stale Docs Archive — 2026-04-29

## Summary

- Archived high-confidence March-era and superseded planning docs that were still creating noise in the active authority chain.
- Left current runbooks, current runtime docs, and current instruction files active.
- Kept a small set of older docs in place with short historical or status banners where they still provide useful context.

## Moved Docs

| Old path | New path | Why |
|---|---|---|
| `docs/core/march-11-reimplementation-checklist.md` | `docs/archive/hackathon-2026/core/march-11-reimplementation-checklist.md` | Historical hackathon execution authority only |
| `docs/core/day1-checklist.md` | `docs/archive/hackathon-2026/core/day1-checklist.md` | Historical day-1 bootstrap checklist |
| `docs/core/CARRY_FORWARD_INDEX.md` | `docs/archive/hackathon-2026/core/CARRY_FORWARD_INDEX.md` | Historical hackathon carry-forward artifact |
| `docs/core/civilizationcontrol-implementation-plan.md` | `docs/archive/hackathon-2026/core/civilizationcontrol-implementation-plan.md` | Mostly historical March-window planning |
| `docs/analysis/must-work-claim-registry.md` | `docs/archive/hackathon-2026/analysis/must-work-claim-registry.md` | High-context mixed-project historical validation inventory |
| `docs/operations/migrate-to-stillness.md` | `docs/archive/hackathon-2026/operations/migrate-to-stillness.md` | Historical Stillness v1 migration playbook |
| `docs/operations/efmap-indexer-awareness-20260428.md` | `docs/archive/hackathon-2026/operations/efmap-indexer-awareness-20260428.md` | Historical shared-backend awareness before shipped enrichment |
| `docs/operations/post-hackathon-repo-readiness-audit.md` | `docs/archive/hackathon-2026/operations/post-hackathon-repo-readiness-audit.md` | Historical readiness audit superseded by newer cleanup work |
| `docs/operations/submodule-refresh-20260425.md` | `docs/archive/hackathon-2026/operations/submodule-refresh-20260425.md` | Historical vendor refresh audit |
| `docs/operations/documentation-consolidation-20260428.md` | `docs/archive/hackathon-2026/operations/documentation-consolidation-20260428.md` | Historical documentation cleanup report |

## Kept Active

| Path | Why it stayed active |
|---|---|
| `docs/README.md` | Canonical docs index and archive navigation |
| `docs/decision-log.md` | Newest-first operational truth |
| `docs/llm-reference-guide.md` | Current repo bootstrap brief |
| `docs/operations/shared-backend-assembly-enrichment-20260429.md` | Live shared-backend contract and fallback rules |
| `docs/operations/sponsor-worker-runbook.md` | Live sponsor-worker runbook |
| `docs/operations/world-runtime-original-split-20260429.md` | Current runtime/original package model |
| `docs/operations/mvr-world-package-audit-20260429.md` | Current world-package rationale and drift automation record |
| `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md` | Later-phase roadmap still useful after the shipped phase-1 enrichment |
| `docs/core/memory.md` | Active working-memory template |
| `docs/core/gate-policy-v2-design.md` | Still-current gate policy design reference |

## Banner-Only Docs

| Path | Why banner only |
|---|---|
| `docs/core/spec.md` | Still referenced as historical architecture rationale, but no longer current authority |
| `docs/core/validation.md` | Still useful for validation-pattern reference, but no longer current authority |
| `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md` | Phase 1 shipped; later phases still useful as roadmap |

## Active Authority Chain After Cleanup

1. Current code and config for the surface in question.
2. `docs/decision-log.md` for newest-first behavioral and operational truth.
3. `docs/llm-reference-guide.md` for current repo bootstrap context.
4. Current dated operations docs such as `docs/operations/shared-backend-assembly-enrichment-20260429.md`, `docs/operations/sponsor-worker-runbook.md`, `docs/operations/world-runtime-original-split-20260429.md`, and `docs/operations/mvr-world-package-audit-20260429.md`.
5. Archived docs only for historical evidence or background rationale.

## Left For Later

- `docs/analysis/assumption-registry-and-demo-fragility-audit.md` remains as historical evidence but was not moved in this pass.
- `docs/operations/world-v2-runtime-migration-plan-20260429.md` and `docs/operations/world-v2-runtime-preview-validation-20260429.md` remain in place for current cutover evidence and later soak-exit review.
- `docs/operations/sponsor-worker-runbook.md` could use a future status-note cleanup, but it remains a live runbook.

## Validation

- `git diff --check` on the whole repo returned only an unrelated `contracts/civilization_control/Move.lock` working-copy warning; the docs-only diff-hygiene checks were clean.
- `npm run typecheck` passed.
- `npm run build` passed. The existing large frontend chunk warning remained unchanged and non-blocking.
- Changed-files sanity check confirmed this docs cleanup set plus an unrelated unstaged `contracts/civilization_control/Move.lock` diff that was intentionally left untouched.