# Agents Context — CivilizationControl

Purpose: Provide persistent, high-signal context and guardrails for agent mode in this repository. VS Code will automatically ingest this file (1.104+). Keep it short and link out for depth.

## Workflow primer

- Start every reply with a brief acknowledgement plus a high-level plan.
- Manage work through the todo list tool with exactly one item `in-progress`; update statuses as soon as tasks start or finish.
- Report status as deltas—highlight what changed since the last message instead of repeating full plans.
- Run fast verification steps yourself when feasible and note any gates you couldn't execute.

## Project quick facts

- What: CivilizationControl — browser-only governance command layer for EVE Frontier tribe leaders
- Modules: GateControl (gate policy), TradePost (SSU commerce), TurretControl (posture presets)
- Frontend: React + TypeScript + Vite, served from Cloudflare Pages
- Backend: None — browser-only SPA with direct Sui RPC
- Contracts: Sui Move extension package at `contracts/civilization_control/`
- Data: Sui JSON-RPC → React hooks via read provider abstraction
- Hackathon: EVE Frontier (Deepsurge / CCP Games), deadline March 31, 2026

> **Glossary note:** If you see "SWE" in voice notes or transcripts, it refers to **Sui** (the blockchain). Transcription tools frequently mishear it.

Useful entry points:
- **Documentation Index**: `docs/README.md` — central map for all project documentation
- **System Spec**: `docs/core/spec.md` — boundaries, on-chain model, risk model
- **Guardrails**: `.github/copilot-instructions.md` (source of truth for patterns)
- **Decisions**: `docs/decision-log.md` (newest first)
- **Day-1 Checklist**: `docs/core/day1-checklist.md`
- **Demo Beat Sheet**: `docs/core/civilizationcontrol-demo-beat-sheet.md`

## Three-tier boundaries

✅ **Always do (no permission needed):**
- Read any file for context gathering
- Run build, test, lint, typecheck commands
- Update working memory documents (`docs/working_memory/`)
- Write to `docs/` (decision logs, working memory, guides)
- Use documentation lookup tools (MCP servers, etc.)
- Execute automated test and verification steps

⚠️ **Ask first (coordinate before action):**
- Modifying core Move contract logic or API contracts
- Changes to high-risk runtime surfaces (vendor submodule boundaries, Sui key material)
- Signing, certificate, or credential handling
- Creating distribution packages
- Breaking changes to cross-system payload schemas
- Adding external dependencies
- Changes spanning >3 core files or >150 LoC delta

🚫 **Never do (hard boundaries):**
- Commit secrets, certificates, private keys
- Deploy unsigned or unverified artifacts to users
- Remove failing tests to make CI pass
- Make changes outside your designated repository scope
- Skip mandatory verification scripts before distribution
- Store PII in analytics or telemetry

## Operational guardrails (summary)

Authoritative language for every mandate lives in `.github/copilot-instructions.md`. This section is a quick primer so agents see the rules even if only `AGENTS.md` is loaded.

- **Run the commands yourself.** Execute CLI / git / HTTP checks directly unless a secret prompt is required. Launch the command, ask the operator to paste secrets locally, and summarize results.
- **Preview vs production deploys.** Feature branches deploy to preview environments. Production deploys only come from `main` after merge. Deploy commands MUST be run from the project root to pick up Cloudflare bindings.
- **Working memory discipline.** Consider a Working Memory file when: (a) a task spans multiple real-world sessions, (b) VS Code shows "summarizing conversation" or ≥70% context, or (c) operator explicitly asks.
- **Decision logging.** Any non-trivial behavior change, data migration, or platform action must be reflected in `docs/decision-log.md`.

Treat this list as a pointer; if wording differs, the `.github/copilot-instructions.md` version wins.

### External Spec Handling

When the operator pastes an externally generated plan or spec (e.g., from ChatGPT or Gemini), treat it as **intent**. Reconcile it with `.github/copilot-instructions.md` guardrails before execution.

## Agent operating rules (must follow)

1. Prefer smallest safe change; don't refactor broadly without explicit approval.
2. Follow the workflow primer: purposeful preamble + plan, synchronized todo list, and delta-style progress updates.
3. CLI mandate: When possible, run CLI commands yourself and summarize results. Prompt user only for secret inputs. Never commit secrets.
4. Sensitive edits: Treat Move contract entry points, production config, and build pipeline files as sensitive; ask before structural changes.
5. **Manual deployment may be required**: Check whether Cloudflare auto-deploys on push. If not, YOU must execute the deploy command after pushing.
6. **Feature branch deploys**: Always use feature-branch-scoped preview deploys. Never deploy feature branches to production.
7. **Automated error recovery**: If a build, typecheck, or test fails after your patch, do NOT present raw errors to the user and ask how to proceed. Self-diagnose, explain the cause in plain English, apply a fix, and re-run the gate. Only escalate if a fix attempt also fails or requires a design decision.

## Code & Repo Conventions

Full conventions in `docs/core/hackathon-repo-conventions.md` (carry-forward). Language-specific rules in `.github/instructions/`. These are the top-priority rules agents must internalize:

### Git Workflow
- **Branch for all non-trivial work.** Pattern: `feat/`, `fix/`, `docs/`, `chore/`, `spike/`. Lowercase, hyphen-separated.
- **Squash merge to `main`.** One clean commit per feature. PR title = commit message.
- **Commit message format:** `type: Imperative description` (e.g., `feat: Add toll collection`). Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
- **`main` must always be demo-ready.** Never merge broken code.
- **Spike branches** (`spike/`) are throwaway — never merge them.

### File Discipline
- **No files >500 lines** without explicit justification. React components ~150 lines, page components ~100 lines, Move modules ~500 lines.
- **No "god files."** Split any file doing 3+ unrelated things.
- **No commented-out code.** Write it or delete it.
- **No duplicate utilities.** Grep the workspace before creating helpers.
- **Place files correctly.** Follow directory conventions. No random one-off files at project root.

### Naming
- **React components:** `PascalCase.tsx`. Hooks: `useCamelCase.ts`. Utils: `camelCase.ts`.
- **Move:** modules `snake_case`, structs `PascalCase`, caps `PascalCaseCap`, events `PascalCaseEvent`, errors `EPascalCase`.
- **Directories:** `kebab-case`. Scripts: `verb-noun.ts`.
- **No generic names:** `utils2.ts`, `helper.ts`, `stuff.ts`, `Component3.tsx` are forbidden.

### Agent Behavior
- **Check for existing files** before creating new ones. Duplicates are a common failure mode.
- **Respect file size limits** proactively — split at generation time, not after.
- **Do not create summary docs** after every change. Update existing docs or confirm verbally.
- **Do not add speculative code** "for future use." Only write what's needed now.

## Working Memory & Context Management

Agent Mode enforces a per-conversation context limit. When the buffer fills, VS Code silently summarizes prior turns, which is lossy. A Working Memory file helps preserve task context.

### When to use Working Memory (optional)

Recommended—not required—for:
- Tasks spanning **multiple real-world sessions** (overnight, multi-day)
- After seeing a **"summarizing conversation"** toast or ≥70% context warning
- When the **operator explicitly requests** added rigor or handoff prep

For typical single-session work, proceed directly.

### Required metadata block

```markdown
# Working Memory — <Task>
**Date:** YYYY-MM-DD HH:MMZ
**Task Name:** <What you are doing>
**Version:** <increment when meaningfully edited>
**Maintainer:** <Agent / human pairing>
```

### Template

Use the extended template in `docs/core/memory.md`, which adds Environment State (package IDs, network), Evidence Captured (proof moment tracking), and Commands Run sections.

### Recovery anti-patterns
- Do **not** continue after a summarization event without re-reading context.
- Do **not** rely solely on chat history for architecture decisions.
- Do **not** invent missing details—ask the operator when information is unclear.

### Rehydration (`/rehydrate`)
When resuming after context loss: (1) read Working Memory file, (2) restate Objective/Status/Next Step, (3) ask confirmation before resuming. See `.github/prompts/rehydrate.prompt.md`.

### Cleanup
- Move completed Working Memory files to `docs/archive/working_memory/` or delete.
- Keep at most one active file per task.

## Context Discipline & Subagent Policy

Subagents are the **primary mechanism** for complex work. Use them by default for:
- Multi-file changes (≥3 files) or cross-surface edits (frontend + contracts)
- Research-heavy tasks (audits, schema analysis, migration planning)
- Any step that might consume >20% of context budget

**Subagent output requirements:** (1) short summary, (2) concrete deliverables, (3) risks/follow-ups.

## Submodule & Vendor Policy

`vendor/*` directories contain **third-party upstream repos** added as git submodules. These rules are non-negotiable:

🚫 **Never do:**
- Create commits inside any `vendor/` submodule
- Modify, delete, or add tracked files within `vendor/*`
- Stage submodule-internal changes from the parent repo

✅ **Correct patterns:**
- **Update submodule pin:** `git submodule update --remote vendor/<name>` from the repo root, then commit the new gitlink
- **Local-only ignores:** Use `vendor/<name>/.git/info/exclude` for transient files
- **Read freely:** Reading submodule source for context/reference is always allowed

## High-risk surfaces (coordinate before changing)

- **Submodule boundaries** — never commit inside `vendor/*`
- **Sui key material** — private keys, mnemonics, wallet configs
- **Move contract entry points** — main module functions, witness types
- **API / data contracts** — persistence, auth, protocol definitions
- **Frontend state management** — global state, context providers

## Hackathon Narrative & Emotional Signal Priority (UI + Demo Only)

CivilizationControl must communicate **calm authority, sovereignty, and governance** — not generic SaaS vocabulary. This guardrail applies to all player-facing surfaces and demo materials.

**Canonical references:**
- `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md`
- `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md`

**Agent rules:**
1. **Evaluate UI labels** against the label mapping table in the canonical narrative doc. Do not default to generic terms (Dashboard, Admin, Objects, Settings, Notifications).
2. **Run the Narrative Impact Check** when generating or reviewing: navigation labels, page titles, headings, empty states, confirmations, fault messages, or demo scripts.
3. **Prioritize clarity + authority** over feature density in demo surfaces.
4. **Excluded from this rule:** README files, internal technical documentation, code comments, architecture docs, decision logs, vendor code.

## Hackathon Rules Compliance

- **Before submission**, cross-check repo hygiene: original work, GitHub-hosted, Deepsurge-registered, within deadline (31 March 2026 23:59 UTC).
- An eligible Entry may win **max 1 prize**. Player vote = 25% of Best Entry score.

## Official Documentation Reference Policy

EVE Frontier official builder docs: https://docs.evefrontier.com/. Sui chain docs: https://docs.sui.io.

- **Code is canonical; docs are explanatory.** `vendor/world-contracts` Move code takes precedence over documentation descriptions. Flag discrepancies.
- **Canonical hierarchy:** `vendor/world-contracts` code > SUI docs (docs.sui.io) > EVE Frontier GitBook (docs.evefrontier.com) > internal docs.

## Documentation Rules

1. All new markdown documents must be placed inside a categorized subfolder under `docs/`.
2. Do NOT create markdown files directly under `docs/` root (only `docs/README.md` lives at root).
3. When creating a new doc, update `docs/README.md` index.

## Quick Command Reference

```bash
# Move contracts
sui move build --path contracts/civilization_control
sui move test --path contracts/civilization_control

# Frontend (when available)
npm run dev          # Vite dev server
npm run typecheck    # TypeScript check
npm run build        # Production build

# Environment
sui client active-env
git submodule update --init --recursive
```

## VS Code 1.110 – Agent Tooling Notes

- **Built-in browser tools** are enabled in `.vscode/settings.json`. Prefer them over external browser MCP tooling.
- **Context compaction** happens automatically when the context window fills. Manual: type `/compact` in chat.

## Fast context to load on start

- Read `.github/copilot-instructions.md` (source of truth)
- Read `AGENTS.md` (this file)
- Skim last ~40 lines of `docs/decision-log.md` for recent initiatives
- Review `docs/README.md` for documentation map
- Read `docs/core/spec.md` (system spec)
- Read `docs/core/day1-checklist.md` (Day-1 validation)

— Keep this file concise. Update when operating rules or architecture materially change.
