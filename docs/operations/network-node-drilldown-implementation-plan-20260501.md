# Network Node Drilldown Implementation Plan - 2026-05-01

## 1. Executive summary

Network-node-local drilldown is the next player-useful product slice after the node icon catalogue/reference work landed. The icon catalogue solved the visual grammar problem first: CivilizationControl now has tracked raw SVG glyphs, React catalogue components, and a static reference route at `/dev/node-icon-catalogue` that can anchor the next operator-facing surface.

The next step is not a new standalone app screen. It is a controlled drill-in inside the existing dashboard shell: the left sidebar remains, the hero metric cards remain, the main map footprint remains, and only the center map region plus the lower support surface change context when the operator selects a network node.

This plan defines that node-local interaction model, the first safe implementation branch, later staging for selection sync and local persistence, and the boundaries for eventually exposing write actions and user-named presets. It does not implement runtime code, route changes, strategic-map behavior changes, transaction changes, sponsorship changes, package-ID changes, Move changes, EF-Map changes, VPS changes, deploys, or dependency updates.

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

### Current data model and grouping

- `src/types/domain.ts` currently limits `StructureType` to four live families: `network_node`, `gate`, `storage_unit`, and `turret`.
- `src/hooks/useAssetDiscovery.ts` groups discovered structures into `NetworkNodeGroup`, which contains `node`, `gates`, `storageUnits`, and `turrets`.
- That shape is sufficient for a first render-only drilldown using the current live families.
- That shape is not sufficient for the broader future family set without later data-model and read-path expansion.

### Read-path and authority boundaries

- `src/lib/suiReader.ts` remains the direct-chain authority for ownership, structure identity, node linkage, OwnerCap discovery, fuel state, and write eligibility.
- `src/hooks/useAssemblySummaryEnrichment.ts` and `src/lib/assemblyEnrichment.ts` remain additive only. Shared-backend summaries are useful for optional display enrichment but must not become authoritative for drilldown membership, action availability, or writes.
- The existing shared-backend contract at `https://ef-map.com/api/civilization-control/assemblies` is request-by-known-ID, browser-safe, and fail-open. That should remain unchanged.

### Existing write surfaces

- `src/components/PostureControl.tsx` and the posture hooks are fleet-scoped and gate-led today. They are not the right model for node-local presets.
- `src/hooks/useStructurePower.ts` and `src/lib/structurePowerTx.ts` already provide structure-level power actions for supported current families.
- `src/screens/NetworkNodeDetailScreen.tsx` already exposes node online, while node offline remains explicitly unsupported.

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
- Browser Back should close node-local mode before leaving the dashboard shell.

### 4.5 Route and history behavior

The product requirement is continuity, not a separate-feeling route transition. The recommended implementation model is:

- make `Dashboard` the visual owner of node-local mode
- mirror the selected node into URL state so refresh and Back behave predictably
- keep the dashboard shell rendered during node-local mode
- keep `NetworkNodeDetailScreen` as a compatibility or deep-link surface until the drilldown surface is mature enough to be shared or replaced

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

Macro telemetry and attention content should be hidden while node-local mode is active. They should return when the operator exits back to macro mode.

This is the cleanest behavior because it avoids mixing two scopes in one surface. If node-local telemetry is desirable later, it should arrive as a node-scoped inspector detail, not as the macro panels squeezed into node-local mode.

### 4.8 Selection and context actions

- clicking a node-local icon selects that structure
- clicking a structure row selects the same structure
- selected icon and selected row use the same single source of truth
- selection highlight uses the existing orange or halo doctrine and remains calm
- right-click should be compact and secondary, not the primary interaction model

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
5. turrets
6. berths
7. relays
8. nursery or nest
9. shelters
10. gates

Current render-only phases should only render the families present in the live data model. Empty future families should not render placeholder icons.

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

### 5.6 Special handling for turrets and gates

Turrets and gates should remain visually distinct from passive support rows.

- turrets should occupy an outer defensive band around the right side of the node-local composition so they still read as perimeter defense
- gates should occupy the far-right rail of the composition because they are the likely future carriers of outward relationships
- this keeps support and industry rows visually readable while preserving defense and corridor semantics

### 5.7 Centering logic

The layout should center the visible structure block intentionally instead of relying on fixed row offsets.

Recommended logic:

- filter hidden structures out of the visual set first
- compute the number of visible family rows after wrapping
- compute maximum row width across visible rows
- compute `startY` so the total row block is vertically centered inside the map footprint
- compute each row's starting `x` from the available family band width so short rows do not hug the left edge awkwardly
- if the family block would overflow height, reduce row gap and icon gap down to a minimum threshold before creating a secondary lower-right column

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

- visibility toggle
- structure icon
- display name or local label
- structure family or type
- size badge or size text where relevant
- online or offline status where available
- optional relationship note, for example linked gate destination later
- action cell reserved for future safe actions

### 6.3 Selection sync

- selecting an icon highlights the matching row
- selecting a row highlights the matching icon
- only one structure is selected at a time in early phases
- the inspector reads from the same `selectedStructureId`
- background click in node-local mode clears structure selection before exiting node-local mode

### 6.4 Naming model separation

The plan must separate four different naming or action concepts that can easily be confused:

- `Local label`: UI-only operator nickname, stored locally, safe for early phases
- `Metadata or DApp URL update`: future structure-specific metadata flow if that structure supports it; not the same as local labels
- `On-chain rename`: explicit write action if such a path is later proven safe and useful
- `Display name fallback`: the current rendered name coming from direct-chain data plus optional shared-backend summary fallback

The first implementation branch should not edit any of these. It should only reserve room for the distinction.

### 6.5 Hide and unhide behavior

- hide removes the structure from the node-local map only
- hidden structures stay visible in the list
- the list becomes the place to unhide them
- hidden state is UI-only and local, not chain truth

### 6.6 Action placement

Keep the compact context menu intentionally small. The main control surface for actions should be the list row or inspector, not the right-click menu.

Recommended action split:

- list or inspector: primary safe actions, labels, future toggles, and future previews
- context menu: compact shortcuts such as `Hide from Node View`, `Reveal in List`, and later safe action entry points

### 6.7 Future actions

The surface should leave room for later:

- online or offline control for supported structures
- local label editing
- safe rename initiation when clearly separated from local labels
- preset membership or preset preview state

## 7. Local persistence design

### 7.1 Persistence strategy by phase

- Phase B render-only drilldown: persist nothing except optional URL state
- Phase C selection sync: selection can remain ephemeral
- Phase D and later: persist hide state and layout overrides
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
  "hiddenStructureIds": ["0xrelay", "0xshelter"],
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

### 7.6 Local label persistence

Local labels are worth planning but should remain separate from layout and hidden state.

- do not ship local labels in the first render-only branch
- if added later, persist a `structureId -> localLabel` map only
- do not overwrite chain-derived or summary-derived names in storage

### 7.7 Recovery and migration

- invalid JSON: drop the bad key and regenerate defaults
- wrong version: ignore the key and regenerate defaults
- signature mismatch after structure set changes: keep still-valid hidden IDs, discard invalid layout overrides, and recompute missing positions
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
- existing write actions already supported by current frontend flows
- future new write work, if the platform later needs it

### 9.2 Safe staged recommendation

Recommended sequence:

1. render-only node-local drilldown using current `NetworkNodeGroup` data
2. selection sync between SVG and list
3. local hide or unhide and deterministic local layout overrides
4. supported single-structure online or offline actions from inspector or list
5. local preset drafting and save flow, still without execution
6. broader connected-structure discovery for future family coverage
7. future preset execution and richer industry-linked behavior only after the above is proven stable

### 9.3 Existing write actions that can eventually be reused

- gate online or offline where current power flows already support it
- turret online or offline where current power flows already support it
- storage or trade post online or offline where current power flows already support it
- node online in the node header

### 9.4 Existing write actions that should stay out early

- node offline, which is currently not implemented safely
- macro posture switching repackaged as node-local posture
- any rename flow that blurs local labels and on-chain or metadata writes
- any batch preset execution before per-structure writes are stable

### 9.5 Sponsored transaction requirements

- no sponsor configuration changes should be part of early node-local branches
- any later write-enabled branch should reuse the current sponsor path unchanged
- node-local UI must remain correct even if execution falls back to player-paid flow

### 9.6 Safest conclusion

The first implementation should be UI shell first, write actions later. That matches current data coverage, current product intent, and the desire to avoid entangling Move or write behavior before the operator surface is stable.

## 10. Implementation phases

### Phase A - plan only

- Scope: this planning document, the status note in the prior plan, the docs index update, and the decision-log entry.
- Files likely touched: `docs/operations/network-node-drilldown-implementation-plan-20260501.md`, `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`, `docs/README.md`, `docs/decision-log.md`.
- Out of scope: all runtime code, routes, writes, deployment, sponsorship, package IDs, Move, vendor, and submodule changes.
- Validation: `git diff --check`, `npm run typecheck`, `npm run build`.
- Manual preview checklist: none.
- Rollback risk: low.

### Phase B - render-only node-local mode

- Scope: enter node-local mode from the strategic map, swap the map header to `Node Control`, keep the dashboard shell and hero cards unchanged, render a node-local map and lower structure surface using only current live `NetworkNodeGroup` families.
- Files likely touched: `src/screens/Dashboard.tsx`, `src/components/topology/StrategicMapPanel.tsx`, a new node-local drilldown surface component, and optionally `src/App.tsx` or `src/screens/NetworkNodeDetailScreen.tsx` for state mirroring or reuse.
- Out of scope: write actions, presets, drag persistence, broader family discovery, sponsor changes, route overhaul.
- Validation: `npm run typecheck`, `npm run build`, interaction smoke for enter and exit, no regression in macro map camera behavior.
- Manual preview checklist: click a network node, confirm the shell stays intact, confirm the map footprint stays fixed, confirm macro families remain unchanged, confirm exiting returns telemetry and attention panels.
- Rollback risk: low to medium.

### Phase C - selection sync between SVG and list

- Scope: single selected structure state, icon and row sync, calm orange halo treatment, inspector wiring, keyboard focus and `Escape` behavior.
- Files likely touched: the new node-local map component, the structure list component, selection hooks or state helpers, and light changes to `Dashboard.tsx`.
- Out of scope: writes, local persistence, presets, broader discovery.
- Validation: `npm run typecheck`, `npm run build`, selection smoke for icon-to-row, row-to-icon, clear-selection, and keyboard focus order.
- Manual preview checklist: select icon, verify matching row highlight; select row, verify matching icon highlight; `Escape` clears selection before leaving node-local mode.
- Rollback risk: low.

### Phase D - local hide or unhide and layout persistence

- Scope: hide from node view, unhide from list, persistent hidden state, persistent semantic layout overrides, and recovery behavior.
- Files likely touched: new node-local persistence helper, new layout hook, node-local map component, structure list component, and maybe `src/lib/spatialPins.ts` only as a reference pattern, not as a behavior change.
- Out of scope: writes, presets, broader discovery, server sync, on-chain persistence.
- Validation: `npm run typecheck`, `npm run build`, localStorage recovery checks, scope-key isolation checks, reset-state behavior.
- Manual preview checklist: hide a relay or shelter, refresh, confirm it stays hidden from the SVG and visible in the list, clear storage, confirm default layout regenerates cleanly.
- Rollback risk: medium because local persistence bugs can create confusing operator state.

### Phase E - supported online or offline controls from list or inspector

- Scope: expose existing supported power actions for supported families from the node-local list or inspector, keep node online in header, keep node offline absent or disabled.
- Files likely touched: node-local inspector or row actions, existing power hooks integration points, possibly `src/screens/NetworkNodeDetailScreen.tsx` if shared actions are reused.
- Out of scope: presets, new transaction builders, sponsor changes, batch execution, rename writes.
- Validation: `npm run typecheck`, `npm run build`, wallet-connected smoke for one gate, one turret, one storage unit, and node online where relevant.
- Manual preview checklist: execute one supported action, verify banner feedback, verify read-path refresh, verify node-local selection stays in sync, verify unsupported actions remain absent.
- Rollback risk: medium.

### Phase F - local preset drafting and saving

- Scope: user-named node presets, local draft capture, local save flow, and apply-preview or diff-only surface.
- Files likely touched: node-local header controls, preset storage helper, inspector or diff sheet components, and lightweight preference hooks.
- Out of scope: actual preset transaction execution, sponsor changes, new backend storage, Move work.
- Validation: `npm run typecheck`, `npm run build`, create and rename preset smoke, diff-preview smoke, delete-preset smoke.
- Manual preview checklist: save `Industry`, save `Defense`, verify overflow behavior for many presets, verify zero-state copy when presets are deleted.
- Rollback risk: medium.

### Phase G - richer connected-structure discovery for broader node catalogue

- Scope: expand the read model beyond the current four-family `NetworkNodeGroup`, introduce broader family hydration where source truth is proven, and keep shared-backend enrichment additive only.
- Files likely touched: `src/types/domain.ts`, `src/hooks/useAssetDiscovery.ts`, `src/lib/suiReader.ts`, `src/hooks/useAssemblySummaryEnrichment.ts`, `src/lib/assemblyEnrichment.ts`, item-type helpers, and node-local rendering components.
- Out of scope: new write semantics, sponsor changes, Move changes, EF-Map ownership authority.
- Validation: `npm run typecheck`, `npm run build`, direct-chain fallback smoke, family-membership proof, regression checks for macro map grouping.
- Manual preview checklist: confirm new families appear only when live data can prove membership; confirm macro map remains limited to canonical macro families.
- Rollback risk: medium to high because it changes the read model.

### Phase H - future industry, schemas, and structure-link expansion

- Scope: future refinery schemas, printer schemas, inter-structure relationship links, and richer node-local industry surfaces.
- Files likely touched: broader node-local UI, future relationship layout helpers, future schema rendering components, and possibly later docs or read helpers.
- Out of scope: early safe drilldown branch.
- Validation: phase-specific typecheck, build, and future product validation depending on the actual industry slice.
- Manual preview checklist: schema-specific later.
- Rollback risk: high because this is the first truly new product layer beyond the current proven structure set.

## 11. Recommended first implementation branch

The recommended first implementation branch is:

`Render-only node-local mode inside the existing dashboard map footprint and lower-panel shell, using current live NetworkNodeGroup data and the tracked icon catalogue, with entry by clicking a Network Node and exit back to macro view. No write actions, no presets, no drag persistence yet.`

This is the right first branch because:

- it matches the user's same-dashboard drill-in intent exactly
- it stays within current proven data coverage
- it avoids mixing UI-shell work with transaction risk
- it preserves the macro map and existing sponsor or Move boundaries
- it creates the stable operator surface that later hide, write, and preset work can attach to

## 12. Risks and open questions

- broader family coverage is not yet hydrated in the current live data model
- dense nodes may force row wrapping and inspector tradeoffs sooner than expected
- drag-and-persist behavior can become messy if introduced before the default layout is proven useful
- right-click discoverability competes with the existing camera interaction model if it leaks back into macro mode
- operators may confuse local labels with on-chain rename unless the distinction is explicit in the UI
- supported online or offline actions differ by family, and node offline remains intentionally unsupported
- preset execution can become unsafe if it ships before single-structure write validation and preview-diff behavior
- future industry relationships need link language, so the initial drilldown must not spend that visual budget on noisy node-to-child connectors
- browser localStorage can corrupt, leak across users, or go stale unless keys are scoped tightly and recovered defensively
- the same-dashboard drilldown model needs responsive discipline on narrower widths so the lower structure surface does not become unreadable

## 13. Files likely touched

### Dashboard and screen surfaces

- `src/screens/Dashboard.tsx`
- `src/App.tsx` only if URL mirroring or route reuse is added
- `src/screens/NetworkNodeDetailScreen.tsx` as a later compatibility wrapper or shared surface consumer

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

## 14. Validation and manual testing plan

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
- back action and Browser Back both return to macro mode predictably
- lower telemetry and attention panels return when macro mode returns
- direct-chain data remains enough to render node-local mode even if shared-backend enrichment is unavailable

### Later write-enabled smoke

- wallet-connected action smoke for supported single-structure power actions
- feedback banners and pending states behave correctly
- sponsor path and player-paid fallback both behave acceptably
- read-path refresh reconciles node-local UI after completion

### Local persistence smoke

- hide and unhide survive refresh for the same `scopeKey` and node ID
- another wallet or character does not inherit hidden state or layout state
- corrupted localStorage records fail open and regenerate defaults
- reset action restores default layout cleanly

## 15. Source notes

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