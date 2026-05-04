import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import type {
  NetworkNodeGroup,
  Structure,
  StructureActionTargetType,
  StructureStatus,
} from "@/types/domain";
import type { OperatorInventoryResponse, OperatorInventoryStructure } from "@/types/operatorInventory";

export interface StructureWriteTarget {
  objectId: string;
  structureType: StructureActionTargetType;
  ownerCapId: string;
  networkNodeId?: string | null;
  assemblyId?: string | null;
  canonicalDomainKey?: string | null;
  displayName?: string | null;
}

export interface PendingStructureWriteOverlay {
  key: string;
  structureType: StructureActionTargetType;
  objectId: string;
  ownerCapId: string;
  networkNodeId: string | null;
  assemblyId: string | null;
  canonicalDomainKey: string | null;
  displayName: string | null;
  pendingName: string | null;
  pendingStatus: StructureStatus | null;
  latestDigest: string | null;
  refreshAttempts: number;
  operatorInventoryConfirmed: boolean;
  nodeAssembliesConfirmed: boolean;
  timedOut: boolean;
}

export interface StructureWriteConfirmation {
  nameConfirmed: boolean;
  statusConfirmed: boolean;
}

export interface StructureWriteDebugEntry extends PendingStructureWriteOverlay {
  latestAction: "rename" | "power";
}

export interface StructureWriteDebugController {
  enabled: boolean;
  latest: StructureWriteDebugEntry[] | null;
  clear: () => void;
}

export const STRUCTURE_WRITE_RETRY_DELAYS_MS = [0, 2_000, 5_000, 10_000] as const;

function normalizeAssemblyId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const withoutLeadingZeros = trimmed.replace(/^0+/, "");
  return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : "0";
}

function normalizeStructureStatus(status: string | null | undefined): StructureStatus {
  const normalized = status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized || normalized === "unknown" || normalized === "null" || normalized === "unanchored") {
    return "neutral";
  }

  if (["online", "active", "powered", "running", "onlined"].includes(normalized)) {
    return "online";
  }

  if (["offline", "inactive", "unpowered"].includes(normalized)) {
    return "offline";
  }

  if (["warning", "degraded", "low_fuel", "lowfuel", "damaged"].includes(normalized)) {
    return "warning";
  }

  return "neutral";
}

function toObservedStatus(status: StructureStatus): string {
  switch (status) {
    case "online":
      return "ONLINE";
    case "offline":
      return "OFFLINE";
    case "warning":
      return "WARNING";
    default:
      return "UNKNOWN";
  }
}

function overlayMatchesIdentifiers(
  overlay: PendingStructureWriteOverlay,
  objectId: string | null | undefined,
  assemblyId: string | null | undefined,
): boolean {
  const normalizedOverlayObjectId = normalizeCanonicalObjectId(overlay.objectId);
  const normalizedObjectId = normalizeCanonicalObjectId(objectId);
  if (normalizedOverlayObjectId && normalizedObjectId && normalizedOverlayObjectId === normalizedObjectId) {
    return true;
  }

  const normalizedOverlayAssemblyId = normalizeAssemblyId(overlay.assemblyId);
  const normalizedAssembly = normalizeAssemblyId(assemblyId);
  return normalizedOverlayAssemblyId != null && normalizedAssembly != null && normalizedOverlayAssemblyId === normalizedAssembly;
}

function findOverlay(
  overlays: readonly PendingStructureWriteOverlay[],
  objectId: string | null | undefined,
  assemblyId: string | null | undefined,
): PendingStructureWriteOverlay | null {
  for (const overlay of overlays) {
    if (overlayMatchesIdentifiers(overlay, objectId, assemblyId)) {
      return overlay;
    }
  }

  return null;
}

function applyOverlayToStructure(
  structure: Structure,
  overlays: readonly PendingStructureWriteOverlay[],
): Structure {
  const overlay = findOverlay(overlays, structure.objectId, structure.assemblyId);
  if (!overlay) {
    return structure;
  }

  return {
    ...structure,
    name: overlay.pendingName ?? structure.name,
    status: overlay.pendingStatus ?? structure.status,
  };
}

function applyOverlayToOperatorInventoryRow(
  row: OperatorInventoryStructure,
  overlays: readonly PendingStructureWriteOverlay[],
): OperatorInventoryStructure {
  const overlay = findOverlay(overlays, row.objectId, row.assemblyId);
  if (!overlay) {
    return row;
  }

  return {
    ...row,
    displayName: overlay.pendingName ?? row.displayName,
    name: overlay.pendingName ?? row.name,
    status: overlay.pendingStatus ? (toObservedStatus(overlay.pendingStatus).toLowerCase() as OperatorInventoryStructure["status"]) : row.status,
  };
}

export function buildStructureWriteOverlayKey(target: StructureWriteTarget): string {
  return normalizeCanonicalObjectId(target.objectId)
    ?? normalizeAssemblyId(target.assemblyId)
    ?? target.canonicalDomainKey
    ?? `${target.structureType}:${target.ownerCapId}`;
}

export function createPendingStructureWriteOverlay(
  params: {
    action: "rename" | "power";
    digest?: string | null;
    target: StructureWriteTarget;
    desiredName?: string | null;
    desiredStatus?: StructureStatus | null;
  },
  previous?: PendingStructureWriteOverlay | null,
): PendingStructureWriteOverlay {
  return {
    key: buildStructureWriteOverlayKey(params.target),
    structureType: params.target.structureType,
    objectId: params.target.objectId,
    ownerCapId: params.target.ownerCapId,
    networkNodeId: params.target.networkNodeId ?? previous?.networkNodeId ?? null,
    assemblyId: params.target.assemblyId ?? previous?.assemblyId ?? null,
    canonicalDomainKey: params.target.canonicalDomainKey ?? previous?.canonicalDomainKey ?? null,
    displayName: params.target.displayName ?? previous?.displayName ?? null,
    pendingName: params.action === "rename"
      ? params.desiredName?.trim() ?? null
      : previous?.pendingName ?? null,
    pendingStatus: params.action === "power"
      ? params.desiredStatus ?? null
      : previous?.pendingStatus ?? null,
    latestDigest: params.digest ?? previous?.latestDigest ?? null,
    refreshAttempts: 0,
    operatorInventoryConfirmed: false,
    nodeAssembliesConfirmed: false,
    timedOut: false,
  };
}

export function applyStructureWriteOverlaysToStructures(
  structures: Structure[],
  overlays: readonly PendingStructureWriteOverlay[],
): Structure[] {
  if (overlays.length === 0) {
    return structures;
  }

  return structures.map((structure) => applyOverlayToStructure(structure, overlays));
}

export function applyStructureWriteOverlaysToNodeGroups(
  nodeGroups: NetworkNodeGroup[],
  overlays: readonly PendingStructureWriteOverlay[],
): NetworkNodeGroup[] {
  if (overlays.length === 0) {
    return nodeGroups;
  }

  return nodeGroups.map((group) => ({
    ...group,
    node: applyOverlayToStructure(group.node, overlays),
    gates: applyStructureWriteOverlaysToStructures(group.gates, overlays),
    storageUnits: applyStructureWriteOverlaysToStructures(group.storageUnits, overlays),
    turrets: applyStructureWriteOverlaysToStructures(group.turrets, overlays),
  }));
}

export function applyStructureWriteOverlaysToNodeAssembliesLookup(
  lookup: NodeAssembliesLookupResult | null | undefined,
  overlays: readonly PendingStructureWriteOverlay[],
): NodeAssembliesLookupResult | null {
  if (!lookup || overlays.length === 0 || lookup.status !== "success") {
    return lookup ?? null;
  }

  const nodeOverlay = findOverlay(overlays, lookup.node?.objectId ?? null, lookup.node?.assemblyId ?? null);

  return {
    ...lookup,
    node: lookup.node ? {
      ...lookup.node,
      displayName: nodeOverlay?.pendingName ?? lookup.node.displayName,
      name: nodeOverlay?.pendingName ?? lookup.node.name,
      status: nodeOverlay?.pendingStatus ? toObservedStatus(nodeOverlay.pendingStatus) : lookup.node.status,
    } : lookup.node,
    assemblies: lookup.assemblies.map((assembly) => {
      const overlay = findOverlay(overlays, assembly.objectId, assembly.assemblyId);
      if (!overlay) {
        return assembly;
      }

      return {
        ...assembly,
        displayName: overlay.pendingName ?? assembly.displayName,
        name: overlay.pendingName ?? assembly.name,
        status: overlay.pendingStatus ? toObservedStatus(overlay.pendingStatus) : assembly.status,
      };
    }),
  };
}

function resolveOperatorInventoryConfirmation(
  row: OperatorInventoryStructure | null,
  overlay: PendingStructureWriteOverlay,
): StructureWriteConfirmation {
  if (!row) {
    return { nameConfirmed: false, statusConfirmed: false };
  }

  const resolvedName = row.displayName?.trim() || row.name?.trim() || null;
  return {
    nameConfirmed: overlay.pendingName != null && resolvedName === overlay.pendingName,
    statusConfirmed: overlay.pendingStatus != null && normalizeStructureStatus(row.status) === overlay.pendingStatus,
  };
}

function resolveNodeAssembliesConfirmation(
  lookup: NodeAssembliesLookupResult | null | undefined,
  overlay: PendingStructureWriteOverlay,
): StructureWriteConfirmation {
  if (!lookup || lookup.status !== "success") {
    return { nameConfirmed: false, statusConfirmed: false };
  }

  const assembly = lookup.assemblies.find((entry) => overlayMatchesIdentifiers(overlay, entry.objectId, entry.assemblyId));
  if (!assembly) {
    return { nameConfirmed: false, statusConfirmed: false };
  }

  const resolvedName = assembly.displayName?.trim() || assembly.name?.trim() || null;
  return {
    nameConfirmed: overlay.pendingName != null && resolvedName === overlay.pendingName,
    statusConfirmed: overlay.pendingStatus != null && normalizeStructureStatus(assembly.status) === overlay.pendingStatus,
  };
}

function findOperatorInventoryRow(
  response: OperatorInventoryResponse,
  overlay: PendingStructureWriteOverlay,
): OperatorInventoryStructure | null {
  for (const nodeGroup of response.networkNodes) {
    if (overlayMatchesIdentifiers(overlay, nodeGroup.node.objectId, nodeGroup.node.assemblyId)) {
      return nodeGroup.node;
    }

    const childRow = nodeGroup.structures.find((row) => overlayMatchesIdentifiers(overlay, row.objectId, row.assemblyId));
    if (childRow) {
      return childRow;
    }
  }

  return response.unlinkedStructures.find((row) => overlayMatchesIdentifiers(overlay, row.objectId, row.assemblyId)) ?? null;
}

export function resolveStructureWriteConfirmation(
  response: OperatorInventoryResponse | null | undefined,
  lookup: NodeAssembliesLookupResult | null | undefined,
  overlay: PendingStructureWriteOverlay,
): {
  nameConfirmed: boolean;
  statusConfirmed: boolean;
  operatorInventoryConfirmed: boolean;
  nodeAssembliesConfirmed: boolean;
} {
  const operatorInventoryRow = response ? findOperatorInventoryRow(response, overlay) : null;
  const operatorInventoryResult = response
    ? resolveOperatorInventoryConfirmation(operatorInventoryRow, overlay)
    : { nameConfirmed: false, statusConfirmed: false };
  const nodeAssembliesResult = resolveNodeAssembliesConfirmation(lookup, overlay);
  const requireOperatorInventoryConfirmation = response != null;

  return {
    nameConfirmed: requireOperatorInventoryConfirmation
      ? operatorInventoryResult.nameConfirmed
      : nodeAssembliesResult.nameConfirmed,
    statusConfirmed: requireOperatorInventoryConfirmation
      ? operatorInventoryResult.statusConfirmed
      : nodeAssembliesResult.statusConfirmed,
    operatorInventoryConfirmed: operatorInventoryResult.nameConfirmed || operatorInventoryResult.statusConfirmed,
    nodeAssembliesConfirmed: nodeAssembliesResult.nameConfirmed || nodeAssembliesResult.statusConfirmed,
  };
}

export function applyStructureWriteOverlaysToOperatorInventory(
  response: OperatorInventoryResponse | null | undefined,
  overlays: readonly PendingStructureWriteOverlay[],
): OperatorInventoryResponse | null {
  if (!response || overlays.length === 0) {
    return response ?? null;
  }

  return {
    ...response,
    networkNodes: response.networkNodes.map((nodeGroup) => ({
      node: applyOverlayToOperatorInventoryRow(nodeGroup.node, overlays),
      structures: nodeGroup.structures.map((row) => applyOverlayToOperatorInventoryRow(row, overlays)),
    })),
    unlinkedStructures: response.unlinkedStructures.map((row) => applyOverlayToOperatorInventoryRow(row, overlays)),
  };
}