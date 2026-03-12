# Carry-Forward Export Index

**Retention:** Carry-forward

## Carry-Forward Policy

This document is the **definitive list** of files intended to be copied into the hackathon submission repository on March 11. Only files listed here should be carried forward.

> **Only copy files listed here into hackathon submission repository. This prevents accidental inclusion of sandbox or scaffold artifacts.**

When copying, update project name, scope, and any sandbox-specific references to match the specific hackathon build.

Execution authority remains `march-11-reimplementation-checklist.md`.
Pattern libraries (e.g., PTB docs) accelerate implementation but do not override checklist or spec authority.

---

## Core Documents (always copy)

| File | Purpose |
|------|---------|
| `docs/core/spec.md` | System specification — boundaries, on-chain model, risk model |
| `docs/core/march-11-reimplementation-checklist.md` | Execution checklist — validated patterns, day-1 bootstrap |
| `docs/core/validation.md` | Validation procedures — build gates, runtime expectations, proof moments |
| `docs/core/civilizationcontrol-implementation-plan.md` | Expanded implementation plan — all phases |
| `docs/core/day1-checklist.md` | Day-1 validation checklist |
| `docs/core/civilizationcontrol-demo-beat-sheet.md` | Demo beat sheet (v2) — ~2:56 competitive arc, Defense Mode climax, proof registry, failure fallbacks |
| `docs/core/civilizationcontrol-claim-proof-matrix.md` | Claim-proof matrix — maps claims to evidence |
| `docs/core/memory.md` | Working memory template (CivilizationControl extended) |
| `docs/core/hackathon-repo-conventions.md` | Repo-working conventions — git workflow, file discipline, naming, TS/React/Move standards, judge legibility |
| `docs/core/CARRY_FORWARD_INDEX.md` | This index |

## Strategy Documents (copy for voice/narrative consistency)

| File | Purpose |
|------|---------|
| `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md` | Voice, labels, microcopy guidelines |
| `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md` | Emotional design target |
| `docs/strategy/civilization-control/civilizationcontrol-strategy-memo.md` | Strategic positioning |
| `docs/strategy/civilization-control/civilizationcontrol-product-vision.md` | Product vision |
| `docs/strategy/_shared/hackathon-portfolio-roadmap.md` | Portfolio strategy and prize targeting |
| `docs/strategy/_shared/marketing-plan.md` | Marketing and submission narrative |

## UX Documents (copy for design guidance)

| File | Purpose |
|------|---------|
| `docs/ux/civilizationcontrol-ux-architecture-spec.md` | UX architecture specification |
| `docs/ux/svg-topology-layer-spec.md` | Strategic Network Map symbol grammar, state system, color doctrine |
| `docs/ux/svg-asset-audit.md` | SVG primitive inventory and compliance checklist |

## Demo Documents (copy for demo production)

| File | Purpose |
|------|---------|
| `docs/demo/narration-direction-spec.md` | Demo video narration voice config and delivery control |

## Architecture Documents (copy selectively — validated patterns)

| File | Purpose |
|------|---------|
| `docs/architecture/gate-lifecycle-function-reference.md` | Gate function signatures and auth requirements |
| `docs/architecture/gatecontrol-feasibility-report.md` | GateControl feasibility analysis |
| `docs/architecture/world-contracts-auth-model.md` | Auth model reference |
| `docs/architecture/read-path-architecture-validation.md` | Read-path validation |
| `docs/architecture/policy-authoring-model-validation.md` | Policy model validation |
| `docs/architecture/read-provider-abstraction.md` | Read-path abstraction layer design (RPC/GraphQL/Indexer providers) |
| `docs/architecture/spatial-embed-requirements.md` | Hybrid spatial architecture decision (SVG + EF-Map embed) |
| `docs/architecture/in-game-dapp-surface.md` | In-game embedded browser constraints (787px, Chromium 122) |
| `docs/architecture/authenticated-user-surface-analysis.md` | Wallet-to-structures discovery read-path analysis |

## Operations Documents (copy for bootstrap procedures)

| File | Purpose |
|------|---------|
| `docs/operations/gate-lifecycle-runbook.md` | 13-step gate lifecycle procedure |

| `docs/operations/demo-evidence-appendix.md` | Evidence collection appendix |
| `docs/operations/submodule-refresh-prompt.md` | Reusable submodule refresh procedure |

## Documentation Infrastructure (copy for repo hygiene)

| File | Purpose |
|------|---------|
| `docs/README.md` | Documentation index (update for new repo) |
| `docs/decision-log.md` | Decision log (start fresh in new repo) |

## Agent Instructions (copy for agent-assisted development)

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Agent guardrails (update project-specific sections for new repo) |
| `.github/instructions/move.instructions.md` | Move code conventions (auto-applied to `*.move`) |
| `.github/instructions/typescript-react.instructions.md` | TS/React/Tailwind conventions (auto-applied to `*.ts/*.tsx`) |
| `AGENTS.md` | Agent operating context (update project-specific sections for new repo) |

## Agent Infrastructure (copy for agent-assisted development)

| File | Purpose |
|------|---------|
| `.github/security-guidelines.md` | OWASP security baseline |
| `.github/prompts/rehydrate.prompt.md` | Context recovery prompt (`/rehydrate`) |
| `.github/prompts/vibe-bootstrap.prompt.md` | Onboarding wizard prompt |
| `.github/skills/deploy/SKILL.md` | Cloudflare deploy skill |
| `.github/skills/docker-ops/SKILL.md` | Docker operations skill |

## VS Code Workspace Config (copy for development ergonomics)

| File | Purpose |
|------|---------|
| `.vscode/settings.json` | Editor & agent config (update machine-specific entries for new repo) |
| `.vscode/extensions.json` | Recommended VS Code extensions |
| `.vscode/tasks.json` | Sui Move build/test/publish tasks (update default `movePkgPath` for new repo) |
| `.vscode/prompts/plan.prompt.md` | Change-planning chat prompt |

## Root Files (copy for repo identity)

| File | Purpose |
|------|---------|
| `GITHUB-COPILOT.md` | AI contributor pointer (rewrite for new repo) |
| `llms.txt` | LLM docs index (rewrite for new repo) |
| `LICENSE` | MIT license |
| `.gitignore` | Git ignore patterns (minor trim for target project) |

## Assets (copy entire tree for UI implementation)

| File | Purpose |
|------|---------|
| `assets/icons/` (entire tree) | SVG glyphs, overlays, badges, halos, pips — 20 SVGs + 5 READMEs |

## Templates (copy for deployment scaffolding)

| File | Purpose |
|------|---------|
| `templates/cloudflare/` (3 files) | Cloudflare deployment templates |

## PTB Pattern Library (copy as templates — revalidate on Day 1)

| File | Purpose |
|------|---------|
| `docs/ptb/README.md` | PTB library entry point — usage instructions, authority reminder, document index |
| `docs/ptb/ptb-patterns.md` | Core PTB assembly patterns — coin handling, shared/owned objects, capabilities, multi-call ordering |
| `docs/ptb/proof-extraction-moveabort.md` | Proof extraction under MoveAbort constraints — digest-based evidence, demo capture strategy |
| `docs/ptb/atomic-settlement-skeleton.md` | Contract-agnostic settlement skeleton — placeholder-based step sequences, revalidation checklist |
| `docs/ptb/governance-admin-skeletons.md` | Governance/admin PTB skeletons — capability handling, shared object mutation, rule configuration |

These documents are pattern templates only.
All function signatures, object requirements, and package IDs must be revalidated against the latest world-contracts commit and hackathon test server deployment before implementation.

---

## Other-Project Strategy Documents (project-specific routing)

These documents carry forward into **their own project repos only** — NOT the CivilizationControl submission repo.

| File | Target Repo |
|------|-------------|
| `docs/strategy/flappy-frontier/flappy-frontier-product-vision.md` | Flappy Frontier repo |
| `docs/strategy/cargo-bond/cargo-bond-product-vision.md` | Cargo Bond / Atomic Courier repo |
| `docs/strategy/fortune-gauntlet/fortune-gauntlet-project-vision.md` | Fortune Gauntlet repo |
| `docs/strategy/fortune-gauntlet/fortune-gauntlet-scoring-memo.md` | Fortune Gauntlet repo |

---

## Intentional Exclusions from CC Carry-Forward

The following are useful docs but are deliberately **not included** in the CC export set:

- `docs/analysis/must-work-claim-registry.md` — claims already captured in `validation.md`, `claim-proof-matrix.md`, and `day1-checklist.md`
- `docs/analysis/assumption-registry-and-demo-fragility-audit.md` — risk assumptions absorbed into `march-11-reimplementation-checklist.md` and `day1-checklist.md`
- `docs/operations/DECISIONS_TEMPLATE.md` — template format embedded in `.github/copilot-instructions.md`; not needed as a standalone file
- `docs/validation/` — localnet validation evidence stays in the evidence repo; carry-forward validation procedures live in `docs/core/validation.md`

---

## Explicit Exclusions

The following are **NOT** carried forward into the hackathon submission repo:

- `vendor/` — upstream submodules (re-add as needed in new repo)
- `sandbox/` — isolated validation tests (sandbox-only)
- `experiments/` — sandbox Move experiments (sandbox-only)
- `templates/` — scaffold templates (consumed, not copied)
- `notes/` — local smoketest logs (untracked)
- `docs/research/` — prep-only research and reference maps
- `docs/archive/` — superseded documents
- `docs/audits/` — point-in-time audit snapshots
- `docs/analysis/` — transient analysis artifacts
- `docs/core/WORKSPACE_ABSTRACT.md` — scaffold template documentation
- `docs/core/COPILOT_MEMORY_GUIDELINES.md` — agent memory guidelines (scaffold)
- `docs/operations/SCAFFOLD_NOTES.md` — scaffold setup notes
- `docs/operations/compliance-audit-2026-02-24.md` — point-in-time compliance check (superseded by 2026-03-09 audit)
- `docs/operations/compliance-audit-2026-03-09.md` — final pre-start compliance check (prep-only)
- `docs/ideas/` — idea exploration (decisions already captured in core docs)
- Historical validation artifacts unless explicitly listed above
