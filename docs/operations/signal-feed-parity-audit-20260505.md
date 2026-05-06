# Signal Feed Parity Audit - 2026-05-05

## 1. Executive summary

Status update (2026-05-06, Node Control proof-loss repair on `fix/node-control-authority-regression`): the manual wallet smoke failure after `4f5bc0e` and preview `https://ac0cd430.civilizationcontrol.pages.dev` was real, but it was not a Signal Feed contract regression. Node Control rows had display/canonical state while Object ID, OwnerCap, Network Node, action proof, and power proof were missing. The exact frontend seams were the selected-node `NodeLocalStructure` bucket merge in `src/lib/nodeDrilldownModel.ts` and `normalizeIndexedActionCandidate` in `src/lib/operatorInventoryClient.ts`: weak display/fallback rows could strip authority-bearing operator-inventory fields, and live EF-Map top-level `actionCandidate.requiredIds` was not normalized into per-action authority. The repair keeps operator inventory authoritative and allows fallback rows to enrich presentation only. `scripts/check-node-live-proof-loss.mts` plus `scripts/node-live-proof-loss-core.mts` now catch that screenshot condition directly. Fresh preview validation for `https://a187a67a.civilizationcontrol.pages.dev` proved the Signal Feed route still smoke-loads with the same normal-route contract while the live Node Control proof diagnostic passes from that preview origin. The Signal Feed display mappings remain intact, browser `queryEvents` stays closed for normal routes, and no EF-Map/VPS, Move/package-ID, sponsor-worker, production deploy, or category-contract change was made.

Status update (2026-05-06, frontend adoption on `feat/signal-history-display-parity`): CivilizationControl now preserves raw `signal-history.v1` `kind`, `severity`, `assemblyId`, `actorCharacterId`, and bounded `metadata` through the normal Signal Feed model, explicitly maps current rename/governance/transit parity kinds (`structure_renamed`, `posture_changed`, `gate_policy_preset_changed`, `gate_treasury_changed`, `permit_issued`, `toll_paid`), keeps unknown-kind fallback intact, and preserves operator-inventory `displayNameSource` / `displayNameUpdatedAt` through the typed normalization and node-local lookup path. Node Control and global summary enrichment now prefer indexed `displayName` over stale legacy `name` fields when both are present. No EF-Map contract, browser `queryEvents` boundary, Move/package-ID surface, sponsor-worker behavior, or top-level category contract changed in this frontend adoption pass.

CivilizationControl's normal Signal Feed routes are already on the wallet-scoped shared `signal-history.v1` contract. `/activity` uses `useSignalHistory(...)` directly, and Dashboard `Recent Signals` uses the compatibility `useSignalFeed(...)` wrapper over the same endpoint. This is no longer a route-wiring problem.

The current parity gap is narrower and more actionable:

- the only repo-proven live mismatch is that app-originated rename and power writes refresh local UI and invalidate signal history, but those same writes do not currently appear in `/activity`
- the current `signal-history.v1` kind set is still missing several operator-relevant governance families that older CivilizationControl Signal Feed logic expected: posture changes, gate policy preset changes, treasury/toll governance changes, and turret doctrine/rebind history
- the current client contract already tolerates additive kinds inside the existing four categories, so the first restore pass does not require a new endpoint or new top-level categories
- going-forward correctness is sufficient; historic backfill is explicitly out of scope

No runtime, EF-Map, Move, package-ID, sponsor-worker, or deploy changes were made in this audit pass.

Preview validation update (2026-05-06, `feat/signal-history-display-parity`): the frontend adoption branch was deployed to the unique Pages preview `https://2a9c06f4.civilizationcontrol.pages.dev`. Browser smoke on that unique host loaded both the boot shell (`/`) and the Signal Feed route (`/activity`) successfully. Served-bundle scanning across the deployed JavaScript chunks found `civilizationcontrol-sponsor` in `App-gvU6vZUo.js` and `SmartObjectProvider-Qw9ZKUU_.js`, found `https://ef-map.com` in `nodePowerControlModel-B0iVIYWB.js` and `SmartObjectProvider-Qw9ZKUU_.js`, and found no `flappy-frontier-sponsor`, no exact header-shaped `Authorization`, no `X-API-Key`, and no `ASSEMBLY_API_TOKEN` markers in the served frontend bundle. A branch alias host was not captured as proof in this pass.

Preview validation refresh (2026-05-06, live preview-origin proof): the branch was redeployed to the unique Pages preview `https://f65b2e87.civilizationcontrol.pages.dev` with alias `https://feat-signal-history-display.civilizationcontrol.pages.dev`. Unique and alias `/`, `/nodes`, `/activity`, `/settings`, and `/dev/node-drilldown-lab` all returned `200`, and both hosts served `/assets/index-D8zq3gDN.js`. Browser smoke on the unique host loaded `/`, `/activity`, and `/dev/node-drilldown-lab` successfully. Served-bundle scanning across all 12 unique-preview JavaScript chunks found `https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` and `https://ef-map.com`, and found no `flappy-frontier-sponsor`, exact-case `Authorization`, `X-API-Key`, or `ASSEMBLY_API_TOKEN` markers. Re-running the browser-origin live diagnostic from that unique preview origin for wallet `0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62` still returned `200` for both operator-inventory and signal-history but surfaced only one older rename row, so the Signal Feed conclusion remains unchanged: the missing app-originated rename and power rows are still bounded by indexed row presence rather than by the normal-route client wiring.

Validation refresh (2026-05-06, repaired live EF-Map truth): EF-Map live assembly-state freshness repair is now active for the checked wallet and preview-origin path. The same unique preview-origin diagnostic now shows raw operator-inventory names and statuses aligned with the adapted frontend rows, selected-node statuses aligned with direct-chain snapshots, and the main online node reading `Power 770 / 1000 GJ` with no current-load mismatch or unknown-load count on the operator-inventory path. The offline node now reads `Power 0 / 1000 GJ`, while the node-assemblies fallback still remains the weaker read seam because it keeps unknown child-load counts even when the top-level label matches. `structure_renamed` handling remains safe even though only one older rename row is currently present for the test wallet, because the live row still normalizes cleanly and the deterministic fixture probe still covers posture, policy, treasury, permit, and toll families without reopening browser `queryEvents` or broad polling. No fresh preview deploy, EF-Map change, VPS change, Move/package change, sponsor-worker change, or production deploy was required for this validation pass.

## 2. Scope and non-goals

This pass is intentionally docs-only on `docs/signal-feed-parity-audit`.

In scope:

- audit current shipped Signal Feed behavior on `/activity` and Dashboard
- map current CivilizationControl and world write actions to the event or state-change proof the Signal Feed should use
- separate already-covered `signal-history.v1` rows from missing operator-audit-log families
- define a narrow P0/P1/deferred ordering for the next EF-Map prompt

Out of scope:

- EF-Map, VPS, or backend implementation
- Move edits, package publishes, package-ID changes, or sponsor-worker changes
- UI/runtime behavior changes
- broad polling or any reintroduction of browser `queryEvents` for normal Signal Feed routes
- local-only audit rows for Node Power preset save/rename/apply
- external marketplace sale or revenue rows until the external app package, events, and URL contract are known

Preserved unrelated dirt remains untouched:

- `contracts/civilization_control/Move.lock`
- dirty `vendor/world-contracts` submodule state
- `.tmp-node-provisional-section.png`

## 3. Current shipped Signal Feed behavior

### 3.1 `/activity`

`ActivityFeedScreen` calls `useSignalHistory(...)` with:

- `walletAddress`
- `limit = 25`
- `categories = undefined` for `All Signals` or a one-item category array for the selected filter

The route is wallet-gated, cursor-paged, and non-polling by default. It shows a subdued indexing hint only when the shared response reports `partial` or `warnings`, and it exposes `Load more` pagination through `nextCursor`.

### 3.2 Dashboard `Recent Signals`

Dashboard still calls `useSignalFeed(...)`, but that hook is now only a compatibility wrapper over `useSignalHistory(...)`.

Current Dashboard behavior:

- fetches `limit = 10`
- renders only the first `6` rows
- disables timer polling
- uses the same wallet-scoped shared history contract as `/activity`
- continues to invalidate the signal-history query after successful structure writes through `useStructureWriteRefresh(...)`

### 3.3 Current response and UI shape

Current top-level request contract:

- required: `walletAddress`
- optional: `limit`, `categories`, `cursor`, `networkNodeId`, `structureId`, `since`

Current shared response envelope:

- `schemaVersion`
- `source`
- `fetchedAt`
- `partial`
- `warnings`
- `operator`
- `signals`
- `nextCursor`

Current operator-facing category bar remains fixed to four top-level categories:

- `governance`
- `trade`
- `transit`
- `status`

The current normalizer still maps rows into the existing `SignalEvent` UI contract, but it now preserves the raw fields that matter for richer audit-log presentation:

- raw `kind`
- raw `severity`
- `assemblyId`
- `actorCharacterId`
- bounded free-form `metadata`

That preservation boundary now matters in a narrower way: EF-Map can add new rows inside the current route contract without forcing another frontend type rewrite, and CivilizationControl already has explicit mapping for the current governance and transit parity families that depend on metadata such as `previousExtension`, `structureType`, `mode`, `oldName`, or `name`.

### 3.4 Remaining browser `queryEvents` usage

Browser `queryEvents` is not part of the current normal Signal Feed route contract.

What still remains in the repo:

- retained legacy helper code in `src/lib/suiReader.ts`
- the old parser/folder stack in `src/lib/eventParser.ts` and `src/lib/signalFolder.ts`
- marketplace listing discovery, which still uses direct event queries and remains outside this audit

That retained code is important only as evidence of older intended Signal Feed semantics. It should not be restored as the normal route implementation.

## 4. Desired audit-log behavior

Signal Feed vNext should behave like a wallet-scoped operator audit log for governed infrastructure.

Inclusion rules:

1. Show current operator-initiated CivilizationControl and world-contract writes that mutate governed infrastructure state.
2. Show relevant world/indexed side effects that materially affect governed infrastructure even if they are not initiated through CivilizationControl, such as fuel state, storage movement, or gate transit through a governed gate.
3. Prefer raw on-chain events when the contracts already emit them.
4. Use classification or state-delta logic only where the chain proof is more generic than the operator-facing row, such as `MetadataChangedEvent` for rename rows.
5. Do not create synthetic rows for local orchestration buttons themselves. For example, Node Power bulk or preset apply should surface the underlying node and child status changes, not `preset applied` or `children taken offline` meta-rows.
6. Do not surface implementation-detail energy reserve or release rows in the first pass when the operator-facing action is already proven by the online/offline status change.

Category rule for the first restore pass:

- keep the current four top-level categories (`governance`, `trade`, `transit`, `status`)
- add or specialize kinds under those categories
- avoid introducing new top-level categories until there is a separate CivilizationControl UI pass that actually needs them

## 5. Current `signal-history.v1` coverage

| Category | Kinds currently normalized by CivilizationControl | Current status |
|---|---|---|
| `governance` | `extension_authorized`, `extension_frozen`, `ownership_transferred` | Shipped |
| `trade` | `storage_deposit`, `storage_withdraw` | Shipped |
| `transit` | `gate_transit` | Shipped, but still generic |
| `status` | `structure_online`, `structure_offline`, `structure_unanchored`, `structure_destroyed`, `fuel_changed`, `node_fuel_changed`, `node_low_fuel`, `node_critical_fuel` | Shipped |

Important nuance:

- a kind being recognized by the current client does not prove that the relevant rows are actually present for current CivilizationControl write digests
- the repo already contains human proof that app-originated rename and power writes were missing from `/activity` even after the frontend switched to `signal-history.v1`

The first EF-Map follow-up should therefore start with a tx-digest comparison, not an assumption that the client is filtering away already-indexed rows.

## 6. Event / source matrix

| Signal family | Current UI or builder surface | Chain proof | Native event source | Current normal-route status | Recommended first-pass kind | Priority / note |
|---|---|---|---|---|---|---|
| Structure online / offline (`assembly`, `gate`, `storage_unit`, `turret`) | `structurePowerTx.ts`, `useStructurePower.ts`, list/detail screens, Node Control | world online/offline PTBs | `world::status::StatusChangedEvent` | Kind exists, but live parity for current CC power writes is unresolved because human smoke found missing `/activity` rows | Keep `structure_online` / `structure_offline` | `P0` |
| Network node online / offline | `structurePowerTx.ts`, node list/detail, Node Control node-self actions | world node online/offline PTBs | `world::status::StatusChangedEvent` on the node | Kind exists only generically; live parity for current node writes is not yet proven | Keep `structure_online` / `structure_offline` with `metadata.structureType = network_node` | `P0` |
| Connected child offline caused by node offline | `buildNodeOfflineTx(...)` and Node Control node-offline flow | same transaction as node offline | child `world::status::StatusChangedEvent` rows only for actual transitions | No special row needed today | Keep child `structure_offline` rows; do not synthesize `preset_applied` or `children_offlined` | `P0` boundary: no meta-rows |
| Structure rename / node rename | `structureMetadataTx.ts`, rename dialog, node rename flows | world metadata name update PTBs | `world::metadata::MetadataChangedEvent` plus tx-target classification (`update_metadata_name`) | Repo-proven live gap | Add `structure_renamed` | `P0` |
| Gate / storage / turret extension authorization and rebind | `useAuthorizeExtension.ts`, gate/storage/turret list and detail actions, posture sidecar for turrets | world authorize_extension PTBs | per-module `ExtensionAuthorizedEvent` | Generic `extension_authorized` kind exists, but rebind/doctrine nuance is not preserved in current UI | Keep `extension_authorized`; include `metadata.previousExtension`, `metadata.extensionType`, and `metadata.structureType` so CC can render rebind/doctrine titles later | `P0` for visibility |
| Extension freeze | future world freeze surfaces only; not a current main CC write | world freeze PTB | `world::extension_freeze::ExtensionConfigFrozenEvent` | Kind exists | Keep `extension_frozen` | Covered, not a blocker |
| Extension revoke | future world revoke surfaces only; not a current main CC write | world revoke PTB | per-module `ExtensionRevokedEvent` | Not exposed today | Add `extension_revoked` only when revoke enters current UI scope | `P1` |
| Posture change | `postureSwitchTx.ts`, `usePosture.ts`, macro posture control | CC posture PTB | `civilization_control::posture::PostureChangedEvent` | Missing from current normal-route coverage | Add `posture_changed` | `P0` core operator action |
| Gate policy preset changes and removals | gate policy composer and batch apply flows | CC gate policy PTBs | `PolicyPresetSetEvent` and `PolicyPresetRemovedEvent` | Missing | Add `gate_policy_preset_changed` with `metadata.operation = set | removed` | `P0` core governance action |
| Gate treasury change | gate treasury editor and batch treasury flows | CC treasury PTB | `TreasurySetEvent` | Missing | Add `gate_treasury_changed` | `P1` |
| Permit issuance and toll collection | player permit flow and retained operator self-test flow | CC permit PTBs plus world permit issuance | `PermitIssuedEvent`, `TollCollectedEvent`, and world `JumpPermitIssuedEvent` | Current v1 only guarantees generic `gate_transit` | Keep `gate_transit` for current behavior; add `permit_issued` and `toll_paid` when the gate fixture is available or when EF-Map already has the rows | `P1` |
| Storage deposit / withdraw | storage/inventory movement; also trade settlement side effects | world inventory PTBs | `ItemDepositedEvent` / `ItemWithdrawnEvent` | Covered | Keep `storage_deposit` / `storage_withdraw` | Covered |
| Node or assembly fuel change and fuel thresholds | node online/offline and later backend thresholding | fuel state changes | `world::fuel::FuelEvent` plus backend threshold classification | Covered generically | Keep `node_fuel_changed`, `node_low_fuel`, `node_critical_fuel`, and `fuel_changed` | Covered |
| Energy reserve / release / start / stop production | implementation detail behind online/offline | world energy state changes | `StartEnergyProductionEvent`, `StopEnergyProductionEvent`, `EnergyReservedEvent`, `EnergyReleasedEvent` | Not surfaced today | Do not add first-pass audit rows for these implementation-detail events | Deferred by design |
| Trade listing lifecycle | TradePost seller and buyer flows | CC trade-post PTBs | `ListingCreatedEvent`, `ListingPurchasedEvent`, `ListingCancelledEvent` | Not part of the current product direction for Signal Feed parity | No first-pass add | Deferred |
| Turret combat/response telemetry | turret runtime extensions | CC turret runtime | `TurretResponseEvent`, `TurretTargetingEvent` | Not part of the current operator audit target | No first-pass add | Deferred |
| External marketplace revenue / sales | future external app only | unknown | unknown | Not applicable yet | No add until partner contract exists | Deferred |

## 7. Desired Signal Feed taxonomy for the first restore pass

The first parity pass should keep the current four top-level categories and use additive kinds under them.

Important normalization choices:

- do not split `network_node_online` and `network_node_offline` into separate top-level kinds yet; reuse `structure_online` / `structure_offline` and carry `metadata.structureType = network_node`
- do not add a separate `node_renamed` kind yet; reuse `structure_renamed` and carry `metadata.structureType = network_node`
- do not add a separate `extension_rebound` or `turret_doctrine_changed` kind yet; reuse `extension_authorized` and carry `metadata.previousExtension`, `metadata.extensionType`, and `metadata.structureType`
- do not add a separate `gate_toll_changed` kind yet; the current on-chain proof is a preset write, not a toll-only event, so `gate_policy_preset_changed` should carry the toll-facing metadata

| Category | Kind | User-facing title | Summary format | Required fields | Optional fields | Current status | EF-Map work needed | CC display work needed |
|---|---|---|---|---|---|---|---|---|
| `status` | `structure_online` | `Structure Online` | `{structureLabel} brought online` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `severity`, `structureId`, `txDigest` | `networkNodeId`, `assemblyId`, `ownerCapId`, `metadata.structureType` | Kind exists | Digest comparison first | No for base rendering |
| `status` | `structure_offline` | `Structure Offline` | `{structureLabel} taken offline` | same as above | same as above | Kind exists | Digest comparison first | No for base rendering |
| `governance` | `structure_renamed` | `Structure Renamed` | `{oldName} -> {newName}` or `Name set to {newName}` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `networkNodeId`, `assemblyId`, `ownerCapId`, `metadata.structureType`, `metadata.name`, `metadata.oldName`, `metadata.url` | Missing | Yes, from `MetadataChangedEvent` plus tx-target classification | Yes, add explicit mapping/title |
| `governance` | `extension_authorized` | `Extension Authorized` | `{structureLabel} now uses {extension}` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `ownerCapId`, `metadata.extensionType`, `metadata.previousExtension`, `metadata.structureType` | Kind exists | Confirm gate/storage/turret rows and metadata | Yes, if CC wants `Rebound` or `Turret Doctrine Changed` titles |
| `governance` | `extension_frozen` | `Extension Frozen` | `{structureLabel} extension config frozen` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `ownerCapId`, `metadata.structureType` | Kind exists | Confirm current source/event mapping only | No for base rendering |
| `governance` | `posture_changed` | `Posture Changed` | `{oldMode} -> {newMode}` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `ownerCapId`, `metadata.mode`, `metadata.oldMode`, `metadata.newMode` | Missing | Yes | Yes, add explicit mapping |
| `governance` | `gate_policy_preset_changed` | `Gate Directive Updated` | `{mode} directive updated` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `ownerCapId`, `metadata.operation`, `metadata.mode`, `metadata.entryCount`, `metadata.defaultAccess`, `metadata.defaultToll` | Missing | Yes | Yes, add explicit mapping |
| `governance` | `gate_treasury_changed` | `Treasury Updated` | `Treasury set to {address}` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `ownerCapId`, `metadata.treasury` | Missing | Yes | Yes, add explicit mapping |
| `transit` | `gate_transit` | `Gate Transit` | `Transit recorded through a governed gate` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `amount`, `metadata.routeHash`, `metadata.destinationGateId` | Covered generically | No immediate schema change | No for base rendering |
| `transit` | `permit_issued` | `Permit Issued` | `{characterOrTribe} cleared for transit` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `amount`, `metadata.mode`, `metadata.tribeId`, `metadata.destinationGateId`, `actorCharacterId` | Missing as a first-class kind | Later add or map from existing indexed rows | Yes, if added |
| `transit` | `toll_paid` | `Toll Paid` | `{amount} collected at {gate}` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest`, `amount` | `metadata.treasury`, `actorCharacterId` | Missing as a first-class kind | Later add or map from existing indexed rows | Yes, if added |
| `trade` | `storage_deposit` | `Storage Deposit` | `Inventory moved into governed storage` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `networkNodeId`, `amount`, `metadata.typeId`, `metadata.quantity` | Covered | No | No |
| `trade` | `storage_withdraw` | `Storage Withdrawal` | `Inventory moved out of governed storage` | same as above | same as above | Covered | No | No |
| `status` | `node_fuel_changed` | `Node Fuel Updated` | `Fuel state changed for a governed node` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId`, `txDigest` | `networkNodeId`, `metadata.action`, `metadata.oldQuantity`, `metadata.newQuantity` | Covered | No immediate change | No |
| `status` | `node_low_fuel` | `Low Fuel` | `{nodeLabel} is approaching low fuel` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId` | `networkNodeId`, `severity`, `metadata.remainingHours` | Covered | No immediate change | No |
| `status` | `node_critical_fuel` | `Critical Fuel` | `{nodeLabel} reached a critical fuel threshold` | `id`, `timestamp`, `category`, `kind`, `title`, `summary`, `structureId` | `networkNodeId`, `severity`, `metadata.remainingHours` | Covered | No immediate change | No |

## 8. Current UI and display gaps inside CivilizationControl

The current backend contract is not the only parity boundary.

Current CC-side gaps:

1. Signal Feed rows now preserve and map the current parity kinds, but the UI still keeps a deliberately compact row format. There is still no secondary operator-facing metadata surface for low-signal fields beyond the mapped title, summary, amount, and digest.
2. Dashboard revenue still uses `variant === "revenue"`. `toll_paid` now maps to revenue correctly, but storage movement and generic gate-transit rows remain informational rather than counted as yield.
3. The category bar still sources its values from the legacy `eventParser.ts` constant. The values match the shared route today, but it remains a split source of truth.
4. The current UI still does not expose the existing `networkNodeId`, `structureId`, or `since` query parameters even though the client contract already supports them.
5. Deterministic proof now covers the current rename/governance/transit parity kinds in `scripts/check-signal-history-mapping.mts`, but live parity for app-originated rename and power writes still depends on EF-Map indexing those exact rows.

## 9. Priority order

### P0 before production

- `structure_online` / `structure_offline` parity for current CivilizationControl power writes, including network-node online/offline and actual child status transitions from node-offline flows
- `structure_renamed` parity for current rename flows, including node rename
- `posture_changed` visibility for the current macro posture control
- `gate_policy_preset_changed` visibility for the current gate governance composer
- `extension_authorized` visibility with enough metadata to distinguish first authorization from a turret doctrine or extension rebind

Why these are `P0`:

- they correspond to current operator-initiated actions already exposed in the app
- they can currently become silent operator actions if Signal Feed omits them
- the relevant event or tx-classification seams are already identifiable in repo code

### P1 soon after

- `gate_treasury_changed`
- first-class `permit_issued` and `toll_paid` rows instead of only generic `gate_transit`
- `extension_revoked` once revoke enters active UI scope
- revenue restoration for Dashboard `Gross Network Yield`
- optional DApp URL or broader metadata-governance rows if product language later needs them

Why these are `P1`:

- they improve operator confidence and accounting clarity
- they are not the current repo-proven silent-write blocker
- gate-specific live fixture coverage is still weaker than the current rename/power parity evidence, even though the source schema is obvious in code

### Deferred

- external marketplace revenue, sale, or yield rows until the external marketplace package, events, and URL contract are known
- local-only Node Power preset save, rename, apply, or layout actions
- turret combat or response telemetry (`TurretResponseEvent`, targeting diagnostics)
- energy reserve/release or start/stop production rows as first-pass Signal Feed items
- sponsor success or failure rows

## 10. EF-Map implementation request

### 10.1 Contract invariants

Extend or verify the existing endpoint only:

- `GET /api/civilization-control/signal-history`

Keep these invariants unless EF-Map has a strong reason to change them:

- `schemaVersion` remains `signal-history.v1`
- wallet-scoped, governed-infrastructure-scoped, read-only, browser-safe response
- newest-first cursor pagination
- default `limit = 50`, max `limit = 100`
- no browser auth headers required
- no global firehose
- no unscoped package-event leak
- no browser `queryEvents` fallback in CivilizationControl

### 10.2 Exact event or classification sources to use

Use original/type-origin package IDs for event-type matching:

- `CC_ORIGINAL_PACKAGE_ID = 0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021`
- `WORLD_ORIGINAL_PACKAGE_ID = 0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`

Use runtime package IDs only when classification needs the MoveCall target rather than the event type, such as `MetadataChangedEvent` emitted by the shared world metadata module.

| Source package | Module / event or classification source | Kinds to verify or add |
|---|---|---|
| `CC_ORIGINAL_PACKAGE_ID` | `posture::PostureChangedEvent` | `posture_changed` |
| `CC_ORIGINAL_PACKAGE_ID` | `gate_control::PolicyPresetSetEvent` | `gate_policy_preset_changed` |
| `CC_ORIGINAL_PACKAGE_ID` | `gate_control::PolicyPresetRemovedEvent` | `gate_policy_preset_changed` with `metadata.operation = removed` or a separate `gate_policy_preset_removed` if EF-Map strongly prefers it |
| `CC_ORIGINAL_PACKAGE_ID` | `gate_control::TreasurySetEvent` | `gate_treasury_changed` |
| `CC_ORIGINAL_PACKAGE_ID` | `gate_control::PermitIssuedEvent` | `permit_issued` or enrichment for `gate_transit` |
| `CC_ORIGINAL_PACKAGE_ID` | `gate_control::TollCollectedEvent` | `toll_paid` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `status::StatusChangedEvent` | `structure_online`, `structure_offline`, `structure_unanchored`, `structure_destroyed` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `metadata::MetadataChangedEvent` plus runtime tx-target classification | `structure_renamed` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `gate::ExtensionAuthorizedEvent` | `extension_authorized` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `storage_unit::ExtensionAuthorizedEvent` | `extension_authorized` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `turret::ExtensionAuthorizedEvent` | `extension_authorized` and turret-doctrine display metadata |
| `WORLD_ORIGINAL_PACKAGE_ID` | `extension_freeze::ExtensionConfigFrozenEvent` | `extension_frozen` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `gate::JumpPermitIssuedEvent` | cross-check or enrich `gate_transit` / `permit_issued` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `inventory::ItemDepositedEvent` | `storage_deposit` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `inventory::ItemWithdrawnEvent` | `storage_withdraw` |
| `WORLD_ORIGINAL_PACKAGE_ID` | `fuel::FuelEvent` | `fuel_changed`, `node_fuel_changed`, threshold-derived `node_low_fuel`, `node_critical_fuel` |

Do not prioritize these first-pass Signal Feed kinds even though the world package emits them:

- `energy::StartEnergyProductionEvent`
- `energy::StopEnergyProductionEvent`
- `energy::EnergyReservedEvent`
- `energy::EnergyReleasedEvent`

### 10.3 Wallet and structure scoping rule

Wallet scoping must stay consistent with the current endpoint intent:

1. resolve the wallet's current governed infrastructure using the same indexed ownership/governed-inventory model that already backs the route
2. include only rows whose `structureId`, `networkNodeId`, `assemblyId`, or `ownerCapId` resolve to that governed infrastructure
3. for node-offline cascades, keep the raw child status rows for actual child transitions; do not emit a synthetic node-preset or node-bulk meta-row

### 10.4 Dedupe and `id` strategy

Use stable one-row-per-event identifiers by default:

- raw event row: `id = {txDigest}:{eventSeq}`
- if EF-Map deliberately splits one raw event into more than one operator-facing row, suffix the kind: `id = {txDigest}:{eventSeq}:{kind}`

Do not reintroduce the old digest-level folding behavior in the backend first pass. The current objective is precise audit visibility, not synthetic cluster summarization.

### 10.5 Required fields per signal row

Every row should preserve or populate:

- `id`
- `timestamp`
- `category`
- `kind`
- `title`
- `summary`
- `severity`
- `networkNodeId`
- `structureId`
- `assemblyId` if available
- `ownerCapId` if available
- `txDigest`
- `checkpoint`
- `actorCharacterId` if available
- `amount` when monetary
- `metadata`

Recommended metadata keys for the first pass:

- `structureType`
- `name`
- `oldName` if EF-Map can safely compute it
- `mode`, `oldMode`, `newMode`
- `operation`
- `entryCount`, `defaultAccess`, `defaultToll`
- `treasury`
- `extensionType`, `previousExtension`
- `destinationGateId`, `routeHash`
- `fuelAction`, `oldQuantity`, `newQuantity`

### 10.6 Known exclusions for the next EF-Map prompt

- no global firehose
- no marketplace external events yet unless the external app contract is supplied later
- no restoration of browser `queryEvents`
- no unscoped package-event leak
- no local-only Node Power preset or bulk UI audit rows
- no energy reserve or release rows as first-pass operator audit entries

## 11. Recommended next step

The next implementation prompt should start with a tx-digest comparison for recent app-originated rename and power writes.

Decision rule:

- if EF-Map already has those rows and CivilizationControl is not mapping them correctly, do the small CC-side follow-up
- if EF-Map does not have those rows, extend `signal-history.v1` narrowly for the `P0` families above without widening the endpoint shape or scoping model

This keeps the next step falsifiable, low-risk, and aligned with the already-shipped shared history route.
