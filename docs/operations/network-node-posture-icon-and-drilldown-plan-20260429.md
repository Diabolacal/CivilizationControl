# Network Node Posture Icon And Drilldown Plan - 2026-04-29

## 1. Executive summary
CivilizationControl's hackathon win condition was macro posture control across gates, turrets, trade posts, and network nodes. That was the right first surface for a demo, but it does not yet map tightly enough to how current players actually operate inside one powered cluster.

The next useful surface is still a network-node-local operator view: select a node, inspect everything attached to that node, change structure posture at the connected-structure level, and eventually save named local presets such as industry mode or defense / AFK mode. After user review, however, the gating work is now iconography rather than the drilldown shell itself.

This plan keeps the macro strategic map intentionally simplified. The fleet-wide map should remain a calm strategic overview built from four existing macro families: network nodes, gates, trade posts / storage units, and turrets. Printer, refinery, assembler, berth, relay, nursery, and shelter families belong only in future node drilldown work, not in the macro map.

This document does not implement runtime code, map behavior changes, transaction changes, sponsorship changes, package-ID changes, Move changes, Cloudflare changes, EF-Map changes, or backend changes. It is a planning-only input for later narrow feature branches.

### User review update
- Iconography is now the gating item. The next implementation slice is icon catalogue plus static preview, not a drilldown shell.
- M and H badges are part of the operator grammar and must be explicit where size ladders matter.
- Shelter and Heavy Shelter move up into an explicit provisional-but-important hangar family.
- Field variants stay deferred unless better source truth proves they belong in the same node-local universe.
- Icon silhouettes should be functional operator symbols, not literal copies of in-game meshes that may drift during alpha.
- The future node view needs a compact legend / key so unfamiliar families remain legible without turning the diagram into a help panel.

## 2. Current product context
### Hackathon macro-posture model
The shipped product centers on macro infrastructure posture:
- `useAssetDiscovery()` resolves owned structures and groups them into `NetworkNodeGroup` objects.
- `StrategicMapPanel` renders that grouped fleet as a strategic network schematic.
- posture today is fleet-facing and gate-led, with defense/commercial coloring propagating through gates, turrets, and corridor links.

That gives CivilizationControl a strong command-overview story, but it treats one node cluster mostly as a counted subgraph instead of a first-class operator workspace.

### Current live architecture
The current live read path is already hardened and should remain the authority chain:
1. wallet -> PlayerProfile -> Character -> OwnerCap discovery from direct Sui reads
2. direct-chain structure discovery in `src/lib/suiReader.ts`
3. current structure grouping in `src/hooks/useAssetDiscovery.ts`
4. additive shared-backend enrichment only after direct-chain discovery succeeds

The current `StructureType` union only covers four live app families: `gate`, `storage_unit`, `turret`, and `network_node`. That is enough for today's app and macro map, but not enough for a future node-local icon plan unless the broader assembly catalogue is captured explicitly.

### Sponsor worker, shared-backend, and package state
- Sponsor-worker source and validation now live in-repo. Production uses the repo-owned `civilizationcontrol-sponsor` worker. This plan does not change sponsorship, worker config, or allowlists.
- Production already consumes `https://ef-map.com/api/civilization-control/assemblies` as an additive assembly-summary endpoint. It remains request-by-known-ID only, secret-free in the browser, and fail-open.
- The runtime/original split is already complete in the frontend model. This plan does not change package IDs, constants, or migration state.

### Direct-chain authority and fallback rule
For future node-posture work, these rules remain fixed:
- ownership, structure identity, action eligibility, power-state writes, sponsorship, and network-node action linkage stay direct-chain authoritative
- shared-backend data remains additive and read-only
- any future enrichment must fail open back to direct-chain data

## 3. Existing strategic map and SVG constraints
### Current macro structure types
The current strategic map renders four macro families only:
- Network Nodes
- Gates
- Trade Posts / storage units
- Turrets

Those are the only families in the current `StructureType` union, in `useAssetDiscovery()` grouping, and in the current topology glyph dispatcher.

### Current icon and visual-spec constraints
The canonical topology grammar is already defined and should remain the visual base:
- 24x24 viewBox grid
- stroke-only glyphs in neutral state
- state expressed by color, pips, badges, halos, and link treatment rather than by changing the base silhouette
- charcoal / near-black background with subdued grid
- color doctrine: gray baseline, muted teal for online/healthy, amber for warning/defense, red for offline/denied, green for economic confirmation only, orange only as sparse accent / selection

Current live glyphs are inline React SVG components rather than imported asset files:
- `NetworkNodeGlyph`: hexagon + center dot
- `GateGlyph`: ring / aperture
- `TradePostGlyph`: square with inner square
- `TurretGlyph`: triangle

Important current rendering constraints:
- `StrategicMapPanel` uses a fixed `900 x 440` SVG viewport inside a `440px`-high strategic panel
- gate corridor lines are shortened by `GATE_CORRIDOR_INSET = 14` to stop outside the gate glyph
- child structures use anchor lines back to the parent node center
- node color reflects node health, not posture
- gates and turrets carry posture color; trade posts remain posture-neutral

### Current interaction model
The strategic map is currently a camera-control surface, not a selection surface:
- wheel zoom implemented
- left-drag orbit implemented
- right-drag pan implemented
- reset / lock controls implemented
- click-to-select missing
- click-to-navigate missing
- keyboard navigation missing

### Where a future node-local view fits
The eventual drilldown anchor is still the existing network-node detail route:
- `src/App.tsx` already exposes `/nodes` and `/nodes/:id`
- `NetworkNodeDetailScreen` already shows node status, fuel, online control, and attached child structures

That route remains the safest later home for node-local posture work, but it is no longer the next implementation slice. Iconography and legend grammar must be firm first.

### What should not be disturbed first
The first implementation slice should preserve these control points:
- direct-chain discovery in `src/lib/suiReader.ts`
- current `NetworkNodeGroup` grouping in `src/hooks/useAssetDiscovery.ts`
- additive enrichment rules in `src/hooks/useAssemblySummaryEnrichment.ts` and `src/lib/assemblyEnrichment.ts`
- orbit / pan / zoom and current layout behavior in `StrategicMapPanel`
- current `assignChildSlots()` radial grammar
- current structure power hooks and sponsor flow

## 4. Structure type catalogue
Classification rules used below:
- First-wave = should appear in the future icon catalogue and static preview immediately, and is already part of the current live structure universe.
- Provisional but important = should be designed now so the icon system does not paint itself into a corner, but should not become first-wave power-control UI unless stronger runtime truth exists.
- Deferred = keep in the long-term catalogue notes only until stronger proof exists.

Evidence shorthand used below:
- `CC current code/docs` = current CivilizationControl source, current map docs, and current web-capabilities docs
- `itemTypes` = `src/data/itemTypes.json`
- `energy list` = `vendor/world-contracts/env.example` `ASSEMBLY_TYPE_IDS`
- `gate list` = `vendor/world-contracts/env.example` `GATE_TYPE_IDS`
- `world modules` = upstream `network_node.move` / `assembly.move` semantics

### 4.1 First-wave node-drilldown families
| Family | Concrete types / IDs | Size ladder | Macro map? | Node-drilldown class | Power / operational note | Evidence | Confidence |
|---|---|---|---|---|---|---|---|
| Network Node | Network Node 88092 | None | Yes | First-wave | Online today; offline later via hot-potato flow | CC current code/docs + itemTypes + world modules | High |
| Gate family | Mini Gate 88086, Heavy Gate 84955 | Two-size ladder: M/H | Yes | First-wave | Current web PTB already supports online/offline | CC current code/docs + itemTypes + gate list | High |
| Storage / Trade Post family | Mini Storage 88082, Storage 88083, Heavy Storage 77917 | M/blank/H | Yes | First-wave | Current web PTB already supports online/offline | CC current code/docs + itemTypes + energy list | High |
| Turret family | Smart Turret 84556, Mini Turret 92279, Turret 92401, Heavy Turret 92404 | Size ladder M/blank/H; Smart is subtype, not size rung | Yes | First-wave | Current web PTB already supports online/offline | CC current code/docs + itemTypes + energy list | High |

### 4.2 Provisional but important families
| Family | Concrete types / IDs | Size ladder | Power / operational note | Planned treatment | Evidence | Confidence |
|---|---|---|---|---|---|---|
| Printer family | Mini Printer 87119, Printer 88067, Heavy Printer 87120 | M/blank/H | Strong powered-family evidence | Design now, defer behavior and discovery expansion | itemTypes + energy list + world modules | High |
| Refinery family | Refinery 88063, Heavy Refinery 88064 | Blank/H only | Strong powered-family evidence | Design now, no Mini badge until a real mini variant exists | itemTypes + energy list + world modules | High |
| Assembler | Assembler 88068 | None | Strong powered-family evidence | Design now as one-off manufacturing family | itemTypes + energy list + world modules | High |
| Berth family | Mini Berth 88069, Berth 88070, Heavy Berth 88071 | M/blank/H | Strong powered-family evidence | Design now with distinct berth silhouette | itemTypes + energy list + world modules | High |
| Relay | Relay 90184 | None | Strong powered-family evidence | Design now as utility / signal family | itemTypes + energy list + world modules | High |
| Nursery | Nursery 91978 | None | Strong powered-family evidence | Design now as separate incubation family | itemTypes + energy list + world modules | High |
| Hangar / Shelter family | Shelter 88093, Heavy Shelter 88094, Nest 91871 | Shelter blank/H, Nest unbadged | Operationally important for ship storage even without current power proof | Promote to explicit provisional-but-important family; do not assume first-wave power control | itemTypes; absent from current energy list | Medium |

### 4.3 Deferred families
| Family | Concrete types / IDs | Why deferred | Evidence | Confidence |
|---|---|---|---|---|
| Field variants | Field Printer 87162, Field Refinery 87161, Field Storage 87566 | Operationally meaningful but not proven in the current powered-node source set | itemTypes; absent from current energy list | Medium |

### 4.4 Catalogue takeaways
- The live app currently exposes only four macro families. Those remain the strict first-wave node-drilldown families.
- Printer, refinery, assembler, berth, relay, nursery, and hangar families should be designed now so the icon language stays stable later, but they should not be pushed onto the macro map.
- Shelter and Heavy Shelter are no longer dismissed; they are explicit provisional hangar/storage families with operator importance even before power semantics are proven.
- Field variants remain deferred until stronger source truth proves they belong in the same node-local structure universe.

## 5. Proposed network-node icon taxonomy
Shared rules:
- Silhouette = family identity.
- Interior mark = subtype or function refinement.
- Badge = size only when size materially matters.
- Status = overlay, pip, halo, or stroke treatment; do not mutate the base silhouette.
- Hover = restrained stroke lift only.
- Selection = sparse orange halo only.
- Icons are stable operator symbols, not literal copies of current in-game model silhouettes.

Use the current four macro silhouettes unchanged. Reserve the shared industry diamond only for true process / manufacturing families. Do not let the diamond become the generic fallback for every new structure type.

| Family | Base silhouette | Interior mark | Size badge rule | Family-specific overlay note | Hover / selected note | Why it reads clearly |
|---|---|---|---|---|---|---|
| Network Node | Existing hexagon + core dot | Core dot only | None | Health-driven stroke; low-fuel amber pip only | Standard hover and sparse orange selection halo | Already the canonical hub / power anchor |
| Gate family | Existing aperture ring | None | `M` for Mini Gate, `H` for Heavy Gate | Corridor state stays mostly on links, not inside the ring | Hover may emphasize linked corridor with the ring | Unique passage silhouette even at small size |
| Storage / Trade Post family | Existing square with inner square | Inner square only | `M` / blank / `H` | Green remains transient commerce confirmation only | Standard hover / selection; no persistent green glow | Strong container / commerce read and high contrast to node/gate/turret |
| Turret family | Existing outward triangle | Smart Turret gets one slot mark | `M` / blank / `H`; Smart uses mark, not badge | Amber defense read and armed halo stay consistent with macro map | Standard hover / selection; preserve outward orientation | Only directional threat silhouette in the set |
| Printer family | Shared industry diamond | One strong vertical platen mark | `M` / blank / `H` | Standard teal / amber / red overlays | Standard hover / selection | Clear fabrication cue without copying in-game mesh |
| Refinery family | Shared industry diamond | Lower basin / split-trough mark | Blank / `H` | Standard teal / amber / red overlays | Standard hover / selection | Reads as processing rather than printing |
| Assembler | Shared industry diamond | Interlocking bracket / block mark | None | Standard teal / amber / red overlays | Standard hover / selection | Fits manufacturing family without another silhouette |
| Berth family | Separate open cradle / dock-bay silhouette | One dock rail / keel bar | `M` / blank / `H` | Standard teal / amber / red overlays | Standard hover / selection | Docking / shipyard read is different from process industry |
| Relay | Separate mast / pylon silhouette | Mast with short side ticks | None | Standard teal / amber / red overlays | Standard hover / selection; dependency line may be emphasized | Reads as utility / signal rather than manufacturing |
| Nursery | Separate pod / incubation-cell silhouette | Nested ring / seed mark | None | Standard teal / amber / red overlays | Standard hover / selection | Distinct from printer/refinery and avoids overusing the diamond |
| Hangar / Shelter family | Separate roofed bay / vaulted shelter silhouette | Shelter stays clean; Nest gets nested arch or hatch mark | Shelter blank / `H`; Nest unbadged | Neutral-first until power semantics are proven; if later powered, use the standard doctrine | Standard hover / selection | Reads as protected ship storage rather than processor or cargo box |
| Deferred field variants | Inherit closest parent family silhouette in catalogue only | Parent-family mark | No field badge in first-wave preview | Keep provisional; no first-wave behavior assumptions | Standard hover / selection if ever previewed later | Avoids premature icon sprawl |

## 6. Size variant rules
### 6.1 Badge ladder matrix
| Family | Badge logic | Notes |
|---|---|---|
| Storage | `M` = Mini Storage, blank = Storage, `H` = Heavy Storage | Required at node scale |
| Turret | `M` = Mini Turret, blank = Turret, `H` = Heavy Turret | Smart Turret uses interior mark, not size badge |
| Printer | `M` = Mini Printer, blank = Printer, `H` = Heavy Printer | Required at node scale |
| Berth | `M` = Mini Berth, blank = Berth, `H` = Heavy Berth | Required at node scale |
| Gate | `M` = Mini Gate, `H` = Heavy Gate | Two-size ladder today; reserve blank for any future standard gate |
| Refinery | blank = Refinery, `H` = Heavy Refinery | No Mini badge until a real mini variant exists |
| Hangar / Shelter | blank = Shelter, `H` = Heavy Shelter | Nest stays unbadged |

### 6.2 Placement and suppression
- Default badge corner is north-east.
- If the north-east corner already hosts a warning pip, revenue badge, or selected-state treatment, move the size badge to north-west rather than stacking overlays.
- Badges sit just outside the occupied 20x20 glyph area, not inside the silhouette.
- Suppress badges at aggregate or collapsed-summary scales where the letter would stop being readable.

### 6.3 What not to badge
- Do not badge network nodes.
- Do not badge one-off special variants such as Smart Turret, Relay, Assembler, or Nursery; use interior marks or inspector labels instead.
- Do not let size badges outrank status overlays or selection.

## 7. Node-view legend / key requirements
### Placement
- Default placement is a slim vertical key along the left edge of the future node-view diagram shell.
- If that edge becomes visually crowded for a specific layout, allow a quiet corner fallback, but keep the key off the selected node and out of major corridor paths.
- The key must never become a full side panel.

### Contents
- One row per family currently present in the node view: icon plus short label only.
- One shared line explaining size: `M = Mini`, `H = Heavy`, blank = Standard.
- One compact line for status grammar only when needed: teal online, amber warning / defense, red offline / denied, orange halo selected, pip = persistent micro-status.

### Density rules
- Show only families present in the current node view, not the entire long-term catalogue.
- Keep the key to two compact blocks maximum: family rows and one-line grammar help.
- Use quiet typography and neutral framing so the diagram stays primary.

### What stays out of the legend
- No long prose explanations.
- No per-icon controls or action instructions.
- No preset guidance.
- No raw chain / backend diagnostics.
- No full badge dictionary or motion timing guide.

## 8. Network-node drilldown UX concept
The eventual node drilldown still follows the same calm operator-facing direction, but it is now a later phase rather than the next branch.

### Entry and exit
- Long-term entry remains a direct click on the network-node hexagon from the strategic map.
- Short-term safe anchor remains the existing `/nodes/:id` route.
- Exit stays one quiet `Back to Network` action plus optional `Esc`.

### Visual framing and layout
- The selected node remains the visual anchor at the center of the drilldown.
- Keep the current radial grammar as the base layout language so the drilldown feels like a zoom into the topology, not a second visualization system.
- Use automatic layout first; drag override and persistence remain later features.

### Controls and pacing
- Icon surfaces stay calm: icon = identity + state; inspector = actions.
- Per-structure online/offline should live in the selected-structure inspector or header action row, not permanently on every glyph.
- Named posture presets remain later and should appear as a compact utility, not new map chrome.

### What still stays out of the first implementation slice
- drilldown shell itself
- map click navigation
- backend relationship discovery
- online/offline actions from the node view
- preset authoring or persistence

## 9. Data requirements
### What current direct-chain discovery already provides
Current direct-chain discovery already gives the future drilldown enough for later phases involving today's known families:
- structure object ID
- owner-cap ID
- current four-family structure type
- node linkage for current known child structures
- linked-gate relationships
- node fuel state
- extension authorization state
- power status used by current control actions

### What shared-backend assembly enrichment already provides
Current assembly enrichment already provides these optional fields:
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

Useful implications for later node work:
- `assemblyType`, `typeId`, and `typeName` can help with future icon-family labeling
- `status` is useful contextual metadata, but not type authority
- `energySourceId` may help later relationship enrichment, but should not replace direct-chain node-link authority

### What can be done without backend changes
The following can be implemented without any new backend or indexer work:
- the icon catalogue and family taxonomy
- a static icon and legend preview surface
- later route-local drilldown layout using current known structures

### What still needs future proof or future backend help
- broader connected-assembly membership beyond the current four live families
- stable browser-safe node summaries for the wider powered catalogue
- stronger truth about whether deferred field variants and provisional hangars truly belong in the powered-node structure universe

### Fallback behavior that must remain
- direct-chain discovery remains authoritative
- shared-backend enrichment remains optional and fail-open
- missing or partial enrichment must leave future node surfaces usable with direct-chain data only
- no write-path or action decision may depend on enrichment availability

## 10. Implementation phases
### Phase 0 - Specification lock
- Scope: refine and freeze the node-drilldown type catalogue, silhouette rules, M/H badge grammar, legend requirements, and static-preview acceptance criteria in docs.
- Likely files: this plan, and later canonical docs such as `docs/ux/svg-topology-layer-spec.md` and `assets/icons/README.md` if the catalogue becomes canonical there.
- Validation: `git diff --check`
- Manual preview checklist: doc review only.
- Rollback notes: trivial docs rollback.
- What not to do yet: no runtime code, no routes, no SVG component files, no tx changes.

### Phase 1 - Icon catalogue and static icon / legend preview only
- Scope: implement the node-level SVG icon catalogue, M/H badge treatment, and a static icon/legend preview only.
- Likely files: `src/components/topology/Glyphs.tsx`, a new preview-only component or screen, and optional spec/audit doc updates.
- Validation: `npm run typecheck`, `npm run build`.
- Manual preview checklist: confirm every first-wave family and every provisional-important family renders clearly; confirm M/H badges are readable; confirm the legend stays compact; confirm the live strategic map remains behaviorally unchanged.
- Rollback notes: isolated UI rollback only.
- What not to do yet: no drilldown shell, no map click navigation, no backend relationship discovery, no online/offline actions, no presets.

### Phase 2 - Render-only node drilldown shell with current live families
- Scope: extend the existing `/nodes/:id` surface into a render-only node-local layout using current `NetworkNodeGroup` data and the approved icon set.
- Likely files: `src/screens/NetworkNodeDetailScreen.tsx` plus one or more new presentation components.
- Validation: `npm run typecheck`, `npm run build`.
- Manual preview checklist: verify centered node + attached current children, unchanged macro map behavior, and no new write affordances.
- Rollback notes: low risk because it can stay route-local.
- What not to do yet: no richer discovery, no write-path changes, no presets.

### Phase 3 - Connected-structure discovery / hydration
- Scope: extend read-path discovery so the drilldown can hydrate richer connected structures beyond the current four live families.
- Likely files: `src/lib/suiReader.ts`, `src/hooks/useAssetDiscovery.ts`, `src/types/domain.ts`, and optional new read-model helpers.
- Validation: `npm run typecheck`, `npm run build`, targeted read-path smoke, and fail-open checks.
- Manual preview checklist: compare attached-structure counts against current discovery and confirm missing enrichment does not blank the screen.
- Rollback notes: medium-low because it changes read-model shape.
- What not to do yet: no write flows, no owner discovery via backend, no macro-map family explosion.

### Phase 4 - Per-structure online/offline from drilldown
- Scope: expose existing per-structure power actions from the drilldown for currently supported families only.
- Likely files: route-local drilldown UI, `src/hooks/useStructurePower.ts`, and `src/lib/structurePowerTx.ts`.
- Validation: `npm run typecheck`, `npm run build`, wallet smoke on one gate, one turret, and one trade post.
- Manual preview checklist: confirm feedback banners, refresh, and unchanged strategic-map behavior.
- Rollback notes: medium because this is the first write-path-adjacent phase.
- What not to do yet: no network-node offline flow, no broader industry writes, no preset authoring.

### Phase 5 - Draftable local named presets
- Scope: add node-scoped preset drafting and preview behavior without persistence yet.
- Likely files: drilldown UI plus a preset model/type layer.
- Validation: `npm run typecheck`, `npm run build`.
- Manual preview checklist: create a preset name, preview its impact, and confirm refresh intentionally drops the draft.
- Rollback notes: low because this phase stays local to UI state.
- What not to do yet: no localStorage persistence, no server sync, no new Move objects.

### Phase 6 - Saved presets and local layout persistence
- Scope: persist presets and optional drag-layout state in browser storage, scoped per node.
- Likely files: drilldown persistence helpers, modeled on existing local persistence patterns such as `src/lib/spatialPins.ts`.
- Validation: `npm run typecheck`, `npm run build`, local storage corruption / recovery smoke.
- Manual preview checklist: save, reload, rename, delete, and recover from bad local data.
- Rollback notes: medium-low because persistence bugs can be isolated locally.
- What not to do yet: no server-backed sync and no on-chain persistence.

### Phase 7 - Richer backend / indexer enrichment only if justified
- Scope: add additive node-summary or live-update enrichment only if earlier phases prove a real read-path gap.
- Likely files: shared-backend client / merge layers, optional docs contract, optional node-summary hook.
- Validation: `npm run typecheck`, `npm run build`, browser-origin positive-path validation, and fail-open tests with the backend disabled.
- Manual preview checklist: compare direct-chain-only behavior vs enriched behavior and verify no browser auth headers appear.
- Rollback notes: medium because this changes the additive read path.
- What not to do yet: no backend ownership discovery, no write authority from backend, no sponsor or package-ID changes.

## 11. First implementation slice recommendation
The recommended next implementation prompt after this refinement is:

> Implement the node-level SVG icon catalogue and a static icon/legend preview only. Do not add a node drilldown shell. Do not add map click navigation. Do not add backend relationship discovery. Do not add online/offline actions. Do not add presets.

Why this is now the right first slice:
- iconography is the blocking item after user review
- M/H badge legibility needs to be proven before node-local behavior expands
- shelter / hangar treatment needs visible review before it is buried inside a larger drilldown branch
- the macro map and existing route behavior stay untouched while the visual grammar is locked

## 12. Risks and open questions
- **Incomplete type catalogue risk.** The live app still discovers only four families. The broader powered catalogue is real, but still needs future runtime confirmation at the node-relationship level.
- **Shelter / hangar semantics.** Shelter and Heavy Shelter are important enough to design now, but current source truth does not yet justify first-wave power-control assumptions.
- **Field variant membership.** Field Printer / Refinery / Storage remain deferred because the current source set does not prove they belong in the same powered-node universe.
- **Diamond overuse risk.** If too many families inherit the industry diamond, the node drilldown will lose silhouette-first readability.
- **Legend noise risk.** The key is necessary, but it must remain quieter than the node diagram itself.
- **Badge collision risk.** M/H, warning pips, revenue badges, and selection halos all need explicit precedence rules.
- **Online/offline write safety.** Per-structure drilldown actions should reuse existing power flows first. Network-node offline remains specifically risky because of the connected-assembly hot-potato flow.

## 13. Sources inspected
### CivilizationControl source and docs
- `src/types/domain.ts`
- `src/hooks/useAssetDiscovery.ts`
- `src/hooks/useAssemblySummaryEnrichment.ts`
- `src/lib/suiReader.ts`
- `src/lib/assemblySummaryClient.ts`
- `src/lib/assemblyEnrichment.ts`
- `src/components/topology/Glyphs.tsx`
- `src/components/topology/NodeCluster.tsx`
- `src/components/topology/StrategicMapPanel.tsx`
- `src/components/topology/topologyLayout.ts`
- `src/screens/NetworkNodeDetailScreen.tsx`
- `src/App.tsx`
- `src/data/itemTypes.json`
- `docs/ux/svg-topology-layer-spec.md`
- `docs/ux/strategic-network-map-implementation-audit.md`
- `docs/ux/civilizationcontrol-ux-architecture-spec.md`
- `docs/ux/ui-polish-reference-brief.md`
- `docs/architecture/spatial-embed-requirements.md`
- `docs/operations/gate-control-web-capabilities.md`
- `docs/operations/shared-backend-assembly-enrichment-20260429.md`
- `docs/operations/world-runtime-original-split-20260429.md`
- `docs/operations/sponsor-worker-runbook.md`
- `docs/strategy/civilization-control/where-civilizationcontrol-goes-next.md`
- `assets/icons/README.md`
- `.github/instructions/design.instructions.md`
- `.github/instructions/shared-backend.instructions.md`

### Vendor sources
- `vendor/world-contracts/env.example`
- `vendor/world-contracts/contracts/world/sources/assemblies/assembly.move`
- `vendor/world-contracts/contracts/world/sources/network_node/network_node.move`
- `vendor/world-contracts/ts-scripts/network-node/helper.ts`
- `vendor/builder-documentation/smart-assemblies/introduction.md`
- `vendor/builder-documentation/welcome/smart-infrastructure.md`

### Not required for this refinement
- no EF-Map repo checkout reads were required
- no public EF-Map API probing was required
- no VPS or indexer queries were required
- no secrets were accessed or printed