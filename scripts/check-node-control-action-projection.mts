import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority";
import { buildNodeDrilldownMenuItems } from "../src/lib/nodeDrilldownMenuItems";
import { getStructurePowerAction, supportsStructureRename } from "../src/lib/structureActionSupport";

function makeStructure(overrides = {}) {
  return {
    objectId: "0xnode",
    ownerCapId: "0xnode-cap",
    type: "network_node",
    name: "Probe Node",
    status: "online",
    extensionStatus: "authorized",
    ...overrides,
  };
}

function makeNodeLocalStructure(overrides = {}) {
  return {
    id: "node-local-1",
    canonicalDomainKey: "assembly:4101",
    hasDirectChainAuthority: false,
    directChainMatchCount: 0,
    futureActionEligible: false,
    displayName: "Storage Alpha",
    typeLabel: "Storage",
    family: "tradePost",
    familyLabel: "Storage",
    iconFamily: "tradePost",
    band: "logistics",
    sizeVariant: "standard",
    badge: null,
    status: "offline",
    tone: "offline",
    warningPip: false,
    source: "backendMembership",
    isReadOnly: false,
    isActionable: true,
    sortLabel: "storage-alpha",
    actionAuthority: {
      state: "verified-supported",
      verifiedTarget: {
        structureId: "0xstorage",
        structureType: "storage_unit",
        ownerCapId: "0xowner-cap",
        networkNodeId: "0xnode",
        status: "offline",
      },
      candidateTargets: [],
      unavailableReason: null,
    },
    ...overrides,
  };
}

const sharedContextMenu = {
  structureId: "node-local-1",
  canonicalDomainKey: "assembly:4101",
  structureName: "Storage Alpha",
  left: 120,
  top: 80,
  visibilityAction: "hide" as const,
  visibilityActionLabel: "Hide from Node View" as const,
  powerActionLabel: "Bring Online" as const,
  nextOnline: true,
};

const selectedActions: string[] = [];
const supportedStructure = makeNodeLocalStructure();
const supportedItems = buildNodeDrilldownMenuItems({
  contextMenu: sharedContextMenu,
  structure: supportedStructure,
  onHideStructure: (canonicalDomainKey) => selectedActions.push(`hide:${canonicalDomainKey}`),
  onUnhideStructure: (canonicalDomainKey) => selectedActions.push(`unhide:${canonicalDomainKey}`),
  onTogglePower: (structure, nextOnline) => selectedActions.push(`power:${structure.id}:${nextOnline}`),
  onRenameStructure: (structure) => selectedActions.push(`rename:${structure.id}`),
});

assert.deepEqual(
  supportedItems.map((item) => item.label),
  ["Hide from Node View", "Bring Online", "Rename Assembly"],
  "expected supported Node Control rows to project hide, power, and rename actions through one shared menu builder",
);

supportedItems[0]?.onSelect();
supportedItems[1]?.onSelect();
supportedItems[2]?.onSelect();
assert.deepEqual(
  selectedActions,
  ["hide:assembly:4101", "power:node-local-1:true", "rename:node-local-1"],
  "expected the shared menu builder to preserve the correct Node Control action handlers",
);

const hiddenItems = buildNodeDrilldownMenuItems({
  contextMenu: {
    ...sharedContextMenu,
    visibilityAction: "unhide",
    visibilityActionLabel: "Unhide",
    powerActionLabel: "Take Offline",
    nextOnline: false,
  },
  structure: makeNodeLocalStructure({
    status: "online",
    actionAuthority: {
      state: "verified-supported",
      verifiedTarget: {
        structureId: "0xstorage",
        structureType: "storage_unit",
        ownerCapId: "0xowner-cap",
        networkNodeId: "0xnode",
        status: "online",
      },
      candidateTargets: [],
      unavailableReason: null,
    },
  }),
  onHideStructure: () => undefined,
  onUnhideStructure: () => undefined,
  onTogglePower: () => undefined,
  onRenameStructure: () => undefined,
});
assert.deepEqual(
  hiddenItems.map((item) => item.label),
  ["Unhide", "Take Offline", "Rename Assembly"],
  "expected hidden supported rows to keep unhide plus valid write actions",
);

const supportedPrinterStructure = makeNodeLocalStructure({
  id: "node-local-printer",
  canonicalDomainKey: "assembly:9104",
  displayName: "Field Printer",
  typeLabel: "Printer",
  family: "printer",
  familyLabel: "Printer",
  iconFamily: "printer",
  band: "industry",
  actionAuthority: {
    state: "verified-supported",
    verifiedTarget: {
      structureId: "0xprinter",
      structureType: "assembly",
      ownerCapId: "0xprinter-cap",
      networkNodeId: "0xnode",
      status: "offline",
    },
    candidateTargets: [],
    unavailableReason: null,
  },
});
const supportedPrinterItems = buildNodeDrilldownMenuItems({
  contextMenu: {
    ...sharedContextMenu,
    structureId: "node-local-printer",
    canonicalDomainKey: "assembly:9104",
    structureName: "Field Printer",
  },
  structure: supportedPrinterStructure,
  onHideStructure: () => undefined,
  onUnhideStructure: () => undefined,
  onTogglePower: () => undefined,
  onRenameStructure: () => undefined,
});
assert.deepEqual(
  supportedPrinterItems.map((item) => item.label),
  ["Hide from Node View", "Bring Online", "Rename Assembly"],
  "expected supported generic assembly rows to project the same write actions as the shipped families",
);

const supportedFamilyRows = [
  { family: "gate", familyLabel: "Gate", typeLabel: "Gate", iconFamily: "gate", band: "corridor", structureType: "gate", status: "online", expectedPower: "Take Offline" },
  { family: "tradePost", familyLabel: "Storage", typeLabel: "Storage", iconFamily: "tradePost", band: "logistics", structureType: "storage_unit", status: "offline", expectedPower: "Bring Online" },
  { family: "turret", familyLabel: "Turret", typeLabel: "Turret", iconFamily: "turret", band: "defense", structureType: "turret", status: "online", expectedPower: "Take Offline" },
  { family: "printer", familyLabel: "Printer", typeLabel: "Printer", iconFamily: "printer", band: "industry", structureType: "assembly", status: "offline", expectedPower: "Bring Online" },
  { family: "refinery", familyLabel: "Refinery", typeLabel: "Refinery", iconFamily: "refinery", band: "industry", structureType: "assembly", status: "online", expectedPower: "Take Offline" },
  { family: "assembler", familyLabel: "Assembler", typeLabel: "Assembler", iconFamily: "assembler", band: "industry", structureType: "assembly", status: "offline", expectedPower: "Bring Online" },
  { family: "berth", familyLabel: "Berth", typeLabel: "Berth", iconFamily: "berth", band: "logistics", structureType: "assembly", status: "online", expectedPower: "Take Offline" },
  { family: "relay", familyLabel: "Relay", typeLabel: "Relay", iconFamily: "relay", band: "support", structureType: "assembly", status: "offline", expectedPower: "Bring Online" },
  { family: "nursery", familyLabel: "Nursery", typeLabel: "Nursery", iconFamily: "nursery", band: "support", structureType: "assembly", status: "online", expectedPower: "Take Offline" },
  { family: "nest", familyLabel: "Nest", typeLabel: "Nest", iconFamily: "nest", band: "support", structureType: "assembly", status: "offline", expectedPower: "Bring Online" },
  { family: "shelter", familyLabel: "Shelter", typeLabel: "Shelter", iconFamily: "hangar", band: "support", structureType: "assembly", status: "online", expectedPower: "Take Offline" },
] as const;

for (const row of supportedFamilyRows) {
  const structure = makeNodeLocalStructure({
    id: `node-local-${row.family}`,
    canonicalDomainKey: `object:0x${row.family}`,
    displayName: row.familyLabel,
    typeLabel: row.typeLabel,
    family: row.family,
    familyLabel: row.familyLabel,
    iconFamily: row.iconFamily,
    band: row.band,
    status: row.status,
    tone: row.status,
    actionAuthority: {
      state: "verified-supported",
      verifiedTarget: {
        structureId: `0x${row.family}`,
        structureType: row.structureType,
        ownerCapId: `0x${row.family}-cap`,
        networkNodeId: "0xnode",
        status: row.status,
      },
      candidateTargets: [],
      unavailableReason: null,
    },
  });
  const powerState = getNodeLocalPowerControlState(structure);
  assert.equal(powerState.isInteractive, true, `expected ${row.familyLabel} rail to be executable`);
  assert.equal(powerState.actionLabel, row.expectedPower, `expected ${row.familyLabel} power label`);

  const items = buildNodeDrilldownMenuItems({
    contextMenu: {
      ...sharedContextMenu,
      structureId: structure.id,
      canonicalDomainKey: structure.canonicalDomainKey,
      structureName: structure.displayName,
      powerActionLabel: row.expectedPower,
      nextOnline: row.status !== "offline" ? false : true,
    },
    structure,
    onHideStructure: () => undefined,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
    onRenameStructure: () => undefined,
  });
  assert.deepEqual(
    items.map((item) => item.label),
    ["Hide from Node View", row.expectedPower, "Rename Assembly"],
    `expected ${row.familyLabel} to project hide, power, and rename actions`,
  );
}

const missingOwnerCapStructure = makeNodeLocalStructure({
  family: "printer",
  familyLabel: "Printer",
  typeLabel: "Printer",
  isReadOnly: true,
  isActionable: false,
  actionAuthority: {
    state: "missing-owner-cap",
    verifiedTarget: null,
    candidateTargets: [{
      structureId: "0xprinter",
      structureType: "assembly",
      networkNodeId: "0xnode",
      status: "offline",
    }],
    unavailableReason: "Missing OwnerCap.",
  },
});
const missingOwnerCapItems = buildNodeDrilldownMenuItems({
  contextMenu: {
    ...sharedContextMenu,
    powerActionLabel: null,
    nextOnline: null,
  },
  structure: missingOwnerCapStructure,
  onHideStructure: () => undefined,
  onUnhideStructure: () => undefined,
});
assert.deepEqual(
  missingOwnerCapItems.map((item) => item.label),
  ["Hide from Node View"],
  "expected generic assembly rows without OwnerCap proof to stay visibility-only",
);

assert.deepEqual(getNodeLocalPowerControlState(missingOwnerCapStructure), {
  actionLabel: null,
  currentStatus: "offline",
  nextOnline: null,
  selectedSegment: "offline",
  isInteractive: false,
  isStatusOnly: true,
}, "expected missing-owner-cap generic rows to resolve to a non-interactive status-only rail state");

const unsupportedStructure = makeNodeLocalStructure({
  id: "node-local-unknown",
  family: "networkNode",
  familyLabel: "Network Node",
  typeLabel: "Network Node",
  iconFamily: "networkNode",
  isReadOnly: true,
  isActionable: false,
  actionAuthority: {
    state: "unsupported-family",
    verifiedTarget: null,
    candidateTargets: [],
    unavailableReason: null,
  },
});
const unsupportedItems = buildNodeDrilldownMenuItems({
  contextMenu: {
    ...sharedContextMenu,
    powerActionLabel: null,
    nextOnline: null,
  },
  structure: unsupportedStructure,
  onHideStructure: () => undefined,
  onUnhideStructure: () => undefined,
});
assert.deepEqual(
  unsupportedItems.map((item) => item.label),
  ["Hide from Node View"],
  "expected unsupported or fallback rows to avoid fake write actions",
);
assert.deepEqual(getNodeLocalPowerControlState(unsupportedStructure), {
  actionLabel: null,
  currentStatus: "offline",
  nextOnline: null,
  selectedSegment: "offline",
  isInteractive: false,
  isStatusOnly: true,
}, "expected Node Control network-node fallback rows to remain status-only instead of receiving node-offline actions");

const nodeSelfOnlinePower = getStructurePowerAction(makeStructure(), { networkNodeOfflineAvailable: true });
assert.deepEqual(
  [nodeSelfOnlinePower?.label, supportsStructureRename(makeStructure()) ? "Rename Node" : null].filter(Boolean),
  ["Take offline", "Rename Node"],
  "expected node-self menu projection to expose Take offline and Rename Node for online nodes with child proof",
);
assert.equal(
  [nodeSelfOnlinePower?.label, "Rename Node"].includes("Hide from Node View"),
  false,
  "expected node-self menus to avoid the child-only hide action",
);

const nodeSelfOfflinePower = getStructurePowerAction(makeStructure({ status: "offline" }));
assert.deepEqual(
  [nodeSelfOfflinePower?.label, supportsStructureRename(makeStructure({ status: "offline" })) ? "Rename Node" : null].filter(Boolean),
  ["Bring online", "Rename Node"],
  "expected node-self menu projection to expose Bring online and Rename Node for offline nodes",
);

const nodeSelfWithoutOfflineProof = getStructurePowerAction(makeStructure());
assert.deepEqual(
  [nodeSelfWithoutOfflineProof?.label, supportsStructureRename(makeStructure()) ? "Rename Node" : null].filter(Boolean),
  ["Rename Node"],
  "expected online node-self menus without connected-child proof to keep rename but hide Take offline",
);

const canvasSource = readFileSync(new URL('../src/components/topology/node-drilldown/NodeDrilldownCanvas.tsx', import.meta.url), 'utf8');
const inspectorSource = readFileSync(new URL('../src/components/topology/node-drilldown/NodeSelectionInspector.tsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../src/screens/Dashboard.tsx', import.meta.url), 'utf8');
assert.equal(canvasSource.includes('onOpenNodeMenu?.'), true, 'expected the Node Control network-node glyph to open an app action menu');
assert.equal(canvasSource.includes('onContextMenu={(event) => {'), true, 'expected the Network Node glyph to suppress the browser context menu');
assert.equal(inspectorSource.includes('onOpenNodeMenu({ clientX: event.clientX, clientY: event.clientY })'), true, 'expected the node inspector area to expose the same app node menu');
assert.equal(dashboardSource.includes('nodeSurfaceActions.openStructureContextMenu'), true, 'expected live Node Control to reuse the shared node action surface');
assert.equal(dashboardSource.includes('nodeOfflineLookup: selectedNodeObservedLookup'), true, 'expected Node Control node-offline to use the selected node membership lookup');

console.log("node control action projection check: ok");