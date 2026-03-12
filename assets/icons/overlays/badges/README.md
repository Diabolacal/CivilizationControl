# Overlay Badge SVG Assets

Coordinate-locked SVG definitions for the topology badge overlay primitives defined in
[`docs/ux/svg-topology-layer-spec.md`](../../../../docs/ux/svg-topology-layer-spec.md) §3.2–§3.3.

Badges are **shape + symbol** overlays — they communicate state through geometry, not color alone.
Color is applied at runtime via CSS custom properties (`--event-denied`, `--event-revenue`, `--state-warning`).
These SVGs define only the monochrome structural primitives.

---

## File Inventory

| File | Shape | viewBox | Spec State |
|------|-------|---------|-----------|
| `badge_denied.svg` | Circle + ✕ | 0 0 8 8 | Denied (hostile blocked) |
| `badge_warning.svg` | Circle + ! | 0 0 8 8 | Fuel Low / Degraded |
| `badge_revenue.svg` | Circle + + | 0 0 8 8 | Toll Collected / Trade Settled |
| `badge_count.svg` | Rounded rect + + placeholder | 0 0 12 8 | Structure count ("+N") |
| `link_count_badge.svg` | Rounded rect + × placeholder | 0 0 14 10 | Link multiplicity ("×N") |

---

## Render Intent

| Badge | When Displayed | Position | Duration | Color Token |
|-------|---------------|----------|----------|-------------|
| **Denied** | Gate blocks a hostile | Glyph NE corner | 300ms pulse + 2s hold | `--event-denied` (red) |
| **Warning** | NWN fuel below threshold | Glyph NE corner | Persistent while condition active | `--state-warning` (amber) |
| **Revenue** | Toll collected or trade settled | Glyph NE corner | 200ms pulse + 1.5s hold | `--event-revenue` (green) |
| **Count** | Collapsed structure count | Glyph NE corner | Persistent | Inherits glyph stroke color |
| **Link Count** | Cross-system link multiplicity | Link midpoint | Persistent | Inherits link color |

---

## Coordinate Tables

### Circular Badges (8×8 viewBox)

All circular badges share the same container:

| Element | Coordinates | Properties |
|---------|------------|-----------|
| Circle outline | cx=4, cy=4, r=3 | stroke-width=1, fill=none |

**Badge Denied (✕):**

| Element | From | To | stroke-width |
|---------|------|-----|-------------|
| Stroke 1 (↘) | (2, 2) | (6, 6) | 1 |
| Stroke 2 (↙) | (6, 2) | (2, 6) | 1 |

Strokes intersect at center (4, 4). Each arm spans 4 units diagonal — fills the 4×4 safe area within the circle interior (r=3, circle inner edge at 1 unit from center).

**Badge Warning (!):**

| Element | Coordinates | Properties |
|---------|------------|-----------|
| Exclamation stroke | (4, 2) → (4, 4.5) | stroke-width=1, linecap=butt |
| Exclamation dot | cx=4, cy=6, r=0.5 | fill=currentColor, no stroke |

Stroke length: 2.5 units (vertical). Dot gap: 1 unit between stroke bottom (4.5) and dot top (5.5). Dot center at y=6 keeps it 1 unit above the circle bottom (y=7).

**Badge Revenue (+):**

| Element | From | To | stroke-width |
|---------|------|-----|-------------|
| Horizontal | (2, 4) | (6, 4) | 1 |
| Vertical | (4, 2) | (4, 6) | 1 |

Strokes intersect at center (4, 4). Each arm: 4 units.

### Count Badge (12×8 viewBox)

| Element | Coordinates | Properties |
|---------|------------|-----------|
| Rounded rect | x=0.5, y=0.5, width=11, height=7, rx=2, ry=2 | stroke-width=1 |
| Plus horizontal | (4, 4) → (8, 4) | stroke-width=0.75 |
| Plus vertical | (6, 2) → (6, 6) | stroke-width=0.75 |

Rect inset: 0.5 units (half stroke-width) to keep stroke within viewBox.
Plus mark is centered at (6, 4) — the rectangle's geometric center.

### Link Count Badge (14×10 viewBox)

| Element | Coordinates | Properties |
|---------|------------|-----------|
| Rounded rect | x=0.5, y=0.5, width=13, height=9, rx=2, ry=2 | stroke-width=1 |
| × stroke 1 (↘) | (5, 3) → (9, 7) | stroke-width=0.75 |
| × stroke 2 (↙) | (9, 3) → (5, 7) | stroke-width=0.75 |

Multiplication mark centered at (7, 5) — the rectangle's geometric center.
× arms span 4 units diagonal, within a 4×4 area.

---

## Styling Doctrine

| Property | Circular (8×8) | Count rect (12×8, 14×10) | Rationale |
|----------|---------------|-------------------------|-----------|
| `stroke` | `currentColor` | `currentColor` | Runtime color via CSS token |
| `fill` | `none` | `none` | Outline-only (except warning dot) |
| Container `stroke-width` | `1` | `1` | Consistent weight across badge types |
| Symbol `stroke-width` | `1` | `0.75` | Thinner in rects to avoid crowding padded interior |
| `stroke-linecap` | `butt` | `butt` | Crisp mark endpoints |
| `stroke-linejoin` | (not applicable — no polygon joins) | (not applicable) | — |
| Gradients / shadows | Prohibited | Prohibited | Flat monochrome per §2.4 |

### Why Symbol stroke-width=0.75 in Count Badges

Count and link badges are containers — the primary visual element is the rounded rectangle border, not the placeholder symbol inside. Using stroke-width=1 for the interior mark makes it compete with the border for visual weight. 0.75 provides clear secondary hierarchy while remaining legible at 10–14px render.

### Why "+" Instead of "$" for Revenue

The spec (§3.3) uses "$" as the revenue badge symbol. At 8×8 viewBox (rendered at ~8–12px on screen), a dollar sign requires:
- An S-curve (minimum 4 control points)
- Two horizontal crossbars

This is too complex to resolve at the target size. A plus mark "+":
- Uses two simple strokes — maximum clarity at any size
- Communicates "value added / positive" — semantically aligned with revenue
- Pairs naturally with the count badge pattern ("+3")
- Matches ISA-101 practice: prefer simple geometric marks over typographic symbols at small scales

The runtime component can render "$" as text alongside the badge for larger display contexts.

---

## How to Render Numbers

**Numbers are NOT baked into badge SVGs.**

The SVG files provide only the container shape (circle or rounded rect) and a placeholder symbol. Actual numeric values ("+3", "×2", etc.) are rendered by the React component as:

1. An overlaid `<text>` element positioned at the badge center, or
2. A DOM `<span>` positioned via CSS absolute/relative layout

The placeholder marks (+, ×) in the count badges indicate the *type* of numeric display expected. When a number is rendered, the placeholder is hidden:

```jsx
// Example: badge_count with runtime number
<g className="badge-count" transform="translate(18, -2)">
  {/* Container from badge_count.svg */}
  <rect x="0.5" y="0.5" width="11" height="7" rx="2" ry="2"
    stroke="currentColor" fill="none" strokeWidth="1" />
  {/* Runtime number replaces placeholder + */}
  <text x="6" y="5.5" textAnchor="middle" fontSize="5"
    fill="currentColor" fontFamily="monospace">+3</text>
</g>
```

For circular badges (denied, warning, revenue), the symbol IS the content — no number replaces it.

---

## Positioning on Glyph

Per spec §3.2, badges are positioned at the **NE corner** of the parent glyph (default).

For a 24×24 glyph, the badge anchor point is approximately:

| Badge Type | Anchor (relative to glyph viewBox) | Offset |
|------------|-----------------------------------|--------|
| Circular (8×8) | glyph top-right corner | `translate(16, -4)` |
| Count (12×8) | glyph top-right corner | `translate(14, -4)` |
| Link count (14×10) | link midpoint | centered on midpoint |

These are starting positions — the React component may adjust to prevent overlap when multiple badges are active.

Z-order: Badges render **above** all glyphs and halos (spec §3.2).

---

## Naming Convention

Files use **snake_case** consistent with the `glyphs/` directory convention. The `badge_` prefix groups semantic badges; `link_count_badge` denotes the link-specific variant.
