# Agents Context — CivilizationControl

Purpose: fast pointer surface for VS Code agents. If anything here conflicts with `.github/copilot-instructions.md`, the canonical file wins.

## Current Repo Truth

- CivilizationControl is a governance command layer for EVE Frontier tribe leaders.
- Frontend: React + TypeScript + Vite, deployed to Cloudflare Pages.
- Contracts: Sui Move package at `contracts/civilization_control/`.
- Direct-chain discovery and write eligibility remain authoritative.
- Additive services now exist: the repo-owned sponsor worker and optional EF-Map shared-backend enrichment after direct-chain discovery.
- Production sponsorship uses `civilizationcontrol-sponsor`, not `flappy-frontier-sponsor`.
- World package handling is split: use `WORLD_RUNTIME_PACKAGE_ID` for runtime entrypoints and `WORLD_ORIGINAL_PACKAGE_ID` for type-origin reads, exact event types, and deterministic type tags.
- Run `npm run world:mvr:check` before world-package, sponsor-policy, or runtime-ID work. Use `npm run world:mvr:strict` before merge or deploy when those surfaces change.

> Glossary note: if a transcript says "SWE," it usually means **Sui**.

## Read First

- `.github/copilot-instructions.md` — canonical repo-wide rules
- `docs/llm-reference-guide.md` — deep current-state briefing
- `docs/README.md` — docs map
- `docs/decision-log.md` — newest-first operational truth
- `docs/operations/sponsor-worker-runbook.md` — live sponsor-worker truth
- `docs/operations/shared-backend-assembly-enrichment-20260429.md` — live EF-Map/shared-backend contract
- `docs/operations/world-runtime-original-split-20260429.md` — runtime/original package-ID model

## Hard Boundaries

- Do not stop just because the tree is dirty. Inspect it, preserve unrelated work in place, and continue unless the next step would discard or overwrite something.
- Never use `git reset --hard`, `git clean`, or similar destructive cleanup commands in this repo.
- Do not edit or stage `vendor/*` dirt unless the task explicitly owns submodule work.
- Treat vendor `Move.lock` churn as submodule dirt, not feature work, unless the task is an explicit refresh.
- Prefer tracked docs for status and rationale: update `docs/decision-log.md`, an existing operations doc, or working memory instead of creating scratch markdown.
- Treat all `VITE_*` values as public browser config. Secrets stay in Wrangler or worker secrets and must never be printed, pasted into chat, or copied into docs/logs.

## Deploy And Validation Notes

- Feature branches validate in Cloudflare Pages preview first and stop there unless production rollout is explicitly requested.
- Production deploy is a separate explicit operator action.
- Run frontend deploys from the repo root.
- This repo still works on `master`, but Cloudflare Pages production deploys use `--branch main`.
- Use explicit public `VITE_*` overrides for preview/production builds when sponsor or shared-backend targets matter. Do not trust stale local `.env` state implicitly.
- Validate the unique preview URL before the alias when possible.
- If browser automation/build proof and manual UI evidence disagree, report the conflict plainly. Do not claim the automation result outranks contradictory manual evidence.

## Working Style

- Prefer the smallest safe diff.
- Use subagents by default for multi-file or research-heavy work.
- Shared reusable prompt files live under `.github/prompts/`; do not rely on `.vscode/prompts/` as repo-canonical prompt storage.
- Run the relevant gates yourself and summarize the results.
- Keep feature branches short-lived and delete them after safe merge unless the operator asks to preserve them.
- Prefer built-in browser tools over external browser MCP for routine web checks.

## Additional References

- `.github/instructions/` — scoped Move, TS/React, design, deployment, and shared-backend guidance
- `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md` — UI wording canon
- `docs/ux/svg-topology-layer-spec.md` — topology/status visual canon
