/**
 * useMapViewTransform — Orbit camera for the Strategic Network Map.
 *
 * Implements the EFMap-style orbit camera model:
 *   - Camera position computed from spherical coordinates (azimuth, polar, distance)
 *   - lookAt(target) with camera.up locked to world (0,1,0)
 *   - World points are fixed; the camera moves around them
 *   - Projected screen positions are used for billboarded glyphs/labels
 *
 * Camera state:
 *   azimuth (radians) — turntable orbit angle around world Y axis
 *   polar   (radians) — angle from +Y pole. 0 = top-down, π/2 = equatorial/edge-on
 *   distance          — scalar for auto-fit base distance × zoom
 *   targetX/Y/Z       — orbit target in world space (initialized to centroid)
 *
 * Control mapping (matches EFMap):
 *   Left-drag horiz  → azimuth (turntable yaw)
 *   Left-drag vert   → polar angle (pitch above/below)
 *   Right-drag       → pan (translate camera + target in screen plane)
 *   Mouse wheel      → dolly zoom (change distance)
 *
 * Projection pipeline:
 *   1. Compute camera position from spherical coords around target
 *   2. Build lookAt view matrix with up = (0,1,0)
 *   3. Transform world points by view matrix → camera-local coords
 *   4. Orthographic projection (use camera-local x,y; drop z)
 *   5. Scale to fit viewport + pan offset → SVG screen coords
 */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";

export interface WorldBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

interface CameraState {
  /** Azimuth / yaw — turntable angle around world Y (radians). */
  azimuth: number;
  /** Polar angle from +Y axis. 0 = top-down, π/2 = equatorial/edge-on. */
  polar: number;
  /** Zoom multiplier on base distance (1 = auto-fit). Higher = further away. */
  zoom: number;
  /** Screen-space pan offset (SVG units). */
  panX: number;
  panY: number;
}

// Default: edge-on equatorial view matching EFMap's camera at (0,0,5000)→(0,0,0).
// azimuth=π/2 makes the camera look along -Z (same as EFMap), so:
//   screen horizontal = world X (game X, widest axis)
//   screen vertical   = world Y (-game Y, thinnest axis = flat disc)
//   depth             = world Z (-game Z, medium axis)
const INITIAL: CameraState = {
  azimuth: Math.PI / 2,         // camera looks along -Z (EFMap default)
  polar: Math.PI / 2 - 0.001,   // near equatorial/edge-on
  zoom: 1,
  panX: 0,
  panY: 0,
};

const MIN_ZOOM = 0.02;   // diagnostic: allows extreme zoom-out to see full galaxy
const MAX_ZOOM = 50;     // diagnostic: allows close-up inspection
const MIN_POLAR = 0.15;          // near top-down — prevents gimbal lock at polar=0
const MAX_POLAR = Math.PI / 2 - 0.001; // near equatorial / edge-on

const AZIMUTH_SENSITIVITY = 0.005; // radians per client pixel
const POLAR_SENSITIVITY = 0.004;   // radians per client pixel

const CAMERA_STORAGE_KEY = "cc:strategic-map:camera";

function loadPersistedCamera(): { cam: CameraState; locked: boolean } {
  try {
    const raw = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (!raw) return { cam: INITIAL, locked: false };
    const p = JSON.parse(raw);
    return {
      cam: {
        azimuth: typeof p.azimuth === "number" ? p.azimuth : INITIAL.azimuth,
        polar: typeof p.polar === "number" ? p.polar : INITIAL.polar,
        zoom: typeof p.zoom === "number" ? p.zoom : INITIAL.zoom,
        panX: typeof p.panX === "number" ? p.panX : INITIAL.panX,
        panY: typeof p.panY === "number" ? p.panY : INITIAL.panY,
      },
      locked: typeof p.locked === "boolean" ? p.locked : false,
    };
  } catch {
    return { cam: INITIAL, locked: false };
  }
}

export function useMapViewTransform(
  mapWidth: number,
  mapHeight: number,
  worldBounds: WorldBounds,
) {
  const persisted = useRef(loadPersistedCamera());
  const [cam, setCam] = useState<CameraState>(persisted.current.cam);
  const [locked, setLocked] = useState(persisted.current.locked);
  const [dragging, setDragging] = useState(false);

  // Persist camera state + lock to localStorage (debounced)
  const persistTimerRef = useRef<number>(0);
  useEffect(() => {
    window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify({ ...cam, locked }));
      } catch { /* quota exceeded — ignore */ }
    }, 300);
  }, [cam, locked]);
  const dragRef = useRef<{
    mode: "pan" | "orbit";
    startX: number;
    startY: number;
    initAzimuth: number;
    initPolar: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);

  // World centroid — orbit target
  const target = useMemo(() => ({
    x: (worldBounds.min.x + worldBounds.max.x) / 2,
    y: (worldBounds.min.y + worldBounds.max.y) / 2,
    z: (worldBounds.min.z + worldBounds.max.z) / 2,
  }), [worldBounds]);

  // Base scale: auto-fit the widest world extent into the viewport
  const baseScale = useMemo(() => {
    const rangeX = (worldBounds.max.x - worldBounds.min.x) || 1;
    const rangeY = (worldBounds.max.y - worldBounds.min.y) || 1;
    const rangeZ = (worldBounds.max.z - worldBounds.min.z) || 1;
    const maxRange = Math.max(rangeX, rangeY, rangeZ);
    const padding = 0.15;
    const usable = Math.min(mapWidth, mapHeight) * (1 - 2 * padding);
    return usable / maxRange;
  }, [worldBounds, mapWidth, mapHeight]);

  /**
   * Project a fixed 3D world position to 2D screen (SVG) coordinates.
   *
   * Implements the EFMap camera model:
   *  1. Compute camera position from spherical coordinates around target
   *  2. Build lookAt view matrix with up = (0,1,0)
   *  3. Multiply world point by view matrix
   *  4. Use camera-local (x, y), drop z — orthographic
   *  5. Scale + pan → SVG coords
   */
  const transformPoint = useCallback(
    (wx: number, wy: number, wz: number) => {
      const { azimuth, polar, zoom, panX, panY } = cam;

      // --- Camera position from spherical coords ---
      // (Not actually needed for the view matrix — we derive the basis vectors directly)

      // Forward direction: from camera toward target
      // Camera is at: target + radius * (sinPolar*cosAzimuth, cosPolar, sinPolar*sinAzimuth)
      // Forward = normalize(target - camera) = -offset direction
      const sinP = Math.sin(polar);
      const cosP = Math.cos(polar);
      const sinA = Math.sin(azimuth);
      const cosA = Math.cos(azimuth);

      // Camera offset from target (normalized direction, radius doesn't matter for orthographic)
      // Camera looks from this direction toward the target
      // fwd = -offset = ( -sinP*cosA, -cosP, -sinP*sinA ) — normalized
      // But we need the view basis vectors:

      // World up
      const upX = 0, upY = 1, upZ = 0;

      // Forward (camera → target direction, normalized)
      const fwdX = -sinP * cosA;
      const fwdY = -cosP;
      const fwdZ = -sinP * sinA;

      // Right = normalize(cross(forward, worldUp))
      // cross(fwd, up) = (fwdY*upZ - fwdZ*upY, fwdZ*upX - fwdX*upZ, fwdX*upY - fwdY*upX)
      let rightX = fwdY * upZ - fwdZ * upY;  // -cosP*0 - (-sinP*sinA)*1 = sinP*sinA
      let rightY = fwdZ * upX - fwdX * upZ;  // (-sinP*sinA)*0 - (-sinP*cosA)*0 = 0
      let rightZ = fwdX * upY - fwdY * upX;  // (-sinP*cosA)*1 - (-cosP)*0 = -sinP*cosA
      const rLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ) || 1;
      rightX /= rLen;
      rightY /= rLen;
      rightZ /= rLen;

      // Camera up = normalize(cross(right, forward))
      const camUpX = rightY * fwdZ - rightZ * fwdY;
      const camUpY = rightZ * fwdX - rightX * fwdZ;
      const camUpZ = rightX * fwdY - rightY * fwdX;

      // --- View transform: project world point into camera space ---
      // Translate to target-relative
      const dx = wx - target.x;
      const dy = wy - target.y;
      const dz = wz - target.z;

      // Dot with basis vectors → camera-local coords
      const screenX = rightX * dx + rightY * dy + rightZ * dz;
      const screenY = camUpX * dx + camUpY * dy + camUpZ * dz;
      // screenZ = fwdX * dx + fwdY * dy + fwdZ * dz — depth, dropped

      // --- Orthographic projection: scale + pan → SVG viewport ---
      const scale = baseScale * zoom;
      return {
        x: mapWidth / 2 + screenX * scale + panX,
        y: mapHeight / 2 - screenY * scale + panY,  // negate Y: screen-Y is down
      };
    },
    [cam, target, baseScale, mapWidth, mapHeight],
  );

  /** Dolly zoom toward a cursor position (SVG-space coordinates). */
  const zoomAt = useCallback(
    (delta: number, cursorX: number, cursorY: number) => {
      if (locked) return;
      setCam((c) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, c.zoom * (1 + delta)));
        const ratio = newZoom / c.zoom;
        const sx = cursorX - mapWidth / 2;
        const sy = cursorY - mapHeight / 2;
        return {
          ...c,
          zoom: newZoom,
          panX: sx + (c.panX - sx) * ratio,
          panY: sy + (c.panY - sy) * ratio,
        };
      });
    },
    [mapWidth, mapHeight, locked],
  );

  /** Begin a drag interaction. "orbit" for left-button, "pan" for right-button. */
  const startDrag = useCallback(
    (mode: "pan" | "orbit", clientX: number, clientY: number) => {
      if (locked) return;
      dragRef.current = {
        mode,
        startX: clientX,
        startY: clientY,
        initAzimuth: cam.azimuth,
        initPolar: cam.polar,
        initPanX: cam.panX,
        initPanY: cam.panY,
      };
      setDragging(true);
    },
    [cam.azimuth, cam.polar, cam.panX, cam.panY],
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.mode === "pan") {
        const dxSvg = ((clientX - d.startX) / rect.width) * mapWidth;
        const dySvg = ((clientY - d.startY) / rect.height) * mapHeight;
        setCam((c) => ({ ...c, panX: d.initPanX + dxSvg, panY: d.initPanY + dySvg }));
      } else {
        // Orbit: horizontal = azimuth, vertical = polar
        // Azimuth: += so drag-right increases azimuth → scene rotates right (turntable convention)
        // Polar: -= so drag-down decreases polar → tilt toward top-down
        const dxClient = clientX - d.startX;
        const dyClient = clientY - d.startY;
        setCam((c) => ({
          ...c,
          azimuth: d.initAzimuth + dxClient * AZIMUTH_SENSITIVITY,
          polar: Math.max(MIN_POLAR, Math.min(MAX_POLAR, d.initPolar - dyClient * POLAR_SENSITIVITY)),
        }));
      }
    },
    [mapWidth, mapHeight],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setCam(INITIAL);
    setDragging(false);
  }, []);

  const isDefault =
    cam.azimuth === INITIAL.azimuth &&
    cam.polar === INITIAL.polar &&
    cam.zoom === 1 &&
    cam.panX === 0 &&
    cam.panY === 0;

  return {
    transformPoint,
    zoomAt,
    startDrag,
    updateDrag,
    endDrag,
    resetView,
    isDragging: dragging,
    isDefault,
    locked,
    setLocked,
  };
}
