# Sponsor Worker Deploy Readiness — 2026-04-27

Date: 2026-04-27
Branch inspected: `master`
Scope: repo hygiene plus Cloudflare sponsor worker deploy and frontend cutover readiness inspection. No deploys were performed from this report.

## Summary

CivilizationControl now owns the sponsor worker source, deploy config, and committed Stillness policy inputs in-repo. The worker package is structurally ready for deployment from this repo, but a safe deploy and frontend cutover are **not** ready tonight.

Why this is a no-go right now:

- the active Cloudflare account is authenticated, but the configured Worker `civilizationcontrol-sponsor` does not exist yet
- Wrangler could not list deployments, versions, or secret names because the Worker has not been created
- required secret names therefore could not be confirmed in Cloudflare
- local `.env` still classifies `VITE_SPONSOR_URL` as pointing at the older Flappy-hosted worker, not the intended CivilizationControl worker
- the exact new worker base URL should come from the first successful Wrangler deploy result, not from guessing a `workers.dev` hostname by hand

Local validation on `master` passed:

- `npm run sponsor:validate-policy`
- `npm run sponsor:test`
- `npm run sponsor:typecheck`
- `npm run typecheck`
- `npm run build`

Known acceptable warning:

- existing Vite large-chunk warning during `npm run build`

## Repo Hygiene Result

### Stash resolution

The remaining parent stash was backed up outside the repo before any decision:

- backup directory: `C:/dev/CivilizationControl-stash-backups-final-20260427/`

Backed-up files:

- `stash-list.txt`
- `stash-0-show-stat.txt`
- `stash-0-show-patch.txt`
- `stash-0-git-show-stat.txt`
- `stash-0-git-show-patch.txt`

Classification:

- redundant/obsolete after the archive cleanup work already merged into `master`

Why it was safe to drop:

- it contained exactly one change: deletion of `docs/archive/hackathon-2026/recordings/README.md`
- current `master` intentionally preserves that file as part of the archive structure
- the archive cleanup docs and decision log reference that file as a tracked historical artifact
- the stash was fully exported before drop, so recovery remains possible outside Git stash

Result:

- `git stash drop 'stash@{0}'` was run successfully
- parent stash inventory is now empty

## Current Worker Source of Truth

### Worker package and config

- worker runtime package: `workers/sponsor-service/`
- worker runtime code: `workers/sponsor-service/src/index.ts`
- validation layer: `workers/sponsor-service/src/validation.ts`
- deployment config: `workers/sponsor-service/wrangler.toml`
- package scripts: `workers/sponsor-service/package.json`

### Chain and policy source of truth

- chain/package metadata: `config/chain/stillness.ts`
- committed allowlist policy: `config/sponsorship/civilizationControlPolicy.ts`
- drift validator: `scripts/validate-sponsor-policy.mjs`
- operator guide: `docs/operations/sponsor-worker-runbook.md`

### Current Worker name and command

- worker name: `civilizationcontrol-sponsor`
- deploy command shape:

```bash
cd workers/sponsor-service
npm run deploy
```

That resolves to `wrangler deploy` using the checked-in `wrangler.toml`.

## Worker Secrets and Vars

### Required secret names

- `SPONSOR_PRIVATE_KEY` required

### Optional secret names

- `SPONSOR_API_KEY`

### Non-secret vars currently in `wrangler.toml`

- `SUI_RPC_URL=https://fullnode.testnet.sui.io:443`
- `GAS_BUDGET=50000000`
- `ALLOWED_ORIGINS=https://civilizationcontrol.pages.dev,http://localhost:5173`
- `ALLOWED_ORIGIN_SUFFIXES=.civilizationcontrol.pages.dev`
- `APP_POLICIES=<civilization-control policy JSON>`
- `SPONSOR_ENABLED=true`
- optional `BLOCKED_SENDERS`

### Allowed origins and suffixes

- exact origins:
  - `https://civilizationcontrol.pages.dev`
  - `http://localhost:5173`
- allowed hostname suffix:
  - `.civilizationcontrol.pages.dev`

### Secret inventory result

Wrangler could not confirm secret names on Cloudflare because the Worker does not exist yet on the active account. There is therefore no safe proof yet that `SPONSOR_PRIVATE_KEY` is present in the intended target environment.

## Cloudflare / Wrangler Inspection

### Wrangler status

- `npx wrangler --version` succeeded: `wrangler 4.85.0`
- `npx wrangler whoami` succeeded
- auth source: `CLOUDFLARE_API_TOKEN` environment variable
- active account name: `Michael.davis.home@gmail.com's Account`
- active account id: `b61eb4a65fe01c9539b9f43b5434c10d`

### Worker existence checks

- `npx wrangler deployments list` returned Cloudflare error `10007`: Worker does not exist on this account
- `npx wrangler secret list` returned: Worker `civilizationcontrol-sponsor` not found
- `npx wrangler versions list` returned Cloudflare error `10007`: Worker does not exist on this account

### Interpretation

- Wrangler is authenticated and usable
- the configured Worker name is clear
- the Worker has not yet been created on the active account
- secret presence cannot be verified until the Worker exists or secrets are provisioned to the intended target

## Frontend Sponsor URL / Cutover State

### Frontend env variables consumed by code

The frontend reads:

- `VITE_SPONSOR_URL`
- `VITE_SPONSOR_API_KEY`

Code path:

- `src/lib/sponsorship.ts`

Behavior:

- `VITE_SPONSOR_URL` enables sponsorship and becomes the base URL for `POST /sponsor`
- `VITE_SPONSOR_API_KEY` is optional and browser-visible if set

### Current repo defaults

`.env.example` leaves sponsorship unset by default:

- `VITE_SPONSOR_URL=` blank
- `VITE_SPONSOR_API_KEY=` blank

### Current local env classification

Local `.env` was inspected without printing values.

Result:

- `VITE_SPONSOR_URL`: classified as an old Flappy-hosted worker URL
- `VITE_SPONSOR_API_KEY`: unset

### Expected sponsor URL for the in-repo worker

The intended frontend base URL should be the deployed base URL for Worker `civilizationcontrol-sponsor` on the active Cloudflare account.

Because the Worker does not exist yet, this report does **not** treat any guessed `workers.dev` hostname as authoritative. The exact base URL should be captured from the first successful Wrangler deploy output or from the Cloudflare dashboard after creation.

### Cutover ownership

Changing the deployed frontend sponsor URL is a Cloudflare Pages environment/build configuration task, not a repo code task.

Reason:

- `src/lib/sponsorship.ts` already consumes `VITE_SPONSOR_URL`
- no code change is needed to point the deployed frontend at a different worker
- the deployed frontend must be rebuilt/redeployed with the new env value

### Preview cutover feasibility

Preview cutover is possible without a production frontend deploy, but it still requires Cloudflare Pages environment configuration plus a preview deploy/rebuild of the static frontend.

## Deploy Readiness Decision

### Go / no-go

- recommendation: **NO-GO for deploy tonight**

### Why this is currently no-go

1. required secret names cannot be verified because the Worker does not exist yet
2. the exact new worker base URL is not yet confirmed
3. local frontend config still points at the old Flappy-hosted worker
4. there is no proof yet that the intended target account already has the required worker-side secrets prepared

### What is already ready

1. repo source ownership is complete in `master`
2. policy/config drift checks pass
3. worker tests and typecheck pass
4. root app typecheck and build pass
5. Wrangler is installed and authenticated to a concrete Cloudflare account
6. worker name and deploy command are unambiguous in repo config

## Exact Deploy Command

When the missing preconditions are resolved, the worker deploy command from this repo is:

```bash
cd workers/sponsor-service
npm run deploy
```

Expected effect:

- create or update Worker `civilizationcontrol-sponsor` on the currently active Cloudflare account from `wrangler.toml`
- upload the code from `src/index.ts`
- apply the current checked-in non-secret vars from `wrangler.toml`
- require pre-existing secret setup for `SPONSOR_PRIVATE_KEY` and optional `SPONSOR_API_KEY`

## Exact Frontend Cutover Steps

Do not do these until the Worker deploy succeeds and the correct base URL is confirmed.

Preview-only cutover path:

1. deploy the Worker from `workers/sponsor-service/`
2. record the exact deployed worker base URL from Wrangler output or Cloudflare dashboard
3. set `VITE_SPONSOR_URL` for the Cloudflare Pages preview environment to that base URL
4. leave `VITE_SPONSOR_API_KEY` unset unless worker auth is intentionally enabled
5. rebuild/redeploy the preview frontend so the static bundle picks up the new value
6. verify the preview frontend is hitting the new Worker, not the old Flappy-hosted URL

Production cutover path later:

1. repeat the same environment update for the production Pages environment
2. rebuild/redeploy the production frontend only after preview smoke succeeds

## Live Smoke Test Plan

Preview smoke only, after Worker deploy and preview frontend env cutover:

1. confirm the preview frontend uses the new `civilizationcontrol-sponsor` URL rather than the Flappy-hosted worker
2. choose one low-risk sponsored governance action already covered by the allowlist
3. verify the frontend sends `POST /sponsor` to the new Worker
4. confirm the worker returns `{ txB64, sponsorSignature }`
5. confirm the submitted transaction succeeds with sponsorship rather than silently falling back to wallet-paid execution
6. verify the resulting on-chain action matches the expected governance effect
7. if auth is enabled, confirm `SPONSOR_API_KEY` behavior without printing its value

Suggested smoke candidate:

- one low-risk governance PTB that is already covered by the current allowlist, such as a metadata URL update or another intentionally reversible sponsor-eligible governance action

## Risks

### Operational risks

- local `.env` still points to the older Flappy-hosted worker URL
- the Worker does not yet exist on the active Cloudflare account
- secret names cannot be confirmed until the Worker exists or secrets are provisioned
- a frontend cutover without a real smoke test could be masked by the wallet-paid fallback path

### Configuration risks

- `ALLOWED_ORIGINS` currently includes only production Pages plus localhost, not a branch-preview Pages hostname
- `ALLOWED_ORIGIN_SUFFIXES=.civilizationcontrol.pages.dev` supports branch preview subdomains under the same Pages domain, but any alternate preview hostname strategy would need verification
- `SPONSOR_API_KEY` is optional; if mirrored into a Vite env, it is public browser-visible configuration rather than a durable secret

### Explicit non-goals

- no Stillness World v2 runtime-ID work
- no package-ID, world-ID, object-ID, or allowlist changes
- no frontend code changes
- no Cloudflare deploy performed from this report

## Recommended Next Action

Run a separate, explicit Worker deployment task from `master` that does only this:

1. confirm the intended Cloudflare account is correct
2. provision `SPONSOR_PRIVATE_KEY` and optional `SPONSOR_API_KEY` by name if missing
3. deploy `civilizationcontrol-sponsor` from `workers/sponsor-service/`
4. capture the exact worker base URL
5. update preview-only Pages env `VITE_SPONSOR_URL` to that base URL
6. redeploy the preview frontend
7. run one real sponsored governance smoke test before any production cutover