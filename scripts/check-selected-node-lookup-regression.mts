import assert from "node:assert/strict";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import {
  getNodeLookupKeys,
  operatorInventoryContainsNode,
  resolveSelectedNodeInventoryLookup,
} from "../src/lib/nodeControlInventoryLookup.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority.ts";
import { getNodePowerUsageReadout } from "../src/lib/nodePowerControlModel.ts";
import { normalizeCanonicalObjectId } from "../src/lib/nodeAssembliesClient.ts";

import type { NetworkNodeGroup, Structure } from "../src/types/domain.ts";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";

const WALLET_ID = "0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62";
const SELECTED_NODE_ID = "0x2deb4248ed82ecbe42410e6ff4f8902f2e48b0c348c3dfdfb3f2c83acde73b85";
const SHADOW_BROKER_ID = "0xe009613ba63c34ffca0fee893123037eab35e25e23dc13644613d792d55886da";
const SHADOW_BROKER_OWNER_CAP_ID = "0x445107468d157a352784660a13f044709bbd6a8f2b77b6b25dae245359c55965";

function makeActionCandidate(row: {
  objectId: string;
  ownerCapId: string;
  networkNodeId: string;
  structureType: "storage_unit" | "network_node";
}): OperatorInventoryStructure["actionCandidate"] {
  return {
    actions: {
      power: {
        candidate: true,
        currentlyImplementedInCivilizationControl: row.structureType !== "network_node",
        familySupported: true,
        indexedOwnerCapPresent: true,
        requiredIds: {
          structureId: row.objectId,
          structureType: row.structureType,
          ownerCapId: row.ownerCapId,
          networkNodeId: row.networkNodeId,
        },
        unavailableReason: null,
      },
      rename: {
        candidate: true,
        currentlyImplementedInCivilizationControl: row.structureType !== "network_node",
        familySupported: true,
        indexedOwnerCapPresent: true,
        requiredIds: {
          structureId: row.objectId,
          structureType: row.structureType,
          ownerCapId: row.ownerCapId,
          networkNodeId: row.networkNodeId,
        },
        unavailableReason: null,
      },
    },
    supported: row.structureType !== "network_node",
    familySupported: row.structureType !== "network_node",
    unavailableReason: null,
  };
}

function makeInventoryRow(overrides: Partial<OperatorInventoryStructure>): OperatorInventoryStructure {
  return {
    objectId: null,
    assemblyId: null,
    ownerCapId: null,
    family: null,
    size: null,
    displayName: null,
    displayNameSource: null,
    displayNameUpdatedAt: null,
    name: null,
    typeId: null,
    typeName: null,
    assemblyType: null,
    status: "unknown",
    networkNodeId: null,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: WALLET_ID,
    characterId: null,
    extensionStatus: "none",
    fuelAmount: null,
    powerSummary: null,
    powerRequirement: null,
    powerUsageSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: null,
    lastObservedTimestamp: null,
    lastUpdated: null,
    source: "fixture",
    provenance: "selected-node-lookup-regression",
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

const shadowBroker = makeInventoryRow({
  objectId: SHADOW_BROKER_ID,
  ownerCapId: SHADOW_BROKER_OWNER_CAP_ID,
  family: "storage",
  size: "mini",
  displayName: "Shadow Broker",
  typeId: 88082,
  typeName: "Mini Storage",
  assemblyType: "storage_unit",
  status: "online",
  networkNodeId: SELECTED_NODE_ID,
  energySourceId: SELECTED_NODE_ID,
  powerRequirement: {
    requiredGj: 50,
    source: "indexed_config",
    confidence: "indexed",
    typeId: "88082",
    family: "storage",
    size: "mini",
    lastUpdated: null,
  },
  actionCandidate: makeActionCandidate({
    objectId: SHADOW_BROKER_ID,
    ownerCapId: SHADOW_BROKER_OWNER_CAP_ID,
    networkNodeId: SELECTED_NODE_ID,
    structureType: "storage_unit",
  }),
});

const inventory: OperatorInventoryResponse = {
  schemaVersion: "operator-inventory.v1",
  operator: {
    walletAddress: WALLET_ID,
    characterId: "0x3790bc6fcce39499f004833f0f02296e0f418fe8555b0abc3cc1fe04775ddde5",
    characterName: "lacal",
    tribeId: 1,
    tribeName: "Regression",
  },
  networkNodes: [{
    node: makeInventoryRow({
      objectId: null,
      assemblyId: "selected-node-index-row",
      ownerCapId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      family: "networkNode",
      displayName: "Network Node",
      status: "online",
      powerUsageSummary: {
        capacityGj: 1000,
        usedGj: 770,
        availableGj: 230,
        onlineKnownLoadGj: 770,
        onlineUnknownLoadCount: 0,
        totalKnownLoadGj: 770,
        totalUnknownLoadCount: 0,
        source: "indexed_children",
        confidence: "indexed",
        lastUpdated: null,
      },
    }),
    structures: [shadowBroker],
    powerUsageSummary: {
      capacityGj: 1000,
      usedGj: 770,
      availableGj: 230,
      onlineKnownLoadGj: 770,
      onlineUnknownLoadCount: 0,
      totalKnownLoadGj: 770,
      totalUnknownLoadCount: 0,
      source: "indexed_children",
      confidence: "indexed",
      lastUpdated: null,
    },
  }],
  unlinkedStructures: [],
  warnings: [],
  partial: false,
  source: "fixture",
  fetchedAt: "2026-05-06T00:00:00.000Z",
};

const selectedNodeStructure: Structure = {
  objectId: SELECTED_NODE_ID,
  ownerCapId: "",
  readModelSource: "operator-inventory",
  type: "network_node",
  name: "Network Node",
  status: "online",
  indexedPowerUsageSummary: inventory.networkNodes[0]!.powerUsageSummary,
  summary: {
    assemblyId: "selected-node-index-row",
    assemblyType: "network_node",
    typeId: null,
    name: "Network Node",
    displayName: "Network Node",
    status: "online",
    fuelAmount: null,
    powerUsageSummary: inventory.networkNodes[0]!.powerUsageSummary,
    solarSystemId: null,
    energySourceId: null,
    url: null,
    lastUpdated: null,
    typeName: "Network Node",
  },
  networkNodeRenderMeta: {
    rawNodeIndex: 0,
    canonicalIdentity: `object:${SELECTED_NODE_ID}`,
    strongOwnedNodeProof: true,
    proofSignals: ["owner-cap-id", "non-neutral-status"],
    renderEligibility: "grouped-structures",
  },
  extensionStatus: "none",
};

const selectedNodeGroup: NetworkNodeGroup = {
  node: selectedNodeStructure,
  gates: [],
  storageUnits: [],
  turrets: [],
};

const adapted = adaptOperatorInventory(inventory);
const lookupResolution = resolveSelectedNodeInventoryLookup(selectedNodeGroup, adapted.nodeLookupsByNodeId);
const viewModel = buildLiveNodeLocalViewModelWithObserved(selectedNodeGroup, lookupResolution.lookup, {
  preferObservedMembership: lookupResolution.found,
  requireObservedMembership: true,
});
const selectedRow = viewModel.structures.find((row) => normalizeCanonicalObjectId(row.objectId) === SHADOW_BROKER_ID) ?? null;
const powerControl = selectedRow ? getNodeLocalPowerControlState(selectedRow) : null;
const powerReadout = getNodePowerUsageReadout(viewModel.node, viewModel.structures);

const diagnosis = {
  wallet: WALLET_ID,
  selectedNode: SELECTED_NODE_ID,
  selectedStructureObjectId: SHADOW_BROKER_ID,
  selectedStructureName: "Shadow Broker",
  selectedNodeGroup: {
    objectId: selectedNodeGroup.node.objectId,
    assemblyId: selectedNodeGroup.node.assemblyId ?? null,
    canonicalIdentity: selectedNodeGroup.node.networkNodeRenderMeta?.canonicalIdentity ?? null,
    readModelSource: selectedNodeGroup.node.readModelSource ?? null,
  },
  selectedNodeInventoryLookupKeysTried: getNodeLookupKeys(selectedNodeGroup),
  nodeLookupsByNodeIdKeys: [...adapted.nodeLookupsByNodeId.keys()],
  selectedNodeIdNormalized: normalizeCanonicalObjectId(SELECTED_NODE_ID),
  rawOperatorInventoryNodeIdsNormalized: inventory.networkNodes.map((group) => normalizeCanonicalObjectId(group.node.objectId)),
  rawOperatorInventoryStructureNetworkNodeIdsNormalized: inventory.networkNodes.flatMap((group) => group.structures.map((row) => normalizeCanonicalObjectId(row.networkNodeId))),
  selectedNodeRowExistsInOperatorInventoryNetworkNodes: operatorInventoryContainsNode(inventory, SELECTED_NODE_ID),
  selectedNodeInventoryLookupFound: lookupResolution.found,
  selectedNodeInventoryLookupMatchedKey: lookupResolution.matchedKey,
  selectedNodeInventoryLookupFailureReason: lookupResolution.lookupFailureReason,
  selectedRow: selectedRow ? {
    displayName: selectedRow.displayName,
    objectId: selectedRow.objectId,
    ownerCapId: selectedRow.actionAuthority.verifiedTarget?.ownerCapId ?? null,
    networkNodeId: selectedRow.actionAuthority.verifiedTarget?.networkNodeId ?? null,
    actionAuthorityState: selectedRow.actionAuthority.state,
    powerRequiredGj: selectedRow.powerRequirement?.requiredGj ?? null,
    powerActionLabel: powerControl?.actionLabel ?? null,
  } : null,
  powerReadout,
};

console.log(JSON.stringify(diagnosis, null, 2));

assert.equal(operatorInventoryContainsNode(inventory, SELECTED_NODE_ID), true);
assert.equal(lookupResolution.found, true, "selected node lookup must resolve through child networkNodeId-backed lookup keys");
assert.equal(lookupResolution.matchedKey, SELECTED_NODE_ID);
assert(selectedRow, "Shadow Broker must render from the resolved operator-inventory lookup");
assert.equal(selectedRow.objectId, SHADOW_BROKER_ID);
assert.equal(selectedRow.actionAuthority.verifiedTarget?.ownerCapId, SHADOW_BROKER_OWNER_CAP_ID);
assert.equal(selectedRow.actionAuthority.verifiedTarget?.networkNodeId, SELECTED_NODE_ID);
assert.equal(selectedRow.actionAuthority.state, "verified-supported");
assert.equal(powerControl?.actionLabel, "Take Offline");
assert.equal(powerReadout.isAvailable, true);
