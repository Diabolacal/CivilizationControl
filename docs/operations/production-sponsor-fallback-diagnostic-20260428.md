# Production Sponsor Fallback Diagnostic — 2026-04-28

Date: 2026-04-28
Branch: `fix/production-sponsor-fallback-diagnostic`
Scope: diagnose why production sponsorship still appeared player-paid after the frontend cutover to `civilizationcontrol-sponsor`, apply only the smallest evidenced fix, and redeploy only the sponsor worker.

## Summary

The production failure was not caused by package ids, world ids, object ids, or sponsor allowlists.

The frontend was correctly attempting the sponsor path, but the browser request originated from the real production custom domain `https://civilizationcontrol.com`, not from `https://civilizationcontrol.pages.dev`.

The deployed Worker `civilizationcontrol-sponsor` allowed the Pages hostname and preview suffixes, but it did not explicitly allow the custom production domains `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com`.

That caused browser CORS preflight rejection before the sponsor POST could complete. The frontend then followed its intended fallback path and executed a standard player-paid transaction.

The narrow fix was to add both custom production domains to the Worker `ALLOWED_ORIGINS`, keep existing Pages support, keep preview suffix support, validate, redeploy only `civilizationcontrol-sponsor`, and verify live `OPTIONS /sponsor` behavior for all required origins.

## Observed production evidence

Operator browser evidence from `https://civilizationcontrol.com`:

- browser error: `Access to fetch at 'https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor' from origin 'https://civilizationcontrol.com' has been blocked by CORS policy`
- browser error: `No 'Access-Control-Allow-Origin' header is present on the requested resource`
- frontend log: `[sponsor] Step 1 OK: 2415 bytes`
- frontend log: `[sponsor] Step 2: Requesting sponsorship...`
- frontend log: `[sponsor] POST https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor`
- frontend log: `[sponsor] Sponsor path failed: Failed to fetch`
- frontend log: `[sponsor] Falling back to standard (player-paid) execution`

Classification:

- CORS preflight rejection on the real production origin before the sponsor POST could complete

## Root cause

Checked-in Worker config before the fix:

- `ALLOWED_ORIGINS = "https://civilizationcontrol.pages.dev,http://localhost:5173"`
- `ALLOWED_ORIGIN_SUFFIXES = ".civilizationcontrol.pages.dev"`

Impact:

- `https://civilizationcontrol.pages.dev` preflight succeeded
- preview hosts under `.civilizationcontrol.pages.dev` succeeded
- `https://civilizationcontrol.com` failed preflight
- `https://www.civilizationcontrol.com` would have failed for the same reason

Non-causes ruled out during diagnosis:

- frontend sponsor URL routing: correct
- sponsorship allowlist coverage: correct for current sponsored builders
- package ids, world ids, and object ids: unchanged and not implicated
- old Worker `flappy-frontier-sponsor`: untouched and not part of this fix

## Code and config fix

Changed runtime surface only:

- `workers/sponsor-service/wrangler.toml`
- `workers/sponsor-service/src/index.ts`
- `workers/sponsor-service/src/__tests__/index.test.ts`

Final allowed-origins set:

- `https://civilizationcontrol.com`
- `https://www.civilizationcontrol.com`
- `https://civilizationcontrol.pages.dev`
- `http://localhost:5173`

Preview support retained:

- `.civilizationcontrol.pages.dev`

## Validation gates

Executed before deploy:

- `git diff --check`
- `npm run sponsor:validate-policy`
- `npm run sponsor:test`
- `npm run sponsor:typecheck`
- `npm run typecheck`
- `npm run build`

Observed result:

- all requested gates passed
- worker tests passed with new custom-domain preflight coverage
- no sponsor allowlist drift was introduced
- frontend build still succeeded without frontend changes

## Worker deploy result

Deploy command used:

```bash
cd workers/sponsor-service
npm run deploy
```

Observed deploy result:

- Worker: `civilizationcontrol-sponsor`
- Worker URL: `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- deployed version id: `74bdc428-4d0c-4df6-b5dc-077335979db1`

This task did not:

- redeploy frontend
- modify `flappy-frontier-sponsor`
- change sponsor allowlists
- change package ids, world ids, or object ids

## Post-deploy `OPTIONS /sponsor` verification

Post-deploy checks executed against:

- `https://civilizationcontrol.com`
- `https://www.civilizationcontrol.com`
- `https://civilizationcontrol.pages.dev`

Observed results:

- `https://civilizationcontrol.com` → `204`, `Access-Control-Allow-Origin: https://civilizationcontrol.com`, `Access-Control-Allow-Methods: POST, OPTIONS`
- `https://www.civilizationcontrol.com` → `204`, `Access-Control-Allow-Origin: https://www.civilizationcontrol.com`, `Access-Control-Allow-Methods: POST, OPTIONS`
- `https://civilizationcontrol.pages.dev` → `204`, `Access-Control-Allow-Origin: https://civilizationcontrol.pages.dev`, `Access-Control-Allow-Methods: POST, OPTIONS`

Worker runtime corroboration:

- live `wrangler tail` recorded the post-deploy `OPTIONS /sponsor` requests as `Ok`

## Next manual production check

Repeat one safe production action from `https://civilizationcontrol.com` and capture:

1. `/sponsor` status
2. whether fallback logs disappear
3. final digest
4. whether the sponsor wallet shows activity

Preferred action:

- one owned Gate detail `Set On-Chain` metadata update

Fallback action:

- one owned SSU or Trade Post `Set On-Chain` metadata update