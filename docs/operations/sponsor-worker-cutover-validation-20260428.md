# Sponsor Worker Cutover Validation — 2026-04-28

Date: 2026-04-28
Branch: `chore/sponsor-worker-preview-cutover`
Scope: preview-first runtime cutover execution for the CivilizationControl sponsor worker. Production frontend cutover was not performed.

## Summary

The new Worker `civilizationcontrol-sponsor` was successfully created from `workers/sponsor-service/`, provisioned with `SPONSOR_PRIVATE_KEY` by name, and validated with non-destructive endpoint checks.

A preview-only CivilizationControl frontend deployment was then built with a temporary `VITE_SPONSOR_URL` pointing at the new Worker and deployed to Cloudflare Pages preview.

The operator later performed a manual preview smoke in a normal browser session and confirmed that the sponsor wallet processed a real transaction.

Production frontend was later cut over to the same new Worker URL after the preview proof and production bundle verification steps completed.

## Diagnostic addendum — custom production domain CORS gap

Later on 2026-04-28, production fallback was traced to the real custom production domain rather than the Pages alias.

Observed browser evidence from `https://civilizationcontrol.com`:

- browser preflight rejected `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor`
- the response exposed no `Access-Control-Allow-Origin` header for that origin
- frontend console showed the sponsor path starting and then failing with `Failed to fetch`
- the frontend then fell back to standard player-paid execution

Root cause:

- initial endpoint checks in this document only covered `https://civilizationcontrol.pages.dev`
- the deployed Worker `ALLOWED_ORIGINS` did not include `https://civilizationcontrol.com` or `https://www.civilizationcontrol.com`
- this was a CORS origin-gating issue, not a package-id, object-id, or sponsorship allowlist issue

Fix path:

- add both custom production domains to the Worker `ALLOWED_ORIGINS`
- keep existing `https://civilizationcontrol.pages.dev` support
- keep existing preview suffix support via `.civilizationcontrol.pages.dev`
- redeploy only `civilizationcontrol-sponsor`

Deployed fix result:

- worker redeployed from `workers/sponsor-service/`
- deployed Worker version id: `74bdc428-4d0c-4df6-b5dc-077335979db1`
- deployed `ALLOWED_ORIGINS` now includes `https://civilizationcontrol.com`, `https://www.civilizationcontrol.com`, and `https://civilizationcontrol.pages.dev`
- `ALLOWED_ORIGIN_SUFFIXES` remains `.civilizationcontrol.pages.dev`

Post-fix `OPTIONS /sponsor` verification results:

- `https://civilizationcontrol.com` → `204` with `Access-Control-Allow-Origin: https://civilizationcontrol.com`
- `https://www.civilizationcontrol.com` → `204` with `Access-Control-Allow-Origin: https://www.civilizationcontrol.com`
- `https://civilizationcontrol.pages.dev` → `204` with `Access-Control-Allow-Origin: https://civilizationcontrol.pages.dev`

Worker-tail corroboration:

- live `wrangler tail` recorded the post-deploy `OPTIONS /sponsor` requests as `Ok`

Later production smoke update after the fix:

- operator manually tested from `https://civilizationcontrol.com`
- production transactions were confirmed sponsor-paid by operator observation of sponsor-wallet activity
- no frontend redeploy was required for this fix because the production bundle already pointed at `civilizationcontrol-sponsor`
- transaction digest was not captured in the agent transcript

## Manual smoke update — operator-performed

After the initial agent-run preview validation was recorded, the operator performed a manual preview smoke outside the agent browser environment.

Operator-provided result:

- operator loaded the preview frontend
- operator connected wallet successfully
- operator performed a real transaction
- operator validated that the sponsor wallet processed the transaction
- sponsorship was manually confirmed from the operator side

Digest status:

- digest was not captured in the agent transcript

Fallback status:

- fallback is treated as ruled out for that preview smoke because the operator verified sponsor-wallet processing directly
- exact digest or gas-payer evidence should still be captured in a later production smoke record if available

Important chronology:

- initial agent browser smoke failed at wallet connection time
- later operator manual preview smoke passed

What is proven by this execution:

- the new Worker exists on the intended Cloudflare account
- the new Worker base URL is live
- `SPONSOR_PRIVATE_KEY` exists on the new Worker by name
- the Worker responds correctly to CivilizationControl CORS preflight and controlled invalid POST traffic
- the preview frontend bundle references `civilizationcontrol-sponsor`, not `flappy-frontier-sponsor`
- preview sponsorship was manually confirmed by the operator
- production frontend was later cut over to `civilizationcontrol-sponsor`
- the old Worker remains untouched

What is not yet proven:

- a real production sponsored governance transaction with digest evidence captured in the agent transcript

Reason:

- the available agent browser environment still did not complete a wallet-backed smoke itself

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
- CORS was correctly configured for the Pages production alias that was tested at the time
- the request path is serving the expected sponsor route and validating requests cleanly

What this endpoint check missed:

- it did not test the real custom production domain `https://civilizationcontrol.com`
- later production diagnostics showed that the custom domain required additional explicit `ALLOWED_ORIGINS` entries

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

Status: manually proven on preview by operator; agent browser attempt remained limited

Target smoke design remained:

- preferred action: Gate detail `Set On-Chain` metadata URL update
- fallback action: owned SSU or Trade Post metadata URL update

What was attempted:

- open preview frontend
- open wallet modal
- attempt connection through the available `Slush` wallet option

What later happened outside the agent browser:

- operator connected wallet successfully in a normal browser session
- operator performed a real transaction
- operator confirmed that the sponsor wallet processed the transaction

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
- operator later reported successful preview wallet connection and sponsor-wallet processing of a real transaction

Conclusion:

- preview live sponsorship is **manually confirmed**
- fallback is **treated as ruled out for the preview smoke** based on the operator's sponsor-wallet verification
- exact digest or gas evidence was not captured in the agent transcript
- production live sponsorship still benefits from a later manual smoke with recorded digest evidence

## Production cutover status

Production cutover status: performed

What was done later in this task:

- production frontend was built with `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- `VITE_SPONSOR_API_KEY` remained unset
- Cloudflare Pages production deploy was executed with branch `main`
- production alias `https://civilizationcontrol.pages.dev` now serves a bundle that references `civilizationcontrol-sponsor`
- production alias bundle no longer references `flappy-frontier-sponsor`

What still was not done:

- no production live governance transaction was completed in the agent browser environment

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

1. Capture production digest or gas-payer evidence in a later follow-up if transcript-grade proof is needed; manual sponsor-wallet confirmation is already recorded.
2. Keep `flappy-frontier-sponsor` alive during the soak period.
3. Decide later whether to keep optional API-key auth disabled or deliberately enable it.
4. Consider old Worker retirement only in a separate later cleanup task.
5. Keep Stillness World v2 runtime-ID work separate from this completed sponsor-worker fix path.