# CivilizationControl Node Icon Pack Spec

## Purpose

These icons are for EVE Frontier / CivilizationControl-style infrastructure maps. They are designed for node maps, structure control panels, topology views, and compact status lists where a user needs to recognize infrastructure families quickly.

The set uses simple SVG primitives, `currentColor`, and overlay-safe geometry. The base icons describe structure type; state, size, warnings, selection, and emphasis are applied by the rendering layer.

## Usage Model

- Icons are stroke-first SVGs.
- Color is controlled by CSS through `currentColor`.
- Runtime state is applied by the rendering layer, not baked into each icon file.
- Size badges, warning pips, selection rings, halos, and pulse effects are overlays.
- Base icons should stay reusable and monochrome unless a product deliberately wants fixed-color exports.
- SVG files should be treated as source assets. Preserve viewBox and stroke relationships when copying or adapting them.

## File Inventory

All downloadable source SVGs currently live under `assets/icons/`. The icon pack should include the base glyphs, mini glyphs, and overlay primitives listed below.

### Node-Level Glyphs

| File | Family / Meaning | viewBox | Stroke Width | Fill / Stroke Policy | Notes |
|---|---|---:|---:|---|---|
| `assets/icons/glyphs/printer.svg` | Printer / production | `0 0 24 24` | `2` | `stroke="currentColor"`, `fill="none"` | Diamond body with vertical interior line. Badge-safe padding preserved. |
| `assets/icons/glyphs/refinery.svg` | Refinery / processing | `0 0 24 24` | `2` | `stroke="currentColor"`, `fill="none"` | Diamond body with horizontal interior line. Shares the industry silhouette family. |
| `assets/icons/glyphs/assembler.svg` | Assembler / manufacturing | `0 0 24 24` | `2`, `1.5` | `stroke="currentColor"`, `fill="none"` | Diamond body with interlocking interior rectangles. |
| `assets/icons/glyphs/berth.svg` | Berth / dock | `0 0 24 24` | `2`, `1.5` | `stroke="currentColor"`, `fill="none"` | Dock/cradle silhouette with a lighter keel bar. |
| `assets/icons/glyphs/relay.svg` | Relay / support infrastructure | `0 0 24 24` | `2` | `stroke="currentColor"`, `fill="none"` | Mast/pylon silhouette. No size badge is baked into the SVG. |
| `assets/icons/glyphs/nursery.svg` | Nursery / cradle family | `0 0 24 24` | `2`, `1.5` | `stroke="currentColor"`, `fill="none"` | Arch and single lower support line. |
| `assets/icons/glyphs/hangar.svg` | Hangar / shelter | `0 0 24 24` | `2`, `1.5` | `stroke="currentColor"`, `fill="none"` | Circular shell with upper opening line. Used by the app catalogue for shelter / heavy shelter. |
| `assets/icons/glyphs/nest.svg` | Nest / cradle family | `0 0 24 24` | `2`, `1.5` | `stroke="currentColor"`, `fill="none"` | Arch with double lower support lines. |

### Macro / Topology Glyphs

| File | Family / Meaning | viewBox | Stroke Width | Fill / Stroke Policy | Notes |
|---|---|---:|---:|---|---|
| `assets/icons/glyphs/network_node.svg` | Network node / infrastructure anchor | `0 0 24 24` | `2` | Hexagon uses `stroke="currentColor"`, `fill="none"`; core dot uses `fill="currentColor"` | Point-up hexagon with center dot. |
| `assets/icons/glyphs/gate.svg` | Gate / passage corridor endpoint | `0 0 24 24` | `2` | `stroke="currentColor"`, `fill="none"` | Ring made from two arcs with horizontal aperture notches. |
| `assets/icons/glyphs/turret.svg` | Turret / defense | `0 0 24 24` | `2` | `stroke="currentColor"`, `fill="none"` | Equilateral triangle. UI may rotate it when pointing outward from a node. |
| `assets/icons/glyphs/trade_post.svg` | Trade post / storage | `0 0 24 24` | `2`, `1` | `stroke="currentColor"`, `fill="none"` | Nested square container. The app also labels this family as storage. |
| `assets/icons/glyphs/solar_system_aggregate.svg` | Solar system aggregate / collapsed group | `0 0 32 24` | `2` | `stroke="currentColor"`, `fill="none"` | Rounded rectangle container. Mini glyph rows and counts are composed by UI code. |

### Mini Glyphs

Mini variants are intended for compact aggregate rows and dense topology summaries. They use a `10x10` grid rather than scaled-down `24x24` paths.

| File | Family / Meaning | viewBox | Stroke Width | Fill / Stroke Policy | Notes |
|---|---|---:|---:|---|---|
| `assets/icons/glyphs/mini/network_node_mini.svg` | Mini network node | `0 0 10 10` | `1` | Outline uses `stroke="currentColor"`, `fill="none"`; dot uses `fill="currentColor"` | Small hexagon with center dot. |
| `assets/icons/glyphs/mini/gate_mini.svg` | Mini gate | `0 0 10 10` | `1` | `stroke="currentColor"`, `fill="none"` | Ring arcs use wider relative notches for small-size legibility. |
| `assets/icons/glyphs/mini/turret_mini.svg` | Mini turret | `0 0 10 10` | `1` | `stroke="currentColor"`, `fill="none"` | Triangle with round joins for small-size clarity. |
| `assets/icons/glyphs/mini/trade_post_mini.svg` | Mini trade post / storage | `0 0 10 10` | `1`, `0.5` | `stroke="currentColor"`, `fill="none"` | Nested squares. Inner square keeps a lighter stroke. |

### Overlay Inventory

Overlays are intended to be composed by UI code rather than edited into base icons. Use them as separate layers so one icon can show several independent facts at once.

| File | Overlay Type | viewBox | Stroke Width | Fill / Stroke Policy | Notes |
|---|---|---:|---:|---|---|
| `assets/icons/overlays/badges/badge_denied.svg` | Denied badge | `0 0 8 8` | `1` | `stroke="currentColor"`, `fill="none"` | Circle plus X mark. Runtime color normally communicates denial or blocked access. |
| `assets/icons/overlays/badges/badge_warning.svg` | Warning badge | `0 0 8 8` | `1` | Circle and stem use `stroke="currentColor"`; dot uses `fill="currentColor"` | Circle plus exclamation mark. Warning state remains separate from base glyph. |
| `assets/icons/overlays/badges/badge_revenue.svg` | Revenue / positive event badge | `0 0 8 8` | `1` | `stroke="currentColor"`, `fill="none"` | Circle plus plus mark. UI may pair this with event copy or counts. |
| `assets/icons/overlays/badges/badge_count.svg` | Count badge template | `0 0 12 8` | `1`, `0.75` | `stroke="currentColor"`, `fill="none"` | Rounded rectangle plus placeholder. Numbers should be rendered by UI code. |
| `assets/icons/overlays/badges/link_count_badge.svg` | Link count badge template | `0 0 14 10` | `1`, `0.75` | `stroke="currentColor"`, `fill="none"` | Rounded rectangle times placeholder. Counts should be rendered by UI code. |
| `assets/icons/overlays/halos/halo_armed.svg` | Armed / defense halo | `0 0 24 24` | none | Radial gradient uses `stop-color="currentColor"`; circle has `stroke="none"` | Soft emphasis behind the glyph. Radius intentionally extends beyond the base glyph footprint. |
| `assets/icons/overlays/halos/halo_selected.svg` | Selected halo | `0 0 24 24` | none | Radial gradient uses `stop-color="currentColor"`; circle has `stroke="none"` | Softer than armed halo. Use for UI focus or selected state. |
| `assets/icons/overlays/pips/pip_status.svg` | Standard status pip | `0 0 24 24` | none | `fill="currentColor"`, `stroke="none"` | 4-unit diameter pip at the lower-right area of the 24x24 grid. |
| `assets/icons/overlays/pips/pip_small.svg` | Compact status pip | `0 0 24 24` | none | `fill="currentColor"`, `stroke="none"` | 3-unit diameter pip for aggregate or compact contexts. |
| `assets/icons/overlays/pulse/pulse_base.svg` | Pulse base | `0 0 24 24` | `2` | `stroke="currentColor"`, `fill="none"` | Static ring geometry. Expansion and opacity animation should be runtime behavior. |

## Node-Level Catalogue Inventory

The current node-level catalogue covers these structure families:

| Catalogue Family | Source SVG | App Label Notes |
|---|---|---|
| Printer | `assets/icons/glyphs/printer.svg` | Mini, standard, and heavy examples are represented through M/H overlays. |
| Refinery | `assets/icons/glyphs/refinery.svg` | Standard and heavy examples are represented through overlay badges. |
| Assembler | `assets/icons/glyphs/assembler.svg` | Uses a distinct interior assembly mark inside the industry diamond. |
| Berth | `assets/icons/glyphs/berth.svg` | Mini, standard, and heavy examples are represented through M/H overlays. |
| Relay | `assets/icons/glyphs/relay.svg` | Support-family mast/pylon. |
| Nursery | `assets/icons/glyphs/nursery.svg` | Cradle-family arch. |
| Hangar / Shelter | `assets/icons/glyphs/hangar.svg` | The app catalogue labels this shape as Shelter and Heavy Shelter. |
| Nest | `assets/icons/glyphs/nest.svg` | Cradle-family arch with double lower support. |

## Macro / Topology Catalogue Inventory

The macro topology catalogue covers these families:

| Catalogue Family | Source SVG | Notes |
|---|---|---|
| Network node | `assets/icons/glyphs/network_node.svg` and `assets/icons/glyphs/mini/network_node_mini.svg` | Network anchor and compact aggregate variant. |
| Gate | `assets/icons/glyphs/gate.svg` and `assets/icons/glyphs/mini/gate_mini.svg` | Passage endpoint and compact aggregate variant. |
| Turret | `assets/icons/glyphs/turret.svg` and `assets/icons/glyphs/mini/turret_mini.svg` | Defense structure and compact aggregate variant. |
| Trade post / storage | `assets/icons/glyphs/trade_post.svg` and `assets/icons/glyphs/mini/trade_post_mini.svg` | Storage / commerce structure and compact aggregate variant. |
| Solar system aggregate | `assets/icons/glyphs/solar_system_aggregate.svg` | Container for collapsed topology groups. |

## Visual Grammar

- Primary glyphs use a `24x24` grid.
- Mini glyphs use a `10x10` grid.
- The solar system aggregate uses a wider `32x24` container grid.
- Icons use `currentColor` for strokes and small filled dots.
- Base glyphs are mostly `fill="none"`.
- Outer padding is preserved for badges, pips, selection rings, and halos.
- Standard structures have no size badge.
- Mini structures use an `M` badge.
- Heavy structures use an `H` badge.
- The warning pip is separate from the base glyph.
- The selected ring or halo is separate from the base glyph.
- Badge text and count numbers should be UI-rendered text, not baked into the base SVG.

## State Color Reference

The current app defines these topology color tokens in `src/styles/theme.css` and uses them in the catalogue rendering layer:

| State | Current Token | Current Value | Usage |
|---|---|---|---|
| Neutral | `--topo-glyph-neutral` | `hsl(210, 8%, 55%)` | Default glyph stroke in the icon catalogue. |
| Online | `--topo-state-online` | `hsl(175, 45%, 50%)` | Online / operating state. |
| Offline | `--topo-state-offline` | `#ef4444` | Offline / hard-stop state. |
| Selected | `--topo-selected` | `#ea580c` | Selection ring or selected halo. |
| Warning | `--topo-state-warning` | `#f59e0b` | Warning tone and warning pip. |

Additional topology tokens exist for events, armed/defense state, links, background, and grid lines. The icon files themselves do not depend on those token names; they inherit whatever CSS color the rendering layer provides.

## Reuse Notes

- SVGs should be treated as source assets.
- Recolor icons by setting CSS `color` on the parent element.
- Do not bake state colors into copied SVGs unless you deliberately want fixed-color icons.
- Keep state overlays separate from base icon files.
- If rendering at small sizes, preserve the viewBox and stroke-width relationships.
- If converting to React components, keep `currentColor`, `fill="none"` for outline geometry, and the original viewBox.
- If exporting to a design tool, keep the base shape and overlay layers separately named.

## LLM Recreation Notes

An LLM, designer, or developer recreating this set should:

- Use the same viewBox for each family.
- Preserve the stroke widths listed above.
- Preserve badge-safe and pip-safe padding around base glyphs.
- Use `currentColor`.
- Avoid hardcoded colors in base SVG files.
- Keep base icons separate from overlays.
- Avoid unnecessary detail that reduces legibility at 18-24 px.
- Keep node-level industry glyphs visually related but distinguishable through simple interior marks.
- Keep warning pips, selected rings, halos, and M/H badges outside the base SVG geometry.

## Attribution and Licensing

These assets are part of CivilizationControl. If reused, attribution is appreciated. Check the repository license before redistribution.

## Scope and Limitations

This spec covers the current static SVG assets and visual grammar for the CivilizationControl node icon pack. Runtime layout, drag behavior, wallet actions, live read paths, transaction logic, production-line logic, and Cloudflare deployment behavior are outside the icon pack.

This document does not create download links, package archives, or app UI changes.
