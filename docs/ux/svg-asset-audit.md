# SVG Asset Audit — Topology Layer Primitives

**Retention:** Carry-forward

Strict audit of all SVG primitives in `assets/icons/` against `docs/ux/svg-topology-layer-spec.md` (rev 3) and internal doctrine.

**Audit date:** 2026-03-03
**SVG count:** 19 files across 7 directories
**Spec reference:** svg-topology-layer-spec.md §2 (Symbol Grammar), §3 (State System), §4 (Palette), §5 (Motion), §6.14 (Aggregate), §7 (Export), §9 (Anti-patterns)

---

## Inventory

### Primary Glyphs — `assets/icons/glyphs/` (24×24)

| File | viewBox | Stroke Width | Linecap | Linejoin | Fill | Notes |
|---|---|---|---|---|---|---|
| `network_node.svg` | `0 0 24 24` | 2 (outline), — (dot fill) | — (polygon) | miter | none (outline), currentColor (dot) | Hexagon R=9, dot r=1.5 |
| `gate.svg` | `0 0 24 24` | 2 | butt | — (arcs) | none | Ring r=8, 15° notches |
| `turret.svg` | `0 0 24 24` | 2 | — (polygon) | miter | none | Triangle side=16 |
| `trade_post.svg` | `0 0 24 24` | 2 (outer), 1 (inner) | — (rects) | miter | none | Nested squares 16×16 / 8×8 |
| `solar_system_aggregate.svg` | `0 0 32 24` | 2 | — (rect) | miter | none | Rounded rect rx=4 |

### Mini Glyphs — `assets/icons/glyphs/mini/` (10×10)

| File | viewBox | Stroke Width | Linecap | Linejoin | Fill | Notes |
|---|---|---|---|---|---|---|
| `network_node_mini.svg` | `0 0 10 10` | 1 (outline), — (dot fill) | — (polygon) | round | none (outline), currentColor (dot) | Hexagon R≈3.5, dot r=0.75 |
| `gate_mini.svg` | `0 0 10 10` | 1 | butt | — (arcs) | none | Ring r=3, 20° notches, exact trig endpoints |
| `turret_mini.svg` | `0 0 10 10` | 1 | — (polygon) | round | none | Triangle apex (5,1.5) base y=7 |
| `trade_post_mini.svg` | `0 0 10 10` | 1 (outer), 0.5 (inner) | — (rects) | round | none | Nested squares 6×6 / 3×3 |

### Badge Overlays — `assets/icons/overlays/badges/`

| File | viewBox | Container SW | Symbol SW | Symbol Cap | Fill | Notes |
|---|---|---|---|---|---|---|
| `badge_denied.svg` | `0 0 8 8` | 1 (circle) | 1 (✕ paths) | butt | none | Circle r=3, X mark |
| `badge_warning.svg` | `0 0 8 8` | 1 (circle) | 1 (stem), — (dot fill) | butt | none (stem), currentColor (dot) | Stem y: 2→4.25, dot cy=5.75 r=0.45 |
| `badge_revenue.svg` | `0 0 8 8` | 1 (circle) | 1 (+ paths) | butt | none | Circle r=3, plus mark |
| `badge_count.svg` | `0 0 12 8` | 1 (rect) | 0.75 (+ paths) | butt | none | Rounded rect rx=2, placeholder + |
| `link_count_badge.svg` | `0 0 14 10` | 1 (rect) | 0.75 (× paths) | butt | none | Rounded rect rx=2, placeholder × |

### Halo Overlays — `assets/icons/overlays/halos/` (24×24)

| File | viewBox | Stroke | Fill | Gradient Inner | Gradient Outer | Notes |
|---|---|---|---|---|---|---|
| `halo_armed.svg` | `0 0 24 24` | none | radialGradient | 40% / opacity 0.6 | 100% / opacity 0 | r=14, extends 4u beyond glyph |
| `halo_selected.svg` | `0 0 24 24` | none | radialGradient | 45% / opacity 0.4 | 100% / opacity 0 | r=13, subtler than armed |

### Pip Overlays — `assets/icons/overlays/pips/` (24×24)

| File | viewBox | Stroke | Fill | Radius | Position | Notes |
|---|---|---|---|---|---|---|
| `pip_status.svg` | `0 0 24 24` | none | currentColor | 2 (dia=4) | cx=18, cy=18 | Standard pip per §3.2 |
| `pip_small.svg` | `0 0 24 24` | none | currentColor | 1.5 (dia=3) | cx=18.5, cy=18.5 | Compact variant for aggregates |

### Pulse Overlay — `assets/icons/overlays/pulse/` (24×24)

| File | viewBox | Stroke Width | Stroke | Fill | Radius | Notes |
|---|---|---|---|---|---|---|
| `pulse_base.svg` | `0 0 24 24` | 2 | currentColor | none | 6 (initial) | Static geometry; React animates r + opacity |

---

## Audit Results

### A) Geometry + viewBox Correctness

**Result: PASS — All 19 files correct.**

| Family | Expected viewBox | Actual | Status |
|---|---|---|---|
| Primary glyphs (5) | `0 0 24 24` (or `0 0 32 24` for aggregate) | All match | ✅ |
| Mini glyphs (4) | `0 0 10 10` | All match | ✅ |
| Circular badges (3) | `0 0 8 8` | All match | ✅ |
| Count badge (1) | `0 0 12 8` | Match | ✅ |
| Link count badge (1) | `0 0 14 10` | Match | ✅ |
| Halos (2) | `0 0 24 24` | All match | ✅ |
| Pips (2) | `0 0 24 24` | All match | ✅ |
| Pulse (1) | `0 0 24 24` | Match | ✅ |

All `width`/`height` attributes match their respective viewBox dimensions.

### B) Stroke Doctrine Consistency

**Result: PASS — Consistent within each family.**

| Family | Expected SW | Actual | Status |
|---|---|---|---|
| Primary outlines | 2 | All 2 | ✅ |
| Trade Post inner | 1 (spec §2.2) | 1 | ✅ |
| Aggregate outline | 2 | 2 | ✅ |
| Mini outlines | 1 | All 1 | ✅ |
| Trade Post Mini inner | 0.5 (2:1 ratio) | 0.5 | ✅ ¹ |
| Badge containers | 1 | All 1 | ✅ |
| Badge inner symbols (circle) | 1 | All 1 | ✅ |
| Badge inner symbols (rect) | 0.75 | All 0.75 | ✅ ² |
| Pulse ring | 2 | 2 | ✅ |
| Pips | fill-only | fill-only | ✅ |
| Halos | gradient-fill | gradient-fill | ✅ |

**Notes:**
1. Trade Post Mini inner at 0.5 is subpixel at 10px render but resolves via anti-aliasing at 12px+. Maintains 2:1 ratio with outer stroke — same hierarchy as 24×24 parent (2:1). Documented and intentional.
2. Rect badge inner symbols (0.75) are lighter than circle badge inner symbols (1.0). Circle badges have simple glyphs (✕, !, +) that fill the interior — full container weight works. Rect badges have placeholder marks alongside future count digits — lighter weight prevents visual competition. Two consistent sub-tiers, not random variation.

### C) Caps/Joins Consistency

**Result: PASS — Consistent within each family.**

| Family | Linecap | Linejoin | Status |
|---|---|---|---|
| Primary polygons (node, turret, trade_post) | — (closed shapes) | miter | ✅ |
| Primary gate arcs | butt | — (no corners) | ✅ |
| Primary aggregate rect | — (closed shape) | miter ³ | ✅ |
| Mini polygons/rects (node, turret, trade_post) | — (closed shapes) | round | ✅ ⁴ |
| Mini gate arcs | butt | — (no corners) | ✅ |
| Badge inner symbol paths | butt | — (open paths) | ✅ |

**Notes:**
3. Aggregate `stroke-linejoin="miter"` is a visual no-op (corners are arcs from rx/ry=4), but preserves attribute consistency across the primary glyph family. Kept for uniformity.
4. Mini family uses `round` joins (vs primary's `miter`). This is a deliberate scale-adaptive decision: at 10×10, miter joins at the triangle apex and hexagon vertices produce sharp spikes that dominate the small glyph. Round joins soften vertices for legibility. Gate minis use `butt` (matching primary gate) since arc endpoints require crisp notch termination regardless of scale.

### D) Color Policy

**Result: PASS — Zero hardcoded colors.**

| Check | Status |
|---|---|
| All outline strokes use `stroke="currentColor"` | ✅ |
| All fills use `fill="currentColor"` (pips, dots) or `fill="none"` (outlines) | ✅ |
| No hex colors anywhere | ✅ |
| Halo gradient stops use `stop-color="currentColor"` + `stop-opacity` | ✅ |
| No `style` attributes with inline color values | ✅ |

Runtime theming is fully supported — CSS custom properties on parent elements will cascade via `currentColor` inheritance.

### E) XML Validity and Portability

**Result: PASS — Clean for strict XML parsers.**

| Check | Status |
|---|---|
| No `--` (double-hyphen) inside XML comment bodies | ✅ |
| All comments use `<!-- ... -->` with safe interior text | ✅ |
| No CSS `@keyframes` or `<animate>` (spec §7.1: animation is React-layer) | ✅ |
| Standard SVG 1.1 elements only (`svg`, `polygon`, `circle`, `rect`, `path`, `line`, `defs`, `radialGradient`, `stop`) | ✅ |
| No `xlink:href` (deprecated in SVG 2) | ✅ |
| Valid `xmlns="http://www.w3.org/2000/svg"` on all root elements | ✅ |

Previous sessions fixed `--` issues in `halo_armed.svg` (commit `30bef6a`) and `pulse_base.svg` (commit `bcace44`). No remaining issues.

### F) Clipping/Margins

**Result: PASS — No viewBox clipping. Safe-zone notes below.**

| File | Min Margin to viewBox Edge | Within 2u Safe Zone | Notes |
|---|---|---|---|
| **network_node.svg** | 3.2u (side vertices) | ✅ | Hex inscribed in 18×18 |
| **gate.svg** | 3.0u (ring edges) | ✅ | Ring r=8, stroke=2 |
| **turret.svg** | 1.6u (apex miter tip) | ⚠️ ⁵ | 0.4u past safe zone at apex |
| **trade_post.svg** | 2.6u (corner miter tips) | ✅ | 90° miters shorter than 60° |
| **aggregate** | 0u (stroke to edge) | ✅ ⁶ | Container, not glyph |
| **Mini glyphs** (all 4) | ≥1.0u | ✅ | Round joins limit extension to 0.5u |
| **Circle badges** (3) | 0.5u | ✅ | Badges are overlays |
| **Rect badges** (2) | 0u (stroke to edge) | ✅ ⁶ | Container, not glyph |
| **Halos** (2) | Extends beyond viewBox | ✅ ⁷ | Gradient fades to transparent |
| **Pips** (2) | 4.0u | ✅ | Small fills, well within bounds |
| **Pulse** | 5.0u | ✅ | r=6 initial, React expands |

**Notes:**
5. **Turret apex safe-zone overshoot.** The miter join at the 60° apex extends the stroke to y≈1.6 (0.4u past the 2u safe zone). This does NOT clip at the viewBox boundary (y=0 is the clip edge). The overshoot means halo or badge overlays placed directly above the turret apex would overlap the glyph stroke by ~0.4u. In practice, overlays are positioned at NE corner (badges) or concentrically (halos), so no visual conflict occurs. **No fix required.**
6. **Zero-margin containers.** Aggregate and rect badge containers are inset by exactly half the stroke-width so the outer stroke edge fills the viewBox. This is correct for containers whose interior is populated by the React rendering layer. The stroke is never clipped.
7. **Intentional halo overflow.** Halos extend 2u beyond the 24×24 viewBox (r=14 from center=12). The gradient reaches full transparency before the visible edge, so the clipped region is invisible. This is documented in the SVG comments and in the overlays README.

---

## Corrections Applied

**None.** All 19 SVGs pass all six audit criteria. No modifications were necessary.

---

## Design Decision Registry

The following intentional deviations from a literal reading of the spec are documented for future implementors:

| Decision | Files Affected | Rationale | Spec Reference |
|---|---|---|---|
| Mini joins = `round` (vs primary `miter`) | 3 mini polygon/rect SVGs | Legibility at 10px — miter spikes dominate small geometry | §6.14 (small-scale rendering) |
| Trade Post Mini inner SW = 0.5 | `trade_post_mini.svg` | 2:1 ratio with outer (matching 24×24 hierarchy) | §2.2 (nested squares) |
| Badge symbol weight split (1.0 / 0.75) | 5 badge SVGs | Circle badges: simple symbols carry full weight. Rect badges: lighter symbols yield to count digits | §3.2 (badge labeled element) |
| Revenue badge uses `+` not `$` | `badge_revenue.svg` | Dollar sign too complex at 8×8; plus conveys "value added" and pairs with "+N" count pattern | §3.3 ("$" badge) |
| Halo selected r=13 (vs spec 4–6u beyond glyph) | `halo_selected.svg` | Selection is informational, not alarm. Subtler than armed (r=14). Perceived extent ~2u beyond glyph after gradient fade | §3.2 (4–6 units beyond glyph) |
| Gate notch 20° at mini scale (vs 15° at 24×24) | `gate_mini.svg` | 15° chord gap = 0.79u (sub-pixel at 10px). 20° = 1.04u — minimum for notch legibility | §2.2 (15° notch) / §6.14 |
| Aggregate `stroke-linejoin="miter"` (no-op) | `solar_system_aggregate.svg` | rx/ry=4 makes all corners arcs; attribute kept for family consistency with other primary glyphs | §6.14 |

---

## Coverage Check

| Spec Primitive | SVG File | Status |
|---|---|---|
| Network Node (§2.2) | `network_node.svg` | ✅ |
| Gate (§2.2) | `gate.svg` | ✅ |
| Turret (§2.2) | `turret.svg` | ✅ |
| Trade Post / SSU (§2.2) | `trade_post.svg` | ✅ |
| Solar System Aggregate (§6.14) | `solar_system_aggregate.svg` | ✅ |
| Mini Network Node (§6.14) | `network_node_mini.svg` | ✅ |
| Mini Gate (§6.14) | `gate_mini.svg` | ✅ |
| Mini Turret (§6.14) | `turret_mini.svg` | ✅ |
| Mini Trade Post (§6.14) | `trade_post_mini.svg` | ✅ |
| Badge: Denied (§3.3) | `badge_denied.svg` | ✅ |
| Badge: Warning (§3.3) | `badge_warning.svg` | ✅ |
| Badge: Revenue (§3.3) | `badge_revenue.svg` | ✅ |
| Badge: Count (§3.3) | `badge_count.svg` | ✅ |
| Link Count Badge (§6.14) | `link_count_badge.svg` | ✅ |
| Halo: Armed (§3.3) | `halo_armed.svg` | ✅ |
| Halo: Selected (§3.2) | `halo_selected.svg` | ✅ |
| Pip: Status (§3.2) | `pip_status.svg` | ✅ |
| Pip: Small (§6.14) | `pip_small.svg` | ✅ |
| Pulse: Base (§3.2) | `pulse_base.svg` | ✅ |

**19/19 primitives implemented. No missing assets.**

---

## Not Yet Implemented (Future React Layer)

These spec elements are runtime-only and deliberately have no static SVG:

| Element | Spec Section | Implementation Layer |
|---|---|---|
| Pulse animation (r expand + opacity fade) | §5.2 | React `useSpring` / CSS transition |
| Badge appear/dismiss animation | §5.2 | React scale/opacity transition |
| Halo fade-in | §5.3 | React opacity transition |
| Structure-to-Node anchor lines | §2.5 | React `<line>` with dynamic endpoints |
| Gate pair links (cross-system / intra-system) | §2.5, §6.10 | React `<line>` / `<path>` dynamic |
| Solar System boundary | §6.9 | React `<rect>` with dynamic dimensions |
| Aggregate interior (label + mini glyph row) | §6.14 | React composition of mini SVGs + text |
| Tooltip | §3.2 | React DOM overlay |
