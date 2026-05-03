/**
 * NodeCluster — SVG cluster for a network node and its radial children.
 * Per-element hover hit areas for type-specific tooltips.
 */

import type { NetworkNodeGroup } from "@/types/domain";
import {
  NetworkNodeGlyph,
  GateGlyph,
  TradePostGlyph,
  TurretGlyph,
} from "@/components/topology/Glyphs";
import type { ChildSlot, Posture, HoverTarget } from "@/components/topology/topologyLayout";

interface NodeClusterSvgProps {
  group: NetworkNodeGroup;
  cx: number;
  cy: number;
  posture: Posture;
  childSlots: ChildSlot[];
  collapsedTurretCount: number;
  onHover?: (target: HoverTarget | null) => void;
  /** Staggered delay (ms) for posture cascade — left-to-right sweep. */
  cascadeDelayMs?: number;
  /** Low-fuel or other warning condition on the network node itself. */
  hasWarning?: boolean;
  hoveredNode?: boolean;
  selected?: boolean;
  canSelectNode?: boolean;
  onSelectNode?: (nodeId: string, button: number) => void;
}

export function NodeClusterSvg({
  group,
  cx,
  cy,
  posture,
  childSlots,
  collapsedTurretCount,
  onHover,
  cascadeDelayMs = 0,
  hasWarning = false,
  hoveredNode = false,
  selected = false,
  canSelectNode = false,
  onSelectNode,
}: NodeClusterSvgProps) {
  const isOnline = group.node.status === "online";
  const nodeId = group.node.objectId;

  const nodeColor = isOnline
    ? "var(--topo-state-online)"
    : group.node.status === "offline"
      ? "var(--topo-state-offline)"
      : "var(--topo-neutral)";

  return (
    <g onMouseLeave={() => onHover?.(null)}>
      {/* Subtle halo behind center node */}
      <circle
        cx={cx} cy={cy} r={22}
        fill={isOnline ? "var(--topo-state-online)" : "var(--topo-state-offline)"}
        opacity={hoveredNode && canSelectNode ? 0.11 : 0.06} pointerEvents="none"
      />

      {hoveredNode && canSelectNode && !selected ? (
        <circle
          cx={cx}
          cy={cy}
          r={19}
          fill="none"
          stroke={nodeColor}
          strokeWidth="1.25"
          opacity={0.45}
          pointerEvents="none"
        />
      ) : null}

      {selected ? (
        <circle
          cx={cx}
          cy={cy}
          r={19}
          fill="none"
          stroke="var(--topo-selected)"
          strokeWidth="1.5"
          opacity={0.9}
          pointerEvents="none"
        />
      ) : null}

      {/* Idle heartbeat pulse — network node center (online only) */}
      {isOnline && (
        <circle
          cx={cx} cy={cy} r={16}
          fill="none" stroke="var(--topo-state-online)"
          strokeWidth="0.6" opacity={0}
          pointerEvents="none"
        >
          <animate attributeName="opacity" values="0;0.18;0" dur="4s" repeatCount="indefinite" />
          <animate attributeName="r" values="16;20;16" dur="4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Anchor lines + child glyphs (topology-aware positions) */}
      {childSlots.map((slot) => {
        const childX = cx + slot.dx;
        const childY = cy + slot.dy;
        const glyphSize = slot.kind === "gate" ? 24 : 20;
        const glyphOffset = glyphSize / 2;

        return (
          <g key={slot.objectId}>
            {/* Structure-to-node anchor — visible but subordinate to corridors */}
            <line
              x1={cx} y1={cy} x2={childX} y2={childY}
              stroke="var(--topo-glyph-neutral)" strokeWidth="1"
              strokeDasharray="3 3" opacity={0.35} pointerEvents="none"
            />
            <g
              transform={`translate(${childX - glyphOffset}, ${childY - glyphOffset})`}
              style={{ pointerEvents: "none" }}
            >
              <ChildGlyph
                type={slot.kind} status={slot.status} posture={posture} size={glyphSize}
                cascadeDelayMs={slot.kind === "gate" || slot.kind === "turret" ? cascadeDelayMs : 0}
              />
            </g>
            {/* Idle heartbeat pulse — online structures only */}
            {slot.status === "online" && (
              <circle
                cx={childX} cy={childY} r={glyphSize / 2 + 2}
                fill="none" stroke="var(--topo-state-online)"
                strokeWidth="0.8" opacity={0}
                pointerEvents="none"
              >
                <animate attributeName="opacity" values="0;0.25;0" dur="3s" repeatCount="indefinite" />
                <animate attributeName="r" values={`${glyphSize / 2 + 2};${glyphSize / 2 + 5};${glyphSize / 2 + 2}`} dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Warning pip — small amber dot for degraded structures */}
            {slot.status === "warning" && (
              <circle
                cx={childX + glyphSize / 2 + 1} cy={childY - glyphSize / 2 - 1} r="2.5"
                fill="var(--topo-state-warning)" opacity={0.75}
                pointerEvents="none"
              />
            )}
            {/* Per-structure hit area */}
            <circle
              cx={childX} cy={childY} r={glyphSize / 2 + 4}
              fill="transparent"
              onMouseEnter={() =>
                onHover?.({
                  kind: slot.kind === "storage_unit" ? "ssu" : slot.kind,
                  nodeId,
                  structureId: slot.objectId,
                  svgX: childX,
                  svgY: childY,
                })
              }
            />
            {/* Turret stack +N badge */}
            {slot.kind === "turret" && collapsedTurretCount > 0 && (
              <text
                x={childX + glyphOffset + 2} y={childY - glyphOffset + 4}
                fill="var(--topo-glyph-neutral)" fontSize="9"
                fontFamily="monospace" fontWeight="600" pointerEvents="none"
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
        style={{ color: nodeColor, transition: "color 800ms ease-in-out", pointerEvents: "none" }}
      >
        <NetworkNodeGlyph size={28} />
      </g>

      {/* Warning pip — small amber dot at top-right of network node center */}
      {hasWarning && (
        <circle
          cx={cx + 12} cy={cy - 12} r="3"
          fill="var(--topo-state-warning)" opacity={0.8}
          pointerEvents="none"
        />
      )}

      {/* Center node hit area — on top for correct hover priority */}
      <circle
        cx={cx} cy={cy} r={16}
        fill="transparent"
        onMouseEnter={() => onHover?.({ kind: "node", nodeId, svgX: cx, svgY: cy })}
        onPointerUp={(event) => onSelectNode?.(nodeId, event.button)}
        style={canSelectNode ? { cursor: "pointer" } : undefined}
      />
    </g>
  );
}

/** Posture-aware child glyph: gates + turrets show defense; trade posts do not. */
function ChildGlyph({
  type, status, posture, size = 20, cascadeDelayMs = 0,
}: {
  type: string; status: string; posture: Posture; size?: number;
  cascadeDelayMs?: number;
}) {
  const isDefenseSurface = type === "gate" || type === "turret";
  const color =
    isDefenseSurface && status === "online" && posture === "defensive"
      ? "var(--topo-state-warning)"
      : status === "online"
        ? "var(--topo-state-online)"
        : status === "offline"
          ? "var(--topo-state-offline)"
          : status === "warning"
            ? "var(--topo-state-warning)"
            : "var(--topo-glyph-neutral)";

  return (
    <g style={{
      color,
      transition: "color 800ms ease-in-out",
      transitionDelay: isDefenseSurface && cascadeDelayMs > 0 ? `${Math.round(cascadeDelayMs)}ms` : undefined,
    }}>
      {type === "gate" && <GateGlyph size={size} />}
      {type === "storage_unit" && <TradePostGlyph size={size} />}
      {type === "turret" && <TurretGlyph size={size} />}
    </g>
  );
}
