import type { StructureWriteTarget } from "@/lib/structureWriteReconciliation";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type { StructureActionTargetType, StructureStatus } from "@/types/domain";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "@/types/operatorInventory";
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

function normalizeAssemblyId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^0+/, "");
  return normalized.length > 0 ? normalized : "0";
}

function normalizeInventoryStatus(status: string | null | undefined): StructureStatus {
  const normalized = status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["online", "active", "powered", "running", "onlined"].includes(normalized ?? "")) {
    return "online";
  }

  if (["offline", "inactive", "unpowered"].includes(normalized ?? "")) {
    return "offline";
  }

  if (["warning", "degraded", "low_fuel", "lowfuel", "damaged"].includes(normalized ?? "")) {
    return "warning";
  }

  return "neutral";
}

function rowMatchesTarget(
  row: OperatorInventoryStructure,
  target: NodePowerOperationTarget,
): boolean {
  const rowObjectId = normalizeCanonicalObjectId(row.objectId);
  const targetObjectIds = [
    target.verifiedTarget.structureId,
    target.structure.objectId,
    target.structure.directChainObjectId,
  ].map((value) => normalizeCanonicalObjectId(value));
  if (rowObjectId && targetObjectIds.some((value) => value === rowObjectId)) {
    return true;
  }

  const rowAssemblyId = normalizeAssemblyId(row.assemblyId);
  const targetAssemblyIds = [
    target.structure.assemblyId,
    target.structure.directChainAssemblyId,
  ].map(normalizeAssemblyId);
  return rowAssemblyId != null && targetAssemblyIds.some((value) => value === rowAssemblyId);
}

function findFreshInventoryStatus(
  inventory: OperatorInventoryResponse,
  target: NodePowerOperationTarget,
  selectedNodeId: string | null,
): StructureStatus | null {
  const normalizedSelectedNodeId = normalizeCanonicalObjectId(selectedNodeId);
  const normalizedTargetNodeId = normalizeCanonicalObjectId(target.verifiedTarget.networkNodeId);

  for (const nodeGroup of inventory.networkNodes) {
    const nodeId = normalizeCanonicalObjectId(nodeGroup.node.objectId);
    const row = nodeGroup.structures.find((structure) => rowMatchesTarget(structure, target));
    if (!row) continue;

    const rowNodeId = normalizeCanonicalObjectId(row.networkNodeId) ?? nodeId;
    const matchesSelectedNode = !normalizedSelectedNodeId || rowNodeId === normalizedSelectedNodeId || nodeId === normalizedSelectedNodeId;
    const matchesTargetNode = !normalizedTargetNodeId || rowNodeId === normalizedTargetNodeId || nodeId === normalizedTargetNodeId;
    if (matchesSelectedNode && matchesTargetNode) {
      return normalizeInventoryStatus(row.status);
    }
  }

  return null;
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

export function filterNodePowerPlanForOperatorInventory(
  plan: NodePowerOperationPlan,
  inventory: OperatorInventoryResponse | null | undefined,
  selectedNodeId: string | null,
): NodePowerOperationPlan {
  if (!inventory || plan.targets.length === 0) {
    return plan;
  }

  const targets = plan.targets.filter((target) => {
    const freshStatus = findFreshInventoryStatus(inventory, target, selectedNodeId);
    if (!freshStatus || !isExactPowerStatus(freshStatus)) {
      return true;
    }

    return (freshStatus === "online") !== target.desiredOnline;
  });

  return {
    targets,
    disabledReason: targets.length === 0 ? "no structures need changing" : plan.disabledReason,
    capacityReason: buildCapacityReason(targets),
  };
}

export function toMixedAssemblyPowerTarget(target: NodePowerOperationTarget) {
  return {
    structureId: target.verifiedTarget.structureId,
    structureType: target.verifiedTarget.structureType,
    ownerCapId: target.verifiedTarget.ownerCapId,
    networkNodeId: target.verifiedTarget.networkNodeId,
    online: target.desiredOnline,
  };
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
    desiredStatus: target.desiredOnline ? "online" : "offline",
  };
}