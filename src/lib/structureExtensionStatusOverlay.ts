import { mergeExtensionStatus } from "@/lib/extensionStatus";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type { ExtensionStatus, NetworkNodeGroup, ObjectId, Structure } from "@/types/domain";

export type StructureExtensionStatusOverlay = ReadonlyMap<ObjectId, ExtensionStatus>;

function isExtensionTrackedStructure(structure: Structure): boolean {
  return structure.type === "gate" || structure.type === "turret";
}

function overlayKey(objectId: string | null | undefined): ObjectId | null {
  return normalizeCanonicalObjectId(objectId);
}

export function buildStructureExtensionStatusOverlayTargetIds(structures: Structure[]): ObjectId[] {
  const ids = new Set<ObjectId>();

  for (const structure of structures) {
    if (!isExtensionTrackedStructure(structure) || structure.readModelSource !== "operator-inventory") {
      continue;
    }

    const normalizedId = overlayKey(structure.objectId);
    if (normalizedId) {
      ids.add(normalizedId);
    }
  }

  return [...ids].sort();
}

export function applyStructureExtensionStatusOverlay(
  structure: Structure,
  overlay: StructureExtensionStatusOverlay | null | undefined,
): Structure {
  const normalizedId = overlayKey(structure.objectId);
  const overlayStatus = normalizedId ? overlay?.get(normalizedId) : undefined;
  if (!overlayStatus || overlayStatus === "unknown") {
    return structure;
  }

  const extensionStatus = mergeExtensionStatus(overlayStatus, structure.extensionStatus);
  const summary = structure.summary
    ? {
        ...structure.summary,
        extensionStatus: mergeExtensionStatus(overlayStatus, structure.summary.extensionStatus),
      }
    : structure.summary;

  if (extensionStatus === structure.extensionStatus && summary === structure.summary) {
    return structure;
  }

  return {
    ...structure,
    extensionStatus,
    summary,
  };
}

export function applyStructureExtensionStatusOverlayToStructures(
  structures: Structure[],
  overlay: StructureExtensionStatusOverlay | null | undefined,
): Structure[] {
  if (!overlay || overlay.size === 0) {
    return structures;
  }

  return structures.map((structure) => applyStructureExtensionStatusOverlay(structure, overlay));
}

export function applyStructureExtensionStatusOverlayToNodeGroups(
  nodeGroups: NetworkNodeGroup[],
  overlay: StructureExtensionStatusOverlay | null | undefined,
): NetworkNodeGroup[] {
  if (!overlay || overlay.size === 0) {
    return nodeGroups;
  }

  return nodeGroups.map((group) => ({
    node: applyStructureExtensionStatusOverlay(group.node, overlay),
    gates: applyStructureExtensionStatusOverlayToStructures(group.gates, overlay),
    storageUnits: group.storageUnits,
    turrets: applyStructureExtensionStatusOverlayToStructures(group.turrets, overlay),
  }));
}
