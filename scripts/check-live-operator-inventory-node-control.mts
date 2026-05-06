import assert from "node:assert/strict";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { resolveSelectedNodeInventoryLookup } from "../src/lib/nodeControlInventoryLookup.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority.ts";
import {
  buildOperatorInventoryUrl,
  normalizeOperatorInventoryResponse,
} from "../src/lib/operatorInventoryClient.ts";
import { normalizeCanonicalObjectId } from "../src/lib/nodeAssembliesClient.ts";

import type { NetworkNodeGroup } from "../src/types/domain.ts";
import type { OperatorInventoryNode, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";

const DEFAULT_WALLET_ADDRESS = "0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62";
const DEFAULT_BASE_URL = "https://ef-map.com";
const DEFAULT_ORIGIN = "https://civilizationcontrol.com";

interface Args {
  walletAddress: string;
  baseUrl: string;
  origin: string;
  selectedNodeObjectId: string | null;
}

function readArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

function parseArgs(args: string[]): Args {
  return {
    walletAddress: readArgValue(args, "--wallet")
      ?? readArgValue(args, "--walletAddress")
      ?? DEFAULT_WALLET_ADDRESS,
    baseUrl: readArgValue(args, "--base") ?? DEFAULT_BASE_URL,
    origin: readArgValue(args, "--origin") ?? DEFAULT_ORIGIN,
    selectedNodeObjectId: readArgValue(args, "--node") ?? readArgValue(args, "--nodeObjectId"),
  };
}

function readRequiredIds(row: OperatorInventoryStructure) {
  return row.actionCandidate?.actions.power?.requiredIds
    ?? row.actionCandidate?.actions.rename?.requiredIds
    ?? null;
}

function summarizeChildProof(row: OperatorInventoryStructure, nodeObjectId: string | null) {
  const requiredIds = readRequiredIds(row);
  const objectId = normalizeCanonicalObjectId(requiredIds?.structureId ?? row.objectId);
  const ownerCapId = normalizeCanonicalObjectId(requiredIds?.ownerCapId ?? row.ownerCapId);
  const networkNodeId = normalizeCanonicalObjectId(
    requiredIds?.networkNodeId
      ?? row.networkNodeId,
  );
  const powerAction = row.actionCandidate?.actions.power ?? null;
  const supportedWriteFamily = row.family === "gate" || row.family === "storage" || row.family === "turret";
  const expectedWriteProof = supportedWriteFamily && powerAction?.currentlyImplementedInCivilizationControl !== false;
  const hasVerifiedWriteProof = Boolean(objectId && ownerCapId && networkNodeId && requiredIds?.structureType);
  const canTogglePower = Boolean(
    expectedWriteProof
      && powerAction?.candidate !== false
      && hasVerifiedWriteProof
      && (row.status === "online" || row.status === "offline"),
  );

  return {
    objectId,
    assemblyId: row.assemblyId,
    displayName: row.displayName ?? row.name ?? null,
    typeName: row.typeName,
    family: row.family,
    size: row.size,
    status: row.status,
    ownerCapId,
    networkNodeId,
    energySourceId: row.energySourceId,
    powerRequirement: row.powerRequirement,
    actionCandidate: row.actionCandidate,
    actionsPowerRequiredIds: row.actionCandidate?.actions.power?.requiredIds ?? null,
    proof: {
      inspectorObjectId: objectId != null,
      inspectorOwnerCapId: ownerCapId != null,
      inspectorNetworkNodeId: networkNodeId != null,
      bringOnlineOrTakeOffline: canTogglePower,
      renameAssembly: hasVerifiedWriteProof && expectedWriteProof,
      powerReadout: row.powerRequirement?.requiredGj != null,
      expectedWriteProof,
    },
  };
}

function findAdaptedGroup(group: NetworkNodeGroup[], rawNode: OperatorInventoryNode): NetworkNodeGroup | null {
  const rawNodeObjectId = normalizeCanonicalObjectId(rawNode.node.objectId);
  return group.find((entry) => normalizeCanonicalObjectId(entry.node.objectId) === rawNodeObjectId) ?? null;
}

function countDisplayNames(nodes: Array<{ childRows: Array<{ displayName: string | null }> }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of nodes) {
    for (const row of node.childRows) {
      const displayName = row.displayName?.trim();
      if (!displayName) continue;
      counts[displayName] = (counts[displayName] ?? 0) + 1;
    }
  }
  return counts;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const response = await fetch(buildOperatorInventoryUrl(args.walletAddress, args.baseUrl), {
    headers: { Accept: "application/json", Origin: args.origin },
  });
  if (!response.ok) {
    throw new Error(`operator-inventory fetch failed: ${response.status} ${response.statusText}`);
  }

  const rawPayload = await response.json();
  const inventory = normalizeOperatorInventoryResponse(rawPayload);
  assert(inventory, "operator-inventory payload must normalize to operator-inventory.v1");
  assert(inventory.networkNodes.length > 0, "operator-inventory must include at least one network node");

  const adapted = adaptOperatorInventory(inventory);
  const failures: Array<Record<string, unknown>> = [];
  const selectedNodeId = normalizeCanonicalObjectId(args.selectedNodeObjectId);

  const nodes = inventory.networkNodes.map((rawNode) => {
    const adaptedGroup = findAdaptedGroup(adapted.nodeGroups, rawNode);
    const lookupResolution = resolveSelectedNodeInventoryLookup(adaptedGroup, adapted.nodeLookupsByNodeId);
    const viewModel = adaptedGroup
      ? buildLiveNodeLocalViewModelWithObserved(adaptedGroup, lookupResolution.lookup, {
        preferObservedMembership: lookupResolution.found,
        requireObservedMembership: true,
      })
      : null;
    const renderedRows = viewModel?.structures ?? [];
    const rawNodeObjectId = normalizeCanonicalObjectId(rawNode.node.objectId);
    const childRows = rawNode.structures.map((row) => summarizeChildProof(row, rawNodeObjectId));

    for (const child of childRows) {
      const expectedWriteProof = child.proof.expectedWriteProof;
      const missing = Object.entries(child.proof)
        .filter(([key, value]) => key !== "expectedWriteProof" && value === false && (expectedWriteProof || key === "powerReadout"))
        .map(([key]) => key);
      if (missing.length > 0) {
        failures.push({
          nodeObjectId: rawNodeObjectId,
          displayName: child.displayName,
          objectId: child.objectId,
          assemblyId: child.assemblyId,
          family: child.family,
          missing,
        });
      }
    }

    return {
      node: {
        objectId: rawNodeObjectId,
        assemblyId: rawNode.node.assemblyId,
        displayName: rawNode.node.displayName ?? rawNode.node.name ?? null,
        status: rawNode.node.status,
        powerUsageSummary: rawNode.powerUsageSummary ?? rawNode.node.powerUsageSummary ?? null,
      },
      childCount: rawNode.structures.length,
      childRows,
      selectedUiNodeMatch: selectedNodeId ? rawNodeObjectId === selectedNodeId : null,
      adaptedNodeGroupFound: adaptedGroup != null,
      selectedNodeInventoryLookup: {
        found: lookupResolution.found,
        foundBy: lookupResolution.foundBy,
        matchedKey: lookupResolution.matchedKey,
        lookupKeysTried: lookupResolution.lookupKeysTried,
        rawChildCount: lookupResolution.rawChildCount,
      },
      selectedNodeViewModel: viewModel ? {
        sourceMode: viewModel.sourceMode,
        structureCount: viewModel.structures.length,
        structures: renderedRows.map((row) => ({
          id: row.id,
          canonicalDomainKey: row.canonicalDomainKey,
          displayName: row.displayName,
          typeLabel: row.typeLabel,
          sizeVariant: row.sizeVariant,
          status: row.status,
          source: row.source,
          objectId: row.objectId ?? null,
          assemblyId: row.assemblyId ?? null,
          ownerCapId: row.actionAuthority.verifiedTarget?.ownerCapId ?? null,
          networkNodeId: row.actionAuthority.verifiedTarget?.networkNodeId ?? null,
          powerRequirement: row.powerRequirement ?? null,
          actionAuthorityState: row.actionAuthority.state,
          powerControl: getNodeLocalPowerControlState(row),
        })),
      } : null,
    };
  });

  const selectedNodeMatched = selectedNodeId
    ? nodes.some((node) => node.selectedUiNodeMatch === true && node.selectedNodeInventoryLookup.found)
    : null;
  const displayNameCounts = countDisplayNames(nodes);

  console.log(JSON.stringify({
    walletAddress: args.walletAddress,
    baseUrl: args.baseUrl,
    origin: args.origin,
    selectedNodeObjectId: args.selectedNodeObjectId,
    selectedNodeMatched,
    transport: {
      status: response.status,
      accessControlAllowOrigin: response.headers.get("access-control-allow-origin"),
      vary: response.headers.get("vary"),
    },
    networkNodeCount: inventory.networkNodes.length,
    summary: {
      totalChildCount: nodes.reduce((sum, node) => sum + node.childCount, 0),
      nodeLookupCount: nodes.filter((node) => node.selectedNodeInventoryLookup.found).length,
      staleNameOccurrences: {
        "Test 3": displayNameCounts["Test 3"] ?? 0,
      },
    },
    nodes,
    failures,
  }, null, 2));

  if (selectedNodeId) {
    assert.equal(selectedNodeMatched, true, "selected UI node must match an operator-inventory node lookup");
  }
  assert.equal(failures.length, 0, "operator-inventory child proof must be complete for Node Control supported rows");
}

await main();
