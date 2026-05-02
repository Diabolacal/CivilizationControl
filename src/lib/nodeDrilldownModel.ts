import type { NetworkNodeGroup, Structure, StructureStatus } from "@/types/domain";
import { getItemTypeById, getItemTypeByName } from "@/lib/typeCatalog";
import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import {
  bucketByNodeDrilldownDomainIdentity,
  createNodeDrilldownIdentityAliases,
  describeLiveNodeDrilldownIdentity,
  describeObservedNodeDrilldownIdentity,
  describeRenderedNodeDrilldownIdentity,
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
  summarizeNodeDrilldownIdentityBuckets,
  type NodeDrilldownDebugSnapshot,
  type NodeDrilldownIdentityBucket,
} from "@/lib/nodeDrilldownIdentity";

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
  tradePost: "Storage",
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
  tradePost: "Storage",
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

type ObservedAssembly = NodeAssembliesLookupResult["assemblies"][number];

interface ObservedAssemblyIndex {
  byCanonicalKey: Map<string, ObservedAssembly>;
  aliasToCanonicalKey: Map<string, string>;
}

interface FinalizedNodeLocalStructures {
  structures: NodeLocalStructure[];
  candidateBuckets: NodeDrilldownIdentityBucket<NodeLocalStructure>[];
}

interface LiveNodeLocalBuildArtifacts {
  liveStructures: Structure[];
  observedEntries: ObservedAssembly[];
  candidateStructures: NodeLocalStructure[];
  finalization: FinalizedNodeLocalStructures;
}

const GENERIC_DISPLAY_NAME_ALIASES: Partial<Record<NodeLocalFamily, string[]>> = {
  networkNode: ["network node"],
  gate: ["gate"],
  tradePost: ["trade post", "storage", "storage unit"],
  turret: ["turret"],
  printer: ["printer"],
  refinery: ["refinery"],
  assembler: ["assembler"],
  berth: ["berth"],
  relay: ["relay"],
  nursery: ["nursery"],
  nest: ["nest"],
  shelter: ["shelter"],
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

function createAssemblyIdentityAliases(identity: {
  objectId?: string | null;
  assemblyId?: string | null;
}): string[] {
  return createNodeDrilldownIdentityAliases(identity);
}

function selectCanonicalAssemblyKey(
  identity: { objectId?: string | null; assemblyId?: string | null },
  fallbackAliases: Iterable<string> = [],
): string | null {
  return selectCanonicalNodeDrilldownDomainKey(identity, fallbackAliases);
}

function mergeObservedAssemblyEntry(
  current: ObservedAssembly,
  next: ObservedAssembly,
): ObservedAssembly {
  return {
    objectId: next.objectId ?? current.objectId,
    assemblyId: next.assemblyId ?? current.assemblyId,
    linkedGateId: next.linkedGateId ?? current.linkedGateId,
    assemblyType: next.assemblyType ?? current.assemblyType,
    typeId: next.typeId ?? current.typeId,
    name: next.name ?? current.name,
    status: next.status ?? current.status,
    fuelAmount: next.fuelAmount ?? current.fuelAmount,
    solarSystemId: next.solarSystemId ?? current.solarSystemId,
    energySourceId: next.energySourceId ?? current.energySourceId,
    url: next.url ?? current.url,
    lastUpdated: next.lastUpdated ?? current.lastUpdated,
    typeName: next.typeName ?? current.typeName,
    source: next.source ?? current.source,
    provenance: next.provenance ?? current.provenance,
  };
}

function createObservedAssemblyIndex(
  observedEntries: ObservedAssembly[],
): ObservedAssemblyIndex {
  const byCanonicalKey = new Map<string, ObservedAssembly>();
  const aliasToCanonicalKey = new Map<string, string>();

  for (const observed of observedEntries) {
    const entryAliases = createAssemblyIdentityAliases(observed);
    if (entryAliases.length === 0) continue;

    const matchedCanonicalKeys = [...new Set(
      entryAliases
        .map((alias) => aliasToCanonicalKey.get(alias))
        .filter((alias): alias is string => alias != null),
    )];

    let mergedEntry = observed;
    const mergedAliases = new Set(entryAliases);

    for (const canonicalKey of matchedCanonicalKeys) {
      const existingEntry = byCanonicalKey.get(canonicalKey);
      if (!existingEntry) continue;

      mergedEntry = mergeObservedAssemblyEntry(existingEntry, mergedEntry);
      for (const alias of createAssemblyIdentityAliases(existingEntry)) {
        mergedAliases.add(alias);
      }
      byCanonicalKey.delete(canonicalKey);
    }

    for (const alias of createAssemblyIdentityAliases(mergedEntry)) {
      mergedAliases.add(alias);
    }

    const canonicalKey = selectCanonicalAssemblyKey(mergedEntry, mergedAliases);
    if (!canonicalKey) continue;

    byCanonicalKey.set(canonicalKey, mergedEntry);
    for (const alias of mergedAliases) {
      aliasToCanonicalKey.set(alias, canonicalKey);
    }
  }

  return { byCanonicalKey, aliasToCanonicalKey };
}

function findObservedAssembly(
  observedIndex: ObservedAssemblyIndex,
  identity: { objectId?: string | null; assemblyId?: string | null },
): ObservedAssembly | undefined {
  let mergedEntry: ObservedAssembly | undefined;
  const seenCanonicalKeys = new Set<string>();

  for (const alias of createAssemblyIdentityAliases(identity)) {
    const canonicalKey = observedIndex.aliasToCanonicalKey.get(alias);
    if (!canonicalKey || seenCanonicalKeys.has(canonicalKey)) continue;

    seenCanonicalKeys.add(canonicalKey);

    const entry = observedIndex.byCanonicalKey.get(canonicalKey);
    if (entry) {
      mergedEntry = mergedEntry
        ? mergeObservedAssemblyEntry(mergedEntry, entry)
        : entry;
    }
  }

  return mergedEntry;
}

function cleanStructureName(structure: Structure): string {
  const enrichedName = structure.summary?.name?.trim();
  if (enrichedName) return enrichedName;
  return structure.name.replace(/\s+[0-9a-f]{8}$/i, "").trim() || DEFAULT_TYPE_LABELS[LIVE_FAMILY_MAP[structure.type]];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildIdentitySuffix(
  objectId?: string | null,
  assemblyId?: string | null,
): string | null {
  const source = normalizeCanonicalObjectId(objectId) ?? normalizeNodeDrilldownAssemblyId(assemblyId);
  if (!source) return null;

  const trimmed = source.replace(/^0x/, "");
  return trimmed.length > 8 ? trimmed.slice(0, 8) : trimmed;
}

function getGenericDisplayNameAliases(family: NodeLocalFamily): string[] {
  return [...new Set([
    ...(GENERIC_DISPLAY_NAME_ALIASES[family] ?? []),
    FAMILY_LABELS[family],
    DEFAULT_TYPE_LABELS[family],
    ...Object.values(DEFAULT_CATALOG_NAMES[family] ?? {}).filter((value): value is string => typeof value === "string"),
  ])];
}

function normalizeNodeLocalDisplayName(
  rawName: string | null | undefined,
  family: NodeLocalFamily,
  typeLabel: string,
  objectId?: string | null,
  assemblyId?: string | null,
): string {
  const trimmed = rawName?.trim() ?? null;
  const fallbackSuffix = buildIdentitySuffix(objectId, assemblyId);

  if (!trimmed) {
    return fallbackSuffix ? `${typeLabel} ${fallbackSuffix}` : typeLabel;
  }

  for (const alias of getGenericDisplayNameAliases(family)) {
    const match = trimmed.match(new RegExp(`^${escapeRegExp(alias)}(?:\\s+([0-9a-f]{8}))?$`, "i"));
    if (!match) continue;

    return match[1] ? `${typeLabel} ${match[1]}` : typeLabel;
  }

  return trimmed;
}

function resolveLiveDisplayName(
  structure: Structure,
  family: NodeLocalFamily,
  typeLabel: string,
  observed?: Pick<ObservedAssembly, "name">,
): string {
  const candidateName = observed?.name?.trim() || cleanStructureName(structure);
  return normalizeNodeLocalDisplayName(candidateName, family, typeLabel, structure.objectId, structure.assemblyId);
}

function mergeLiveStructureStatus(
  liveStatus: StructureStatus,
  observedStatus: string | null | undefined,
): StructureStatus {
  if (liveStatus !== "neutral") {
    return liveStatus;
  }

  return normalizeObservedStatus(observedStatus ?? null);
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
    | "canonicalDomainKey"
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
    canonicalDomainKey: structure.canonicalDomainKey,
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

function typeSpecificityScore(structure: NodeLocalStructure): number {
  let score = 0;

  if (structure.typeId != null) score += 4;
  if (structure.sizeVariant === "mini" || structure.sizeVariant === "heavy") score += 3;
  if (structure.typeLabel !== structure.familyLabel) score += 1;
  if (structure.displayName !== structure.typeLabel) score += 1;
  if (structure.source === "backendObserved") score += 1;

  return score;
}

function preferDisplayStructure(
  left: NodeLocalStructure,
  right: NodeLocalStructure,
): NodeLocalStructure {
  const leftScore = typeSpecificityScore(left);
  const rightScore = typeSpecificityScore(right);

  if (rightScore > leftScore) return right;
  if (rightScore < leftScore) return left;

  if (left.source === "live" && right.source !== "live") {
    return right;
  }

  return left;
}

function pickFirstDefined<T>(values: Array<T | null | undefined>): T | undefined {
  return values.find((value): value is T => value != null);
}

function pickLatestTimestamp(values: Array<string | null | undefined>): string | null {
  let latestValue: string | null = null;
  let latestTimestamp = -Infinity;

  for (const value of values) {
    if (!value) continue;

    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      if (latestValue == null) {
        latestValue = value;
      }
      continue;
    }

    if (parsed > latestTimestamp) {
      latestTimestamp = parsed;
      latestValue = value;
    }
  }

  return latestValue;
}

function mergeCollapsedStructureStatus(rows: NodeLocalStructure[]): StructureStatus {
  const liveStatus = rows.find((row) => row.source === "live" && row.status !== "neutral")?.status;
  if (liveStatus) {
    return liveStatus;
  }

  return rows.find((row) => row.status !== "neutral")?.status ?? "neutral";
}

function mergeNodeLocalStructureBucket(
  bucket: NodeDrilldownIdentityBucket<NodeLocalStructure>,
): NodeLocalStructure {
  const liveRow = bucket.entries.find((entry) => entry.source === "live");
  const authoritativeRow = liveRow ?? bucket.entries.find((entry) => entry.source === "backendObserved") ?? bucket.entries[0];
  const displayRow = bucket.entries.reduce(preferDisplayStructure, authoritativeRow);
  const mergedSource = liveRow
    ? "live"
    : bucket.entries.some((entry) => entry.source === "backendObserved")
      ? "backendObserved"
      : "synthetic";

  const objectId = pickFirstDefined(bucket.entries.map((entry) => entry.objectId));
  const assemblyId = normalizeNodeDrilldownAssemblyId(
    pickFirstDefined(bucket.entries.map((entry) => entry.assemblyId)),
  ) ?? undefined;
  const renderId = liveRow?.id
    ?? objectId
    ?? (assemblyId ? `assembly:${assemblyId}` : authoritativeRow.id);
  const status = mergeCollapsedStructureStatus(bucket.entries);
  const sizeVariant = displayRow.sizeVariant ?? deriveSizeVariant(displayRow.typeLabel) ?? authoritativeRow.sizeVariant;

  return createNodeLocalStructure({
    id: renderId,
    canonicalDomainKey: bucket.canonicalDomainKey,
    objectId,
    assemblyId,
    linkedGateId: pickFirstDefined(bucket.entries.map((entry) => entry.linkedGateId)),
    displayName: displayRow.displayName,
    family: liveRow?.family ?? authoritativeRow.family,
    sizeVariant,
    status,
    source: mergedSource,
    extensionStatus: liveRow?.extensionStatus ?? authoritativeRow.extensionStatus,
    typeLabel: displayRow.typeLabel,
    typeId: displayRow.typeId ?? authoritativeRow.typeId,
    warningPip: bucket.entries.some((entry) => entry.warningPip) || status === "warning",
    backendSource: pickFirstDefined(bucket.entries.map((entry) => entry.backendSource ?? undefined)) ?? null,
    fetchedAt: pickLatestTimestamp(bucket.entries.map((entry) => entry.fetchedAt)) ?? null,
    lastUpdated: pickLatestTimestamp(bucket.entries.map((entry) => entry.lastUpdated)) ?? null,
    provenance: pickFirstDefined(bucket.entries.map((entry) => entry.provenance ?? undefined)) ?? null,
    url: pickFirstDefined(bucket.entries.map((entry) => entry.url ?? undefined)) ?? null,
    solarSystemId: pickFirstDefined(bucket.entries.map((entry) => entry.solarSystemId ?? undefined)) ?? null,
    energySourceId: pickFirstDefined(bucket.entries.map((entry) => entry.energySourceId ?? undefined)) ?? null,
    fuelAmount: pickFirstDefined(bucket.entries.map((entry) => entry.fuelAmount ?? undefined)) ?? null,
    isReadOnly: mergedSource !== "live",
    isActionable: mergedSource === "live",
  });
}

function finalizeNodeLocalStructures(
  candidateStructures: NodeLocalStructure[],
): FinalizedNodeLocalStructures {
  const candidateBuckets = bucketByNodeDrilldownDomainIdentity(candidateStructures, (structure) => ({
    objectId: structure.objectId,
    assemblyId: structure.assemblyId,
    renderId: structure.id,
    source: structure.source,
  }));

  return {
    candidateBuckets,
    structures: sortNodeLocalStructures(candidateBuckets.map(mergeNodeLocalStructureBucket)),
  };
}

function buildLiveNodeLocalArtifacts(
  group: NetworkNodeGroup,
  observedLookup?: NodeAssembliesLookupResult | null,
): LiveNodeLocalBuildArtifacts {
  const observedEntries = observedLookup?.status === "success" ? observedLookup.assemblies : [];
  const observedIndex = createObservedAssemblyIndex(observedEntries);

  const liveStructures = [...group.gates, ...group.storageUnits, ...group.turrets];
  const liveIdentityAliases = new Set(
    liveStructures.flatMap((structure) =>
      createAssemblyIdentityAliases({ objectId: structure.objectId, assemblyId: structure.assemblyId }),
    ),
  );

  const candidateStructures = [
    ...liveStructures.map((structure) => {
      const observed = findObservedAssembly(observedIndex, {
        objectId: structure.objectId,
        assemblyId: structure.assemblyId,
      });
      const family = LIVE_FAMILY_MAP[structure.type];
      const resolvedType = resolveTypeLabel(
        family,
        observed?.typeName ?? structure.summary?.typeName ?? null,
        observed?.typeId ?? structure.summary?.typeId,
        null,
      );
      const sizeVariant = deriveSizeVariant(resolvedType.typeLabel);
      const status = mergeLiveStructureStatus(structure.status, observed?.status);
      const needsExtensionWarning =
        (structure.type === "gate" || structure.type === "turret") &&
        structure.extensionStatus !== "authorized";

      return createNodeLocalStructure({
        id: structure.objectId,
        canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey({
          objectId: structure.objectId,
          assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
          renderId: structure.objectId,
          source: "live",
        }) ?? `unresolved:${structure.objectId}`,
        objectId: structure.objectId,
        assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId) ?? undefined,
        linkedGateId: structure.linkedGateId ?? observed?.linkedGateId ?? undefined,
        displayName: resolveLiveDisplayName(structure, family, resolvedType.typeLabel, observed),
        family,
        sizeVariant,
        status,
        source: "live",
        extensionStatus: structure.extensionStatus,
        typeLabel: resolvedType.typeLabel,
        typeId: resolvedType.typeId,
        warningPip: status === "warning" || needsExtensionWarning,
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
    ...buildBackendObservedStructures(liveIdentityAliases, observedIndex, observedLookup),
  ];

  return {
    liveStructures,
    observedEntries,
    candidateStructures,
    finalization: finalizeNodeLocalStructures(candidateStructures),
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
  const { finalization } = buildLiveNodeLocalArtifacts(group, observedLookup);
  const { structures } = finalization;

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

export function buildNodeDrilldownDebugSnapshot(
  group: NetworkNodeGroup,
  observedLookup?: NodeAssembliesLookupResult | null,
): NodeDrilldownDebugSnapshot {
  const artifacts = buildLiveNodeLocalArtifacts(group, observedLookup);
  const candidateBuckets = summarizeNodeDrilldownIdentityBuckets(
    artifacts.finalization.candidateBuckets,
    (structure) => ({
      objectId: structure.objectId,
      assemblyId: structure.assemblyId,
      renderId: structure.id,
      source: structure.source,
    }),
  );

  return {
    nodeId: group.node.objectId,
    lookupStatus: observedLookup?.status ?? "none",
    coverage: artifacts.finalization.structures.some((structure) => structure.source === "backendObserved")
      ? "live-plus-backend-observed"
      : "current-live-families",
    fetchedAt: observedLookup?.fetchedAt ?? null,
    liveRows: artifacts.liveStructures.map(describeLiveNodeDrilldownIdentity),
    backendRows: artifacts.observedEntries.map(describeObservedNodeDrilldownIdentity),
    candidateRows: artifacts.candidateStructures.map(describeRenderedNodeDrilldownIdentity),
    candidateBuckets,
    duplicateBuckets: candidateBuckets.filter((bucket) => bucket.renderIds.length > 1),
    finalRows: artifacts.finalization.structures.map(describeRenderedNodeDrilldownIdentity),
    finalRenderIds: artifacts.finalization.structures.map((structure) => structure.id),
  };
}

function buildBackendObservedStructures(
  liveIdentityAliases: ReadonlySet<string>,
  observedIndex: ObservedAssemblyIndex,
  observedLookup?: NodeAssembliesLookupResult | null,
): NodeLocalStructure[] {
  return [...observedIndex.byCanonicalKey.values()].flatMap((observed) => {
    const observedAliases = createAssemblyIdentityAliases(observed);
    if (observedAliases.some((alias) => liveIdentityAliases.has(alias))) {
      return [];
    }

    const family = resolveObservedFamily(observed);
    if (!family || family === "networkNode") {
      return [];
    }

    const resolvedType = resolveTypeLabel(
      family,
      observed.typeName ?? resolveObservedTypeLabel(family, observed.typeId),
      observed.typeId ?? undefined,
      null,
    );
    const sizeVariant = deriveSizeVariant(resolvedType.typeLabel) ?? "standard";
    const displayName = normalizeNodeLocalDisplayName(
      observed.name,
      family,
      resolvedType.typeLabel,
      observed.objectId,
      observed.assemblyId,
    );
    const status = normalizeObservedStatus(observed.status);
    const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(observed.assemblyId);
    const id = observed.objectId ?? (normalizedAssemblyId ? `assembly:${normalizedAssemblyId}` : "assembly:missing");

    return createNodeLocalStructure({
      id,
      canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey({
        objectId: observed.objectId,
        assemblyId: normalizedAssemblyId,
        renderId: id,
        source: "backendObserved",
      }) ?? `unresolved:${id}`,
      objectId: observed.objectId ?? undefined,
      assemblyId: normalizedAssemblyId ?? undefined,
      linkedGateId: observed.linkedGateId ?? undefined,
      displayName,
      family,
      sizeVariant,
      status,
      source: "backendObserved",
      typeLabel: resolvedType.typeLabel,
      typeId: resolvedType.typeId,
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

function normalizeObservedStatus(status: string | null): StructureStatus {
  const normalized = status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized || ["unknown", "null"].includes(normalized)) return "neutral";

  if (["online", "active", "powered", "running", "onlined"].includes(normalized)) {
    return "online";
  }

  if (["offline", "inactive", "unpowered"].includes(normalized)) {
    return "offline";
  }

  if (["warning", "degraded", "low_fuel", "lowfuel", "damaged"].includes(normalized)) {
    return "warning";
  }

  if (["unanchored"].includes(normalized)) {
    return "neutral";
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
        canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey({
          renderId: `${input.nodeId}:${family}:${index + 1}`,
          source: "synthetic",
        }) ?? `synthetic:${input.nodeId}:${family}:${index + 1}`,
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