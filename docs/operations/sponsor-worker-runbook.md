# Sponsor Worker Runbook

Purpose: operate the in-repo CivilizationControl sponsor worker without changing runtime package IDs or deploying from documentation alone.

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

- Stillness v1 runtime package targets only
- one app policy id: `civilization-control`
- no Flappy Frontier origins or app policy entries in committed config
- explicit allowed origins for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, `https://civilizationcontrol.pages.dev`, and local dev
- preview support remains suffix-based via `.civilizationcontrol.pages.dev`

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
- old Worker retirement remains a later separate task

## Policy update process

Package-ID, runtime-ID, and allowlist changes belong in this repo. Update the committed chain and policy files first, then reflect the same values in worker deploy config.

1. Update current package or object metadata only in `config/chain/stillness.ts`.
2. Update the sponsorship allowlist only in `config/sponsorship/civilizationControlPolicy.ts`.
3. Reflect the same allowlist in `workers/sponsor-service/wrangler.toml`.
4. Run `npm run sponsor:validate-policy`.
5. Run worker tests and worker typecheck.
6. Run root `npm run typecheck` and `npm run build`.
7. Validate one actual sponsored governance action on preview before promoting any worker URL.

## Validation checklist

- `git diff --check`
- `npm run sponsor:validate-policy`
- `npm run sponsor:test`
- `npm run sponsor:typecheck`
- `npm run typecheck`
- `npm run build`
- `OPTIONS /sponsor` checks for `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, and `https://civilizationcontrol.pages.dev`
- one preview smoke that confirms real sponsorship, not only successful fallback execution

## Historical handoff note

`docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` remains useful as historical evidence of the earlier Flappy-owned worker handoff and the stale-allowlist failure mode, but it is no longer the live operational source of truth for worker ownership.

## World v2 warning

Do not update the worker to the upstream Stillness world v2 runtime package in isolation.

When the separate world v2 runtime-ID task happens later:

1. update frontend runtime package targets deliberately
2. update worker world runtime allowlists in the same change window
3. keep original or type-origin IDs distinct from runtime IDs in docs and config
4. rerun policy validation and preview sponsorship smoke before rollout