import assert from "node:assert/strict";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import { classifyStructurePowerError, formatStructurePowerError } from "../src/lib/structurePowerErrors.ts";
import {
  applyStructureWriteOverlaysToOperatorInventory,
  createPendingStructureWriteOverlay,
  resolveStructureWriteConfirmation,
  type StructureWriteTarget,
} from "../src/lib/structureWriteReconciliation.ts";

import type { OperatorInventoryResponse, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";

function getArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function objectId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, "0")}`;
}

function makeInventoryStructure(overrides: Partial<OperatorInventoryStructure>): OperatorInventoryStructure {
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
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: null,
    lastObservedTimestamp: null,
    lastUpdated: "2026-05-05T12:00:00.000Z",
    source: "operator-inventory",
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

function makeInventory(status: "online" | "offline"): OperatorInventoryResponse {
  const nodeId = objectId(10);
  return {
    schemaVersion: "operator-inventory.v1",
    operator: null,
    networkNodes: [
      {
        node: makeInventoryStructure({
          objectId: nodeId,
          assemblyId: "9001",
          ownerCapId: objectId(11),
          family: "networkNode",
          displayName: "Node Alpha",
          typeName: "Network Node",
          assemblyType: "network_node",
          status: "online",
        }),
        structures: [
          makeInventoryStructure({
            objectId: objectId(101),
            assemblyId: "4101",
            ownerCapId: objectId(201),
            family: "storage",
            displayName: "Storage Alpha",
            typeName: "Storage",
            assemblyType: "storage_unit",
            status,
            networkNodeId: nodeId,
            actionCandidate: {
              actions: {
                power: {
                  candidate: true,
                  currentlyImplementedInCivilizationControl: true,
                  familySupported: true,
                  indexedOwnerCapPresent: true,
                  requiredIds: {
                    structureId: objectId(101),
                    structureType: "storage_unit",
                    ownerCapId: objectId(201),
                    networkNodeId: nodeId,
                  },
                  unavailableReason: null,
                },
                rename: null,
              },
            },
          }),
        ],
      },
    ],
    unlinkedStructures: [],
    warnings: [],
    partial: false,
    source: "operator-inventory",
    fetchedAt: "2026-05-05T12:00:00.000Z",
  };
}

function firstNodeControlStructureStatus(inventory: OperatorInventoryResponse) {
  const adapted = adaptOperatorInventory(inventory);
  const group = adapted.nodeGroups[0];
  assert(group, "expected fixture to adapt into one network-node group");
  const lookup = adapted.nodeLookupsByNodeId.get(group.node.objectId);
  const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
  const structure = viewModel.structures[0];
  assert(structure, "expected fixture to render one Node Control child row");
  return { structure, controlState: getNodeLocalPowerControlState(structure), sourceMode: viewModel.sourceMode };
}

const rawOffline = makeInventory("offline");
const offlineResult = firstNodeControlStructureStatus(rawOffline);
assert.equal(offlineResult.structure.status, "offline", "expected raw operator-inventory offline status to adapt to offline");
assert.equal(offlineResult.controlState.actionLabel, "Bring Online", "expected offline Node Control rows not to offer Take offline");

const staleOnline = makeInventory("online");
const target: StructureWriteTarget = {
  objectId: objectId(101),
  structureType: "storage_unit",
  ownerCapId: objectId(201),
  networkNodeId: objectId(10),
  assemblyId: "4101",
  canonicalDomainKey: "assembly:4101",
  displayName: "Storage Alpha",
  desiredStatus: "offline",
};
const offlineCorrection = createPendingStructureWriteOverlay({
  action: "power",
  digest: null,
  target,
  desiredStatus: "offline",
});
const correctedInventory = applyStructureWriteOverlaysToOperatorInventory(staleOnline, [offlineCorrection]);
assert(correctedInventory, "expected offline correction overlay to apply to stale inventory");
const correctedResult = firstNodeControlStructureStatus(correctedInventory);
assert.equal(correctedResult.structure.status, "offline", "expected local already-offline evidence to override stale raw online status");
assert.equal(correctedResult.controlState.actionLabel, "Bring Online", "expected locally corrected offline rows not to offer Take offline");
assert.equal(correctedResult.sourceMode, "backend-membership", "expected the proof to exercise the operator-inventory Node Control path");

const staleConfirmation = resolveStructureWriteConfirmation(staleOnline, null, offlineCorrection);
assert.equal(staleConfirmation.statusConfirmed, false, "expected stale raw online data not to clear an offline correction overlay");
const confirmedCorrection = resolveStructureWriteConfirmation(rawOffline, null, offlineCorrection);
assert.equal(confirmedCorrection.statusConfirmed, true, "expected raw offline data to confirm and clear the offline correction overlay");

const offlineAbort = "Transaction resolution failed: MoveAbort in 2nd command, 'EAssemblyInvalidStatus': Assembly status is invalid, in '0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780::status::offline' line 97.";
assert.equal(classifyStructurePowerError(offlineAbort, { desiredStatus: "offline" }), "target_already_offline");
assert.equal(formatStructurePowerError(offlineAbort, { desiredStatus: "offline" }), "Already offline. View updated.");
assert.equal(classifyStructurePowerError(offlineAbort, { desiredStatus: "online" }), "target_already_in_state", "expected offline abort evidence not to be swallowed for online attempts");

const wallet = getArg("wallet");
const object = getArg("object");
if (wallet && object) {
  const url = new URL("https://ef-map.com/api/civilization-control/operator-inventory");
  url.searchParams.set("walletAddress", wallet);
  const response = await fetch(url, { headers: { Origin: "https://civilizationcontrol.com" } });
  const body = await response.json() as OperatorInventoryResponse;
  const allRows = body.networkNodes.flatMap((group) => [group.node, ...group.structures]).concat(body.unlinkedStructures);
  const row = allRows.find((entry) => entry.objectId?.toLowerCase() === object.toLowerCase());
  console.log(JSON.stringify({
    liveFetch: true,
    status: response.status,
    object,
    rawStatus: row?.status ?? null,
    lastUpdated: row?.lastUpdated ?? null,
    source: row?.source ?? null,
    provenance: row?.provenance ?? null,
  }, null, 2));
} else {
  console.log(JSON.stringify({
    liveFetch: false,
    reason: "Pass --wallet <address> --object <objectId> to inspect a live operator-inventory row.",
    suppliedObjectHint: "0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780",
  }, null, 2));
}

console.log("Operator-inventory status truth checks passed.");