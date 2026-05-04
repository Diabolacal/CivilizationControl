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
| [core/spec.md](core/spec.md) | **Historical system spec** — original boundaries, on-chain model, module architecture, and risk model |
| [core/validation.md](core/validation.md) | **Historical validation patterns** — build gates, runtime expectations, and proof-moment checks |
| [core/memory.md](core/memory.md) | **Working memory template** — structured sprint tracking, proof moment evidence |
| [core/hackathon-repo-conventions.md](core/hackathon-repo-conventions.md) | **Repo conventions** — git workflow, file discipline, naming, judge legibility |
| [core/gate-policy-v2-design.md](core/gate-policy-v2-design.md) | **Gate policy v2 design** — multi-tribe presets, posture-aware enforcement, upgrade plan |

## Current Architecture / Runtime

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
| [analysis/assumption-registry-and-demo-fragility-audit.md](analysis/assumption-registry-and-demo-fragility-audit.md) | **Historical demo-risk evidence** — assumptions, beat-by-beat determinism, and top demo fragility risks |

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
| [ux/svg-topology-layer-spec.md](ux/svg-topology-layer-spec.md) | SVG topology layer — symbol grammar, state system, color doctrine, and node-level catalogue extension |
| [ux/svg-asset-audit.md](ux/svg-asset-audit.md) | SVG asset audit — baseline primitives plus node-level catalogue addendum |
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

## Active Operations

| File | Purpose |
|------|---------|
| [operations/DECISIONS_TEMPLATE.md](operations/DECISIONS_TEMPLATE.md) | Decision log entry format template |
| [operations/agent-environment-and-guidance-audit-20260429.md](operations/agent-environment-and-guidance-audit-20260429.md) | **Agent environment and guidance audit** — planning-only inventory of repo instructions, local VS Code/Copilot tooling, MCP overlap, documentation sprawl, security guidance, and follow-up recommendations |
| [operations/local-vscode-tooling-review-20260429.md](operations/local-vscode-tooling-review-20260429.md) | **Local VS Code and tooling review** — read-only inventory of workspace settings, extensions, MCP visibility, token/noise risks, and local toolchain drift |
| [operations/vscode-1-118-tooling-review-20260501.md](operations/vscode-1-118-tooling-review-20260501.md) | **VS Code 1.118 tooling review** — release-note review, prompt-evaluation guidance, and conservative repo/user-level feature decisions |
| [operations/stale-docs-archive-20260429.md](operations/stale-docs-archive-20260429.md) | **Stale docs archive pass** — what moved, what stayed active, the live authority chain, and remaining follow-up docs |
| [operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md](operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md) | **CC read-path replacement plan** — concrete matrix of current browser reads versus the shared Frontier backend currently implemented in the EF-Map repo/runtime, plus safe boundaries and the recommended first slice |
| [operations/shared-backend-assembly-enrichment-20260429.md](operations/shared-backend-assembly-enrichment-20260429.md) | **Shared-backend assembly enrichment** — production EF-Map endpoint contract, CC join-key source, additive merge rules, and fallback boundary |
| [operations/gate-lifecycle-runbook.md](operations/gate-lifecycle-runbook.md) | 13-step gate lifecycle procedure with evidence |
| [operations/submodule-refresh-prompt.md](operations/submodule-refresh-prompt.md) | Reusable submodule refresh procedure |
| [operations/sui-upgrade-type-origin-guide.md](operations/sui-upgrade-type-origin-guide.md) | **Sui upgrade type-origin guide** — dual package ID model, verification evidence |
| [operations/extension-freeze-safety-guide.md](operations/extension-freeze-safety-guide.md) | **Extension freeze safety guide** — when/how to freeze, posture-switching constraint |
| [operations/gate-control-web-capabilities.md](operations/gate-control-web-capabilities.md) | **Structure control web capabilities** — controllability matrix for gates, turrets, SSUs, network nodes |
| [operations/mvr-world-package-audit-20260429.md](operations/mvr-world-package-audit-20260429.md) | **MVR world package audit** — `@evefrontier/world` findings, Phase 1 drift automation, and phased World v2 adoption strategy |
| [operations/world-runtime-original-split-20260429.md](operations/world-runtime-original-split-20260429.md) | **World runtime/original split** — no-behavior-change Phase 2 refactor that separates runtime targets from type-origin surfaces |
| [operations/world-v2-runtime-migration-plan-20260429.md](operations/world-v2-runtime-migration-plan-20260429.md) | **World v2 runtime migration plan** — planning-only cutover map for runtime package alignment, preview proof, and rollback |
| [operations/world-v2-runtime-preview-validation-20260429.md](operations/world-v2-runtime-preview-validation-20260429.md) | **World v2 runtime preview validation** — implementation evidence, preview URLs, worker overlap, bundle proof, and manual smoke checklist |
| [operations/sponsor-worker-runbook.md](operations/sponsor-worker-runbook.md) | **Sponsor worker runbook** — in-repo worker layout, secrets, validation, and policy update procedure |
| [operations/network-node-posture-icon-and-drilldown-plan-20260429.md](operations/network-node-posture-icon-and-drilldown-plan-20260429.md) | **Network-node posture icon and drilldown plan** — structure catalogue, icon taxonomy, node-local UX concept, and phased implementation sequence for the next operator-control surface |
| [operations/network-node-drilldown-implementation-plan-20260501.md](operations/network-node-drilldown-implementation-plan-20260501.md) | **Network-node drilldown implementation plan** — implementation-ready same-dashboard drilldown model, node-local layout, persistence, preset staging, and safe write sequencing |
| [operations/node-control-write-action-audit-20260504.md](operations/node-control-write-action-audit-20260504.md) | **Node Control write-action audit** — current-state capability matrix for write actions, sponsor gaps, zero-package candidates, and deferred high-risk actions |

## Working Memory

| File | Purpose |
|------|---------|
| [working_memory/2026-03-12_march11-foundation.md](working_memory/2026-03-12_march11-foundation.md) | March 11 foundation sprint — GateControl progress, environment state, next steps |

## Archive / Historical

| File | Purpose |
|------|---------|
| [archive/hackathon-2026/core/march-11-reimplementation-checklist.md](archive/hackathon-2026/core/march-11-reimplementation-checklist.md) | Historical March 11 execution checklist and validated hackathon patterns |
| [archive/hackathon-2026/core/day1-checklist.md](archive/hackathon-2026/core/day1-checklist.md) | Historical day-1 bootstrap and chain validation checklist |
| [archive/hackathon-2026/core/CARRY_FORWARD_INDEX.md](archive/hackathon-2026/core/CARRY_FORWARD_INDEX.md) | Historical hackathon carry-forward export checklist |
| [archive/hackathon-2026/core/civilizationcontrol-implementation-plan.md](archive/hackathon-2026/core/civilizationcontrol-implementation-plan.md) | Historical March-window implementation plan |
| [archive/hackathon-2026/analysis/must-work-claim-registry.md](archive/hackathon-2026/analysis/must-work-claim-registry.md) | Historical mixed-project must-work claim inventory |
| [archive/hackathon-2026/operations/migrate-to-stillness.md](archive/hackathon-2026/operations/migrate-to-stillness.md) | Historical Stillness v1 migration playbook |
| [archive/hackathon-2026/operations/efmap-indexer-awareness-20260428.md](archive/hackathon-2026/operations/efmap-indexer-awareness-20260428.md) | Historical EF-Map/shared-backend awareness audit |
| [archive/hackathon-2026/operations/post-hackathon-repo-readiness-audit.md](archive/hackathon-2026/operations/post-hackathon-repo-readiness-audit.md) | Historical post-hackathon repo readiness audit |
| [archive/hackathon-2026/operations/submodule-refresh-20260425.md](archive/hackathon-2026/operations/submodule-refresh-20260425.md) | Historical vendor submodule refresh audit |
| [archive/hackathon-2026/operations/documentation-consolidation-20260428.md](archive/hackathon-2026/operations/documentation-consolidation-20260428.md) | Historical documentation cleanup report |
| [archive/hackathon-2026/README.md](archive/hackathon-2026/README.md) | Historical hackathon submission, demo production, recordings, and archived scripts |
| [archive/sponsor-worker-20260428/README.md](archive/sponsor-worker-20260428/README.md) | Sponsor-worker migration and cutover archive — planning, validation, cutover, and CORS-fix evidence bundle |
| [archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md](archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md) | Superseded sponsor worker handoff — preserved Flappy-owned allowlist history and stale-policy context |

---

## Non-Docs References

| File | Purpose |
|------|---------|
| [AGENTS.md](../AGENTS.md) | Agent context — auto-loaded by VS Code |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Authoritative guardrails and patterns |
| [.github/prompts/](../.github/prompts/) | Shared reusable prompt files for planning and context recovery; archived stale prompts live under `.github/prompts/archive/` |
| [GITHUB-COPILOT.md](../GITHUB-COPILOT.md) | Copilot-specific playbook |
| [llms.txt](../llms.txt) | AI-readable documentation pointer |
| [templates/cloudflare/](../templates/cloudflare/) | Cloudflare Pages/Workers config templates |
