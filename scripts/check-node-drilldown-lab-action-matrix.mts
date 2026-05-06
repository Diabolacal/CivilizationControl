import assert from 'node:assert/strict';

import {
  formatNodeLocalActionAuthorityDetail,
  getNodeLocalPowerControlState,
  supportsNodeLocalRename,
} from '../src/lib/nodeDrilldownActionAuthority.ts';
import { buildNodeDrilldownMenuItems } from '../src/lib/nodeDrilldownMenuItems.ts';
import { describeNodeLocalWarningMarker } from '../src/lib/nodeDrilldownModel.ts';
import { NODE_DRILLDOWN_SCENARIOS } from '../src/lib/nodeDrilldownScenarios.ts';

import type { StructureActionTargetType } from '../src/types/domain.ts';
import type { NodeLocalStructure } from '../src/lib/nodeDrilldownTypes.ts';

interface LabActionMatrixRow {
  scenarioId: string;
  scenarioLabel: string;
  rowId: string;
  displayName: string;
  family: NodeLocalStructure['family'];
  size: NodeLocalStructure['sizeVariant'];
  status: NodeLocalStructure['status'];
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  canonicalDomainKey: string;
  source: NodeLocalStructure['source'];
  sourceMode: string;
  actionCandidatePower: NodeLocalStructure['actionCandidate'] extends { actions: { power: infer T } } ? T : null;
  actionCandidateRename: NodeLocalStructure['actionCandidate'] extends { actions: { rename: infer T } } ? T : null;
  normalizedStructureActionTargetType: StructureActionTargetType | null;
  verifiedTarget: NodeLocalStructure['actionAuthority']['verifiedTarget'];
  candidateTargets: NodeLocalStructure['actionAuthority']['candidateTargets'];
  actionAuthorityState: NodeLocalStructure['actionAuthority']['state'];
  menuItems: string[];
  railState: ReturnType<typeof getNodeLocalPowerControlState>;
  renameSupported: boolean;
  isHiddenFromMap: boolean;
  warningDetail: string | null;
  unavailableReason: string | null;
}

function deriveNormalizedStructureActionTargetType(
  structure: NodeLocalStructure,
): StructureActionTargetType | null {
  if (structure.actionAuthority.verifiedTarget) {
    return structure.actionAuthority.verifiedTarget.structureType;
  }

  const uniqueTypes = Array.from(new Set(
    structure.actionAuthority.candidateTargets.map((candidate) => candidate.structureType),
  ));

  return uniqueTypes.length === 1 ? uniqueTypes[0] ?? null : null;
}

function deriveOwnerCapId(structure: NodeLocalStructure): string | null {
  if (structure.actionAuthority.verifiedTarget?.ownerCapId) {
    return structure.actionAuthority.verifiedTarget.ownerCapId;
  }

  const ownerCapIds = Array.from(new Set(
    structure.actionAuthority.candidateTargets
      .map((candidate) => candidate.ownerCapId ?? null)
      .filter((ownerCapId): ownerCapId is string => Boolean(ownerCapId)),
  ));

  return ownerCapIds.length === 1 ? ownerCapIds[0] ?? null : null;
}

function buildMenuLabels(structure: NodeLocalStructure, isHiddenFromMap: boolean): string[] {
  const powerControl = getNodeLocalPowerControlState(structure);

  return buildNodeDrilldownMenuItems({
    contextMenu: {
      structureId: structure.id,
      canonicalDomainKey: structure.canonicalDomainKey,
      structureName: structure.displayName,
      left: 120,
      top: 80,
      visibilityAction: isHiddenFromMap ? 'unhide' : 'hide',
      visibilityActionLabel: isHiddenFromMap ? 'Unhide' : 'Hide from Node View',
      powerActionLabel: powerControl.actionLabel,
      nextOnline: powerControl.nextOnline,
    },
    structure,
    onHideStructure: () => undefined,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
    onRenameStructure: () => undefined,
  }).map((item) => item.label);
}

function toMatrixRow(
  scenarioId: string,
  scenarioLabel: string,
  sourceMode: string,
  hiddenCanonicalKeySet: Set<string>,
  structure: NodeLocalStructure,
): LabActionMatrixRow {
  const railState = getNodeLocalPowerControlState(structure);
  const renameSupported = supportsNodeLocalRename(structure);
  const isHiddenFromMap = hiddenCanonicalKeySet.has(structure.canonicalDomainKey);
  const menuItems = buildMenuLabels(structure, isHiddenFromMap);

  return {
    scenarioId,
    scenarioLabel,
    rowId: structure.id,
    displayName: structure.displayName,
    family: structure.family,
    size: structure.sizeVariant,
    status: structure.status,
    objectId: structure.objectId ?? null,
    assemblyId: structure.assemblyId ?? null,
    ownerCapId: deriveOwnerCapId(structure),
    canonicalDomainKey: structure.canonicalDomainKey,
    source: structure.source,
    sourceMode,
    actionCandidatePower: structure.actionCandidate?.actions.power ?? null,
    actionCandidateRename: structure.actionCandidate?.actions.rename ?? null,
    normalizedStructureActionTargetType: deriveNormalizedStructureActionTargetType(structure),
    verifiedTarget: structure.actionAuthority.verifiedTarget,
    candidateTargets: structure.actionAuthority.candidateTargets,
    actionAuthorityState: structure.actionAuthority.state,
    menuItems,
    railState,
    renameSupported,
    isHiddenFromMap,
    warningDetail: describeNodeLocalWarningMarker(structure),
    unavailableReason: structure.actionAuthority.verifiedTarget
      ? null
      : structure.actionAuthority.unavailableReason ?? formatNodeLocalActionAuthorityDetail(structure),
  };
}

function rowHasExecutableActions(row: LabActionMatrixRow): boolean {
  return row.menuItems.includes('Rename Assembly')
    && (row.menuItems.includes('Bring Online') || row.menuItems.includes('Take Offline'));
}

function assertFamilyCoverage(matrix: LabActionMatrixRow[]) {
  const assertActionableFamily = (family: LabActionMatrixRow['family'], reason: string) => {
    assert(
      matrix.some((row) => row.family === family && rowHasExecutableActions(row)),
      reason,
    );
  };

  assertActionableFamily('gate', 'expected at least one controllable gate row in the lab matrix');
  assertActionableFamily('tradePost', 'expected at least one controllable storage row in the lab matrix');
  assertActionableFamily('turret', 'expected at least one controllable turret row in the lab matrix');
  assertActionableFamily('printer', 'expected at least one controllable printer row in the lab matrix');
  assertActionableFamily('refinery', 'expected at least one controllable refinery row in the lab matrix');
  assertActionableFamily('assembler', 'expected at least one controllable assembler row in the lab matrix');
  assertActionableFamily('berth', 'expected at least one controllable berth row in the lab matrix');
  assertActionableFamily('relay', 'expected at least one controllable relay row in the lab matrix');
  assertActionableFamily('nursery', 'expected at least one controllable nursery row in the lab matrix');
  assertActionableFamily('nest', 'expected at least one controllable nest row in the lab matrix');
  assertActionableFamily('shelter', 'expected at least one controllable shelter row in the lab matrix');
}

function assertScenarioCoverage(matrix: LabActionMatrixRow[]) {
  const scenarioLabels = new Set(matrix.map((row) => row.scenarioLabel));
  const requiredLabels = [
    'Power Summary Known',
    'Power Summary Over Cap',
    'Power Summary Unknown',
    'Authority Matrix',
    'Sparse Solo Nodes',
    'Node Gate Industry Node',
    'No-Gate Industry Node',
    'No-Gate Dense Manufacturing',
    'Mixed Operating Base',
    'Support Clutter Test',
    'Defense Heavy Node',
    'Turret Stress Test',
  ];

  assert.equal(
    scenarioLabels.size,
    NODE_DRILLDOWN_SCENARIOS.length,
    'expected the lab action matrix to cover every active node-drilldown lab scenario',
  );

  for (const requiredLabel of requiredLabels) {
    assert(scenarioLabels.has(requiredLabel), `expected ${requiredLabel} to be present in the lab action matrix`);
  }

  assert(
    matrix.some((row) => row.scenarioLabel === 'Mixed Operating Base' && row.family === 'printer' && rowHasExecutableActions(row)),
    'expected Mixed Operating Base to include a controllable generic assembly row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Turret Stress Test' && row.family === 'turret' && rowHasExecutableActions(row)),
    'expected Turret Stress Test to include a controllable turret row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Node Gate Industry Node' && row.family === 'gate' && rowHasExecutableActions(row)),
    'expected Node Gate Industry Node to include a controllable gate row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Node Gate Industry Node' && row.family === 'tradePost' && rowHasExecutableActions(row)),
    'expected Node Gate Industry Node to include a controllable storage row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Sparse Solo Nodes' && row.family === 'tradePost' && rowHasExecutableActions(row)),
    'expected Sparse Solo Nodes to include a controllable storage row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Sparse Solo Nodes' && row.family === 'turret' && rowHasExecutableActions(row)),
    'expected Sparse Solo Nodes to include a controllable turret row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'No-Gate Industry Node' && row.family === 'relay' && rowHasExecutableActions(row)),
    'expected No-Gate Industry Node to include a controllable support-family row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'No-Gate Dense Manufacturing' && row.family === 'refinery' && rowHasExecutableActions(row)),
    'expected No-Gate Dense Manufacturing to include a controllable refinery row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'No-Gate Dense Manufacturing' && row.family === 'shelter' && rowHasExecutableActions(row)),
    'expected No-Gate Dense Manufacturing to include a controllable shelter row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Support Clutter Test' && row.family === 'relay' && rowHasExecutableActions(row)),
    'expected Support Clutter Test to include a controllable relay row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Support Clutter Test' && row.family === 'nest' && rowHasExecutableActions(row)),
    'expected Support Clutter Test to include a controllable nest row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Defense Heavy Node' && row.family === 'gate' && rowHasExecutableActions(row)),
    'expected Defense Heavy Node to include a controllable gate row',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Defense Heavy Node' && row.family === 'turret' && row.warningDetail === 'Warning status reported for this structure.'),
    'expected Defense Heavy Node to preserve warning-marker explanation text for warning turret rows without unproven extension attention',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Defense Heavy Node' && row.family === 'turret' && row.renameSupported && row.menuItems.includes('Rename Assembly')),
    'expected Defense Heavy Node warning turrets to keep rename access while power remains status-only',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Authority Matrix' && row.displayName === 'Assembler Delta' && row.actionAuthorityState === 'missing-owner-cap' && row.unavailableReason === 'Authority proof is unavailable for this structure.'),
    'expected Authority Matrix to retain the missing control proof example and exact read-only reason',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Authority Matrix' && row.displayName === 'Gate Zeta' && row.actionAuthorityState === 'ambiguous-match' && row.unavailableReason === 'Control is paused because 2 matching structures were found.'),
    'expected Authority Matrix to retain the ambiguous-match example and exact read-only reason',
  );
  assert(
    matrix.some((row) => row.scenarioLabel === 'Authority Matrix' && row.displayName === 'Gate Eta' && row.actionAuthorityState === 'missing-node-context' && row.unavailableReason === 'Linked node context is unavailable for this structure.'),
    'expected Authority Matrix to retain the missing node context example and exact read-only reason',
  );
}

const matrix = NODE_DRILLDOWN_SCENARIOS.flatMap((scenario) => {
  const hiddenCanonicalKeySet = new Set(scenario.initialHiddenCanonicalKeys ?? []);

  return scenario.viewModel.structures.map((structure) => (
    toMatrixRow(
      scenario.id,
      scenario.label,
      scenario.viewModel.sourceMode,
      hiddenCanonicalKeySet,
      structure,
    )
  ));
});

const summary = NODE_DRILLDOWN_SCENARIOS.map((scenario) => {
  const scenarioRows = matrix.filter((row) => row.scenarioId === scenario.id);
  return {
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    totalRows: scenarioRows.length,
    executableRows: scenarioRows.filter(rowHasExecutableActions).length,
    hideOnlyRows: scenarioRows.filter((row) => row.menuItems.length === 1).length,
    syntheticRows: scenarioRows.filter((row) => row.actionAuthorityState === 'synthetic').length,
  };
});

console.log(JSON.stringify({
  scenarioCount: NODE_DRILLDOWN_SCENARIOS.length,
  rowCount: matrix.length,
  summary,
  matrix,
}, null, 2));

assert.equal(NODE_DRILLDOWN_SCENARIOS.length >= 9, true, 'expected at least nine active lab scenarios');
assertScenarioCoverage(matrix);
assertFamilyCoverage(matrix);

console.log('node drilldown lab action matrix check: ok');
