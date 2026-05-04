import assert from "node:assert/strict";

import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter";
import {
  applyStructureWriteOverlaysToNodeGroups,
  applyStructureWriteOverlaysToNodeAssembliesLookup,
  applyStructureWriteOverlaysToOperatorInventory,
  applyStructureWriteOverlaysToStructures,
  createPendingStructureWriteOverlay,
  resolveStructureWriteConfirmation,
  type StructureWriteTarget,
} from "../src/lib/structureWriteReconciliation";
import type { NetworkNodeGroup, Structure } from "../src/types/domain";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "../src/types/operatorInventory";

const STORAGE_TARGET = {
  objectId: "0x0000000000000000000000000000000000000000000000000000000000000a01",
  structureType: "storage_unit" as const,
  ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000ca01",
  networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000aa",
  assemblyId: "4101",
  canonicalDomainKey: "assembly:4101",
  displayName: "Storage Alpha",
};

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
    lastUpdated: "2026-05-04T12:00:00.000Z",
    source: "operator-inventory",
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

const baseStructures: Structure[] = [
  {
    objectId: STORAGE_TARGET.objectId,
    ownerCapId: STORAGE_TARGET.ownerCapId,
    assemblyId: STORAGE_TARGET.assemblyId,
    type: STORAGE_TARGET.structureType,
    name: "Storage Alpha",
    status: "online",
    networkNodeId: STORAGE_TARGET.networkNodeId ?? undefined,
    extensionStatus: "authorized",
  },
];

const staleOperatorInventory: OperatorInventoryResponse = {
  schemaVersion: "operator-inventory.v1",
  operator: null,
  networkNodes: [
    {
      node: {
        objectId: STORAGE_TARGET.networkNodeId ?? null,
        assemblyId: "9001",
        ownerCapId: "0xnodecap",
        family: "networkNode",
        size: null,
        displayName: "Node Alpha",
        name: "Node Alpha",
        typeId: null,
        typeName: "Network Node",
        assemblyType: "network_node",
        status: "online",
        networkNodeId: null,
        energySourceId: null,
        linkedGateId: null,
        ownerWalletAddress: null,
        characterId: null,
        extensionStatus: "authorized",
        fuelAmount: null,
        powerSummary: null,
        solarSystemId: null,
        url: null,
        lastObservedCheckpoint: null,
        lastObservedTimestamp: null,
        lastUpdated: null,
        source: "operator-inventory",
        provenance: "operator-inventory",
        partial: false,
        warnings: [],
        actionCandidate: null,
      },
      structures: [
        {
          objectId: STORAGE_TARGET.objectId,
          assemblyId: STORAGE_TARGET.assemblyId,
          ownerCapId: STORAGE_TARGET.ownerCapId,
          family: "storage",
          size: "standard",
          displayName: "Storage Alpha",
          name: "Storage Alpha",
          typeId: 88083,
          typeName: "Storage",
          assemblyType: "storage_unit",
          status: "online",
          networkNodeId: STORAGE_TARGET.networkNodeId ?? null,
          energySourceId: null,
          linkedGateId: null,
          ownerWalletAddress: null,
          characterId: null,
          extensionStatus: "authorized",
          fuelAmount: null,
          powerSummary: null,
          solarSystemId: null,
          url: null,
          lastObservedCheckpoint: null,
          lastObservedTimestamp: null,
          lastUpdated: "2026-05-04T12:00:00.000Z",
          source: "operator-inventory",
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
  source: "operator-inventory",
  fetchedAt: "2026-05-04T12:00:00.000Z",
};

const staleLookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: STORAGE_TARGET.networkNodeId!,
  node: {
    objectId: STORAGE_TARGET.networkNodeId!,
    name: "Node Alpha",
    displayName: "Node Alpha",
    status: "ONLINE",
    assemblyId: "9001",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: [
    {
      objectId: STORAGE_TARGET.objectId,
      assemblyId: STORAGE_TARGET.assemblyId,
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage Alpha",
      displayName: "Storage Alpha",
      family: "storage",
      size: "standard",
      status: "ONLINE",
      fuelAmount: null,
      powerSummary: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-04T12:00:00.000Z",
      source: "operator-inventory",
      provenance: "operator-inventory",
      actionCandidate: null,
    },
  ],
  fetchedAt: "2026-05-04T12:00:00.000Z",
  source: "operator-inventory",
  error: null,
  isPartial: false,
  droppedCount: 0,
};

const renameOverlay = createPendingStructureWriteOverlay({
  action: "rename",
  digest: "rename-digest",
  target: STORAGE_TARGET,
  desiredName: "Storage Prime",
});

const renamedStructures = applyStructureWriteOverlaysToStructures(baseStructures, [renameOverlay]);
assert.equal(renamedStructures[0]?.name, "Storage Prime", "expected rename overlay to project the pending new name onto global structures");
assert.equal(renamedStructures[0]?.objectId, STORAGE_TARGET.objectId, "expected rename overlay to preserve the selected object identity");

const renamedLookup = applyStructureWriteOverlaysToNodeAssembliesLookup(staleLookup, [renameOverlay]);
assert.equal(renamedLookup?.assemblies[0]?.displayName, "Storage Prime", "expected rename overlay to project the pending new name onto selected-node membership rows");
assert.equal(renamedLookup?.assemblies[0]?.assemblyId, STORAGE_TARGET.assemblyId, "expected rename overlay to preserve selected-node row identity");

const renameStaleConfirmation = resolveStructureWriteConfirmation(staleOperatorInventory, staleLookup, renameOverlay);
assert.equal(renameStaleConfirmation.nameConfirmed, false, "expected stale backend rename data to remain unconfirmed");
assert.equal(renameStaleConfirmation.operatorInventoryConfirmed, false, "expected stale backend rename data not to count as operator-inventory confirmation");

const confirmedRenameInventory: OperatorInventoryResponse = {
  ...staleOperatorInventory,
  networkNodes: staleOperatorInventory.networkNodes.map((nodeGroup) => ({
    ...nodeGroup,
    structures: nodeGroup.structures.map((row) => row.objectId === STORAGE_TARGET.objectId
      ? { ...row, displayName: "Storage Prime", name: "Storage Prime" }
      : row),
  })),
};
const renameConfirmed = resolveStructureWriteConfirmation(confirmedRenameInventory, staleLookup, renameOverlay);
assert.equal(renameConfirmed.nameConfirmed, true, "expected refreshed backend rename data to confirm the pending new name");
assert.equal(renameConfirmed.operatorInventoryConfirmed, true, "expected refreshed backend rename data to count as operator-inventory confirmation");

const confirmedRenameLookup: NodeAssembliesLookupResult = {
  ...renamedLookup!,
  assemblies: renamedLookup!.assemblies.map((assembly) => assembly.objectId === STORAGE_TARGET.objectId
    ? { ...assembly, displayName: "Storage Prime", name: "Storage Prime" }
    : assembly),
};
const renameLookupOnlyConfirmed = resolveStructureWriteConfirmation(staleOperatorInventory, confirmedRenameLookup, renameOverlay);
assert.equal(
  renameLookupOnlyConfirmed.nameConfirmed,
  false,
  "expected selected-node rename confirmation not to clear the overlay while operator-inventory still returns the old name",
);
assert.equal(
  renameLookupOnlyConfirmed.nodeAssembliesConfirmed,
  true,
  "expected selected-node rename confirmation to remain observable for debug without clearing the app-wide overlay",
);

const powerOfflineOverlay = createPendingStructureWriteOverlay({
  action: "power",
  digest: "power-offline-digest",
  target: STORAGE_TARGET,
  desiredStatus: "offline",
});
const poweredOfflineStructures = applyStructureWriteOverlaysToStructures(baseStructures, [powerOfflineOverlay]);
assert.equal(poweredOfflineStructures[0]?.status, "offline", "expected power overlay to project the pending offline state onto global structures");

const poweredOfflineLookup = applyStructureWriteOverlaysToNodeAssembliesLookup(staleLookup, [powerOfflineOverlay]);
assert.equal(poweredOfflineLookup?.assemblies[0]?.status, "OFFLINE", "expected power overlay to project the pending offline state onto selected-node membership rows");

const powerStaleConfirmation = resolveStructureWriteConfirmation(staleOperatorInventory, staleLookup, powerOfflineOverlay);
assert.equal(powerStaleConfirmation.statusConfirmed, false, "expected stale backend power data to remain unconfirmed");

const confirmedPowerInventory: OperatorInventoryResponse = {
  ...staleOperatorInventory,
  networkNodes: staleOperatorInventory.networkNodes.map((nodeGroup) => ({
    ...nodeGroup,
    structures: nodeGroup.structures.map((row) => row.objectId === STORAGE_TARGET.objectId
      ? { ...row, status: "offline" }
      : row),
  })),
};
const powerConfirmed = resolveStructureWriteConfirmation(confirmedPowerInventory, staleLookup, powerOfflineOverlay);
assert.equal(powerConfirmed.statusConfirmed, true, "expected refreshed backend power data to confirm the pending offline state");
assert.equal(powerConfirmed.operatorInventoryConfirmed, true, "expected refreshed backend power data to count as operator-inventory confirmation");

const powerOnlineOverlay = createPendingStructureWriteOverlay({
  action: "power",
  digest: "power-online-digest",
  target: { ...STORAGE_TARGET, displayName: "Storage Prime" },
  desiredStatus: "online",
});
const staleOfflineInventory: OperatorInventoryResponse = {
  ...confirmedPowerInventory,
  networkNodes: confirmedPowerInventory.networkNodes.map((nodeGroup) => ({
    ...nodeGroup,
    structures: nodeGroup.structures.map((row) => row.objectId === STORAGE_TARGET.objectId
      ? { ...row, displayName: "Storage Prime", name: "Storage Prime" }
      : row),
  })),
};
const powerOnlineStale = resolveStructureWriteConfirmation(staleOfflineInventory, poweredOfflineLookup, powerOnlineOverlay);
assert.equal(powerOnlineStale.statusConfirmed, false, "expected stale offline backend data to leave the pending online overlay unresolved");

const confirmedPowerLookup: NodeAssembliesLookupResult = {
  ...poweredOfflineLookup!,
  assemblies: poweredOfflineLookup!.assemblies.map((assembly) => assembly.objectId === STORAGE_TARGET.objectId
    ? { ...assembly, status: "ONLINE", displayName: "Storage Prime", name: "Storage Prime" }
    : assembly),
};
const powerLookupConfirmed = resolveStructureWriteConfirmation(staleOfflineInventory, confirmedPowerLookup, powerOnlineOverlay);
assert.equal(
  powerLookupConfirmed.statusConfirmed,
  false,
  "expected selected-node power confirmation not to clear the overlay while operator-inventory still returns the stale offline state",
);
assert.equal(
  powerLookupConfirmed.nodeAssembliesConfirmed,
  true,
  "expected selected-node power confirmation to remain visible for debug without clearing the app-wide overlay",
);

const confirmedOnlinePowerInventory: OperatorInventoryResponse = {
  ...staleOfflineInventory,
  networkNodes: staleOfflineInventory.networkNodes.map((nodeGroup) => ({
    ...nodeGroup,
    structures: nodeGroup.structures.map((row) => row.objectId === STORAGE_TARGET.objectId
      ? { ...row, status: "online" }
      : row),
  })),
};
const powerOperatorInventoryConfirmed = resolveStructureWriteConfirmation(
  confirmedOnlinePowerInventory,
  confirmedPowerLookup,
  powerOnlineOverlay,
);
assert.equal(
  powerOperatorInventoryConfirmed.statusConfirmed,
  true,
  "expected operator-inventory confirmation to clear the pending online overlay once the app-wide model catches up",
);
assert.equal(
  powerOperatorInventoryConfirmed.operatorInventoryConfirmed,
  true,
  "expected operator-inventory confirmation to be recorded once the refreshed backend response reports the new online state",
);

const NODE_OFFLINE_NODE_ID = "0x0000000000000000000000000000000000000000000000000000000000000b00";
const NODE_OFFLINE_TARGETS: StructureWriteTarget[] = [
  {
    objectId: NODE_OFFLINE_NODE_ID,
    structureType: "network_node",
    ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000cb00",
    assemblyId: "9001",
    displayName: "Node Cascade",
  },
  {
    objectId: "0x0000000000000000000000000000000000000000000000000000000000000b01",
    structureType: "gate",
    ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000cb01",
    networkNodeId: NODE_OFFLINE_NODE_ID,
    assemblyId: "5101",
    canonicalDomainKey: "assembly:5101",
    displayName: "Gate Cascade",
  },
  {
    objectId: "0x0000000000000000000000000000000000000000000000000000000000000b02",
    structureType: "storage_unit",
    ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000cb02",
    networkNodeId: NODE_OFFLINE_NODE_ID,
    assemblyId: "5102",
    canonicalDomainKey: "assembly:5102",
    displayName: "Storage Cascade",
  },
  {
    objectId: "0x0000000000000000000000000000000000000000000000000000000000000b03",
    structureType: "turret",
    ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000cb03",
    networkNodeId: NODE_OFFLINE_NODE_ID,
    assemblyId: "5103",
    canonicalDomainKey: "assembly:5103",
    displayName: "Turret Cascade",
  },
  {
    objectId: "0x0000000000000000000000000000000000000000000000000000000000000b04",
    structureType: "assembly",
    ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000cb04",
    networkNodeId: NODE_OFFLINE_NODE_ID,
    assemblyId: "5104",
    canonicalDomainKey: "assembly:5104",
    displayName: "Printer Cascade",
  },
];

const nodeOfflineBaseGroups: NetworkNodeGroup[] = [
  {
    node: {
      objectId: NODE_OFFLINE_TARGETS[0]!.objectId,
      ownerCapId: NODE_OFFLINE_TARGETS[0]!.ownerCapId,
      assemblyId: NODE_OFFLINE_TARGETS[0]!.assemblyId ?? undefined,
      type: "network_node",
      name: "Node Cascade",
      status: "online",
      extensionStatus: "authorized",
    },
    gates: [{
      objectId: NODE_OFFLINE_TARGETS[1]!.objectId,
      ownerCapId: NODE_OFFLINE_TARGETS[1]!.ownerCapId,
      assemblyId: NODE_OFFLINE_TARGETS[1]!.assemblyId ?? undefined,
      type: "gate",
      name: "Gate Cascade",
      status: "online",
      networkNodeId: NODE_OFFLINE_NODE_ID,
      extensionStatus: "authorized",
    }],
    storageUnits: [{
      objectId: NODE_OFFLINE_TARGETS[2]!.objectId,
      ownerCapId: NODE_OFFLINE_TARGETS[2]!.ownerCapId,
      assemblyId: NODE_OFFLINE_TARGETS[2]!.assemblyId ?? undefined,
      type: "storage_unit",
      name: "Storage Cascade",
      status: "online",
      networkNodeId: NODE_OFFLINE_NODE_ID,
      extensionStatus: "authorized",
    }],
    turrets: [{
      objectId: NODE_OFFLINE_TARGETS[3]!.objectId,
      ownerCapId: NODE_OFFLINE_TARGETS[3]!.ownerCapId,
      assemblyId: NODE_OFFLINE_TARGETS[3]!.assemblyId ?? undefined,
      type: "turret",
      name: "Turret Cascade",
      status: "online",
      networkNodeId: NODE_OFFLINE_NODE_ID,
      extensionStatus: "authorized",
    }],
  },
];
const nodeOfflineBaseInventory: OperatorInventoryResponse = {
  schemaVersion: "operator-inventory.v1",
  operator: null,
  networkNodes: [
    {
      node: makeInventoryStructure({
        objectId: NODE_OFFLINE_TARGETS[0]!.objectId,
        assemblyId: NODE_OFFLINE_TARGETS[0]!.assemblyId ?? null,
        ownerCapId: NODE_OFFLINE_TARGETS[0]!.ownerCapId,
        family: "networkNode",
        displayName: "Node Cascade",
        name: "Node Cascade",
        status: "online",
      }),
      structures: [
        makeInventoryStructure({ objectId: NODE_OFFLINE_TARGETS[1]!.objectId, assemblyId: "5101", ownerCapId: NODE_OFFLINE_TARGETS[1]!.ownerCapId, family: "gate", displayName: "Gate Cascade", name: "Gate Cascade", status: "online", networkNodeId: NODE_OFFLINE_NODE_ID }),
        makeInventoryStructure({ objectId: NODE_OFFLINE_TARGETS[2]!.objectId, assemblyId: "5102", ownerCapId: NODE_OFFLINE_TARGETS[2]!.ownerCapId, family: "storage", displayName: "Storage Cascade", name: "Storage Cascade", status: "online", networkNodeId: NODE_OFFLINE_NODE_ID }),
        makeInventoryStructure({ objectId: NODE_OFFLINE_TARGETS[3]!.objectId, assemblyId: "5103", ownerCapId: NODE_OFFLINE_TARGETS[3]!.ownerCapId, family: "turret", displayName: "Turret Cascade", name: "Turret Cascade", status: "online", networkNodeId: NODE_OFFLINE_NODE_ID }),
        makeInventoryStructure({ objectId: NODE_OFFLINE_TARGETS[4]!.objectId, assemblyId: "5104", ownerCapId: NODE_OFFLINE_TARGETS[4]!.ownerCapId, family: "printer", displayName: "Printer Cascade", name: "Printer Cascade", status: "online", networkNodeId: NODE_OFFLINE_NODE_ID }),
      ],
    },
  ],
  unlinkedStructures: [],
  warnings: [],
  partial: false,
  source: "operator-inventory",
  fetchedAt: "2026-05-04T12:00:00.000Z",
};
const nodeOfflineBaseLookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: NODE_OFFLINE_NODE_ID,
  node: {
    objectId: NODE_OFFLINE_NODE_ID,
    name: "Node Cascade",
    displayName: "Node Cascade",
    status: "ONLINE",
    assemblyId: "9001",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: nodeOfflineBaseInventory.networkNodes[0]!.structures.map((row) => ({
    objectId: row.objectId,
    assemblyId: row.assemblyId,
    linkedGateId: null,
    assemblyType: row.assemblyType,
    typeId: row.typeId,
    typeName: row.typeName,
    name: row.name,
    displayName: row.displayName,
    family: row.family,
    size: row.size,
    status: "ONLINE",
    fuelAmount: null,
    powerSummary: null,
    solarSystemId: null,
    energySourceId: null,
    url: null,
    lastUpdated: row.lastUpdated,
    source: row.source,
    provenance: row.provenance,
    actionCandidate: null,
  })),
  fetchedAt: "2026-05-04T12:00:00.000Z",
  source: "operator-inventory",
  error: null,
  isPartial: false,
  droppedCount: 0,
};
const nodeOfflineOverlays = NODE_OFFLINE_TARGETS.map((target) => createPendingStructureWriteOverlay({
  action: "power",
  digest: "node-offline-digest",
  target,
  desiredStatus: "offline",
}));
const projectedNodeOfflineGroups = applyStructureWriteOverlaysToNodeGroups(nodeOfflineBaseGroups, nodeOfflineOverlays);
assert.equal(projectedNodeOfflineGroups[0]?.node.status, "offline", "expected node-offline overlay to mark the network node offline locally");
assert.deepEqual(projectedNodeOfflineGroups[0]?.gates.map((row) => row.status), ["offline"], "expected node-offline overlay to mark connected gates offline locally");
assert.deepEqual(projectedNodeOfflineGroups[0]?.storageUnits.map((row) => row.status), ["offline"], "expected node-offline overlay to mark connected storage offline locally");
assert.deepEqual(projectedNodeOfflineGroups[0]?.turrets.map((row) => row.status), ["offline"], "expected node-offline overlay to mark connected turrets offline locally");

const projectedNodeOfflineLookup = applyStructureWriteOverlaysToNodeAssembliesLookup(nodeOfflineBaseLookup, nodeOfflineOverlays);
assert.equal(projectedNodeOfflineLookup?.node?.status, "OFFLINE", "expected node-offline overlay to mark selected node lookup offline locally");
assert.deepEqual(projectedNodeOfflineLookup?.assemblies.map((row) => row.status), ["OFFLINE", "OFFLINE", "OFFLINE", "OFFLINE"], "expected node-offline overlay to mark every selected-node child offline locally");

const projectedNodeOfflineInventory = applyStructureWriteOverlaysToOperatorInventory(nodeOfflineBaseInventory, nodeOfflineOverlays);
assert.equal(projectedNodeOfflineInventory?.networkNodes[0]?.node.status, "offline", "expected operator-inventory overlay to mark the node offline before indexer catch-up");
assert.deepEqual(projectedNodeOfflineInventory?.networkNodes[0]?.structures.map((row) => row.status), ["offline", "offline", "offline", "offline"], "expected operator-inventory overlay to mark all connected child rows offline before indexer catch-up");
const overlaidAdaptedInventory = adaptOperatorInventory(projectedNodeOfflineInventory!);
assert.deepEqual(
  overlaidAdaptedInventory.nodeLookupsByNodeId.get(NODE_OFFLINE_NODE_ID)?.assemblies.map((row) => row.status),
  ["offline", "offline", "offline", "offline"],
  "expected adapted node lookup to keep child-offline overlays instead of snapping back to stale online rows",
);

const nodeOfflineLookupOnlyConfirmed: NodeAssembliesLookupResult = {
  ...nodeOfflineBaseLookup,
  node: { ...nodeOfflineBaseLookup.node!, status: "OFFLINE" },
  assemblies: nodeOfflineBaseLookup.assemblies.map((row) => ({ ...row, status: "OFFLINE" })),
};
for (const overlay of nodeOfflineOverlays) {
  const staleConfirmation = resolveStructureWriteConfirmation(nodeOfflineBaseInventory, nodeOfflineLookupOnlyConfirmed, overlay);
  assert.equal(staleConfirmation.statusConfirmed, false, "expected stale operator inventory to keep node-offline overlays active even when selected-node lookup catches up first");
  assert.equal(staleConfirmation.operatorInventoryConfirmed, false, "expected stale operator inventory not to clear node-offline overlays");
}

const confirmedNodeOfflineInventory: OperatorInventoryResponse = {
  ...nodeOfflineBaseInventory,
  networkNodes: nodeOfflineBaseInventory.networkNodes.map((nodeGroup) => ({
    node: { ...nodeGroup.node, status: "offline" },
    structures: nodeGroup.structures.map((row) => ({ ...row, status: "offline" })),
  })),
};
for (const overlay of nodeOfflineOverlays) {
  const confirmed = resolveStructureWriteConfirmation(confirmedNodeOfflineInventory, nodeOfflineBaseLookup, overlay);
  assert.equal(confirmed.statusConfirmed, true, "expected operator-inventory offline state to clear each node-offline overlay");
  assert.equal(confirmed.operatorInventoryConfirmed, true, "expected operator-inventory confirmation to be recorded for each node-offline overlay");
}

const nodeOnlineOnlyOverlay = createPendingStructureWriteOverlay({
  action: "power",
  digest: "node-online-digest",
  target: NODE_OFFLINE_TARGETS[0]!,
  desiredStatus: "online",
});
const offlineBaseGroups = applyStructureWriteOverlaysToNodeGroups(nodeOfflineBaseGroups, nodeOfflineOverlays);
const nodeOnlineOnlyGroups = applyStructureWriteOverlaysToNodeGroups(offlineBaseGroups, [nodeOnlineOnlyOverlay]);
assert.equal(nodeOnlineOnlyGroups[0]?.node.status, "online", "expected node-online overlay to mark only the network node online");
assert.deepEqual(nodeOnlineOnlyGroups[0]?.gates.map((row) => row.status), ["offline"], "expected node-online overlay to leave connected gates offline");
assert.deepEqual(nodeOnlineOnlyGroups[0]?.storageUnits.map((row) => row.status), ["offline"], "expected node-online overlay to leave connected storage offline");
assert.deepEqual(nodeOnlineOnlyGroups[0]?.turrets.map((row) => row.status), ["offline"], "expected node-online overlay to leave connected turrets offline");
const offlineBaseLookup = applyStructureWriteOverlaysToNodeAssembliesLookup(nodeOfflineBaseLookup, nodeOfflineOverlays);
const nodeOnlineOnlyLookup = applyStructureWriteOverlaysToNodeAssembliesLookup(offlineBaseLookup, [nodeOnlineOnlyOverlay]);
assert.equal(nodeOnlineOnlyLookup?.node?.status, "ONLINE", "expected node-online overlay to mark selected node lookup online");
assert.deepEqual(nodeOnlineOnlyLookup?.assemblies.map((row) => row.status), ["OFFLINE", "OFFLINE", "OFFLINE", "OFFLINE"], "expected node-online overlay to leave selected-node children offline");

console.log("structure write reconciliation check: ok");