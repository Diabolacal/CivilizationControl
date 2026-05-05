import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { adaptOperatorInventory } from '../src/lib/operatorInventoryAdapter.ts';
import { buildLiveNodeLocalViewModelWithObserved } from '../src/lib/nodeDrilldownModel.ts';
import { NODE_DRILLDOWN_SCENARIOS } from '../src/lib/nodeDrilldownScenarios.ts';
import {
  buildNodeChildBulkPowerPlan,
  buildNodePowerPresetApplyPlan,
  evaluateNodePowerCapacity,
  evaluateNodePowerPlanCapacity,
  getNodePowerUsageReadout,
  NODE_POWER_CAPACITY_GJ,
} from '../src/lib/nodePowerControlModel.ts';
import { upsertNodePowerPresetSlot } from '../src/lib/nodePowerPresets.ts';

import type { NodeLocalStructure } from '../src/lib/nodeDrilldownTypes.ts';
import type { OperatorInventoryResponse, OperatorInventoryStructure } from '../src/types/operatorInventory.ts';

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
    powerRequirement: null,
    powerUsageSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: null,
    lastObservedTimestamp: null,
    lastUpdated: '2026-05-05T12:00:00.000Z',
    source: 'operator-inventory',
    provenance: 'operator-inventory',
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

function forceOnline(structure: NodeLocalStructure): NodeLocalStructure {
  return {
    ...structure,
    status: 'online',
    tone: 'online',
    actionAuthority: structure.actionAuthority.verifiedTarget
      ? {
          ...structure.actionAuthority,
          verifiedTarget: {
            ...structure.actionAuthority.verifiedTarget,
            status: 'online',
          },
        }
      : structure.actionAuthority,
  };
}

const knownScenario = NODE_DRILLDOWN_SCENARIOS.find((entry) => entry.id === 'power-summary-known');
const overCapScenario = NODE_DRILLDOWN_SCENARIOS.find((entry) => entry.id === 'power-summary-over-cap');
const unknownScenario = NODE_DRILLDOWN_SCENARIOS.find((entry) => entry.id === 'power-summary-unknown');

assert(knownScenario, 'expected a known-power lab scenario');
assert(overCapScenario, 'expected an over-cap lab scenario');
assert(unknownScenario, 'expected an unknown-power lab scenario');

const knownReadout = getNodePowerUsageReadout(knownScenario.viewModel.node);
assert.equal(knownReadout.label, 'Power 320 / 1000 GJ', 'expected known indexed node load to render a numeric readout');
assert.equal(knownReadout.capacityGJ, NODE_POWER_CAPACITY_GJ, 'expected numeric readout to retain the fixed node capacity');
assert.equal(knownReadout.isAvailable, true, 'expected known indexed node load to mark the readout available');

const hiddenCanonicalKeySet = new Set(knownScenario.initialHiddenCanonicalKeys ?? []);
const visibleKnownOnlineLoad = knownScenario.viewModel.structures
  .filter((structure) => !hiddenCanonicalKeySet.has(structure.canonicalDomainKey))
  .filter((structure) => structure.status === 'online')
  .reduce((sum, structure) => sum + (structure.powerRequirement?.requiredGj ?? 0), 0);
assert.equal(visibleKnownOnlineLoad, 120, 'expected the visible rows alone to undercount the hidden online child load');
assert.equal(knownScenario.viewModel.node.powerUsageSummary?.usedGj, 320, 'expected the indexed node summary to retain hidden child load');

const unknownReadout = getNodePowerUsageReadout(unknownScenario.viewModel.node);
assert.equal(unknownReadout.label, 'Power usage unavailable', 'expected partial node summaries to keep the calm unavailable readout');
assert.equal(unknownReadout.capacityGJ, NODE_POWER_CAPACITY_GJ, 'expected unavailable readout to retain the node capacity ceiling');
assert.equal(unknownReadout.isAvailable, false, 'expected partial node summaries to keep the readout unavailable');

const knownCapacity = evaluateNodePowerCapacity(knownScenario.viewModel.node, knownScenario.viewModel.structures);
assert.equal(knownCapacity.status, 'ok', 'expected the under-cap lab fixture to stay actionable');
assert.equal(knownCapacity.allOnlineLoadGj, 770, 'expected the under-cap lab fixture to surface the full all-online load');
assert.equal(knownCapacity.canVerify, true, 'expected the under-cap lab fixture to be fully verifiable');

const overCapBringOnlinePlan = buildNodeChildBulkPowerPlan(overCapScenario.viewModel.structures, true);
assert.equal(overCapBringOnlinePlan.targets.length, 2, 'expected over-cap Bring all online to target only the offline child rows');
const overCapBringOnlineCheck = evaluateNodePowerPlanCapacity(
  overCapScenario.viewModel.node,
  overCapScenario.viewModel.structures,
  overCapBringOnlinePlan.targets,
);
assert.equal(overCapBringOnlineCheck.status, 'over-cap', 'expected Bring all online to block before the wallet when indexed load would exceed capacity');
assert.equal(overCapBringOnlineCheck.proposedLoadGj, 1120, 'expected Bring all online to compute the final indexed load before wallet approval');
assert.equal(overCapBringOnlineCheck.reason, 'This node would exceed 1000 GJ if those structures were online.', 'expected over-cap actions to expose a calm deterministic reason');

const takeOfflinePlan = buildNodeChildBulkPowerPlan(overCapScenario.viewModel.structures, false);
assert.equal(takeOfflinePlan.capacityReason, null, 'expected Take all offline never to require a capacity confirmation');
const takeOfflineCheck = evaluateNodePowerPlanCapacity(
  overCapScenario.viewModel.node,
  overCapScenario.viewModel.structures,
  takeOfflinePlan.targets,
);
assert.notEqual(takeOfflineCheck.status, 'over-cap', 'expected Take all offline never to be blocked for capacity');

const overCapAllOnlineStructures = overCapScenario.viewModel.structures.map(forceOnline);
const overCapPresetSlot = upsertNodePowerPresetSlot([null, null, null, null], {
  label: 'All Online',
  nodeId: overCapScenario.viewModel.node.id,
  slotIndex: 1,
  structures: overCapAllOnlineStructures,
})[0];
assert(overCapPresetSlot, 'expected the over-cap preset fixture to save');
const overCapPresetApplyPlan = buildNodePowerPresetApplyPlan(overCapPresetSlot, overCapScenario.viewModel.structures);
assert.equal(overCapPresetApplyPlan.targets.length, 2, 'expected preset apply to diff only the offline rows that would turn on');
const overCapPresetApplyCheck = evaluateNodePowerPlanCapacity(
  overCapScenario.viewModel.node,
  overCapScenario.viewModel.structures,
  overCapPresetApplyPlan.targets,
);
assert.equal(overCapPresetApplyCheck.status, 'over-cap', 'expected preset apply to block before wallet when the desired online set exceeds capacity');

const currentOverCapNode = {
  ...overCapScenario.viewModel.node,
  powerUsageSummary: {
    ...overCapScenario.viewModel.node.powerUsageSummary,
    capacityGj: 1000,
    usedGj: 1120,
    availableGj: -120,
    onlineKnownLoadGj: 1120,
    totalKnownLoadGj: 1120,
    totalUnknownLoadCount: 0,
  },
};
const currentOverCapCheck = evaluateNodePowerCapacity(currentOverCapNode, overCapAllOnlineStructures);
assert.equal(currentOverCapCheck.status, 'over-cap', 'expected saving an already-over-cap online set to be blocked');
assert.equal(currentOverCapCheck.proposedLoadGj, 1120, 'expected preset-save blocking to evaluate the current saved online set');

const unknownBringOnlinePlan = buildNodeChildBulkPowerPlan(unknownScenario.viewModel.structures, true);
assert.equal(unknownBringOnlinePlan.targets.length, 1, 'expected the unknown-power fixture to keep the single offline target in scope');
const unknownBringOnlineCheck = evaluateNodePowerPlanCapacity(
  unknownScenario.viewModel.node,
  unknownScenario.viewModel.structures,
  unknownBringOnlinePlan.targets,
);
assert.equal(unknownBringOnlineCheck.status, 'unavailable', 'expected unknown node load to block false confidence for online actions');
assert.equal(unknownBringOnlineCheck.reason, 'Power requirement unavailable', 'expected unknown node load to surface the calm unavailable reason');
assert.equal(unknownBringOnlineCheck.requiredUnknownCount, 1, 'expected the unknown-power fixture to record the missing required GJ row');
assert.equal(unknownBringOnlineCheck.canVerify, false, 'expected unknown node load to stay unverifiable');

const nodeId = objectId(1);
const storageId = objectId(101);
const gateId = objectId(102);
const inventory: OperatorInventoryResponse = {
  schemaVersion: 'operator-inventory.v1',
  operator: null,
  networkNodes: [
    {
      node: makeInventoryStructure({
        objectId: nodeId,
        family: 'networkNode',
        displayName: 'Indexed Load Node',
        status: 'online',
        powerUsageSummary: {
          capacityGj: 1000,
          usedGj: 320,
          availableGj: 680,
          onlineKnownLoadGj: 320,
          onlineUnknownLoadCount: 0,
          totalKnownLoadGj: 770,
          totalUnknownLoadCount: 0,
          source: 'indexed_children',
          confidence: 'indexed',
          lastUpdated: '2026-05-05T12:00:00.000Z',
        },
      }),
      structures: [
        makeInventoryStructure({
          objectId: storageId,
          assemblyId: '1001',
          ownerCapId: objectId(201),
          family: 'storage',
          displayName: 'Storage Alpha',
          status: 'online',
          networkNodeId: nodeId,
          powerRequirement: {
            requiredGj: 120,
            source: 'indexed_type',
            confidence: 'indexed',
            typeId: 84868,
            family: 'storage',
            size: 'standard',
            lastUpdated: '2026-05-05T12:00:00.000Z',
          },
        }),
        makeInventoryStructure({
          objectId: gateId,
          assemblyId: '1002',
          ownerCapId: objectId(202),
          family: 'gate',
          displayName: 'Gate Beta',
          size: 'mini',
          status: 'online',
          networkNodeId: nodeId,
          powerRequirement: {
            requiredGj: 200,
            source: 'indexed_type',
            confidence: 'indexed',
            typeId: 84869,
            family: 'gate',
            size: 'mini',
            lastUpdated: '2026-05-05T12:00:00.000Z',
          },
        }),
      ],
    },
  ],
  unlinkedStructures: [],
  warnings: [],
  partial: false,
  source: 'operator-inventory',
  fetchedAt: '2026-05-05T12:00:00.000Z',
};

const adapted = adaptOperatorInventory(inventory);
const adaptedNodeGroup = adapted.nodeGroups[0];
assert(adaptedNodeGroup, 'expected adapted node groups for indexed power mapping');
assert.equal(adaptedNodeGroup.node.indexedPowerUsageSummary?.usedGj, 320, 'expected the adapter to preserve indexed node power usage summaries');
const adaptedGate = adapted.structures.find((structure) => structure.objectId === gateId);
assert.equal(adaptedGate?.indexedPowerRequirement?.requiredGj, 200, 'expected the adapter to preserve indexed child power requirements');

const lookup = adapted.nodeLookupsByNodeId.get(nodeId);
assert(lookup, 'expected a selected-node lookup for indexed power mapping');
const liveViewModel = buildLiveNodeLocalViewModelWithObserved(adaptedNodeGroup, lookup, { preferObservedMembership: true });
assert.equal(liveViewModel.node.powerUsageSummary?.usedGj, 320, 'expected the node-local model to preserve indexed node power usage summaries');
assert.equal(
  liveViewModel.structures.find((structure) => structure.objectId === gateId)?.powerRequirement?.requiredGj,
  200,
  'expected the node-local model to preserve indexed child power requirements',
);

const dashboardSource = readFileSync('src/screens/Dashboard.tsx', 'utf8');
assert(dashboardSource.includes('evaluateNodePowerCapacity'), 'expected the dashboard to evaluate preset-save capacity before opening the save dialog');
assert(dashboardSource.includes('evaluateNodePowerPlanCapacity'), 'expected the dashboard to evaluate final bulk/preset capacity before the wallet step');
assert(dashboardSource.includes('mode: "blocked"'), 'expected over-cap plans to use the app modal in blocked mode instead of native alerts');
assert(!/window\.alert\s*\(/.test(dashboardSource), 'expected dashboard capacity handling not to use native alerts');
assert(!/window\.confirm\s*\(/.test(dashboardSource), 'expected dashboard capacity handling not to use native confirms');

const presetDialogSource = readFileSync('src/components/topology/node-drilldown/NodePowerPresetDialog.tsx', 'utf8');
assert(presetDialogSource.includes('saveBlockedReason'), 'expected the preset dialog to surface a calm inline blocked reason');

const labSource = readFileSync('src/screens/NodeDrilldownLabScreen.tsx', 'utf8');
assert(labSource.includes('getNodePowerUsageReadout(scenarioViewModel?.node ?? null)'), 'expected the dev lab to render the node power readout from the scenario node summary');

console.log('Node power capacity checks passed.');
