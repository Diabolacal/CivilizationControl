# CivilizationControl — Spatial Embed Requirements

**Retention:** Carry-forward

> Derived from: EF-Map embed guide (https://ef-map.com/embed-guide, fetched 2026-02-19), CivilizationControl UX architecture spec, demo beat sheet, hackathon emotional objective, voice & narrative guide, structural risk sweep, claim proof matrix, hackathon judging criteria.
> Last updated: 2026-02-19
> **Decision status: RESOLVED** — Hybrid Spatial Architecture formally adopted 2026-02-19. See [decision log](../decision-log.md).

---

## Executive Summary

**DECISION: Hybrid Spatial Architecture adopted.**

CivilizationControl uses two complementary spatial layers:

1. **Strategic Network Map** (CivControl-native SVG) — the primary operational surface. Displays governance topology, encodes online/offline/warning state, emits visual feedback for denial/toll/trade events, is clickable for drill-down navigation, and is expandable to occupy primary screen space. Reactive to state changes via standard React state propagation.

2. **Cosmic Context Map** (EF-Map embed iframe) — the secondary orientational layer. Highlights operator systems in the EVE Frontier starfield. Draws colored link lines between linked systems (EF-Map capability being added). Read-only, reload-based updates, collapsible. Provides universe grounding without operational interactivity.

The EF-Map embed cannot draw custom markers, differentiate structures by status, overlay governance labels, animate events, or receive runtime state updates. These are category-level limitations, not feature gaps. The embed shows *where things are*; CivilizationControl needs to show *what governance is doing*. The hybrid model assigns each tool to its natural strength.

### Why alternatives were rejected

- **Embed-only (Option A):** 0 of 12 required visual primitives supported. No extension API, no postMessage, no custom markers. Category mismatch.
- **Native-only (Option B):** Achieves all operational requirements but loses the EVE Frontier cosmic grounding that connects the governance view to the game universe. Judges need to see "this is EVE Frontier."
- **Full EF-Map integration:** No runtime API exists. Forking introduces maintenance burden. The embed's domain (astronomical viewer) is architecturally wrong for governance topology.

---

## Section 1 — Narrative Requirements

### What the spatial layer must communicate emotionally

The demo's narrative spine is **Control → Consequence → Revenue**. The spatial layer must reinforce each phase:

| Demo Phase | Emotional Signal | Spatial Requirement |
|---|---|---|
| **Control** (Beat 3) | "I set the rules on my gate" | The gate's location in the network is visible; its policy state is encoded visually |
| **Consequence — Denied** (Beat 4) | "The hostile was blocked" | A denial event is spatially anchored — the viewer sees *where* it happened |
| **Consequence — Tolled** (Beat 5) | "The ally paid to pass" | Revenue flows *from* a specific gate; directionality matters |
| **Commerce** (Beat 6) | "Trade happened at my post" | The TradePost is visible as a distinct node in the operator's territory |
| **Revenue** (Beat 7) | "Both streams visible" | The full network — gates + posts + nodes — is visible as a unified system under governance |

**Primary emotional function:** The spatial layer transforms a list of structures into a *territory*. Without it, the operator manages objects. With it, the operator governs a frontier. This is the difference between a SaaS panel and a command post.

**Three-Second Check alignment (Hackathon Emotional Objective §5):**
- "What am I governing?" → Policies visible on nodes
- "What is under my authority?" → All structures in one spatial view
- "What is producing value?" → Revenue-encoding on nodes/links
- "What is at risk?" → Offline/low-fuel structures encoded by color
- "What am I building?" → Network topology itself communicates construction

**Judging criteria alignment:**
- **Visual Presentation & Demo** — a spatial view with live state is the single highest-impact visual differentiator; without it, the demo is a table of rows
- **EVE Frontier Relevance & Vibe** — EVE players think spatially; a governance layer without spatial context feels disembodied
- **Creativity & Originality** — no existing hackathon entry has shown a governance topology view; this is the novelty moment
- **UX & Usability** — spatial context completes the Command Overview's 5-pillar pass

---

## Section 2 — Operational Requirements

### What the embed must enable from a management standpoint

| Requirement | Priority | Rationale |
|---|---|---|
| Show all operator-owned structures in one view | **P0** | Command Overview's core promise — "your infrastructure at a glance" |
| Encode online/offline status per structure | **P0** | Answers "What is at risk?" in the 3-Second Check |
| Show gate-to-gate link topology | **P0** | Links represent the network; unlinked gates are operationally incomplete |
| Distinguish structure types (Gate vs TradePost vs NWN) | **P0** | Operator must parse their network without reading labels |
| Show which gates have active policies | **P1** | Answers "What am I governing?" — governance is the product |
| Navigate to structure detail on click/tap | **P1** | List-first but spatial-augmented — clicking a node should open its detail view |
| Show fuel/energy warnings spatially | **P2** | Attention Required items gain spatial context — "which gates are at risk and where" |
| Show revenue per structure or per link | **P2** | "What is producing value?" gains spatial weight |
| Update on state changes without full reload | **P2** | Signal Feed events should optionally ripple into the spatial view |

**Non-requirement:** The spatial layer is NOT the primary navigation surface. Per UX Architecture Spec §9 and §13, it is togglable, supplementary, and optional. All operations are accessible from the list view. The spatial layer adds context, not function.

---

## Section 3 — Visual Encoding Requirements

### Concrete visual primitives required

| Primitive | Description | Priority | EF-Map Embed Support |
|---|---|---|---|
| **Structure nodes** | Distinct visual markers for gates, trade posts, and network nodes at system-level positions | P0 | **NO** — embed shows stars, not custom markers |
| **Node color by status** | Green (online), amber (warning/low fuel), red (offline), gray (unconfigured) | P0 | **NO** — embed uses only cyan accent rings, one theme color for all |
| **Link lines (gate pairs)** | Lines connecting linked gate pairs | P0 | **NO** — embed draws no lines between systems |
| **Link line color by state** | Green (both online), amber (one impaired), red (one offline), dashed (unlinked) | P1 | **NO** |
| **Structure type icons** | Gate icon, TradePost icon, NWN icon — visible at the node position | P0 | **NO** — no custom icon support |
| **Policy badge on gates** | Small indicator that a gate has active governance rules | P1 | **NO** |
| **Revenue glow or sizing** | Nodes producing more revenue appear brighter or larger | P2 | **NO** |
| **Event pulse animation** | Brief flash/pulse on a node when a signal event occurs (jump, denial, trade) | P2 | **NO** |
| **Directional traffic indicator** | Arrow or flow animation on link lines showing jump direction | P3 | **NO** |
| **Policy boundary shading** | Area shading around governed systems | P3 | **NO** |
| **Label overlays** | Structure name and/or revenue displayed near node | P1 | **NO** — embed shows only system names from the star database |
| **Attention badge** | Warning icon on structures in the "Attention Required" list | P2 | **NO** |

**Summary: 0 of 12 required primitives are supported by the EF-Map embed.**

The embed provides exactly one visual primitive relevant to CivilizationControl: highlighting specific solar systems with cyan accent rings. This confirms the mismatch is categorical.

---

## Section 4 — Interaction Requirements

### Should the embed support runtime interaction?

| Capability | Required? | Justification |
|---|---|---|
| **Reload on state change** | Minimal — acceptable for MVP | If the spatial view is a static snapshot refreshed on page load, that is sufficient for demo recording. Not ideal for live use. |
| **Live updates via postMessage** | Ideal but not required for hackathon | The Command Overview already polls RPC every 10s for Signal Feed updates. Propagating state changes to the spatial layer via internal React state (not postMessage) is the correct architecture for a CivControl-native component. |
| **Read-only** | Yes for EF-Map embed; No for native | The EF-Map embed is inherently read-only (iframe, no API). A CivControl-native diagram can and should respond to clicks. |
| **Click-through to detail** | Yes (P1) | Clicking a gate node should navigate to `/gates/:id`. This is impossible with the EF-Map embed (cross-origin iframe). |
| **Bidirectional communication** | Not required | The EF-Map embed exposes no postMessage API. A CivControl-native component lives in the same React tree — no message passing needed. |

**Key finding:** Every interaction requirement beyond "look at a star map" is impossible with the EF-Map embed. The embed is a visual reference, not an operational surface.

---

## Section 5 — Minimum Viable Embed (Hackathon-Safe)

### Smallest set of extensions needed to win

**The winning spatial layer is NOT an extension of EF-Map. It is a CivControl-native component.**

#### MVP Spatial Component (~150-200 LoC, 2-3 hours)

A simple SVG or HTML Canvas topology diagram rendered inside the Command Overview:

| Feature | Implementation | Time |
|---|---|---|
| **Nodes for each structure** | SVG circles/icons positioned from manual spatial pins (localStorage, per UX spec §8) | 30 min |
| **Node color by status** | Green/amber/red fill from on-chain structure state (already fetched for list view) | 15 min |
| **Structure type differentiation** | Different shapes or icons: hexagon (gate), square (trade post), triangle (NWN) | 15 min |
| **Link lines between gate pairs** | SVG `<line>` elements from linked_gate_id, color by both-online state | 30 min |
| **Click-to-navigate** | onClick → router.push(`/gates/${id}`) | 15 min |
| **Labels** | Structure name (user-assigned) rendered near node | 15 min |
| **Policy indicators** | Small badge/dot on gates with active extensions | 15 min |

**Total: ~2.5 hours for a complete, operational, governance-communicating spatial view.**

#### Supplementary: EF-Map iframe for spatial context

Add one tasteful EF-Map embed below or beside the topology diagram:
```html
<iframe
  src="https://ef-map.com/embed?systems={commaSeparatedSystemIds}&fit=1&performance=1"
  width="100%" height="300px" loading="lazy" frameborder="0">
</iframe>
```
Purpose: Show operators where their structures sit in the EVE Frontier universe. Provides cosmic context ("this is real") without competing with the governance topology view.

**Cost: 5 minutes.** System IDs come from the manual spatial pins already in localStorage.

#### What this combination achieves for judging

| Criterion | Signal |
|---|---|
| **Visual Presentation & Demo** | Two spatial views: one governance (custom), one cosmic (EF-Map) — visually rich |
| **EVE Frontier Relevance & Vibe** | The EF-Map starfield grounds the project in the game universe |
| **UX & Usability** | The custom topology is operable; the EF-Map embed is orientational |
| **Creativity & Originality** | No hackathon entry will have a dual spatial layer |
| **Concept Implementation** | Demonstrates spatial thinking without over-engineering |

---

## Section 6 — Ideal Premium Embed (Stretch)

### If unconstrained by time, what is the ideal CivControl spatial layer?

#### Tier 1: Enhanced Topology (additional ~4 hours)

| Feature | Description |
|---|---|
| **Animated link flow** | Moving dots along link lines indicating recent jump traffic direction |
| **Revenue sizing** | Node radius proportional to 24h revenue (logarithmic scale) |
| **Event pulse** | Brief radial pulse animation on event — red for denial, green for toll/trade, blue for status change |
| **Fuel gauge arc** | Small arc indicator around NWN nodes showing fuel percentage |
| **Policy summary tooltip** | Hover on gate node → popup showing "Tribe 7 + 5 Lux toll" |
| **Drag-to-reposition** | Operator can drag nodes to rearrange the topology layout |

#### Tier 2: Spatial Intelligence (additional ~8 hours)

| Feature | Description |
|---|---|
| **Territory boundary** | Convex hull or Voronoi shading around the operator's governed systems |
| **Traffic heatmap** | Link line thickness proportional to jump count |
| **Revenue flow visualization** | Animated particles flowing from structures toward a "treasury" indicator |
| **Multi-operator view** | If ally structures discoverable, show allied network in muted color |
| **Time-lapse mode** | Replay last 24h of events as animated sequence over the topology |

#### Tier 3: Game-Integrated (additional ~20 hours, post-hackathon)

| Feature | Description |
|---|---|
| **Real coordinates from API** | Replace manual pins with actual system positions from a CCP coordinate API |
| **Live event subscription** | WebSocket/subscription for real-time structure state changes |
| **3D starfield integration** | Replace SVG topology with a simplified 3D view using Three.js, zoomed to operator's territory |
| **In-game overlay** | If Metadata.url dApp embedding becomes documented, spatial view as SSU dApp |

**Hackathon scope: Tier 1 is the stretch target. Tier 2+ is post-submission.**

---

## Section 7 — Architectural Recommendation

### Decision: **Option C — Hybrid Model**

Build a CivControl-native SVG topology diagram as the operational spatial layer. Use EF-Map embed as supplementary cosmic context.

#### Options evaluated

| Option | Description | Verdict |
|---|---|---|
| **A) Extend EF-Map embed** | Fork or request feature additions to the EF-Map embed | **REJECTED** — EF-Map is a third-party starfield renderer. It has no extension API, no postMessage interface, no custom marker support. Forking introduces a maintenance burden and dependency. The embed's category (astronomical viewer) is wrong for the need (governance topology). |
| **B) Build CivControl-native lightweight map** | SVG/Canvas topology diagram, fully owned, no EF-Map dependency | **VIABLE** — achieves all P0-P1 requirements, fully controllable, minimal code. Loses the cosmic "EVE Frontier" spatial context. |
| **C) Hybrid: CivControl topology + EF-Map context** | Native SVG topology for operations + EF-Map iframe for cosmic grounding | **RECOMMENDED** — best of both. Topology provides governance visualization (links, status, policies). EF-Map provides EVE Frontier vibe (starfield, real systems). Cost: native component + 5 min iframe. |

#### Rationale

**Timeline:** 10 working days until March 11 hackathon start. Extension code, UI shell, and demo preparation consume 90%+ of that. Spatial layer budget: 3-4 hours maximum. The hybrid model fits comfortably.

**Risk:** Zero dependency on EF-Map roadmap. If ef-map.com goes down, the CivControl topology still works. The iframe is a visual bonus, not a functional dependency. No fork, no API dependency, no coordination with EF-Map maintainer.

**Narrative clarity:** The topology diagram answers all five pillars of the emotional check. The EF-Map embed answers one question the topology cannot: "where in the universe is this?" Together they produce a spatial experience no other hackathon entry will have.

**Implementation cost:**
- CivControl topology: ~150-200 LoC React component, 2-3 hours
- EF-Map iframe: ~10 LoC, 5 minutes
- Data source: manual spatial pins (already designed in UX spec §8) + on-chain structure state (already fetched for list views)
- No new data fetching, no new APIs, no new dependencies

**Hackathon optics:** The dual spatial layer — one abstract/operational, one cosmic/orientational — communicates design sophistication. It shows the builder understands that governance visualization and spatial orientation are different needs requiring different tools. Judges will see a custom diagram (proves engineering capability) alongside a game-universe starfield (proves EVE Frontier integration).

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Overview                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Metric Row: Revenue (2×) | Structures | Status | Pol  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐  ┌───────────────────────────────┐ │
│  │  CivControl Topology │  │  Recent Signals               │ │
│  │  (SVG, ~200 LoC)     │  │  (consequence-differentiated) │ │
│  │                       │  │                               │ │
│  │  [Gate]───[Gate]      │  │  14:32 Alpha Gate TRANSIT ... │ │
│  │    │                  │  │  14:28 Main Hub TRADE ...     │ │
│  │  [NWN]   [TradePost]  │  │  14:15 Beta Gate STATUS ...   │ │
│  │                       │  │                               │ │
│  │  Click → detail view  │  │                               │ │
│  └──────────────────────┘  └───────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  EF-Map Embed (iframe, performance mode, fit=1)        │  │
│  │  Cosmic context — operator's systems in the starfield  │  │
│  │  "Open on EF Map →"                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Attention Required (compact, collapsible)              │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
localStorage spatial pins ─┐
                            ├──→ CivControl Topology (SVG)
On-chain structure state ───┘         │
  (already fetched for lists)         ├── node positions from pins
                                      ├── node colors from status
                                      ├── link lines from linked_gate_id
                                      ├── type icons from object type
                                      └── click handlers to router

localStorage spatial pins ──→ system IDs ──→ EF-Map iframe URL
                                             ?systems={ids}&fit=1&performance=1
```

### EF-Map Embed Parameters (Recommended Configuration)

| Parameter | Value | Rationale |
|---|---|---|
| `systems` | Comma-separated IDs from spatial pins | Highlights all operator systems |
| `fit` | `1` | Auto-zoom to show all highlighted systems |
| `performance` | `1` | Reduce GPU usage; embed is secondary to topology |
| `orbit` | `0` (omit) | Static view; orbit would distract from operational content |
| `color` | `red` or omit (default) | CivilizationControl's accent palette; or default for neutrality |
| `details` | `0` (omit) | Skip 80MB download; spectral colors are not governance-relevant |

---

## Appendix A — EF-Map Embed Capability Inventory (2026-02-19)

### Supported Parameters

| Parameter | Type | Description |
|---|---|---|
| `system` | Required | Numeric system ID for primary highlight |
| `zoom` | Optional | Camera distance: 10 (tight) to 10000 (ultra wide), default 5000 |
| `orbit` | Optional | `1` = cinematic auto-rotation at ~0.2 rad/s |
| `color` | Optional | Theme: blue, green, purple, red, yellow, white, random (requires orbit=1) |
| `systems` | Optional | Comma-separated IDs for multi-system cyan accent ring highlights |
| `performance` | Optional | `1` = disable bloom, aurora, haze, glow |
| `details` | Optional | `1` = load ~80MB spectral star database |
| `fit` | Optional | `1` = auto-zoom to fit all highlighted systems (1.25× padding) |
| `q` | Optional | Pre-fill search bar |
| `from`/`to` | Optional | Pre-fill routing panel (both required) |
| `share` | Optional | Load a shared route by short ID |

### Supported Visual Capabilities

- 3D WebGL starfield with zoom/pan/rotate (~5MB base load)
- Single system highlight marker
- Multi-system cyan accent rings (10-20 systems recommended)
- Color theme application (7 presets + random)
- Cinematic orbit animation
- Spectral star colors (with extended DB)
- "Open on EF Map" escape hatch link

### Explicit Limitations (Confirmed)

- **No custom markers** — cannot add icons, shapes, or custom visuals to systems
- **No inter-system lines** — cannot draw connections/links between systems
- **No per-system color differentiation** — all highlights use same cyan accent ring
- **No label overlays** — no custom text on or near systems
- **No postMessage API** — no runtime communication with the embed
- **No event subscription** — no way to trigger visual changes from external state
- **No click event propagation** — clicks within the iframe do not propagate to the parent
- **No custom data layer** — the embed renders only star map data, not user-supplied topology
- **No animation triggers** — cannot trigger pulses, flashes, or transitions externally
- **Read-only** — the embed is a viewer; it cannot be controlled after load (except via URL params)
- **Color themes require orbit mode** — `color` parameter only works when `orbit=1`
- **Single accent style** — multi-system highlights all use identical cyan rings (no differentiation)

---

## Appendix B — Demo Video Spatial Strategy

### How the spatial layers serve each demo beat

| Beat | CivControl Topology Role | EF-Map Embed Role |
|---|---|---|
| **Beat 2 (Reveal)** | Topology visible in Command Overview — structures with status dots, links drawn | EF-Map visible below — starfield grounds the view in the game universe |
| **Beat 3 (Policy)** | Gate node pulses or highlights when policy is deployed (stretch) | Not visible (camera is on Gate Detail) |
| **Beat 4 (Denied)** | Red flash on gate node when denial event arrives in Signal Feed (stretch) | Not visible |
| **Beat 5 (Tolled)** | Green flash on gate node when toll collected (stretch) | Not visible |
| **Beat 6 (Trade)** | TradePost node highlights (stretch) | Not visible |
| **Beat 7 (System)** | Full topology visible — all nodes green, links drawn, revenue-scale sizing (stretch) | Visible — "this is where it all happens in the EVE Frontier universe" |

**MVP (no animation):** Topology is a static-but-colored diagram showing the operator's network. Sufficient for Beat 2 and Beat 7. The visual "wow" comes from the EF-Map starfield framing.

**Stretch (with event pulses):** Topology becomes a live governance monitor during Beats 4-5. Red pulse = denied. Green pulse = revenue. This is the differentiated moment that no other hackathon entry will have.

---

## Scope Discipline

| Constraint | Rule |
|---|---|
| **No CivControl map rendering work before March 11** | SVG topology component implementation begins during the hackathon build window (March 11+). Pre-hackathon work is planning and architecture only. |
| **EF-Map modifications are external and pre-hackathon permissible** | The EF-Map embed is a third-party tool. Any feature additions to EF-Map (e.g., colored link lines) are made by the EF-Map maintainer on their own timeline. Requesting or contributing features to an external project is not hackathon code development. |
| **SVG representation approach to be finalized during build phase** | Three representation options are identified below (§Strategic Network Map — Representation Options). Final choice depends on build-phase iteration, not pre-hackathon lock-in. |
| **EF-Map iframe is non-blocking** | If ef-map.com is unavailable, the CivControl topology still functions. The iframe is a visual bonus, not a functional dependency. |

---

## Strategic Network Map — Representation Options

> **Status: To be finalized during build phase (post-March 11).** These are non-binding design explorations. The chosen approach will be determined by implementation iteration during the hackathon window.

### Option A: System-Level Nodes with Structure Count Badges

Each solar system the operator has structures in renders as a single node. Badge overlays show structure counts and aggregate status.

- **Node:** One circle per system, positioned from manual spatial pin coordinates
- **Badge:** "2G 1T 1N" (2 gates, 1 trade post, 1 NWN) — compact count overlay
- **Status encoding:** Node border color reflects worst-case status (red if any structure offline, amber if any warning, green if all healthy)
- **Links:** Lines between system nodes where any gate pair is linked
- **Pros:** Simplest rendering; works at any network scale; one node per system avoids clutter
- **Cons:** No per-structure visibility without expanding/clicking; governance detail hidden behind badge

### Option B: Expandable Per-System Cluster View

Each system node can expand to reveal individual structures within that system.

- **Collapsed:** Same as Option A — system node with badge
- **Expanded:** Click to reveal individual structure nodes arranged in a small cluster around the system center
- **Per-structure encoding:** Type icon (hexagon/square/triangle), status color, policy indicator
- **Links:** Gate-to-gate lines resolve to specific gate nodes when both systems are expanded
- **Pros:** Progressive disclosure — overview at a glance, detail on demand. Matches §13 "progressive disclosure" principle.
- **Cons:** More complex rendering; cluster layout logic needed; may feel heavy for 2-3 structures

### Option C: Lens-Based Toggling (Gates / Trade / Nodes)

A single topology view with filter lenses that highlight different structure types.

- **Default:** All structures visible, differentiated by icon/shape
- **Lens toggle:** "Gates" highlights gate nodes and link lines, dims others. "Trade" highlights trade posts and trade flow indicators. "Nodes" highlights NWNs and fuel status.
- **Pros:** Dense information with selective focus; enables demo narration ("switch to the governance lens" → gates light up with policies)
- **Cons:** Requires toggle UI; may be over-engineered for hackathon demo with 5-7 structures; adds interaction complexity

### Recommendation Notes

For hackathon MVP (~5-7 structures total), **Option A is likely sufficient** — the structure count is small enough that per-system badges communicate everything needed. Option B adds demo polish if time permits. Option C is a stretch concept better suited for production scale.

Final choice is deferred to build phase. All three options share the same data source (manual spatial pins + on-chain structure state) and the same React component boundary.

---

## Cross-References

- [UX Architecture Spec §9 — Spatial Layer Model](../ux/civilizationcontrol-ux-architecture-spec.md)
- [UX Architecture Spec §8 — Manual Pinning Model](../ux/civilizationcontrol-ux-architecture-spec.md)
- [Demo Beat Sheet](../core/civilizationcontrol-demo-beat-sheet.md)
- [Hackathon Emotional Objective](../strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md)
- [Voice & Narrative Guide](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md)
- [Claim → Proof Matrix](../core/civilizationcontrol-claim-proof-matrix.md)
- [Structural Risk Sweep](structural-risk-sweep-2026-02-18.md)
- [EF-Map Embed Guide](https://ef-map.com/embed-guide)
- [Decision Log — Hybrid Spatial Architecture](../decision-log.md)
