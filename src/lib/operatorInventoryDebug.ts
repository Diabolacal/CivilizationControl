import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import {
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
} from "@/lib/nodeDrilldownIdentity";
import { buildOperatorInventoryUrl } from "@/lib/operatorInventoryClient";
import type { NodeLocalStructure, NodeLocalSourceMode } from "@/lib/nodeDrilldownTypes";
import type { AdaptedOperatorInventory } from "@/lib/operatorInventoryAdapter";
import type { AssetDiscoveryDisplayDebugState } from "@/lib/assetDiscoveryDisplayModel";
import type {
  IndexedNetworkNodeProofSignal,
  IndexedNetworkNodeRenderEligibility,
  NetworkNodeGroup,
  Structure,
} from "@/types/domain";
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
  index: number;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  displayName: string | null;
  type: string | null;
  status: string | null;
  energySourceId: string | null;
  canonicalIdentity: string | null;
  source: string | null;
  provenance: string | null;
  structureCount: number;
  rendered: boolean;
  quarantineReason: string | null;
  strongOwnedNodeProof: boolean;
  proofSignals: IndexedNetworkNodeProofSignal[];
  renderEligibility: IndexedNetworkNodeRenderEligibility | null;
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
  requestedWalletAddress: string | null;
  rawOperatorWalletAddress: string | null;
  operatorWalletAddress: string | null;
  operatorInventoryUrl: string | null;
  operatorInventorySucceeded: boolean;
  operatorInventoryFailed: boolean;
  operatorInventoryErrorMessage: string | null;
  rawNetworkNodeCount: number;
  rawNetworkNodes: OperatorInventoryDebugRawNode[];
  rawNetworkNodeDuplicateBucketsByObjectId: OperatorInventoryDebugDuplicateBucket[];
  rawNetworkNodeDuplicateBucketsByAssemblyId: OperatorInventoryDebugDuplicateBucket[];
  rawNetworkNodeDuplicateBucketsByOwnerCapId: OperatorInventoryDebugDuplicateBucket[];
  rawNetworkNodeDuplicateBucketsByCanonicalIdentity: OperatorInventoryDebugDuplicateBucket[];
  groupedNodeEligibilityDecisions: OperatorInventoryDebugRawNode[];
  rawGroupedRows: OperatorInventoryDebugIdentityRow[];
  rawGroupedDuplicateBucketsByObjectId: OperatorInventoryDebugDuplicateBucket[];
  rawGroupedDuplicateBucketsByOwnerCapId: OperatorInventoryDebugDuplicateBucket[];
  rawGroupedDuplicateBucketsByCanonicalDomainKey: OperatorInventoryDebugDuplicateBucket[];
  rawUnlinkedStructureCount: number;
  rawUnlinkedRows: OperatorInventoryDebugIdentityRow[];
  adaptedStructureCount: number;
  adaptedUnlinkedStructureCount: number;
  adaptedUnlinkedRows: OperatorInventoryDebugIdentityRow[];
  adaptedNetworkNodeGroupCount: number;
  quarantinedNodeRows: Array<{
    index: number;
    objectId: string | null;
    assemblyId: string | null;
    ownerCapId: string | null;
    displayName: string | null;
    status: string | null;
    energySourceId: string | null;
    canonicalIdentity: string | null;
    structureCount: number;
    source: string | null;
    provenance: string | null;
    reason: string;
    strongOwnedNodeProof: boolean;
    proofSignals: IndexedNetworkNodeProofSignal[];
    renderEligibility: IndexedNetworkNodeRenderEligibility | null;
  }>;
  displayStructureRows: OperatorInventoryDebugIdentityRow[];
  renderedMacroNetworkNodeCount: number;
  renderedNetworkNodeListCount: number;
  renderedMacroNodes: OperatorInventoryDebugRenderedMacroNode[];
  renderedNodeGroups: OperatorInventoryDebugRenderedMacroNode[];
  renderedNetworkNodeListRows: Array<{
    objectId: string | null;
    assemblyId: string | null;
    displayName: string | null;
    status: string | null;
    attachedStructureCount: number;
    canonicalIdentity: string | null;
  }>;
  renderedNodeControlSourceMode: NodeLocalSourceMode | null;
  renderedNodeControlSelectedNodeId: string | null;
  renderedNodeControlSelectedNodeStructuresCount: number;
  renderedNodeControlRows: OperatorInventoryDebugIdentityRow[];
  duplicateBucketsByObjectId: OperatorInventoryDebugDuplicateBucket[];
  duplicateBucketsByOwnerCapId: OperatorInventoryDebugDuplicateBucket[];
  duplicateBucketsByCanonicalDomainKey: OperatorInventoryDebugDuplicateBucket[];
  rowsMissingObjectIdOrCanonicalIdentity: OperatorInventoryDebugIdentityRow[];
  missingIdentityNodeRows: OperatorInventoryDebugRawNode[];
  zeroStructureGroupedNodes: OperatorInventoryDebugRawNode[];
  directChainFallbackRan: boolean;
  nodeAssembliesFallbackEnabled: boolean;
  nodeAssembliesFallbackRan: boolean;
  mergedIntoDisplay: boolean;
  displayUsesDirectChainFallback: boolean;
  localStorageOrDebugFixturesParticipated: boolean;
}

export interface OperatorInventoryDebugCopySummary {
  requestedWalletAddress: string | null;
  rawOperatorWalletAddress: string | null;
  rawNetworkNodes: Array<{
    index: number;
    objectId: string | null;
    assemblyId: string | null;
    ownerCapId: string | null;
    status: string | null;
    structureCount: number;
    rendered: boolean;
    quarantineReason: string | null;
    strongOwnedNodeProof: boolean;
    proofSignals: IndexedNetworkNodeProofSignal[];
  }>;
  renderedNetworkNodes: Array<{
    objectId: string | null;
    assemblyId: string | null;
    status: string | null;
    attachedStructureCount: number;
    canonicalIdentity: string | null;
  }>;
  quarantinedNodes: Array<{
    index: number;
    objectId: string | null;
    assemblyId: string | null;
    ownerCapId: string | null;
    status: string | null;
    structureCount: number;
    reason: string;
    proofSignals: IndexedNetworkNodeProofSignal[];
  }>;
}

export interface OperatorInventoryDebugController {
  enabled: boolean;
  latest: OperatorInventoryDebugSnapshot | null;
  clear: () => void;
  copySummary?: () => OperatorInventoryDebugCopySummary | null;
}

interface BuildOperatorInventoryDebugSnapshotInput {
  requestedWalletAddress: string | null;
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
  const eligibilityByIndex = new Map(
    input.adapted?.nodeEligibilityDecisions.map((decision) => [decision.index, decision]) ?? [],
  );
  const rawGroupedRows = input.inventory?.networkNodes.flatMap((group) => (
    group.structures.map((row) => describeRawStructure(row, "grouped", group.node.objectId))
  )) ?? [];
  const rawUnlinkedRows = input.inventory?.unlinkedStructures.map((row) => describeRawStructure(row, "unlinked", null)) ?? [];
  const rawNetworkNodes = input.inventory?.networkNodes.map((group, index) => (
    describeRawNode(group.node, group.structures.length, index, eligibilityByIndex.get(index) ?? null)
  )) ?? [];
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
    requestedWalletAddress: input.requestedWalletAddress,
    rawOperatorWalletAddress: input.inventory?.operator?.walletAddress ?? null,
    operatorWalletAddress: input.inventory?.operator?.walletAddress ?? null,
    operatorInventoryUrl: buildDebugOperatorInventoryUrl(input.requestedWalletAddress),
    operatorInventorySucceeded: input.readModelDebug.operatorInventorySucceeded,
    operatorInventoryFailed: input.readModelDebug.operatorInventoryFailed,
    operatorInventoryErrorMessage: input.operatorInventoryErrorMessage,
    rawNetworkNodeCount: input.inventory?.networkNodes.length ?? 0,
    rawNetworkNodes,
    rawNetworkNodeDuplicateBucketsByObjectId: buildRawNodeDuplicateBuckets(rawNetworkNodes, (row) => row.objectId),
    rawNetworkNodeDuplicateBucketsByAssemblyId: buildRawNodeDuplicateBuckets(rawNetworkNodes, (row) => row.assemblyId),
    rawNetworkNodeDuplicateBucketsByOwnerCapId: buildRawNodeDuplicateBuckets(rawNetworkNodes, (row) => row.ownerCapId),
    rawNetworkNodeDuplicateBucketsByCanonicalIdentity: buildRawNodeDuplicateBuckets(rawNetworkNodes, (row) => row.canonicalIdentity),
    groupedNodeEligibilityDecisions: rawNetworkNodes,
    rawGroupedRows,
    rawGroupedDuplicateBucketsByObjectId: buildDuplicateBuckets(rawGroupedRows, (row) => row.objectId),
    rawGroupedDuplicateBucketsByOwnerCapId: buildDuplicateBuckets(rawGroupedRows, (row) => row.ownerCapId),
    rawGroupedDuplicateBucketsByCanonicalDomainKey: buildDuplicateBuckets(rawGroupedRows, (row) => row.canonicalDomainKey),
    rawUnlinkedStructureCount: input.inventory?.unlinkedStructures.length ?? 0,
    rawUnlinkedRows,
    adaptedStructureCount: input.adapted?.structures.length ?? 0,
    adaptedUnlinkedStructureCount: input.adapted?.unlinkedStructures.length ?? 0,
    adaptedUnlinkedRows: input.adapted?.unlinkedStructures.map(describeDisplayStructure) ?? [],
    adaptedNetworkNodeGroupCount: input.adapted?.nodeGroups.length ?? 0,
    quarantinedNodeRows: input.adapted?.quarantinedNodeRows.map((row) => ({
      index: row.index,
      objectId: row.objectId,
      assemblyId: row.assemblyId,
      ownerCapId: row.ownerCapId,
      displayName: row.displayName,
      status: row.status,
      energySourceId: row.energySourceId,
      canonicalIdentity: row.canonicalIdentity,
      structureCount: row.structureCount,
      source: row.source,
      provenance: row.provenance,
      reason: row.reason,
      strongOwnedNodeProof: row.strongOwnedNodeProof,
      proofSignals: row.proofSignals,
      renderEligibility: row.renderEligibility,
    })) ?? [],
    displayStructureRows,
    renderedMacroNetworkNodeCount: input.displayNodeGroups.length,
    renderedNetworkNodeListCount: input.displayNodeGroups.length,
    renderedMacroNodes,
    renderedNodeGroups: renderedMacroNodes,
    renderedNetworkNodeListRows: input.displayNodeGroups.map((group) => ({
      objectId: normalizeCanonicalObjectId(group.node.objectId),
      assemblyId: normalizeNodeDrilldownAssemblyId(group.node.assemblyId),
      displayName: group.node.name,
      status: group.node.status,
      attachedStructureCount: group.gates.length + group.storageUnits.length + group.turrets.length,
      canonicalIdentity: canonicalDomainKey(group.node.objectId, group.node.assemblyId),
    })),
    renderedNodeControlSourceMode: input.selectedNodeSourceMode,
    renderedNodeControlSelectedNodeId: input.selectedNodeId,
    renderedNodeControlSelectedNodeStructuresCount: input.selectedNodeRows.length,
    renderedNodeControlRows,
    duplicateBucketsByObjectId: buildDuplicateBuckets(displayStructureRows, (row) => row.objectId),
    duplicateBucketsByOwnerCapId: buildDuplicateBuckets(displayStructureRows, (row) => row.ownerCapId),
    duplicateBucketsByCanonicalDomainKey: buildDuplicateBuckets(displayStructureRows, (row) => row.canonicalDomainKey),
    rowsMissingObjectIdOrCanonicalIdentity: missingIdentityRows,
    missingIdentityNodeRows: rawNetworkNodes.filter((row) => !row.canonicalIdentity),
    zeroStructureGroupedNodes: rawNetworkNodes.filter((row) => row.structureCount === 0),
    directChainFallbackRan: input.readModelDebug.directChainFallbackRan,
    nodeAssembliesFallbackEnabled: input.nodeAssembliesFallbackEnabled,
    nodeAssembliesFallbackRan: input.nodeAssembliesFallbackRan,
    mergedIntoDisplay: input.readModelDebug.mergedIntoDisplay,
    displayUsesDirectChainFallback: input.readModelDebug.displayUsesDirectChainFallback,
    localStorageOrDebugFixturesParticipated: false,
  };
}

function describeRawNode(
  row: OperatorInventoryStructure,
  structureCount: number,
  index: number,
  eligibilityDecision: AdaptedOperatorInventory["nodeEligibilityDecisions"][number] | null,
): OperatorInventoryDebugRawNode {
  return {
    index,
    objectId: normalizeCanonicalObjectId(row.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(row.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(row.ownerCapId),
    displayName: row.displayName ?? row.name ?? row.typeName ?? row.assemblyType,
    type: row.assemblyType ?? row.family ?? row.typeName,
    status: row.status,
    energySourceId: row.energySourceId,
    canonicalIdentity: canonicalDomainKey(row.objectId, row.assemblyId),
    source: row.source ?? null,
    provenance: row.provenance ?? null,
    structureCount,
    rendered: eligibilityDecision?.rendered ?? false,
    quarantineReason: eligibilityDecision?.quarantineReason ?? null,
    strongOwnedNodeProof: eligibilityDecision?.strongOwnedNodeProof ?? false,
    proofSignals: eligibilityDecision?.proofSignals ?? [],
    renderEligibility: eligibilityDecision?.renderEligibility ?? null,
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

function buildRawNodeDuplicateBuckets(
  rows: OperatorInventoryDebugRawNode[],
  getKey: (row: OperatorInventoryDebugRawNode) => string | null,
): OperatorInventoryDebugDuplicateBucket[] {
  const buckets = new Map<string, OperatorInventoryDebugRawNode[]>();

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
      rows: rowsForKey.map((row) => ({
        category: "raw-network-node",
        objectId: row.objectId,
        assemblyId: row.assemblyId,
        ownerCapId: row.ownerCapId,
        canonicalDomainKey: row.canonicalIdentity,
        displayName: row.displayName,
        status: row.status,
        family: row.type,
        sourceLabel: `raw-network-node:${row.index}`,
        networkNodeId: row.objectId,
      })),
    }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function canonicalDomainKey(objectId: string | null | undefined, assemblyId: string | null | undefined): string | null {
  return selectCanonicalNodeDrilldownDomainKey({
    objectId,
    assemblyId,
  });
}

function buildDebugOperatorInventoryUrl(walletAddress: string | null): string | null {
  if (!walletAddress) {
    return null;
  }

  try {
    return buildOperatorInventoryUrl(walletAddress);
  } catch {
    return null;
  }
}

export function buildOperatorInventoryDebugCopySummary(
  snapshot: OperatorInventoryDebugSnapshot | null,
): OperatorInventoryDebugCopySummary | null {
  if (!snapshot) {
    return null;
  }

  return {
    requestedWalletAddress: snapshot.requestedWalletAddress,
    rawOperatorWalletAddress: snapshot.rawOperatorWalletAddress,
    rawNetworkNodes: snapshot.rawNetworkNodes.map((row) => ({
      index: row.index,
      objectId: row.objectId,
      assemblyId: row.assemblyId,
      ownerCapId: row.ownerCapId,
      status: row.status,
      structureCount: row.structureCount,
      rendered: row.rendered,
      quarantineReason: row.quarantineReason,
      strongOwnedNodeProof: row.strongOwnedNodeProof,
      proofSignals: row.proofSignals,
    })),
    renderedNetworkNodes: snapshot.renderedNetworkNodeListRows.map((row) => ({
      objectId: row.objectId,
      assemblyId: row.assemblyId,
      status: row.status,
      attachedStructureCount: row.attachedStructureCount,
      canonicalIdentity: row.canonicalIdentity,
    })),
    quarantinedNodes: snapshot.quarantinedNodeRows.map((row) => ({
      index: row.index,
      objectId: row.objectId,
      assemblyId: row.assemblyId,
      ownerCapId: row.ownerCapId,
      status: row.status,
      structureCount: row.structureCount,
      reason: row.reason,
      proofSignals: row.proofSignals,
    })),
  };
}