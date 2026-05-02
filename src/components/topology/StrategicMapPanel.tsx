/**
 * StrategicMapPanel — Topology visualization for the command overview.
 *
 * Renders network nodes and their co-located structures as positioned symbols
 * in a hybrid SVG + HTML overlay canvas. Uses the project's own topology
 * glyphs (§2 of SVG spec) and the overlay state system (§3).
 *
 * Color doctrine (§4):
 *   - Gray = neutral infrastructure (most structures, most of the time)
 *   - Muted teal = online / healthy (unremarkable; NOT green)
 *   - Amber = armed / defensive / warning
 *   - Red = offline / denied  |  Green = economic events ONLY
 *
 * Layout doctrine (§6):
 *   - NWN is gravitational center of each cluster
 *   - Radial children: Gates first (12 o'clock CW), TradePosts, Turrets
 *   - Turrets: 1-3 individual, 4+ collapse with +N badge
 */

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Network } from "lucide-react";
import type { NetworkNodeGroup, SpatialPin, Structure, SignalEvent } from "@/types/domain";
import { usePostureState } from "@/hooks/usePosture";
import { useMapViewTransform } from "@/hooks/useMapViewTransform";
import type { WorldBounds } from "@/hooks/useMapViewTransform";
import { getSolarSystemById, getSolarSystemCatalog } from "@/lib/solarSystemCatalog";
import { computeRuntimeMs, getFuelEfficiency } from "@/lib/fuelRuntime";
import { PostureControl } from "@/components/PostureControl";
import { NodeClusterSvg } from "@/components/topology/NodeCluster";
import { assignChildSlots } from "@/components/topology/topologyLayout";
import type { ChildSlot, Posture } from "@/components/topology/topologyLayout";


interface StrategicMapPanelProps {
  nodeGroups: NetworkNodeGroup[];
  pins: SpatialPin[];
  structures: Structure[];
  isConnected: boolean;
  signals?: SignalEvent[];
  /** Callback fired when posture transition state changes. */
  onPostureTransitionChange?: (isTransitioning: boolean) => void;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

/**
 * Convert game-raw API coordinates to EFMap-equivalent world coords.
 *
 * World API returns game-raw Z-up coords (gx, gy, gz).
 * EFMap applies: DB = (gx, gz, -gy), then scene = (DB.x, DB.z, -DB.y).
 * Net game→scene: (gx, -gy, -gz).
 *
 * This gives us:
 *   world.x = gx   → horizontal (screen left/right)
 *   world.y = -gy  → vertical  (screen up/down, thin axis = flat disc)
 *   world.z = -gz  → depth     (into/out of screen)
 */
function gameToWorld(loc: { x: number; y: number; z: number }) {
  return { x: loc.x, y: -loc.y, z: -loc.z };
}

/** Resolve fixed 3D world positions for each network node. */
function computeWorldPositions(
  nodeGroups: NetworkNodeGroup[],
  pins: SpatialPin[],
): Array<{ group: NetworkNodeGroup; world: { x: number; y: number; z: number }; pinned: boolean }> {
  const pinMap = new Map(pins.map((p) => [p.networkNodeId, p]));
  const positioned: Array<{
    group: NetworkNodeGroup;
    world: { x: number; y: number; z: number };
    pinned: boolean;
  }> = [];
  const unpositioned: NetworkNodeGroup[] = [];

  for (const group of nodeGroups) {
    const pin = pinMap.get(group.node.objectId);
    if (pin) {
      const system = getSolarSystemById(pin.solarSystemId);
      if (system) {
        positioned.push({
          group,
          world: gameToWorld(system.location),
          pinned: true,
        });
        continue;
      }
    }
    unpositioned.push(group);
  }

  if (unpositioned.length > 0) {
    if (positioned.length > 0) {
      // Place below positioned content in world Y (vertical axis in EFMap basis)
      let minX = Infinity, maxX = -Infinity, minY = Infinity;
      for (const p of positioned) {
        if (p.world.x < minX) minX = p.world.x;
        if (p.world.x > maxX) maxX = p.world.x;
        if (p.world.y < minY) minY = p.world.y;
      }
      const rangeX = maxX - minX || 1;
      const belowY = minY - rangeX * 0.3;
      const gap = unpositioned.length > 1 ? rangeX * 0.8 / (unpositioned.length - 1) : 0;
      const startX = (minX + maxX) / 2 - (rangeX * 0.8) / 2;
      for (let i = 0; i < unpositioned.length; i++) {
        positioned.push({
          group: unpositioned[i],
          world: {
            x: unpositioned.length === 1 ? (minX + maxX) / 2 : startX + gap * i,
            y: belowY,
            z: 0,
          },
          pinned: false,
        });
      }
    } else {
      // No positioned nodes at all — spread along X at z=0
      const gap = unpositioned.length > 1 ? 100 / (unpositioned.length - 1) : 0;
      for (let i = 0; i < unpositioned.length; i++) {
        positioned.push({
          group: unpositioned[i],
          world: { x: gap * i, y: 0, z: 0 },
          pinned: false,
        });
      }
    }
  }

  return positioned;
}

const MAP_WIDTH = 900;
const MAP_HEIGHT = 440;
const CHILD_RADIUS = 55;
/** SVG-space inset to shorten corridor lines so they stop outside the gate glyph (24×24). */
const GATE_CORRIDOR_INSET = 14;

export function StrategicMapPanel({
  nodeGroups,
  pins,
  structures,
  isConnected,
  signals = [],
  onPostureTransitionChange,
  onSelectNode,
  selectedNodeId = null,
}: StrategicMapPanelProps) {
  const [showStarfield, setShowStarfield] = useState(() => {
    try {
      return localStorage.getItem("cc:strategic-map:starfield") === "1";
    } catch { return false; }
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const diagCanvasRef = useRef<HTMLCanvasElement>(null);
  const pointerStateRef = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  });

  // Persist starfield toggle
  useEffect(() => {
    try { localStorage.setItem("cc:strategic-map:starfield", showStarfield ? "1" : "0"); }
    catch { /* ignore */ }
  }, [showStarfield]);

  const firstGateId = useMemo(() => {
    for (const group of nodeGroups) {
      if (group.gates.length > 0) return group.gates[0].objectId;
    }
    return undefined;
  }, [nodeGroups]);
  const { data: onChainPosture } = usePostureState(firstGateId);
  const posture: Posture = onChainPosture === "defense" ? "defensive" : "commercial";

  const pinMap = useMemo(
    () => new Map(pins.map((p) => [p.networkNodeId, p])),
    [pins],
  );

  // Low-fuel detection: same 24h threshold as AttentionAlerts
  const LOW_RUNTIME_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const lowFuelNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of nodeGroups) {
      const fuel = group.node.fuel;
      if (!fuel?.isBurning) continue;
      const eff = getFuelEfficiency(fuel.typeId);
      if (eff === undefined) continue;
      const runtimeMs = computeRuntimeMs(fuel.quantity, fuel.burnRateMs, eff);
      if (runtimeMs !== undefined && runtimeMs < LOW_RUNTIME_THRESHOLD_MS) {
        ids.add(group.node.objectId);
      }
    }
    return ids;
  }, [nodeGroups]);

  // 1. Fixed 3D world positions for each node
  const worldPositions = useMemo(
    () => computeWorldPositions(nodeGroups, pins),
    [nodeGroups, pins],
  );

  // 2. World bounds for auto-fit
  const worldBounds: WorldBounds = useMemo(() => {
    if (worldPositions.length === 0) {
      return { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 0, z: 1 } };
    }
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const { world: w } of worldPositions) {
      if (w.x < min.x) min.x = w.x;
      if (w.y < min.y) min.y = w.y;
      if (w.z < min.z) min.z = w.z;
      if (w.x > max.x) max.x = w.x;
      if (w.y > max.y) max.y = w.y;
      if (w.z > max.z) max.z = w.z;
    }
    return { min, max };
  }, [worldPositions]);

  const {
    transformPoint,
    zoomAt, startDrag, updateDrag, endDrag,
    resetView, isDragging, isDefault,
    locked, setLocked,
  } = useMapViewTransform(MAP_WIDTH, MAP_HEIGHT, worldBounds);

  // 3. Project world → screen (recomputed when camera or positions change)
  const screenPositions = useMemo(
    () => worldPositions.map(({ group, world, pinned }) => {
      const { x, y } = transformPoint(world.x, world.y, world.z);
      return { group, x, y, pinned };
    }),
    [worldPositions, transformPoint],
  );

  // Lookup maps for topology-aware gate slotting (screen-space)
  const gateToNodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of nodeGroups) {
      for (const gate of group.gates) map.set(gate.objectId, group.node.objectId);
    }
    return map;
  }, [nodeGroups]);

  const nodePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const pos of screenPositions) map.set(pos.group.node.objectId, { x: pos.x, y: pos.y });
    return map;
  }, [screenPositions]);

  const nodeChildSlots = useMemo(() => {
    const slotMap = new Map<string, ChildSlot[]>();
    for (const pos of screenPositions) {
      slotMap.set(
        pos.group.node.objectId,
        assignChildSlots(pos.group, pos.x, pos.y, nodePositionMap, gateToNodeMap, CHILD_RADIUS),
      );
    }
    return slotMap;
  }, [screenPositions, nodePositionMap, gateToNodeMap]);

  // Gate-to-gate corridor positions + link state (screen-space)
  const gateEdges = useMemo(() => {
    const gatePositionMap = new Map<string, { x: number; y: number }>();
    for (const pos of screenPositions) {
      for (const slot of nodeChildSlots.get(pos.group.node.objectId) ?? []) {
        if (slot.kind === "gate") {
          gatePositionMap.set(slot.objectId, { x: pos.x + slot.dx, y: pos.y + slot.dy });
        }
      }
    }
    // Build status lookup from structures array
    const statusMap = new Map<string, string>();
    for (const s of structures) {
      statusMap.set(s.objectId, s.status);
    }

    const seen = new Set<string>();
    const edges: Array<{
      x1: number; y1: number; x2: number; y2: number;
      linkState: "healthy" | "offline" | "degraded";
    }> = [];
    for (const s of structures) {
      if (s.type !== "gate" || !s.linkedGateId) continue;
      const key = [s.objectId, s.linkedGateId].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      const from = gatePositionMap.get(s.objectId);
      const to = gatePositionMap.get(s.linkedGateId);
      if (!from || !to) continue;

      // Derive link state from both gate statuses
      const statusA = statusMap.get(s.objectId) ?? "neutral";
      const statusB = statusMap.get(s.linkedGateId) ?? "neutral";
      let linkState: "healthy" | "offline" | "degraded" = "healthy";
      if (statusA === "offline" || statusB === "offline") {
        linkState = "offline";
      } else if (statusA === "warning" || statusB === "warning") {
        linkState = "degraded";
      }

      // Shorten endpoints so the line stops outside the gate glyph
      // Gate glyph is 24×24 SVG units; inset stops just outside the visual boundary
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const inset = Math.min(GATE_CORRIDOR_INSET, len / 2 - 1);
      if (len < 2) continue; // gates nearly coincident — skip degenerate line
      const ux = dx / len;
      const uy = dy / len;

      edges.push({
        x1: from.x + ux * inset,
        y1: from.y + uy * inset,
        x2: to.x - ux * inset,
        y2: to.y - uy * inset,
        linkState,
      });
    }
    return edges;
  }, [screenPositions, structures, nodeChildSlots]);

  // Non-passive wheel handler for zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (locked) return;
      const rect = el.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
      const svgY = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;
      zoomAt(e.deltaY > 0 ? -0.08 : 0.08, svgX, svgY);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomAt, locked]);

  // Starfield: draw all 24.5k solar systems as faint dots on canvas (optional)
  useEffect(() => {
    const canvas = diagCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    if (!showStarfield) return;

    ctx.fillStyle = "rgba(140, 200, 255, 0.25)";
    const catalog = getSolarSystemCatalog();
    for (const sys of catalog) {
      const w = gameToWorld(sys.location);
      const { x, y } = transformPoint(w.x, w.y, w.z);
      if (x >= -10 && x <= MAP_WIDTH + 10 && y >= -10 && y <= MAP_HEIGHT + 10) {
        ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
    }
  }, [transformPoint, showStarfield]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointerStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      if (locked) return;
      if (e.button === 0) startDrag("orbit", e.clientX, e.clientY);
      else if (e.button === 2) startDrag("pan", e.clientX, e.clientY);
    },
    [startDrag, locked],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const dx = e.clientX - pointerStateRef.current.startX;
      const dy = e.clientY - pointerStateRef.current.startY;
      if (!pointerStateRef.current.moved && Math.hypot(dx, dy) > 6) {
        pointerStateRef.current.moved = true;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      updateDrag(e.clientX, e.clientY, rect);
    },
    [updateDrag],
  );

  const handlePointerUp = useCallback(() => {
    endDrag();
    pointerStateRef.current = {
      startX: 0,
      startY: 0,
      moved: false,
    };
  }, [endDrag]);

  const handleSelectNode = useCallback(
    (nodeId: string, button: number) => {
      if (button !== 0) return;
      if (pointerStateRef.current.moved) return;
      onSelectNode?.(nodeId);
    },
    [onSelectNode],
  );

  return (
    <div className="w-full bg-[var(--card)] border border-border rounded overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/5 z-10 relative">
        <div className="flex items-center gap-3">
          <Network className="w-4 h-4 text-primary opacity-80" />
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-foreground mb-0.5">
              Strategic Network
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Infrastructure Posture &amp; Topology Control
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <PostureControl nodeGroups={nodeGroups} isConnected={isConnected} inline onTransitionChange={onPostureTransitionChange} />
        </div>
      </div>

      {/* Canvas (SVG + HTML overlay) — view-controlled */}
      <div
        ref={canvasRef}
        className="relative bg-[var(--topo-background)] pb-3 select-none"
        style={{ height: MAP_HEIGHT, cursor: locked ? "default" : isDragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--topo-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--topo-grid) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Defense mode overlay */}
        <div
          className="absolute inset-0 bg-destructive/3 pointer-events-none z-[1] transition-opacity duration-[800ms] ease-in-out"
          style={{ opacity: posture === "defensive" ? 1 : 0 }}
        />

        {/* DIAGNOSTIC: universe point cloud canvas — behind SVG topology */}
        <canvas
          ref={diagCanvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: "contain" }}
        />

        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
            {/* Gate corridor lines — shortened endpoints, link-state-aware */}
            {(() => {
                // Compute cascade delay range from corridor midpoints (left-to-right)
                const midXs = gateEdges.map(e => (e.x1 + e.x2) / 2);
                const minMidX = Math.min(...midXs, 0);
                const rangeMidX = (Math.max(...midXs, 1) - minMidX) || 1;
                return gateEdges.map((edge, i) => {
                let stroke: string;
                let dasharray: string | undefined;
                let width = 2;
                let opacity = 0.55;
                if (posture === "defensive") {
                  // Defense override: amber, slightly thicker
                  stroke = "var(--topo-link-defense)";
                  width = 2.5;
                  opacity = 0.6;
                } else if (edge.linkState === "offline") {
                  stroke = "var(--topo-state-offline)";
                  dasharray = "4 4";
                  opacity = 0.4;
                } else if (edge.linkState === "degraded") {
                  stroke = "var(--topo-state-warning)";
                  dasharray = "6 3";
                  opacity = 0.5;
                } else {
                  stroke = "var(--topo-link-healthy)";
                }
                // Cascade delay: left-to-right sweep by midpoint X (0–800ms)
                const cascadeMs = gateEdges.length > 1
                  ? (((edge.x1 + edge.x2) / 2 - minMidX) / rangeMidX) * 800
                  : 0;
                return (
                  <line
                    key={`gate-edge-${i}`}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={stroke}
                    strokeWidth={width}
                    strokeDasharray={dasharray}
                    opacity={opacity}
                    style={{
                      transition: "stroke 800ms ease-in-out, opacity 800ms ease-in-out",
                      transitionDelay: `${Math.round(cascadeMs)}ms`,
                    }}
                    pointerEvents="none"
                  />
                );
                });
            })()}

            {/* Unassigned row separator line — screen-space midpoint between groups */}
            {screenPositions.some((p) => p.pinned) &&
              screenPositions.some((p) => !p.pinned) && (() => {
                const pinnedMaxY = Math.max(...screenPositions.filter(p => p.pinned).map(p => p.y));
                const unpinnedMinY = Math.min(...screenPositions.filter(p => !p.pinned).map(p => p.y));
                const sepY = (pinnedMaxY + unpinnedMinY) / 2;
                return (
                  <line
                    x1={MAP_WIDTH * 0.05}
                    y1={sepY}
                    x2={MAP_WIDTH * 0.95}
                    y2={sepY}
                    stroke="var(--topo-link-idle)"
                    strokeWidth="0.5"
                    strokeDasharray="3 6"
                    opacity="0.2"
                    pointerEvents="none"
                  />
                );
              })()}

            {/* Node clusters — screen-space positioned, billboarded */}
            {(() => {
              const xs = screenPositions.map(p => p.x);
              const minX = Math.min(...xs);
              const rangeX = Math.max(...xs) - minX || 1;
              return screenPositions.map(({ group, x, y }) => {
                const slots = nodeChildSlots.get(group.node.objectId) ?? [];
                // Cascade delay: left-to-right sweep across projected screen X (0–800ms)
                const cascadeDelay = screenPositions.length > 1
                  ? ((x - minX) / rangeX) * 800
                  : 0;
                return (
                  <NodeClusterSvg
                    key={group.node.objectId}
                    group={group}
                    cx={x}
                    cy={y}
                    posture={posture}
                    childSlots={slots}
                    collapsedTurretCount={group.turrets.length > 3 ? group.turrets.length : 0}
                    childRadius={CHILD_RADIUS}
                    cascadeDelayMs={cascadeDelay}
                    hasWarning={lowFuelNodeIds.has(group.node.objectId)}
                    selected={selectedNodeId === group.node.objectId}
                    onSelectNode={handleSelectNode}
                  />
                );
              });
            })()}

            {/* Minimal system labels — upright, screen-space anchored */}
            {screenPositions.map(({ group, x, y }) => {
              const pin = pinMap.get(group.node.objectId);
              const label = pin?.solarSystemName ?? group.node.name.replace(/\s+[0-9a-f]{8}$/, "");
              return (
                <text
                  key={`lbl-${group.node.objectId}`}
                  x={x}
                  y={y + CHILD_RADIUS + 20}
                  fill="var(--topo-neutral)"
                  fontSize="9"
                  textAnchor="middle"
                  opacity="0.5"
                  className="pointer-events-none select-none"
                  style={{ fontFamily: "var(--font-mono, monospace)" }}
                >
                  {label.length > 22 ? label.slice(0, 20) + "\u2026" : label}
                </text>
              );
            })}
        </svg>

        {/* Event overlay badges — revenue ($) and blocked (✕) signals */}
        <EventOverlayLayer
          signals={signals}
          screenPositions={screenPositions}
          nodeChildSlots={nodeChildSlots}
        />

        {/* Map controls — quiet affordances, top-right corner */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setShowStarfield((s) => !s); }}
            className={`text-[9px] font-mono bg-background/50 rounded px-1.5 py-0.5 transition-colors ${
              showStarfield
                ? "text-muted-foreground/70"
                : "text-muted-foreground/40 hover:text-muted-foreground/70"
            }`}
            title="Toggle universe starfield"
          >
            stars
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLocked((l) => !l); }}
            className={`text-[9px] font-mono bg-background/50 rounded px-1.5 py-0.5 transition-colors ${
              locked
                ? "text-muted-foreground/70"
                : "text-muted-foreground/40 hover:text-muted-foreground/70"
            }`}
            title={locked ? "Unlock map interactions" : "Lock map view"}
          >
            lock
          </button>
          {!isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); resetView(); }}
              className="text-[9px] font-mono text-muted-foreground/40 hover:text-muted-foreground/70 bg-background/50 rounded px-1.5 py-0.5 transition-colors"
              title="Reset view"
            >
              reset
            </button>
          )}
        </div>

        {/* Empty state */}
        {screenPositions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm text-muted-foreground/50">
              Connect wallet to view network topology
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event Overlay Layer ─────────────────────────────────

/** Time (ms) that event badges remain visible after appearing. */
const OVERLAY_HOLD_MS = 2000;

interface ActiveOverlay {
  id: string;
  variant: "revenue" | "blocked";
  svgX: number;
  svgY: number;
  expiresAt: number;
}

function EventOverlayLayer({
  signals,
  screenPositions,
  nodeChildSlots,
}: {
  signals: SignalEvent[];
  screenPositions: Array<{ group: NetworkNodeGroup; x: number; y: number; pinned: boolean }>;
  nodeChildSlots: Map<string, ChildSlot[]>;
}) {
  const [overlays, setOverlays] = useState<ActiveOverlay[]>([]);
  const seenRef = useRef(new Set<string>());

  // Build lookup: structure objectId → screen position
  const structurePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const pos of screenPositions) {
      const slots = nodeChildSlots.get(pos.group.node.objectId) ?? [];
      for (const slot of slots) {
        map.set(slot.objectId, { x: pos.x + slot.dx, y: pos.y + slot.dy });
      }
    }
    return map;
  }, [screenPositions, nodeChildSlots]);

  // Watch for new qualifying signals and create overlays
  useEffect(() => {
    const now = Date.now();
    const newOverlays: ActiveOverlay[] = [];

    for (const signal of signals) {
      if (signal.variant !== "revenue" && signal.variant !== "blocked") continue;
      if (seenRef.current.has(signal.id)) continue;
      seenRef.current.add(signal.id);

      const objId = signal.relatedObjectId ?? signal.secondaryObjectId;
      if (!objId) continue;
      const pos = structurePositionMap.get(objId);
      if (!pos) continue;

      newOverlays.push({
        id: signal.id,
        variant: signal.variant,
        svgX: pos.x,
        svgY: pos.y,
        expiresAt: now + OVERLAY_HOLD_MS,
      });
    }

    if (newOverlays.length > 0) {
      setOverlays((prev) => [...prev, ...newOverlays]);
    }
  }, [signals, structurePositionMap]);

  // Expire overlays
  useEffect(() => {
    if (overlays.length === 0) return;
    const nextExpiry = Math.min(...overlays.map((o) => o.expiresAt));
    const delay = Math.max(50, nextExpiry - Date.now());
    const timer = window.setTimeout(() => {
      const now = Date.now();
      setOverlays((prev) => prev.filter((o) => o.expiresAt > now));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [overlays]);

  // Cap seenRef growth — prune oldest entries beyond 200
  useEffect(() => {
    if (seenRef.current.size > 200) {
      const arr = Array.from(seenRef.current);
      seenRef.current = new Set(arr.slice(arr.length - 100));
    }
  }, [signals]);

  if (overlays.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      preserveAspectRatio="xMidYMid meet"
    >
      {overlays.map((o) => {
        const isRevenue = o.variant === "revenue";
        const remaining = o.expiresAt - Date.now();
        const opacity = remaining < 400 ? remaining / 400 : 1;
        return (
          <g key={o.id}>
            {/* Pulse ring */}
            <circle
              cx={o.svgX}
              cy={o.svgY - 18}
              r="8"
              fill="none"
              stroke={isRevenue ? "hsl(142, 70%, 45%)" : "hsl(0, 80%, 55%)"}
              strokeWidth="1.5"
              opacity={opacity * 0.5}
            >
              <animate attributeName="r" from="6" to="14" dur={isRevenue ? "0.6s" : "0.5s"} repeatCount="1" fill="freeze" />
              <animate attributeName="opacity" from={String(opacity * 0.6)} to="0" dur={isRevenue ? "0.6s" : "0.5s"} repeatCount="1" fill="freeze" />
            </circle>
            {/* Badge background */}
            <circle
              cx={o.svgX}
              cy={o.svgY - 18}
              r="7"
              fill={isRevenue ? "hsl(142, 70%, 45%)" : "hsl(0, 80%, 55%)"}
              opacity={opacity * 0.85}
            />
            {/* Badge glyph */}
            <text
              x={o.svgX}
              y={o.svgY - 14.5}
              textAnchor="middle"
              fill="white"
              fontSize="9"
              fontWeight="700"
              fontFamily="monospace"
              opacity={opacity}
            >
              {isRevenue ? "$" : "\u2715"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
