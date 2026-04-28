# Sponsor Worker Cutover Plan — 2026-04-28

## 1. Executive summary

CivilizationControl's current live sponsorship runtime is still the older Cloudflare Worker `flappy-frontier-sponsor`.

The target runtime for the next implementation task is a new correctly named Worker, `civilizationcontrol-sponsor`, deployed from the already migrated worker source in this repository.

This is a runtime and naming cutover, not a source migration:

- worker source, config, and allowlist ownership already live in this repo
- frontend sponsorship already switches by environment variable
- the remaining work is Cloudflare Worker creation, secret provisioning, preview frontend cutover, real sponsorship proof, and only later production cutover

No deploy, frontend release, Worker creation, secret change, or Cloudflare runtime mutation was performed in this planning task.

## 2. Current state

Current live runtime:

- current Worker name: `flappy-frontier-sponsor`
- current Worker base URL: `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- current live sponsor endpoint: `https://flappy-frontier-sponsor.michael-davis-home.workers.dev/sponsor`

Current frontend wiring:

- current frontend sponsor URL source: `VITE_SPONSOR_URL`
- current local value observed during runtime discovery: `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- frontend behavior: `src/lib/sponsorship.ts` trims trailing slashes and posts to `POST /sponsor`
- switching the frontend target requires environment change only; no frontend code change is required

Current source-of-truth files:

- runtime status and evidence: `docs/operations/sponsor-worker-runtime-discovery-20260427.md`
- deploy readiness and no-go criteria: `docs/operations/sponsor-worker-deploy-readiness-20260427.md`
- worker operational runbook: `docs/operations/sponsor-worker-runbook.md`
- worker deploy config: `workers/sponsor-service/wrangler.toml`
- worker package notes: `workers/sponsor-service/README.md`
- current client path: `src/lib/sponsorship.ts`
- current policy validation: `config/sponsorship/civilizationControlPolicy.ts`

Current validation commands:

```bash
git diff --check
npm run sponsor:validate-policy
npm run sponsor:test
npm run sponsor:typecheck
npm run typecheck
npm run build
```

Current Cloudflare account, as verified in the 2026-04-27 read-only inspection:

- account name: `Michael.davis.home@gmail.com's Account`
- account id: `b61eb4a65fe01c9539b9f43b5434c10d`

Current known limitation:

- `civilizationcontrol-sponsor` does not exist yet on the active Cloudflare account

## 3. Desired end state

The intended completed state is:

- `civilizationcontrol-sponsor` exists and is deployed from `workers/sponsor-service/`
- required secret names are present on that Worker
- preview frontend points at the new Worker base URL
- a real sponsored governance transaction succeeds on preview and proves sponsorship rather than fallback
- production frontend does not switch until preview smoke passes
- old `flappy-frontier-sponsor` remains available during the rollback window
- old Worker retirement happens only after a soak period

## 4. Cutover strategy

Use a preview-first overlap strategy:

1. keep production frontend on `flappy-frontier-sponsor`
2. create and deploy `civilizationcontrol-sponsor`
3. provision required secrets on the new Worker
4. run non-destructive endpoint checks against the new Worker
5. point preview-only frontend env at the new Worker
6. run one real sponsored transaction smoke on preview
7. cut production frontend only after preview proof succeeds
8. keep the old Worker alive for rollback during the soak window
9. retire the old Worker only after the new runtime is stable

This strategy prevents a naming cleanup from becoming a same-day production risk.

## 5. Exact implementation phases

### Phase 0: preflight validation

Purpose:

- confirm the repo is clean, policy/config has not drifted, and the operator is targeting the intended account before any runtime action

Exact commands:

```bash
git status --short --branch
git status --porcelain=v2
git stash list
git submodule status --recursive
npm run sponsor:validate-policy
npm run sponsor:test
npm run sponsor:typecheck
npm run typecheck
npm run build
cd workers/sponsor-service
npx wrangler --version
npx wrangler whoami
```

Expected output:

- clean implementation branch
- no parent stash entries
- clean submodules
- all validation commands pass
- Wrangler confirms the expected Cloudflare account

Stop conditions:

- dirty worktree or unreviewed staged changes
- policy validation drift
- build or typecheck failure
- Wrangler account mismatch

Rollback notes:

- no runtime state should change in this phase; if any stop condition hits, fix it first or abort without deploying

### Phase 1: deploy/create `civilizationcontrol-sponsor`

Purpose:

- create the correctly named Worker from the in-repo source of truth

Exact commands:

```bash
cd workers/sponsor-service
npx wrangler deploy
```

Equivalent repo-root shape:

```bash
npx wrangler deploy --config workers/sponsor-service/wrangler.toml
```

Expected output:

- Wrangler deploy succeeds
- the deployed Worker name is `civilizationcontrol-sponsor`
- the deploy output returns the exact authoritative base URL for the new Worker

Stop conditions:

- deploy targets the wrong account
- deploy output shows the wrong Worker name
- deploy fails before returning a usable Worker URL
- the operator cannot capture the exact resulting base URL

Rollback notes:

- do not change frontend envs yet
- do not delete or modify `flappy-frontier-sponsor`
- if the new Worker is created but unusable, leave production on the old Worker and continue only after fixing the new runtime

### Phase 2: set and verify secrets

Purpose:

- provision signing secrets on the new Worker without exposing values

Exact commands:

```bash
cd workers/sponsor-service
npx wrangler secret put SPONSOR_PRIVATE_KEY
```

Optional auth secret only if intentionally retained:

```bash
cd workers/sponsor-service
npx wrangler secret put SPONSOR_API_KEY
```

Name-only verification:

```bash
cd workers/sponsor-service
npx wrangler secret list
```

Expected output:

- interactive secret prompt for each `secret put`
- `secret list` shows `SPONSOR_PRIVATE_KEY`
- `secret list` shows `SPONSOR_API_KEY` only if auth is intentionally enabled

Stop conditions:

- operator does not have the secret value out-of-band
- `SPONSOR_PRIVATE_KEY` is not visible by name after setup
- there is uncertainty about whether to keep optional API-key auth enabled

Rollback notes:

- keep frontend pointed at the old Worker until name-only verification passes
- never attempt to read secret values back from Cloudflare
- if optional API-key handling is uncertain, leave `SPONSOR_API_KEY` unset and keep `VITE_SPONSOR_API_KEY` unset

### Phase 3: non-destructive endpoint checks

Purpose:

- confirm the new Worker responds correctly before any frontend cutover

Exact commands where known:

```powershell
$base = '<exact-new-worker-base-url-from-deploy>'
$url = $base.TrimEnd('/') + '/sponsor'
Invoke-WebRequest -UseBasicParsing -Uri $url -Method Options -Headers @{ Origin = 'https://civilizationcontrol.pages.dev'; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'Content-Type' }
```

```powershell
$base = '<exact-new-worker-base-url-from-deploy>'
$url = $base.TrimEnd('/') + '/sponsor'
Invoke-WebRequest -UseBasicParsing -Uri $url -Method Post -ContentType 'application/json' -Body '{"invalid":true}' -Headers @{ Origin = 'https://civilizationcontrol.pages.dev' }
```

Expected output:

- `OPTIONS /sponsor` returns `204`
- `Access-Control-Allow-Origin` includes `https://civilizationcontrol.pages.dev`
- invalid `POST /sponsor` returns a controlled validation failure such as `400`

Stop conditions:

- DNS or route failure
- missing or incorrect CORS headers
- controlled invalid POST does not fail cleanly
- new Worker still behaves as if secrets are missing

Rollback notes:

- do not change preview or production frontend envs until these checks pass
- keep `flappy-frontier-sponsor` as the live runtime while diagnosing the new Worker

### Phase 4: preview frontend env cutover

Purpose:

- point preview only at the new Worker while production stays on the old Worker

Exact commands where known:

```bash
npm run build
npx wrangler pages deploy dist --project-name civilizationcontrol --branch <implementation-branch>
```

Exact environment-variable command is not repo-grounded today:

- the repo documents preview deploys via Wrangler Pages
- the repo does not include a live frontend Wrangler config that proves a CLI path for non-secret Pages build vars such as `VITE_SPONSOR_URL`
- treat preview `VITE_SPONSOR_URL` as a Cloudflare Pages environment setting and update it in the dashboard unless the implementation task first verifies an equivalent Wrangler Pages env workflow

Required preview-only value:

- `VITE_SPONSOR_URL=<exact-new-worker-base-url-from-deploy>`

Expected output:

- preview environment points at the new Worker base URL
- production environment remains unchanged
- preview deployment rebuilds using the new value

Stop conditions:

- preview/prod env scope is ambiguous
- exact new Worker base URL is not yet confirmed
- preview deploy path is unclear or returns a stale alias URL

Rollback notes:

- reset preview `VITE_SPONSOR_URL` to `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- rebuild or redeploy preview
- if needed, blank preview `VITE_SPONSOR_URL` to force wallet-paid fallback while production remains unchanged

### Phase 5: real sponsored transaction smoke test

Purpose:

- prove actual sponsorship on preview rather than silent fallback

Recommended safest action:

- use one owned gate on the Gate detail screen and click `Set On-Chain` in the in-game DApp URL section
- fallback action if no owned gate is available: run the same metadata URL update on one owned SSU or Trade Post surface

Manual test steps:

1. open the preview frontend on a connected wallet that owns the chosen test structure
2. clear browser Console and Network
3. open one Gate detail screen
4. click `Set On-Chain` once from the preview origin
5. approve the wallet signature
6. capture the evidence listed in section 9

Expected output:

- one `POST /sponsor` succeeds with `txB64` and `sponsorSignature`
- no fallback log appears
- final execute path carries two signatures
- on-chain gas ownership proves sponsor payment rather than player-paid fallback

Stop conditions:

- no `/sponsor` call appears
- `/sponsor` fails
- the UI succeeds but fallback messages appear
- the final transaction shows the player paying gas
- no disposable owned structure is available for a safe metadata write

Rollback notes:

- because this smoke writes the current app URL on-chain, restore the tested structure's DApp URL to the intended production URL after the smoke if the preview URL should not remain live
- if the smoke fails, return preview `VITE_SPONSOR_URL` to the old Worker and stop before production cutover

### Phase 6: production frontend cutover, later

Purpose:

- move production sponsorship from the old Worker to the new one only after preview proof succeeds

Exact commands where known:

```bash
npm run build
npx wrangler pages deploy dist --project-name civilizationcontrol --branch main
```

Important caution:

- current GitHub default branch is `master`, but repo history and prior deployment notes record Cloudflare Pages production on `main`
- the implementation task must verify Pages production-branch mapping immediately before this phase

Required production-only env change:

- set production `VITE_SPONSOR_URL` to the exact new Worker base URL

Expected output:

- production frontend rebuilds against the new Worker URL
- production sponsorship path matches the preview-proven path

Stop conditions:

- preview smoke not passed
- production branch mapping unresolved
- production env scope uncertain
- rollback URL not documented and ready

Rollback notes:

- reset production `VITE_SPONSOR_URL` to `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- redeploy production frontend
- keep the old Worker alive until production stabilizes

### Phase 7: old worker retirement, later

Purpose:

- retire the legacy Worker only after the new runtime has soaked safely

Exact commands where known:

- no retirement command is included in this plan because the safe path is to defer retirement until after the soak window and a separate explicit cleanup task

Expected output:

- no preview or production frontend references remain pointed at `flappy-frontier-sponsor`
- rollback is no longer required

Stop conditions:

- any recent cutover regression
- any unresolved question about new Worker stability
- any team desire to preserve the old Worker as emergency rollback longer

Rollback notes:

- do not delete `flappy-frontier-sponsor` until the soak window is complete and rollback is no longer needed

## 6. Cloudflare commands

Validated command shapes from current Wrangler help and repo config:

Validation and identity:

```bash
cd workers/sponsor-service
npx wrangler --version
npx wrangler whoami
```

Worker deploy:

```bash
cd workers/sponsor-service
npx wrangler deploy
```

Optional explicit-name shape if ever needed:

```bash
cd workers/sponsor-service
npx wrangler deploy --name civilizationcontrol-sponsor
```

Required secret put:

```bash
cd workers/sponsor-service
npx wrangler secret put SPONSOR_PRIVATE_KEY
```

Optional secret put:

```bash
cd workers/sponsor-service
npx wrangler secret put SPONSOR_API_KEY
```

Secret list by config-targeted Worker:

```bash
cd workers/sponsor-service
npx wrangler secret list
```

Deployments check:

```bash
cd workers/sponsor-service
npx wrangler deployments list
```

Name-targeted deployments check for the old Worker during rollback planning:

```bash
cd workers/sponsor-service
npx wrangler deployments list --name flappy-frontier-sponsor
```

Versions check after creation:

```bash
cd workers/sponsor-service
npx wrangler versions list
```

Endpoint check shape:

```powershell
$base = '<exact-worker-base-url>'
$url = $base.TrimEnd('/') + '/sponsor'
Invoke-WebRequest -UseBasicParsing -Uri $url -Method Options -Headers @{ Origin = 'https://civilizationcontrol.pages.dev'; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'Content-Type' }
```

Command-grounded behavior notes:

- `wrangler.toml` `name = "civilizationcontrol-sponsor"` controls the default Worker target when `--name` is omitted
- the inspected CLI surface does not show a first-class rename command
- the safer implementation path is to create a new Worker under the desired final name rather than assume an in-place rename flow exists

## 7. Secrets handling

Secret rules for the implementation task:

- never paste secret values into ChatGPT, docs, commit messages, screenshots, or shared terminal logs
- use `wrangler secret put` interactively for `SPONSOR_PRIVATE_KEY`
- use `wrangler secret put SPONSOR_API_KEY` only if optional auth is intentionally retained
- verify secrets by name only with `wrangler secret list`
- do not attempt to read secret values back from Cloudflare
- `VITE_SPONSOR_API_KEY` is browser-visible public configuration if set and must not be treated as a durable secret

Old-worker secret reuse:

- Cloudflare does not provide a supported "read secret value back out" flow for the old Worker
- if the operator already has the current private key value out-of-band and wants the new Worker to sponsor from the same account, they may manually re-enter that same value into `civilizationcontrol-sponsor`
- if that value is not available out-of-band, provision a new intended sponsor signer deliberately rather than trying to recover secrets from Cloudflare output

## 8. Frontend preview cutover

Preview-only cutover rules:

- change preview `VITE_SPONSOR_URL` only
- keep production `VITE_SPONSOR_URL` on `flappy-frontier-sponsor` until preview proof succeeds
- use the exact base URL returned by the new Worker deploy, not a guessed hostname
- do not append `/sponsor` to `VITE_SPONSOR_URL`; the frontend appends it automatically

Mechanics:

- preview frontend deploy is Wrangler-compatible and repo-documented
- non-secret Pages env handling for `VITE_SPONSOR_URL` is not clearly documented in an active checked-in frontend Wrangler config, so dashboard update is the safest documented assumption today
- after updating preview env, rebuild and redeploy the preview frontend
- validate against the unique preview deployment URL rather than a possibly stale alias URL

Rollback path:

- reset preview `VITE_SPONSOR_URL` to `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- rebuild or redeploy preview
- if needed, blank preview `VITE_SPONSOR_URL` to force wallet-paid fallback while the new Worker is investigated

## 9. Real sponsored transaction smoke test

Recommended action:

- preferred smoke: owned gate detail page `Set On-Chain` DApp URL update
- fallback smoke if no owned gate is available: owned SSU or Trade Post DApp URL update

Why this is the safest action:

- it is a real sponsored governance write
- it does not split coins or move inventory
- it is lower risk than permit, listing, treasury, posture, power, bulk, or authorization operations

Prerequisites:

- preview frontend is deployed and points at the new Worker
- wallet owns the target test structure
- test structure is safe to use for a metadata URL write
- browser DevTools Console and Network are open
- access to preview Worker logs or equivalent server-side log output is available

Evidence required to prove sponsorship:

- one successful `POST /sponsor` request in browser Network
- response contains `txB64` and `sponsorSignature`
- Console shows sponsor-path success and does not show fallback logs
- final execute path submits two signatures, not one
- final on-chain digest shows sponsor gas payment rather than player-paid gas
- Worker-side log entry shows approval for the `civilization-control` policy

How to prove fallback did not happen:

- no `Sponsor path failed` or `Falling back to standard` log lines
- player gas owner is not the payer on the final digest
- ideally, the smoke is run with a wallet that has no spendable SUI gas so fallback would be impossible

What to capture in notes:

- preview URL used
- new Worker base URL used
- target structure id
- sponsor request timestamp
- final transaction digest
- screenshot or copy of Network response metadata without secret headers
- confirmation of gas payer or sponsor signatures
- whether the test structure's DApp URL was restored afterward

Pass criteria:

- all required evidence is present and consistent with sponsorship

Fail criteria:

- UI success exists but fallback cannot be ruled out
- sponsor request fails or never occurs
- transaction executes with player-paid gas

If no safe live action is available:

- block the cutover
- do not claim sponsorship is validated without a real executed digest and sponsor proof

## 10. Production cutover criteria

Production cutover should require all of the following:

- preview Worker deployed successfully
- required secrets verified by name
- preview frontend configured to the new Worker
- real sponsored transaction smoke passes
- fallback behavior is intentionally ruled out or intentionally tested
- `npm run sponsor:validate-policy` still passes with no drift
- rollback URL to `flappy-frontier-sponsor` is documented and ready
- Pages production branch mapping is re-verified immediately before production deploy

## 11. Rollback plan

Primary rollback:

- revert preview or production `VITE_SPONSOR_URL` to `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- rebuild or redeploy the affected frontend environment
- keep `flappy-frontier-sponsor` alive until the soak window ends
- do not delete the old Worker during the cutover window

Emergency disable path for the new Worker:

- if the new Worker must remain deployed but stop sponsoring, set `SPONSOR_ENABLED=false` in the new Worker's runtime configuration and redeploy or otherwise apply that runtime config change
- because `SPONSOR_ENABLED` is currently a non-secret Worker variable defined in `wrangler.toml`, this disable path is a deliberate follow-up config action, not a read-only switch available in this planning task
- if disable is used, point frontend envs back to the old Worker or blank the sponsor URL to force wallet-paid fallback

## 12. Risks and open questions

- Worker name and URL ambiguity: use the exact URL returned by the first successful deploy, not a guessed hostname
- secret re-entry requirement: the new Worker cannot inherit secret values automatically; the operator must re-enter them manually
- fallback can hide failure: a transaction can appear to succeed while sponsorship silently fails and the player pays gas
- preview versus production env confusion: Pages env scope must stay preview-only until proof succeeds
- production branch mismatch risk: the repo branch is `master` while prior Cloudflare production notes reference `main`; re-verify before production deploy
- World v2 later changing runtime package allowlist: do not mix this cutover with the separate Stillness runtime-ID migration
- optional API-key model: decide whether to keep `SPONSOR_API_KEY` at all or simplify by leaving browser auth disabled

## 13. Recommended next prompt

Recommended next implementation prompt:

"Execute the sponsor worker runtime cutover on a new implementation branch: create and deploy `civilizationcontrol-sponsor` from `workers/sponsor-service`, set `SPONSOR_PRIVATE_KEY` by interactive `wrangler secret put`, keep production on `flappy-frontier-sponsor`, point preview-only `VITE_SPONSOR_URL` at the exact new Worker URL, run the real sponsored Gate `Set On-Chain` smoke test with evidence that rules out fallback, document results, and stop before production cutover unless preview proof succeeds and I explicitly approve the production phase."