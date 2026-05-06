import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { DEFAULT_SUI_RPC_URL } from "../src/constants.ts";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import {
  getNodeLocalPowerToggleIntent,
  supportsNodeLocalRename,
} from "../src/lib/nodeDrilldownActionAuthority.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import {
  buildNodeAssembliesUrl,
  normalizeCanonicalObjectId,
} from "../src/lib/nodeAssembliesClient.ts";
import { buildNetworkNodeOfflinePlan } from "../src/lib/networkNodeOfflineAction.ts";
import {
  buildNodeChildBulkPowerPlan,
  evaluateNodePowerCapacity,
  evaluateNodePowerPlanCapacity,
  getNodePowerUsageReadout,
} from "../src/lib/nodePowerControlModel.ts";
import {
  buildOperatorInventoryUrl,
  normalizeOperatorInventoryResponse,
} from "../src/lib/operatorInventoryClient.ts";
import {
  buildSignalHistoryUrl,
} from "../src/lib/signalHistoryClient.ts";
import { resolveStructurePowerChainSnapshot } from "../src/lib/structurePowerChainStatus.ts";
import {
  getStructurePowerAction,
  supportsStructureRename,
} from "../src/lib/structureActionSupport.ts";

import type { StructurePowerChainSnapshot } from "../src/lib/structurePowerChainStatus.ts";
import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient.ts";
import type { OperatorInventoryNode, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";

interface LiveUsageArgs {
  walletAddress: string;
  nodeObjectId: string | null;
  baseUrl: string;
  origin: string;
  checkChain: boolean;
  rpcUrl: string;
}

function readArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index < 0) {
    return null;
  }

  return args[index + 1] ?? null;
}

function parseArgs(args: string[]): LiveUsageArgs {
  const walletAddress = readArgValue(args, "--wallet") ?? readArgValue(args, "--walletAddress");
  if (!walletAddress) {
    throw new Error("Live usage check requires --wallet <address>.");
  }

  return {
    walletAddress,
    nodeObjectId: readArgValue(args, "--node") ?? readArgValue(args, "--nodeObjectId"),
    baseUrl: readArgValue(args, "--base") ?? "https://ef-map.com",
    origin: readArgValue(args, "--origin") ?? "https://civilizationcontrol.com",
    checkChain: args.includes("--check-chain"),
    rpcUrl: readArgValue(args, "--rpc") ?? DEFAULT_SUI_RPC_URL,
  };
}

function hasLoadMismatch(indexed: number | null | undefined, local: number | null | undefined): boolean {
  if (indexed == null && local == null) {
    return false;
  }

  return indexed !== local;
}

function normalizeAssemblyId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const withoutLeadingZeros = trimmed.replace(/^0+/, "");
  return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : "0";
}

function matchesStructureIdentity(
  objectId: string | null | undefined,
  assemblyId: string | null | undefined,
  candidateObjectId: string | null | undefined,
  candidateAssemblyId: string | null | undefined,
): boolean {
  const normalizedObjectId = normalizeCanonicalObjectId(objectId);
  const normalizedCandidateObjectId = normalizeCanonicalObjectId(candidateObjectId);
  if (normalizedObjectId && normalizedCandidateObjectId && normalizedObjectId === normalizedCandidateObjectId) {
    return true;
  }

  const normalizedAssemblyId = normalizeAssemblyId(assemblyId);
  const normalizedCandidateAssemblyId = normalizeAssemblyId(candidateAssemblyId);
  return normalizedAssemblyId != null
    && normalizedCandidateAssemblyId != null
    && normalizedAssemblyId === normalizedCandidateAssemblyId;
}

function deriveRawAuthority(row: OperatorInventoryStructure) {
  const powerRequiredIds = row.actionCandidate?.actions.power?.requiredIds;
  const ownerCapId = normalizeCanonicalObjectId(powerRequiredIds?.ownerCapId ?? row.ownerCapId);
  const networkNodeId = normalizeCanonicalObjectId(powerRequiredIds?.networkNodeId ?? row.networkNodeId);
  const structureId = normalizeCanonicalObjectId(powerRequiredIds?.structureId ?? row.objectId);

  return {
    structureId,
    structureType: powerRequiredIds?.structureType ?? null,
    ownerCapId,
    networkNodeId,
    powerCandidate: row.actionCandidate?.actions.power?.candidate ?? null,
    renameCandidate: row.actionCandidate?.actions.rename?.candidate ?? null,
    supported: row.actionCandidate?.supported ?? null,
    familySupported: row.actionCandidate?.familySupported ?? null,
    ready: Boolean(structureId && ownerCapId && networkNodeId && powerRequiredIds?.structureType),
    unavailableReason: row.actionCandidate?.unavailableReason ?? row.actionCandidate?.actions.power?.unavailableReason ?? null,
  };
}

function summarizeRawActionCandidate(row: OperatorInventoryStructure) {
  return {
    supported: row.actionCandidate?.supported ?? null,
    familySupported: row.actionCandidate?.familySupported ?? null,
    unavailableReason: row.actionCandidate?.unavailableReason ?? null,
    power: {
      candidate: row.actionCandidate?.actions.power?.candidate ?? null,
      familySupported: row.actionCandidate?.actions.power?.familySupported ?? null,
      currentlyImplementedInCivilizationControl: row.actionCandidate?.actions.power?.currentlyImplementedInCivilizationControl ?? null,
      indexedOwnerCapPresent: row.actionCandidate?.actions.power?.indexedOwnerCapPresent ?? null,
      requiredIds: row.actionCandidate?.actions.power?.requiredIds ?? null,
      unavailableReason: row.actionCandidate?.actions.power?.unavailableReason ?? null,
    },
    rename: {
      candidate: row.actionCandidate?.actions.rename?.candidate ?? null,
      familySupported: row.actionCandidate?.actions.rename?.familySupported ?? null,
      currentlyImplementedInCivilizationControl: row.actionCandidate?.actions.rename?.currentlyImplementedInCivilizationControl ?? null,
      indexedOwnerCapPresent: row.actionCandidate?.actions.rename?.indexedOwnerCapPresent ?? null,
      requiredIds: row.actionCandidate?.actions.rename?.requiredIds ?? null,
      unavailableReason: row.actionCandidate?.actions.rename?.unavailableReason ?? null,
    },
  };
}

function summarizeVerifiedTarget(
  verifiedTarget: NonNullable<ReturnType<typeof deriveRawAuthority>> | null | undefined,
) {
  return verifiedTarget ?? null;
}

async function fetchLiveInventory(args: LiveUsageArgs) {
  const response = await fetch(buildOperatorInventoryUrl(args.walletAddress, args.baseUrl), {
    headers: { Origin: args.origin },
  });

  if (!response.ok) {
    throw new Error(`operator-inventory fetch failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const inventory = normalizeOperatorInventoryResponse(payload);
  if (!inventory) {
    throw new Error("operator-inventory payload did not normalize to operator-inventory.v1.");
  }

  return {
    inventory,
    transport: {
      status: response.status,
      accessControlAllowOrigin: response.headers.get("access-control-allow-origin"),
      vary: response.headers.get("vary"),
    },
  };
}

async function fetchSignalHistoryDiagnostic(args: LiveUsageArgs) {
  const transportResponse = await fetch(buildSignalHistoryUrl({
    walletAddress: args.walletAddress,
    limit: 20,
  }, args.baseUrl), {
    headers: { Origin: args.origin },
  });
  const page = transportResponse.ok ? await transportResponse.json() as Record<string, unknown> : null;

  return {
    transport: {
      status: transportResponse.status,
      accessControlAllowOrigin: transportResponse.headers.get("access-control-allow-origin"),
      vary: transportResponse.headers.get("vary"),
    },
    page,
  };
}

function describeRawChild(row: OperatorInventoryStructure) {
  const authority = deriveRawAuthority(row);

  return {
    objectId: row.objectId,
    ownerCapId: row.ownerCapId,
    networkNodeId: row.networkNodeId,
    assemblyId: row.assemblyId,
    displayName: row.displayName,
    name: row.name,
    displayNameSource: row.displayNameSource,
    displayNameUpdatedAt: row.displayNameUpdatedAt,
    status: row.status,
    powerRequirement: row.powerRequirement,
    readModelSource: row.source ?? null,
    authority,
    actionCandidate: summarizeRawActionCandidate(row),
  };
}

function describeAdaptedChild(group: ReturnType<typeof adaptOperatorInventory>["nodeGroups"][number]) {
  return [...group.gates, ...group.storageUnits, ...group.turrets].map((structure) => ({
    objectId: structure.objectId,
    ownerCapId: structure.ownerCapId,
    networkNodeId: structure.networkNodeId ?? null,
    assemblyId: structure.assemblyId ?? null,
    displayName: structure.summary?.displayName ?? structure.summary?.name ?? structure.name,
    name: structure.name,
    displayNameSource: structure.summary?.displayNameSource ?? null,
    status: structure.status,
    powerRequirement: structure.indexedPowerRequirement ?? structure.summary?.powerRequirement ?? null,
    readModelSource: structure.readModelSource ?? null,
    authority: {
      structureId: structure.objectId,
      structureType: structure.type,
      ownerCapId: structure.ownerCapId,
      networkNodeId: structure.networkNodeId ?? null,
      ready: Boolean(structure.ownerCapId && structure.networkNodeId),
    },
  }));
}

function describeViewModelChildren(
  structures: ReturnType<typeof buildLiveNodeLocalViewModelWithObserved>["structures"],
  chainSnapshots: Map<string, StructurePowerChainSnapshot>,
) {
  return structures.map((structure) => {
    const normalizedObjectId = structure.objectId ? normalizeCanonicalObjectId(structure.objectId) : null;
    const chainSnapshot = normalizedObjectId ? chainSnapshots.get(normalizedObjectId) ?? null : null;

    return {
      objectId: structure.objectId ?? null,
      assemblyId: structure.assemblyId ?? null,
      displayName: structure.displayName,
      status: structure.status,
      powerRequirement: structure.powerRequirement ?? null,
      source: structure.source,
      backendSource: structure.backendSource ?? null,
      displayNameSource: structure.displayNameSource ?? null,
      displayNameUpdatedAt: structure.displayNameUpdatedAt ?? null,
      provenance: structure.provenance ?? null,
      hasDirectChainAuthority: structure.hasDirectChainAuthority,
      actionAuthority: {
        state: structure.actionAuthority.state,
        verifiedTarget: structure.actionAuthority.verifiedTarget ?? null,
        candidateTargets: structure.actionAuthority.candidateTargets,
        unavailableReason: structure.actionAuthority.unavailableReason ?? null,
      },
      canRename: supportsNodeLocalRename(structure),
      powerToggle: getNodeLocalPowerToggleIntent(structure),
      canBringOnline: getNodeLocalPowerToggleIntent(structure)?.nextOnline === true,
      canTakeOffline: getNodeLocalPowerToggleIntent(structure)?.nextOnline === false,
      chainStatus: chainSnapshot?.chainStatus ?? null,
      chainState: chainSnapshot?.state ?? null,
      chainVariant: chainSnapshot?.statusVariant ?? null,
    };
  });
}

function describeLookupChildren(lookup: NodeAssembliesLookupResult | null) {
  if (!lookup || lookup.status !== "success") {
    return [];
  }

  return lookup.assemblies.map((row) => ({
    objectId: row.objectId,
    ownerCapId: row.ownerCapId ?? null,
    networkNodeId: lookup.networkNodeId,
    assemblyId: row.assemblyId,
    displayName: row.displayName ?? null,
    name: row.name,
    displayNameSource: row.displayNameSource ?? null,
    displayNameUpdatedAt: row.displayNameUpdatedAt ?? null,
    status: row.status,
    powerRequirement: row.powerRequirement ?? null,
    powerSummary: row.powerSummary ?? null,
    provenance: row.provenance ?? null,
    source: row.source ?? null,
    authority: deriveRawAuthority(row),
  }));
}

function findMatchingRawChild(rawNode: OperatorInventoryNode | null, objectId: string | null | undefined, assemblyId: string | null | undefined) {
  return rawNode?.structures.find((row) => matchesStructureIdentity(objectId, assemblyId, row.objectId, row.assemblyId)) ?? null;
}

function findMatchingAdaptedChild(group: ReturnType<typeof adaptOperatorInventory>["nodeGroups"][number], objectId: string | null | undefined, assemblyId: string | null | undefined) {
  return [...group.gates, ...group.storageUnits, ...group.turrets].find((structure) => (
    matchesStructureIdentity(objectId, assemblyId, structure.objectId, structure.assemblyId)
  )) ?? null;
}

function formatBulkPlan(
  label: string,
  viewModel: ReturnType<typeof buildLiveNodeLocalViewModelWithObserved>,
  desiredOnline: boolean,
) {
  const plan = buildNodeChildBulkPowerPlan(viewModel.structures, desiredOnline);
  const capacity = evaluateNodePowerPlanCapacity(viewModel.node, viewModel.structures, plan.targets);

  return {
    label,
    enabled: !plan.disabledReason && plan.targets.length > 0,
    disabledReason: plan.disabledReason,
    capacityReason: plan.capacityReason,
    targetCount: plan.targets.length,
    capacity,
    targets: plan.targets.map((target) => ({
      objectId: target.structure.objectId ?? null,
      assemblyId: target.structure.assemblyId ?? null,
      displayName: target.structure.displayName,
      desiredOnline: target.desiredOnline,
      verifiedTarget: target.verifiedTarget,
      powerRequirement: target.structure.powerRequirement ?? null,
    })),
  };
}

function buildAuthorityRegression(
  rawNode: OperatorInventoryNode | null,
  group: ReturnType<typeof adaptOperatorInventory>["nodeGroups"][number],
  viewModel: ReturnType<typeof buildLiveNodeLocalViewModelWithObserved>,
  fallbackViewModel: ReturnType<typeof buildLiveNodeLocalViewModelWithObserved>,
) {
  const failures = viewModel.structures.flatMap((structure) => {
    const rawMatch = findMatchingRawChild(rawNode, structure.objectId, structure.assemblyId);
    if (!rawMatch) {
      return [];
    }

    const rawAuthority = deriveRawAuthority(rawMatch);
    if (!rawAuthority.ready) {
      return [];
    }

    if (structure.actionAuthority.verifiedTarget) {
      return [];
    }

    const adaptedMatch = findMatchingAdaptedChild(group, structure.objectId, structure.assemblyId);
    const fallbackMatch = fallbackViewModel.structures.find((candidate) => (
      matchesStructureIdentity(structure.objectId, structure.assemblyId, candidate.objectId, candidate.assemblyId)
    )) ?? null;

    return [{
      objectId: structure.objectId ?? rawMatch.objectId ?? null,
      assemblyId: structure.assemblyId ?? rawMatch.assemblyId ?? null,
      displayName: structure.displayName,
      reason: "operator_inventory_authority_lost_in_selected_node",
      rawAuthority,
      adaptedAuthority: adaptedMatch ? {
        ownerCapId: adaptedMatch.ownerCapId,
        networkNodeId: adaptedMatch.networkNodeId ?? null,
        readModelSource: adaptedMatch.readModelSource ?? null,
        powerRequirement: adaptedMatch.indexedPowerRequirement ?? adaptedMatch.summary?.powerRequirement ?? null,
      } : null,
      selectedNodeActionAuthority: structure.actionAuthority,
      fallbackActionAuthority: fallbackMatch?.actionAuthority ?? null,
      fallbackWouldStripAuthority: fallbackMatch?.actionAuthority.verifiedTarget == null,
    }];
  });

  return {
    ok: failures.length === 0,
    failureCount: failures.length,
    failures,
  };
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeNodeAssembliesPowerRequirement(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const requiredGj = normalizeNullableNumber(candidate.requiredGj);
  if (requiredGj == null) {
    return null;
  }

  return {
    requiredGj,
    source: normalizeNullableString(candidate.source),
    confidence: normalizeNullableString(candidate.confidence),
    typeId: normalizeNullableString(candidate.typeId),
    family: normalizeNullableString(candidate.family),
    size: normalizeNullableString(candidate.size),
    lastUpdated: normalizeNullableString(candidate.lastUpdated),
  };
}

async function fetchNodeAssembliesDiagnostic(
  networkNodeId: string,
  args: LiveUsageArgs,
): Promise<NodeAssembliesLookupResult> {
  const canonicalId = normalizeCanonicalObjectId(networkNodeId);
  if (!canonicalId) {
    return {
      status: "error",
      networkNodeId: `0x${"0".repeat(64)}`,
      node: null,
      assemblies: [],
      fetchedAt: null,
      source: null,
      error: "Invalid network node ID",
      isPartial: false,
      droppedCount: 0,
    };
  }

  const response = await fetch(buildNodeAssembliesUrl(canonicalId, args.baseUrl), {
    headers: { Origin: args.origin },
  });

  if (!response.ok) {
    return {
      status: "error",
      networkNodeId: canonicalId,
      node: null,
      assemblies: [],
      fetchedAt: null,
      source: null,
      error: `Node assemblies request failed with status ${response.status}`,
      isPartial: false,
      droppedCount: 0,
    };
  }

  const payload = await response.json() as Record<string, unknown>;
  const nodeRecord = payload.node && typeof payload.node === "object"
    ? payload.node as Record<string, unknown>
    : null;
  const assemblies = Array.isArray(payload.assemblies)
    ? payload.assemblies
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          objectId: normalizeCanonicalObjectId(normalizeNullableString(entry.objectId)),
          assemblyId: normalizeNullableString(entry.assemblyId),
          linkedGateId: normalizeCanonicalObjectId(normalizeNullableString(entry.linkedGateId)),
          assemblyType: normalizeNullableString(entry.assemblyType),
          typeId: normalizeNullableNumber(entry.typeId),
          typeName: normalizeNullableString(entry.typeName),
          name: normalizeNullableString(entry.name),
          displayName: normalizeNullableString(entry.displayName),
          displayNameSource: normalizeNullableString(entry.displayNameSource),
          displayNameUpdatedAt: normalizeNullableString(entry.displayNameUpdatedAt),
          family: normalizeNullableString(entry.family),
          size: normalizeNullableString(entry.size),
          status: normalizeNullableString(entry.status),
          fuelAmount: normalizeNullableString(entry.fuelAmount),
          powerSummary: null,
          powerRequirement: normalizeNodeAssembliesPowerRequirement(entry.powerRequirement),
          solarSystemId: normalizeNullableString(entry.solarSystemId),
          energySourceId: normalizeNullableString(entry.energySourceId),
          url: normalizeNullableString(entry.url),
          lastUpdated: normalizeNullableString(entry.lastUpdated),
          lastObservedCheckpoint: normalizeNullableString(entry.lastObservedCheckpoint),
          lastObservedTimestamp: normalizeNullableString(entry.lastObservedTimestamp),
          ownerCapId: normalizeCanonicalObjectId(normalizeNullableString(entry.ownerCapId)),
          ownerWalletAddress: normalizeNullableString(entry.ownerWalletAddress),
          characterId: normalizeCanonicalObjectId(normalizeNullableString(entry.characterId)),
          extensionStatus: normalizeNullableString(entry.extensionStatus) as "authorized" | "stale" | "none" | null,
          partial: false,
          warnings: [],
          actionCandidate: null,
          source: normalizeNullableString(entry.source) ?? normalizeNullableString(payload.source),
          provenance: normalizeNullableString(entry.provenance),
        }))
    : [];

  return {
    status: "success",
    networkNodeId: canonicalId,
    node: nodeRecord ? {
      objectId: normalizeCanonicalObjectId(normalizeNullableString(nodeRecord.objectId)) ?? canonicalId,
      name: normalizeNullableString(nodeRecord.name),
      displayName: normalizeNullableString(nodeRecord.displayName),
      displayNameSource: normalizeNullableString(nodeRecord.displayNameSource),
      displayNameUpdatedAt: normalizeNullableString(nodeRecord.displayNameUpdatedAt),
      status: normalizeNullableString(nodeRecord.status),
      assemblyId: normalizeNullableString(nodeRecord.assemblyId),
      solarSystemId: normalizeNullableString(nodeRecord.solarSystemId),
      energySourceId: normalizeNullableString(nodeRecord.energySourceId),
      fuelAmount: normalizeNullableString(nodeRecord.fuelAmount),
      powerSummary: null,
    } : {
      objectId: canonicalId,
      name: null,
      displayName: null,
      displayNameSource: null,
      displayNameUpdatedAt: null,
      status: null,
      assemblyId: null,
      solarSystemId: null,
      energySourceId: null,
      fuelAmount: null,
      powerSummary: null,
    },
    assemblies,
    fetchedAt: normalizeNullableString(payload.fetchedAt),
    source: normalizeNullableString(payload.source),
    error: null,
    isPartial: false,
    droppedCount: 0,
  };
}

function findRawNode(inventory: { networkNodes: OperatorInventoryNode[] }, nodeObjectId: string) {
  return inventory.networkNodes.find((entry) => entry.node.objectId?.toLowerCase() === nodeObjectId.toLowerCase()) ?? null;
}

async function loadChainSnapshotMap(
  client: SuiJsonRpcClient,
  structureIds: readonly string[],
): Promise<Map<string, StructurePowerChainSnapshot>> {
  const objectIds = Array.from(new Set(
    structureIds
      .map((value) => normalizeCanonicalObjectId(value))
      .filter((value): value is string => value != null),
  ));
  if (objectIds.length === 0) {
    return new Map();
  }

  const responses = await client.multiGetObjects({
    ids: objectIds,
    options: { showContent: true, showType: true },
  });

  return objectIds.reduce((accumulator, objectId, index) => {
    const response = responses[index];
    if (!response) {
      return accumulator;
    }

    accumulator.set(objectId, resolveStructurePowerChainSnapshot(response, objectId));
    return accumulator;
  }, new Map<string, StructurePowerChainSnapshot>());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { inventory, transport: operatorInventoryTransport } = await fetchLiveInventory(args);
  const signalHistory = await fetchSignalHistoryDiagnostic(args);
  const adaptedInventory = adaptOperatorInventory(inventory);
  const requestedNodeId = args.nodeObjectId?.toLowerCase() ?? null;
  const selectedNodeGroups = requestedNodeId
    ? adaptedInventory.nodeGroups.filter((group) => group.node.objectId.toLowerCase() === requestedNodeId)
    : adaptedInventory.nodeGroups;

  if (selectedNodeGroups.length === 0) {
    throw new Error(args.nodeObjectId
      ? `No adapted node group matched ${args.nodeObjectId}.`
      : "No adapted node groups were available for this wallet.");
  }

  const client = args.checkChain ? new SuiJsonRpcClient({ url: args.rpcUrl }) : null;
  const authorityFailures: Array<Record<string, unknown>> = [];
  const nodes = await Promise.all(selectedNodeGroups.map(async (group) => {
    const rawNode = findRawNode(inventory, group.node.objectId);
    const lookup = adaptedInventory.nodeLookupsByNodeId.get(group.node.objectId) ?? null;
    const fallbackLookup = await fetchNodeAssembliesDiagnostic(group.node.objectId, args);
    const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
    const fallbackViewModel = buildLiveNodeLocalViewModelWithObserved(group, fallbackLookup, { preferObservedMembership: false });
    const capacityCheck = evaluateNodePowerCapacity(viewModel.node, viewModel.structures);
    const readout = getNodePowerUsageReadout(viewModel.node, viewModel.structures);
    const fallbackCapacityCheck = evaluateNodePowerCapacity(fallbackViewModel.node, fallbackViewModel.structures);
    const fallbackReadout = getNodePowerUsageReadout(fallbackViewModel.node, fallbackViewModel.structures);
    const bringAllOnlinePlan = formatBulkPlan("Bring all online", viewModel, true);
    const takeAllOfflinePlan = formatBulkPlan("Take all offline", viewModel, false);
    const canSavePowerPreset = viewModel.structures.some((structure) => structure.status === "online" || structure.status === "offline");
    const savePowerPresetDisabledReason = !canSavePowerPreset
      ? "no connected child structures"
      : capacityCheck.reason;
    const nodeOfflinePlan = buildNetworkNodeOfflinePlan(group.node, lookup ?? (fallbackLookup.status === "success" ? fallbackLookup : null));
    const nodePowerAction = getStructurePowerAction(group.node, {
      networkNodeOfflineAvailable: nodeOfflinePlan.unavailableReason == null,
    });
    const authorityRegression = buildAuthorityRegression(rawNode, group, viewModel, fallbackViewModel);
    authorityFailures.push(...authorityRegression.failures.map((failure) => ({
      nodeObjectId: group.node.objectId,
      nodeDisplayName: viewModel.node.displayName,
      ...failure,
    })));
    const chainSnapshots = client
      ? await loadChainSnapshotMap(
          client,
          viewModel.structures
            .map((structure) => structure.objectId)
            .filter((value): value is string => value != null),
        )
      : new Map<string, StructurePowerChainSnapshot>();

    return {
      nodeObjectId: viewModel.node.id,
      nodeDisplayName: viewModel.node.displayName,
      sourcePaths: {
        macroNodeGroup: group.node.readModelSource ?? null,
        operatorInventoryLookup: lookup ? "operator-inventory" : null,
        nodeAssembliesLookup: fallbackLookup.status === "success" ? "node-assemblies" : null,
        operatorInventoryViewModelSourceMode: viewModel.sourceMode,
        nodeAssembliesViewModelSourceMode: fallbackViewModel.sourceMode,
      },
      rawOperatorInventory: {
        node: rawNode ? {
          objectId: rawNode.node.objectId,
          ownerCapId: rawNode.node.ownerCapId,
          displayName: rawNode.node.displayName,
          name: rawNode.node.name,
          displayNameSource: rawNode.node.displayNameSource ?? null,
          displayNameUpdatedAt: rawNode.node.displayNameUpdatedAt ?? null,
          status: rawNode.node.status,
          powerAction: getStructurePowerAction(group.node, {
            networkNodeOfflineAvailable: nodeOfflinePlan.unavailableReason == null,
          }),
          canRename: supportsStructureRename(group.node) && group.node.ownerCapId.trim().length > 0,
          nodeOfflinePlan,
          powerUsageSummary: rawNode.powerUsageSummary ?? rawNode.node.powerUsageSummary ?? null,
        } : null,
        powerUsageSummary: rawNode?.powerUsageSummary ?? rawNode?.node.powerUsageSummary ?? null,
        children: rawNode?.structures.map(describeRawChild) ?? [],
      },
      adaptedOperatorInventory: {
        node: {
          objectId: group.node.objectId,
          ownerCapId: group.node.ownerCapId,
          displayName: group.node.summary?.displayName ?? group.node.summary?.name ?? group.node.name,
          name: group.node.name,
          displayNameSource: group.node.summary?.displayNameSource ?? null,
          displayNameUpdatedAt: group.node.summary?.displayNameUpdatedAt ?? null,
          status: group.node.status,
          powerAction: nodePowerAction,
          canRename: supportsStructureRename(group.node) && group.node.ownerCapId.trim().length > 0,
          nodeOfflinePlan,
          powerUsageSummary: group.node.indexedPowerUsageSummary ?? group.node.summary?.powerUsageSummary ?? null,
        },
        powerUsageSummary: group.node.indexedPowerUsageSummary ?? group.node.summary?.powerUsageSummary ?? null,
        children: describeAdaptedChild(group),
      },
      operatorInventorySelectedNode: {
        sourceMode: viewModel.sourceMode,
        authorityRegression,
        nodeSelf: {
          objectId: group.node.objectId,
          ownerCapId: group.node.ownerCapId,
          displayName: viewModel.node.displayName,
          status: group.node.status,
          powerAction: nodePowerAction,
          canRename: supportsStructureRename(group.node) && group.node.ownerCapId.trim().length > 0,
          nodeOfflinePlan,
        },
        powerReadoutInput: {
          nodePowerUsageSummary: viewModel.node.powerUsageSummary ?? null,
          structures: viewModel.structures.map((structure) => ({
            objectId: structure.objectId ?? null,
            assemblyId: structure.assemblyId ?? null,
            displayName: structure.displayName,
            status: structure.status,
            powerRequirement: structure.powerRequirement ?? null,
          })),
        },
        powerReadout: {
          label: readout.label,
          currentLoadGj: capacityCheck.currentUsedGj,
          allOnlineLoadGj: capacityCheck.allOnlineLoadGj,
          availableGj: capacityCheck.availableGj,
          totalUnknownLoadCount: capacityCheck.totalUnknownLoadCount,
          requiredUnknownCount: capacityCheck.requiredUnknownCount,
        },
        mismatch: {
          currentLoad: hasLoadMismatch(viewModel.node.powerUsageSummary?.usedGj, capacityCheck.currentUsedGj),
          allOnlineLoad: hasLoadMismatch(viewModel.node.powerUsageSummary?.totalKnownLoadGj, capacityCheck.allOnlineLoadGj),
        },
        bulkActions: {
          bringAllOnline: bringAllOnlinePlan,
          takeAllOffline: takeAllOfflinePlan,
          savePowerPreset: {
            enabled: !savePowerPresetDisabledReason,
            disabledReason: savePowerPresetDisabledReason,
            canSavePowerPreset,
            capacity: capacityCheck,
          },
        },
        children: describeViewModelChildren(viewModel.structures, chainSnapshots),
      },
      nodeAssembliesFallback: {
        lookupStatus: fallbackLookup.status,
        lookup: fallbackLookup.status === "success" ? {
          node: fallbackLookup.node,
          children: describeLookupChildren(fallbackLookup),
        } : {
          error: fallbackLookup.error,
        },
        powerReadoutInput: {
          nodePowerUsageSummary: fallbackViewModel.node.powerUsageSummary ?? null,
          structures: fallbackViewModel.structures.map((structure) => ({
            objectId: structure.objectId ?? null,
            assemblyId: structure.assemblyId ?? null,
            displayName: structure.displayName,
            status: structure.status,
            powerRequirement: structure.powerRequirement ?? null,
          })),
        },
        powerReadout: {
          label: fallbackReadout.label,
          currentLoadGj: fallbackCapacityCheck.currentUsedGj,
          allOnlineLoadGj: fallbackCapacityCheck.allOnlineLoadGj,
          availableGj: fallbackCapacityCheck.availableGj,
          totalUnknownLoadCount: fallbackCapacityCheck.totalUnknownLoadCount,
          requiredUnknownCount: fallbackCapacityCheck.requiredUnknownCount,
        },
        children: describeViewModelChildren(fallbackViewModel.structures, chainSnapshots),
      },
      overlayDelta: {
        applied: false,
        changedStatusCount: 0,
        changedNameCount: 0,
        note: "This CLI diagnostic does not read browser sessionStorage/local overlays, so raw and adapted rows are compared without local corrections.",
      },
    };
  }));

  console.log(JSON.stringify({
    walletAddress: args.walletAddress,
    requestedNodeObjectId: args.nodeObjectId,
    baseUrl: args.baseUrl,
    origin: args.origin,
    checkChain: args.checkChain,
    rpcUrl: args.checkChain ? args.rpcUrl : null,
    transport: {
      operatorInventory: operatorInventoryTransport,
      signalHistory: signalHistory.transport,
    },
    signalHistory: signalHistory.page ? {
      source: typeof signalHistory.page.source === "string" ? signalHistory.page.source : null,
      fetchedAt: typeof signalHistory.page.fetchedAt === "string" ? signalHistory.page.fetchedAt : null,
      partial: signalHistory.page.partial === true,
      warnings: Array.isArray(signalHistory.page.warnings)
        ? signalHistory.page.warnings.filter((value): value is string => typeof value === "string")
        : [],
      renameRows: Array.isArray(signalHistory.page.signals)
        ? signalHistory.page.signals
          .filter((signal): signal is Record<string, unknown> => Boolean(signal) && typeof signal === "object")
          .filter((signal) => signal.kind === "structure_renamed")
          .map((signal) => ({
            id: typeof signal.id === "string" ? signal.id : null,
            timestamp: typeof signal.timestamp === "string" ? signal.timestamp : null,
            label: typeof signal.label === "string" ? signal.label : null,
            description: typeof signal.description === "string" ? signal.description : null,
            relatedObjectId: typeof signal.relatedObjectId === "string" ? signal.relatedObjectId : null,
            assemblyId: typeof signal.assemblyId === "number" || typeof signal.assemblyId === "string"
              ? String(signal.assemblyId)
              : null,
          }))
        : [],
    } : null,
    visibilityNote: "This script does not read browser-local hidden state, so selected-node child rows are reported as visible runtime members.",
    authorityRegression: {
      ok: authorityFailures.length === 0,
      failureCount: authorityFailures.length,
      failures: authorityFailures,
    },
    nodes,
  }, null, 2));

  if (authorityFailures.length > 0) {
    throw new Error(`operator-inventory authority was lost for ${authorityFailures.length} selected-node row(s)`);
  }
}

await main();