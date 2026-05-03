import assert from "node:assert/strict";

import { getNodeLocalPowerToggleIntent } from "../src/lib/nodeDrilldownActionAuthority";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel";
import type { NetworkNodeGroup } from "../src/types/domain";
import type { OperatorInventoryResponse } from "../src/types/operatorInventory";

const NETWORK_NODE_ID = "0x00000000000000000000000000000000000000000000000000000000000000aa";
const GATE_ID = "0x0000000000000000000000000000000000000000000000000000000000000101";
const STORAGE_ID = "0x0000000000000000000000000000000000000000000000000000000000000102";
const TURRET_ID = "0x0000000000000000000000000000000000000000000000000000000000000103";
const PRINTER_ID = "0x0000000000000000000000000000000000000000000000000000000000000104";
const UNLINKED_STORAGE_ID = "0x0000000000000000000000000000000000000000000000000000000000000105";
const OPERATOR_WALLET = "0x0000000000000000000000000000000000000000000000000000000000000abc";
const CHARACTER_ID = "0x0000000000000000000000000000000000000000000000000000000000000def";

const response: OperatorInventoryResponse = {
  schemaVersion: "operator-inventory.v1",
  operator: {
    walletAddress: OPERATOR_WALLET,
    characterId: CHARACTER_ID,
    characterName: "Operator Prime",
    tribeId: 77,
    tribeName: "Stillness Vanguard",
  },
  networkNodes: [
    {
      node: {
        objectId: NETWORK_NODE_ID,
        assemblyId: "9001",
        ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000faa",
        family: "networkNode",
        size: "standard",
        displayName: "Index Node",
        name: "Index Node",
        typeId: 99001,
        typeName: "Network Node",
        assemblyType: "network_node",
        status: "online",
        networkNodeId: null,
        energySourceId: null,
        linkedGateId: null,
        ownerWalletAddress: OPERATOR_WALLET,
        characterId: CHARACTER_ID,
        extensionStatus: "authorized",
        fuelAmount: "1200",
        powerSummary: null,
        solarSystemId: "30000142",
        url: null,
        lastObservedCheckpoint: "101010",
        lastObservedTimestamp: "2026-05-03T12:00:00.000Z",
        lastUpdated: "2026-05-03T12:00:00.000Z",
        source: "shared-frontier-backend",
        provenance: "operator-inventory",
        partial: false,
        warnings: [],
        actionCandidate: null,
      },
      structures: [
        actionRow({
          objectId: GATE_ID,
          assemblyId: "9101",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c101",
          family: "gate",
          displayName: "Governor Gate",
          typeId: 88010,
          typeName: "Gate",
          assemblyType: "gate",
          status: "online",
          extensionStatus: "authorized",
          requiredIds: {
            structureId: GATE_ID,
            structureType: "gate",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c101",
            networkNodeId: NETWORK_NODE_ID,
          },
        }),
        actionRow({
          objectId: STORAGE_ID,
          assemblyId: "9102",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c102",
          family: "storage",
          displayName: "Forward Storage",
          typeId: 88082,
          typeName: "Mini Storage",
          assemblyType: "storage_unit",
          status: "online",
          extensionStatus: "authorized",
          size: "mini",
          requiredIds: {
            structureId: STORAGE_ID,
            structureType: "storage_unit",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c102",
            networkNodeId: NETWORK_NODE_ID,
          },
        }),
        actionRow({
          objectId: TURRET_ID,
          assemblyId: "9103",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c103",
          family: "turret",
          displayName: "Outer Turret",
          typeId: 92279,
          typeName: "Mini Turret",
          assemblyType: "turret",
          status: "offline",
          extensionStatus: "authorized",
          size: "mini",
          requiredIds: {
            structureId: TURRET_ID,
            structureType: "turret",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c103",
            networkNodeId: NETWORK_NODE_ID,
          },
        }),
        {
          objectId: PRINTER_ID,
          assemblyId: "9104",
          ownerCapId: null,
          family: "printer",
          size: "standard",
          displayName: "Field Printer",
          name: "Field Printer",
          typeId: 88067,
          typeName: "Printer",
          assemblyType: "printer",
          status: "offline",
          networkNodeId: NETWORK_NODE_ID,
          energySourceId: null,
          linkedGateId: null,
          ownerWalletAddress: null,
          characterId: null,
          extensionStatus: null,
          fuelAmount: null,
          powerSummary: null,
          solarSystemId: null,
          url: null,
          lastObservedCheckpoint: "101010",
          lastObservedTimestamp: "2026-05-03T12:00:00.000Z",
          lastUpdated: "2026-05-03T12:00:00.000Z",
          source: "shared-frontier-backend",
          provenance: "operator-inventory",
          partial: false,
          warnings: [],
          actionCandidate: {
            actions: {
              power: {
                candidate: true,
                currentlyImplementedInCivilizationControl: false,
                familySupported: true,
                indexedOwnerCapPresent: true,
                requiredIds: {
                  structureId: PRINTER_ID,
                  structureType: "storage_unit",
                  ownerCapId: null,
                  networkNodeId: NETWORK_NODE_ID,
                },
                unavailableReason: "Indexed for future power support only.",
              },
              rename: {
                candidate: true,
                currentlyImplementedInCivilizationControl: false,
                familySupported: true,
                indexedOwnerCapPresent: false,
                requiredIds: null,
                unavailableReason: "Rename is indexed but not surfaced in the web UI yet.",
              },
            },
            supported: true,
            familySupported: true,
            unavailableReason: "Indexed for future power support only.",
          },
        },
      ],
    },
  ],
  unlinkedStructures: [
    actionRow({
      objectId: UNLINKED_STORAGE_ID,
      assemblyId: "9199",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c199",
      family: "storage",
      displayName: "Unlinked Storage",
      typeId: 88083,
      typeName: "Storage",
      assemblyType: "storage_unit",
      status: "unknown",
      extensionStatus: "stale",
      requiredIds: {
        structureId: UNLINKED_STORAGE_ID,
        structureType: "storage_unit",
        ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c199",
        networkNodeId: null,
      },
    }),
  ],
  warnings: ["One indexed structure is still unlinked."],
  partial: true,
  source: "shared-frontier-backend",
  fetchedAt: "2026-05-03T12:00:00.000Z",
};

const adapted = adaptOperatorInventory(response);

assert.equal(adapted.profile?.characterId, response.operator?.characterId);
assert.equal(adapted.metrics.networkNodeCount, 1);
assert.equal(adapted.metrics.gateCount, 1);
assert.equal(adapted.metrics.storageUnitCount, 2);
assert.equal(adapted.metrics.turretCount, 1);
assert.match(adapted.warning ?? "", /unlinked/i);
assert(adapted.structures.every((structure) => structure.readModelSource === "operator-inventory"));

const group = buildGroup(adapted.structures, NETWORK_NODE_ID);
const lookup = adapted.nodeLookupsByNodeId.get(NETWORK_NODE_ID);

assert(lookup, "expected a selected-node lookup from operator inventory");
assert.equal(lookup?.assemblies.length, 4);

const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });

assert.equal(viewModel.sourceMode, "backend-membership");
assert.equal(viewModel.structures.length, 4);

const gate = viewModel.structures.find((structure) => structure.objectId === GATE_ID);
const storage = viewModel.structures.find((structure) => structure.objectId === STORAGE_ID);
const turret = viewModel.structures.find((structure) => structure.objectId === TURRET_ID);
const printer = viewModel.structures.find((structure) => structure.objectId === PRINTER_ID);

assert.equal(gate?.actionAuthority.state, "verified-supported");
assert.equal(storage?.actionAuthority.state, "verified-supported");
assert.equal(turret?.actionAuthority.state, "verified-supported");
assert.equal(printer?.actionAuthority.state, "future-supported");
assert.equal(printer?.actionAuthority.unavailableReason, "Indexed for future power support only.");
assert.equal(getNodeLocalPowerToggleIntent(gate!)?.actionLabel, "Take Offline");
assert.equal(getNodeLocalPowerToggleIntent(turret!)?.actionLabel, "Bring Online");
assert.equal(getNodeLocalPowerToggleIntent(printer!), null);

const unlinkedStorage = adapted.structures.find((structure) => structure.objectId === UNLINKED_STORAGE_ID);
assert(unlinkedStorage, "expected unlinked structure in compatibility inventory");
assert.equal(unlinkedStorage?.networkNodeId, undefined);
assert.equal(unlinkedStorage?.extensionStatus, "stale");

console.info("operator inventory mapping probe passed", {
  structures: adapted.structures.length,
  nodeRows: viewModel.structures.length,
  sourceMode: viewModel.sourceMode,
});

function actionRow(input: {
  objectId: string;
  assemblyId: string;
  ownerCapId: string | null;
  family: "gate" | "storage" | "turret";
  displayName: string;
  typeId: number;
  typeName: string;
  assemblyType: string;
  status: "online" | "offline" | "unknown";
  extensionStatus: "authorized" | "stale" | "none" | null;
  requiredIds: {
    structureId: string;
    structureType: "gate" | "storage_unit" | "turret";
    ownerCapId: string | null;
    networkNodeId: string | null;
  };
  size?: "mini" | "standard" | "heavy";
}) {
  return {
    objectId: input.objectId,
    assemblyId: input.assemblyId,
    ownerCapId: input.ownerCapId,
    family: input.family,
    size: input.size ?? "standard",
    displayName: input.displayName,
    name: input.displayName,
    typeId: input.typeId,
    typeName: input.typeName,
    assemblyType: input.assemblyType,
    status: input.status,
    networkNodeId: NETWORK_NODE_ID,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: OPERATOR_WALLET,
    characterId: CHARACTER_ID,
    extensionStatus: input.extensionStatus,
    fuelAmount: null,
    powerSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: "101010",
    lastObservedTimestamp: "2026-05-03T12:00:00.000Z",
    lastUpdated: "2026-05-03T12:00:00.000Z",
    source: "shared-frontier-backend",
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: {
      actions: {
        power: {
          candidate: true,
          currentlyImplementedInCivilizationControl: true,
          familySupported: true,
          indexedOwnerCapPresent: input.requiredIds.ownerCapId != null,
          requiredIds: input.requiredIds,
          unavailableReason: null,
        },
        rename: {
          candidate: true,
          currentlyImplementedInCivilizationControl: false,
          familySupported: true,
          indexedOwnerCapPresent: input.requiredIds.ownerCapId != null,
          requiredIds: input.requiredIds,
          unavailableReason: "Rename remains deferred in this pass.",
        },
      },
      supported: true,
      familySupported: true,
      unavailableReason: null,
    },
  };
}

function buildGroup(structures: typeof adapted.structures, nodeId: string): NetworkNodeGroup {
  const node = structures.find((structure) => structure.type === "network_node" && structure.objectId === nodeId);
  if (!node) {
    throw new Error("Missing node structure for probe group");
  }

  return {
    node,
    gates: structures.filter((structure) => structure.type === "gate" && structure.networkNodeId === nodeId),
    storageUnits: structures.filter((structure) => structure.type === "storage_unit" && structure.networkNodeId === nodeId),
    turrets: structures.filter((structure) => structure.type === "turret" && structure.networkNodeId === nodeId),
  };
}