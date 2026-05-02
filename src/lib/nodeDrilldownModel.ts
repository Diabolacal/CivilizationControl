import type { NetworkNodeGroup, Structure, StructureStatus } from "@/types/domain";
import { getItemTypeById, getItemTypeByName } from "@/lib/typeCatalog";
import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";

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

function cleanObservedName(
  structure: Structure,
  observed?: { name: string | null },
): string {
  const observedName = observed?.name?.trim();
  if (observedName) return observedName;
  return cleanStructureName(structure);
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
    | "isReadOnly"
    | "isActionable"
    | "backendSource"
    | "fetchedAt"
    | "lastUpdated"
    | "provenance"
    | "url"
    | "solarSystemId"
    | "energySourceId"
    | "fuelAmount"
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
    backendSource: structure.backendSource,
    fetchedAt: structure.fetchedAt,
    lastUpdated: structure.lastUpdated,
    provenance: structure.provenance,
    url: structure.url,
    solarSystemId: structure.solarSystemId,
    energySourceId: structure.energySourceId,
    fuelAmount: structure.fuelAmount,
    isReadOnly: structure.isReadOnly,
    isActionable: structure.isActionable,
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
  return buildLiveNodeLocalViewModelWithObserved(group);
}

export function buildLiveNodeLocalViewModelWithObserved(
  group: NetworkNodeGroup,
  observedLookup?: NodeAssembliesLookupResult | null,
): NodeLocalViewModel {
  const observedEntries = observedLookup?.status === "success" ? observedLookup.assemblies : [];
  const observedByKey = new Map<string, (typeof observedEntries)[number]>();

  for (const observed of observedEntries) {
    if (observed.objectId) {
      observedByKey.set(`object:${observed.objectId}`, observed);
    }
    if (observed.assemblyId) {
      observedByKey.set(`assembly:${observed.assemblyId}`, observed);
    }
  }

  const liveStructures = [...group.gates, ...group.storageUnits, ...group.turrets];
  const structures = sortNodeLocalStructures(
    [
      ...liveStructures.map((structure) => {
        const observed =
          observedByKey.get(`object:${normalizeCanonicalObjectId(structure.objectId) ?? structure.objectId}`) ??
          (structure.assemblyId ? observedByKey.get(`assembly:${structure.assemblyId}`) : undefined);
      const family = LIVE_FAMILY_MAP[structure.type];
      const typeLabel = observed?.typeName ?? structure.summary?.typeName ?? DEFAULT_TYPE_LABELS[family];
      const sizeVariant = deriveSizeVariant(typeLabel);
      const needsExtensionWarning =
        (structure.type === "gate" || structure.type === "turret") &&
        structure.extensionStatus !== "authorized";

      return createNodeLocalStructure({
        id: structure.objectId,
        objectId: structure.objectId,
        assemblyId: structure.assemblyId,
        linkedGateId: structure.linkedGateId ?? observed?.linkedGateId ?? undefined,
        displayName: cleanObservedName(structure, observed),
        family,
        sizeVariant,
        status: structure.status,
        source: "live",
        extensionStatus: structure.extensionStatus,
        typeLabel,
        typeId: observed?.typeId ?? structure.summary?.typeId,
        warningPip: structure.status === "warning" || needsExtensionWarning,
        backendSource: observed?.source ?? observedLookup?.source ?? null,
        fetchedAt: observedLookup?.fetchedAt,
        lastUpdated: observed?.lastUpdated,
        provenance: observed?.provenance ?? null,
        url: observed?.url ?? structure.summary?.url ?? null,
        solarSystemId: observed?.solarSystemId ?? structure.summary?.solarSystemId ?? null,
        energySourceId: observed?.energySourceId ?? structure.summary?.energySourceId ?? null,
        fuelAmount: observed?.fuelAmount ?? structure.summary?.fuelAmount ?? null,
        isReadOnly: false,
        isActionable: true,
      });
      }),
      ...buildBackendObservedStructures(liveStructures, observedEntries, observedLookup),
    ],
  );

  const hasBackendObservedStructures = structures.some((structure) => structure.source === "backendObserved");

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
      backendSource: hasBackendObservedStructures ? observedLookup?.source ?? null : null,
      fetchedAt: observedLookup?.fetchedAt,
      lastUpdated: null,
      provenance: hasBackendObservedStructures ? "node-local-indexer" : null,
      url: null,
      solarSystemId: group.node.summary?.solarSystemId ?? null,
      energySourceId: null,
      fuelAmount: group.node.fuel?.quantity?.toString() ?? null,
      isReadOnly: false,
      isActionable: true,
    },
    structures,
    source: "live",
    layoutAlgorithm: "family-bands-v1",
    coverage: hasBackendObservedStructures ? "live-plus-backend-observed" : "current-live-families",
  };
}

function buildBackendObservedStructures(
  liveStructures: Structure[],
  observedEntries: NonNullable<NodeAssembliesLookupResult>["assemblies"],
  observedLookup?: NodeAssembliesLookupResult | null,
): NodeLocalStructure[] {
  const liveObjectIds = new Set(
    liveStructures
      .map((structure) => normalizeCanonicalObjectId(structure.objectId))
      .filter((value): value is string => value != null),
  );
  const liveAssemblyIds = new Set(
    liveStructures
      .map((structure) => structure.assemblyId)
      .filter((value): value is string => value != null),
  );

  return observedEntries.flatMap((observed) => {
    if ((observed.objectId && liveObjectIds.has(observed.objectId)) || (observed.assemblyId && liveAssemblyIds.has(observed.assemblyId))) {
      return [];
    }

    const family = resolveObservedFamily(observed);
    if (!family || family === "networkNode") {
      return [];
    }

    const typeLabel = observed.typeName ?? resolveObservedTypeLabel(family, observed.typeId);
    const sizeVariant = deriveSizeVariant(typeLabel ?? undefined) ?? "standard";
    const displayName = normalizeObservedDisplayName(observed, family, typeLabel, observed.objectId, observed.assemblyId);
    const status = normalizeObservedStatus(observed.status);
    const id = observed.objectId ?? `assembly:${observed.assemblyId}`;

    return createNodeLocalStructure({
      id,
      objectId: observed.objectId ?? undefined,
      assemblyId: observed.assemblyId ?? undefined,
      linkedGateId: observed.linkedGateId ?? undefined,
      displayName,
      family,
      sizeVariant,
      status,
      source: "backendObserved",
      typeLabel,
      typeId: observed.typeId ?? undefined,
      warningPip: status === "warning",
      backendSource: observed.source ?? observedLookup?.source ?? null,
      fetchedAt: observedLookup?.fetchedAt,
      lastUpdated: observed.lastUpdated,
      provenance: observed.provenance,
      url: observed.url,
      solarSystemId: observed.solarSystemId,
      energySourceId: observed.energySourceId,
      fuelAmount: observed.fuelAmount,
      isReadOnly: true,
      isActionable: false,
    });
  });
}

function resolveObservedFamily(observed: { assemblyType: string | null; typeId: number | null; typeName: string | null }): NodeLocalFamily | null {
  const itemType = observed.typeId != null ? getItemTypeById(observed.typeId) : undefined;
  const candidates = [
    itemType?.name,
    itemType?.groupName,
    itemType?.categoryName,
    observed.typeName,
    observed.assemblyType,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  if (candidates.some((value) => value.includes("printer"))) return "printer";
  if (candidates.some((value) => value.includes("refiner") || value.includes("refinery"))) return "refinery";
  if (candidates.some((value) => value.includes("assembler"))) return "assembler";
  if (candidates.some((value) => value.includes("berth"))) return "berth";
  if (candidates.some((value) => value.includes("relay"))) return "relay";
  if (candidates.some((value) => value.includes("nursery"))) return "nursery";
  if (candidates.some((value) => value.includes("nest"))) return "nest";
  if (candidates.some((value) => value.includes("shelter") || value.includes("hangar") || value.includes("smart_hangar"))) return "shelter";
  if (candidates.some((value) => value.includes("trade post") || value.includes("trade_post") || value.includes("storage") || value.includes("storage_unit"))) return "tradePost";
  if (candidates.some((value) => value.includes("turret"))) return "turret";
  if (candidates.some((value) => value.includes("gate"))) return "gate";

  return null;
}

function resolveObservedTypeLabel(family: NodeLocalFamily, typeId: number | null): string {
  if (typeId != null) {
    const itemType = getItemTypeById(typeId);
    if (itemType) {
      return itemType.name;
    }
  }

  return DEFAULT_TYPE_LABELS[family];
}

function normalizeObservedDisplayName(
  observed: { name: string | null },
  family: NodeLocalFamily,
  typeLabel: string | null,
  objectId: string | null,
  assemblyId: string | null,
): string {
  const explicitName = observed.name?.trim();
  if (explicitName) return explicitName;

  const suffixSource = objectId ?? assemblyId;
  if (suffixSource) {
    const trimmed = suffixSource.replace(/^0x/, "");
    const suffix = trimmed.length > 8 ? trimmed.slice(0, 8) : trimmed;
    return `${typeLabel ?? DEFAULT_TYPE_LABELS[family]} ${suffix}`;
  }

  return typeLabel ?? DEFAULT_TYPE_LABELS[family];
}

function normalizeObservedStatus(status: string | null): StructureStatus {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) return "neutral";

  if (["online", "active", "powered", "running"].includes(normalized)) {
    return "online";
  }

  if (["offline", "inactive", "unpowered"].includes(normalized)) {
    return "offline";
  }

  if (["warning", "degraded", "low_fuel", "damaged"].includes(normalized)) {
    return "warning";
  }

  return "neutral";
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
        backendSource: null,
        fetchedAt: null,
        lastUpdated: null,
        provenance: null,
        url: null,
        solarSystemId: null,
        energySourceId: null,
        fuelAmount: null,
        isReadOnly: true,
        isActionable: false,
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
      backendSource: null,
      fetchedAt: null,
      lastUpdated: null,
      provenance: null,
      url: null,
      solarSystemId: null,
      energySourceId: null,
      fuelAmount: null,
      isReadOnly: true,
      isActionable: false,
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