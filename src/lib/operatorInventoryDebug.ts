import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import { normalizeNodeDrilldownAssemblyId } from "@/lib/nodeDrilldownIdentity";
import type { NodeLocalStructure, NodeLocalSourceMode } from "@/lib/nodeDrilldownTypes";
import type { AdaptedOperatorInventory } from "@/lib/operatorInventoryAdapter";
import type { AssetDiscoveryDisplayDebugState } from "@/lib/assetDiscoveryDisplayModel";
import type { NetworkNodeGroup, Structure } from "@/types/domain";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "@/types/operatorInventory";

export interface OperatorInventoryDebugIdentityRow {
  category: string;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  canonicalDomainKey: string | null;
  displayName: string | null;
  status: string | null;
  family: string | null;
  sourceLabel: string;
  networkNodeId: string | null;
}

export interface OperatorInventoryDebugDuplicateBucket {
  key: string;
  count: number;
  rows: OperatorInventoryDebugIdentityRow[];
}

export interface OperatorInventoryDebugRawNode {
  objectId: string | null;
  assemblyId: string | null;
  type: string | null;
  status: string | null;
  source: string | null;
  structureCount: number;
}

export interface OperatorInventoryDebugRenderedMacroNode {
  objectId: string | null;
  assemblyId: string | null;
  canonicalDomainKey: string | null;
  sourceLabels: string[];
  structureCount: number;
  childObjectIds: string[];
  childCanonicalDomainKeys: string[];
  lacksIdentity: boolean;
}

export interface OperatorInventoryDebugSnapshot {
  operatorWalletAddress: string | null;
  operatorInventorySucceeded: boolean;
  operatorInventoryFailed: boolean;
  operatorInventoryErrorMessage: string | null;
  rawNetworkNodeCount: number;
  rawNetworkNodes: OperatorInventoryDebugRawNode[];
  rawGroupedRows: OperatorInventoryDebugIdentityRow[];
  rawUnlinkedStructureCount: number;
  rawUnlinkedRows: OperatorInventoryDebugIdentityRow[];
  adaptedStructureCount: number;
  adaptedNetworkNodeGroupCount: number;
  displayStructureRows: OperatorInventoryDebugIdentityRow[];
  renderedMacroNetworkNodeCount: number;
  renderedMacroNodes: OperatorInventoryDebugRenderedMacroNode[];
  renderedNodeControlSourceMode: NodeLocalSourceMode | null;
  renderedNodeControlSelectedNodeId: string | null;
  renderedNodeControlSelectedNodeStructuresCount: number;
  renderedNodeControlRows: OperatorInventoryDebugIdentityRow[];
  duplicateBucketsByObjectId: OperatorInventoryDebugDuplicateBucket[];
  duplicateBucketsByOwnerCapId: OperatorInventoryDebugDuplicateBucket[];
  duplicateBucketsByCanonicalDomainKey: OperatorInventoryDebugDuplicateBucket[];
  rowsMissingObjectIdOrCanonicalIdentity: OperatorInventoryDebugIdentityRow[];
  directChainFallbackRan: boolean;
  nodeAssembliesFallbackEnabled: boolean;
  nodeAssembliesFallbackRan: boolean;
  mergedIntoDisplay: boolean;
  displayUsesDirectChainFallback: boolean;
}

export interface OperatorInventoryDebugController {
  enabled: boolean;
  latest: OperatorInventoryDebugSnapshot | null;
  clear: () => void;
}

interface BuildOperatorInventoryDebugSnapshotInput {
  inventory: OperatorInventoryResponse | null;
  adapted: AdaptedOperatorInventory | null;
  displayStructures: Structure[];
  displayNodeGroups: NetworkNodeGroup[];
  selectedNodeRows: NodeLocalStructure[];
  selectedNodeSourceMode: NodeLocalSourceMode | null;
  selectedNodeId: string | null;
  readModelDebug: AssetDiscoveryDisplayDebugState;
  nodeAssembliesFallbackEnabled: boolean;
  nodeAssembliesFallbackRan: boolean;
  operatorInventoryErrorMessage: string | null;
}

export function buildOperatorInventoryDebugSnapshot(
  input: BuildOperatorInventoryDebugSnapshotInput,
): OperatorInventoryDebugSnapshot {
  const rawGroupedRows = input.inventory?.networkNodes.flatMap((group) => (
    group.structures.map((row) => describeRawStructure(row, "grouped", group.node.objectId))
  )) ?? [];
  const rawUnlinkedRows = input.inventory?.unlinkedStructures.map((row) => describeRawStructure(row, "unlinked", null)) ?? [];
  const displayStructureRows = input.displayStructures.map(describeDisplayStructure);
  const renderedNodeControlRows = input.selectedNodeRows.map(describeNodeControlRow);
  const renderedMacroNodes = input.displayNodeGroups.map((group) => describeRenderedMacroNode(group, input.readModelDebug));
  const missingIdentityRows = [
    ...displayStructureRows,
    ...rawGroupedRows,
    ...rawUnlinkedRows,
    ...renderedNodeControlRows,
  ].filter((row) => !row.objectId || !row.canonicalDomainKey);

  return {
    operatorWalletAddress: input.inventory?.operator?.walletAddress ?? null,
    operatorInventorySucceeded: input.readModelDebug.operatorInventorySucceeded,
    operatorInventoryFailed: input.readModelDebug.operatorInventoryFailed,
    operatorInventoryErrorMessage: input.operatorInventoryErrorMessage,
    rawNetworkNodeCount: input.inventory?.networkNodes.length ?? 0,
    rawNetworkNodes: input.inventory?.networkNodes.map((group) => ({
      objectId: normalizeCanonicalObjectId(group.node.objectId),
      assemblyId: normalizeNodeDrilldownAssemblyId(group.node.assemblyId),
      type: group.node.assemblyType ?? group.node.family ?? group.node.typeName,
      status: group.node.status,
      source: group.node.source ?? null,
      structureCount: group.structures.length,
    })) ?? [],
    rawGroupedRows,
    rawUnlinkedStructureCount: input.inventory?.unlinkedStructures.length ?? 0,
    rawUnlinkedRows,
    adaptedStructureCount: input.adapted?.structures.length ?? 0,
    adaptedNetworkNodeGroupCount: input.adapted?.nodeGroups.length ?? 0,
    displayStructureRows,
    renderedMacroNetworkNodeCount: input.displayNodeGroups.length,
    renderedMacroNodes,
    renderedNodeControlSourceMode: input.selectedNodeSourceMode,
    renderedNodeControlSelectedNodeId: input.selectedNodeId,
    renderedNodeControlSelectedNodeStructuresCount: input.selectedNodeRows.length,
    renderedNodeControlRows,
    duplicateBucketsByObjectId: buildDuplicateBuckets(displayStructureRows, (row) => row.objectId),
    duplicateBucketsByOwnerCapId: buildDuplicateBuckets(displayStructureRows, (row) => row.ownerCapId),
    duplicateBucketsByCanonicalDomainKey: buildDuplicateBuckets(displayStructureRows, (row) => row.canonicalDomainKey),
    rowsMissingObjectIdOrCanonicalIdentity: missingIdentityRows,
    directChainFallbackRan: input.readModelDebug.directChainFallbackRan,
    nodeAssembliesFallbackEnabled: input.nodeAssembliesFallbackEnabled,
    nodeAssembliesFallbackRan: input.nodeAssembliesFallbackRan,
    mergedIntoDisplay: input.readModelDebug.mergedIntoDisplay,
    displayUsesDirectChainFallback: input.readModelDebug.displayUsesDirectChainFallback,
  };
}

function describeRawStructure(
  row: OperatorInventoryStructure,
  category: "grouped" | "unlinked",
  parentNodeId: string | null,
): OperatorInventoryDebugIdentityRow {
  return {
    category,
    objectId: normalizeCanonicalObjectId(row.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(row.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(row.ownerCapId),
    canonicalDomainKey: canonicalDomainKey(row.objectId, row.assemblyId),
    displayName: row.displayName ?? row.name ?? row.typeName ?? row.assemblyType,
    status: row.status,
    family: row.family,
    sourceLabel: category === "grouped"
      ? `operator-inventory.grouped:${normalizeCanonicalObjectId(parentNodeId) ?? "missing-parent"}`
      : "operator-inventory.unlinked",
    networkNodeId: normalizeCanonicalObjectId(row.networkNodeId) ?? normalizeCanonicalObjectId(parentNodeId),
  };
}

function describeDisplayStructure(structure: Structure): OperatorInventoryDebugIdentityRow {
  return {
    category: "display-structure",
    objectId: normalizeCanonicalObjectId(structure.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(structure.ownerCapId),
    canonicalDomainKey: canonicalDomainKey(structure.objectId, structure.assemblyId),
    displayName: structure.name,
    status: structure.status,
    family: structure.type,
    sourceLabel: structure.readModelSource ?? "unknown",
    networkNodeId: normalizeCanonicalObjectId(structure.networkNodeId),
  };
}

function describeNodeControlRow(structure: NodeLocalStructure): OperatorInventoryDebugIdentityRow {
  return {
    category: "node-control",
    objectId: normalizeCanonicalObjectId(structure.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(structure.actionAuthority.verifiedTarget?.ownerCapId ?? null),
    canonicalDomainKey: structure.canonicalDomainKey,
    displayName: structure.displayName,
    status: structure.status,
    family: structure.family,
    sourceLabel: structure.source,
    networkNodeId: normalizeCanonicalObjectId(structure.actionAuthority.verifiedTarget?.networkNodeId ?? null),
  };
}

function describeRenderedMacroNode(
  group: NetworkNodeGroup,
  readModelDebug: AssetDiscoveryDisplayDebugState,
): OperatorInventoryDebugRenderedMacroNode {
  const childStructures = [...group.gates, ...group.storageUnits, ...group.turrets];
  const sourceLabels = new Set<string>();

  sourceLabels.add(readModelDebug.operatorInventoryDisplayActive
    ? "operator-inventory.networkNodes[]"
    : "direct-chain.fallback-grouped");
  sourceLabels.add(group.node.readModelSource ?? "unknown");

  for (const child of childStructures) {
    sourceLabels.add(child.readModelSource ?? "unknown");
  }

  const objectId = normalizeCanonicalObjectId(group.node.objectId);
  const assemblyId = normalizeNodeDrilldownAssemblyId(group.node.assemblyId);
  const canonicalKey = canonicalDomainKey(group.node.objectId, group.node.assemblyId);

  return {
    objectId,
    assemblyId,
    canonicalDomainKey: canonicalKey,
    sourceLabels: [...sourceLabels].sort(),
    structureCount: childStructures.length,
    childObjectIds: childStructures
      .map((child) => normalizeCanonicalObjectId(child.objectId))
      .filter((value): value is string => Boolean(value)),
    childCanonicalDomainKeys: childStructures
      .map((child) => canonicalDomainKey(child.objectId, child.assemblyId))
      .filter((value): value is string => Boolean(value)),
    lacksIdentity: !objectId || !canonicalKey,
  };
}

function buildDuplicateBuckets(
  rows: OperatorInventoryDebugIdentityRow[],
  getKey: (row: OperatorInventoryDebugIdentityRow) => string | null,
): OperatorInventoryDebugDuplicateBucket[] {
  const buckets = new Map<string, OperatorInventoryDebugIdentityRow[]>();

  for (const row of rows) {
    const key = getKey(row);
    if (!key) {
      continue;
    }

    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .filter(([, rowsForKey]) => rowsForKey.length > 1)
    .map(([key, rowsForKey]) => ({
      key,
      count: rowsForKey.length,
      rows: rowsForKey,
    }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function canonicalDomainKey(objectId: string | null | undefined, assemblyId: string | null | undefined): string | null {
  const normalizedObjectId = normalizeCanonicalObjectId(objectId);
  if (normalizedObjectId) {
    return `object:${normalizedObjectId}`;
  }

  const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(assemblyId);
  if (normalizedAssemblyId) {
    return `assembly:${normalizedAssemblyId}`;
  }

  return null;
}