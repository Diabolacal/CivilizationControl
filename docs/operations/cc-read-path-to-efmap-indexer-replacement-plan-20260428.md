# CivilizationControl Read Path -> EF-Map Indexer Replacement Plan — 2026-04-28

> Status note (2026-04-29): Phase 1 shipped via `docs/operations/shared-backend-assembly-enrichment-20260429.md`. This file remains as later-phase roadmap and historical planning context only.
>
> Status update (2026-05-04, latest): the docs-only write-action audit on `docs/node-control-write-action-audit` confirms that the current read-path baseline is already correct for the next implementation wave. `/activity` and Dashboard Recent Signals now use the wallet-scoped shared `signal-history` route on normal paths, Node Control already boots from operator inventory, and the next action branch should treat signal-history parity as a separate read-only backlog rather than reopening read-path architecture.
>
> Status update (2026-05-04, latest): the frontend signal-history adoption on `feat/signal-history-indexer-feed` is now human-smoked on `https://9ffbadd8.civilizationcontrol.pages.dev`. `Dashboard` `Recent Signals` showed real indexed rows including events from several hours earlier, `/activity` showed real wallet-scoped indexed rows back into late April / early May, and `Governance`, `Transit`, plus `Status` filters were manually checked. `/activity` and Dashboard Recent Signals now consume the wallet-scoped shared `signal-history` route rather than browser `queryEvents`, the accepted v1 history gaps stay deferred, and the next branch should remain the write-action audit before any package-change decision.
>
> Status update (2026-05-04, zero-package action parity): the next implementation wave is now live on preview at `https://2075be01.civilizationcontrol.pages.dev` and still respects the accepted read-path boundary. The new action slice adds shared power or rename menus plus explicit post-write refetch across operator inventory, asset discovery, selected-node `node-assemblies` fallback, and active signal history, but it does not change EF-Map contracts, does not restore browser `queryEvents` for normal Signal Feed routes, and does not widen shared-backend authority beyond additive read enrichment. Treat this Phase 1A slice as UI-level freshness on top of the current read model, not as a new read-path architecture change; the next Phase 1B widening for generic attached assemblies should stay inside the same operator-inventory-first read model rather than reopening read-path architecture.
>
> Status update (2026-05-04, live Node Control corrective follow-up): the final parity pass confirmed the accepted read-path boundary remains correct. The remaining live Node Control action gap was not a missing EF-Map or package surface; it was a frontend projection seam where backend-membership rows rebuilt authority from thinner node-membership data instead of reusing the already-actionable operator-inventory `Structure` rows that global lists use. The stale rename/power snapback was likewise frontend-owned: the temporary overlay cleared on selected-node lookup confirmation before the operator-inventory-first app shell confirmed the new indexed state. The fix therefore stays strictly inside the frontend read model: backend-membership rows now recover `verifiedTarget` from operator-inventory structures while preserving direct-chain truth, and structure-write overlays now persist until operator inventory confirms. This does not widen backend authority, does not change EF-Map contracts, and does not reopen browser `queryEvents`; it is a local reconciliation and authority-projection repair on top of the accepted operator-inventory-first boundary. Fresh preview proof is now `https://83603ca1.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; unique and alias HTML both resolve `assets/index-1oyXIeOs.js`; served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` plus `https://ef-map.com` in the expected runtime chunks and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; and an integrated-browser wallet smoke attempt remained unavailable because the only exposed wallet option returned `Connection failed`.
>
> Status update (2026-05-04, Phase 1B widening): generic attached-assembly Node Control actions are now live on preview at `https://55fdaf7c.civilizationcontrol.pages.dev` and still stay entirely inside the accepted operator-inventory-first read model. The frontend now separates executable targets from display families through `StructureActionTargetType = StructureType | "assembly"`, generic attached-assembly rows normalize to the `assembly` target when indexed required IDs plus `ownerCapId` are present, and sponsor policy now mirrors generic `assembly::{update_metadata_name,online,offline}` under both world package IDs. No EF-Map contract, `node-assemblies` contract, `signal-history` contract, browser `queryEvents` boundary, or package boundary changed in this pass. Unique and alias preview HTML both resolve `assets/index-DId4iWQ2.js`; served-bundle scanning found `civilizationcontrol-sponsor` in `App-CuXhOtYo.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-FvrsLQZR.js` and `SmartObjectProvider-CywV33-9.js`, and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, or `X-API-Key`; route smoke passed on `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; and integrated-browser wallet smoke remained unavailable because no usable wallet-backed session was present.
>
> Status update (2026-05-03, newest): the final accepted frontend-only polish on `feat/node-drilldown-render-shell` compacted the selected network-node `Fuel` row in `Selection Inspector` into a one-row quantity-plus-runtime summary where space allows, while keeping fill quantity-based, runtime indexed-only, and severity thresholded at `86400`/`3600`. No browser JSON-RPC, backend contract, package, or write-path behavior changed in this pass. The branch should now merge after preview validation, and the next implementation slice should start in EF-Map/shared-backend with the wallet-scoped signal-history endpoint rather than reopening frontend branch scope. See `docs/operations/network-node-drilldown-implementation-plan-20260501.md` under `Next work order after merge`.
>
> Status update (2026-05-03, newest): the latest frontend-only follow-up on `feat/node-drilldown-render-shell` corrected two app-owned operator-shell seams without changing shared-backend or chain contracts. First, `src/lib/fuelRuntime.ts` now derives network-node fill from honest quantity fullness, normalizing indexed `powerSummary.fuelMaxCapacity` when it is not in the same usable-unit scale as indexed `fuelAmount`; runtime labels still come only from indexed estimated time, severity still uses `86400`/`3600`, and partial states stay units-only with no fabricated time. Second, `src/main.tsx` now paints an immediate static boot shell before async app and provider imports resolve and records `window.__CC_BOOT_TIMING__`. Local timing on `http://127.0.0.1:4185/` showed shell paint at `49.8ms` and app paint at `244.6ms`; deployed preview `https://3cb28fb6.civilizationcontrol.pages.dev` showed shell paint at `269ms` and app paint at `770.7ms`, while disconnected `/`, `/nodes`, `/settings`, and `/dev/node-drilldown-lab` still made no browser Sui RPC, `operator-inventory`, or `node-assemblies` requests. Validation passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the pre-existing LF/CRLF warning on `contracts/civilization_control/Move.lock`; `npx tsx scripts/check-operator-inventory-mapping.mts`; and `npx tsx scripts/check-node-drilldown-reconciliation.mts`. Served preview HTML on both unique and alias URLs resolved `assets/index-BPekTQv0.js`; served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` in `App-Brh6xqfh.js` and `SmartObjectProvider-tq4WYpYI.js`, `https://ef-map.com` in `SmartObjectProvider-tq4WYpYI.js` and `useNodeDrilldownStructureMenu-B4vRh3iM.js`, `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-tq4WYpYI.js` and `suiRpcClient-BibKDPwo.js`, and no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`. Live wallet-connected browser proof of the corrected fuel bar remains pending in this environment.
>
> Status update (2026-05-03, newest): the indexed-runtime follow-up on `feat/node-drilldown-render-shell` now treats `networkNodes[].node.powerSummary` as the frontend source for network-node runtime UI and for `Command Overview` / `Attention Required` low- and critical-fuel state. Low fuel is `86400` seconds and critical is `3600` seconds. Runtime is rendered only when indexed confidence is `indexed` and both `estimatedSecondsRemaining` plus `estimatedHoursRemaining` are present; otherwise rows stay partial and units-only so no time is fabricated. Assembly-less indexed rows preserve a root-level `powerSummary` through adaptation, `Selection Inspector` now shows a compact indexed fuel summary for selected network nodes, no browser Sui JSON-RPC was added for runtime recovery, and Signal Feed remains a separate deferred slice unchanged by this pass. Validation passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the pre-existing LF/CRLF warning on `contracts/civilization_control/Move.lock`; `npx tsx scripts/check-operator-inventory-mapping.mts`; and `npx tsx scripts/check-node-drilldown-reconciliation.mts`. Preview evidence: `https://be1df70f.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`; preview route smoke confirmed `/`, `/nodes`, `/settings`, and `/dev/node-drilldown-lab`; disconnected checks for those same routes made no browser Sui RPC requests and no `operator-inventory` or `node-assemblies` requests; the dev lab remained isolated from wallet, shared-backend, and sponsor flows; unique and alias HTML both resolved `assets/index-CbtN9RIx.js`; served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` in `App-CyzGoJCr.js` and `SmartObjectProvider-DEp_I87K.js`, `https://ef-map.com` in `SmartObjectProvider-DEp_I87K.js` and `useNodeDrilldownStructureMenu-CblxiTR6.js`, `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-DEp_I87K.js` and `suiRpcClient-BibKDPwo.js`, and no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; exact-case `Authorization` was absent and the only lowercase `authorization` marker remained the existing user-facing text `Turret extension authorization revoked` in `App-CyzGoJCr.js`. Live wallet-connected browser proof for restored indexed runtime on `/nodes` and `Node Control` remains pending in this environment.
>
> Status update (2026-05-03): live Node Control experience on `feat/node-drilldown-render-shell` proved that the additive `assemblies?ids=` plus selected-node `node-assemblies` model is still too dependent on browser Sui JSON-RPC for app boot and operator inventory. The next shared-backend slice should therefore be accelerated from exact-ID enrichment toward a wallet-scoped operator-inventory endpoint that can become CivilizationControl's primary read path, while chain reads remain final for signing, execution, and narrow fallback or debug only.
>
> Status update (2026-05-03, later): the frontend adoption phase is now implemented on `feat/node-drilldown-render-shell`. `useAssetDiscovery` boots from `GET /api/civilization-control/operator-inventory?walletAddress=0x...` through a browser-safe client and compatibility adapter, direct-chain discovery now falls back only on complete shared-read-model failure, and selected-node `Node Control` now prefers grouped operator-inventory rows plus indexed `actionCandidate.actions.power` hints over a mandatory selected-node `node-assemblies` fetch. Deterministic proof now includes `scripts/check-operator-inventory-mapping.mts`. Preview evidence for this implementation pass: `https://a7e61d2e.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`.
>
> Status update (2026-05-03, latest): the frontend read-model correction now enforces raw operator-inventory `networkNodes[]` as the only authoritative source of displayed network-node groups. Unlinked node-like rows and unlinked turret rows remain diagnostics or unlinked inventory only and no longer become standalone network nodes or synthetic macro-node clusters through generic regrouping. Browser-only proof now includes `?debugOperatorInventory=1`, and refreshed preview evidence for this correction pass was captured on `https://3a32a175.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`.
>
> Status update (2026-05-03, newest): the follow-up frontend correction now quarantines raw operator-inventory `unlinkedStructures` out of normal governed inventory entirely while preserving them in `adapted.unlinkedStructures` for diagnostics and explicit future surfaces only. Raw grouped node buckets and selected-node lookups now also dedupe by canonical object-or-assembly identity instead of raw `node.objectId` only, and `?debugOperatorInventory=1` now exposes `operatorInventoryUrl`, raw grouped duplicate buckets, and `adaptedUnlinkedRows` for wallet-connected live classification. Refreshed preview evidence for this correction pass: `https://2db728c4.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`.
>
> Status update (2026-05-03, final): the next frontend correctness pass now narrows the remaining phantom-node class to raw grouped operator-inventory rows admitted by frontend eligibility rather than by fallback merging. Grouped nodes now render only when they have stable canonical identity plus a displayable node object ID, and zero-structure grouped rows must also carry owned-node proof; ownerless empty grouped rows, missing-identity rows, and missing-displayable-ID rows are quarantined into debug instead of rendering or counting as governed network nodes. The browser-only `?debugOperatorInventory=1` export now includes `requestedWalletAddress`, raw returned operator wallet, indexed `rawNetworkNodes[]`, raw-node duplicate buckets by object or assembly or owner-cap or canonical identity, `quarantinedNodeRows`, `missingIdentityNodeRows`, `zeroStructureGroupedNodes`, and `renderedNetworkNodeListCount`, while the sidebar shell no longer renders read-model status or raw backend warning paragraphs. Refreshed preview evidence for this correction pass: `https://a91ed23d.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`.
>
> Status update (2026-05-03, newest): the phantom-node follow-up now tightens the zero-structure grouped-node rule one step further and exposes enough identity in the shipped UI to classify the remaining suspicious node without devtools-first inspection. Empty grouped nodes now render only when they still have a displayable object ID plus `ownerCapId` and at least one stronger indexed proof signal (`status` not neutral or unknown, indexed fuel amount, indexed power summary, or indexed energy-source ID); weak neutral object-only or assembly-only grouped rows are quarantined into debug. The normal `Selection Inspector` now shows full selected node identity (`Object ID`, `Assembly ID`, `OwnerCap ID`, `Energy Source ID`, `Canonical Identity`) with calm fallback copy, `/nodes` now labels the identity column as `Object ID` with an `Assembly ...` subline instead of the misleading `Location` label, and the browser-only `?debugOperatorInventory=1` export now adds `groupedNodeEligibilityDecisions`, `renderedNodeGroups`, `renderedNetworkNodeListRows`, and `copySummary()` for wallet-connected proof capture. Refreshed preview evidence for this correction pass: `https://4964256d.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`.
>
> Status update (2026-05-03, latest): the next frontend pass now closes two remaining read-model seams without changing backend code. First, indexed operator-inventory `fuelAmount` is now carried through compatibility `Structure` rows as `indexedFuelAmount`, so `/nodes`, node detail, parent-node banners, and `Selection Inspector` can show honest quantity-only fuel even when grouped node rows have no `assemblyId`. Runtime estimates and low-fuel heuristics remain chain-derived only when real on-chain `fuel` runtime fields exist. Second, `/activity` no longer drives its normal UI from browser `queryEvents`; the route is intentionally paused with calm migration copy until a wallet-scoped shared history endpoint exists. The legacy `useSignalFeed` hook remains only as a non-polling dashboard preview dependency for now, so browser `queryEvents` is no longer the normal Signal Feed route contract. Refreshed preview evidence for this pass: `https://66c402a7.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`.

## 1. Executive summary

CivilizationControl currently fetches most of its live data itself in the browser. The active app still uses direct Sui JSON-RPC for ownership discovery, structure hydration, gate policy and posture reads, listing discovery, and SSU inventory reads, while normal Signal Feed routes now consume the wallet-scoped EF-Map `signal-history` endpoint. It also does one browser-side World API tribe refresh and ships bundled static catalogs for item types, tribe names, and solar systems. There is no first-party GraphQL usage in `src/` today.

The biggest read-path pain points are:

- repeated wallet -> `PlayerProfile` -> `Character` -> `OwnerCap` -> structure discovery in the browser every 60 seconds
- nine parallel `queryEvents` module polls every 30 seconds, or every 4 seconds during posture transitions, for Recent Signals
- event-scan-based listing discovery
- per-slot dynamic-field inventory reads for SSUs
- static or partially stale taxonomy, tribe, and system enrichment layers

The shared Frontier backend currently implemented in the EF-Map repo/runtime can already replace or enrich part of that read load because it has live Postgres-backed Sui indexer data, normalized activity history, structure tables, ownership joins, inventory tables, type/tribe enrichment, internal APIs, snapshots, and realtime event-worker surfaces. The safe boundary remains the same as in the awareness doc: CivilizationControl should consume shaped shared-backend Worker/API/snapshot surfaces, or a thin CC proxy if needed. It should not wire its browser directly to the backend Postgres store or raw internal service hosts.

The slices that should not be replaced are the ones that protect write correctness and operator authority:

- wallet-owned `PlayerProfile` discovery
- direct `Character` and `OwnerCap` resolution
- gate policy and posture dynamic-field reads
- linked-gate lookup used by permit/transit flows
- EVE coin-object discovery used for payable PTBs
- transaction proof reads used for verification

The recommended first implementation slice is exactly one new shared-backend, read-only structure-summary endpoint keyed by assembly IDs already known to CC after on-chain ownership discovery. Today that means adding backend source code in the EF-Map repo/runtime, because that is where the shared backend lives. That slice improves the broadest operator surface with the lowest privacy risk, proves the Worker/API contract boundary, and keeps rollback trivial because CC can fall back to its current direct chain reads.

## Shared backend integration model

CivilizationControl should not treat this as "consume EF-Map as a separate app." The better model is one shared EVE Frontier indexer/backend serving multiple products.

Current reality:

- one shared backend runtime for events, history, structures, types, universe data, enrichment, snapshots, and filtered streams
- backend source code currently lives mostly in the EF-Map repo because that is where the backend grew up
- backend runtime is currently operated through the EF-Map VPS/runtime
- EF-Map is the original/current primary consumer and operator, but not the only logical consumer
- CivilizationControl and future apps should consume safe shaped backend surfaces from that same shared backend

What this implies:

- CivilizationControl should not run a duplicate indexer unless there is a specific operational reason later
- CivilizationControl should consume shaped surfaces from the shared backend: API endpoint, snapshot, filtered event stream, or an optional CC proxy if needed
- direct browser DB access remains rejected
- direct VPS/DB access is acceptable only for read-only investigation and server-side/operator tooling, not app runtime
- additive backend endpoints for CivilizationControl should be committed to the backend source repo, currently EF-Map, rather than hand-edited on the VPS

## 2. Current CivilizationControl read-path inventory

| Feature / UI surface | Files / hooks | Current data source | Query / polling mechanism | Browser-side cost | Data returned | Current limitations | Replace / enrich / keep |
|---|---|---|---|---|---|---|---|
| Operator asset discovery | `src/hooks/useAssetDiscovery.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | `getOwnedObjects` + `getObject`; 60s refetch, 30s stale | High | wallet -> `PlayerProfile` -> `Character` -> `OwnerCap` -> owned structures, plus network node grouping via `energy_source_id` | Entire ownership walk runs in browser; the top-level compatible `Structure` lane still admits only four structure families today even though wider attached-assembly rows already survive through operator-inventory node membership; every structure is hydrated individually | Keep direct chain for authority, enrich structure summaries |
| Wallet profile / character discovery | `src/lib/suiReader.ts` | Sui JSON-RPC | `getOwnedObjects` for `PlayerProfile`, then `getObject` for `Character` | Medium | `characterId`, character name, `tribeId` | Needed for write authority; browser does full ownership walk | Keep direct chain |
| Gate policy reads | `src/hooks/useGatePolicy.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | `getDynamicFieldObject` against `GateConfig`; no timer polling | Medium | commercial preset, defense preset, treasury | Dynamic-field truth is on-chain; not a good indexer substitute for control-critical state | Keep direct chain |
| Posture reads | `src/hooks/usePosture.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | `getDynamicFieldObject`; 30s polling or 4s during posture transitions | Medium | per-gate posture mode | Control-critical and timing-sensitive; per-gate truth must remain authoritative | Keep direct chain |
| Gate permit preload | `src/hooks/useGatePermit.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | combined policy + posture + linked gate + player profile reads | Medium | effective access and toll context for the gate page | Needed for safe writes and accurate player-facing permit state | Keep direct chain |
| Linked-gate lookup | `src/hooks/useTransitProof.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | `getObject`; no polling | Low | destination gate ID | Control-path dependency for transit/permit workflows | Keep direct chain |
| Marketplace listing discovery | `src/hooks/useListings.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | `queryEvents` on `ListingCreatedEvent`, then `multiGetObjects`; stale 15s | Medium to high | live shared listings filtered by SSU | Event-scan-based, rescans full event history, no index-backed summary | Enrich, later partial replace |
| SSU inventory discovery | `src/hooks/useSsuInventory.ts`, `src/lib/suiReader.ts` | Sui JSON-RPC | `getObject` plus one `getDynamicFieldObject` per inventory key; stale 15s | High | inventory slots, capacities, item entries | Expensive for large inventories; browser enumerates inventory DFs itself | Enrich, later partial replace |
| Recent Signals / activity feed | `src/hooks/useSignalFeed.ts`, `src/hooks/useSignalHistory.ts`, `src/lib/signalHistoryClient.ts`, `src/screens/ActivityFeedScreen.tsx`, `src/screens/Dashboard.tsx`, `src/lib/suiReader.ts`, `src/lib/eventParser.ts`, `src/lib/signalFolder.ts` | EF-Map shared-backend signal-history endpoint for `/activity` and dashboard preview | wallet-scoped `useInfiniteQuery` with cursor paging, disabled until wallet connect, no recurring polling by default | Medium | dashboard gross-yield and recent signal preview, plus `/activity` filter and history view | v1 gaps remain for custom posture/policy/gate-config and other legacy families beyond indexed kinds; legacy browser event helpers still exist for separate deferred surfaces | Replaced for normal routes |
| Seller/player profile display | `src/components/ListingCard.tsx`, `src/screens/SsuMarketplacePage.tsx`, `src/lib/suiReader.ts` | Sui JSON-RPC | `fetchPlayerProfile`; stale 60s | Medium | seller or current player character name and tribe | Repeats profile resolution for display-only enrichment | Enrich |
| Tribe directory refresh | `src/hooks/useTribesRefresh.ts`, `src/lib/tribeCatalog.ts` | Stillness World API plus bundled JSON | browser `fetch()` once per mount; stale Infinity | Low | fresher tribe names over a bundled catalog fallback | Separate non-EF-Map source; enrich-only | Defer |
| Bundled type catalog | `src/lib/typeCatalog.ts`, `src/hooks/useItemType.ts`, `src/data/itemTypes.json` | Bundled static data | module-load JSON use | Low | item names | Build-time snapshot only | Replace or enrich |
| Bundled solar-system catalog | `src/lib/solarSystemCatalog.ts`, `src/hooks/useSolarSystem.ts`, topology components | Bundled static data | module-load JSON use | Low | solar-system names and 3D positions | Static snapshot and manual pinning remain separate from live structure data | Enrich |
| Bundled tribe snapshot | `src/lib/tribeCatalog.ts`, `src/hooks/useTribe.ts` | Bundled static data | module-load JSON use | Low | fallback tribe labels | Static/stale without refresh | Enrich |
| Transaction proof hover | `src/hooks/useTxDetails.ts`, `src/lib/txDetails.ts` | Sui JSON-RPC | lazy `getTransactionBlock` on hover | Low | tx digest proof, gas, checkpoint, status | Verification path is already narrow and correct | Keep direct chain |
| Pre-write EVE coin discovery | `src/lib/currency.ts` used by write hooks | Sui JSON-RPC | raw `suix_getCoins` on action | Low to medium | spendable EVE coins and balances | Write-safety critical | Keep direct chain |

Key repo-grounded notes:

- First-party `src/` uses Sui JSON-RPC extensively but does not use GraphQL for app read paths today.
- First-party `src/` does not call `getDynamicFields`; it uses `getDynamicFieldObject` when it reads dynamic fields.
- The highest browser polling cost is the event path, not the static catalogs.

## 3. Current event and polling model

### Current event surfaces

- `/activity` and `Dashboard` now consume wallet-scoped shared history through `src/lib/signalHistoryClient.ts` plus `src/hooks/useSignalHistory.ts`
- `src/hooks/useSignalFeed.ts` still exists only as a compatibility wrapper so existing dashboard and topology consumers can keep the normalized `SignalEvent` shape without returning to browser polling
- `fetchRecentEvents()` in `src/lib/suiReader.ts` no longer drives `/activity` or dashboard Recent Signals. It remains only as legacy helper code while separate event-scan surfaces such as marketplace listing discovery are still deferred

### Shared signal-history coverage now shipped

The shared endpoint currently supports wallet-scoped v1 categories and kinds for the normal Signal Feed UI:

- categories: `governance`, `trade`, `transit`, `status`
- status kinds: `structure_online`, `structure_offline`, `structure_unanchored`, `structure_destroyed`, `node_fuel_changed`, `node_low_fuel`, `node_critical_fuel`, `fuel_changed`
- trade kinds: `storage_deposit`, `storage_withdraw`
- governance kinds: `extension_authorized`, `extension_frozen`, `ownership_transferred`
- transit kinds: `gate_transit`

### Polling intervals in live code

- `/activity`: on-demand plus cursor-based pagination; no timer polling
- dashboard signal preview: no recurring polling; invalidation and explicit refetch only
- `useSignalHistory`: disabled until wallet connect, no refetch on focus/reconnect/mount, retry disabled
- Asset discovery: 60 seconds
- Gate policy, listings, SSU inventory, permit preloads: cache-based or on-demand, not timer-driven

### Signal history source today

- `/activity` and dashboard signal preview are now endpoint-derived from `GET /api/civilization-control/signal-history?walletAddress=0x...`

1. normalize wallet and optional query params in the browser
2. fetch the shared endpoint from `https://ef-map.com` or `VITE_SHARED_BACKEND_URL`
3. map the v1 envelope into the existing `SignalEvent` shape
4. surface `partial`, `warnings`, and `nextCursor` calmly in the operator UI

### Current limitations and evidence

- human wallet-connected preview smoke on `https://9ffbadd8.civilizationcontrol.pages.dev` confirmed that `Dashboard` `Recent Signals` shows real indexed rows, `/activity` shows real wallet-scoped indexed rows extending back into late April / early May, and `Governance`, `Transit`, plus `Status` filters scope results as expected for the current v1 route
- no global firehose is exposed to the browser
- no direct `energy_events`
- no stable separate gate-access or gate-configuration history surface yet
- no custom legacy CivilizationControl posture/policy/toll/trade-settlement/turret-doctrine families unless they are represented by the current v1 indexed kinds
- `assemblyId` may be `null`
- `extension_frozen` must remain labeled frozen rather than revoke/delete
- marketplace listing discovery still relies on browser event queries and is separate from Signal Feed

These omissions remain a separate parity backlog. They should not be treated as blockers for the first zero-package Node Control write slice.

### Can EF-Map replace this?

Yes, and the first browser-safe slice is now shipped.

- current normal-route shape: wallet-scoped EF-Map signal history backed primarily by `ef_sui.activity_log`
- later: a filtered EF-Map realtime channel or Worker stream once the auth/CORS contract is stable and the operator shell actually needs it

`ef_sui.activity_log` remains the best event replacement source because it is already normalized. `ef_sui.raw_events` is still better treated as a server-side backing table or fallback for event families not yet normalized.

### Shipped shared signal-history contract

The shared backend now defines one browser-safe endpoint for normal Signal Feed UI:

- endpoint: `GET /api/civilization-control/signal-history?walletAddress=0x...`
- required query params: `walletAddress`
- optional query params: `limit` (default `50`, max `100`), `cursor`, `categories` (comma-separated canonical groups `governance,trade,transit,status`), `networkNodeId`, `structureId`, and `since`
- server-side scope rule: resolve the wallet's indexed operator inventory first, then return only signals tied to that wallet's governed infrastructure; do not expose a global unscoped firehose to the browser
- response shape:

```json
{
  "schemaVersion": "signal-history.v1",
  "source": "shared-frontier-backend",
  "fetchedAt": "2026-05-04T18:00:00.000Z",
  "partial": false,
  "warnings": [],
  "operator": {
    "walletAddress": "0x...",
    "characterId": "0x...",
    "characterName": "Operator Prime",
    "tribeId": 77,
    "tribeName": "Stillness Vanguard"
  },
  "signals": [
    {
      "id": "0xTXDIGEST:17",
      "timestamp": "2026-05-03T17:58:41.000Z",
      "category": "trade",
      "kind": "storage_deposit",
      "title": "Storage Deposit",
      "summary": "Inventory moved into governed storage.",
      "severity": "info",
      "networkNodeId": "0x...",
      "structureId": "0x...",
      "assemblyId": null,
      "ownerCapId": "0x...",
      "txDigest": "0xTXDIGEST",
      "checkpoint": 123456789,
      "actorCharacterId": "0x...",
      "amount": "120000000",
      "metadata": {
        "module": "trade_post"
      }
    }
  ],
  "nextCursor": "opaque-cursor"
}
```

The frontend now maps this endpoint into the existing Signal Feed categories and dashboard summary cards, and browser `queryEvents` no longer drive `/activity` or dashboard Recent Signals. Remaining `queryEvents` call sites are now separate deferred surfaces such as marketplace listing discovery.

The write-action audit should reference this section only to preserve the read-only boundary. It should not widen or revise the `signal-history.v1` contract in this planning file.

## 4. Current structure / ownership discovery model

### Current flow

CivilizationControl currently discovers managed structures through this direct chain path:

1. wallet address
2. wallet-owned `PlayerProfile`
3. shared `Character`
4. `OwnerCap` objects owned by that character
5. authorized shared structures hydrated one by one
6. local grouping of structures by `energy_source_id`

This model is foundational to the current operator shell and should remain the authority boundary.

### What must remain direct chain truth

- wallet-owned `PlayerProfile` resolution
- direct `Character` resolution
- `OwnerCap` discovery
- gate policy dynamic-field reads
- posture dynamic-field reads
- linked-gate lookup
- pre-write EVE coin-object selection
- transaction proof verification

These reads gate write safety, ownership truth, or exact operational state.

### Where EF-Map can enrich

- structure summaries and status rollups after CC already knows which structures belong to the operator
- richer type metadata, labels, and icons
- system/location context
- node/energy relationship summaries
- Recent Signals and event history
- filtered inventory/trade readiness summaries
- character/tribe display enrichment where privacy can be preserved

### Privacy constraints

The safe default is minimal-identifier enrichment:

- CC resolves ownership locally and on-chain first
- CC then asks EF-Map for summaries keyed by already-known assembly IDs or tightly-scoped system IDs
- broad owner, character, tribe, player-base, or recent-activity joins should not be public browser surfaces

EF-Map can easily become an intelligence surface if it exposes owner or tribe joins too broadly.

## 5. Shared backend replacement / enrichment candidates

The tables and services below are currently implemented through the EF-Map repo/runtime, but the framing here is a shared backend serving multiple apps.

| Category | EF-Map tables / surfaces | Current exposure status | API or data contract needed | Safety notes |
|---|---|---|---|---|
| Type taxonomy | `world_api_dlt.type`, Worker `/api/item-types`, World API cron refresh | Partially exposed already | richer public type export or reuse of `/api/item-types` if current fields are enough | Low sensitivity; good browser-safe enrichment |
| Structure summaries | `ef_sui.assemblies`, assembly API, structure snapshot tooling | Exists in DB; partially exposed internally; new CC-safe endpoint needed | `GET /api/civilization-control/assemblies?ids=` style route | Best first slice; filter by known assembly IDs |
| Network-node relationships | `ef_sui.assemblies.energy_source_id`, package-address index tables, assembly API | Exists in DB; not exposed as a CC-safe contract | likely new node-summary or structure-summary fields | Server-side filtering required; avoid exposing unrelated colocated infrastructure |
| Energy / power relationships | `energy_source_id`, status/fuel fields, normalized activity history | Exists in DB; not yet a CC-safe browser contract | structure-summary fields first, node summary later | Good enrichment, but not a replacement for direct on-chain power mutation safety |
| Recent events / signals | `ef_sui.activity_log`, `ef_sui.raw_events`, event emitter, universe-events Worker | Live and now exposed to CivilizationControl through the wallet-scoped `signal-history` route | current `GET /api/civilization-control/signal-history?walletAddress=0x...` contract, with later parity expansion only if operator demand justifies it | High value, medium privacy sensitivity; keep wallet-scoped and read-only |
| Ownership / character / tribe enrichment | `ef_sui.assembly_owners`, `ef_sui.characters`, `world_api_dlt.tribe`, internal APIs | Exists, partially used internally | only filtered enrichment after CC ownership discovery | High privacy sensitivity |
| Inventory / SSU / trade data | `ef_sui.inventory_items`, SSU API, assembly API | Exists; public aggregate surfaces only; details remain protected | filtered SSU-summary or inventory-summary endpoint | Sensitive; do not expose broad market intelligence without scope controls |
| Location / system data | public/static DB assets, `worlds.json`, `versionInfo.json`, `ef_sui.assemblies.solar_system_id` and coordinates | Static surfaces public; live structure location incomplete | static snapshot reuse first, optional enriched structure-summary fields later | Low to medium sensitivity; live coverage is incomplete |

Repo-grounded caveats from the awareness pass still matter:

- `assemblies` has incomplete `solar_system_id` coverage
- many `assemblies` rows still have blank `assembly_type`
- sampled gate-link and gate-access snapshot exports wrote zero rows during inspection
- internal raw service hosts are not the supported integration boundary

## 6. Replacement matrix

| Current CC read path | Current source | Proposed shared-backend source | Integration type | Priority | Risk | Recommendation |
|---|---|---|---|---|---|---|
| wallet -> `PlayerProfile` -> `Character` -> `OwnerCap` discovery | direct Sui JSON-RPC | none | direct chain | High | Low | Keep direct chain |
| structure hydration after ownership discovery | direct Sui JSON-RPC `getObject` per structure | `ef_sui.assemblies` via new shared-backend structure-summary endpoint by assembly IDs | Worker/API | High | Medium | Enrich now, replace selected summary fields later |
| network-node grouping and detail enrichment | local grouping from `energy_source_id` on direct structure reads | `ef_sui.assemblies` structure summaries first, shared-backend node-summary endpoint later | Worker/API | High | Medium | Enrich first, defer full replacement |
| gate policy reads | direct `GateConfig` dynamic fields | none | direct chain | High | Low | Keep direct chain |
| posture reads | direct `GateConfig` dynamic fields | none | direct chain | High | Low | Keep direct chain |
| linked-gate lookup | direct structure read | none | direct chain | Medium | Low | Keep direct chain |
| Recent Signals / activity feed | wallet-scoped shared `signal-history` endpoint on normal routes; legacy browser `queryEvents` helpers remain only on deferred surfaces | `ef_sui.activity_log` via the shipped wallet-scoped shared history endpoint | Worker/API | High | Medium | Shipped for normal routes; keep v1 gaps deferred and do not reopen browser polling |
| listing discovery | event-scan plus `multiGetObjects` | normalized listing or SSU summary endpoint if EF-Map adds one | Worker/API | Medium | Medium | Defer; enrich later |
| SSU inventory browser | direct SSU read plus per-key dynamic-field reads | `ef_sui.inventory_items` via filtered SSU-summary endpoint | Worker/API | Medium | High | Enrich later |
| seller / player display enrichment | direct `fetchPlayerProfile` for names and tribes | filtered character / tribe enrichment or derived display fields | Worker/API | Medium | High | Enrich carefully |
| bundled type catalog | bundled `itemTypes.json` | `world_api_dlt.type` or Worker `/api/item-types` | public snapshot or public API | Medium | Low | Replace or enrich |
| bundled tribe catalog and World API refresh | bundled `tribes.json` plus Stillness World API refresh | `world_api_dlt.tribe` export or route | public snapshot or filtered API | Low to medium | Medium | Enrich or defer |
| bundled solar-system catalog | bundled `solarSystems.json` | shared-backend public static universe assets currently shipped through EF-Map runtime | static snapshot | Low | Low | Enrich |
| EVE coin-object discovery for payable PTBs | direct Sui JSON-RPC | none | direct chain | High | Low | Keep direct chain |
| tx proof hover | direct Sui JSON-RPC `getTransactionBlock` | none | direct chain | Medium | Low | Keep direct chain |
| direct browser access to the shared backend DB or internal hosts | not used today | raw Postgres / raw service hosts | rejected | High | High | Reject |

Decision labels behind the matrix:

- Replace: Recent Signals is already replaced on normal routes through the wallet-scoped shared endpoint; keep browser event scans only on separate deferred surfaces
- Enrich: structure summaries, network-node relationships, taxonomy, tribe/system metadata, inventory rollups
- Keep direct chain: ownership, policy, posture, linked-gate, EVE coin discovery, tx proof
- Defer: listings, inventory, broader owner/tribe enrichment until the safer first slice proves the boundary
- Reject: direct browser access to EF-Map DB or raw internal service hosts

## 7. Recommended first slice

### Chosen slice

Choose exactly one first slice:

**Shared-backend read-only structure-summary endpoint by assembly IDs, currently to be implemented in the EF-Map repo/runtime.**

### Why this first

- It touches the broadest operator surface because structures are the root of the dashboard, lists, node views, topology, and detail screens.
- It keeps the safe ownership boundary: CC still discovers owned structures directly on-chain, then asks the shared backend only for enrichment by known IDs.
- It avoids the harder semantics problem of event normalization or node-level aggregation as a first step.
- It is easy to roll back because CC can fall back to its current direct chain structure reads.

### What it proves

- The shared backend can expose a CC-safe, browser-consumable contract without exposing DB credentials or raw internal hosts.
- CC can enrich its read path through a provider seam without changing write authority, package IDs, or Move logic.
- The integration boundary can be previewed and validated independently of broader event or websocket work.

### Proposed data contract

Minimal first payload, keyed by assembly IDs already known to CC:

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
- optional `typeName` if EF-Map wants to join `world_api_dlt.type` server-side

This is enough to prove UI value without exposing owner or tribe joins.

### Likely shared-backend source files later (currently in the EF-Map repo)

- `eve-frontier-map/_worker.js` or `worker.js`
- optionally `tools/assembly-api/api_wrapper_v2.py` if the Worker delegates to an internal helper
- optionally `tools/snapshot-exporter/sui_structure_snapshot_exporter.js` only if the backend serves a snapshot rather than a live filtered endpoint

### Likely CC files later

- `src/lib/efMapClient.ts`
- `src/hooks/useAssetDiscovery.ts`
- `src/lib/suiReader.ts`
- `src/types/domain.ts`

### Preview validation plan

1. add the shared-backend route in preview only
2. prove it returns only the agreed structure-summary fields
3. point a CC preview or local dev build at the preview route or a CC proxy
4. compare a few owned structures against current direct chain reads
5. confirm no browser-visible secrets, no raw internal host access, and correct fallback behavior when the endpoint is unavailable

### Rollback / no-op behavior

- If the endpoint fails or returns stale data, CC keeps using its current direct chain structure read path.
- No on-chain IDs, write flows, sponsorship behavior, or Move contracts need to change for rollback.

## 8. Push / realtime model options

The user goal here is near-instant updates without relying on browser-side fullnode polling when the indexer can already see the data.

### Options

| Model | Fit | Benefits | Risks / costs | Recommendation |
|---|---|---|---|---|
| Browser polling a filtered shared-backend endpoint | Best near-term | Reuses current CC polling model, no websocket contract needed, easy rollback | Still polling, but against a cheaper filtered source | Recommended near-term |
| Server-sent events | Possible mid-term | Simpler than WebSocket for one-way push | Needs stable filtered subscription contract and reconnect semantics | Consider after a filtered poll endpoint exists |
| WebSocket filtered by known structure IDs | Best long-term for realtime | Near-instant push, lowest browser poll cost | Requires stable auth, subscription, filtering, and backpressure rules | Recommended long-term |
| CC Worker subscription / proxy | Good fallback | CC can hold upstream secrets and normalize responses | Adds service hop and ownership split | Use only if the shared backend cannot expose a CC-safe route directly |
| Shared backend broadcasting everything and CC filtering client-side | Bad fit | Minimal server work | Leaks intelligence, high payload volume, unstable privacy boundary | Reject |
| Shared backend server-side filtering by assembly IDs / character / tribe | Strong | Aligns with owned-structure scoping and privacy controls | Requires explicit contract design | Prefer assembly-ID filtering first |

### Recommendation

Safest near-term model:

- browser polling of a filtered shared-backend endpoint keyed by already-known assembly IDs
- keep the current 30-second cadence initially
- use the same `SignalEvent` shape or a close server-side equivalent so CC can swap the provider without redesigning the UI

Safest long-term model:

- filtered Worker-managed realtime subscriptions keyed by known assembly IDs
- either SSE or WebSocket can work, but the key requirement is server-side filtering before data reaches the browser

What not to do:

- do not have EF-Map broadcast all events and let CC filter client-side
- do not make walletless in-game browser clients depend on raw websocket auth flows that assume a normal external wallet session

## 9. Cloudflare Tunnel / VPS access model

- Cloudflare Tunnel and raw internal VPS service URLs are appropriate for server-side Workers, shared-backend services, and bounded operator tooling.
- They should not become direct browser dependencies for CivilizationControl.
- If CC needs data from a service behind the shared backend's tunnel or internal hostname, the safe shape is:
  - shared-backend Worker route exposed on a public controlled boundary, or
  - CC Worker proxy that calls EF-Map server-side and returns a minimal shaped response

Ownership split should remain:

- the shared backend runtime currently lives in the EF-Map repo/VPS because that is where the backend source and operational knowledge live today
- the EF-Map repo is therefore the current backend source repo for additive endpoint work
- CC repo owns read-provider selection, client consumption, UI fallback behavior, and any optional CC-specific proxy if the backend cannot expose a direct browser-safe route
- backend code should be changed in source control, not by hand on the VPS

## 10. Security / privacy rules

- no DB credentials in the browser
- no bearer tokens in `VITE_*`
- no direct browser use of raw internal shared-backend service hosts
- even if the shared backend already surfaces some broad information publicly, CC-facing endpoints should avoid becoming a broad intelligence surface tied to a signed-in operator session
- prefer queries keyed by assembly IDs already known to CC after on-chain ownership discovery
- treat broader owner / character / tribe joins as privileged and privacy-sensitive
- browser network calls from CC should request only the minimum structure or enrichment data needed for the current user's UI
- do not expose unfiltered player or tribe intelligence as public APIs or global websocket broadcasts
- require explicit CORS policy, response shaping, and rate limiting on any browser-facing shared-backend route
- if privileged data is ever exposed later, require wallet, character, or other scoped proof in addition to structure-ID filtering
- if a future endpoint accepts solar system IDs, structure IDs, character IDs, or tribe IDs, document whether that query could reveal sensitive operational context and whether it should be authenticated, rate-limited, or proxied

## 11. Implementation sequence

### Phase 1: Shared backend endpoint contract

- define the structure-summary response shape
- define filtering by assembly IDs
- define CORS and rate-limit behavior

### Phase 2: Shared backend preview endpoint

- implement preview-only route in the current backend source repo
- confirm read-only behavior and minimal payload

### Phase 3: CC provider / client wrapper

- add a shared-backend client seam in CC without changing default behavior yet
- preserve direct chain fallback

### Phase 4: CC preview UI enrichment

- enrich asset discovery or node/detail UI from the EF-Map route in preview
- compare results against direct chain reads

### Phase 5: Optional realtime / push

- add a filtered Recent Signals endpoint first
- later add SSE or WebSocket only after filtering and auth are stable

### Phase 6: Production rollout

- switch the route from preview to production only after endpoint correctness, fallback behavior, and privacy boundaries are proven

## 12. Risks and open questions

- indexer schema drift between normalized `ef_sui` tables and lower-level package-address schemas
- freshness and staleness, especially if the indexer or exporter lags
- incomplete `solar_system_id` and `assembly_type` coverage in `ef_sui.assemblies`
- privacy risk if owner, character, tribe, or activity joins are exposed too broadly
- CORS and auth policy for any browser-facing route
- endpoint ownership: shared-backend route in the current backend source repo versus CC proxy
- shared-backend uptime becoming a CC read dependency
- accidental Cloudflare Tunnel or internal-host exposure
- interaction with future World v2 / MVR changes and how those affect runtime IDs or indexed schemas

## 13. Recommended next prompt

"In the shared EVE Frontier backend, currently source-controlled and deployed through the EF-Map repo/runtime, design one preview-only read-only structure-summary endpoint for CivilizationControl keyed by assembly IDs, returning only the minimal fields listed in the replacement plan, with browser-safe CORS/rate-limit rules and no raw internal host exposure. Do not wire CivilizationControl to it yet."