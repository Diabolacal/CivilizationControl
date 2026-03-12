# GITHUB-COPILOT.md — How We Work in This Repo

> **Authoritative source:** `.github/copilot-instructions.md`
> **Agent quick-load:** `AGENTS.md`
> **Documentation index:** `docs/README.md`

This file is a short orientation for Copilot agents. It does **not** override the files above — if anything here conflicts, `copilot-instructions.md` wins.

## What this repo is

The **CivilizationControl** hackathon submission for the EVE Frontier hackathon (Deepsurge / CCP Games, closes March 31, 2026). A browser-only governance command layer for EVE Frontier tribe leaders, built on Sui Move.

**Modules:** GateControl (gate policy authoring + toll collection), TradePost (SSU-backed storefronts with atomic buy), TurretControl (binary state toggle via Posture Presets).

**Tech stack:** Move (Sui edition 2024.beta), React + TypeScript + Vite, @evefrontier/dapp-kit, Tailwind CSS, Cloudflare Pages.

## Verification commands

```bash
sui move build --path contracts/civilization_control   # Must compile
sui move test --path contracts/civilization_control     # Must pass
sui client active-env                                   # Verify network before any tx
npm run typecheck                                       # TypeScript (when frontend exists)
npm run build                                           # Vite build (when frontend exists)
```

## Do

- Follow the authority hierarchy: `march-11-reimplementation-checklist.md` > `spec.md` > `validation.md` > implementation plan > PTB library.
- Verify function signatures against current `vendor/world-contracts` before generating call sites.
- Use `docs/ptb/` patterns as templates — they require revalidation, not blind trust.
- Append non-trivial decisions to `docs/decision-log.md`.
- Make the smallest safe change. Prefer guard clauses and helpers over refactors.
- Use approval tokens for high-risk changes: `CORE CHANGE OK`, `SCHEMA CHANGE OK`.

## Don't

- Edit anything inside `vendor/`. Read-only always.
- Push without explicit operator approval.
- Commit secrets, keys, mnemonics, or `.env` files.
- Assume PTB skeletons are correct — revalidate against latest world-contracts.
- Rely on events as proof-of-execution for flows that may MoveAbort (events are not emitted on abort).

## Safe edit checklist

- [ ] Plan: summary, files to touch, risk class (Low/Medium/High).
- [ ] Build: `sui move build` passes.
- [ ] Test: `sui move test` passes.
- [ ] Typecheck: `npm run typecheck` passes (when frontend exists).
- [ ] Smoke: `sui client active-env` confirms expected network.
- [ ] Decision log: entry appended if non-trivial.
