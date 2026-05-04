# Node Control Write-Action Audit - 2026-05-04

## 1. Executive summary

This is a docs-only audit of Node Control write actions, sponsor-policy gaps, signal-parity boundaries, and package-update pressure on `docs/node-control-write-action-audit`. It does not implement runtime code, Move changes, package updates, sponsor-worker deploys, EF-Map changes, or production deploys.

> Status update (2026-05-04, local Node Power State controls): the previously deferred local Node Power State slice is now implemented on `feat/network-node-offline-proof` as browser-local/operator UX only. Node Control adds four local preset buttons, `Save power preset`, child-only `Take all offline`, child-only `Bring all online`, manual icon dragging, a `Reset layout` map control, and a calm `Power usage unavailable` readout. Bulk and preset apply reuse the existing child structure power write path and grouped batch PTBs; they affect only attached child structures for the selected network node, include hidden-from-map children, exclude the network-node anchor, exclude other nodes/unlinked structures, and pass per-child reconciliation targets for bounded overlay/refetch. Presets are localStorage/sessionStorage only under `cc:node-power-presets:v1:<scopeKey>:<nodeCanonicalId>`, scoped by character ID then wallet then session fallback, and store desired child online/offline state by canonical child identity. Manual layout is stored separately under `cc:node-drilldown:layout:v1:<scopeKey>:<nodeCanonicalId>`. Exact `used / 1000 GJ` metering and deterministic over-cap blocking are deferred because current frontend/operator-inventory data does not expose child `energyRequiredGJ` or node reserved/production energy fields; online bulk/preset operations require an app confirmation when capacity cannot be preverified, while chain execution remains final enforcement. Validation passed across typecheck, build, requested deterministic probes, new preset/layout probes, sponsor policy/tests/typecheck, and feature preview smoke. Fresh preview proof is `https://70c1585a.civilizationcontrol.pages.dev` with alias `https://feat-network-node-offline-pr.civilizationcontrol.pages.dev`; served-bundle scanning found the repo sponsor URL plus `https://ef-map.com` and no stale sponsor, exact-case `Authorization`, or checked secret/header markers. No EF-Map, VPS, Move, package-ID, on-chain preset storage, strategic posture preset, Signal Feed parity, marketplace, broad polling, browser `queryEvents`, production deploy, or merge scope changed.

> Status update (2026-05-04, network-node offline truth-source correction): human wallet smoke on `feat/network-node-offline-proof` proved a stale/wrong read-model case, not a missing PTB case: the preview rendered a network node as `Online`, then chain rejected `Take offline` with `ENetworkNodeOffline`, which means `world::network_node::offline` saw the node already offline. The rendered status source is operator-inventory `networkNodes[].node.status` flowing through `nodeGroups[].node.status` into `/nodes`, node detail, and Node Control; unknown or missing status maps to neutral, not online, so a raw `online` row against an offline Move precondition points at stale indexed read data. The corrective pass now treats `ENetworkNodeOffline` as authoritative already-offline evidence, applies digest-null offline overlays plus bounded refetch, keeps stale online operator inventory from immediately clearing that correction, and only exposes network-node power actions for exact `online` or `offline` status. Sponsored execution now requests effects and throws on Move failure so a failed sponsored dry path cannot look successful. Selection Inspector `Freshness` is renamed to `Last Seen` because the displayed value is `lastUpdated ?? fetchedAt`, a mixed row-observation timestamp rather than a freshness guarantee. Validation passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the preserved unrelated `Move.lock` LF/CRLF warning; `npx tsx scripts/check-network-node-offline-proof.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-structure-write-reconciliation.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npm run sponsor:validate-policy`; `npm run sponsor:test`; and `npm run sponsor:typecheck`. Fresh preview proof is `https://55d182a9.civilizationcontrol.pages.dev` with alias `https://feat-network-node-offline-pr-3px2.civilizationcontrol.pages.dev`; route smoke passed on `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; served-bundle scanning across 12 JS assets found the expected sponsor, EF-Map, Sui RPC, already-offline copy, and `Last Seen`, and found no stale sponsor or checked secret/header markers. No EF-Map, VPS, Move, package, vendor, production, browser `queryEvents`, broad polling, preset, marketplace, or Signal Feed parity scope changed.

> Status update (2026-05-04, live generic classification): human wallet testing found the real remaining generic attached-assembly gap after the broad synthetic proof pass: global Turrets and Storages were actionable, live Node Control Turrets and Storages were actionable, but Mini Printer, Standard Refinery, Assembler, and Mini Berth rows still exposed only `Hide from Node View`. A browser-origin operator-inventory fetch for wallet `0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62` returned 9 generic attached rows with `assemblyId: null`, object IDs, OwnerCap IDs, and node context; power and rename were marked candidate but carried stale `frontend_action_not_implemented` and no nested `requiredIds`. Builder audit confirmed `assemblyId` is not required for generic `world::assembly::{online,offline,update_metadata_name}` calls. The fix is therefore frontend projection only: Node Control now derives generic `assembly` verified targets from row-level object ID, OwnerCap ID, and selected-node/energy-source context when nested `requiredIds` are absent, while rows missing object ID, OwnerCap ID, or node context remain read-only. Deterministic proof now covers the exact live shape in `scripts/check-operator-inventory-mapping.mts` and the full node-local family action matrix in `scripts/check-node-control-action-projection.mts`. Fresh preview proof is now `https://0c608a44.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par.civilizationcontrol.pages.dev`; route smoke passed on `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; deployed lab smoke on `Printer Gamma` showed `Power and rename available` plus `Hide from Node View`, `Bring Online`, and `Rename Assembly`; served-bundle scanning found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; and integrated-browser wallet smoke again remained unavailable because the connect modal only exposed `Slush` and immediately returned `Connection failed`. EF-Map, Move contracts, package IDs, network-node offline, presets, marketplace/revenue work, signal-history parity, broad polling, and production deploy remain unchanged/deferred.

> Status update (2026-05-04, zero-package action parity): the first zero-package action slice is now implemented on `feat/zero-package-action-parity`. CivilizationControl now exposes the current four-family action set through the shared `StructureActionContextMenu` plus `StructureRenameDialog`: `Bring Online` / `Take Offline` for gate, storage, and turret; `Bring Online` for network nodes only; and on-chain rename for gate, storage, turret, and network node. The same shared menu now appears in live `Node Control`, `/dev/node-drilldown-lab`, global structure lists via row right-click, and the current detail screens via explicit `Actions` buttons. Successful writes now route through shared post-write refresh that refetches operator inventory, asset discovery, selected-node `node-assemblies` fallback, and active signal-history queries when needed. Network-node `offline`, presets, and signal-history parity expansion remain deferred.

> Status update (2026-05-04, corrective follow-up): human wallet-connected preview smoke on the first zero-package preview found one remaining parity gap and one read-freshness gap. The final corrective pass proved both were frontend-owned seams, not missing package or backend behavior. Live Node Control backend-membership rows were rebuilding action authority from thinner node-membership data while global lists were acting on fully adapted `Structure` rows, so rows could still degrade to hide-only when selected-node lookup omitted IDs even though the operator-inventory structure already had a valid supported target. Unsupported/future-supported rows also still rendered a misleading disabled segmented shell, and hidden supported rows in row mode suppressed the shared power control. Finally, successful rename/power writes could snap back because the temporary overlay cleared on selected-node lookup confirmation before the operator-inventory read model confirmed the new state. The final pass now recovers `verifiedTarget` from operator-inventory structures while preserving direct-chain truth, centralizes node-local power state and menu projection across live dashboard plus dev lab, keeps unsupported rows calm and status-only, keeps hidden supported rows on the shared power/unhide path, and requires operator-inventory confirmation before clearing rename/power overlays. Fresh preview proof is now `https://83603ca1.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; route smoke passed on `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; dev-lab row-menu smoke exposed `Hide from Node View`, `Take Offline`, and `Rename Assembly` for `Storage Alpha`, `Unhide`, `Take Offline`, and `Rename Assembly` for hidden `Gate Epsilon`, and only `Hide from Node View` for unsupported `Printer Gamma`; served-bundle scanning across 12 deployed JS assets found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; and an integrated-browser wallet smoke attempt was made but no usable wallet-backed session was available because the connect modal only exposed `Slush` and immediately returned `Connection failed`. That corrective pass closes Phase 1A only: Phase 1A is the shipped four-family parity boundary, while Phase 1B widens Node Control to all governed attached-assembly families already supported by generic `world::assembly` power and rename calls. Network-node offline, presets, marketplace/revenue work, and signal-history parity expansion remain deferred.

> Status update (2026-05-04, Phase 1B widening): the generic attached-assembly widening slice is now implemented on `feat/zero-package-action-parity` without reopening EF-Map, package, vendor, or production scope. The frontend now uses `StructureActionTargetType = StructureType | "assembly"` so executable targets no longer depend on the older four-family `StructureType` union, `src/lib/operatorInventoryClient.ts` plus `src/lib/nodeDrilldownModel.ts` now normalize `printer`, `refinery`, `assembler`, `berth`, `relay`, `nursery`, `nest`, and `shelter` rows into the generic `assembly` action target when indexed `requiredIds` plus `ownerCapId` resolve cleanly, and the shared power/rename builders now emit `world::assembly::{online,offline,update_metadata_name}` PTBs under that target. Sponsor policy, worker validation, and deterministic probes now mirror those generic assembly calls under both world package IDs. Validation passed: `sui client active-env`; `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; `npm run sponsor:validate-policy`; `npm run sponsor:test`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; `npm run typecheck`; `npm run build`; and `git diff --check` on the touched files. Fresh preview proof is now `https://55fdaf7c.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; route smoke passed on `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; unique and alias HTML both resolved `assets/index-DId4iWQ2.js`; served-bundle scanning found `civilizationcontrol-sponsor` in `App-CuXhOtYo.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-FvrsLQZR.js` and `SmartObjectProvider-CywV33-9.js`, and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, or `X-API-Key`; and integrated-browser wallet smoke remained unavailable because no usable wallet-backed session was present.

> Status update (2026-05-04, proof completion): the widening branch now has broad proof instead of a narrow printer-only proof. Fresh human review showed most `/dev/node-drilldown-lab` scenarios were still synthetic hide-only rows, so this follow-up widened the synthetic fixture and model lane, rewrote the broad lab scenarios to carry real authority-bearing inputs, added `scripts/check-node-drilldown-lab-action-matrix.mts`, widened `scripts/check-node-drilldown-reconciliation.mts` plus `scripts/check-structure-action-support.mts`, cleaned operator-facing authority wording, and removed the old fixed `196px` menu clamp through shared `src/lib/contextMenuPositioning.ts`. Full local validation passed: `sui client active-env`; `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; `npm run sponsor:validate-policy`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-signal-history-mapping.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-structure-write-reconciliation.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; `npx tsx scripts/check-node-drilldown-lab-action-matrix.mts`; `npm run typecheck`; `npm run build`; and `git diff --check`. Fresh preview proof is now `https://8be950ce.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; route smoke passed on `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; unique and alias HTML both resolved `assets/index-1CYcUqmV.js`; served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` plus `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` in `App-CfzGo-P-.js` and `SmartObjectProvider-COBxg4GX.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-BIXIVuD1.js` and `SmartObjectProvider-COBxg4GX.js`, found `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-COBxg4GX.js` and `suiRpcClient-B6rDdf72.js`, found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`, and found only lowercase `authorization` user-facing copy in `App-CfzGo-P-.js` and `nodeDrilldownMenuItems-BIXIVuD1.js`; integrated-browser wallet smoke again remained unavailable because the connect modal exposed only `Slush` and immediately returned `Connection failed`. The remaining frontend boundary is narrower: Node Control and backend-membership generic assembly actions are now broadly proven, but the older compatible-`Structure` adaptation lane in `src/lib/operatorInventoryAdapter.ts` still only models the older four-family surface outside that node-local or backend-membership path.

> Status update (2026-05-04, Signal Feed parity closeout): human wallet closeout on `feat/zero-package-action-parity` showed that app-originated rename and power writes now update Dashboard and Node Control immediately, but do not currently surface in `/activity`. That is a Signal Feed parity gap only. Do not reopen browser `queryEvents` and do not implement history expansion on this branch; the follow-up is to determine whether EF-Map signal-history indexes those exact rows and CivilizationControl filters them out, or whether EF-Map needs additive signal-history coverage.

> Status update (2026-05-04, final closeout polish): the final UI/docs polish fixed the right-click menu width regression and the short Attached Structures panel without changing action logic. Shared action menus now shrink-wrap with a measured viewport clamp instead of wide/fixed row geometry; fresh preview smoke measured current three-item menus at about `156px` with balanced `10px` left/right padding around the longest labels. The dense Attached Structures panel now uses a taller desktop cap and preserved internal scrolling; Turret Stress Test smoke measured a `698px` list viewport. Validation passed for the full requested frontend/probe/sponsor gate set, and the final preview is `https://355b5c25.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`. Served-bundle scanning found the expected repo-owned sponsor URL, `https://ef-map.com`, and no forbidden secret/header markers. Wallet smoke remained unavailable because the only exposed connector (`Slush`) returned `Connection failed`.

> Status update (2026-05-04, network-node offline proof branch): the previously deferred node-offline seam is now proven and minimally implemented on `feat/network-node-offline-proof` without any package or Move change. Current Stillness runtime already exposes `world::network_node::offline`, but it returns `OfflineAssemblies` and therefore must be paired in the same PTB with the appropriate connected-child helper calls plus `network_node::destroy_offline_assemblies`; a bare single-call PTB is not sufficient. CivilizationControl builds that PTB directly, using the live Stillness `FuelConfig` object `0x4fcf28a9be750d242bc5d2f324429e31176faecb5b84f0af7dff3a2a6e243550`, and sponsor policy mirrors the full helper-call sequence under both world package IDs. Human wallet smoke proved the dedicated `/nodes` row-menu transaction worked, then the focused branch repair closed the remaining UI seams: network-node offline now uses an app-styled confirmation dialog instead of a browser-native popup, Node Control selected-node self menus expose `Take offline` / `Bring online` plus `Rename Node`, and node-offline reconciliation projects the on-chain child consequence locally so stale operator-inventory rows cannot show online children under a newly offline node. Node-online remains node-only.

> Status update (2026-05-04, network-node offline corrective validation): the fresh corrective preview is `https://e90e9431.civilizationcontrol.pages.dev` with alias `https://feat-network-node-offline-pr-3px2.civilizationcontrol.pages.dev`. Validation passed: `npm run typecheck`; `npm run build`; `npx tsx scripts/check-network-node-offline-proof.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-structure-write-reconciliation.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npm run sponsor:validate-policy`; `npm run sponsor:test`; `npm run sponsor:typecheck`; `sui client active-env` (`testnet_stillness`); `sui move build --path contracts/civilization_control`; and `sui move test --path contracts/civilization_control`. Route smoke passed on unique and alias `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`, all resolving `/assets/index-BHriBt8c.js`; served-bundle scanning found the repo sponsor URL, `https://ef-map.com`, app confirmation copy, and node rename copy, with no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, exact-case `Authorization`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`. Deployed lab smoke confirmed node self menu labels, offline child cascade, node-online child boundary, and unchanged child row menus.

Current runtime truth is narrower and clearer than some older planning text:

- individual `online` / `offline` control is already real for gates, storage units, and turrets in the web app
- dedicated network-node list/detail surfaces and the selected network-node self surface in Node Control now support both `Bring online` and proof-gated `Take offline`
- metadata rename is already supported upstream for gates, storage units, turrets, generic assemblies, and network nodes, and the current app now exposes it for the shipped four world-family targets plus generic attached-assembly rows that resolve to one supported `assembly` candidate with the required IDs
- generic `world::assembly::{online,offline,update_metadata_name}` entrypoints already exist upstream for displayed attached-assembly families beyond gate, storage, and turret, and the frontend now models those calls directly through a separate `assembly` action target; remaining generic-family gaps are rows that still lack one indexed candidate with the required IDs, while network-node offline hot-potato handling is implemented in the dedicated proof branch
- the current sponsor allowlist remains the main near-term gating seam for new sponsored actions; the tracked repo policy now covers generic `assembly` rename plus power and the full dedicated network-node offline PTB in addition to the shipped power and authorization flows, while revoke and freeze remain outside the allowlist
- signal-history v1 intentionally does not restore every legacy governance and revenue family; that parity backlog is separate from the first Node Control write slice

Package-update decision:

> Do not approve any CivilizationControl or world package update until a required operator action is proven impossible with the current Stillness runtime calls, current CC posture or policy surfaces, and sponsor-policy changes alone.

Zero-package feasibility statement:

> Phase 1A and Phase 1B are now both implemented without a package update: gate, storage, and turret power, network-node online/offline on the dedicated proof branch, four-family rename, and generic attached-assembly power/rename now ride the existing zero-package runtime calls. Remaining deferred scope is extension freeze or revoke, marketplace settlement surfaces, presets, and signal-history parity expansion.

## 2. Scope, non-goals, and confirmed facts

This audit assumes the following repo-grounded facts and keeps them fixed:

- normal Signal Feed routes already use the wallet-scoped shared `signal-history` endpoint; browser `queryEvents` must not return as the normal route contract
- Node Control is already operator-inventory-first for grouped node display and authority hints
- current frontend power rails already exist for gate, storage, turret, and network-node online flows
- successful structure writes now use a shared refresh seam that refetches operator inventory, asset discovery, selected-node `node-assemblies` fallback, and active signal history as needed instead of waiting for a manual browser reload
- current CC posture switching is gate-keyed and turret-doctrine-aware, but it is not a general-purpose node preset system
- shared-backend data remains additive and read-only; wallet and chain remain authoritative for writes
- package IDs and runtime or original split for this audit come from `config/chain/stillness.ts`

Out of scope for this pass:

- Move edits
- package publishes or package ID updates
- sponsor-worker policy implementation or deploy
- EF-Map or shared-backend schema changes
- runtime PTB implementation
- production deploys

## 3. Current repo-state anchors

| Surface | Current anchor | Why it matters |
|---|---|---|
| Stillness runtime IDs | `config/chain/stillness.ts` | Current package targets outrank older planning text |
| Sponsor allowlist | `config/sponsorship/civilizationControlPolicy.ts` | Determines what a new sponsored write can do without worker changes |
| Shipped structure power builder | `src/lib/structurePowerTx.ts` | Proves the current zero-package power PTB path, including the generic `assembly` action target |
| Shipped structure power hook | `src/hooks/useStructurePower.ts` | Proves current execution and shared post-write refresh behavior |
| Shipped structure rename builder | `src/lib/structureMetadataTx.ts` | Proves the current zero-package rename PTB path, including the generic `assembly` action target |
| Shipped structure rename hook | `src/hooks/useStructureRename.ts` | Proves current rename execution and post-write refresh behavior |
| Node-local action authority | `src/lib/nodeDrilldownActionAuthority.ts` | Proves Node Control only treats verified power actions as shipped today |
| Node-local model | `src/lib/nodeDrilldownModel.ts` | Proves how specific families and generic `assembly`-backed families map into node-local power support |
| Rename action hints | `src/types/domain.ts` | Proves operator inventory already models both `power` and `rename` action candidates |
| Network-node detail surface | `src/screens/NetworkNodeDetailScreen.tsx` | Confirms dedicated node detail now supports both online and proof-gated offline |
| Posture transaction builder | `src/lib/postureSwitchTx.ts` | Proves posture changes per-gate posture state plus turret doctrine only |
| Shared signal history contract | `src/lib/signalHistoryClient.ts` | Defines current event-parity boundary for normal routes |

## 4. Stillness runtime and policy anchor matrix

| Surface | Source of truth | Current state | Why it matters for this audit | Change required now? |
|---|---|---|---|---|
| World runtime package | `config/chain/stillness.ts` | Explicit `WORLD_RUNTIME_PACKAGE_ID` | Current runtime entry points for power and authorization | No |
| World original package | `config/chain/stillness.ts` | Explicit `WORLD_ORIGINAL_PACKAGE_ID` | Current type-origin surface for exact type tags | No |
| CC package | `config/chain/stillness.ts` | Explicit `CC_PACKAGE_ID` / `CC_ORIGINAL_PACKAGE_ID` | Current posture, gate policy, and trade-post surfaces | No |
| Gate config object | `config/chain/stillness.ts` | Explicit `GATE_CONFIG_ID` | Current per-gate posture state and gate policy reads or writes | No |
| Energy config object | `config/chain/stillness.ts` | Explicit `ENERGY_CONFIG_ID` | Required by current power builders | No |
| Sponsor policy | `config/sponsorship/civilizationControlPolicy.ts` | Covers shipped authorize, URL, power, rename, gate-policy preset, treasury, `posture.set_posture`, and the full dedicated network-node offline PTB, but not revoke or freeze | Distinguishes existing sponsored posture or policy flows from the still-missing write actions | Network-node offline allowlist now updated in the proof branch |
| Signal Feed source | `src/lib/signalHistoryClient.ts` | `signal-history.v1` for normal routes | Read-only parity backlog must stay separate | No |

## 5. Area A - capability matrix across structure families and actions

### 5.1 Current action surface matrix

| Action | Structure family | Indexed hint today | Current frontend seam | Sponsor allowlist | Verified upstream call | Package gap? | Audit decision |
|---|---|---|---|---|---|---|---|
| Individual `online` / `offline` | Gate | `actionCandidate.actions.power` and current direct-chain structure model | Already shipped through `useStructurePower(...)`, detail screens, and Node Control row or menu actions | Yes | `world::gate::{online,offline}` | No | Keep in the zero-package slice |
| Individual `online` / `offline` | Storage / TradePost | `actionCandidate.actions.power` and current direct-chain structure model | Already shipped through `useStructurePower(...)`, detail screens, and Node Control row or menu actions | Yes | `world::storage_unit::{online,offline}` | No | Keep in the zero-package slice |
| Individual `online` / `offline` | Turret | `actionCandidate.actions.power` and current direct-chain structure model | Already shipped through `useStructurePower(...)`, detail screens, and Node Control row or menu actions | Yes | `world::turret::{online,offline}` | No | Keep in the zero-package slice |
| Individual `online` / `offline` | Generic attached assemblies (`printer`, `refinery`, `assembler`, `berth`, `relay`, `nursery`, `nest`, `shelter`) | Indexed `actionCandidate.actions.power` plus normalized `requiredIds.structureType = "assembly"` | Now shipped through the shared power path when one indexed candidate resolves with the required IDs | Yes | `world::assembly::{online,offline}` | No | Implemented in the zero-package widening slice |
| Individual `online` | Network Node | Current detail and list surfaces use direct-chain structure model, not node-local row power mapping | Already shipped through `useStructurePower(...)` on node detail or list | Yes | `world::network_node::online` | No | Keep in the zero-package slice |
| Individual `offline` | Network Node | Dedicated node list/detail surfaces and the selected Node Control node self surface now resolve connected-child identity from operator inventory or `node-assemblies` fallback before exposing the action | Shipped on dedicated `/nodes` row menus, node detail `Actions`, and selected-node self menus in Node Control | Yes | `world::network_node::offline` plus same-PTB `offline_connected_*` handling and `destroy_offline_assemblies` | No | Implemented in the separate proof branch with app modal confirmation and node-plus-child local overlay |
| Node-local `Take all offline` / `Bring all online` | Child structures attached to the selected network node only | Current node-local verified child action authority plus current child status | Implemented through grouped child batch calls; hidden-from-map children are included, network-node self is excluded | Uses existing child power allowlist | Existing child `online` / `offline` calls grouped by action target type | No | Implemented as local Node Control orchestration; no on-chain preset or node-self power cascade |
| Local Node Power State presets | Child structures attached to the selected network node only | Browser-local saved desired child online/offline state by canonical child identity | Four local slots plus diff-only apply; missing old children ignored, new children unchanged | Uses existing child power allowlist only when apply produces writes | Existing child `online` / `offline` calls grouped by action target type | No | Implemented as localStorage/sessionStorage only; no backend or on-chain storage |
| Manual Node Control icon layout | Node Control map icons | Browser-local logical percentage positions by canonical child identity | Drag to set local override; `Reset layout` clears only layout overrides | N/A | N/A | No | Implemented as local UI persistence, separate from power presets and hide/unhide state |
| Rename / edit name | Gate, Storage, Turret, Network Node, and generic attached assemblies with one supported indexed candidate | `IndexedActionCandidate.actions.rename` exists in the current type model and now normalizes generic family targets to `assembly` | Now wired through the shared action menu in `Node Control`, `/dev/node-drilldown-lab`, list-row right-click, and detail-screen `Actions` buttons | Yes | `update_metadata_name` exists in family-specific modules and generic assembly or node metadata surfaces | No | Implemented in the zero-package slice plus widening slice |
| Update metadata URL | Gate, Storage | Current detail-screen product already treats URL as a separate governance seam | Already shipped on current gate or storage flows | Yes | `update_metadata_url` | No | Leave separate from Node Control write audit |
| Authorize extension | Gate, Storage, Turret | Not a node-local row action; already modeled elsewhere | Already shipped on detail surfaces where relevant | Yes | `authorize_extension` | No | Leave separate from first Node Control slice |
| Revoke extension | Gate, Storage, Turret | No node-local candidate today | Not wired | No | Revoke functions exist upstream | No | Document only; do not implement yet |
| Freeze extension config | Gate, Storage, Turret | No node-local candidate today | Not wired | No | Freeze functions and frozen event exist upstream | No | Document only; do not implement yet |
| Set posture | Gate-backed posture, posture-selected gate preset enforcement, plus turret doctrine swap | Separate macro control; not modeled as node-local power or rename | Already shipped in dashboard posture control | Yes for current posture and gate-policy writes | `cc::posture::set_posture`, `cc::gate_control::{set_policy_preset,request_jump_permit*}`, plus turret `authorize_extension` | No | Keep separate from Node Control actions, but do not misclassify it as only a label swap |

### 5.2 Operator-inventory family coverage boundary

| Family shown in node taxonomy | Displayed today | Current frontend execution type | Current `actionCandidate` fit | Verified runtime surface | First-slice status |
|---|---|---|---|---|---|
| `networkNode` | Yes | `network_node` is in the current `StructureType` union | Dedicated node list/detail surfaces and selected Node Control node self menus now support proof-gated offline | Network-node-specific power and metadata calls exist | Dedicated list/detail surfaces and selected-node self menus now support `online` plus proof-gated `offline`; child rows still use their own family action lanes |
| `gate` | Yes | `gate` | Full for current power flow | Gate-specific power and metadata calls exist | Zero-package supported |
| `tradePost` / storage | Yes | `storage_unit` | Full for current power flow | Storage-specific power and metadata calls exist | Zero-package supported |
| `turret` | Yes | `turret` | Full for current power flow | Turret-specific power and metadata calls exist | Zero-package supported |
| `printer` | Yes | `assembly` via `StructureActionTargetType` | Indexed model now maps supported generic candidates into the shared action-target lane when required IDs resolve | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `refinery` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `assembler` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `berth` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `relay` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `nursery` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `nest` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |
| `shelter` | Yes | `assembly` via `StructureActionTargetType` | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Zero-package supported in the widened slice |

Current repo truth for Node Control is now broader than the original four-family ceiling: gate, storage, and turret families still use their specific world targets; network-node online remains handled outside the node-local row builder while offline stays deferred; and the generic attached-assembly families now share one explicit `assembly` action target whenever indexed action candidates resolve to one supported target with the required IDs. Rows that still lack a unique indexed candidate or the required IDs remain read-only by design rather than reopening package or backend scope.

## 6. Area B - Commercial/Defensive posture clarification

### 6.1 Original product expectation

The original intended CivilizationControl posture model was broader than a cosmetic label:

- `Commercial` meant an operator-authored gate ruleset for normal traffic and toll-taking
- `Defensive` meant a stricter operator-authored gate ruleset for denial or allowlist enforcement
- the same posture switch was expected to change turret doctrine at the same time
- the product expectation was one operator action that changed which gate preset was enforced and which turret extension was active

That expectation was not only UI fiction. The current package and gate-detail product surface still preserve the underlying model:

- gate detail already authors separate `Commercial` and `Defense` presets through the gate policy composer
- gate permit issuance already reads the active posture and selects the matching per-gate preset at runtime

### 6.2 What is actually shipped today

Current runtime truth is two-layered, and the previous audit compressed those layers too far:

| Layer | Shipped truth | What it does not do |
|---|---|---|
| Posture PTB write scope | The current PTB calls `cc::posture::set_posture` for each provided gate and world `turret::authorize_extension` for each provided turret | It does not rewrite gate presets, toll values, or treasury state during the switch |
| Gate policy enforcement effect | `request_jump_permit` reads `posture::current_posture(config, gate_id)` and selects `PolicyPresetKey { gate_id, mode }` for permit enforcement | It does not mean posture writes a second copy of policy data at switch time |

So the correct reading is:

- the switch transaction is narrower than the full runtime effect
- current posture switching does **not** batch-mutate gate policy or toll config
- current posture switching **does** change which already-authored gate preset is enforced, because the permit path reads the new mode dynamically
- turret doctrine switching still happens in the same PTB via extension authorization

### 6.3 Primary question answered

The original two-ruleset gate behavior is implemented in the current CC package and current gate-detail UI. What regressed is the documentation and the macro-control ergonomics, not the underlying permit path.

More precisely:

- separate `Commercial` and `Defense` gate presets are stored on-chain per gate
- posture state is also stored on-chain per gate
- permit issuance selects the active preset by reading current posture at call time
- the switch PTB only flips posture state and turret doctrine, which is why looking only at `postureSwitchTx.ts` can make the runtime effect appear narrower than it is

This means the broader gate-rule switching behavior is **implemented**, not merely historical intent.

### 6.4 Gate-present behavior

If a user has gates and has authored both presets, posture switch still applies the intended gate posture behavior today.

Explicitly:

- the switch does not rewrite policy entries or toll values in the PTB
- it does flip the per-gate posture state that `request_jump_permit` uses to choose the active preset
- gate access and toll behavior therefore change indirectly through preset selection, not through in-switch preset mutation

The real disconnected seam is not missing contract support. It is that some current frontend copy still describes the PTB as if it directly changes gate rules, while the actual implementation splits authored presets, posture state, and turret doctrine across separate surfaces.

### 6.5 No-gate / turret-only behavior requirement

The original hackathon testing happened in a gate-present environment. Stillness operators may have turrets without gates, so the next implementation prompt should treat gateless posture as a real product case.

Current code path:

- the transaction builder does **not** require at least one gate; it can build a turret-only PTB because gate and turret loops are independent
- posture readback **does** currently depend on a first gate, because the UI reads posture from `usePostureState(firstGateId)` and falls back to `commercial` when no gate exists
- current readiness blocks on disconnected wallet or unauthorized turrets, but not on missing gates, missing preset completeness, or an empty target set
- a successful turret-only switch can therefore be hidden by the current UI state: the write can succeed, but the control can remain stuck in a gate-led transition/readback path

Required product behavior going forward:

- if turrets exist and no gates exist, allow turret-only posture switching rather than silently failing the operation
- if no eligible gates exist, the UI should stay quiet in normal ready state rather than narrating skipped gate-policy mechanics under the macro controls
- if neither gates nor turrets exist, the UI should block execution with an explicit `No eligible gates or turrets to switch` reason in the existing disabled or error surfaces rather than attempting an empty PTB

### 6.5.1 Restoration result on `feat/restore-posture-switching`

The current frontend restoration branch now closes the original gateless control gap without changing Stillness packages, sponsor policy, EF-Map, or package IDs.

Verified restoration details:

- the shared posture PTB builder now rejects empty target sets before a transaction is built
- gate-present switching batch-reads current gate policies and blocks target modes whose required presets are missing
- turret-only or no-gate switching is explicitly allowed when turrets exist, and later human wallet-connected preview smoke confirmed that this path can execute once wallet and live world state settle
- turret doctrine drift is now a warning instead of a hard blocker because the same switch PTB already rebinds turret extensions
- gateless readback now uses a local session fallback for the last successful doctrine switch instead of collapsing back to a false `Commercial` default
- `scripts/check-posture-switch-tx.mts` now proves gate-plus-turret PTB shape, turret-only PTB shape, and pre-build empty-target rejection deterministically
- the macro Strategic Network strip now keeps only the `Commercial` and `Defensive` controls; the placeholder `Save Preset` button is gone, and all persistent helper narration under the macro controls was removed so the surface stays quiet in disconnected, loading, ready, no-gate, and turret-only states
- the broader stale status or read-model refresh after in-app power writes remains a separate follow-up for the later zero-package write-action parity branch; this polish pass did not expand into that seam

Remaining follow-up boundaries after the final helper-noise pass:

- posture or turret-doctrine signals are still not restored in Signal Feed because `signal-history.v1` does not yet expose posture, policy, toll, or turret-doctrine rows as first-class history entries
- turret extension or readiness display may still imply rebind work even after posture switching succeeds, likely because the current indexed read model does not expose the exact doctrine or readiness state the older direct-chain posture path used
- structure status after in-app power writes can still remain stale until indexer or page refresh, and that belongs in the upcoming zero-package write-action parity branch rather than this posture polish branch

This keeps the classification unchanged:

- still **A. Frontend/transaction-builder restoration only**
- no Stillness package update
- no sponsor allowlist expansion

### 6.6 Gate-rule preset switching status

Gate-rule preset switching is already live. The missing pieces are:

- explicit readiness checks for preset completeness before switching
- quieter macro UI that reserves visible copy for actual errors or blocked states rather than routine implementation explanation
- gateless or turret-only transition handling that does not depend on gate-based posture readback

So this is a restoration and clarity task in the frontend layer, not evidence that the current deployed package lacks the core preset model.

### 6.7 Package update implication

No package update is needed to restore gate-optional posture switching in the sense the user clarified.

Execution classification:

> **A. Frontend/transaction-builder restoration only**

Reason:

- current packages already support separate `Commercial` and `Defense` gate presets
- current packages already support posture-selected permit enforcement
- current packages already support turret doctrine switching
- current sponsor policy already allowlists `posture.set_posture` and gate-policy preset writes

The only posture cases that would justify package discussion later are different from the current restoration task:

- a true global posture object that persists even when the operator has no gates
- a requirement that gateless posture state be readable from chain as a first-class network posture rather than inferred from gates
- a new dedicated turret-doctrine event or explicit combined posture event model beyond current per-gate posture + extension authorization surfaces

### 6.8 Signal-history implication

Current execution and current history are separate questions.

Existing event surfaces already available on chain:

- `PostureChangedEvent` for per-gate posture changes
- `PolicyPresetSetEvent` and `PolicyPresetRemovedEvent` for gate preset mutation
- `TreasurySetEvent` and `TollCollectedEvent` for treasury and toll activity
- world `ExtensionAuthorizedEvent` when the turret doctrine extension is rebound

Current shared history boundary:

- `signal-history.v1` does not yet expose posture changes, gate policy changes, toll changes, or turret doctrine changes as first-class history rows
- app-originated structure rename and power writes can now be confirmed immediately in Dashboard and Node Control, but are not currently visible in `/activity` through `signal-history.v1`

History classification:

> **D. EF-Map signal-history extension only**

That is a later parity requirement, not an execution blocker.

For rename/power specifically, the next parity pass should compare tx digests against EF-Map signal-history before changing CivilizationControl filters or requesting backend expansion.

### 6.9 Next implementation recommendation

1. Treat current posture behavior as a shipped macro system with authored gate presets plus turret doctrine, not as a retired or purely historical feature.
2. Fix the frontend wording so `PostureControl` describes the switch PTB accurately: it flips posture state and turret doctrine, while gate permit enforcement changes because the active preset changes.
3. Add preset-completeness readiness before allowing the switch in gate-present environments.
4. Allow turret-only execution when turrets exist but gates do not, and present that state explicitly instead of relying on gate-based readback.
5. Add an explicit empty-target blocker when no gates and no turrets exist.
6. Keep history parity work separate and later through EF-Map signal-history expansion.

Final classification for posture restoration:

> **A. Frontend/transaction-builder restoration only**

## 7. Area C - each current Node Control action

| Action surface | Current status | Missing seam | Package gap? | Recommended next step |
|---|---|---|---|---|
| Attached-structure `Take Offline` / `Bring Online` | Real for gate, storage, turret | None beyond normal UI rollout consistency | No | Reuse current power builder consistently across row, menu, and detail surfaces |
| Network-node `Bring Online` | Real on dedicated node surfaces | None | No | Keep as-is |
| Network-node `Take Offline` | Not implemented | Mixed-family PTB with child `OfflineAssemblies` handling and explicit cleanup | No | Separate proof branch after audit |
| Rename / edit name | Not implemented | Rename UI, validation, PTB builder, sponsor policy if sponsored | No | Add after individual power parity |
| Extension authorize | Real but not a node-local action | None for current detail surfaces | No | Leave separate |
| Extension revoke | Not implemented | UI, PTB builder, sponsor policy, clear product scope | No | Keep out of first slice |
| Extension freeze | Not implemented | UI, PTB builder, sponsor policy, explicit safety handling | No | Keep out of first slice |
| Macro posture switch | Real from dashboard | Node Control does not own it | No | Keep separate from attached-structure action work |

## 8. Area D - rename or edit-name feasibility

Rename is a frontend and policy gap, not a contract gap.

Evidence already in the repo:

- the current indexed action model includes `actions.rename`
- current world metadata primitives emit `MetadataChangedEvent`
- family-specific rename calls already exist for gate, storage, turret, and network node modules
- generic assembly metadata-name mutation also exists for the broader assembly families

What is missing today:

- no current UI path exposes rename on detail screens, context menus, or Node Control rails
- no current PTB builder wires rename calls
- current sponsor allowlist does not cover metadata-name or metadata-description updates

Decision:

- detail-screen rename for gate, storage, turret, and network node is zero-package work
- Node Control rename across the wider operator-inventory taxonomy is blocked first by frontend and read-model type narrowing, not by a proven contract gap
- sponsored rename requires a separate sponsor-policy update and worker preview proof; wallet-paid rename does not require a package update

## 9. Area E - Node Power State preset feasibility

The phrase "Node Power State" currently spans three different products. They should not be conflated.

| Preset concept | What it means | Feasible with current packages? | Main gap |
|---|---|---|---|
| Local saved preset | Browser-stored desired online or offline state for structures on one node | Yes | Frontend persistence and apply UX |
| One-PTB preset apply for gate, storage, and turret | Build one mixed-family PTB from existing per-structure calls | Likely yes | New PTB composer and execution proof |
| Full-node preset including node offline | Include network-node offline plus child assembly handling | Not ready | Hot-potato PTB handling and worker policy |
| Shared on-chain named presets | Cross-device, persistent governance artifact | Not proven with current contracts | Product and package design decision |

The minimal next slice is therefore local presets only, or even narrower, a non-persistent apply flow assembled from the already-supported individual power actions. On-chain named presets are not justified by current repo evidence.

## 10. Area F - signal and event parity matrix

### 10.1 Signal-history parity matrix

| Signal family | Normal-route source today | Present in `signal-history.v1`? | Current dashboard or activity impact | Relevant to write-action audit? | Decision |
|---|---|---|---|---|---|
| Structure online or offline | Shared history endpoint | Yes | Current status history works | Yes | Keep as-is |
| Node fuel changed / low / critical | Shared history endpoint | Yes | Current status and warning history works | Yes | Keep as-is |
| Extension authorized | Shared history endpoint | Yes | Current governance history works | Yes | Keep as-is |
| Extension frozen | Shared history endpoint | Yes | Exposed as `frozen`, not revoke or delete | Yes | Keep label stable |
| Ownership transferred | Shared history endpoint | Yes | Current governance history works | Low | Keep as-is |
| Gate transit | Shared history endpoint | Yes | Visible as informational transit history | Medium | Keep as-is |
| Storage deposit / withdraw | Shared history endpoint | Yes | Visible as informational trade history | Medium | Keep as-is |
| Posture changed | Not in current normal route | No | No current signal-history parity | High for posture history, low for first write slice | Defer |
| Gate policy / treasury / toll config | Not in current normal route | No | No current parity for gate governance mutations | High for policy audit, low for first write slice | Defer |
| Turret doctrine change | Not in current normal route | No | No dedicated parity for doctrine swaps | Medium | Defer |
| Marketplace listing creation / cancel / purchase | Browser event path only | No | Activity and dashboard do not regain old market history parity | High for marketplace, low for first write slice | Defer |
| Toll collection / gross yield settlement | Not in current normal route | No | `Gross Network Yield` remains effectively waiting for toll and market settlement families | High for revenue UI, low for first write slice | Defer |

### 10.2 Gross-yield boundary

Legacy dashboard revenue semantics depended on browser-event families that are not part of `signal-history.v1`. The current shared-history mapper treats `storage_deposit`, `storage_withdraw`, and `gate_transit` as informational signals, not revenue signals, and there is still no wallet-scoped toll-collection or marketplace-settlement family in the normal route contract.

Decision:

- do not block the first Node Control write slice on gross-yield restoration
- keep signal-history parity, toll history, and marketplace settlement as separate read-only backlog work

## 11. Area G - marketplace deferral

Marketplace listing discovery still relies on a separate browser event-scan surface. That is already documented as a deferred read-path seam and does not justify mixing marketplace work into the first Node Control write branch.

Marketplace is therefore deferred for two reasons:

- the first Node Control write slice can ship without any marketplace dependency
- current signal-history v1 still does not expose the settlement families required to restore old revenue semantics cleanly

Decision: keep marketplace listing and settlement work in a later revenue branch, after individual power and rename parity are settled.

## 12. Area H - single package-update minimization plan

1. Do not open a package branch yet.
2. Open the first implementation branch only for zero-package action parity:
   - consistent gate, storage, turret, and network-node online controls across node menus, rails, and detail screens
   - rename on the current four-family execution set
3. If sponsored rename is required, use a separate sponsor-worker policy branch and preview proof rather than widening the UI branch.
4. Treat network-node offline as its own PTB proof branch because the blocker is transaction composition, not a missing world call.
5. Treat local power presets as frontend-only until operators prove they need shared, on-chain named presets.
6. Revisit package change only if one of these conditions becomes true:
   - operators need a true global or gateless posture object rather than the current per-gate posture + turret-only PTB composition model
   - operators need on-chain shared preset objects rather than local saved presets
   - current runtime calls cannot express a required action even after PTB and sponsor-policy work is proven out

## 13. Area I - final decision matrix

| Candidate feature | Frontend-only work | Sponsor-policy work | EF-Map or shared-backend work | PTB complexity | CC or world package change | Decision |
|---|---|---|---|---|---|---|
| Gate / storage / turret power parity across all current UI surfaces | Yes | No new policy required | No | Low | No | Implement first |
| Network-node online parity cleanup | Yes | No new policy required | No | Low | No | Implement first |
| Network-node offline | No | Yes if sponsored | No | High | No proven package need | Separate proof branch |
| Rename for gate / storage / turret / network node | Yes | Yes if sponsored | No | Low | No | Zero-package candidate |
| Rename for printer / refinery / assembler / berth / relay / nursery / nest / shelter | Yes, but requires wider execution typing | Possibly later | Possibly later for better indexed hints, but not required to prove contract feasibility | Low to medium | No proven package need | Defer until type-model widening |
| Turret-only posture switching when no gate is present | Yes | No new policy required | No | Low | No | Restore in frontend and transition handling |
| Posture-aware gate policy preset switching | Minimal docs/UI clarification only | No new policy required | No | None for shipped execution | No | Already shipped; treat as docs/readiness clarification, not package work |
| Local Node Power State presets | Yes | No | No | Low to medium | No | Later frontend slice |
| Shared on-chain named presets | No | No | No | Medium | Likely yes | Do not start |
| Signal-history parity for posture / policy / toll / market settlement | No | No | Yes | None | No | Separate read-only backlog |
| Marketplace listing and settlement integration | No | No | Yes | None | No proven package need | Separate revenue branch |

## 14. Recommended implementation order

1. Zero-package UI parity branch for current shipped power flows plus rename on the current four-family execution set.
2. Separate sponsor-worker policy branch only if sponsored rename is desired.
3. Separate PTB proof branch for network-node offline.
4. Separate frontend branch for local power-state presets if still desired after individual-action parity lands.
5. Separate read-path backlog for signal-history parity and marketplace settlement families.
6. Package discussion only after one of the minimization-plan triggers is proven real.

## 15. Do not implement yet

- Do not implement network-node offline yet; the upstream path exists, but it requires explicit child-offline handling and `OfflineAssemblies` cleanup in the same PTB.
- Do not implement extension freeze or revoke yet; freeze conflicts directly with posture-driven turret authorization flows and neither action is sponsor-allowlisted today.
- Do not reopen signal-history parity work for posture, gate policy, toll, turret doctrine, or marketplace settlement inside the first Node Control write branch.
- Do not mix sponsor-worker policy rollout into the same branch as the first UI write-action slice.
- Do not open any CC or world package branch yet.
- Do not widen the first slice into on-chain presets, marketplace settlement, or gross-yield restoration.