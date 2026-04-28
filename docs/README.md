# Documentation Index

**Retention:** Carry-forward

Documentation for CivilizationControl. Active product, architecture, validation, and operational references stay in place here; historical hackathon and demo-production material lives under `archive/`.

**Taxonomy:**
- `core/` — Authority documents: spec, implementation plan, validation, conventions
- `architecture/` — Technical design and feasibility validation
- `strategy/civilization-control/` — Product positioning, voice, narrative
- `analysis/` — Cross-cutting analytical artifacts
- `validation/` — Pre-start validation evidence
- `ux/` — UX architecture and visual design specs
- `ptb/` — PTB assembly pattern library (revalidation required)
- `operations/` — Runbooks, templates, procedures
- `archive/` — Historical hackathon/demo packages and preserved working memory

> **New docs rule:** All markdown files must go inside a categorized subfolder. Do not create files directly under `docs/`. Update this index when adding a new document.

---

## Canonical Terminology

### Product & Module Names

| Term | Context | Notes |
|------|---------|-------|
| **CivilizationControl** | Full product/submission name | Abbreviation: **CC** |
| **GateControl** | UI label for the gate governance module | Player-facing display name |
| **TradePost** | UI label for the SSU commerce module | Player-facing display name |

### On-Chain Types & Functions

| Term | Layer | Notes |
|------|-------|-------|
| `GateAuth` | CivControl gate extension witness type | Concrete type implementing `Auth: drop` |
| `TradeAuth` | CivControl trade extension witness type | Concrete type implementing `Auth: drop` |
| `authorize_extension<T>` | World-contracts function | Registers extension on a gate/SSU |
| `gate::issue_jump_permit<Auth>()` | World-contracts issuance function | Extension-callable, no AdminACL required |
| `gate::jump_with_permit()` | World-contracts consumption function | Requires AdminACL; deletes the permit object |
| `JumpPermit` | World-contracts struct (`key, store`) | Single-use, consumed by `jump_with_permit` |

### Currency & Units

| Term | Context | Notes |
|------|---------|-------|
| **Lux** | Primary display denomination | Player-facing amounts · 100 Lux = 1 EVE |
| **EVE** | On-chain settlement token | `Coin<EVE>` from assets package · 1 EVE = 10^9 base units |
| `Coin<EVE>` | On-chain token type | Settlement token for tolls and trades |
| **SUI** | Gas token only | Hidden from player UI — used for transaction fees |

---

## Decision Log

| File | Purpose |
|------|---------|
| [decision-log.md](decision-log.md) | Non-trivial technical and strategic decisions (newest first) |

## Repo Reference

| File | Purpose |
|------|---------|
| [llm-reference-guide.md](llm-reference-guide.md) | Self-contained repo briefing for LLM agents and fresh ChatGPT sessions |

## Core

| File | Purpose |
|------|---------|
| [core/spec.md](core/spec.md) | **System specification** — boundaries, on-chain model, module architecture, risk model |
| [core/march-11-reimplementation-checklist.md](core/march-11-reimplementation-checklist.md) | **Execution checklist** — validated patterns, day-1 bootstrap, pitfalls |
| [core/civilizationcontrol-implementation-plan.md](core/civilizationcontrol-implementation-plan.md) | **Implementation plan** — 45 steps across 7 phases |
| [core/day1-checklist.md](core/day1-checklist.md) | **Day-1 validation checklist** — 10 structured checks with GO/NO-GO gate |
| [core/validation.md](core/validation.md) | **Validation procedures** — build gates, runtime expectations, proof moment validation |
| [core/memory.md](core/memory.md) | **Working memory template** — structured sprint tracking, proof moment evidence |
| [core/hackathon-repo-conventions.md](core/hackathon-repo-conventions.md) | **Repo conventions** — git workflow, file discipline, naming, judge legibility |
| [core/gate-policy-v2-design.md](core/gate-policy-v2-design.md) | **Gate policy v2 design** — multi-tribe presets, posture-aware enforcement, upgrade plan |
| [core/CARRY_FORWARD_INDEX.md](core/CARRY_FORWARD_INDEX.md) | **Carry-forward index** — definitive file list |

## Architecture

| File | Purpose |
|------|---------|
| [architecture/gate-lifecycle-function-reference.md](architecture/gate-lifecycle-function-reference.md) | Gate lifecycle complete function call reference |
| [architecture/gatecontrol-feasibility-report.md](architecture/gatecontrol-feasibility-report.md) | GateControl feasibility validation |
| [architecture/world-contracts-auth-model.md](architecture/world-contracts-auth-model.md) | Auth model reference — all structs, 40+ functions, extension pattern |
| [architecture/read-path-architecture-validation.md](architecture/read-path-architecture-validation.md) | Read-path validation — event inventory, signal feed sources |
| [architecture/policy-authoring-model-validation.md](architecture/policy-authoring-model-validation.md) | Policy model — data-driven policies via dynamic fields |
| [architecture/read-provider-abstraction.md](architecture/read-provider-abstraction.md) | Read provider abstraction — RPC/GraphQL/Indexer/Demo providers |
| [architecture/spatial-embed-requirements.md](architecture/spatial-embed-requirements.md) | Hybrid spatial architecture — SVG topology + EF-Map embed |
| [architecture/in-game-dapp-surface.md](architecture/in-game-dapp-surface.md) | In-game embedded browser constraints (Chromium 122 CEF) |
| [architecture/authenticated-user-surface-analysis.md](architecture/authenticated-user-surface-analysis.md) | Wallet-to-structures discovery read-path |
| [architecture/sui-playground-capabilities.md](architecture/sui-playground-capabilities.md) | Capabilities deep dive — smart structures, experiments |
| [architecture/evevault-sponsorship-analysis.md](architecture/evevault-sponsorship-analysis.md) | EVE Vault sponsored tx path analysis — AdminACL blocker resolution |

## Strategy

| File | Purpose |
|------|---------|
| [strategy/civilization-control/civilizationcontrol-voice-and-narrative.md](strategy/civilization-control/civilizationcontrol-voice-and-narrative.md) | **Voice & narrative guide** — labels, microcopy, Narrative Impact Check |
| [strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md](strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md) | **Emotional design target** — Five-Pillar Lens, 3-Second Check |
| [strategy/civilization-control/civilizationcontrol-strategy-memo.md](strategy/civilization-control/civilizationcontrol-strategy-memo.md) | Strategic positioning review |
| [strategy/civilization-control/civilizationcontrol-product-vision.md](strategy/civilization-control/civilizationcontrol-product-vision.md) | Product vision pitch — problem, vision, demo narrative |
| [strategy/civilization-control/where-civilizationcontrol-goes-next.md](strategy/civilization-control/where-civilizationcontrol-goes-next.md) | Post-hackathon direction — Stillness deployment, platform tracking, future governance surfaces |

## Analysis

| File | Purpose |
|------|---------|
| [analysis/assumption-registry-and-demo-fragility-audit.md](analysis/assumption-registry-and-demo-fragility-audit.md) | **Assumption registry** — 87 material assumptions, beat-by-beat determinism, top 5 risks |
| [analysis/must-work-claim-registry.md](analysis/must-work-claim-registry.md) | **Must-work claim registry** — 148 testable claims with validation status |

## Validation

| File | Purpose |
|------|---------|
| [validation/localnet-validation-backlog.md](validation/localnet-validation-backlog.md) | Prioritized must-work claim inventory |
| [validation/compound-df-key-validation.md](validation/compound-df-key-validation.md) | Compound DF Key — 6/6 PASS |
| [validation/extension-integration-e2e-validation.md](validation/extension-integration-e2e-validation.md) | Extension E2E — authorize + issue_jump_permit + DF config all PASS |
| [validation/admin-acl-enrollment-validation.md](validation/admin-acl-enrollment-validation.md) | AdminACL Self-Enrollment — verify_sponsor confirmed |
| [validation/ssu-extension-e2e-validation.md](validation/ssu-extension-e2e-validation.md) | SSU Extension E2E — 7/7 PASS |

## UX

| File | Purpose |
|------|---------|
| [ux/civilizationcontrol-ux-architecture-spec.md](ux/civilizationcontrol-ux-architecture-spec.md) | UX architecture — screen hierarchy, rule composer, MVP vs stretch |
| [ux/svg-topology-layer-spec.md](ux/svg-topology-layer-spec.md) | SVG topology layer — symbol grammar, state system, color doctrine |
| [ux/svg-asset-audit.md](ux/svg-asset-audit.md) | SVG asset audit — 19 primitives checked against spec |
| [ux/ui-polish-reference-brief.md](ux/ui-polish-reference-brief.md) | UI polish reference — hierarchy, sizing, noise reduction rules for demo capture |
| [ux/strategic-network-map-implementation-audit.md](ux/strategic-network-map-implementation-audit.md) | **Strategic Network Map audit** — current-state implementation vs spec gap analysis, asset usage, recommended slices |

## PTB Pattern Library

| File | Purpose |
|------|---------|
| [ptb/README.md](ptb/README.md) | PTB library entry point — usage instructions, document index |
| [ptb/ptb-patterns.md](ptb/ptb-patterns.md) | Core PTB assembly patterns |
| [ptb/proof-extraction-moveabort.md](ptb/proof-extraction-moveabort.md) | Proof extraction under MoveAbort constraints |
| [ptb/atomic-settlement-skeleton.md](ptb/atomic-settlement-skeleton.md) | Contract-agnostic settlement skeleton |
| [ptb/governance-admin-skeletons.md](ptb/governance-admin-skeletons.md) | Governance/admin PTB skeletons |

## Operations

| File | Purpose |
|------|---------|
| [operations/DECISIONS_TEMPLATE.md](operations/DECISIONS_TEMPLATE.md) | Decision log entry format template |
| [operations/documentation-consolidation-20260428.md](operations/documentation-consolidation-20260428.md) | **Documentation consolidation report** — archive moves, kept-active docs, uncertain items, and future doc-hygiene rule |
| [operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md](operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md) | **CC read-path replacement plan** — concrete matrix of current browser reads, EF-Map replacement candidates, safe boundaries, and the recommended first slice |
| [operations/efmap-indexer-awareness-20260428.md](operations/efmap-indexer-awareness-20260428.md) | **EF-Map indexer awareness** — local repo, VPS/runtime, data surfaces, boundaries, and recommended next slice for future CC integration |
| [operations/gate-lifecycle-runbook.md](operations/gate-lifecycle-runbook.md) | 13-step gate lifecycle procedure with evidence |
| [operations/submodule-refresh-prompt.md](operations/submodule-refresh-prompt.md) | Reusable submodule refresh procedure |
| [operations/sui-upgrade-type-origin-guide.md](operations/sui-upgrade-type-origin-guide.md) | **Sui upgrade type-origin guide** — dual package ID model, verification evidence |
| [operations/extension-freeze-safety-guide.md](operations/extension-freeze-safety-guide.md) | **Extension freeze safety guide** — when/how to freeze, posture-switching constraint |
| [operations/gate-control-web-capabilities.md](operations/gate-control-web-capabilities.md) | **Structure control web capabilities** — controllability matrix for gates, turrets, SSUs, network nodes |
| [operations/migrate-to-stillness.md](operations/migrate-to-stillness.md) | **Stillness migration playbook** — compatibility verification, address inventory, migration checklist |
| [operations/sponsor-worker-runbook.md](operations/sponsor-worker-runbook.md) | **Sponsor worker runbook** — in-repo worker layout, secrets, validation, and policy update procedure |
| [operations/post-hackathon-repo-readiness-audit.md](operations/post-hackathon-repo-readiness-audit.md) | **Post-hackathon readiness audit** — cleanup sequence, Stillness risks, stashes, submodules, validation baseline |
| [operations/submodule-refresh-20260425.md](operations/submodule-refresh-20260425.md) | **Submodule refresh audit** — vendor pointer updates, upstream impact, validation, and follow-up actions |

## Working Memory

| File | Purpose |
|------|---------|
| [working_memory/2026-03-12_march11-foundation.md](working_memory/2026-03-12_march11-foundation.md) | March 11 foundation sprint — GateControl progress, environment state, next steps |

## Archive / Historical

| File | Purpose |
|------|---------|
| [archive/hackathon-2026/README.md](archive/hackathon-2026/README.md) | Historical hackathon submission, demo production, recordings, and archived scripts |
| [archive/sponsor-worker-20260428/README.md](archive/sponsor-worker-20260428/README.md) | Sponsor-worker migration and cutover archive — planning, validation, cutover, and CORS-fix evidence bundle |
| [archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md](archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md) | Superseded sponsor worker handoff — preserved Flappy-owned allowlist history and stale-policy context |

---

## Non-Docs References

| File | Purpose |
|------|---------|
| [AGENTS.md](../AGENTS.md) | Agent context — auto-loaded by VS Code |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Authoritative guardrails and patterns |
| [GITHUB-COPILOT.md](../GITHUB-COPILOT.md) | Copilot-specific playbook |
| [llms.txt](../llms.txt) | AI-readable documentation pointer |
| [templates/cloudflare/](../templates/cloudflare/) | Cloudflare Pages/Workers config templates |
