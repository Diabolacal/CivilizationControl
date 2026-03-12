# Glyph SVG Assets

Coordinate-locked SVG definitions for the five primary topology glyphs defined in
[`docs/ux/svg-topology-layer-spec.md`](../../../docs/ux/svg-topology-layer-spec.md) §2.

These files are **source-of-truth geometry** — paste directly into Figma or import as
React `<svg>` elements. All coordinates are pre-computed; no eyeballing required.

---

## File Inventory

| File | Shape | viewBox | Spec Section |
|------|-------|---------|--------------|
| `network_node.svg` | Hexagon + core dot | 0 0 24 24 | §2.2 row 1 |
| `gate.svg` | Ring with 15° notches | 0 0 24 24 | §2.2 row 2 |
| `turret.svg` | Equilateral triangle | 0 0 24 24 | §2.2 row 3 |
| `trade_post.svg` | Nested squares | 0 0 24 24 | §2.2 row 4 |
| `solar_system_aggregate.svg` | Rounded rectangle | 0 0 32 24 | §6.14 |

---

## Coordinate Tables

### Network Node (hexagon + dot)

- **Center:** (12, 12)
- **Circumradius:** R = 9 (inscribed in 18 × 18 bounding box)
- **Vertex order:** pointy-top, clockwise from 12 o'clock

| Vertex | Angle (from 12 o'clock) | x | y |
|--------|------------------------|-------|-------|
| V0 | 0° (top) | 12 | 3 |
| V1 | 60° (upper-right) | 19.79 | 7.5 |
| V2 | 120° (lower-right) | 19.79 | 16.5 |
| V3 | 180° (bottom) | 12 | 21 |
| V4 | 240° (lower-left) | 4.21 | 16.5 |
| V5 | 300° (upper-left) | 4.21 | 7.5 |

Core dot: `cx=12 cy=12 r=1.5`, `fill="currentColor"`, no stroke.

**Rounding note:** 9 × sin(60°) = 7.7942… → rounded to 7.79. Error ≈ 0.004 units (subpixel at all render sizes).

### Gate (ring with notches)

- **Center:** (12, 12)
- **Radius:** 8 (diameter 16)
- **Notch angle:** 15° centered on the horizontal axis at 3 o'clock and 9 o'clock

| Point | Role | Angle (math CCW from 3 o'clock) | x | y |
|-------|------|------------------------------|-------|-------|
| A | Right notch upper edge | 7.5° | 19.93 | 10.96 |
| B | Left notch upper edge | 172.5° | 4.07 | 10.96 |
| C | Left notch lower edge | 187.5° | 4.07 | 13.04 |
| D | Right notch lower edge | 352.5° | 19.93 | 13.04 |

Arc segments (SVG path):

| Arc | From → To | Route | Span | `large-arc` | `sweep` |
|-----|-----------|-------|------|-------------|---------|
| 1 | A → B | Through 12 o'clock | 165° | 0 | 0 |
| 2 | C → D | Through 6 o'clock | 165° | 0 | 0 |

Notch chord gap: 2 × 8 × sin(7.5°) ≈ 2.09 units → ~1.4 px at 16 px render (barely visible), ~2.1 px at 24 px (clearly visible).

### Turret (equilateral triangle)

- **Centroid:** (12, 12)
- **Side length:** 16
- **Height:** 8√3 ≈ 13.86

| Vertex | Role | x | y |
|--------|------|------|-------|
| Apex | Top (12 o'clock) | 12 | 2.76 |
| BL | Bottom-left | 4 | 16.62 |
| BR | Bottom-right | 20 | 16.62 |

**Orientation note:** Default — apex up. When attached to a Network Node orbit, the triangle rotates so the apex points radially outward from the NWN center.

### Trade Post (nested squares)

| Rectangle | Origin (x, y) | Size | stroke-width |
|-----------|---------------|------|-------------|
| Outer | (4, 4) | 16 × 16 | 2 |
| Inner | (8, 8) | 8 × 8 | 1 |

Both centered at (12, 12). All corners are right angles (no rx/ry). Inner square uses thinner stroke to maintain visual hierarchy.

### Solar System Aggregate (rounded rectangle)

- **viewBox:** 0 0 32 24 (wider than standard glyph grid)
- **Rect origin:** (1, 1), size 30 × 22
- **Corner radius:** rx = ry = 4
- **Stroke-width:** 2

Rect is inset 1 unit on all sides (½ stroke-width) to keep the full stroke within viewBox bounds.

**Interior padding (for UI composition):** The safe interior area for labels and mini glyph count rows starts 3 units inside the rect edge (1 unit rect inset + 2 unit visual padding). This gives a usable content area of approximately 24 × 16 centered within the viewBox.

**Note:** This SVG is the container only. Structure counts, labels, and miniature glyph rows are composed by the React component at runtime, not baked into the SVG. See the [mini glyph set](mini/README.md) for the 10×10 count row glyphs.

---

## Rendering Doctrine

| Property | Value | Rationale |
|----------|-------|-----------|
| `stroke` | `currentColor` | Inherits from CSS — no hardcoded hex values |
| `fill` | `none` | Outline-only (except core dot on Network Node) |
| `stroke-width` | `2` (outer), `1` (inner square only) | Spec §2.4 |
| `stroke-linejoin` | `miter` | Sharp vertices; miter ratio ≤ 2.0 for all shapes (within SVG default limit of 4) |
| `stroke-linecap` | `butt` (gate only) | Clean notch edges at arc endpoints |
| Gradients / shadows | Prohibited | Spec §2.4 — flat monochrome only |

### Miter-Ratio Safety

| Shape | Interior angle | Exterior angle | Miter ratio | Safe? |
|-------|---------------|----------------|-------------|-------|
| Hexagon | 120° | 60° | 1 / sin(30°) = 2.0 | ✅ (< 4) |
| Triangle | 60° | 120° | 1 / sin(60°) ≈ 1.155 | ✅ (< 4) |
| Square | 90° | 90° | 1 / sin(45°) ≈ 1.414 | ✅ (< 4) |

---

## Usage Notes

### Figma Import
Paste the raw SVG content. Figma preserves viewBox, path data, and stroke settings. Set the Figma layer fill/stroke color to match your design token — `currentColor` maps to the layer's stroke attribute.

### React / JSX
Import as inline `<svg>`. Override `stroke` or `fill` via `className` or `style`. Example:

```jsx
<svg viewBox="0 0 24 24" className="text-red-500" aria-label="Turret">
  <polygon points="12,2.76 20,16.62 4,16.62"
    stroke="currentColor" fill="none" strokeWidth="2" strokeLinejoin="miter" />
</svg>
```

### Miniature Variants (16 px)
Scale by setting `width="16" height="16"` on the `<svg>` element. The viewBox handles proportional scaling. At 16 px, gate notches are barely visible (~1.4 px gap) — this is expected and spec-compliant (§2.3 legibility matrix).

---

## Naming Convention

Files in this directory use **snake_case** to match the topology enum identifiers in the spec (e.g., `network_node`, `trade_post`). The parent `assets/icons/` directory uses kebab-case for general icon assets.
