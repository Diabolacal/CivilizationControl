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

assert.equal(structures.length, 4, "expected 4 final rows after live/backend reconciliation");
assert.equal(canonicalDomainKeys.size, 4, "expected 4 unique canonical domain keys");

const storageRows = structures.filter((structure) => structure.family === "tradePost");
const turretRows = structures.filter((structure) => structure.family === "turret");
const assemblerRows = structures.filter((structure) => structure.family === "assembler");
const printerRows = structures.filter((structure) => structure.family === "printer");

assert.equal(storageRows.length, 1, "expected one merged storage row");
assert.equal(turretRows.length, 1, "expected one merged turret row");
assert.equal(assemblerRows.length, 1, "expected one backend-only assembler row");
assert.equal(printerRows.length, 1, "expected one backend-only printer row");

assert.equal(storageRows[0]?.source, "live", "expected storage row to stay authoritative live");
assert.equal(storageRows[0]?.typeLabel, "Mini Storage", "expected backend storage type enrichment to apply");
assert.equal(storageRows[0]?.familyLabel, "Storage", "expected storage terminology to stay normalized");

assert.equal(turretRows[0]?.source, "live", "expected turret row to stay authoritative live");
assert.equal(turretRows[0]?.typeLabel, "Mini Turret", "expected backend turret type enrichment to apply");

assert.equal(assemblerRows[0]?.source, "backendObserved", "expected assembler to remain backend-only");
assert.equal(assemblerRows[0]?.isReadOnly, true, "expected backend-only assembler to remain read-only");
assert.equal(assemblerRows[0]?.isActionable, false, "expected backend-only assembler to remain non-actionable");

assert.equal(printerRows[0]?.source, "backendObserved", "expected printer to remain backend-only");

console.log(JSON.stringify({
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
    isReadOnly: structure.isReadOnly,
    isActionable: structure.isActionable,
  })),
}, null, 2));