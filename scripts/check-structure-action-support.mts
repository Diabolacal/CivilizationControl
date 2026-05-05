import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionAuthorityLabel,
  formatNodeLocalActionBadgeText,
  formatNodeLocalActionTooltip,
  getNodeLocalPowerControlState,
  getNodeLocalPowerToggleIntent,
  supportsNodeLocalRename,
} from '../src/lib/nodeDrilldownActionAuthority.ts';
import { estimateContextMenuWidthPx } from '../src/lib/contextMenuPositioning.ts';
import { getStructurePowerAction, supportsStructureRename } from '../src/lib/structureActionSupport.ts';

function makeStructure(overrides = {}) {
  return {
    objectId: '0xstructure',
    ownerCapId: '0xowner-cap',
    type: 'gate',
    name: 'Test Structure',
    status: 'offline',
    networkNodeId: '0xnode',
    extensionStatus: 'none',
    ...overrides,
  };
}

function makeNodeLocalStructure(overrides = {}) {
  return {
    id: 'node-local-1',
    canonicalDomainKey: 'gate::0xgate',
    hasDirectChainAuthority: true,
    directChainMatchCount: 1,
    futureActionEligible: false,
    displayName: 'Gate Assembly',
    typeLabel: 'Gate',
    family: 'gate',
    familyLabel: 'Gate',
    iconFamily: 'gate',
    band: 'corridor',
    sizeVariant: 'standard',
    badge: null,
    status: 'offline',
    tone: 'offline',
    warningPip: false,
    source: 'live',
    isReadOnly: false,
    isActionable: true,
    sortLabel: 'gate-assembly',
    actionAuthority: {
      state: 'verified-supported',
      verifiedTarget: {
        structureId: '0xgate',
        structureType: 'gate',
        ownerCapId: '0xowner-cap',
        networkNodeId: '0xnode',
        status: 'offline',
      },
      candidateTargets: [],
      unavailableReason: null,
    },
    ...overrides,
  };
}

const offlineGate = getStructurePowerAction(makeStructure());
assert.deepEqual(offlineGate, {
  label: 'Bring online',
  nextOnline: true,
  disabledReason: null,
  tone: 'online',
});

const onlineGate = getStructurePowerAction(makeStructure({ status: 'online' }));
assert.deepEqual(onlineGate, {
  label: 'Take offline',
  nextOnline: false,
  disabledReason: null,
  tone: 'offline',
});

const missingNodeContextGate = getStructurePowerAction(makeStructure({ networkNodeId: undefined }));
assert.equal(missingNodeContextGate?.disabledReason, 'Missing node context.');

const offlineNode = getStructurePowerAction(makeStructure({ type: 'network_node', networkNodeId: undefined }));
assert.deepEqual(offlineNode, {
  label: 'Bring online',
  nextOnline: true,
  disabledReason: null,
  tone: 'online',
});

const onlineNode = getStructurePowerAction(makeStructure({ type: 'network_node', status: 'online', networkNodeId: undefined }));
assert.equal(onlineNode, null);

const availableOnlineNode = getStructurePowerAction(
  makeStructure({ type: 'network_node', status: 'online', networkNodeId: undefined }),
  { networkNodeOfflineAvailable: true },
);
assert.deepEqual(availableOnlineNode, {
  label: 'Take offline',
  nextOnline: false,
  disabledReason: null,
  tone: 'offline',
});

assert.equal(supportsStructureRename(makeStructure({ type: 'gate' })), true);
assert.equal(supportsStructureRename(makeStructure({ type: 'storage_unit' })), true);
assert.equal(supportsStructureRename(makeStructure({ type: 'turret' })), true);
assert.equal(supportsStructureRename(makeStructure({ type: 'network_node', networkNodeId: undefined })), true);

const nodeLocalPower = getNodeLocalPowerToggleIntent(makeNodeLocalStructure());
assert.deepEqual(nodeLocalPower, {
  actionLabel: 'Bring Online',
  currentStatus: 'offline',
  nextOnline: true,
});
assert.deepEqual(getNodeLocalPowerControlState(makeNodeLocalStructure()), {
  actionLabel: 'Bring Online',
  currentStatus: 'offline',
  nextOnline: true,
  selectedSegment: 'offline',
  isInteractive: true,
  isStatusOnly: false,
});

const hiddenVerifiedNodeLocal = makeNodeLocalStructure({
  actionAuthority: {
    state: 'verified-supported',
    verifiedTarget: {
      structureId: '0xgate',
      structureType: 'gate',
      ownerCapId: '0xowner-cap',
      networkNodeId: '0xnode',
      status: 'online',
    },
    candidateTargets: [],
    unavailableReason: null,
  },
});
assert.equal(supportsNodeLocalRename(hiddenVerifiedNodeLocal), true);
assert.deepEqual(getNodeLocalPowerToggleIntent(hiddenVerifiedNodeLocal), {
  actionLabel: 'Take Offline',
  currentStatus: 'online',
  nextOnline: false,
});
assert.deepEqual(getNodeLocalPowerControlState(hiddenVerifiedNodeLocal), {
  actionLabel: 'Take Offline',
  currentStatus: 'online',
  nextOnline: false,
  selectedSegment: 'online',
  isInteractive: true,
  isStatusOnly: false,
});

const verifiedPrinterNodeLocal = makeNodeLocalStructure({
  canonicalDomainKey: 'assembly:9104',
  displayName: 'Field Printer',
  typeLabel: 'Printer',
  family: 'printer',
  familyLabel: 'Printer',
  iconFamily: 'printer',
  band: 'industry',
  actionAuthority: {
    state: 'verified-supported',
    verifiedTarget: {
      structureId: '0xprinter',
      structureType: 'assembly',
      ownerCapId: '0xprinter-cap',
      networkNodeId: '0xnode',
      status: 'offline',
    },
    candidateTargets: [],
    unavailableReason: null,
  },
});
assert.equal(supportsNodeLocalRename(verifiedPrinterNodeLocal), true);
assert.equal(formatNodeLocalActionAuthorityLabel(verifiedPrinterNodeLocal), 'Action ready');
assert.equal(formatNodeLocalActionAuthorityDetail(verifiedPrinterNodeLocal), 'This printer can be controlled from this row.');
assert.equal(formatNodeLocalActionBadgeText(verifiedPrinterNodeLocal), 'Action ready');
assert.equal(formatNodeLocalActionTooltip(verifiedPrinterNodeLocal), 'Action ready');
assert.deepEqual(getNodeLocalPowerToggleIntent(verifiedPrinterNodeLocal), {
  actionLabel: 'Bring Online',
  currentStatus: 'offline',
  nextOnline: true,
});
assert.deepEqual(getNodeLocalPowerControlState(verifiedPrinterNodeLocal), {
  actionLabel: 'Bring Online',
  currentStatus: 'offline',
  nextOnline: true,
  selectedSegment: 'offline',
  isInteractive: true,
  isStatusOnly: false,
});

const backendOnlyNodeLocal = makeNodeLocalStructure({
  hasDirectChainAuthority: false,
  actionAuthority: {
    state: 'backend-only',
    verifiedTarget: null,
    candidateTargets: [],
    unavailableReason: 'No verified direct-chain target.',
  },
});
assert.equal(supportsNodeLocalRename(backendOnlyNodeLocal), false);
assert.equal(formatNodeLocalActionAuthorityLabel(backendOnlyNodeLocal), 'Control proof needed');
assert.equal(formatNodeLocalActionAuthorityDetail(backendOnlyNodeLocal), 'No verified direct-chain target.');
assert.equal(formatNodeLocalActionBadgeText(backendOnlyNodeLocal), 'Action unavailable: Control proof needed');
assert.equal(formatNodeLocalActionTooltip(backendOnlyNodeLocal), 'No verified direct-chain target.');
assert.equal(getNodeLocalPowerToggleIntent(backendOnlyNodeLocal), null);
assert.deepEqual(getNodeLocalPowerControlState(backendOnlyNodeLocal), {
  actionLabel: null,
  currentStatus: 'offline',
  nextOnline: null,
  selectedSegment: 'offline',
  isInteractive: false,
  isStatusOnly: true,
});

const futureSupportedNodeLocal = makeNodeLocalStructure({
  hasDirectChainAuthority: false,
  status: 'online',
  actionAuthority: {
    state: 'future-supported',
    verifiedTarget: null,
    candidateTargets: [],
    unavailableReason: 'Frontend action not implemented.',
  },
});
assert.equal(supportsNodeLocalRename(futureSupportedNodeLocal), false);
assert.equal(formatNodeLocalActionAuthorityLabel(futureSupportedNodeLocal), 'Control pending');
assert.equal(formatNodeLocalActionAuthorityDetail(futureSupportedNodeLocal), 'Control unavailable: this assembly type is not wired for power control yet.');
assert.equal(formatNodeLocalActionBadgeText(futureSupportedNodeLocal), 'Control pending');
assert.equal(formatNodeLocalActionTooltip(futureSupportedNodeLocal), 'Control unavailable: this assembly type is not wired for power control yet.');
assert.equal(getNodeLocalPowerToggleIntent(futureSupportedNodeLocal), null);
assert.deepEqual(getNodeLocalPowerControlState(futureSupportedNodeLocal), {
  actionLabel: null,
  currentStatus: 'online',
  nextOnline: null,
  selectedSegment: 'online',
  isInteractive: false,
  isStatusOnly: true,
});

const ambiguousNodeLocal = makeNodeLocalStructure({
  actionAuthority: {
    state: 'ambiguous-match',
    verifiedTarget: null,
    candidateTargets: [
      {
        structureId: '0xone',
        structureType: 'assembly',
        ownerCapId: '0xcap-one',
        networkNodeId: '0xnode',
        status: 'offline',
      },
      {
        structureId: '0xtwo',
        structureType: 'assembly',
        ownerCapId: '0xcap-two',
        networkNodeId: '0xnode',
        status: 'offline',
      },
    ],
    unavailableReason: null,
  },
});
assert.equal(formatNodeLocalActionAuthorityLabel(ambiguousNodeLocal), 'Match review needed (2)');
assert.equal(formatNodeLocalActionAuthorityDetail(ambiguousNodeLocal), 'Control is paused because 2 matching structures were found.');
assert.equal(formatNodeLocalActionBadgeText(ambiguousNodeLocal), 'Action unavailable: Match review needed (2)');
assert.equal(formatNodeLocalActionTooltip(ambiguousNodeLocal), 'Match review needed (2)');

const unsupportedNodeLocal = makeNodeLocalStructure({
  family: 'relay',
  familyLabel: 'Relay',
  typeLabel: 'Relay',
  actionAuthority: {
    state: 'unsupported-family',
    verifiedTarget: null,
    candidateTargets: [
      {
        structureId: '0xrelay',
        structureType: 'assembly',
        ownerCapId: '0xrelay-cap',
        networkNodeId: '0xnode',
        status: 'online',
      },
    ],
    unavailableReason: null,
  },
});
assert.equal(formatNodeLocalActionAuthorityLabel(unsupportedNodeLocal), 'Action not approved');
assert.equal(formatNodeLocalActionAuthorityDetail(unsupportedNodeLocal), 'This structure family is not approved for web power control in this release.');
assert.equal(formatNodeLocalActionBadgeText(unsupportedNodeLocal), 'Action unavailable: Action not approved');
assert.equal(formatNodeLocalActionTooltip(unsupportedNodeLocal), 'Action not approved');

const missingOwnerCapNodeLocal = makeNodeLocalStructure({
  actionAuthority: {
    state: 'missing-owner-cap',
    verifiedTarget: null,
    candidateTargets: [
      {
        structureId: '0xprinter',
        structureType: 'assembly',
        networkNodeId: '0xnode',
        status: 'offline',
      },
    ],
    unavailableReason: null,
  },
});
assert.equal(formatNodeLocalActionAuthorityLabel(missingOwnerCapNodeLocal), 'Control proof missing');
assert.equal(formatNodeLocalActionAuthorityDetail(missingOwnerCapNodeLocal), 'Control unavailable: owner cap not indexed.');
assert.equal(formatNodeLocalActionBadgeText(missingOwnerCapNodeLocal), 'Action unavailable: Control proof missing');
assert.equal(formatNodeLocalActionTooltip(missingOwnerCapNodeLocal), 'Control proof missing');

const missingObjectIdNodeLocal = makeNodeLocalStructure({
  actionAuthority: {
    state: 'missing-object-id',
    verifiedTarget: null,
    candidateTargets: [],
    unavailableReason: null,
  },
});
assert.equal(formatNodeLocalActionAuthorityLabel(missingObjectIdNodeLocal), 'Object ID missing');
assert.equal(formatNodeLocalActionAuthorityDetail(missingObjectIdNodeLocal), 'Control unavailable: missing object ID.');
assert.equal(formatNodeLocalActionBadgeText(missingObjectIdNodeLocal), 'Action unavailable: Object ID missing');
assert.equal(formatNodeLocalActionTooltip(missingObjectIdNodeLocal), 'Object ID missing');

const missingNodeContextNodeLocal = makeNodeLocalStructure({
  actionAuthority: {
    state: 'missing-node-context',
    verifiedTarget: null,
    candidateTargets: [
      {
        structureId: '0xstorage',
        structureType: 'storage_unit',
        ownerCapId: '0xstorage-cap',
        status: 'offline',
      },
    ],
    unavailableReason: null,
  },
});
assert.equal(formatNodeLocalActionAuthorityLabel(missingNodeContextNodeLocal), 'Node link missing');
assert.equal(formatNodeLocalActionAuthorityDetail(missingNodeContextNodeLocal), 'Control unavailable: linked network node not indexed.');
assert.equal(formatNodeLocalActionBadgeText(missingNodeContextNodeLocal), 'Action unavailable: Node link missing');
assert.equal(formatNodeLocalActionTooltip(missingNodeContextNodeLocal), 'Node link missing');

const syntheticNodeLocal = makeNodeLocalStructure({
  source: 'synthetic',
  hasDirectChainAuthority: false,
  actionAuthority: {
    state: 'synthetic',
    verifiedTarget: null,
    candidateTargets: [],
    unavailableReason: null,
  },
});
assert.equal(formatNodeLocalActionAuthorityLabel(syntheticNodeLocal), 'Lab preview');
assert.equal(formatNodeLocalActionAuthorityDetail(syntheticNodeLocal), 'Lab rows preview control state but never submit transactions.');
assert.equal(formatNodeLocalActionBadgeText(syntheticNodeLocal), 'Lab preview');
assert.equal(formatNodeLocalActionTooltip(syntheticNodeLocal), 'Lab preview');

const contextMenuSource = readFileSync(new URL('../src/components/structure-actions/StructureActionContextMenu.tsx', import.meta.url), 'utf8');
const structureSurfaceActionsSource = readFileSync(new URL('../src/hooks/useStructureSurfaceActions.tsx', import.meta.url), 'utf8');
const nodeDrilldownMenuHookSource = readFileSync(new URL('../src/hooks/useNodeDrilldownStructureMenu.ts', import.meta.url), 'utf8');
const structureMenuHookSource = readFileSync(new URL('../src/hooks/useStructureActionMenu.ts', import.meta.url), 'utf8');
assert.equal(contextMenuSource.includes('min-w-[172px]'), false, 'expected the shared action menu to stop forcing a wide minimum width');
assert.equal(contextMenuSource.includes('w-max'), true, 'expected the shared action menu to shrink-wrap to content width');
assert.equal(structureSurfaceActionsSource.includes('window.confirm'), false, 'expected network-node offline to avoid native browser confirm');
assert.equal(structureSurfaceActionsSource.includes('alert('), false, 'expected active structure actions to avoid native browser alert');
assert.equal(structureSurfaceActionsSource.includes('prompt('), false, 'expected active structure actions to avoid native browser prompt');
assert.equal(structureSurfaceActionsSource.includes('StructurePowerConfirmDialog'), true, 'expected network-node offline to use the app-styled confirmation dialog');
assert.equal(structureSurfaceActionsSource.includes('Rename Node'), true, 'expected node menus/dialogs to keep Rename Node copy');
assert.equal(structureSurfaceActionsSource.includes('Node Name'), true, 'expected node rename dialog to keep Node Name field copy');
assert.equal(nodeDrilldownMenuHookSource.includes('CONTEXT_MENU_WIDTH_PX = 196'), false, 'expected Node Control menu placement to stop assuming a fixed 196px width');
assert.equal(structureMenuHookSource.includes('CONTEXT_MENU_WIDTH_PX = 196'), false, 'expected structure action menu placement to stop assuming a fixed 196px width');
assert.equal(estimateContextMenuWidthPx(['Unhide']), 64, 'expected single short action menus to stay compact');
assert.equal(estimateContextMenuWidthPx(['Hide from Node View']), 155, 'expected hide-only menus to size from content');
assert.equal(
  estimateContextMenuWidthPx(['Hide from Node View', 'Take Offline', 'Rename Assembly']),
  155,
  'expected the longest current Node Control menu label to drive a compact width',
);
assert.equal(
  estimateContextMenuWidthPx(['Unhide', 'Take Offline', 'Rename Assembly']),
  127,
  'expected hidden-row menus to avoid the old wide clamp',
);
assert.equal(
  estimateContextMenuWidthPx(['Bring Online', 'Rename Assembly']),
  127,
  'expected global row action menus to stay balanced while fitting current labels',
);
assert.equal(
  estimateContextMenuWidthPx(['Take offline', 'Rename Node']),
  106,
  'expected node-self action menus to stay compact while fitting node labels',
);

console.log('structure action support check: ok');