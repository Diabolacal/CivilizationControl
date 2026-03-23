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

import { useMemo } from "react";
import { Network } from "lucide-react";
import type { NetworkNodeGroup, SpatialPin, Structure } from "@/types/domain";
import { usePostureState } from "@/hooks/usePosture";
import { getSolarSystemById } from "@/lib/solarSystemCatalog";
import { solarSystemToRender, normalizeCoords } from "@/lib/coordinates";
import {
  NetworkNodeGlyph,
  GateGlyph,
  TradePostGlyph,
  TurretGlyph,
} from "@/components/topology/Glyphs";
import { PostureControl } from "@/components/PostureControl";


interface StrategicMapPanelProps {
  nodeGroups: NetworkNodeGroup[];
  pins: SpatialPin[];
  structures: Structure[];
  isConnected: boolean;
}

/** Place nodes in the SVG viewport. */
function computeNodePositions(
  nodeGroups: NetworkNodeGroup[],
  pins: SpatialPin[],
  width: number,
  height: number,
): Array<{ group: NetworkNodeGroup; x: number; y: number; pinned: boolean }> {
  const pinMap = new Map(pins.map((p) => [p.networkNodeId, p]));
  const positioned: Array<{
    group: NetworkNodeGroup;
    raw: { x: number; y: number };
  }> = [];
  const unpositioned: NetworkNodeGroup[] = [];

  for (const group of nodeGroups) {
    const pin = pinMap.get(group.node.objectId);
    if (pin) {
      const system = getSolarSystemById(pin.solarSystemId);
      if (system) {
        const rendered = solarSystemToRender(system);
        positioned.push({ group, raw: rendered });
        continue;
      }
    }
    unpositioned.push(group);
  }

  const result: Array<{ group: NetworkNodeGroup; x: number; y: number; pinned: boolean }> = [];
  const padding = 0.1;

  if (positioned.length > 0) {
    const rawCoords = positioned.map((p) => p.raw);
    const normalized = normalizeCoords(rawCoords, padding, width / height);
    for (let i = 0; i < positioned.length; i++) {
      result.push({
        group: positioned[i].group,
        x: normalized[i].x * width,
        y: normalized[i].y * height,
        pinned: true,
      });
    }
  }

  if (unpositioned.length > 0) {
    const startX = padding * width;
    const usableW = width * (1 - 2 * padding);
    const yPosition = positioned.length > 0 ? height * 0.85 : height * 0.5;
    const gap = unpositioned.length > 1 ? usableW / (unpositioned.length - 1) : 0;

    for (let i = 0; i < unpositioned.length; i++) {
      result.push({
        group: unpositioned[i],
        x: unpositioned.length === 1 ? width / 2 : startX + gap * i,
        y: yPosition,
        pinned: false,
      });
    }
  }

  return result;
}

/** Radial offset for child structures around a network node center. */
function childOffset(
  index: number,
  total: number,
  radius: number,
): { dx: number; dy: number } {
  if (total === 0) return { dx: 0, dy: 0 };
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    dx: Math.cos(angle) * radius,
    dy: Math.sin(angle) * radius,
  };
}

type Posture = "commercial" | "defensive";

const MAP_WIDTH = 900;
const MAP_HEIGHT = 440;
const CHILD_RADIUS = 55;

export function StrategicMapPanel({
  nodeGroups,
  pins,
  structures,
  isConnected,
}: StrategicMapPanelProps) {
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

  const positions = useMemo(
    () => computeNodePositions(nodeGroups, pins, MAP_WIDTH, MAP_HEIGHT),
    [nodeGroups, pins],
  );

  // Compute real gate-to-gate edge positions from linkedGateId data
  const gateEdges = useMemo(() => {
    // Map each gate to its rendered position based on parent node + radial offset
    const gatePositionMap = new Map<string, { x: number; y: number }>();
    for (const pos of positions) {
      const orderedChildren = [
        ...pos.group.gates,
        ...pos.group.storageUnits,
        ...pos.group.turrets.slice(0, pos.group.turrets.length > 3 ? 1 : pos.group.turrets.length),
      ];
      const total = orderedChildren.length;
      // Gates are first in the ordering
      for (let i = 0; i < pos.group.gates.length; i++) {
        const { dx, dy } = childOffset(i, total, CHILD_RADIUS);
        gatePositionMap.set(pos.group.gates[i].objectId, {
          x: pos.x + dx,
          y: pos.y + dy,
        });
      }
    }

    // Collect deduplicated edge pairs
    const seen = new Set<string>();
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (const s of structures) {
      if (s.type !== "gate" || !s.linkedGateId) continue;
      const key = [s.objectId, s.linkedGateId].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      const from = gatePositionMap.get(s.objectId);
      const to = gatePositionMap.get(s.linkedGateId);
      if (from && to) {
        edges.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
      }
    }
    return edges;
  }, [positions, structures]);

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
          {/* Posture mode selector (integrated — Figma-style chip tabs) */}
          <PostureControl nodeGroups={nodeGroups} isConnected={isConnected} inline />
        </div>
      </div>

      {/* Canvas (SVG + HTML overlay) */}
      <div
        className="relative bg-[var(--topo-background)] pb-3"
        style={{ height: MAP_HEIGHT }}
      >
        {/* Grid background — 4% per doctrine (governance schematic, not star map) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--topo-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--topo-grid) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Defense mode overlay — always rendered, opacity-transitioned on confirmed state */}
        <div
          className="absolute inset-0 bg-destructive/3 pointer-events-none z-[1] transition-opacity duration-[800ms] ease-in-out"
          style={{ opacity: posture === "defensive" ? 1 : 0 }}
        />

        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gate-to-gate topology edges */}
          {gateEdges.map((edge, i) => (
            <line
              key={`gate-edge-${i}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="var(--topo-link-healthy)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.45"
            />
          ))}

          {/* Unassigned row separator line */}
          {positions.some((p) => p.pinned) &&
            positions.some((p) => !p.pinned) && (
              <line
                x1={MAP_WIDTH * 0.1}
                y1={MAP_HEIGHT * 0.75}
                x2={MAP_WIDTH * 0.9}
                y2={MAP_HEIGHT * 0.75}
                stroke="var(--topo-link-idle)"
                strokeWidth="0.5"
                strokeDasharray="3 6"
                opacity="0.2"
              />
            )}

          {/* Render each node group (SVG layer) */}
          {positions.map(({ group, x, y }) => (
            <NodeClusterSvg
              key={group.node.objectId}
              group={group}
              cx={x}
              cy={y}
              posture={posture}
            />
          ))}
        </svg>

        {/* HTML overlay labels (positioned on top of SVG) */}
        {positions.map(({ group, x, y, pinned }) => (
          <NodeOverlayLabel
            key={`label-${group.node.objectId}`}
            group={group}
            x={x}
            y={y}
            mapWidth={MAP_WIDTH}
            mapHeight={MAP_HEIGHT}
            posture={posture}
            pinned={pinned}
            pinMap={pinMap}
          />
        ))}

        {/* Empty state */}
        {positions.length === 0 && (
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

/**
 * HTML overlay label card for a node — positioned absolutely using
 * percentage coordinates that match the SVG viewBox.
 */
function NodeOverlayLabel({
  group,
  x,
  y,
  mapWidth,
  mapHeight,
  posture,
  pinned,
  pinMap,
}: {
  group: NetworkNodeGroup;
  x: number;
  y: number;
  mapWidth: number;
  mapHeight: number;
  posture: Posture;
  pinned: boolean;
  pinMap: Map<string, SpatialPin>;
}) {
  const leftPct = (x / mapWidth) * 100;
  const topPct = ((y + 28) / mapHeight) * 100;

  const isOnline = group.node.status === "online";
  const childCount =
    group.gates.length + group.storageUnits.length + group.turrets.length;
  const pin = pinMap.get(group.node.objectId);

  // Split fallback names: "Network Node 9285364e" → label="Network Node" hex="9285364e"
  const fallbackPattern = /^(.+?)\s+([0-9a-f]{8})$/;
  const nameMatch = group.node.name.match(fallbackPattern);
  const isFallbackName = !!nameMatch;
  const nameLabel = nameMatch ? nameMatch[1] : group.node.name;
  const nameHex = nameMatch ? nameMatch[2] : null;

  const borderColor =
    posture === "defensive"
      ? "border-amber-500/30"
      : isOnline
        ? "border-[hsl(175,45%,50%)]/30"
        : "border-border/50";

  return (
    <div
      className={`absolute z-10 -translate-x-1/2 pointer-events-none`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
      }}
    >
      <div
        className={`bg-background/80 backdrop-blur-sm border ${borderColor} rounded px-2.5 py-1.5 whitespace-nowrap transition-colors duration-[800ms] ease-in-out`}
      >
        <div className="text-[10px] font-semibold tracking-wide text-foreground leading-none mb-0.5">
          {pin ? pin.solarSystemName : nameLabel}
          {!pin && nameHex && (
            <span className="text-muted-foreground/50 font-mono font-normal ml-1 text-[9px]">{nameHex}</span>
          )}
        </div>
        {pin && (
          <div className="text-[9px] text-muted-foreground leading-none mb-0.5">
            {isFallbackName ? nameLabel : group.node.name}
            {isFallbackName && nameHex && (
              <span className="text-muted-foreground/40 font-mono ml-1">{nameHex}</span>
            )}
          </div>
        )}
        <div className="text-[9px] font-mono text-muted-foreground leading-none">
          {childCount} structure{childCount !== 1 ? "s" : ""}
          {isOnline ? (
            <span className="text-[hsl(175,45%,50%)]/70 ml-1">● online</span>
          ) : (
            <span className="text-destructive/70 ml-1">● offline</span>
          )}
          {!pinned && (
            <span className="text-muted-foreground/40 ml-1">· unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** SVG layer for a single network node and its radial child cluster. */
function NodeClusterSvg({
  group,
  cx,
  cy,
  posture,
}: {
  group: NetworkNodeGroup;
  cx: number;
  cy: number;
  posture: Posture;
}) {
  // §6 Layout doctrine: Gates first (12 o'clock CW), then TradePosts, then Turrets
  const orderedGates = group.gates.map((g) => ({ ...g, _kind: "gate" as const }));
  const orderedSSUs = group.storageUnits.map((s) => ({ ...s, _kind: "storage_unit" as const }));

  // §6 Turret stacking: 1-3 individual, 4+ collapse into single glyph with +N badge
  const MAX_INDIVIDUAL_TURRETS = 3;
  const turretList = group.turrets;
  const showTurretStack = turretList.length > MAX_INDIVIDUAL_TURRETS;
  const visibleTurrets = showTurretStack
    ? turretList.slice(0, 1).map((t) => ({ ...t, _kind: "turret" as const }))
    : turretList.map((t) => ({ ...t, _kind: "turret" as const }));
  const collapsedTurretCount = showTurretStack ? turretList.length : 0;

  const children = [...orderedGates, ...orderedSSUs, ...visibleTurrets];
  const total = children.length;

  const isOnline = group.node.status === "online";
  const nodeColor =
    posture === "defensive"
      ? "var(--topo-state-warning)"
      : isOnline
        ? "var(--topo-state-online)"
        : group.node.status === "offline"
          ? "var(--topo-state-offline)"
          : "var(--topo-neutral)";

  return (
    <g>
      {/* Subtle halo behind center node */}
      <circle
        cx={cx}
        cy={cy}
        r={22}
        fill={isOnline ? "var(--topo-state-online)" : "var(--topo-state-offline)"}
        opacity={0.06}
      />

      {/* Child structure links + glyphs */}
      {children.map((child, i) => {
        const { dx, dy } = childOffset(i, total, CHILD_RADIUS);
        const childX = cx + dx;
        const childY = cy + dy;
        const isGate = child._kind === "gate";
        const glyphSize = isGate ? 24 : 20;
        const glyphOffset = glyphSize / 2;

        return (
          <g key={child.objectId}>
            <line
              x1={cx}
              y1={cy}
              x2={childX}
              y2={childY}
              stroke="var(--topo-link-idle)"
              strokeWidth={isGate ? "1.5" : "1"}
              opacity={isGate ? 0.35 : 0.2}
            />
            <g
              transform={`translate(${childX - glyphOffset}, ${childY - glyphOffset})`}
              style={{ color: "var(--topo-glyph-neutral)" }}
            >
              <ChildGlyph type={child._kind} status={child.status} posture={posture} size={glyphSize} />
            </g>
            {/* Turret stack +N badge */}
            {child._kind === "turret" && collapsedTurretCount > 0 && (
              <text
                x={childX + glyphOffset + 2}
                y={childY - glyphOffset + 4}
                fill="var(--topo-glyph-neutral)"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="600"
              >
                +{collapsedTurretCount - 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Network node center symbol */}
      <g
        transform={`translate(${cx - 14}, ${cy - 14})`}
        style={{ color: nodeColor, transition: 'color 800ms ease-in-out' }}
      >
        <NetworkNodeGlyph size={28} />
      </g>
    </g>
  );
}

function ChildGlyph({
  type,
  status,
  posture,
  size = 20,
}: {
  type: string;
  status: string;
  posture: Posture;
  size?: number;
}) {
  // Turrets reflect posture: amber in defense, teal in commercial
  const color =
    type === "turret" && status === "online"
      ? posture === "defensive"
        ? "var(--topo-state-warning)"
        : "var(--topo-state-online)"
      : status === "online"
        ? "var(--topo-state-online)"
        : status === "offline"
          ? "var(--topo-state-offline)"
          : status === "warning"
            ? "var(--topo-state-warning)"
            : "var(--topo-glyph-neutral)";

  return (
    <g style={{ color, transition: 'color 800ms ease-in-out' }}>
      {type === "gate" && <GateGlyph size={size} />}
      {type === "storage_unit" && <TradePostGlyph size={size} />}
      {type === "turret" && <TurretGlyph size={size} />}
    </g>
  );
}
