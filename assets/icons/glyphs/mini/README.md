# Mini Glyph SVG Assets

10×10 coordinate-locked glyph definitions for the **Solar System Aggregate structure count row** defined in
[`docs/ux/svg-topology-layer-spec.md`](../../../../docs/ux/svg-topology-layer-spec.md) §6.14.

These are **not** scaled-down exports of the 24×24 set.
Each glyph is designed natively for a 10×10 grid with pixel-aligned coordinates
and rendering adjustments for legibility at small sizes.

---

## File Inventory

| File | Shape | viewBox | Spec Reference |
|------|-------|---------|----------------|
| `network_node_mini.svg` | Hexagon + core dot | 0 0 10 10 | §2.2 row 1, §6.14 |
| `gate_mini.svg` | Ring with 20° notches | 0 0 10 10 | §2.2 row 2, §6.14 |
| `turret_mini.svg` | Equilateral triangle | 0 0 10 10 | §2.2 row 3, §6.14 |
| `trade_post_mini.svg` | Nested squares | 0 0 10 10 | §2.2 row 4, §6.14 |

---

## Coordinate Tables

### Mini Network Node

- **Center:** (5, 5)
- **Circumradius:** ~3.5 (top/bottom), ~3.35 (side vertices)
- **Core dot:** cx=5, cy=5, r=0.75

| Vertex | Position | Exact (R=3.5) | Snapped | Error |
|--------|----------|---------------|---------|-------|
| V0 | Top | (5, 1.5) | (5, 1.5) | 0 |
| V1 | Upper-right | (8.03, 3.25) | (8, 3.5) | 0.25 |
| V2 | Lower-right | (8.03, 6.75) | (8, 6.5) | 0.25 |
| V3 | Bottom | (5, 8.5) | (5, 8.5) | 0 |
| V4 | Lower-left | (1.97, 6.75) | (2, 6.5) | 0.25 |
| V5 | Upper-left | (1.97, 3.25) | (2, 3.5) | 0.25 |

Side lengths after snapping: diagonal sides ≈ 3.61, vertical sides = 3.0 (vs ideal 3.5 all sides).
Visually indistinguishable from a regular hexagon at ≤ 16px.

### Mini Gate

- **Center:** (5, 5)
- **Radius:** 3
- **Notch angle:** 20° (see adjustment rationale below)

| Point | Role | x = 5 ± 3·cos(10°) | y = 5 ∓ 3·sin(10°) | On-circle? |
|-------|------|---------------------|---------------------|------------|
| A | Right, above | 7.95 | 4.48 | ✅ exact |
| B | Left, above | 2.05 | 4.48 | ✅ exact |
| C | Left, below | 2.05 | 5.52 | ✅ exact |
| D | Right, below | 7.95 | 5.52 | ✅ exact |

| Arc | From → To | Route | Span | large-arc | sweep |
|-----|-----------|-------|------|-----------|-------|
| 1 | A → B | Through 12 o'clock | 160° | 0 | 0 |
| 2 | C → D | Through 6 o'clock | 160° | 0 | 0 |

Notch gap (vertical, at 3/9 o'clock): 1.04 units ≈ 1.0 px at 10px render.

Endpoints use exact trig values (not snapped to .5 grid) to keep the ring perfectly circular.
Linecap is `butt` (matching the 24×24 gate) for crisp, sharp notch edges.

### Mini Turret

- **Visual center:** (5, 5.17) — 0.17 below (5, 5) due to pixel-alignment
- **Height:** 5.5 (y: 1.5 → 7)
- **Base width:** 6 (x: 2 → 8)

| Vertex | Position | x | y |
|--------|----------|---|---|
| Apex | Top | 5 | 1.5 |
| BL | Bottom-left | 2 | 7 |
| BR | Bottom-right | 8 | 7 |

Side lengths: diagonal ≈ 6.26, base = 6. Ratio 1.04:1 — reads as equilateral.

### Mini Trade Post

| Rectangle | Origin | Size | stroke-width |
|-----------|--------|------|-------------|
| Outer | (2, 2) | 6 × 6 | 1 |
| Inner | (3.5, 3.5) | 3 × 3 | 0.5 |

Both centered at (5, 5). Inner stroke-width = 0.5 to preserve the 2:1 outer/inner ratio from the 24×24 set.

---

## Rendering Doctrine

| Property | Value | Rationale |
|----------|-------|-----------|
| `stroke` | `currentColor` | Inherits from CSS |
| `fill` | `none` | Outline-only (except Network Node core dot) |
| `stroke-width` | `1` (outer), `0.5` (Trade Post inner only) | See justification below |
| `stroke-linejoin` | `round` | Avoids miter spikes at small render sizes |
| `stroke-linecap` | `butt` (gate only) | Crisp notch edges matching 24×24 gate |
| Gradients / shadows | Prohibited | Flat monochrome per §2.4 |

### Why `stroke-width="1"` (Not Fractional)

The 24×24 set uses `stroke-width="2"` on a 24-unit grid.
Proportional scaling: 2 × (10/24) = 0.833.

**1 was chosen over 0.83 because:**

1. **Subpixel rendering.** At 10px, `stroke-width="0.83"` produces a 0.83px stroke — rendered as a blurred 1px line via anti-aliasing. Using 1.0 produces a crisp 1px line.
2. **Integer grid alignment.** stroke-width=1 means half-stroke = 0.5, which aligns perfectly with the .5-grid coordinate system. A fractional stroke (0.83) shifts the effective edge to non-aligned positions.
3. **Legibility floor.** At 10–12px render size, sub-1px strokes lose too much contrast. 1px is the minimum for reliable visibility across display densities.
4. **Consistent weight.** A uniform stroke-width=1 across all four mini glyphs keeps the set visually cohesive when displayed as a count row inside the Solar System Aggregate container.

**Exception:** Trade Post inner square uses stroke-width=0.5 (the minimum that anti-aliased renderers will display) to maintain the visual hierarchy between the two nesting levels.

---

## Geometry Adjustments vs 24×24 Set

| Glyph | 24×24 | Mini | Rationale |
|-------|-------|------|-----------|
| **Network Node** | R=9, miter join | R≈3.5, round join | Miter spikes at 60° exterior would extend ~0.5px beyond the stroke at 10px — round join eliminates this |
| **Gate notch** | 15° (2.09-unit gap) | 20° (1.04-unit gap) | 15° at r=3 gives 0.79-unit gap (< 1px at 10px) — visually collapses. 20° gives 1.04-unit gap (≈1px at 10px, 1.2px at 12px) |
| **Turret** | Centroid at (12, 12) exact | Centroid at (5, 5.17) | √3 factor makes exact centering impossible on .5 grid; 0.17-unit shift invisible at target sizes |
| **Trade Post inner** | stroke-width=1 | stroke-width=0.5 | Proportional: 1/2 = 0.5/1. At 10px, inner renders as 0.5px anti-aliased line |
| **All glyphs** | `stroke-linejoin="miter"` | `stroke-linejoin="round"` | At 10px, miter points on polygon vertices create aliasing artifacts; round join produces cleaner rendering |

### Gate Notch Adjustment (Detailed)

The 24×24 gate uses 15° notches on a r=8 circle:
- Chord gap = 2 × 8 × sin(7.5°) = 2.09 units → 1.4px at 16px render

Proportional scaling to r=3:
- 15° notch: gap = 2 × 3 × sin(7.5°) = 0.78 units → 0.78px at 10px (**below legibility threshold**)
- 20° notch: gap = 2 × 3 × sin(10°) = 1.04 units → 1.04px at 10px (**minimum legible**)

20° was selected as the smallest angle that produces a ≥ 1px gap at the minimum 10px render size. The notch remains recognizable as the gate's diagnostic feature without dominating the glyph.

**Linecap:** `butt` (not `round`). Round linecap adds a half-stroke-width semicircle to each arc endpoint, which at 10px visually softens the notch edges and can partially close the gap. Butt linecap produces clean, square-cut endpoints matching the 24×24 gate's feel.

**Endpoint precision:** Arc endpoints use exact trigonometric values (7.95, 4.48 etc.) rather than snapping to the .5 grid. Snapped coordinates (8, 4.5) sit 0.04 units off the r=3 circle, which the SVG renderer compensates for by micro-shifting the effective arc center — producing a subtly elliptical ring. Exact values keep the ring perfectly circular.

---

## Legibility Validation

### Silhouette Distinctness at 16px

At 16px render (1.6× native), each glyph must be identifiable by outline alone:

| Glyph | Silhouette | Distinguishing Feature | Distinct at 16px? |
|-------|-----------|----------------------|-------------------|
| **Network Node** | 6-sided polygon + center dot | Only glyph with > 4 sides; dot is unique diagnostic | ✅ 6 vertices visible, dot renders at ~1.2px diameter |
| **Gate** | Broken circle | Only curved shape in the set; notch gaps ~1.6px at 16px | ✅ Ring shape + gaps clearly readable |
| **Turret** | 3-sided polygon, apex up | Only triangle; fewest sides in set | ✅ Three vertices and asymmetric orientation unmistakable |
| **Trade Post** | Nested rectangles | Only glyph with concentric shapes; flat-top distinguishes from hexagon | ✅ Outer and inner squares both visible |

### Pairwise Confusion Risk

| Pair | Risk | Mitigation |
|------|------|-----------|
| Hexagon vs Square | Low | Hexagon has 6 vertices + pointy top vs 4 vertices + flat top; core dot is unique to hexagon |
| Hexagon vs Circle (gate) | None | Straight edges vs curves; hexagon has visible vertices |
| Triangle vs all others | None | Only 3-sided shape; apex orientation is unique directional signal |
| Square vs circle (gate) | Low | Square has sharp/rounded corners but clearly 4-sided; gate has open gaps |

### Why `stroke-width=1` Holds at All Target Sizes

| Render size | Stroke px | Interior (hex) | Interior (triangle) | Verdict |
|-------------|----------|----------------|---------------------|---------|
| 10px | 1.0px | ~3px wide | ~4px base, ~3px high | Tight but legible |
| 12px | 1.2px | ~3.6px wide | ~4.8px base, ~3.6px high | Comfortable |
| 16px | 1.6px | ~4.8px wide | ~6.4px base, ~4.8px high | Clear |

At all target sizes (10–16px), stroke width ≥ 1px ensures anti-aliased rendering produces visible outlines. Below stroke-width=1, renderers on standard-DPI displays may drop the stroke entirely at small sizes.

---

## Usage Notes

### Aggregate Count Row (§6.14)

These mini glyphs appear inside the Solar System Aggregate container
as a horizontal structure count row:

```
┌──────────────────────────────────┐
│  Solar System Name               │
│  ⬡3  ○2  △4  ▢1                 │  ← mini glyph + count
└──────────────────────────────────┘
```

Each mini glyph is followed by an integer count. Spacing between
glyph-count pairs should be ≥ 4px for readability.

### React / JSX

```jsx
<svg viewBox="0 0 10 10" width="10" height="10" className="text-current" aria-hidden="true">
  <polygon points="5,1.5 8,3.5 8,6.5 5,8.5 2,6.5 2,3.5"
    stroke="currentColor" fill="none" strokeWidth="1" strokeLinejoin="round" />
  <circle cx="5" cy="5" r="0.75" fill="currentColor" stroke="none" />
</svg>
<span className="text-xs ml-0.5">3</span>
```

### Naming Convention

Files use `_mini` suffix with **snake_case** (matching the parent `glyphs/` directory convention). The `_mini` suffix distinguishes from the 24×24 canonical set in the parent directory.
