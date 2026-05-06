import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { DEFAULT_SUI_RPC_URL } from "../src/constants.ts";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import {
  buildNodeAssembliesUrl,
  normalizeCanonicalObjectId,
} from "../src/lib/nodeAssembliesClient.ts";
import {
  evaluateNodePowerCapacity,
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
  return {
    objectId: row.objectId,
    assemblyId: row.assemblyId,
    displayName: row.displayName,
    name: row.name,
    displayNameSource: row.displayNameSource,
    displayNameUpdatedAt: row.displayNameUpdatedAt,
    status: row.status,
    powerRequirement: row.powerRequirement,
  };
}

function describeAdaptedChild(group: ReturnType<typeof adaptOperatorInventory>["nodeGroups"][number]) {
  return [...group.gates, ...group.storageUnits, ...group.turrets].map((structure) => ({
    objectId: structure.objectId,
    assemblyId: structure.assemblyId ?? null,
    displayName: structure.summary?.displayName ?? structure.summary?.name ?? structure.name,
    name: structure.name,
    status: structure.status,
    powerRequirement: structure.indexedPowerRequirement ?? structure.summary?.powerRequirement ?? null,
    readModelSource: structure.readModelSource ?? null,
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
  }));
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
          displayName: rawNode.node.displayName,
          name: rawNode.node.name,
          status: rawNode.node.status,
          powerUsageSummary: rawNode.powerUsageSummary ?? rawNode.node.powerUsageSummary ?? null,
        } : null,
        powerUsageSummary: rawNode?.powerUsageSummary ?? rawNode?.node.powerUsageSummary ?? null,
        children: rawNode?.structures.map(describeRawChild) ?? [],
      },
      adaptedOperatorInventory: {
        node: {
          objectId: group.node.objectId,
          displayName: group.node.summary?.displayName ?? group.node.summary?.name ?? group.node.name,
          name: group.node.name,
          status: group.node.status,
          powerUsageSummary: group.node.indexedPowerUsageSummary ?? group.node.summary?.powerUsageSummary ?? null,
        },
        powerUsageSummary: group.node.indexedPowerUsageSummary ?? group.node.summary?.powerUsageSummary ?? null,
        children: describeAdaptedChild(group),
      },
      operatorInventorySelectedNode: {
        sourceMode: viewModel.sourceMode,
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
    nodes,
  }, null, 2));
}

await main();