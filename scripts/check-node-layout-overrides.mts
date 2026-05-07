import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  applyNodeDrilldownPositionOverrides,
  clampNodeDrilldownPosition,
  layoutNodeDrilldown,
} from '../src/lib/nodeDrilldownLayout.ts';
import {
  buildNodeDrilldownLayoutStorageKey,
  setNodeDrilldownLayoutOverride,
  type NodeDrilldownLayoutOverrides,
} from '../src/lib/nodeDrilldownLayoutOverrides.ts';
import { partitionNodeDrilldownStructures } from '../src/lib/nodeDrilldownHiddenState.ts';
import { NODE_DRILLDOWN_SCENARIOS } from '../src/lib/nodeDrilldownScenarios.ts';

const scenario = NODE_DRILLDOWN_SCENARIOS.find((entry) => entry.id === 'authority-matrix') ?? NODE_DRILLDOWN_SCENARIOS[0];
assert(scenario, 'expected at least one node-drilldown scenario');

const viewModel = scenario.viewModel;
const targetStructure = viewModel.structures.find((structure) => structure.displayName === 'Storage Alpha') ?? viewModel.structures[0];
assert(targetStructure, 'expected a target structure for layout override checks');

const baseLayout = layoutNodeDrilldown(viewModel);
const baseTarget = baseLayout.structures.find((item) => item.id === targetStructure.id);
assert(baseTarget, 'expected target structure in the default layout');

const overrides = setNodeDrilldownLayoutOverride({}, targetStructure.canonicalDomainKey, { xPercent: 83.333, yPercent: 17.777 });
const overrideTarget = applyNodeDrilldownPositionOverrides(baseLayout, viewModel.structures, overrides).structures.find((item) => item.id === targetStructure.id);
assert(overrideTarget, 'expected target structure after override application');
assert.notEqual(overrideTarget.xPercent, baseTarget.xPercent, 'expected manual override to change only the target x position');
assert.equal(overrideTarget.xPercent, 83.33, 'expected stored manual x position to use logical percentage coordinates');
assert.equal(overrideTarget.yPercent, 17.78, 'expected stored manual y position to use logical percentage coordinates');

const rebuiltTarget = applyNodeDrilldownPositionOverrides(layoutNodeDrilldown(viewModel), viewModel.structures, overrides).structures.find((item) => item.id === targetStructure.id);
assert.equal(rebuiltTarget?.xPercent, overrideTarget.xPercent, 'expected manual override to survive a rebuilt view model/layout pass');

const unaffected = applyNodeDrilldownPositionOverrides(baseLayout, viewModel.structures, overrides).structures.filter((item) => item.id !== targetStructure.id);
const unaffectedBase = new Map(baseLayout.structures.filter((item) => item.id !== targetStructure.id).map((item) => [item.id, item]));
assert(unaffected.every((item) => item.xPercent === unaffectedBase.get(item.id)?.xPercent && item.yPercent === unaffectedBase.get(item.id)?.yPercent), 'expected override to apply only to the selected structure');

const clamped = clampNodeDrilldownPosition({ xPercent: -50, yPercent: 180 }, { canvasWidth: 880, canvasHeight: 440, iconSize: 24 });
assert(clamped.xPercent >= 9 && clamped.xPercent <= 91, 'expected dragged x coordinate to clamp to the usable map area');
assert(clamped.yPercent >= 10 && clamped.yPercent <= 90, 'expected dragged y coordinate to clamp to the usable map area');

const hiddenCanonicalKeySet = new Set([targetStructure.canonicalDomainKey]);
const partitioned = partitionNodeDrilldownStructures(viewModel.structures, hiddenCanonicalKeySet);
const hiddenLayout = applyNodeDrilldownPositionOverrides(layoutNodeDrilldown({ ...viewModel, structures: partitioned.visibleStructures }), partitioned.visibleStructures, overrides);
assert(!hiddenLayout.structures.some((item) => item.id === targetStructure.id), 'expected hidden structures not to render while hidden');
const restoredLayout = applyNodeDrilldownPositionOverrides(layoutNodeDrilldown(viewModel), viewModel.structures, overrides);
assert.equal(
  restoredLayout.structures.find((item) => item.id === targetStructure.id)?.xPercent,
  overrideTarget.xPercent,
  'expected unhidden structures to reappear at their stored manual position',
);

const resetOverrides: NodeDrilldownLayoutOverrides = {};
const resetTarget = applyNodeDrilldownPositionOverrides(baseLayout, viewModel.structures, resetOverrides).structures.find((item) => item.id === targetStructure.id);
assert.equal(resetTarget?.xPercent, baseTarget.xPercent, 'expected reset layout to return to algorithmic x position');
assert.equal(resetTarget?.yPercent, baseTarget.yPercent, 'expected reset layout to return to algorithmic y position');

assert.equal(
  buildNodeDrilldownLayoutStorageKey('0xnode', 'wallet:0xabc'),
  'cc:node-drilldown:layout:v1:wallet:0xabc:0xnode',
  'expected wallet-scoped layout storage key',
);
assert.equal(
  buildNodeDrilldownLayoutStorageKey('0xnode', null),
  'cc:node-drilldown:layout:v1:session:0xnode',
  'expected session-scoped layout storage fallback key',
);
assert.notEqual(
  buildNodeDrilldownLayoutStorageKey('0xnode', 'wallet:0xabc'),
  'cc:node-power-presets:v1:wallet:0xabc:0xnode',
  'expected layout persistence to stay separate from power presets',
);

const surfaceSource = readFileSync('src/components/topology/node-drilldown/NodeDrilldownSurface.tsx', 'utf8');
const canvasSource = readFileSync('src/components/topology/node-drilldown/NodeDrilldownCanvas.tsx', 'utf8');
assert(surfaceSource.includes('Reset Layout'), 'expected Node Control surface to expose a Reset Layout control');
assert(canvasSource.includes('onContextMenu'), 'expected right-click context menus to remain wired after drag support');
assert(canvasSource.includes('suppressClickStructureIdRef'), 'expected drag threshold behavior to suppress accidental click selection');
assert(canvasSource.includes('Power usage unavailable') === false, 'expected power readout copy to come from the model, not debug canvas text');

console.log('Node layout override checks passed.');
