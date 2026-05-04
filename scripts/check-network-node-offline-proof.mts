import assert from "node:assert/strict";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { buildNetworkNodeOfflinePlan, canTakeNetworkNodeOffline } from "../src/lib/networkNodeOfflineAction.ts";
import {
  buildNodeOfflineTx,
  buildNodeOnlineTx,
  NETWORK_NODE_CHARACTER_REQUIRED_ERROR,
  NETWORK_NODE_CONNECTED_CHILD_ID_REQUIRED_ERROR,
  NETWORK_NODE_ID_REQUIRED_ERROR,
  NETWORK_NODE_OWNER_CAP_REQUIRED_ERROR,
} from "../src/lib/structurePowerTx.ts";
import { WORLD_RUNTIME_PACKAGE_ID } from "../src/constants.ts";
import type { OperatorInventoryResponse } from "../src/types/operatorInventory.ts";

type Command = {
  $kind: string;
  MoveCall?: {
    target?: string;
    package?: string;
    module?: string;
    function?: string;
  };
};

function objectId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, "0")}`;
}

function getMoveTargets(commands: Command[]): string[] {
  return commands
    .filter((command) => command.$kind === "MoveCall")
    .map((command) => {
      const moveCall = command.MoveCall;
      if (moveCall?.target) {
        return moveCall.target;
      }

      return `${moveCall?.package}::${moveCall?.module}::${moveCall?.function}`;
    });
}

const nodeId = objectId(1);
const ownerCapId = objectId(2);
const characterId = objectId(3);
const gateId = objectId(10);
const storageId = objectId(11);
const turretId = objectId(12);
const printerId = objectId(13);

const offlineTx = buildNodeOfflineTx({
  nodeId,
  ownerCapId,
  characterId,
  connectedAssemblies: [
    { objectId: gateId, structureType: "gate" },
    { objectId: storageId, structureType: "storage_unit" },
    { objectId: turretId, structureType: "turret" },
    { objectId: printerId, structureType: "assembly" },
  ],
});

const offlineTargets = getMoveTargets(offlineTx.getData().commands as Command[]);
assert.deepEqual(offlineTargets, [
  `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::network_node::offline`,
  `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::gate::offline_connected_gate`,
  `${WORLD_RUNTIME_PACKAGE_ID}::storage_unit::offline_connected_storage_unit`,
  `${WORLD_RUNTIME_PACKAGE_ID}::turret::offline_connected_turret`,
  `${WORLD_RUNTIME_PACKAGE_ID}::assembly::offline_connected_assembly`,
  `${WORLD_RUNTIME_PACKAGE_ID}::network_node::destroy_offline_assemblies`,
]);

const emptyNodeOfflineTargets = getMoveTargets(buildNodeOfflineTx({
  nodeId,
  ownerCapId,
  characterId,
  connectedAssemblies: [],
}).getData().commands as Command[]);
assert.deepEqual(emptyNodeOfflineTargets, [
  `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::network_node::offline`,
  `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::network_node::destroy_offline_assemblies`,
], "empty-child node offline must still destroy the OfflineAssemblies hot potato");

const nodeOnlineTargets = getMoveTargets(buildNodeOnlineTx({
  nodeId,
  ownerCapId,
  characterId,
}).getData().commands as Command[]);
assert.deepEqual(nodeOnlineTargets, [
  `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::network_node::online`,
  `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
], "network-node online must stay node-only and avoid child-offline helper calls");
assert.equal(
  nodeOnlineTargets.some((target) => target.includes("offline_connected_") || target.includes("destroy_offline_assemblies")),
  false,
  "network-node online must not project connected children online or offline",
);

assert.throws(
  () => buildNodeOfflineTx({
    nodeId: "",
    ownerCapId,
    characterId,
    connectedAssemblies: [],
  }),
  (error: unknown) => error instanceof Error && error.message === NETWORK_NODE_ID_REQUIRED_ERROR,
  "missing node object ID must fail clearly",
);

assert.throws(
  () => buildNodeOfflineTx({
    nodeId,
    ownerCapId: "",
    characterId,
    connectedAssemblies: [],
  }),
  (error: unknown) => error instanceof Error && error.message === NETWORK_NODE_OWNER_CAP_REQUIRED_ERROR,
  "missing OwnerCap ID must fail clearly",
);

assert.throws(
  () => buildNodeOfflineTx({
    nodeId,
    ownerCapId,
    characterId: "",
    connectedAssemblies: [],
  }),
  (error: unknown) => error instanceof Error && error.message === NETWORK_NODE_CHARACTER_REQUIRED_ERROR,
  "missing character ID must fail clearly",
);

assert.throws(
  () => buildNodeOfflineTx({
    nodeId,
    ownerCapId,
    characterId,
    connectedAssemblies: [{ objectId: "", structureType: "gate" }],
  }),
  (error: unknown) => error instanceof Error && error.message === NETWORK_NODE_CONNECTED_CHILD_ID_REQUIRED_ERROR,
  "missing connected child object ID must fail clearly",
);

const operatorInventory = adaptOperatorInventory({
  schemaVersion: "operator-inventory.v1",
  operator: {
    walletAddress: objectId(100),
    characterId,
    characterName: "Operator Prime",
    tribeId: 7,
    tribeName: "Stillness Vanguard",
  },
  networkNodes: [
    {
      node: {
        objectId: nodeId,
        assemblyId: null,
        ownerCapId,
        family: "networkNode",
        size: null,
        displayName: "Node A",
        name: "Node A",
        typeId: null,
        typeName: null,
        assemblyType: null,
        status: "online",
        networkNodeId: null,
        energySourceId: objectId(101),
        linkedGateId: null,
        ownerWalletAddress: objectId(100),
        characterId,
        extensionStatus: "none",
        fuelAmount: null,
        powerSummary: null,
        solarSystemId: null,
        url: null,
        lastObservedCheckpoint: null,
        lastObservedTimestamp: null,
        lastUpdated: null,
        source: "shared-frontier-backend",
        provenance: "operator-inventory",
        partial: false,
        warnings: [],
        actionCandidate: null,
      },
      structures: [
        {
          objectId: gateId,
          assemblyId: "4001",
          ownerCapId: objectId(20),
          family: "gate",
          size: "standard",
          displayName: "Gate Alpha",
          name: "Gate Alpha",
          typeId: null,
          typeName: null,
          assemblyType: null,
          status: "online",
          networkNodeId: nodeId,
          energySourceId: objectId(101),
          linkedGateId: null,
          ownerWalletAddress: objectId(100),
          characterId,
          extensionStatus: "authorized",
          fuelAmount: null,
          powerSummary: null,
          solarSystemId: null,
          url: null,
          lastObservedCheckpoint: null,
          lastObservedTimestamp: null,
          lastUpdated: null,
          source: "shared-frontier-backend",
          provenance: "operator-inventory",
          partial: false,
          warnings: [],
          actionCandidate: null,
        },
        {
          objectId: storageId,
          assemblyId: "4002",
          ownerCapId: objectId(21),
          family: "storage",
          size: "standard",
          displayName: "Storage Beta",
          name: "Storage Beta",
          typeId: null,
          typeName: null,
          assemblyType: null,
          status: "online",
          networkNodeId: nodeId,
          energySourceId: objectId(101),
          linkedGateId: null,
          ownerWalletAddress: objectId(100),
          characterId,
          extensionStatus: "authorized",
          fuelAmount: null,
          powerSummary: null,
          solarSystemId: null,
          url: null,
          lastObservedCheckpoint: null,
          lastObservedTimestamp: null,
          lastUpdated: null,
          source: "shared-frontier-backend",
          provenance: "operator-inventory",
          partial: false,
          warnings: [],
          actionCandidate: null,
        },
        {
          objectId: turretId,
          assemblyId: "4003",
          ownerCapId: objectId(22),
          family: "turret",
          size: "standard",
          displayName: "Turret Gamma",
          name: "Turret Gamma",
          typeId: null,
          typeName: null,
          assemblyType: null,
          status: "online",
          networkNodeId: nodeId,
          energySourceId: objectId(101),
          linkedGateId: null,
          ownerWalletAddress: objectId(100),
          characterId,
          extensionStatus: "authorized",
          fuelAmount: null,
          powerSummary: null,
          solarSystemId: null,
          url: null,
          lastObservedCheckpoint: null,
          lastObservedTimestamp: null,
          lastUpdated: null,
          source: "shared-frontier-backend",
          provenance: "operator-inventory",
          partial: false,
          warnings: [],
          actionCandidate: null,
        },
        {
          objectId: printerId,
          assemblyId: "4004",
          ownerCapId: objectId(23),
          family: "printer",
          size: "mini",
          displayName: "Printer Delta",
          name: "Printer Delta",
          typeId: null,
          typeName: null,
          assemblyType: null,
          status: "online",
          networkNodeId: nodeId,
          energySourceId: objectId(101),
          linkedGateId: null,
          ownerWalletAddress: objectId(100),
          characterId,
          extensionStatus: "none",
          fuelAmount: null,
          powerSummary: null,
          solarSystemId: null,
          url: null,
          lastObservedCheckpoint: null,
          lastObservedTimestamp: null,
          lastUpdated: null,
          source: "shared-frontier-backend",
          provenance: "operator-inventory",
          partial: false,
          warnings: [],
          actionCandidate: null,
        },
      ],
    },
  ],
  unlinkedStructures: [],
  warnings: [],
  partial: false,
  source: "shared-frontier-backend",
  fetchedAt: "2026-05-04T18:00:00.000Z",
} satisfies OperatorInventoryResponse);

assert.equal(operatorInventory.nodeGroups.length, 1, "expected one network node group to render");
assert.equal(operatorInventory.nodeGroups[0]?.node.objectId, nodeId, "expected network node object ID to stay authoritative");
assert.equal(operatorInventory.nodeGroups[0]?.node.assemblyId, undefined, "network node action path must not require assemblyId");
assert.equal(operatorInventory.nodeGroups[0]?.node.ownerCapId, ownerCapId, "expected network node row to keep owner-cap identity");

const nodeLookup = operatorInventory.nodeLookupsByNodeId.get(nodeId);
assert.ok(nodeLookup, "expected a full node lookup for offline planning");
assert.deepEqual(
  nodeLookup?.assemblies.map((assembly) => ({ objectId: assembly.objectId, family: assembly.family })),
  [
    { objectId: gateId, family: "gate" },
    { objectId: storageId, family: "storage" },
    { objectId: turretId, family: "turret" },
    { objectId: printerId, family: "printer" },
  ],
  "expected operator inventory node lookups to retain mixed child-family identity",
);

const offlinePlan = buildNetworkNodeOfflinePlan(operatorInventory.nodeGroups[0]!.node, nodeLookup);
assert.equal(offlinePlan.unavailableReason, null, "expected operator-inventory lookup to produce a node-offline plan");
assert.equal(canTakeNetworkNodeOffline(operatorInventory.nodeGroups[0]!.node, nodeLookup), true, "expected node-offline availability to follow the resolved plan");
assert.equal(offlinePlan.affectedStructureCount, 4, "expected offline plan to count connected children only");
assert.deepEqual(
  offlinePlan.connectedAssemblies,
  [
    { objectId: gateId, structureType: "gate" },
    { objectId: storageId, structureType: "storage_unit" },
    { objectId: turretId, structureType: "turret" },
    { objectId: printerId, structureType: "assembly" },
  ],
  "expected offline plan to preserve helper target order and mixed child-family type identity",
);
assert.deepEqual(
  offlinePlan.affectedTargets.map((target) => ({
    objectId: target.objectId,
    structureType: target.structureType,
    ownerCapId: target.ownerCapId,
    networkNodeId: target.networkNodeId ?? null,
    assemblyId: target.assemblyId ?? null,
    displayName: target.displayName ?? null,
  })),
  [
    { objectId: nodeId, structureType: "network_node", ownerCapId, networkNodeId: null, assemblyId: null, displayName: "Node A" },
    { objectId: gateId, structureType: "gate", ownerCapId: objectId(20), networkNodeId: nodeId, assemblyId: "4001", displayName: "Gate Alpha" },
    { objectId: storageId, structureType: "storage_unit", ownerCapId: objectId(21), networkNodeId: nodeId, assemblyId: "4002", displayName: "Storage Beta" },
    { objectId: turretId, structureType: "turret", ownerCapId: objectId(22), networkNodeId: nodeId, assemblyId: "4003", displayName: "Turret Gamma" },
    { objectId: printerId, structureType: "assembly", ownerCapId: objectId(23), networkNodeId: nodeId, assemblyId: "4004", displayName: "Printer Delta" },
  ],
  "expected offline plan to provide node-plus-child reconciliation targets for local overlays",
);

console.log("check-network-node-offline-proof: ok");