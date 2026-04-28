# Sponsor Worker Cutover Validation — 2026-04-28

Date: 2026-04-28
Branch: `chore/sponsor-worker-preview-cutover`
Scope: preview-first runtime cutover execution for the CivilizationControl sponsor worker. Production frontend cutover was not performed.

## Summary

The new Worker `civilizationcontrol-sponsor` was successfully created from `workers/sponsor-service/`, provisioned with `SPONSOR_PRIVATE_KEY` by name, and validated with non-destructive endpoint checks.

A preview-only CivilizationControl frontend deployment was then built with a temporary `VITE_SPONSOR_URL` pointing at the new Worker and deployed to Cloudflare Pages preview.

What is proven by this execution:

- the new Worker exists on the intended Cloudflare account
- the new Worker base URL is live
- `SPONSOR_PRIVATE_KEY` exists on the new Worker by name
- the Worker responds correctly to CivilizationControl CORS preflight and controlled invalid POST traffic
- the preview frontend bundle references `civilizationcontrol-sponsor`, not `flappy-frontier-sponsor`
- production frontend was not changed
- the old Worker remains untouched

What is not yet proven:

- a real sponsored governance transaction on preview
- a conclusive proof that fallback was ruled out in a live governance action

Reason:

- wallet connection failed in the available browser environment before any real transaction could be attempted

## Worker deploy result

Deploy command used:

```bash
cd workers/sponsor-service
npx wrangler deploy
```

Observed result:

- Worker name: `civilizationcontrol-sponsor`
- Worker base URL: `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- initial deploy version id: `d9b442ac-fa8f-4af4-8ae4-20fa361834d4`

Account confirmation at deploy time:

- account name: `Michael.davis.home@gmail.com's Account`
- account id: `b61eb4a65fe01c9539b9f43b5434c10d`

## Secrets present by name only

After deploy, `wrangler secret list` was empty.

The operator then provisioned the required signing secret interactively:

```bash
cd workers/sponsor-service
npx wrangler secret put SPONSOR_PRIVATE_KEY
```

No secret value was printed, captured, committed, or written to files.

Name-only verification after the interactive step:

- `SPONSOR_PRIVATE_KEY`: present
- `SPONSOR_API_KEY`: absent

Observed secret-change version id:

- `975b7bb2-29d5-4d80-9337-a0058a3f0a18`

Interpretation:

- required signer secret is now present by name
- optional API-key auth remains intentionally unset
- frontend preview deploy also left `VITE_SPONSOR_API_KEY` unset

## Endpoint check results

Exact Worker base URL used:

- `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`

Checks performed:

1. `OPTIONS /sponsor` from `https://civilizationcontrol.pages.dev`
2. invalid `POST /sponsor` with `{ "invalid": true }`

Observed results:

- `OPTIONS /sponsor` returned `204`
- `Access-Control-Allow-Origin` returned `https://civilizationcontrol.pages.dev`
- `Access-Control-Allow-Methods` returned `POST, OPTIONS`
- invalid `POST /sponsor` returned `400`
- no `500` or unhandled failure occurred

Interpretation:

- the new Worker is live
- CORS is correctly configured for CivilizationControl's production origin
- the request path is serving the expected sponsor route and validating requests cleanly

## Preview frontend cutover status

Preview-only cutover was performed without changing production frontend configuration.

Method used:

- build the static bundle locally with a temporary process env value:
  - `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- leave `VITE_SPONSOR_API_KEY` unset
- deploy the resulting `dist/` directory to the Pages preview branch only

Command shape used:

```bash
npm run build
npx wrangler pages deploy dist --project-name civilizationcontrol --branch chore/sponsor-worker-preview-cutover --commit-hash <current-sha> --commit-message "preview sponsor worker cutover"
```

Preview deployment results:

- unique preview URL: `https://59a237d5.civilizationcontrol.pages.dev`
- preview alias URL: `https://chore-sponsor-worker-preview.civilizationcontrol.pages.dev`

Bundle validation:

- local built asset referenced `civilizationcontrol-sponsor`
- deployed preview asset referenced `civilizationcontrol-sponsor`
- neither the local built asset nor the deployed preview asset referenced `flappy-frontier-sponsor`

Interpretation:

- preview frontend is pointed at the new Worker
- production frontend remains unchanged
- no production Pages environment variable was modified

## Real sponsored transaction smoke test

Status: not proven

Target smoke design remained:

- preferred action: Gate detail `Set On-Chain` metadata URL update
- fallback action: owned SSU or Trade Post metadata URL update

What was attempted:

- open preview frontend
- open wallet modal
- attempt connection through the available `Slush` wallet option

Observed result:

- preview frontend loaded successfully
- wallet modal opened successfully
- wallet connection failed before any structure discovery or transaction attempt
- no governance transaction was submitted
- no digest was produced

Evidence captured:

- preview URL loaded successfully
- wallet modal appeared
- selecting `Slush` produced `Connection failed` before a wallet session was established

Conclusion:

- live sponsorship is **not yet proven**
- fallback was **not ruled out**, because no real sponsored transaction was executed
- the cutover is valid through the Worker and preview frontend layers, but the final end-to-end sponsorship proof still requires a real browser session with a functioning wallet and a safe owned structure

## Production cutover status

Production cutover status: not performed

Specifically not done in this task:

- no production frontend deploy
- no production Pages env change
- no production `VITE_SPONSOR_URL` change
- no change to the live production/runtime Worker target

## Rollback path

The preview rollback path remains:

1. rebuild preview with `VITE_SPONSOR_URL=https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
2. redeploy the preview branch only

Emergency alternative:

1. rebuild preview with sponsorship unset to force wallet-paid fallback
2. redeploy the preview branch only

The old Worker remains intact:

- old Worker name: `flappy-frontier-sponsor`
- old Worker URL: `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`

## Remaining tasks

1. Run one real preview governance smoke in a browser session with a working wallet and a safe owned gate or SSU.
2. Capture the transaction digest and prove sponsor gas payment rather than fallback.
3. If sponsorship is proven, decide whether to keep optional API-key auth disabled or deliberately enable it.
4. Only after preview proof succeeds, prepare a separate production frontend cutover task.