# World v2 Runtime Preview Validation — 2026-04-29

## Summary

This branch implements a preview-only World v2 runtime migration experiment on `feat/world-v2-runtime-preview`.

- `WORLD_RUNTIME_PACKAGE_ID` now points to World v2 runtime `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`
- `WORLD_ORIGINAL_PACKAGE_ID` remains pinned to original/type-origin package `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`
- the shared Worker `civilizationcontrol-sponsor` was redeployed with an additive allowlist that accepts both world runtime packages plus the CC package
- production frontend was not redeployed in this task
- no Move package publish, shared object ID change, `Move.toml` change, `Move.lock` change, or vendor edit was performed

This branch intentionally keeps preview-only runtime changes separate from production cutover. The shared worker overlap exists only to keep old-runtime sponsorship available while the preview bundle targets World v2.

## Code and config scope

Edited implementation surfaces:

- `src/constants.ts`
- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`
- `workers/sponsor-service/wrangler.toml`
- `workers/sponsor-service/src/__tests__/validation.test.ts`
- `scripts/validate-sponsor-policy.mjs`
- `scripts/check-world-mvr-drift.mjs`

Validated no-direct-edit runtime consumers:

- `src/lib/gatePolicyTx.ts`
- `src/lib/postureSwitchTx.ts`
- `src/lib/structurePowerTx.ts`
- `src/hooks/useAuthorizeExtension.ts`
- `src/lib/suiReader.ts`
- `src/lib/eventParser.ts`
- `src/lib/objectResolver.ts`

## Local validation results

Environment:

- `sui client active-env` → `testnet_stillness`

Code and policy gates:

- `npm run world:mvr:check` ✅
- `npm run world:mvr:strict` ✅
- `npm run sponsor:validate-policy` ✅
- `npm run sponsor:test` ✅
- `npm run sponsor:typecheck` ✅
- `npm run typecheck` ✅
- `npm run build` ✅

Observed runtime state after validation:

- standard drift mode shows no warnings and no known drift
- strict drift mode passes with runtime on World v2 and sponsor surfaces accepting `{ World v2 runtime, old Stillness runtime, CC runtime }`
- sponsor policy validation confirms builder references and policy/wrangler parity for both world runtime package IDs

## Deploy evidence

### Shared worker deploy

- command shape used: `cd workers/sponsor-service && npm run deploy`
- Worker URL: `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- deployed Worker version: `82c2ef52-aad8-4f8d-8ee8-a7bcf118acd1`

### Preview frontend deploy

The local untracked `.env` still pointed `VITE_SPONSOR_URL` at `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`, so the preview bundle was built with an explicit override instead of trusting local env state.

- exact build-time override used: `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- unique preview URL: `https://1fa70e47.civilizationcontrol.pages.dev`
- branch alias URL: `https://feat-world-v2-runtime-previe.civilizationcontrol.pages.dev`

### Built asset proof

Validated in `dist/assets/index-MUH2Qmi3.js` after the explicit preview rebuild:

- `VITE_SPONSOR_URL` is embedded as `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- no `flappy-frontier-sponsor` reference remains in the preview bundle
- World v2 runtime package `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` is embedded
- original/type-origin package `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` remains embedded separately

### CORS proof

`OPTIONS /sponsor` returned `204 No Content` with matching `Access-Control-Allow-Origin` for both preview hosts:

- `https://1fa70e47.civilizationcontrol.pages.dev`
- `https://feat-world-v2-runtime-previe.civilizationcontrol.pages.dev`

## Manual preview smoke status

Preview smoke is now operator-confirmed.

- the user manually tested the preview deployment with a real wallet
- the preview app loaded and the wallet-driven action succeeded
- sponsor wallet payment was observed for the transaction
- fallback-to-player-paid was not observed by the user
- no transaction digest was captured in this transcript or current local docs, so none is recorded here
- production frontend had not yet been deployed at the time of the preview smoke

Remaining recommended evidence, still not captured in this transcript:

1. retain a future digest when available
2. confirm worker log correlation for the same request or digest
3. perform one explicit Recent Signals or raw-event parity check on the same preview runtime path

## Rollback

Because production frontend was not redeployed and the shared worker remains backward-compatible with the old world runtime, rollback can stay preview-scoped unless the shared worker itself regresses.

If preview behavior is wrong but production remains healthy:

1. stop using the preview deployment
2. revert this branch's runtime/policy changes
3. rebuild and redeploy preview with the pre-experiment runtime state
4. remove the World v2 worker allowlist entry only after no preview bundle still targets it

If worker behavior itself regresses for existing runtime traffic:

1. redeploy the previous `civilizationcontrol-sponsor` allowlist config immediately
2. keep production frontend untouched
3. abandon the preview branch until the worker issue is understood

## Open risks

- real sponsored preview execution has not yet been captured, so fallback-to-player-paid remains a live risk until manual smoke proves otherwise
- Recent Signals and event/query semantics were not manually verified on preview in this transcript
- the local untracked `.env` remains stale for preview builds; future preview or production builds should not rely on it implicitly until it is corrected out of band