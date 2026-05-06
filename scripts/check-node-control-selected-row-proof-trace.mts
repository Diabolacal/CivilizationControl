import assert from "node:assert/strict";

import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import {
  buildOperatorInventoryUrl,
  normalizeOperatorInventoryResponse,
} from "../src/lib/operatorInventoryClient.ts";
import { resolveSelectedNodeInventoryLookup } from "../src/lib/nodeControlInventoryLookup.ts";
import {
  buildLiveNodeLocalViewModelWithObserved,
} from "../src/lib/nodeDrilldownModel.ts";
import {
  getAuthoritativeNodeLocalStructures,
  resolveNodeLocalStructure,
} from "../src/lib/nodeDrilldownSelection.ts";
import { getNodeLocalPowerControlState } from "../src/lib/nodeDrilldownActionAuthority.ts";
import { buildNodeDrilldownMenuItems } from "../src/lib/nodeDrilldownMenuItems.ts";
import { selectCanonicalNodeDrilldownDomainKey } from "../src/lib/nodeDrilldownIdentity.ts";
import { normalizeCanonicalObjectId } from "../src/lib/nodeAssembliesClient.ts";
import { getNodePowerUsageReadout } from "../src/lib/nodePowerControlModel.ts";

import type { IndexedActionCandidate, IndexedActionRequiredIds, Structure } from "../src/types/domain.ts";
import type { NodeAssembliesLookupResult } from "../src/lib/nodeAssembliesClient.ts";
import type { NodeLocalStructure } from "../src/lib/nodeDrilldownTypes.ts";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "../src/types/operatorInventory.ts";

const DEFAULT_WALLET_ADDRESS = "0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62";
const DEFAULT_NODE_OBJECT_ID = "0x2deb4248ed82ecbe42410e6ff4f8902f2e48b0c348c3dfdfb3f2c83acde73b85";
const DEFAULT_ROW_NAME = "Shadow Broker";
const DEFAULT_BASE_URL = "https://ef-map.com";
const DEFAULT_ORIGIN = "https://civilizationcontrol.com";

interface Args {
  walletAddress: string;
  baseUrl: string;
  origin: string;
  nodeObjectId: string | null;
  rowName: string;
  objectId: string | null;
  rawOnly: boolean;
}

interface ProofFields {
  displayName: string | null;
  name: string | null;
  typeName: string | null;
  family: string | null;
  size: string | null;
  status: string | null;
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  networkNodeId: string | null;
  energySourceId: string | null;
  canonicalDomainKey: string | null;
  "powerRequirement.requiredGj": number | null;
  "actionCandidate.actions.power.requiredIds.structureId": string | null;
  "actionCandidate.actions.power.requiredIds.structureType": string | null;
  "actionCandidate.actions.power.requiredIds.ownerCapId": string | null;
  "actionCandidate.actions.power.requiredIds.networkNodeId": string | null;
  "actionCandidate.actions.rename.requiredIds.structureId": string | null;
  "actionCandidate.actions.rename.requiredIds.ownerCapId": string | null;
  "actionCandidate.actions.rename.requiredIds.networkNodeId": string | null;
  "actionAuthority.state": string | null;
  "actionAuthority.verifiedTarget.structureId": string | null;
  "actionAuthority.verifiedTarget.ownerCapId": string | null;
  "actionAuthority.verifiedTarget.networkNodeId": string | null;
  source: string | null;
  provenance: string | null;
  displayNameSource: string | null;
  displayNameUpdatedAt: string | null;
}

interface StageProofRow extends ProofFields {
  stage: string;
}

function readArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

function parseArgs(args: string[]): Args {
  return {
    walletAddress: readArgValue(args, "--wallet") ?? readArgValue(args, "--walletAddress") ?? DEFAULT_WALLET_ADDRESS,
    baseUrl: readArgValue(args, "--base") ?? DEFAULT_BASE_URL,
    origin: readArgValue(args, "--origin") ?? DEFAULT_ORIGIN,
    nodeObjectId: readArgValue(args, "--node") ?? readArgValue(args, "--nodeObjectId") ?? DEFAULT_NODE_OBJECT_ID,
    rowName: readArgValue(args, "--row") ?? readArgValue(args, "--name") ?? DEFAULT_ROW_NAME,
    objectId: normalizeCanonicalObjectId(readArgValue(args, "--object") ?? readArgValue(args, "--objectId")),
    rawOnly: args.includes("--raw-only"),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function readString(record: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(record: Record<string, unknown> | null | undefined, key: string): number | null {
  const value = record?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeAssemblyId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^0+/, "");
  return normalized.length > 0 ? normalized : "0";
}

function normalizeObject(value: string | null | undefined): string | null {
  return normalizeCanonicalObjectId(value);
}

function canonicalKey(objectId: string | null | undefined, assemblyId: string | null | undefined): string | null {
  return selectCanonicalNodeDrilldownDomainKey({ objectId, assemblyId });
}

function actionRecord(row: Record<string, unknown> | null, action: "power" | "rename"): Record<string, unknown> | null {
  return asRecord(asRecord(asRecord(row?.actionCandidate)?.actions)?.[action]);
}

function actionRequiredIdsRecord(row: Record<string, unknown> | null, action: "power" | "rename"): Record<string, unknown> | null {
  return asRecord(actionRecord(row, action)?.requiredIds);
}

function normalizedActionRequiredIds(
  actionCandidate: IndexedActionCandidate | null | undefined,
  action: "power" | "rename",
): IndexedActionRequiredIds | null {
  return actionCandidate?.actions[action]?.requiredIds ?? null;
}

function readRequiredStructureId(requiredIds: Record<string, unknown> | null): string | null {
  return normalizeObject(readString(requiredIds, "structureId") ?? readString(requiredIds, "objectId"));
}

function rawProofFields(row: Record<string, unknown> | null): ProofFields {
  const powerRequiredIds = actionRequiredIdsRecord(row, "power");
  const renameRequiredIds = actionRequiredIdsRecord(row, "rename");
  const powerRequirement = asRecord(row?.powerRequirement);

  return {
    displayName: readString(row, "displayName"),
    name: readString(row, "name"),
    typeName: readString(row, "typeName"),
    family: readString(row, "family"),
    size: readString(row, "size"),
    status: readString(row, "status"),
    objectId: normalizeObject(readString(row, "objectId")),
    assemblyId: normalizeAssemblyId(readString(row, "assemblyId")),
    ownerCapId: normalizeObject(readString(row, "ownerCapId")),
    networkNodeId: normalizeObject(readString(row, "networkNodeId")),
    energySourceId: normalizeObject(readString(row, "energySourceId")),
    canonicalDomainKey: canonicalKey(readString(row, "objectId"), readString(row, "assemblyId")),
    "powerRequirement.requiredGj": readNumber(powerRequirement, "requiredGj"),
    "actionCandidate.actions.power.requiredIds.structureId": readRequiredStructureId(powerRequiredIds),
    "actionCandidate.actions.power.requiredIds.structureType": readString(powerRequiredIds, "structureType"),
    "actionCandidate.actions.power.requiredIds.ownerCapId": normalizeObject(readString(powerRequiredIds, "ownerCapId")),
    "actionCandidate.actions.power.requiredIds.networkNodeId": normalizeObject(readString(powerRequiredIds, "networkNodeId")),
    "actionCandidate.actions.rename.requiredIds.structureId": readRequiredStructureId(renameRequiredIds),
    "actionCandidate.actions.rename.requiredIds.ownerCapId": normalizeObject(readString(renameRequiredIds, "ownerCapId")),
    "actionCandidate.actions.rename.requiredIds.networkNodeId": normalizeObject(readString(renameRequiredIds, "networkNodeId")),
    "actionAuthority.state": null,
    "actionAuthority.verifiedTarget.structureId": null,
    "actionAuthority.verifiedTarget.ownerCapId": null,
    "actionAuthority.verifiedTarget.networkNodeId": null,
    source: readString(row, "source"),
    provenance: readString(row, "provenance"),
    displayNameSource: readString(row, "displayNameSource"),
    displayNameUpdatedAt: readString(row, "displayNameUpdatedAt"),
  };
}

function operatorProofFields(row: OperatorInventoryStructure | null): ProofFields {
  const powerRequiredIds = normalizedActionRequiredIds(row?.actionCandidate, "power");
  const renameRequiredIds = normalizedActionRequiredIds(row?.actionCandidate, "rename");

  return {
    displayName: row?.displayName ?? null,
    name: row?.name ?? null,
    typeName: row?.typeName ?? null,
    family: row?.family ?? null,
    size: row?.size ?? null,
    status: row?.status ?? null,
    objectId: row?.objectId ?? null,
    assemblyId: normalizeAssemblyId(row?.assemblyId),
    ownerCapId: row?.ownerCapId ?? null,
    networkNodeId: row?.networkNodeId ?? null,
    energySourceId: normalizeObject(row?.energySourceId),
    canonicalDomainKey: canonicalKey(row?.objectId, row?.assemblyId),
    "powerRequirement.requiredGj": row?.powerRequirement?.requiredGj ?? null,
    "actionCandidate.actions.power.requiredIds.structureId": powerRequiredIds?.structureId ?? null,
    "actionCandidate.actions.power.requiredIds.structureType": powerRequiredIds?.structureType ?? null,
    "actionCandidate.actions.power.requiredIds.ownerCapId": powerRequiredIds?.ownerCapId ?? null,
    "actionCandidate.actions.power.requiredIds.networkNodeId": powerRequiredIds?.networkNodeId ?? null,
    "actionCandidate.actions.rename.requiredIds.structureId": renameRequiredIds?.structureId ?? null,
    "actionCandidate.actions.rename.requiredIds.ownerCapId": renameRequiredIds?.ownerCapId ?? null,
    "actionCandidate.actions.rename.requiredIds.networkNodeId": renameRequiredIds?.networkNodeId ?? null,
    "actionAuthority.state": null,
    "actionAuthority.verifiedTarget.structureId": null,
    "actionAuthority.verifiedTarget.ownerCapId": null,
    "actionAuthority.verifiedTarget.networkNodeId": null,
    source: row?.source ?? null,
    provenance: row?.provenance ?? null,
    displayNameSource: row?.displayNameSource ?? null,
    displayNameUpdatedAt: row?.displayNameUpdatedAt ?? null,
  };
}

function structureProofFields(structure: Structure | null): ProofFields {
  const actionCandidate = structure?.summary?.actionCandidate ?? null;
  const powerRequiredIds = normalizedActionRequiredIds(actionCandidate, "power");
  const renameRequiredIds = normalizedActionRequiredIds(actionCandidate, "rename");
  const powerRequirement = structure?.indexedPowerRequirement ?? structure?.summary?.powerRequirement ?? null;

  return {
    displayName: structure?.summary?.displayName ?? structure?.name ?? null,
    name: structure?.summary?.name ?? structure?.name ?? null,
    typeName: structure?.summary?.typeName ?? null,
    family: structure?.summary?.family ?? structure?.type ?? null,
    size: structure?.summary?.size ?? null,
    status: structure?.status ?? structure?.summary?.status ?? null,
    objectId: structure?.objectId ?? null,
    assemblyId: normalizeAssemblyId(structure?.assemblyId ?? structure?.summary?.assemblyId),
    ownerCapId: normalizeObject(structure?.ownerCapId || structure?.summary?.ownerCapId),
    networkNodeId: normalizeObject(structure?.networkNodeId),
    energySourceId: normalizeObject(structure?.summary?.energySourceId),
    canonicalDomainKey: canonicalKey(structure?.objectId, structure?.assemblyId),
    "powerRequirement.requiredGj": powerRequirement?.requiredGj ?? null,
    "actionCandidate.actions.power.requiredIds.structureId": powerRequiredIds?.structureId ?? null,
    "actionCandidate.actions.power.requiredIds.structureType": powerRequiredIds?.structureType ?? null,
    "actionCandidate.actions.power.requiredIds.ownerCapId": powerRequiredIds?.ownerCapId ?? null,
    "actionCandidate.actions.power.requiredIds.networkNodeId": powerRequiredIds?.networkNodeId ?? null,
    "actionCandidate.actions.rename.requiredIds.structureId": renameRequiredIds?.structureId ?? null,
    "actionCandidate.actions.rename.requiredIds.ownerCapId": renameRequiredIds?.ownerCapId ?? null,
    "actionCandidate.actions.rename.requiredIds.networkNodeId": renameRequiredIds?.networkNodeId ?? null,
    "actionAuthority.state": null,
    "actionAuthority.verifiedTarget.structureId": null,
    "actionAuthority.verifiedTarget.ownerCapId": null,
    "actionAuthority.verifiedTarget.networkNodeId": null,
    source: structure?.readModelSource ?? structure?.summary?.source ?? null,
    provenance: structure?.summary?.provenance ?? null,
    displayNameSource: structure?.summary?.displayNameSource ?? null,
    displayNameUpdatedAt: structure?.summary?.displayNameUpdatedAt ?? null,
  };
}

function nodeLocalProofFields(row: NodeLocalStructure | null): ProofFields {
  const powerRequiredIds = normalizedActionRequiredIds(row?.actionCandidate, "power");
  const renameRequiredIds = normalizedActionRequiredIds(row?.actionCandidate, "rename");
  const firstCandidate = row?.actionAuthority.candidateTargets[0] ?? null;
  const verifiedTarget = row?.actionAuthority.verifiedTarget ?? null;

  return {
    displayName: row?.displayName ?? null,
    name: null,
    typeName: row?.typeLabel ?? null,
    family: row?.family ?? null,
    size: row?.sizeVariant ?? null,
    status: row?.status ?? null,
    objectId: normalizeObject(row?.objectId),
    assemblyId: normalizeAssemblyId(row?.assemblyId),
    ownerCapId: verifiedTarget?.ownerCapId ?? normalizeObject(firstCandidate?.ownerCapId),
    networkNodeId: verifiedTarget?.networkNodeId ?? normalizeObject(firstCandidate?.networkNodeId),
    energySourceId: normalizeObject(row?.energySourceId),
    canonicalDomainKey: row?.canonicalDomainKey ?? null,
    "powerRequirement.requiredGj": row?.powerRequirement?.requiredGj ?? null,
    "actionCandidate.actions.power.requiredIds.structureId": powerRequiredIds?.structureId ?? null,
    "actionCandidate.actions.power.requiredIds.structureType": powerRequiredIds?.structureType ?? null,
    "actionCandidate.actions.power.requiredIds.ownerCapId": powerRequiredIds?.ownerCapId ?? null,
    "actionCandidate.actions.power.requiredIds.networkNodeId": powerRequiredIds?.networkNodeId ?? null,
    "actionCandidate.actions.rename.requiredIds.structureId": renameRequiredIds?.structureId ?? null,
    "actionCandidate.actions.rename.requiredIds.ownerCapId": renameRequiredIds?.ownerCapId ?? null,
    "actionCandidate.actions.rename.requiredIds.networkNodeId": renameRequiredIds?.networkNodeId ?? null,
    "actionAuthority.state": row?.actionAuthority.state ?? null,
    "actionAuthority.verifiedTarget.structureId": verifiedTarget?.structureId ?? null,
    "actionAuthority.verifiedTarget.ownerCapId": verifiedTarget?.ownerCapId ?? null,
    "actionAuthority.verifiedTarget.networkNodeId": verifiedTarget?.networkNodeId ?? null,
    source: row?.source ?? null,
    provenance: row?.provenance ?? null,
    displayNameSource: row?.displayNameSource ?? null,
    displayNameUpdatedAt: row?.displayNameUpdatedAt ?? null,
  };
}

function makeStage(stage: string, fields: ProofFields): StageProofRow {
  return { stage, ...fields };
}

function rowMatches(row: OperatorInventoryStructure, args: Args): boolean {
  const objectId = normalizeObject(row.objectId);
  if (args.objectId && objectId === args.objectId) return true;
  return row.displayName === args.rowName || row.name === args.rowName;
}

function rawRowMatches(row: Record<string, unknown>, args: Args): boolean {
  const objectId = normalizeObject(readString(row, "objectId"));
  if (args.objectId && objectId === args.objectId) return true;
  return readString(row, "displayName") === args.rowName || readString(row, "name") === args.rowName;
}

function rawActionCandidateRequiredIds(row: Record<string, unknown> | null): Record<string, unknown> | null {
  return asRecord(asRecord(row?.actionCandidate)?.requiredIds);
}

function getAllowedProofSources(rawRow: Record<string, unknown> | null) {
  const topLevelRequiredIds = rawActionCandidateRequiredIds(rawRow);
  return {
    objectIds: new Set([
      normalizeObject(readString(rawRow, "objectId")),
      normalizeObject(readString(topLevelRequiredIds, "structureId")),
      normalizeObject(readString(topLevelRequiredIds, "objectId")),
    ].filter((value): value is string => Boolean(value))),
    ownerCapIds: new Set([
      normalizeObject(readString(rawRow, "ownerCapId")),
      normalizeObject(readString(topLevelRequiredIds, "ownerCapId")),
    ].filter((value): value is string => Boolean(value))),
    networkNodeIds: new Set([
      normalizeObject(readString(rawRow, "networkNodeId")),
      normalizeObject(readString(topLevelRequiredIds, "networkNodeId")),
    ].filter((value): value is string => Boolean(value))),
  };
}

function assertNoFallbackSubstitution(rawRow: Record<string, unknown> | null, rows: StageProofRow[]) {
  const allowed = getAllowedProofSources(rawRow);
  const invalid: Array<{ stage: string; field: string; value: string }> = [];

  for (const row of rows) {
    const objectId = row.objectId ?? row["actionAuthority.verifiedTarget.structureId"];
    if (objectId && !allowed.objectIds.has(objectId)) {
      invalid.push({ stage: row.stage, field: "objectId", value: objectId });
    }

    const ownerCapId = row.ownerCapId ?? row["actionAuthority.verifiedTarget.ownerCapId"];
    if (ownerCapId && !allowed.ownerCapIds.has(ownerCapId)) {
      invalid.push({ stage: row.stage, field: "ownerCapId", value: ownerCapId });
    }

    const networkNodeId = row.networkNodeId ?? row["actionAuthority.verifiedTarget.networkNodeId"];
    if (networkNodeId && !allowed.networkNodeIds.has(networkNodeId)) {
      invalid.push({ stage: row.stage, field: "networkNodeId", value: networkNodeId });
    }
  }

  assert.deepEqual(invalid, [], "proof trace used a fallback substitution not present as raw row proof");
}

function firstLoss(rows: StageProofRow[], field: keyof ProofFields): string | null {
  let seen = false;
  for (const row of rows) {
    if (row[field]) {
      seen = true;
      continue;
    }
    if (seen) return row.stage;
  }
  return null;
}

function hasRequiredProof(row: StageProofRow, field: "objectId" | "ownerCapId" | "networkNodeId"): boolean {
  switch (field) {
    case "objectId":
      return Boolean(
        row.objectId
          || row["actionCandidate.actions.power.requiredIds.structureId"]
          || row["actionCandidate.actions.rename.requiredIds.structureId"]
          || row["actionAuthority.verifiedTarget.structureId"],
      );
    case "ownerCapId":
      return Boolean(
        row.ownerCapId
          || row["actionCandidate.actions.power.requiredIds.ownerCapId"]
          || row["actionCandidate.actions.rename.requiredIds.ownerCapId"]
          || row["actionAuthority.verifiedTarget.ownerCapId"],
      );
    case "networkNodeId":
      return Boolean(
        row.networkNodeId
          || row["actionCandidate.actions.power.requiredIds.networkNodeId"]
          || row["actionCandidate.actions.rename.requiredIds.networkNodeId"]
          || row["actionAuthority.verifiedTarget.networkNodeId"],
      );
  }
}

function firstRequiredProofLoss(rows: StageProofRow[], field: "objectId" | "ownerCapId" | "networkNodeId"): string | null {
  let seen = false;
  for (const row of rows) {
    if (hasRequiredProof(row, field)) {
      seen = true;
      continue;
    }
    if (seen) return row.stage;
  }
  return null;
}

function findRawNodeGroup(rawPayload: unknown, nodeObjectId: string | null): Record<string, unknown> | null {
  const payload = asRecord(rawPayload);
  const networkNodes = Array.isArray(payload?.networkNodes) ? payload.networkNodes : [];
  if (nodeObjectId) {
    const normalizedNodeId = normalizeObject(nodeObjectId);
    const found = networkNodes
      .map(asRecord)
      .find((group) => normalizeObject(readString(asRecord(group?.node), "objectId")) === normalizedNodeId);
    if (found) return found;
  }

  return networkNodes.map(asRecord).find((group) => group != null) ?? null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const response = await fetch(buildOperatorInventoryUrl(args.walletAddress, args.baseUrl), {
    headers: { Accept: "application/json", Origin: args.origin },
  });
  if (!response.ok) {
    throw new Error(`operator-inventory fetch failed: ${response.status} ${response.statusText}`);
  }

  const rawPayload = await response.json();
  const inventory = normalizeOperatorInventoryResponse(rawPayload);
  assert(inventory, "operator-inventory payload must normalize");

  const rawNodeGroup = findRawNodeGroup(rawPayload, args.nodeObjectId);
  const rawStructures = Array.isArray(rawNodeGroup?.structures) ? rawNodeGroup.structures.map(asRecord) : [];
  const rawRow = rawStructures.find((row): row is Record<string, unknown> => row != null && rawRowMatches(row, args)) ?? null;
  assert(rawRow, `raw selected row ${args.rowName} must exist`);

  const normalizedNodeObjectId = normalizeObject(args.nodeObjectId);
  const normalizedNodeGroup = inventory.networkNodes.find((group) => (
    !normalizedNodeObjectId || normalizeObject(group.node.objectId) === normalizedNodeObjectId
  )) ?? inventory.networkNodes.find((group) => group.structures.some((row) => rowMatches(row, args))) ?? null;
  assert(normalizedNodeGroup, "normalized selected node group must exist");
  const normalizedRow = normalizedNodeGroup.structures.find((row) => rowMatches(row, args)) ?? null;
  assert(normalizedRow, "normalized selected row must exist");

  const adapted = adaptOperatorInventory(inventory);
  const selectedGroup = adapted.nodeGroups.find((group) => normalizeObject(group.node.objectId) === normalizeObject(normalizedNodeGroup.node.objectId)) ?? null;
  assert(selectedGroup, "adapted selected node group must exist");
  const lookupResolution = resolveSelectedNodeInventoryLookup(selectedGroup, adapted.nodeLookupsByNodeId);
  const lookup = lookupResolution.lookup;
  const lookupRow = lookup?.status === "success"
    ? lookup.assemblies.find((row) => rowMatches(row as OperatorInventoryStructure, args)) ?? null
    : null;
  const adaptedRow = [...selectedGroup.gates, ...selectedGroup.storageUnits, ...selectedGroup.turrets]
    .find((row) => normalizeObject(row.objectId) === normalizeObject(normalizedRow.objectId) || row.summary?.displayName === args.rowName)
    ?? null;
  const selectedNodeViewModel = buildLiveNodeLocalViewModelWithObserved(selectedGroup, lookup, {
    preferObservedMembership: lookupResolution.found,
    requireObservedMembership: true,
  });
  const selectedNodeRow = selectedNodeViewModel.structures.find((row) => (
    normalizeObject(row.objectId) === normalizeObject(normalizedRow.objectId)
    || row.displayName === args.rowName
  )) ?? null;
  assert(selectedNodeRow, "selected Node Control view-model row must exist");

  const visibleNodeViewModel = { ...selectedNodeViewModel, structures: selectedNodeViewModel.structures };
  const visibleNodeRow = visibleNodeViewModel.structures.find((row) => row.id === selectedNodeRow.id) ?? null;
  const selectedResolution = resolveNodeLocalStructure(selectedNodeViewModel, {
    structureId: selectedNodeRow.id,
    canonicalDomainKey: selectedNodeRow.canonicalDomainKey,
  }, "selected-state");
  const inspectorTarget = resolveNodeLocalStructure(selectedNodeViewModel, {
    structureId: selectedResolution.structure?.id ?? null,
  }, "inspector").structure;
  const contextMenuTarget = resolveNodeLocalStructure(selectedNodeViewModel, {
    structure: visibleNodeRow,
  }, "context-menu").structure;
  const actionRailTarget = selectedResolution.structure;
  const powerControl = actionRailTarget ? getNodeLocalPowerControlState(actionRailTarget) : null;
  const contextMenu = contextMenuTarget ? {
    structureId: contextMenuTarget.id,
    canonicalDomainKey: contextMenuTarget.canonicalDomainKey,
    structureName: contextMenuTarget.displayName,
    left: 0,
    top: 0,
    visibilityAction: "hide" as const,
    visibilityActionLabel: "Hide from Node View" as const,
    powerActionLabel: powerControl?.actionLabel ?? null,
    nextOnline: powerControl?.nextOnline ?? null,
  } : null;
  const menuItems = contextMenu ? buildNodeDrilldownMenuItems({
    contextMenu,
    structure: contextMenuTarget,
    onHideStructure: () => undefined,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
    onRenameStructure: () => undefined,
  }) : [];
  const authoritativeRows = getAuthoritativeNodeLocalStructures(selectedNodeViewModel);
  const powerReadout = getNodePowerUsageReadout(selectedNodeViewModel.node, authoritativeRows);

  const rows: StageProofRow[] = [
    makeStage("1. raw EF-Map operator-inventory JSON", rawProofFields(rawRow)),
    makeStage("2. normalized operator-inventory response", operatorProofFields(normalizedRow)),
  ];

  if (!args.rawOnly) {
    rows.push(
      makeStage("3. adaptOperatorInventory output", structureProofFields(adaptedRow)),
      makeStage("4. nodeLookupsByNodeId lookup entry", operatorProofFields(lookupRow as OperatorInventoryStructure | null)),
      makeStage("5. selectedNodeObservedLookup", operatorProofFields(lookupRow as OperatorInventoryStructure | null)),
      makeStage("6. selectedNodeViewModel.structures", nodeLocalProofFields(selectedNodeRow)),
      makeStage("7. visibleNodeViewModel.structures", nodeLocalProofFields(visibleNodeRow)),
      makeStage("8. selected inspector target", nodeLocalProofFields(inspectorTarget)),
      makeStage("9. context menu target", nodeLocalProofFields(contextMenuTarget)),
      makeStage("10. action rail target", nodeLocalProofFields(actionRailTarget)),
      makeStage("11. power readout inputs", {
        ...nodeLocalProofFields(actionRailTarget),
        source: powerReadout.label,
        provenance: JSON.stringify({
          authoritativeRowCount: authoritativeRows.length,
          nodeCapacityGj: selectedNodeViewModel.node.powerUsageSummary?.capacityGj ?? null,
          readout: powerReadout,
        }),
      }),
    );
  }

  assertNoFallbackSubstitution(rawRow, rows);

  const firstLost = {
    directObjectId: firstLoss(rows, "objectId"),
    directOwnerCapId: firstLoss(rows, "ownerCapId"),
    directNetworkNodeId: firstLoss(rows, "networkNodeId"),
    requiredObjectProof: firstRequiredProofLoss(rows, "objectId"),
    requiredOwnerCapProof: firstRequiredProofLoss(rows, "ownerCapId"),
    requiredNetworkNodeProof: firstRequiredProofLoss(rows, "networkNodeId"),
    actionAuthority: firstLoss(rows, "actionAuthority.state"),
    powerRequirement: firstLoss(rows, "powerRequirement.requiredGj"),
  };
  const failures = rows.filter((row) => (
    row.stage !== "1. raw EF-Map operator-inventory JSON"
    && (!hasRequiredProof(row, "objectId") || !hasRequiredProof(row, "ownerCapId") || !hasRequiredProof(row, "networkNodeId"))
  ));

  const result = {
    transport: {
      status: response.status,
      accessControlAllowOrigin: response.headers.get("access-control-allow-origin"),
      vary: response.headers.get("vary"),
    },
    selected: {
      walletAddress: args.walletAddress,
      nodeObjectId: normalizeObject(normalizedNodeGroup.node.objectId),
      rowName: args.rowName,
      objectId: normalizeObject(normalizedRow.objectId),
    },
    lookupResolution: {
      found: lookupResolution.found,
      foundBy: lookupResolution.foundBy,
      matchedKey: lookupResolution.matchedKey,
      lookupKeysTried: lookupResolution.lookupKeysTried,
      rawChildCount: lookupResolution.rawChildCount,
      lookupStatus: lookupResolution.lookup?.status ?? null,
      lookupNetworkNodeId: lookupResolution.lookup?.networkNodeId ?? null,
      lookupSource: lookupResolution.lookup?.source ?? null,
      lookupFetchedAt: lookupResolution.lookup?.fetchedAt ?? null,
    },
    menuItems: menuItems.map((item) => ({
      key: item.key,
      label: item.label,
      disabled: item.disabled === true,
      disabledReason: item.disabledReason ?? null,
    })),
    powerControl,
    powerReadout,
    firstLost,
    rows,
    exactRawRowJson: rawRow,
  };

  console.log(JSON.stringify(result, null, 2));
  assert.deepEqual(failures, [], "selected-row proof fields were lost after raw normalization");
}

await main();
