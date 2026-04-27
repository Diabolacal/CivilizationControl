# Sponsor Worker Runtime Discovery — 2026-04-27

Date: 2026-04-27
Branch inspected: `master`
Scope: identify which sponsor worker CivilizationControl is currently using and whether the live path is still the older Flappy-named worker. No deploys, secret changes, frontend env changes, or Cloudflare runtime changes were performed.

## Summary

CivilizationControl is still pointed at the older shared worker `flappy-frontier-sponsor`, not the in-repo worker name `civilizationcontrol-sponsor`.

This is supported by five independent checks:

- local `.env` currently sets `VITE_SPONSOR_URL=https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- frontend sponsorship code in `src/lib/sponsorship.ts` routes sponsored requests to `${VITE_SPONSOR_URL}/sponsor`
- Cloudflare Wrangler can list deployments for Worker `flappy-frontier-sponsor`
- Cloudflare Wrangler can list at least one required secret name on `flappy-frontier-sponsor`: `SPONSOR_PRIVATE_KEY`
- the live endpoint `https://flappy-frontier-sponsor.michael-davis-home.workers.dev/sponsor` responds correctly to a CivilizationControl CORS preflight and rejects an invalid body with HTTP 400

By contrast, Worker `civilizationcontrol-sponsor` does not yet exist on the active Cloudflare account.

Operational recommendation:

- keep using the live `flappy-frontier-sponsor` worker temporarily
- create and cut over to `civilizationcontrol-sponsor` later in a separate explicit migration task

## Evidence

## 1. Current frontend wiring

Local env inspection found:

- `.env`: `VITE_SPONSOR_URL=https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- `.env`: `VITE_SPONSOR_API_KEY` unset
- `.env.local`: missing
- `.env.example`: both sponsor vars intentionally blank by default

Frontend behavior remains:

- `src/lib/sponsorship.ts` enables sponsorship whenever `VITE_SPONSOR_URL` is present
- the client trims trailing slashes and posts to `POST /sponsor`
- if sponsorship is absent or fails, the app falls back to wallet-paid execution

This means the currently configured live sponsor path for local or preview builds that use the same env value is the Flappy-named worker.

## 2. Historical wiring record

The decision log entry dated 2026-03-23 already recorded the intended live integration:

- CivilizationControl was wired to the deployed shared worker `flappy-frontier-sponsor.michael-davis-home.workers.dev`
- adding a dedicated CivilizationControl-owned worker later was explicitly left as a follow-up, not completed work

That historical entry matches the current runtime evidence instead of conflicting with it.

## 3. Cloudflare worker discovery

Wrangler read-only inspection on the active account showed:

- active account: `Michael.davis.home@gmail.com's Account`
- account id: `b61eb4a65fe01c9539b9f43b5434c10d`
- `npx wrangler deployments list --name flappy-frontier-sponsor` succeeded and returned multiple deployments from 2026-03-13 through 2026-04-01
- `npx wrangler secret list --name flappy-frontier-sponsor` succeeded and returned `SPONSOR_PRIVATE_KEY`
- `npx wrangler deployments list --name civilizationcontrol-sponsor` failed with Cloudflare error `10007` because the worker does not exist
- `npx wrangler secret list --name civilizationcontrol-sponsor` failed because the worker does not exist

Interpretation:

- the older Flappy-named worker is real, deployed, and provisioned with at least the sponsor signing key
- the new in-repo worker name has not been created in Cloudflare yet

## 4. Live endpoint probe

Non-destructive HTTP probes against the currently configured worker returned:

- `OPTIONS /sponsor` with `Origin: https://civilizationcontrol.pages.dev` → `204`
- `Access-Control-Allow-Origin: https://civilizationcontrol.pages.dev`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- invalid `POST /sponsor` JSON body → `400`

Interpretation:

- the live endpoint is still serving the expected sponsor route
- the worker is explicitly allowing CivilizationControl's production origin
- the service is validating requests instead of failing at DNS, routing, or an unrelated handler

## 5. What this does and does not prove

This inspection provides strong evidence that `flappy-frontier-sponsor` is the current live sponsor runtime used by CivilizationControl.

It does not fully re-prove end-to-end sponsorship of a real governance transaction because this task intentionally did not submit a real programmable transaction block.

Current confidence statement:

- current configured runtime target: **confirmed** `flappy-frontier-sponsor`
- current service shape and CORS compatibility: **confirmed**
- required signer secret presence by name: **confirmed**
- successful live on-chain sponsorship during this task: **not retested**

## Recommendation

Use the existing `flappy-frontier-sponsor` worker temporarily.

Reasoning:

- it is the worker CivilizationControl is currently configured to use
- it exists and responds correctly
- it already has at least the required sponsor signer secret name
- switching to `civilizationcontrol-sponsor` now would require a real deploy and cutover task, which is separate from this discovery work

Create `civilizationcontrol-sponsor` later in a controlled migration window.

That later task should:

1. deploy `workers/sponsor-service/` to create Worker `civilizationcontrol-sponsor`
2. provision `SPONSOR_PRIVATE_KEY` and any intentionally retained optional auth secret
3. capture the exact deployed worker base URL from Wrangler output
4. point preview `VITE_SPONSOR_URL` at the new base URL
5. run one real sponsored governance smoke on preview
6. preserve `flappy-frontier-sponsor` as fallback until the preview smoke succeeds
7. only then cut production to the new worker URL

## Practical answer

If the question is "what is CivilizationControl using right now?", the answer is:

- the older live worker `flappy-frontier-sponsor`

If the question is "should we keep using it for now or create a new worker immediately?", the answer is:

- keep using `flappy-frontier-sponsor` temporarily
- create and cut over to `civilizationcontrol-sponsor` later as a dedicated deploy-and-smoke task