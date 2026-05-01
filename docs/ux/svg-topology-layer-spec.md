# CivilizationControl — SVG Topology Layer Design Specification

**Retention:** Carry-forward

> Canonical design specification for the Strategic Network Map symbol grammar, state system, color doctrine, motion protocol, and layout rules.
> Sources: UX Architecture Spec §9, Spatial Embed Requirements, Demo Beat Sheet v2, Product Vision, Voice & Narrative Guide, Hackathon Emotional Objective.
> Validated against: ISA-101 HMI design principles, IEC 60073 color coding, MIL-STD-2525D/APP-6(D) symbology, EEMUA 191 alarm management, High Performance HMI (Hollifield/Habibi), Gestalt perceptual principles.
> Last updated: 2026-05-01 (rev 5 — node-level catalogue extension)

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Symbol Grammar](#2-symbol-grammar)
3. [State System](#3-state-system)
4. [Color Semantics Doctrine](#4-color-semantics-doctrine)
5. [Motion Doctrine & Demo Timing](#5-motion-doctrine--demo-timing)
6. [Layout & Stacking Rules](#6-layout--stacking-rules)
   - 6.8 [Intra-System Multi-Cluster Rules](#68-intra-system-multi-cluster-rules-multiple-network-nodes-per-solar-system)
   - 6.9 [Solar System Boundary Behavior](#69-solar-system-boundary-behavior)
   - 6.10 [Gate Link Routing Rules](#610-gate-link-routing-rules)
   - 6.11 [Link Scaling Doctrine](#611-link-scaling-doctrine)
   - 6.12 [Demo Mode Layout Constraints](#612-demo-mode-layout-constraints)
   - 6.13 [Topology Is Diagrammatic, Not Astronomical](#613-topology-is-diagrammatic-not-astronomical)
   - 6.14 [Semantic Zoom & Solar System Aggregation](#614-semantic-zoom--solar-system-aggregation)
7. [Export & Naming Conventions](#7-export--naming-conventions)
8. [Why This Is Not Arbitrary](#8-why-this-is-not-arbitrary)
9. [Do Not List](#9-do-not-list)
10. [Demo Beat Alignment Matrix](#10-demo-beat-alignment-matrix)
11. [Accessibility](#11-accessibility)
12. [Changelog](#12-changelog)
13. [References](#13-references)

---

## 1. Purpose & Scope

The Strategic Network Map is a **governance topology schematic** — not a star map, not a game HUD, not a spatial simulator. It renders an operator's owned infrastructure as a network graph where:

- **Nodes** represent structures (Network Nodes, Gates, Trade Posts)
- **Edges** represent gate links (passage corridors between linked gate pairs)
- **State overlays** encode runtime condition (online, offline, armed, Revenue event, etc.)
- **Layout** is operator-curated (manual spatial pins), not coordinate-derived

> **2026-03-10 update:** `LocationRegistry` now stores plain-text coordinates on-chain for revealed structures. Layout can potentially be auto-derived from on-chain data instead of requiring manual pins. Manual pins remain as fallback/override.

This spec defines the complete visual language for this schematic. All implementation must conform to this document. Where this spec and the UX Architecture Spec §9 overlap, this document is canonical for visual language; the UX spec remains canonical for interaction patterns and screen hierarchy.

### Design Thesis

Authority comes from **coherence and restraint**, not visual complexity. The schematic must read as a control surface — something an operator monitors and acts on — not a decoration. Every visual element must either (a) encode a discrete piece of governance state or (b) provide structural context for the network topology. Elements that do neither are excluded.

### Relationship to Other Spatial Layers

| Layer | Role | This Spec Covers |
|---|---|---|
| **Strategic Network Map** (SVG) | Primary operational governance topology | **YES** — all visual language defined here |
| **Cosmic Context Map** (EF-Map embed) | Secondary orientational grounding in EVE Frontier universe | **NO** — governed by EF-Map embed parameters; see [Spatial Embed Requirements](../architecture/spatial-embed-requirements.md) |

---

## 2. Symbol Grammar

### 2.1 Base Grid

All glyphs are designed on a **24×24 unit grid**. Stroke-based (outline), not filled. The 24-unit grid scales cleanly to display sizes: 24px (compact list), 32px (standard), 48px (detail/hover), 64px (hero/expanded).

Glyphs occupy the **center 20×20 units** of the grid, leaving 2 units of padding on each side for state overlays (halos, badges, pips).

### 2.2 Structure Glyphs

| Structure | Shape | Geometry (24×24 grid) | Semantic Rationale |
|---|---|---|---|
| **Network Node** | Hexagon outline + center core dot | Regular hexagon, vertices at 12 o'clock, inscribed in 18×18 area centered in grid. Core dot: 3-unit diameter, centered | Engineered anchor. Hexagons connote infrastructure hubs (cell networks, crystalline lattice, honeycomb routing). Six-fold symmetry implies structural stability + regularity. The core dot distinguishes from empty hexagon and gives the glyph a "reactor" or "power source" read. |
| **Gate** | Ring with aperture notch | Circle, 16-unit diameter, 2-unit stroke, centered. Two symmetric 15° notches at 3 o'clock and 9 o'clock positions (indicating passage axis) | Portal / passage point. The ring reads as a cross-section of a tunnel or wormhole. The aperture notches (small gaps in the stroke at the horizontal axis) shift the semantics from "generic node" to "passage" without adding complexity. At 24px the notches are subtle but perceptible; at 48px+ they become clearly directional. |
| **Turret** | Equilateral triangle (pointing outward) | Equilateral triangle, 16-unit side length, centered. Default orientation: apex pointing up (12 o'clock). When attached to a Network Node, apex rotates to point outward (radially away from the node center) | Directional defense / weapon projection. Triangles are universally associated with warning, directivity, and threat vectors. Outward orientation relative to the parent node communicates "defending this position." This mirrors NATO APP-6(D) where triangles in the icon set represent directional projection (air defense dome, artillery). |
| **Trade Post (SSU)** | Square outline with inner square | Outer square: 16×16 units, 2-unit stroke, centered. Inner square: 8×8 units, 1-unit stroke, centered (concentric) | Container / storage / commerce. Squares are the universal glyph for buildings, warehouses, and logistics nodes in network and SCADA diagrams. The inner square (box-in-box) adds the "inventory" semantic — something is stored inside. Visually distinct from all other glyphs at any size. |

### 2.3 Shape Distinctness Analysis

These four shapes were selected for **maximum perceptual separation** at small sizes, following Gestalt principles of similarity and prägnanz (simplicity):

| Pair | Distinguishing Feature | Min Legible Size |
|---|---|---|
| Hexagon vs. Circle (Gate ring) | Hexagon has 6 visible vertices breaking the circular silhouette; Gate ring has aperture gaps | 16px |
| Triangle vs. all others | Unique pointed silhouette; only glyph with a single apex | 12px |
| Square vs. Hexagon | 4 corners vs. 6 with wider profile; fundamentally different silhouette | 16px |
| Square vs. Circle | Corners vs. smooth curve; maximally different basic topology | 12px |

At 24px (minimum operational size), all four shapes are unambiguously distinguishable by silhouette alone, even without color. This passes the **monochrome legibility test** — a requirement derived from MIL-STD-2525D, which mandates that symbology remain interpretable on monochrome displays.

### 2.4 Glyph Rendering Rules

- **Stroke only.** Base glyphs are outlines. No fills on the glyph area itself in the neutral state. (State fills are applied as overlays — see §3.)
- **Neutral stroke color:** `--glyph-neutral` (muted mid-gray, e.g., `hsl(210, 8%, 55%)`). Not white (too bright), not dark gray (disappears on dark backgrounds).
- **Stroke width:** 2 units at the 24-unit grid scale. At rendering size, this equals ~2px at 24px display, ~2.67px at 32px, etc. Minimum rendered stroke: 1.5px.
- **No gradients.** No fills inside glyphs. No drop shadows on glyphs. No glow on glyphs in neutral state.
- **Corner radius:** 0 (sharp corners) for Square and Triangle. Hexagon vertices are sharp. Gate ring is smooth (circle).
- **Pixel alignment:** All coordinates snap to half-pixel boundaries at the target render size to prevent anti-aliasing blur.

### 2.5 Link Lines

Links connect **Gate-to-Gate pairs** (linked gates) and **Structure-to-NetworkNode** (anchor relationships).

| Link Type | Line Style (neutral) | Semantic |
|---|---|---|
| **Gate pair link** | Solid line, 2px, `--link-neutral` color | Active passage corridor between two linked gates |
| **Structure-to-Node anchor** | Dotted line, 1px, `--link-subdued` color | Structural dependency (gate/turret/SSU anchored to a network node) |

- Link lines connect center-to-center of the respective glyphs.
- Link lines route behind (z-order below) all glyphs and state overlays.
- No arrowheads on links in neutral state. Directional indicators are a P3 stretch feature (see [Spatial Embed Requirements §3](../architecture/spatial-embed-requirements.md)).

### 2.6 Node-Level Catalogue Extension

The macro strategic map remains limited to the canonical four macro families defined above: Network Node, Gate, Turret, and Trade Post. The node-level catalogue added on 2026-05-01 extends the visual language for a static reference route and future node-local drilldown work without changing the macro map geometry.

Node-level extension rules:

- All node-level glyphs use the same `24 x 24` grid and keep the occupied body inside the centered `20 x 20` zone so badges, pips, and halos remain compatible.
- Base glyphs remain stroke-only or mostly stroke-only. The extension does not introduce filled body silhouettes, gradients, or decorative glow states.
- Size badges `M` and `H` remain React-layer overlays anchored to the north-east corner. Warning/status pips may use other corners, but they do not move the size badge from the north-east default.
- Printer = industry diamond with one vertical interior line.
- Refinery = industry diamond with one horizontal interior line.
- Assembler = industry diamond with a composite / interlocking interior mark.
- Shelter / Heavy Shelter = circular shell with one upper opening line; `H` is the only size badge used in that family.
- Nursery and Nest remain provisional arch / cradle families. Nursery uses one lower support line; Nest uses a double lower cradle line.
- Amber remains reserved for warning, defense, or degraded examples. Neutral catalogue samples should default to gray unless the reference surface is intentionally demonstrating state grammar.
- Macro glyph geometry remains unchanged. The catalogue is an extension of the topology doctrine, not a replacement for the macro symbol set.

---

## 3. State System

### 3.1 Principle: State as Overlay, Not Mutation

The base glyph geometry **never changes** based on runtime state. State is communicated through a layered overlay system applied on top of the neutral glyph. This follows the High Performance HMI principle: **gray infrastructure, colored exceptions**. The operator's eye is drawn to deviations from neutral, not to a saturated baseline.

This is the same compositional pattern used in MIL-STD-2525D: the frame shape encodes *type* (battle dimension, affiliation), while fill color, modifiers, and text fields encode *state and context*. Changing state never changes the frame shape.

### 3.2 Overlay Channels

Six orthogonal visual channels are available for state encoding. An element may use multiple channels simultaneously (e.g., amber stroke + warning badge):

| Channel | Mechanism | Z-Order | Used For |
|---|---|---|---|
| **Stroke color override** | Glyph outline color changes from `--glyph-neutral` to a semantic color | Same as glyph | Primary state indicator (online, offline, armed, etc.) |
| **Outer halo** | Soft radial gradient or blurred ring, 4–6 units beyond glyph boundary | Behind glyph | Emphasis: Defense Mode (amber halo on turrets), selected state |
| **Badge** | Small (8×8 unit) labeled element, positioned at glyph corner (NE default) | Above glyph | Counts ("+3"), warnings ("!"), denied ("✕"), revenue ("$") |
| **Link line color/style** | Line color shifts from `--link-neutral` to semantic color; style may change (dashed) | Behind glyphs | Corridor state (healthy, degraded, Defense Mode restricted) |
| **Pulse animation** | Brief (200–400ms) radial expansion + fade from glyph center | Above halo, behind badge | Event notification: toll collected, hostile denied, trade settled |
| **Status pip** | 4-unit filled circle, positioned at glyph's 5 o'clock (bottom-right) | Above glyph, behind badge | Persistent micro-status: fuel level (green/amber/red fill) |

### 3.3 State Definitions

#### Structure-Level States

| State | Applies To | Stroke Override | Halo | Badge | Pip | Desc |
|---|---|---|---|---|---|---|
| **Neutral / Idle** | All | `--glyph-neutral` (default) | None | None | None | Base state. Structure exists, no active condition. |
| **Online / Healthy** | NWN, Gate, SSU | `--state-online` (muted teal) | None | None | None | Structure is online and operating normally. This is a *persistent* state, not an event. Uses muted teal rather than bright green to avoid visual noise — a healthy network should look calm, not agitated. |
| **Offline** | All | `--state-offline` (red) | None | None | None | Structure is offline or unreachable. Red stroke is reserved for conditions requiring operator attention. |
| **Fuel Low / Degraded** | NWN | `--state-warning` (amber) | None | `!` badge | Amber pip | NetworkNode fuel below threshold. Amber communicates "caution/action needed" without the urgency of red. |
| **Defense Mode Armed** | Turret | `--state-armed` (amber) | Amber halo | None (or turret count badge if collapsed) | None | Turret is online and in Defense Mode posture. Amber halo extends the turret's visual footprint to communicate "active defense perimeter." |
| **Defense Mode Restricted** | Gate | `--state-restricted` (amber) | None | Tribe badge (optional) | None | Gate is in tribe-only restriction. Amber stroke communicates "access controlled / restricted." |
| **Unlinked** | Gate | `--glyph-neutral` | None | "—" badge (muted) | None | Gate is not linked to a partner. Not an alarm — just a topological fact. |
| **Unconfigured** | Gate, SSU | `--glyph-neutral` | None | "○" badge (muted) | None | No extension authorized. Structure is "raw." |

#### Event States (Transient)

| Event | Applies To | Pulse Color | Badge Flash | Duration | Desc |
|---|---|---|---|---|---|
| **Denied** | Gate | `--event-denied` (red) | "✕" badge, red, 2s hold | 300ms pulse + 2s badge hold | Hostile blocked. Red pulse anchors the denial to a specific gate. |
| **Toll Collected** | Gate | `--event-revenue` (green) | "$" or "+N" badge, green, 1.5s hold | 200ms pulse + 1.5s badge hold | Revenue confirmation. Green pulse = economic value generated. |
| **Trade Settled** | SSU (TradePost) | `--event-revenue` (green) | "$" badge, green, 1.5s hold | 200ms pulse + 1.5s badge hold | Commerce confirmed. Same green pulse as toll — economic events share a visual class. |
| **Posture Changed** | All (cascade) | `--event-posture` (amber) | (handled by state transition, not badge) | 400–600ms cascade (see §5) | Infrastructure-wide posture shift. Not a single-element event — it's a propagating state transition. |

#### Link-Level States

| State | Line Color | Line Style | Desc |
|---|---|---|---|
| **Healthy** | `--link-healthy` (muted teal) | Solid, 2px | Both gates online, extension matched |
| **Degraded** | `--link-degraded` (amber) | Solid, 2px | One gate impaired (fuel low, offline, extension mismatch) |
| **Offline** | `--link-offline` (red) | Dashed, 2px | One or both gates offline — corridor non-functional |
| **Defense Mode** | `--link-defense` (amber) | Solid, 3px | Corridor under tribe-only restriction (Defense Mode posture) |
| **Unlinked** | `--link-unlinked` (dark gray) | Dotted, 1px | Structural anchor line only (not a live corridor) |

---

## 4. Color Semantics Doctrine

### 4.1 Semantic Palette

Colors are defined by **function**, not aesthetics. Each color token carries a single unambiguous meaning across all elements.

| Token | Semantic | Usage | Conventional Basis |
|---|---|---|---|
| `--glyph-neutral` | Baseline / no condition | Default glyph stroke, inactive elements | ISA-101: gray as the normal process state. "Gray infrastructure" principle — healthy equipment is unremarkable. |
| `--state-online` | Operating normally | Online stroke for NWN, Gate, SSU | Muted teal. Not bright green. Per ISA-101, green should not dominate the normal state — an all-green screen is visual noise. Teal distinguishes "healthy" from "economic event." |
| `--state-offline` | Hard stop / failure | Offline stroke, broken link | Red. IEC 60073: red = danger, immediate operator attention required. ISA-18.2: Priority 1 alarm. |
| `--state-warning` | Caution / degraded | Fuel low, degraded link | Amber/yellow. IEC 60073: yellow = caution, abnormal condition requiring awareness. ISA-18.2: Priority 2/3 alarm. |
| `--state-armed` | Posture: defense active | Turret halo, gate restriction | Amber. Same family as warning — Defense Mode is a deliberate operator action, not an alarm, but it represents "restricted / heightened readiness." Amber unifies all non-emergency deviations from passive operation. |
| `--state-restricted` | Access controlled | Gate in tribe-only mode | Amber. Same token as armed — restriction and defense are the same posture category. |
| `--event-revenue` | Economic confirmation | Toll collected, trade settled (pulse + badge) | Green. Reserved **exclusively** for confirmed economic events. ISA-18.2 inverts here by convention: green is not "normal," it's "value confirmed." This is a deliberate deviation — justified because CivilizationControl is a governance/revenue system, not a process plant. Revenue confirmation is the highest-value operator signal. |
| `--event-denied` | Hostile blocked | Denial event (pulse + badge) | Red. Same color as offline — both are "something went wrong or was stopped." Context (pulse vs. persistent stroke) disambiguates. |
| `--event-posture` | Infrastructure-wide transition | Defense Mode cascade animation | Amber. Matches the defense posture family. The cascade itself is the visual event — individual element transitions use their respective state colors. |
| `--link-neutral` | Passage corridor (idle) | Gate pair links at rest | Low-saturation gray. Links should be structurally visible but not attention-competing. |
| `--link-healthy` | Corridor operational | Both gates online | Muted teal. Matches `--state-online` for consistency. |
| `--link-defense` | Corridor restricted | Defense Mode active on corridor | Amber. Same defense family. |
| `--bg` | Canvas background | SVG background | Dark (`hsl(220, 15%, 8%)` or similar). The topology sits on a dark canvas — light glyphs on dark ground. This is the standard for NOC/SCADA control rooms (reduces eye strain, maximizes contrast for colored overlays). |

### 4.2 Color Hierarchy

When multiple states apply simultaneously, the highest-priority color wins the stroke:

1. **Red** (offline, denied) — highest priority
2. **Amber** (warning, armed, restricted, defense cascade)
3. **Muted teal** (online/healthy)
4. **Gray** (neutral/idle) — lowest priority

This matches ISA-18.2 alarm priority ordering: critical > high > medium > advisory.

### 4.3 Why Green Is Not "Online"

In traditional SCADA/process control, green means "normal / safe / no alarm." If every healthy structure were green, the topology would be a field of green dots — visually noisy and carrying zero information (the same failure mode ISA-101 was designed to prevent).

Instead:
- **Normal operation is gray/muted teal** — unremarkable by design. A calm network looks calm.
- **Green fires only for economic events** — toll collected, trade settled. These are the moments the operator cares about most. Green becomes a *reward signal*, not a baseline.
- **The eye is trained to notice green flashes** precisely because they are rare and meaningful.

This is a conscious deviation from IEC 60073 (where green = safe), justified by the domain: CivilizationControl is not monitoring a plant for safety. It is governing frontier infrastructure for revenue. The "safe state" is baseline gray. The "value state" is green.

### 4.4 Hex Value Guidelines

Exact hex values are implementation decisions, not doctrine. The spec constrains:

- All semantic colors must pass **WCAG AA contrast ratio** (≥4.5:1) against `--bg`.
- Amber and red must be distinguishable under deuteranopia simulation (protanopia and deuteranopia affect red-green, not red-amber).
- Green and teal must be distinguishable under tritanopia simulation.
- Badge text must pass WCAG AA against badge background.

Recommended starting points (to be validated in implementation):

| Token | Suggested HSL | Notes |
|---|---|---|
| `--bg` | `hsl(220, 15%, 8%)` | Near-black with cool undertone |
| `--glyph-neutral` | `hsl(210, 8%, 55%)` | Mid-gray, low saturation |
| `--state-online` | `hsl(175, 45%, 50%)` | Muted teal, not cyan-bright |
| `--state-offline` | `hsl(0, 75%, 55%)` | Saturated red, not pink |
| `--state-warning` | `hsl(38, 90%, 55%)` | Warm amber |
| `--state-armed` | `hsl(38, 90%, 55%)` | Same as warning (shared token) |
| `--event-revenue` | `hsl(145, 65%, 50%)` | Distinct green, not teal |
| `--event-denied` | `hsl(0, 75%, 55%)` | Same as offline (shared token) |
| `--link-neutral` | `hsl(210, 8%, 35%)` | Dark gray, recedes visually |

---

## 5. Motion Doctrine & Demo Timing

### 5.1 Governing Principle

Animation serves **information transfer**, not aesthetics. Every motion must answer a question the operator might ask: "What just changed?" or "What is transitioning?"

No elastic/bouncy easing. No spring physics. No overshoot. All motion uses **ease-out** (deceleration curve) or **linear** timing functions. The visual language is a control surface, not a game UI.

### 5.2 Timing Table

| Motion | Duration | Easing | Trigger | Justification |
|---|---|---|---|---|
| **Hover highlight** | 120ms | ease-out | Pointer enter/leave on any structure glyph | Immediate feedback. Fast enough to feel responsive, slow enough to avoid flicker. |
| **State transition** (single element) | 200–300ms | ease-out | Structure state change (online↔offline, armed↔disarmed) | Perceptible but not sluggish. ISA-101 recommends state changes complete within one visual fixation (~300ms). |
| **Event pulse** (toll, denied, trade) | 200ms expand + 200ms fade | ease-out expand, linear fade | Economic or denial event confirmation | Total 400ms visible. The pulse draws the eye to the source structure, then fades to avoid clutter. |
| **Badge appear** | 150ms | ease-out (scale 0→1) | Event or state triggering a badge | Badges pop in slightly faster than state transitions — they carry urgent contextual data. |
| **Badge hold** | 2.5–3s | n/a (static hold) | Post-appear persistence | Long enough for the viewer to register the badge while attention is split between topology, Signal Feed, and narration. Revenue badges: 2.5s. Denied badges: 3s (denied events are higher-priority and carry proof-moment weight). Previous values (1.5s/2s) were tight for first-time viewers watching a compressed demo video with subtitles. The extended hold remains well within transient-indicator conventions (ISA-101 upper bound ~5s) and does not risk badge pile-up at expected event frequencies (≤1 event per 5s in demo, ≤1 per 2s in production). |
| **Badge dismiss** | 200ms | ease-out (opacity 1→0) | Hold timer expires | Fade out, not snap out. |
| **Defense Mode cascade** | 400–600ms total | ease-out per hop, 80–120ms stagger between elements | Defense Mode posture switch | See §5.3 below. |
| **Link color transition** | 300ms | ease-out | Link state change | Matches single-element state transition timing. |

### 5.3 Defense Mode Cascade Protocol

The Defense Mode posture switch is the **climax visual event** of the demo (Beat 6, 30 seconds). It must communicate "infrastructure-wide state change, one operator action" with visual authority.

**Sequence:**

1. **Posture indicator** changes first (0ms): "Open for Business" → "Defense Mode" label transition in the UI (outside the SVG topology, handled by the shell).
2. **Gate link lines** transition (0–300ms): All gate pair links shift from `--link-healthy` (teal) to `--link-defense` (amber). Staggered by network distance from the "origin" node (the node nearest to the operator's last interaction), 80ms per hop. This creates a **wave propagation** effect — the amber spreads across the network like a signal traveling through corridors. In a multi-Solar-System topology, the wave propagates: **origin cluster → intra-system links → cross-system links → destination cluster** (see §6.12 for demo-specific traversal order).
3. **Turret glyphs** transition (200–500ms): Each turret's stroke shifts to `--state-armed` (amber) and the outer halo appears. Staggered to follow the link wave — a turret transitions 80ms after its parent node's links have transitioned. Animation: stroke color fade (200ms) + halo fade-in (200ms, overlapping).
4. **Gate glyphs** transition (200–500ms): Gate strokes shift to `--state-restricted` (amber), concurrent with turret transitions.
5. **Total cascade duration:** 400–600ms from first visual change to last element settled. The entire network — across all Solar Systems — should be in Defense Mode visual state within 600ms.

**Justification for 400–600ms:**
- Below 400ms: transitions blur together, losing the "wave" readability. The cascade is indistinguishable from a simultaneous snap.
- Above 600ms: feels sluggish for a "one click" action. The demo requires 2 seconds of silence after the click (Beat Sheet v2); the visual must dominate within the first 600ms so the remaining 1.4s is the operator absorbing the result.
- The 80ms per-hop stagger creates 3–5 distinguishable wave frames at typical network sizes (2–4 Solar Systems, 2–8 Network Nodes), which is within the visual system's temporal resolution for group motion (~10Hz = 100ms per frame perception). Cross-system links count as one hop in the stagger calculation — the distance between Solar Systems on the canvas is visual, not temporal.

**Reverse cascade (Defense → Business):** Same wave pattern, reversed colors (amber → teal/neutral). Same timing. Same origin-outward propagation.

### 5.4 Demo Latency Alignment

Per the Demo Beat Sheet's Transaction Latency Protocol:
- End-to-end tx response: ~2–3 seconds (chain finality ~250ms + `waitForTransaction` indexer sync ~2s)
- Narrator stays ~2 seconds ahead of UI
- Post-click silence: 2 seconds

The cascade animation (400–600ms) begins **after the tx response** (~2.3s end-to-end; chain finality is ~250ms, remainder is indexer sync via `waitForTransaction`). The 2 seconds of narrator silence accommodate: tx response wait (~2.3s) + cascade animation (~0.5s) + visual absorption (~1.5s before narration resumes). The cascade must be fully settled before "Gates locked. Turrets online. One transaction." is spoken.

---

## 6. Layout & Stacking Rules

### 6.1 Topology, Not Cartography

The Strategic Network Map renders an **abstract governance topology**. Positions are derived from operator-curated spatial pins (solar system assignments per UX Spec §8), NOT from on-chain coordinates or game-world positions.

- Unpinned structures appear in an "Unplaced" holding area (bottom or side of canvas).
- The topology is a **node-link diagram** (graph), not a map with a coordinate system.
- Operators may rearrange nodes (stretch: drag-to-reposition). Fixed positions assigned from pin data are the MVP default.

### 6.2 Network Node as Anchor

The Network Node is the gravitational center of each cluster. All other structures are positioned relative to their parent Network Node. A Solar System may contain **one or more Network Nodes**, each forming its own cluster (see §6.8).

```
Layout hierarchy:
  Solar System (from spatial pin — e.g., "Jita")
    ├── Network Node A (hexagon, cluster center)
    │    ├── Gate (ring, cluster perimeter)
    │    ├── Turret ×3 (triangle, radial outer ring)
    │    └── Trade Post (square, cluster perimeter)
    └── Network Node B (hexagon, cluster center)
         ├── Gate (ring, cluster perimeter)
         ├── Turret ×3 (triangle, radial outer ring)
         └── Trade Post (square, cluster perimeter)
```

The single-NWN case is a degenerate form of this hierarchy (Solar System with one cluster). All layout rules in §6.3–§6.7 apply per-cluster; §6.8–§6.9 govern how multiple clusters coexist within a Solar System.

### 6.3 Cluster Layout Algorithm

All structures anchored to the same Network Node form a **cluster**. The cluster uses a radial layout:

- **Network Node** occupies the center.
- **Dependent structures** (Gates, Turrets, Trade Posts) are arranged at equal angular intervals on a circle of radius R around the center (R = ~3× the glyph size at current zoom, minimum 48 display units between glyph centers).
- **Ordering:** Gates first (12 o'clock, clockwise), then Trade Posts, then Turrets. This groups passage points together and places defensive elements on the perimeter.

### 6.4 Turret Stacking

Turrets are the most common structure to concentrate at a single node (up to 6 validated per NWN).

| Turret Count | Display Strategy |
|---|---|
| 1–3 | Individual turret glyphs positioned radially, equally spaced, on the outer ring of the cluster (outside the gate/SSU ring). Each apex points outward. |
| 4–6 | First 3 visible as individual glyphs. 4th+ collapsed into a single grouped glyph with a count badge: triangle with "+N" badge (e.g., "+3" for 6 total, since 3 are visible). |
| >6 | Unlikely per current game constraints. If encountered: 3 visible + "+N" badge for remainder. |

**Demo exception:** For the demo, all turrets may be forced to expanded (individual) display regardless of count, to maximize the visual impact of the Defense Mode cascade. This is a display-mode flag, not a layout change.

**Hover/click expansion:** Clicking the "+N" turret badge expands the collapsed group to show all individual turrets in an expanded ring. Click outside to re-collapse.

### 6.5 Gate Pair Link Routing

Links between gate pairs connect two gates that may be in different clusters (different systems). Link lines route as:

- **Same cluster:** Curved arc within the cluster boundary (rarely occurs — linked gates are typically in different systems).
- **Cross-cluster:** Straight line from gate center to gate center, routed behind all clusters (z-order: lowest).
- **Overlap avoidance:** If a link line passes behind a cluster it doesn't belong to, apply a subtle offset curve (quadratic bezier with control point offset perpendicular to the line). This prevents links from visually crossing unrelated nodes.

### 6.6 Multi-Solar-System Layout

When an operator owns structures in multiple Solar Systems:

- Each Solar System is a **layout region** on the canvas, positioned according to a simple force-directed or grid layout (derived from pin data or auto-arranged). Positions prioritize diagrammatic clarity, not astronomical accuracy (see §6.13).
- Solar System labels appear above the system boundary: system name in `--glyph-neutral` color, small caps, 10px equivalent.
- Minimum spacing between Solar System boundary centers: 200 display units (ensures systems don't overlap at standard zoom).
- "User-curated placement" disclosure visible in the canvas footer (per UX Spec §9a).
- Gate pair links between Solar Systems route as cross-system lines (see §6.10 for routing rules).

### 6.7 Z-Order Stack

From bottom (farthest) to top (nearest):

1. Canvas background (`--bg`)
2. Solar System boundary indicators (hover-only, §6.9)
3. Solar System labels (system names)
4. Cross-system link lines (§6.10)
5. Intra-system link lines (§6.10 — above cross-system, below anchors)
6. Intra-cluster anchor lines (dotted, structure-to-NWN)
7. Structure glyphs (all types)
8. State halos (behind their glyph, but above other glyphs')
9. Event pulses
10. Badges
11. Tooltip / hover card (topmost)

### 6.8 Intra-System Multi-Cluster Rules (Multiple Network Nodes per Solar System)

A Solar System may contain multiple Network Nodes. Each Network Node anchors its own cluster (per §6.3). This section defines how multiple clusters coexist within one Solar System.

#### Cluster Placement by Count

| NWN Count | Placement Rule | Geometry |
|---|---|---|
| **N = 1** | Single cluster, centered within the Solar System boundary | Cluster center = Solar System center |
| **N = 2** | Horizontal offset: clusters placed side-by-side at ±30% of the Solar System boundary radius along the horizontal axis | Left cluster center = `(cx − 0.3 × R_sys, cy)`, right = `(cx + 0.3 × R_sys, cy)`. Deterministic: the cluster with the lower Network Node object ID occupies the left position. |
| **N = 3** | Equilateral triangle arrangement within the boundary, apex at 12 o'clock | Centers at 120° intervals on a circle of radius `0.35 × R_sys` centered on the Solar System center. Ordered clockwise by Network Node object ID starting from 12 o'clock. |
| **N = 4+** | Grid arrangement: 2-wide, rows added as needed | Row-major left-to-right, top-to-bottom. Spacing: `0.5 × R_sys` horizontal, `0.5 × R_sys` vertical. Centered within boundary. |

`R_sys` = Solar System boundary radius (see §6.9). `cx, cy` = Solar System center coordinates.

#### Minimum Spacing

- **Between cluster centers within a Solar System:** ≥ `2.5 × R_cluster` where `R_cluster` is the cluster's radial extent (NWN center to outermost turret glyph edge). This prevents turret rings from two clusters from overlapping.
- **Glyph-to-glyph minimum:** 24 display units (1× base glyph size). If cluster radial extent would violate this, the Solar System boundary `R_sys` must grow to accommodate.
- At typical demo scale (2 NWNs, each with 1 Gate + 1 SSU + 3 Turrets), the N=2 horizontal offset provides clear visual separation with no overlap.

#### Visual Grouping

Multiple clusters within the same Solar System are grouped by the Gestalt principle of **common region** — they share a Solar System boundary container (§6.9). This container is the primary cue that these clusters are co-located in the same physical space, even though they are structurally independent.

No explicit connector line is drawn between Network Nodes within the same Solar System. Their spatial proximity inside the shared boundary is sufficient. (An intra-system gate link between clusters is a different element — see §6.10.)

### 6.9 Solar System Boundary Behavior

Each Solar System has an implicit layout boundary that defines the spatial extent of all clusters within it.

#### Boundary Geometry

- **Shape:** Rounded rectangle with large corner radius (`R_corner = 16 display units`), or stadium shape. Not a circle — a rounded rectangle accommodates the N=2 horizontal layout without excessive empty space.
- **Size:** Dynamically computed. `Width = max(2.5 × R_cluster × N_cols + padding, min_width)`. `Height = max(2.5 × R_cluster × N_rows + padding, min_height)`. Minimum: 160 × 120 display units.
- **Rendering:** The boundary is **not rendered as a visible border** by default. It is an invisible layout container. However, two optional rendering modes exist:
  - **Hover mode:** When the operator hovers over any structure within the system, a subtle boundary indicator fades in (`--sys-boundary`, 8% opacity, `--glyph-neutral` stroke, 1px dashed, 200ms fade-in). This reinforces "these structures are in the same Solar System."
  - **Debug mode:** Solid boundary visible at all times (developer/demo-prep tool only).

#### Containment Rules

- All Network Node cluster centers must remain within the Solar System boundary.
- Turret outer ring glyphs may extend up to `R_cluster × 0.1` beyond the boundary edge (hard structures stay inside; radial turrets are allowed slight bleed to avoid cramped layout).
- Badges and halos may extend beyond the boundary (they are overlays, not structural elements).
- The Solar System label (§6.6) positions above the top edge of the boundary, horizontally centered.

### 6.10 Gate Link Routing Rules

This section refines §6.5 with explicit rules for intra-system and cross-system gate links.

#### Classification

Gate links fall into two categories based on whether the linked gates are in the same or different Solar Systems:

| Link Type | Definition | Frequency |
|---|---|---|
| **Cross-system link** | Source and destination gates are in different Solar Systems | Primary case. Represents a jump corridor (~55 LY). |
| **Intra-system link** | Source and destination gates are in the same Solar System (possibly different clusters) | Rare but valid. Short-range corridor within a single system. |

#### Cross-System Link Routing

Cross-system links are the dominant visual element connecting Solar Systems. They represent jump corridors.

- **Path:** Straight line from source gate center to destination gate center, routed behind all Solar System boundaries (z-order: layer 3 per §6.7).
- **Curvature for overlap:** When two or more cross-system links share a similar route (angle between link vectors < 15°), apply symmetric lane offsets: offset each link ±8 display units perpendicular to the midpoint vector. This prevents links from stacking into a single indistinguishable line.
- **Midpoint clearance:** If a cross-system link passes through an intervening Solar System boundary, apply a quadratic Bézier curve with the control point offset perpendicular to the straight-line path. The offset magnitude = `0.3 × distance to boundary center`. This routes the link around the obstacle.
- **Defense Mode visual dominance:** During Defense Mode, cross-system links shift to `--link-defense` (amber, 3px) and visually dominate the canvas. The thickened stroke (3px vs. 2px neutral) ensures the cross-system network structure reads clearly during the cascade.

> **Video compression advisory:** The 1px width delta (2→3px) is a secondary reinforcement — the amber color shift is the primary visual signal. At typical hackathon video bitrates (YouTube 1080p, ~8 Mbps), fine stroke-width changes can be quantized away. Mitigations: (1) record at 1920×1080 or higher, (2) zoom the topology view to at least 1.5× during Defense Mode beats so link strokes render at ≥4.5 effective pixels, (3) export at ≥12 Mbps CBR before transcoding. Do NOT increase the spec width beyond 3px — at 4px, links would dominate glyph outlines (2px), inverting the visual hierarchy and pulling attention from the structures under command.

#### Intra-System Link Routing

Intra-system links connect two gates within the same Solar System (possibly in different clusters).

- **Path:** Curved arc (quadratic Bézier) contained within the Solar System boundary. The curve bows away from the system center to avoid crossing Network Node glyphs.
- **Visual weight:** Thinner than cross-system links (1.5px vs. 2px neutral) and lower saturation (`--link-intra`, a mid-tone between `--link-neutral` and `--link-healthy`). This visually subordinates intra-system connections to cross-system ones.
- **Avoidance:** The arc must maintain ≥12 display units clearance from any turret glyph within the system to prevent visual confusion between radial anchor lines and gate links.
- **Defense Mode:** Intra-system links follow the same state color rules as cross-system links but retain the thinner 1.5px stroke. The distinction in weight helps the operator distinguish local corridors from jump corridors even when both are amber.

#### Link Disambiguation Summary

| Property | Cross-System Link | Intra-System Link |
|---|---|---|
| Stroke width (neutral) | 2px | 1.5px |
| Stroke width (Defense Mode) | 3px | 1.5px |
| Path | Straight line (Bézier if obstructed) | Curved arc within system boundary |
| Z-order | Layer 3 (behind all system boundaries) | Layer 3.5 (above cross-system links, below intra-cluster anchors) |
| Visual role | Primary network structure | Local detail |

### 6.11 Link Scaling Doctrine

The Topology View is a 2D diagrammatic projection of a 3D spatial reality. Distances are not literal.

#### Governing Rules

1. **Jump distance is not rendered to scale.** A gate link representing ~55 light years and a gate link representing ~10 light years are drawn at the same visual length — whatever spacing produces the clearest diagram. Attempting literal scale would make distant systems invisible or adjacent systems overlap.
2. **Solar System internal scale is not literal.** Structures within a Solar System are separated by the layout algorithm (§6.8), not by in-game coordinate distances. The internal scale is governed by legibility requirements (minimum spacing, turret ring clearance).
3. **Visual spacing prioritizes clarity.** Solar Systems are positioned for diagrammatic readability: minimize link crossings, provide even spacing, keep the overall topology compact enough to fit the viewport without scrolling. This follows the same principle used in power-grid one-line diagrams and metro maps — topology over geography.
4. **No distance labels on links.** Links do not display light-year or coordinate distances. The operator cares about connectivity and state, not spatial measurement.
5. **Consistent link length within a diagram.** While absolute scale is not literal, the diagram should maintain roughly proportional spacing — two Solar Systems connected by a single hop should appear at roughly the same distance as any other single-hop pair. Wildly varying link lengths for the same hop count create misleading proximity cues.

### 6.12 Demo Mode Layout Constraints

For the hackathon demo, the topology is pre-arranged with deterministic positions (no force-directed layout, no auto-arrangement). This ensures consistent visuals across demo runs.

#### Demo Topology

The reference demo topology consists of:

```
Solar System Alpha                    Solar System Beta
┌─────────────────────┐              ┌─────────────────────┐
│  NWN-A1     NWN-A2  │              │  NWN-B1     NWN-B2  │
│  ┌───┐      ┌───┐   │   Link 1    │  ┌───┐      ┌───┐   │
│  │ ⬡ │──G1════════════════G3──│ ⬡ │  │  │ ⬡ │      │ ⬡ │  │
│  └───┘      └───┘   │              │  └───┘      └───┘   │
│  T×3  SSU   T×3 SSU │   Link 2    │  T×3  SSU   T×3 SSU │
│        G2════════════════════G4────│                      │
└─────────────────────┘              └─────────────────────┘
```

**Structure inventory:**
- 2 Solar Systems × 2 Network Nodes = 4 Network Nodes
- 4 Gates (G1↔G3 cross-system, G2↔G4 cross-system)
- 4 Trade Posts (1 per NWN)
- Up to 6 Turrets per NWN = 24 turrets maximum (demo likely uses 3 per NWN = 12 total)

**Fixed positions (MVP):**
- Solar System Alpha: canvas left-center. Solar System Beta: canvas right-center.
- Horizontal separation: 300–400 display units between system boundary centers.
- Within each system: N=2 horizontal offset per §6.8.
- Gate links route as horizontal cross-system lines between the two systems.

#### Defense Mode Cascade Traversal Order

For the demo, the cascade wave propagates in this deterministic order:

1. **Origin cluster** (NWN the operator last interacted with — e.g., NWN-A1)
2. **Origin cluster turrets + gate** (80ms stagger per element)
3. **Intra-system sibling cluster** (NWN-A2 — 80ms after origin cluster completes)
4. **Sibling cluster turrets + gate** (80ms stagger)
5. **Cross-system link lines** (80ms after origin system completes)
6. **Destination system clusters** (NWN-B1, NWN-B2 — 80ms stagger, same intra-system order)
7. **Destination turrets + gates** (80ms stagger)

Total hops: ~6–8, total cascade: 480–640ms. Within the 400–600ms target specified in §5.3 (the upper bound stretches slightly for 4-NWN topologies; this is acceptable — the wave remains perceptually continuous).

The traversal reads as: **"One command, rippling from where I stand, across my territory, across the void, into my distant outpost."** This is the "one transaction across the network" visual thesis.

### 6.13 Topology Is Diagrammatic, Not Astronomical

The Strategic Network Map is a **governance control schematic** in the tradition of electrical one-line diagrams, SCADA process schematics, and metro transit maps. It is not an astronomical chart, a star map, or a spatial simulation.

#### What this means concretely

| Property | Astronomical Map | This Topology View |
|---|---|---|
| **Distances** | To scale (or declination-projected) | Diagrammatic — optimized for legibility, not measurement |
| **Positions** | Derived from celestial coordinates | Operator-curated pins or demo-fixed positions |
| **Orientation** | Galactic/ecliptic reference frame | No fixed orientation — layout algorithm arranges for clarity |
| **Background** | Starfield, nebulae, galactic plane | Solid dark canvas (`--bg`). No decorative elements. |
| **Purpose** | Navigation, observation, science | Governance: monitor state, deploy policy, assess posture |

#### Why this matters for the demo

A common failure mode for "space game" tools is drifting toward sci-fi cartography — adding starfields, constellations, distance scales, compass roses, and grid overlays. These elements are aesthetically appealing but informationally empty in a governance context. They compete for visual bandwidth with state overlays and link lines, and they misframe the tool as a navigation aid rather than a command surface.

The demo must pass the **3-Second Check** (per Hackathon Emotional Objective): a judge glancing at the screen for 3 seconds should read "governance infrastructure control" — not "space game map screen." The diagrammatic register — dark background, gray-line topology, colored-exception state overlays — is what produces that read.

This principle is reinforced by every reference standard cited in §8:
- ISA-101 Level 1 displays are process schematics (P&IDs), not plant aerial photos.
- MIL-STD-2525D symbols are placed on tactical overlays and operational graphics, not satellite imagery (unless explicitly composited).
- NUREG-0700 control room displays are mimic diagrams, not reactor cross-sections.

The topology is a mimic diagram of frontier infrastructure. It shows connectivity, state, and policy — not location, distance, or appearance.

### 6.14 Semantic Zoom & Solar System Aggregation

The topology supports two display modes that trade detail for overview. This follows the ISA-101 display hierarchy: Level 1 (overview / area summary) and Level 2 (unit detail). The operator navigates between them to shift from network-wide situational awareness to intra-system operational detail.

#### Display Modes

| Mode | ISA-101 Level | What Is Visible | When Used |
|---|---|---|---|
| **Network View** (aggregated) | Level 1 — Area Overview | Each Solar System rendered as a single **aggregate glyph**. Cross-system gate links shown between aggregate glyphs. No individual structures visible. | Default view. Operator is surveying the entire network. |
| **System View** (expanded) | Level 2 — Unit Detail | One Solar System expanded to show all clusters, structures, and intra-system links per §6.8–§6.10. Other Solar Systems remain aggregated. | Operator has focused on a specific Solar System for policy, inspection, or event investigation. |

#### Solar System Aggregate Glyph

In Network View, each Solar System collapses to a single composite glyph. This glyph must communicate: (a) this is a Solar System containing infrastructure, (b) the worst-case state of anything inside, and (c) a summary of what it contains.

**Shape:** Rounded rectangle outline, 32×24 units on the base grid (wider than tall to accommodate count badges). Corner radius: 4 units. This shape is distinct from all four structure glyphs (hexagon, ring, triangle, square) — it reads as a container, not a structure. The rounded rectangle echoes the Solar System boundary shape (§6.9), reinforcing visual continuity when transitioning between views.

**Stroke rules:** Same as structure glyphs — `--glyph-neutral` baseline, 2-unit stroke width. State overlay follows the same channel rules as §3.2 (stroke color override for highest-priority state, no halo or pulse on the aggregate — those are structure-level signals).

**Interior elements (always visible):**

| Element | Position | Content | Example |
|---|---|---|---|
| **System label** | Centered, upper third | Solar System name, 8px equivalent, `--glyph-neutral` | "Jita" |
| **Structure count row** | Centered, lower third | Miniature glyph icons (10×10) + count, separated by 6-unit gaps | ⬡2  ◎2  ▲6  ▪2 |

The structure count row uses **miniature versions** of the four structure glyphs (hexagon, ring, triangle, square) at 10×10 units, each followed by a count in `--glyph-neutral` text. This provides at-a-glance inventory without requiring expansion. The miniature glyphs reuse the same geometry as the full-size glyphs, scaled down — no new shapes introduced.

**What is NOT shown on the aggregate glyph:**
- Individual structure states (only the roll-up state is shown via stroke color)
- Turret armed/disarmed breakdown
- Extension or policy configuration details
- Fuel levels (these are NWN-level detail, not system-level)

These are intentionally omitted: the aggregate is for situational awareness, not operational detail. The operator expands the system to see structure-level state.

#### State Roll-Up Rule

The aggregate glyph's stroke color reflects the **highest-priority state** among all structures contained in that Solar System, using the same priority hierarchy as §4.2:

1. **Red** (`--state-offline`) — any structure offline or denied event active → aggregate stroke turns red
2. **Amber** (`--state-warning` / `--state-armed`) — any turret armed, gate restricted, or fuel low → aggregate stroke turns amber
3. **Muted teal** (`--state-online`) — all structures online, no warnings → aggregate stroke turns teal
4. **Gray** (`--glyph-neutral`) — no structures reporting state (all idle/unconfigured) → aggregate remains gray

This ensures the operator can scan the Network View and immediately identify which Solar Systems need attention — the same "gray infrastructure, colored exceptions" principle applied at the system level.

**Redundancy (no color-only encoding):** The state roll-up is supplemented by a **status pip** (4-unit filled circle) at the aggregate glyph's 5 o'clock position (same channel as §3.2 structure-level pips). The pip fill matches the roll-up color. Additionally, if the aggregate is in red or amber state, a small badge appears at the NE corner: `"!"` for amber, `"✕"` for red. This satisfies the Do-Not rule §9.9 (no color-only encoding).

#### Cross-System Links in Network View

In Network View, cross-system gate links connect aggregate glyphs (not individual gate glyphs, which are hidden).

- **Single link:** One line from aggregate center to aggregate center, styled per §6.10 cross-system rules (2px, state color).
- **Multiple links between the same pair of Solar Systems:** If N gate pairs connect two systems, render a single line with a **link count badge** at the midpoint: small rounded-rect badge containing the count (e.g., "×2"). This avoids visual clutter from parallel lines.
- **Link count is a secondary cue.** The count badge supplements — but does not replace — the structure count row on the aggregate glyph. An operator should not need to count link lines to know how many gates a system has. The aggregate glyph's structure count row is the canonical inventory.
- **State:** The link uses the highest-priority state among all gate pair links it represents (same roll-up principle as the aggregate glyph).

#### Expansion Trigger

**MVP (click-to-focus):**

1. Operator clicks an aggregate Solar System glyph in Network View.
2. The clicked system expands in-place: the aggregate glyph dissolves (200ms fade-out), and the full cluster layout (per §6.8–§6.9) fades in (200ms fade-in) at the same canvas position. The system boundary becomes the hover-visible rounded rectangle per §6.9.
3. All other Solar Systems remain aggregated. Cross-system links re-route from the expanded system's individual gate glyphs to the neighboring aggregated system glyphs.
4. Clicking the canvas background (outside any system) or pressing Escape collapses the expanded system back to its aggregate glyph (reverse animation: 200ms fade-out clusters, 200ms fade-in aggregate).
5. Clicking a different aggregate system while one is expanded: the currently expanded system collapses (200ms) and the newly clicked system expands (200ms). These transitions may overlap (cross-fade) to avoid a 400ms dead state.

**Optional (zoom threshold — stretch goal):**

If scroll-zoom is implemented, a zoom threshold may serve as an automatic expansion trigger:
- Zoom in past `1.5×` on a Solar System → auto-expand.
- Zoom out past `1.0×` → auto-collapse.
- Click-to-focus remains available at any zoom level as an override.

This is a P2 stretch feature. Click-to-focus alone is sufficient for the hackathon demo.

#### Transition Animation Rules

| Transition | Duration | Easing | Visual |
|---|---|---|---|
| Aggregate → Expanded | 200ms | ease-out | Aggregate glyph opacity 1→0 while cluster elements opacity 0→1. No spatial movement — elements appear at their final layout positions. |
| Expanded → Aggregate | 200ms | ease-out | Reverse of above. |
| Cross-system link re-route | 200ms | ease-out | Link endpoint slides from aggregate glyph center to individual gate position (or reverse). Smooth interpolation, not snap. |

All transitions comply with the motion doctrine (§5): ease-out only, no elastic/bounce, total duration within one visual fixation.

#### Defense Mode Cascade in Network View

If Defense Mode is triggered while the topology is in Network View (all systems aggregated), the cascade still produces a visible wave:

1. Origin system's aggregate glyph stroke transitions to amber (200ms).
2. Cross-system link lines transition to `--link-defense` amber (80ms stagger per link, same as §5.3).
3. Destination system aggregate glyphs transition to amber stroke (200ms each, staggered 80ms after their link arrives).
4. Aggregate status pips and badges update to reflect the rolled-up armed state.

The wave reads at a coarser grain — system-level rather than structure-level — but the "one command, rippling across the network" thesis holds. The operator can then click any system to expand it and inspect the per-structure state.

If the operator has one system expanded when Defense Mode fires, that system shows the full structure-level cascade (§5.3 + §6.12). Other systems show the aggregate-level cascade above.

#### Demo Beat Implications

For the hackathon demo, the likely interaction is:

- **Beat 2 (Power Reveal):** Topology opens in **Network View** — two aggregate Solar Systems connected by cross-system links. Immediate read: "I govern two systems." Narrator speaks, then operator clicks one system to expand into System View, revealing the full cluster layout.
- **Beat 3–5 (Policy, Denial, Revenue):** Topology is in **System View** on the active system where policy is deployed and events occur. Individual gates, turrets, and trade posts are visible for event pulses and badges.
- **Beat 6 (Defense Mode):** Operator is in **System View** on the origin system. Defense Mode click triggers structure-level cascade in the expanded system + aggregate-level cascade on the distant system (amber stroke transition on the far aggregate). This creates a powerful visual: detailed wave locally, distant system summary turning amber in solidarity. The operator may optionally click the far system post-cascade to inspect it.
- **Beat 7–8 (Commerce, Command):** System View or Network View — either works. Network View with two amber aggregates (Defense Mode) reads cleanly for the "full command" closing shot.

---

## 7. Export & Naming Conventions

### 7.1 SVG Export Rules

- All topology glyphs are SVG `<path>`, `<circle>`, `<rect>`, or `<polygon>` elements — no raster images, no embedded fonts in glyph paths.
- Glyphs use CSS custom properties for color tokens (see §4). Theme switching changes custom property values, not SVG structure.
- All glyphs are designed at 24×24 viewBox. Export at: 24, 32, 48, 64 unit sizes.
- Stroke widths scale proportionally with viewBox.
- No embedded CSS animations in exported static SVGs. Animation is handled by the React rendering layer at runtime.

### 7.2 Naming Conventions

| Element | Naming Pattern | Example |
|---|---|---|
| **Structure glyph** | `Icon/<Type>/<Size>` | `Icon/Gate/24`, `Icon/NetworkNode/48` |
| **State variant** | `Icon/<Type>/<State>` | `Icon/Turret/Armed`, `Icon/Gate/Restricted` |
| **Badge** | `Badge/<Type>` | `Badge/Count`, `Badge/Denied`, `Badge/Revenue` |
| **Link** | `Link/<State>` | `Link/Healthy`, `Link/Defense`, `Link/Offline` |
| **Halo** | `Halo/<Type>` | `Halo/Armed`, `Halo/Selected` |
| **Pulse** | `Pulse/<Event>` | `Pulse/Revenue`, `Pulse/Denied` |

### 7.3 React Component Mapping

| SVG Element | React Component | Props |
|---|---|---|
| Structure glyph + overlays | `<StructureNode>` | `type`, `state`, `position`, `onClick` |
| Link line | `<LinkLine>` | `sourceId`, `targetId`, `state`, `linkType` (`cross-system` \| `intra-system`) |
| Badge | `<StatusBadge>` | `type`, `value`, `position` |
| Cluster | `<NodeCluster>` | `networkNodeId`, `children`, `position` |
| Solar System (expanded) | `<SolarSystemRegion>` | `systemId`, `clusters`, `position`, `boundaryVisible` |
| Solar System (aggregated) | `<SolarSystemAggregate>` | `systemId`, `state`, `structureCounts`, `position`, `onClick` |
| Canvas | `<TopologyCanvas>` | `systems`, `links`, `expandedSystemId`, `onNodeClick`, `onSystemClick` |

---

## 8. Why This Is Not Arbitrary

### 8.1 Design Principles Grounding

This symbol grammar and state system are grounded in five convergent principles drawn from three distinct domains (industrial control, military symbology, perceptual psychology):

**Principle 1: Neutral Ground / Colored Figure** (ISA-101, Hollifield/Habibi "High Performance HMI")

The ISA-101 standard for Human-Machine Interfaces mandates that the normal operating state should be visually quiet — gray, muted, unremarkable. Color is reserved for deviations from normal. Bill Hollifield's "High Performance HMI" handbook (widely adopted in petrochemical, power, and water treatment facilities) codifies this as "dark backgrounds, gray piping, color only for abnormal states."

*Application:* Glyphs are gray outlines. Color appears only for state deviations (online teal, offline red, armed amber, revenue green). A healthy network looks calm. An abnormal condition demands attention through color contrast.

**Principle 2: Shape Encodes Type, Color Encodes State** (MIL-STD-2525D / NATO APP-6(D))

NATO's joint military symbology system uses frame shape to encode permanent classification (friendly = rectangle, hostile = diamond, neutral = square, unknown = quatrefoil) and fill color/modifiers to encode transient state (present = solid line, planned = dashed). Changing a unit's status never changes its frame shape.

*Application:* A Gate is always a ring. A Turret is always a triangle. State changes (armed/disarmed, online/offline) modify color overlays, halos, and badges — never the base geometry. An operator learns four shapes once and recognizes structure types instantly regardless of state.

**Principle 3: Redundant Encoding** (MIL-STD-2525D, IEC 60073, WCAG)

Military symbology mandates that shape and color provide redundant information — the system must be interpretable on monochrome displays. IEC 60073 similarly requires that color-coded indicators provide a secondary non-color signal (position, pattern, or label). WCAG accessibility guidelines require that information is not conveyed by color alone.

*Application:* Every state has *both* a color signal and a shape/badge signal. Offline = red stroke + structure type still identifiable. Armed = amber halo + triangle still readable as turret. Denied = red pulse + "✕" badge. Revenue = green pulse + "$" badge. A colorblind operator can still parse every state.

**Principle 4: Alarm Priority Hierarchy** (ISA-18.2, IEC 60073, EEMUA 191)

The ISA-18.2 alarm management standard and EEMUA Publication 191 establish a strict priority→color mapping: critical (red) > high (amber/yellow) > medium (blue) > advisory (white/gray). IEC 60073 establishes the same hierarchy for safety indicators: red (danger) > yellow (caution) > green (safe) > blue (mandatory action).

*Application:* Red > Amber > Teal > Gray in this spec. When states overlap, the highest-priority color wins. Offline (red) overrides armed (amber). Armed (amber) overrides online (teal). The operator always sees the most urgent condition.

**Principle 5: Gestalt Perceptual Grouping** (Wertheimer, Koffka, Köhler)

Gestalt principles of visual perception — proximity, similarity, closure, continuity, and prägnanz (tendency toward simplicity) — govern how humans parse visual scenes. Proximity groups nearby elements. Similarity groups elements with shared visual attributes. Prägnanz preferences simple, regular, symmetric forms over complex ones.

*Application:* Structures cluster around their parent Network Node (proximity = "these belong together"). All gates share ring shape and all turrets share triangle shape (similarity = "these are the same type"). Link lines provide continuity between clusters ("these systems are connected"). Each glyph is a simple geometric primitive (prägnanz = instantly parseable, no ambiguity). The hexagon's 6-fold symmetry makes it the most "prägnant" anchor shape — it reads as the most stable, structural element in any cluster.

### 8.2 What This Is Not

This grammar is not a creative exercise in "cool sci-fi icons." It is a **functional symbology** designed to survive:

1. Small rendering sizes (24px minimum)
2. Dense topologies (20+ structures, 10+ links)
3. Rapid state changes (multiple events per second during demo)
4. Colorblind operators (8% of males have red-green deficiency)
5. Non-expert viewers (hackathon judges watching a 3-minute video)

The shapes were chosen for perceptual distinctness, not aesthetics. The colors were chosen for alarm-priority ordering, not branding. The animations were chosen for information transfer speed, not visual flair.

**Authority comes from coherence** — four shapes, six overlay channels, five colors, one consistent compositional rule (state as overlay, not mutation) — **not from decorative complexity.**

---

## 9. Do Not List

These constraints have the same precedence as the affirmative rules above. Violation of any item is a design regression.

| # | Do Not | Rationale |
|---|---|---|
| 1 | **No starfield / space background textures** | The topology is a schematic, not a view out a cockpit window. Background texture competes with link lines and state overlays. |
| 2 | **No gradients inside glyphs** | Gradients add visual weight and ambiguity. Flat stroke glyphs have consistent legibility at all sizes. |
| 3 | **No HUD-style decorative elements** (scan lines, corner brackets, crosshairs, targeting reticles) | These read as "game UI" rather than "control surface." Judges must see governance, not entertainment. |
| 4 | **No glow/bloom in neutral state** | Glow is reserved for state overlays (halos, pulses). A glowing neutral state desensitizes the operator to deviations. |
| 5 | **No filled/solid glyphs in neutral state** | Fill is a state channel. Filling a neutral glyph removes the ability to use fill as a state signal. |
| 6 | **No inconsistent icon libraries** | All four structure glyphs must share the same visual weight, stroke width, corner treatment, and grid proportions. Mixing an icon-font gate with a hand-drawn turret breaks visual coherence. |
| 7 | **No elastic/spring/bounce animations** | These read as playful, not authoritative. Per ISA-101 and the Voice Guide: measured confidence, no theatrics. |
| 8 | **No animation on neutral-to-neutral** | If nothing changed, nothing moves. Animation without information content is visual noise. |
| 9 | **No color-only state encoding** | Every color state must have a redundant shape, badge, or pattern signal. (See §8.1, Principle 3.) |
| 10 | **No link arrows in MVP** | Directional traffic indicators are a P3 feature (Spatial Embed Requirements). Adding them prematurely clutters the topology at small zoom levels. |
| 11 | **No 3D/perspective rendering** | The topology is a 2D schematic. Perspective effects (vanishing point, foreshortening) add visual complexity without information content and break the schematic register. |
| 12 | **No custom cursor shapes** | Standard browser cursors. The topology is a React component, not a standalone application. |

---

## 10. Demo Beat Alignment Matrix

This matrix verifies that every demo beat's visual requirements are satisfiable by the spec's primitives:

| Beat | Name | Topology Visual Requirement | Spec Primitive | Satisfied |
|---|---|---|---|---|
| 1 | Pain | None (text-on-black) | n/a | ✓ (no topology visible) |
| 2 | Power Reveal | Topology opens in **Network View** (aggregated Solar Systems, cross-system links). Operator clicks to expand one system into **System View** showing full cluster layout. Structures resolved, status online, posture "Open for Business" | Aggregate glyphs (§6.14) with teal stroke (all online) + structure counts. Click-to-expand transition (200ms). Expanded view shows all glyphs per §6.8. Posture label (outside SVG). | ✓ |
| 3 | Policy | Gate highlighted during policy deploy, Signal Feed update | Hover highlight (120ms), post-deploy state transition to "configured" | ✓ |
| 4 | Denial | Red pulse on the gate where hostile was denied, "✕" badge | `Pulse/Denied` (300ms red) + `Badge/Denied` (3s hold) | ✓ |
| 5 | Revenue | Green pulse on the gate where toll collected, "$" badge | `Pulse/Revenue` (200ms green) + `Badge/Revenue` (2.5s hold) | ✓ |
| 6 | Defense Mode | **Mixed-mode cascade:** expanded origin system shows full structure-level cascade (§5.3 + §6.12). Aggregated destination system shows aggregate-level cascade (stroke → amber, §6.14). Cross-system links turn amber. Wave propagation 400–600ms. | Defense Mode cascade protocol (§5.3). Multi-system wave per §6.12. Aggregate cascade per §6.14. | ✓ |
| 7 | Commerce | Green pulse on Trade Post where trade settled | `Pulse/Revenue` on Trade Post glyph + `Badge/Revenue` | ✓ |
| 8 | Command | Full topology visible, all states settled post-Defense Mode, revenue aggregates | Stable topology in Defense Mode state. All amber. Revenue badges cleared (or persistent count badge). | ✓ |
| 9 | Close | Title card overlays topology (or topology fades to black) | Opacity transition on `<TopologyCanvas>` (300ms fade-out) | ✓ |

All five non-negotiable proof moments (Proof Moments 1–5 from Beat Sheet v2) have corresponding visual anchors in the topology:

| Proof Moment | Visual Anchor |
|---|---|
| Policy deploy tx digest | Gate glyph state transition to "configured" |
| Hostile denied — MoveAbort visible | Red pulse + "✕" badge on specific gate |
| Toll collected — balance delta | Green pulse + "$" badge on specific gate |
| Defense Mode — single tx | Full cascade animation across all structures |
| Trade settlement — buyer/seller balances | Green pulse on Trade Post |

---

## 11. Accessibility

### 11.1 Color-Blind Safety

| Deficiency | Affected Pairs | Mitigation |
|---|---|---|
| **Deuteranopia / Protanopia** (red-green, ~8% males) | Red vs. green (offline vs. revenue event) | Badge provides redundant signal: "✕" vs. "$". Pulse location (gate vs. gate) + badge text disambiguate. Red and amber remain distinguishable under deutan simulation. |
| **Tritanopia** (blue-yellow, ~0.003%) | Teal vs. amber could converge | Badge and shape redundancy. Persistent states (stroke color) supplemented by pip or badge. |

### 11.2 Redundancy Matrix

Every state has at least two independent encoding channels:

| State | Channel 1 (Color) | Channel 2 (Shape/Text) |
|---|---|---|
| Online | Teal stroke | (baseline — no badge needed; absence of red/amber is the signal) |
| Offline | Red stroke | Badge: none required (shape unchanged; glyph still identifiable) |
| Fuel low | Amber stroke | `!` badge + amber pip |
| Armed (turret) | Amber stroke | Amber halo (outer ring — distinct geometry) |
| Restricted (gate) | Amber stroke | Tribe badge (optional text) |
| Denied event | Red pulse | "✕" badge |
| Revenue event | Green pulse | "$" or "+N" badge |
| Defense Mode cascade | Amber wave | All individual element transitions + posture label |

### 11.3 Screen Reader / Assistive Technology

The SVG topology is a visual control surface and is not the primary interaction pathway (the list view is). However:

- All structure nodes expose `aria-label` attributes: e.g., `aria-label="Gate North-3, Online, 2 rules active"`.
- The topology container has `role="img"` with an `aria-label` describing the current network state.
- Interactive elements (clickable nodes) have `role="button"` and keyboard focus support (`tabindex`).
- State change events announce via `aria-live="polite"` region: e.g., "Turret Alpha now online. Defense Mode active."

---

## 12. Changelog

| Date | Rev | Change | Sections Affected |
|---|---|---|---|
| 2026-03-03 | 1 | Initial specification: symbol grammar, state system, color/motion doctrine, layout rules, demo alignment, accessibility | All |
| 2026-03-03 | 2 | **Intra-system multi-node topology rules.** Added: multi-NWN-per-Solar-System cluster placement (§6.8), Solar System boundary behavior (§6.9), refined gate link routing with cross-system/intra-system distinction (§6.10), link scaling doctrine (§6.11), demo mode fixed layout for 2-system × 2-NWN topology (§6.12), "Topology Is Diagrammatic" framing (§6.13). Updated: §6.2 hierarchy example for multi-NWN, §6.6 terminology alignment, §5.3 cascade wave cross-system propagation, §7.3 React component mapping. | §5.3, §6.2, §6.6, §6.8–§6.13, §7.3 |
| 2026-03-03 | 3 | **Semantic zoom and Solar System aggregation.** Added: Network View / System View display modes (§6.14), aggregate Solar System glyph (rounded rectangle + counts + state roll-up), expansion trigger (click-to-focus), aggregate-level Defense Mode cascade, demo beat implications for aggregated view. Updated: §7.3 React component mapping (`SolarSystemAggregate`, `expandedSystemId`), §10 Demo Beat Matrix (beats 2 and 6 updated for mixed-mode view). | §6.14, §7.3, §10 |
| 2026-03-03 | 4 | **Demo video resilience pass.** Extended badge hold durations (revenue 1.5s→2.5s, denied 2s→3s) for split-attention viewing conditions. Added video compression advisory to §6.10 cross-system link Defense Mode stroke (keep 3px, document zoom/bitrate mitigations). Updated §10 Demo Beat Alignment Matrix timing references. | §5.2, §6.10, §10 |

---

## 13. References

### Standards & Guidelines

| Reference | Issuing Body | Relevance |
|---|---|---|
| **ISA-101.01-2015** — Human Machine Interfaces for Process Automation Systems | International Society of Automation (ISA) | HMI design principles: gray baseline, color for exceptions, alarm color hierarchy, display hierarchy levels (L1–L4). Foundation for "gray infrastructure, colored deviations" principle. |
| **IEC 60073:2002** — Basic and safety principles for man-machine interface, marking and identification — Coding principles for indicators and actuators | International Electrotechnical Commission (IEC) | International color coding standard for indicators: Red = danger/emergency, Yellow = caution/abnormal, Green = safe/normal, Blue = mandatory action. Foundation for alarm priority color hierarchy. |
| **ISA-18.2-2016** — Management of Alarm Systems for the Process Industries | ISA | Alarm management: priority classification (critical → advisory), rationalization, color mapping by priority. Foundation for color hierarchy (red > amber > teal > gray). |
| **EEMUA Publication 191** (Edition 4, 2024) — Alarm Systems: A Guide to Design, Management and Procurement | Engineering Equipment and Materials Users Association | Industry benchmark for alarm system design. Complements ISA-18.2 with practical design guidance, including color usage, alarm prevalence targets, and HMI layout. Widely adopted in oil/gas, chemical, power generation. |
| **MIL-STD-2525D** — Joint Military Symbology | U.S. Department of Defense | Military map symbology: frame shape = classification (type/affiliation), fill/modifier = state. Foundation for "shape encodes type, color encodes state" principle and monochrome legibility requirement. |
| **NATO APP-6(D)** — NATO Joint Military Symbology | NATO Standardization Office | NATO equivalent of MIL-STD-2525D. Same compositional principles. Confirms the universality of shape-for-type, overlay-for-state across Western allied nations. |

### Design Literature

| Reference | Author(s) | Relevance |
|---|---|---|
| **The High Performance HMI Handbook** | Bill Hollifield, Eddie Habibi | Industry standard text on control room display design. Establishes "gray infrastructure" principle, advocates dark backgrounds, limited color palettes, progressive disclosure, and alarm-driven color. Widely adopted in process industries. ISA-101 was significantly influenced by this work. |
| **Gestalt Principles of Perception** | Max Wertheimer, Kurt Koffka, Wolfgang Köhler | Foundational perceptual psychology: proximity, similarity, closure, continuity, prägnanz. Directly applicable to node-link diagram legibility, cluster grouping, and glyph distinctness. |
| **NUREG-0700 Rev. 3** — Human-System Interface Design Review Guidelines | U.S. Nuclear Regulatory Commission | HMI guidelines for nuclear power plant control rooms. Establishes display hierarchy, alarm priority visualization, operator cognitive load management. Most conservative/rigorous HMI standard in existence — if it works for nuclear, it works for frontier governance. |

### Internal Documents

| Document | Path | Relevance |
|---|---|---|
| Demo Beat Sheet v2 | [docs/archive/hackathon-2026/core/civilizationcontrol-demo-beat-sheet.md](../archive/hackathon-2026/core/civilizationcontrol-demo-beat-sheet.md) | Narrative anchor: 5 proof moments, Defense Mode cascade timing, transaction latency protocol |
| Product Vision | [docs/strategy/civilization-control/civilizationcontrol-product-vision.md](../strategy/civilization-control/civilizationcontrol-product-vision.md) | "Command layer for frontier infrastructure" positioning, posture presets, revenue thesis |
| UX Architecture Spec §9 | [docs/ux/civilizationcontrol-ux-architecture-spec.md](civilizationcontrol-ux-architecture-spec.md) | Strategic Network Map interaction patterns, screen hierarchy, data sources |
| Spatial Embed Requirements | [docs/architecture/spatial-embed-requirements.md](../architecture/spatial-embed-requirements.md) | 12 visual primitive requirements, hybrid architecture decision, EF-Map limitations |
| Voice & Narrative Guide | [docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md) | Label conventions, emotional signal doctrine, Narrative Impact Check |
| Hackathon Emotional Objective | [docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md](../strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md) | 3-Second Check, Five-Pillar Lens, calm authority requirement |

---

*End of specification.*
