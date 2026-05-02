import assert from "node:assert/strict";

import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel";
import type { NetworkNodeGroup } from "../src/types/domain";

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
      assemblyId: null,
      linkedGateId: null,
      assemblyType: "printer",
      typeId: 88067,
      typeName: "Printer",
      name: "Printer",
      status: "ONLINE",
      fuelAmount: null,
      solarSystemId: null,
      energySourceId: null,
      url: null,
      lastUpdated: "2026-05-02T12:00:00.000Z",
      source: "shared-frontier-backend",
      provenance: "node-local-indexer",
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
assert.equal(structures.length, 9, "expected 9 final rows after backend-membership selection");
assert.equal(canonicalDomainKeys.size, 9, "expected 9 unique canonical domain keys");

const storageRows = structures.filter((structure) => structure.family === "tradePost");
const turretRows = structures.filter((structure) => structure.family === "turret");
const assemblerRows = structures.filter((structure) => structure.family === "assembler");
const printerRows = structures.filter((structure) => structure.family === "printer");
const refineryRows = structures.filter((structure) => structure.family === "refinery");

assert.equal(storageRows.length, 4, "expected exactly 4 backend-membership storage rows");
assert.equal(turretRows.length, 2, "expected exactly 2 backend-membership turret rows");
assert.equal(assemblerRows.length, 1, "expected one backend-only assembler row");
assert.equal(printerRows.length, 1, "expected one backend-only printer row");
assert.equal(refineryRows.length, 1, "expected one backend-only refinery row");

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
assert.equal(printerRows[0]?.actionAuthority.state, "backend-only", "expected backend-only printer to remain unavailable in Phase E");
assert.equal(refineryRows[0]?.actionAuthority.state, "backend-only", "expected backend-only refinery to remain unavailable in Phase E");

assert.ok(structures.every((structure) => structure.familyLabel !== "Trade Post"), "expected no visible Trade Post terminology");
assert.ok(structures.every((structure) => structure.source !== "live"), "expected no live display rows in backend-membership mode");

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