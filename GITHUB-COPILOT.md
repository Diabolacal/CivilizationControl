# GITHUB-COPILOT.md — Quick Orientation

> Canonical repo-wide rules: `.github/copilot-instructions.md`
> Fast pointer surface: `AGENTS.md`
> Docs map: `docs/README.md`
> Deep current-state briefing: `docs/llm-reference-guide.md`

This file is orientation only. It does not override the canonical instruction file.

## Repo At A Glance

- CivilizationControl is a governance command layer for EVE Frontier tribe leaders.
- Frontend: React + TypeScript + Vite on Cloudflare Pages.
- Contracts: Sui Move package at `contracts/civilization_control/`.
- Direct-chain reads and writes remain authoritative.
- Additive services now include the in-repo sponsor worker and optional EF-Map shared-backend enrichment.
- Production sponsorship uses `civilizationcontrol-sponsor`.
- World package handling is split between `WORLD_RUNTIME_PACKAGE_ID` and `WORLD_ORIGINAL_PACKAGE_ID`.

## Check Before You Change Anything

- Read `.github/copilot-instructions.md` first.
- Shared reusable prompt files live under `.github/prompts/`.
- Skim `docs/decision-log.md` for the newest operational truth.
- Read `docs/operations/sponsor-worker-runbook.md` before sponsorship changes.
- Read `docs/operations/shared-backend-assembly-enrichment-20260429.md` before EF-Map/shared-backend changes.
- Read `docs/operations/world-runtime-original-split-20260429.md` before world package-ID changes.

## Verification Gates

```bash
sui move build --path contracts/civilization_control
sui move test --path contracts/civilization_control
sui client active-env
npm run typecheck
npm run build
```

## Working Rules

- Make the smallest safe change.
- Do not edit or stage `vendor/*` dirt unless the task explicitly owns it.
- Treat `VITE_*` values as public config, not secrets.
- Feature branches validate in preview first. Production deploys require explicit operator approval.
- Append non-trivial behavior or operational changes to `docs/decision-log.md`.
