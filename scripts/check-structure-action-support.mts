import assert from 'node:assert/strict';

import { getNodeLocalPowerToggleIntent, supportsNodeLocalRename } from '../src/lib/nodeDrilldownActionAuthority.ts';
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
  label: 'Bring Online',
  nextOnline: true,
  disabledReason: null,
  tone: 'online',
});

const onlineGate = getStructurePowerAction(makeStructure({ status: 'online' }));
assert.deepEqual(onlineGate, {
  label: 'Take Offline',
  nextOnline: false,
  disabledReason: null,
  tone: 'offline',
});

const missingNodeContextGate = getStructurePowerAction(makeStructure({ networkNodeId: undefined }));
assert.equal(missingNodeContextGate?.disabledReason, 'Missing node context.');

const offlineNode = getStructurePowerAction(makeStructure({ type: 'network_node', networkNodeId: undefined }));
assert.deepEqual(offlineNode, {
  label: 'Bring Online',
  nextOnline: true,
  disabledReason: null,
  tone: 'online',
});

const onlineNode = getStructurePowerAction(makeStructure({ type: 'network_node', status: 'online', networkNodeId: undefined }));
assert.equal(onlineNode, null);

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
assert.equal(getNodeLocalPowerToggleIntent(backendOnlyNodeLocal), null);

console.log('structure action support check: ok');