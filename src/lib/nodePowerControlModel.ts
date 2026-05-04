import type { StructureWriteTarget } from "@/lib/structureWriteReconciliation";
import type { StructureActionTargetType, StructureStatus } from "@/types/domain";
import type { NodeLocalStructure } from "./nodeDrilldownTypes";
import type { NodePowerPresetSlot } from "./nodePowerPresets";

export const NODE_POWER_CAPACITY_GJ = 1000;

export interface NodePowerOperationTarget {
  desiredOnline: boolean;
  structure: NodeLocalStructure;
  verifiedTarget: NonNullable<NodeLocalStructure["actionAuthority"]["verifiedTarget"]>;
}

export interface NodePowerOperationGroup {
  desiredOnline: boolean;
  structureType: Exclude<StructureActionTargetType, "network_node">;
  targets: NodePowerOperationTarget[];
}

export interface NodePowerOperationPlan {
  targets: NodePowerOperationTarget[];
  disabledReason: string | null;
  capacityReason: string | null;
}

export interface NodePowerUsageReadout {
  label: string;
  capacityGJ: number;
  isAvailable: boolean;
}

function isExactPowerStatus(status: StructureStatus): status is "online" | "offline" {
  return status === "online" || status === "offline";
}

function findStructureForPresetTarget(
  structures: readonly NodeLocalStructure[],
  target: NodePowerPresetSlot["targets"][number],
): NodeLocalStructure | null {
  const aliases = new Set([
    target.canonicalDomainKey,
    target.objectId ? `object:${target.objectId.toLowerCase()}` : null,
    target.assemblyId ? `assembly:${target.assemblyId.replace(/^0+/, "") || "0"}` : null,
    target.directChainObjectId ? `object:${target.directChainObjectId.toLowerCase()}` : null,
    target.directChainAssemblyId ? `assembly:${target.directChainAssemblyId.replace(/^0+/, "") || "0"}` : null,
  ].filter((value): value is string => Boolean(value)));

  return structures.find((structure) => aliases.has(structure.canonicalDomainKey))
    ?? structures.find((structure) => (
      (target.objectId && structure.objectId?.toLowerCase() === target.objectId.toLowerCase())
      || (target.assemblyId && structure.assemblyId === target.assemblyId)
      || (target.directChainObjectId && structure.directChainObjectId?.toLowerCase() === target.directChainObjectId.toLowerCase())
      || (target.directChainAssemblyId && structure.directChainAssemblyId === target.directChainAssemblyId)
    ))
    ?? null;
}

function buildCapacityReason(targets: readonly NodePowerOperationTarget[]): string | null {
  return targets.some((target) => target.desiredOnline)
    ? "Power requirement unavailable"
    : null;
}

export function getNodePowerUsageReadout(): NodePowerUsageReadout {
  return {
    label: "Power usage unavailable",
    capacityGJ: NODE_POWER_CAPACITY_GJ,
    isAvailable: false,
  };
}

export function buildNodeChildBulkPowerPlan(
  structures: readonly NodeLocalStructure[],
  desiredOnline: boolean,
): NodePowerOperationPlan {
  if (structures.length === 0) {
    return { targets: [], disabledReason: "no connected child structures", capacityReason: null };
  }

  const targets = structures.flatMap((structure): NodePowerOperationTarget[] => {
    const verifiedTarget = structure.actionAuthority.verifiedTarget;
    if (!verifiedTarget || !isExactPowerStatus(verifiedTarget.status)) return [];
    if ((verifiedTarget.status === "online") === desiredOnline) return [];

    return [{ desiredOnline, structure, verifiedTarget }];
  });

  return {
    targets,
    disabledReason: targets.length === 0 ? "no structures need changing" : null,
    capacityReason: buildCapacityReason(targets),
  };
}

export function buildNodePowerPresetApplyPlan(
  slot: NodePowerPresetSlot | null,
  structures: readonly NodeLocalStructure[],
): NodePowerOperationPlan {
  if (!slot) {
    return { targets: [], disabledReason: "preset slot empty", capacityReason: null };
  }

  let matchedCount = 0;
  const targets: NodePowerOperationTarget[] = [];

  for (const savedTarget of slot.targets) {
    const structure = findStructureForPresetTarget(structures, savedTarget);
    if (!structure) continue;
    matchedCount += 1;

    if (!isExactPowerStatus(structure.status)) continue;
    if ((structure.status === "online") === savedTarget.desiredOnline) continue;

    const verifiedTarget = structure.actionAuthority.verifiedTarget;
    if (!verifiedTarget) continue;

    targets.push({ desiredOnline: savedTarget.desiredOnline, structure, verifiedTarget });
  }

  return {
    targets,
    disabledReason: matchedCount === 0 ? "no connected child structures" : targets.length === 0 ? "no structures need changing" : null,
    capacityReason: buildCapacityReason(targets),
  };
}

export function groupNodePowerOperationTargets(
  targets: readonly NodePowerOperationTarget[],
): NodePowerOperationGroup[] {
  const groups = new Map<string, NodePowerOperationGroup>();

  for (const target of targets) {
    const groupKey = `${target.desiredOnline ? "online" : "offline"}:${target.verifiedTarget.structureType}`;
    const current = groups.get(groupKey);
    if (current) {
      current.targets.push(target);
      continue;
    }

    groups.set(groupKey, {
      desiredOnline: target.desiredOnline,
      structureType: target.verifiedTarget.structureType,
      targets: [target],
    });
  }

  return Array.from(groups.values());
}

export function toStructureWriteTarget(target: NodePowerOperationTarget): StructureWriteTarget {
  return {
    objectId: target.verifiedTarget.structureId,
    structureType: target.verifiedTarget.structureType,
    ownerCapId: target.verifiedTarget.ownerCapId,
    networkNodeId: target.verifiedTarget.networkNodeId,
    assemblyId: target.structure.assemblyId ?? null,
    canonicalDomainKey: target.structure.canonicalDomainKey,
    displayName: target.structure.displayName,
  };
}