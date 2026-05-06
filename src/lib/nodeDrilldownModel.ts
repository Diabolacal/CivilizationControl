import type { AssemblySummary, NetworkNodeGroup, Structure, StructureStatus } from "@/types/domain";
import { buildFuelPresentation, formatFuelPresentationSummary, getIndexedFuelAmount } from "@/lib/fuelRuntime";
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
  type NodeDrilldownDebugSnapshot,
  type NodeDrilldownIdentityBucket,
} from "@/lib/nodeDrilldownIdentity";

import type {
  NodeLocalBand,
  NodeLocalActionAuthority,
  NodeLocalActionCandidateTarget,
  NodeLocalBadge,
  NodeLocalFamily,
  NodeLocalIconFamily,
  NodeLocalSupportedPowerType,
  NodeLocalScenario,
  NodeLocalSourceMode,
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
type IndexedPowerAction = Exclude<NonNullable<ObservedAssembly["actionCandidate"]>["actions"]["power"], null>;

interface ObservedAssemblyBucket {
  entry: ObservedAssembly;
  aliasSet: string[];
}

interface ObservedAssemblyIndex {
  byCanonicalKey: Map<string, ObservedAssemblyBucket>;
  aliasToCanonicalKey: Map<string, string>;
}

interface FinalizedNodeLocalStructures {
  structures: NodeLocalStructure[];
}

interface LiveStructureIndex {
  buckets: NodeDrilldownIdentityBucket<Structure>[];
  aliasToCanonicalKey: Map<string, string>;
}

interface SelectedNodeStructuresBuildResult {
  liveStructures: Structure[];
  observedEntries: ObservedAssembly[];
  structures: NodeLocalStructure[];
  sourceMode: NodeLocalSourceMode;
  omittedBackendCount: number;
}

interface BuildNodeDrilldownOptions {
  isLoading?: boolean;
  preferObservedMembership?: boolean;
  requireObservedMembership?: boolean;
}

interface NodeLocalActionTargetFallback {
  structureId?: NodeLocalActionCandidateTarget["structureId"] | null;
  structureType?: NodeLocalActionCandidateTarget["structureType"] | null;
  ownerCapId?: NodeLocalActionCandidateTarget["ownerCapId"] | null;
  networkNodeId?: NodeLocalActionCandidateTarget["networkNodeId"] | null;
}

const SUPPORTED_POWER_TYPE_BY_FAMILY: Partial<Record<NodeLocalFamily, NodeLocalSupportedPowerType>> = {
  gate: "gate",
  tradePost: "storage_unit",
  printer: "assembly",
  refinery: "assembly",
  assembler: "assembly",
  berth: "assembly",
  relay: "assembly",
  nursery: "assembly",
  nest: "assembly",
  shelter: "assembly",
  turret: "turret",
};

function normalizeIndexedActionTargetTypeForFamily(
  family: NodeLocalFamily,
  structureType: NodeLocalActionCandidateTarget["structureType"] | null,
): NodeLocalActionCandidateTarget["structureType"] | null {
  const supportedPowerType = SUPPORTED_POWER_TYPE_BY_FAMILY[family] ?? null;
  if (!supportedPowerType) {
    return structureType;
  }

  if (supportedPowerType === "assembly") {
    if (structureType == null || structureType === "assembly") {
      return "assembly";
    }

    if (structureType === "network_node" || structureType === "gate" || structureType === "turret") {
      return null;
    }

    return "assembly";
  }

  return structureType === supportedPowerType ? supportedPowerType : null;
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

function parseDisplayTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareObservedDisplayFreshness(
  current: ObservedAssembly,
  next: ObservedAssembly,
): number {
  const currentTimestamp = parseDisplayTimestamp(current.displayNameUpdatedAt);
  const nextTimestamp = parseDisplayTimestamp(next.displayNameUpdatedAt);
  if (currentTimestamp != null && nextTimestamp != null && currentTimestamp !== nextTimestamp) {
    return nextTimestamp - currentTimestamp;
  }

  if (currentTimestamp == null && nextTimestamp != null) return 1;
  if (currentTimestamp != null && nextTimestamp == null) return -1;
  if (!current.displayNameSource && next.displayNameSource) return 1;
  if (current.displayNameSource && !next.displayNameSource) return -1;
  if (!current.displayName && next.displayName) return 1;
  if (current.displayName && !next.displayName) return -1;
  return 0;
}

function scoreObservedAssemblyAuthority(entry: ObservedAssembly): number {
  const powerAction = entry.actionCandidate?.actions.power;
  const requiredIds = powerAction?.requiredIds;

  return (entry.objectId ? 16 : 0)
    + (entry.ownerCapId ? 12 : 0)
    + (entry.energySourceId ? 4 : 0)
    + (entry.actionCandidate ? 10 : 0)
    + (requiredIds?.structureId ? 12 : 0)
    + (requiredIds?.ownerCapId ? 12 : 0)
    + (requiredIds?.networkNodeId ? 12 : 0)
    + (entry.powerRequirement ? 6 : 0)
    + (entry.typeId != null ? 2 : 0)
    + (entry.size ? 2 : 0);
}

function mergeObservedAssemblyEntry(
  current: ObservedAssembly,
  next: ObservedAssembly,
): ObservedAssembly {
  const currentAuthorityScore = scoreObservedAssemblyAuthority(current);
  const nextAuthorityScore = scoreObservedAssemblyAuthority(next);
  const authority = nextAuthorityScore > currentAuthorityScore
    ? next
    : nextAuthorityScore < currentAuthorityScore
      ? current
      : compareObservedDisplayFreshness(current, next) > 0
        ? next
        : current;

  return {
    objectId: next.objectId ?? current.objectId,
    assemblyId: next.assemblyId ?? current.assemblyId,
    linkedGateId: next.linkedGateId ?? current.linkedGateId,
    assemblyType: authority.assemblyType ?? next.assemblyType ?? current.assemblyType,
    typeId: authority.typeId ?? next.typeId ?? current.typeId,
    name: authority.name ?? next.name ?? current.name,
    displayName: authority.displayName ?? next.displayName ?? current.displayName,
    displayNameSource: authority.displayNameSource ?? next.displayNameSource ?? current.displayNameSource,
    displayNameUpdatedAt: authority.displayNameUpdatedAt ?? next.displayNameUpdatedAt ?? current.displayNameUpdatedAt,
    family: authority.family ?? next.family ?? current.family,
    size: authority.size ?? next.size ?? current.size,
    status: authority.status ?? next.status ?? current.status,
    fuelAmount: authority.fuelAmount ?? next.fuelAmount ?? current.fuelAmount,
    powerSummary: authority.powerSummary ?? next.powerSummary ?? current.powerSummary,
    powerRequirement: authority.powerRequirement ?? next.powerRequirement ?? current.powerRequirement,
    solarSystemId: authority.solarSystemId ?? next.solarSystemId ?? current.solarSystemId,
    energySourceId: authority.energySourceId ?? next.energySourceId ?? current.energySourceId,
    url: authority.url ?? next.url ?? current.url,
    lastUpdated: authority.lastUpdated ?? next.lastUpdated ?? current.lastUpdated,
    lastObservedCheckpoint: authority.lastObservedCheckpoint ?? next.lastObservedCheckpoint ?? current.lastObservedCheckpoint,
    lastObservedTimestamp: authority.lastObservedTimestamp ?? next.lastObservedTimestamp ?? current.lastObservedTimestamp,
    typeName: authority.typeName ?? next.typeName ?? current.typeName,
    ownerCapId: authority.ownerCapId ?? next.ownerCapId ?? current.ownerCapId,
    ownerWalletAddress: authority.ownerWalletAddress ?? next.ownerWalletAddress ?? current.ownerWalletAddress,
    characterId: authority.characterId ?? next.characterId ?? current.characterId,
    extensionStatus: authority.extensionStatus ?? next.extensionStatus ?? current.extensionStatus,
    partial: authority.partial ?? next.partial ?? current.partial,
    warnings: authority.warnings ?? next.warnings ?? current.warnings,
    actionCandidate: authority.actionCandidate ?? next.actionCandidate ?? current.actionCandidate,
    source: authority.source ?? next.source ?? current.source,
    provenance: authority.provenance ?? next.provenance ?? current.provenance,
  };
}

function createObservedAssemblyIndex(
  observedEntries: ObservedAssembly[],
): ObservedAssemblyIndex {
  const byCanonicalKey = new Map<string, ObservedAssemblyBucket>();
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
      const existingBucket = byCanonicalKey.get(canonicalKey);
      if (!existingBucket) continue;

      mergedEntry = mergeObservedAssemblyEntry(existingBucket.entry, mergedEntry);
      for (const alias of existingBucket.aliasSet) {
        mergedAliases.add(alias);
      }
      byCanonicalKey.delete(canonicalKey);
    }

    for (const alias of createAssemblyIdentityAliases(mergedEntry)) {
      mergedAliases.add(alias);
    }

    const canonicalKey = selectCanonicalAssemblyKey(mergedEntry, mergedAliases);
    if (!canonicalKey) continue;

    byCanonicalKey.set(canonicalKey, {
      entry: mergedEntry,
      aliasSet: [...mergedAliases],
    });
    for (const alias of mergedAliases) {
      aliasToCanonicalKey.set(alias, canonicalKey);
    }
  }

  return { byCanonicalKey, aliasToCanonicalKey };
}

function cleanStructureName(structure: Structure): string {
  const enrichedName = structure.summary?.displayName?.trim() || structure.summary?.name?.trim();
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
  observed?: Pick<ObservedAssembly, "displayName" | "name">,
): string {
  const candidateName = observed?.displayName?.trim() || observed?.name?.trim() || cleanStructureName(structure);
  return normalizeNodeLocalDisplayName(candidateName, family, typeLabel, structure.objectId, structure.assemblyId);
}

function resolveBackendMembershipDisplayName(
  observed: ObservedAssembly,
  family: NodeLocalFamily,
  typeLabel: string,
  normalizedAssemblyId: string | undefined,
  primaryDirectChainMatch?: Structure,
): string {
  const shouldPreferDirectChainLabel = primaryDirectChainMatch != null
    && primaryDirectChainMatch.readModelSource !== "operator-inventory"
    && observed.provenance === "node-local-indexer"
    && !observed.displayNameSource
    && !observed.displayNameUpdatedAt;
  const directChainLabel = primaryDirectChainMatch
    ? resolveLiveDisplayName(primaryDirectChainMatch, family, typeLabel)
    : null;
  const candidateName = shouldPreferDirectChainLabel
    ? directChainLabel ?? observed.displayName ?? observed.name
    : observed.displayName ?? observed.name ?? directChainLabel;

  return normalizeNodeLocalDisplayName(
    candidateName,
    family,
    typeLabel,
    observed.objectId ?? primaryDirectChainMatch?.objectId,
    normalizedAssemblyId ?? normalizeNodeDrilldownAssemblyId(primaryDirectChainMatch?.assemblyId) ?? undefined,
  );
}

function resolveBackendMembershipStatus(
  observed: ObservedAssembly,
  primaryDirectChainMatch?: Structure,
): StructureStatus {
  if (primaryDirectChainMatch != null && primaryDirectChainMatch.readModelSource !== "operator-inventory" && observed.provenance === "node-local-indexer") {
    return mergeLiveStructureStatus(primaryDirectChainMatch.status, observed.status);
  }

  return normalizeObservedStatus(observed.status);
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
  if (explicitTypeLabel && sizeVariant && sizeVariant !== "standard" && deriveSizeVariant(explicitTypeLabel) !== sizeVariant) {
    const catalogName = DEFAULT_CATALOG_NAMES[family]?.[sizeVariant];
    if (catalogName) {
      const itemType = getItemTypeByName(catalogName);
      if (itemType) {
        return { typeLabel: itemType.name, typeId: itemType.typeId };
      }
      return { typeLabel: catalogName, typeId: explicitTypeId };
    }
  }

  if (explicitTypeLabel) {
    const itemType = getItemTypeByName(explicitTypeLabel);
    if (itemType) {
      return { typeLabel: itemType.name, typeId: itemType.typeId };
    }
    return { typeLabel: explicitTypeLabel, typeId: explicitTypeId };
  }

  if (explicitTypeId != null) {
    const itemType = getItemTypeById(explicitTypeId);
    if (itemType) {
      return { typeLabel: itemType.name, typeId: itemType.typeId };
    }
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

function toNodeLocalActionCandidate(structure: Structure): NodeLocalActionCandidateTarget {
  return {
    structureId: structure.objectId,
    structureType: structure.type,
    ownerCapId: structure.ownerCapId,
    networkNodeId: structure.networkNodeId,
    status: structure.status,
  };
}

function toNodeLocalActionCandidateFromRequiredIds(
  family: NodeLocalFamily,
  powerAction: IndexedPowerAction,
  status: StructureStatus,
  fallbackTarget?: NodeLocalActionTargetFallback | null,
): NodeLocalActionCandidateTarget | null {
  if (powerAction.candidate === false) {
    return null;
  }

  const structureId = powerAction.requiredIds?.structureId ?? fallbackTarget?.structureId;
  const structureType = normalizeIndexedActionTargetTypeForFamily(
    family,
    powerAction.requiredIds?.structureType
      ?? fallbackTarget?.structureType
      ?? SUPPORTED_POWER_TYPE_BY_FAMILY[family]
      ?? null,
  );
  if (!structureId || !structureType) {
    return null;
  }

  return {
    structureId,
    structureType,
    ownerCapId: powerAction.requiredIds?.ownerCapId ?? fallbackTarget?.ownerCapId ?? undefined,
    networkNodeId: powerAction.requiredIds?.networkNodeId ?? fallbackTarget?.networkNodeId ?? undefined,
    status,
  };
}

function dedupeNodeLocalActionCandidates(
  candidateTargets: NodeLocalActionCandidateTarget[],
): NodeLocalActionCandidateTarget[] {
  const seen = new Set<string>();
  const deduped: NodeLocalActionCandidateTarget[] = [];

  for (const candidateTarget of candidateTargets) {
    const key = [
      candidateTarget.structureId,
      candidateTarget.structureType,
      candidateTarget.ownerCapId ?? "",
      candidateTarget.networkNodeId ?? "",
      candidateTarget.status,
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(candidateTarget);
  }

  return deduped;
}

function resolveNodeLocalVerifiedTarget(
  family: NodeLocalFamily,
  status: StructureStatus,
  powerAction: IndexedPowerAction | null | undefined,
  liveCandidate: NodeLocalActionCandidateTarget | null,
  fallbackTarget?: NodeLocalActionTargetFallback | null,
): NodeLocalActionAuthority["verifiedTarget"] {
  const supportedPowerType = SUPPORTED_POWER_TYPE_BY_FAMILY[family] ?? null;
  if (!supportedPowerType) {
    return null;
  }

  const candidateTarget = powerAction ? toNodeLocalActionCandidateFromRequiredIds(family, powerAction, status, fallbackTarget) : null;
  const structureType = candidateTarget?.structureType ?? liveCandidate?.structureType ?? null;
  if (structureType !== supportedPowerType) {
    return null;
  }

  const structureId = candidateTarget?.structureId ?? liveCandidate?.structureId;
  const ownerCapId = candidateTarget?.ownerCapId ?? liveCandidate?.ownerCapId;
  const networkNodeId = candidateTarget?.networkNodeId ?? liveCandidate?.networkNodeId;
  if (!structureId || !ownerCapId || !networkNodeId) {
    return null;
  }

  return {
    structureId,
    structureType: supportedPowerType,
    ownerCapId,
    networkNodeId,
    status,
  };
}

function createNodeLocalActionAuthority(
  family: NodeLocalFamily,
  status: StructureStatus,
  authorityCandidates: NodeLocalActionCandidateTarget[],
  source: NodeLocalStructure["source"],
  actionCandidate?: ObservedAssembly["actionCandidate"] | AssemblySummary["actionCandidate"] | null,
  fallbackTarget?: NodeLocalActionTargetFallback | null,
): NodeLocalActionAuthority {
  if (source === "synthetic" && authorityCandidates.length === 0 && !actionCandidate) {
    return {
      state: "synthetic",
      verifiedTarget: null,
      candidateTargets: [],
      unavailableReason: null,
    };
  }

  const powerAction = actionCandidate?.actions.power;
  const supportedPowerType = SUPPORTED_POWER_TYPE_BY_FAMILY[family] ?? null;
  const indexedCandidateTarget = powerAction ? toNodeLocalActionCandidateFromRequiredIds(family, powerAction, status, fallbackTarget) : null;
  const candidateTargets = dedupeNodeLocalActionCandidates([
    ...authorityCandidates,
    ...(indexedCandidateTarget ? [indexedCandidateTarget] : []),
  ]);
  const rawUnavailableReason = powerAction?.unavailableReason ?? actionCandidate?.unavailableReason ?? null;
  const uniqueLiveCandidate = authorityCandidates.length === 1 ? authorityCandidates[0] : null;
  const verifiedTarget = resolveNodeLocalVerifiedTarget(family, status, powerAction, uniqueLiveCandidate, fallbackTarget);

  if (verifiedTarget) {
    return {
      state: "verified-supported",
      verifiedTarget,
      candidateTargets,
      unavailableReason: null,
    };
  }

  const unavailableReason = rawUnavailableReason;

  if (!supportedPowerType || powerAction?.familySupported === false || actionCandidate?.familySupported === false) {
    return {
      state: "unsupported-family",
      verifiedTarget: null,
      candidateTargets,
      unavailableReason,
    };
  }

  if (candidateTargets.length > 1) {
    return {
      state: "ambiguous-match",
      verifiedTarget: null,
      candidateTargets,
      unavailableReason,
    };
  }

  if (powerAction?.candidate === true && !indexedCandidateTarget?.structureId && !uniqueLiveCandidate?.structureId) {
    return {
      state: "missing-object-id",
      verifiedTarget: null,
      candidateTargets,
      unavailableReason,
    };
  }

  if (candidateTargets.length === 0) {
    return {
      state: powerAction?.currentlyImplementedInCivilizationControl === false ? "future-supported" : "backend-only",
      verifiedTarget: null,
      candidateTargets,
      unavailableReason,
    };
  }

  if (powerAction?.indexedOwnerCapPresent === false || candidateTargets[0]?.ownerCapId == null) {
    return {
      state: "missing-owner-cap",
      verifiedTarget: null,
      candidateTargets,
      unavailableReason,
    };
  }

  if (powerAction?.requiredIds && !powerAction.requiredIds.networkNodeId) {
    return {
      state: "missing-node-context",
      verifiedTarget: null,
      candidateTargets,
      unavailableReason,
    };
  }

  return {
    state: candidateTargets[0]?.networkNodeId == null ? "missing-node-context" : "backend-only",
    verifiedTarget: null,
    candidateTargets,
    unavailableReason,
  };
}

function createNodeLocalStructure(
  structure: Pick<
    NodeLocalStructure,
    | "id"
    | "canonicalDomainKey"
    | "objectId"
    | "assemblyId"
    | "directChainObjectId"
    | "directChainAssemblyId"
    | "hasDirectChainAuthority"
    | "directChainMatchCount"
    | "futureActionEligible"
    | "linkedGateId"
    | "displayName"
    | "family"
    | "sizeVariant"
    | "status"
    | "source"
    | "powerRequirement"
    | "extensionStatus"
    | "actionCandidate"
    | "actionAuthority"
    | "isReadOnly"
    | "isActionable"
    | "backendSource"
    | "displayNameSource"
    | "displayNameUpdatedAt"
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
  const verifiedStructureId = normalizeCanonicalObjectId(structure.actionAuthority.verifiedTarget?.structureId);
  const singleCandidateStructureId = structure.actionAuthority.candidateTargets.length === 1
    ? normalizeCanonicalObjectId(structure.actionAuthority.candidateTargets[0]?.structureId)
    : null;
  const objectId = structure.objectId ?? verifiedStructureId ?? singleCandidateStructureId ?? undefined;

  return {
    id: structure.id,
    canonicalDomainKey: structure.canonicalDomainKey,
    objectId,
    assemblyId: structure.assemblyId,
    directChainObjectId: structure.directChainObjectId,
    directChainAssemblyId: structure.directChainAssemblyId,
    hasDirectChainAuthority: structure.hasDirectChainAuthority,
    directChainMatchCount: structure.directChainMatchCount,
    futureActionEligible: structure.futureActionEligible,
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
    powerRequirement: structure.powerRequirement,
    extensionStatus: structure.extensionStatus,
    actionCandidate: structure.actionCandidate,
    actionAuthority: structure.actionAuthority,
    backendSource: structure.backendSource,
    displayNameSource: structure.displayNameSource,
    displayNameUpdatedAt: structure.displayNameUpdatedAt,
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
  if (structure.source === "backendObserved" || structure.source === "backendMembership") score += 1;

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

// Display freshness can come from weaker rows; authority fields follow the strongest proof row.
function scoreActionTargetProof(
  target: NodeLocalActionCandidateTarget | null | undefined,
): number {
  if (!target) {
    return 0;
  }

  return (target.structureId ? 8 : 0)
    + (target.structureType ? 2 : 0)
    + (target.ownerCapId ? 8 : 0)
    + (target.networkNodeId ? 8 : 0)
    + (target.status !== "neutral" ? 1 : 0);
}

function scoreActionAuthorityProof(authority: NodeLocalActionAuthority): number {
  const bestCandidateScore = Math.max(
    0,
    ...authority.candidateTargets.map(scoreActionTargetProof),
  );

  return (authority.verifiedTarget ? 64 + scoreActionTargetProof(authority.verifiedTarget) : 0)
    + bestCandidateScore;
}

function scoreActionCandidateProof(
  actionCandidate: NodeLocalStructure["actionCandidate"],
): number {
  const powerAction = actionCandidate?.actions.power;
  if (!powerAction) {
    return 0;
  }

  const requiredIds = powerAction.requiredIds;
  return 8
    + (powerAction.candidate ? 4 : 0)
    + (powerAction.indexedOwnerCapPresent ? 4 : 0)
    + (requiredIds?.structureId ? 8 : 0)
    + (requiredIds?.structureType ? 2 : 0)
    + (requiredIds?.ownerCapId ? 8 : 0)
    + (requiredIds?.networkNodeId ? 8 : 0);
}

function scoreStructureProof(row: NodeLocalStructure): number {
  return scoreActionAuthorityProof(row.actionAuthority)
    + scoreActionCandidateProof(row.actionCandidate)
    + (row.objectId ? 8 : 0)
    + (row.assemblyId ? 4 : 0)
    + (row.energySourceId ? 3 : 0)
    + (row.powerRequirement ? 3 : 0)
    + (row.hasDirectChainAuthority ? 2 : 0);
}

function preferProofStructure(
  left: NodeLocalStructure,
  right: NodeLocalStructure,
): NodeLocalStructure {
  const leftScore = scoreStructureProof(left);
  const rightScore = scoreStructureProof(right);

  if (rightScore > leftScore) return right;
  if (rightScore < leftScore) return left;

  if (left.source !== "live" && right.source === "live") {
    return right;
  }

  if (left.source === "synthetic" && right.source !== "synthetic") {
    return right;
  }

  return left;
}

function getActionAuthorityObjectId(authority: NodeLocalActionAuthority): string | undefined {
  if (authority.verifiedTarget?.structureId) {
    return authority.verifiedTarget.structureId;
  }

  const candidateObjectIds = [...new Set(
    authority.candidateTargets
      .map((target) => target.structureId)
      .filter((structureId): structureId is string => Boolean(structureId)),
  )];

  return candidateObjectIds.length === 1 ? candidateObjectIds[0] : undefined;
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
  const authoritativeRow = liveRow
    ?? bucket.entries.find((entry) => entry.source === "backendMembership")
    ?? bucket.entries.find((entry) => entry.source === "backendObserved")
    ?? bucket.entries[0];
  const displayRow = bucket.entries.reduce(preferDisplayStructure, authoritativeRow);
  const proofRow = bucket.entries.reduce(preferProofStructure, authoritativeRow);
  const mergedSource = liveRow
    ? "live"
    : bucket.entries.some((entry) => entry.source === "backendMembership")
      ? "backendMembership"
    : bucket.entries.some((entry) => entry.source === "backendObserved")
      ? "backendObserved"
      : "synthetic";

  const objectId = pickFirstDefined([
    proofRow.objectId,
    getActionAuthorityObjectId(proofRow.actionAuthority),
    ...bucket.entries.map((entry) => entry.objectId),
    ...bucket.entries.map((entry) => getActionAuthorityObjectId(entry.actionAuthority)),
  ]);
  const assemblyId = normalizeNodeDrilldownAssemblyId(
    pickFirstDefined([
      proofRow.assemblyId,
      ...bucket.entries.map((entry) => entry.assemblyId),
    ]),
  ) ?? undefined;
  const renderId = liveRow?.id
    ?? objectId
    ?? (assemblyId ? `assembly:${assemblyId}` : authoritativeRow.id);
  const status = mergeCollapsedStructureStatus(bucket.entries);
  const sizeVariant = displayRow.sizeVariant ?? deriveSizeVariant(displayRow.typeLabel) ?? authoritativeRow.sizeVariant;
  const actionAuthority = proofRow.actionAuthority;

  return createNodeLocalStructure({
    id: renderId,
    canonicalDomainKey: bucket.canonicalDomainKey,
    objectId,
    assemblyId,
    directChainObjectId: pickFirstDefined(bucket.entries.map((entry) => entry.directChainObjectId ?? undefined)) ?? null,
    directChainAssemblyId: pickFirstDefined(bucket.entries.map((entry) => entry.directChainAssemblyId ?? undefined)) ?? null,
    hasDirectChainAuthority: bucket.entries.some((entry) => entry.hasDirectChainAuthority),
    directChainMatchCount: Math.max(...bucket.entries.map((entry) => entry.directChainMatchCount), 0),
    futureActionEligible: bucket.entries.some((entry) => entry.futureActionEligible),
    linkedGateId: pickFirstDefined(bucket.entries.map((entry) => entry.linkedGateId)),
    displayName: displayRow.displayName,
    family: liveRow?.family ?? authoritativeRow.family,
    sizeVariant,
    status,
    source: mergedSource,
    extensionStatus: liveRow?.extensionStatus ?? authoritativeRow.extensionStatus,
    actionCandidate: pickFirstDefined([
      proofRow.actionCandidate,
      ...bucket.entries.map((entry) => entry.actionCandidate),
    ]) ?? null,
    actionAuthority,
    typeLabel: displayRow.typeLabel,
    typeId: displayRow.typeId ?? authoritativeRow.typeId,
    warningPip: bucket.entries.some((entry) => entry.warningPip) || status === "warning",
    backendSource: pickFirstDefined(bucket.entries.map((entry) => entry.backendSource ?? undefined)) ?? null,
    displayNameSource: pickFirstDefined([
      displayRow.displayNameSource ?? undefined,
      ...bucket.entries.map((entry) => entry.displayNameSource ?? undefined),
    ]) ?? null,
    displayNameUpdatedAt: pickLatestTimestamp(bucket.entries.map((entry) => entry.displayNameUpdatedAt)) ?? null,
    fetchedAt: pickLatestTimestamp(bucket.entries.map((entry) => entry.fetchedAt)) ?? null,
    lastUpdated: pickLatestTimestamp(bucket.entries.map((entry) => entry.lastUpdated)) ?? null,
    provenance: pickFirstDefined(bucket.entries.map((entry) => entry.provenance ?? undefined)) ?? null,
    url: pickFirstDefined(bucket.entries.map((entry) => entry.url ?? undefined)) ?? null,
    solarSystemId: pickFirstDefined(bucket.entries.map((entry) => entry.solarSystemId ?? undefined)) ?? null,
    energySourceId: pickFirstDefined([
      proofRow.energySourceId ?? undefined,
      ...bucket.entries.map((entry) => entry.energySourceId ?? undefined),
    ]) ?? null,
    fuelAmount: pickFirstDefined(bucket.entries.map((entry) => entry.fuelAmount ?? undefined)) ?? null,
    powerRequirement: pickFirstDefined([
      proofRow.powerRequirement ?? undefined,
      ...bucket.entries.map((entry) => entry.powerRequirement ?? undefined),
    ]) ?? null,
    isReadOnly: actionAuthority.state !== "verified-supported",
    isActionable: actionAuthority.state === "verified-supported",
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
    structures: sortNodeLocalStructures(candidateBuckets.map(mergeNodeLocalStructureBucket)),
  };
}

function createLiveStructureIndex(
  liveStructures: Structure[],
  includeOperatorInventory = false,
): LiveStructureIndex {
  const indexedLiveStructures = includeOperatorInventory
    ? liveStructures
    : liveStructures.filter((structure) => structure.readModelSource !== "operator-inventory");
  const buckets = bucketByNodeDrilldownDomainIdentity(indexedLiveStructures, (structure) => ({
    objectId: structure.objectId,
    assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
    renderId: structure.objectId,
    source: structure.readModelSource === "operator-inventory" ? "backendMembership" : "live",
  }));
  const aliasToCanonicalKey = new Map<string, string>();

  for (const bucket of buckets) {
    for (const alias of bucket.aliasSet) {
      aliasToCanonicalKey.set(alias, bucket.canonicalDomainKey);
    }
  }

  return { buckets, aliasToCanonicalKey };
}

function findMatchingLiveStructures(
  liveIndex: LiveStructureIndex,
  identity: { objectId?: string | null; assemblyId?: string | null },
  fallbackAliases: Iterable<string> = [],
): Structure[] {
  const matches: Structure[] = [];
  const seenCanonicalKeys = new Set<string>();

  for (const alias of [...new Set([...createAssemblyIdentityAliases(identity), ...fallbackAliases])]) {
    const canonicalKey = liveIndex.aliasToCanonicalKey.get(alias);
    if (!canonicalKey || seenCanonicalKeys.has(canonicalKey)) continue;

    seenCanonicalKeys.add(canonicalKey);
    const bucket = liveIndex.buckets.find((entry) => entry.canonicalDomainKey === canonicalKey);
    if (bucket) {
      matches.push(...bucket.entries);
    }
  }

  return matches;
}

function resolveNodeLocalSourceMode(
  observedLookup: NodeAssembliesLookupResult | null | undefined,
  observedEntries: ObservedAssembly[],
  isLoading = false,
  preferObservedMembership = false,
): NodeLocalSourceMode {
  if (isLoading && !observedLookup) {
    return "loading";
  }

  if (observedLookup?.status === "error") {
    return "error-fallback";
  }

  if (observedLookup?.status === "success" && (observedEntries.length > 0 || preferObservedMembership)) {
    return "backend-membership";
  }

  return "live-fallback";
}

function buildLiveFallbackStructures(liveStructures: Structure[]): NodeLocalStructure[] {
  return liveStructures.map((structure) => {
    const family = LIVE_FAMILY_MAP[structure.type];
    const source = structure.readModelSource === "operator-inventory" ? "backendMembership" : "live";
    const resolvedType = resolveTypeLabel(
      family,
      structure.summary?.typeName ?? null,
      structure.summary?.typeId ?? undefined,
      null,
    );
    const sizeVariant = deriveSizeVariant(resolvedType.typeLabel);
    const status = mergeLiveStructureStatus(structure.status, null);
    const needsExtensionWarning =
      (structure.type === "gate" || structure.type === "turret") &&
      (structure.summary?.extensionStatus ?? structure.extensionStatus) !== "authorized";
    const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(structure.assemblyId) ?? undefined;
    const authorityCandidates = [toNodeLocalActionCandidate(structure)];
    const actionAuthority = createNodeLocalActionAuthority(
      family,
      status,
      authorityCandidates,
      source,
      structure.summary?.actionCandidate,
    );
    const hasDirectChainAuthority = structure.readModelSource !== "operator-inventory";

    return createNodeLocalStructure({
      id: structure.objectId,
      canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey({
        objectId: structure.objectId,
        assemblyId: normalizedAssemblyId,
        renderId: structure.objectId,
        source,
      }) ?? `unresolved:${structure.objectId}`,
      objectId: structure.objectId,
      assemblyId: normalizedAssemblyId,
      directChainObjectId: hasDirectChainAuthority ? structure.objectId : null,
      directChainAssemblyId: hasDirectChainAuthority ? normalizedAssemblyId ?? null : null,
      hasDirectChainAuthority,
      directChainMatchCount: hasDirectChainAuthority ? 1 : 0,
      futureActionEligible: actionAuthority.state === "verified-supported" || actionAuthority.state === "future-supported",
      linkedGateId: structure.linkedGateId ?? undefined,
      displayName: resolveLiveDisplayName(structure, family, resolvedType.typeLabel),
      family,
      sizeVariant,
      status,
      source,
      powerRequirement: structure.indexedPowerRequirement ?? structure.summary?.powerRequirement ?? null,
      extensionStatus: structure.summary?.extensionStatus ?? structure.extensionStatus,
      actionCandidate: structure.summary?.actionCandidate ?? null,
      actionAuthority,
      typeLabel: resolvedType.typeLabel,
      typeId: resolvedType.typeId,
      warningPip: status === "warning" || needsExtensionWarning,
      backendSource: source === "backendMembership" ? structure.summary?.source ?? null : null,
      displayNameSource: source === "backendMembership" ? structure.summary?.displayNameSource ?? null : null,
      displayNameUpdatedAt: structure.summary?.displayNameUpdatedAt ?? null,
      fetchedAt: source === "backendMembership" ? structure.summary?.lastObservedTimestamp ?? null : null,
      lastUpdated: structure.summary?.lastUpdated ?? structure.summary?.lastObservedTimestamp ?? null,
      provenance: source === "backendMembership" ? structure.summary?.provenance ?? "operator-inventory" : null,
      url: structure.summary?.url ?? null,
      solarSystemId: structure.summary?.solarSystemId ?? null,
      energySourceId: structure.summary?.energySourceId ?? null,
      fuelAmount: structure.summary?.fuelAmount ?? null,
      isReadOnly: actionAuthority.state !== "verified-supported",
      isActionable: actionAuthority.state === "verified-supported",
    });
  });
}

function buildBackendMembershipStructures(
  observedEntries: ObservedAssembly[],
  observedLookup: NodeAssembliesLookupResult,
  directChainIndex: LiveStructureIndex,
  authorityIndex: LiveStructureIndex,
): { structures: NodeLocalStructure[]; omittedBackendCount: number } {
  const observedIndex = createObservedAssemblyIndex(observedEntries);
  const structures: NodeLocalStructure[] = [];
  let omittedBackendCount = 0;

  for (const observedBucket of observedIndex.byCanonicalKey.values()) {
    const observed = observedBucket.entry;
    const family = resolveObservedFamily(observed);
    if (!family || family === "networkNode") {
      omittedBackendCount += 1;
      continue;
    }

    const directChainMatches = findMatchingLiveStructures(directChainIndex, {
      objectId: observed.objectId,
      assemblyId: observed.assemblyId,
    }, observedBucket.aliasSet);
    const authorityMatches = findMatchingLiveStructures(authorityIndex, {
      objectId: observed.objectId,
      assemblyId: observed.assemblyId,
    }, observedBucket.aliasSet);
    const primaryAuthorityMatch = authorityMatches[0];
    const primaryDirectChainMatch = directChainMatches[0];
    const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(observed.assemblyId)
      ?? normalizeNodeDrilldownAssemblyId(primaryAuthorityMatch?.assemblyId)
      ?? undefined;
    const indexedSizeVariant = normalizeObservedSize(observed.size);
    const resolvedType = resolveTypeLabel(
      family,
      observed.typeName ?? resolveObservedTypeLabel(family, observed.typeId),
      observed.typeId ?? undefined,
      indexedSizeVariant,
    );
    const status = resolveBackendMembershipStatus(observed, primaryDirectChainMatch);
    const sizeVariant = indexedSizeVariant ?? deriveSizeVariant(resolvedType.typeLabel) ?? "standard";
    const needsExtensionWarning = primaryAuthorityMatch != null
      && (primaryAuthorityMatch.type === "gate" || primaryAuthorityMatch.type === "turret")
      && (observed.extensionStatus ?? primaryAuthorityMatch.extensionStatus) !== "authorized";
    const authorityCandidates = authorityMatches.map(toNodeLocalActionCandidate);
    const fallbackActionTarget: NodeLocalActionTargetFallback = {
      structureId: normalizeCanonicalObjectId(observed.objectId) ?? primaryAuthorityMatch?.objectId ?? null,
      structureType: SUPPORTED_POWER_TYPE_BY_FAMILY[family] ?? null,
      ownerCapId: observed.actionCandidate?.actions.power?.requiredIds?.ownerCapId
        ?? normalizeCanonicalObjectId(observed.ownerCapId)
        ?? primaryAuthorityMatch?.ownerCapId
        ?? null,
      networkNodeId: observed.actionCandidate?.actions.power?.requiredIds?.networkNodeId
        ?? normalizeCanonicalObjectId(observed.networkNodeId)
        ?? primaryAuthorityMatch?.networkNodeId
        ?? null,
    };
    const actionAuthority = createNodeLocalActionAuthority(
      family,
      status,
      authorityCandidates,
      "backendMembership",
      observed.actionCandidate,
      fallbackActionTarget,
    );
    const renderId = normalizeCanonicalObjectId(observed.objectId)
      ?? (normalizedAssemblyId ? `assembly:${normalizedAssemblyId}` : primaryAuthorityMatch?.objectId ?? observedIndex.byCanonicalKey.size.toString());

    structures.push(createNodeLocalStructure({
      id: renderId,
      canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey({
        objectId: observed.objectId ?? primaryAuthorityMatch?.objectId,
        assemblyId: normalizedAssemblyId,
        renderId,
        source: "backendMembership",
      }) ?? `unresolved:${renderId}`,
      objectId: observed.objectId ?? primaryAuthorityMatch?.objectId ?? undefined,
      assemblyId: normalizedAssemblyId,
      directChainObjectId: primaryDirectChainMatch?.objectId ?? null,
      directChainAssemblyId: normalizeNodeDrilldownAssemblyId(primaryDirectChainMatch?.assemblyId) ?? null,
      hasDirectChainAuthority: directChainMatches.length > 0,
      directChainMatchCount: directChainMatches.length,
      futureActionEligible: actionAuthority.state === "verified-supported"
        || actionAuthority.state === "future-supported"
        || authorityMatches.length === 1,
      linkedGateId: observed.linkedGateId ?? primaryAuthorityMatch?.linkedGateId ?? undefined,
      displayName: resolveBackendMembershipDisplayName(
        observed,
        family,
        resolvedType.typeLabel,
        normalizedAssemblyId,
        primaryDirectChainMatch,
      ),
      family,
      sizeVariant,
      status,
      source: "backendMembership",
      powerRequirement: observed.powerRequirement
        ?? primaryAuthorityMatch?.indexedPowerRequirement
        ?? primaryAuthorityMatch?.summary?.powerRequirement
        ?? null,
      extensionStatus: observed.extensionStatus ?? primaryAuthorityMatch?.extensionStatus,
      actionCandidate: observed.actionCandidate ?? null,
      actionAuthority,
      typeLabel: resolvedType.typeLabel,
      typeId: resolvedType.typeId,
      warningPip: status === "warning" || needsExtensionWarning,
      backendSource: observed.source ?? observedLookup.source ?? null,
      displayNameSource: observed.displayNameSource ?? null,
      displayNameUpdatedAt: observed.displayNameUpdatedAt ?? null,
      fetchedAt: observedLookup.fetchedAt,
      lastUpdated: observed.lastUpdated,
      provenance: observed.provenance,
      url: observed.url,
      solarSystemId: observed.solarSystemId,
      energySourceId: observed.energySourceId,
      fuelAmount: observed.fuelAmount,
      isReadOnly: actionAuthority.state !== "verified-supported",
      isActionable: actionAuthority.state === "verified-supported",
    }));
  }

  return { structures, omittedBackendCount };
}

function buildSelectedNodeStructures(
  group: NetworkNodeGroup,
  observedLookup?: NodeAssembliesLookupResult | null,
  options: BuildNodeDrilldownOptions = {},
): SelectedNodeStructuresBuildResult {
  const liveStructures = [...group.gates, ...group.storageUnits, ...group.turrets];
  const observedEntries = observedLookup?.status === "success" ? observedLookup.assemblies : [];
  const sourceMode = resolveNodeLocalSourceMode(
    observedLookup,
    observedEntries,
    options.isLoading ?? false,
    options.preferObservedMembership ?? false,
  );

  if (sourceMode === "backend-membership" && observedLookup?.status === "success") {
    const directChainIndex = createLiveStructureIndex(liveStructures);
    const authorityIndex = createLiveStructureIndex(liveStructures, true);
    const backendMembership = buildBackendMembershipStructures(
      observedEntries,
      observedLookup,
      directChainIndex,
      authorityIndex,
    );

    return {
      liveStructures,
      observedEntries,
      sourceMode,
      omittedBackendCount: backendMembership.omittedBackendCount,
      structures: finalizeNodeLocalStructures(backendMembership.structures).structures,
    };
  }

  if (options.requireObservedMembership === true) {
    return {
      liveStructures,
      observedEntries,
      sourceMode,
      omittedBackendCount: 0,
      structures: [],
    };
  }

  return {
    liveStructures,
    observedEntries,
    sourceMode,
    omittedBackendCount: 0,
    structures: finalizeNodeLocalStructures(buildLiveFallbackStructures(liveStructures)).structures,
  };
}

function fuelSummary(structure: Structure): string | undefined {
  return formatFuelPresentationSummary(buildFuelPresentation(structure)) ?? undefined;
}

function resolveNodePowerUsageSummary(
  group: NetworkNodeGroup,
  observedLookup?: NodeAssembliesLookupResult | null,
) {
  return group.node.indexedPowerUsageSummary
    ?? group.node.summary?.powerUsageSummary
    ?? (observedLookup?.status === "success" ? observedLookup.node?.powerUsageSummary : null)
    ?? null;
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
  options: BuildNodeDrilldownOptions = {},
): NodeLocalViewModel {
  const { structures, sourceMode } = buildSelectedNodeStructures(group, observedLookup, options);
  const isBackendMembership = sourceMode === "backend-membership";

  return {
    node: {
      id: group.node.objectId,
      objectId: group.node.objectId,
      displayName: cleanStructureName(group.node),
      status: group.node.status,
      tone: statusToTone(group.node.status),
      warningPip: group.node.status === "warning",
      source: group.node.readModelSource === "operator-inventory" ? "backendMembership" : "live",
      fuelSummary: fuelSummary(group.node),
      powerUsageSummary: resolveNodePowerUsageSummary(group, observedLookup),
      extensionStatus: group.node.summary?.extensionStatus ?? group.node.extensionStatus,
      solarSystemName: group.node.summary?.solarSystemId ?? (group.solarSystemId != null ? `System ${group.solarSystemId}` : null),
      isSyntheticContainer: group.node.objectId === "unassigned",
      backendSource: isBackendMembership ? observedLookup?.source ?? null : null,
      displayNameSource: group.node.summary?.displayNameSource ?? observedLookup?.node?.displayNameSource ?? null,
      displayNameUpdatedAt: group.node.summary?.displayNameUpdatedAt ?? observedLookup?.node?.displayNameUpdatedAt ?? null,
      fetchedAt: isBackendMembership ? observedLookup?.fetchedAt : null,
      lastUpdated: null,
      provenance: isBackendMembership ? "node-local-indexer" : null,
      url: null,
      solarSystemId: group.node.summary?.solarSystemId ?? null,
      energySourceId: group.node.summary?.energySourceId
        ?? (observedLookup?.status === "success" ? observedLookup.node?.energySourceId : null)
        ?? null,
      fuelAmount: getIndexedFuelAmount(group.node) ?? group.node.fuel?.quantity?.toString() ?? null,
      isReadOnly: false,
      isActionable: true,
    },
    structures,
    source: isBackendMembership ? "backendMembership" : "live",
    sourceMode,
    layoutAlgorithm: "family-bands-v1",
    coverage: isBackendMembership ? "backend-membership" : "current-live-families",
  };
}

export function buildNodeDrilldownDebugSnapshot(
  group: NetworkNodeGroup,
  observedLookup?: NodeAssembliesLookupResult | null,
  options: BuildNodeDrilldownOptions = {},
): NodeDrilldownDebugSnapshot {
  const selectedStructures = buildSelectedNodeStructures(group, observedLookup, options);
  const renderedRows = selectedStructures.structures.map(describeRenderedNodeDrilldownIdentity);
  const authorityAnnotatedRows = renderedRows.filter((row) => row.hasDirectChainAuthority).length;

  return {
    nodeId: group.node.objectId,
    sourceMode: selectedStructures.sourceMode,
    fetchedAt: observedLookup?.fetchedAt ?? null,
    liveRows: selectedStructures.liveStructures.map(describeLiveNodeDrilldownIdentity),
    rawBackendRows: selectedStructures.observedEntries.map(describeObservedNodeDrilldownIdentity),
    renderedRows,
    usedLiveAuthorityAnnotations: authorityAnnotatedRows > 0,
    authorityAnnotatedRows,
    omittedBackendCount: selectedStructures.omittedBackendCount,
  };
}

function resolveObservedFamily(observed: { assemblyType: string | null; typeId: number | null; typeName: string | null }): NodeLocalFamily | null {
  const normalizedFamily = normalizeObservedFamilyName((observed as ObservedAssembly).family ?? null);
  if (normalizedFamily) {
    return normalizedFamily;
  }

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

function normalizeObservedFamilyName(value: string | null | undefined): NodeLocalFamily | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  switch (normalized) {
    case "networknode":
    case "network_node":
      return "networkNode";
    case "gate":
      return "gate";
    case "storage":
    case "storage_unit":
    case "tradepost":
    case "trade_post":
      return "tradePost";
    case "turret":
      return "turret";
    case "printer":
      return "printer";
    case "refinery":
      return "refinery";
    case "assembler":
      return "assembler";
    case "berth":
      return "berth";
    case "relay":
      return "relay";
    case "nursery":
      return "nursery";
    case "nest":
      return "nest";
    case "shelter":
      return "shelter";
    default:
      return null;
  }
}

function normalizeObservedSize(size: string | null | undefined): NodeLocalSizeVariant {
  const normalized = size?.trim().toLowerCase();
  if (normalized === "mini" || normalized === "standard" || normalized === "heavy") {
    return normalized;
  }

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
      const status = structure.status ?? "online";
      const sizeVariant = structure.sizeVariant ?? deriveSizeVariant(structure.typeLabel ?? undefined) ?? "standard";
      const authorityCandidates = structure.authorityCandidates ?? [];
      const source = structure.source ?? (
        structure.actionCandidate || authorityCandidates.length > 0 || structure.objectId || structure.assemblyId
          ? "backendMembership"
          : "synthetic"
      );
      const renderId = normalizeCanonicalObjectId(structure.objectId)
        ?? (normalizeNodeDrilldownAssemblyId(structure.assemblyId)
          ? `assembly:${normalizeNodeDrilldownAssemblyId(structure.assemblyId)}`
          : `${input.nodeId}:${family}:${index + 1}`);
      const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(structure.assemblyId) ?? undefined;
      const hasDirectChainAuthority = structure.hasDirectChainAuthority ?? source === "live";
      const actionAuthority = createNodeLocalActionAuthority(
        family,
        status,
        authorityCandidates,
        source,
        structure.actionCandidate,
      );

      return createNodeLocalStructure({
        id: renderId,
        canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey({
          objectId: structure.objectId,
          assemblyId: normalizedAssemblyId,
          renderId,
          source,
        }) ?? `synthetic:${renderId}`,
        objectId: structure.objectId,
        assemblyId: normalizedAssemblyId,
        displayName: structure.displayName,
        family,
        sizeVariant,
        status,
        source,
        powerRequirement: structure.powerRequirement ?? null,
        directChainObjectId: structure.directChainObjectId ?? (hasDirectChainAuthority ? structure.objectId ?? null : null),
        directChainAssemblyId: structure.directChainAssemblyId ?? (hasDirectChainAuthority ? normalizedAssemblyId ?? null : null),
        hasDirectChainAuthority,
        directChainMatchCount: authorityCandidates.length,
        futureActionEligible: actionAuthority.state === "verified-supported"
          || actionAuthority.state === "future-supported"
          || authorityCandidates.length === 1,
        actionCandidate: structure.actionCandidate ?? null,
        actionAuthority,
        typeLabel: structure.typeLabel,
        warningPip: structure.warningPip,
        linkedGateId: structure.linkedGateId,
        extensionStatus: structure.extensionStatus,
        backendSource: structure.backendSource ?? null,
        displayNameSource: structure.displayNameSource ?? null,
        displayNameUpdatedAt: structure.displayNameUpdatedAt ?? null,
        fetchedAt: structure.fetchedAt ?? null,
        lastUpdated: structure.lastUpdated ?? null,
        provenance: structure.provenance ?? null,
        url: structure.url ?? null,
        solarSystemId: structure.solarSystemId ?? null,
        energySourceId: structure.energySourceId ?? null,
        fuelAmount: structure.fuelAmount ?? null,
        isReadOnly: actionAuthority.state !== "verified-supported",
        isActionable: actionAuthority.state === "verified-supported",
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
      powerUsageSummary: input.nodePowerUsageSummary ?? null,
      solarSystemName: input.solarSystemName ?? null,
      backendSource: null,
      displayNameSource: null,
      displayNameUpdatedAt: null,
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
    sourceMode: "synthetic",
    layoutAlgorithm: "family-bands-v1",
    coverage: "synthetic-expanded",
  };
}

export function formatNodeLocalStatus(status: StructureStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function describeNodeLocalWarningMarker(
  structure: Pick<NodeLocalStructure, "warningPip" | "status" | "family" | "extensionStatus">,
): string | null {
  if (!structure.warningPip) {
    return null;
  }

  const extensionNeedsAttention = (structure.family === "gate" || structure.family === "turret")
    && structure.extensionStatus !== "authorized";

  if (structure.status === "warning" && extensionNeedsAttention) {
    return "Warning status plus extension authorization attention.";
  }

  if (structure.status === "warning") {
    return "Warning status reported for this structure.";
  }

  if (extensionNeedsAttention) {
    return "Extension authorization needs attention.";
  }

  return "Attention marker present.";
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
