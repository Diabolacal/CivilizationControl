import assert from "node:assert/strict";

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import {
  buildNodeChildBulkPowerPlan,
  inspectNodePowerPlanForFreshInventory,
  inspectNodePowerPlanForChainEligibility,
} from "../src/lib/nodePowerControlModel.ts";
import {
  formatNodePowerOutcomeReason,
  summarizeNodePowerBulkOutcome,
} from "../src/lib/nodePowerBulkOutcomeModel.ts";
import { getFailedTransactionMessage } from "../src/lib/transactionExecutionErrors.ts";
import { classifyStructurePowerError, formatStructurePowerError } from "../src/lib/structurePowerErrors.ts";
import {
  resolveAlreadyOfflineCorrectionTarget,
  resolvePowerErrorDesiredStatus,
  resolvePowerErrorTarget,
} from "../src/lib/structurePowerFailureResolution.ts";
import { resolveStructurePowerChainSnapshot, resolveStructurePowerChainStatusFromContent } from "../src/lib/structurePowerChainStatus.ts";
import {
  applyStructureWriteOverlaysToOperatorInventory,
  createPendingStructureWriteOverlay,
  resolveStructureWriteConfirmation,
  type StructureWriteTarget,
} from "../src/lib/structureWriteReconciliation.ts";
import { DEFAULT_SUI_RPC_URL } from "../src/constants.ts";

import type { OperatorInventoryResponse, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";
import type { NodeLocalStructure } from "../src/lib/nodeDrilldownTypes.ts";

function makeChainSnapshot(
  normalizedStructureId: string,
  state: "online" | "offline" | "neutral" | "missing_content" | "missing_object" | "unexpected_variant",
  statusVariant?: string | null,
) {
  const chainStatus = state === "online"
    ? "online"
    : state === "offline"
      ? "offline"
      : state === "neutral"
        ? "neutral"
        : null;
  return {
    normalizedStructureId,
    chainStatus,
    statusVariant: statusVariant ?? (state === "online" ? "ONLINE" : state === "offline" ? "OFFLINE" : state === "neutral" ? "NULL" : null),
    state,
  };
}

function getArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function objectId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, "0")}`;
}

function normalizeObjectId(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]+$/.test(trimmed)) return null;
  const hex = trimmed.slice(2);
  if (hex.length === 0 || hex.length > 64) return null;
  return `0x${hex.padStart(64, "0")}`;
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
    status: "unknown",
    networkNodeId: null,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: null,
    characterId: null,
    extensionStatus: "none",
    fuelAmount: null,
    powerSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: null,
    lastObservedTimestamp: null,
    lastUpdated: "2026-05-05T12:00:00.000Z",
    source: "operator-inventory",
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: null,
    ...overrides,
  };
}

function normalizeInventoryStatus(status: string | null | undefined): "online" | "offline" | "neutral" {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "online") return "online";
  if (normalized === "offline") return "offline";
  return "neutral";
}

function makeNodeControlStructureFromLiveRow(row: OperatorInventoryStructure): NodeLocalStructure | null {
  const objectId = row.objectId ?? null;
  const ownerCapId = row.ownerCapId ?? null;
  const networkNodeId = row.networkNodeId ?? row.actionCandidate?.actions.power?.requiredIds?.networkNodeId ?? null;
  const status = normalizeInventoryStatus(row.status);
  if (!objectId || !ownerCapId || !networkNodeId || (status !== "online" && status !== "offline")) {
    return null;
  }

  return {
    id: objectId,
    canonicalDomainKey: `object:${objectId.toLowerCase()}`,
    objectId,
    assemblyId: row.assemblyId,
    directChainObjectId: objectId,
    directChainAssemblyId: row.assemblyId,
    hasDirectChainAuthority: true,
    directChainMatchCount: 1,
    futureActionEligible: false,
    displayName: row.displayName ?? row.name ?? "Structure",
    typeLabel: row.typeName ?? row.assemblyType ?? row.family ?? "Structure",
    family: "refinery",
    familyLabel: row.family ?? "Structure",
    iconFamily: "refinery",
    band: "industry",
    sizeVariant: row.size ?? "standard",
    badge: null,
    status,
    tone: status,
    warningPip: false,
    source: "backendMembership",
    backendSource: row.source ?? "operator-inventory",
    provenance: row.provenance ?? "operator-inventory",
    fetchedAt: null,
    lastUpdated: row.lastUpdated,
    isReadOnly: false,
    isActionable: true,
    url: row.url,
    solarSystemId: row.solarSystemId,
    energySourceId: row.energySourceId,
    fuelAmount: row.fuelAmount,
    actionCandidate: row.actionCandidate,
    actionAuthority: {
      state: "verified-supported",
      verifiedTarget: {
        structureId: objectId,
        structureType: "assembly",
        ownerCapId,
        networkNodeId,
        status,
      },
      candidateTargets: [],
      unavailableReason: null,
    },
    sortLabel: row.displayName ?? objectId,
  };
}

function makeInventory(status: "online" | "offline"): OperatorInventoryResponse {
  const nodeId = objectId(10);
  return {
    schemaVersion: "operator-inventory.v1",
    operator: null,
    networkNodes: [
      {
        node: makeInventoryStructure({
          objectId: nodeId,
          assemblyId: "9001",
          ownerCapId: objectId(11),
          family: "networkNode",
          displayName: "Node Alpha",
          typeName: "Network Node",
          assemblyType: "network_node",
          status: "online",
        }),
        structures: [
          makeInventoryStructure({
            objectId: objectId(101),
            assemblyId: "4101",
            ownerCapId: objectId(201),
            family: "storage",
            displayName: "Storage Alpha",
            typeName: "Storage",
            assemblyType: "storage_unit",
            status,
            networkNodeId: nodeId,
            actionCandidate: {
              actions: {
                power: {
                  candidate: true,
                  currentlyImplementedInCivilizationControl: true,
                  familySupported: true,
                  indexedOwnerCapPresent: true,
                  requiredIds: {
                    structureId: objectId(101),
                    structureType: "storage_unit",
                    ownerCapId: objectId(201),
                    networkNodeId: nodeId,
                  },
                  unavailableReason: null,
                },
                rename: null,
              },
            },
          }),
        ],
      },
    ],
    unlinkedStructures: [],
    warnings: [],
    partial: false,
    source: "operator-inventory",
    fetchedAt: "2026-05-05T12:00:00.000Z",
  };
}

async function loadChainSnapshotMap(
  client: SuiJsonRpcClient,
  structureIds: readonly string[],
) {
  if (structureIds.length === 0) {
    return new Map();
  }

  const responses = await client.multiGetObjects({
    ids: structureIds,
    options: { showContent: true, showType: true },
  }).catch(() => []);

  return structureIds.reduce((accumulator, structureId, index) => {
    const normalizedStructureId = normalizeObjectId(structureId);
    if (!normalizedStructureId) {
      return accumulator;
    }

    const response = responses[index];
    if (!response) {
      return accumulator;
    }

    accumulator.set(normalizedStructureId, resolveStructurePowerChainSnapshot(response, normalizedStructureId));
    return accumulator;
  }, new Map());
}

async function buildLiveNodeBulkReport(
  client: SuiJsonRpcClient,
  inventory: OperatorInventoryResponse,
  nodeObjectId: string,
  desiredOnline: boolean,
) {
  const normalizedNodeObjectId = normalizeObjectId(nodeObjectId);
  const adapted = adaptOperatorInventory(inventory);
  const nodeGroup = adapted.nodeGroups.find((group) => normalizeObjectId(group.node.objectId) === normalizedNodeObjectId);
  if (!nodeGroup) {
    return {
      error: "node_not_found",
      nodeObjectId,
      action: desiredOnline ? "bring-online" : "take-offline",
    };
  }

  const nodeLookup = adapted.nodeLookupsByNodeId.get(nodeGroup.node.objectId);
  const viewModel = buildLiveNodeLocalViewModelWithObserved(nodeGroup, nodeLookup, { preferObservedMembership: true });
  const plan = buildNodeChildBulkPowerPlan(viewModel.structures, desiredOnline);
  const inventoryEvaluation = inspectNodePowerPlanForFreshInventory(plan, inventory, nodeGroup.node.objectId);
  const chainSnapshots = await loadChainSnapshotMap(
    client,
    inventoryEvaluation.targets.map((target) => target.verifiedTarget.structureId),
  );
  const chainEvaluation = inspectNodePowerPlanForChainEligibility(inventoryEvaluation, chainSnapshots);
  const evaluation = {
    ...chainEvaluation,
    decisions: [...inventoryEvaluation.decisions, ...chainEvaluation.decisions],
  };
  const outcome = summarizeNodePowerBulkOutcome(plan, evaluation);

  return {
    nodeObjectId: nodeGroup.node.objectId,
    nodeDisplayName: nodeGroup.node.displayName ?? nodeGroup.node.name ?? null,
    action: desiredOnline ? "bring-online" : "take-offline",
    planDisabledReason: plan.disabledReason,
    finalDisabledReason: evaluation.disabledReason,
    requestedCount: outcome.requestedCount,
    submittedCount: outcome.submittedCount,
    alreadyCorrectCount: outcome.alreadyCorrectCount,
    heldCount: outcome.heldCount,
    currentRows: viewModel.structures.map((structure) => ({
      objectId: structure.objectId,
      displayName: structure.displayName,
      currentUiStatus: structure.status,
    })),
    includedInTransaction: evaluation.targets.map((target) => ({
      objectId: target.verifiedTarget.structureId,
      displayName: target.structure.displayName,
      desiredStatus: target.desiredOnline ? "online" : "offline",
    })),
    excludedAlreadyInTargetState: outcome.alreadyCorrectEntries.map((entry) => ({
      displayName: entry.displayName,
      reason: entry.reason,
      reasonLabel: formatNodePowerOutcomeReason(entry.reason),
    })),
    excludedHeld: outcome.heldEntries.map((entry) => ({
      displayName: entry.displayName,
      reason: entry.reason,
      reasonLabel: formatNodePowerOutcomeReason(entry.reason),
    })),
  };
}

function firstNodeControlStructureStatus(inventory: OperatorInventoryResponse) {
  const adapted = adaptOperatorInventory(inventory);
  const group = adapted.nodeGroups[0];
  assert(group, "expected fixture to adapt into one network-node group");
  const lookup = adapted.nodeLookupsByNodeId.get(group.node.objectId);
  const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
  const structure = viewModel.structures[0];
  assert(structure, "expected fixture to render one Node Control child row");
  return { structure, controlState: getNodeLocalPowerControlState(structure), sourceMode: viewModel.sourceMode };
}

const rawOffline = makeInventory("offline");
const offlineResult = firstNodeControlStructureStatus(rawOffline);
assert.equal(offlineResult.structure.status, "offline", "expected raw operator-inventory offline status to adapt to offline");
assert.equal(offlineResult.controlState.actionLabel, "Bring Online", "expected offline Node Control rows not to offer Take offline");

const staleOnline = makeInventory("online");
const target: StructureWriteTarget = {
  objectId: objectId(101),
  structureType: "storage_unit",
  ownerCapId: objectId(201),
  networkNodeId: objectId(10),
  assemblyId: "4101",
  canonicalDomainKey: "assembly:4101",
  displayName: "Storage Alpha",
  desiredStatus: "offline",
};
const offlineCorrection = createPendingStructureWriteOverlay({
  action: "power",
  digest: null,
  target,
  desiredStatus: "offline",
});
const correctedInventory = applyStructureWriteOverlaysToOperatorInventory(staleOnline, [offlineCorrection]);
assert(correctedInventory, "expected offline correction overlay to apply to stale inventory");
const correctedResult = firstNodeControlStructureStatus(correctedInventory);
assert.equal(correctedResult.structure.status, "offline", "expected local already-offline evidence to override stale raw online status");
assert.equal(correctedResult.controlState.actionLabel, "Bring Online", "expected locally corrected offline rows not to offer Take offline");
assert.equal(correctedResult.sourceMode, "backend-membership", "expected the proof to exercise the operator-inventory Node Control path");

const onlineCorrection = createPendingStructureWriteOverlay({
  action: "power",
  digest: null,
  target: {
    ...target,
    desiredStatus: "online",
  },
  desiredStatus: "online",
});
const correctedOnlineInventory = applyStructureWriteOverlaysToOperatorInventory(rawOffline, [onlineCorrection]);
assert(correctedOnlineInventory, "expected online correction overlay to apply to stale offline inventory");
const correctedOnlineResult = firstNodeControlStructureStatus(correctedOnlineInventory);
assert.equal(correctedOnlineResult.structure.status, "online", "expected local already-online evidence to override stale raw offline status");
assert.equal(correctedOnlineResult.controlState.actionLabel, "Take Offline", "expected locally corrected online rows not to offer Bring online");

const staleOnlineNodeControl = firstNodeControlStructureStatus(staleOnline);
const staleOnlinePlan = buildNodeChildBulkPowerPlan([staleOnlineNodeControl.structure], false);
assert.equal(staleOnlinePlan.targets.length, 1, "expected stale raw online child to enter the offline plan before chain proof");
const chainCorrectedPlan = inspectNodePowerPlanForChainEligibility(staleOnlinePlan, new Map([[objectId(101), makeChainSnapshot(objectId(101), "offline")]]));
assert.equal(chainCorrectedPlan.targets.length, 0, "expected direct-chain offline status to exclude stale raw online child from final PTB targets");

const staleOfflineNodeControl = firstNodeControlStructureStatus(rawOffline);
const staleOfflinePlan = buildNodeChildBulkPowerPlan([staleOfflineNodeControl.structure], true);
assert.equal(staleOfflinePlan.targets.length, 1, "expected stale raw offline child to enter the online plan before chain proof");
const chainFilteredOnlinePlan = inspectNodePowerPlanForChainEligibility(staleOfflinePlan, new Map([[objectId(101), makeChainSnapshot(objectId(101), "online")]]));
assert.equal(chainFilteredOnlinePlan.targets.length, 0, "expected direct-chain online status to exclude stale raw offline child from final Bring online PTB targets");
assert.equal(chainFilteredOnlinePlan.disabledReason, "No eligible structures to bring online.", "expected stale Bring online plans to become calm no-ops after final chain proof");
const chainEligibleOnlinePlan = inspectNodePowerPlanForChainEligibility(staleOfflinePlan, new Map([[objectId(101), makeChainSnapshot(objectId(101), "offline")]]));
assert.equal(chainEligibleOnlinePlan.targets.length, 1, "expected direct-chain offline status to keep valid Bring online targets");

const staleConfirmation = resolveStructureWriteConfirmation(staleOnline, null, offlineCorrection);
assert.equal(staleConfirmation.statusConfirmed, false, "expected stale raw online data not to clear an offline correction overlay");
const confirmedCorrection = resolveStructureWriteConfirmation(rawOffline, null, offlineCorrection);
assert.equal(confirmedCorrection.statusConfirmed, true, "expected raw offline data to confirm and clear the offline correction overlay");

const offlineAbort = "Transaction resolution failed: MoveAbort in 2nd command, 'EAssemblyInvalidStatus': Assembly status is invalid, in '0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780::status::offline' line 97.";
assert.equal(classifyStructurePowerError(offlineAbort, { desiredStatus: "offline" }), "target_already_offline");
assert.equal(formatStructurePowerError(offlineAbort, { desiredStatus: "offline" }), "Already offline. View updated.");
assert.equal(classifyStructurePowerError(offlineAbort, { desiredStatus: "online" }), "target_already_in_state", "expected offline abort evidence not to be swallowed for online attempts");

const onlineAbort = "Transaction resolution failed: MoveAbort in 1st command, 'EAssemblyInvalidStatus': Assembly status is invalid, in '0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780::status::online' line 90.";
assert.equal(classifyStructurePowerError(onlineAbort, { desiredStatus: "online" }), "target_invalid_online_state", "expected status::online aborts to classify as invalid online source state");
assert.equal(formatStructurePowerError(onlineAbort, { desiredStatus: "online" }), "Cannot bring online from current chain status.", "expected status::online aborts not to be reported as generic already-in-state success");
assert.equal(classifyStructurePowerError(onlineAbort, { desiredStatus: "offline" }), "target_already_in_state", "expected status::online abort evidence to retain the legacy generic already-in-state classification outside the online-intent path");

const unrelatedAbort = "Transaction resolution failed: MoveAbort in 1st command, 'ESomeOtherAbort': not our status path.";
assert.equal(classifyStructurePowerError(unrelatedAbort, { desiredStatus: "offline" }), null, "expected unrelated MoveAbort not to classify as already offline");
assert.equal(formatStructurePowerError(unrelatedAbort, { desiredStatus: "offline" }), unrelatedAbort, "expected unrelated MoveAbort to surface raw failure copy");

const failedTransactionMessage = getFailedTransactionMessage({ error: offlineAbort });
assert.equal(failedTransactionMessage, offlineAbort, "expected wallet FailedTransaction errors to preserve resolution abort details for classification");
assert.equal(
  resolvePowerErrorDesiredStatus(failedTransactionMessage, null, { targets: [target] }),
  "offline",
  "expected wallet-resolution abort mapping to recover offline intent from the failed target",
);
assert.deepEqual(
  resolveAlreadyOfflineCorrectionTarget(failedTransactionMessage, null, { targets: [target] }),
  target,
  "expected wallet-resolution status::offline abort to map to the failed target before recording a correction",
);
assert.deepEqual(
  resolvePowerErrorTarget(onlineAbort, null, { targets: [{ ...target, desiredStatus: "online" }] }, "online"),
  { ...target, desiredStatus: "online" },
  "expected wallet-resolution status::online abort to map to the failed target before proving or rejecting a correction",
);
assert.equal(
  resolveAlreadyOfflineCorrectionTarget("MoveAbort: status::offline EAssemblyInvalidStatus", null, { targets: [target, { ...target, objectId: objectId(102), desiredStatus: "offline" }] }),
  null,
  "expected unmapped multi-target offline aborts not to record unrelated corrections",
);

assert.equal(
  resolveStructurePowerChainStatusFromContent({
    status: { fields: { status: { variant: "OFFLINE" } } },
  }),
  "offline",
  "expected direct-chain status parser to read OFFLINE assembly content",
);
assert.equal(
  resolveStructurePowerChainStatusFromContent({
    status: { fields: { status: { variant: "ONLINE" } } },
  }),
  "online",
  "expected direct-chain status parser to read ONLINE assembly content",
);

const wallet = getArg("wallet");
const object = getArg("object");
const node = getArg("node");
const action = getArg("action");
const desiredOnline = action === "bring-online" || action === "online"
  ? true
  : action === "take-offline" || action === "offline"
    ? false
    : null;
if (wallet && (object || (node && desiredOnline != null))) {
  const url = new URL("https://ef-map.com/api/civilization-control/operator-inventory");
  url.searchParams.set("walletAddress", wallet);
  const response = await fetch(url, { headers: { Origin: "https://civilizationcontrol.com" } });
  const body = await response.json() as OperatorInventoryResponse;
  const allRows = body.networkNodes.flatMap((group, groupIndex) => [
    { location: "networkNodes.node", groupIndex, childIndex: null, nodeObjectId: group.node.objectId, row: group.node },
    ...group.structures.map((row, childIndex) => ({
      location: "networkNodes.structures",
      groupIndex,
      childIndex,
      nodeObjectId: group.node.objectId,
      row,
    })),
  ]).concat(body.unlinkedStructures.map((row, index) => ({
    location: "unlinkedStructures",
    groupIndex: null,
    childIndex: index,
    nodeObjectId: null,
    row,
  })));
  const row = object
    ? allRows.find((entry) => entry.row.objectId?.toLowerCase() === object.toLowerCase())
    : null;
  const client = new SuiJsonRpcClient({ url: DEFAULT_SUI_RPC_URL, network: "testnet" });
  const liveNodeBulk = node && desiredOnline != null
    ? await buildLiveNodeBulkReport(client, body, node, desiredOnline)
    : null;

  async function getChainSnapshot(objectId: string | null | undefined) {
    const normalized = objectId ? normalizeObjectId(objectId) : null;
    if (!normalized) {
      return { normalizedObjectId: normalized, chainStatus: null, snapshotState: null, statusVariant: null };
    }

    const objectResponse = await client.getObject({
      id: normalized,
      options: { showContent: true, showType: true },
    }).catch(() => null);
    if (!objectResponse) {
      return { normalizedObjectId: normalized, chainStatus: null, snapshotState: "missing_object", statusVariant: null };
    }

    const snapshot = resolveStructurePowerChainSnapshot(objectResponse, normalized);
    return {
      normalizedObjectId: normalized,
      chainStatus: snapshot.chainStatus,
      snapshotState: snapshot.state,
      statusVariant: snapshot.statusVariant,
    };
  }

  const chainObjectId = object ? normalizeObjectId(object) : null;
  const chainSnapshot = object
    ? await getChainSnapshot(object)
    : { normalizedObjectId: null, chainStatus: null, snapshotState: null, statusVariant: null };
  const liveStructure = row ? makeNodeControlStructureFromLiveRow(row.row) : null;
  const rawOfflinePlan = liveStructure ? buildNodeChildBulkPowerPlan([liveStructure], false) : null;
  const rawOnlinePlan = liveStructure ? buildNodeChildBulkPowerPlan([liveStructure], true) : null;
  const chainSnapshotMap = chainObjectId && chainSnapshot.snapshotState
    ? new Map([[chainObjectId, {
      normalizedStructureId: chainObjectId,
      chainStatus: chainSnapshot.chainStatus,
      state: chainSnapshot.snapshotState,
      statusVariant: chainSnapshot.statusVariant,
    }]])
    : null;
  const finalOfflinePlan = rawOfflinePlan
    ? inspectNodePowerPlanForChainEligibility(rawOfflinePlan, chainSnapshotMap)
    : null;
  const finalOnlinePlan = rawOnlinePlan
    ? inspectNodePowerPlanForChainEligibility(rawOnlinePlan, chainSnapshotMap)
    : null;

  const nodeEligibilityRows = [];
  for (const entry of allRows) {
    const liveNodeStructure = makeNodeControlStructureFromLiveRow(entry.row);
    if (!liveNodeStructure) continue;

    const candidateSnapshot = await getChainSnapshot(entry.row.objectId);
    const normalizedObjectId = candidateSnapshot.normalizedObjectId;
    const candidateSnapshotMap = normalizedObjectId && candidateSnapshot.snapshotState
      ? new Map([[normalizedObjectId, {
        normalizedStructureId: normalizedObjectId,
        chainStatus: candidateSnapshot.chainStatus,
        state: candidateSnapshot.snapshotState,
        statusVariant: candidateSnapshot.statusVariant,
      }]])
      : null;
    const bringOnline = inspectNodePowerPlanForChainEligibility(buildNodeChildBulkPowerPlan([liveNodeStructure], true), candidateSnapshotMap);
    const takeOffline = inspectNodePowerPlanForChainEligibility(buildNodeChildBulkPowerPlan([liveNodeStructure], false), candidateSnapshotMap);
    nodeEligibilityRows.push({
      nodeObjectId: entry.nodeObjectId,
      location: entry.location,
      childIndex: entry.childIndex,
      objectId: entry.row.objectId,
      normalizedObjectId,
      displayName: entry.row.displayName ?? entry.row.name,
      family: entry.row.family,
      rawStatus: entry.row.status,
      adaptedStatus: liveNodeStructure.status,
      localSessionOverlayStatus: null,
      currentUiStatus: liveNodeStructure.status,
      chainStatus: candidateSnapshot.chainStatus,
      chainState: candidateSnapshot.snapshotState,
      chainStatusVariant: candidateSnapshot.statusVariant,
      bringOnlineEligible: bringOnline.targets.length > 0,
      bringOnlineReason: bringOnline.decisions[0]?.reason ?? null,
      takeOfflineEligible: takeOffline.targets.length > 0,
      takeOfflineReason: takeOffline.decisions[0]?.reason ?? null,
      ownerCapId: entry.row.ownerCapId,
      networkNodeId: entry.row.networkNodeId,
      actionCandidate: entry.row.actionCandidate,
      lastUpdated: entry.row.lastUpdated,
      source: entry.row.source,
      provenance: entry.row.provenance,
    });
  }

  const refineryRows = [];
  for (const entry of allRows) {
    const haystack = [
      entry.row.family,
      entry.row.typeName,
      entry.row.assemblyType,
      entry.row.displayName,
      entry.row.name,
    ].map((value) => String(value ?? "").toLowerCase()).join(" ");
    if (!haystack.includes("refinery")) continue;

    const refineryChain = await getChainSnapshot(entry.row.objectId);
    refineryRows.push({
      location: entry.location,
      groupIndex: entry.groupIndex,
      childIndex: entry.childIndex,
      objectId: entry.row.objectId,
      normalizedObjectId: refineryChain.normalizedObjectId,
      rawStatus: entry.row.status,
      chainStatus: refineryChain.chainStatus,
      family: entry.row.family,
      typeName: entry.row.typeName,
      assemblyType: entry.row.assemblyType,
      size: entry.row.size,
      displayName: entry.row.displayName ?? entry.row.name,
      ownerCapId: entry.row.ownerCapId,
      networkNodeId: entry.row.networkNodeId,
      nodeObjectId: entry.nodeObjectId,
      energySourceId: entry.row.energySourceId,
      actionCandidate: entry.row.actionCandidate,
      lastUpdated: entry.row.lastUpdated,
      source: entry.row.source,
      provenance: entry.row.provenance,
    });
  }

  console.log(JSON.stringify({
    liveFetch: true,
    status: response.status,
    fetchedAt: body.fetchedAt,
    source: body.source,
    object,
    rawLocation: row?.location ?? null,
    rawStatus: row?.row.status ?? null,
    chainStatus: chainSnapshot.chainStatus,
    chainState: chainSnapshot.snapshotState,
    chainStatusVariant: chainSnapshot.statusVariant,
    finalOfflineTargetCount: finalOfflinePlan?.targets.length ?? null,
    finalOfflineDecision: finalOfflinePlan?.decisions[0]?.reason ?? null,
    finalOnlineTargetCount: finalOnlinePlan?.targets.length ?? null,
    finalOnlineDecision: finalOnlinePlan?.decisions[0]?.reason ?? null,
    rawFamily: row?.row.family ?? null,
    rawTypeName: row?.row.typeName ?? null,
    rawAssemblyType: row?.row.assemblyType ?? null,
    rawDisplayName: row?.row.displayName ?? row?.row.name ?? null,
    rawOwnerCapId: row?.row.ownerCapId ?? null,
    rawNetworkNodeId: row?.row.networkNodeId ?? null,
    rawEnergySourceId: row?.row.energySourceId ?? null,
    rawActionCandidate: row?.row.actionCandidate ?? null,
    lastUpdated: row?.row.lastUpdated ?? null,
    provenance: row?.row.provenance ?? null,
    liveNodeBulk,
    nodeEligibilityRows,
    refineryRows,
  }, null, 2));
} else {
  console.log(JSON.stringify({
    liveFetch: false,
    reason: "Pass --wallet <address> with --object <objectId> to inspect one live row, or add --node <nodeObjectId> --action bring-online|take-offline for a selected-node bulk verdict.",
    suppliedObjectHint: "0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780",
  }, null, 2));
}

console.log("Operator-inventory status truth checks passed.");
