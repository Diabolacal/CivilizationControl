# CivilizationControl — Topology Icon Assets

**Retention:** Carry-forward

This directory holds SVG icon assets for the Strategic Network Map topology layer.

## Export Rules

- **Format:** SVG only. No raster (PNG/JPG/WebP) exports.
- **Base grid:** 24×24 viewBox. All glyphs designed on this grid.
- **Export sizes:** 24, 32, 48, 64 unit variants (viewBox stays 24×24; rendering size varies).
- **Stroke-based:** Outlines, no fills in neutral state. Stroke widths scale proportionally.
- **Color tokens:** Use CSS custom properties (`--glyph-neutral`, `--state-online`, etc.) defined in the SVG Topology Layer Spec. No hardcoded hex values in SVG paths.
- **No embedded animations:** Runtime animation is handled by the React rendering layer.
- **No embedded fonts:** Text in badges is rendered by React, not baked into SVG glyphs.

## Naming Convention

```
<Type>-<Variant>.svg

Examples:
  network-node.svg         # Base glyph
  gate.svg                 # Base glyph (ring with aperture)
  turret.svg               # Base glyph (triangle)
  trade-post.svg           # Base glyph (square with inner square)
  badge-count.svg          # Count badge template
  badge-denied.svg         # Denied badge template
  badge-revenue.svg        # Revenue badge template
  halo-armed.svg           # Turret armed halo overlay
```

## Canonical Spec

All visual language decisions are defined in:
[docs/ux/svg-topology-layer-spec.md](../../docs/ux/svg-topology-layer-spec.md)

Do not add assets that deviate from the spec without updating the spec first.
