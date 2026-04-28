# Sponsor Worker Production Cutover — 2026-04-28

Date: 2026-04-28
Branch used for deploy: `chore/sponsor-worker-preview-cutover`
Deploy source commit: `fe43a34`

## Summary

CivilizationControl production frontend was cut over from the old Worker base URL `https://flappy-frontier-sponsor.michael-davis-home.workers.dev` to the new Worker base URL `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`.

This cutover changed only the frontend build-time sponsor URL.

Later production diagnostics showed that the frontend cutover itself was correct, but custom-domain traffic from `https://civilizationcontrol.com` still fell back because the Worker CORS allowlist initially covered `https://civilizationcontrol.pages.dev` and preview hosts, not the custom production domain.

It did not:

- change any package ids, world ids, object ids, or allowlists
- modify Move contracts
- modify or retire `flappy-frontier-sponsor`
- set `SPONSOR_API_KEY`

## Old and new Worker URLs

- old Worker URL: `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- new Worker URL: `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`

Old Worker status after cutover:

- still deployed
- still available as rollback target
- not disabled or retired in this task

## Production deploy method

Cloudflare Pages deployment history confirmed that the `civilizationcontrol` project treats branch `main` as the production environment.

Production deploy method used:

1. build the frontend locally with temporary process env:
   - `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
   - `VITE_SPONSOR_API_KEY` unset
2. deploy the built `dist/` directory to Cloudflare Pages production with branch `main`

Command shape used:

```bash
npm run build
npx wrangler pages deploy dist --project-name civilizationcontrol --branch main --commit-hash fe43a34 --commit-message "production sponsor worker cutover"
```

Observed production deployment result:

- deployment id: `51a24ece-75c2-4c72-8979-ff528b3e2812`
- unique production deployment URL: `https://51a24ece.civilizationcontrol.pages.dev`
- production alias URL: `https://civilizationcontrol.pages.dev`

## Deployed bundle verification

After deploy, the production alias was inspected directly.

Observed production asset:

- `https://civilizationcontrol.pages.dev/assets/index-Digtskl3.js`

Observed worker references in the served production bundle:

- `civilizationcontrol-sponsor`: present
- `flappy-frontier-sponsor`: absent

Interpretation:

- production frontend is now built against the new Worker
- production bundle no longer references the old Flappy Worker URL

## Post-cutover diagnostic update

Manual operator testing later used the actual production custom domain `https://civilizationcontrol.com`, not the Pages alias `https://civilizationcontrol.pages.dev`.

Observed browser evidence on the custom domain:

- the frontend reached sponsor Step 2 and attempted `POST https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor`
- the browser blocked the preflight because the Worker response did not include `Access-Control-Allow-Origin` for `https://civilizationcontrol.com`
- console then showed `Sponsor path failed: Failed to fetch`
- the frontend fell back to standard player-paid execution

Classification:

- CORS preflight rejection on the real production origin before the sponsor POST could complete

Root cause:

- the production frontend deploy was correct
- the Worker `ALLOWED_ORIGINS` list initially omitted `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com`
- sponsorship allowlists, package ids, world ids, and object ids were not implicated

Required fix:

- redeploy only `civilizationcontrol-sponsor` with both custom production domains added to `ALLOWED_ORIGINS`
- keep existing Pages alias support and preview suffix support
- do not redeploy frontend as part of this fix

Resolution status:

- this was later resolved with a worker-only redeploy of `civilizationcontrol-sponsor`
- no frontend redeploy was required because the production bundle already pointed at `civilizationcontrol-sponsor`

## Manual preview smoke result

Operator-provided manual smoke evidence was accepted for this cutover:

- operator loaded the preview frontend successfully
- operator connected wallet successfully
- operator performed a real transaction
- operator validated that the sponsor wallet processed the transaction
- sponsorship was manually confirmed from the operator side

Digest status:

- transaction digest was not captured in the agent transcript

Fallback status:

- fallback is treated as ruled out for the preview smoke because the operator verified sponsor-wallet processing directly
- exact digest or gas evidence should still be captured in a later production smoke record if available

## Production smoke result

Agent-performed production smoke status before the CORS fix: partial only

What the agent verified directly before the fix:

- production app loads at `https://civilizationcontrol.pages.dev`
- production bundle references `civilizationcontrol-sponsor`
- production bundle does not reference `flappy-frontier-sponsor`

What the operator later verified after the custom-domain CORS fix:

- operator tested from `https://civilizationcontrol.com`
- production transactions are now sponsor-paid
- sponsor wallet activity was observed for the production transaction path
- no frontend redeploy was required for this fix because the production bundle already pointed at `civilizationcontrol-sponsor`

Digest status:

- transaction digest was not captured in the agent transcript

## Rollback path

If production rollback is needed:

1. rebuild with `VITE_SPONSOR_URL=https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
2. leave `VITE_SPONSOR_API_KEY` unset unless intentionally enabled later
3. redeploy Cloudflare Pages production with branch `main`
4. verify the production bundle again before announcing rollback complete

## Remaining follow-up

1. Keep `flappy-frontier-sponsor` alive during the soak window.
2. Capture a production digest or gas-payer proof in a later follow-up if transcript-grade evidence is needed; manual sponsor-wallet confirmation is already recorded.
3. Consider old Worker retirement only in a later dedicated cleanup task.
4. Handle Stillness World v2 runtime-ID review only in a later dedicated audit task.