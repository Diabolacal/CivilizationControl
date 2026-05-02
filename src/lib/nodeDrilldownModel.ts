import type { NetworkNodeGroup, Structure, StructureStatus } from "@/types/domain";
import { getItemTypeById, getItemTypeByName } from "@/lib/typeCatalog";

import type {
  NodeLocalBand,
  NodeLocalBadge,
  NodeLocalFamily,
  NodeLocalIconFamily,
  NodeLocalScenario,
  NodeLocalSizeVariant,
  NodeLocalStructure,
  NodeLocalTone,
  NodeLocalViewModel,
  SyntheticNodeLocalViewModelInput,
} from "./nodeDrilldownTypes";

const LIVE_FAMILY_MAP: Record<Structure["type"], NodeLocalFamily> = {
  gate: "gate",
  storage_unit: "tradePost",
  turret: "turret",
  network_node: "networkNode",
};

const BAND_BY_FAMILY: Record<Exclude<NodeLocalFamily, "networkNode">, NodeLocalBand> = {
  gate: "corridor",
  printer: "industry",
  refinery: "industry",
  assembler: "industry",
  tradePost: "logistics",
  berth: "logistics",
  relay: "support",
  nursery: "support",
  nest: "support",
  shelter: "support",
  turret: "defense",
};

const FAMILY_LABELS: Record<NodeLocalFamily, string> = {
  networkNode: "Network Node",
  gate: "Gate",
  tradePost: "Trade Post",
  turret: "Turret",
  printer: "Printer",
  refinery: "Refinery",
  assembler: "Assembler",
  berth: "Berth",
  relay: "Relay",
  nursery: "Nursery",
  nest: "Nest",
  shelter: "Shelter",
};

const ICON_FAMILY_MAP: Record<NodeLocalFamily, NodeLocalIconFamily> = {
  networkNode: "networkNode",
  gate: "gate",
  tradePost: "tradePost",
  turret: "turret",
  printer: "printer",
  refinery: "refinery",
  assembler: "assembler",
  berth: "berth",
  relay: "relay",
  nursery: "nursery",
  nest: "nest",
  shelter: "hangar",
};

const DEFAULT_TYPE_LABELS: Record<NodeLocalFamily, string> = {
  networkNode: "Network Node",
  gate: "Gate",
  tradePost: "Trade Post",
  turret: "Turret",
  printer: "Printer",
  refinery: "Refinery",
  assembler: "Assembler",
  berth: "Berth",
  relay: "Relay",
  nursery: "Nursery",
  nest: "Nest",
  shelter: "Shelter",
};

const DEFAULT_CATALOG_NAMES: Partial<Record<NodeLocalFamily, Partial<Record<Exclude<NodeLocalSizeVariant, null>, string>> & { standard?: string }>> = {
  gate: { mini: "Mini Gate", heavy: "Heavy Gate", standard: "Gate" },
  tradePost: { mini: "Mini Storage", standard: "Storage", heavy: "Heavy Storage" },
  turret: { mini: "Mini Turret", standard: "Turret", heavy: "Heavy Turret" },
  printer: { mini: "Mini Printer", standard: "Printer", heavy: "Heavy Printer" },
  refinery: { standard: "Refinery", heavy: "Heavy Refinery" },
  assembler: { standard: "Assembler" },
  berth: { mini: "Mini Berth", standard: "Berth", heavy: "Heavy Berth" },
  relay: { standard: "Relay" },
  nursery: { standard: "Nursery" },
  nest: { standard: "Nest" },
  shelter: { standard: "Shelter", heavy: "Heavy Shelter" },
};

const BAND_ORDER: Record<NodeLocalBand, number> = {
  corridor: 0,
  industry: 1,
  logistics: 2,
  support: 3,
  defense: 4,
};

const FAMILY_ORDER: Record<Exclude<NodeLocalFamily, "networkNode">, number> = {
  gate: 0,
  printer: 1,
  refinery: 2,
  assembler: 3,
  tradePost: 4,
  berth: 5,
  relay: 6,
  nursery: 7,
  nest: 8,
  shelter: 9,
  turret: 10,
};

const SIZE_ORDER: Record<Exclude<NodeLocalSizeVariant, null>, number> = {
  mini: 0,
  standard: 1,
  heavy: 2,
};

function statusToTone(status: StructureStatus): NodeLocalTone {
  switch (status) {
    case "online":
      return "online";
    case "offline":
      return "offline";
    case "warning":
      return "warning";
    default:
      return "neutral";
  }
}

function sizeToBadge(sizeVariant: NodeLocalSizeVariant): NodeLocalBadge {
  if (sizeVariant === "mini") return "M";
  if (sizeVariant === "heavy") return "H";
  return null;
}

function deriveSizeVariant(typeLabel?: string | null): NodeLocalSizeVariant {
  if (!typeLabel) return null;
  const normalized = typeLabel.toLowerCase();
  if (normalized.includes("heavy")) return "heavy";
  if (normalized.includes("mini") || normalized.includes("field")) return "mini";
  if (
    normalized.includes("gate") ||
    normalized.includes("storage") ||
    normalized.includes("trade post") ||
    normalized.includes("turret") ||
    normalized.includes("printer") ||
    normalized.includes("refinery") ||
    normalized.includes("assembler") ||
    normalized.includes("berth") ||
    normalized.includes("relay") ||
    normalized.includes("nursery") ||
    normalized.includes("nest") ||
    normalized.includes("shelter")
  ) {
    return "standard";
  }
  return null;
}

function cleanStructureName(structure: Structure): string {
  const enrichedName = structure.summary?.name?.trim();
  if (enrichedName) return enrichedName;
  return structure.name.replace(/\s+[0-9a-f]{8}$/i, "").trim() || DEFAULT_TYPE_LABELS[LIVE_FAMILY_MAP[structure.type]];
}

function resolveTypeLabel(
  family: NodeLocalFamily,
  explicitTypeLabel?: string | null,
  explicitTypeId?: number,
  sizeVariant?: NodeLocalSizeVariant,
): { typeLabel: string; typeId?: number } {
  if (explicitTypeId != null) {
    const itemType = getItemTypeById(explicitTypeId);
    if (itemType) {
      return { typeLabel: itemType.name, typeId: itemType.typeId };
    }
  }

  if (explicitTypeLabel) {
    const itemType = getItemTypeByName(explicitTypeLabel);
    if (itemType) {
      return { typeLabel: itemType.name, typeId: itemType.typeId };
    }
    return { typeLabel: explicitTypeLabel };
  }

  const catalogName = sizeVariant ? DEFAULT_CATALOG_NAMES[family]?.[sizeVariant] : undefined;
  if (catalogName) {
    const itemType = getItemTypeByName(catalogName);
    if (itemType) {
      return { typeLabel: itemType.name, typeId: itemType.typeId };
    }
    return { typeLabel: catalogName };
  }

  const fallbackLabel = DEFAULT_CATALOG_NAMES[family]?.standard ?? DEFAULT_TYPE_LABELS[family];
  const fallbackType = getItemTypeByName(fallbackLabel);
  return { typeLabel: fallbackLabel, typeId: fallbackType?.typeId };
}

function createNodeLocalStructure(
  structure: Pick<
    NodeLocalStructure,
    | "id"
    | "objectId"
    | "assemblyId"
    | "linkedGateId"
    | "displayName"
    | "family"
    | "sizeVariant"
    | "status"
    | "source"
    | "extensionStatus"
  > & {
    typeLabel?: string | null;
    typeId?: number;
    warningPip?: boolean;
  },
): NodeLocalStructure {
  const { family, sizeVariant } = structure;
  const resolvedType = resolveTypeLabel(family, structure.typeLabel, structure.typeId, sizeVariant);

  return {
    id: structure.id,
    objectId: structure.objectId,
    assemblyId: structure.assemblyId,
    linkedGateId: structure.linkedGateId,
    typeId: resolvedType.typeId,
    displayName: structure.displayName,
    typeLabel: resolvedType.typeLabel,
    family,
    familyLabel: FAMILY_LABELS[family],
    iconFamily: ICON_FAMILY_MAP[family],
    band: BAND_BY_FAMILY[family as Exclude<NodeLocalFamily, "networkNode">],
    sizeVariant,
    badge: sizeToBadge(sizeVariant),
    status: structure.status,
    tone: statusToTone(structure.status),
    warningPip: structure.warningPip ?? structure.status === "warning",
    source: structure.source,
    extensionStatus: structure.extensionStatus,
    sortLabel: structure.displayName.toLowerCase(),
  };
}

function fuelSummary(structure: Structure): string | undefined {
  if (!structure.fuel) return undefined;
  const units = structure.fuel.quantity.toLocaleString();
  if (!structure.fuel.isBurning) return `${units} units loaded`;
  return `${units} units burning`;
}

export function sortNodeLocalStructures(structures: NodeLocalStructure[]): NodeLocalStructure[] {
  return [...structures].sort((left, right) => {
    const bandDiff = BAND_ORDER[left.band] - BAND_ORDER[right.band];
    if (bandDiff !== 0) return bandDiff;

    const familyDiff = FAMILY_ORDER[left.family as Exclude<NodeLocalFamily, "networkNode">] - FAMILY_ORDER[right.family as Exclude<NodeLocalFamily, "networkNode">];
    if (familyDiff !== 0) return familyDiff;

    const leftSize = left.sizeVariant ? SIZE_ORDER[left.sizeVariant] : SIZE_ORDER.standard;
    const rightSize = right.sizeVariant ? SIZE_ORDER[right.sizeVariant] : SIZE_ORDER.standard;
    if (leftSize !== rightSize) return leftSize - rightSize;

    const labelDiff = left.sortLabel.localeCompare(right.sortLabel);
    if (labelDiff !== 0) return labelDiff;

    return left.id.localeCompare(right.id);
  });
}

export function buildLiveNodeLocalViewModel(group: NetworkNodeGroup): NodeLocalViewModel {
  const structures = sortNodeLocalStructures(
    [...group.gates, ...group.storageUnits, ...group.turrets].map((structure) => {
      const family = LIVE_FAMILY_MAP[structure.type];
      const typeLabel = structure.summary?.typeName ?? DEFAULT_TYPE_LABELS[family];
      const sizeVariant = deriveSizeVariant(typeLabel);
      const needsExtensionWarning =
        (structure.type === "gate" || structure.type === "turret") &&
        structure.extensionStatus !== "authorized";

      return createNodeLocalStructure({
        id: structure.objectId,
        objectId: structure.objectId,
        assemblyId: structure.assemblyId,
        linkedGateId: structure.linkedGateId,
        displayName: cleanStructureName(structure),
        family,
        sizeVariant,
        status: structure.status,
        source: "live",
        extensionStatus: structure.extensionStatus,
        typeLabel,
        typeId: structure.summary?.typeId,
        warningPip: structure.status === "warning" || needsExtensionWarning,
      });
    }),
  );

  return {
    node: {
      id: group.node.objectId,
      objectId: group.node.objectId,
      displayName: cleanStructureName(group.node),
      status: group.node.status,
      tone: statusToTone(group.node.status),
      warningPip: group.node.status === "warning",
      source: "live",
      fuelSummary: fuelSummary(group.node),
      extensionStatus: group.node.extensionStatus,
      solarSystemName: group.node.summary?.solarSystemId ?? (group.solarSystemId != null ? `System ${group.solarSystemId}` : null),
      isSyntheticContainer: group.node.objectId === "unassigned",
    },
    structures,
    source: "live",
    layoutAlgorithm: "family-bands-v1",
    coverage: "current-live-families",
  };
}

export function buildSyntheticNodeLocalViewModel(
  input: SyntheticNodeLocalViewModelInput,
): NodeLocalViewModel {
  const structures = sortNodeLocalStructures(
    input.structures.map((structure, index) => {
      const family = structure.family;
      const sizeVariant = structure.sizeVariant ?? deriveSizeVariant(structure.typeLabel ?? undefined) ?? "standard";

      return createNodeLocalStructure({
        id: `${input.nodeId}:${family}:${index + 1}`,
        displayName: structure.displayName,
        family,
        sizeVariant,
        status: structure.status ?? "online",
        source: "synthetic",
        typeLabel: structure.typeLabel,
        warningPip: structure.warningPip,
        linkedGateId: structure.linkedGateId,
      });
    }),
  );

  return {
    node: {
      id: input.nodeId,
      displayName: input.nodeLabel,
      status: input.nodeStatus ?? "online",
      tone: statusToTone(input.nodeStatus ?? "online"),
      warningPip: input.nodeWarningPip ?? false,
      source: "synthetic",
      solarSystemName: input.solarSystemName ?? null,
    },
    structures,
    source: "synthetic",
    layoutAlgorithm: "family-bands-v1",
    coverage: "synthetic-expanded",
  };
}

export function formatNodeLocalStatus(status: StructureStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatNodeLocalSize(sizeVariant: NodeLocalSizeVariant): string | null {
  if (sizeVariant == null) return null;
  if (sizeVariant === "mini") return "Mini";
  if (sizeVariant === "heavy") return "Heavy";
  return "Standard";
}

export function summarizeNodeLocalFamilies(viewModel: NodeLocalViewModel): string {
  const counts = new Map<string, number>();
  for (const structure of viewModel.structures) {
    counts.set(structure.familyLabel, (counts.get(structure.familyLabel) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => `${count} ${label}${count === 1 ? "" : "s"}`)
    .join(" • ");
}

export function findNodeLocalStructure(
  viewModel: NodeLocalViewModel,
  structureId: string | null,
): NodeLocalStructure | null {
  if (structureId == null) return null;
  return viewModel.structures.find((structure) => structure.id === structureId) ?? null;
}

export type { NodeLocalScenario };