import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { DEFAULT_SUI_RPC_URL } from "../src/constants.ts";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import { normalizeCanonicalObjectId } from "../src/lib/nodeAssembliesClient.ts";
import {
  evaluateNodePowerCapacity,
  getNodePowerUsageReadout,
} from "../src/lib/nodePowerControlModel.ts";
import {
  buildOperatorInventoryUrl,
  normalizeOperatorInventoryResponse,
} from "../src/lib/operatorInventoryClient.ts";
import { resolveStructurePowerChainSnapshot } from "../src/lib/structurePowerChainStatus.ts";

import type { StructurePowerChainSnapshot } from "../src/lib/structurePowerChainStatus.ts";

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

  return inventory;
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
  const inventory = await fetchLiveInventory(args);
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
    const lookup = adaptedInventory.nodeLookupsByNodeId.get(group.node.objectId) ?? null;
    const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
    const capacityCheck = evaluateNodePowerCapacity(viewModel.node, viewModel.structures);
    const readout = getNodePowerUsageReadout(viewModel.node, viewModel.structures);
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
      indexedSummary: {
        usedGj: viewModel.node.powerUsageSummary?.usedGj ?? null,
        availableGj: viewModel.node.powerUsageSummary?.availableGj ?? null,
        capacityGj: viewModel.node.powerUsageSummary?.capacityGj ?? null,
        onlineKnownLoadGj: viewModel.node.powerUsageSummary?.onlineKnownLoadGj ?? null,
        onlineUnknownLoadCount: viewModel.node.powerUsageSummary?.onlineUnknownLoadCount ?? null,
        totalKnownLoadGj: viewModel.node.powerUsageSummary?.totalKnownLoadGj ?? null,
        totalUnknownLoadCount: viewModel.node.powerUsageSummary?.totalUnknownLoadCount ?? null,
        source: viewModel.node.powerUsageSummary?.source ?? null,
        confidence: viewModel.node.powerUsageSummary?.confidence ?? null,
        lastUpdated: viewModel.node.powerUsageSummary?.lastUpdated ?? null,
      },
      localUsage: {
        readoutLabel: readout.label,
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
      children: viewModel.structures.map((structure) => {
        const normalizedObjectId = structure.objectId ? normalizeCanonicalObjectId(structure.objectId) : null;
        const chainSnapshot = normalizedObjectId ? chainSnapshots.get(normalizedObjectId) ?? null : null;

        return {
          displayName: structure.displayName,
          objectId: structure.objectId,
          assemblyId: structure.assemblyId,
          status: structure.status,
          requiredGj: structure.powerRequirement?.requiredGj ?? null,
          visibility: "visible",
          chainStatus: chainSnapshot?.chainStatus ?? null,
          chainState: chainSnapshot?.state ?? null,
          chainVariant: chainSnapshot?.statusVariant ?? null,
        };
      }),
    };
  }));

  console.log(JSON.stringify({
    walletAddress: args.walletAddress,
    requestedNodeObjectId: args.nodeObjectId,
    baseUrl: args.baseUrl,
    origin: args.origin,
    checkChain: args.checkChain,
    rpcUrl: args.checkChain ? args.rpcUrl : null,
    visibilityNote: "This script does not read browser-local hidden state, so selected-node child rows are reported as visible runtime members.",
    nodes,
  }, null, 2));
}

await main();