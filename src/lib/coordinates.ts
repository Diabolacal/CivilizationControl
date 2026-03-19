/**
 * Coordinate transform utilities.
 *
 * World API solar-system coordinates use an EVE-convention (x, y, z) frame.
 * For 2D topology rendering in the browser, we apply the documented transform:
 *
 *   render_x = raw_x
 *   render_y = raw_z    (swap Y/Z)
 *   (invert)  render_y = -raw_y → becomes raw_z, so: (x, z, -y)
 *
 * Concretely: (x, y, z) → (x, z, -y)
 *   - Keep X as horizontal
 *   - Use Z as vertical (but inverted via -y swap)
 *
 * Reference: https://frontier.scetrov.live/develop/coordinate_systems/
 *
 * NOTE: This transform is for World API solar-system coordinates only.
 * It does NOT apply the `1 << 255` offset correction used for on-chain
 * absolute assembly locations — those are a separate concern.
 */

import type { RenderCoordinate, SolarSystem } from "@/types/domain";

/**
 * Transform raw World API solar-system coordinates to 2D render space.
 *
 * (x, y, z) → (x, z, -y)
 *   render_x = raw_x
 *   render_y = raw_z  (with Y-axis inversion accounted for by using -raw_y for depth)
 *
 * The actual 2D projection drops the depth axis. We keep X and use Z
 * (which maps to the "horizontal plane" in EVE's coordinate system)
 * as the vertical render axis, with Y inversion to match expected
 * player mental model (north = up).
 */
export function toRenderCoord(raw: {
  x: number;
  y: number;
  z: number;
}): RenderCoordinate {
  return {
    x: raw.x,
    // (x, y, z) -> (x, z, -y): use z as render-y, negate for screen convention
    y: -raw.z,
  };
}

/**
 * Project a solar system to 2D render coordinates.
 */
export function solarSystemToRender(system: SolarSystem): RenderCoordinate {
  return toRenderCoord(system.location);
}

/**
 * Normalize an array of render coordinates into a viewport-fitted [0, 1] space.
 *
 * Uses **uniform scaling** (same scale for X and Y) so relative distances and
 * orientations between points are preserved — this is what makes the topology
 * feel spatially truthful rather than rubber-banded to fill the rectangle.
 *
 * The point cloud is centered within the usable area, with the tighter axis
 * getting extra margin automatically.
 *
 * @param aspectRatio  Width / height of the target viewport (default 1 = square)
 */
export function normalizeCoords(
  points: RenderCoordinate[],
  padding = 0.05,
  aspectRatio = 1,
): RenderCoordinate[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ x: 0.5, y: 0.5 }];

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const usable = 1 - 2 * padding;

  // Account for the viewport aspect ratio: if the viewport is wider than tall,
  // the horizontal axis has more usable space per unit than the vertical.
  // Normalize both axes by the SAME scale factor so distances are preserved.
  const scaleX = usable / rangeX;
  const scaleY = usable / rangeY;
  // Pick whichever axis is tighter — the other will have leftover margin.
  const scale = Math.min(scaleX * aspectRatio, scaleY) / aspectRatio;

  const fittedW = rangeX * scale;
  const fittedH = rangeY * scale;
  // Center the fitted cloud within the usable area
  const offsetX = padding + (usable - fittedW) / 2;
  const offsetY = padding + (usable - fittedH) / 2;

  return points.map((p) => ({
    x: offsetX + (p.x - minX) * scale,
    y: offsetY + (p.y - minY) * scale,
  }));
}
