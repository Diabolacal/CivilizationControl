/**
 * Topology layout utilities — pure computation for radial slot assignment.
 *
 * Linked gates are placed in radial slots facing their partner node,
 * minimizing corridor crossings. Remaining children fill slots in
 * canonical order (gates → SSUs → turrets).
 */

import type { NetworkNodeGroup } from "@/types/domain";

export type ChildKind = "gate" | "storage_unit" | "turret";

export interface ChildSlot {
  objectId: string;
  kind: ChildKind;
  status: string;
  linkedGateId?: string;
  slotIndex: number;
  dx: number;
  dy: number;
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

/** Smallest positive angular difference (radians). */
function angleDiff(a: number, b: number): number {
  const d = ((a - b) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/**
 * Assign topology-aware radial slots to a node's child structures.
 * Linked gates face their partner node; remaining children fill remaining slots.
 */
export function assignChildSlots(
  group: NetworkNodeGroup,
  nodeCx: number,
  nodeCy: number,
  nodePositionMap: Map<string, { x: number; y: number }>,
  gateToNodeMap: Map<string, string>,
  radius: number,
): ChildSlot[] {
  const MAX_TURRETS = 3;
  const showStack = group.turrets.length > MAX_TURRETS;
  const visibleTurrets = showStack ? group.turrets.slice(0, 1) : group.turrets;

  const allChildren: Array<{
    objectId: string; kind: ChildKind; status: string; linkedGateId?: string;
  }> = [
    ...group.gates.map(g => ({
      objectId: g.objectId, kind: "gate" as const, status: g.status, linkedGateId: g.linkedGateId,
    })),
    ...group.storageUnits.map(s => ({
      objectId: s.objectId, kind: "storage_unit" as const, status: s.status,
    })),
    ...visibleTurrets.map(t => ({
      objectId: t.objectId, kind: "turret" as const, status: t.status,
    })),
  ];

  const total = allChildren.length;
  if (total === 0) return [];

  const slotAngles = Array.from({ length: total }, (_, i) =>
    (2 * Math.PI * i) / total - Math.PI / 2,
  );

  const linkedEntries: Array<{ childIdx: number; desiredAngle: number }> = [];
  const unlinkedIndices: number[] = [];

  for (let i = 0; i < allChildren.length; i++) {
    const child = allChildren[i];
    if (child.kind === "gate" && child.linkedGateId) {
      const partnerNodeId = gateToNodeMap.get(child.linkedGateId);
      if (partnerNodeId) {
        const partnerPos = nodePositionMap.get(partnerNodeId);
        if (partnerPos) {
          linkedEntries.push({
            childIdx: i,
            desiredAngle: Math.atan2(partnerPos.y - nodeCy, partnerPos.x - nodeCx),
          });
          continue;
        }
      }
    }
    unlinkedIndices.push(i);
  }

  // Greedy: most-constrained linked gate first
  const available = new Set(slotAngles.map((_, i) => i));
  const assignment = new Map<number, number>();

  const scored = linkedEntries.map(e => {
    let best = Infinity;
    for (const s of available) best = Math.min(best, angleDiff(e.desiredAngle, slotAngles[s]));
    return { ...e, bestDist: best };
  });
  scored.sort((a, b) => a.bestDist - b.bestDist);

  for (const { childIdx, desiredAngle } of scored) {
    let bestSlot = 0;
    let bestDist = Infinity;
    for (const s of available) {
      const d = angleDiff(desiredAngle, slotAngles[s]);
      if (d < bestDist) { bestDist = d; bestSlot = s; }
    }
    assignment.set(childIdx, bestSlot);
    available.delete(bestSlot);
  }

  const remainingSlots = Array.from(available).sort((a, b) => a - b);
  for (let i = 0; i < unlinkedIndices.length; i++) {
    assignment.set(unlinkedIndices[i], remainingSlots[i]);
  }

  return allChildren.map((child, idx) => {
    const slotIndex = assignment.get(idx) ?? idx;
    const { dx, dy } = childOffset(slotIndex, total, radius);
    return { ...child, slotIndex, dx, dy };
  });
}

export type Posture = "commercial" | "defensive";

export interface HoverTarget {
  kind: "node" | "gate" | "ssu" | "turret";
  nodeId: string;
  structureId?: string;
  svgX: number;
  svgY: number;
}
