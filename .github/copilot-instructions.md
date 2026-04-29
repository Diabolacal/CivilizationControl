# Copilot Project Instructions (CivilizationControl — EVE Frontier Hackathon)

Purpose: Authoritative source of truth for AI agent guardrails, interaction patterns, and workflow conventions in this VS Code project. GitHub Copilot loads this file automatically. Follow the patterns below when adding or modifying code. Optimized for a "vibe coding" workflow: the human provides intent (non-coder friendly) and the AI agent converts intent into safe, minimal, verifiable changes.

## Beginner Defaulting
If the user doesn't know an answer yet, propose a sensible default and proceed. Do not block progress.

## Operator Quick Start (Non-Coder)
1. Describe goal in plain language (what you want changed / added / fixed).
2. Assistant replies with: checklist, assumptions (≤2), risk class, plan.
3. You approve or adjust scope (optionally grant token if High risk).
4. Assistant patches code, runs typecheck/build, reports gates & follow-ups.
5. Non-trivial decisions appended to `docs/decision-log.md` (≤10 lines each).

If stuck: ask for "safer alternative" or "explain tradeoffs". Avoid giving line-by-line code; just describe desired outcome.

## Instruction Strategy & Scope
- Repo-wide mandates live here. `AGENTS.md` summarizes them; path- or persona-specific instructions belong in `.github/instructions/*.instructions.md`.
- Commands belong near the top of each relevant section. Provide exact flags so agents can run them verbatim.
- Use bullet lists over prose and include concrete "good vs bad" examples when reinforcing style or architecture conventions.

## Model Workflow Expectations
- Start every reply with a brief acknowledgement plus a high-level plan.
- Manage work through a todo list with exactly one item `in-progress`; update statuses as tasks start or finish.
- Report status as deltas — highlight what changed since the last message instead of repeating full plans.
- Run fast verification steps yourself when feasible and note any gates you couldn't execute.

## Operational Guardrails (Authoritative)
These rules have the highest precedence. `AGENTS.md` mirrors them in shortened form; if wording differs, this section wins.

1. **Execute commands yourself.** Run CLI/git/HTTP commands directly unless a secret prompt is needed, then launch the command and let the operator paste the secret locally. Summarize results instead of listing commands for the user to run.
2. **Deploy protocol.** Feature branches must deploy as Cloudflare Pages previews and report the preview URL (never deploy to production from a feature branch). Production deploys are separate explicit operator actions. Git workflow still centers on `master`, but Cloudflare Pages production deploys use `--branch main`. **Deploy commands MUST be run from the project root** to pick up Cloudflare bindings, and deploy builds should use explicit public `VITE_*` overrides when sponsor or shared-backend URLs matter.
3. **Dirty-tree discipline.** Do not stop just because the worktree is dirty. Inspect it, preserve unrelated work in place, and continue unless the next step would discard or overwrite something. Never use `git reset --hard`, `git clean`, or similar destructive cleanup commands in this repo.
4. **Working memory discipline.** Consider a Working Memory file when: (a) a task spans multiple real-world sessions, (b) VS Code shows "summarizing conversation" or ≥70% context, or (c) operator explicitly asks. For most single-session work, proceed directly — Working Memory is optional, not blocking.
5. **Decision logging.** Any non-trivial behavior change, data migration, or platform action must be reflected in `docs/decision-log.md`.
6. **Tracked docs over scratch notes.** Prefer updating `docs/decision-log.md`, an existing operations doc, or `docs/working_memory/` over creating one-off status markdown or untracked scratch notes.
7. **Runtime truth beats stale assumptions.** Verified live bundle behavior, current worker/runtime config, and active operations docs outrank older planning text when they disagree.
8. **No regressions.** All persistence changes must target the project's current platform abstraction — do not reintroduce deprecated providers.

## Git Workflow & Commit Hygiene

> Full conventions: `docs/core/hackathon-repo-conventions.md`. This section is the enforced summary.

- **Branch for all non-trivial work.** Naming: `feat/`, `fix/`, `docs/`, `chore/`, `spike/` + `kebab-case-description`.
- **Direct-to-master only for:** typo fixes, `.gitignore` tweaks, trivial doc corrections.
- **Squash merge all feature branches to `master`.** One clean commit per feature. PR title = commit message.
- **Commit message format:** `type: Imperative description` (≤72 chars). Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
- **`master` must always be demo-ready.** Never merge broken code.
- **Spike branches (`spike/`):** throwaway experiments — never merge to master.
- **PRs even when solo:** judges browse merged PRs. Minimal body: What / Why / Verified.
- **Never force-push to `master`.** Linear, append-only history.
- **Delete feature branches after safe merge** unless the operator explicitly wants to preserve them.

## Code Organization & File Discipline

> Language-specific rules in `.github/instructions/`. This section covers cross-cutting rules.

- **No files >500 lines** without explicit justification. React components ~150 lines, page components ~100 lines, Move modules ~500 lines.
- **No "god files."** Split any file doing 3+ unrelated things.
- **No commented-out code** in the submission repo. Write it or delete it.
- **No duplicate utilities.** Grep the workspace before creating helpers.
- **Place files in the correct directory** per project conventions. No random one-off files at project root.
- **Name files consistently:** PascalCase for components, camelCase for utils/hooks, snake_case for Move, kebab-case for directories and scripts.
- **No generic names:** `utils2.ts`, `helper.ts`, `stuff.ts`, `Component3.tsx` are forbidden.
- **Check for existing files** before creating new ones — agent-generated duplicates are a common failure mode.
- **Respect file size limits proactively** — split at generation time, not after.

## Architecture Overview

- **Frontend:** React + TypeScript + Vite SPA served from Cloudflare Pages
- **Backend / API:** No primary CC backend for writes. Direct-chain Sui RPC remains authoritative for discovery, ownership, eligibility, and writes.
- **Additive services:** The repo-owned sponsor worker and optional EF-Map shared-backend enrichment after direct-chain discovery.
- **Contracts:** `contracts/civilization_control/` — Sui Move extension package (edition 2024.beta)
- **Data flow:** Direct-chain Sui JSON-RPC → read provider abstraction → React hooks (via @tanstack/react-query), with optional additive EF-Map merge after discovery.
- **Wallet:** @evefrontier/dapp-kit (wraps @mysten/dapp-kit-react + VaultProvider)
- **Styling:** Tailwind CSS
- **Hosting:** Cloudflare Pages (static)
- **Key entry points:** `docs/core/spec.md` (system spec), `docs/README.md` (documentation index), `contracts/civilization_control/` (Move package)

## Current Runtime Truth

- Use `WORLD_RUNTIME_PACKAGE_ID` for runtime entrypoints and sponsor allowlists.
- Use `WORLD_ORIGINAL_PACKAGE_ID` for exact event types, `StructType` filters, deterministic type tags, and other type-origin-sensitive surfaces.
- Treat `WORLD_PACKAGE_ID` as a legacy compatibility alias, not the model for new work.
- Production sponsorship uses the repo-owned `civilizationcontrol-sponsor` worker.
- Run `npm run world:mvr:check` before world-package, sponsor-policy, or runtime-ID work.
- Run `npm run world:mvr:strict` before merge or deploy when those surfaces change.

## Direct-Chain And Shared-Backend Authority

- Direct-chain discovery remains authoritative for ownership, structure identity, action eligibility, and writes.
- Shared-backend data is additive enrichment only and must fail open back to direct-chain data on missing or failed responses.
- Shared-backend data must never drive ownership truth, auth decisions, sponsor eligibility, or write-path behavior.
- Browser shared-backend calls go to `https://ef-map.com` or the public `VITE_SHARED_BACKEND_URL` override, not raw VPS or internal hosts.
- Do not add `ASSEMBLY_API_TOKEN`, `Authorization`, or `X-API-Key` headers to the browser v1 assemblies route.
- Positive-path validation for the assemblies route should come from an allowed browser origin; raw Node-side fetches can false-fail with `403`.

## Quick Command Reference

```bash
# Sui Move
sui move build --path contracts/civilization_control     # Build Move package
sui move test --path contracts/civilization_control       # Run Move tests
sui client publish --path contracts/civilization_control  # Publish to active network
sui client active-env                                     # Verify active Sui environment

# Frontend
npm install            # Install dependencies
npm run dev            # Vite dev server
npm run typecheck      # TypeScript check
npm run build          # Production build
npm run preview        # Preview production build
npm run world:mvr:check # Check world package/runtime drift
npm run world:mvr:strict # Strict world package/runtime gate
npm run sponsor:validate-policy # Validate sponsor allowlists
npm run sponsor:test   # Sponsor worker tests
npm run sponsor:typecheck # Sponsor worker typecheck

# Submodule management
git submodule update --init --recursive   # Initialize all vendor submodules

# Verification gates (run after ANY code change)
sui move build --path contracts/civilization_control     # Must compile
sui move test --path contracts/civilization_control       # Must pass
npm run typecheck      # Must pass (when frontend exists)
npm run build          # Must succeed (when frontend exists)
```

## Key Folders / Files

- `contracts/civilization_control/` — Move extension package (GateControl + TradePost)
- `src/` — Frontend React application
- `workers/sponsor-service/` — Live sponsor worker source, tests, and Wrangler config
- `config/chain/stillness.ts` — Current world runtime/original package IDs
- `docs/` — Structured documentation (see `docs/README.md` for index)
- `docs/core/` — Authority documents: spec, implementation plan, demo beat sheet
- `docs/architecture/` — Technical design and feasibility validation
- `docs/strategy/civilization-control/` — Voice, narrative, product vision
- `docs/ux/` — UX architecture, SVG topology specs
- `docs/ptb/` — PTB pattern library (revalidation required)
- `docs/operations/` — Runbooks, checklists, templates
- `docs/demo/` — Demo production assets
- `assets/icons/` — SVG glyphs and overlays for topology UI
- `vendor/` — Upstream submodules (read-only)
- `templates/cloudflare/` — Deployment scaffold

## Assistant Interaction Protocol (Strict Sequence)
1. **Intent Echo:** Restate user goal as bullet checklist (features, constraints, data touched).
2. **Assumptions:** Call out at most 2 inferred assumptions (or ask if blocking).
3. **Risk Class:** Label change Low / Medium / High (see below) + required tokens if any.
4. **Plan:** List files to read/edit, expected diff size, verification steps.
5. **Patch:** Apply minimal diff; avoid unrelated formatting.
6. **Verify:** Typecheck + build + (describe smoke steps). If unable to run, output exact commands.
7. **Summarize:** What changed, gates status, follow-ups.

## Risk Classes & Escalation Triggers
- **Low:** Pure docs, styling (CSS), isolated panel UI, copy tweaks.
- **Medium:** New worker file, new API endpoint, minor algorithm tweak, new utility function.
- **High:** Core Move contract logic, schema / data shape changes, performance-critical loops, global state patterns, storage migration.

Escalate / request token if: touching Move contract entry points, >3 core files, >150 LoC delta, adds dependency, alters persisted data format, or introduces new storage layer.

## Vibe Coding (Non-Coder Operator) Guidance
When the user (non-coder) asks for a change:
1. Restate goal as a concise checklist (what will change, files likely touched).
2. Identify risk level: core contract / schema / state management / simple UI.
3. If risky token required (e.g., `CORE CHANGE OK`, `SCHEMA CHANGE OK`) and not provided: propose safer alternative or request token.
4. Propose minimal patch; avoid refactors unless solving an explicit pain point.
5. After patch: ensure typecheck + build succeed and note any manual smoke steps.
6. Update or create docs only if behavior, metrics, or public API changed — otherwise skip doc churn.
7. Offer a brief rationale when choosing between multiple implementations so the operator can approve.
8. **Automated error recovery (mandatory).** If a typecheck, build, or test command fails after your patch, you MUST NOT present the raw error to the user and ask how to proceed. Instead: (a) read and diagnose the error yourself, (b) explain the cause in one plain-English sentence, (c) immediately propose and apply a fix, and (d) re-run the failing gate. Only escalate to the user if you have attempted a fix and it also fails, or if the fix requires a design decision you cannot make alone.

Language: prefer plain language over jargon when explaining tradeoffs; surface 1–2 alternative approaches only if materially different in complexity or performance.

## Minimal Patch Contract
Each change must include: reason, scope (files), diff size estimate, success criteria, rollback (revert commit). Avoid speculative refactors.

## Task Decomposition & Subagent Execution
Subagents are the **primary mechanism** for complex work. Use them by default for:
- Multi-file changes (≥3 files) or cross-surface edits (frontend + contracts)
- Research-heavy tasks (audits, schema analysis, migration planning)
- Any step that might consume >20% of context budget

**Subagent output requirements:** (1) short summary, (2) concrete deliverables (files, diffs, commands), (3) risks/follow-ups.

**Failure handling:** Retry failing subagent once with tighter prompt/context. On second failure, fall back to manual decomposition and report failure cause.

## Safer Alternative Rule
If user asks for broad refactor, first propose smallest path to accomplish user-visible benefit; proceed only after confirmation or token granting scope.

## Quality Gates (Always)
- Typecheck passes (no new TS errors).
- Build succeeds (`npm run build`).
- Move build: `sui move build --path contracts/civilization_control` compiles.
- Move tests: `sui move test --path contracts/civilization_control` passes.
- Smoke: `sui client active-env` confirms expected network.
- **Error recovery:** If any gate fails, the agent must self-diagnose and attempt a fix before reporting to the user. See Vibe Coding rule 8 for the full protocol. Never present raw compiler output to a non-coder without a plain-English explanation and proposed fix.
- Run the relevant checks yourself whenever tooling is available. If a gate cannot be executed, call it out explicitly with the command you would have run.

## Decision Log Template
```
## YYYY-MM-DD – <Title>
- Goal:
- Files:
- Diff: (added/removed LoC)
- Risk: low/med/high
- Gates: typecheck ✅|❌ build ✅|❌ smoke ✅|❌
- Follow-ups: (optional)
```

## Conventions & Patterns
- State bridging to globals: When a feature needs instrumentation, expose a single global setter rather than sprinkling tracking calls.
- Usage metrics categories (optional — only if this project uses analytics):
  - **Counters:** increment-only events.
  - **First-in-session counters:** fire a `*_first` event to also increment a separate `*_sessions` counter.
  - **Time sums:** send `{ type:'xyz_time', ms }` at end-of-session.
  - **Buckets:** client chooses bucket id, server just counts.
- Large UI text generation: build condensed representation first (segments), then paginate to max length.
- Do NOT store PII; events are aggregate only.

## Code Style Examples

### TypeScript/React Patterns
```typescript
// ✅ GOOD – Typed props, error handling, descriptive names
interface SearchQueryProps {
  query: string;
  category: string;
  maxResults: number;
}

async function runSearch({ query, category, maxResults }: SearchQueryProps): Promise<SearchResult> {
  if (!query || !category) {
    throw new Error('Query and category are required');
  }
  // ... implementation
}

// ❌ BAD – Any types, vague names, no validation
async function search(q: any, c: any, n: any) {
  return await doSearch(q, c, n);
}
```

### State Management
```typescript
// ✅ GOOD – Extract to custom hook
function useProcessingState() {
  const [result, setResult] = useState<Result | null>(null);
  const [processing, setProcessing] = useState(false);

  const process = useCallback(async (params: ProcessParams) => {
    setProcessing(true);
    try {
      const data = await runProcess(params);
      setResult(data);
    } finally {
      setProcessing(false);
    }
  }, []);

  return { result, processing, process };
}

// ❌ BAD – Inline in component body, scattered state
function DataPanel() {
  const [r, setR] = useState(null);
  const [c, setC] = useState(false);
  // ... 200 more lines of logic mixed with JSX
}
```

## CLI Execution Policy

### Core Mandate
The assistant MUST directly run every CLI command that does not require pasting or revealing a secret value. The operator will manually paste any secret when prompted. Do NOT ask the operator to run a command the assistant can execute.

### Operational Rules
1. Default to executing (not just printing) non-secret commands: deployments, listings, key reads/writes, migrations, inspections.
2. **Secret Entry Boundary:** For commands that prompt for a secret, the assistant initiates the command; the operator pastes the secret at the prompt locally.
3. **No UI Deferral:** Avoid telling user to click in a dashboard unless CLI route is missing.
4. **Batch & Verify:** After running 3–5 related CLI actions, summarize outcomes before proceeding.
5. **Idempotence First:** For potentially destructive commands, first run a dry-run/listing variant.
6. **Error Handling:** On command failure, attempt one focused retry if transient. If still failing, surface exact stderr + next options.
7. **Logging Hygiene:** Never log or store secret tokens.

### Prohibited Patterns
- "Please run …" followed by a command the assistant could execute.
- Providing only a list of commands without executing them.
- Asking the operator to copy/paste output that can be fetched programmatically.

## Secret Boundary

- Treat every `VITE_*` value as public browser-visible build configuration. Never place private keys, bearer tokens, or durable secrets in `VITE_*` variables.
- Wrangler and Worker secrets are private runtime-side values. They must never appear in frontend code, chat, docs, screenshots, logs, decision logs, or working-memory files.
- If a CLI supports interactive secret entry, launch it and let the operator paste locally. Never ask for raw secret values in chat and never place them on the command line.
- Never print, echo, summarize, derive, or invent secret values. Report only status such as required, present, missing, rotated, or invalid.

## Context & Memory Protocols

### Working Memory Documents
When working on multi-step tasks, maintain a working memory document:

**Location:** `docs/working_memory/<YYYY-MM-DD>_<task_name>.md`

Use the extended template in `docs/core/memory.md`, which adds Environment State (package IDs, network), Evidence Captured (proof moment tracking), and Commands Run sections.

### When to Create / Update
- **Create:** At task start if expected duration >30 min.
- **Update:** Every 10–15 messages OR when approaching context budget limit.
- **Critical update:** IMMEDIATELY before context compaction.

### Post-Compaction Recovery
1. Read `docs/working_memory/<current_task>.md`.
2. Verify current state (git status, running processes).
3. Resume from "Next action" in working memory.

### Cleanup
Upon task completion, move Working Memory files to `docs/archive/working_memory/` (or delete if trivial).

## Submodule & Vendor Policy

`vendor/*` directories contain **third-party upstream repos** added as git submodules. The following rules have the same precedence as Operational Guardrails:

1. **Never commit inside submodules.** Do not run `git add`, `git commit`, or `git push` from within any `vendor/` directory.
2. **Submodule updates via parent only.** `git submodule update --remote vendor/<name>` from the repo root, then commit the updated gitlink.
3. **No tracked modifications.** Never modify, delete, or create tracked files inside `vendor/*`. Reading for context is always allowed.
4. **Vendor lockfile churn is not feature work.** Treat generated vendor lockfile changes, including `Move.lock` churn, as submodule dirt unless the task explicitly owns the refresh.
5. **Local-only ignores.** Transient/generated files must be excluded via `vendor/<name>/.git/info/exclude`.
6. **No secrets in vendor.** Never commit `.env` files, private keys, mnemonics, or wallet configs inside submodules.

## High-Risk Surfaces

- **Submodule boundaries** — never commit inside `vendor/*`
- **Sui key material** — private keys, mnemonics, wallet configs
- **Move contract entry points** — witness types, extension functions
- **Core frontend state** — global state, context providers
- **API contracts** — persistence, auth, protocol definitions

## Hackathon Narrative & Emotional Signal Priority (UI + Demo Only)

CivilizationControl must communicate **calm authority, sovereignty, and governance** — not generic SaaS vocabulary. This guardrail applies exclusively to UI-facing elements and demo framing materials.

**Canonical references:**
- `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md` — voice, labels, microcopy, Narrative Impact Check
- `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md` — emotional target, Five-Pillar Lens, 3-Second Check

**Agent rules:**
1. **Evaluate UI labels** against the label mapping table (§3 of the canonical doc). Do not default to generic SaaS terms (Dashboard, Admin, Objects, Settings, Notifications).
2. **Run the Narrative Impact Check** (§8 of the canonical doc) when generating or reviewing: navigation labels, page titles, headings, empty states, system messages, demo scripts.
3. **Prioritize clarity + authority** over feature density in demo surfaces.
4. **Emotional signal:** Calm power, governance, authority — in that priority order. No celebration, no hedging, no theatrics.
5. **Excluded from this rule:** README files, marketing copy, vendor code, non-UI technical documentation, and code comments.

## Hackathon Rules Compliance

- **Before creating token/financial mechanics**, verify no security/equity characteristics — entries must not be securities, commodities, or confer ownership/revenue-share rights.
- **Before submission**, cross-check repo hygiene: original work, GitHub-hosted, Deepsurge-registered, within deadline (31 March 2026 23:59 UTC).
- An eligible Entry may win **max 1 prize**. Player vote = 25% of Best Entry score.
- **No vote manipulation** — do not automate vote solicitation, trading, or purchasing.

## Official Documentation Reference Policy

EVE Frontier maintains official builder documentation at https://docs.evefrontier.com/.

- Code in `vendor/world-contracts` is canonical; GitBook is explanatory. If behavior described in docs contradicts Move code, the code wins — flag the discrepancy.
- **Canonical hierarchy:** `vendor/world-contracts` code > SUI docs (docs.sui.io) > EVE Frontier GitBook (docs.evefrontier.com) > internal docs.
- Key pages to consult: "Interfacing with the EVE Frontier World" (sponsored transactions, read/write paths), "World Explainer" (three-layer architecture), "Introduction to Smart Contracts" (capability/witness/hot-potato patterns), "Object Model", "Ownership Model", "@evefrontier/dapp-kit".

## SUI Documentation Policy

Sui chain-level documentation at https://docs.sui.io is canonical for all blockchain-level mechanics.

- Key constraints to verify: 250 KB object size limit, 1000 PTB command limit, 1024 dynamic fields per tx, 32 struct field limit, hot-potato consumption requirements.

## Documentation Rules

1. All new markdown documents must be placed inside a categorized subfolder under `docs/`.
2. Do NOT create markdown files directly under `docs/` root (only `docs/README.md` lives at root).
3. When creating a new doc, update `docs/README.md` index.

## Response Framing
- Start with a purposeful plan; reserve redundant labels only when they aid scanning.
- Keep follow-up updates focused on what changed since the prior message (delta reporting).
- Reference filenames and symbols with backticks for clarity.
- Keep answers concise.

## Common Failure Modes & Preventers
- **Double metric counting** → centralize tracking in a single module.
- **Cache stale after parameter change** → ensure cache invalidation when keys/parameters change.
- **Pagination regressions** → keep segment-first pagination; follow existing patterns.
- **Speculative refactors** → apply safer alternative rule; smallest safe change first.

## Adding Features (Pattern)

- **New engagement mode with timing:**
  1. Manage `[mode, setMode]` + `useRef` pattern in the relevant component.
  2. Expose a global setter for instrumentation bridging.
  3. In tracking util, add internal state & track events at finalize.

## VS Code 1.110 – Agent Tooling Notes

- **Built-in browser tools** (`workbench.browser.enableChatTools`) are enabled in `.vscode/settings.json`. Prefer them over external browser MCP tooling for routine web-app verification.
- **Context compaction** happens automatically when the context window fills. Manual: type `/compact` in chat, optionally with focus instructions.

## When Unsure
- Search existing patterns first (grep for similar feature names).
- Mirror existing instrumented modes for any UI mode needing session vs enter counts + time.
- Keep serverless functions < ~150 lines, no external state besides managed storage, return 4xx on validation errors early.
