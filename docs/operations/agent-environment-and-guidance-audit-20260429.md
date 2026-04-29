# Agent Environment And Guidance Audit — 2026-04-29

## 1. Executive summary

Current guardrails are broadly fit for purpose, but the always-loaded guidance layer is no longer fully aligned with the live April 2026 operating model. The repo has strong safety rules, solid deployment discipline, and focused language-specific instruction files, yet it still overstates a browser-only direct-RPC architecture, duplicates too much guidance across entry points, and makes agents work too hard to discover the current design doctrine and live operational truth.

Preflight baseline for this audit:
- Parent repo started on `master`, current with `origin/master`.
- Parent repo had no tracked root-file dirt.
- One preserved submodule-local dirty state existed at `vendor/world-contracts/contracts/world/Move.lock` and was left untouched.
- No settings, extensions, MCP configs, secrets, runtime code, worker code, Cloudflare config, or vendor files were changed during this audit.

Top 5 recommended improvements:
1. Refresh `AGENTS.md` and `.github/copilot-instructions.md` so they describe the live repo truth: direct-chain remains authoritative, but CivilizationControl now also has an in-repo sponsor worker and additive EF-Map shared-backend enrichment.
2. Add explicit repo-local rules for dirty-tree continuation, destructive-git bans, tracked-doc updates, and vendor/submodule dirt preservation.
3. Create one canonical agent-facing design instruction file so UI work no longer depends on stitching together voice, emotional objective, topology, polish, and UX architecture docs by hand.
4. Reduce guidance duplication by shrinking `AGENTS.md`, `GITHUB-COPILOT.md`, and `llms.txt` into pointer surfaces instead of parallel mini-handbooks.
5. Clean up tool noise and local drift conservatively: prefer built-in browser tools, avoid adding shared MCP until needed, and review duplicate global extensions without assuming they are safe to remove globally.

Top 5 things not to change:
1. Keep `.github/copilot-instructions.md` as the single canonical repo-wide instruction file.
2. Keep `.github/instructions/move.instructions.md` and `.github/instructions/typescript-react.instructions.md` as focused scoped instruction files.
3. Keep the repo rule that feature branches deploy only to Cloudflare Pages previews and production deploys remain explicit, root-run actions.
4. Keep the current security posture that secrets stay out of tracked files and are entered interactively for Wrangler/worker flows.
5. Keep the repo preference for built-in VS Code browser tools as the default browser automation surface for routine validation.

Immediate low-risk changes:
- Refresh stale architecture and deployment-truth bullets in `AGENTS.md`, `.github/copilot-instructions.md`, and `GITHUB-COPILOT.md`.
- Add a short dirty-tree/destructive-git rule to the always-on instruction layer.
- Add one short design instruction file under `.github/instructions/`.
- Fix the stale/missing references in `.vscode/settings.json`, `.github/prompts/vibe-bootstrap.prompt.md`, and template docs.
- Add this audit to the docs index and use it as the implementation brief for follow-up branches.

Changes that need manual approval:
- Any workspace-settings changes affecting Autopilot, max request counts, or prompt discovery.
- Any global extension cleanup or disable/remove decisions.
- Any repo-wide archival move of March-era core docs.
- Any Node/npm pinning or Sui/Wrangler/toolchain update work.
- Any new shared MCP configuration in the workspace.

## 2. Current repo guidance inventory

| Path | Purpose | Consumer | Current status | Recommendation |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | Auto-loaded quick agent context and guardrail summary | Copilot local agent | Overlapping/duplicative | Keep, but shrink hard and stop mirroring large chunks of the canonical instruction file. |
| `GITHUB-COPILOT.md` | Lightweight Copilot orientation and gate checklist | Copilot agent, human operator | Overlapping/duplicative | Reduce to a one-screen pointer surface or merge its unique content into `AGENTS.md` or `llms.txt`. |
| `.github/copilot-instructions.md` | Canonical repo-wide working rules | Copilot local agent, cloud agent | Active and useful | Keep as the single authority, but refresh live architecture truth and remove stale sandbox wording. |
| `.github/security-guidelines.md` | Security baseline and OWASP guidance | Agent, human contributor | Too broad/noisy for agents | Keep as deep reference; extract repo-specific secret/runtime rules into the canonical instruction layer. |
| `.github/instructions/move.instructions.md` | Move-specific generation and validation rules | Agent touching `.move` files | Active and useful | Keep focused; add one small carveout clarifying repo-owned lockfiles versus vendor submodule lockfiles. |
| `.github/instructions/typescript-react.instructions.md` | TS/React/Tailwind generation rules | Agent touching `.ts` and `.tsx` | Active and useful | Keep focused; add one cross-link to canonical design guidance once that exists. |
| `README.md` | Public repo entry point and current operational overview | Human operator, reviewer, fresh agent | Active and useful | Keep current-truth oriented and avoid letting deep operational details drift here. |
| `docs/README.md` | Canonical docs index | Agent, human contributor | Active and useful | Keep as the docs map and ensure all active guidance stays indexed here. |
| `docs/llm-reference-guide.md` | Deep bootstrap brief for fresh LLM sessions | Agent, ChatGPT session | Too broad/noisy for agents | Keep, but trim historical duplication and refresh stale environment notes. |
| `docs/decision-log.md` | Non-trivial behavior and operational decisions | Agent, maintainer | Active and useful | Keep newest-first and concise; avoid duplicating detailed proof bundles already preserved elsewhere. |
| `llms.txt` | Lightweight LLM-facing repo map | External LLMs, fresh session bootstrap | Active and useful | Keep short and link-heavy; refresh critical entry points to current-truth ops/design docs. |
| `docs/core/spec.md` | Original system spec and authority anchor | Agent, human contributor | Active but stale | Rewrite to live product truth or demote from the active authority chain. |
| `docs/core/validation.md` | Validation patterns and rules | Agent, human contributor | Active but stale | Replace with a current validation-gates doc or relabel as historical validation patterns. |
| `docs/core/march-11-reimplementation-checklist.md` | Hackathon reimplementation execution checklist | Agent, human contributor | Active but stale | Remove from the live authority chain and keep as historical reference only. |
| `docs/core/day1-checklist.md` | Day-1 hackathon bootstrap guide | Agent, human contributor | Active but stale | Archive later or relabel as historical bootstrap material. |
| `docs/core/CARRY_FORWARD_INDEX.md` | March carry-forward index | Maintainer | Should be archived or left alone | Keep only as historical evidence if still useful; otherwise archive later. |
| `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md` | Canonical UI language and label doctrine | Design and frontend agent | Active and useful | Keep as the wording canon and summarize it in a new design instruction file. |
| `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md` | Emotional target and narrative lens | Design and frontend agent | Should be condensed into a new canonical instruction file | Keep as deep rationale; summarize durable rules in canonical design guidance. |
| `docs/ux/civilizationcontrol-ux-architecture-spec.md` | UX hierarchy and screen model | Design and frontend agent | Active but stale | Refresh to match implemented IA or demote to planning history. |
| `docs/ux/ui-polish-reference-brief.md` | Practical visual polish rules | Design and frontend agent | Should be condensed into a new canonical instruction file | Keep as deep reference; summarize durable panel/CTA/noise rules in canonical design guidance. |
| `docs/ux/svg-topology-layer-spec.md` | Visual topology grammar and semantic color/status rules | Design and frontend agent | Active and useful | Keep as the topology canon and summarize it in a new design instruction file. |
| `assets/icons/README.md` | Local asset export/naming rules | Designer, frontend agent | Too hidden/not referenced enough | Keep, but link it more visibly from topology/design docs. |
| `docs/operations/sponsor-worker-runbook.md` | Live sponsor worker runbook | Operator, infra agent | Active and useful | Keep as the single sponsor-worker source of truth. |
| `docs/operations/shared-backend-assembly-enrichment-20260429.md` | Live EF-Map/shared-backend enrichment contract and fallback boundary | Frontend and infra agent | Active and useful | Keep active until folded into a broader shared-backend runbook. |
| `docs/operations/mvr-world-package-audit-20260429.md` | World/MVR rationale and drift automation record | Infra agent | Active and useful | Keep active as rationale/audit; do not treat it as the only runtime-status source. |
| `docs/operations/world-runtime-original-split-20260429.md` | Canonical runtime-vs-original package model | Frontend and infra agent | Active and useful | Keep and link it directly from future world/runtime instructions. |
| `docs/operations/world-v2-runtime-migration-plan-20260429.md` | Migration history and rollout plan | Infra agent | Active but stale | Keep for historical evidence, but stop treating it as the live runtime-status source. |
| `docs/operations/efmap-indexer-awareness-20260428.md` | Shared-backend awareness and earlier integration status | Infra agent | Active but stale | Update or archive behind the newer enrichment doc because its status framing is no longer current. |
| `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md` | Shared-backend replacement roadmap | Frontend and infra agent | Active but stale | Split already-shipped work from remaining roadmap or archive later. |
| `docs/operations/post-hackathon-repo-readiness-audit.md` | Earlier repo hygiene audit | Maintainer | Should be archived or left alone | Keep as evidence; do not rely on it as current operating guidance. |
| `docs/operations/submodule-refresh-prompt.md` | Reusable submodule refresh procedure | Operator, infra agent | Active but stale | Keep, but update the inventory from `.gitmodules` and tighten vendor-dirt instructions. |
| `templates/cloudflare/README.md` | Generic Pages/Workers template docs | Operator, deploy agent | Active but stale | Keep as template-only guidance; refresh stale `pages secret put --branch` and generic `API_TOKEN` wording. |
| `.vscode/settings.json` | Workspace-level agent/tooling defaults | Agent, human operator | Active and useful | Keep, but fix the missing memory-guidelines reference and review Autopilot/maxRequests defaults. |
| `.vscode/extensions.json` | Workspace recommendations and unwanted extensions | Human operator | Active and useful | Keep; current recommendations are narrow and sensible. |
| `.vscode/prompts/plan.prompt.md` | Local planning prompt | Human operator, agent | Too hidden/not referenced enough | Either move to `.github/prompts/plan.prompt.md` or add an explicit prompt-path strategy later. |
| `.github/prompts/rehydrate.prompt.md` | Context-recovery prompt | Human operator, agent | Active and useful | Keep; small and purpose-specific. |
| `.github/prompts/vibe-bootstrap.prompt.md` | Bootstrap/scaffold prompt | Human operator, agent | Active but stale | Refresh or relocate to a scaffold repo; current references imply missing files. |
| `.github/skills/deploy/SKILL.md` | Deployment workflow skill | Agent | Active but stale | Refresh to repo-root deploy rules, `master`/Pages `main` mapping, and live preview practices. |
| `.github/skills/docker-ops/SKILL.md` | Generic Docker workflow skill | Agent | Active but stale | Either replace placeholders with real repo services or archive/remove later. |

## 3. Agent behavior guardrail assessment

### Dirty tree handling

Strength:
- The repo already has a strong no-vendor-edit posture and good general git hygiene.

Gap:
- The always-on repo guidance does not clearly tell agents to continue safely around unrelated dirt, preserve it in place, and avoid hard-stopping on non-destructive ambiguity.
- The repo guidance also does not explicitly ban `git reset --hard` and `git clean` in its own instruction layer.

Recommendation:
- Add one explicit rule to `AGENTS.md` and `.github/copilot-instructions.md`: do not stop just because the tree is dirty; inspect it, preserve it, never discard unrelated work, and never use destructive cleanup commands in this repo.

### Subagent usage

Strength:
- The current repo guidance explicitly prefers subagents for multi-file and research-heavy work.

Gap:
- The guidance is good here; the main issue is not missing instruction, but the amount of stale surrounding guidance that subagents still have to navigate.

Recommendation:
- Keep the subagent rule. Do not weaken it. Reduce surrounding stale docs so subagents land on current-truth references faster.

### Documentation tracking

Strength:
- The repo already pushes non-trivial changes toward `docs/decision-log.md` and forbids random markdown in `docs/` root.

Gap:
- The instruction layer does not explicitly say to prefer updating tracked docs over creating untracked scratch notes.

Recommendation:
- Add one explicit sentence favoring tracked docs, especially `docs/decision-log.md`, existing operations docs, and `docs/working_memory/`, over ad hoc markdown and one-off status files.

### Git discipline

Strength:
- Branching, merge hygiene, and no-force-push rules are clear.

Gap:
- Branch cleanup is implicit rather than explicit, and vendor dirt handling lives too deep in operations docs instead of the always-on layer.

Recommendation:
- Add explicit guidance to delete stale feature branches after merge and keep submodule refresh work in separate chore branches.

### Deployment discipline

Strength:
- Preview versus production rules are strong, and the repo-root deploy requirement is clearly encoded.

Gap:
- The repo still carries branch-mapping ambiguity: git workflow refers to `master` in practice while Pages production is keyed to `main`.

Recommendation:
- Keep explicit `wrangler pages deploy ... --branch main` wording for production and call out the repo-branch versus Pages-branch split directly in the always-on layer.

### Runtime truth versus repo assumptions

Strength:
- Move/package guidance correctly says vendor world-contracts code beats docs and signatures must be revalidated.

Gap:
- The always-loaded architecture summary still says there is no backend/API and that reads are direct Sui JSON-RPC only. That is no longer accurate enough.

Recommendation:
- Update the top-level architecture summary to say: direct-chain discovery and writes remain authoritative; additive services now include the in-repo sponsor worker and optional EF-Map shared-backend enrichment after direct-chain discovery.

### Security and no-secret behavior

Strength:
- Secret hygiene is broadly strong. Worker secrets are documented as Wrangler-managed secrets, browser `VITE_*` values are described as public, and interactive secret entry is already preferred.

Gap:
- Template wording is looser than the live repo wording, especially around generic `API_TOKEN` examples and `.env.example` framing.

Recommendation:
- Tighten the wording across templates so public build vars, local CLI credentials, and runtime secrets are clearly separated.

### Preview versus production validation

Strength:
- The repo already encodes preview-first validation and explicit proof capture for production deploys.

Gap:
- The canonical instruction layer does not yet surface the newer operational truth that preview alias URLs can lag and unique preview URLs are safer for validation.

Recommendation:
- Add one short note recommending validation against the unique preview URL first, then the alias if needed.

### Vendor and submodule handling

Strength:
- The repo correctly treats `vendor/*` as read-only and blocks tracked edits inside submodules.

Gap:
- The always-on layer should do more to explain how to behave when submodules are already dirty and how to avoid accidental vendor lockfile churn.

Recommendation:
- Add one compact vendor-dirt rule and one explicit statement that repo-owned lockfile guidance does not apply to vendor submodules.

## 4. Design/UX guidance assessment

Where design guidance lives now:
- `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md`
- `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md`
- `docs/ux/civilizationcontrol-ux-architecture-spec.md`
- `docs/ux/svg-topology-layer-spec.md`
- `docs/ux/ui-polish-reference-brief.md`
- `docs/architecture/spatial-embed-requirements.md`
- `assets/icons/README.md`

Assessment:
- The design language is discoverable, but not discoverable enough for routine agent work.
- The current guidance is strong in substance and weak in entry-point ergonomics.
- Agents can recover the correct doctrine, but only after reading too many files.

Is a canonical design file needed?
- Yes.
- The best agent-facing form is `.github/instructions/design.instructions.md`.
- If a fuller human-readable companion is desired, prefer `docs/ux/design-agent-reference.md` or `docs/operations/design-agent-reference.md` over a new markdown file at `docs/` root.

Proposed contents for the new canonical design guidance:
- A precedence block: voice/narrative for wording, emotional objective for feeling, UX architecture for shell/screen structure, topology spec for semantic visual language, and polish brief for restraint/noise rules.
- Core doctrine: calm authority, governance, operator clarity, and hidden backend/chain complexity.
- Semantic color and status rules: gray baseline, teal online/healthy, green only for economic confirmation, amber for warning/defense/restricted, red for offline/fault/denied, orange only as sparse focus.
- CTA rules: factual confirmations, sparse primaries, short labels, no celebratory success language, no oversized hero buttons on operational surfaces.
- Quiet-UI rules: no ornamental panels, no noisy secondary metrics, no duplicate controls, no generic dashboard/admin vocabulary, no speculative extra chrome.
- Good/bad examples for labels, empty states, topology styling, and confirmation copy.

Current files it should summarize rather than duplicate:
- `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md`
- `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md`
- `docs/ux/civilizationcontrol-ux-architecture-spec.md`
- `docs/ux/svg-topology-layer-spec.md`
- `docs/ux/ui-polish-reference-brief.md`
- `docs/architecture/spatial-embed-requirements.md`
- `assets/icons/README.md`

Anti-patterns to encode explicitly:
- Do not over-explain chain/backend mechanics in player-facing UI.
- Do not add noisy panels, duplicate metrics, or generic SaaS dashboard surfaces.
- Do not use green as the default “online” status color.
- Do not decorate topology views into cinematic maps; keep them schematic and operator-legible.
- Do not create new terminology when the existing voice/narrative docs already define the canonical label.

## 5. Local VS Code / Copilot / MCP/tool inventory

Local environment summary:
- VS Code observed: 1.117.0 (subagent-reported).
- Workspace-local MCP config observed: none.
- Local CLI versions captured directly: Node 22.19.0, npm 10.9.3, local Wrangler 4.47.0, Sui CLI 1.68.1-3c0f387ebb40-dirty.
- Built-in browser chat tools are enabled at workspace level.
- Workspace recommendations are intentionally narrow.

| Tool/extension/server | Source | Purpose | Current usefulness | Token/context risk | Recommendation | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Built-in browser chat tools | Built-in | Routine browser automation inside VS Code | Essential for CivilizationControl | Medium | Keep as the default browser surface for routine preview and UI checks. | High |
| GitHub Copilot Chat 0.45.1 | Extension | Core local agent surface | Essential for CivilizationControl | Medium | Keep. | High |
| Repo instruction stack (`AGENTS.md`, `.github/copilot-instructions.md`, scoped instructions) | Built-in discovery | Repo-specific working rules | Essential for CivilizationControl | Medium | Keep, but reduce duplication and refresh live-state truth. | High |
| Search subagent | Built-in | Isolated repo search loops | Useful but not always needed | Medium | Keep enabled; continue using it selectively. | High |
| Copilot Memory | Built-in | Cross-session context carryover | Useful but not always needed | Medium | Keep enabled, but keep memory discipline tight. | High |
| Autopilot plus `chat.agent.maxRequests = 100` | Workspace setting | Long autonomous runs | Useful but not always needed | High | Review later; consider lowering noise for this workspace if token churn becomes a recurring problem. | Medium |
| GitHub PR extension 0.140.0 | Extension | PR and issue workflows | Useful but not always needed | Low | Keep. | High |
| GitHub PR extension 0.138.0 | Extension duplicate | Older duplicate install | Duplicate/possibly redundant | Low | Remove only after cross-profile/global review. | High |
| REST Client 0.25.1 | Extension | Manual HTTP checks and docs experiments | Useful but not always needed | Low | Keep. | High |
| Mysten Move 1.0.42 | Extension | Primary Move language support | Essential for CivilizationControl | Low | Keep. | High |
| Mysten Prettier Move 0.3.5 | Extension | Move formatting support | Useful but not always needed | Low | Keep. | High |
| Mysten Move Trace Debug 0.0.19 | Extension | Deep Move debugging | Useful but not always needed | Low | Keep globally; not required for every session. | Medium |
| Damirka Move Syntax 0.8.0 | Extension | Additional Move syntax support | Duplicate/possibly redundant | Low | Manual review candidate after confirming Mysten Move fully covers your needs. | Medium |
| Playwright package in root `package.json` | Repo dependency | Browser/test automation library | Useful but not always needed | Medium | Keep; no need to add Playwright MCP by default. | Medium |
| Chrome DevTools MCP server | MCP/global unknown | Deeper network/performance/memory browser instrumentation | Unknown, needs manual decision | Medium | Do not add workspace-wide by default; use only if deeper Chrome inspection becomes necessary. | Medium |
| Markdown Mermaid 1.32.0 | Extension | Diagram rendering in markdown | Useful but not always needed | Low | Keep globally. | High |
| Token tracker extensions 0.1.4, 0.2.0, 0.2.1, 0.2.2 | Extension duplicates | Token/count telemetry | High-token/noise risk | Medium | Remove older duplicates only after global review; keep at most one if you actively use it. | High |
| Python, Pylance, Python Envs, Ruff | Extension stack | Python tooling | Safe to keep globally | Low | Keep globally; not a workspace cleanup priority. | High |
| Docker, Containers, Dev Containers | Extension stack | Container workflows | Safe to keep globally | Low | Keep globally unless you want a broader cross-repo cleanup. | Medium |
| Docker-ops skill | Repo skill | Container/SSH operational workflows | Unknown, needs manual decision | Low | Refresh or archive; current content is placeholder-heavy. | High |
| SQLite viewers (`alexcvzz.vscode-sqlite`, `qwtel.sqlite-viewer`) | Extensions | Database browsing | Duplicate/possibly redundant | Low | Manual review candidate after broader global-tool review. | High |
| RemoteHub and Remote Repositories | Extensions | Remote browsing workflows | Duplicate/possibly redundant | Low | Manual review candidate after broader global-tool review. | Medium |
| Grafana VS Code 0.0.19 | Extension | Grafana editing/integration | Useful but not always needed | Low | Leave alone unless you know you do not use it across repos. | Low |
| User-level terminal auto-approve rules | User settings | Reduce approval prompts for selected commands | Useful but not always needed | Medium | Manual review required because it currently auto-approves `git checkout` and `git pull`. | High |
| User-level URL auto-approvals | User settings | Reduce URL approval prompts | Useful but not always needed | Medium | Manual review required; keep narrow and domain-specific. | High |

## 6. Possible redundant or noisy tools

### Chrome DevTools MCP versus Playwright versus built-in browser tooling

Current best fit for this repo:
- Built-in browser tools should remain the default for routine preview smoke tests, screenshots, DOM inspection, and page interaction.
- Playwright does not need to be added as an MCP layer by default because the repo already has the library dependency and VS Code already ships first-party browser tools.
- Chrome DevTools MCP is only justified when you need deeper network-body inspection, performance traces, Lighthouse audits, memory snapshots, or connection to a real Chrome profile/session.

Recommendation:
- Keep the current repo preference for built-in browser tools.
- Do not add a shared browser MCP config unless a repeated workflow proves the built-in tools insufficient.

### Pylance and Python MCP relevance

- Python tooling is not essential for day-to-day CivilizationControl work, but it is safe global tooling.
- There is no evidence that Python tooling is currently polluting this workspace enough to justify a workspace-level disable.

Recommendation:
- Keep globally. Do not spend workspace-cleanup budget here unless it becomes visibly noisy.

### Docker, Dev Containers, and Container Tools relevance

- The main repo does not presently depend on a devcontainer or a checked-in Docker workflow.
- These tools remain broadly useful across other repos and are not causing a clear local problem here.

Recommendation:
- Keep globally. Do not remove based on this repo alone.

### GitHub PR tools

- The GitHub PR extension remains useful for review, issue, and PR workflows.
- The only issue here is duplicate installed versions, not the tool category itself.

Recommendation:
- Keep the extension family, clean older duplicate installs later if desired.

### Mermaid and chat/diagram tooling

- Mermaid support is low-risk and helpful for audit/planning documents.
- It is not a current noise source.

Recommendation:
- Keep.

### Move/Sui tooling

- Mysten Move tooling is essential.
- The likely cleanup candidate is the extra Move syntax extension, not the Mysten stack.

Recommendation:
- Keep Mysten Move, Mysten Prettier Move, and Mysten Trace Debug.
- Review the Damirka extension only after verifying no features are lost.

### Python tooling

- Safe global tooling.
- Not a repo-specific problem.

### Disabled extensions that should remain disabled

- `GitHub.copilot` is already marked as an unwanted recommendation. Keep it that way.
- No evidence was found that Grafana or other installed extensions are intentionally disabled for this workspace.

## 7. Tooling/dependency freshness

| Tool/dependency | Current version if detected | Latest/current source if researched | Recommendation | Risk level |
| --- | --- | --- | --- | --- |
| Node.js | 22.19.0 local | Not researched externally in this pass | No immediate update needed; add repo-level `engines` and/or version pinning in a dedicated tooling branch. | Medium |
| npm | 10.9.3 local | Not researched externally in this pass | No immediate update needed; consider repo-level `packageManager` pinning in a dedicated tooling branch. | Medium |
| Wrangler local CLI | 4.47.0 local | Cloudflare docs current as of 2026-04-23; local command reports update available to 4.86.0 | Treat as a local-only drift issue; prefer project-local `npx wrangler` from the worker package rather than relying on the older local CLI. | Low |
| Sponsor worker Wrangler dependency | `^4.0.0` manifest, 4.85.0 lockfile | Cloudflare docs recommend local project installation | Do not change casually; update only in a dedicated tooling/worker branch with full validation. | Medium |
| Sui CLI | 1.68.1-3c0f387ebb40-dirty local | Not researched externally in this pass | Do not upgrade casually; treat as a compatibility-sensitive tool requiring a dedicated migration branch. | High |
| React | `^19.2.4` manifest | Not researched externally in this pass | No action in this audit. | Low |
| Vite | `^6.3.5` manifest | Not researched externally in this pass | No action in this audit. | Low |
| TypeScript | `^5.8.3` manifest | Not researched externally in this pass | No action in this audit. | Low |
| `@evefrontier/dapp-kit` | `^0.1.7` manifest | Not researched externally in this pass | Do not update outside a dedicated wallet/runtime compatibility branch. | Medium |
| Root `@mysten/sui` | `^2.4.0` manifest | Not researched externally in this pass | Keep for now; handle alongside any wallet/runtime migration. | Medium |
| Sponsor worker `@mysten/sui` | 2.7.0 manifest | Not researched externally in this pass | Keep for now; update only with dedicated worker/runtime validation. | Medium |
| Cloudflare Pages workflow | Manual `wrangler pages deploy dist --project-name civilizationcontrol --branch ...` | Cloudflare docs support explicit branch-based Pages deploys | Keep explicit branch deploys and the repo-root deploy rule; document `master` repo branch versus Pages `main` production mapping more clearly. | Medium |
| Repo runtime pinning | No root `engines`, no root `packageManager`, no `.nvmrc`/`.node-version` | Current lockfiles already imply a modern Node floor | Dedicated follow-up recommended; this is the most actionable tooling-freshness gap in the repo itself. | Medium |

Additional notes:
- `.vscode/tasks.json` only defines Sui tasks; there are no workspace tasks for root `npm run typecheck`, root `npm run build`, or Pages deploys.
- The biggest repo-level tooling issue is not obvious package staleness. It is the lack of explicit runtime pinning against a dependency graph that already expects modern Node.

## 8. Security and secrets guidance

Current guidance quality:
- Strong overall.
- Sponsor worker docs correctly keep signing material in Wrangler secrets, not tracked files.
- Shared-backend docs correctly keep EF-Map/browser integration free of browser-visible private tokens.
- Repo instructions already prefer interactive secret entry and warn against logging/storing secrets.

Risks found:
- `templates/cloudflare/README.md` uses generic `API_TOKEN` secret wording that can be confused with a Cloudflare account token.
- `templates/cloudflare/README.md` still documents `wrangler pages secret put ... --branch ...`, but the current Cloudflare Pages command reference does not show that flag for `pages secret put`.
- `.env.example` opens with “fill in real values” even though the current file is a public browser-config example and explicitly says `VITE_SPONSOR_API_KEY` is browser-visible configuration, not a secret.
- `docs/llm-reference-guide.md` still carries stale `.env.example` framing.
- Archived sponsor-worker docs are mostly safe, but should not be treated as live secret-handling authority.

Recommended wording and rules:
- State one hard rule everywhere: all `VITE_*` values are public build-time configuration, never a safe place for private keys, bearer tokens, or database credentials.
- Split secret guidance into three buckets: public build vars, local CLI credentials, and runtime secrets.
- Prefer wording like: run `wrangler secret put NAME`, paste only into the interactive prompt, and do not echo values back into chat, logs, screenshots, or checked-in docs.
- Rename the generic Pages template example from `API_TOKEN` to something application-scoped such as `SERVICE_API_KEY` and add a note that it is not a Cloudflare account token.
- Tighten `.env.example` intro text so it says “local public overrides only” instead of implying private secrets belong there.

Interactive secret prompts:
- Keep the current operator-pastes-secret-locally model.
- Keep secrets out of terminal transcripts, browser-visible env vars, screenshots, and decision logs.

`.env` and example handling:
- `.env.example` should remain tracked and public.
- `.env` files should remain untracked and never be treated as canonical repo guidance.

Browser-visible public env vars versus secrets:
- `VITE_SPONSOR_URL` and similar frontend env vars are public.
- `VITE_SPONSOR_API_KEY`, if used, should be documented as public abuse-throttle configuration rather than a true secret.
- `SPONSOR_PRIVATE_KEY` and any service-side signing keys belong only in Wrangler secrets.

## 9. Documentation sprawl and archive candidates

| Path/doc family | Reason it may be stale or noisy | Keep/archive/summarize recommendation | Priority |
| --- | --- | --- | --- |
| `docs/core/spec.md` | Still framed around pre-hackathon assumptions and incomplete implementation state | Summarize into `docs/llm-reference-guide.md` after a refresh, then demote as live authority | High |
| `docs/core/march-11-reimplementation-checklist.md` | March 11 execution authority now injects obsolete assumptions into active guidance | Archive later | High |
| `docs/core/day1-checklist.md` | First-hours hackathon bootstrap workflow, no longer current operating guidance | Archive later | High |
| `docs/core/validation.md` | Self-described partial staleness and evolved module/event names | Summarize into a current validation-gates doc | High |
| `docs/core/CARRY_FORWARD_INDEX.md` | Historical carry-forward export artifact | Archive later | High |
| `docs/analysis/must-work-claim-registry.md` | High context cost, mixed-product historical validation framing | Archive later | High |
| `docs/operations/migrate-to-stillness.md` | Executed migration history, not current deployment guidance | Archive later | High |
| `docs/operations/post-hackathon-repo-readiness-audit.md` | Earlier cleanup audit with superseded state | Leave untouched for historical evidence | Medium |
| `docs/operations/efmap-indexer-awareness-20260428.md` | Says no integration exists, which is now false | Summarize into `docs/llm-reference-guide.md` or archive behind newer shared-backend docs | High |
| `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md` | First slice is already shipped; status framing is outdated | Summarize into `docs/llm-reference-guide.md` after a refresh | High |
| `docs/core/civilizationcontrol-implementation-plan.md` | Large March-window hackathon plan, mostly historical process detail now | Archive later | Medium |
| `docs/analysis/assumption-registry-and-demo-fragility-audit.md` | Valuable historical evidence, low current operational value | Leave untouched for historical evidence | Medium |
| `docs/operations/documentation-consolidation-20260428.md` | Good audit trail, not an evergreen runbook | Leave untouched for historical evidence | Medium |
| `docs/operations/mvr-world-package-audit-20260429.md` | Useful current rationale, but partly a dated migration narrative | Keep active | Low |
| `docs/operations/world-v2-runtime-migration-plan-20260429.md` | Migration planning history after implementation | Leave untouched for historical evidence | Medium |
| `docs/operations/submodule-refresh-20260425.md` | Good audit trail, not the canonical submodule procedure | Leave untouched for historical evidence | Medium |
| `docs/operations/sponsor-worker-runbook.md` | Current live operational guidance | Keep active | Low |
| `docs/operations/shared-backend-assembly-enrichment-20260429.md` | Current live contract and fallback boundary | Keep active | Low |
| `docs/operations/world-runtime-original-split-20260429.md` | Current live runtime/original package model | Keep active | Low |

## 10. Recommended instruction-file changes

### `AGENTS.md`

Recommended changes in prose:
- Refresh the architecture overview so it states that direct-chain reads and writes remain authoritative, while additive services now include the in-repo sponsor worker and optional EF-Map shared-backend enrichment.
- Add one explicit dirty-tree/destructive-git rule.
- Add one explicit vendor-dirt rule.
- Add one short current runtime-truth block describing `WORLD_RUNTIME_PACKAGE_ID` versus `WORLD_ORIGINAL_PACKAGE_ID` and when `world:mvr:check` and `world:mvr:strict` must run.
- Add one short branch-mapping note: the repo workflow still references `master`, but Pages production deploys still target `--branch main`.
- Remove duplicated long-form narrative already covered in `.github/copilot-instructions.md`.

### `.github/copilot-instructions.md`

Recommended changes in prose:
- Refresh the architecture section to live truth.
- Add a compact “Current Runtime Truth” section covering runtime/original package split, sponsor policy alignment, and MVR drift checks.
- Add a compact “Direct-Chain vs Shared-Backend Authority” section stating that direct-chain remains authoritative and shared-backend data is additive only.
- Add an explicit dirty-tree continuation rule and explicit bans on `git reset --hard` and `git clean` in repo-local guidance.
- Add one sentence preferring tracked docs and decision logs over untracked scratch notes.
- Add one sentence saying feature-branch deploy builds should use explicit public env overrides when needed, rather than inheriting ambient local `.env` state.
- Add one sentence telling agents to delete stale feature branches after merge unless the operator wants them preserved.

### `.github/instructions/move.instructions.md`

Recommended changes in prose:
- Keep the file mostly unchanged.
- Add one explicit carveout that “Always commit `Move.lock`” applies only to repo-owned packages, not vendor submodules.
- Add one short cross-reference to the world runtime/original split and MVR drift docs so Move/package changes route through the current package-ID model.

### `.github/instructions/typescript-react.instructions.md`

Recommended changes in prose:
- Keep the file mostly unchanged.
- Add one short cross-reference to canonical design guidance for player-facing UI work.
- Add one short rule that EF-Map/shared-backend data is additive only and must not become the source of truth for ownership, authorization, or write decisions.

### Add `design.instructions.md` or `docs/design-language.md`?

Recommendation:
- Yes to `.github/instructions/design.instructions.md`.
- No to `docs/design-language.md` at `docs/` root because the repo already forbids new markdown there.
- Optional companion: `docs/ux/design-agent-reference.md` if you want a fuller human-facing document.

### Add `deployment.instructions.md`?

Recommendation:
- Yes, but keep it small and path-scoped.
- It should cover: repo-root deploy rule, preview-only feature branch deploys, production branch mapping, explicit env overrides for deploy builds, unique preview URL validation, and decision-log proof requirements.

### Add `shared-backend.instructions.md`?

Recommendation:
- Yes.
- It should cover: direct-chain authority, additive shared-backend merge rules, fail-open behavior, no browser secrets, and the rule that shared-backend data must not drive auth or writes.

### Add “do not stop on dirty tree unless destructive ambiguity” guidance?

Recommendation:
- Yes. This is one of the highest-value low-risk instruction updates.

### Add “use explicit env overrides for deploy builds” guidance?

Recommendation:
- Yes. The repo has already recorded a real stale-`.env` preview incident, so this should be canonical guidance.

### Add “do not leave feature branches behind” guidance?

Recommendation:
- Yes, as soft hygiene guidance rather than a hard blocker.

## 11. Recommended local VS Code/tool changes

### Workspace-level recommendations

- Keep `workbench.browser.enableChatTools = true` and continue preferring built-in browser tools for routine checks.
- Do not add a shared `.vscode/mcp.json` until a repeated workflow proves a real need.
- Standardize prompt discovery later by moving `.vscode/prompts/plan.prompt.md` into `.github/prompts/plan.prompt.md` or by deliberately documenting a custom prompt-path strategy.
- Review whether `chat.autopilot.enabled = true` and `chat.agent.maxRequests = 100` are worth the extra noise for this repo.
- Keep the current workspace search/vendor exclusions and AGENTS/instruction discovery settings.

### Global recommendations

- Review duplicate extension installs and remove older versions only after cross-repo/profile review.
- Prefer project-local `npx wrangler` over the older local CLI where possible.
- Review whether the extra Move syntax extension, duplicate SQLite viewers, duplicate token trackers, and overlapping remote/container tools are still useful globally.

### Do-not-change recommendations

- Do not disable or remove GitHub Copilot Chat for this workspace.
- Do not remove Mysten Move tooling.
- Do not remove the GitHub PR extension family.
- Do not remove built-in browser tooling.
- Do not disable the current repo instruction stack.

### Manual review required

- User-level terminal auto-approve rules for `git checkout` and `git pull`.
- User-level URL auto-approval patterns.
- Any hidden/global MCP servers not visible in this audit.
- Any global extension removals.
- Whether Autopilot should remain enabled by default for this workspace.

## 12. Proposed implementation sequence

1. `docs/instructions-refresh` — low-risk instruction docs update. Refresh `AGENTS.md`, `.github/copilot-instructions.md`, and small scoped instruction/doc pointer surfaces.
2. `docs/design-guidance-consolidation` — add canonical design instruction guidance and optional human companion doc.
3. `chore/workspace-tool-review` — workspace prompt-path cleanup, settings/doc reference cleanup, and conservative tool-noise review. No global removals without explicit confirmation.
4. `docs/archive-guidance-pass` — demote or archive stale March-era docs and refresh the active authority chain.
5. `chore/tooling-version-policy` — Node/npm pinning decision, local/global Wrangler hygiene, and any later dedicated dependency/runtime update planning.

Each should remain a separate branch/task.

## 13. Sources and web references

All web sources accessed on 2026-04-29.

| URL | Supports |
| --- | --- |
| `https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions` | Current GitHub repo-wide, path-specific, and agent instruction behavior and support model |
| `https://code.visualstudio.com/docs/copilot/customization/overview` | Current VS Code customization model: instructions, prompts, skills, MCP, parent discovery, and incremental setup |
| `https://code.visualstudio.com/docs/copilot/customization/mcp-servers` | MCP configuration locations, trust model, workspace vs user scope, enable/disable behavior, and Windows sandbox limitation |
| `https://code.visualstudio.com/docs/copilot/agents/agent-tools` | Tool-selection behavior, per-request tool limiting, approval model, Autopilot caution, and 128-tool ceiling |
| `https://code.visualstudio.com/docs/debugtest/integrated-browser` | Built-in browser tools, integrated browser sharing, and agent browser capabilities |
| `https://developers.cloudflare.com/workers/wrangler/commands/` | Current Wrangler command structure and preference for local project usage via `npx`/scripts |
| `https://developers.cloudflare.com/workers/wrangler/commands/pages/` | Current `wrangler pages` deploy, secret, deployment-list, and branch flag behavior |
| `https://developers.cloudflare.com/workers/wrangler/install-and-update/` | Current Cloudflare recommendation to install Wrangler locally in each project |
| `https://llmstxt.org/` | Current `llms.txt` proposal, format, and intended role as a curated LLM-facing index |
| `https://docs.sui.io/` | Current Sui docs root confirming Sui docs remain canonical chain-level reference |
| `https://github.com/microsoft/playwright-mcp` | Current Playwright MCP positioning and overlap with other browser automation choices |
| `https://github.com/ChromeDevTools/chrome-devtools-mcp` | Current Chrome DevTools MCP capabilities and overlap with built-in browser tooling |

## 14. Open questions

1. Do you want to keep `master` as the working branch name while Pages production stays bound to `main`, or do you want to converge those names later?
2. Do you want canonical design guidance as an agent-only instruction file, or also as a human-facing `docs/ux/` companion document?
3. Do you want a dedicated `deployment.instructions.md`, or should deployment guidance stay only in the canonical repo-wide file plus runbooks?
4. Do you want a dedicated `shared-backend.instructions.md`, or should those rules live only in `.github/copilot-instructions.md`?
5. Do you want `.vscode/prompts/plan.prompt.md` standardized into `.github/prompts/`, or should it remain a local-only prompt surface?
6. Do you want to reduce workspace token/noise risk by adjusting Autopilot and/or `chat.agent.maxRequests`, or leave the current defaults alone?
7. Do you want a separate cleanup task for duplicate global extensions, or should that stay outside this repo entirely?
8. Do you want stale March-era core docs archived, or simply demoted from the authority chain and left in place for historical evidence?
9. Do you want a dedicated repo branch for Node/npm pinning before any dependency upgrades?
10. Do you want submodule refreshes formally separated into chore-only branches in the written repo rules?