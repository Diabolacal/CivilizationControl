import type { NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import type {
  AssemblySummary,
  NetworkMetrics,
  NodeAssemblyNode,
  NodeAssemblySummary,
  ObjectId,
  PlayerProfile,
  Structure,
  StructureStatus,
  StructureType,
} from "@/types/domain";
import type {
  OperatorInventoryFamily,
  OperatorInventoryResponse,
  OperatorInventorySize,
  OperatorInventoryStatus,
  OperatorInventoryStructure,
} from "@/types/operatorInventory";

interface OperatorInventoryDiagnostics {
  source: string | null;
  fetchedAt: string | null;
  partial: boolean;
  networkNodeCount: number;
  groupedStructureCount: number;
  unlinkedStructureCount: number;
  warnings: string[];
}

export interface AdaptedOperatorInventory {
  profile: PlayerProfile | null;
  structures: Structure[];
  metrics: NetworkMetrics;
  warning: string | null;
  diagnostics: OperatorInventoryDiagnostics;
  nodeLookupsByNodeId: Map<ObjectId, NodeAssembliesLookupResult>;
}

const COMPATIBLE_TYPE_BY_FAMILY: Partial<Record<OperatorInventoryFamily, StructureType>> = {
  networkNode: "network_node",
  gate: "gate",
  storage: "storage_unit",
  turret: "turret",
};

const DEFAULT_LABEL_BY_FAMILY: Record<OperatorInventoryFamily, string> = {
  networkNode: "Network Node",
  gate: "Gate",
  storage: "Storage",
  turret: "Turret",
  printer: "Printer",
  refinery: "Refinery",
  assembler: "Assembler",
  berth: "Berth",
  relay: "Relay",
  nursery: "Nursery",
  nest: "Nest",
  shelter: "Shelter",
};

export function adaptOperatorInventory(response: OperatorInventoryResponse): AdaptedOperatorInventory {
  const structuresByKey = new Map<string, Structure>();

  for (const nodeGroup of response.networkNodes) {
    const nodeStructure = toCompatibleStructure(nodeGroup.node, nodeGroup.node.objectId ?? null);
    if (nodeStructure) {
      mergeCompatibleStructure(structuresByKey, nodeStructure);
    }

    for (const structure of nodeGroup.structures) {
      const compatible = toCompatibleStructure(structure, nodeGroup.node.objectId ?? structure.networkNodeId ?? null);
      if (compatible) {
        mergeCompatibleStructure(structuresByKey, compatible);
      }
    }
  }

  for (const structure of response.unlinkedStructures) {
    const compatible = toCompatibleStructure(structure, null);
    if (compatible) {
      mergeCompatibleStructure(structuresByKey, compatible);
    }
  }

  const structures = [...structuresByKey.values()];

  return {
    profile: toPlayerProfile(response),
    structures,
    metrics: computeMetrics(structures),
    warning: buildOperatorInventoryWarning(response),
    diagnostics: {
      source: response.source,
      fetchedAt: response.fetchedAt,
      partial: response.partial,
      networkNodeCount: response.networkNodes.length,
      groupedStructureCount: response.networkNodes.reduce((sum, group) => sum + group.structures.length, 0),
      unlinkedStructureCount: response.unlinkedStructures.length,
      warnings: response.warnings,
    },
    nodeLookupsByNodeId: buildNodeLookupMap(response),
  };
}

function toPlayerProfile(response: OperatorInventoryResponse): PlayerProfile | null {
  const characterId = response.operator?.characterId ?? null;
  if (!characterId) {
    return null;
  }

  return {
    objectId: characterId,
    characterId,
    characterName: response.operator?.characterName ?? "",
    tribeId: response.operator?.tribeId ?? 0,
  };
}

function buildNodeLookupMap(response: OperatorInventoryResponse): Map<ObjectId, NodeAssembliesLookupResult> {
  const lookups = new Map<ObjectId, NodeAssembliesLookupResult>();

  for (const nodeGroup of response.networkNodes) {
    const nodeObjectId = nodeGroup.node.objectId;
    if (!nodeObjectId) continue;

    lookups.set(nodeObjectId, {
      status: "success",
      networkNodeId: nodeObjectId,
      node: toNodeAssemblyNode(nodeGroup.node),
      assemblies: nodeGroup.structures.map((structure) => toNodeAssemblySummary(structure, response)),
      fetchedAt: response.fetchedAt,
      source: response.source,
      error: null,
      isPartial: response.partial || nodeGroup.node.partial || nodeGroup.structures.some((structure) => structure.partial),
      droppedCount: 0,
    });
  }

  return lookups;
}

function toNodeAssemblyNode(row: OperatorInventoryStructure): NodeAssemblyNode {
  return {
    objectId: row.objectId ?? "",
    name: row.name,
    displayName: row.displayName,
    status: row.status,
    assemblyId: row.assemblyId,
    solarSystemId: row.solarSystemId,
    energySourceId: row.energySourceId,
  };
}

function toNodeAssemblySummary(
  row: OperatorInventoryStructure,
  response: OperatorInventoryResponse,
): NodeAssemblySummary {
  return {
    objectId: row.objectId,
    assemblyId: row.assemblyId,
    linkedGateId: row.linkedGateId,
    assemblyType: row.assemblyType,
    typeId: row.typeId,
    name: row.name,
    displayName: row.displayName,
    family: row.family,
    size: row.size,
    status: row.status,
    fuelAmount: row.fuelAmount,
    powerSummary: row.powerSummary,
    solarSystemId: row.solarSystemId,
    energySourceId: row.energySourceId,
    url: row.url,
    lastUpdated: row.lastUpdated,
    lastObservedCheckpoint: row.lastObservedCheckpoint,
    lastObservedTimestamp: row.lastObservedTimestamp,
    typeName: row.typeName,
    ownerCapId: row.ownerCapId,
    ownerWalletAddress: row.ownerWalletAddress,
    characterId: row.characterId,
    extensionStatus: row.extensionStatus,
    partial: row.partial || response.partial,
    warnings: row.warnings,
    actionCandidate: row.actionCandidate,
    source: row.source ?? response.source,
    provenance: row.provenance ?? "operator-inventory",
  };
}

function toCompatibleStructure(
  row: OperatorInventoryStructure,
  networkNodeId: ObjectId | null,
): Structure | null {
  const compatibleType = row.family ? COMPATIBLE_TYPE_BY_FAMILY[row.family] : null;
  if (!compatibleType || !row.objectId) {
    return null;
  }

  const summary = toAssemblySummary(row);
  return {
    assemblyId: row.assemblyId ?? undefined,
    objectId: row.objectId,
    ownerCapId: row.ownerCapId
      ?? row.actionCandidate?.actions.power?.requiredIds?.ownerCapId
      ?? "",
    readModelSource: "operator-inventory",
    type: compatibleType,
    name: resolveDisplayName(row, compatibleType),
    status: mapOperatorInventoryStatusToStructureStatus(row.status),
    networkNodeId: compatibleType === "network_node" ? undefined : networkNodeId ?? undefined,
    linkedGateId: row.linkedGateId ?? undefined,
    summary: summary ?? undefined,
    extensionStatus: row.extensionStatus ?? "none",
  };
}

function toAssemblySummary(row: OperatorInventoryStructure): AssemblySummary | null {
  if (!row.assemblyId) {
    return null;
  }

  return {
    assemblyId: row.assemblyId,
    assemblyType: row.assemblyType,
    typeId: row.typeId,
    name: row.name,
    displayName: row.displayName,
    status: row.status,
    fuelAmount: row.fuelAmount,
    solarSystemId: row.solarSystemId,
    energySourceId: row.energySourceId,
    url: row.url,
    lastUpdated: row.lastUpdated,
    typeName: row.typeName,
    family: row.family,
    size: row.size,
    source: row.source,
    provenance: row.provenance,
    lastObservedCheckpoint: row.lastObservedCheckpoint,
    lastObservedTimestamp: row.lastObservedTimestamp,
    extensionStatus: row.extensionStatus,
    partial: row.partial,
    warnings: row.warnings,
    actionCandidate: row.actionCandidate,
  };
}

function resolveDisplayName(row: OperatorInventoryStructure, compatibleType: StructureType): string {
  const label = row.displayName
    ?? row.name
    ?? row.typeName
    ?? row.assemblyType
    ?? defaultLabelForFamily(row.family, row.size, compatibleType);

  if (label) {
    return label;
  }

  const shortId = (row.objectId ?? row.assemblyId ?? "unknown").slice(-6);
  return `${defaultLabelForFamily(row.family, row.size, compatibleType)} ${shortId}`;
}

function defaultLabelForFamily(
  family: OperatorInventoryFamily | null,
  size: OperatorInventorySize,
  compatibleType: StructureType,
): string {
  const resolvedFamily = family ?? (compatibleType === "storage_unit"
    ? "storage"
    : compatibleType === "network_node"
      ? "networkNode"
      : compatibleType);
  const baseLabel = DEFAULT_LABEL_BY_FAMILY[resolvedFamily as OperatorInventoryFamily] ?? DEFAULT_LABEL_BY_FAMILY.networkNode;

  if (size === "mini") return `Mini ${baseLabel}`;
  if (size === "heavy") return `Heavy ${baseLabel}`;
  return baseLabel;
}

function mapOperatorInventoryStatusToStructureStatus(status: OperatorInventoryStatus | null): StructureStatus {
  switch (status) {
    case "online":
      return "online";
    case "offline":
      return "offline";
    case "warning":
      return "warning";
    case "unanchored":
    case "unknown":
    default:
      return "neutral";
  }
}

function mergeCompatibleStructure(
  structuresByKey: Map<string, Structure>,
  structure: Structure,
) {
  const key = structure.objectId || (structure.assemblyId ? `assembly:${structure.assemblyId}` : null);
  if (!key) return;

  const existing = structuresByKey.get(key);
  if (!existing) {
    structuresByKey.set(key, structure);
    return;
  }

  structuresByKey.set(key, preferCompatibleStructure(existing, structure));
}

function preferCompatibleStructure(existing: Structure, incoming: Structure): Structure {
  const existingScore = compatibilityStructureScore(existing);
  const incomingScore = compatibilityStructureScore(incoming);
  if (incomingScore > existingScore) return incoming;
  if (incomingScore < existingScore) return existing;
  if (!existing.networkNodeId && incoming.networkNodeId) return incoming;
  return existing;
}

function compatibilityStructureScore(structure: Structure): number {
  let score = 0;
  if (structure.ownerCapId) score += 3;
  if (structure.summary) score += 2;
  if (structure.networkNodeId) score += 1;
  if (structure.extensionStatus === "authorized") score += 1;
  return score;
}

function buildOperatorInventoryWarning(response: OperatorInventoryResponse): string | null {
  const unlinkedCount = response.unlinkedStructures.length;
  const warningCount = response.warnings.length;

  if (!response.partial && warningCount === 0 && unlinkedCount === 0) {
    return null;
  }

  const parts: string[] = [];

  if (response.partial) {
    parts.push("Operator inventory is partial.");
  }

  if (unlinkedCount > 0) {
    parts.push(`${unlinkedCount} indexed structure${unlinkedCount === 1 ? " is" : "s are"} currently unlinked from a network node.`);
  }

  if (warningCount > 0) {
    parts.push(response.partial
      ? `${warningCount} backend warning${warningCount === 1 ? " was" : "s were"} reported.`
      : response.warnings[0]);
  }

  return parts.join(" ");
}

function computeMetrics(structures: Structure[]): NetworkMetrics {
  return {
    totalStructures: structures.length,
    onlineCount: structures.filter((structure) => structure.status === "online").length,
    gateCount: structures.filter((structure) => structure.type === "gate").length,
    governedGateCount: structures.filter((structure) => structure.type === "gate" && structure.extensionStatus === "authorized").length,
    storageUnitCount: structures.filter((structure) => structure.type === "storage_unit").length,
    turretCount: structures.filter((structure) => structure.type === "turret").length,
    networkNodeCount: structures.filter((structure) => structure.type === "network_node").length,
    enforcedDirectives: structures.filter((structure) => structure.extensionStatus === "authorized").length,
  };
}