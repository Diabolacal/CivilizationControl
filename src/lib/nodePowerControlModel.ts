import type { StructureWriteTarget } from "@/lib/structureWriteReconciliation";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type { StructurePowerChainSnapshot } from "@/lib/structurePowerChainStatus";
import type { StructureActionTargetType, StructureStatus } from "@/types/domain";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "@/types/operatorInventory";
import type { NodeLocalNode, NodeLocalStructure } from "./nodeDrilldownTypes";
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
  capacityGJ: number | null;
  isAvailable: boolean;
}

export interface NodePowerCapacityCheck {
  status: "ok" | "unavailable" | "over-cap";
  currentUsedGj: number | null;
  capacityGj: number | null;
  availableGj: number | null;
  allOnlineLoadGj: number | null;
  proposedLoadGj: number | null;
  totalUnknownLoadCount: number | null;
  requiredUnknownCount: number;
  canVerify: boolean;
  exceedsCapacity: boolean;
  reason: string | null;
}

export type NodePowerEligibilityReason =
  | "already_online"
  | "already_offline"
  | "chain_offline"
  | "chain_online"
  | "chain_status_unavailable"
  | "invalid_chain_status"
  | "missing_structure_id"
  | "missing_owner_cap"
  | "missing_network_node"
  | "modeled_online_without_chain_status";

export interface NodePowerOperationDecision {
  target: NodePowerOperationTarget;
  included: boolean;
  reason: NodePowerEligibilityReason;
  chainStatus: StructureStatus | null;
  chainStatusVariant: string | null;
  chainState: StructurePowerChainSnapshot["state"] | null;
}

export interface NodePowerOperationEvaluation extends NodePowerOperationPlan {
  decisions: NodePowerOperationDecision[];
}

export interface NodePowerOperationInventoryEvaluation extends NodePowerOperationPlan {
  decisions: NodePowerOperationDecision[];
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

function formatPowerGj(value: number): string {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1).replace(/\.0$/, "");
}

function resolveNodePowerCapacityGj(
  node: Pick<NodeLocalNode, "powerUsageSummary"> | null | undefined,
): number | null {
  const summary = node?.powerUsageSummary;
  if (!summary) return null;

  return summary.capacityGj ?? NODE_POWER_CAPACITY_GJ;
}

function getStructureRequiredPowerGj(structure: NodeLocalStructure): number | null {
  return structure.powerRequirement?.requiredGj ?? null;
}

export function evaluateNodePowerCapacity(
  node: Pick<NodeLocalNode, "powerUsageSummary"> | null | undefined,
  structures: readonly NodeLocalStructure[],
  desiredOnlineByCanonicalKey?: ReadonlyMap<string, boolean>,
): NodePowerCapacityCheck {
  const summary = node?.powerUsageSummary ?? null;
  const capacityGj = resolveNodePowerCapacityGj(node);
  const currentUsedGj = summary?.usedGj ?? null;
  const availableGj = summary?.availableGj
    ?? (capacityGj != null && currentUsedGj != null ? capacityGj - currentUsedGj : null);
  const totalUnknownLoadCount = summary?.totalUnknownLoadCount ?? null;

  let hasDesiredOnlineState = false;
  let requiredUnknownCount = 0;
  let canVerify = currentUsedGj != null && capacityGj != null && totalUnknownLoadCount === 0;
  let proposedLoadGj = currentUsedGj;

  let computedAllOnlineLoadGj = summary?.totalUnknownLoadCount === 0
    ? summary.totalKnownLoadGj ?? 0
    : null;
  let missingAllOnlineRequirement = false;

  for (const structure of structures) {
    const currentOnline = isExactPowerStatus(structure.status) ? structure.status === "online" : null;
    const desiredOnline = desiredOnlineByCanonicalKey?.has(structure.canonicalDomainKey)
      ? desiredOnlineByCanonicalKey.get(structure.canonicalDomainKey) ?? null
      : currentOnline;

    if (desiredOnline === true) {
      hasDesiredOnlineState = true;

      const requiredGj = getStructureRequiredPowerGj(structure);
      if (requiredGj == null) {
        requiredUnknownCount += 1;
        if (computedAllOnlineLoadGj != null && summary?.totalKnownLoadGj == null) {
          missingAllOnlineRequirement = true;
        }
      } else if (computedAllOnlineLoadGj != null && summary?.totalKnownLoadGj == null) {
        computedAllOnlineLoadGj += requiredGj;
      }
    }

    if (!canVerify) {
      continue;
    }

    if (desiredOnline == null) {
      continue;
    }

    if (currentOnline == null) {
      canVerify = false;
      continue;
    }

    if (currentOnline === desiredOnline) {
      continue;
    }

    const requiredGj = getStructureRequiredPowerGj(structure);
    if (requiredGj == null) {
      canVerify = false;
      continue;
    }

    proposedLoadGj = (proposedLoadGj ?? 0) + (desiredOnline ? requiredGj : -requiredGj);
  }

  const allOnlineLoadGj = summary?.totalUnknownLoadCount === 0
    ? summary.totalKnownLoadGj ?? (missingAllOnlineRequirement ? null : computedAllOnlineLoadGj)
    : null;

  if (!hasDesiredOnlineState) {
    return {
      status: "ok",
      currentUsedGj,
      capacityGj,
      availableGj,
      allOnlineLoadGj,
      proposedLoadGj: currentUsedGj,
      totalUnknownLoadCount,
      requiredUnknownCount,
      canVerify: false,
      exceedsCapacity: false,
      reason: null,
    };
  }

  const canVerifyDesiredState = canVerify && requiredUnknownCount === 0;
  const exceedsCapacity = canVerifyDesiredState
    && proposedLoadGj != null
    && capacityGj != null
    && proposedLoadGj > capacityGj;

  if (exceedsCapacity) {
    return {
      status: "over-cap",
      currentUsedGj,
      capacityGj,
      availableGj,
      allOnlineLoadGj,
      proposedLoadGj,
      totalUnknownLoadCount,
      requiredUnknownCount,
      canVerify: true,
      exceedsCapacity: true,
      reason: `This node would exceed ${formatPowerGj(capacityGj)} GJ if those structures were online.`,
    };
  }

  if (!canVerifyDesiredState) {
    return {
      status: "unavailable",
      currentUsedGj,
      capacityGj,
      availableGj,
      allOnlineLoadGj,
      proposedLoadGj: null,
      totalUnknownLoadCount,
      requiredUnknownCount,
      canVerify: false,
      exceedsCapacity: false,
      reason: "Power requirement unavailable",
    };
  }

  return {
    status: "ok",
    currentUsedGj,
    capacityGj,
    availableGj,
    allOnlineLoadGj,
    proposedLoadGj,
    totalUnknownLoadCount,
    requiredUnknownCount,
    canVerify: true,
    exceedsCapacity: false,
    reason: null,
  };
}

export function evaluateNodePowerPlanCapacity(
  node: Pick<NodeLocalNode, "powerUsageSummary"> | null | undefined,
  structures: readonly NodeLocalStructure[],
  targets: readonly NodePowerOperationTarget[],
): NodePowerCapacityCheck {
  const desiredOnlineByCanonicalKey = new Map<string, boolean>();
  for (const target of targets) {
    desiredOnlineByCanonicalKey.set(target.structure.canonicalDomainKey, target.desiredOnline);
  }

  return evaluateNodePowerCapacity(node, structures, desiredOnlineByCanonicalKey);
}

function buildCapacityReason(targets: readonly NodePowerOperationTarget[]): string | null {
  const hasDesiredOnlineTargets = targets.some((target) => target.desiredOnline);
  if (!hasDesiredOnlineTargets) {
    return null;
  }

  return targets.some((target) => target.desiredOnline && getStructureRequiredPowerGj(target.structure) == null)
    ? "Power requirement unavailable"
    : null;
}

function hasRequiredTargetContext(target: NodePowerOperationTarget): NodePowerEligibilityReason | null {
  if (!normalizeCanonicalObjectId(target.verifiedTarget.structureId)) {
    return "missing_structure_id";
  }

  if (target.verifiedTarget.ownerCapId.trim().length === 0) {
    return "missing_owner_cap";
  }

  if (target.verifiedTarget.networkNodeId.trim().length === 0) {
    return "missing_network_node";
  }

  return null;
}

function getModeledExactStatus(target: NodePowerOperationTarget): "online" | "offline" | null {
  if (isExactPowerStatus(target.structure.status)) {
    return target.structure.status;
  }

  return isExactPowerStatus(target.verifiedTarget.status) ? target.verifiedTarget.status : null;
}

function getNoEligibleStructuresReason(targets: readonly NodePowerOperationTarget[]): string {
  const hasOnlineTargets = targets.some((target) => target.desiredOnline);
  const hasOfflineTargets = targets.some((target) => !target.desiredOnline);
  if (hasOnlineTargets && !hasOfflineTargets) {
    return "No eligible structures to bring online.";
  }

  if (hasOfflineTargets && !hasOnlineTargets) {
    return "No eligible structures to take offline.";
  }

  return "No eligible structure changes.";
}

function evaluateNodePowerOperationTarget(
  target: NodePowerOperationTarget,
  chainSnapshots: ReadonlyMap<string, StructurePowerChainSnapshot> | null | undefined,
): NodePowerOperationDecision {
  const missingContextReason = hasRequiredTargetContext(target);
  if (missingContextReason) {
    return {
      target,
      included: false,
      reason: missingContextReason,
      chainStatus: null,
      chainStatusVariant: null,
      chainState: null,
    };
  }

  const normalizedStructureId = normalizeCanonicalObjectId(target.verifiedTarget.structureId);
  const modeledStatus = getModeledExactStatus(target);
  if (!normalizedStructureId) {
    return {
      target,
      included: false,
      reason: "missing_structure_id",
      chainStatus: null,
      chainStatusVariant: null,
      chainState: null,
    };
  }

  if (!chainSnapshots) {
    if (target.desiredOnline) {
      return {
        target,
        included: false,
        reason: "chain_status_unavailable",
        chainStatus: null,
        chainStatusVariant: null,
        chainState: null,
      };
    }

    const included = modeledStatus === "online";
    return {
      target,
      included,
      reason: included ? "modeled_online_without_chain_status" : "chain_status_unavailable",
      chainStatus: null,
      chainStatusVariant: null,
      chainState: null,
    };
  }

  const snapshot = chainSnapshots.get(normalizedStructureId);
  if (!snapshot) {
    if (target.desiredOnline) {
      return {
        target,
        included: false,
        reason: "chain_status_unavailable",
        chainStatus: null,
        chainStatusVariant: null,
        chainState: null,
      };
    }

    const included = modeledStatus === "online";
    return {
      target,
      included,
      reason: included ? "modeled_online_without_chain_status" : "chain_status_unavailable",
      chainStatus: null,
      chainStatusVariant: null,
      chainState: null,
    };
  }

  if (target.desiredOnline) {
    if (snapshot.state === "offline") {
      return {
        target,
        included: true,
        reason: "chain_offline",
        chainStatus: snapshot.chainStatus,
        chainStatusVariant: snapshot.statusVariant,
        chainState: snapshot.state,
      };
    }

    return {
      target,
      included: false,
      reason: snapshot.state === "online" ? "already_online" : "invalid_chain_status",
      chainStatus: snapshot.chainStatus,
      chainStatusVariant: snapshot.statusVariant,
      chainState: snapshot.state,
    };
  }

  if (snapshot.state === "online") {
    return {
      target,
      included: true,
      reason: "chain_online",
      chainStatus: snapshot.chainStatus,
      chainStatusVariant: snapshot.statusVariant,
      chainState: snapshot.state,
    };
  }

  return {
    target,
    included: false,
    reason: snapshot.state === "offline" ? "already_offline" : "invalid_chain_status",
    chainStatus: snapshot.chainStatus,
    chainStatusVariant: snapshot.statusVariant,
    chainState: snapshot.state,
  };
}

export function getNodePowerUsageReadout(
  node: Pick<NodeLocalNode, "powerUsageSummary"> | null | undefined,
): NodePowerUsageReadout {
  const usedGj = node?.powerUsageSummary?.usedGj ?? null;
  const capacityGj = resolveNodePowerCapacityGj(node);

  if (usedGj != null && capacityGj != null) {
    return {
      label: `Power ${formatPowerGj(usedGj)} / ${formatPowerGj(capacityGj)} GJ`,
      capacityGJ: capacityGj,
      isAvailable: true,
    };
  }

  return {
    label: "Power usage unavailable",
    capacityGJ: capacityGj,
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

export function inspectNodePowerPlanForFreshInventory(
  plan: NodePowerOperationPlan,
  inventory: OperatorInventoryResponse | null | undefined,
  selectedNodeId: string | null,
): NodePowerOperationInventoryEvaluation {
  if (!inventory || plan.targets.length === 0) {
    return { ...plan, decisions: [] };
  }

  const decisions: NodePowerOperationDecision[] = [];
  const targets = plan.targets.filter((target) => {
    const freshStatus = findFreshInventoryStatus(inventory, target, selectedNodeId);
    if (!freshStatus || !isExactPowerStatus(freshStatus)) {
      return true;
    }

    if ((freshStatus === "online") !== target.desiredOnline) {
      return true;
    }

    decisions.push({
      target,
      included: false,
      reason: freshStatus === "online" ? "already_online" : "already_offline",
      chainStatus: freshStatus,
      chainStatusVariant: null,
      chainState: freshStatus,
    });
    return false;
  });

  return {
    targets,
    disabledReason: targets.length === 0 ? getNoEligibleStructuresReason(plan.targets) : plan.disabledReason,
    capacityReason: buildCapacityReason(targets),
    decisions,
  };
}

export function filterNodePowerPlanForTargetStatuses(
  plan: NodePowerOperationPlan,
  statusesByStructureId: ReadonlyMap<string, StructureStatus> | null | undefined,
): NodePowerOperationPlan {
  if (!statusesByStructureId || statusesByStructureId.size === 0 || plan.targets.length === 0) {
    return plan;
  }

  const targets = plan.targets.filter((target) => {
    const structureId = normalizeCanonicalObjectId(target.verifiedTarget.structureId);
    const status = structureId ? statusesByStructureId.get(structureId) : null;
    if (!status || !isExactPowerStatus(status)) {
      return true;
    }

    return (status === "online") !== target.desiredOnline;
  });

  return {
    targets,
    disabledReason: targets.length === 0 ? "no structures need changing" : plan.disabledReason,
    capacityReason: buildCapacityReason(targets),
  };
}

export function inspectNodePowerPlanForChainEligibility(
  plan: NodePowerOperationPlan,
  chainSnapshots: ReadonlyMap<string, StructurePowerChainSnapshot> | null | undefined,
): NodePowerOperationEvaluation {
  if (plan.targets.length === 0) {
    return { ...plan, decisions: [] };
  }

  const decisions = plan.targets.map((target) => evaluateNodePowerOperationTarget(target, chainSnapshots));
  const targets = decisions.filter((decision) => decision.included).map((decision) => decision.target);

  return {
    targets,
    disabledReason: targets.length === 0 ? getNoEligibleStructuresReason(plan.targets) : null,
    capacityReason: buildCapacityReason(targets),
    decisions,
  };
}

export function filterNodePowerPlanForChainEligibility(
  plan: NodePowerOperationPlan,
  chainSnapshots: ReadonlyMap<string, StructurePowerChainSnapshot> | null | undefined,
): NodePowerOperationPlan {
  const evaluation = inspectNodePowerPlanForChainEligibility(plan, chainSnapshots);
  return {
    targets: evaluation.targets,
    disabledReason: evaluation.disabledReason,
    capacityReason: evaluation.capacityReason,
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