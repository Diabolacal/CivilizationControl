import assert from "node:assert/strict";

import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority";
import { buildNodeDrilldownMenuItems } from "../src/lib/nodeDrilldownMenuItems";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel";
import type { NetworkNodeGroup } from "../src/types/domain";

function buildMenuLabels(structure: NonNullable<ReturnType<typeof buildLiveNodeLocalViewModelWithObserved>["structures"][number]>) {
  const powerControl = getNodeLocalPowerControlState(structure);

  return buildNodeDrilldownMenuItems({
    contextMenu: {
      structureId: structure.id,
      canonicalDomainKey: structure.canonicalDomainKey,
      structureName: structure.displayName,
      left: 120,
      top: 80,
      visibilityAction: 'hide',
      visibilityActionLabel: 'Hide from Node View',
      powerActionLabel: powerControl.actionLabel,
      nextOnline: powerControl.nextOnline,
    },
    structure,
    onHideStructure: () => undefined,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
    onRenameStructure: () => undefined,
  }).map((item) => item.label);
}

const NETWORK_NODE_ID = "0x00000000000000000000000000000000000000000000000000000000000000aa";

const group: NetworkNodeGroup = {
  node: {
    objectId: NETWORK_NODE_ID,
    ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000caa",
    assemblyId: "9001",
    type: "network_node",
    name: "Probe Node",
    status: "online",
    extensionStatus: "authorized",
  },
  gates: [],
  storageUnits: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000101",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c101",
      assemblyId: "0000004101",
      type: "storage_unit",
      name: "Storage a1b2c3d4",
      status: "online",
      networkNodeId: NETWORK_NODE_ID,
      extensionStatus: "authorized",
    },
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000103",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c103",
      assemblyId: "4103",
      type: "storage_unit",
      name: "Storage c1d2e3f4",
      status: "online",
      networkNodeId: NETWORK_NODE_ID,
      extensionStatus: "authorized",
    },
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000104",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c104",
      assemblyId: "4104",
      type: "storage_unit",
      name: "Storage d1e2f3a4",
      status: "online",
      networkNodeId: NETWORK_NODE_ID,
      extensionStatus: "authorized",
    },
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000105",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c105",
      assemblyId: "4105",
      type: "storage_unit",
      name: "Storage e1f2a3b4",
      status: "online",
      networkNodeId: NETWORK_NODE_ID,
      extensionStatus: "authorized",
    },
  ],
  turrets: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000102",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c102",
      assemblyId: "4102",
      type: "turret",
      name: "Turret b1c2d3e4",
      status: "online",
      networkNodeId: NETWORK_NODE_ID,
      extensionStatus: "authorized",
    },
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000106",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c106",
      assemblyId: "4106",
      type: "turret",
      name: "Turret c2d3e4f5",
      status: "online",
      networkNodeId: NETWORK_NODE_ID,
      extensionStatus: "authorized",
    },
  ],
};

const lookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: NETWORK_NODE_ID,
  node: {
    objectId: NETWORK_NODE_ID,
    name: "Probe Node",
    status: "ONLINE",
    assemblyId: "9001",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: [
    {
      objectId: null,
      assemblyId: "4101",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88082,
      typeName: "Mini Storage",
      name: "Storage",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: null,
      assemblyId: "4103",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage",
      status: "ONLINE",
      fuelAmount: "250",
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: "0x104",
      assemblyId: "0000004104",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88084,
      typeName: "Heavy Storage",
      name: "Heavy Storage",
      status: "ONLINE",
      fuelAmount: "325",
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: null,
      assemblyId: "4105",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88082,
      typeName: "Mini Storage",
      name: "Mini Storage",
      status: "ONLINE",
      fuelAmount: "180",
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: "0x102",
      assemblyId: "0000004102",
      linkedGateId: null,
      assemblyType: "turret",
      typeId: 92279,
      typeName: "Mini Turret",
      name: "Turret",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: null,
      assemblyId: "4106",
      linkedGateId: null,
      assemblyType: "turret",
      typeId: 92279,
      typeName: "Mini Turret",
      name: "Mini Turret",
      status: "OFFLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: null,
      assemblyId: "4301",
      linkedGateId: null,
      assemblyType: "assembler",
      typeId: 88068,
      typeName: "Assembler",
      name: "Assembler 4301",
      status: "OFFLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: null,
      assemblyId: "4303",
      linkedGateId: null,
      assemblyType: "refinery",
      typeId: 88069,
      typeName: "Refinery",
      name: "Refinery",
      status: "UNKNOWN",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: "0x4302",
      assemblyId: "4302",
      linkedGateId: null,
      assemblyType: "printer",
      typeId: 88067,
      typeName: "Printer",
      name: "Printer",
      displayName: "Printer 4302",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000004302",
      ownerWalletAddress: "0xoperator-wallet",
      characterId: "0xoperator-character",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
      actionCandidate: {
        actions: {
          power: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: "0x4302",
              structureType: "assembly",
              ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000004302",
              networkNodeId: group.node.objectId,
            },
            unavailableReason: null,
          },
          rename: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: "0x4302",
              structureType: "assembly",
              ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000004302",
              networkNodeId: group.node.objectId,
            },
            unavailableReason: null,
          },
        },
        supported: true,
        familySupported: true,
        unavailableReason: null,
      },
    },
    {
      objectId: "0x4304",
      assemblyId: "4304",
      linkedGateId: null,
      assemblyType: "relay",
      typeId: 88072,
      typeName: "Relay",
      name: "Relay",
      displayName: "Relay 4304",
      status: "OFFLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000004304",
      ownerWalletAddress: "0xoperator-wallet",
      characterId: "0xoperator-character",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
      actionCandidate: {
        actions: {
          power: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: "0x4304",
              structureType: "assembly",
              ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000004304",
              networkNodeId: group.node.objectId,
            },
            unavailableReason: null,
          },
          rename: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: "0x4304",
              structureType: "assembly",
              ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000004304",
              networkNodeId: group.node.objectId,
            },
            unavailableReason: null,
          },
        },
        supported: true,
        familySupported: true,
        unavailableReason: null,
      },
    },
  ],
  fetchedAt: "2026-05-02T12:00:00.000Z",
  source: "shared-frontier-backend",
  error: null,
  isPartial: false,
  droppedCount: 0,
};

const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup);
const structures = viewModel.structures;
const canonicalDomainKeys = new Set(structures.map((structure) => structure.canonicalDomainKey));

assert.equal(viewModel.sourceMode, "backend-membership", "expected backend-membership mode when backend rows exist");
assert.equal(structures.length, 10, "expected 10 final rows after backend-membership selection");
assert.equal(canonicalDomainKeys.size, 10, "expected 10 unique canonical domain keys");

const storageRows = structures.filter((structure) => structure.family === "tradePost");
const turretRows = structures.filter((structure) => structure.family === "turret");
const assemblerRows = structures.filter((structure) => structure.family === "assembler");
const printerRows = structures.filter((structure) => structure.family === "printer");
const refineryRows = structures.filter((structure) => structure.family === "refinery");
const relayRows = structures.filter((structure) => structure.family === "relay");

assert.equal(storageRows.length, 4, "expected exactly 4 backend-membership storage rows");
assert.equal(turretRows.length, 2, "expected exactly 2 backend-membership turret rows");
assert.equal(assemblerRows.length, 1, "expected one backend-only assembler row");
assert.equal(printerRows.length, 1, "expected one backend-only printer row");
assert.equal(refineryRows.length, 1, "expected one backend-only refinery row");
assert.equal(relayRows.length, 1, "expected one backend-membership relay row");

assert.ok(storageRows.every((structure) => structure.source === "backendMembership"), "expected storage rows to render from backend membership");
assert.ok(storageRows.every((structure) => structure.familyLabel === "Storage"), "expected storage terminology to stay normalized");
assert.ok(storageRows.every((structure) => structure.hasDirectChainAuthority), "expected storage rows to retain direct-chain authority annotations");
assert.ok(
  storageRows.every((structure) => structure.actionAuthority.state === "verified-supported"),
  "expected uniquely matched backend-membership storage rows to be verified-supported in Phase E",
);
assert.ok(
  storageRows.every((structure) => structure.isActionable && !structure.isReadOnly),
  "expected verified-supported backend-membership storage rows to expose power controls in Phase E",
);
assert.ok(
  storageRows.every((structure) => structure.actionAuthority.verifiedTarget?.structureType === "storage_unit"),
  "expected backend-membership storage rows to map to storage_unit power targets",
);

assert.ok(turretRows.every((structure) => structure.source === "backendMembership"), "expected turret rows to render from backend membership");
assert.ok(
  turretRows.every((structure) => structure.actionAuthority.state === "verified-supported"),
  "expected uniquely matched backend-membership turret rows to be verified-supported in Phase E",
);
assert.ok(
  turretRows.every((structure) => structure.isActionable && !structure.isReadOnly),
  "expected verified-supported backend-membership turret rows to expose power controls in Phase E",
);
assert.ok(
  turretRows.every((structure) => structure.actionAuthority.verifiedTarget?.structureType === "turret"),
  "expected backend-membership turret rows to map to turret power targets",
);

assert.equal(assemblerRows[0]?.source, "backendMembership", "expected assembler to remain part of backend membership");
assert.equal(assemblerRows[0]?.isReadOnly, true, "expected backend-only assembler to remain read-only");
assert.equal(assemblerRows[0]?.isActionable, false, "expected backend-only assembler to remain non-actionable");
assert.equal(assemblerRows[0]?.hasDirectChainAuthority, false, "expected backend-only assembler to have no direct-chain authority annotation");
assert.equal(assemblerRows[0]?.actionAuthority.state, "backend-only", "expected backend-only assembler to remain unavailable in Phase E");

assert.equal(printerRows[0]?.source, "backendMembership", "expected printer to remain part of backend membership");
assert.equal(printerRows[0]?.isReadOnly, false, "expected generic printer with indexed required IDs to become actionable");
assert.equal(printerRows[0]?.isActionable, true, "expected generic printer to expose live actions when owner-cap and node context are indexed");
assert.equal(printerRows[0]?.hasDirectChainAuthority, false, "expected generic printer support to remain operator-inventory-backed when no live structure match exists");
assert.equal(printerRows[0]?.actionAuthority.state, "verified-supported", "expected backend-membership printer to resolve to generic assembly support");
assert.equal(printerRows[0]?.actionAuthority.verifiedTarget?.structureType, "assembly", "expected backend-membership printer to map to the generic assembly write target");
assert.equal(refineryRows[0]?.actionAuthority.state, "backend-only", "expected backend-only refinery to remain unavailable in Phase E");
assert.equal(relayRows[0]?.source, "backendMembership", "expected relay to remain part of backend membership");
assert.equal(relayRows[0]?.isReadOnly, false, "expected generic relay with indexed required IDs to become actionable");
assert.equal(relayRows[0]?.isActionable, true, "expected generic relay to expose live actions when owner-cap and node context are indexed");
assert.equal(relayRows[0]?.hasDirectChainAuthority, false, "expected generic relay support to remain operator-inventory-backed when no live structure match exists");
assert.equal(relayRows[0]?.actionAuthority.state, "verified-supported", "expected backend-membership relay to resolve to generic assembly support");
assert.equal(relayRows[0]?.actionAuthority.verifiedTarget?.structureType, "assembly", "expected backend-membership relay to map to the generic assembly write target");
assert.deepEqual(
  relayRows[0] ? buildMenuLabels(relayRows[0]) : [],
  ["Hide from Node View", "Bring Online", "Rename Assembly"],
  "expected reconciled support-family rows to project the same final Node Control actions as printer-backed generic assemblies",
);

assert.ok(structures.every((structure) => structure.familyLabel !== "Trade Post"), "expected no visible Trade Post terminology");
assert.ok(structures.every((structure) => structure.source !== "live"), "expected no live display rows in backend-membership mode");

const aliasBridgeGroup: NetworkNodeGroup = {
  node: {
    objectId: "0x00000000000000000000000000000000000000000000000000000000000000bb",
    ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000cbb",
    assemblyId: "9010",
    type: "network_node",
    name: "Alias Bridge Node",
    status: "online",
    extensionStatus: "authorized",
  },
  gates: [],
  storageUnits: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000201",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d201",
      assemblyId: "4201",
      type: "storage_unit",
      name: "Storage bridge4201",
      status: "online",
      networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000bb",
      extensionStatus: "authorized",
    },
  ],
  turrets: [],
};

const aliasBridgeLookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: aliasBridgeGroup.node.objectId,
  node: {
    objectId: aliasBridgeGroup.node.objectId,
    name: "Alias Bridge Node",
    status: "ONLINE",
    assemblyId: "9010",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: [
    {
      objectId: null,
      assemblyId: "4201",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-03T09:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000abc",
      assemblyId: "4201",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-03T09:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000abc",
      assemblyId: "5201",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-03T09:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
  ],
  fetchedAt: "2026-05-03T09:00:00.000Z",
  source: "shared-frontier-backend",
  error: null,
  isPartial: false,
  droppedCount: 0,
};

const aliasBridgeViewModel = buildLiveNodeLocalViewModelWithObserved(aliasBridgeGroup, aliasBridgeLookup);
const aliasBridgeRow = aliasBridgeViewModel.structures.find((structure) => structure.family === "tradePost");

assert.ok(aliasBridgeRow, "expected alias-bridge storage row to render");
assert.equal(aliasBridgeViewModel.sourceMode, "backend-membership", "expected alias-bridge view model to stay in backend-membership mode");
assert.equal(aliasBridgeRow?.source, "backendMembership", "expected alias-bridge storage row to render from backend membership");
assert.equal(aliasBridgeRow?.directChainMatchCount, 1, "expected alias-bridge storage row to keep exactly one direct-chain match");
assert.equal(aliasBridgeRow?.actionAuthority.state, "verified-supported", "expected merged observed aliases to preserve one verified-supported storage match");
assert.equal(aliasBridgeRow?.actionAuthority.verifiedTarget?.structureId, aliasBridgeGroup.storageUnits[0]?.objectId, "expected alias-bridge storage row to resolve back to the live storage object");

const incompleteIndexedCandidateGroup: NetworkNodeGroup = {
  node: {
    objectId: "0x00000000000000000000000000000000000000000000000000000000000000cc",
    ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000ccc",
    assemblyId: "9020",
    type: "network_node",
    name: "Indexed Candidate Node",
    status: "online",
    extensionStatus: "authorized",
  },
  gates: [],
  storageUnits: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000202",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d202",
      assemblyId: "4202",
      type: "storage_unit",
      name: "Storage bridge4202",
      status: "online",
      networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000cc",
      extensionStatus: "authorized",
    },
  ],
  turrets: [],
};

const incompleteIndexedCandidateLookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: incompleteIndexedCandidateGroup.node.objectId,
  node: {
    objectId: incompleteIndexedCandidateGroup.node.objectId,
    name: "Indexed Candidate Node",
    status: "ONLINE",
    assemblyId: "9020",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: [
    {
      objectId: incompleteIndexedCandidateGroup.storageUnits[0]?.objectId ?? null,
      assemblyId: "4202",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage Indexed",
      displayName: "Storage Indexed",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-04T12:00:00.000Z",
      source: "operator-inventory",
      provenance: "node-local-indexer",
      actionCandidate: {
        actions: {
          power: {
            candidate: false,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: incompleteIndexedCandidateGroup.storageUnits[0]?.objectId ?? null,
              structureType: "storage_unit",
              ownerCapId: incompleteIndexedCandidateGroup.storageUnits[0]?.ownerCapId ?? null,
              networkNodeId: null,
            },
            unavailableReason: "Indexed candidate missing node context.",
          },
          rename: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: incompleteIndexedCandidateGroup.storageUnits[0]?.objectId ?? null,
              structureType: "storage_unit",
              ownerCapId: incompleteIndexedCandidateGroup.storageUnits[0]?.ownerCapId ?? null,
              networkNodeId: null,
            },
            unavailableReason: null,
          },
        },
        supported: true,
        familySupported: true,
        unavailableReason: null,
      },
    },
  ],
  fetchedAt: "2026-05-04T12:00:00.000Z",
  source: "operator-inventory",
  error: null,
  isPartial: false,
  droppedCount: 0,
};

const incompleteIndexedCandidateViewModel = buildLiveNodeLocalViewModelWithObserved(
  incompleteIndexedCandidateGroup,
  incompleteIndexedCandidateLookup,
);
const incompleteIndexedCandidateRow = incompleteIndexedCandidateViewModel.structures.find(
  (structure) => structure.assemblyId === "4202",
);

assert.ok(incompleteIndexedCandidateRow, "expected incomplete indexed candidate row to render");
assert.equal(
  incompleteIndexedCandidateRow?.actionAuthority.state,
  "verified-supported",
  "expected a uniquely matched backend-membership row to stay actionable even when the indexed power candidate omits network node context",
);
assert.equal(
  incompleteIndexedCandidateRow?.actionAuthority.verifiedTarget?.networkNodeId,
  incompleteIndexedCandidateGroup.node.objectId,
  "expected the action resolver to recover network node context from the matching live structure row",
);
assert.equal(
  incompleteIndexedCandidateRow?.actionAuthority.verifiedTarget?.ownerCapId,
  incompleteIndexedCandidateGroup.storageUnits[0]?.ownerCapId,
  "expected the action resolver to preserve the owner-cap target while upgrading the row to verified-supported",
);

const operatorInventoryAuthorityGroup: NetworkNodeGroup = {
  node: {
    objectId: "0x00000000000000000000000000000000000000000000000000000000000000dd",
    ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000ddd",
    assemblyId: "9030",
    readModelSource: "operator-inventory",
    type: "network_node",
    name: "Operator Inventory Node",
    status: "online",
    extensionStatus: "authorized",
  },
  gates: [],
  storageUnits: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000301",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d301",
      assemblyId: "4301",
      readModelSource: "operator-inventory",
      type: "storage_unit",
      name: "Storage Authority",
      status: "offline",
      networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000dd",
      extensionStatus: "authorized",
    },
  ],
  turrets: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000302",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d302",
      assemblyId: "4302",
      readModelSource: "operator-inventory",
      type: "turret",
      name: "Turret Authority",
      status: "online",
      networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000dd",
      extensionStatus: "authorized",
    },
  ],
};

const operatorInventoryAuthorityLookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: operatorInventoryAuthorityGroup.node.objectId,
  node: {
    objectId: operatorInventoryAuthorityGroup.node.objectId,
    name: "Operator Inventory Node",
    status: "ONLINE",
    assemblyId: "9030",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: [
    {
      objectId: null,
      assemblyId: "4301",
      linkedGateId: null,
      assemblyType: "storage_unit",
      typeId: 88083,
      typeName: "Storage",
      name: "Storage Authority",
      displayName: "Storage Authority",
      status: "OFFLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-04T12:30:00.000Z",
      source: "operator-inventory",
      provenance: "node-local-indexer",
      actionCandidate: {
        actions: {
          power: {
            candidate: false,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: operatorInventoryAuthorityGroup.storageUnits[0]?.objectId ?? null,
              structureType: "storage_unit",
              ownerCapId: operatorInventoryAuthorityGroup.storageUnits[0]?.ownerCapId ?? null,
              networkNodeId: null,
            },
            unavailableReason: "Indexed candidate missing node context.",
          },
          rename: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: true,
            requiredIds: {
              structureId: operatorInventoryAuthorityGroup.storageUnits[0]?.objectId ?? null,
              structureType: "storage_unit",
              ownerCapId: operatorInventoryAuthorityGroup.storageUnits[0]?.ownerCapId ?? null,
              networkNodeId: null,
            },
            unavailableReason: null,
          },
        },
        supported: true,
        familySupported: true,
        unavailableReason: null,
      },
    },
    {
      objectId: null,
      assemblyId: "4302",
      linkedGateId: null,
      assemblyType: "turret",
      typeId: 88090,
      typeName: "Turret",
      name: "Turret Authority",
      displayName: "Turret Authority",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-04T12:30:00.000Z",
      source: "operator-inventory",
      provenance: "node-local-indexer",
      actionCandidate: {
        actions: {
          power: {
            candidate: false,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: false,
            requiredIds: {
              structureId: operatorInventoryAuthorityGroup.turrets[0]?.objectId ?? null,
              structureType: "turret",
              ownerCapId: null,
              networkNodeId: operatorInventoryAuthorityGroup.turrets[0]?.networkNodeId ?? null,
            },
            unavailableReason: "Indexed candidate missing owner-cap context.",
          },
          rename: {
            candidate: true,
            currentlyImplementedInCivilizationControl: true,
            familySupported: true,
            indexedOwnerCapPresent: false,
            requiredIds: {
              structureId: operatorInventoryAuthorityGroup.turrets[0]?.objectId ?? null,
              structureType: "turret",
              ownerCapId: null,
              networkNodeId: operatorInventoryAuthorityGroup.turrets[0]?.networkNodeId ?? null,
            },
            unavailableReason: null,
          },
        },
        supported: true,
        familySupported: true,
        unavailableReason: null,
      },
    },
  ],
  fetchedAt: "2026-05-04T12:30:00.000Z",
  source: "operator-inventory",
  error: null,
  isPartial: false,
  droppedCount: 0,
};

const operatorInventoryAuthorityViewModel = buildLiveNodeLocalViewModelWithObserved(
  operatorInventoryAuthorityGroup,
  operatorInventoryAuthorityLookup,
);
const operatorInventoryAuthorityStorageRow = operatorInventoryAuthorityViewModel.structures.find(
  (structure) => structure.assemblyId === "4301",
);
const operatorInventoryAuthorityTurretRow = operatorInventoryAuthorityViewModel.structures.find(
  (structure) => structure.assemblyId === "4302",
);

assert.equal(
  operatorInventoryAuthorityViewModel.sourceMode,
  "backend-membership",
  "expected operator-inventory authority rows to stay in backend-membership mode",
);
assert.ok(operatorInventoryAuthorityStorageRow, "expected operator-inventory-backed storage row to render");
assert.ok(operatorInventoryAuthorityTurretRow, "expected operator-inventory-backed turret row to render");
assert.equal(
  operatorInventoryAuthorityStorageRow?.actionAuthority.state,
  "verified-supported",
  "expected operator-inventory-backed storage rows to remain actionable when lookup node context is incomplete",
);
assert.equal(
  operatorInventoryAuthorityTurretRow?.actionAuthority.state,
  "verified-supported",
  "expected operator-inventory-backed turret rows to remain actionable when lookup owner-cap context is incomplete",
);
assert.equal(
  operatorInventoryAuthorityStorageRow?.hasDirectChainAuthority,
  false,
  "expected operator-inventory-backed storage authority recovery not to masquerade as direct-chain authority",
);
assert.equal(
  operatorInventoryAuthorityTurretRow?.hasDirectChainAuthority,
  false,
  "expected operator-inventory-backed turret authority recovery not to masquerade as direct-chain authority",
);
assert.equal(
  operatorInventoryAuthorityStorageRow?.directChainMatchCount,
  0,
  "expected operator-inventory-backed storage authority recovery to keep zero direct-chain matches",
);
assert.equal(
  operatorInventoryAuthorityTurretRow?.directChainMatchCount,
  0,
  "expected operator-inventory-backed turret authority recovery to keep zero direct-chain matches",
);
assert.equal(
  operatorInventoryAuthorityStorageRow?.actionAuthority.verifiedTarget?.networkNodeId,
  operatorInventoryAuthorityGroup.storageUnits[0]?.networkNodeId,
  "expected storage authority recovery to borrow node context from the operator-inventory structure row",
);
assert.equal(
  operatorInventoryAuthorityTurretRow?.actionAuthority.verifiedTarget?.ownerCapId,
  operatorInventoryAuthorityGroup.turrets[0]?.ownerCapId,
  "expected turret authority recovery to borrow owner-cap context from the operator-inventory structure row",
);

const staleFallbackGroup: NetworkNodeGroup = {
  node: {
    objectId: "0x00000000000000000000000000000000000000000000000000000000000000ee",
    ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000eee",
    assemblyId: "9040",
    type: "network_node",
    name: "Fallback Node",
    status: "online",
    extensionStatus: "authorized",
  },
  gates: [],
  storageUnits: [],
  turrets: [
    {
      objectId: "0x0000000000000000000000000000000000000000000000000000000000000401",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d401",
      assemblyId: "4401",
      type: "turret",
      name: "Left Turret",
      status: "online",
      networkNodeId: "0x00000000000000000000000000000000000000000000000000000000000000ee",
      extensionStatus: "authorized",
    },
  ],
};

const staleFallbackLookup: NodeAssembliesLookupResult = {
  status: "success",
  networkNodeId: staleFallbackGroup.node.objectId,
  node: {
    objectId: staleFallbackGroup.node.objectId,
    name: "Fallback Node",
    status: "ONLINE",
    assemblyId: "9040",
    solarSystemId: null,
    energySourceId: null,
  },
  assemblies: [
    {
      objectId: null,
      assemblyId: "4401",
      linkedGateId: null,
      assemblyType: "turret",
      typeId: 92279,
      typeName: "Mini Turret",
      name: "Mini Turret",
      status: "OFFLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-01T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
    },
  ],
  fetchedAt: "2026-05-06T12:00:00.000Z",
  source: "shared-frontier-backend",
  error: null,
  isPartial: false,
  droppedCount: 0,
};

const staleFallbackViewModel = buildLiveNodeLocalViewModelWithObserved(staleFallbackGroup, staleFallbackLookup);
const staleFallbackRow = staleFallbackViewModel.structures.find((structure) => structure.assemblyId === "4401");

assert.ok(staleFallbackRow, "expected stale fallback turret row to render");
assert.equal(staleFallbackViewModel.sourceMode, "backend-membership", "expected stale fallback rows to stay in backend-membership mode");
assert.equal(
  staleFallbackRow?.displayName,
  "Left Turret",
  "expected direct-chain child naming to beat stale node-local fallback names when no displayName metadata is present",
);
assert.equal(
  staleFallbackRow?.status,
  "online",
  "expected direct-chain child status to beat stale node-local fallback status when the fallback row comes from the node-local indexer",
);
assert.equal(
  staleFallbackRow?.hasDirectChainAuthority,
  true,
  "expected stale fallback reconciliation to preserve direct-chain authority on the rendered row",
);

console.log(JSON.stringify({
  sourceMode: viewModel.sourceMode,
  totalRows: structures.length,
  canonicalDomainKeys: [...canonicalDomainKeys],
  rows: structures.map((structure) => ({
    renderId: structure.id,
    canonicalDomainKey: structure.canonicalDomainKey,
    source: structure.source,
    family: structure.family,
    typeLabel: structure.typeLabel,
    displayName: structure.displayName,
    objectId: structure.objectId ?? null,
    assemblyId: structure.assemblyId ?? null,
    directChainObjectId: structure.directChainObjectId ?? null,
    directChainAssemblyId: structure.directChainAssemblyId ?? null,
    hasDirectChainAuthority: structure.hasDirectChainAuthority,
    directChainMatchCount: structure.directChainMatchCount,
    futureActionEligible: structure.futureActionEligible,
    isReadOnly: structure.isReadOnly,
    isActionable: structure.isActionable,
    actionAuthorityState: structure.actionAuthority.state,
    verifiedTarget: structure.actionAuthority.verifiedTarget,
  })),
}, null, 2));