import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionAuthorityLabel,
  getNodeLocalPowerControlState,
} from "@/lib/nodeDrilldownActionAuthority";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import {
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
} from "@/lib/nodeDrilldownIdentity";
import { formatNodeLocalActionAvailability } from "@/lib/nodeDrilldownActionAuthority";

import type { AssetDiscoveryDisplayDebugState } from "@/lib/assetDiscoveryDisplayModel";
import type { NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import type { SelectedNodeInventoryLookupResolution } from "@/lib/nodeControlInventoryLookup";
import type { NodeDrilldownMenuContext, NodeDrilldownMenuItem } from "@/lib/nodeDrilldownMenuItems";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";
import type { NodePowerCapacityCheck, NodePowerOperationPlan, NodePowerUsageReadout } from "@/lib/nodePowerControlModel";
import type {
  OperatorInventoryRawStructureProof,
  OperatorInventoryResponse,
  OperatorInventoryStructure,
} from "@/types/operatorInventory";
import type { NetworkNodeGroup, Structure, TxResult, TxStatus } from "@/types/domain";

export interface NodeControlDebugController {
  enabled: boolean;
  latest: NodeControlDebugCopySummary | null;
  clear: () => void;
  copySummary: () => NodeControlDebugCopySummary | null;
}

interface NodeControlDebugTxState {
  status: TxStatus;
  result: TxResult | null;
  error: string | null;
}

interface NodeControlDebugPendingPlan {
  mode: "blocked" | "confirm";
  title: string;
  primaryLabel: string;
  plan: NodePowerOperationPlan;
}

interface NodeControlDebugPresetPlan {
  slotIndex: number;
  label: string | null;
  savedAt: string | null;
  plan: NodePowerOperationPlan;
}

export interface BuildNodeControlDebugSnapshotInput {
  walletAddress: string | null;
  isConnected: boolean;
  characterId: string | null;
  selectedNodeId: string | null;
  selectedNode: Structure | null;
  selectedNodeGroup: NetworkNodeGroup | null;
  selectedNodeViewModel: NodeLocalViewModel | null;
  visibleNodeViewModel: NodeLocalViewModel | null;
  selectedNodeInventoryLookupResolution: SelectedNodeInventoryLookupResolution;
  visibleStructureCount: number;
  hiddenCanonicalKeys: string[];
  selectedStructureId: string | null;
  selectedStructureCanonicalDomainKey: string | null;
  selectedStructure: NodeLocalStructure | null;
  contextMenuStructure: NodeLocalStructure | null;
  selectedStructureResolutionSource: string | null;
  selectedStructureResolutionMatchedKey: string | null;
  selectedStructureReplacedWeakRow: boolean;
  contextMenu: NodeDrilldownMenuContext | null;
  contextMenuItems: NodeDrilldownMenuItem[];
  macroContextMenu: { structureId: string; structureName: string; items: NodeDrilldownMenuItem[] } | null;
  nodeUsageReadout: NodePowerUsageReadout | null;
  capacityCheck: NodePowerCapacityCheck | null;
  powerTx: NodeControlDebugTxState;
  pendingPlan: NodeControlDebugPendingPlan | null;
  canSavePowerPreset: boolean;
  savePresetDisabledReason: string | null;
  bringAllOnlinePlan: NodePowerOperationPlan;
  takeAllOfflinePlan: NodePowerOperationPlan;
  presetPlans: NodeControlDebugPresetPlan[];
  readModelDebug: AssetDiscoveryDisplayDebugState;
  operatorInventory: {
    walletAddress: string | null;
    inventory: OperatorInventoryResponse | null;
    isLoading: boolean;
    isError: boolean;
    errorMessage: string | null;
  };
  selectedNodeObservedLookup: NodeAssembliesLookupResult | null;
  nodeAssembliesFallbackEnabled: boolean;
  nodeAssembliesFallbackRan: boolean;
}

interface NodeControlStructureDebugRow {
  id: string;
  canonicalDomainKey: string;
  objectId: string | null;
  assemblyId: string | null;
  directChainObjectId: string | null;
  directChainAssemblyId: string | null;
  ownerCapId: string | null;
  networkNodeId: string | null;
  displayName: string;
  family: string;
  familyLabel: string;
  typeLabel: string;
  status: string;
  source: string;
  backendSource: string | null;
  provenance: string | null;
  fetchedAt: string | null;
  lastUpdated: string | null;
  energySourceId: string | null;
  powerRequirement: NodeLocalStructure["powerRequirement"];
  extensionStatus: NodeLocalStructure["extensionStatus"] | null;
  hasDirectChainAuthority: boolean;
  directChainMatchCount: number;
  futureActionEligible: boolean;
  isReadOnly: boolean;
  isActionable: boolean;
  actionAuthority: NodeLocalStructure["actionAuthority"];
  actionAuthorityLabel: string;
  actionAuthorityDetail: string;
  actionAvailability: string;
  actionCandidate: NodeLocalStructure["actionCandidate"];
  displayNameSource: string | null;
  displayNameUpdatedAt: string | null;
  sizeVariant: string | null;
  verifiedTargetPresent: boolean;
  candidateTargetCount: number;
}

interface OperatorInventoryProofRow {
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  networkNodeId: string | null;
  energySourceId: string | null;
  displayName: string | null;
  family: string | null;
  size: string | null;
  typeName: string | null;
  assemblyType: string | null;
  status: string | null;
  source: string | null;
  provenance: string | null;
  powerRequirement: OperatorInventoryStructure["powerRequirement"];
  powerUsageSummary: OperatorInventoryStructure["powerUsageSummary"];
  actionCandidate: OperatorInventoryStructure["actionCandidate"];
}

interface SelectedRowProofTraceStage {
  stage: string;
  displayName: string | null;
  name: string | null;
  typeName: string | null;
  family: string | null;
  size: string | null;
  status: string | null;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  networkNodeId: string | null;
  energySourceId: string | null;
  canonicalDomainKey: string | null;
  powerRequirement: {
    requiredGj: number | null;
  };
  actionCandidate: {
    actions: {
      power: { requiredIds: Record<string, unknown> | null };
      rename: { requiredIds: Record<string, unknown> | null };
    };
  };
  actionAuthority: {
    state: string | null;
    verifiedTarget: {
      structureId: string | null;
      ownerCapId: string | null;
      networkNodeId: string | null;
    };
  };
  source: string | null;
  provenance: string | null;
  displayNameSource: string | null;
  displayNameUpdatedAt: string | null;
}

interface SelectedRowProofTrace {
  selectedDisplayName: string | null;
  selectedCanonicalDomainKey: string | null;
  firstLost: {
    objectId: string | null;
    ownerCapId: string | null;
    networkNodeId: string | null;
    actionAuthority: string | null;
    powerRequirement: string | null;
  };
  stages: SelectedRowProofTraceStage[];
  menuItems: Array<{ key: string; label: string; disabled: boolean; disabledReason: string | null }>;
  powerReadoutInputs: {
    label: string | null;
    isAvailable: boolean | null;
    capacityGJ: number | null;
  };
}

export interface NodeControlDebugCopySummary {
  schemaVersion: "node-control-debug.v1";
  capturedAt: string;
  location: { pathname: string; debugNodeControl: string | null };
  session: {
    walletAddress: string | null;
    isConnected: boolean;
    characterId: string | null;
  };
  selection: {
    selectedNodeId: string | null;
    selectedNode: Record<string, unknown> | null;
    selectedStructureId: string | null;
    selectedStructureCanonicalDomainKey: string | null;
    selectedStructureResolution: {
      source: string | null;
      matchedKey: string | null;
      replacedWeakRow: boolean;
    };
    selectedStructure: NodeControlStructureDebugRow | null;
    totalStructureCount: number;
    visibleStructureCount: number;
    hiddenStructureCount: number;
    hiddenCanonicalKeys: string[];
    sourceMode: string | null;
    coverage: string | null;
  };
  authority: {
    selectedStructure: Record<string, unknown> | null;
    rows: Array<Record<string, unknown>>;
    visibleRows: Array<Record<string, unknown>>;
  };
  contextMenu: {
    nodeLocalStructureMenu: Record<string, unknown>;
    selectedNodeMenu: Record<string, unknown>;
  };
  actionRail: {
    selectedStructure: Record<string, unknown> | null;
    selectedStructureRow: NodeControlStructureDebugRow | null;
  };
  power: {
    nodeUsageReadout: NodePowerUsageReadout | null;
    capacityCheck: NodePowerCapacityCheck | null;
    tx: {
      status: TxStatus;
      digest: string | null;
      message: string | null;
      detail: string | null;
      error: string | null;
    };
    pendingPlan: Record<string, unknown> | null;
  };
  bulkControls: {
    savePresetDisabledReason: string | null;
    canSavePowerPreset: boolean;
    bringAllOnline: Record<string, unknown>;
    takeAllOffline: Record<string, unknown>;
    presets: Array<Record<string, unknown>>;
  };
  provenance: {
    readModelDebug: AssetDiscoveryDisplayDebugState;
    operatorInventory: Record<string, unknown>;
    selectedNodeInventoryLookup: Record<string, unknown>;
    nodeAssembliesFallbackEnabled: boolean;
    nodeAssembliesFallbackRan: boolean;
    selectedNodeObservedLookup: Record<string, unknown> | null;
  };
  proof: {
    rawOperatorInventoryNode: OperatorInventoryProofRow | null;
    rawOperatorInventoryStructure: OperatorInventoryProofRow | null;
    rawNodeAssemblyLookupStructure: OperatorInventoryProofRow | null;
    adaptedNodeGroup: Record<string, unknown> | null;
    renderedNodeControlRows: NodeControlStructureDebugRow[];
    visibleNodeControlRows: NodeControlStructureDebugRow[];
    selectedInspectorTarget: NodeControlStructureDebugRow | null;
    contextMenuTarget: NodeControlStructureDebugRow | null;
    actionRailTarget: NodeControlStructureDebugRow | null;
  };
  selectedRowProofTrace: SelectedRowProofTrace;
  pipeline: {
    phase: string;
    selectedNodeViewModelSourceMode: string | null;
    selectedNodeInventoryLookupFound: boolean;
    selectedNodeInventoryLookupMatchedKey: string | null;
    selectedNodeInventoryLookupKeysTried: string[];
    selectedNodeInventoryLookupRawChildCount: number;
  };
}

function ownerCapIdFromStructure(structure: NodeLocalStructure): string | null {
  if (structure.actionAuthority.verifiedTarget?.ownerCapId) {
    return structure.actionAuthority.verifiedTarget.ownerCapId;
  }

  const ownerCapIds = [...new Set(structure.actionAuthority.candidateTargets
    .map((target) => normalizeCanonicalObjectId(target.ownerCapId))
    .filter((value): value is string => Boolean(value)))];
  return ownerCapIds.length === 1 ? ownerCapIds[0] ?? null : null;
}

function networkNodeIdFromStructure(structure: NodeLocalStructure): string | null {
  if (structure.actionAuthority.verifiedTarget?.networkNodeId) {
    return structure.actionAuthority.verifiedTarget.networkNodeId;
  }

  const networkNodeIds = [...new Set(structure.actionAuthority.candidateTargets
    .map((target) => normalizeCanonicalObjectId(target.networkNodeId))
    .filter((value): value is string => Boolean(value)))];
  return networkNodeIds.length === 1 ? networkNodeIds[0] ?? null : null;
}

function mapStructureRow(structure: NodeLocalStructure): NodeControlStructureDebugRow {
  return {
    id: structure.id,
    canonicalDomainKey: structure.canonicalDomainKey,
    objectId: normalizeCanonicalObjectId(structure.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
    directChainObjectId: normalizeCanonicalObjectId(structure.directChainObjectId),
    directChainAssemblyId: normalizeNodeDrilldownAssemblyId(structure.directChainAssemblyId),
    ownerCapId: ownerCapIdFromStructure(structure),
    networkNodeId: networkNodeIdFromStructure(structure),
    displayName: structure.displayName,
    family: structure.family,
    familyLabel: structure.familyLabel,
    typeLabel: structure.typeLabel,
    status: structure.status,
    source: structure.source,
    backendSource: structure.backendSource ?? null,
    provenance: structure.provenance ?? null,
    fetchedAt: structure.fetchedAt ?? null,
    lastUpdated: structure.lastUpdated ?? null,
    energySourceId: structure.energySourceId ?? null,
    powerRequirement: structure.powerRequirement ?? null,
    extensionStatus: structure.extensionStatus ?? null,
    hasDirectChainAuthority: structure.hasDirectChainAuthority,
    directChainMatchCount: structure.directChainMatchCount,
    futureActionEligible: structure.futureActionEligible,
    isReadOnly: structure.isReadOnly,
    isActionable: structure.isActionable,
    displayNameSource: structure.displayNameSource ?? null,
    displayNameUpdatedAt: structure.displayNameUpdatedAt ?? null,
    sizeVariant: structure.sizeVariant,
    verifiedTargetPresent: structure.actionAuthority.verifiedTarget != null,
    candidateTargetCount: structure.actionAuthority.candidateTargets.length,
    actionAuthority: structure.actionAuthority,
    actionAuthorityLabel: formatNodeLocalActionAuthorityLabel(structure),
    actionAuthorityDetail: formatNodeLocalActionAuthorityDetail(structure),
    actionAvailability: formatNodeLocalActionAvailability(structure),
    actionCandidate: structure.actionCandidate ?? null,
  };
}

function mapSelectedNode(node: Structure | null, viewModel: NodeLocalViewModel | null) {
  if (!node && !viewModel) return null;

  return {
    objectId: normalizeCanonicalObjectId(node?.objectId ?? viewModel?.node.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(node?.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(node?.ownerCapId),
    canonicalIdentity: node?.networkNodeRenderMeta?.canonicalIdentity ?? null,
    displayName: viewModel?.node.displayName ?? node?.name ?? null,
    status: viewModel?.node.status ?? node?.status ?? null,
    readModelSource: node?.readModelSource ?? null,
    source: viewModel?.node.source ?? null,
    provenance: viewModel?.node.provenance ?? null,
    energySourceId: node?.summary?.energySourceId ?? viewModel?.node.energySourceId ?? null,
    fuelAmount: viewModel?.node.fuelAmount ?? null,
    powerUsageSummary: viewModel?.node.powerUsageSummary ?? node?.indexedPowerUsageSummary ?? node?.summary?.powerUsageSummary ?? null,
    networkNodeRenderMeta: node?.networkNodeRenderMeta ?? null,
  };
}

function mapPowerControl(structure: NodeLocalStructure | null, txStatus: TxStatus): Record<string, unknown> | null {
  if (!structure) return null;

  const state = getNodeLocalPowerControlState(structure);
  return {
    ...state,
    canRename: structure.actionAuthority.verifiedTarget != null,
    canBringOnline: state.nextOnline === true,
    canTakeOffline: state.nextOnline === false,
    isBusy: txStatus === "pending",
    unavailableReason: state.isStatusOnly ? formatNodeLocalActionAuthorityDetail(structure) : null,
  };
}

function mapMenuItems(items: NodeDrilldownMenuItem[]) {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    disabled: item.disabled === true,
    disabledReason: item.disabledReason ?? null,
    tone: item.tone ?? null,
  }));
}

function mapPlan(plan: NodePowerOperationPlan) {
  return {
    disabledReason: plan.disabledReason,
    capacityReason: plan.capacityReason,
    targetCount: plan.targets.length,
    targets: plan.targets.map((target) => ({
      desiredOnline: target.desiredOnline,
      structureId: target.verifiedTarget.structureId,
      structureType: target.verifiedTarget.structureType,
      ownerCapId: target.verifiedTarget.ownerCapId,
      networkNodeId: target.verifiedTarget.networkNodeId,
      assemblyId: target.structure.assemblyId ?? null,
      canonicalDomainKey: target.structure.canonicalDomainKey,
      displayName: target.structure.displayName,
      status: target.structure.status,
    })),
  };
}

function identityMatches(row: { objectId?: string | null; assemblyId?: string | null }, structure: NodeLocalStructure | null): boolean {
  if (!structure) return false;

  const rowObjectId = normalizeCanonicalObjectId(row.objectId);
  const rowAssemblyId = normalizeNodeDrilldownAssemblyId(row.assemblyId);
  return Boolean(
    (rowObjectId && [
      structure.objectId,
      structure.directChainObjectId,
      structure.actionAuthority.verifiedTarget?.structureId,
    ].some((value) => normalizeCanonicalObjectId(value) === rowObjectId))
    || (rowAssemblyId && [
      structure.assemblyId,
      structure.directChainAssemblyId,
    ].some((value) => normalizeNodeDrilldownAssemblyId(value) === rowAssemblyId)),
  );
}

function mapOperatorRow(row: OperatorInventoryStructure | null | undefined): OperatorInventoryProofRow | null {
  if (!row) return null;

  return {
    objectId: normalizeCanonicalObjectId(row.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(row.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(row.ownerCapId),
    networkNodeId: normalizeCanonicalObjectId(row.networkNodeId),
    energySourceId: normalizeCanonicalObjectId(row.energySourceId),
    displayName: row.displayName ?? row.name ?? null,
    family: row.family,
    size: row.size,
    typeName: row.typeName,
    assemblyType: row.assemblyType,
    status: row.status,
    source: row.source,
    provenance: row.provenance,
    powerRequirement: row.powerRequirement,
    powerUsageSummary: row.powerUsageSummary,
    actionCandidate: row.actionCandidate,
  };
}

function mapRequiredIds(action: { requiredIds?: unknown } | null | undefined): Record<string, unknown> | null {
  const requiredIds = action?.requiredIds;
  return requiredIds && typeof requiredIds === "object" ? requiredIds as Record<string, unknown> : null;
}

function canonicalDomainKey(objectId: string | null | undefined, assemblyId: string | null | undefined): string | null {
  return selectCanonicalNodeDrilldownDomainKey({ objectId, assemblyId });
}

function mapOperatorProofStage(stage: string, row: OperatorInventoryStructure | null | undefined): SelectedRowProofTraceStage {
  const mapped = mapOperatorRow(row);
  return {
    stage,
    displayName: mapped?.displayName ?? null,
    name: row?.name ?? null,
    typeName: mapped?.typeName ?? null,
    family: mapped?.family ?? null,
    size: mapped?.size ?? null,
    status: mapped?.status ?? null,
    objectId: mapped?.objectId ?? null,
    assemblyId: mapped?.assemblyId ?? null,
    ownerCapId: mapped?.ownerCapId ?? null,
    networkNodeId: mapped?.networkNodeId ?? null,
    energySourceId: mapped?.energySourceId ?? null,
    canonicalDomainKey: canonicalDomainKey(mapped?.objectId, mapped?.assemblyId),
    powerRequirement: { requiredGj: mapped?.powerRequirement?.requiredGj ?? null },
    actionCandidate: {
      actions: {
        power: { requiredIds: mapRequiredIds(mapped?.actionCandidate?.actions.power) },
        rename: { requiredIds: mapRequiredIds(mapped?.actionCandidate?.actions.rename) },
      },
    },
    actionAuthority: {
      state: null,
      verifiedTarget: {
        structureId: null,
        ownerCapId: null,
        networkNodeId: null,
      },
    },
    source: mapped?.source ?? null,
    provenance: mapped?.provenance ?? null,
    displayNameSource: row?.displayNameSource ?? null,
    displayNameUpdatedAt: row?.displayNameUpdatedAt ?? null,
  };
}

function mapOperatorRawProofStage(stage: string, row: OperatorInventoryStructure | null | undefined): SelectedRowProofTraceStage {
  const raw = row?.rawProof ?? null;
  return mapOperatorRawProof(stage, raw);
}

function mapOperatorRawProof(stage: string, raw: OperatorInventoryRawStructureProof | null): SelectedRowProofTraceStage {
  return {
    stage,
    displayName: raw?.displayName ?? raw?.name ?? null,
    name: raw?.name ?? null,
    typeName: raw?.typeName ?? null,
    family: raw?.family ?? null,
    size: raw?.size ?? null,
    status: raw?.status ?? null,
    objectId: raw?.objectId ?? null,
    assemblyId: raw?.assemblyId ?? null,
    ownerCapId: raw?.ownerCapId ?? null,
    networkNodeId: raw?.networkNodeId ?? null,
    energySourceId: raw?.energySourceId ?? null,
    canonicalDomainKey: canonicalDomainKey(raw?.objectId, raw?.assemblyId),
    powerRequirement: { requiredGj: raw?.powerRequirement?.requiredGj ?? null },
    actionCandidate: {
      actions: {
        power: { requiredIds: mapRequiredIds(raw?.actionCandidate?.actions.power) },
        rename: { requiredIds: mapRequiredIds(raw?.actionCandidate?.actions.rename) },
      },
    },
    actionAuthority: {
      state: null,
      verifiedTarget: {
        structureId: null,
        ownerCapId: null,
        networkNodeId: null,
      },
    },
    source: raw?.source ?? null,
    provenance: raw?.provenance ?? null,
    displayNameSource: raw?.displayNameSource ?? null,
    displayNameUpdatedAt: raw?.displayNameUpdatedAt ?? null,
  };
}

function findAdaptedStructure(group: NetworkNodeGroup | null, selectedStructure: NodeLocalStructure | null): Structure | null {
  if (!group || !selectedStructure) return null;

  return [...group.gates, ...group.storageUnits, ...group.turrets].find((structure) => identityMatches(structure, selectedStructure)) ?? null;
}

function mapAdaptedProofStage(stage: string, structure: Structure | null): SelectedRowProofTraceStage {
  const actionCandidate = structure?.summary?.actionCandidate ?? null;
  return {
    stage,
    displayName: structure?.summary?.displayName ?? structure?.name ?? null,
    name: structure?.summary?.name ?? structure?.name ?? null,
    typeName: structure?.summary?.typeName ?? null,
    family: structure?.summary?.family ?? structure?.type ?? null,
    size: structure?.summary?.size ?? null,
    status: structure?.status ?? structure?.summary?.status ?? null,
    objectId: normalizeCanonicalObjectId(structure?.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(structure?.assemblyId ?? structure?.summary?.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(structure?.ownerCapId || structure?.summary?.ownerCapId),
    networkNodeId: normalizeCanonicalObjectId(structure?.networkNodeId ?? structure?.summary?.networkNodeId),
    energySourceId: normalizeCanonicalObjectId(structure?.summary?.energySourceId),
    canonicalDomainKey: canonicalDomainKey(structure?.objectId, structure?.assemblyId),
    powerRequirement: {
      requiredGj: (structure?.indexedPowerRequirement ?? structure?.summary?.powerRequirement)?.requiredGj ?? null,
    },
    actionCandidate: {
      actions: {
        power: { requiredIds: mapRequiredIds(actionCandidate?.actions.power) },
        rename: { requiredIds: mapRequiredIds(actionCandidate?.actions.rename) },
      },
    },
    actionAuthority: {
      state: null,
      verifiedTarget: {
        structureId: null,
        ownerCapId: null,
        networkNodeId: null,
      },
    },
    source: structure?.readModelSource ?? structure?.summary?.source ?? null,
    provenance: structure?.summary?.provenance ?? null,
    displayNameSource: structure?.summary?.displayNameSource ?? null,
    displayNameUpdatedAt: structure?.summary?.displayNameUpdatedAt ?? null,
  };
}

function mapNodeLocalProofStage(stage: string, row: NodeControlStructureDebugRow | null): SelectedRowProofTraceStage {
  return {
    stage,
    displayName: row?.displayName ?? null,
    name: null,
    typeName: row?.typeLabel ?? null,
    family: row?.family ?? null,
    size: row?.sizeVariant ?? null,
    status: row?.status ?? null,
    objectId: row?.objectId ?? null,
    assemblyId: row?.assemblyId ?? null,
    ownerCapId: row?.ownerCapId ?? null,
    networkNodeId: row?.networkNodeId ?? null,
    energySourceId: row?.energySourceId ?? null,
    canonicalDomainKey: row?.canonicalDomainKey ?? null,
    powerRequirement: { requiredGj: row?.powerRequirement?.requiredGj ?? null },
    actionCandidate: {
      actions: {
        power: { requiredIds: mapRequiredIds(row?.actionCandidate?.actions.power) },
        rename: { requiredIds: mapRequiredIds(row?.actionCandidate?.actions.rename) },
      },
    },
    actionAuthority: {
      state: row?.actionAuthority.state ?? null,
      verifiedTarget: {
        structureId: row?.actionAuthority.verifiedTarget?.structureId ?? null,
        ownerCapId: row?.actionAuthority.verifiedTarget?.ownerCapId ?? null,
        networkNodeId: row?.actionAuthority.verifiedTarget?.networkNodeId ?? null,
      },
    },
    source: row?.source ?? null,
    provenance: row?.provenance ?? null,
    displayNameSource: row?.displayNameSource ?? null,
    displayNameUpdatedAt: row?.displayNameUpdatedAt ?? null,
  };
}

function findFirstProofLoss(
  stages: SelectedRowProofTraceStage[],
  hasProof: (stage: SelectedRowProofTraceStage) => boolean,
): string | null {
  let seen = false;
  for (const stage of stages) {
    if (hasProof(stage)) {
      seen = true;
      continue;
    }

    if (seen) return stage.stage;
  }
  return null;
}

function buildSelectedRowProofTrace({
  adaptedStructure,
  rawStructure,
  lookupStructure,
  selectedRow,
  contextMenuRow,
  actionRailRow,
  rows,
  visibleRows,
  contextMenuItems,
  nodeUsageReadout,
}: {
  adaptedStructure: Structure | null;
  rawStructure: OperatorInventoryStructure | null;
  lookupStructure: OperatorInventoryStructure | null;
  selectedRow: NodeControlStructureDebugRow | null;
  contextMenuRow: NodeControlStructureDebugRow | null;
  actionRailRow: NodeControlStructureDebugRow | null;
  rows: NodeControlStructureDebugRow[];
  visibleRows: NodeControlStructureDebugRow[];
  contextMenuItems: NodeDrilldownMenuItem[];
  nodeUsageReadout: NodePowerUsageReadout | null;
}): SelectedRowProofTrace {
  const selectedCanonicalDomainKey = selectedRow?.canonicalDomainKey ?? contextMenuRow?.canonicalDomainKey ?? null;
  const renderedRow = selectedCanonicalDomainKey
    ? rows.find((row) => row.canonicalDomainKey === selectedCanonicalDomainKey) ?? null
    : selectedRow;
  const visibleRow = selectedCanonicalDomainKey
    ? visibleRows.find((row) => row.canonicalDomainKey === selectedCanonicalDomainKey) ?? null
    : selectedRow;
  const stages = [
    mapOperatorRawProofStage("1. raw EF-Map operator-inventory JSON", rawStructure),
    mapOperatorProofStage("2. normalized operator-inventory response", rawStructure),
    mapAdaptedProofStage("3. adaptOperatorInventory output", adaptedStructure),
    mapOperatorProofStage("4. nodeLookupsByNodeId lookup entry", lookupStructure),
    mapOperatorProofStage("5. selectedNodeObservedLookup", lookupStructure),
    mapNodeLocalProofStage("6. selectedNodeViewModel.structures", renderedRow),
    mapNodeLocalProofStage("7. visibleNodeViewModel.structures", visibleRow),
    mapNodeLocalProofStage("8. selected inspector target", selectedRow),
    mapNodeLocalProofStage("9. context menu target", contextMenuRow),
    mapNodeLocalProofStage("10. action rail target", actionRailRow),
    {
      ...mapNodeLocalProofStage("11. power readout inputs", actionRailRow),
      source: nodeUsageReadout?.label ?? null,
      provenance: nodeUsageReadout ? JSON.stringify({
        label: nodeUsageReadout.label,
        capacityGJ: nodeUsageReadout.capacityGJ,
        isAvailable: nodeUsageReadout.isAvailable,
      }) : null,
    },
  ];

  return {
    selectedDisplayName: selectedRow?.displayName ?? contextMenuRow?.displayName ?? null,
    selectedCanonicalDomainKey,
    firstLost: {
      objectId: findFirstProofLoss(stages, (stage) => Boolean(
        stage.objectId
          || stage.actionCandidate.actions.power.requiredIds?.structureId
          || stage.actionCandidate.actions.rename.requiredIds?.structureId
          || stage.actionAuthority.verifiedTarget.structureId,
      )),
      ownerCapId: findFirstProofLoss(stages, (stage) => Boolean(
        stage.ownerCapId
          || stage.actionCandidate.actions.power.requiredIds?.ownerCapId
          || stage.actionCandidate.actions.rename.requiredIds?.ownerCapId
          || stage.actionAuthority.verifiedTarget.ownerCapId,
      )),
      networkNodeId: findFirstProofLoss(stages, (stage) => Boolean(
        stage.networkNodeId
          || stage.actionCandidate.actions.power.requiredIds?.networkNodeId
          || stage.actionCandidate.actions.rename.requiredIds?.networkNodeId
          || stage.actionAuthority.verifiedTarget.networkNodeId,
      )),
      actionAuthority: findFirstProofLoss(stages, (stage) => stage.actionAuthority.state != null),
      powerRequirement: findFirstProofLoss(stages, (stage) => stage.powerRequirement.requiredGj != null),
    },
    stages,
    menuItems: contextMenuItems.map((item) => ({
      key: item.key,
      label: item.label,
      disabled: item.disabled === true,
      disabledReason: item.disabledReason ?? null,
    })),
    powerReadoutInputs: {
      label: nodeUsageReadout?.label ?? null,
      isAvailable: nodeUsageReadout?.isAvailable ?? null,
      capacityGJ: nodeUsageReadout?.capacityGJ ?? null,
    },
  };
}

function findRawNodeGroup(inventory: OperatorInventoryResponse | null, selectedNodeId: string | null) {
  const normalizedNodeId = normalizeCanonicalObjectId(selectedNodeId);
  if (!inventory || !normalizedNodeId) return null;

  return inventory.networkNodes.find((group) => normalizeCanonicalObjectId(group.node.objectId) === normalizedNodeId) ?? null;
}

function summarizeLookup(lookup: NodeAssembliesLookupResult | null) {
  if (!lookup) return null;

  return {
    status: lookup.status,
    source: lookup.source,
    fetchedAt: lookup.fetchedAt,
    isPartial: lookup.isPartial,
    assemblyCount: lookup.assemblies.length,
    droppedCount: lookup.droppedCount,
    error: lookup.error,
  };
}

export function buildNodeControlDebugSnapshot(input: BuildNodeControlDebugSnapshotInput): NodeControlDebugCopySummary {
  const rawNodeGroup = findRawNodeGroup(input.operatorInventory.inventory, input.selectedNodeId);
  const rawStructure = rawNodeGroup?.structures.find((row) => identityMatches(row, input.selectedStructure)) ?? null;
  const lookupStructure = input.selectedNodeObservedLookup?.status === "success"
    ? input.selectedNodeObservedLookup.assemblies.find((row) => identityMatches(row, input.selectedStructure))
    : null;
  const adaptedStructure = findAdaptedStructure(input.selectedNodeGroup, input.selectedStructure);
  const rows = input.selectedNodeViewModel?.structures.map(mapStructureRow) ?? [];
  const visibleRows = input.visibleNodeViewModel?.structures.map(mapStructureRow) ?? [];
  const selectedRow = input.selectedStructure ? mapStructureRow(input.selectedStructure) : null;
  const contextMenuRow = input.contextMenuStructure ? mapStructureRow(input.contextMenuStructure) : null;
  const selectedAuthority = selectedRow ? {
    state: selectedRow.actionAuthority.state,
    verifiedTarget: selectedRow.actionAuthority.verifiedTarget,
    candidateTargets: selectedRow.actionAuthority.candidateTargets,
    unavailableReason: selectedRow.actionAuthority.unavailableReason ?? null,
    label: selectedRow.actionAuthorityLabel,
    detail: selectedRow.actionAuthorityDetail,
    canRename: selectedRow.actionAuthority.verifiedTarget != null,
  } : null;

  return {
    schemaVersion: "node-control-debug.v1",
    capturedAt: new Date().toISOString(),
    location: {
      pathname: typeof window === "undefined" ? "" : window.location.pathname,
      debugNodeControl: typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("debugNodeControl"),
    },
    session: {
      walletAddress: input.walletAddress,
      isConnected: input.isConnected,
      characterId: input.characterId,
    },
    selection: {
      selectedNodeId: input.selectedNodeId,
      selectedNode: mapSelectedNode(input.selectedNode, input.selectedNodeViewModel),
      selectedStructureId: input.selectedStructureId,
      selectedStructureCanonicalDomainKey: input.selectedStructureCanonicalDomainKey,
      selectedStructureResolution: {
        source: input.selectedStructureResolutionSource,
        matchedKey: input.selectedStructureResolutionMatchedKey,
        replacedWeakRow: input.selectedStructureReplacedWeakRow,
      },
      selectedStructure: selectedRow,
      totalStructureCount: input.selectedNodeViewModel?.structures.length ?? 0,
      visibleStructureCount: input.visibleStructureCount,
      hiddenStructureCount: input.hiddenCanonicalKeys.length,
      hiddenCanonicalKeys: input.hiddenCanonicalKeys,
      sourceMode: input.selectedNodeViewModel?.sourceMode ?? null,
      coverage: input.selectedNodeViewModel?.coverage ?? null,
    },
    authority: {
      selectedStructure: selectedAuthority,
      rows: rows.map((row) => ({
        id: row.id,
        canonicalDomainKey: row.canonicalDomainKey,
        displayName: row.displayName,
        objectId: row.objectId,
        assemblyId: row.assemblyId,
        ownerCapId: row.ownerCapId,
        networkNodeId: row.networkNodeId,
        state: row.actionAuthority.state,
        verifiedTarget: row.actionAuthority.verifiedTarget,
        candidateTargets: row.actionAuthority.candidateTargets,
        unavailableReason: row.actionAuthority.unavailableReason ?? null,
        label: row.actionAuthorityLabel,
        detail: row.actionAuthorityDetail,
      })),
      visibleRows: visibleRows.map((row) => ({
        id: row.id,
        canonicalDomainKey: row.canonicalDomainKey,
        displayName: row.displayName,
        typeLabel: row.typeLabel,
        sizeVariant: row.sizeVariant,
        status: row.status,
        source: row.source,
        objectId: row.objectId,
        assemblyId: row.assemblyId,
        ownerCapId: row.ownerCapId,
        networkNodeId: row.networkNodeId,
        powerRequirement: row.powerRequirement,
        state: row.actionAuthority.state,
        verifiedTargetPresent: row.verifiedTargetPresent,
        candidateTargetCount: row.candidateTargetCount,
        isActionable: row.isActionable,
        isReadOnly: row.isReadOnly,
      })),
    },
    contextMenu: {
      nodeLocalStructureMenu: {
        isOpen: input.contextMenu != null,
        structureId: input.contextMenu?.structureId ?? null,
        canonicalDomainKey: input.contextMenu?.canonicalDomainKey ?? null,
        structureName: input.contextMenu?.structureName ?? null,
        visibilityAction: input.contextMenu?.visibilityAction ?? null,
        visibilityActionLabel: input.contextMenu?.visibilityActionLabel ?? null,
        powerActionLabel: input.contextMenu?.powerActionLabel ?? null,
        nextOnline: input.contextMenu?.nextOnline ?? null,
        target: contextMenuRow,
        items: mapMenuItems(input.contextMenuItems),
      },
      selectedNodeMenu: {
        isOpen: input.macroContextMenu != null,
        structureId: input.macroContextMenu?.structureId ?? null,
        structureName: input.macroContextMenu?.structureName ?? null,
        items: mapMenuItems(input.macroContextMenu?.items ?? []),
      },
    },
    actionRail: {
      selectedStructure: mapPowerControl(input.selectedStructure, input.powerTx.status),
      selectedStructureRow: selectedRow,
    },
    power: {
      nodeUsageReadout: input.nodeUsageReadout,
      capacityCheck: input.capacityCheck,
      tx: {
        status: input.powerTx.status,
        digest: input.powerTx.result?.digest ?? null,
        message: input.powerTx.result?.message ?? null,
        detail: input.powerTx.result?.detail ?? null,
        error: input.powerTx.error,
      },
      pendingPlan: input.pendingPlan ? {
        mode: input.pendingPlan.mode,
        title: input.pendingPlan.title,
        primaryLabel: input.pendingPlan.primaryLabel,
        ...mapPlan(input.pendingPlan.plan),
      } : null,
    },
    bulkControls: {
      savePresetDisabledReason: input.savePresetDisabledReason,
      canSavePowerPreset: input.canSavePowerPreset,
      bringAllOnline: mapPlan(input.bringAllOnlinePlan),
      takeAllOffline: mapPlan(input.takeAllOfflinePlan),
      presets: input.presetPlans.map((preset) => ({
        slotIndex: preset.slotIndex,
        label: preset.label,
        savedAt: preset.savedAt,
        plan: mapPlan(preset.plan),
      })),
    },
    provenance: {
      readModelDebug: input.readModelDebug,
      operatorInventory: {
        walletAddress: input.operatorInventory.walletAddress,
        isLoading: input.operatorInventory.isLoading,
        isError: input.operatorInventory.isError,
        errorMessage: input.operatorInventory.errorMessage,
        source: input.operatorInventory.inventory?.source ?? null,
        fetchedAt: input.operatorInventory.inventory?.fetchedAt ?? null,
        partial: input.operatorInventory.inventory?.partial ?? null,
        warnings: input.operatorInventory.inventory?.warnings ?? [],
      },
      selectedNodeInventoryLookup: {
        found: input.selectedNodeInventoryLookupResolution.found,
        foundBy: input.selectedNodeInventoryLookupResolution.foundBy,
        matchedKey: input.selectedNodeInventoryLookupResolution.matchedKey,
        lookupKeysTried: input.selectedNodeInventoryLookupResolution.lookupKeysTried,
        rawChildCount: input.selectedNodeInventoryLookupResolution.rawChildCount,
      },
      nodeAssembliesFallbackEnabled: input.nodeAssembliesFallbackEnabled,
      nodeAssembliesFallbackRan: input.nodeAssembliesFallbackRan,
      selectedNodeObservedLookup: summarizeLookup(input.selectedNodeObservedLookup),
    },
    proof: {
      rawOperatorInventoryNode: mapOperatorRow(rawNodeGroup?.node),
      rawOperatorInventoryStructure: mapOperatorRow(rawStructure),
      rawNodeAssemblyLookupStructure: mapOperatorRow(lookupStructure as OperatorInventoryStructure | null),
      adaptedNodeGroup: input.selectedNodeGroup ? {
        node: mapSelectedNode(input.selectedNodeGroup.node, input.selectedNodeViewModel),
        childCounts: {
          gates: input.selectedNodeGroup.gates.length,
          storageUnits: input.selectedNodeGroup.storageUnits.length,
          turrets: input.selectedNodeGroup.turrets.length,
        },
      } : null,
      renderedNodeControlRows: rows,
      visibleNodeControlRows: visibleRows,
      selectedInspectorTarget: selectedRow,
      contextMenuTarget: contextMenuRow,
      actionRailTarget: selectedRow,
    },
    selectedRowProofTrace: buildSelectedRowProofTrace({
      adaptedStructure,
      rawStructure,
      lookupStructure: lookupStructure as OperatorInventoryStructure | null,
      selectedRow,
      contextMenuRow,
      actionRailRow: selectedRow,
      rows,
      visibleRows,
      contextMenuItems: input.contextMenuItems,
      nodeUsageReadout: input.nodeUsageReadout,
    }),
    pipeline: {
      phase: input.operatorInventory.isLoading
        ? "operator-inventory-loading"
        : input.selectedNodeViewModel?.sourceMode === "backend-membership"
          ? "operator-inventory-authoritative"
          : input.operatorInventory.isError
            ? "operator-inventory-error"
            : "operator-inventory-unavailable",
      selectedNodeViewModelSourceMode: input.selectedNodeViewModel?.sourceMode ?? null,
      selectedNodeInventoryLookupFound: input.selectedNodeInventoryLookupResolution.found,
      selectedNodeInventoryLookupMatchedKey: input.selectedNodeInventoryLookupResolution.matchedKey,
      selectedNodeInventoryLookupKeysTried: input.selectedNodeInventoryLookupResolution.lookupKeysTried,
      selectedNodeInventoryLookupRawChildCount: input.selectedNodeInventoryLookupResolution.rawChildCount,
    },
  };
}

export function buildNodeControlDebugCopySummary(snapshot: NodeControlDebugCopySummary | null): NodeControlDebugCopySummary | null {
  return snapshot;
}
