# Strategic Network Map — Implementation Audit & Current State

**Date:** 2026-03-29 (updated — anchor-line visibility, idle heartbeat, warning pips, corridor shortening, link state differentiation, defense cascade wave propagation, posture transition-state UX, network-node warning pip)
**Branch:** `feat/strategic-network-map`
**Purpose:** Source-truth audit of the Strategic Network Map implementation, compared against canonical spec, asset audit, and current visual evidence. Working reference for all future map implementation passes.

**Canonical references:**
- [svg-topology-layer-spec.md](svg-topology-layer-spec.md) — visual language spec (rev 4)
- [svg-asset-audit.md](svg-asset-audit.md) — 19-primitive audit (all PASS)
- [ui-polish-reference-brief.md](ui-polish-reference-brief.md) — demo capture sizing/layout constraints
- [civilizationcontrol-ux-architecture-spec.md](civilizationcontrol-ux-architecture-spec.md) — screen hierarchy and panel composition

---

## 0. Layout & View Constraints (Authoritative)

These constraints govern all future map work:

1. **Panel height is fixed** by Command Overview composition (440px). Must not be increased.
2. **Solar-system spacing must not be arbitrarily altered** away from the real coordinate truth. The positions are derived from the raw 3D solar-system coordinates `(x, y, z)` and projected through the orbit camera. The camera moves; the world positions are fixed.
3. **Arbitrary minimum-distance spacing between solar systems is not the intended solution** for density or readability.
4. **View/camera manipulation is the intended solution path** — zoom, pan, and orbit (yaw/pitch) let the operator fit the projected topology into the fixed canvas without falsifying the geometry.
5. **The underlying world-space positions are fixed** — all transforms are applied by the orbit camera projection, not by rewriting topology positions. The camera orbits around the fixed world; the world does not move.
6. **Symbols must remain upright and consistently sized** — the orbit camera projects fixed 3D world positions into 2D screen coordinates. Glyphs and labels are rendered at those screen positions as billboards (upright, fixed size). The camera never rotates or scales SVG content.
7. **Left-drag must produce orbit behavior, not flat 2D rotation.** Horizontal drag = azimuth (turntable left/right around the world center). Vertical drag = polar (viewpoint from edge-on toward top-down). Drag direction matches Three.js OrbitControls convention: right-drag → scene rotates right, down-drag → tilt toward top-down. EFMap default orientation is **edge-on** (not top-down). (Corrected in passes 4–7: pass 4 added yaw/pitch; pass 5 true 3D coords; pass 6 lookAt model; pass 7 fixed inverted drag direction.)

---

## 1. Component Architecture (Current)

```
App.tsx (OperatorShell)
 └─ useAssetDiscovery()         → structures, nodeGroups, metrics
 └─ useSpatialPins()            → pins (localStorage)
 └─ Dashboard.tsx               (receives nodeGroups, metrics, pins, structures)
     └─ useSignalFeed()         → recentSignals (threaded to map panel)
     └─ StrategicMapPanel.tsx    ← primary map canvas (~450 lines)
         ├─ PostureControl.tsx   (inline posture switch in header)
         ├─ useMapViewTransform  (3D orbit camera hook — yaw/pitch/zoom/pan, localStorage persistence, lock)
         ├─ NodeClusterSvg      (separate file, per-node SVG cluster)
         │   └─ ChildGlyph      (internal, per-structure glyph renderer)
         │       ├─ GateGlyph
         │       ├─ TradePostGlyph
         │       └─ TurretGlyph
         └─ EventOverlayLayer   (internal, transient revenue/blocked SVG badges)
```

**Key files:**
| File | Role | ~Lines |
|------|------|--------|
| `src/components/topology/StrategicMapPanel.tsx` | Canvas, layout, links, labels, event overlays, cascade delay | ~500 |
| `src/components/topology/NodeCluster.tsx` | Per-node SVG cluster + child glyphs + heartbeat + pips + cascade delay | ~190 |
| `src/components/topology/topologyLayout.ts` | Radial slot algorithm + shared types | ~145 |
| `src/hooks/useMapViewTransform.ts` | 3D orbit camera (lookAt model, azimuth/polar/zoom/pan, localStorage persistence, lock state) | ~270 |
| `src/components/topology/Glyphs.tsx` | 6 inline SVG glyph components | ~145 |
| `src/lib/coordinates.ts` | Solar system → render coordinate projection | ~80 |
| `src/data/solarSystemCatalog.ts` | 24.5k solar system catalog (bundled) | ~50 |
| `src/hooks/useSpatialPins.ts` | LocalStorage pin management | ~60 |
| `src/styles/theme.css` | `--topo-*` CSS custom properties (15 defined) | ~30 |

---

## 2. Data Flow

```
Wallet ─► useAssetDiscovery() ─► structures[] + nodeGroups[] + metrics
                                   │
Solar System Catalog (JSON) ◄──────┤  (raw 3D coordinates: x, y, z)
                                   │
localStorage ─► useSpatialPins() ──┤
                                   ▼
         StrategicMapPanel.tsx
         ├── computeWorldPositions()  → {nodeId, world: {x,y,z}}[]
         │    ├── pinned: raw system.location (no 2D pre-projection)
         │    └── unpinned: synthesized below positioned nodes in world Z
         ├── useMapViewTransform()   → transformPoint(wx,wy,wz) → screen {x,y}
         ├── screenPositions (useMemo) → world → camera → screen for each node
         ├── nodeChildSlots (useMemo)  → topology-aware slots in screen space
         ├── gateEdges (useMemo)      → paired gate link coords (screen space)
         ├── NodeClusterSvg[]          → per-node SVG glyphs at screen positions
         └── EventOverlayLayer         → transient revenue/blocked event badges
```

### Coordinate Pipeline (pass 5 — true 3D)
1. World API `(x, y, z)` — raw 3D solar-system coordinates used directly (no 2D pre-projection)
2. `computeWorldPositions()` — resolves pinned nodes to raw `system.location`; unpositioned nodes get synthesized world coords below the positioned group
3. `useMapViewTransform()` — orbit camera computes `transformPoint(wx,wy,wz)` using EFMap-style lookAt model: camera position from spherical coords (azimuth, polar) around world centroid → build view matrix with `up = (0,1,0)` locked to world Y → dot world-point with view basis vectors (right, camUp) → scale + pan → SVG screen coords. Horizon always stays level. Drag direction matches Three.js OrbitControls convention (right-drag → scene right, down-drag → tilt top-down).
4. Default view (polar ≈ π/2): edge-on / equatorial — matches EFMap default orientation. The `polar` angle uses the same convention as Three.js Spherical `phi`: 0 = top-down from +Y; π/2 = equatorial (edge-on). Drag reveals 3D layout with proper turntable orbit.
5. `normalizeCoords()` / `solarSystemToRender()` are **no longer used** by the map panel — the camera's base-scale auto-fit replaces viewport normalization

### Gate Link Derivation
- `structures[].linkedGateId` from on-chain gate data (`resolveLinkedGateId(content)`)
- `gateEdges` memo: filters gates with `linkedGateId`, deduplicates by sorted ID pair
- Gate positions computed from parent node position + `childOffset()` radial placement

### Posture Propagation
- `usePostureState(firstGateId)` → reads `PostureKey` dynamic field from `GateConfig`
- Returns `"commercial" | "defense"` → mapped to `Posture` type
- Propagated via closure to: node center color, child glyph color, label border color, canvas overlay

---

## 3. Current Rendering Behavior

### 3.1 Gate-to-Gate Links
**Current:** Gate corridor links rendered with **link-state differentiation** derived from both endpoint `Structure.status` values:
- **Healthy** (both endpoints online/neutral): `var(--topo-link-healthy)` teal solid 2px, 0.55 opacity
- **Offline** (either endpoint offline): `var(--topo-state-offline)` red dashed (`4 4`), 0.4 opacity
- **Degraded** (either endpoint warning): `var(--topo-state-warning)` amber dashed (`6 3`), 0.5 opacity
- **Defense override**: `var(--topo-link-defense)` amber solid 2.5px, 0.6 opacity — overrides all link states when posture is defense

All corridor endpoints are **shortened by `GATE_CORRIDOR_INSET = 14` SVG-space pixels** (unit-vector offset) so lines stop outside the 24×24 gate glyph. Degenerate lines (length < 2px) are skipped. 800ms transition on stroke color and opacity.

**Status:** ✅ Solid corridors, link state differentiation (healthy/offline/degraded), defense override, shortened endpoints.

### 3.1.1 Structure-to-Node Anchor Lines
**Current:** Dotted 1px lines (`strokeDasharray="3 3"`, opacity 0.35) from each child structure to the network node center. Uses `var(--topo-glyph-neutral)` (mid-gray, brighter than the previous `--topo-link-idle` zinc-600). Clearly links structures to their parent node without competing with gate corridor lines.

**History:** Originally used `var(--topo-link-idle)` at 0.25 opacity with `2 3` dash pattern — too faint, structures appeared to float. Strengthened in anchor-line visibility pass.

**Status:** ✅ Correct per §2.5. Subordinate to corridors, clearly legible.

### 3.2 Node Center Glyph Coloring (NetworkNodeGlyph)
**Current:** Network node hexagons reflect own health status only:
- Online: **teal** (`--topo-state-online`)
- Offline: **red** (`--topo-state-offline`)
- Unknown status: **gray** (`--topo-neutral`)

Posture does NOT override node color. Defense posture is communicated via gate/turret glyph color and corridor link color, not the infrastructure container.

**Low-fuel warning pip (§6.14):** When the network node's fuel runtime is below 24 hours (same threshold as `AttentionAlerts`), a small amber dot (r=3, 80% opacity) is rendered at the top-right of the center glyph. The main node color remains health-driven.

**Status:** ✅ Correct — decoupled from posture per spec intent. Low-fuel warning pip added.

### 3.3 Child Glyph Coloring
**Current:**
- Gates: posture-aware — amber in defense (when online), teal in commercial, red when offline
- Trade Posts: online/offline only (teal/red) — posture-neutral
- Turrets: posture-aware — amber in defense (when online), teal in commercial

Gates are now treated as defense surfaces alongside turrets.

**Status:** ✅ Semantically correct.

### 3.4 Hover Tooltips
**Removed (§6.7).** Per-element `CompactTooltip` was removed due to broken positioning under pan/zoom transforms and low-value content. The `onHover` prop on `NodeClusterSvg` remains optional for future re-enablement.

**Status:** ❌ Removed. Ambient SVG text labels (§3.4.1) provide orientation.

### 3.4.1 Ambient Labels
**Current:** Minimal always-visible SVG `<text>` labels below each node cluster. Monospace 9px, 50% opacity, capped at 22 chars. Shows solar system name (if pinned) or cleaned node name. `pointer-events-none`.

**Status:** ✅ Quiet, subordinate orientation text.

### 3.5 Canvas Background
**Current:** CSS grid background (40px squares via linear gradients, `var(--topo-grid)` at 2% opacity), near-black background (`var(--topo-background)`), optional defense overlay (`bg-destructive/3`, 800ms fade).

**Spec compliant.** The subtle grid and dark background match the diagrammatic topology intent. Defense cascade wave propagation is now implemented via CSS `transition-delay` staggered by screen X position (§6.12).

### 3.6 Node Layout
**Current:** Fixed 3D world positions + synthesized fallback.
- Pinned nodes: raw 3D solar-system coordinates from catalog `(x, y, z)`
- Unpinned nodes: synthesized world positions below the positioned group in world-Z
- Separator: screen-space midpoint line between projected pinned/unpinned groups

**Spec expectation (§6):** Diagrammatic layout, not astronomical. The real 3D spatial relationships are now fully preserved (including the Y axis, previously dropped). The orbit camera reveals depth that was invisible in the flat 2D projection.

**No manual repositioning, drag, or snap-to-grid exists.**

### 3.7 Interactions
| Feature | Status | Notes |
|---------|--------|-------|
| Pan (right-drag) | **Implemented** | Right-click + drag translates the view (context menu suppressed) |
| Zoom (wheel) | **Implemented** | Wheel zoom centered on cursor in SVG-space, 0.5×–5× range |
| Yaw (left-drag horizontal) | **Implemented** | Turntable-style orbit left/right around the system layout; 0.4°/px |
| Pitch (left-drag vertical) | **Implemented** | Tilt viewpoint above/below the system layout; ±60° clamp; 0.3°/px |
| Hover tooltips | **Removed** | Removed (§6.7) — broken positioning, low-value |
| View reset | **Implemented** | Quiet "reset" button appears when view is modified |
| Click-to-select | **Missing** | All pointer-events-none on decorative elements |
| Click-to-navigate | **Missing** | No routing from map nodes |
| Drag nodes | **Missing** | No drag handlers |
| Cluster expand/collapse | **Missing** | Turret 4+ collapse to +N badge but not interactive |
| Semantic zoom (aggregate↔expand) | **Missing** | `SolarSystemAggregateGlyph` exists in Glyphs.tsx but never used |
| Keyboard navigation | **Missing** | No `tabindex`, no `aria-label` |

**Interaction model note (pass 5 — true 3D orbit camera):**

Passes 3–4 applied orbit transforms to 2D-projected positions. Pass 3 used flat single-axis rotation; pass 4 added yaw/pitch but applied pitch as `cos()` compression on already-flattened 2D points — still a flat approximation. Pass 5 replaces this with a proper 3D orbit camera model:

- **World positions are fixed 3D** — raw solar-system `(x, y, z)` coordinates from the catalog, not pre-projected to 2D.
- **Camera orbits around the world centroid** — the world does not move.
- **Yaw** (horizontal left-drag) rotates the camera around the world Y axis (turntable). 0.4°/px sensitivity.
- **Pitch** (vertical left-drag) tilts from top-down (pitch=0) toward the horizon. The world Y axis — previously dropped by the 2D projection — now becomes visible as pitch increases. ±60° clamp. 0.3°/px sensitivity.
- **Projection pipeline:** center on centroid → yaw rotation around Y → pitch tilt → orthographic drop camera-Z → base-scale auto-fit + zoom + pan → SVG screen coordinates.
- **Default view (yaw=0, pitch=0)** produces `screen-x = world-x, screen-y = −world-z` — identical to the previous EVE flat-map orientation, preserving visual continuity.
- **Orthographic, not perspective** — no vanishing point, no depth-based size scaling. This is a deliberate choice: governance topology does not benefit from perspective foreshortening at current density. True perspective would require Z-buffer ordering and depth-varying symbol sizes.
- **Glyphs and labels remain billboarded** — rendered at projected screen positions without any rotation applied to the symbols themselves. Fixed size regardless of zoom.
- **Child slots, gate edges, and labels are computed in screen space** — `assignChildSlots()` receives camera-projected node positions, so gate directions naturally point toward on-screen destinations. Gate edges connect screen-space slot positions directly. Labels are anchored at fixed screen-space offsets below the projected node center.

### 3.8 Animations
| Feature | Status | Notes |
|---------|--------|-------|
| Posture color transition | **Implemented** | 800ms ease-in-out, correct timing |
| Heartbeat / idle pulse | **Implemented** | 3s cycle on online child structures (teal ring, 0→0.25→0 opacity); 4s cycle on online network nodes (teal ring, 0→0.18→0 opacity) |
| Event pulse (denied/toll) | **Partial** | Revenue ($) + blocked (✕) badges with pulse ring animation (§6.9) |
| Edge pulse (transit) | **Missing** | No animated stroke-dashoffset |
| Revenue flash | **Missing** | `--topo-event-revenue` defined, unused |
| Defense cascade | **Implemented** | Left-to-right wave via CSS `transition-delay` staggered by screen X (§6.12) |
| Halo glow | **Partial** | Static 6% opacity `<circle>` behind node center — not animated, not state-driven |
| Badge appear/dismiss | **Partial** | 2-second hold + 400ms fade-out on event overlay badges (§6.9) |

---

## 4. Asset Usage Audit

### 4.1 Inline Glyphs (Used — Not From SVG Files)
All glyphs are **inline JSX** in `src/components/topology/Glyphs.tsx`. They match the geometry of the spec assets but are not imported from `assets/icons/glyphs/`.

| Inline Component | Matches Asset | Used in Map |
|-------------------|--------------|-------------|
| `GateGlyph` | `gate.svg` | ✅ Via ChildGlyph |
| `NetworkNodeGlyph` | `network_node.svg` | ✅ Node center |
| `TurretGlyph` | `turret.svg` | ✅ Via ChildGlyph |
| `TradePostGlyph` | `trade_post.svg` | ✅ Via ChildGlyph |
| `SolarSystemAggregateGlyph` | `solar_system_aggregate.svg` | ❌ Defined but never rendered |
| `StructureGlyph` | (dispatcher) | ✅ Type switch |

### 4.2 SVG File Assets — Usage Status

**Primary glyphs (5):** None imported from files. Inline JSX equivalents used instead.
| Asset File | Status |
|------------|--------|
| `assets/icons/glyphs/network_node.svg` | **Unused** — inline equivalent |
| `assets/icons/glyphs/gate.svg` | **Unused** — inline equivalent |
| `assets/icons/glyphs/turret.svg` | **Unused** — inline equivalent |
| `assets/icons/glyphs/trade_post.svg` | **Unused** — inline equivalent |
| `assets/icons/glyphs/solar_system_aggregate.svg` | **Unused** — inline equivalent exists but never rendered |

**Mini glyphs (4):** None imported or used anywhere.
| Asset File | Status |
|------------|--------|
| `assets/icons/glyphs/mini/network_node_mini.svg` | **Unused** |
| `assets/icons/glyphs/mini/gate_mini.svg` | **Unused** |
| `assets/icons/glyphs/mini/turret_mini.svg` | **Unused** |
| `assets/icons/glyphs/mini/trade_post_mini.svg` | **Unused** |

**Overlay badges (5):** None imported or used.
| Asset File | Status |
|------------|--------|
| `assets/icons/overlays/badges/badge_denied.svg` | **Unused** |
| `assets/icons/overlays/badges/badge_warning.svg` | **Unused** |
| `assets/icons/overlays/badges/badge_revenue.svg` | **Unused** |
| `assets/icons/overlays/badges/badge_count.svg` | **Unused** |
| `assets/icons/overlays/badges/link_count_badge.svg` | **Unused** |

**Overlay halos (2):** None imported or used.
| Asset File | Status |
|------------|--------|
| `assets/icons/overlays/halos/halo_armed.svg` | **Unused** |
| `assets/icons/overlays/halos/halo_selected.svg` | **Unused** |

**Overlay pips (2):** None imported or used.
| Asset File | Status |
|------------|--------|
| `assets/icons/overlays/pips/pip_status.svg` | **Unused** |
| `assets/icons/overlays/pips/pip_small.svg` | **Unused** |

**Overlay pulse (1):** Not imported or used.
| Asset File | Status |
|------------|--------|
| `assets/icons/overlays/pulse/pulse_base.svg` | **Unused** |

**Summary:** 0 of 19 SVG file assets are currently imported. All glyph rendering uses inline JSX equivalents. All overlays (badges, halos, pips, pulse) are entirely absent from the implementation.

### 4.3 CSS Custom Properties — Usage Status

| Variable | Value | Used? | Notes |
|----------|-------|-------|-------|
| `--topo-neutral` | `#a1a1aa` | ✅ | Fallback node color |
| `--topo-state-online` | `hsl(175,45%,50%)` | ✅ | Online state color |
| `--topo-state-offline` | `#ef4444` | ✅ | Offline state color |
| `--topo-state-warning` | `#f59e0b` | ✅ | Defense posture amber |
| `--topo-event-revenue` | `hsl(145,65%,50%)` | ❌ | Revenue pulse green — defined, never referenced |
| `--topo-event-denied` | `#ef4444` | ❌ | Denied pulse red — defined, never referenced |
| `--topo-armed` | `#f59e0b` | ❌ | Armed halo — defined, never referenced |
| `--topo-selected` | `#ea580c` | ❌ | Selection halo — defined, never referenced |
| `--topo-link-healthy` | `hsl(175,45%,50%)` | ✅ | Gate link stroke (all links) |
| `--topo-link-neutral` | `hsl(210,8%,35%)` | ❌ | Neutral link — defined, never referenced |
| `--topo-link-defense` | `#f59e0b` | ✅ | Defense-mode corridor link color |
| `--topo-link-idle` | `#52525b` | ✅ | Separator line only (anchor lines migrated to `--topo-glyph-neutral` in §6.11) |
| `--topo-background` | `hsl(220,15%,6%)` | ✅ | Canvas background |
| `--topo-grid` | `rgba(255,255,255,0.02)` | ✅ | Grid line opacity |
| `--topo-glyph-neutral` | `hsl(210,8%,55%)` | ✅ | Default glyph neutral |

**6 of 15 CSS variables are defined but never used** — all relate to event/interaction states that aren't yet implemented.

---

## 5. Spec vs Implementation Gap Matrix

| Spec Feature | Section | Implementation Status | Priority |
|---|---|---|---|
| **Gate corridor links: solid** | §2.5 | ✅ Solid 2px, posture-aware color | — |
| **Anchor lines: dotted** | §2.5 | ✅ Dotted 1px, correctly subordinate | — |
| **Link state variants** (healthy/degraded/offline/defense) | §3.2 | ✅ All four states implemented + shortened endpoints (§6.10) | — |
| **Node color tracks own status, not posture** | §3 | ✅ Decoupled — nodes show health only | — |
| **Turret posture color** | §3 | ✅ Amber in defense | — |
| **Gate posture color** | §3 | ✅ Gates amber in defense (defense surface) | — |
| **Event badges** (denied ✕, revenue +, warning !) | §3.3 | ✅ Revenue ($) + blocked (✕) via EventOverlayLayer (§6.9) | — |
| **Event pulses** (denied red, toll green) | §3.3, §5 | ✅ Revenue ($) + blocked (✕) badge overlays with pulse ring (§6.9) | — |
| **Status pips** (fuel, state) | §3.2 | ✅ Warning pip (amber dot, r=2.5) on structures with `status === "warning"` (§6.11) | — |
| **Armed halo** | §3.3 | ❌ No halo rendering | Low |
| **Selected halo** | §3.2 | ❌ No selection mechanism | Medium |
| **Hover tooltips** (replaces permanent labels) | §3.2 | ❌ Removed (§6.7) — ambient SVG labels remain | — |
| **Defense cascade** (per-hop stagger) | §5.3 | ✅ Left-to-right cascade with per-element CSS `transition-delay` (§6.12) | — |
| **Heartbeat pulse** (idle animation) | §5.2 | ✅ Restrained teal ring pulse on online infrastructure (§6.11) | — |
| **Semantic zoom** (aggregate ↔ expand) | §6.14 | ❌ Glyph component exists but never used | Low |
| **System boundaries** (hover-visible rounded rect) | §6.9 | ❌ No system grouping | Low |
| **Pan/zoom/orbit** | — | ✅ Wheel zoom + left-drag yaw/pitch orbit + right-drag pan (turntable camera) | — |
| **Click-to-select** | — | ❌ All pointer-events-none on decorative elements | Medium |
| **Click-to-navigate** (node → detail screen) | — | ❌ No routing | Low |
| **Keyboard navigation / aria-labels** | §11 | ❌ No accessibility | Low |
| **Multi-solar-system link routing** (Bézier/arc) | §6 | ❌ All links are straight `<line>` | Low |
| **Mini glyphs** (for aggregate interiors) | §6.14 | ❌ Assets exist, not used | Low |
| **Green = money only** (not "online") | §4 | ✅ Online = teal, revenue = green (unused) | — |
| **Canvas background + grid** | §6 | ✅ Matching spec | — |
| **Radial child layout** (12-o'clock start, clockwise) | §6.5 | ✅ Implemented correctly | — |
| **Turret collapse** (4+ → 3 + "+N" badge) | §6.7 | ✅ Implemented | — |
| **Posture transition timing** (800ms ease) | §5 | ✅ Implemented | — |

---

## 6. Answers to Specific Operator Questions

### Why are gate links currently dotted/segmented?
**Resolved.** Gate corridor links are now solid 2px with posture-aware color (teal commercial, amber defense). The original dashed treatment was replaced in pass 1.

### Why do Network Nodes change visual treatment on posture switch?
**Resolved.** Network node hexagons now reflect their own online/offline health status only. Posture drives gate + turret glyph colors and corridor link colors, not the infrastructure container.

### Which SVG primitives and overlays are not currently being exercised?
**Partially updated.** All 19 SVG file assets remain unexercised (inline JSX equivalents used for primary glyphs). Overlay rendering uses inline SVG — event badges via `EventOverlayLayer` (§6.9), warning pips via inline `<circle>` in `ChildGlyph` (§6.11), heartbeat pulse via inline `<animate>` (§6.11). File-based overlay assets remain unused.

### Are revenue pulses / badges / denial badges / warning markers wired at all?
**Partially delivered (§6.9, §6.11).** Revenue ($) and blocked (✕) event badges rendered as transient SVG overlays via `EventOverlayLayer`. Pulse ring animation on appear, 2-second hold, 400ms fade-out. CSS badge variables (`--topo-event-revenue`, `--topo-event-denied`) remain unreferenced — overlays use inline colors. Warning pips implemented (§6.11) — amber dot (r=2.5) on `status === "warning"` structures.

### Are the current floating cards/tooltips permanent labels or intended UX?
**Resolved (updated).** The permanent oversized label cards were removed (pass 1). Per-element hover tooltips were added (pass 2) then removed (§6.7) due to broken positioning under pan/zoom and low-value content. Remaining:
1. **Minimal SVG text labels** (9px, 50% opacity) for ambient orientation — still present

### Is the current layout purely coordinate-projected, manually pinned, or hybrid?
**Updated (pass 5) — 3D world positions + synthesized fallback.** Pinned nodes use raw 3D solar-system coordinates from the catalog (`system.location`). Unpinned nodes get synthesized world positions below the positioned group in world-Z space. All positions are projected through the orbit camera into screen coordinates. The 2D `solarSystemToRender()` → `normalizeCoords()` pipeline is no longer used by the map panel — the camera's base-scale auto-fit replaces viewport normalization.

### Cleanest path to fill available panel space without "astronomical map" drift?
**Partially addressed.** View controls (zoom/pan/rotate) now let the operator fit the projected topology into the fixed 440px panel without distorting the underlying geometry. The permanent label cards were removed (reclaiming ~30-40% visual space). The panel height remains fixed at 440px.

### What interaction model is realistic?
**Partially delivered (corrected pass 4):**
- ✅ **Wheel zoom** (cursor-centered in SVG-space, 0.5×–5× range, symbols stay fixed size)
- ✅ **Left-drag orbit** — horizontal = yaw (turntable left/right), vertical = pitch (above/below viewpoint)
- ✅ **Right-drag pan** (translates view, context menu suppressed)
- ✅ **Turntable orbit camera** — world-space positions transformed through yaw/pitch/zoom/pan; symbols billboarded to screen
- ✅ **Quiet reset** button appears only when view is modified
- ❌ Click-to-select, click-to-navigate, keyboard nav still missing

*Pass 2 used viewBox scaling + scene rotation. Pass 3 corrected to point-transform but still used flat 2D rotation. Pass 4 added yaw/pitch but applied to 2D-projected positions (cos-compression approximation). Pass 5 fed raw 3D world coordinates through two sequential Euler rotations (yaw then pitch in yawed frame). Pass 6 replaced the Euler-rotation approach with the EFMap-reference lookAt camera model: spherical coordinates (azimuth, polar) → camera basis vectors (forward, right, camUp) → view-matrix dot-product projection → orthographic → SVG coords. Up-vector locked to world (0,1,0). Pass 7 fixed inverted orbit drag directions — both azimuth (horizontal) and polar (vertical) had wrong sign compared to Three.js OrbitControls. Also corrected stale comments that described the polar convention backwards (said "top-down" when π/2 is equatorial). EFMap default orientation is edge-on (not top-down as previously assumed).*

### Which changes should come first for highest visual gain with lowest risk?
**Completed (passes 1+2):**
1. ✅ Gate links solid + posture-aware color
2. ✅ Node color decoupled from posture
3. ✅ Permanent labels → hover tooltips
4. ✅ Defense-mode link color (`--topo-link-defense`)
5. ✅ View controls (zoom/pan/rotate)

**Remaining highest-value items:**
1. Click-to-select with selection halo
2. Semantic zoom / aggregation

---

## 6.5. EFMap Coordinate-Basis Correction

**Source of truth:** EFMap applies two transforms from game-raw Z-up coords `(gx, gy, gz)`:
1. DB build: `(gx, gz, -gy)` — Z-up to Y-up
2. Render: `X_scene = DB.x, Y_scene = DB.z, Z_scene = -DB.y`
3. Net game→scene: `(gx, -gy, -gz)`
4. Default camera: `(0,0,5000) → (0,0,0)` looking along `-Z`, up=`(0,1,0)`

**CivControl mismatch found:**
- CC used raw game coords `(gx, gy, gz)` directly as world `(x, y, z)` with no remap
- CC default azimuth=0 made camera look along -X instead of -Z
- Result: horizontal was driven by -game.Z (wrong), vertical by game.Y (wrong sign), depth by game.X (wrong)
- Galaxy appeared rotated 90° and vertically flipped relative to EFMap

**Fix applied:**
1. Added `gameToWorld()` remap: `world = { x: gx, y: -gy, z: -gz }` — matches EFMap scene coords
2. Changed default `azimuth` from `0` to `π/2` — camera now looks along -Z, matching EFMap
3. Fixed unpositioned-node fallback to offset in Y (vertical) instead of Z (depth)
4. Diagnostic point cloud remap uses same `gameToWorld()` helper

**Verified against EFMap reference systems:**
- IMT-K55: screenX=LEFT, screenY≈center ✔ (EFMap: far left, near center)
- OHQ-1TM: screenX=RIGHT, screenY=ABOVE ✔ (EFMap: far right, above center)
- EG9-8PC: screenX=LEFT, screenY≈center ✔ (EFMap: left, near center)

---

## 6.5b. Yaw-Direction Inversion Fix (post coordinate-basis correction)

After the coordinate-basis correction (§6.5), the default orientation, pitch, zoom, and pan all worked correctly. However horizontal left-drag yaw was spinning in the wrong direction — dragging left rotated the map right and vice versa. This was caused by the azimuth sign (`-=`) being wrong for the new `azimuth=π/2` default basis.

**Fix:** Changed `azimuth: d.initAzimuth - dxClient * AZIMUTH_SENSITIVITY` to `+ dxClient`. Polar sign unchanged. No other camera changes.

---

## 6.6. Starfield Layer — Optional Spatial-Orientation Aid

**Origin:** Introduced as temporary diagnostic point cloud (24.5k solar systems rendered as faint dots behind topology). After the coordinate-basis correction and yaw fix, the operator found it useful as an ongoing spatial-orientation reference and chose to retain it.

**Current behavior:**
- **Off by default** (hidden on load)
- Toggled via a small "stars" button in the top-right map controls, matching the quiet visual tone of the existing "reset" control
- When enabled, renders all ~24.5k solar systems as 1px `rgba(140,200,255,0.25)` dots on a `<canvas>` behind the SVG topology layer
- Re-draws on every camera change via `transformPoint`; clears immediately when toggled off

**Implementation:**
- `showStarfield` state (default `false`) in `StrategicMapPanel`
- Canvas draw `useEffect` gated by `showStarfield` — clears canvas and returns early when off
- Map controls group (`div.absolute.top-2.right-2`) contains "stars" toggle + conditional "reset" button
- No camera, basis, or layout changes

---

## 6.7. Hover Tooltip Removal

**Origin:** The `CompactTooltip` HTML element used percentage-based positioning (`leftPct = svgX / MAP_WIDTH * 100`) which does not account for pan/zoom or the SVG `preserveAspectRatio="xMidYMid meet"` scaling. Tooltip drifted away from the actual structure as the camera moved. Content was low-value / partially duplicating ambient system labels.

**Decision:** Remove entirely rather than fix. The ambient labels already show system names. Per operator: "if it cannot be made correct and useful cleanly, it should be removed for now."

**What was removed:**
- `CompactTooltip` function (~60 lines)
- `hoverTarget` state, `hoverTimerRef`, `handleHover` callback
- `onHover` prop on `NodeClusterSvg` (made optional in `NodeCluster.tsx` for future re-enablement)
- `HoverTarget` import from topologyLayout

---

## 6.8. Persistent View State + Lock Control

**View persistence:** Camera state (`azimuth`, `polar`, `zoom`, `panX`, `panY`) and `locked` flag are persisted to `localStorage` under key `cc:strategic-map:camera`. Debounced write (300ms) to avoid thrashing. Read on hook init with safe fallback to defaults. Starfield toggle persisted separately under `cc:strategic-map:starfield`.

**Lock control:** New "lock" button in the top-right map controls group (between "stars" and "reset"). When locked:
- `startDrag()` and `zoomAt()` are no-ops
- `handlePointerDown` returns early
- Wheel handler returns early (after `preventDefault()`)
- Cursor changes from `grab`/`grabbing` to `default`
- Lock state persists across page reloads

**Implementation:** All persistence and lock logic lives in `useMapViewTransform` hook. The panel only reads `locked` / `setLocked` from the hook return.

---

## 6.9. Event Overlay Layer — Revenue & Blocked Signal Badges

**Origin:** First overlay channel implementation per spec §3.2-3.3. Wired to real events from the existing `useSignalFeed` hook.

**Event source:** Dashboard already called `useSignalFeed({ ownedObjectIds, walletAddress })`. A new `signals` prop was added to `StrategicMapPanel` and threaded from Dashboard.

**Overlay mechanics:**
1. `EventOverlayLayer` (internal component) watches `signals` for new `revenue` or `blocked` variants
2. New signals are matched to structure screen positions via `relatedObjectId` → `structurePositionMap` (derived from `nodeChildSlots`)
3. Matched signals produce `ActiveOverlay` entries with a 2-second hold timer
4. Each overlay renders as an inline SVG: pulse ring animation + filled badge circle + glyph character
5. Revenue = green circle + `$`, Blocked = red circle + `✕`
6. Badge fades (opacity transition) in the last 400ms before expiry
7. Expired overlays are pruned by a `setTimeout`-based cleanup effect
8. A `seenRef` set prevents duplicate overlays for the same signal; capped at 200 entries with periodic pruning

**Overlay rendering:** Separate `<svg>` element layered above the topology SVG with `pointer-events-none`, matching the same `viewBox` and `preserveAspectRatio`. Badges are positioned at structure screen coordinates minus 18px Y offset (above the glyph).

---

## 6.10. Corridor Endpoint Shortening + Link State Differentiation

**Origin:** Gate corridor lines pierced through the 24×24 gate glyphs, and all links had identical visual treatment regardless of endpoint health status.

**Endpoint shortening:**
- Added `GATE_CORRIDOR_INSET = 14` constant — SVG-space pixel offset
- Each corridor endpoint shortened by computing the unit vector along the link and displacing each endpoint inward by `min(14, len/2 - 1)` pixels
- Degenerate lines (total length < 2px) are skipped entirely
- The 14px value provides clear separation from the gate glyph (which has visual content at ~8px radius from center)

**Link state derivation:**
- `statusMap` built from `structures[]` keyed by structure ID
- For each gate pair, both endpoint statuses are looked up
- State rules (first match wins): either offline → `"offline"`, either warning → `"degraded"`, else → `"healthy"`
- Defense posture override applied at render time (not in state derivation)

**Rendering per state:**
| State | Stroke | Width | Dash | Opacity |
|-------|--------|-------|------|---------|
| Healthy | `--topo-link-healthy` (teal) | 2px | solid | 0.55 |
| Offline | `--topo-state-offline` (red) | 2px | `4 4` | 0.4 |
| Degraded | `--topo-state-warning` (amber) | 2px | `6 3` | 0.5 |
| Defense (override) | `--topo-link-defense` (amber) | 2.5px | solid | 0.6 |

All states include `transition: stroke 800ms ease-in-out, opacity 800ms ease-in-out`.

**Grounding note:** There is no on-chain `"degraded"` status — `Structure.status` has `"online" | "warning" | "offline" | "neutral"`. The `"warning"` status is mapped to the `"degraded"` link state as the closest grounded equivalent.

---

## 6.11. Anchor-Line Visibility + Idle Heartbeat Pulse + Warning Pips

**Origin:** Operator feedback: anchor lines too faint (structures "floating"), map felt static when idle. Warning state data (`Structure.status === "warning"`) already available in `ChildSlot.status` — clean enough to surface with a pip.

**Anchor-line changes:**
- Stroke changed from `var(--topo-link-idle)` (zinc-600, `#52525b`) to `var(--topo-glyph-neutral)` (mid-gray, `hsl(210,8%,55%)`) — brighter without competing with teal/amber corridors
- Opacity raised from 0.25 to 0.35
- Dash pattern changed from `2 3` to `3 3` — longer dashes read as more continuous
- Width remains 1px; still clearly subordinate to 2px corridors

**Idle heartbeat pulse:**
- Online child structures: `<circle>` ring with SVG `<animate>`, 3-second cycle, opacity 0→0.25→0, radius expands +3px
- Online network nodes: same technique, 4-second cycle (slower for calmer feel), opacity 0→0.18→0, radius 16→20→16
- Uses `var(--topo-state-online)` teal for both — consistent with healthy infrastructure
- `fill="none"` — ring only, no solid disc flash
- `pointerEvents="none"` — does not interfere with hit areas
- Offline/neutral structures have no pulse (intentionally dead/quiet)
- Does not use the `pulse_base.svg` asset (inline SVG animate is simpler and avoids an import)

**Warning pips:**
- Small amber dot (r=2.5, 75% opacity) positioned at top-right corner of structures with `status === "warning"`
- Uses `var(--topo-state-warning)` — amber, consistent with warning signals throughout the UI
- Does not appear on offline (red glyph already signals failure) or online (no issue) structures
- Pip disappears naturally when status changes — no timer or animation needed

---

## 6.12. Defense Cascade Wave Propagation

**Origin:** Posture switch previously flipped all defense surfaces simultaneously (single 800ms transition). Operator wanted posture changes to "sweep across the network" left-to-right for visual coherence.

**Cascade model:** CSS `transition-delay` based on normalized screen X position. Each defense surface receives a delay proportional to its horizontal position in the current viewport projection. This produces a left-to-right wave regardless of camera orientation (azimuth/polar).

**Delay calculation:**
1. Compute `minX` and `rangeX` from all elements in the current category (corridors use midpoint X; node clusters use projected screen X)
2. Per-element delay = `Math.round(((x - minX) / rangeX) * 800)` ms (0–800ms range)
3. Combined with the existing 800ms ease-in-out base transition, total sweep duration is ~1.6s

**Surfaces affected (defense surfaces only):**
- **Gate corridor links:** `transitionDelay` applied to each `<line>` element, computed from corridor midpoint screen X
- **Gate glyphs:** `cascadeDelayMs` threaded from `StrategicMapPanel` → `NodeClusterSvg` → `ChildGlyph` (gates only)
- **Turret glyphs:** Same path as gates (`slot.kind === "turret"`)

**Surfaces NOT affected (intentionally):**
- **Network node center:** Health color (not posture) — no cascade delay
- **Trade post glyphs:** Posture-neutral — receive `cascadeDelayMs = 0`

**Implementation details:**
- `StrategicMapPanel.tsx`: Corridor lines rendered via IIFE that pre-computes min/range from midpoints. Node clusters rendered via IIFE that pre-computes min/range from screen positions.
- `NodeCluster.tsx`: New `cascadeDelayMs` prop on `NodeClusterSvgProps` (default 0). Threaded to `ChildGlyph` only for `gate` and `turret` kinds. `ChildGlyph` applies `transitionDelay` only when `isDefenseSurface && cascadeDelayMs > 0`.
- Camera-relative ordering: uses projected screen X, so the wave direction adapts naturally when the operator orbits the camera.

---

## 6.13. Posture Transition-State UX + Timing Investigation

**Origin:** Operator-observed problem: after approving the posture-switch wallet transaction, the map could take 30+ seconds to visibly update. No feedback during the wait invited repeated clicking and made the product feel uncertain.

**Root cause investigation:**
- The on-chain PTB itself is fast (~2–4 seconds for a posture+turret-auth switch on Utopia testnet)
- The delay was dominated by the **read-path polling interval**: `usePostureState` polled every 30 seconds (`refetchInterval: 30_000`). After the transaction succeeded and queries were invalidated, if the first refetch returned stale data (chain hadn't finalized yet), the next poll was 30 seconds away
- Secondary factor: `staleTime: 15_000` meant even after invalidation, cached data could suppress immediate refetch

**Fix — aggressive polling during transition:**
- `usePostureState(gateId, aggressiveRefetch)` now accepts a boolean flag
- When `aggressiveRefetch = true`: `refetchInterval` drops to 4s, `staleTime` to 2s
- During a posture transition, PostureControl signals aggressive polling; normal 30s polling resumes once the read-path confirms the new posture

**Transition lifecycle (`pendingTarget` state):**
1. Operator clicks Commercial or Defensive → `pendingTarget` set to target mode
2. PTB built and submitted via `useSponsoredExecution`
3. During execution: buttons disabled, label shows “Awaiting wallet…” (inline) / “Executing…” (card)
4. After tx success: label shows “Confirming on-chain…” (inline) / “Transitioning…” (card)
5. Aggressive 4s polling catches the chain update within ~4–8 seconds
6. When `currentPosture === pendingTarget`, transition clears → normal state restored
7. On error: `pendingTarget` clears immediately, controls re-enable, error banner shown

**Visual treatment (inline variant — used in Strategic Network Map header):**
- Target chip shows `animate-pulse` with muted styling during transition
- Status text appears between posture chips and Save Preset: “Awaiting wallet…” / “Confirming on-chain…”
- Save Preset placeholder hidden during transition (reclaims space for status text)
- Both chip buttons disabled throughout transition

**Visual treatment (card variant):**
- Status dot pulses gray (`animate-pulse`) during transition
- Action button shows “Applying…” and is disabled
- State label shows phase-appropriate text

**Key timing improvement:** Worst-case posture feedback time dropped from ~30–45s (30s poll + chain time) to ~6–12s (4s aggressive poll + chain time).

---

## 6.14. Network-Node Warning Pip (Low Fuel)

**Origin:** `AttentionAlerts` in Dashboard correctly flagged low-fuel network nodes, but the Strategic Network Map showed no corresponding warning — creating a disconnect between the alerting layer and the topology layer.

**Warning-state source:** Same logic as `AttentionAlerts`: `computeRuntimeMs(quantity, burnRateMs, efficiency)` < 24 hours. Uses `getFuelEfficiency(typeId)` from `fuelRuntime.ts`. Only applies to network nodes with `fuel.isBurning === true`. Nodes with unknown fuel type or zero/negative fuel are skipped.

**Implementation:**
- `StrategicMapPanel.tsx`: Computes `lowFuelNodeIds: Set<string>` from `nodeGroups` using the same threshold (`24 * 60 * 60 * 1000` ms). Passes `hasWarning={lowFuelNodeIds.has(group.node.objectId)}` to each `NodeClusterSvg`.
- `NodeCluster.tsx`: New `hasWarning?: boolean` prop (default `false`). When true, renders an amber pip (`var(--topo-state-warning)`, r=3, 80% opacity) at the top-right of the network node center glyph (offset `cx+12, cy-12`).
- The main node health color (teal/red/gray) is NOT affected — the pip is an additive indicator.

**Visual treatment:**
- Amber dot, r=3, 80% opacity — slightly larger than child-structure warning pips (r=2.5) because network nodes are bigger (28px glyph vs 20–24px)
- Positioned top-right of the 28×28 center glyph, matching the child-glyph pip convention
- Uses `var(--topo-state-warning)` — consistent with all other warning/defense amber in the map
- `pointerEvents="none"` — does not interfere with hover hit areas

---

## 7. Recommended Implementation Slices (Updated)

### Slice 1 — Visual Corrections ✅ COMPLETED (Pass 1)
- Solid gate corridors, posture-aware color, dotted anchors, node color decoupled

### Slice 2 — Label-to-Tooltip Refactor + View Controls ✅ COMPLETED (Passes 1+2+3+4+5)
- Permanent labels removed, hover tooltips added (per-element, type-specific)
- Topology-aware gate slotting (greedy most-constrained-first algorithm)
- View controls: zoom (wheel), yaw/pitch orbit (left-drag), pan (right-drag)
- **True 3D orbit camera (passes 5+6+7):** proper orbit camera over raw 3D world coordinates — azimuth rotates around world Y (turntable), polar tilts between near-top-down and equatorial/edge-on, orthographic projection, base-scale auto-fit, billboarded symbols
- Pass 6 replaced pass 5's two-Euler-rotation projection with lookAt view-matrix model. Pass 7 fixed inverted drag directions (both axes negated to match Three.js OrbitControls). Corrected polar convention comments: polar=0 is top-down, polar=π/2 is edge-on. EFMap verified default is edge-on (not top-down).
- **Coordinate-basis correction pass:** CC was feeding raw game-Z-up coords directly into the Y-up camera. Fix: added `gameToWorld()` remap `(gx, -gy, -gz)` matching EFMap scene basis, and changed default azimuth from 0 to π/2 so camera looks along -Z (matching EFMap default camera). Verified against 5 EFMap reference systems.
- Passes 3–4 were intermediate corrections: pass 3 fixed scene-transform to point-transform; pass 4 added yaw/pitch but over 2D-projected positions (cos-compression); pass 5 fed raw 3D coords through Euler rotations (yaw → pitch-in-yawed-frame — produced coupling artifact)
- Component extraction: NodeCluster.tsx, useMapViewTransform.ts

### Slice 3 — Event Overlays ✅ COMPLETED (Revenue + Blocked badges, persistent view, lock)
**Delivered:** ~150 LoC new (EventOverlayLayer + localStorage persistence + lock control)
- Revenue ($) and blocked (✕) SVG badge overlays wired to `useSignalFeed`
- 2-second hold timing with fade-out in last 400ms
- Pulse ring animation on overlay appear
- Persistent camera state + lock state in localStorage
- Lock control button in map controls
- Hover tooltip removed (broken positioning, low-value content)

### Slice 4 — Link State Differentiation ✅ COMPLETED
**Delivered:** ~70 LoC changed
- Corridor endpoints shortened by `GATE_CORRIDOR_INSET = 14` (unit-vector offset, degenerate guard)
- Link state derived from both endpoint `Structure.status`: healthy (teal solid 2px), offline (red dashed `4 4`), degraded (amber dashed `6 3`)
- Defense posture overrides all states (amber solid 2.5px, 0.6 opacity)
- 800ms transition on stroke + opacity

### Slice 4b — Anchor Visibility + Idle Heartbeat + Warning Pips ✅ COMPLETED
**Delivered:** ~40 LoC changed in NodeCluster.tsx
- Anchor-line stroke upgraded (`--topo-glyph-neutral`, 0.35 opacity, `3 3` dash) — structures no longer float
- Idle heartbeat pulse on online structures (3s teal ring cycle) and network nodes (4s teal ring cycle)
- Warning pip (amber dot r=2.5) on `status === "warning"` structures
- No new dependencies, no new files

### Slice 4c — Defense Cascade Wave Propagation ✅ COMPLETED
**Delivered:** ~50 LoC changed across StrategicMapPanel.tsx + NodeCluster.tsx
- Posture switch sweeps left-to-right via CSS `transition-delay` staggered by screen X position
- Corridors, gate glyphs, turret glyphs cascade (0–800ms delay + 800ms transition = ~1.6s sweep)
- Network nodes and trade posts unaffected (not defense surfaces)
- Camera-relative ordering — wave direction adapts with orbit

### Slice 4d — Posture Transition-State UX ✅ COMPLETED
**Delivered:** ~60 LoC changed across PostureControl.tsx + usePosture.ts
- Full transition lifecycle: pendingTarget → executing → confirming → confirmed
- Aggressive 4s polling during transition (normal 30s otherwise)
- Both posture buttons disabled throughout transition
- Calm status indicators: “Awaiting wallet…” / “Confirming on-chain…” / “Applying…”
- Worst-case feedback time reduced from ~30–45s to ~6–12s

### Slice 4e — Network-Node Warning Pip ✅ COMPLETED
**Delivered:** ~25 LoC changed across StrategicMapPanel.tsx + NodeCluster.tsx
- Low-fuel network nodes show amber pip at top-right of center glyph
- Same 24h threshold as AttentionAlerts — map and attention panel now agree
- Main node health color unchanged (additive indicator only)

### Slice 5 — Click-to-Select + Selection Halo (Medium Risk, Product Value)
**Estimated scope:** ~80 LoC
- Click-to-select individual structures or clusters
- Selection halo (`--topo-selected`) around selected element
- Optional: click-to-navigate to structure detail screen

### Slice 6 — Semantic Zoom + Aggregation (High Risk, Stretch)
**Estimated scope:** ~150 LoC
- Aggregate/system expansion at zoom thresholds
- SolarSystemAggregateGlyph usage
- Mini glyphs for aggregate interiors

---

## 8. Unresolved Design Questions

1. **Should network nodes show any posture signal at all?** Current behavior colors nodes by health only (teal online / red offline); posture uses gate + turret glyph color and corridor links. A subtle indicator (small pip or badge) might be appropriate without overriding the health color. **Fuel-warning pip now implemented (§6.14)** — low-fuel nodes get an amber dot. Posture signal on nodes remains unimplemented (posture is signaled through gates/turrets/corridors only).

2. **Should gate corridor links become directional?** The spec says no arrows for MVP (§9), but directional flow indicators could add governance clarity later.

3. **What event overlay density is sustainable?** If all 10 gates have recent events, the badge layer might become cluttered. Need a policy: most-recent-per-node only? Aggregate count badges?

4. **Should hover cards replace or supplement always-visible labels?** Pure hover-only loses ambient system identification. A minimal "name chip" (system name in small text below the node center) plus full hover card might be the right compromise.

5. **Is perspective projection needed?** The orbit camera uses the EFMap-reference lookAt model with orthographic projection (no vanishing point, no depth-based size scaling). The lookAt model computes proper view basis vectors with world-up locked to (0,1,0), giving correct turntable orbit with level horizon. True perspective projection would add foreshortening depth cues but would also require Z-sorted rendering and depth-varying symbol sizes — complexity that is not warranted for governance topology at current density.

6. **How should link routing handle crossing?** Straight lines work at current density. At higher density, Bézier curves (spec §6) would prevent overlap. Implement when needed.

---

## Appendix: File Reference

| Path | What | Relevance |
|------|------|-----------|
| `src/components/topology/StrategicMapPanel.tsx` | Map canvas + view wiring + tooltip | Primary edit target |
| `src/components/topology/NodeCluster.tsx` | Per-node SVG cluster + child glyphs | Glyph/hover rendering |
| `src/components/topology/topologyLayout.ts` | Radial slot algorithm + shared types | Layout + types |
| `src/hooks/useMapViewTransform.ts` | 3D orbit camera (yaw/pitch/zoom/pan over raw world coords) | Camera projection |
| `src/components/topology/Glyphs.tsx` | Glyph SVG components | Extend for overlays |
| `src/lib/coordinates.ts` | Coordinate projection | Layout changes |
| `src/data/solarSystemCatalog.ts` | Solar system lookup | Pin resolution |
| `src/hooks/useSpatialPins.ts` | Pin storage | Layout data |
| `src/styles/theme.css` | CSS custom properties | Color tokens |
| `assets/icons/glyphs/` | 5 primary + 4 mini SVG files | Available but unused |
| `assets/icons/overlays/` | 10 overlay SVGs (badges, halos, pips, pulse) | Available but unused |
| `docs/ux/svg-topology-layer-spec.md` | Canonical visual spec | Design authority |
| `docs/ux/svg-asset-audit.md` | Asset validation | Coverage reference |
| `docs/ux/ui-polish-reference-brief.md` | Demo sizing/layout rules | Constraints |
