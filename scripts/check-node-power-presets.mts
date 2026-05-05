import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildNodeChildBulkPowerPlan,
  buildNodePowerPresetApplyPlan,
  filterNodePowerPlanForOperatorInventory,
  filterNodePowerPlanForTargetStatuses,
  getNodePowerUsageReadout,
  groupNodePowerOperationTargets,
  NODE_POWER_CAPACITY_GJ,
  toMixedAssemblyPowerTarget,
  toStructureWriteTarget,
} from '../src/lib/nodePowerControlModel.ts';
import {
  buildNodePowerPresetStorageKey,
  buildNodePowerPresetTargets,
  getDefaultNodePowerPresetLabel,
  NODE_POWER_PRESET_LABEL_MAX_LENGTH,
  upsertNodePowerPresetSlot,
} from '../src/lib/nodePowerPresets.ts';
import { buildMixedAssemblyPowerTx } from '../src/lib/structurePowerTx.ts';
import { WORLD_RUNTIME_PACKAGE_ID } from '../src/constants.ts';

import type { NodeLocalStructure } from '../src/lib/nodeDrilldownTypes.ts';
import type { OperatorInventoryResponse, OperatorInventoryStructure } from '../src/types/operatorInventory.ts';

type Command = {
  $kind: string;
  MoveCall?: {
    target?: string;
    package?: string;
    module?: string;
    function?: string;
  };
};

function getMoveTargets(commands: Command[]): string[] {
  return commands
    .filter((command) => command.$kind === 'MoveCall')
    .map((command) => {
      const moveCall = command.MoveCall;
      if (moveCall?.target) return moveCall.target;
      return `${moveCall?.package}::${moveCall?.module}::${moveCall?.function}`;
    });
}

function objectId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, '0')}`;
}

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
    status: 'unknown',
    networkNodeId: null,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: null,
    characterId: null,
    extensionStatus: 'none',
    fuelAmount: null,
    powerSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: null,
    lastObservedTimestamp: null,
    lastUpdated: '2026-05-04T12:00:00.000Z',
    source: 'operator-inventory',
    provenance: 'operator-inventory',
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

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
assert.equal(writeTarget.desiredStatus, 'offline', 'expected child write targets to carry per-target status for mixed preset overlays');

const mixedPlanTargets = [...takeOfflinePlan.targets, ...bringOnlinePlan.targets];
const mixedPowerTargets = mixedPlanTargets.map(toMixedAssemblyPowerTarget);
assert.deepEqual(
  mixedPowerTargets.map((target) => [target.structureType, target.online]),
  [['storage_unit', false], ['gate', false], ['turret', true]],
  'expected mixed Node Control plans to preserve per-target type and desired state for one PTB',
);
const mixedMoveTargets = getMoveTargets(buildMixedAssemblyPowerTx({
  characterId: objectId(500),
  targets: mixedPowerTargets.map((target, index) => ({
    ...target,
    structureId: objectId(600 + index),
    ownerCapId: objectId(700 + index),
    networkNodeId: objectId(800),
  })),
}).getData().commands as Command[]);
assert.deepEqual(
  mixedMoveTargets,
  [
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::storage_unit::offline`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::gate::offline`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::turret::online`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
  ],
  'expected mixed-family preset apply to build one transaction command sequence instead of grouped submissions',
);

const freshInventory: OperatorInventoryResponse = {
  schemaVersion: 'operator-inventory.v1',
  operator: null,
  networkNodes: [
    {
      node: makeInventoryStructure({ objectId: '0xnode', family: 'networkNode', displayName: 'Node Alpha', status: 'online' }),
      structures: [
        makeInventoryStructure({ objectId: onlineStorage.actionAuthority.verifiedTarget!.structureId, assemblyId: '1001', ownerCapId: '0xcap-online-storage', family: 'storage', displayName: 'Online Storage', status: 'online', networkNodeId: '0xnode' }),
        makeInventoryStructure({ objectId: hiddenOnlineGate.actionAuthority.verifiedTarget!.structureId, assemblyId: '1002', ownerCapId: '0xgate-cap', family: 'gate', displayName: 'Hidden Gate', status: 'offline', networkNodeId: '0xnode' }),
        makeInventoryStructure({ objectId: offlineTurret.actionAuthority.verifiedTarget!.structureId, assemblyId: null, ownerCapId: '0xturret-cap', family: 'turret', displayName: 'Offline Turret', status: 'offline', networkNodeId: '0xnode' }),
      ],
    },
  ],
  unlinkedStructures: [],
  warnings: [],
  partial: false,
  source: 'operator-inventory',
  fetchedAt: '2026-05-04T12:00:00.000Z',
};
const filteredOfflinePlan = filterNodePowerPlanForOperatorInventory(takeOfflinePlan, freshInventory, '0xnode');
assert.deepEqual(
  filteredOfflinePlan.targets.map((target) => target.structure.id),
  ['online-storage'],
  'expected preflight operator-inventory refresh to drop children that already reached the requested status',
);

const staleRawOnlineRefinery = makeStructure({
  id: 'stale-refinery',
  canonicalDomainKey: 'object:stale-refinery',
  status: 'online',
  displayName: 'Stale Refinery',
  family: 'refinery',
  familyLabel: 'Refinery',
  iconFamily: 'refinery',
  band: 'industry',
  actionAuthority: {
    state: 'verified-supported',
    verifiedTarget: {
      structureId: objectId(901),
      structureType: 'assembly',
      ownerCapId: objectId(902),
      networkNodeId: objectId(903),
      status: 'online',
    },
    candidateTargets: [],
    unavailableReason: null,
  },
});
const staleRawTakeOfflinePlan = buildNodeChildBulkPowerPlan([staleRawOnlineRefinery], false);
const chainFilteredOfflinePlan = filterNodePowerPlanForTargetStatuses(
  staleRawTakeOfflinePlan,
  new Map([[objectId(901), 'offline']]),
);
assert.equal(
  chainFilteredOfflinePlan.disabledReason,
  'no structures need changing',
  'expected direct-chain OFFLINE evidence to drop stale raw-online children before PTB build',
);
assert.equal(chainFilteredOfflinePlan.targets.length, 0, 'expected stale raw-online Take all offline target list to be empty before wallet prompt');

const offlinePresetSlot = upsertNodePowerPresetSlot([null, null, null, null], {
  label: 'Offline State',
  nodeId: objectId(903),
  slotIndex: 1,
  structures: [{ ...staleRawOnlineRefinery, status: 'offline' }],
})[0];
assert(offlinePresetSlot, 'expected offline preset fixture to save');
const staleRawPresetApplyPlan = buildNodePowerPresetApplyPlan(offlinePresetSlot, [staleRawOnlineRefinery]);
assert.equal(staleRawPresetApplyPlan.targets.length, 1, 'expected stale raw-online preset apply to produce one offline target before chain proof');
const chainFilteredPresetPlan = filterNodePowerPlanForTargetStatuses(
  staleRawPresetApplyPlan,
  new Map([[objectId(901), 'offline']]),
);
assert.equal(chainFilteredPresetPlan.targets.length, 0, 'expected direct-chain OFFLINE evidence to drop stale raw-online preset target before wallet prompt');

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
assert(dashboardSource.includes('operatorInventory.refetch()'), 'expected node-local bulk/preset writes to refresh operator inventory before final target selection');
assert(dashboardSource.includes('filterNodePowerPlanForOperatorInventory'), 'expected node-local bulk/preset writes to filter stale already-in-state children before PTB build');
assert(dashboardSource.includes('fetchStructurePowerChainStatuses'), 'expected node-local bulk/preset writes to direct-chain preflight final targets before PTB build');
assert(dashboardSource.includes('filterNodePowerPlanForTargetStatuses'), 'expected node-local bulk/preset writes to remove chain-confirmed already-in-state targets before PTB build');
assert(dashboardSource.includes('targets: executionPlan.targets.map(toStructureWriteTarget)'), 'expected node-local bulk/preset writes to pass per-child overlay targets');
assert(dashboardSource.includes('structurePower.toggleMixed'), 'expected node-local bulk/preset writes to submit one mixed child-power PTB');
assert(!dashboardSource.includes('groupNodePowerOperationTargets(plan.targets)'), 'expected Node Control execution not to loop grouped child batches');
assert(dashboardSource.includes('Power requirements are not available for this node.'), 'expected capacity-unavailable online actions to use an app modal instead of silent pass-through');

console.log('Node power presets and child bulk planning checks passed.');