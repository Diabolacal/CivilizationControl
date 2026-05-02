# Shared-Backend Assembly Enrichment — 2026-04-29

## Summary

CivilizationControl now consumes the production shared-backend assembly summary endpoint opportunistically:

- endpoint: `https://ef-map.com/api/civilization-control/assemblies?ids=<assemblyId,...>`
- request shape: explicit decimal assembly IDs only, max `100` IDs per request
- auth model: no API key required from CivilizationControl
- browser secret model: no browser-visible token, no `ASSEMBLY_API_TOKEN`, no EF-Map internal secret in the frontend
- fallback model: direct-chain asset discovery remains authoritative and continues to work when the shared backend fails, times out, returns `missingIds`, or is unavailable

This is an additive read-path enhancement only. No write path, wallet flow, sponsorship flow, package ID, or Move contract behavior changes.

## Status update - 2026-05-02

CivilizationControl now also consumes a second production shared-backend route for selected-node-local discovery inside `Node Control`:

- endpoint: `https://ef-map.com/api/civilization-control/node-assemblies?networkNodeId=<canonical-network-node-object-id>`
- caller: live `Dashboard` node-local mode only; the dev-only node drilldown lab remains isolated from this route
- auth model: no API key, no browser Authorization header, no browser-visible secret
- authority model: direct-chain live discovery remains authoritative while backend-only rows are read-only node-local observations only
- UI scope: broader backend-observed rows appear only inside `Node Control`; macro `Strategic Network`, macro metrics, ownership truth, OwnerCap truth, and write eligibility remain unchanged
- freshness scope: the current implementation fetches on selected-node entry or change only; interval polling and any event-driven invalidation remain deferred to the later node-local freshness pass

This sibling node-local route does not replace the exact-ID `assemblies?ids=` enrichment path documented below. The exact-ID route still handles additive metadata for already-known structures, while the node-local route handles selected-node broader discovery for read-only display only.

## Reconciliation update - 2026-05-02

The first follow-up to the node-local route corrected how CivilizationControl consumes overlapping live and backend-observed rows.

- overlapping live and backend-observed rows now reconcile by normalized object-ID and decimal assembly-ID aliases before the node-local model renders them
- the direct-chain live lane stays authoritative for ownership, write eligibility, action eligibility, and wallet truth
- the backend lane may enrich the live row with better type labels, size labels, observed status when direct-chain is neutral, `lastUpdated`, `fetchedAt`, `fuelAmount`, `source`, and `provenance`
- backend-only rows remain read-only node-local observations and still do not widen macro topology or write behavior
- node-local player-facing terminology now standardizes storage-family display to `Storage` in `Node Control` and the lab or legend surfaces only; this doc does not widen that rename into macro routes or dedicated `TradePosts` screens
- selected-node polling was intentionally deferred in this pass, because the current node-local ordering still needs live human review before interval refetch can be added without visible churn
- browser-origin inspection from preview confirmed healthy `200` responses from the node-local route and a `cache-control: public, max-age=60` policy, but the accessible wallet-owned nodes in this environment returned empty `assemblies` arrays, so the non-empty assembler payload from human preview testing could not be re-captured here

## Endpoint contract consumed

- base URL default: `https://ef-map.com`
- override: optional public env var `VITE_SHARED_BACKEND_URL`
- route: `GET /api/civilization-control/assemblies?ids=<comma-separated-decimal-assembly-ids>`
- Worker CORS model: route-specific CivilizationControl browser-origin allowlist
- production is the source of truth for positive-path validation in this slice

## How CivilizationControl collects assembly IDs

CivilizationControl does not ask EF-Map to discover owned structures.

Instead it:

1. resolves owned structures directly from Sui RPC through the existing wallet → PlayerProfile → Character → OwnerCap → structure discovery path
2. reads the on-chain `key: TenantItemId` field from each discovered structure
3. extracts `key.fields.item_id` as the decimal `assemblyId`
4. sends only those already-known assembly IDs to the shared backend

That keeps ownership and action authority on the direct-chain path.

## Fields consumed now

The shared-backend client normalizes the v1 summary payload and stores it as optional `summary` data on the local `Structure` model.

Consumed fields:

- `assemblyId`
- `assemblyType`
- `typeId`
- `name`
- `status`
- `fuelAmount`
- `solarSystemId`
- `energySourceId`
- `url`
- `lastUpdated`
- optional `typeName`

Fields currently used by the UI in this slice:

- `name` only when the direct-chain name is still the synthetic type + short-ID fallback
- `solarSystemId` as a display-only location fallback when no manual spatial pin exists
- `url`, `lastUpdated`, `typeId`, `typeName`, `assemblyType`, `status`, `fuelAmount`, and `energySourceId` are stored as optional enrichment for later slices but do not replace authority-critical chain fields in this implementation

## Fallback behavior

- direct-chain discovery remains primary for ownership, owner-cap resolution, structure identity, extension status, network-node linkage, fuel state, and action eligibility
- enrichment runs only after direct-chain discovery has already produced known structures
- endpoint failures do not surface as app-fatal discovery failures
- `missingIds` leave those structures unchanged
- invalid or partial backend payloads are discarded defensively
- the app continues to function with the existing direct-chain data if the endpoint returns no usable enrichment

## What remains direct-chain

Still direct-chain and authoritative:

- wallet connection and player-profile discovery
- OwnerCap discovery
- structure object resolution by Sui object ID
- extension authorization status
- power state used for control actions
- network-node object linkage used for action paths
- fuel data used by runtime and power UI
- all write paths, PTBs, sponsorship, and transaction execution

## What not to use this endpoint for

Do not use this route for:

- owner, tribe, character, or wallet discovery
- owner-cap lookup
- write authorization decisions
- power, posture, policy, or extension actions
- raw search or browsing by system, owner, or tribe
- browser-visible secret transport

## Future candidates

Reasonable future additive slices:

1. shared-backend network-node summary enrichment
2. recent activity or signal-feed enrichment through a separate filtered backend contract
3. richer type labeling once the summary contract explicitly stabilizes those fields
4. optional display of backend freshness metadata where it helps operators without replacing chain truth

## Validation notes

- the client chunks requests at `100` IDs per request to match the backend contract
- timeout is bounded per request chunk
- no browser Authorization header or EF-Map internal secret is used
- direct-chain fallback remains available even when the shared backend is unavailable

## Diff audit

Branch diff against `master`: `16` files.

Classification:

- shared-backend client
	- `src/lib/assemblySummaryClient.ts`
- assembly ID extraction
	- `src/lib/suiReader.ts`
	- `src/types/domain.ts`
- enrichment hook and integration
	- `src/hooks/useAssemblySummaryEnrichment.ts`
	- `src/hooks/useAssetDiscovery.ts`
	- `src/lib/assemblyEnrichment.ts`
- UI fallback usage
	- `src/components/StructureDetailHeader.tsx`
	- `src/screens/GateListScreen.tsx`
	- `src/screens/NetworkNodeListScreen.tsx`
	- `src/screens/TradePostListScreen.tsx`
	- `src/screens/TurretListScreen.tsx`
- docs
	- `docs/README.md`
	- `docs/decision-log.md`
	- `docs/llm-reference-guide.md`
	- `docs/operations/shared-backend-assembly-enrichment-20260429.md`
- public env typing
	- `src/vite-env.d.ts`
- tests/scripts
	- none
- unexpected
	- none in the feature diff

Explicit confirmations from this audit:

- no sponsor worker source changed
- no sponsor allowlist or worker policy file changed
- no package ID file changed
- no Move source or Move manifest file changed
- no transaction builder or write-path file changed
- no EF-Map token or API key was added
- no `ASSEMBLY_API_TOKEN` appears in frontend code

## Hardening and preview revalidation

### Unrelated dirt left untouched

The only unrelated dirt found during this pass remained inside the `vendor/world-contracts` submodule:

- file: `vendor/world-contracts/contracts/world/Move.lock`
- shape: line-ending and path-quote churn only
- example: `subdir = "crates/sui-framework/packages/..."` rewritten locally as single-quoted backslash paths

This dirt was not staged, not committed, and not included in the feature branch work.

### Preview sponsor mismatch root cause

The first preview revalidation found that the branch alias was still serving a stale bundle:

- stale alias asset: `index-COLKeVim.js`
- stale sponsor reference present: `https://flappy-frontier-sponsor.michael-davis-home.workers.dev`
- shared-backend reference already correct: `https://ef-map.com`

Root cause was not this branch's code diff. The local untracked `.env` on the machine running the build still contained:

- `VITE_SPONSOR_URL=https://flappy-frontier-sponsor.michael-davis-home.workers.dev`

That means a plain local `npm run build` can still produce a stale sponsor target unless the public build vars are overridden explicitly.

### Corrected preview redeploy

The preview was rebuilt and redeployed with explicit public overrides only:

- `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- `VITE_SHARED_BACKEND_URL=https://ef-map.com`
- `VITE_SPONSOR_API_KEY=` (blank)

No production deploy was performed.

Corrected preview evidence:

- unique preview URL: `https://e9308288.civilizationcontrol.pages.dev`
- branch alias URL: `https://feat-shared-backend-assembly.civilizationcontrol.pages.dev`
- corrected served asset: `index-CGzlLlzq.js`

Bundle proof after redeploy:

- unique preview serves `index-CGzlLlzq.js`
- branch alias also serves `index-CGzlLlzq.js`
- `civilizationcontrol-sponsor` is present in the served asset
- `flappy-frontier-sponsor` is absent in the served asset
- `https://ef-map.com` is present in the served asset
- `VITE_SHARED_BACKEND_URL` is the only shared-backend override symbol embedded
- `ASSEMBLY_API_TOKEN` is absent from the served asset
- no EF-Map bearer token, `Authorization` header string, or `X-API-Key` path was found in the shared-backend client path or the served preview bundle

### Browser-origin endpoint proof

Browser-origin validation was performed from the corrected unique preview host.

Observed request target:

- `https://ef-map.com/api/civilization-control/assemblies?ids=1000000015746`

Observed result:

- HTTP `200`
- response body envelope shape was valid
- payload returned `assemblies: []`, `missingIds: ["1000000015746"]`, and `source: "shared-frontier-backend"`

Observed request headers:

- `Origin: https://e9308288.civilizationcontrol.pages.dev`
- `Referer: https://e9308288.civilizationcontrol.pages.dev/`
- no `Authorization`
- no `Bearer`
- no `X-API-Key`

This is the correct browser validation surface for the integration. A raw Node-side fetch can return `403` for this route even while the browser-origin path is healthy.

### Why UI change may be minimal

Minimal visible change is correct for this slice.

The current implementation only uses shared-backend data for:

- replacing synthetic fallback names when the direct-chain name is still type + short object ID
- resolving a solar-system label when no manual spatial pin exists

If a wallet's discovered structures already have meaningful on-chain names or manual pin assignments, the operator may see little or no visible UI change even when enrichment is working correctly.

### Manual wallet-connected validation steps

If a final human smoke is needed with a real wallet and owned structures:

1. Open `https://e9308288.civilizationcontrol.pages.dev`
2. Connect the wallet that owns structures
3. Open DevTools Network
4. Filter for `civilization-control/assemblies`
5. Refresh or trigger structure discovery
6. Confirm the request goes to `https://ef-map.com/api/civilization-control/assemblies?...`
7. Confirm status `200`
8. Confirm the response is a normal envelope with `assemblies` and `missingIds`
9. Confirm request headers do not include `Authorization` or `X-API-Key`
10. If a sponsored transaction is tested, confirm the request goes to `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor`, not `flappy-frontier-sponsor`

## Manual preview smoke result

The corrected preview was manually tested by the user at:

- `https://e9308288.civilizationcontrol.pages.dev`

Observed manual smoke result:

- wallet connected successfully
- DevTools Network showed `civilization-control/assemblies` activity
- sponsor traffic used `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- `flappy-frontier-sponsor` was not observed during the corrected preview smoke
- no obvious UI change was required for this slice, which remains expected because the current implementation only uses shared-backend data for limited fallback display fields

State boundary at the time of this preview smoke:

- production had not yet been deployed from this branch
- direct-chain discovery remained authoritative
- the shared backend remained additive and optional

## Production frontend cutover — 2026-04-29

Production cutover was performed only after:

- validating `feat/shared-backend-assembly-enrichment`
- recording the manual corrected-preview smoke
- fast-forward merging into `master`
- revalidating the merged `master` branch
- pushing `origin/master`

Active Sui environment during the cutover remained:

- `testnet_stillness`

Deploy command shape used from the repo root:

- `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- `VITE_SHARED_BACKEND_URL=https://ef-map.com`
- `VITE_SPONSOR_API_KEY=`
- `npm run build`
- `npx wrangler pages deploy dist --project-name civilizationcontrol --branch main --commit-hash d1eea24745e58ec53222011ad4ab47c6aabb3545 --commit-message "shared backend assembly enrichment production cutover"`

Observed production deployment result:

- unique production deployment URL: `https://1c96b5a7.civilizationcontrol.pages.dev`
- source commit hash: `d1eea24745e58ec53222011ad4ab47c6aabb3545`
- built asset: `index-CGzlLlzq.js`

Served production HTML proof:

- `https://civilizationcontrol.com` serves `/assets/index-CGzlLlzq.js`
- `https://civilizationcontrol.pages.dev` serves `/assets/index-CGzlLlzq.js`

Served production bundle proof:

- both public domains now serve the same production asset
- `https://ef-map.com` is present in the served asset
- `civilizationcontrol-sponsor` is present in the served asset
- `flappy-frontier-sponsor` is absent in the served asset
- `ASSEMBLY_API_TOKEN` is absent in the served asset

Browser-origin production endpoint proof:

- from `https://civilizationcontrol.com`, a live browser fetch to `https://ef-map.com/api/civilization-control/assemblies?ids=1000000015746` returned `200`, `response.type === "cors"`, `content-type: application/json`, and a readable envelope with `assemblies`, `missingIds`, `fetchedAt`, and `source`
- from `https://civilizationcontrol.pages.dev`, the same live browser fetch returned the same `200` CORS-readable JSON envelope
- `access-control-allow-origin` was not script-visible through `fetch().headers.get(...)`, which is acceptable here because the browser fetch succeeded and the response body was readable in both origins

Operational state after cutover:

- production frontend now consumes shared-backend assembly enrichment at runtime
- direct-chain discovery remains authoritative and is still the fallback on missing or failed backend responses
- production still uses `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
- no browser-visible EF-Map secret or API key was introduced
- no agent-driven live wallet transaction was executed during this production cutover

If a later production smoke is desired, the operator can use either public origin and confirm:

1. wallet connection succeeds
2. DevTools Network shows `civilization-control/assemblies` requests to `https://ef-map.com`
3. sponsored traffic, if exercised, still targets `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
4. structures with synthetic names or no manual pin receive the same limited fallback behavior observed in preview