import assert from "node:assert/strict";

import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority";
import { buildNodeDrilldownMenuItems } from "../src/lib/nodeDrilldownMenuItems";

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

console.log("node control action projection check: ok");