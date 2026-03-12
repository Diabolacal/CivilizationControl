# Overlay Primitives

SVG overlay primitives for the CivilizationControl topology layer, implementing
the overlay channels defined in
[`docs/ux/svg-topology-layer-spec.md`](../../../docs/ux/svg-topology-layer-spec.md) §3.2.

Overlays are composited **on top of** (or behind) base structure glyphs to encode
runtime state. They use `currentColor` for monochrome portability — semantic colors
are applied via CSS custom properties at runtime.

---

## Directory Structure

```
overlays/
├── badges/          # Count, warning, denied, revenue badges (8×8, 12×8, 14×10)
│   └── README.md
├── halos/           # Soft radial emphasis rings (24×24)
│   ├── halo_armed.svg
│   └── halo_selected.svg
├── pips/            # Micro-status indicators (24×24)
│   ├── pip_status.svg
│   └── pip_small.svg
├── pulse/           # Event expansion ring (24×24, static geometry)
│   └── pulse_base.svg
└── README.md        # (this file)
```

---

## Z-Order Stacking

Spec §3.2 defines a strict z-order for overlay composition. Bottom to top:

```
  ┌─────────────────────────┐  ← Highest (front)
  │  5. Badge               │  Count, warning, denied, revenue
  │  4. Pulse ring          │  Transient event expansion
  │  3. Status pip          │  Persistent micro-status
  │  2. Glyph               │  Base structure glyph (24×24)
  │  1. Halo                │  Soft radial emphasis
  │  0. Link lines          │  Gate-to-gate, structure-to-node
  └─────────────────────────┘  ← Lowest (back)
```

In React/SVG, lower z-order elements are rendered first (earlier in DOM order).
The compositing order in a `<g>` group for a single structure would be:

```jsx
<g className="structure" transform={`translate(${x}, ${y})`}>
  {/* 1. Halo (behind glyph) */}
  {hasHalo && <use href="#haloArmed" />}
  {/* 2. Glyph */}
  <use href="#networkNode" />
  {/* 3. Pip (above glyph) */}
  {hasPip && <use href="#pipStatus" />}
  {/* 4. Pulse (above pip, behind badge) */}
  {pulseActive && <use href="#pulseBase" className="animate-pulse" />}
  {/* 5. Badge (topmost) */}
  {hasBadge && <use href="#badgeWarning" />}
</g>
```

---

## Pip Primitives

### pip_status.svg

| Property | Value | Rationale |
|----------|-------|-----------|
| viewBox | 0 0 24 24 | Matches base glyph grid |
| Center | (18, 18) | 5 o'clock relative to glyph center (12, 12) |
| Radius | 2 | 4-unit diameter per spec §3.2 |
| Fill | currentColor | Runtime: green (healthy), amber (warning), red (critical) |
| Stroke | none | Solid fill — no outline for micro-indicators |

**Position math:**
Glyph center = (12, 12). 5 o'clock direction = +45° from horizontal = (+6, +6) from center.
Pip center at (18, 18). Pip outer edge at (20, 20) — within the 24-unit viewBox (2-unit margin).

**Why (18, 18)?**
The hex glyph's lower-right vertex is at (19.79, 16.5). Pip center at (18, 18)
places it just below and inward of that vertex — visible but not overlapping
the glyph stroke. At the triangle glyph's bottom-right vertex (20, 16.62),
the pip sits slightly left and below. For the square (corner at 20, 20),
the pip's outer edge exactly touches the glyph corner — acceptable overlap.

### pip_small.svg

| Property | Value | Rationale |
|----------|-------|-----------|
| Center | (18.5, 18.5) | Slightly further into corner for compact contexts |
| Radius | 1.5 | 3-unit diameter — 75% of standard pip |

Used inside Solar System Aggregate containers (§6.14) where standard 4-unit pips
are too large relative to mini glyphs.

---

## Halo Primitives

Both halos use `<radialGradient>` per the spec's "soft radial gradient" requirement.
No CSS blur, no SVG filters. The gradient produces a smooth fade from visible inner
zone to transparent outer edge.

### halo_armed.svg

| Property | Value | Rationale |
|----------|-------|-----------|
| viewBox | 0 0 24 24 | Matches base glyph grid |
| Center | (12, 12) | Glyph center |
| Circle radius | 14 | Extends ~4 units beyond glyph boundary |
| Gradient inner stop | offset=40%, opacity=0.6 | Dense amber zone visible around glyph |
| Gradient outer stop | offset=100%, opacity=0 | Smooth fade to transparent |
| Gradient ID | `haloArmedGradient` | Unique per halo type for `<defs>` coexistence |

**Radius math:**
Glyph maximum extent from center: hexagon R=9 + half stroke ≈ 10 units.
Halo circle r=14 → extends 4 units beyond glyph edge (spec lower bound: 4–6).
Outer edge at 12+14=26 exceeds the 24-unit viewBox by 2 units per side.
This is intentional: the clipped zone has opacity approaching 0, so the visual
cutoff is imperceptible. The alternative (r=12 to stay in viewBox) would make
the halo too tight — indistinguishable from a filled glyph.

**Gradient profile:**
- 0%–40% of radius: `currentColor` at opacity 0.6 (visible core)
- 40%–100% of radius: linear fade from 0.6 → 0 (soft edge)

At 40% of r=14, the visible halo starts at r≈5.6 from center — well inside
the glyph boundary. The glyph stroke (opaque) paints over this zone, so the
visible halo effect only appears in the 10–14 unit ring outside the glyph.

### halo_selected.svg

| Property | Value | Difference from Armed |
|----------|-------|-----------------------|
| Circle radius | 13 | Tighter (1 unit less) — selection is informational, not posture |
| Inner stop opacity | 0.4 | Less intense — should not compete with armed halo |
| Inner stop offset | 45% | Slightly wider fade zone for softer appearance |
| Gradient ID | `haloSelectedGradient` | Distinct ID |

Selection halo is deliberately subtler than armed halo. If both states are
active simultaneously (turret selected while in Defense Mode), armed halo wins
per color hierarchy (§4.2: amber > selection highlight).

---

## Pulse Primitive

### pulse_base.svg

| Property | Value | Rationale |
|----------|-------|-----------|
| viewBox | 0 0 24 24 | Matches base glyph grid |
| Center | (12, 12) | Glyph center |
| Initial radius | 6 | Starts just inside glyph boundary |
| Stroke width | 2 | Matches glyph stroke weight |
| Fill | none | Ring, not disc |
| Stroke | currentColor | Runtime: red (denied), green (revenue) |

**This SVG is static geometry only.** No `<animate>` or `<animateTransform>` tags.

The React component drives animation:

| Parameter | Start | End | Duration |
|-----------|-------|-----|----------|
| `r` | 6 | 16 | 200–300ms |
| `opacity` | 1 | 0 | Same |

**Why r=6 start?**
The pulse should appear to emanate from the glyph itself. r=6 is just inside
the glyph boundary (hexagon R=9, gate r=8). Starting smaller (e.g., r=2) would
create a visible "growing dot" before reaching glyph size — undesirable.

**Why r=16 end?**
16 = glyph extent (10) + 6 units beyond. This exceeds the halo armed radius
(14) by 2 units, ensuring the pulse visually "passes through" the halo before
fading. 16 units from center = 4 from viewBox edge — the 2-unit stroke at
low opacity fades naturally at the border.

---

## Using Overlays from `<defs>`

For rendering performance, import these SVGs into a shared `<defs>` block
and reference via `<use>`:

```jsx
<svg>
  <defs>
    {/* Import halo gradient definitions */}
    <radialGradient id="haloArmedGradient" cx="50%" cy="50%" r="50%">
      <stop offset="40%" stopColor="var(--state-armed)" stopOpacity="0.6" />
      <stop offset="100%" stopColor="var(--state-armed)" stopOpacity="0" />
    </radialGradient>
  </defs>

  {/* Per-structure rendering */}
  <g transform="translate(100, 200)">
    <circle cx="12" cy="12" r="14" fill="url(#haloArmedGradient)" />
    {/* ... glyph, pip, badge ... */}
  </g>
</svg>
```

When using `<defs>`, replace `currentColor` in gradient stops with CSS
custom property references (e.g., `var(--state-armed)`) for direct color control.

---

## Color Application

All overlay SVGs use `currentColor` or `fill="currentColor"`. Runtime color
is applied by setting the CSS `color` property on the parent element:

| Overlay | Color Token | Visual |
|---------|------------|--------|
| Pip (healthy) | `--state-online` | Muted teal |
| Pip (warning) | `--state-warning` | Amber |
| Pip (critical) | `--state-offline` | Red |
| Halo (armed) | `--state-armed` | Amber |
| Halo (selected) | (application-defined) | Blue/white |
| Pulse (denied) | `--event-denied` | Red |
| Pulse (revenue) | `--event-revenue` | Green |

---

## Naming Convention

Files use **snake_case** consistent with the `glyphs/` directory.
Subdirectories group by overlay type: `pips/`, `halos/`, `pulse/`, `badges/`.
