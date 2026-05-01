# Network Node Posture Icon And Drilldown Plan - 2026-04-29

## 1. Executive summary
CivilizationControl's hackathon win condition was macro posture control across gates, turrets, trade posts, and network nodes. That was the right first surface for a demo, but it does not yet map tightly enough to how current players actually operate inside one powered cluster.

The next useful surface is a network-node-local operator view: select a node, inspect everything attached to that node, change structure posture at the connected-structure level, and eventually save named local presets such as industry mode or defense / AFK mode. This plan starts with icon and type-catalogue work because the product does not yet have a stable visual or data taxonomy for the broader set of powered structures that may sit behind a single node.

This plan keeps the macro strategic map intentionally simplified. The fleet-wide map should remain a calm strategic overview built from four existing macro families: network nodes, gates, trade posts / storage units, and turrets. The richer structure catalogue belongs in the node drilldown, not on the macro map.

This document does not implement runtime code, map behavior changes, transaction changes, sponsorship changes, package-ID changes, Move changes, Cloudflare changes, EF-Map changes, or backend changes. It is a planning-only input for a later narrow feature branch.

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

The current `StructureType` union only covers four live app families:
- `gate`
- `storage_unit`
- `turret`
- `network_node`

That is enough for today's app and macro map, but not enough for a future node-local icon plan unless the broader assembly catalogue is first captured explicitly.

### Sponsor worker state
Sponsor-worker source and validation now live in-repo. Production uses the repo-owned `civilizationcontrol-sponsor` worker. This plan does not change sponsorship, worker config, or allowlists.

### Shared-backend enrichment state
Production already consumes `https://ef-map.com/api/civilization-control/assemblies` as an additive assembly-summary endpoint. The current contract is intentionally narrow:
- request by already-known decimal assembly IDs only
- no browser secret or API key
- fail-open if missing, partial, invalid, or unavailable
- no write authority, ownership authority, or action authority

This plan treats that endpoint as useful metadata for future labeling, not as a discovery or authorization surface.

### World v2 / package state
The runtime/original split is already complete in the frontend model:
- runtime MoveCall targets use `WORLD_RUNTIME_PACKAGE_ID`
- exact type-origin reads and type strings use `WORLD_ORIGINAL_PACKAGE_ID`
- `WORLD_PACKAGE_ID` remains only as a compatibility alias
- MVR drift checks already exist and remain outside the scope of this plan

This plan does not change package IDs, constants, or migration state.

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

An implementation audit already calls out click-to-navigate and click-to-select as missing. That matters because a future node drilldown should not assume current map clicks exist.

### Where a future node-local view fits
The safest future fit is to extend the existing network-node detail route before changing the strategic map:
- `src/App.tsx` already exposes `/nodes` and `/nodes/:id`
- `NetworkNodeDetailScreen` already shows node status, fuel, online control, and attached child structures

That means the first real implementation slice can build a render-only node-local posture view on top of the existing node-detail route without touching strategic-map behavior.

### What the first implementation slice should not disturb
The first implementation slice should preserve these existing control points:
- direct-chain discovery in `src/lib/suiReader.ts`
- current `NetworkNodeGroup` grouping in `src/hooks/useAssetDiscovery.ts`
- additive enrichment rules in `src/hooks/useAssemblySummaryEnrichment.ts` and `src/lib/assemblyEnrichment.ts`
- orbit / pan / zoom and current layout behavior in `StrategicMapPanel`
- current `assignChildSlots()` radial grammar
- current structure power hooks and sponsor flow

## 4. Structure type catalogue
The catalogue below deliberately separates the current macro-map set from the broader node-drilldown set.

Evidence shorthand used below:
- `CC current code/docs` = current CivilizationControl source, current map docs, and current web-capabilities docs
- `itemTypes` = `src/data/itemTypes.json`
- `energy list` = `vendor/world-contracts/env.example` `ASSEMBLY_TYPE_IDS`
- `gate list` = `vendor/world-contracts/env.example` `GATE_TYPE_IDS`
- `world modules` = upstream `network_node.move` / `assembly.move` semantics

### Strongly evidenced node-dependent set
| Display name | Type ID | Type/category | Size variant | Macro map? | Node drilldown? | Online/offline relevant? | Source/evidence | Confidence |
|---|---:|---|---|---|---|---|---|---|
| Network Node | 88092 | Core / infrastructure | n/a | Yes | Yes | Yes - online now, offline later via hot-potato flow | CC current code/docs + itemTypes + world modules | High |
| Mini Gate | 88086 | Gate / logistics | Mini | Yes (family collapsed) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + gate list | High |
| Heavy Gate | 84955 | Gate / logistics | Heavy | Yes (family collapsed) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + gate list + energy list | High |
| Mini Storage | 88082 | Storage / trade post | Mini | Yes (family collapsed as Trade Post) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Storage | 88083 | Storage / trade post | Standard | Yes (family collapsed as Trade Post) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Heavy Storage | 77917 | Storage / trade post | Heavy | Yes (family collapsed as Trade Post) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Smart Turret | 84556 | Defense / turret | Smart variant | Yes (family collapsed) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Mini Turret | 92279 | Defense / turret | Mini | Yes (family collapsed) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Turret | 92401 | Defense / turret | Standard | Yes (family collapsed) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Heavy Turret | 92404 | Defense / turret | Heavy | Yes (family collapsed) | Yes | Yes - current web PTB implemented | CC current code/docs + itemTypes + energy list | High |
| Mini Printer | 87119 | Industry / printing | Mini | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Printer | 88067 | Industry / printing | Standard | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Heavy Printer | 87120 | Industry / printing | Heavy | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Refinery | 88063 | Industry / refining | Standard | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Heavy Refinery | 88064 | Industry / refining | Heavy | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Assembler | 88068 | Industry / manufacturing | n/a | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Mini Berth | 88069 | Industry / shipyard | Mini | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Berth | 88070 | Industry / shipyard | Standard | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Heavy Berth | 88071 | Industry / shipyard | Heavy | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Relay | 90184 | Infrastructure / relay | n/a | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |
| Nursery | 91978 | Industry / shell growth | n/a | No | Yes | Likely yes - upstream powered assembly, no CC UI today | itemTypes + energy list + world modules | High |

### Lower-confidence candidate set
These types exist in the local type catalogue, but the current repo does not prove that they belong in the same powered node-drilldown set. They should be kept as explicit open questions rather than silently dropped.

| Display name | Type ID | Type/category | Size variant | Macro map? | Node drilldown? | Online/offline relevant? | Source/evidence | Confidence |
|---|---:|---|---|---|---|---|---|---|
| Field Refinery | 87161 | Core / field industry | Field | No | Maybe later | Unknown - not in current powered list | itemTypes + builder docs only | Medium |
| Field Printer | 87162 | Core / field industry | Field | No | Maybe later | Unknown - not in current powered list | itemTypes + builder docs only | Medium |
| Field Storage | 87566 | Core / field storage | Field | No | Maybe later | Unknown - not in current powered list | itemTypes + builder docs only | Medium |
| Shelter | 88093 | Hangar | Standard | No | Maybe later | Unknown - node connectivity not yet verified | itemTypes + builder docs only | Low-Medium |
| Heavy Shelter | 88094 | Hangar | Heavy | No | Maybe later | Unknown - node connectivity not yet verified | itemTypes + builder docs only | Low-Medium |
| Nest | 91871 | Hangar / shell storage | Special | No | Maybe later | Unknown - node connectivity not yet verified | itemTypes + builder docs only | Low-Medium |

### Catalogue takeaways
- The live app currently exposes only four macro families, but the upstream powered-assembly list already implies a broader node-local type space.
- The macro map should not absorb that broader set.
- The node drilldown should be designed to accommodate the strong set first, while keeping field / hangar candidates explicitly provisional.

## 5. Proposed network-node icon taxonomy
The icon plan should extend the current topology grammar, not replace it. The safest rule is:
- silhouette = family
- interior mark = subtype where needed
- external badge = size variant only when truly useful
- overlay = status, selection, warning, or transient event

| Structure family | Base icon metaphor | Shape treatment | Size variant treatment | Status treatment | Interaction treatment | Complexity | Notes |
|---|---|---|---|---|---|---|---|
| Network Node | Power core / sovereign hub | Keep current hexagon + center core dot unchanged across macro and drilldown views | No M/H badges | Node health drives stroke; low-fuel warning uses amber pip; selected state uses sparse orange halo only | Selected node stays visually anchored at center; hover is a slight stroke lift only | Low | Reuse existing macro glyph exactly |
| Gate family | Aperture / corridor mouth | Keep current ring with side apertures; do not invent a new gate silhouette | `M` and `H` external badges; standard gate has no badge | Stroke follows online / defense / offline; link styling carries most corridor state | Hover / selection should brighten the ring and its linked corridor together | Low | Macro map continues using family-collapsed gate shape |
| Storage / Trade Post / SSU family | Secured container / commerce bay | Keep square with inner square; optional subtle top seam only in larger-detail contexts | `M` and `H` badges; standard has no badge | Teal when online, red when offline, green only for transient revenue or settlement confirmation | Selection opens commerce / power inspector; avoid persistent green | Low | Macro label remains Trade Post even if drilldown shows storage variants |
| Turret family | Threat projection / firing arc | Keep triangle family; Smart Turret uses an interior slot mark rather than a new silhouette | `M` and `H` badges for size families; Smart Turret uses interior mark, not a badge | Amber in defensive posture, teal when online in commercial posture, red when offline | Hover keeps outward-orientation read; selection should not add noisy weapon FX | Low-Medium | Keeps current defense language intact |
| Printer family | Fabrication chamber | Shared industry diamond outline with a single vertical platen mark | `M` and `H` badges; standard printer has no badge | Teal for active/healthy, amber for insufficient power/input risk, red for offline | Selection reveals controls in inspector, not on-icon button stacks | Medium | Strong candidate for the first new non-macro silhouette |
| Refinery family | Processing cell / split basin | Shared industry diamond outline with a lower basin / split-line interior mark | Heavy refinery gets `H`; standard has no badge | Amber warning is especially important for blocked or underpowered state; red offline | Same calm selection pattern as printer family | Medium | Closely related to printer, but distinct interior mark |
| Assembler family | Assembly lattice | Shared industry diamond outline with stacked block / bracket marks | No size badge | Same state overlays as printer / refinery | Same interaction treatment as other industry structures | Medium | One-off family, should stay visually simple |
| Berth family | Dock cradle / shipyard bay | Shared industry diamond outline with a U-shaped cradle or horizontal dock bar | `M` and `H` badges; standard berth has no badge | Teal online, amber constrained, red offline | Selection reveals status and later preset grouping, not ship silhouettes | Medium | Avoid literal ship icons; keep it structural |
| Relay family | Signal relay / mast | Shared industry diamond outline with central mast + two short side ticks | No size badge | Teal online, amber degraded connectivity / power risk, red offline | Selection can emphasize dependency line back to the node | Medium | If runtime truth proves relay is more utility than industry, it could still inherit a hex-derived utility variant later |
| Nursery family | Growth pod / incubation cell | Shared industry diamond outline with nested seed / ring mark | No size badge | Teal online, amber blocked/input risk, red offline | Same calm inspector-first interaction pattern | Medium | Keep the mark abstract, not biological or decorative |
| Provisional field family | Temporary deployable / field tool | Reuse the relevant printer/refinery/storage base glyph; defer a distinct silhouette | Optional `F` badge in inspector or list only, not at dense 24px map scale | Treat as provisional until powered-node truth is confirmed | Same selection behavior as the closest confirmed family | Medium | Do not lock this into the macro map or the first drilldown slice |
| Provisional hangar family | Shelter / hangar / nest | Reuse a square-derived housing placeholder or text label in early catalogues | Heavy Shelter may use `H` later if confirmed | Treat as neutral / provisional until node relationship and power semantics are proven | Same inspector-first interaction if later admitted | Low for placeholder, high for final icon | Defer final silhouette until connectivity truth is validated |

## 6. Size variant rules
### Mini
- Use `M` only for families that clearly ship in a mini / standard / heavy ladder.
- Eligible first-wave families: gates, storage / trade posts, turrets, printers, berths.
- The `M` badge lives outside the occupied 20x20 glyph area, preferably at the north-east corner.
- At tiny aggregate scales or collapsed stacks, drop the badge and rely on label / inspector text instead.

### Standard
- Standard variants carry no badge.
- The absence of a badge should mean standard/default size, not unknown size.
- Standard should remain the cleanest silhouette in every family.

### Heavy
- Use `H` as the only heavy-size badge.
- Keep badge style consistent across families: small outlined square or capsule, not a filled pill.
- Heavy should never require a second silhouette if the family silhouette is already stable.

### Badge placement and conflict rules
- Default badge corner: north-east.
- If the north-east corner already hosts a warning pip, revenue badge, or selected-state treatment, move the size badge to north-west rather than stacking overlays.
- Badges should sit just outside the base outline, not inside the silhouette.

### When badges should not be used
- Do not badge network nodes.
- Do not badge one-off special variants such as Smart Turret, Relay, Assembler, or Nursery; use interior marks or inspector labels instead.
- Do not badge 10px aggregate / mini glyphs.
- Do not badge collapsed stack summaries.
- Do not let size badges outrank status overlays or selection.

## 7. Network-node drilldown UX concept
### Entry from the macro map
Long-term entry should be a direct click on the network-node hexagon from the strategic map. That click should not create a new top-level page or tab set; it should simply focus the current strategic surface on a node-local command layer.

For the first implementation slice, the safer entry is the existing `/nodes/:id` route from the node list or existing detail links. That preserves current strategic-map behavior while the node-local layout proves itself.

### Exit / back behavior
- One quiet `Back to Network` action in the drilldown header
- `Esc` as a secondary convenience only
- no breadcrumb stack, modal shell, or tab strip

### Selected node framing
- the selected node remains the visual anchor at the center of the drilldown
- keep the current node silhouette and status color
- add a restrained orange selected halo or outline only while focused
- dim unrelated context instead of recoloring everything

### Connected structure arrangement
Use the current radial grammar as the starting point, then expand it carefully:
- keep the node in the center
- gates should occupy partner-facing slots first
- storage / trade and relay should live on calmer lateral or lower slots close to the node
- defense structures should remain outward-facing and sit on the outer ring
- industry families can occupy the remaining ring positions, then a second ring only when count forces it
- when a family count becomes dense, collapse by family count instead of spraying icons into noise

The important point is continuity: the drilldown should feel like a deliberate zoom into the current topology language, not a new graph style.

### Automatic vs drag layout
- automatic layout first
- later optional drag override inside the drilldown only
- do not start with user-drag as the primary interaction

### Layout persistence model
- if drag layout is later added, save it locally first
- scope it per node and per browser profile
- treat server-backed sync as a later, optional improvement only if cross-device value proves real
- do not put layout persistence on chain

### Structure action affordances
Keep icon surfaces calm:
- icon = identity + state
- selection = reveals compact inspector/action strip
- inspector/header = where power actions live
- no always-visible per-icon button stacks

### Online/offline action location
Per-structure online/offline belongs in the selected-structure inspector or header action row, not permanently on every glyph.

Important first-slice restriction:
- do not implement network-node offline from the drilldown first
- current node-offline flow is technically possible but uses a hot-potato pattern that requires connected-assembly handling and should stay out of the first slice

### Preset affordances
Named posture presets belong later as a compact `Directive Presets` utility inside the node inspector, not as new map chrome.

Good examples:
- `Industry Mode`
- `Defense / AFK`
- `Transit Window`

The UI should stage presets this way:
1. first prove the drilldown and icon language
2. then prove per-structure selection and action clarity
3. only then add preset draft/save/apply behavior

### What remains hidden or secondary
Keep these out of the first implementation slice:
- raw chain / backend diagnostics
- tab-heavy navigation
- tooltip-heavy inline explanations
- drag handles everywhere
- live flow animation
- node-offline orchestration
- server-backed preset sync

## 8. Data requirements
### What current direct-chain discovery already provides
Current direct-chain discovery already gives the future drilldown enough for a narrow first slice:
- structure object ID
- owner-cap ID
- current four-family structure type
- node linkage for current known child structures
- linked-gate relationships
- node fuel state
- extension authorization state
- power status used by current control actions

That is enough for a render-only drilldown using today's known families.

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

Useful implications for a future node drilldown:
- `assemblyType`, `typeId`, and `typeName` can help with future icon-family labeling
- `status` is useful contextual metadata, but not type authority
- `solarSystemId` is useful for display context, not drilldown membership
- `energySourceId` is potentially useful for future node-relationship enrichment, but should not replace direct-chain node-link authority

### What the endpoint can and cannot tell us
The current shared-backend endpoint can:
- enrich already-known assemblies
- supply better names and some type-ish metadata
- provide optional freshness / status context

It cannot:
- discover owners or structures on behalf of the browser
- decide who is allowed to act
- drive writes, sponsorship, or posture authority
- fully describe a node-local topology for the broader industry set

### What is missing for broader network-node relationships
For the strong set beyond the current four live families, the product still lacks a proven browser-safe relationship surface for:
- explicit connected-assembly membership per network node
- a stable structure-family taxonomy for all broader industry types
- a node-local summary of powered / degraded / disconnected assemblies
- enough proof to decide whether field or hangar candidates belong in the same drilldown universe

### What can be done without backend changes
The following can be implemented without any new backend or indexer work:
- icon catalogue and family taxonomy
- render-only node-local drilldown shell on the existing node detail route
- static or current-known-structure layout from existing `NetworkNodeGroup` data
- placeholder support for future families in the catalogue layer only

### What may need future backend / indexer support
If the future product wants a complete node-local view for the broader type set, a later additive backend contract may be useful for:
- explicit `connectedAssemblies[]` or equivalent node-summary data
- stable structure-family labels for broader assemblies
- browser-safe node-level summaries keyed from already-known direct-chain objects
- freshness metadata that helps operators without replacing chain truth

Any such backend support should remain additive and should start only after direct-chain discovery has already identified the relevant player-owned structures.

### Fallback behavior that must remain
- direct-chain discovery remains authoritative
- shared-backend enrichment remains optional and fail-open
- missing or partial enrichment must leave the drilldown usable with direct-chain data only
- no write-path or action decision may depend on enrichment availability

## 9. Implementation phases
### Phase 0 - Icon and type catalogue only
- Scope: lock the node-drilldown type catalogue, icon-family taxonomy, size rules, and overlay rules
- Files likely touched: `docs/operations/network-node-posture-icon-and-drilldown-plan-20260429.md`, later `docs/ux/svg-topology-layer-spec.md`, `assets/icons/README.md` if the catalogue becomes canonical
- Validation: `git diff --check`
- Manual preview checklist: docs review only
- Rollback notes: trivial docs rollback
- What not to do yet: no runtime code, no routes, no SVG component files, no tx changes

### Phase 1 - Render-only node-local drilldown shell
- Scope: extend the existing `/nodes/:id` surface into a render-only node-local posture layout using current `NetworkNodeGroup` data and the new icon catalogue
- Files likely touched: `src/screens/NetworkNodeDetailScreen.tsx`, a new drilldown presentation component under `src/components/`, `src/components/topology/Glyphs.tsx`, possibly a small catalogue/type helper
- Validation: `npm run typecheck`, `npm run build`
- Manual preview checklist: open an existing node detail, verify centered node + attached current children, verify strategic map is unchanged, verify existing node online control still behaves the same
- Rollback notes: low risk because it can stay route-local
- What not to do yet: no map click entry, no new backend calls, no write-path changes, no presets

### Phase 2 - Connected-structure discovery / hydration
- Scope: extend read-path discovery so the drilldown can hydrate richer connected structures beyond the current four live families
- Files likely touched: `src/lib/suiReader.ts`, `src/hooks/useAssetDiscovery.ts`, `src/types/domain.ts`, optional new read-model helpers
- Validation: `npm run typecheck`, `npm run build`, targeted read-path smoke against known nodes, fail-open check with enrichment unavailable
- Manual preview checklist: compare attached-structure counts against current discovery, confirm missing enrichment does not blank the screen
- Rollback notes: medium-low because it changes read-model shape
- What not to do yet: no write flows, no owner discovery via backend, no strategic-map family explosion

### Phase 3 - Per-structure online/offline from drilldown
- Scope: expose existing per-structure power actions from the drilldown for currently supported families only
- Files likely touched: `src/screens/NetworkNodeDetailScreen.tsx`, `src/hooks/useStructurePower.ts`, `src/lib/structurePowerTx.ts`, possibly a small drilldown action strip component
- Validation: `npm run typecheck`, `npm run build`, wallet smoke on one gate, one turret, and one trade post from the drilldown
- Manual preview checklist: action feedback banner still works, state refresh still comes from existing discovery invalidation, strategic map remains unchanged
- Rollback notes: medium because this is the first write-path-adjacent phase
- What not to do yet: no network-node offline flow, no broader industry writes, no preset authoring

### Phase 4 - Draftable named presets
- Scope: add node-scoped preset drafting and preview behavior without persistence yet
- Files likely touched: `src/screens/NetworkNodeDetailScreen.tsx`, a preset model/type file, `src/components/PostureControl.tsx` and `src/components/PolicyPresetEditor.tsx` as pattern references
- Validation: `npm run typecheck`, `npm run build`
- Manual preview checklist: create a preset name, preview its impact on the current node selection, confirm refresh intentionally drops the draft in this phase
- Rollback notes: low because this phase stays local to UI state
- What not to do yet: no localStorage persistence, no server sync, no new Move objects, no claim that presets are on-chain truth

### Phase 5 - Saved presets and local layout persistence
- Scope: persist presets and optional drag-layout state in browser storage, scoped per node
- Files likely touched: drilldown persistence helpers, likely modeled on existing local persistence utilities such as `src/lib/spatialPins.ts` and related hooks
- Validation: `npm run typecheck`, `npm run build`, local storage corruption / recovery smoke
- Manual preview checklist: save, reload, rename, delete, and recover from bad local data without breaking discovery
- Rollback notes: medium-low because persistence bugs can be isolated locally
- What not to do yet: no server-backed sync, no on-chain persistence, no wallet-shared preset model

### Phase 6 - Richer backend/indexer enrichment only if justified
- Scope: add additive node-summary or live-update enrichment only if phases 2-5 reveal a real read-path gap
- Files likely touched: shared-backend client / merge layers, optional new docs contract, optional new node-summary hook
- Validation: `npm run typecheck`, `npm run build`, browser-origin positive-path validation, fail-open tests with the backend disabled
- Manual preview checklist: compare direct-chain-only behavior vs enriched behavior, verify no browser auth headers, verify direct-chain fallback remains fully usable
- Rollback notes: medium because this changes the additive read path
- What not to do yet: no backend ownership discovery, no write authority from backend, no sponsor or package-ID changes

## 10. First implementation slice recommendation
The recommended first actual implementation prompt after this plan is:

> Add a render-only network-node drilldown shell on the existing `/nodes/:id` route, backed only by current `NetworkNodeGroup` data and a static icon catalogue for current and future structure families. Do not change strategic-map behavior, do not add map click navigation yet, do not add new backend calls, and do not add any write-path changes.

Why this is the right first slice:
- it proves the icon catalogue in a real UI without disturbing the macro map
- it reuses an existing route and existing node-detail authority model
- it creates a visible place for future richer structure hydration
- it avoids the highest-risk surfaces: discovery changes, sponsor changes, node-offline orchestration, and preset persistence

If an even narrower prompt is required, the fallback first slice is icon-catalogue plumbing only. But the preferred first slice is the render-only `/nodes/:id` drilldown shell because it is still narrow while producing a concrete operator-facing artifact.

## 11. Risks and open questions
- **Incomplete type catalogue risk.** The strong set is well evidenced, but the current live app still discovers only four families. The broader industry set needs future runtime confirmation before it becomes anything more than a catalogue and icon plan.
- **Indexer / source-truth uncertainty.** Shared-backend summaries can help label structures, but they do not yet prove node-local topology for the broader set.
- **UI density / noise risk.** A node-local drilldown can become unreadable if every future structure gets equal visual weight. Family hierarchy and collapse rules are mandatory.
- **Online/offline write safety.** Per-structure drilldown actions should reuse existing power flows first. Network-node offline remains specifically risky because of the connected-assembly hot-potato flow.
- **Preset persistence model.** Browser-local persistence is the safest first answer, but it raises wallet / device scope questions later.
- **Drag layout persistence model.** A drag override is useful only if operators trust the automatic layout first. Local per-node persistence is safer than any shared or on-chain model.
- **Player usability concerns.** Operators should be able to read the drilldown at a glance. If the first render-only prototype already feels like a dense admin screen, the icon taxonomy has failed.
- **Smart Turret and provisional families.** Smart Turret is likely best treated as a defense subvariant, not a wholly new silhouette. Field / hangar candidates remain open questions until better runtime evidence exists.

## 12. Sources inspected
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

### Not required for this planning slice
- no EF-Map repo checkout reads were required
- no public EF-Map API probing was required
- no VPS or indexer queries were required
- no secrets were accessed or printed