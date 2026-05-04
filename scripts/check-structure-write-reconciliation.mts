import assert from "node:assert/strict";

import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient";
import {
  applyStructureWriteOverlaysToNodeAssembliesLookup,
  applyStructureWriteOverlaysToStructures,
  createPendingStructureWriteOverlay,
  resolveStructureWriteConfirmation,
} from "../src/lib/structureWriteReconciliation";
import type { Structure } from "../src/types/domain";
import type { OperatorInventoryResponse } from "../src/types/operatorInventory";

const STORAGE_TARGET = {
  objectId: "0x0000000000000000000000000000000000000000000000000000000000000a01",
  structureType: "storage_unit" as const,
  ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000ca01",
  networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000aa",
  assemblyId: "4101",
  canonicalDomainKey: "assembly:4101",
  displayName: "Storage Alpha",
};

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

console.log("structure write reconciliation check: ok");