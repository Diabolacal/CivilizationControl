# Sponsor Worker Runbook

Purpose: operate the in-repo CivilizationControl sponsor worker with deliberate, coordinated policy/runtime updates rather than ad hoc allowlist edits.

## File layout

- `workers/sponsor-service/package.json`
- `workers/sponsor-service/tsconfig.json`
- `workers/sponsor-service/wrangler.toml`
- `workers/sponsor-service/src/index.ts`
- `workers/sponsor-service/src/validation.ts`
- `workers/sponsor-service/src/__tests__/validation.test.ts`
- `workers/sponsor-service/README.md`
- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`
- `scripts/validate-sponsor-policy.mjs`

## Purpose and current scope

The sponsor worker provides gas sponsorship for current CivilizationControl governance PTBs. It validates MoveCall targets against the committed CivilizationControl allowlist, blocks sponsor `GasCoin` access, applies sponsor gas ownership, signs the rebuilt transaction, and returns `{ txB64, sponsorSignature }`.

CivilizationControl now owns the worker source, deployment config, and committed policy inputs. As of 2026-04-28, the repo-owned Worker `civilizationcontrol-sponsor` is deployed in Cloudflare and both preview and production frontend bundles have been cut over to its base URL. The older `flappy-frontier-sponsor` Worker is still intentionally kept alive as a rollback path during the soak window.

Current committed config is CivilizationControl-only:

- shared worker currently accepts both World v2 runtime and the prior Stillness world runtime during the preview compatibility window on `feat/world-v2-runtime-preview`
- one app policy id: `civilization-control`
- no Flappy Frontier origins or app policy entries in committed config
- explicit allowed origins for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, `https://civilizationcontrol.pages.dev`, and local dev
- preview support remains suffix-based via `.civilizationcontrol.pages.dev`

## Current runtime snapshot

- Worker name: `civilizationcontrol-sponsor`
- Worker URL: `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- Latest activation: deployed from `master` commit `1449dbb19a7113d8d4a19b9fab99ab35247d8e7b` on 2026-05-05 via `workers/sponsor-service` `npm run deploy`
- Latest Cloudflare version id: `0d0b68a4-5a79-4fea-acce-c8802f7cc43f`
- Worker source/config/policy live in `workers/sponsor-service/`, `config/chain/stillness.ts`, `config/sponsorship/civilizationControlPolicy.ts`, and `scripts/validate-sponsor-policy.mjs`
- Production frontend already uses `civilizationcontrol-sponsor`
- Custom-domain CORS is configured for `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com`
- `https://civilizationcontrol.pages.dev` remains allowed, and preview hosts remain allowed via `.civilizationcontrol.pages.dev`
- 2026-05-05 post-deploy `OPTIONS /sponsor` checks returned `204` plus the expected `Access-Control-Allow-Origin`, `POST, OPTIONS`, and `Content-Type, Authorization` headers for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, `https://civilizationcontrol.pages.dev`, and preview origin `https://cc2253d4.civilizationcontrol.pages.dev`
- No Pages production deploy was performed in the 2026-05-05 activation pass; preview evidence used existing Pages preview `https://cc2253d4.civilizationcontrol.pages.dev`
- Agent-browser wallet smoke remained blocked during the 2026-05-05 activation pass because the preview connect dialog exposed only `Slush`, and that provider returned `Connection failed` before any sponsored transaction could be attempted
- Manual production smoke after the custom-domain CORS fix confirmed sponsor-paid transactions by sponsor-wallet observation
- Production digest evidence was not captured in the agent transcript
- `flappy-frontier-sponsor` remains rollback-only during soak and is not yet retired
- preview branch `feat/world-v2-runtime-preview` redeployed the shared worker with both world runtime package IDs allowed so preview can target World v2 without breaking old-runtime sponsorship

## Environment variables and secrets

Commit-safe vars in `wrangler.toml`:

- `SUI_RPC_URL`
- `GAS_BUDGET`
- `ALLOWED_ORIGINS`
- `ALLOWED_ORIGIN_SUFFIXES`
- `APP_POLICIES`
- `SPONSOR_ENABLED`
- optional `BLOCKED_SENDERS`

Cloudflare Worker secrets only:

- `SPONSOR_PRIVATE_KEY`
- `SPONSOR_API_KEY` if bearer auth is retained

Important security notes:

- `SPONSOR_PRIVATE_KEY` must never appear in Git, screenshots, docs examples, or browser env.
- `SPONSOR_API_KEY` is optional. If mirrored to `VITE_SPONSOR_API_KEY` in the frontend, it becomes browser-visible public configuration and should be treated only as a soft abuse throttle, not a durable secret.
- CORS is not authentication. The worker still relies on intent validation, package/module/function allowlists, `GasCoin` blocking, and secret-controlled signing.

## Local commands

Repo-root helpers:

```bash
npm run sponsor:validate-policy
npm run sponsor:test
npm run sponsor:typecheck
```

Worker-package commands:

```bash
cd workers/sponsor-service
npm install
npm test
npm exec tsc -- --noEmit -p tsconfig.json
npm run dev
```

Frontend gates that should still pass after worker changes:

```bash
npm run typecheck
npm run build
```

## Deploy command shape

Do not deploy from this runbook automatically. Deploy and frontend cutover are later tasks, and the current command shape is:

```bash
cd workers/sponsor-service
npm run deploy
```

Before any real deploy:

1. confirm `APP_POLICIES` matches current policy validation output
2. confirm secrets are present in the target Worker environment
3. confirm allowed origins and preview suffixes match every intended frontend URL, including custom production domains and Pages preview hosts
4. validate preview behavior before any production cutover

Current runtime note:

- preview smoke was later manually confirmed by the operator
- production frontend now points at `civilizationcontrol-sponsor`
- a later production diagnostic found that custom-domain traffic from `https://civilizationcontrol.com` was initially blocked by missing CORS allowlist entries even though `https://civilizationcontrol.pages.dev` worked
- production sponsor-paid behavior was later manually reconfirmed by the operator after the worker-only CORS fix
- old Worker retirement remains a later separate task

## Policy update process

Package-ID, runtime-ID, and allowlist changes belong in this repo. Update the committed chain and policy files first, then reflect the same values in worker deploy config.

1. Update current package or object metadata only in `config/chain/stillness.ts`.
2. Update the sponsorship allowlist only in `config/sponsorship/civilizationControlPolicy.ts`.
3. Reflect the same allowlist in `workers/sponsor-service/wrangler.toml`.
4. Run `npm run sponsor:validate-policy`.
5. Run worker tests and worker typecheck.
6. When the change touches owner-cap-gated or hot-potato write families, make the worker tests prove the actual builder-shaped PTBs, not only standalone allowlisted MoveCalls.
7. Run root `npm run typecheck` and `npm run build`.
8. Deploy the worker explicitly before expecting live preview or production sponsorship behavior to change. Frontend Pages previews alone do not activate worker-source changes.
9. Validate one actual sponsored governance action on preview before promoting any worker URL.

## Validation checklist

- `git diff --check`
- `npm run sponsor:validate-policy`
- `npm run sponsor:test`
- `npm run sponsor:typecheck`
- builder-shaped acceptance or rejection coverage for any newly touched owner-cap or hot-potato write family
- `npm run typecheck`
- `npm run build`
- `OPTIONS /sponsor` checks for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, and `https://civilizationcontrol.pages.dev`
- one preview smoke that confirms real sponsorship, not only successful fallback execution

## Historical handoff note

`docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` remains useful as historical evidence of the earlier Flappy-owned worker handoff and the stale-allowlist failure mode, but it is no longer the live operational source of truth for worker ownership.

The dated migration, cutover, validation, and diagnostic records for the 2026-04-27 to 2026-04-28 sponsor-worker transition now live under `docs/archive/sponsor-worker-20260428/README.md`.

## World v2 warning

Do not update the worker to the upstream Stillness world v2 runtime package in isolation.

Current preview-branch status:

1. `src/constants.ts` and `config/chain/stillness.ts` now point `WORLD_RUNTIME_PACKAGE_ID` at World v2 on `feat/world-v2-runtime-preview`
2. `WORLD_ORIGINAL_PACKAGE_ID` remains pinned to the original Stillness lineage
3. the shared worker temporarily accepts both world runtime package IDs to avoid breaking existing runtime traffic while preview is active
4. production frontend was not redeployed as part of this preview experiment

If this overlap is maintained later:

1. keep original or type-origin IDs distinct from runtime IDs in docs and config
2. rerun policy validation and preview sponsorship smoke before rollout
3. prove sponsor-paid preview execution before any production frontend deploy
4. remove the temporary old-runtime worker allowlist entry only after no live preview bundle still targets it