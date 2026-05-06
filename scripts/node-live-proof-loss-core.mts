import {
  formatNodeLocalActionAvailability,
  getNodeLocalActionStatus,
  getNodeLocalPowerControlState,
} from "../src/lib/nodeDrilldownActionAuthority.ts";
import { buildNodeDrilldownMenuItems } from "../src/lib/nodeDrilldownMenuItems.ts";
import {
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
} from "../src/lib/nodeDrilldownIdentity.ts";
import { resolveNodeLocalStructure } from "../src/lib/nodeDrilldownSelection.ts";
import { normalizeCanonicalObjectId } from "../src/lib/nodeAssembliesClient.ts";

import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient.ts";
import type { NodeLocalStructure, NodeLocalViewModel } from "../src/lib/nodeDrilldownTypes.ts";
import type { NetworkNodeGroup, Structure } from "../src/types/domain.ts";
import type {
  OperatorInventoryNode,
  OperatorInventoryResponse,
  OperatorInventoryStructure,
} from "../src/types/operatorInventory.ts";

interface RawProof {
  canonicalDomainKey: string | null;
  objectId: string | null;
  ownerCapId: string | null;
  networkNodeId: string | null;
  structureType: string | null;
  hasActionCandidate: boolean;
  hasVerifiedTargetProof: boolean;
  powerRequirement: OperatorInventoryStructure["powerRequirement"];
  actionCandidate: OperatorInventoryStructure["actionCandidate"];
}

interface InspectorStructureProjection {
  displayRowExists: boolean;
  id: string;
  canonicalDomainKey: string;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  networkNodeId: string | null;
  energySourceId: string | null;
  displayName: string;
  typeLabel: string;
  familyLabel: string;
  status: string;
  actionStatus: string;
  controlAvailability: string;
  actionAuthorityState: string;
  verifiedTarget: NodeLocalStructure["actionAuthority"]["verifiedTarget"];
  candidateTargets: NodeLocalStructure["actionAuthority"]["candidateTargets"];
  unavailableReason: string | null;
  actionCandidate: NodeLocalStructure["actionCandidate"];
  powerRequirement: NodeLocalStructure["powerRequirement"];
  powerControl: ReturnType<typeof getNodeLocalPowerControlState>;
  source: NodeLocalStructure["source"];
  hasDirectChainAuthority: boolean;
  directChainObjectId: string | null;
  directChainAssemblyId: string | null;
}

interface ProofLossFailure {
  nodeObjectId: string;
  displayName: string;
  canonicalDomainKey: string;
  assemblyId: string | null;
  objectId: string | null;
  lostFields: string[];
  rawProof: RawProof;
  inspectorProjection: InspectorStructureProjection;
  adaptedStructure: Record<string, unknown> | null;
  nodeAssemblySummary: Record<string, unknown> | null;
}

interface RenderedTargetResolution {
  displayName: string;
  weakInput: {
    id: string;
    canonicalDomainKey: string;
    objectId: string | null;
    assemblyId: string | null;
    source: string;
  };
  resolver: {
    resolved: boolean;
    source: string;
    matchedKey: string | null;
    replacedWeakRow: boolean;
  };
  inspectorProjection: InspectorStructureProjection | null;
  actionRailState: ReturnType<typeof getNodeLocalPowerControlState> | null;
  contextMenuItems: string[];
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

export function objectId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, "0")}`;
}

function normalizeAssemblyId(value: string | null | undefined): string | null {
  return normalizeNodeDrilldownAssemblyId(value);
}

function selectIdentityKey(input: {
  objectId?: string | null;
  assemblyId?: string | null;
  canonicalDomainKey?: string | null;
}): string | null {
  return input.canonicalDomainKey
    ?? selectCanonicalNodeDrilldownDomainKey({
      objectId: input.objectId,
      assemblyId: input.assemblyId,
    });
}

function matchesStructureIdentity(
  left: { objectId?: string | null; assemblyId?: string | null; canonicalDomainKey?: string | null },
  right: { objectId?: string | null; assemblyId?: string | null; canonicalDomainKey?: string | null },
): boolean {
  const leftKey = selectIdentityKey(left);
  const rightKey = selectIdentityKey(right);
  if (leftKey && rightKey && leftKey === rightKey) return true;

  const leftObjectId = normalizeCanonicalObjectId(left.objectId);
  const rightObjectId = normalizeCanonicalObjectId(right.objectId);
  if (leftObjectId && rightObjectId && leftObjectId === rightObjectId) return true;

  const leftAssemblyId = normalizeAssemblyId(left.assemblyId);
  const rightAssemblyId = normalizeAssemblyId(right.assemblyId);
  return leftAssemblyId != null && rightAssemblyId != null && leftAssemblyId === rightAssemblyId;
}

function deriveStructureOwnerCapId(structure: NodeLocalStructure): string | null {
  if (hasValue(structure.actionAuthority.verifiedTarget?.ownerCapId)) {
    return structure.actionAuthority.verifiedTarget.ownerCapId;
  }

  const ownerCapIds = Array.from(new Set(
    structure.actionAuthority.candidateTargets
      .map((candidate) => candidate.ownerCapId ?? null)
      .filter(hasValue),
  ));
  return ownerCapIds.length === 1 ? ownerCapIds[0] ?? null : null;
}

function deriveStructureNetworkNodeId(structure: NodeLocalStructure): string | null {
  if (hasValue(structure.actionAuthority.verifiedTarget?.networkNodeId)) {
    return structure.actionAuthority.verifiedTarget.networkNodeId;
  }

  const networkNodeIds = Array.from(new Set(
    structure.actionAuthority.candidateTargets
      .map((candidate) => candidate.networkNodeId ?? null)
      .filter(hasValue),
  ));
  return networkNodeIds.length === 1 ? networkNodeIds[0] ?? null : null;
}

function deriveRawProof(row: OperatorInventoryStructure, rawNodeObjectId: string | null | undefined): RawProof {
  const powerRequiredIds = row.actionCandidate?.actions.power?.requiredIds ?? null;
  const renameRequiredIds = row.actionCandidate?.actions.rename?.requiredIds ?? null;
  const requiredIds = powerRequiredIds ?? renameRequiredIds;
  const objectId = normalizeCanonicalObjectId(requiredIds?.structureId ?? row.objectId);
  const ownerCapId = normalizeCanonicalObjectId(requiredIds?.ownerCapId ?? row.ownerCapId);
  const networkNodeId = normalizeCanonicalObjectId(requiredIds?.networkNodeId ?? row.networkNodeId ?? rawNodeObjectId);
  const structureType = requiredIds?.structureType ?? null;

  return {
    canonicalDomainKey: selectIdentityKey({ objectId: row.objectId, assemblyId: row.assemblyId }),
    objectId,
    ownerCapId,
    networkNodeId,
    structureType,
    hasActionCandidate: row.actionCandidate != null,
    hasVerifiedTargetProof: Boolean(objectId && ownerCapId && networkNodeId && structureType),
    powerRequirement: row.powerRequirement ?? null,
    actionCandidate: row.actionCandidate ?? null,
  };
}

function buildInspectorStructureProjection(structure: NodeLocalStructure): InspectorStructureProjection {
  return {
    displayRowExists: true,
    id: structure.id,
    canonicalDomainKey: structure.canonicalDomainKey,
    objectId: normalizeCanonicalObjectId(structure.objectId) ?? null,
    assemblyId: normalizeAssemblyId(structure.assemblyId),
    ownerCapId: deriveStructureOwnerCapId(structure),
    networkNodeId: deriveStructureNetworkNodeId(structure),
    energySourceId: structure.energySourceId ?? null,
    displayName: structure.displayName,
    typeLabel: structure.typeLabel,
    familyLabel: structure.familyLabel,
    status: structure.status,
    actionStatus: getNodeLocalActionStatus(structure),
    controlAvailability: formatNodeLocalActionAvailability(structure),
    actionAuthorityState: structure.actionAuthority.state,
    verifiedTarget: structure.actionAuthority.verifiedTarget ?? null,
    candidateTargets: structure.actionAuthority.candidateTargets,
    unavailableReason: structure.actionAuthority.unavailableReason ?? null,
    actionCandidate: structure.actionCandidate ?? null,
    powerRequirement: structure.powerRequirement ?? null,
    powerControl: getNodeLocalPowerControlState(structure),
    source: structure.source,
    hasDirectChainAuthority: structure.hasDirectChainAuthority,
    directChainObjectId: normalizeCanonicalObjectId(structure.directChainObjectId) ?? null,
    directChainAssemblyId: normalizeAssemblyId(structure.directChainAssemblyId),
  };
}

function buildInspectorProjection(viewModel: NodeLocalViewModel, selectedNode: Structure) {
  return {
    node: {
      objectId: normalizeCanonicalObjectId(selectedNode.objectId ?? viewModel.node.objectId) ?? null,
      assemblyId: normalizeAssemblyId(selectedNode.assemblyId),
      ownerCapId: normalizeCanonicalObjectId(selectedNode.ownerCapId) ?? null,
      canonicalDomainKey: selectIdentityKey({
        objectId: selectedNode.objectId ?? viewModel.node.objectId,
        assemblyId: selectedNode.assemblyId,
      }),
      displayName: viewModel.node.displayName,
      status: viewModel.node.status,
      sourceMode: viewModel.sourceMode,
      powerUsageSummary: viewModel.node.powerUsageSummary ?? null,
    },
    structures: viewModel.structures.map(buildInspectorStructureProjection),
  };
}

function makeWeakRenderedInput(structure: NodeLocalStructure): NodeLocalStructure {
  return {
    ...structure,
    id: structure.assemblyId ? `assembly:${structure.assemblyId}` : structure.id,
    objectId: undefined,
    directChainObjectId: null,
    directChainAssemblyId: null,
    hasDirectChainAuthority: false,
    directChainMatchCount: 0,
    futureActionEligible: false,
    actionCandidate: null,
    powerRequirement: null,
    actionAuthority: {
      state: "backend-only",
      verifiedTarget: null,
      candidateTargets: [],
      unavailableReason: null,
    },
    isReadOnly: true,
    isActionable: false,
  };
}

function buildRenderedTargetResolution(viewModel: NodeLocalViewModel): RenderedTargetResolution[] {
  return viewModel.structures.map((structure) => {
    const weakInput = makeWeakRenderedInput(structure);
    const resolution = resolveNodeLocalStructure(viewModel, { structure: weakInput }, "canvas-projection");
    const resolved = resolution.structure;
    const menuItems = resolved ? buildNodeDrilldownMenuItems({
      contextMenu: {
        structureId: weakInput.id,
        canonicalDomainKey: weakInput.canonicalDomainKey,
        structureName: weakInput.displayName,
        left: 0,
        top: 0,
        visibilityAction: "hide",
        visibilityActionLabel: "Hide from Node View",
        powerActionLabel: null,
        nextOnline: null,
      },
      structure: resolved,
      onHideStructure: () => undefined,
      onUnhideStructure: () => undefined,
      onTogglePower: () => undefined,
      onRenameStructure: () => undefined,
    }).map((item) => item.label) : [];

    return {
      displayName: structure.displayName,
      weakInput: {
        id: weakInput.id,
        canonicalDomainKey: weakInput.canonicalDomainKey,
        objectId: normalizeCanonicalObjectId(weakInput.objectId),
        assemblyId: normalizeAssemblyId(weakInput.assemblyId),
        source: weakInput.source,
      },
      resolver: {
        resolved: resolved != null,
        source: resolution.source,
        matchedKey: resolution.matchedKey,
        replacedWeakRow: resolution.replacedWeakRow,
      },
      inspectorProjection: resolved ? buildInspectorStructureProjection(resolved) : null,
      actionRailState: resolved ? getNodeLocalPowerControlState(resolved) : null,
      contextMenuItems: menuItems,
    };
  });
}

function describeAdaptedStructure(structure: Structure) {
  return {
    objectId: structure.objectId,
    assemblyId: structure.assemblyId ?? null,
    ownerCapId: structure.ownerCapId,
    networkNodeId: structure.networkNodeId ?? null,
    type: structure.type,
    name: structure.name,
    status: structure.status,
    readModelSource: structure.readModelSource ?? null,
    indexedPowerRequirement: structure.indexedPowerRequirement ?? null,
    summary: structure.summary ?? null,
  };
}

function describeNodeAssemblySummary(lookup: NodeAssembliesLookupResult | null) {
  if (!lookup || lookup.status !== "success") return null;

  return {
    status: lookup.status,
    networkNodeId: lookup.networkNodeId,
    node: lookup.node,
    fetchedAt: lookup.fetchedAt,
    source: lookup.source,
    isPartial: lookup.isPartial,
    droppedCount: lookup.droppedCount,
    assemblies: lookup.assemblies,
  };
}

function findRawStructures(rawNode: OperatorInventoryNode | null, identity: InspectorStructureProjection) {
  return rawNode?.structures.filter((row) => matchesStructureIdentity(
    { objectId: row.objectId, assemblyId: row.assemblyId },
    identity,
  )) ?? [];
}

function mergeRawProof(left: RawProof, right: RawProof): RawProof {
  const merged = {
    canonicalDomainKey: left.canonicalDomainKey ?? right.canonicalDomainKey,
    objectId: left.objectId ?? right.objectId,
    ownerCapId: left.ownerCapId ?? right.ownerCapId,
    networkNodeId: left.networkNodeId ?? right.networkNodeId,
    structureType: left.structureType ?? right.structureType,
    hasActionCandidate: left.hasActionCandidate || right.hasActionCandidate,
    hasVerifiedTargetProof: false,
    powerRequirement: left.powerRequirement ?? right.powerRequirement,
    actionCandidate: left.actionCandidate ?? right.actionCandidate,
  };

  return {
    ...merged,
    hasVerifiedTargetProof: Boolean(merged.objectId && merged.ownerCapId && merged.networkNodeId && merged.structureType),
  };
}

function deriveMergedRawProof(
  rows: OperatorInventoryStructure[],
  rawNodeObjectId: string | null | undefined,
): RawProof | null {
  return rows
    .map((row) => deriveRawProof(row, rawNodeObjectId))
    .reduce<RawProof | null>((merged, proof) => (merged ? mergeRawProof(merged, proof) : proof), null);
}

function findAdaptedStructure(group: NetworkNodeGroup, identity: InspectorStructureProjection): Structure | null {
  return [...group.gates, ...group.storageUnits, ...group.turrets].find((structure) => matchesStructureIdentity(
    {
      objectId: structure.objectId,
      assemblyId: structure.assemblyId,
      canonicalDomainKey: selectIdentityKey({ objectId: structure.objectId, assemblyId: structure.assemblyId }),
    },
    identity,
  )) ?? null;
}

function findNodeAssemblySummary(lookup: NodeAssembliesLookupResult | null, identity: InspectorStructureProjection) {
  if (!lookup || lookup.status !== "success") return null;

  return lookup.assemblies.find((row) => matchesStructureIdentity(
    { objectId: row.objectId, assemblyId: row.assemblyId },
    identity,
  )) ?? null;
}

export function detectProofLoss({
  rawNode,
  group,
  lookup,
  projection,
}: {
  rawNode: OperatorInventoryNode | null;
  group: NetworkNodeGroup;
  lookup: NodeAssembliesLookupResult | null;
  projection: ReturnType<typeof buildInspectorProjection>;
}): ProofLossFailure[] {
  return projection.structures.flatMap((structureProjection): ProofLossFailure[] => {
    const displayIdentityExists = structureProjection.displayRowExists
      && hasValue(structureProjection.canonicalDomainKey)
      && (hasValue(structureProjection.assemblyId) || hasValue(structureProjection.canonicalDomainKey));
    if (!displayIdentityExists) return [];

    const rawMatches = findRawStructures(rawNode, structureProjection);
    if (rawMatches.length === 0) return [];

    const rawProof = deriveMergedRawProof(rawMatches, rawNode?.node.objectId ?? group.node.objectId);
    if (!rawProof) return [];
    const lostFields: string[] = [];
    if (rawProof.objectId && !normalizeCanonicalObjectId(structureProjection.objectId)) lostFields.push("object_id");
    if (rawProof.ownerCapId && !normalizeCanonicalObjectId(structureProjection.ownerCapId)) lostFields.push("owner_cap_id");
    if (rawProof.networkNodeId && !normalizeCanonicalObjectId(structureProjection.networkNodeId)) lostFields.push("network_node_id");
    if (rawProof.hasActionCandidate && structureProjection.actionCandidate == null) lostFields.push("action_candidate");
    if (rawProof.hasVerifiedTargetProof && structureProjection.verifiedTarget == null) lostFields.push("verified_target");
    if (rawProof.powerRequirement && structureProjection.powerRequirement == null) lostFields.push("power_requirement");
    if (lostFields.length === 0) return [];

    const adaptedStructure = findAdaptedStructure(group, structureProjection);
    const nodeAssemblySummary = findNodeAssemblySummary(lookup, structureProjection);
    return [{
      nodeObjectId: group.node.objectId,
      displayName: structureProjection.displayName,
      canonicalDomainKey: structureProjection.canonicalDomainKey,
      assemblyId: structureProjection.assemblyId,
      objectId: structureProjection.objectId,
      lostFields,
      rawProof,
      inspectorProjection: structureProjection,
      adaptedStructure: adaptedStructure ? describeAdaptedStructure(adaptedStructure) : null,
      nodeAssemblySummary: nodeAssemblySummary ? { ...nodeAssemblySummary } : null,
    }];
  });
}

export function buildNodeDiagnostic({
  rawNode,
  group,
  lookup,
  viewModel,
}: {
  rawNode: OperatorInventoryNode | null;
  group: NetworkNodeGroup;
  lookup: NodeAssembliesLookupResult | null;
  viewModel: NodeLocalViewModel;
}) {
  const projection = buildInspectorProjection(viewModel, group.node);
  const proofLossFailures = detectProofLoss({ rawNode, group, lookup, projection });

  return {
    nodeObjectId: group.node.objectId,
    nodeDisplayName: viewModel.node.displayName,
    rawOperatorInventory: rawNode ? {
      node: rawNode.node,
      powerUsageSummary: rawNode.powerUsageSummary ?? rawNode.node.powerUsageSummary ?? null,
      structures: rawNode.structures,
    } : null,
    adaptedStructure: {
      node: describeAdaptedStructure(group.node),
      children: [...group.gates, ...group.storageUnits, ...group.turrets].map(describeAdaptedStructure),
    },
    nodeLookup: describeNodeAssemblySummary(lookup),
    selectedNodeViewModel: viewModel,
    nodeSelectionInspectorProjection: projection,
    renderedUiTargetProjection: buildRenderedTargetResolution(viewModel),
    proofLoss: {
      ok: proofLossFailures.length === 0,
      failureCount: proofLossFailures.length,
      failures: proofLossFailures,
    },
  };
}

export function makeInventoryStructure(overrides: Partial<OperatorInventoryStructure>): OperatorInventoryStructure {
  return {
    objectId: null,
    assemblyId: null,
    ownerCapId: null,
    family: null,
    size: null,
    displayName: null,
    name: null,
    typeId: null,
    typeName: null,
    assemblyType: null,
    status: "unknown",
    networkNodeId: null,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: null,
    characterId: null,
    extensionStatus: "none",
    fuelAmount: null,
    powerSummary: null,
    powerRequirement: null,
    powerUsageSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: "777777",
    lastObservedTimestamp: "2026-05-06T12:00:00.000Z",
    lastUpdated: "2026-05-06T12:00:00.000Z",
    source: "shared-frontier-backend",
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

export function selectNodeGroups(
  adapted: { nodeGroups: NetworkNodeGroup[] },
  nodeObjectId: string | null,
): NetworkNodeGroup[] {
  if (!nodeObjectId) return adapted.nodeGroups;

  const normalizedNodeId = normalizeCanonicalObjectId(nodeObjectId) ?? nodeObjectId.toLowerCase();
  return adapted.nodeGroups.filter((group) => (
    normalizeCanonicalObjectId(group.node.objectId) === normalizedNodeId
    || group.node.objectId.toLowerCase() === normalizedNodeId
  ));
}

export function findRawNode(inventory: OperatorInventoryResponse, nodeObjectId: string): OperatorInventoryNode | null {
  const normalizedNodeId = normalizeCanonicalObjectId(nodeObjectId);
  return inventory.networkNodes.find((entry) => (
    normalizeCanonicalObjectId(entry.node.objectId) === normalizedNodeId
    || entry.node.objectId?.toLowerCase() === nodeObjectId.toLowerCase()
  )) ?? null;
}
