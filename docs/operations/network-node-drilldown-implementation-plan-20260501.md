# Network Node Drilldown Implementation Plan - 2026-05-01

## 1. Executive summary

Network-node-local drilldown is the next player-useful product slice after the node icon catalogue/reference work landed. The icon catalogue solved the visual grammar problem first: CivilizationControl now has tracked raw SVG glyphs, React catalogue components, and a static reference route at `/dev/node-icon-catalogue` that can anchor the next operator-facing surface.

The next step is not a new standalone app screen. It is a controlled drill-in inside the existing dashboard shell: the left sidebar remains, the hero metric cards remain, the main map footprint remains, and only the center map region plus the lower support surface change context when the operator selects a network node.

This plan defines that node-local interaction model, the first safe implementation branch, later staging for selection sync and local persistence, and the boundaries for eventually exposing write actions and user-named presets. It does not implement runtime code, route changes, strategic-map behavior changes, transaction changes, sponsorship changes, package-ID changes, Move changes, EF-Map changes, VPS changes, deploys, or dependency updates.

## 1.1 Status update - 2026-05-02

### Live generic assembly action classification - 2026-05-04

This corrective pass stays on `feat/zero-package-action-parity`. It does not change Move contracts, package IDs, EF-Map contracts, vendor state, VPS state, polling strategy, or production deploy state.

- live operator-inventory was fetched from `https://ef-map.com/api/civilization-control/operator-inventory` for wallet `0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62` with the browser origin `https://civilizationcontrol.com`; the response was `operator-inventory.v1` from `shared-frontier-backend` with 2 network nodes, 16 grouped structures, 4 unlinked structures, and 9 generic attached rows (`printer`, `refinery`, `assembler`, `berth`)
- human wallet smoke was correct: global Turrets, global Storages, and live Node Control storage/turret rows were actionable, while live generic attached rows degraded to hide-only because the frontend trusted missing nested `requiredIds` and stale `frontend_action_not_implemented` flags too strictly
- the classification showed the generic rows were not missing transaction identity: each live generic row had an object ID plus OwnerCap ID and selected-node context, while `assemblyId` was `null`; builder audit confirmed generic assembly power needs object ID as `structureId`, OwnerCap ID, network-node context, character ID, and energy config, and generic rename needs object ID, OwnerCap ID, character ID, and name. `assemblyId` is not a builder input
- `src/lib/nodeDrilldownModel.ts` now derives backend-membership generic `assembly` targets from row context when nested `requiredIds` are absent, preserves action/OwnerCap metadata while observed rows merge, and still leaves missing OwnerCap, missing object ID, missing node context, and unsupported/fallback rows read-only. `Selection Inspector` now exposes normal structure OwnerCap, network-node, energy-source, canonical-identity, and action-availability diagnostics without raw backend reason strings
- deterministic proof now includes live-shaped Mini Printer, Refinery, Assembler, and Mini Berth fixtures in `scripts/check-operator-inventory-mapping.mts` plus full family menu/rail projection in `scripts/check-node-control-action-projection.mts`; network-node offline, Node Power State presets, marketplace/revenue work, signal-history parity, package updates, EF-Map changes, and broad polling remain deferred
- final preview proof for this live-shape correction is `https://0c608a44.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par.civilizationcontrol.pages.dev`; route smoke confirmed `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; unique and alias HTML both resolved `assets/index-DkOBAXBu.js`; deployed lab smoke on `Printer Gamma` showed `Power and rename available` and the row menu exposed `Hide from Node View`, `Bring Online`, and `Rename Assembly`; served-bundle scanning found `civilizationcontrol-sponsor` in `App-D91ZgJan.js` and `SmartObjectProvider-D06tPiAY.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-ChEYcekW.js` and `SmartObjectProvider-D06tPiAY.js`, and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`
- integrated-browser wallet smoke was attempted on the fresh preview, but a usable wallet-owned session was still unavailable in this environment: the connect modal exposed only `Slush`, and the connection attempt immediately returned `Connection failed`

### Broad proof completion for generic node-drilldown actions - 2026-05-04

This tracked follow-up stays on `feat/zero-package-action-parity`. It does not change Move contracts, package IDs, EF-Map contracts, vendor state, or production deploy state.

- earlier widening proof was too narrow: most `/dev/node-drilldown-lab` scenarios were still synthetic hide-only rows, so the branch could pass while generic attached-assembly actions were only truly exercised in the special-case authority matrix and one narrow live reconciliation case
- the corrective proof pass fixed the lab at the root: synthetic fixtures and `src/lib/nodeDrilldownModel.ts` now carry the same authority-bearing inputs that live/backend-membership rows use, and `src/lib/nodeDrilldownScenarios.ts` now produces controllable owned examples across gate, storage, turret, and generic assembly families instead of mostly read-only placeholders
- deterministic proof is now broad and explicit: `scripts/check-node-drilldown-lab-action-matrix.mts` guards the full active dev-lab scenario set, exact unavailable reasons, and warning-marker explanation behavior; `scripts/check-node-drilldown-reconciliation.mts` now proves a live generic support-family case plus final menu projection; and `scripts/check-structure-action-support.mts` now pins operator-facing reason text and proves the old fixed `196px` menu clamp is gone
- operator-facing action-authority wording is now calmer and more truthful, and both `useNodeDrilldownStructureMenu.ts` plus `useStructureActionMenu.ts` now share `src/lib/contextMenuPositioning.ts` so the compact menu no longer clamps against a stale fixed width while the menu component shrink-wraps
- full local validation passed: `sui client active-env` (`testnet_stillness`); `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; `npm run sponsor:validate-policy`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-signal-history-mapping.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-structure-write-reconciliation.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; `npx tsx scripts/check-node-drilldown-lab-action-matrix.mts`; `npm run typecheck`; `npm run build`; and `git diff --check`
- fresh preview evidence for this proof-completion pass is now `https://8be950ce.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; route smoke confirmed `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; the deployed lab now loads the full synthetic surface with all nine active scenarios (`Authority Matrix`, `Sparse Solo Nodes`, `Node Gate Industry Node`, `No-Gate Industry Node`, `No-Gate Dense Manufacturing`, `Mixed Operating Base`, `Support Clutter Test`, `Defense Heavy Node`, and `Turret Stress Test`); unique and alias HTML both resolved `assets/index-1CYcUqmV.js`; and served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` plus `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` in `App-CfzGo-P-.js` and `SmartObjectProvider-COBxg4GX.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-BIXIVuD1.js` and `SmartObjectProvider-COBxg4GX.js`, found `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-COBxg4GX.js` and `suiRpcClient-B6rDdf72.js`, found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`, and found only lowercase `authorization` user-facing copy in `App-CfzGo-P-.js` and `nodeDrilldownMenuItems-BIXIVuD1.js`
- integrated-browser wallet smoke was attempted again on the fresh preview, but a usable wallet-owned session was still unavailable in this environment: the connect modal exposed only `Slush`, and the connection attempt immediately returned `Connection failed`
- remaining boundary: live Node Control/backend-membership generic attached-assembly actions are now broadly proven, but the older compatible-`Structure` adaptation lane in `src/lib/operatorInventoryAdapter.ts` still remains four-family-only outside that node-local/backend-membership path

### Live Node Control corrective follow-up - 2026-05-04

This tracked follow-up stays on `feat/zero-package-action-parity`. It does not change Move contracts, package IDs, EF-Map contracts, vendor state, or production deploy state.

- human wallet-connected preview smoke on the earlier zero-package preview proved the first parity pass was still incomplete: live Node Control backend-membership rows could collapse to hide-only menus even when the same structure remained actionable from global lists, unsupported families still looked like broken disabled controls in the attached-structures rail, and successful rename or power writes could snap back to stale operator-inventory values after the local success state cleared
- final root cause 1 was a local projection seam, not a missing backend or package surface: global lists act on fully adapted `Structure` rows, while live Node Control rebuilt backend-membership rows from thinner node-membership data and `createLiveStructureIndex()` excluded operator-inventory structures from authority recovery. That let a row degrade to `backend-only` or `missing-node-context` whenever the selected-node lookup lacked IDs even though the operator-inventory structure already had a valid supported target
- final root cause 2 was UI-owned action-state drift: unsupported and future-supported rows still rendered a disabled segmented shell, and hidden supported rows in row mode suppressed the shared power control instead of showing the same action family plus `Unhide`
- final root cause 3 was app-owned refresh ordering on top of the accepted operator-inventory-first read model: `resolveStructureWriteConfirmation()` cleared the temporary overlay as soon as selected-node lookup confirmed, even while operator inventory still carried the old rename or power state. The snapback therefore came from frontend reconciliation clearing too early over a stale indexed read model, not from a new EF-Map authority path
- the corrective pass now recovers `verifiedTarget` for backend-membership rows from operator-inventory structures while preserving truthful `hasDirectChainAuthority` accounting, centralizes node-local power state in `getNodeLocalPowerControlState(...)`, drives both live dashboard and dev-lab menus through shared `buildNodeDrilldownMenuItems(...)`, renders unsupported rows as calm status-only rails plus visibility-only menus, keeps hidden supported rows on the real shared power/unhide path, tightens the shared context-menu width, and requires operator-inventory confirmation before clearing rename or power overlays
- deterministic proof now covers the real live failure modes directly: `scripts/check-node-drilldown-reconciliation.mts` proves operator-inventory-backed storage and turret rows stay `verified-supported` even when selected-node lookup is incomplete; `scripts/check-structure-action-support.mts` proves the shared node-local power descriptor plus compact menu class; `scripts/check-structure-write-reconciliation.mts` proves selected-node confirmation alone no longer clears overlays while operator inventory is stale; and `scripts/check-node-control-action-projection.mts` proves supported, hidden, and unsupported row menus stay aligned across Node Control entry points
- validation passed: `sui client active-env` (`testnet_stillness`); `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; `npm run typecheck`; `npm run build`; `git diff --check` excluding the preserved unrelated `contracts/civilization_control/Move.lock`, `vendor/world-contracts`, and `.tmp-node-provisional-section.png` dirt; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-signal-history-mapping.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-structure-write-reconciliation.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; and `npm run sponsor:validate-policy`
- fresh preview evidence for the final corrective pass is now `https://83603ca1.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; route smoke confirmed `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; dev-lab right-click on `Storage Alpha` exposed `Hide from Node View`, `Take Offline`, and `Rename Assembly`; hidden `Gate Epsilon` exposed `Unhide`, `Take Offline`, and `Rename Assembly`; unsupported `Printer Gamma` exposed only `Hide from Node View` while the row rail stayed status-only; unique and alias HTML both resolved `assets/index-1oyXIeOs.js`; served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` in `App-C78lfgSw.js` and `SmartObjectProvider-CpcucCGD.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-CHOnHGhd.js` and `SmartObjectProvider-CpcucCGD.js`, and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`
- integrated-browser wallet smoke was attempted on the fresh preview, but a usable wallet-owned session was still unavailable in this environment: the connect modal exposed only `Slush`, and the connection attempt immediately returned `Connection failed`. Live owned-structure rename/power proof therefore remains pending one manual wallet-backed preview pass on this fresh unique URL
- network-node offline, node power state presets, marketplace/revenue work, and signal-history parity expansion remain separate follow-ups; this corrective branch closed the shipped Phase 1A four-family parity slice, and the Phase 1B widening result is tracked immediately below

### Phase 1B generic assembly widening - 2026-05-04

This tracked follow-up stays on `feat/zero-package-action-parity`. It does not change Move contracts, package IDs, EF-Map contracts, vendor state, or production deploy state.

- the generic attached-assembly widening slice is now implemented without reopening read-path or package scope: frontend execution now uses `StructureActionTargetType = StructureType | "assembly"` so displayed generic families no longer depend on the older four-family `StructureType` union
- operator-inventory and node-drilldown normalization now map `printer`, `refinery`, `assembler`, `berth`, `relay`, `nursery`, `nest`, and `shelter` rows to generic `assembly` power/rename targets when indexed required IDs plus `ownerCapId` resolve to one supported candidate
- `src/lib/structurePowerTx.ts` and `src/lib/structureMetadataTx.ts` now emit generic `world::assembly::{online,offline,update_metadata_name}` PTBs, sponsor policy plus worker validation now mirror those calls under both world package IDs, and deterministic proof now covers mapping, reconciliation, support, and menu/rail projection for the widened generic printer case
- the orange warning-marker review also closed in the normal operator UI: shared warning detail now appears in tooltip/aria copy and in `Selection Inspector` as `Alert` text instead of leaving the pip unexplained
- validation passed: `sui client active-env`; `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; `npm run sponsor:validate-policy`; `npm run sponsor:test`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-structure-action-support.mts`; `npx tsx scripts/check-node-control-action-projection.mts`; `npm run typecheck`; `npm run build`; and `git diff --check` on the touched files
- fresh preview evidence is now `https://55fdaf7c.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par-da22.civilizationcontrol.pages.dev`; route smoke confirmed `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; unique and alias HTML both resolved `assets/index-DId4iWQ2.js`; served-bundle scanning found `civilizationcontrol-sponsor` in `App-CuXhOtYo.js`, found `https://ef-map.com` in `nodeDrilldownMenuItems-FvrsLQZR.js` and `SmartObjectProvider-CywV33-9.js`, and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, or `X-API-Key`
- the dev lab now shows the warning explanation in normal UI as `Alert: Warning status plus extension authorization attention.` for `Gate Zeta`, but the integrated-browser wallet smoke still remained unavailable because no usable wallet-backed session was present in this environment

### Write-action audit before any package change - 2026-05-04

This follow-up is docs-only on `docs/node-control-write-action-audit`. It does not change frontend runtime code, Move code, sponsor-worker behavior, EF-Map code, package IDs, vendor state, or production deploy state.

- the new authority doc is `docs/operations/node-control-write-action-audit-20260504.md`
- the audit confirms that current Stillness runtime calls already cover the shipped Phase 1A slice and the now-shipped widening seam: existing gate, storage, turret, and network-node online actions plus metadata rename already work without a package update, and generic `world::assembly` entrypoints already cover the wider attached-assembly families now wired in this branch
- the audit also confirms that the main near-term gating seam was sponsor policy and frontend action-target modeling, not missing on-chain functions; current policy in this branch now covers the shipped four-family rename surface plus generic assembly power and rename, while network-node offline, revoke, and freeze remain outside the allowlist
- network-node offline remains explicitly deferred because the blocker is hot-potato PTB handling for child assemblies, not a proven world-contract gap
- signal-history parity for posture, policy, toll, turret doctrine, and market settlement remains a separate read-only backlog and should not block the first write-action implementation branch

### Compact Selection Inspector fuel row and branch close-out order - 2026-05-03

This tracked follow-up is the final frontend polish accepted on `feat/node-drilldown-render-shell`. It does not change EF-Map code, shared-backend contracts, VPS state, sponsor-worker behavior, package IDs, Move code, vendor state, or production deploy state.

- the selected network-node `Fuel` row in `Selection Inspector` now uses a compact horizontal summary on normal desktop width instead of stacking gauge and text vertically. The row now keeps quantity fullness on the left and indexed grade/runtime summary adjacent to it where space allows, with graceful wrap only on narrower layouts
- the bar still represents quantity fullness only, not time. Runtime text still comes only from indexed `estimatedSecondsRemaining` plus `estimatedHoursRemaining`, low fuel still means `86400` seconds, critical still means `3600` seconds, and partial rows still avoid fabricated time
- the change stays local to the inspector renderer in `src/components/topology/node-drilldown/NodeSelectionInspector.tsx` and reuses the existing shared `buildFuelPresentation(...)` seam. No browser JSON-RPC was added and no backend, package, or write-path behavior changed in this pass
- required validation passed: `npm run typecheck`; `npm run build`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; and `git diff --check` with only the preserved LF/CRLF warning on `contracts/civilization_control/Move.lock`
- the existing deterministic fuel probe remains `scripts/check-operator-inventory-mapping.mts`, which continues to assert indexed canonical-capacity normalization, quantity-based `fillPercent`, and runtime-threshold severity for the D1 fixtures used to guard the restored indexed-fuel model
- preview evidence for this final polish was captured on `https://f1885480.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- preview route smoke confirmed `/`, `/nodes`, `/settings`, and `/dev/node-drilldown-lab`; all four routes loaded the new boot shell first and then resolved the expected app surface without disconnected browser requests to Sui RPC, `operator-inventory`, or `node-assemblies`
- preview lab smoke also re-confirmed both shared right-click entry points: a verified map icon and a verified `Attached Structures` row still open the same app menu with `Hide from Node View` plus `Take Offline`
- served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` in `App-BusxZDEY.js` and `SmartObjectProvider-Bsk4q3Rp.js`; found `https://ef-map.com` in `SmartObjectProvider-Bsk4q3Rp.js` and `useNodeDrilldownStructureMenu-BVkynuen.js`; found `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-Bsk4q3Rp.js` and `suiRpcClient-BibKDPwo.js`; found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; and found no exact-case `Authorization`
- limitation: the integrated browser still had no wallet-owned node inventory, and the synthetic lab still does not provide node-level fuel fixtures. That means the compact one-line fuel row itself is code- and probe-validated here rather than wallet-smoked on a live indexed node in browser

### Signal Feed restoration from shared signal history - 2026-05-04

This follow-up is frontend-only on `feat/signal-history-indexer-feed`. It does not change Move contracts, package IDs, sponsor-worker behavior, EF-Map code, VPS state, vendor state, or production deploy state.

- CivilizationControl now consumes `GET https://ef-map.com/api/civilization-control/signal-history?walletAddress=0x...` through `src/lib/signalHistoryClient.ts`, `src/hooks/useSignalHistory.ts`, and the compatibility `useSignalFeed` wrapper
- `/activity` now renders wallet-scoped signal history with `All Signals`, `Governance`, `Trade`, `Transit`, and `Status` filters, restrained cursor-based `Load more`, calm disconnected copy, and a subdued indexing hint only when the endpoint reports `partial` or `warnings`
- `Dashboard` `Recent Signals` now uses the same shared endpoint with a small non-polling preview slice, so `/activity` and the main shell no longer use browser Sui `queryEvents` for Signal Feed
- signal history remains additive and read-only. It is not proof of ownership, not proof of write authority, and no online/offline, posture, gate policy, rename, sponsor, or package behavior changed in this pass
- v1 gaps remain deferred: no global firehose, no direct `energy_events`, no stable dedicated gate-access/config history, no custom legacy CivilizationControl posture/policy/toll/trade-settlement/turret-doctrine families beyond the current v1 indexed kinds, `assemblyId` may be `null`, and `extension_frozen` remains labeled frozen rather than revoke/delete
- validation passed: `npm run typecheck`; `npm run build`; `git diff --check`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; and `npx tsx scripts/check-signal-history-mapping.mts`
- preview evidence for this follow-up was captured on `https://9ffbadd8.civilizationcontrol.pages.dev` with alias `https://feat-signal-history-indexer.civilizationcontrol.pages.dev`
- browser-origin `fetch()` from the preview to `https://ef-map.com/api/civilization-control/signal-history?walletAddress=0x0000000000000000000000000000000000000000000000000000000000000abc&limit=5` returned `200` with `schemaVersion: "signal-history.v1"`, `partial: false`, one warning, zero signals, and no auth headers
- disconnected preview route smoke confirmed `/`, `/activity`, `/settings`, `/nodes`, and `/dev/node-drilldown-lab`; `/` and `/activity` both showed calm disconnected Signal Feed copy; none of those routes made browser `signal-history`, sponsor, or Sui RPC requests before wallet connect; and the dev lab remained isolated
- served-bundle scanning across 12 deployed JS assets found `signal-history` in `App-cxZrr4pe.js`; found `civilizationcontrol-sponsor` in `App-cxZrr4pe.js` and `SmartObjectProvider-BAt7V6Xn.js`; found `https://ef-map.com` in `SmartObjectProvider-BAt7V6Xn.js` and `useNodeDrilldownStructureMenu-C58ossPa.js`; found no `flappy-frontier-sponsor`, exact-case `Authorization`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; and still found `queryEvents` strings in `App-cxZrr4pe.js` plus `suiRpcClient-7KACx86e.js` because marketplace listing discovery and the retained legacy helper still exist outside the restored Signal Feed routes
- human wallet-connected preview smoke later passed on `https://9ffbadd8.civilizationcontrol.pages.dev`: `Dashboard` `Recent Signals` showed real indexed rows including signals from several hours earlier, `/activity` showed real wallet-scoped indexed rows reaching back into late April / early May, and `Governance`, `Transit`, plus `Status` filters were manually checked with scoped results. That closes the earlier connected-wallet validation gap for Signal Feed surfaces without changing the accepted read-only and v1-gap boundaries

### Next work order after merge

The current feature branch should not absorb package changes, marketplace work, or production deploy scope. After this Signal Feed restoration is merged, the next slice should still follow the audit in `docs/operations/node-control-write-action-audit-20260504.md`, but the shipped order is now:

1. Phase 1A and Phase 1B are already shipped
  - gate, storage, and turret power align across Node Control menus, rails, list rows, and current detail screens
  - network-node online, four-family rename, and generic attached-assembly power/rename now ride the current zero-package action surface where operator-inventory IDs resolve cleanly
2. Network-node offline proof branch
  - treat node offline as separate PTB work because the blocker is child-offline hot-potato handling, not package state
3. Local Node Power State presets later
  - start with local persistence only if the individual-action slice lands cleanly
  - do not escalate to on-chain preset design without a separate product decision
4. Signal-history parity remains separate
  - keep posture, policy, toll, turret-doctrine, and market-settlement history out of the shipped write-action slices
  - do not reopen browser `queryEvents` for normal Signal Feed routes
5. Marketplace integration later
  - keep listings and settlement work in a separate revenue branch
6. Package update only by proof
  - only reopen package discussion if a required operator action still cannot be expressed after frontend, sponsor-policy, and PTB proof work

### Indexed fuel fullness correction and immediate boot shell - 2026-05-03

This tracked follow-up stays on the accepted `feat/node-drilldown-render-shell` frontend boundary. It does not change EF-Map code, shared-backend contracts, VPS state, sponsor-worker behavior, package IDs, Move code, vendor state, or production deploy state.

- the wrong `Network Nodes` bar fill was a frontend denominator bug, not missing indexed fuel. Indexed `networkNodes[].node.powerSummary` could report `fuelMaxCapacity` in a raw tank scale that did not match `fuelAmount`, so rows that should look roughly half full rendered as tiny slivers
- `src/lib/fuelRuntime.ts` now centralizes indexed fuel presentation so fill always represents quantity fullness only. Runtime text still comes only from indexed `estimatedSecondsRemaining` plus `estimatedHoursRemaining`, severity still uses the existing low (`86400`) and critical (`3600`) thresholds, and partial states stay units-only with no fabricated time. When the indexed max capacity is already near usable-unit scale it is preserved; otherwise the helper normalizes usable capacity from the bundled fuel catalog and records the derivation reason for deterministic proof
- deterministic proof in `scripts/check-operator-inventory-mapping.mts` now covers the exact regression directly: a D1 row with `fuelAmount: 1800` and raw `fuelMaxCapacity: 10000` renders as `1,800 / 3,571 units`, reports `indexed-canonical-capacity`, and lands at about half fill; a smaller D1 row with `540` units now renders a visibly non-sliver fill while keeping the correct shorter runtime label
- the slow first-load blank was app-owned: `src/main.tsx` waited for async `App` and provider imports before rendering anything into `#root`. The branch now paints an immediate static boot shell, records quiet timing marks on `window.__CC_BOOT_TIMING__`, and swaps the real app in only after those async modules resolve
- local timing proof on `http://127.0.0.1:4185` showed `/` boot-shell render at `46.7ms`, boot-shell paint at `49.8ms`, app render at `244.2ms`, app paint at `244.6ms`, and first contentful paint at `96ms`; the largest script `assets/App-Brh6xqfh.js` finished at `195.7ms` with `1,235,592` bytes transferred and `4,951,550` decoded bytes. Local `/nodes`, `/settings`, and `/dev/node-drilldown-lab` all painted the boot shell in about `35-37ms` and made no disconnected `fullnode`, `operator-inventory`, or `node-assemblies` requests
- preview timing proof on `https://3cb28fb6.civilizationcontrol.pages.dev` showed `/` boot-shell render at `266ms`, boot-shell paint at `269ms`, app render at `727.6ms`, app paint at `770.7ms`, `DOMContentLoaded` at `268.9ms`, `load` at `366.6ms`, and first contentful paint at `300ms`; the largest script `assets/App-Brh6xqfh.js` finished at `677.6ms` with `1,262,671` bytes transferred and `4,951,550` decoded bytes. Preview `/nodes`, `/settings`, and `/dev/node-drilldown-lab` all painted the boot shell in `112-120ms` and made no disconnected `fullnode`, `operator-inventory`, or `node-assemblies` requests
- validation passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the pre-existing LF/CRLF warning on `contracts/civilization_control/Move.lock`; `npx tsx scripts/check-operator-inventory-mapping.mts`; and `npx tsx scripts/check-node-drilldown-reconciliation.mts`
- preview evidence for this follow-up was captured on `https://3cb28fb6.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- preview route smoke confirmed `/`, `/nodes`, `/settings`, and `/dev/node-drilldown-lab`; all four routes showed the new immediate boot shell on first snapshot before the app shell took over
- served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` in `App-Brh6xqfh.js` and `SmartObjectProvider-tq4WYpYI.js`; found `https://ef-map.com` in `SmartObjectProvider-tq4WYpYI.js` and `useNodeDrilldownStructureMenu-B4vRh3iM.js`; found `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-tq4WYpYI.js` and `suiRpcClient-BibKDPwo.js`; found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; found no exact-case `Authorization`; and found only the existing lowercase user-facing text `Turret extension authorization revoked` outside the guarded runtime-config path
- limitation: a wallet-connected preview session with live indexed node rows was not available in this environment, so browser proof of the corrected fuel bar and runtime on live `/nodes` plus live `Node Control` remains pending. Deterministic proof plus the shared helper seam now cover those surfaces until one real owned-node session is available

### Indexed runtime restoration from operator-inventory power summaries - 2026-05-03

This tracked follow-up stays on the accepted `feat/node-drilldown-render-shell` read-model boundary. It does not add browser Sui JSON-RPC, change Signal Feed scope, change backend contracts, change sponsor-worker behavior, change package IDs, change Move code, change vendor state, or change production deploy state.

- `Command Overview` / `Attention Required` now derives critical and low-fuel state from the operator-inventory read model, frontend network-node runtime UI now derives from indexed `networkNodes[].node.powerSummary`, and `Selection Inspector` now shows a compact indexed fuel summary for selected network nodes
- low-fuel threshold is 24 hours (`86400` seconds) and critical fuel threshold is 1 hour (`3600` seconds)
- indexed runtime is rendered only when confidence is `indexed` and both `estimatedSecondsRemaining` plus `estimatedHoursRemaining` are present. When runtime is null, rows stay partial and show units only; the UI does not fabricate time
- assembly-less indexed rows now preserve `powerSummary` through adaptation on a root-level structure field, so runtime surfaces do not lose indexed runtime only because a grouped node has no `assemblyId`
- no browser JSON-RPC was added for runtime recovery. Runtime and alert restoration come from the operator-inventory read model only, and Signal Feed remains a separate deferred slice that was not changed here
- validation passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the pre-existing LF/CRLF warning on `contracts/civilization_control/Move.lock`; `npx tsx scripts/check-operator-inventory-mapping.mts`; and `npx tsx scripts/check-node-drilldown-reconciliation.mts`
- preview evidence was captured on `https://be1df70f.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- preview route smoke confirmed `/`, `/nodes`, `/settings`, and `/dev/node-drilldown-lab`; disconnected preview checks for those same routes made no browser Sui RPC requests and no `operator-inventory` or `node-assemblies` requests; and the dev lab remained isolated from wallet, shared-backend, and sponsor flows
- served preview HTML on both unique and alias URLs resolved `assets/index-CbtN9RIx.js`
- served-bundle scanning across 12 deployed JS assets found `civilizationcontrol-sponsor` in `App-CyzGoJCr.js` and `SmartObjectProvider-DEp_I87K.js`; found `https://ef-map.com` in `SmartObjectProvider-DEp_I87K.js` and `useNodeDrilldownStructureMenu-CblxiTR6.js`; found `https://fullnode.testnet.sui.io:443` in `SmartObjectProvider-DEp_I87K.js` and `suiRpcClient-BibKDPwo.js`; found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID`; found no exact-case `Authorization`; and found only the existing lowercase user-facing text `Turret extension authorization revoked` in `App-CyzGoJCr.js`
- limitation: a wallet-connected preview session with live indexed node rows was not available in this environment, so browser proof of the restored fuel bar, fuel grade, and runtime on live `/nodes` plus the live `Node Control` inspector is still pending. Route-level browser proof for `Node Control` therefore remains limited to the disconnected shell and deterministic probes rather than live wallet-owned node interaction

### Indexed fuel consistency and calm Signal Feed fallback - 2026-05-03

This follow-up stays on the accepted `feat/node-drilldown-render-shell` frontend baseline. It does not change EF-Map code, shared-backend runtime behavior, write paths, sponsor-worker behavior, package IDs, Move code, vendor state, or production deploy state.

- the reported node-fuel inconsistency came from a frontend model seam, not missing indexer data. Operator inventory already supplied indexed `fuelAmount`, but compatibility `Structure` rows and several normal UI surfaces still preferred only direct-chain `fuel` runtime fields. Grouped node rows that lacked `assemblyId` could therefore lose visible fuel quantity entirely and fall back to blank or `None` states even when indexed fuel existed
- the frontend now preserves indexed fuel quantity as `indexedFuelAmount` on `Structure`, keeps that field through compatibility merge scoring, and uses it in the node-local model plus normal surfaces that only need honest quantity display: `/nodes`, `/nodes/:id`, parent-node banners on child structure pages, and `Selection Inspector`. When only indexed quantity exists, the UI now shows quantity-only fuel with calm copy such as `Unavailable` or `Runtime estimate unavailable for this node.` rather than inventing runtime duration
- Command Overview and other runtime-dependent fuel heuristics stay honest: low-fuel or runtime estimates still require real on-chain `fuel` runtime fields, so this pass does not synthesize duration, burn rate, or percentage logic from indexed quantity alone
- no suitable browser-safe shared-backend Signal Feed endpoint exists in the current CivilizationControl frontend contract. Because of that, `/activity` no longer drives its normal UI from browser `queryEvents` failure states; it now shows calm migration copy while the wallet-scoped shared history route is defined. `Dashboard` also disables Signal Feed polling (`polling: false`) so the old recurring browser event loop is no longer active on the main shell in this pass
- deterministic proof in `scripts/check-operator-inventory-mapping.mts` now covers the exact indexed-fuel seam directly: a rendered node with `assemblyId: null` but indexed `fuelAmount` still carries `indexedFuelAmount`, `fuelAmount`, and `fuelSummary` into the node view model
- local validation for this follow-up passed: `npx tsx scripts/check-operator-inventory-mapping.mts`; `npm run typecheck`; `npm run build`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; local preview `/`; local preview `/activity`; local preview `/settings`; local preview `/nodes`; and local preview `/dev/node-drilldown-lab`
- preview evidence for this follow-up was captured on `https://66c402a7.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/activity`, `/settings`, `/nodes`, and `/dev/node-drilldown-lab`; confirmed unique-preview `/activity` now shows calm migration copy instead of the earlier raw RPC connectivity error; confirmed disconnected preview `/activity` and `/nodes` made no browser requests to Sui RPC, operator-inventory, or any shared signal-history route and only retained the existing wallet-metadata plus tribe-refresh requests already present on disconnected shells; and confirmed the served dev lab still loads as an isolated route with asset-only requests
- served-bundle proof confirmed both unique and alias HTML resolve `/assets/index-Bor5um34.js`; confirmed `civilizationcontrol-sponsor` appears in `App-BKwuDCiG.js` and `SmartObjectProvider-C2tNa1Z0.js`; confirmed `https://ef-map.com` appears in `SmartObjectProvider-C2tNa1Z0.js` and `useNodeDrilldownStructureMenu-3jx-WF_i.js`; confirmed no `flappy-frontier-sponsor`, exact `Authorization`, `ASSEMBLY_API_TOKEN`, or `X-API-Key` markers in the 12 served preview JS assets checked for this pass; and confirmed the only lowercase `authorization` marker is the existing user-facing event text `Turret extension authorization revoked` in `App-BKwuDCiG.js` rather than a browser auth-header path

### Node Control context-menu recovery and compact inspector IDs - 2026-05-03

This follow-up is a frontend-only UI repair on top of the accepted `feat/node-drilldown-render-shell` baseline. It does not change backend contracts, shared-backend payloads, EF-Map behavior, write paths, package IDs, Move code, vendor state, or production deploy state.

- root cause for the reported Node Control right-click regression was local UI ownership drift, not missing menu labels or backend data. `Dashboard` still owned the shared node-drilldown context-menu state, and both map icons and `Attached Structures` rows still opened that shared state, but the actual `NodeDrilldownContextMenu` render block had drifted inside the loading-only branch. Once loading cleared, right-click handlers still ran but no app menu could mount
- the shared menu is now rendered at screen scope again, so visible map icons, visible rows, and hidden rows all reuse the same app-styled menu owner; the menu also suppresses browser fallback context-menu behavior on itself, and the primary row button now handles the same right-click path explicitly instead of relying only on bubbling
- `Selection Inspector` long identifiers are now compact, one-line, and copyable through a small reusable `CompactCopyValue` component plus shared `truncateMiddle(...)` helper. Normal mode now keeps only operator-facing structure and node details while internal source or authority diagnostics stay behind the existing debug flag; the old deferred-controls paragraph was removed from the normal panel
- local validation for this repair passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the pre-existing `contracts/civilization_control/Move.lock` CRLF warning; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-operator-inventory-mapping.mts`; local preview `/`; local preview `/dev/node-drilldown-lab`; local map-icon right-click; local visible-row right-click; local hidden-row right-click; and local inspector copy-button smoke
- preview evidence for this repair was captured on `https://609feaf9.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s-jtn6.civilizationcontrol.pages.dev`
- deployed preview validation confirmed the unique preview `/` loads, the unique preview `/dev/node-drilldown-lab` still loads as an isolated route, map-icon right-click now shows `Hide from Node View` plus supported power action, visible-row right-click now shows the same shared menu, hidden-row right-click shows `Unhide`, and the normal inspector shows compact copyable `Object ID` and `Assembly ID` rows without the earlier internal source or authority block

### Indexer-first Node Control read model - architecture correction - 2026-05-03

This is a docs-only architecture correction for the accepted `feat/node-drilldown-render-shell` baseline. It updates the next-step read-model direction without reopening the accepted UI shell.

- accepted and unchanged baseline: same-dashboard `Node Control`, `Node Key`, icon layout, `Attached Structures`, `Selection Inspector`, local hide or unhide, compact context menu, route or topology transitions, and backend `node-assemblies` membership display
- architecture problem: preview wallet discovery and broader operator-shell reads are still too dependent on browser-side Sui JSON-RPC, which has already shown public-fullnode CORS and rate-limit fragility plus confusing partial-read behavior
- corrected product direction: EF-Map or shared-backend indexer data becomes the primary source for operator read inventory, display rows, observed status, and freshness; wallet plus chain remain the source of truth for signing, transaction execution, and final write results
- planning consequence: do not keep optimizing browser Sui JSON-RPC into the primary dashboard boot path or the primary Node Control read path; the next work should pivot to a shared-backend operator-inventory endpoint and frontend adoption of that endpoint as the main boot read model
- current branch action work is paused at the accepted UI baseline until the read model is corrected; online or offline control should resume only after the operator-inventory contract and indexed action-candidate model exist

### Phase E2 operator-inventory frontend implementation - 2026-05-03

### Operator-inventory phantom-node identity exposure and strong-owned proof correction - 2026-05-03

This follow-up closes the remaining phantom-node classification seam after preview `https://a91ed23d.civilizationcontrol.pages.dev` still showed one extra neutral macro node even though the earlier invalid-node quarantine and calm-sidebar shell had already landed.

- the remaining frontend seam was no longer fallback merge, unlinked-row regrouping, or sidebar shell state. The grouped-node adapter still admitted some zero-structure raw `networkNodes[]` rows too easily, and the normal operator UI still did not expose enough node identity to classify a suspicious rendered node without falling back to browser devtools
- displayed grouped nodes now require stable canonical identity, a displayable node object ID, raw grouped-node membership, no duplicate canonical identity, and either attached grouped structures or a stronger owned-node proof. That strong empty-node proof is now conservative: object ID plus `ownerCapId` plus at least one higher-confidence indexed signal (`status` not neutral or unknown, indexed fuel amount, indexed power summary, or indexed energy-source ID). Weak neutral object-only or assembly-only grouped rows are quarantined into debug instead of rendering or counting as governed nodes
- the browser-only `?debugOperatorInventory=1` export now includes one eligibility decision for every grouped raw node plus richer rendered snapshots: `groupedNodeEligibilityDecisions`, `renderedNodeGroups`, `renderedNetworkNodeListRows`, and `copySummary()` on `window.__CC_OPERATOR_INVENTORY_DEBUG__`. The copy helper returns a sanitized proof bundle that is safe to paste back from a wallet-connected preview session
- the normal `Selection Inspector` now surfaces the full selected node identity instead of forcing blind classification: full `Object ID`, `Assembly ID`, `OwnerCap ID`, `Energy Source ID`, `Canonical Identity`, grouped-structure count, and calm fallback copy such as `Not indexed`, `Not supplied`, and `None`; when debug is enabled it also shows source mode, render eligibility, proof signals, and indexed-row position for the selected rendered node
- `/nodes` now uses `Object ID` instead of the misleading `Location` label and adds an `Assembly ...` subline in the identity column, while quarantined rows stay out of the normal table entirely
- deterministic proof in `scripts/check-operator-inventory-mapping.mts` now covers the stronger empty-node rule directly: valid empty owned nodes still render, weak neutral grouped rows are quarantined, richer debug export fields exist, sanitized `copySummary()` works, and the `/nodes` source now carries the corrected `Object ID` label
- final local validation for this correction passed: `npx tsx scripts/check-operator-inventory-mapping.mts`; `npm run typecheck`; `npm run build`; local preview `/`; local preview `/nodes`; local preview `/settings`; local preview `/dev/node-drilldown-lab`; and local `/?debugOperatorInventory=1`; the disconnected local debug route exposed the expanded `latest` keys plus `copySummary()` and the home shell stayed calm with no horizontal overflow. The disconnected local `/nodes` route had no rows to render, so the visible table-header rename remains code- and deterministic-probe-validated rather than wallet-smoked in-browser here
- refreshed preview evidence for this correction pass was captured on `https://4964256d.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/nodes`, `/settings`, `/dev/node-drilldown-lab`, and `/?debugOperatorInventory=1`; confirmed the served debug export now includes `groupedNodeEligibilityDecisions`, `renderedNodeGroups`, `renderedNetworkNodeListRows`, and a working `copySummary()` helper; confirmed disconnected preview `/nodes` keeps the empty-state shell with no horizontal overflow; and confirmed the served dev lab still loads as an isolated route with no external requests while the inspector visibly shows `Object ID`, `Assembly ID`, `OwnerCap ID`, `Energy Source ID`, and `Canonical Identity`
- served-bundle proof confirmed both unique and alias HTML resolve `/assets/index-DLpBriTq.js`; confirmed `civilizationcontrol-sponsor` appears in `App-CLaiGIf2.js` and `SmartObjectProvider-D4vWkUc9.js`; confirmed `https://ef-map.com` appears in `SmartObjectProvider-D4vWkUc9.js` and `useNodeDrilldownStructureMenu-D6cj3BDK.js`; confirmed no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, or `X-API-Key` markers in the served preview JS assets checked for this pass; and confirmed the only remaining lowercase `authorization` marker is the existing user-facing event text `Turret extension authorization revoked` in the large app chunk rather than a browser auth-header path

### Operator-inventory invalid-node quarantine and sidebar calm-shell correction - 2026-05-03

This follow-up closes the remaining frontend seam after the earlier unlinked-row and grouped-node dedupe corrections.

- the remaining phantom-node class was no longer an unlinked-row regroup issue or a direct-chain fallback merge. On operator-inventory success, the only displayed macro nodes already came from raw grouped `networkNodes[]`, and the adapter still admitted any grouped node that had a displayable `objectId`, even when that grouped node had zero grouped structures and no owned-node proof. Sidebar shell copy also still rendered internal read-model status and backend warning paragraphs through `useAssetDiscovery` -> `App` -> `Sidebar`
- `adaptOperatorInventory(...)` now records explicit `quarantinedNodeRows` and applies a stricter displayed-node eligibility rule: a grouped node must have stable canonical identity plus a displayable object ID, and zero-structure grouped nodes must also carry owned-node proof. Valid empty owned nodes still render; missing-identity rows, missing-displayable-ID rows, duplicate canonical nodes, and zero-structure ownerless nodes are quarantined into debug only and excluded from rendered node groups, node counts, and normal governed inventory counts
- the browser-only `?debugOperatorInventory=1` seam now exposes the full live classification surface needed for wallet-backed proof: `requestedWalletAddress`, raw returned operator wallet, indexed `rawNetworkNodes[]` with index and object or assembly or owner-cap identity, raw node duplicate buckets by object ID or assembly ID or owner-cap ID or canonical identity, `quarantinedNodeRows`, `missingIdentityNodeRows`, `zeroStructureGroupedNodes`, and `renderedNetworkNodeListCount`
- deterministic proof in `scripts/check-operator-inventory-mapping.mts` now covers the new eligibility boundary directly: a valid empty owned node still renders, an ownerless empty grouped node is quarantined, a grouped row with no usable canonical identity is quarantined, grouped canonical duplicates collapse to one displayed node, unlinked node-like rows remain non-rendered diagnostics, unlinked turrets stay out of governed counts, and a server-rendered `Sidebar` ignores injected `Shared read model` and raw backend-warning props entirely
- the operator shell now stays calm on both local and deployed disconnected routes: the sidebar keeps only connection, loading, empty, and hard-error copy; it no longer renders `Shared read model • Updated HH:MM`, raw backend warning strings, or long wrapped diagnostic paragraphs under `Structure Inventory`
- final local validation for this correction passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `sui client active-env`; `sui move build --path contracts/civilization_control`; and `sui move test --path contracts/civilization_control`; local preview `/`, `/settings`, and `/dev/node-drilldown-lab` also loaded cleanly while disconnected and made no browser requests to Sui RPC, operator-inventory, node-assemblies, or sponsor routes
- preview evidence for this correction pass was captured on `https://a91ed23d.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/settings`, `/dev/node-drilldown-lab`, and `/?debugOperatorInventory=1`; confirmed browser-origin `fetch()` from the unique preview to `https://ef-map.com/api/civilization-control/operator-inventory?walletAddress=0x0000000000000000000000000000000000000000000000000000000000000abc` returned `200` with `schemaVersion: "operator-inventory.v1"`, `partial: false`, `networkNodeCount: 0`, `unlinkedStructureCount: 0`, and `warningCount: 2`; confirmed the deployed debug export now includes `requestedWalletAddress`, `rawOperatorWalletAddress`, `rawNetworkNodes`, `rawNetworkNodeDuplicateBucketsByCanonicalIdentity`, `quarantinedNodeRows`, `missingIdentityNodeRows`, `zeroStructureGroupedNodes`, and `renderedNetworkNodeListCount`; confirmed both unique and alias HTML resolve `/assets/index-BH719jYp.js`; and confirmed served-preview JS scanning across all 12 deployed assets found `civilizationcontrol-sponsor` in `App-CasVNCim.js` and `SmartObjectProvider-DcpLwdcE.js`, found `https://ef-map.com` in `SmartObjectProvider-DcpLwdcE.js` and `useNodeDrilldownStructureMenu-BiSKyvnh.js`, found `operator-inventory` in `App-CasVNCim.js` and `useNodeDrilldownStructureMenu-BiSKyvnh.js`, and found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, or `X-API-Key` markers in the served preview JS assets checked for this pass

### Operator-inventory unlinked quarantine and canonical group dedupe - 2026-05-03

This follow-up closes the remaining frontend leak that was still visible after the earlier display-dedupe pass.

- the remaining live-data seam was no longer the macro regroup path alone. The adapter still placed raw operator-inventory `unlinkedStructures` into the flat compatibility `Structure[]`, so normal governed inventory surfaces such as `Sidebar`, `Gates`, `Storages`, and `Turrets` still rendered raw unlinked rows as if they were governed inventory
- `adaptOperatorInventory(...)` now keeps grouped or governed rows in `adapted.structures` and keeps unlinked non-node rows separately in `adapted.unlinkedStructures`; raw unlinked node-like rows are still ignored for display-node purposes; warning copy now states that unlinked rows are excluded from governed inventory until they relink
- the other remaining extra-node seam was raw-group dedupe keyed only by `node.objectId`. Grouped node buckets and selected-node lookup buckets now collapse through canonical object-or-assembly identity, so alias rows that arrive with different node object IDs but the same canonical assembly do not render as duplicate macro nodes or produce duplicate selected-node read-model buckets
- the browser-only `?debugOperatorInventory=1` seam now exposes `operatorInventoryUrl`, raw grouped duplicate buckets by object ID or owner-cap ID or canonical identity, plus `adaptedUnlinkedRows`, so a wallet-connected preview can classify whether suspicious live IDs are still raw unlinked payload, adapted hidden unlinked rows, or true grouped backend membership
- deterministic proof in `scripts/check-operator-inventory-mapping.mts` now covers the remaining adapter seam directly: a duplicate raw grouped node with a different object ID but the same assembly still renders only one macro node, and suspicious turret IDs remain present only in `adapted.unlinkedStructures` rather than normal governed inventory or attached-node membership
- local validation for this correction passed: `npx tsx scripts/check-operator-inventory-mapping.mts`; `npm run typecheck`; `npm run build`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `sui move build --path contracts/civilization_control`; and `sui move test --path contracts/civilization_control`
- preview evidence for this correction pass was captured on `https://2db728c4.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/settings`, `/dev/node-drilldown-lab`, and `/?debugOperatorInventory=1`; confirmed browser-origin `fetch()` from the unique preview to `https://ef-map.com/api/civilization-control/operator-inventory?walletAddress=0x0000000000000000000000000000000000000000000000000000000000000abc` returned `200` with `schemaVersion: "operator-inventory.v1"`, `partial: false`, `networkNodeCount: 0`, `unlinkedStructureCount: 0`, and two warning strings; confirmed the deployed debug export now includes `operatorInventoryUrl`, raw grouped duplicate buckets, and `adaptedUnlinkedRows`; confirmed both unique and alias HTML resolve `/assets/index-BDLC-LzW.js`; and confirmed served-preview JS scanning across all 12 deployed assets found `civilizationcontrol-sponsor` in `App-DvgL1DaB.js` and `SmartObjectProvider-cDKxCiKH.js`, found `https://ef-map.com` in `SmartObjectProvider-cDKxCiKH.js` and `useNodeDrilldownStructureMenu-DJ-bgXJf.js`, found `operator-inventory` in `App-DvgL1DaB.js` and `useNodeDrilldownStructureMenu-DJ-bgXJf.js`, and found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, or `X-API-Key` markers in the served preview JS assets checked for this pass

### Operator-inventory display dedupe correction - 2026-05-03

This follow-up corrects the first operator-inventory frontend adoption pass after human preview review reported extra macro network nodes and extra turret rows on `feat/node-drilldown-render-shell`.

- root cause was not an operator-inventory plus direct-chain display merge on the success path. `useAssetDiscovery` already chose `operatorInventory.adapted?.structures ?? enrichedFallbackStructures`, so direct-chain rows were not appended while operator inventory adapted successfully
- the real bug was the flatten-then-regroup seam: the frontend flattened raw `networkNodes[]` and `unlinkedStructures` into one compatibility `Structure[]`, then rebuilt macro `NetworkNodeGroup[]` generically. That allowed an unlinked node-like row to render as a standalone network node and allowed unlinked turret rows to be promoted into a synthetic macro node even though neither came from authoritative grouped operator-inventory membership
- the correction makes raw operator-inventory `networkNodes[]` the only authoritative source of displayed network-node groups on the success path. `adaptOperatorInventory(...)` now emits deduped `nodeGroups`, ignores unlinked node-like rows for display-node purposes, merges duplicate raw node groups by `node.objectId`, and keeps unlinked non-node rows as unlinked operator-inventory inventory rather than attached node membership
- generic fallback grouping no longer manufactures a synthetic `unassigned` network node for macro display, and `NetworkNodeListScreen` plus `NetworkNodeDetailScreen` now use grouped node displays instead of rediscovering nodes from the flat structure list
- a new browser-only debug seam is available at `?debugOperatorInventory=1`. It publishes `window.__CC_OPERATOR_INVENTORY_DEBUG__.latest` with raw grouped and unlinked counts, adapted counts, rendered macro-node counts, selected-node rendered rows, duplicate buckets by object ID or owner-cap ID or canonical identity, missing-identity rows, and fallback-participation flags so preview review can classify suspicious rows without re-opening the UI shell
- deterministic proof in `scripts/check-operator-inventory-mapping.mts` now covers the real macro boundary: two real grouped nodes stay two displayed nodes, a stray unlinked node-like row does not become a displayed macro node, suspicious unlinked turret rows remain unlinked inventory rather than attached-node membership, duplicate raw node groups collapse by node object ID, and direct-chain fallback can run without being merged into the operator-inventory display surface
- local validation for this correction passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; and `npx tsx scripts/check-operator-inventory-mapping.mts`
- preview evidence for this correction pass was captured on `https://3a32a175.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/settings`, and `/dev/node-drilldown-lab` plus alias-root; confirmed browser-origin `fetch()` from the unique preview to `https://ef-map.com/api/civilization-control/operator-inventory?walletAddress=0x0000000000000000000000000000000000000000000000000000000000000abc` returned `200` with `schemaVersion: "operator-inventory.v1"`, `partial: false`, and the expected warning strings; confirmed `?debugOperatorInventory=1` exposes `window.__CC_OPERATOR_INVENTORY_DEBUG__.latest`; confirmed both unique and alias HTML resolve `/assets/index-D-x9bal1.js`; and confirmed served preview bundle scanning across all deployed JS assets found `civilizationcontrol-sponsor` in `App-D7sMEXYF.js` and `SmartObjectProvider-ZUf1aMYn.js`, found `https://ef-map.com` in `SmartObjectProvider-ZUf1aMYn.js` and `useNodeDrilldownStructureMenu-B30R_vIO.js`, found `operator-inventory` strings in `App-D7sMEXYF.js` and `useNodeDrilldownStructureMenu-B30R_vIO.js`, and found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, or `X-API-Key` markers in the served preview JS assets checked for this pass. A raw `Authorization` string still exists in the large app chunk `App-D7sMEXYF.js`, but not in the shared-backend or sponsor runtime-config chunks checked here

The remaining live-data validation gap is a wallet-connected preview smoke against the real operator inventory that showed the duplicate rows. That session was not available in the integrated browser. The new `?debugOperatorInventory=1` seam is intended to classify the suspicious live IDs on the next human preview pass.

This pass completes the frontend side of the read-model correction on `feat/node-drilldown-render-shell` without reopening the accepted `Node Control` shell or widening the write scope.

- app boot now prefers `GET /api/civilization-control/operator-inventory?walletAddress=0x...` through a new browser-safe client and React Query seam; `useAssetDiscovery` falls back to direct-chain discovery only when the shared read model fails completely
- compatibility mapping preserves the existing dashboard and sidebar contract by adapting operator inventory into `PlayerProfile`, `Structure[]`, `NetworkMetrics`, grouped node membership, and operator-facing partial or unlinked warnings instead of introducing a new shell route or view-model family
- selected-node `Node Control` now prefers grouped operator-inventory node lookups instead of requiring a selected-node `node-assemblies` fetch on the success path; `useNodeAssemblies(...)` remains as a fallback only when the operator-inventory lookup is absent or failed
- indexed `actionCandidate.actions.power` now drives row availability for operator-inventory-backed rows, while wallet-signed chain execution stays on the existing `useStructurePower().toggleSingle(...)` path and remains final authority
- the sidebar now exposes calm read-model state as `Shared read model • Updated HH:MM` or `Direct-chain fallback` rather than relying only on warning-state copy
- deterministic proof now includes `scripts/check-operator-inventory-mapping.mts`, which verifies operator-inventory adaptation, backend-membership rendering, unlinked-structure preservation, and indexed `future-supported` rows
- local validation passed: `npm run typecheck`, `npm run build`, `git diff --check`, `npx tsx scripts/check-node-drilldown-reconciliation.mts`, and `npx tsx scripts/check-operator-inventory-mapping.mts`
- preview evidence for this implementation pass was captured on `https://a7e61d2e.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/settings`, `/dev/node-drilldown-lab`, and alias `/`; confirmed browser-origin `fetch()` from the deployed preview to `https://ef-map.com/api/civilization-control/operator-inventory?walletAddress=0x0000000000000000000000000000000000000000000000000000000000000abc` returned `200` with `schemaVersion: "operator-inventory.v1"`, `partial: false`, and expected indexer warning strings; and confirmed unique and alias HTML both resolve `/assets/index-CgQoKUu5.js`
- served-bundle proof scanned all deployed preview JS assets and found `civilizationcontrol-sponsor` in `App-CRmyQhC8.js` and `SmartObjectProvider-NJGrBabz.js`, found `https://ef-map.com` in `SmartObjectProvider-NJGrBabz.js` and `useNodeDrilldownStructureMenu-DfDHNqVp.js`, found `operator-inventory` strings in `App-CRmyQhC8.js` and `useNodeDrilldownStructureMenu-DfDHNqVp.js`, and found no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, or `X-API-Key` markers in the served preview JS assets checked for this pass

The remaining validation gap is one wallet-connected preview smoke against a real indexed operator inventory. The available browser session had no usable wallet-owned node inventory for that proof. A disconnected preview snapshot also still showed the existing `[DappKit] SmartObjectProvider: No object ID provided` console message on root and settings, which was observed but not changed in this pass.

### Browser Sui read-path hardening follow-up - 2026-05-03

#### Partial-state classification clarification - 2026-05-03

This follow-up narrows the remaining sidebar warning after the browser Sui read-path hardening pass. Human preview testing reported that wallet connect now completes quickly and no longer produces the earlier repeated CORS or `429` console failures, but the sidebar still showed `Showing 9 structures. 3 structure reads failed (other).`

- the exact old warning source was local frontend code, not backend or Node Control UI: `discoverAssets(...)` built the user-facing string in `src/lib/suiReader.ts` through `buildPartialDiscoveryWarning(...)`, which used `diagnostics.objectReadsFailed` plus `formatSuiRpcFailureCounts(diagnostics.failures)`
- the misleading `other` bucket was not a real structure-family classification. It came from the old `fetchStructureBatch(...)` path when `buildStructureFromResponse(...)` returned `null` for a `multiGetObjects(...)` response with no `data` or no `objectId`, and the code then fed `response.error ?? "Missing object data"` through the generic RPC classifier. Object-level null responses therefore collapsed into `other` even when the actual problem was a missing, deleted, wrapped, or otherwise unreadable target object
- unsupported or non-control owner-cap families were not the source of this specific warning. `fetchOwnerCaps(...)` only batches caps that map through `inferStructureType(...)` to the four supported direct-chain discovery families (`Gate`, `StorageUnit`, `Turret`, `NetworkNode`); unsupported owner-cap families are now tracked separately as `unsupported` diagnostics and do not contribute to sidebar warning copy
- the three items in the old warning class are therefore supported owner-cap targets that failed to return a usable object payload from `multiGetObjects(...)`. In the new code path they classify as one of: `stale-or-deleted` when the per-object error text indicates a missing or deleted target, `unreadable` when the target exists but still returns no usable object payload, `missing-fields` when the cap or object response lacks required IDs, or `rpc-failure` when the batch request itself fails. The exact `ownerCapId` and `authorizedObjectId` pairs are now emitted once per discovery run in preview or local console diagnostics so the next wallet-connected run can name those three items directly without per-poll log spam
- final sidebar copy is now calm and category-specific instead of `failed (other)`: if all skipped items are missing on-chain the sidebar reads `Showing N controllable structures. N owned objects are missing on-chain and were skipped.`; if the batch genuinely fails at the RPC layer it reads `Showing N controllable structures. N expected structures could not be read from Sui RPC.`; otherwise it reads `Showing N controllable structures. N owned objects could not be read and were skipped.`; and if all supported controllable structures loaded successfully while only unsupported owner-cap families were skipped, no sidebar warning is shown at all
- dev or preview diagnostics now log one issue summary per discovery run with reason bucket plus safe IDs and type hints: `ownerCapId`, `authorizedObjectId`, `structureType`, `ownerCapType`, and the parsed detail string. This replaces the old per-object `failed (other)` warning behavior without reintroducing per-poll spam
- local validation for this clarification pass passed: `npm run typecheck`; `npm run build`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; local `/`; local `/settings`; local `/dev/node-drilldown-lab`; and local disconnected browser proof that those routes still make no browser Sui RPC requests
- preview evidence for this clarification pass was captured on `https://821bf9c8.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed the unique-preview `/`, `/settings`, and `/dev/node-drilldown-lab` routes plus alias-root all load cleanly and, while disconnected, make no browser Sui RPC or NameService resource requests; human testing separately reported that wallet connect remains quick and the preview console stays clean after the earlier hardening pass, but a fresh wallet-connected browser smoke for this exact warning-copy follow-up was not available in the integrated browser session used here
- served-bundle proof confirmed both unique and alias HTML resolve `assets/index-bEvKHi-C.js`; confirmed `civilizationcontrol-sponsor` appears in `App-DByan25k.js` and `SmartObjectProvider-CVS8vCgd.js`; confirmed `https://ef-map.com` appears in `SmartObjectProvider-CVS8vCgd.js` and `useNodeDrilldownStructureMenu-CLtDaelN.js`; confirmed the explicit Sui RPC URL `https://fullnode.testnet.sui.io:443` appears in `SmartObjectProvider-CVS8vCgd.js` and `suiRpcClient-BibKDPwo.js`; and confirmed no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, or `X-API-Key` markers in the served preview JS assets checked for this pass. A raw `Authorization` string still exists in the large app chunk `App-DByan25k.js`, but it was not present in the preview assets carrying the shared-backend or Sui discovery runtime-config logic for this pass

This follow-up hardens the branch's browser-side Sui read path after disconnected preview review showed repeated `https://fullnode.testnet.sui.io` requests, CORS failures, and unnecessary restart pressure outside the accepted Node Control UI scope.

- root cause was split across two app-owned browser paths: `src/lib/suiReader.ts` still owned its own hardcoded `https://fullnode.testnet.sui.io:443` JSON-RPC client and the dashboard `useSignalFeed` hook polled global chain events even with no connected wallet and no owned structures, so disconnected `/` still issued `queryEvents` traffic unrelated to asset discovery
- browser Sui JSON-RPC selection is now centralized in `src/lib/suiRpcClient.ts`, which prefers public `VITE_SUI_RPC_URL` and otherwise falls back to the current Stillness repo default `https://fullnode.testnet.sui.io:443`; dev or preview logging now records the selected read endpoint once per session when discovery diagnostics are active
- the app bootstrap now uses a calmer shared `QueryClient`, direct-chain discovery now dedupes same-wallet in-flight runs, structure reads batch through `multiGetObjects`, and optional character metadata now fails open in a separate query instead of blocking `PlayerProfile` → `OwnerCap` → structure discovery
- the dashboard `useSignalFeed` hook now stays fully disabled until a connected wallet has at least one owned structure, which removed the disconnected root's accidental `queryEvents` flood and kept `/`, `/settings`, and `/dev/node-drilldown-lab` quiet in both local and served preview checks
- sidebar status now distinguishes blocked or failed discovery from an actual empty inventory and can surface partial-results warnings when some structure object reads fail without discarding successfully resolved structures
- local validation for this follow-up passed: touched-file error checks on the new RPC and query surfaces; `npm run typecheck`; `npm run build`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `sui client active-env`; `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; local `/`; local `/settings`; local `/dev/node-drilldown-lab`; and local browser resource-entry proof that the disconnected root no longer makes browser Sui RPC requests while `/settings` and the dev lab remain clean
- preview evidence for this follow-up was captured on `https://7dc3c648.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed the unique-preview `/`, `/settings`, and `/dev/node-drilldown-lab` routes all load and, while disconnected, make no browser Sui RPC or NameService resource requests; alias-root smoke confirmed the same disconnected `Structure Inventory` state with no browser Sui RPC traffic
- the preview was built from the repo root with explicit public overrides `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, `VITE_SHARED_BACKEND_URL=https://ef-map.com`, blank `VITE_SPONSOR_API_KEY`, and explicit `VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443`
- served-bundle proof confirmed both unique and alias HTML resolve `assets/index-BAo0-nLB.js`; confirmed `civilizationcontrol-sponsor` appears in `App-CNO3m3EA.js` and `SmartObjectProvider-DPQPrri2.js`; confirmed `https://ef-map.com` appears in `SmartObjectProvider-DPQPrri2.js` and `useNodeDrilldownStructureMenu-BZUlP58z.js`; confirmed the explicit Sui RPC URL `https://fullnode.testnet.sui.io:443` appears in `SmartObjectProvider-DPQPrri2.js` and `suiRpcClient-l4HqPWrx.js`; and confirmed no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, or `X-API-Key` markers in the served preview JS assets checked for this pass. A raw `Authorization` string still exists in the large app chunk `App-CNO3m3EA.js`, but it was not present in the preview assets carrying the shared-backend or new Sui RPC client logic for this pass

The remaining validation gap for this follow-up is a wallet-connected preview smoke against a real usable wallet session. That environment was not available in the integrated browser, so the live connected discovery path and non-blocking character-metadata behavior are code- and local-build-validated here, but not yet browser-smoked end to end on preview.

### Zero-package structure actions and rename parity - 2026-05-04

This follow-up implements the first zero-package action-capable slice on `feat/zero-package-action-parity` without reopening EF-Map, VPS, package IDs, Move contracts, or production deploy state.

- the shared `StructureActionContextMenu` plus `StructureRenameDialog` now expose the same calm action seam across live `Node Control`, `/dev/node-drilldown-lab`, current structure detail screens, and global list rows via right-click. The current four-family action set is now aligned as `Bring Online` / `Take Offline` for gate, storage, and turret, `Bring Online` only for network nodes, and on-chain rename for gate, storage, turret, and network node
- hidden node-local rows no longer lose legitimate write actions in the shared menu: the same compact Node Control menu now shows `Unhide` plus real power and rename actions when the row still has a verified direct-chain target. Backend-only and ambiguous rows still stay actionless beyond local hide or unhide
- successful structure writes now run through one shared refresh seam in `useStructureWriteRefresh()`. That seam refetches wallet-scoped operator inventory, asset discovery, selected-node `node-assemblies` fallback when needed, and active signal history on the current signal-feed surfaces, while `Dashboard` still preserves selected-row focus by rematching on `canonicalDomainKey`
- tracked sponsor policy now includes `update_metadata_name` for `gate`, `storage_unit`, `turret`, and `network_node` on both world runtime package IDs, and the repo validator plus worker validation test now assert that rename allowlist explicitly
- deterministic proof now includes `npx tsx scripts/check-structure-action-support.mts`, which locks the current action-support contract: network nodes stay online-only, the four shipped structure families expose rename, verified node-local rows expose rename plus concrete power intent, and backend-only node-local rows stay actionless
- local validation for this slice passed: `git status --short --branch`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `npm run typecheck`; `npm run build`; `npx tsx scripts/check-posture-switch-tx.mts`; `npx tsx scripts/check-operator-inventory-mapping.mts`; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `npm run sponsor:validate-policy`; `npx tsx scripts/check-structure-action-support.mts`; `sui client active-env`; `sui move build --path contracts/civilization_control`; and `sui move test --path contracts/civilization_control`
- preview was rebuilt from the repo root with explicit public overrides `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, `VITE_SHARED_BACKEND_URL=https://ef-map.com`, blank `VITE_SPONSOR_API_KEY`, and `VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443`
- preview evidence for this slice was captured on `https://2075be01.civilizationcontrol.pages.dev` with alias `https://feat-zero-package-action-par.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab`; confirmed the disconnected shells still stay calm; confirmed the dev lab row menu for `Storage Alpha` now exposes `Hide from Node View`, `Take Offline`, and `Rename Assembly`; confirmed the hidden-row menu for `Gate Epsilon` now exposes `Unhide`, `Take Offline`, and `Rename Assembly`; and confirmed the deployed rename dialog opens from the shared lab menu with the operator-facing `Assembly Name` field and 64-character cap copy
- served-bundle proof fetched the actual JS assets loaded from the unique preview host and confirmed both unique and alias HTML resolve `/assets/index-BM_y2c7F.js`; confirmed `civilizationcontrol-sponsor` appears in the deployed bundle; confirmed `https://ef-map.com` appears in the deployed bundle; and confirmed `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, exact-case `Authorization`, and `X-API-Key` are absent from the served preview JS assets reviewed in this pass

The remaining validation gap is unchanged: a wallet-connected live preview smoke against a real owned-node wallet was not available in this environment, so rename and power actions are preview-proved through the deterministic scripts, the disconnected live route shells, and the synthetic lab rather than a real sponsored or player-paid transaction on preview.

### Phase E power-action menu completion - 2026-05-03

This follow-up completes the remaining accepted Phase E power-action seams without widening scope into rename, local labels, presets, drag persistence, node offline, backend contract changes, sponsor-worker changes, Move changes, or production deploy.

- the `Attached Structures` rail and the `Selection Inspector` rail now use `Offline / Online` language everywhere instead of `OFF / ON`; the same control wording now appears in the `Authority Matrix` dev lab and in the rail aria label as `Online or Offline control`
- the selected action segment now reuses the same topology status doctrine as the node-local glyphs instead of a separate rail palette: `Online` uses `--topo-state-online`, `Offline` uses `--topo-state-offline`, and unavailable controls stay muted neutral; local and served checks confirmed exact computed-color parity between the selected `Online` row segment and the online storage glyph (`rgb(70, 185, 175)`), and between the selected `Offline` row segment and the offline turret glyph (`rgb(239, 68, 68)`)
- the compact structure context menu is now truly shared across map icons and `Attached Structures` rows through one shared menu-owner seam in the screen-level owner, rather than a canvas-only local menu state; visible rows expose `Hide from Node View` plus `Take Offline` or `Bring Online` only when the row is `verified-supported` and resolved to concrete `online` or `offline`, hidden rows expose `Unhide`, and unavailable rows stay visibility-only with no fake disabled power action in the menu
- row right-click now suppresses the browser default context menu and opens the same app-styled Node Control menu as the map icon for the same structure; right-clicking a row also selects the row consistently so the inspector and menu stay aligned
- the live action-authority seam was audited and corrected: backend-membership rematch now preserves the full merged observed alias set when joining rendered rows back to live structures, so a wallet-owned supported row no longer gets stranded as `backend-only` merely because the surviving merged observed `objectId` or `assemblyId` changed; the deterministic reconciliation probe now includes an alias-chain case that proves one supported backend-membership storage row still resolves to `verified-supported` through a preserved alias bridge
- the live power-action path remains the existing `useStructurePower().toggleSingle(...)` seam, but the dashboard now refetches selected-node backend membership only after a successful result instead of after both success and failure, while `useStructurePower` still invalidates direct-chain asset discovery as before; selected structure focus now survives refresh by rematching on `canonicalDomainKey` when the same rendered row is rebuilt with a different transient render `id`
- disabled control reasons are now short user-facing explanations in normal control tooltips and list chrome: `Backend-only`, `Ambiguous match (n)`, `Unsupported family`, `Missing OwnerCap`, `Missing node context`, and `Synthetic preview row`; the verbose explanation remains in `Selection Inspector` detail rather than returning to row-body spam
- local validation for this completion pass passed: full git preflight; `npm run typecheck`; `npm run build`; `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning; `npx tsx scripts/check-node-drilldown-reconciliation.mts`; `sui client active-env`; `sui move build --path contracts/civilization_control`; `sui move test --path contracts/civilization_control`; local `/`; local `/settings`; `Configuration` → `Node Drilldown Lab`; local row right-click menu with `Hide from Node View` plus `Take Offline`; local map-icon right-click menu with `Hide from Node View` plus `Take Offline`; local unavailable map-icon menu with `Hide from Node View` only; local hidden-row right-click menu with `Unhide`; local preview-only `Take Offline` followed by map-menu `Bring Online`; and local lab performance entries showing no `fetch` or `xmlhttprequest` traffic and no wallet, Sui RPC, shared-backend, sponsor, EF-Map, or transaction resource requests
- preview evidence for this completion pass was captured on `https://4818c2dc.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/settings`, and `/dev/node-drilldown-lab`; confirmed the served lab uses `Offline / Online` labels, the row right-click menu exposes `Hide from Node View` plus `Take Offline`, the map-icon menu exposes `Hide from Node View` plus `Take Offline`, the unavailable icon menu stays `Hide from Node View` only, and the served selected-segment colors still exactly match the served map glyph colors for online storage and offline turret rows
- served-bundle proof fetched every deployed preview JS asset from the unique preview host and confirmed that both unique and alias HTML resolve `assets/index-DQjJrCpo.js`; confirmed `civilizationcontrol-sponsor` appears in `App-DpzBPbh4.js` and `SmartObjectProvider-G0GQ_sHu.js`; confirmed `https://ef-map.com` appears in `SmartObjectProvider-G0GQ_sHu.js` and `useNodeDrilldownStructureMenu-B5B0f1u_.js`; and confirmed no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID` markers in the served preview JS assets reviewed in this pass. A raw `Authorization` string still exists in the large app chunk `App-DpzBPbh4.js`, but it does not appear in the shared-backend or sponsor runtime-config chunks that this deploy proof is intended to guard

The remaining validation gap is unchanged: a wallet-connected live preview smoke against a real owned network node could not be completed in this environment because the available browser session still has no owned node inventory or usable wallet state to exercise against preview.

### Phase E UI acceptance correction - 2026-05-03

This correction supersedes the earlier Phase E action-rail presentation and the earlier hide-only icon-menu note for the shipped operator UX. The action-authority model and existing power transaction path remain unchanged.

- `Attached Structures` now renders one fixed-width segmented `OFF / ON` control rail for every non-hidden row, so the list reads as an industrial control surface rather than stacked status text; verified supported `Gate`, `Storage`, and `Turret` rows are interactive, while backend-only, ambiguous, unsupported, missing-owner-cap, and missing-node-context rows keep the same segmented shape in a disabled state with the specific reason moved to control tooltip and inspector detail
- row-body diagnostic spam has been removed from `Attached Structures`; rows now show the structure name, at most one compact secondary line when it adds non-redundant type or size context, and a small `Hidden from map` marker only for hidden rows
- standard-size named rows no longer repeat `Standard Printer`, `Standard Storage`, `Standard Turret`, or equivalent generated labels when the title already carries the useful identity; backend-only, `Action unavailable`, `Lab-only preview`, and similar authority or provenance labels no longer stack in the row body
- hidden rows remain bottom-sorted, preserve icon plus identity plus status context, keep `Hidden from map` as the only local-state marker in-row, and use `Unhide` as the stable row-rail action; verified-supported hidden rows keep their real power control in `Selection Inspector` rather than crowding the list row
- `Selection Inspector` remains the detail surface for authority diagnostics and unavailable explanations, and now pairs that explanation with the same segmented `OFF / ON` control and `Unhide` action where relevant; rename, local labels, presets, drag persistence, and node offline remain out of scope
- the icon context menu is now a compact shortcut surface: it always includes `Hide from Node View`, and it adds `Take Offline` or `Bring Online` only for verified-supported rows whose current state is concretely `online` or `offline`; unavailable rows still expose `Hide from Node View` only, and no `Rename`, `Edit`, or local-label action was added
- row right-click was intentionally left out of this correction pass because it would require a second menu-owner seam in the scrolling list and risks avoidable selection churn; the icon context menu now covers the requested shortcut behavior without widening scope
- `/dev/node-drilldown-lab` now demonstrates the corrected surface directly through `Authority Matrix`: verified online and offline rows have interactive preview segmented toggles, backend-only and unsupported rows show disabled segmented toggles with no row-body spam, hidden rows stay at the bottom with identity preserved, and the icon context menu exposes power shortcuts only on verified rows
- local validation for this correction pass passed: `npm run typecheck`, `npm run build`, `git diff --check`, `npx tsx scripts/check-node-drilldown-reconciliation.mts`, local `/`, local `/settings`, `Configuration` → `Node Drilldown Lab`, local `/dev/node-drilldown-lab`, local verified-row preview toggle behavior, local hidden-row `Unhide`, local verified icon context menu with power shortcut, local unavailable icon context menu with `Hide` only, and local dev-lab `fetch` or `xhr` check showing no wallet, Sui RPC, shared-backend, sponsor, EF-Map, or transaction requests
- preview evidence for this UI acceptance correction was captured on `https://0fd16d2b.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed unique-preview `/`, `/settings`, and `/dev/node-drilldown-lab`; confirmed the served preview lab now shows compact aligned segmented rails with no repeated row-body authority text; confirmed `Configuration` still routes into the standalone lab; and confirmed the preview icon context menu exposes `Hide from Node View` plus `Take Offline` or `Bring Online` only on verified rows while unavailable rows show `Hide from Node View` only
- served-bundle proof fetched every deployed preview JS asset from the unique preview host and confirmed that both unique and alias HTML resolve `assets/index-CenluvW2.js`; confirmed `civilizationcontrol-sponsor` appears in `App-BOvKB86N.js` and `SmartObjectProvider-d2Qqsiyl.js`; confirmed `https://ef-map.com` appears in `SmartObjectProvider-d2Qqsiyl.js` and `useNodeDrilldownHiddenState-BQ6Dmepe.js`; and confirmed no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `X-API-Key`, `SPONSOR_PRIVATE_KEY`, `CF_API_TOKEN`, or `CLOUDFLARE_ACCOUNT_ID` markers in the served preview JS assets reviewed in this pass

The live wallet-backed transaction path is still the existing `useStructurePower().toggleSingle(...)` seam, but a wallet-connected live node-control smoke is still pending in this environment because the available browser session has no owned network-node inventory to exercise against preview.

### Phase E action authority and supported power controls - 2026-05-02

Phase E is now implemented on `feat/node-drilldown-render-shell`.

- each rendered node-local row now carries explicit `actionAuthority` state instead of inferring actionability from membership source alone; the model distinguishes `verified-supported`, `backend-only`, `ambiguous-match`, `unsupported-family`, `missing-owner-cap`, `missing-node-context`, and `synthetic`
- verified supported online or offline controls now ship only for the already-proven web power families: `Gate`, `Storage`, and `Turret`; backend-membership rows become actionable only when a unique direct-chain match plus `OwnerCap` and node context can be re-proved from the current wallet-owned live data
- `Attached Structures` and `Selection Inspector` now surface one shared action rail with verified `Bring Online` or `Take Offline` controls, unavailable reason text for backend-only or ambiguous or unsupported rows, and preserved local `Unhide`; the map context menu intentionally remains hide-only in this slice
- the live dashboard now routes verified row actions through the existing `useStructurePower().toggleSingle(...)` transaction path and refetches selected-node backend membership after a power action completes; no rename, local labels, presets, drag persistence, node offline, backend endpoint work, Move work, sponsor-worker work, or EF-Map or VPS changes were added in this slice
- `/dev/node-drilldown-lab` now includes an `Authority Matrix` scenario that covers verified, backend-only, ambiguous, unsupported, missing-context, and hidden rows, with preview-only local status toggles that never invoke wallet, Sui RPC, sponsor, or shared-backend requests
- deterministic regression proof in `scripts/check-node-drilldown-reconciliation.mts` now asserts the Phase E boundary directly: uniquely matched backend-membership storage and turret rows resolve to `verified-supported` power targets, while backend-only printer, refinery, and assembler rows remain unavailable
- local validation passed: `npm run typecheck`, `npm run build`, `git diff --check` with only the unrelated `contracts/civilization_control/Move.lock` CRLF warning, `npx tsx scripts/check-node-drilldown-reconciliation.mts`, `sui move build --path contracts/civilization_control`, and `sui move test --path contracts/civilization_control`
- local browser validation re-confirmed `/`, `/settings`, and `/dev/node-drilldown-lab`; verified the `Authority Matrix` action rail, preview-only toggle behavior, hidden-row `Unhide`, hide-only canvas context menu, and absence of any operator-visible `Rename` or `local label` UI; the dev lab still loads only route assets with no fetch or XHR traffic to wallet, Sui RPC, shared-backend, sponsor, or transaction endpoints
- preview evidence for this Phase E pass was captured on `https://cb2b95be.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed `/settings` on the alias URL, confirmed the unique preview `/dev/node-drilldown-lab` route shows the Phase E authority matrix with verified `Take Offline` or `Bring Online` controls plus unavailable reasons, and confirmed that served root HTML on both unique and alias URLs resolves the same entry chunk `assets/index-DyIfbBtR.js`
- served-bundle proof fetched every deployed preview JS asset from the unique preview host and confirmed `civilizationcontrol-sponsor` appears only in `SmartObjectProvider-4fclb-w3.js`, `https://ef-map.com` appears in `SmartObjectProvider-4fclb-w3.js` and `useNodeDrilldownHiddenState-CkHIrGKN.js`, and neither of those runtime-config chunks contains `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, `authorization`, or `X-API-Key`; a separate lowercase `authorization` string still exists elsewhere in the large app chunk as generic dependency text, but not in the chunks that carry sponsor or shared-backend browser path logic

The live dashboard shell and live transaction path are wired, but a wallet-connected live node-control smoke remains pending in this environment because the available browser session still has no owned network-node inventory to exercise against the deployed preview.

### Phase D hide or unhide polish follow-up - 2026-05-02

The same branch now includes a narrow UI-only follow-up on top of the accepted hide or unhide slice.

- the node-local structure context menu is now fully compact: it keeps only the single `Hide from Node View` action row while preserving the existing right-click, keyboard invocation, `Escape`, outside-click, route-change, node-exit, and action-close behavior
- hidden rows in `Attached Structures` now preserve their normal icon, identity, family, size, status, and reference details while demoting visually to the bottom of the list; `Hidden from map` now reads as secondary local-state metadata and `Unhide` now sits in a stable right-aligned action rail sized to accept later row-local controls without changing row identity layout again
- the `Selection Inspector` now labels hidden state as `Node View` with `Hidden from map (local only)` and keeps explicit copy that membership, authority, and future actions do not change
- `Configuration` now exposes a restrained `DevTools` section with origin-relative links to `/dev/node-drilldown-lab` and `/dev/node-icon-catalogue`; those links intentionally use standalone navigation so both current-origin dev routes boot through their existing standalone entry seams
- local validation re-confirmed `npm run typecheck`, `npm run build`, `git diff --check`, `npx tsx scripts/check-node-drilldown-reconciliation.mts`, `/settings`, both `DevTools` links, the compact context menu, hidden-row action rail, hidden-row inspector state, and the dev-lab no-external-request guarantee
- preview evidence for this polish pass was captured on `https://c4c674d8.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed `/settings` on both unique and alias URLs, confirmed both `DevTools` links boot their standalone routes, and re-confirmed preview-lab hide or unhide behavior with the compact menu plus hidden-row action rail
- served-bundle proof fetched every deployed preview JS asset from the unique preview host and confirmed `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`, `https://ef-map.com`, and `civilizationcontrol-sponsor`; it also confirmed no `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, or `X-API-Key`, and no `Authorization` string within or near the shared-backend browser path logic. A raw `Authorization` string still exists elsewhere in bundled dependency text, but not in the shared-backend browser path that this deployment check guards

### Phase D local hide or unhide implementation - 2026-05-02

Phase D is now implemented on `feat/node-drilldown-render-shell`.

- added versioned node-local hidden-state persistence through `src/lib/nodeDrilldownHiddenState.ts` plus `useNodeDrilldownHiddenState`, scoped by `characterId`, else `walletAddress`, else session-only fallback, and stored under `cc:node-drilldown:hidden:v1:<scopeKey>:<nodeId>` with `canonicalDomainKey` entries rather than render IDs
- hiding now removes a structure from the node-local SVG only; `Attached Structures` and `Selection Inspector` continue to resolve the full row set, hidden rows sort below all visible rows, and both surfaces expose clear `Hidden from map` state plus `Unhide`
- `NodeDrilldownCanvas` now opens a compact app-styled structure context menu on right-click or keyboard context-menu invocation with only `Hide from Node View`; the menu closes on outside click, `Escape`, route change, node exit, and action completion
- selected hidden rows now remain selected with the inspector open, but no longer render as selected glyphs in the SVG; unhiding restores them through the normal automatic layout
- the same hide or unhide path now runs on live dashboard drilldown and on `/dev/node-drilldown-lab`; local and preview lab checks confirmed refresh persistence for the same node ID or scope and confirmed the dev lab still loads only static route assets with no fetch or XHR traffic to wallet, Sui RPC, shared-backend, sponsor, or transaction endpoints
- local validation passed: `npm run typecheck`, `npm run build`, `git diff --check`, `npx tsx scripts/check-node-drilldown-reconciliation.mts`, `sui move build --path contracts/civilization_control`, and `sui move test --path contracts/civilization_control`
- preview evidence for this Phase D pass was captured on `https://c6242f74.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation confirmed that both `/` and `/dev/node-drilldown-lab` load on the unique preview URL, that preview-lab hide or unhide works end to end, and that the served preview assets `App-pqedA4oB.js` and `SmartObjectProvider-DSNX2G8q.js` contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` plus `https://ef-map.com` while containing neither `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, nor `X-API-Key`

The live dashboard root shell still loads on the preview, but real macro-to-node entry and `Back to Strategic Network` could not be re-exercised in this environment because the available browser session had no wallet-owned network-node inventory to select.

Phase B's first runtime slice is now implemented on `feat/node-drilldown-render-shell`.

- added a normalized node-local view model and `family-bands-v1` layout helper that keep the renderer independent from wallet discovery state
- added shared `NodeDrilldownSurface`, `NodeStructureListPanel`, and `NodeSelectionInspector` components reused by both the live dashboard drilldown and the synthetic lab route
- added same-dashboard entry from the macro Strategic Network map into a read-only `Node Control` shell with explicit `Back to Strategic Network` and icon-to-row / row-to-icon selection sync
- added a static dev-only `/dev/node-drilldown-lab` route with six synthetic scenarios: `Sparse Solo Node`, `Industry Node`, `Defense Heavy Node`, `Mixed Operating Base`, `Turret Stress Test`, and `Support Clutter Test`
- confirmed the 50-turret stress case renders as 52 attached structures total including the two gates
- preview evidence captured on `https://ae7547fb.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

Still deferred in this first runtime slice:

- Browser Back and URL mirroring
- all write actions, online or offline controls, and transaction-path changes
- presets, preset saving, and preset execution
- drag persistence, hide or unhide persistence, and local label editing
- broader live family hydration beyond the current `NetworkNodeGroup` shape

### Accepted UI baseline and next action-planning phase - 2026-05-02

The current `feat/node-drilldown-render-shell` baseline is now accepted for follow-on `Node Control` work.

- the same-dashboard `Node Control` shell, accepted topology footprint, accepted `Attached Structures` plus `Selection Inspector` split, accepted icon sizing, accepted `Node Key`, accepted tooltip behavior, accepted shell chrome, and accepted route or topology transition polish are the baseline and should not be re-opened during the first action-capable slice
- `docs/operations/network-node-drilldown-implementation-plan-20260501.md` is now the authoritative planning document for `Node Control`; `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md` remains a historical reference for icon taxonomy, badge doctrine, and early rationale only
- backend membership now defines which attached structures appear inside live `Node Control` whenever the selected-node `node-assemblies` payload returns a non-empty success result
- direct-chain reads, `OwnerCap` proof, the supported-family matrix, and existing frontend action helpers remain the only action authority; a backend row must not become actionable just because it appears in backend membership
- backend-only should be read as `not action-verified yet`, not as `forever impossible`; once the connected wallet can re-prove a unique supported structure through direct-chain data, that row may later expose supported online or offline control
- local hide or unhide is now the first safe post-baseline control because it is UI-only, useful even for stale or awkward rows, and does not change chain truth
- the recommended next implementation slice after this planning pass is local hide or unhide plus a compact node-local context-menu skeleton, with power-action slots still absent or clearly unavailable until explicit action-authority resolution is landed
- per-row online or offline control should follow one slice later, after row-to-chain authority resolution is explicit in the node-local model and the list or inspector can distinguish verified supported rows from backend-only or ambiguous rows
- on-chain rename remains deferred even though world modules expose metadata-name updates; the shipped web app does not yet have a proven rename execution path, so any future local label editing must stay separate from on-chain rename

### Refinement pass - 2026-05-02

The same branch now includes a visual-only refinement pass that preserves the first-slice behavior while tightening the node-local shell and layout.

- both `StrategicMapPanel` and `NodeDrilldownSurface` now share `TopologyPanelFrame`, which fixes the topology card to a shared `76px` header and `440px` body and applies a restrained `200ms` inner-content fade only
- the node-local canvas no longer renders the warm radial glow layer, visible family-band labels, or the temporary bottom badge
- the `family-bands-v1` packer now keeps industry, logistics, support, and dense defensive layouts on calmer aligned rails, including the high-count turret block
- local browser validation re-confirmed all six synthetic scenarios, preserved selection sync and `Back to app`, and confirmed the dev lab still makes no wallet, Sui RPC, shared-backend, or sponsor resource calls
- refreshed preview evidence was captured on `https://62259499.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

### Icon scale and centering refinement - 2026-05-02

The same branch now includes a second visual-only refinement pass focused on node-local icon scale discipline and vertical centering.

- all attached-structure map icons now use one shared operational glyph box that matches the node icon catalogue/reference doctrine, rather than varying by Mini, standard, Heavy, family, or defense-density case
- M and H badges remain the only visible size-variant signal in the node-local map; the glyph body no longer shrinks or grows for Mini or Heavy structures
- the left-side node-local layout now compacts around the visible industry, logistics, and support families instead of forcing sparse or medium scenarios onto low fixed rails
- the support and logistics layers now read as compact combined bands, which keeps `Industry Node`, `Mixed Operating Base`, and `Support Clutter Test` centered inside the fixed map body while preserving the readable high-count turret block
- local browser validation re-confirmed all six synthetic scenarios with one uniform `38 x 38` rendered structure button size in the map for every scenario, preserved selection sync, preserved `Back to app`, and confirmed the dev lab still makes no wallet, Sui RPC, shared-backend, or sponsor resource calls
- refreshed preview evidence was captured on `https://54c29a74.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

### Adaptive layout packing refinement - 2026-05-02

The same branch now includes the requested content-aware packing pass for node-local layout, replacing the last fixed-corridor assumptions in `family-bands-v1`.

- the node-local packer now builds an optional compact gate rail, a main family block, and an optional turret block from the actual visible families instead of reserving fixed horizontal rails regardless of content
- the node anchor is now derived from the visible composition and the full node-local composition is recentered in two dimensions, which removes the wasted left-side corridor on no-gate nodes while preserving compact gate-present and turret-heavy cases
- the dev-only `/dev/node-drilldown-lab` route now includes eight synthetic scenarios by adding `No-Gate Industry Node` and `No-Gate Dense Manufacturing` beside the gate-present industry baseline
- local browser validation re-confirmed sparse gate-present, both new no-gate scenarios, the support-heavy compact case, the 52-structure turret stress case, icon-to-row and row-to-icon selection sync, node-clear, `Back to app`, and that the lab still loads only local static assets with no wallet, Sui RPC, shared-backend, or sponsor requests
- refreshed preview evidence was captured on `https://9c73df12.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

### Legend and tooltip refinement - 2026-05-02

The same branch now includes a focused operator-polish pass for node-local explainability and hover behavior.

- the node-local map now includes a default-visible collapsible `Node Key` overlay mounted inside the map body, so operators can decode the expanded family set without changing the adaptive layout packer or reserving new map space
- the node-local key reuses the tracked icon grammar and now covers `Network Node`, `Gate`, `Storage / Trade Post`, `Turret`, `Printer`, `Refinery`, `Assembler`, `Berth`, `Relay`, `Nursery`, `Shelter`, and `Nest`, with `M/H = size` called out explicitly
- node and structure buttons no longer rely on native browser `title` tooltips; hover and focus now use app-styled topology tooltips plus explicit accessible labels that use middle-dot separators rather than em dashes
- local browser validation re-confirmed all eight synthetic scenarios, default-visible legend state, legend hide/show, sampled no map-button position shift when hiding the key, tooltip hover on local preview and deployed preview, `Industry Node` selection sync plus node-clear, `Back to app`, and that the dev lab still loads only local static assets
- refreshed preview evidence was captured on `https://7ff7d5cd.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

The live dashboard `Back to Strategic Network` action remains owned by the unchanged header-action seam, but it could not be re-exercised in this environment because the preview root had no connected wallet inventory or node entry point available.

### Continuity and interaction polish - 2026-05-02

The same branch now includes a final continuity-only polish pass so macro `Strategic Network` and node-local `Node Control` read as one premium surface rather than a panel swap.

- `Dashboard` now owns one mounted `TopologyPanelFrame` for both modes, so macro and node-local content swap inside the same shell with a restrained `260ms` `TopologyPanelFade` rather than remounting separate topology cards
- the lower dashboard region now uses a shared enclosed `DashboardPanelFrame` card family in both modes, which aligns macro telemetry framing with the node-local `Attached Structures` and `Selection Inspector` cards and applies the same inner-content-only fade during mode changes
- macro mode now reuses the app-styled topology tooltip shell for node hover, removes native browser `title` tooltips from the starfield and lock controls in favor of explicit `aria-label`s, and adds a restrained center-node hover ring plus pointer cursor without changing the drag-threshold click semantics
- the floating CivilizationControl logo now sits in the left operating gutter instead of the bottom-right corner; both local and deployed preview geometry confirm the logo begins at `x = 280` while the fixed sidebar ends at `x = 256`, so the badge no longer occupies the navigation lane
- local browser validation re-confirmed the disconnected dashboard shell, the enclosed macro lower-card framing, all eight synthetic lab scenarios, no map-button position shift when hiding the `Node Key`, app-styled tooltip hover with middle-dot copy, row-to-inspector selection sync, `Back to app`, and that the lab still loads only local static assets
- refreshed preview evidence was captured on `https://b3d786e9.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation re-confirmed the left-gutter logo geometry, the no-shift `Node Key` toggle on the deployed lab, app-styled tooltip hover on the deployed lab, and that the browser-loaded preview assets `App-DpY_3m4Y.js` and `SmartObjectProvider-CcV8Bfzp.js` contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` while containing neither `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, nor `X-API-Key`

The live dashboard `Back to Strategic Network` path and real macro node entry still remain unexercised in this environment because the disconnected preview root had no wallet-owned network-node inventory to select.

### Transition and shell polish follow-up - 2026-05-02

The same branch now includes a last polish-only follow-up that resolves the remaining human-review defects without widening scope into writes, presets, persistence, broader hydration, package changes, Move changes, vendor changes, or production deploy.

- the floating CivilizationControl badge now sits at the bottom-left inside the fixed sidebar rail rather than in the left content gutter, and the sidebar navigation now reserves bottom safe space so the structure inventory cannot scroll underneath the badge
- the shared shell `main` scroller now uses `scrollbar-gutter: stable`, which removed the macro-to-node horizontal jerk at the shell seam; local and deployed measurements confirmed the `main` box stayed at `x = 256` with width `932` on both `/` and `/settings` while the scrollable root route changed from `scrollHeight = 1052` to the non-scrolling `scrollHeight = 918`
- the topology header now keeps the `240px` header-action clamp only in node-local mode, so macro `Commercial` or `Defensive` controls and `Save Preset` can keep intrinsic width; local and deployed DOM checks confirmed `Save Preset` now renders on one line with `white-space: nowrap` and no native browser `title` tooltip
- macro tooltip placement now converts the hovered SVG anchor through the rendered SVG transform before positioning the shared HTML tooltip shell, which corrects the previous offset caused by `xMidYMid meet` letterboxing; this code path still needs one wallet-connected macro-node smoke because the disconnected preview root had no nodes to hover
- `TopologyPanelFade` now performs a reduced-motion-safe two-phase fade-out and fade-in body swap over `520ms` total while the outer topology and lower-card frames stay mounted, so the macro-to-node and lower-panel transitions no longer cut immediately between keyed bodies
- local browser validation re-confirmed the disconnected root shell, stable shell geometry across `/` and `/settings`, one-line `Save Preset` with no native title tooltip, and that `/dev/node-drilldown-lab` still loads cleanly as a static synthetic route
- refreshed preview evidence was captured on `https://fcff71aa.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation re-confirmed the rail-anchored badge, stable shell gutter on `/` and `/settings`, one-line `Save Preset` with `title = null`, and that the browser-served assets `App-DlB6OVKu.js` and `SmartObjectProvider-BzfeNlay.js` still contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` while containing neither `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, nor `X-API-Key`

The real macro hover tooltip and live macro-to-node body swap still need one wallet-connected smoke against owned network-node data because the disconnected preview root had no hydrated macro nodes available to hover or enter.

### Broader node-local hydration implementation - 2026-05-02

The next runtime slice from the broader-hydration plan is now wired on the same branch as an additive read-only node-local expansion.

- `Dashboard` now calls `GET /api/civilization-control/node-assemblies?networkNodeId=<selectedNodeObjectId>` through a browser-safe client whenever a live network node is selected for `Node Control`
- the request uses the existing public `VITE_SHARED_BACKEND_URL` pattern, a bounded `5s` timeout, no auth header, and canonicalized object-ID validation before the request is made
- the selected-node view model now merges direct-chain live families with backend-observed linked structures only inside `Node Control`; direct-chain rows stay primary on overlap and macro `Strategic Network` remains limited to the current owned-family topology
- backend-only rows render through the accepted node-local shell as quiet `Observed` entries in the attached-structures list, selection inspector, and topology tooltip, but they remain explicitly read-only and non-actionable
- the dev-only `/dev/node-drilldown-lab` route remains isolated from this backend lane and continues to load only local static assets
- fail-open behavior remains in place: if the node-local endpoint is unavailable, invalid, partial, or empty, `Node Control` falls back to the current direct-chain live families without widening macro state or action eligibility
- this implementation fetches on selected-node entry and node changes only; periodic polling and event-driven freshness remain deferred to the later freshness pass so the accepted shell can be validated first without adding reorder pressure from timed refetches
- refreshed preview evidence was captured on `https://99919c87.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

The intended live wallet smoke for this slice remains pending in this environment. The deployed preview exposes the wallet connector, but the browser session available to this agent could not establish a working wallet connection, so a real in-app node selection and browser-observed `node-assemblies` request could not be completed here.

### Merge reconciliation and terminology follow-up - 2026-05-02

The same branch now includes a focused correctness pass on top of the broader-hydration slice.

- live and backend-observed node-local rows now reconcile through one canonical assembly identity strategy: normalized object ID first, normalized decimal assembly ID second, with the live row collecting observed enrichment across both aliases before anything backend-only is rendered
- overlapping storage and turret rows now collapse into one authoritative live row in `Node Control`, so the UI no longer shows a live `Trade Post` or generic `Turret` beside a second backend-observed `Storage` or sized-turret variant for the same assembly
- backend type or size truth now feeds the live row when the backend knows more than the direct-chain lane, which lets node-local storage and turret rows upgrade to player-facing labels such as `Mini Storage`, `Storage`, `Heavy Storage`, `Mini Turret`, or `Heavy Turret` without weakening direct-chain ownership or action eligibility
- node-local player-facing terminology now standardizes on `Storage` only. This change is intentionally scoped to `Node Control`, the node-local list or inspector or tooltip copy derived from the node-local model, the `Node Key`, and the dev-only lab fixtures. Macro routes, sidebar labels, and dedicated `TradePosts` screens remain unchanged for this pass
- observed-status normalization now treats case and separator variants consistently and explicitly keeps `Unknown` or `Unanchored` values neutral instead of inventing online or offline state
- selected-node polling is still deferred. The current read model needed the identity and terminology pass first, and timed refetch would still risk avoidable row-order churn or backend-failure flapping before the reconciled live model is approved
- refreshed preview evidence for this reconciliation pass was captured on `https://a9d9945f.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`

Backend payload audit note for this pass:

- the production browser-origin route itself was verified from preview and returned healthy `200` responses with `cache-control: public, max-age=60`
- the locally accessible wallet-owned node IDs available to this agent returned empty `assemblies` arrays, so the exact non-empty assembler payload seen during human wallet-connected testing could not be re-captured in this environment
- because of that, the assembler gray-state root cause could not be proven as stale backend data versus an unmapped live literal from a non-empty payload; this pass therefore fixes the clear frontend normalization gap and leaves any remaining stale-data question to the follow-on wallet-connected review

### Real duplicate follow-up and debug seam - 2026-05-02

Human wallet-connected review showed that the prior reconciliation pass was not sufficient on real preview data.

- observed live node counts still doubled in the real wallet session: the affected node should show `4` storage rows and `2` turret rows, but the preview still showed `8` storage-like rows and `4` turret-like rows
- the visible duplicates resolved to the same assembly identity in the inspector, which meant the remaining bug was still an end-to-end identity problem rather than a pure shell or layout regression
- the confirmed frontend root cause in this pass was that `buildLiveNodeLocalViewModelWithObserved(...)` only reconciled overlapping observed rows before concatenation. The final candidate row list still had no last-boundary domain-identity invariant, and direct-chain discovery also had no dedupe, so any duplicate that survived earlier pairwise matching could still land in the final `viewModel.structures` array and be rendered by both the list and the canvas

Current implementation after this pass:

- every final node-local structure now receives a `canonicalDomainKey`
- the final candidate row set is collapsed by domain-identity alias overlap immediately before `Node Control` returns its `viewModel.structures` array to layout/list/inspector consumers
- domain identity is explicitly not the same as row ID. The invariant prefers normalized decimal `assemblyId`, then canonical `objectId`, and only consults render IDs when a render ID literally encodes one of those domain identifiers
- the invariant now catches live/live, live/backend, and backend/backend duplicates at the last safe model boundary instead of relying only on earlier pairwise observed merging
- backend display enrichment is still preserved on the surviving live row, while backend-only rows remain read-only and non-actionable

Regression proof added in this pass:

- deterministic probe: `npx tsx scripts/check-node-drilldown-reconciliation.mts`
- proof shape: one live storage row plus one backend `Mini Storage` row for the same assembly, one live turret row plus one backend `Mini Turret` row for the same assembly, plus backend-only assembler and printer rows
- expected result: `4` final rows total, with one merged storage row, one merged turret row, and only the backend-only assembler/printer left as observed rows

Real-preview debug seam added in this pass:

- add `?debugNodeDrilldown=1` to the preview URL
- connect wallet, enter `Node Control`, and inspect `window.__CC_NODE_DRILLDOWN_DEBUG__.latest` in browser DevTools
- the exported snapshot includes `liveRows`, `backendRows`, `candidateRows`, `candidateBuckets`, `duplicateBuckets`, `finalRows`, and `finalRenderIds`
- this path is browser-only, query-param-gated, does not call new endpoints, and does not alter the normal UI when the debug flag is absent

Current validation state:

- local deterministic probe passes
- local root dashboard still loads
- dev-only lab still loads, stays isolated from shared-backend traffic, and all eight synthetic scenarios still render
- served unique preview now lives at `https://add42d05.civilizationcontrol.pages.dev`
- served preview bundle still contains `https://ef-map.com` and `civilizationcontrol-sponsor`, and does not contain `flappy-frontier-sponsor` or `ASSEMBLY_API_TOKEN`
- real wallet-connected duplicate collapse is still not verified in this environment because the agent cannot operate the required live wallet session; human validation on the fresh preview remains mandatory before claiming the real duplicate bug is fully closed

Known remaining visual review questions for human review:

- whether the live dashboard node-local composition still feels balanced with real wallet-owned node data once a connected environment is available
- whether gate-present live nodes still feel balanced once the composition-derived anchor replaces the old fixed corridor assumptions

### Backend-membership source-selection correction - 2026-05-02

Human wallet-connected review showed that the earlier canonical-identity merge still did not close the live preview defect. The remaining bug was architectural rather than cosmetic: `Node Control` still seeded rendered membership from live `NetworkNodeGroup` rows and only appended backend-only rows, so the UI could still show duplicate storage or turret display rows even after pairwise identity reconciliation.

- `Node Control` now exposes explicit `sourceMode` values: `backend-membership`, `live-fallback`, `loading`, and `error-fallback`
- when `GET /api/civilization-control/node-assemblies?networkNodeId=...` returns a non-empty success payload, backend rows now become the rendered attached-structure membership set for live `Node Control`
- direct-chain discovery remains authoritative for owned-object proof, `OwnerCap` proof, macro-map membership, and future write eligibility, but in `backend-membership` mode those live rows are annotations only; they no longer render as competing display rows beside backend rows
- each rendered backend-membership row can now carry chain-annotation fields such as `directChainObjectId`, `directChainAssemblyId`, `hasDirectChainAuthority`, `directChainMatchCount`, and `futureActionEligible`, while still staying read-only and non-actionable in this pass
- empty backend results, loading, and backend errors now fail open to the current direct-chain live families via `live-fallback`, `loading`, or `error-fallback`, rather than widening macro state or inventing backend-only UI state
- the browser-only debug seam behind `?debugNodeDrilldown=1` now exports `sourceMode`, `liveRows`, `rawBackendRows`, `renderedRows`, `usedLiveAuthorityAnnotations`, `authorityAnnotatedRows`, and `omittedBackendCount`; the older candidate-bucket snapshot is no longer the primary proof surface
- the deterministic probe at `scripts/check-node-drilldown-reconciliation.mts` now proves the backend-membership rule directly: `4` storage rows and `2` turret rows render from backend membership while backend-only refinery, assembler, and printer rows remain read-only and no live display rows survive in that mode
- player-facing terminology is now widened beyond node-local-only surfaces: sidebar navigation, storage list/detail screens, signal-feed copy, macro structure tooltips, runtime fallback names, and accessibility labels now use `Storage` or `Storages`; this supersedes the earlier narrower scope note that intentionally left those runtime shell surfaces on `TradePost` terminology
- the `Node Key` layout now uses fixed icon and label cells so `Network Node` aligns with the other legend rows and `Storage` fits cleanly without the previous drift
- refreshed preview evidence for this correction pass was captured on `https://dfc5eebe.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s-jtn6.civilizationcontrol.pages.dev`

Current validation state for this correction pass:

- local deterministic backend-membership probe passes
- local root dashboard shell loads and now shows `Storages` in the sidebar plus `Storages` in the active-structures metric subtitle
- local and served `/dev/node-drilldown-lab` both still load all eight scenarios, and the `Node Key` now shows an aligned `Network Node` row plus the updated `Storage` label
- served preview root and served preview lab both load on the new unique preview URL
- served preview bundle proof confirms `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` are present, while `flappy-frontier-sponsor`, `ASSEMBLY_API_TOKEN`, `Authorization`, and `X-API-Key` are absent from the browser-loaded JS assets reviewed in this pass

Still pending after this pass:

- one real wallet-connected preview review to confirm the same live node now renders `4` storage rows and `2` turret rows instead of the earlier doubled counts
- one real wallet-connected check that the widened `Storages` shell copy and aligned `Node Key` still feel correct against the live backend-membership payload

### Shell chrome polish follow-up - 2026-05-02

The same branch now includes a narrow UI-only polish pass on top of the accepted backend-membership correction.

- the fixed shell header no longer renders the hackathon-era `Vote for CivilizationControl` pill, leaving the brand wordmark and wallet controls as the only top-bar actions in this pass
- the top-left `CivilizationControl` wordmark now routes to `/` through the existing client-side app router, so operators can return to `Command Overview` from other shell routes without widening scope into new navigation state
- the `Node Key` overlay is now slightly narrower at `258px` wide instead of `272px`, with a tighter two-column gap, while preserving the existing icon sizes, row structure, `Network Node` alignment, and `Storage` terminology from the accepted backend-membership pass
- local browser validation re-confirmed the disconnected root shell, title-link return from `/activity` to `/`, vote-pill removal, the dev-lab `Node Key` hide/show toggle, measured `258px` legend width, preserved `Network Node` row alignment, preserved `Storage` label, and that the dev lab still loads only local preview assets
- refreshed preview evidence for this shell-chrome pass was captured on `https://320df55d.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s-jtn6.civilizationcontrol.pages.dev`
- deployed preview validation re-confirmed the served root shell no longer shows the vote pill, the served title link returns to `/` from `/activity`, the served `/dev/node-drilldown-lab` legend still measures `258px`, and the browser-loaded preview assets still contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` while containing neither `flappy-frontier-sponsor` nor `ASSEMBLY_API_TOKEN`

### Final Node Control chrome tighten pass - 2026-05-02

The same branch now includes one more narrow UI-only pass for the three remaining polish defects called out in review.

- the `Node Key` no longer relies on a forced fixed shell width. It now shrink-wraps to its content width with balanced outer `px-3` padding and content-sized legend columns, which reduced the measured legend width on local and deployed `/dev/node-drilldown-lab` from the previous `258px` shell to about `208.6px` while keeping icon size, text size, row height, `Network Node` alignment, and `Storage` terminology intact
- node-local hover tooltips no longer surface implementation provenance such as `Backend membership`, `backend-only row`, or other row-source diagnostics. Structure hover now stays user-facing with title plus family or type, size, and status only; provenance remains available in the Selection Inspector and the debug export path instead of the hover shell
- the top-left `CivilizationControl` wordmark and the sidebar `Command Overview` item now share one explicit app-home request path. When Dashboard is already mounted on `/`, that request clears the current node-local selection and returns the topology header to `Strategic Network`; when the operator is on another route, the same home action still returns to `/` without a routing overhaul
- local browser validation re-confirmed the disconnected root shell, title-link return from `/activity` to `/`, continued vote-pill absence, `Storages` shell copy, the dev-lab `Node Key` hide/show toggle, the measured `208.6px` legend width, the preserved `Network Node` and `Storage` rows, two-line tooltip copy on structure hover with no provenance line, and that the dev lab still loads only local preview assets
- refreshed preview evidence for this tighten pass was captured on `https://150a48ba.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s-jtn6.civilizationcontrol.pages.dev`
- deployed preview validation re-confirmed the served root shell still omits the vote pill, still shows `Storages`, still returns `/activity` to root macro mode through the top-left wordmark, and that the served `/dev/node-drilldown-lab` legend now measures about `208.6px` while hover shows only title plus detail copy and the browser-loaded preview assets still contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` while containing neither `flappy-frontier-sponsor` nor `ASSEMBLY_API_TOKEN`

Still pending after this pass:

- one real wallet-connected smoke to exercise the new in-root home reset while live `Node Control` is actually open on `/`; this environment still had no wallet-owned node data available to enter the live drilldown
- one wallet-connected confirmation that the same home-reset path feels correct from both the top-left wordmark and sidebar `Command Overview` against real backend-membership node-local data

### Node Key right-edge spacing correction - 2026-05-02

The same branch now includes one final narrow UI-only follow-up for the Node Key shell balance.

- the `Node Key` still shrink-wraps to its content width and still avoids the earlier fixed-width shell, but its legend panel now biases only the trailing padding from balanced `px-3` to `pl-3 pr-6`, which widens the rendered key from about `208.6px` to about `220.56px` on local and deployed `/dev/node-drilldown-lab`
- the widened trailing gutter restores a small amount of right-side breathing room without changing icon size, text size, row height, two-column structure, `Network Node` alignment, `Storage` terminology, or the `M/H = size` header copy
- local browser validation re-confirmed the disconnected root shell, continued vote-pill absence, continued `Storages` shell copy, `/activity` rendering under the stable shell, the dev-lab `Node Key` hide/show toggle, the measured `220.56px` legend width, unchanged network-node button position when hiding and re-showing the key, preserved `Network Node` and `Storage` rows, and that the dev lab still loads with no wallet, Sui RPC, shared-backend, sponsor, or transaction-path resource requests
- refreshed preview evidence for this spacing pass was captured on `https://3b8b0399.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s.civilizationcontrol.pages.dev`
- deployed preview validation re-confirmed the served root shell still omits the vote pill, still shows `Storages`, the served `/dev/node-drilldown-lab` legend now measures about `220.56px`, the hide/show toggle still leaves the node button footprint fixed, and the served preview assets still contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` while containing neither `flappy-frontier-sponsor` nor `ASSEMBLY_API_TOKEN`

### App-shell route transition polish - 2026-05-02

The same branch now includes a narrow shell-level polish pass that extends the calmer Node Control transition language to main app-section navigation without widening scope beyond UI presentation.

- the fixed operator shell still mounts `Header`, `Sidebar`, wallet controls, `LogoBadge`, asset-discovery providers, and the existing home-reset token once; only the nested route body inside the shell `main` region now transitions between app sections
- operator route content now renders through a dedicated shell-route transition keyed by route pathname, so `Command Overview`, `Gates`, `Storages`, `Turrets`, `Network Nodes`, `Signal Feed`, and `Configuration` fade as page content while the sidebar rail, top header, wallet controls, and floating badge remain visually stable and fully opaque
- the new route transition uses the same cubic-bezier motion language as the accepted topology fade but at a shorter total duration: `400ms` total split into about `200ms` fade-out and `200ms` fade-in, which keeps app-section navigation subtler and quicker than the accepted `520ms` total Strategic Network ↔ Node Control swap
- reduced motion now short-circuits the new shell-route transition to an immediate content swap instead of staging opacity changes; this is scoped to app-shell route content only and does not alter the existing accepted Node Control transition behavior when normal motion is enabled
- the route transition is keyed only to route identity, not dashboard-local topology state, so the accepted `Strategic Network` ↔ `Node Control` fade on `/` remains the only fade used for that internal dashboard-mode swap; route changes into or out of `Command Overview` can fade the whole route body, but in-page node selection and home reset continue to use the accepted internal dashboard transition instead of a second shell fade
- local browser validation re-confirmed the root shell, continued vote-pill absence, continued `Storages` terminology, the shell route wrapper as the only transitioning layer with `0.2s` per-phase opacity, sampled sidebar route hops with header and sidebar staying at opacity `1`, return to root through the top-left wordmark, and that `/dev/node-drilldown-lab` still loads as an isolated shellless route with only local static assets
- refreshed preview evidence for this shell-route pass was captured on `https://c192c19b.civilizationcontrol.pages.dev` with alias `https://feat-node-drilldown-render-s-jtn6.civilizationcontrol.pages.dev`
- deployed preview validation re-confirmed the served root shell, continued vote-pill absence, continued `Storages` terminology, the same body-only route-transition wrapper on app-shell pages, return to root through the top-left wordmark, the continued shellless `/dev/node-drilldown-lab` isolation, and that the browser-loaded preview assets still contain `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com` while containing neither `flappy-frontier-sponsor` nor `ASSEMBLY_API_TOKEN`

Still pending after this pass:

- one wallet-connected smoke to re-enter live `Node Control` on `/` and visually confirm that the accepted internal dashboard fade still feels correct beside the new page-level route transition
- one human preview review to judge whether the new app-shell route fade feels subtle enough across the full left-rail navigation loop in a real browser session

### Broader hydration and event freshness planning - 2026-05-02

The accepted shell on `feat/node-drilldown-render-shell` is now the baseline for the next major slice.

This subsection is historical context from the earlier planning pass that immediately preceded the accepted broader-hydration implementation later documented in this file.

- the same-dashboard `Node Control` entry and exit, stable topology footprint, accepted lower-panel framing, accepted `Node Key` and tooltip behavior, accepted icon sizing, and the dev-only lab remain in place
- at the time of this planning pass, `Node Control` still rendered only the current `NetworkNodeGroup` families, so a real wallet-owned node could show only `gates`, `storageUnits`, and `turrets` around the selected `network_node`
- the richer family vocabulary already exists in the normalized node-local renderer, but it is synthetic-only today; live `buildLiveNodeLocalViewModel()` never receives printers, refineries, assemblers, berths, relays, nursery or nest, shelters, or other future node-local families
- the target for the next pass is richer node-connected visibility inside `Node Control` only; macro `Strategic Network` must stay limited to network nodes, gates, trade posts or storage units, and turrets

Recommended read authority model for that pass:

- direct-chain discovery remains authoritative for wallet-owned structure discovery, owner-cap resolution, node linkage, linked gates, fuel state, extension status, live power state, and any future write eligibility
- CivilizationControl should expand the direct-chain owned-structure lane first wherever `suiReader` and `inferStructureType()` can prove broader families through the existing wallet path
- the existing `GET /api/civilization-control/assemblies?ids=...` contract remains additive only; it can enrich already-known structures with labels, type metadata, observed status, fuel, `energySourceId`, `lastUpdated`, `fetchedAt`, and `source`, but it cannot discover additional node members because it accepts known assembly IDs only
- true node-connected discovery beyond the current wallet-discovered lane requires new EF-Map/shared-backend work. The recommended contract is a CC-safe filtered node-local summary endpoint keyed by the selected network-node object ID or equivalent `energySourceId`, returning only assemblies whose relationship to that node is proven server-side plus `fetchedAt`, `source`, and per-assembly `lastUpdated`
- backend-observed node members are safe to show only as read-only node-local observations. They must never grant write eligibility, never stand in for `OwnerCap` or direct-chain ownership proof, and never widen macro metrics or macro map membership

Freshness and fail-open strategy:

- today the drilldown is still pull-based: direct-chain discovery and the exact-ID summary enrichment poll, while the current EF-Map universe-events websocket is global and unfiltered and therefore not a safe node-local browser contract
- the broader hydration pass should preserve provenance and freshness in the normalized node-local model so list and inspector surfaces can show quiet `source` or `lastUpdated` state without changing the accepted icon grammar
- status updates should repaint in place and preserve current selection; rename updates should not be allowed to reshuffle unrelated layout unless membership changes
- event-driven freshness should be planned as a separate follow-up after broader hydration. The near-term path is faster selected-node polling or filtered invalidation against the new node-local summary contract; later SSE or WebSocket work is only justified if EF-Map adds a filtered node-local stream
- if the backend is down, stale, or partial, `Node Control` must fail open to the current direct-chain `NetworkNodeGroup` families. Backend-only rows may be omitted or marked stale, but valid chain-backed structures, selection state, and future action eligibility must remain intact

Validation strategy for the next pass:

- confirm a wallet-owned node with broader connected structures still enters `Node Control` without shell or scrollbar regressions
- confirm broader families appear only inside `Node Control`, never in macro `Strategic Network`
- confirm backend-observed rows are visibly non-actionable and do not change direct-chain ownership or write eligibility
- confirm direct-chain fallback still renders the current four-family node-local view when the backend is unavailable or partial
- confirm the dev lab grows at least one stale-data and one backend-observed fixture before freshness UI ships

Manual wallet smoke checklist for the next runtime slice:

- connect a wallet that owns at least one network node with non-canonical attached structures
- enter `Node Control` from the live macro map and confirm the accepted shell state stays unchanged
- confirm current direct-chain families still render before or without backend enrichment
- confirm broader families appear only in node-local mode and stay read-only until a direct-chain action path exists
- change a structure status or name outside CivilizationControl and confirm the selected node refreshes without losing selection or widening the macro map
- disable or break backend enrichment and confirm the drilldown falls back cleanly to the current direct-chain lane

## 2. Product intent

The intended experience is a same-dashboard drilldown, not a hard jump to a second product surface.

- In macro mode, the operator sees the existing dashboard shell: sidebar, hero metrics, Strategic Network panel, Recent Telemetry Signals, and Attention Required.
- Clicking a Network Node should enter a node-local view while preserving that shell and preserving the same map footprint.
- The map title should change from `Strategic Network` to a node-local title. Recommended title: `Node Control`.
- `Node Control` is the best fit because the surface is broader than posture alone: it must support inspection, visibility management, local labels, future presets, and later safe write actions.
- Macro view stays macro. The strategic map should continue to show only network nodes, gates, trade posts or storage units, and turrets.
- Node-local mode becomes the place where the richer node-connected family set can appear over time, including printers, refineries, assemblers, berths, relays, nursery or nest, shelters, and later industry-linked structures.
- The lower dashboard region should stop acting like macro telemetry while node-local mode is active. It should become a structure list and control surface tied to the selected node.
- Future presets should be user-named and node-scoped. `Commercial` and `Defensive` are current macro posture labels, not the long-term node-local vocabulary.

## 3. Current app architecture

### Dashboard shell and route ownership

- `src/App.tsx` renders the shared `OperatorShell`, which owns `useAssetDiscovery()` and shared shell layout.
- `src/screens/Dashboard.tsx` renders the current Command Overview composition: hero metrics, `StrategicMapPanel`, and the lower telemetry and attention panels.
- `src/components/topology/StrategicMapPanel.tsx` owns the current macro topology canvas, header controls, posture strip, orbit camera integration, and per-node rendering through `NodeClusterSvg`.
- `src/screens/NetworkNodeDetailScreen.tsx` already exists as a route-local node screen, but it is currently a standalone detail surface rather than the in-dashboard drilldown the product now wants.

### Indexer-first Node Control read model - architecture correction

Node Control should now pivot away from browser direct-chain discovery as the primary read path. The accepted UI shell stays in place, but the next implementation work should boot the operator experience from one shared-backend operator-inventory response instead of repeated browser-side wallet -> `PlayerProfile` -> `Character` -> `OwnerCap` traversal.

Core rules for the corrected architecture:

- EF-Map or shared backend is primary for operator read, display, status, and freshness
- browser Sui JSON-RPC must not be required for initial wallet inventory rendering
- the backend should return wallet-scoped or character-scoped operator inventory for the connected operator; preferred public request shape is `GET /api/civilization-control/operator-inventory?walletAddress=0x...` because the connected wallet is already available at app boot and the backend can resolve indexed operator or character context server-side
- `GET /api/civilization-control/operator-inventory?characterId=0x...` may exist later as a secondary override or debug variant if the indexer cannot always derive a unique character cleanly from wallet scope alone, but it should not be the default browser boot contract
- the operator inventory response should return network nodes, attached structures, structure family, size, display name, status, online or offline or unanchored state, linked node context, freshness, and provenance without requiring browser-side broad rediscovery
- the response may also return indexed `OwnerCap` or action-candidate data for supported families when the backend can derive it safely
- wallet and chain remain final authority for transaction signing, transaction execution, and final write outcome
- a stale indexed action candidate may fail when submitted, but that failure should not break the read UI or remove the display row
- post-action refresh should come from targeted backend or indexer refresh, not broad browser rediscovery
- browser direct-chain reads are allowed only as narrow optional fallbacks or debug checks, not as the primary boot path or the main freshness loop

#### Proposed shared-backend operator-inventory contract

Preferred request shape:

- `GET /api/civilization-control/operator-inventory?walletAddress=0x...`

Response requirements:

- operator identity fields available from the indexer, including the connected wallet, resolved character when indexed, and any safe tribe or relationship labels already used by the product
- network nodes owned or controlled by the operator, grouped with their attached structures where known
- unlinked or unknown-node structures when a structure is indexed but cannot yet be grouped to a node confidently
- per-structure identifiers and display fields including assembly object ID, decimal assembly ID when available, indexed `OwnerCap` ID when available, owner wallet or character relationship when indexed, `typeId`, family, size, display name, status (`Online`, `Offline`, `Unanchored`, `Unknown`), `energySourceId` or `networkNodeId`, and any indexed fuel or power summary fields
- per-row freshness and provenance fields, including last observed checkpoint, last observed timestamp, backend source marker, and any stale-or-partial indicator needed for honest operator display
- per-row `actionCandidate` metadata for supported families: family supported yes or no, indexed `OwnerCap` present yes or no, required object IDs for the existing frontend transaction builder when available, and a plain unavailable reason when the row is not actionable

Contract guardrails:

- the endpoint must not expose secrets, database credentials, or internal VPS hostnames
- the browser must not connect directly to Postgres or raw internal service hosts
- CORS should remain limited to CivilizationControl allowed browser origins
- no browser API key should be required under the current shared-backend policy; if policy changes later, it still must not rely on private browser secrets
- the current `assemblies?ids=` and `node-assemblies` routes should be treated as transitional contracts rather than the final app-boot seam

### Current data model and grouping

- `src/types/domain.ts` currently limits `StructureType` to four live families: `network_node`, `gate`, `storage_unit`, and `turret`.
- `src/hooks/useAssetDiscovery.ts` groups discovered structures into `NetworkNodeGroup`, which contains `node`, `gates`, `storageUnits`, and `turrets`.
- That shape is sufficient for a first render-only drilldown using the current live families.
- That shape is not sufficient for the broader future family set without later data-model and read-path expansion.

### Recommended renderer boundary

The node-local renderer should be data-driven.

- it should accept a normalized node-local structure list or view model instead of reaching into wallet-discovery state internally
- the production dashboard can then pass normalized data derived from live `NetworkNodeGroup` state
- a dev-only scenario lab can pass normalized synthetic fixture data through the same renderer
- a later broader-hydration phase can pass richer future family data without rewriting the renderer contract

This is a planning requirement for the first implementation branch because real Stillness ownership is too sparse to validate dense and future-like layouts using wallet data alone.

### Read-path and authority boundaries

- the forward-looking target is one shared-backend operator-inventory response that becomes the primary provider for dashboard boot, Node Control membership, operator display state, and freshness
- browser Sui JSON-RPC must not be required to render the initial wallet inventory once a wallet is connected; current direct-chain discovery remains the current implementation state only, not the desired center of gravity
- the existing `assemblies?ids=` and selected-node `node-assemblies` routes are transitional shared-backend surfaces that proved browser-safe enrichment and node-local membership display, but they are not the final boot-time operator read contract
- browser direct-chain reads may remain as narrow optional fallbacks, targeted verification checks, or debug seams, but they must not block initial inventory rendering or become the default polling base
- chain reads remain the final source of transaction-building inputs, signing proof, execution proof, and any exact write-path recovery work that cannot safely come from indexed data
- post-action freshness should come from backend invalidation or indexer refresh first; broad browser rediscovery loops are the behavior to remove, not the behavior to reinforce
- event freshness is still a separate contract question, but any future fast path should sit on filtered backend refresh or filtered push rather than public-fullnode browser polling

### Action authority model

- `Node Control` should keep display membership, indexed action-candidate state, and chain-final execution as three separate truths
- backend inventory membership defines which rows appear in the node-local map and attached-structure list
- indexed ownership or `OwnerCap` and action-candidate data define whether a displayed row is supported, unavailable, stale, or read-only for future controls
- no action should ever be inferred from display-only membership alone
- wallet signature plus on-chain transaction execution define final authority and final outcome
- a stale indexed action candidate may fail when submitted; the frontend should surface `Action failed` or `Refresh needed` while keeping the display row intact instead of deleting or reclassifying membership abruptly
- unsupported families remain read-only until explicit transaction support exists
- ambiguous or missing indexed authority remains unavailable
- hide or unhide is exempt from this rule because it is local UI state and may apply to any rendered row, including rows that are display-only or temporarily stale

### Backend membership vs action authority

- backend inventory should group structures by network node where known and surface unlinked or unknown-node rows separately when grouping is incomplete
- direct-chain annotations remain useful as debug or recovery context, but the main actionable contract should move to indexed action-candidate fields returned alongside the display row
- a row may later become actionable only when the indexed action-candidate metadata shows a supported family and the required identifiers for the existing transaction builder are present
- backend refresh must not create write authority by itself, clear local hide state, or silently convert a display row into an actionable row without updated indexed action-candidate state
- if the backend is stale, partial, or unavailable, the app should degrade controls or show stale-state warnings rather than blanking the UI or forcing a broad browser rediscovery loop
- the list and inspector remain the primary surfaces for power controls and unavailable explanation; the context menu stays a shortcut only

### Unanchored/stale chain-state handling

- CivilizationControl should show the structure honestly when chain or backend state still shows it, even if the in-game client appears to have partially dismantled, unanchored, or stranded it
- `Unanchored`, `Unknown`, stale, or awkward observation states should render as real node-local status or warning context rather than being collapsed into a fake delete
- local `Hide from Node View` is the safe escape hatch for stale or unwanted rows: it removes the structure from the node-local SVG only, keeps it visible in `Attached Structures`, and allows later unhide
- if the wallet can still prove direct-chain authority and the structure family supports a known power path, later online or offline control may remain valid even for unanchored or stale rows
- `Node Control` should not globally suppress, delete, or invent chain truth for these rows; it should separate honest observation from local operator preference

### Existing write surfaces

- `src/components/PostureControl.tsx` and the posture hooks are fleet-scoped and gate-led today. They are not the right model for node-local presets.
- That macro posture system is still a live shipped feature, not a historical label only: gate detail already authors separate `Commercial` and `Defense` presets, and gate permit issuance already selects between them by reading each gate's current posture.
- `feat/restore-posture-switching` restores the earlier macro-control seam without changing packages: empty targets are blocked before PTB build, gate-present switching now checks target-mode preset completeness, and turret-only or no-gate sessions keep a local last-successful doctrine fallback instead of relying on first-gate readback. It still remains a fleet-scoped macro control and is not the right model for node-local presets.
- After human wallet-connected preview smoke and the final macro polish pass, the Strategic Network strip is intentionally spare: `Commercial` and `Defensive` remain, `Save Preset` stays removed, and all persistent helper narration under the macro posture controls is gone. Node Power State presets still belong later in Node Control, not in the Strategic Network macro strip.
- Human smoke confirmed that turret-only or no-gate posture switching can succeed after wallet and live world state settle, but three seams remain intentionally deferred here: Signal Feed still lacks posture or turret-doctrine history because EF-Map `signal-history.v1` does not expose those rows; turret extension or readiness display can still overstate rebind work because the indexed read model does not yet mirror the old direct-chain doctrine truth; and stale post-write structure status after in-app power actions remains a separate zero-package write-action parity follow-up.
- `src/hooks/useStructurePower.ts` and `src/lib/structurePowerTx.ts` already provide structure-level power actions for supported current families.
- `src/screens/NetworkNodeDetailScreen.tsx` already exposes node online, while node offline remains explicitly unsupported.
- world modules expose metadata-name updates for gates, storage units, turrets, generic assemblies, and network nodes. This line is now historical only: the later zero-package action branches shipped rename execution for the supported world-family targets plus generic attached-assembly rows that resolve to one supported indexed `assembly` candidate with the required IDs.

### Icon catalogue state

- The node icon catalogue/reference work is complete and merged.
- The static icon reference route is `/dev/node-icon-catalogue`.
- The node-local drilldown should consume that tracked icon grammar rather than inventing a second visual language.

## 4. Proposed UX model

### 4.1 Modes

The dashboard should have two topology modes:

- `Macro mode`: the existing Strategic Network overview.
- `Node-local mode`: a focused `Node Control` view for the selected network node.

`Dashboard` should own the mode and selected node state because the lower panel also changes with the same selection. `StrategicMapPanel` should remain the macro-map renderer and emit node-selection intent instead of owning drilldown mode itself.

### 4.2 Macro mode

Macro mode remains intentionally simplified:

- title stays `Strategic Network`
- current map footprint stays unchanged
- current orbit, pan, zoom, lock, and fixed-world-position behavior stays unchanged
- macro family set stays limited to network nodes, gates, trade posts or storage units, and turrets
- lower region remains Recent Telemetry Signals plus Attention Required
- current `Commercial` and `Defensive` posture strip remains macro-only

### 4.3 Node-local mode

Node-local mode should feel like the operator drilled inward without leaving Command Overview.

- map title changes to `Node Control`
- subtitle should identify the selected node and reinforce the local scope, for example `Attached structures and local posture presets`
- hero cards and sidebar remain unchanged
- the map footprint stays identical to the macro panel footprint
- the selected node becomes the visual anchor of the node-local map
- the lower region becomes a structure list plus inspector surface instead of macro telemetry

### 4.4 Entry and exit

- Clicking a network node in macro mode should enter node-local mode on pointer-up, provided the interaction did not exceed the map drag threshold.
- Hover should remain restrained. Entry should depend on deliberate click, not aggressive hover affordances.
- Node-local mode should expose an explicit `Back to Strategic Network` action in the panel header.
- `Escape` should exit node-local mode when no context menu or inline edit is open.
- Browser Back should eventually close node-local mode before leaving the dashboard shell, but the first runtime slice ships without URL mirroring and therefore keeps Browser Back deferred.

### 4.5 Route and history behavior

The product requirement is continuity, not a separate-feeling route transition. The recommended implementation model is:

- make `Dashboard` the visual owner of node-local mode
- mirror the selected node into URL state so refresh and Back behave predictably
- keep the dashboard shell rendered during node-local mode
- keep `NetworkNodeDetailScreen` as a compatibility or deep-link surface until the drilldown surface is mature enough to be shared or replaced

Implementation status for the first runtime slice:

- `Dashboard` is now the visual owner of node-local mode
- the shell remains continuous during node-local mode
- URL mirroring and Browser Back remain deferred until a later routing pass
- `NetworkNodeDetailScreen` remains untouched as the existing compatibility surface

The exact URL shape can be decided during implementation, but it should preserve the same-shell feel. A dashboard-local URL token is safer than redirecting the operator into a full-page detail layout on first implementation.

### 4.6 Posture and preset controls

In node-local mode, the header control strip should stop presenting `Commercial` and `Defensive` as the primary labels.

- zero presets: show an empty state plus a persistent `Save Preset` affordance
- one preset: show one named preset pill plus `Save Preset`
- many presets: show up to three named preset pills, then an overflow menu, plus `Save Preset`
- named examples are product examples only: `Industry`, `Defense`, `AFK`, `Mining`, or any operator-defined name

The first implementation branch should not execute presets. The first branch should only reserve the space where preset controls will later live.

### 4.7 Lower region behavior

When node-local mode is active, the current lower region should change purpose rather than compete with macro telemetry.

Recommended lower-region layout:

- left 2/3: `Attached Structures` table or list
- right 1/3: `Selection Inspector` for the selected structure or selected node
- the first implementation branch should include both surfaces, even if the inspector is still a placeholder and the list remains read-only

Macro telemetry and attention content should be hidden while node-local mode is active. They should return when the operator exits back to macro mode.

This is the cleanest behavior because it avoids mixing two scopes in one surface. If node-local telemetry is desirable later, it should arrive as a node-scoped inspector detail, not as the macro panels squeezed into node-local mode.

This same-dashboard swap is also an important validation aid. A node-local SVG without the paired structure list and inspector would be hard to evaluate because the operator would have no grounded secondary surface for confirming selection, naming, and future action placement.

### 4.8 Selection and context actions

- clicking a node-local icon selects that structure
- clicking a structure row selects the same structure
- selected icon and selected row use the same single source of truth
- selection highlight uses the existing orange or halo doctrine and remains calm
- click or focus is the primary select behavior and should stay implicit rather than consuming menu space
- right-click should be compact and secondary, not the primary interaction model
- the next-slice context menu should ship only `Hide from Node View` for visible rows
- `Unhide` should live in the list and inspector for hidden rows rather than in the canvas menu
- later `Bring Online` or `Take Offline` entries may appear only for verified supported rows and should call the same action surface as the list or inspector
- `Rename` should stay absent until rename semantics are resolved separately from local labels

## 5. Node-local map layout

### 5.1 Layout doctrine

The node-local layout should not reuse the macro radial cluster literally, and it should not draw default lines from every structure back to the selected node.

The selected node already defines the scope. Using node-to-child connector lines by default would spend the visual link language too early and create noise before future industry relationships need it.

The recommended default algorithm is `family-bands-v1`.

### 5.2 Anchor and available space

- map footprint stays the same as the current macro panel footprint
- selected node anchor sits slightly left of center: `x = 38% of map width`, `y = 50% of map height`
- keep a clear halo zone around the node so future selection and relationship lines have room
- reserve the right half of the panel for family rows and future per-structure links

### 5.3 Family ordering

The family order should be stable even before all families are hydrated. Recommended order:

1. printers
2. refineries
3. assemblers
4. storage or trade posts
5. berths
6. turrets
7. gates
8. support band: relay, nursery, nest, shelters

Current render-only phases should only render the families present in the live data model. Empty future families should not render placeholder icons.

This order is intentional rather than generic:

- printers and refineries are expected to be the highest-density and highest-interest repeated industry rows
- assemblers remain their own family because they are meaningful but usually lower-count than printers or refineries
- storage or trade posts and berths form the logistics layer beneath industry
- turrets get their own dedicated defensive treatment because they may become the largest repeated family in real bases
- gates remain distinct at the edge because they imply outward corridor relationships
- relay, nursery, nest, and shelter-like families should default to a compact support band rather than consuming full-height priority rows

### 5.4 In-family ordering

Within each family:

- size order: `Mini`, then unbadged standard, then `Heavy`
- then display label
- then stable object ID fallback

This preserves visual predictability and avoids icon shuffle between refreshes.

### 5.5 Family block behavior

- one row per family by default
- if a family exceeds the row capacity, wrap within the same family before moving to the next family
- do not collapse individual structures into counts in node-local mode
- hidden structures are excluded from the map layout but retained in the structure list
- support structures stay grouped in a combined support band by default; they only earn separate rows later if real hydrated counts justify it

### 5.6 Special handling for turrets, gates, and support structures

Turrets, gates, and support structures should remain visually distinct from the main industry and logistics rows.

- turrets should occupy a dedicated defensive block on the right side of the node-local composition so they still read as perimeter defense without crushing the industry rows
- gates should occupy the far-right rail or corridor edge because they are the likely future carriers of outward relationships
- support structures should sit below the logistics rows in a compact support band, still as individual icons but with lower visual priority than industry, logistics, defense, and corridor families
- this keeps the structure hierarchy readable while preserving room for later relationship links and hide or unhide controls

#### Turret high-count rule

Real operator bases may have many turrets: 20, 30, 50, or more. The default layout must treat turret density as a first-class constraint.

- turrets remain individual selectable icons in the first node-local view
- turret order is `Mini`, then standard, then `Heavy`, then label, then object ID fallback
- the defensive block should use wrapped rows or a dense-grid perimeter block rather than a single unbounded row
- the block should reserve minimum spacing for halo visibility and individual selection targets
- industry and logistics rows keep their own vertical budget; turret rows should expand within the defensive block before they are allowed to steal the center rows
- when turret count exceeds the comfortable single-band capacity, the layout should create additional wrapped turret rows inside the same right-side defensive block
- if turret count exceeds the available right-side block height, the layout should tighten horizontal and vertical turret spacing down to a minimum readable threshold before shrinking the industry or logistics block
- if even the dense defensive block cannot fit the live turret count cleanly, the layout should still render all individual turrets in the first implementation and accept a denser block rather than introducing early aggregation

Possible later option only if real player bases prove too dense: optional turret aggregation or paging. That should remain explicitly out of scope for the first implementation.

#### Support-band rule

Relay, nursery, nest, and shelter-like families should default to a combined support band.

- keep individual icons, not counts
- sort within the support band by family, then size where relevant, then label or object ID
- keep the band visually secondary and lower in the composition than industry, logistics, defense, and gates
- plan later hide or unhide controls carefully because support structures are likely to become the visually noisy families operators most often suppress

### 5.7 Centering logic

The layout should center the visible structure block intentionally instead of relying on fixed row offsets.

Recommended logic:

- filter hidden structures out of the visual set first
- compute the number of visible industry, logistics, support, and gate rows after wrapping
- compute turret block width and height separately because turret density can dominate the composition
- compute the left-side content block and right-side defensive block independently, then center them as one intentional composition around the selected node anchor
- compute each row's starting `x` from the available family band width so short rows do not hug the left edge awkwardly
- if the left-side family block would overflow height, reduce row gap and icon gap down to a minimum threshold before creating a secondary lower-right column for non-turret families
- if the turret block would overflow height, tighten turret spacing first before borrowing vertical space from the support band or left-side rows

### 5.8 Future relationship compatibility

This layout deliberately leaves visual room for future industry and relationship links.

- the node-to-structure link language remains mostly unused by default
- future printer-to-refinery, refinery-to-storage, or logistics links can be layered into the right-side band later
- later drag overrides can reposition structures without invalidating the default family order

## 6. Structure list and control surface

### 6.1 Lower-panel structure

The lower node-local surface should use the same broad 2/3 + 1/3 composition as the current dashboard, but with different content.

- left 2/3 card: `Attached Structures`
- right 1/3 card: `Selection Inspector`

This preserves dashboard rhythm while changing the content meaningfully.

### 6.2 Structure list rows

The structure list should plan for one row per structure with these columns or data cells:

- hide or hidden-state control
- structure icon
- display name or future local label
- structure family or type
- size badge or size text where relevant
- online or offline status where available
- optional relationship note, for example linked gate destination later
- authority or visibility state
- primary action cell used by verified safe actions or explicit unavailable copy

For the accepted UI baseline:

- rows should remain read-only
- status display should remain read-only text or badge only
- backend-only or ambiguous rows should already read as non-actionable in the inspector and should continue to do so until direct-chain verification exists

For the next implementation slices:

- hide or unhide becomes the first interactive row control and applies to any rendered row, including backend-only, unanchored, or stale rows
- rows with supported indexed action candidates may later gain online or offline controls in the same row or inspector, but unsupported, ambiguous, or missing-candidate rows should show plain-language unavailable copy instead of generic disabled buttons
- local label editing and rename should remain deferred until their semantics are separated cleanly

### 6.3 Selection sync

- selecting an icon highlights the matching row
- selecting a row highlights the matching icon
- only one structure is selected at a time in early phases
- the inspector reads from the same `selectedStructureId`
- hiding the selected row should keep the row selected and keep the inspector open, even though the SVG icon disappears until unhidden
- background click in node-local mode clears structure selection before exiting node-local mode

### 6.4 Naming model separation

The plan must separate four different naming or action concepts that can easily be confused:

- `Local label`: UI-only operator nickname, stored locally, safe for early phases
- `Metadata or DApp URL update`: future structure-specific metadata flow if that structure supports it; not the same as local labels
- `On-chain rename`: explicit write action if such a path is later proven safe and useful
- `Display name fallback`: the current rendered name coming from direct-chain data plus optional shared-backend summary fallback

The first implementation branch should not edit any of these. It should only reserve room for the distinction.

Current audit note for future phases:

- historical note: world modules expose on-chain metadata-name updates for gates, storage units, turrets, generic assemblies, and network nodes, and the later zero-package action branches now ship rename execution for the supported world-family targets plus generic attached-assembly rows that resolve to one supported indexed `assembly` candidate with the required IDs
- local labels should still remain a separate UI-only seam from on-chain rename capability even after the shipped rename work; later preset or label work should not collapse those two concepts back together

### 6.5 Hide and unhide behavior

- hide removes the structure from the node-local map only; it does not remove the row from authoritative node membership
- hidden structures stay visible in the list and inspector with clear `Hidden from map` state and `Unhide` control
- hide or unhide may apply to any rendered row, including backend-only, unanchored, or stale rows
- hiding the selected row should keep that row selected and swap the primary local control to `Unhide`
- hidden state is local, node-scoped, and keyed by `canonicalDomainKey`, not chain truth
- backend refresh must not resurrect a hidden row into the SVG automatically; only explicit unhide or local-state reset should do that
- hide or unhide performs no chain writes

Hide and unhide is now the first safe control after the accepted UI baseline because it solves a real operator problem without weakening the backend-membership versus chain-authority boundary.

### 6.6 Action placement

Keep the compact context menu intentionally small. The main control surface for actions should be the list row or inspector, not the right-click menu.

Recommended action split:

- list or inspector: primary safe actions, hide or unhide, unavailable-state explanation, future local labels, and later verified power controls
- context menu: compact shortcuts only, starting with `Hide from Node View` for visible rows
- `Unhide` should live in the list and inspector for hidden rows rather than in the canvas menu
- later `Bring Online` or `Take Offline` entries may appear in the context menu only for rows that are already verified and supported in the primary surfaces
- `Rename` should stay absent from the context menu until naming semantics are resolved separately from local labels
- select or focus should stay implicit on click and should not consume menu space

### 6.7 Future actions

The surface should leave room for later:

- online or offline control for verified supported structures after explicit action-authority resolution
- local label editing as a separate local UI capability if product value is proven later
- explicit on-chain rename only if a safe execution path and product need are proven later
- preset membership or preset preview state after per-row power actions are stable

## 7. Local persistence design

### 7.1 Persistence strategy by phase

- Phase B render-only drilldown shell plus selection sync: persist nothing; URL state was explicitly deferred from the implemented slice
- Phase D: persist node-scoped hide state keyed by `canonicalDomainKey`; keep context-menu open state ephemeral
- later phases: persist deterministic layout overrides only if drag or rearrangement is approved as a separate slice
- local labels, if introduced, should be a separate later persistence slice

### 7.2 Scope key

To avoid cross-user leakage, all local node-drilldown persistence should be scoped by:

- `characterId` when available
- otherwise `walletAddress`
- otherwise no persistence beyond the current session

Recommended scope token name: `scopeKey`.

### 7.3 Key shape

Recommended key family:

- `cc:node-drilldown:layout:v1:<scopeKey>:<nodeId>`
- `cc:node-drilldown:hidden:v1:<scopeKey>:<nodeId>`
- `cc:node-drilldown:labels:v1:<scopeKey>:<nodeId>`

Separate keys keep schema evolution simpler and let the app recover one concern without deleting the others.

### 7.4 Layout persistence record

Persist semantic placement, not raw pixel coordinates.

Recommended layout record shape:

```json
{
  "version": 1,
  "nodeId": "0xnode",
  "scopeKey": "0xcharacter-or-wallet",
  "algorithm": "family-bands-v1",
  "signature": "gate:0x1|storage_unit:0x2|turret:0x3",
  "slotOverrides": {
    "0xgate1": { "band": "gates", "row": 0, "column": 1 },
    "0xturret2": { "band": "turrets", "arcIndex": 3 }
  },
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

### 7.5 Hide persistence record

Recommended hidden-state shape:

```json
{
  "version": 1,
  "nodeId": "0xnode",
  "scopeKey": "0xcharacter-or-wallet",
  "hiddenCanonicalKeys": ["assembly:90184", "object:0xshelter"],
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

Use `canonicalDomainKey` rather than a raw structure ID so backend-only rows and chain-backed rows can share one hide seam without corrupting node-local membership truth.

### 7.6 Local label persistence

Local labels are worth planning but should remain separate from layout and hidden state.

- do not ship local labels in the first render-only branch
- if added later, persist a `structureId -> localLabel` map only
- do not overwrite chain-derived or summary-derived names in storage

### 7.7 Recovery and migration

- invalid JSON: drop the bad key and regenerate defaults
- wrong version: ignore the key and regenerate defaults
- signature mismatch after structure set changes: keep still-valid hidden canonical keys, discard invalid layout overrides, and recompute missing positions
- corrupted local labels: drop only the label key, not the layout or hidden keys
- offer a future `Reset Node Layout` action in the inspector once local overrides exist

### 7.8 What should not be persisted

Do not persist:

- live chain status
- shared-backend summary fields
- selected structure
- hover state
- temporary filters
- transaction outcomes
- sponsor state
- macro camera state inside node-local storage

## 8. Preset model design

### 8.1 Preset principles

Node presets are not the same thing as the current global posture model.

- they are node-scoped, not fleet-scoped
- they are user-named, not limited to `Commercial` and `Defensive`
- they are future action bundles, not a mandatory part of the first drilldown branch
- the current macro posture model should still be described accurately: it already combines authored gate presets with turret doctrine switching, but its current UI is gate-led and needs explicit gateless/turret-only handling rather than being repackaged as node-local presets

### 8.2 Zero-preset state

When no presets exist:

- show a quiet empty state in the header control area, for example `No node presets yet`
- keep `Save Preset` visible so the capability is discoverable
- keep apply controls absent rather than showing disabled generic posture chips

### 8.3 One or many preset states

- one preset: show one named preset chip and `Save Preset`
- two or three presets: show named chips in the header strip
- more than three presets: show the first three plus overflow menu

### 8.4 Preset shape

Recommended conceptual shape:

```json
{
  "id": "preset-industry",
  "nodeId": "0xnode",
  "scopeKey": "0xcharacter-or-wallet",
  "name": "Industry",
  "targets": [
    { "structureId": "0xprinter1", "action": "online" },
    { "structureId": "0xturret2", "action": "offline" }
  ],
  "unsupportedTargets": [],
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

### 8.5 Save flow

Recommended save flow:

1. operator selects or drafts desired target states
2. header `Save Preset` opens a naming sheet
3. operator enters a name
4. preset is stored locally first

No durable shared-backend or on-chain preset storage should be introduced in the early phases.

### 8.6 Apply flow

Apply should not be one silent click when write actions eventually exist.

Recommended later apply flow:

1. operator selects a preset
2. app computes diff between current live states and preset targets
3. app shows preview summary of affected structures, supported actions, unsupported actions, and expected transaction count
4. operator confirms
5. app executes only supported actions

### 8.7 Relation to write actions

Presets depend on safe single-structure write flows first.

- do not ship preset execution before supported structure power actions are stable in node-local mode
- do not reuse the existing macro posture transaction model as a fake node preset engine
- keep presets local-only first, then evaluate whether broader persistence is actually needed

### 8.8 Validation before any write-backed preset apply

Before preset execution becomes real, validate:

- direct-chain eligibility and OwnerCap presence for each targeted structure
- supported family matrix per action
- sponsor behavior and player-paid fallback behavior
- post-write refresh and reconciliation inside the drilldown view

## 9. Write and action sequencing

### 9.1 Layers of responsibility

The plan should keep four layers distinct:

- render-only UI shell
- local UI state only
- action-authority resolution from direct-chain data plus existing action helpers
- existing write actions already supported by current frontend flows
- future new write work, if the platform later needs it

### 9.2 Action authority model

- backend membership answers `What belongs in Node Control right now?`
- direct-chain reads answer `Can this wallet act on it?`
- a control should be enabled only when the rendered row resolves to a supported family, exactly one live direct-chain match, the required `ownerCapId`, and any required linked-node context
- backend-only or ambiguous rows remain read-only or `Action unavailable`
- hide or unhide may remain local UI only for any rendered row, including backend-only rows
- the existing route-local node `Bring Online` path proves that node-level control already exists elsewhere, but it is not proof that per-row backend-membership actions are safe without row-level authority resolution

### 9.3 Backend membership vs action authority

- when the backend payload is non-empty, backend membership defines the main attached-structure membership set and map placement
- live chain annotations remain attached to rows for provenance and future verification only
- a backend row may later become actionable if it re-proves exactly one owned structure through direct-chain joins; until then it should read as `not action-verified yet`
- action availability must not be inferred from rendered status, backend status text, or presence in the node-local list alone
- unanchored or stale rows may still become actionable later if direct-chain authority and a supported action path are proven

### 9.4 Safe staged recommendation

Recommended sequence:

1. keep the accepted `Node Control` UI baseline unchanged
2. implement local hide or unhide plus a compact context-menu skeleton, with no chain writes and with hidden state surviving refresh
3. add explicit action-authority resolution and clear verified or unavailable states in the list and inspector
4. expose supported single-structure online or offline controls only for verified supported rows
5. evaluate whether node-header `Bring Online` belongs in `Node Control` once the per-row authority model is stable
6. keep local labels separate from on-chain rename, and keep on-chain rename deferred
7. keep presets deferred until per-row power controls and unavailable-state UX are stable
8. keep freshness and later industry-linked behavior as later follow-on work

### 9.5 Existing write actions that can eventually be reused

- gate online or offline where current power flows already support it
- turret online or offline where current power flows already support it
- storage or trade post online or offline where current power flows already support it
- node online in the node header or inspector once `Node Control` deliberately surfaces it

### 9.6 Existing write actions that should stay out early

- node offline, which is currently not implemented safely
- backend-membership rows without direct-chain verification
- macro posture switching repackaged as node-local posture
- any rename flow that blurs local labels and on-chain or metadata writes
- any batch preset execution before per-structure writes are stable

### 9.7 Sponsored transaction requirements

- no sponsor configuration changes should be part of early node-local branches
- any later write-enabled branch should reuse the current sponsor path unchanged
- node-local UI must remain correct even if execution falls back to player-paid flow

### 9.8 Safest conclusion

The next implementation should stop at local hide or unhide and compact action scaffolding. Real power actions should wait until `Node Control` can prove row-level direct-chain authority without weakening the accepted backend-membership display model.

## 10. Implementation phases

As of 2026-05-02, the earlier draft sequence has been overtaken by accepted May 2 UI and read-model work. The phase list below is the authoritative sequence from this point forward.

### Phase A - plan only

- Status: complete.
- Scope: this planning document, the historical pointer in the prior posture plan, and the decision-log entry.
- Files likely touched: `docs/operations/network-node-drilldown-implementation-plan-20260501.md`, `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`, `docs/decision-log.md`.
- Out of scope: all runtime code, routes, writes, deployment, sponsorship, package IDs, Move, vendor, and submodule changes.
- Validation: `git diff --check`, `npm run typecheck`, `npm run build`.
- Manual preview checklist: none.
- Rollback risk: low.

### Phase B - render-only node-local shell plus selection sync

Implementation status on 2026-05-02:

- complete and accepted as the UI-shell baseline: same-dashboard `Node Control`, `Attached Structures`, `Selection Inspector`, `Node Key`, tooltip, shell chrome, and route or topology transition behavior are settled for the next slice
- the accepted branch already includes the shared renderer, lower-surface selection sync, and the dev-only node-drilldown lab
- Browser Back and URL mirroring remain deferred and are not acceptance gates for the next action-capable slice

- Scope: enter node-local mode from the strategic map, preserve the dashboard shell, and render a read-only node-local map plus lower structure surface with explicit `Back to Strategic Network`.
- Out of scope: power actions, presets, hide or unhide, rename, broader membership changes, sponsor changes, route overhaul.
- Validation: `npm run typecheck`, `npm run build`, interaction smoke for entry and exit, and no regression in macro map camera behavior.
- Rollback risk: low to medium.

### Phase C - broader node-connected hydration and backend-membership baseline

Implementation status on 2026-05-02:

- complete on this branch through the selected-node `node-assemblies` client, direct-chain annotation merge, identity correction, and `backend-membership` source mode
- backend membership now defines rendered node-local membership when non-empty; direct-chain rows remain authority annotations only in that mode
- backend rows remain read-only in the accepted baseline; no action authority is granted by backend membership alone

- Scope: the hybrid node-local read model, backend-membership fail-open rules, provenance and freshness fields, and direct-chain authority annotations.
- Out of scope: write actions, sponsor changes, Move changes, production deploy.
- Validation: `npm run typecheck`, `npm run build`, plus wallet-connected review where available.
- Rollback risk: medium.

### Phase D - local hide or unhide plus compact context-menu skeleton

- Status: implemented on 2026-05-02 on `feat/node-drilldown-render-shell`.
- Shipped behavior: versioned node-scoped hidden-state persistence keyed by `canonicalDomainKey`; visible-only SVG projection; hidden-row demotion to the bottom of `Attached Structures`; `Hidden from map` plus `Unhide` in the list and inspector; compact visible-row context menu limited to `Hide from Node View`; no chain writes, sponsor calls, backend changes, or Move changes.
- Scope: local `Hide from Node View` for any rendered row, list or inspector `Unhide`, node-scoped hidden-state persistence keyed by `canonicalDomainKey`, and a compact context menu that only surfaces the same local hide shortcut.
- Files likely touched: dashboard node-local state, a node-local persistence helper or hook, list or inspector or context-menu components, and node-local row-projection helpers.
- Out of scope: online or offline execution, rename execution, local labels, presets, drag persistence, backend changes, sponsor changes, Move changes.
- Validation: `npm run typecheck`, `npm run build`, localStorage recovery checks, hide persistence across refresh, backend-refresh stability, and no-chain-write verification.
- Manual preview checklist: hide an unanchored or stale-looking row, confirm it disappears from the SVG but remains in the list, refresh and confirm it stays hidden, unhide from the list or inspector, confirm backend refresh does not resurrect the SVG placement, and confirm no chain writes occur.
- Rollback risk: medium because local-state bugs can create confusing operator state.

### Phase E0 - indexer-first operator read model planning and endpoint contract

- Scope: define the shared-backend operator-inventory contract, preferred wallet-scoped request shape, response fields for grouped node membership, unlinked rows, provenance or freshness, and indexed `actionCandidate` metadata.
- Files likely touched: planning docs in CivilizationControl and later backend contract docs in the EF-Map repo or runtime source.
- Out of scope: runtime frontend switching, power execution changes, sponsor changes, Move changes, production deploy.
- Validation: `git diff --check`, `npm run typecheck`, `npm run build`.
- Rollback risk: low.

### Phase E1 - EF-Map/shared-backend operator inventory endpoint

- Scope: implement `GET /api/civilization-control/operator-inventory?walletAddress=0x...` in the shared backend, keep CORS limited to allowed CivilizationControl origins, expose no browser secrets, and return grouped operator inventory plus indexed `actionCandidate` data for supported families when available.
- Files likely touched: EF-Map/shared-backend Worker or API source, shared-backend contract docs, and any backend validation helpers owned by the backend source repo.
- Out of scope: direct browser DB access, raw VPS host exposure, frontend route redesign, write execution changes.
- Validation: backend contract tests, browser-origin CORS smoke, empty-inventory smoke, stale-response smoke, and no-secret response audit.
- Rollback risk: medium because endpoint correctness becomes the primary read dependency.

### Phase E2 - frontend boot read-path switch to operator inventory

- Status: implemented on `feat/node-drilldown-render-shell` on 2026-05-03; keep this section as the phase-definition baseline for future follow-up work.
- Scope: switch dashboard and Node Control boot reads from browser direct-chain discovery to the operator-inventory endpoint, preserve the accepted UI baseline, and keep browser JSON-RPC only as a narrow optional fallback or debug seam.
- Files likely touched: frontend read-provider selection, `useAssetDiscovery` or its replacement seam, dashboard boot state, and the node-local read-model adapters.
- Out of scope: new UI work, production deploy, broad browser rediscovery loops, sponsor changes, Move changes.
- Validation: `npm run typecheck`, `npm run build`, connected-wallet inventory smoke, partial-response smoke, fallback smoke, and proof that initial wallet inventory no longer depends on browser fullnode reads.
- Rollback risk: medium.

### Phase E3 - indexed action candidates plus wallet-signed online or offline execution

- Status: partially advanced on 2026-05-03 because operator-inventory-backed rows now consume indexed `actionCandidate.actions.power` hints for availability labeling, but live wallet-connected action proof against indexed data is still pending.
- Scope: use indexed `actionCandidate` metadata to label supported versus unavailable rows, feed the existing transaction builders with the required IDs when present, and execute supported actions through the wallet with chain finality as the deciding outcome.
- Files likely touched: row action-state mapping, list or inspector action surfaces, existing power-hook integration points, and failure-state labeling.
- Out of scope: inferring actions from display membership alone, unsupported-family writes, rename, presets, sponsor changes, Move changes.
- Validation: `npm run typecheck`, `npm run build`, wallet-connected smoke for one supported gate, one storage, one turret, unavailable-state checks for unsupported or ambiguous rows, and failed-stale-candidate labeling.
- Rollback risk: medium.

### Phase E4 - post-action backend refresh and freshness

- Scope: refresh operator inventory from the backend after action success or failure, surface freshness or provenance in the UI, and prefer targeted backend invalidation or filtered refresh instead of broad browser rediscovery.
- Files likely touched: frontend refresh orchestration, backend freshness metadata, and later optional filtered invalidation hooks.
- Out of scope: unfiltered global websocket adoption before the backend read model is stable, macro layout changes, new write semantics.
- Validation: `npm run typecheck`, `npm run build`, post-action refresh smoke, stale-data smoke, backend-down degradation smoke, and selection-stability checks after refresh.
- Rollback risk: medium.

### Phase F - local-label or rename exploration remains deferred

- Scope: optional future local label editing or later rename analysis only after the operator-inventory model and action path are stable.
- Out of scope: current next-step work.
- Validation: phase-specific typecheck, build, and local-state smoke only if this phase is later approved.
- Rollback risk: medium.

### Phase G - presets remain deferred

- Scope: user-named node presets, local draft capture, and later apply-preview UX only after the indexer-first read model and single-row action path are both stable.
- Out of scope: current next-step work, preset execution, sponsor changes, Move work.
- Validation: phase-specific typecheck, build, preset create or rename smoke, and diff-preview smoke only if this phase is later approved.
- Rollback risk: medium.

### Phase H - faster event-driven freshness only after backend read model stabilizes

- Scope: filtered event-driven or push freshness layered on top of the stable operator-inventory contract after the backend read model is proven.
- Out of scope: raw or unfiltered global websocket adoption, browser fullnode polling revival, macro layout changes, new write semantics.
- Validation: `npm run typecheck`, `npm run build`, filtered freshness smoke, backend-down degradation smoke, and update-in-place checks without selection loss.
- Rollback risk: medium because freshness work can create confusing UI churn if the read-model boundary is blurred.

## 11. Accepted baseline and recommended next implementation slice

Status on 2026-05-02:

- `feat/node-drilldown-render-shell` now holds the accepted `Node Control` UI baseline: same-dashboard shell, accepted iconography, accepted `Node Key`, accepted layout, accepted tooltip behavior, accepted shell chrome, accepted transitions, and the accepted backend-membership read model
- `docs/operations/network-node-drilldown-implementation-plan-20260501.md` is the authoritative Node Control planning document going forward; the 2026-04-29 posture plan is historical or reference-only for icon taxonomy and design doctrine

Recommended next implementation slice:

`Pause further action-path expansion and pivot the next work to an indexer-first operator-inventory read model, starting with Phase E0 planning and Phase E1 shared-backend endpoint work.`

What this slice should include:

- define the shared-backend operator-inventory contract with grouped node membership, unlinked rows, indexed freshness or provenance, and indexed `actionCandidate` fields
- implement the operator-inventory endpoint in the shared backend before widening frontend action work again
- plan the frontend boot-path switch so initial wallet inventory rendering no longer depends on browser Sui JSON-RPC discovery
- keep the accepted `Node Control` UI baseline intact while pausing new action-surface expansion until the read model is corrected
- keep rename, local labels, presets, drag persistence, sponsor changes, Move changes, and production deploy out of the next slice

Why this is the right recommendation:

- the accepted UI baseline already proved the product surface, but preview wallet discovery also proved that public-fullnode browser reads are too fragile to remain the primary boot path
- the shared backend already has the stronger read foundation for grouped inventory, observed status, and freshness, so the next step should move the app onto that foundation instead of tightening browser RPC loops further
- indexed action candidates can fail safely at submit time because chain execution remains final, which is a better failure mode than making the whole read UI depend on browser-side ownership traversal
- degrading controls when backend candidates are stale is safer than blanking the app or forcing broad browser rediscovery
- keeping rename, presets, and other local-state work deferred prevents unrelated UI work from competing with the read-model correction

Online/offline recommendation:

- per-row online or offline remains important, but it should follow the operator-inventory read-model correction rather than precede it
- the first action-capable slice after this correction should consume indexed `actionCandidate` data from the backend and still rely on wallet-signed chain execution as the final authority

Rename recommendation:

- on-chain rename remains deferred
- if naming work is later needed, plan local-label editing separately and keep the system name visible beside it

## 12. Dev-only scenario validation surface

### 12.1 Why it is needed

Live wallet-connected drilldown is necessary but not sufficient for the first implementation branch.

The operator currently has limited infrastructure on Stillness, which means real ownership data is unlikely to expose the dense or mixed structure counts needed to validate:

- high printer and refinery density
- mixed industry plus logistics layouts
- very high turret counts such as 20, 30, or 50
- support-band clutter
- readability of the lower list and inspector against dense synthetic layouts

Without a synthetic validation surface, the first branch could look correct on a sparse live node while still failing on realistic or future-like bases.

### 12.2 Recommended route and visibility

Recommended dev-only route:

- `/dev/node-drilldown-lab`

Requirements:

- not linked from primary app navigation
- clearly marked as dev-only or synthetic
- used for local preview and validation only
- not treated as a player-facing production feature

### 12.3 Runtime boundaries

The dev lab should be isolated from production dependencies.

- no wallet connection requirement
- no Sui RPC calls
- no EF-Map or shared-backend calls
- no sponsor-worker calls
- no transaction execution
- no mutation hooks

The goal is pure layout, list, inspector, and selection validation.

### 12.4 Component reuse requirement

The dev lab should reuse the same node-local rendering surfaces as the real drilldown where practical.

- same node-local SVG renderer
- same lower Attached Structures list component
- same Selection Inspector placeholder component
- same selection state model
- same layout algorithm and family-band rules

The dev lab should not become a second independent implementation of the node-local view. It exists specifically to prove the real renderer against synthetic but believable structure sets.

### 12.5 Synthetic data model

The lab should feed normalized synthetic node-local structure data into the same renderer contract planned for production.

That keeps the renderer reusable across:

- real dashboard entry using live `NetworkNodeGroup`-derived data
- the dev-only scenario lab using fixture data
- later broader family hydration when richer structure sets are available

### 12.6 Scenario presets and configurator

The dev lab may use either preset scenarios, a compact configurator, or both. The cleanest first implementation is:

- a small scenario selector with a handful of preset scenarios
- optional compact count controls only if they stay lightweight and do not bloat the lab

Preset scenarios to include in the plan:

- `Sparse Solo Node`
- `Industry Node`
- `No-Gate Industry Node`
- `No-Gate Dense Manufacturing`
- `Mixed Operating Base`
- `Support Clutter Test`
- `Defense Heavy Node`
- `Turret Stress Test`

Suggested configurable counts or fixture inputs:

- printers count
- refineries count
- assemblers count
- storage or trade post count
- berth count
- turret count, including high-count cases like 20, 30, and 50
- gate count
- support count covering relay, nursery, nest, and shelters

### 12.7 Lab purpose and non-goals

The dev lab is for preview and local validation only.

- it should help prove layout density, selection sync, row readability, and support-band behavior
- it should not become a source of product logic or authoritative game data
- it should not be used to justify write actions before dense synthetic and sparse live cases are both visually stable

## 13. Risks and open questions

- the current public-fullnode browser path has already proven fragile through CORS pressure, rate limits, and repeated discovery or partial-read confusion, so it should not be treated as a production-grade primary boot path
- EF-Map or shared-backend indexer freshness is now the stronger foundation for read inventory, display status, and post-action refresh, but that strength depends on clear contract ownership and honest freshness metadata
- backend endpoint correctness, browser-origin CORS policy, and fail-open behavior become the main integration risks once operator inventory moves to the shared backend
- transaction execution remains chain-final, so stale indexed action candidates should fail safely at submit time; the main UX risk is stale controls, not false write authority
- fallback behavior should degrade controls or surface stale-state warnings, not blank the app or force a broad browser rediscovery loop
- broader family coverage is not yet hydrated in the current live data model
- very high turret counts may force a denser defensive block earlier than expected, and real player bases may determine whether a later aggregation fallback is necessary
- the combined support band may work well for low-count relay, nursery, nest, and shelter families, but that assumption should be revalidated once broader discovery is live
- dense nodes may force row wrapping and inspector tradeoffs sooner than expected
- synthetic fixture drift is a real risk; the dev lab must not quietly diverge from the real renderer contract or realistic structure distributions
- fake data must not be mistaken for chain truth; the route should stay unlinked or clearly marked as synthetic
- scenario fixtures should not become product logic or a hidden dependency of the live drilldown behavior
- high-density layout should be proven in the dev lab before any write actions are added to the node-local surface
- drag-and-persist behavior can become messy if introduced before the default layout is proven useful
- right-click discoverability competes with the existing camera interaction model if it leaks back into macro mode
- operators may confuse local labels with on-chain rename unless the distinction is explicit in the UI
- supported online or offline actions differ by family, and node offline remains intentionally unsupported
- preset execution can become unsafe if it ships before single-structure write validation and preview-diff behavior
- future industry relationships need link language, so the initial drilldown must not spend that visual budget on noisy node-to-child connectors
- browser localStorage can corrupt, leak across users, or go stale unless keys are scoped tightly and recovered defensively
- the same-dashboard drilldown model needs responsive discipline on narrower widths so the lower structure surface does not become unreadable

## 14. Files likely touched

### Dashboard and screen surfaces

- `src/screens/Dashboard.tsx`
- `src/App.tsx` only if URL mirroring or route reuse is added
- `src/screens/NetworkNodeDetailScreen.tsx` as a later compatibility wrapper or shared surface consumer
- new dev-only screen such as `src/screens/NodeDrilldownLabScreen.tsx`

### Topology components

- `src/components/topology/StrategicMapPanel.tsx`
- `src/components/topology/NodeCluster.tsx` for macro node click entry only
- new node-local map and shell components such as `src/components/topology/NodeDrilldownSurface.tsx`
- new lower-surface components such as `src/components/topology/NodeStructureListPanel.tsx` and `src/components/topology/NodeSelectionInspector.tsx`

### Icon and glyph reuse

- shared node icon catalogue components or exports under `src/components/topology/node-icon-catalogue/`
- no macro glyph geometry changes

### Hooks, types, and persistence helpers

- `src/types/domain.ts` for later broader family work only
- `src/hooks/useAssetDiscovery.ts` for later broader family grouping only
- normalized node-local view-model helpers so live and synthetic data can flow through the same renderer contract
- synthetic fixture helpers or scenario definitions for the dev lab
- new local helper such as `src/lib/nodeDrilldownStorage.ts`
- new local hook such as `src/hooks/useNodeDrilldownLayout.ts`

### Docs and tests

- `docs/operations/network-node-drilldown-implementation-plan-20260501.md`
- `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`
- `docs/decision-log.md`
- `docs/README.md`
- later UI and interaction test coverage if the repo adds it for the drilldown surface

### Files that should remain untouched in early phases

- Move contracts under `contracts/civilization_control/`
- sponsor worker sources under `workers/sponsor-service/`
- vendor and submodule content under `vendor/`
- package-ID and world-runtime constants unless a later unrelated task explicitly owns them

## 15. Validation and manual testing plan

### Planning task validation

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- no deploy

### Future implementation-branch validation

- `npm run typecheck`
- `npm run build`
- preview deploy on a feature branch once runtime UI changes exist
- no production deploy until explicit approval

### Early no-write manual smoke

- macro map still behaves the same in orbit, pan, zoom, reset, and lock
- clicking a node enters node-local mode without changing the surrounding dashboard shell
- macro mode still shows only network nodes, gates, trade posts or storage units, and turrets
- explicit `Back to Strategic Network` and in-root home reset return to macro mode predictably; Browser Back and URL mirroring remain a separate follow-up
- node-local mode shows the lower Attached Structures list and inspector placeholder
- lower telemetry and attention panels return when macro mode returns
- direct-chain data remains enough to render node-local mode even if shared-backend enrichment is unavailable
- load `/dev/node-drilldown-lab`
- test `Sparse Solo Node`
- test `Industry Node`
- test `Defense Heavy Node`
- test `Mixed Operating Base`
- test `Turret Stress Test` with 50 turrets
- test `Support Clutter Test`
- verify selection sync still works in the dev lab between SVG and list
- verify the lower list and inspector remain readable under dense synthetic scenarios
- verify no wallet, Sui, shared-backend, or sponsor calls happen in the dev lab

### Next hide/unhide and action-authority manual smoke

- hide an unanchored or stale-looking row from the visible node-local view
- confirm the row disappears from the SVG but remains visible in `Attached Structures`
- refresh and confirm the local hide state persists for the same node and `scopeKey`
- unhide the row from the list or inspector and confirm it returns to the SVG without breaking selection sync
- verify backend refresh does not resurrect hidden SVG placement automatically
- verify no chain writes occur for hide or unhide
- verify unsupported or backend-only rows are not clickable when power actions are still unavailable
- once action-authority resolution lands, verify verified supported rows are visibly distinguishable from backend-only or ambiguous rows before any power control is enabled

### Broader hydration and freshness manual smoke

- connect a wallet that owns at least one network node with non-canonical attached structures
- enter `Node Control` from the macro map and confirm the accepted shell state and scrollbar behavior remain stable
- confirm current direct-chain families still render before or without backend enrichment
- confirm broader families appear only inside `Node Control`, never in macro `Strategic Network`
- confirm backend-observed rows are clearly non-actionable and do not change ownership or future write eligibility
- confirm unanchored or unknown rows remain visible as honest observation state rather than disappearing from the node-local view
- break or disable backend enrichment and confirm the drilldown fails open to the current direct-chain lane
- change structure status or name outside CivilizationControl and confirm the selected node updates without losing selection or repacking unrelated icons

### Later write-enabled smoke

- wallet-connected action smoke for verified supported single-structure power actions only
- backend-only or ambiguous rows remain unavailable and unclickable
- unanchored or stale rows expose power control only when direct-chain authority is proven
- feedback banners and pending states behave correctly
- sponsor path and player-paid fallback both behave acceptably
- read-path refresh reconciles node-local UI after completion

### Local persistence smoke

- hide and unhide survive refresh for the same `scopeKey` and node ID
- another wallet or character does not inherit hidden state or layout state
- corrupted localStorage records fail open and regenerate defaults
- reset action restores default layout cleanly

## 16. Source notes

Primary repo sources inspected for this plan:

- `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`
- `docs/ux/svg-topology-layer-spec.md`
- `docs/ux/strategic-network-map-implementation-audit.md`
- `docs/ux/civilizationcontrol-ux-architecture-spec.md`
- `docs/strategy/civilization-control/where-civilizationcontrol-goes-next.md`
- `docs/operations/shared-backend-assembly-enrichment-20260429.md`
- `docs/llm-reference-guide.md`
- `src/App.tsx`
- `src/screens/Dashboard.tsx`
- `src/screens/NetworkNodeDetailScreen.tsx`
- `src/components/topology/StrategicMapPanel.tsx`
- `src/components/topology/NodeCluster.tsx`
- `src/components/topology/topologyLayout.ts`
- `src/components/PostureControl.tsx`
- `src/hooks/useAssetDiscovery.ts`
- `src/hooks/useAssemblySummaryEnrichment.ts`
- `src/hooks/useMapViewTransform.ts`
- `src/hooks/useStructurePower.ts`
- `src/lib/suiReader.ts`
- `src/lib/assemblyEnrichment.ts`
- `src/lib/spatialPins.ts`
- `src/types/domain.ts`
- `src/data/itemTypes.json`