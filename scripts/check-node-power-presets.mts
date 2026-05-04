import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildNodeChildBulkPowerPlan,
  buildNodePowerPresetApplyPlan,
  getNodePowerUsageReadout,
  groupNodePowerOperationTargets,
  NODE_POWER_CAPACITY_GJ,
  toStructureWriteTarget,
} from '../src/lib/nodePowerControlModel.ts';
import {
  buildNodePowerPresetStorageKey,
  buildNodePowerPresetTargets,
  getDefaultNodePowerPresetLabel,
  NODE_POWER_PRESET_LABEL_MAX_LENGTH,
  upsertNodePowerPresetSlot,
} from '../src/lib/nodePowerPresets.ts';

import type { NodeLocalStructure } from '../src/lib/nodeDrilldownTypes.ts';

function makeStructure(overrides: Partial<NodeLocalStructure> = {}): NodeLocalStructure {
  const id = overrides.id ?? 'storage-alpha';
  const canonicalDomainKey = overrides.canonicalDomainKey ?? `assembly:${id}`;
  const status = overrides.status ?? 'offline';
  const structureType = overrides.actionAuthority?.verifiedTarget?.structureType ?? 'storage_unit';
  const structureId = overrides.actionAuthority?.verifiedTarget?.structureId ?? `0x${id.replace(/[^a-f0-9]/gi, '').padEnd(4, '0')}`;

  return {
    id,
    canonicalDomainKey,
    objectId: structureId,
    assemblyId: canonicalDomainKey.startsWith('assembly:') ? canonicalDomainKey.slice('assembly:'.length) : null,
    directChainObjectId: structureId,
    directChainAssemblyId: null,
    hasDirectChainAuthority: true,
    directChainMatchCount: 1,
    futureActionEligible: false,
    displayName: overrides.displayName ?? 'Storage Alpha',
    typeLabel: overrides.typeLabel ?? 'Storage',
    family: overrides.family ?? 'tradePost',
    familyLabel: overrides.familyLabel ?? 'Storage',
    iconFamily: overrides.iconFamily ?? 'tradePost',
    band: overrides.band ?? 'logistics',
    sizeVariant: overrides.sizeVariant ?? 'standard',
    badge: overrides.badge ?? null,
    status,
    tone: status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'neutral',
    warningPip: false,
    source: 'backendMembership',
    backendSource: 'fixture',
    provenance: 'fixture',
    fetchedAt: null,
    lastUpdated: null,
    isReadOnly: false,
    isActionable: true,
    url: null,
    solarSystemId: null,
    energySourceId: '0xnode',
    fuelAmount: null,
    actionCandidate: null,
    actionAuthority: overrides.actionAuthority ?? {
      state: 'verified-supported',
      verifiedTarget: {
        structureId,
        structureType,
        ownerCapId: `0xcap-${id}`,
        networkNodeId: '0xnode',
        status,
      },
      candidateTargets: [],
      unavailableReason: null,
    },
    sortLabel: overrides.sortLabel ?? id,
    ...overrides,
  };
}

const onlineStorage = makeStructure({ id: 'online-storage', canonicalDomainKey: 'assembly:1001', status: 'online', displayName: 'Online Storage' });
const offlineTurret = makeStructure({
  id: 'offline-turret',
  canonicalDomainKey: 'object:0xturret',
  status: 'offline',
  displayName: 'Offline Turret',
  family: 'turret',
  familyLabel: 'Turret',
  iconFamily: 'turret',
  band: 'defense',
  actionAuthority: {
    state: 'verified-supported',
    verifiedTarget: {
      structureId: '0xturret',
      structureType: 'turret',
      ownerCapId: '0xturret-cap',
      networkNodeId: '0xnode',
      status: 'offline',
    },
    candidateTargets: [],
    unavailableReason: null,
  },
});
const hiddenOnlineGate = makeStructure({
  id: 'hidden-gate',
  canonicalDomainKey: 'assembly:1002',
  status: 'online',
  displayName: 'Hidden Gate',
  family: 'gate',
  familyLabel: 'Gate',
  iconFamily: 'gate',
  band: 'corridor',
  actionAuthority: {
    state: 'verified-supported',
    verifiedTarget: {
      structureId: '0xgate',
      structureType: 'gate',
      ownerCapId: '0xgate-cap',
      networkNodeId: '0xnode',
      status: 'online',
    },
    candidateTargets: [],
    unavailableReason: null,
  },
});
const otherNodeStructure = makeStructure({ id: 'other-node-storage', canonicalDomainKey: 'assembly:9001', status: 'online', displayName: 'Other Node Storage' });

const selectedNodeChildren = [onlineStorage, offlineTurret, hiddenOnlineGate];

const takeOfflinePlan = buildNodeChildBulkPowerPlan(selectedNodeChildren, false);
assert.deepEqual(
  takeOfflinePlan.targets.map((target) => target.structure.id).sort(),
  ['hidden-gate', 'online-storage'],
  'expected Take all offline to target only online selected-node children, including hidden rows',
);
assert.equal(takeOfflinePlan.capacityReason, null, 'expected offline bulk not to require power-capacity confirmation');

const bringOnlinePlan = buildNodeChildBulkPowerPlan(selectedNodeChildren, true);
assert.deepEqual(
  bringOnlinePlan.targets.map((target) => target.structure.id),
  ['offline-turret'],
  'expected Bring all online to target only offline selected-node children',
);
assert.equal(bringOnlinePlan.capacityReason, 'Power requirement unavailable', 'expected online bulk to require capacity-unavailable confirmation when no GJ data exists');

const otherNodeTakeOfflinePlan = buildNodeChildBulkPowerPlan([otherNodeStructure], false);
assert(!takeOfflinePlan.targets.some((target) => target.structure.id === otherNodeTakeOfflinePlan.targets[0]?.structure.id), 'expected selected-node bulk plans not to include structures from other nodes');

const allOfflinePlan = buildNodeChildBulkPowerPlan([offlineTurret], false);
assert.equal(allOfflinePlan.disabledReason, 'no structures need changing', 'expected no-op bulk offline state to be calm and disabled');

const presetTargets = buildNodePowerPresetTargets(selectedNodeChildren);
assert.equal(presetTargets.length, 3, 'expected preset save to include exact online/offline child states');
assert(presetTargets.some((target) => target.canonicalDomainKey === hiddenOnlineGate.canonicalDomainKey), 'expected hidden child rows to be saved into power presets');

const slots = upsertNodePowerPresetSlot([null, null, null, null], {
  label: 'Industry Safe Long Label',
  nodeId: '0xnode',
  slotIndex: 2,
  structures: selectedNodeChildren,
});
assert.equal(slots[1]?.label.length, NODE_POWER_PRESET_LABEL_MAX_LENGTH, 'expected preset labels to be compacted for header buttons');
assert.equal(slots[0], null, 'expected saving one preset not to populate empty slots');

const applySlot = slots[1];
assert(applySlot, 'expected preset slot 2 to be populated');
const nextChildren = [
  makeStructure({ id: 'online-storage', canonicalDomainKey: 'assembly:1001', status: 'online', displayName: 'Online Storage Renamed' }),
  makeStructure({
    ...offlineTurret,
    status: 'online',
    tone: 'online',
    actionAuthority: {
      ...offlineTurret.actionAuthority,
      verifiedTarget: offlineTurret.actionAuthority.verifiedTarget
        ? { ...offlineTurret.actionAuthority.verifiedTarget, status: 'online' }
        : null,
    },
  }),
  makeStructure({ id: 'new-storage', canonicalDomainKey: 'assembly:7777', status: 'offline', displayName: 'New Storage' }),
];
const presetApplyPlan = buildNodePowerPresetApplyPlan(applySlot, nextChildren);
assert.deepEqual(
  presetApplyPlan.targets.map((target) => [target.structure.id, target.desiredOnline]),
  [['offline-turret', false]],
  'expected preset apply to diff only changed referenced children and leave new structures unchanged',
);
assert(!presetApplyPlan.targets.some((target) => target.structure.family === 'networkNode'), 'expected preset apply never to include the network node itself');

const missingOnlyPlan = buildNodePowerPresetApplyPlan(applySlot, []);
assert.equal(missingOnlyPlan.disabledReason, 'no connected child structures', 'expected all-missing preset references to fail calmly');

const emptyPresetPlan = buildNodePowerPresetApplyPlan(null, selectedNodeChildren);
assert.equal(emptyPresetPlan.disabledReason, 'preset slot empty', 'expected empty preset buttons to be disabled');

const groups = groupNodePowerOperationTargets([...takeOfflinePlan.targets, ...bringOnlinePlan.targets]);
assert(groups.some((group) => group.structureType === 'gate' && group.desiredOnline === false), 'expected mixed-family targets to group by structure type and desired state');
assert(groups.some((group) => group.structureType === 'turret' && group.desiredOnline === true), 'expected online targets to stay in their own batch group');

const hiddenWriteTarget = takeOfflinePlan.targets.find((target) => target.structure.id === hiddenOnlineGate.id);
assert(hiddenWriteTarget, 'expected hidden online child to be present in the offline write plan');
const writeTarget = toStructureWriteTarget(hiddenWriteTarget);
assert.equal(writeTarget.canonicalDomainKey, hiddenOnlineGate.canonicalDomainKey, 'expected write overlays to carry canonical child identity');
assert.equal(writeTarget.networkNodeId, '0xnode', 'expected child write target to retain selected network-node context');

const readout = getNodePowerUsageReadout();
assert.equal(readout.label, 'Power usage unavailable', 'expected unavailable meter state to render calm operator copy');
assert.equal(readout.capacityGJ, NODE_POWER_CAPACITY_GJ, 'expected the node capacity constant to stay pinned at 1000 GJ');
assert.equal(readout.isAvailable, false, 'expected current data-source audit to keep exact power usage unavailable');

assert.equal(
  buildNodePowerPresetStorageKey('0xnode', 'character:0xabc'),
  'cc:node-power-presets:v1:character:0xabc:0xnode',
  'expected character-scoped preset storage key',
);
assert.equal(
  buildNodePowerPresetStorageKey('0xnode', null),
  'cc:node-power-presets:v1:session:0xnode',
  'expected session-safe preset storage fallback key',
);
assert.equal(getDefaultNodePowerPresetLabel(4), 'Preset 4', 'expected default slot label copy');

const dashboardSource = readFileSync('src/screens/Dashboard.tsx', 'utf8');
assert(dashboardSource.includes('targets: group.targets.map(toStructureWriteTarget)'), 'expected node-local bulk/preset writes to pass per-child overlay targets');
assert(dashboardSource.includes('structurePower.toggleBatch'), 'expected node-local bulk/preset writes to reuse the existing batch power path');
assert(dashboardSource.includes('Power requirements are not available for this node.'), 'expected capacity-unavailable online actions to use an app modal instead of silent pass-through');

console.log('Node power presets and child bulk planning checks passed.');