# Network Node Drilldown Implementation Plan - 2026-05-01

## 1. Executive summary

Network-node-local drilldown is the next player-useful product slice after the node icon catalogue/reference work landed. The icon catalogue solved the visual grammar problem first: CivilizationControl now has tracked raw SVG glyphs, React catalogue components, and a static reference route at `/dev/node-icon-catalogue` that can anchor the next operator-facing surface.

The next step is not a new standalone app screen. It is a controlled drill-in inside the existing dashboard shell: the left sidebar remains, the hero metric cards remain, the main map footprint remains, and only the center map region plus the lower support surface change context when the operator selects a network node.

This plan defines that node-local interaction model, the first safe implementation branch, later staging for selection sync and local persistence, and the boundaries for eventually exposing write actions and user-named presets. It does not implement runtime code, route changes, strategic-map behavior changes, transaction changes, sponsorship changes, package-ID changes, Move changes, EF-Map changes, VPS changes, deploys, or dependency updates.

## 1.1 Status update - 2026-05-02

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

- the same-dashboard `Node Control` entry and exit, stable topology footprint, accepted lower-panel framing, accepted `Node Key` and tooltip behavior, accepted icon sizing, and the dev-only lab remain in place
- current live limitation: `Node Control` still renders only the current `NetworkNodeGroup` families, so a real wallet-owned node can show only `gates`, `storageUnits`, and `turrets` around the selected `network_node`
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

- `src/lib/suiReader.ts` remains the direct-chain authority for ownership, structure identity, node linkage, OwnerCap discovery, fuel state, and write eligibility.
- `src/hooks/useAssemblySummaryEnrichment.ts` and `src/lib/assemblyEnrichment.ts` remain additive only. Shared-backend summaries are useful for optional display enrichment but must not become authoritative for drilldown membership, action availability, or writes.
- The existing shared-backend contract at `https://ef-map.com/api/civilization-control/assemblies` is request-by-known-ID, browser-safe, and fail-open. That should remain unchanged.
- That existing `assemblies?ids=` route is not sufficient for true node-connected discovery because it cannot query by network node, energy source, owner, character, or wallet.
- Any future backend-discovered node members must stay node-local, read-only, and explicitly non-authoritative until direct-chain ownership or capability can re-prove them.
- Event freshness is a separate contract question: current EF-Map realtime surfaces are global and unfiltered, so the near-term drilldown plan assumes polling or targeted invalidation first.

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

- visibility toggle later
- structure icon
- display name or local label
- structure family or type
- size badge or size text where relevant
- online or offline status where available
- optional relationship note, for example linked gate destination later
- action cell reserved for future safe actions

For the first implementation branch:

- rows should remain read-only
- status display may be read-only text or badge only
- action cells may be omitted, reserved, or visibly disabled
- local label editing should remain deferred
- online or offline controls should remain deferred

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

Hide and unhide is important for later phases, especially for the compact support band, but it should remain deferred out of the first implementation branch.

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

- Phase B render-only drilldown shell plus selection sync: persist nothing; URL state was explicitly deferred from the implemented slice
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

1. render-only node-local shell using current `NetworkNodeGroup` data, including node entry and exit, the lower Attached Structures list, an inspector placeholder, and SVG or list selection sync
2. local hide or unhide and deterministic local layout overrides
3. supported single-structure online or offline actions from inspector or list
4. local preset drafting and save flow, still without execution
5. broader connected-structure discovery for future family coverage
6. future preset execution and richer industry-linked behavior only after the above is proven stable

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

### Phase B - render-only node-local shell plus selection sync

Implementation status on 2026-05-02:

- complete for the render-only shell, shared renderer, lower Attached Structures list, Selection Inspector placeholder, and the dev-only scenario lab
- accepted by human review as the visual and interaction baseline for the next broader-hydration planning pass
- implemented files include `src/lib/nodeDrilldownTypes.ts`, `src/lib/nodeDrilldownModel.ts`, `src/lib/nodeDrilldownLayout.ts`, `src/lib/nodeDrilldownScenarios.ts`, `src/components/topology/node-drilldown/NodeDrilldownSurface.tsx`, `src/components/topology/node-drilldown/NodeDrilldownCanvas.tsx`, `src/components/topology/node-drilldown/NodeStructureListPanel.tsx`, `src/components/topology/node-drilldown/NodeSelectionInspector.tsx`, `src/screens/NodeDrilldownLabScreen.tsx`, `src/screens/Dashboard.tsx`, `src/components/topology/StrategicMapPanel.tsx`, `src/components/topology/NodeCluster.tsx`, and `src/main.tsx`
- live dashboard entry is wired to current live `NetworkNodeGroup` data only; no new read paths or broader live-family hydration were added
- the dev lab is isolated through `src/main.tsx` static bootstrap and performs no wallet, Sui RPC, shared-backend, sponsor, or transaction calls
- explicit `Back to Strategic Network` is implemented; Browser Back and URL mirroring remain deferred for a later pass

- Scope: enter node-local mode from the strategic map, swap the map header to `Node Control`, keep the dashboard shell and hero cards unchanged, render a node-local map and lower structure surface using only current live `NetworkNodeGroup` families, include a read-only `Attached Structures` list, include a basic `Selection Inspector` placeholder, wire icon-to-row and row-to-icon selection sync, and provide an explicit `Back to Strategic Network` action.
- Files likely touched: `src/screens/Dashboard.tsx`, `src/components/topology/StrategicMapPanel.tsx`, a new node-local drilldown surface component, and optionally `src/App.tsx` or `src/screens/NetworkNodeDetailScreen.tsx` for state mirroring or reuse.
- Out of scope: write actions, presets, drag persistence, hide or unhide persistence, broader family discovery, sponsor changes, route overhaul.
- Validation: `npm run typecheck`, `npm run build`, interaction smoke for enter and exit, no regression in macro map camera behavior.
- Manual preview checklist: click a network node, confirm the shell stays intact, confirm the map footprint stays fixed, confirm macro families remain unchanged, confirm the lower list and inspector placeholder appear, confirm icon selection highlights the matching row, confirm row selection highlights the matching icon, and confirm exiting returns telemetry and attention panels.
- Rollback risk: low to medium.

### Phase C - broader node-connected read-model planning and endpoint proof

Implementation status on 2026-05-02:

- completed as a docs-only planning pass on this branch; no runtime code, EF-Map code, endpoint, websocket, write path, sponsor path, package ID, or Move change was made here
- verified that the current `GET /api/civilization-control/assemblies?ids=...` contract is exact-ID enrichment only and cannot discover node members by selected network node, `energySourceId`, owner, character, or wallet
- verified that the current EF-Map realtime surface is a global universe-events stream, not a filtered node-local status or rename contract

- Scope: lock the hybrid authority model for broader node-local hydration, specify the minimum shared-backend node-local summary contract needed for true node-connected discovery, define provenance or freshness fields that the normalized node-local model must preserve, and write the validation checklist before runtime work starts.
- Files likely touched: planning docs in `docs/operations/`, `docs/decision-log.md`, and later contract notes in the EF-Map repo or runbook docs.
- Out of scope: runtime code, backend implementation, browser websocket clients, direct-chain replacement, write actions, sponsor changes, Move changes.
- Validation: `git diff --check`, `npm run typecheck`, `npm run build`.
- Manual preview checklist: none in this planning-only phase.
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

### Phase G - broader family hydration inside Node Control

- Scope: expand the read model beyond the current four-family `NetworkNodeGroup`, widen direct-chain owned-structure discovery where source truth can be proven, optionally merge a new filtered node-local backend summary lane for broader connected structures, and keep shared-backend enrichment additive only.
- Files likely touched: `src/types/domain.ts`, `src/hooks/useAssetDiscovery.ts`, `src/lib/suiReader.ts`, `src/hooks/useAssemblySummaryEnrichment.ts`, `src/lib/assemblyEnrichment.ts`, any new node-local summary client or hook, `src/lib/nodeDrilldownTypes.ts`, `src/lib/nodeDrilldownModel.ts`, and node-local rendering components.
- Out of scope: macro family expansion, new write semantics, sponsor changes, Move changes, EF-Map ownership authority.
- Validation: `npm run typecheck`, `npm run build`, direct-chain fallback smoke, family-membership proof, regression checks for macro map grouping, and backend-partial fallback checks.
- Manual preview checklist: confirm new families appear only inside `Node Control`; confirm chain-backed and backend-observed rows stay distinguishable; confirm backend-observed rows remain non-actionable; confirm macro map remains limited to canonical macro families.
- Rollback risk: medium to high because it changes the read model.

### Phase H - fast-refresh status and name freshness

- Scope: preserve `fetchedAt`, `source`, and per-structure `lastUpdated` in the normalized node-local model, add faster selected-node polling or filtered backend invalidation for status and name changes, and keep status updates in place without unnecessary layout churn.
- Files likely touched: `src/hooks/useAssetDiscovery.ts`, `src/hooks/useAssemblySummaryEnrichment.ts`, any new selected-node freshness hook or client, `src/lib/nodeDrilldownTypes.ts`, `src/lib/nodeDrilldownModel.ts`, and node-local list or inspector components.
- Out of scope: unfiltered global websocket adoption, macro layout changes, write actions.
- Validation: `npm run typecheck`, `npm run build`, selected-node refresh smoke, backend-down fallback smoke, status update without selection loss, and rename update without unrelated layout churn.
- Manual preview checklist: change structure status or name outside CivilizationControl, confirm the selected node updates quickly, confirm stale backend data is presented as metadata only, and confirm the macro map still stays unchanged.
- Rollback risk: medium because freshness work can create confusing UI churn if the authority boundary is blurred.

### Phase I - future industry, schemas, and structure-link expansion

- Scope: future refinery schemas, printer schemas, inter-structure relationship links, and richer node-local industry surfaces.
- Files likely touched: broader node-local UI, future relationship layout helpers, future schema rendering components, and possibly later docs or read helpers.
- Out of scope: early safe drilldown branch.
- Validation: phase-specific typecheck, build, and future product validation depending on the actual industry slice.
- Manual preview checklist: schema-specific later.
- Rollback risk: high because this is the first truly new product layer beyond the current proven structure set.

## 11. Recommended first implementation branch

Status on 2026-05-02: this first implementation branch is now effectively complete on `feat/node-drilldown-render-shell` and is the accepted UI-shell baseline for follow-on read-model work.

The recommended first implementation branch is:

`Render-only node-local shell plus selection sync, with both live dashboard entry and a dev-only node drilldown lab for synthetic layout validation. The first branch should keep the same dashboard shell and map footprint, use current live NetworkNodeGroup data for real node entry and exit, provide a read-only Attached Structures list, provide a basic Selection Inspector placeholder, support icon-to-row and row-to-icon selection sync, provide an explicit Back to Strategic Network action, and include a dev-only /dev/node-drilldown-lab surface or equivalent that reuses the same layout and rendering components with synthetic scenario data. No write actions, no presets, no drag persistence, no hide or unhide persistence, and no broader family hydration yet.`

This is the right first branch because:

- it matches the user's same-dashboard drill-in intent exactly
- it stays within current proven data coverage
- it includes enough lower-surface structure to validate the drilldown usefully instead of shipping an isolated SVG experiment
- it pairs selection with a concrete list and inspector surface immediately, which reduces ambiguity about later action placement
- it gives the implementation a believable dense-layout validation path even when the operator does not own enough real Stillness infrastructure to stress the renderer
- it avoids mixing UI-shell work with transaction risk
- it preserves the macro map and existing sponsor or Move boundaries
- it creates the stable operator surface that later hide, write, and preset work can attach to

### Next recommended implementation slice - 2026-05-02

Recommended option: `Option C`, with `Option D` applied to freshness sequencing.

Recommended next slice:

- expand the direct-chain owned-structure lane first wherever the existing wallet path can prove broader families safely
- specify and land a new filtered EF-Map or shared-backend node-local summary endpoint for broader connected read-only structures keyed by the selected network node or equivalent `energySourceId`
- widen the normalized node-local model so `Node Control` can render both chain-backed owned structures and backend-observed read-only structures without widening macro `Strategic Network`
- keep event-driven freshness out of that first broader-hydration runtime slice; do faster polling or filtered invalidation later once the hybrid membership model is stable

Why this is the right recommendation:

- `Option A` is not enough on its own because direct-chain expansion can widen the owned lane, but the current app and backend evidence do not prove a complete node-connected discovery surface beyond what the wallet path already finds
- `Option B` is not enough on its own because backend discovery without the direct-chain owned lane would blur ownership and write authority
- the existing `assemblies?ids=` route is useful for enrichment but is not sufficient for node-local discovery today
- the current EF-Map websocket is global and unfiltered, so bundling event freshness into the same pass would widen scope before membership, provenance, and ordering rules are stable

Largest safe no-write slice on this branch after the accepted shell work:

- a hybrid read-model pass that broadens direct-chain owned-family hydration where it can be proven, consumes a new filtered backend node-local summary contract for read-only broader connected structures, preserves macro-map simplification, and keeps event-driven freshness for the next follow-up task

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
- back action and Browser Back both return to macro mode predictably
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

### Broader hydration and freshness manual smoke

- connect a wallet that owns at least one network node with non-canonical attached structures
- enter `Node Control` from the macro map and confirm the accepted shell state and scrollbar behavior remain stable
- confirm current direct-chain families still render before or without backend enrichment
- confirm broader families appear only inside `Node Control`, never in macro `Strategic Network`
- confirm backend-observed rows are clearly non-actionable and do not change ownership or future write eligibility
- break or disable backend enrichment and confirm the drilldown fails open to the current direct-chain lane
- change structure status or name outside CivilizationControl and confirm the selected node updates without losing selection or repacking unrelated icons

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