import assert from "node:assert/strict";

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import {
  buildNodeChildBulkPowerPlan,
  filterNodePowerPlanForTargetStatuses,
} from "../src/lib/nodePowerControlModel.ts";
import { getFailedTransactionMessage } from "../src/lib/transactionExecutionErrors.ts";
import { classifyStructurePowerError, formatStructurePowerError } from "../src/lib/structurePowerErrors.ts";
import {
  resolveAlreadyOfflineCorrectionTarget,
  resolvePowerErrorDesiredStatus,
} from "../src/lib/structurePowerFailureResolution.ts";
import { resolveStructurePowerChainStatusFromContent } from "../src/lib/structurePowerChainStatus.ts";
import {
  applyStructureWriteOverlaysToOperatorInventory,
  createPendingStructureWriteOverlay,
  resolveStructureWriteConfirmation,
  type StructureWriteTarget,
} from "../src/lib/structureWriteReconciliation.ts";
import { DEFAULT_SUI_RPC_URL } from "../src/constants.ts";

import type { OperatorInventoryResponse, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";
import type { NodeLocalStructure } from "../src/lib/nodeDrilldownTypes.ts";

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
  const networkNodeId = row.networkNodeId ?? row.energySourceId ?? null;
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

const staleOnlineNodeControl = firstNodeControlStructureStatus(staleOnline);
const staleOnlinePlan = buildNodeChildBulkPowerPlan([staleOnlineNodeControl.structure], false);
assert.equal(staleOnlinePlan.targets.length, 1, "expected stale raw online child to enter the offline plan before chain proof");
const chainCorrectedPlan = filterNodePowerPlanForTargetStatuses(staleOnlinePlan, new Map([[objectId(101), "offline"]]));
assert.equal(chainCorrectedPlan.targets.length, 0, "expected direct-chain offline status to exclude stale raw online child from final PTB targets");

const staleConfirmation = resolveStructureWriteConfirmation(staleOnline, null, offlineCorrection);
assert.equal(staleConfirmation.statusConfirmed, false, "expected stale raw online data not to clear an offline correction overlay");
const confirmedCorrection = resolveStructureWriteConfirmation(rawOffline, null, offlineCorrection);
assert.equal(confirmedCorrection.statusConfirmed, true, "expected raw offline data to confirm and clear the offline correction overlay");

const offlineAbort = "Transaction resolution failed: MoveAbort in 2nd command, 'EAssemblyInvalidStatus': Assembly status is invalid, in '0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780::status::offline' line 97.";
assert.equal(classifyStructurePowerError(offlineAbort, { desiredStatus: "offline" }), "target_already_offline");
assert.equal(formatStructurePowerError(offlineAbort, { desiredStatus: "offline" }), "Already offline. View updated.");
assert.equal(classifyStructurePowerError(offlineAbort, { desiredStatus: "online" }), "target_already_in_state", "expected offline abort evidence not to be swallowed for online attempts");

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
if (wallet && object) {
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
  const row = allRows.find((entry) => entry.row.objectId?.toLowerCase() === object.toLowerCase());
  const client = new SuiJsonRpcClient({ url: DEFAULT_SUI_RPC_URL, network: "testnet" });

  async function getChainStatus(objectId: string | null | undefined) {
    const normalized = objectId ? normalizeObjectId(objectId) : null;
    if (!normalized) {
      return { normalizedObjectId: normalized, chainStatus: null };
    }

    const objectResponse = await client.getObject({
      id: normalized,
      options: { showContent: true, showType: true },
    }).catch(() => null);
    const content = objectResponse?.data?.content as { fields?: Record<string, unknown> } | null | undefined;
    return {
      normalizedObjectId: normalized,
      chainStatus: resolveStructurePowerChainStatusFromContent(content?.fields ?? null),
    };
  }

  const chainObjectId = normalizeObjectId(object);
  const { chainStatus } = await getChainStatus(object);
  const liveStructure = row ? makeNodeControlStructureFromLiveRow(row.row) : null;
  const rawPlan = liveStructure ? buildNodeChildBulkPowerPlan([liveStructure], false) : null;
  const finalPlan = rawPlan && chainStatus
    ? filterNodePowerPlanForTargetStatuses(rawPlan, new Map([[chainObjectId!, chainStatus]]))
    : rawPlan;

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

    const refineryChain = await getChainStatus(entry.row.objectId);
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
    chainStatus,
    finalOfflineTargetCount: finalPlan?.targets.length ?? null,
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
    refineryRows,
  }, null, 2));
} else {
  console.log(JSON.stringify({
    liveFetch: false,
    reason: "Pass --wallet <address> --object <objectId> to inspect a live operator-inventory row.",
    suppliedObjectHint: "0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780",
  }, null, 2));
}

console.log("Operator-inventory status truth checks passed.");