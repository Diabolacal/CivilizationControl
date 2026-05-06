import type { NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import type {
  AssemblySummary,
  IndexedNetworkNodeProofSignal,
  IndexedNetworkNodeRenderEligibility,
  IndexedNetworkNodeRenderMeta,
  NetworkMetrics,
  NetworkNodeGroup,
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
  OperatorInventoryNode,
  OperatorInventoryResponse,
  OperatorInventorySize,
  OperatorInventoryStatus,
  OperatorInventoryStructure,
} from "@/types/operatorInventory";
import {
  createNodeDrilldownIdentityAliases,
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
} from "@/lib/nodeDrilldownIdentity";
import { coerceExtensionStatus, mergeExtensionStatus } from "@/lib/extensionStatus";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";

interface OperatorInventoryDiagnostics {
  source: string | null;
  fetchedAt: string | null;
  partial: boolean;
  networkNodeCount: number;
  groupedStructureCount: number;
  unlinkedStructureCount: number;
  ignoredUnlinkedNodeLikeCount: number;
  warnings: string[];
}

export type OperatorInventoryQuarantinedNodeReason =
  | "missing-canonical-identity"
  | "missing-displayable-object-id"
  | "invalid-node-family"
  | "zero-structure-missing-strong-owned-proof"
  | "duplicate-canonical-node";

export interface OperatorInventoryNodeEligibilityDecision {
  index: number;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  displayName: string | null;
  status: OperatorInventoryStatus | null;
  energySourceId: string | null;
  canonicalIdentity: string | null;
  structureCount: number;
  source: string | null;
  provenance: string | null;
  rendered: boolean;
  quarantineReason: OperatorInventoryQuarantinedNodeReason | null;
  strongOwnedNodeProof: boolean;
  proofSignals: IndexedNetworkNodeProofSignal[];
  renderEligibility: IndexedNetworkNodeRenderEligibility | null;
}

export interface OperatorInventoryQuarantinedNodeRow {
  index: number;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  displayName: string | null;
  status: OperatorInventoryStatus | null;
  energySourceId: string | null;
  canonicalIdentity: string | null;
  structureCount: number;
  source: string | null;
  provenance: string | null;
  reason: OperatorInventoryQuarantinedNodeReason;
  strongOwnedNodeProof: boolean;
  proofSignals: IndexedNetworkNodeProofSignal[];
  renderEligibility: IndexedNetworkNodeRenderEligibility | null;
}

export interface AdaptedOperatorInventory {
  profile: PlayerProfile | null;
  structures: Structure[];
  unlinkedStructures: Structure[];
  nodeEligibilityDecisions: OperatorInventoryNodeEligibilityDecision[];
  quarantinedNodeRows: OperatorInventoryQuarantinedNodeRow[];
  nodeGroups: NetworkNodeGroup[];
  metrics: NetworkMetrics;
  warning: string | null;
  diagnostics: OperatorInventoryDiagnostics;
  nodeLookupsByNodeId: Map<ObjectId, NodeAssembliesLookupResult>;
}

interface MutableNetworkNodeGroupBucket {
  node: Structure;
  gates: Map<string, Structure>;
  storageUnits: Map<string, Structure>;
  turrets: Map<string, Structure>;
}

interface BuildOperatorInventoryNodeGroupsResult {
  nodeGroups: NetworkNodeGroup[];
  renderedNodeIdentityKeys: Set<string>;
  nodeEligibilityDecisions: OperatorInventoryNodeEligibilityDecision[];
  quarantinedNodeRows: OperatorInventoryQuarantinedNodeRow[];
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
  const groupedStructuresByKey = new Map<string, Structure>();
  const unlinkedStructuresByKey = new Map<string, Structure>();
  let ignoredUnlinkedNodeLikeCount = 0;

  for (const nodeGroup of response.networkNodes) {
    const nodeRow = resolveNodeGroupNodeRow(nodeGroup);
    const nodeStructure = toCompatibleStructure(nodeRow, nodeRow.objectId ?? null);
    if (nodeStructure) {
      mergeCompatibleStructure(groupedStructuresByKey, nodeStructure);
    }

    for (const structure of nodeGroup.structures) {
      const compatible = toCompatibleStructure(structure, nodeRow.objectId ?? structure.networkNodeId ?? null);
      if (compatible) {
        mergeCompatibleStructure(groupedStructuresByKey, compatible);
      }
    }
  }

  for (const structure of response.unlinkedStructures) {
    const compatible = toCompatibleStructure(structure, null);
    if (compatible) {
      if (compatible.type === "network_node") {
        ignoredUnlinkedNodeLikeCount += 1;
        continue;
      }

      const key = structureIdentityKey(compatible.objectId, compatible.assemblyId);
      if (key && groupedStructuresByKey.has(key)) {
        continue;
      }

      mergeCompatibleStructure(unlinkedStructuresByKey, compatible);
    }
  }

  const {
    nodeGroups,
    renderedNodeIdentityKeys,
    nodeEligibilityDecisions,
    quarantinedNodeRows,
  } = buildOperatorInventoryNodeGroups(response, groupedStructuresByKey);
  const structures = [...groupedStructuresByKey.values()].filter((structure) => {
    if (structure.type !== "network_node") {
      return true;
    }

    const key = structureIdentityKey(structure.objectId, structure.assemblyId);
    return key != null && renderedNodeIdentityKeys.has(key);
  });
  const unlinkedStructures = [...unlinkedStructuresByKey.values()];

  return {
    profile: toPlayerProfile(response),
    structures,
    unlinkedStructures,
    nodeEligibilityDecisions,
    quarantinedNodeRows,
    nodeGroups,
    metrics: computeMetrics(structures, nodeGroups.length),
    warning: buildOperatorInventoryWarning(response),
    diagnostics: {
      source: response.source,
      fetchedAt: response.fetchedAt,
      partial: response.partial,
      networkNodeCount: response.networkNodes.length,
      groupedStructureCount: response.networkNodes.reduce((sum, group) => sum + group.structures.length, 0),
      unlinkedStructureCount: response.unlinkedStructures.length,
      ignoredUnlinkedNodeLikeCount,
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
  const buckets = new Map<string, {
    node: NodeAssemblyNode | null;
    assemblies: NodeAssemblySummary[];
    fetchedAt: string | null;
    source: string | null;
    isPartial: boolean;
  }>();

  for (const nodeGroup of response.networkNodes) {
    const nodeRow = resolveNodeGroupNodeRow(nodeGroup);
    const lookupNodeObjectId = resolveNodeGroupLookupObjectId(nodeGroup);
    const key = structureIdentityKey(lookupNodeObjectId, nodeRow.assemblyId);
    if (!key) {
      continue;
    }

    const nodeForLookup = lookupNodeObjectId && nodeRow.objectId !== lookupNodeObjectId
      ? { ...nodeRow, objectId: lookupNodeObjectId }
      : nodeRow;
    const nextNode = toNodeAssemblyNode(nodeForLookup);
    const nextAssemblies = nodeGroup.structures.map((structure) => toNodeAssemblySummary(structure, response));
    const nextIsPartial = response.partial || nodeRow.partial || nodeGroup.structures.some((structure) => structure.partial);
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        node: nextNode,
        assemblies: nextAssemblies,
        fetchedAt: response.fetchedAt,
        source: response.source,
        isPartial: nextIsPartial,
      });
      continue;
    }

    buckets.set(key, {
      node: preferNodeAssemblyNode(existing.node, nextNode),
      assemblies: mergeNodeAssemblySummaries(existing.assemblies, nextAssemblies),
      fetchedAt: existing.fetchedAt ?? response.fetchedAt,
      source: existing.source ?? response.source,
      isPartial: existing.isPartial || nextIsPartial,
    });
  }

  const lookups = new Map<ObjectId, NodeAssembliesLookupResult>();

  for (const bucket of buckets.values()) {
    const nodeObjectId = bucket.node?.objectId;
    if (!nodeObjectId) {
      continue;
    }

    const lookup = {
      status: "success",
      networkNodeId: nodeObjectId,
      node: bucket.node,
      assemblies: bucket.assemblies,
      fetchedAt: bucket.fetchedAt,
      source: bucket.source,
      error: null,
      isPartial: bucket.isPartial,
      droppedCount: 0,
    } satisfies NodeAssembliesLookupResult;
    const lookupKeys = new Set<string>([
      nodeObjectId,
      normalizeNodeDrilldownAssemblyId(bucket.node?.assemblyId) ?? "",
      selectCanonicalNodeDrilldownDomainKey({
        objectId: nodeObjectId,
        assemblyId: bucket.node?.assemblyId,
      }) ?? "",
      ...createNodeDrilldownIdentityAliases({
        objectId: nodeObjectId,
        assemblyId: bucket.node?.assemblyId,
        renderId: nodeObjectId,
        source: "backendMembership",
      }),
    ].filter(Boolean));

    for (const key of lookupKeys) {
      if (!lookups.has(key)) {
        lookups.set(key, lookup);
      }
    }
  }

  return lookups;
}

function resolveNodeGroupLookupObjectId(nodeGroup: OperatorInventoryNode): ObjectId | null {
  const nodeObjectId = normalizeCanonicalObjectId(nodeGroup.node.objectId);
  if (nodeObjectId) {
    return nodeObjectId;
  }

  const childNodeIds = new Set<string>();
  for (const structure of nodeGroup.structures) {
    for (const value of [
      structure.networkNodeId,
      structure.actionCandidate?.actions.power?.requiredIds?.networkNodeId,
      structure.actionCandidate?.actions.rename?.requiredIds?.networkNodeId,
    ]) {
      const normalized = normalizeCanonicalObjectId(value);
      if (normalized) {
        childNodeIds.add(normalized);
      }
    }
  }

  return childNodeIds.size === 1 ? [...childNodeIds][0]! : null;
}

function buildOperatorInventoryNodeGroups(
  response: OperatorInventoryResponse,
  structuresByKey: Map<string, Structure>,
): BuildOperatorInventoryNodeGroupsResult {
  const groups = new Map<string, MutableNetworkNodeGroupBucket>();
  const renderedNodeIdentityKeys = new Set<string>();
  const nodeEligibilityDecisions: OperatorInventoryNodeEligibilityDecision[] = [];
  const quarantinedNodeRows: OperatorInventoryQuarantinedNodeRow[] = [];

  for (const [index, rawGroup] of response.networkNodes.entries()) {
    const nodeRow = resolveNodeGroupNodeRow(rawGroup);
    const groupKey = structureIdentityKey(nodeRow.objectId, nodeRow.assemblyId);
    const compatibleType = nodeRow.family ? COMPATIBLE_TYPE_BY_FAMILY[nodeRow.family] : null;
    const proofSignals = collectNodeProofSignals(nodeRow);
    const strongOwnedNodeProof = hasStrongOwnedNodeProof(nodeRow, proofSignals);
    const renderEligibility = resolveNetworkNodeRenderEligibility(rawGroup.structures.length, strongOwnedNodeProof);
    let quarantineReason: OperatorInventoryQuarantinedNodeReason | null = null;

    if (!groupKey) {
      quarantineReason = "missing-canonical-identity";
    } else if (compatibleType !== "network_node") {
      quarantineReason = "invalid-node-family";
    } else if (!normalizeCanonicalObjectId(nodeRow.objectId)) {
      quarantineReason = "missing-displayable-object-id";
    }

    const existing = groupKey ? groups.get(groupKey) : undefined;
    if (quarantineReason == null && existing) {
      quarantineReason = "duplicate-canonical-node";
    }

    if (quarantineReason == null && !existing && rawGroup.structures.length === 0 && !strongOwnedNodeProof) {
      quarantineReason = "zero-structure-missing-strong-owned-proof";
    }

    const node = groupKey ? resolveCompatibleStructure(nodeRow, nodeRow.objectId ?? null, structuresByKey) : null;
    const decision = describeNodeEligibilityDecision({
      index,
      row: nodeRow,
      structureCount: rawGroup.structures.length,
      rendered: quarantineReason == null,
      quarantineReason,
      strongOwnedNodeProof,
      proofSignals,
      renderEligibility,
    });
    nodeEligibilityDecisions.push(decision);

    if (quarantineReason && quarantineReason !== "duplicate-canonical-node") {
      quarantinedNodeRows.push(describeQuarantinedNodeRow(decision));
      continue;
    }

    if (!node || node.type !== "network_node") {
      quarantinedNodeRows.push(describeQuarantinedNodeRow({
        ...decision,
        rendered: false,
        quarantineReason: decision.quarantineReason ?? "missing-displayable-object-id",
      }));
      continue;
    }

    if (quarantineReason === "duplicate-canonical-node") {
      quarantinedNodeRows.push(describeQuarantinedNodeRow(decision));
    }

    const renderMeta = existing?.node.networkNodeRenderMeta ?? buildNetworkNodeRenderMeta(decision);
    const renderAnnotatedNode = applyNetworkNodeRenderMeta(node, renderMeta);

    const bucket = existing ?? {
      node: renderAnnotatedNode,
      gates: new Map<string, Structure>(),
      storageUnits: new Map<string, Structure>(),
      turrets: new Map<string, Structure>(),
    };

    bucket.node = existing
      ? applyNetworkNodeRenderMeta(preferCompatibleStructure(existing.node, renderAnnotatedNode), renderMeta)
      : renderAnnotatedNode;
    rebindBucketStructuresToNode(bucket, bucket.node.objectId);

    for (const rawStructure of rawGroup.structures) {
      const structure = resolveCompatibleStructure(
        rawStructure,
        nodeRow.objectId ?? rawStructure.networkNodeId ?? null,
        structuresByKey,
      );
      if (!structure || structure.type === "network_node") {
        continue;
      }

      const groupedStructure = rebindGroupedStructureToNode(structure, bucket.node.objectId);

      switch (groupedStructure.type) {
        case "gate":
          mergeGroupedStructure(bucket.gates, groupedStructure);
          break;
        case "storage_unit":
          mergeGroupedStructure(bucket.storageUnits, groupedStructure);
          break;
        case "turret":
          mergeGroupedStructure(bucket.turrets, groupedStructure);
          break;
      }
    }

    groups.set(groupKey!, bucket);
    renderedNodeIdentityKeys.add(groupKey!);
  }

  return {
    nodeGroups: [...groups.values()].map((bucket) => ({
      node: bucket.node,
      gates: [...bucket.gates.values()],
      storageUnits: [...bucket.storageUnits.values()],
      turrets: [...bucket.turrets.values()],
    })),
    renderedNodeIdentityKeys,
    nodeEligibilityDecisions,
    quarantinedNodeRows,
  };
}

function describeNodeEligibilityDecision({
  index,
  row,
  structureCount,
  rendered,
  quarantineReason,
  strongOwnedNodeProof,
  proofSignals,
  renderEligibility,
}: {
  index: number;
  row: OperatorInventoryStructure;
  structureCount: number;
  rendered: boolean;
  quarantineReason: OperatorInventoryQuarantinedNodeReason | null;
  strongOwnedNodeProof: boolean;
  proofSignals: IndexedNetworkNodeProofSignal[];
  renderEligibility: IndexedNetworkNodeRenderEligibility | null;
}): OperatorInventoryNodeEligibilityDecision {
  return {
    index,
    objectId: normalizeCanonicalObjectId(row.objectId),
    assemblyId: row.assemblyId,
    ownerCapId: normalizeCanonicalObjectId(row.ownerCapId),
    displayName: row.displayName ?? row.name ?? row.typeName ?? row.assemblyType,
    status: row.status,
    energySourceId: row.energySourceId,
    canonicalIdentity: structureIdentityKey(row.objectId, row.assemblyId),
    structureCount,
    source: row.source ?? null,
    provenance: row.provenance ?? null,
    rendered,
    quarantineReason,
    strongOwnedNodeProof,
    proofSignals,
    renderEligibility,
  };
}

function describeQuarantinedNodeRow(decision: OperatorInventoryNodeEligibilityDecision): OperatorInventoryQuarantinedNodeRow {
  return {
    index: decision.index,
    objectId: decision.objectId,
    assemblyId: decision.assemblyId,
    ownerCapId: decision.ownerCapId,
    displayName: decision.displayName,
    status: decision.status,
    energySourceId: decision.energySourceId,
    canonicalIdentity: decision.canonicalIdentity,
    structureCount: decision.structureCount,
    source: decision.source,
    provenance: decision.provenance,
    reason: decision.quarantineReason ?? "missing-canonical-identity",
    strongOwnedNodeProof: decision.strongOwnedNodeProof,
    proofSignals: decision.proofSignals,
    renderEligibility: decision.renderEligibility,
  };
}

function collectNodeProofSignals(row: OperatorInventoryStructure): IndexedNetworkNodeProofSignal[] {
  const signals: IndexedNetworkNodeProofSignal[] = [];

  if (row.assemblyId) {
    signals.push("assembly-id");
  }

  if (normalizeCanonicalObjectId(row.ownerCapId)) {
    signals.push("owner-cap-id");
  }

  if (row.status === "online" || row.status === "offline" || row.status === "warning") {
    signals.push("non-neutral-status");
  }

  if (row.fuelAmount && row.fuelAmount.trim().length > 0) {
    signals.push("fuel-amount");
  }

  if (row.powerSummary) {
    signals.push("power-summary");
  }

  if (row.energySourceId && row.energySourceId.trim().length > 0) {
    signals.push("energy-source-id");
  }

  return signals;
}

function hasStrongOwnedNodeProof(
  row: OperatorInventoryStructure,
  proofSignals: IndexedNetworkNodeProofSignal[],
): boolean {
  if (!normalizeCanonicalObjectId(row.objectId) || !proofSignals.includes("owner-cap-id")) {
    return false;
  }

  return proofSignals.includes("non-neutral-status")
    || proofSignals.includes("fuel-amount")
    || proofSignals.includes("power-summary")
    || proofSignals.includes("energy-source-id");
}

function resolveNetworkNodeRenderEligibility(
  groupedStructureCount: number,
  strongOwnedNodeProof: boolean,
): IndexedNetworkNodeRenderEligibility | null {
  if (groupedStructureCount > 0) {
    return "grouped-structures";
  }

  if (strongOwnedNodeProof) {
    return "strong-owned-node-proof";
  }

  return null;
}

function buildNetworkNodeRenderMeta(decision: OperatorInventoryNodeEligibilityDecision): IndexedNetworkNodeRenderMeta {
  return {
    rawNodeIndex: decision.index,
    canonicalIdentity: decision.canonicalIdentity,
    strongOwnedNodeProof: decision.strongOwnedNodeProof,
    proofSignals: decision.proofSignals,
    renderEligibility: decision.renderEligibility,
  };
}

function applyNetworkNodeRenderMeta(
  structure: Structure,
  networkNodeRenderMeta: IndexedNetworkNodeRenderMeta,
): Structure {
  if (structure.type !== "network_node") {
    return structure;
  }

  return {
    ...structure,
    networkNodeRenderMeta,
  };
}

function toNodeAssemblyNode(row: OperatorInventoryStructure): NodeAssemblyNode {
  return {
    objectId: row.objectId ?? "",
    name: row.name,
    displayName: row.displayName,
    displayNameSource: row.displayNameSource,
    displayNameUpdatedAt: row.displayNameUpdatedAt,
    status: row.status,
    assemblyId: row.assemblyId,
    solarSystemId: row.solarSystemId,
    energySourceId: row.energySourceId,
    fuelAmount: row.fuelAmount,
    powerSummary: row.powerSummary,
    powerUsageSummary: row.powerUsageSummary,
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
    displayNameSource: row.displayNameSource,
    displayNameUpdatedAt: row.displayNameUpdatedAt,
    family: row.family,
    size: row.size,
    status: row.status,
    fuelAmount: row.fuelAmount,
    powerSummary: row.powerSummary,
    powerRequirement: row.powerRequirement,
    solarSystemId: row.solarSystemId,
    networkNodeId: row.networkNodeId,
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

function resolveCompatibleStructure(
  row: OperatorInventoryStructure,
  networkNodeId: ObjectId | null,
  structuresByKey: Map<string, Structure>,
): Structure | null {
  const key = structureIdentityKey(row.objectId, row.assemblyId);
  if (key) {
    const existing = structuresByKey.get(key);
    if (existing) {
      return existing;
    }
  }

  return toCompatibleStructure(row, networkNodeId);
}

function toCompatibleStructure(
  row: OperatorInventoryStructure,
  networkNodeId: ObjectId | null,
): Structure | null {
  void networkNodeId;
  const compatibleType = row.family ? COMPATIBLE_TYPE_BY_FAMILY[row.family] : null;
  if (!compatibleType || !row.objectId) {
    return null;
  }

  const explicitNetworkNodeId = row.networkNodeId
    ?? row.actionCandidate?.actions.power?.requiredIds?.networkNodeId
    ?? row.actionCandidate?.actions.rename?.requiredIds?.networkNodeId
    ?? null;
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
    networkNodeId: compatibleType === "network_node" ? undefined : explicitNetworkNodeId ?? undefined,
    indexedFuelAmount: row.fuelAmount,
    indexedPowerSummary: row.powerSummary,
    indexedPowerRequirement: row.powerRequirement,
    indexedPowerUsageSummary: row.powerUsageSummary,
    linkedGateId: row.linkedGateId ?? undefined,
    summary: summary ?? undefined,
    extensionStatus: coerceExtensionStatus(row.extensionStatus),
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
    displayNameSource: row.displayNameSource,
    displayNameUpdatedAt: row.displayNameUpdatedAt,
    status: row.status,
    fuelAmount: row.fuelAmount,
    powerSummary: row.powerSummary,
    powerRequirement: row.powerRequirement,
    powerUsageSummary: row.powerUsageSummary,
    solarSystemId: row.solarSystemId,
    ownerCapId: row.ownerCapId,
    networkNodeId: row.networkNodeId,
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
  const key = structureIdentityKey(structure.objectId, structure.assemblyId);
  if (!key) return;

  const existing = structuresByKey.get(key);
  if (!existing) {
    structuresByKey.set(key, structure);
    return;
  }

  structuresByKey.set(key, preferCompatibleStructure(existing, structure));
}

function mergeGroupedStructure(bucket: Map<string, Structure>, structure: Structure) {
  const key = structureIdentityKey(structure.objectId, structure.assemblyId);
  if (!key) {
    return;
  }

  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, structure);
    return;
  }

  bucket.set(key, preferCompatibleStructure(existing, structure));
}

function rebindBucketStructuresToNode(bucket: MutableNetworkNodeGroupBucket, networkNodeId: string) {
  bucket.gates = rebindGroupedStructureMap(bucket.gates, networkNodeId);
  bucket.storageUnits = rebindGroupedStructureMap(bucket.storageUnits, networkNodeId);
  bucket.turrets = rebindGroupedStructureMap(bucket.turrets, networkNodeId);
}

function rebindGroupedStructureMap(bucket: Map<string, Structure>, networkNodeId: string): Map<string, Structure> {
  const rebound = new Map<string, Structure>();

  for (const [key, structure] of bucket.entries()) {
    rebound.set(key, rebindGroupedStructureToNode(structure, networkNodeId));
  }

  return rebound;
}

function rebindGroupedStructureToNode(structure: Structure, networkNodeId: string): Structure {
  if (structure.type === "network_node" || structure.networkNodeId === networkNodeId) {
    return structure;
  }

  return {
    ...structure,
    networkNodeId,
  };
}

function preferTextValue(preferred: string | null | undefined, fallback: string | null | undefined): string | null {
  const preferredValue = typeof preferred === "string" && preferred.trim().length > 0 ? preferred : null;
  if (preferredValue) {
    return preferredValue;
  }

  return typeof fallback === "string" && fallback.trim().length > 0 ? fallback : null;
}

function mergeWarnings(
  preferred: string[] | null | undefined,
  fallback: string[] | null | undefined,
): string[] | undefined {
  if (preferred && preferred.length > 0) {
    return preferred;
  }

  if (fallback && fallback.length > 0) {
    return fallback;
  }

  return undefined;
}

function mergeAssemblySummary(
  preferred: AssemblySummary | undefined,
  fallback: AssemblySummary | undefined,
): AssemblySummary | undefined {
  if (!preferred) {
    return fallback;
  }

  if (!fallback) {
    return preferred;
  }

  return {
    ...fallback,
    ...preferred,
    assemblyId: preferred.assemblyId ?? fallback.assemblyId,
    assemblyType: preferTextValue(preferred.assemblyType, fallback.assemblyType),
    typeId: preferred.typeId ?? fallback.typeId,
    name: preferTextValue(preferred.name, fallback.name),
    displayName: preferTextValue(preferred.displayName ?? null, fallback.displayName ?? null),
    displayNameSource: preferTextValue(preferred.displayNameSource ?? null, fallback.displayNameSource ?? null),
    displayNameUpdatedAt: preferTextValue(preferred.displayNameUpdatedAt ?? null, fallback.displayNameUpdatedAt ?? null),
    status: preferTextValue(preferred.status, fallback.status),
    fuelAmount: preferTextValue(preferred.fuelAmount, fallback.fuelAmount),
    powerSummary: preferred.powerSummary ?? fallback.powerSummary,
    powerRequirement: preferred.powerRequirement ?? fallback.powerRequirement,
    powerUsageSummary: preferred.powerUsageSummary ?? fallback.powerUsageSummary,
    solarSystemId: preferTextValue(preferred.solarSystemId, fallback.solarSystemId),
    networkNodeId: preferTextValue(preferred.networkNodeId ?? null, fallback.networkNodeId ?? null),
    energySourceId: preferTextValue(preferred.energySourceId, fallback.energySourceId),
    url: preferTextValue(preferred.url, fallback.url),
    lastUpdated: preferTextValue(preferred.lastUpdated, fallback.lastUpdated),
    typeName: preferTextValue(preferred.typeName, fallback.typeName),
    family: preferTextValue(preferred.family ?? null, fallback.family ?? null),
    size: preferTextValue(preferred.size ?? null, fallback.size ?? null),
    source: preferTextValue(preferred.source ?? null, fallback.source ?? null),
    provenance: preferTextValue(preferred.provenance ?? null, fallback.provenance ?? null),
    lastObservedCheckpoint: preferTextValue(preferred.lastObservedCheckpoint ?? null, fallback.lastObservedCheckpoint ?? null),
    lastObservedTimestamp: preferTextValue(preferred.lastObservedTimestamp ?? null, fallback.lastObservedTimestamp ?? null),
    extensionStatus: preferred.extensionStatus ?? fallback.extensionStatus,
    partial: preferred.partial ?? fallback.partial,
    warnings: mergeWarnings(preferred.warnings, fallback.warnings),
    actionCandidate: preferred.actionCandidate ?? fallback.actionCandidate,
  };
}

function mergeCompatibleStructureFields(preferred: Structure, fallback: Structure): Structure {
  return {
    ...fallback,
    ...preferred,
    assemblyId: preferred.assemblyId ?? fallback.assemblyId,
    ownerCapId: preferTextValue(preferred.ownerCapId, fallback.ownerCapId) ?? "",
    name: preferTextValue(preferred.name, fallback.name) ?? preferred.name,
    networkNodeId: preferTextValue(preferred.networkNodeId ?? null, fallback.networkNodeId ?? null) ?? undefined,
    indexedFuelAmount: preferTextValue(preferred.indexedFuelAmount ?? null, fallback.indexedFuelAmount ?? null),
    indexedPowerSummary: preferred.indexedPowerSummary ?? fallback.indexedPowerSummary,
    indexedPowerRequirement: preferred.indexedPowerRequirement ?? fallback.indexedPowerRequirement,
    indexedPowerUsageSummary: preferred.indexedPowerUsageSummary ?? fallback.indexedPowerUsageSummary,
    linkedGateId: preferTextValue(preferred.linkedGateId ?? null, fallback.linkedGateId ?? null) ?? undefined,
    summary: mergeAssemblySummary(preferred.summary, fallback.summary),
    networkNodeRenderMeta: preferred.networkNodeRenderMeta ?? fallback.networkNodeRenderMeta,
    extensionStatus: mergeExtensionStatus(preferred.extensionStatus, fallback.extensionStatus),
  };
}

function compareDisplayFreshness(
  existingSource: string | null | undefined,
  existingUpdatedAt: string | null | undefined,
  incomingSource: string | null | undefined,
  incomingUpdatedAt: string | null | undefined,
): number {
  const existingTime = existingUpdatedAt ? Date.parse(existingUpdatedAt) : Number.NaN;
  const incomingTime = incomingUpdatedAt ? Date.parse(incomingUpdatedAt) : Number.NaN;

  if (Number.isFinite(existingTime) && Number.isFinite(incomingTime) && existingTime !== incomingTime) {
    return incomingTime - existingTime;
  }

  if (!existingUpdatedAt && incomingUpdatedAt) {
    return 1;
  }

  if (existingUpdatedAt && !incomingUpdatedAt) {
    return -1;
  }

  if (!existingSource && incomingSource) {
    return 1;
  }

  if (existingSource && !incomingSource) {
    return -1;
  }

  return 0;
}

function mergeNodeAssemblyNodeFields(preferred: NodeAssemblyNode, fallback: NodeAssemblyNode): NodeAssemblyNode {
  return {
    ...fallback,
    ...preferred,
    objectId: preferTextValue(preferred.objectId, fallback.objectId) ?? fallback.objectId,
    name: preferTextValue(preferred.name, fallback.name),
    displayName: preferTextValue(preferred.displayName ?? null, fallback.displayName ?? null),
    displayNameSource: preferTextValue(preferred.displayNameSource ?? null, fallback.displayNameSource ?? null),
    displayNameUpdatedAt: preferTextValue(preferred.displayNameUpdatedAt ?? null, fallback.displayNameUpdatedAt ?? null),
    status: preferTextValue(preferred.status, fallback.status),
    assemblyId: preferTextValue(preferred.assemblyId, fallback.assemblyId),
    solarSystemId: preferTextValue(preferred.solarSystemId, fallback.solarSystemId),
    energySourceId: preferTextValue(preferred.energySourceId, fallback.energySourceId),
    fuelAmount: preferTextValue(preferred.fuelAmount ?? null, fallback.fuelAmount ?? null),
    powerSummary: preferred.powerSummary ?? fallback.powerSummary,
    powerUsageSummary: preferred.powerUsageSummary ?? fallback.powerUsageSummary,
  };
}

function mergeNodeAssemblySummaryFields(
  preferred: NodeAssemblySummary,
  fallback: NodeAssemblySummary,
): NodeAssemblySummary {
  return {
    ...fallback,
    ...preferred,
    objectId: preferTextValue(preferred.objectId, fallback.objectId),
    assemblyId: preferTextValue(preferred.assemblyId, fallback.assemblyId),
    linkedGateId: preferTextValue(preferred.linkedGateId, fallback.linkedGateId),
    assemblyType: preferTextValue(preferred.assemblyType, fallback.assemblyType),
    typeId: preferred.typeId ?? fallback.typeId,
    name: preferTextValue(preferred.name, fallback.name),
    displayName: preferTextValue(preferred.displayName ?? null, fallback.displayName ?? null),
    displayNameSource: preferTextValue(preferred.displayNameSource ?? null, fallback.displayNameSource ?? null),
    displayNameUpdatedAt: preferTextValue(preferred.displayNameUpdatedAt ?? null, fallback.displayNameUpdatedAt ?? null),
    family: preferTextValue(preferred.family ?? null, fallback.family ?? null),
    size: preferTextValue(preferred.size ?? null, fallback.size ?? null),
    status: preferTextValue(preferred.status, fallback.status),
    fuelAmount: preferTextValue(preferred.fuelAmount, fallback.fuelAmount),
    powerSummary: preferred.powerSummary ?? fallback.powerSummary,
    powerRequirement: preferred.powerRequirement ?? fallback.powerRequirement,
    solarSystemId: preferTextValue(preferred.solarSystemId, fallback.solarSystemId),
    networkNodeId: preferTextValue(preferred.networkNodeId ?? null, fallback.networkNodeId ?? null),
    energySourceId: preferTextValue(preferred.energySourceId, fallback.energySourceId),
    url: preferTextValue(preferred.url, fallback.url),
    lastUpdated: preferTextValue(preferred.lastUpdated, fallback.lastUpdated),
    lastObservedCheckpoint: preferTextValue(preferred.lastObservedCheckpoint ?? null, fallback.lastObservedCheckpoint ?? null),
    lastObservedTimestamp: preferTextValue(preferred.lastObservedTimestamp ?? null, fallback.lastObservedTimestamp ?? null),
    typeName: preferTextValue(preferred.typeName, fallback.typeName),
    ownerCapId: preferTextValue(preferred.ownerCapId ?? null, fallback.ownerCapId ?? null),
    ownerWalletAddress: preferTextValue(preferred.ownerWalletAddress ?? null, fallback.ownerWalletAddress ?? null),
    characterId: preferTextValue(preferred.characterId ?? null, fallback.characterId ?? null),
    extensionStatus: preferred.extensionStatus ?? fallback.extensionStatus,
    partial: preferred.partial ?? fallback.partial,
    warnings: mergeWarnings(preferred.warnings, fallback.warnings),
    actionCandidate: preferred.actionCandidate ?? fallback.actionCandidate,
    source: preferTextValue(preferred.source ?? null, fallback.source ?? null),
    provenance: preferTextValue(preferred.provenance ?? null, fallback.provenance ?? null),
  };
}

function preferCompatibleStructure(existing: Structure, incoming: Structure): Structure {
  const displayFreshness = compareDisplayFreshness(
    existing.summary?.displayNameSource,
    existing.summary?.displayNameUpdatedAt,
    incoming.summary?.displayNameSource,
    incoming.summary?.displayNameUpdatedAt,
  );
  const existingScore = compatibilityStructureScore(existing);
  const incomingScore = compatibilityStructureScore(incoming);
  const preferred = displayFreshness > 0
    ? incoming
    : displayFreshness < 0
      ? existing
      : incomingScore > existingScore
    ? incoming
    : incomingScore < existingScore
      ? existing
      : !existing.networkNodeId && incoming.networkNodeId
        ? incoming
        : !existing.indexedFuelAmount && incoming.indexedFuelAmount
          ? incoming
          : !existing.indexedPowerSummary && incoming.indexedPowerSummary
            ? incoming
            : !existing.summary?.displayNameSource && incoming.summary?.displayNameSource
              ? incoming
              : !existing.summary?.displayNameUpdatedAt && incoming.summary?.displayNameUpdatedAt
                ? incoming
                : existing;
  const fallback = preferred === existing ? incoming : existing;

  return mergeCompatibleStructureFields(preferred, fallback);
}

function compatibilityStructureScore(structure: Structure): number {
  let score = 0;
  if (structure.ownerCapId) score += 3;
  if (structure.summary) score += 2;
  if (structure.summary?.actionCandidate) score += 2;
  if (structure.summary?.displayNameSource) score += 1;
  if (structure.summary?.displayNameUpdatedAt) score += 1;
  if (structure.indexedFuelAmount) score += 1;
  if (structure.indexedPowerSummary) score += 2;
  if (structure.indexedPowerRequirement) score += 2;
  if (structure.indexedPowerUsageSummary) score += 2;
  if (structure.networkNodeId) score += 1;
  if (structure.extensionStatus === "authorized") score += 1;
  return score;
}

function mergeNodeAssemblySummaries(
  existing: NodeAssemblySummary[],
  incoming: NodeAssemblySummary[],
): NodeAssemblySummary[] {
  const summaries = new Map<string, NodeAssemblySummary>();

  for (const summary of [...existing, ...incoming]) {
    const key = structureIdentityKey(summary.objectId, summary.assemblyId);
    if (!key) {
      continue;
    }

    const previous = summaries.get(key);
    if (!previous) {
      summaries.set(key, summary);
      continue;
    }

    summaries.set(key, preferNodeAssemblySummary(previous, summary));
  }

  return [...summaries.values()];
}

function preferNodeAssemblyNode(
  existing: NodeAssemblyNode | null,
  incoming: NodeAssemblyNode | null,
): NodeAssemblyNode | null {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const existingScore = (existing.displayName ? 2 : 0)
    + (existing.name ? 1 : 0)
    + (existing.displayNameSource ? 1 : 0)
    + (existing.displayNameUpdatedAt ? 1 : 0)
    + (existing.assemblyId ? 1 : 0)
    + (existing.fuelAmount ? 1 : 0)
    + (existing.powerSummary ? 2 : 0)
    + (existing.energySourceId ? 1 : 0);
  const incomingScore = (incoming.displayName ? 2 : 0)
    + (incoming.name ? 1 : 0)
    + (incoming.displayNameSource ? 1 : 0)
    + (incoming.displayNameUpdatedAt ? 1 : 0)
    + (incoming.assemblyId ? 1 : 0)
    + (incoming.fuelAmount ? 1 : 0)
    + (incoming.powerSummary ? 2 : 0)
    + (incoming.powerUsageSummary ? 2 : 0)
    + (incoming.energySourceId ? 1 : 0);
  const displayFreshness = compareDisplayFreshness(
    existing.displayNameSource,
    existing.displayNameUpdatedAt,
    incoming.displayNameSource,
    incoming.displayNameUpdatedAt,
  );
  const preferred = displayFreshness > 0
    ? incoming
    : displayFreshness < 0
      ? existing
      : incomingScore > existingScore
        ? incoming
        : existing;
  const fallback = preferred === existing ? incoming : existing;

  return mergeNodeAssemblyNodeFields(preferred, fallback);
}

function preferNodeAssemblySummary(
  existing: NodeAssemblySummary,
  incoming: NodeAssemblySummary,
): NodeAssemblySummary {
  const displayFreshness = compareDisplayFreshness(
    existing.displayNameSource,
    existing.displayNameUpdatedAt,
    incoming.displayNameSource,
    incoming.displayNameUpdatedAt,
  );
  const existingScore = nodeAssemblySummaryScore(existing);
  const incomingScore = nodeAssemblySummaryScore(incoming);
  const preferred = displayFreshness > 0
    ? incoming
    : displayFreshness < 0
      ? existing
      : incomingScore > existingScore
    ? incoming
    : incomingScore < existingScore
      ? existing
      : !existing.energySourceId && incoming.energySourceId
        ? incoming
        : !existing.powerSummary && incoming.powerSummary
          ? incoming
          : existing;
  const fallback = preferred === existing ? incoming : existing;

  return mergeNodeAssemblySummaryFields(preferred, fallback);
}

function nodeAssemblySummaryScore(summary: NodeAssemblySummary): number {
  let score = 0;
  if (summary.objectId) score += 3;
  if (summary.ownerCapId) score += 3;
  if (summary.assemblyId) score += 1;
  if (summary.actionCandidate) score += 1;
  if (summary.powerSummary) score += 2;
  if (summary.powerRequirement) score += 2;
  if (summary.displayNameSource) score += 1;
  if (summary.displayNameUpdatedAt) score += 1;
  if (summary.displayName || summary.name) score += 1;
  return score;
}

function structureIdentityKey(objectId: string | null | undefined, assemblyId: string | null | undefined): string | null {
  return selectCanonicalNodeDrilldownDomainKey({
    objectId,
    assemblyId,
  });
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
    parts.push(`${unlinkedCount} indexed structure${unlinkedCount === 1 ? " is" : "s are"} currently unlinked from a network node and excluded from governed inventory until they relink.`);
  }

  if (warningCount > 0) {
    parts.push(response.partial
      ? `${warningCount} backend warning${warningCount === 1 ? " was" : "s were"} reported.`
      : response.warnings[0]);
  }

  return parts.join(" ");
}

function computeMetrics(structures: Structure[], networkNodeCount: number): NetworkMetrics {
  return {
    totalStructures: structures.length,
    onlineCount: structures.filter((structure) => structure.status === "online").length,
    gateCount: structures.filter((structure) => structure.type === "gate").length,
    governedGateCount: structures.filter((structure) => structure.type === "gate" && structure.extensionStatus === "authorized").length,
    storageUnitCount: structures.filter((structure) => structure.type === "storage_unit").length,
    turretCount: structures.filter((structure) => structure.type === "turret").length,
    networkNodeCount,
    enforcedDirectives: structures.filter((structure) => structure.extensionStatus === "authorized").length,
  };
}

function resolveNodeGroupNodeRow(nodeGroup: OperatorInventoryNode): OperatorInventoryStructure {
  if (nodeGroup.node.powerUsageSummary != null || nodeGroup.powerUsageSummary == null) {
    return nodeGroup.node;
  }

  return {
    ...nodeGroup.node,
    powerUsageSummary: nodeGroup.powerUsageSummary,
  };
}
