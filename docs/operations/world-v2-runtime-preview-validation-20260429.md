# World v2 Runtime Preview Validation — 2026-04-29

## Summary

This branch implements a preview-only World v2 runtime migration experiment on `feat/world-v2-runtime-preview`.

- `WORLD_RUNTIME_PACKAGE_ID` now points to World v2 runtime `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`
- `WORLD_ORIGINAL_PACKAGE_ID` remains pinned to original/type-origin package `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`
- the shared Worker `civilizationcontrol-sponsor` was redeployed with an additive allowlist that accepts both world runtime packages plus the CC package
- production frontend was later redeployed from `master` after merge using the same explicit sponsor URL override
- no Move package publish, shared object ID change, `Move.toml` change, `Move.lock` change, or vendor edit was performed

This document now records both the preview experiment and the later production frontend cutover. The shared worker overlap exists only to keep old-runtime sponsorship available while preview and production soak on the World v2 runtime bundle.

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

## Production frontend cutover — 2026-04-29

Production cutover was performed only after merge to `master`, full branch validation, and `git push origin master`.

- deploy command shape used from the repo root:
	`VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev npm run build`
	then
	`npx wrangler pages deploy dist --project-name civilizationcontrol --branch main --commit-hash ebc052d91d93ef545a95f7decf81de49a3740721 --commit-message "world v2 runtime production cutover"`
- production deployment URL: `https://7f8cbcd7.civilizationcontrol.pages.dev`
- source commit hash: `ebc052d91d93ef545a95f7decf81de49a3740721`
- explicit build-time sponsor override: `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`

Served production HTML proof:

- `https://civilizationcontrol.com` serves `/assets/index-MUH2Qmi3.js`
- `https://civilizationcontrol.pages.dev` serves `/assets/index-MUH2Qmi3.js`

Served production bundle proof from both public asset URLs:

- World v2 runtime package `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` is present
- World original/type-origin package `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` is present
- sponsor worker URL `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` is present
- `flappy-frontier-sponsor` is absent

Origin verification notes:

- `https://civilizationcontrol.com` and `https://civilizationcontrol.pages.dev` both served the new production asset successfully
- `https://www.civilizationcontrol.com` did not resolve from this verification environment, so served-bundle proof was not captured there
- worker CORS preflight still returned `204 No Content` for origins `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, and `https://civilizationcontrol.pages.dev`

Operational state after cutover:

- production frontend now targets the World v2 runtime bundle
- `WORLD_ORIGINAL_PACKAGE_ID` remains unchanged
- the sponsor worker still allows both old and new world runtime packages during soak
- production manual wallet smoke is still pending in this transcript

## Rollback

The shared worker still allows both old and new world runtime packages, so rollback can remain frontend-first unless the worker itself regresses.

If production runtime behavior is wrong but the worker remains healthy:

1. redeploy the previous production frontend bundle or rebuild the pre-cutover frontend state and deploy it again to `--branch main`
2. keep the shared worker dual allowlist in place during the rollback so old-runtime sponsorship remains available
3. verify the rolled-back production HTML and asset path before asking for manual wallet smoke
4. remove the World v2 worker allowlist entry only after no live frontend bundle still targets it

If worker behavior itself regresses for existing runtime traffic:

1. redeploy the previous `civilizationcontrol-sponsor` allowlist config immediately
2. if needed, roll the frontend back separately while preserving `WORLD_ORIGINAL_PACKAGE_ID`
3. stop further rollout changes until the worker issue is understood

## Open risks

- production manual wallet smoke is still pending, so the agent has not independently observed the live post-cutover transaction path
- Recent Signals and explicit raw-event parity were not manually re-verified after the production cutover in this transcript
- the local untracked `.env` remains stale for preview builds; future preview or production builds should not rely on it implicitly until it is corrected out of band