import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import type { Structure, StructureStatus, StructureType } from "@/types/domain";

import type { NodeLocalSource, NodeLocalSourceMode, NodeLocalStructure } from "./nodeDrilldownTypes";

const ASSEMBLY_ALIAS_PREFIX = "assembly:";
const OBJECT_ALIAS_PREFIX = "object:";
const SYNTHETIC_ALIAS_PREFIX = "synthetic:";
const UNRESOLVED_ALIAS_PREFIX = "unresolved:";

export interface NodeDrilldownIdentitySeed {
  objectId?: string | null;
  assemblyId?: string | null;
  renderId?: string | null;
  source?: NodeLocalSource;
}

export interface NodeDrilldownIdentityBucket<T> {
  canonicalDomainKey: string;
  aliasSet: string[];
  entries: T[];
}

export interface NodeDrilldownDebugBucket {
  canonicalDomainKey: string;
  aliasSet: string[];
  renderIds: string[];
  sources: string[];
  objectIds: string[];
  assemblyIds: string[];
}

export interface NodeDrilldownDebugRow {
  renderId: string;
  canonicalDomainKey: string;
  aliasSet: string[];
  source: NodeLocalSource | "observed";
  objectId: string | null;
  assemblyId: string | null;
  directChainObjectId?: string | null;
  directChainAssemblyId?: string | null;
  hasDirectChainAuthority?: boolean;
  directChainMatchCount?: number;
  futureActionEligible?: boolean;
  ownerCapId?: string | null;
  networkNodeId?: string | null;
  linkedGateId?: string | null;
  structureType?: StructureType | string | null;
  family?: string | null;
  typeLabel?: string | null;
  displayName?: string | null;
  status?: StructureStatus | string | null;
  isReadOnly?: boolean;
  isActionable?: boolean;
}

export interface NodeDrilldownDebugSnapshot {
  nodeId: string;
  sourceMode: NodeLocalSourceMode;
  fetchedAt: string | null;
  liveRows: NodeDrilldownDebugRow[];
  rawBackendRows: NodeDrilldownDebugRow[];
  renderedRows: NodeDrilldownDebugRow[];
  usedLiveAuthorityAnnotations: boolean;
  authorityAnnotatedRows: number;
  omittedBackendCount: number;
}

export interface NodeDrilldownDebugController {
  enabled: boolean;
  latest: NodeDrilldownDebugSnapshot | null;
  clear: () => void;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function aliasRank(alias: string): number {
  if (alias.startsWith(ASSEMBLY_ALIAS_PREFIX)) return 0;
  if (alias.startsWith(OBJECT_ALIAS_PREFIX)) return 1;
  if (alias.startsWith(SYNTHETIC_ALIAS_PREFIX)) return 2;
  if (alias.startsWith(UNRESOLVED_ALIAS_PREFIX)) return 3;
  return 4;
}

export function normalizeNodeDrilldownAssemblyId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  if (!/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    return BigInt(trimmed).toString();
  } catch {
    return trimmed;
  }
}

function createRenderIdentityAliases(renderId: string | null | undefined): string[] {
  if (typeof renderId !== "string") return [];

  const trimmed = renderId.trim();
  if (trimmed.length === 0) return [];

  const aliases: string[] = [];
  const canonicalObjectId = normalizeCanonicalObjectId(trimmed);
  if (canonicalObjectId) {
    aliases.push(`${OBJECT_ALIAS_PREFIX}${canonicalObjectId}`);
  }

  if (trimmed.toLowerCase().startsWith(ASSEMBLY_ALIAS_PREFIX)) {
    const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(trimmed.slice(ASSEMBLY_ALIAS_PREFIX.length));
    if (normalizedAssemblyId) {
      aliases.push(`${ASSEMBLY_ALIAS_PREFIX}${normalizedAssemblyId}`);
    }
  }

  return aliases;
}

export function createNodeDrilldownIdentityAliases(seed: NodeDrilldownIdentitySeed): string[] {
  const aliases = new Set<string>();
  const canonicalObjectId = normalizeCanonicalObjectId(seed.objectId);
  const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(seed.assemblyId);

  if (canonicalObjectId) {
    aliases.add(`${OBJECT_ALIAS_PREFIX}${canonicalObjectId}`);
  }

  if (normalizedAssemblyId) {
    aliases.add(`${ASSEMBLY_ALIAS_PREFIX}${normalizedAssemblyId}`);
  }

  // Domain identity is not the same as row id. Render ids only participate when they
  // visibly encode an object ID or assembly ID we would otherwise miss.
  for (const alias of createRenderIdentityAliases(seed.renderId)) {
    aliases.add(alias);
  }

  if (aliases.size === 0 && seed.source === "synthetic" && seed.renderId) {
    aliases.add(`${SYNTHETIC_ALIAS_PREFIX}${seed.renderId}`);
  }

  if (aliases.size === 0 && seed.renderId) {
    aliases.add(`${UNRESOLVED_ALIAS_PREFIX}${seed.renderId}`);
  }

  return [...aliases].sort((left, right) => {
    const rankDiff = aliasRank(left) - aliasRank(right);
    return rankDiff !== 0 ? rankDiff : left.localeCompare(right);
  });
}

export function selectCanonicalNodeDrilldownDomainKey(
  seed: NodeDrilldownIdentitySeed,
  fallbackAliases: Iterable<string> = [],
): string | null {
  const aliases = uniqueStrings([
    ...createNodeDrilldownIdentityAliases(seed),
    ...Array.from(fallbackAliases),
  ]).sort((left, right) => {
    const rankDiff = aliasRank(left) - aliasRank(right);
    return rankDiff !== 0 ? rankDiff : left.localeCompare(right);
  });

  return aliases[0] ?? null;
}

export function bucketByNodeDrilldownDomainIdentity<T>(
  entries: T[],
  getIdentity: (entry: T) => NodeDrilldownIdentitySeed,
): NodeDrilldownIdentityBucket<T>[] {
  const byCanonicalKey = new Map<string, { entries: T[]; aliasSet: Set<string> }>();
  const aliasToCanonicalKey = new Map<string, string>();

  for (const entry of entries) {
    const seed = getIdentity(entry);
    const entryAliases = createNodeDrilldownIdentityAliases(seed);
    const matchedCanonicalKeys = [...new Set(
      entryAliases
        .map((alias) => aliasToCanonicalKey.get(alias))
        .filter((alias): alias is string => alias != null),
    )];

    const mergedAliases = new Set(entryAliases);
    const mergedEntries: T[] = [entry];

    for (const canonicalKey of matchedCanonicalKeys) {
      const existing = byCanonicalKey.get(canonicalKey);
      if (!existing) continue;

      mergedEntries.unshift(...existing.entries);
      for (const alias of existing.aliasSet) {
        mergedAliases.add(alias);
      }
      byCanonicalKey.delete(canonicalKey);
    }

    const canonicalDomainKey = selectCanonicalNodeDrilldownDomainKey(seed, mergedAliases)
      ?? `${UNRESOLVED_ALIAS_PREFIX}${seed.renderId ?? "unknown"}`;

    byCanonicalKey.set(canonicalDomainKey, {
      entries: mergedEntries,
      aliasSet: mergedAliases,
    });

    for (const alias of mergedAliases) {
      aliasToCanonicalKey.set(alias, canonicalDomainKey);
    }
  }

  return [...byCanonicalKey.entries()].map(([canonicalDomainKey, bucket]) => ({
    canonicalDomainKey,
    aliasSet: [...bucket.aliasSet].sort((left, right) => {
      const rankDiff = aliasRank(left) - aliasRank(right);
      return rankDiff !== 0 ? rankDiff : left.localeCompare(right);
    }),
    entries: bucket.entries,
  }));
}

export function summarizeNodeDrilldownIdentityBuckets<T>(
  buckets: NodeDrilldownIdentityBucket<T>[],
  getIdentity: (entry: T) => NodeDrilldownIdentitySeed,
): NodeDrilldownDebugBucket[] {
  return buckets.map((bucket) => ({
    canonicalDomainKey: bucket.canonicalDomainKey,
    aliasSet: bucket.aliasSet,
    renderIds: uniqueStrings(bucket.entries.map((entry) => getIdentity(entry).renderId ?? null)),
    sources: uniqueStrings(bucket.entries.map((entry) => getIdentity(entry).source ?? null)),
    objectIds: uniqueStrings(bucket.entries.map((entry) => normalizeCanonicalObjectId(getIdentity(entry).objectId) ?? null)),
    assemblyIds: uniqueStrings(bucket.entries.map((entry) => normalizeNodeDrilldownAssemblyId(getIdentity(entry).assemblyId) ?? null)),
  }));
}

export function describeLiveNodeDrilldownIdentity(structure: Structure): NodeDrilldownDebugRow {
  const seed = {
    objectId: structure.objectId,
    assemblyId: structure.assemblyId,
    renderId: structure.objectId,
    source: "live" as const,
  };

  return {
    renderId: structure.objectId,
    canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey(seed) ?? `${UNRESOLVED_ALIAS_PREFIX}${structure.objectId}`,
    aliasSet: createNodeDrilldownIdentityAliases(seed),
    source: "live",
    objectId: normalizeCanonicalObjectId(structure.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(structure.ownerCapId),
    networkNodeId: normalizeCanonicalObjectId(structure.networkNodeId),
    linkedGateId: normalizeCanonicalObjectId(structure.linkedGateId),
    structureType: structure.type,
    displayName: structure.name,
    status: structure.status,
    isReadOnly: false,
    isActionable: true,
  };
}

export function describeObservedNodeDrilldownIdentity(
  observed: NodeAssembliesLookupResult["assemblies"][number],
): NodeDrilldownDebugRow {
  const normalizedAssemblyId = normalizeNodeDrilldownAssemblyId(observed.assemblyId);
  const renderId = normalizeCanonicalObjectId(observed.objectId)
    ?? (normalizedAssemblyId ? `${ASSEMBLY_ALIAS_PREFIX}${normalizedAssemblyId}` : "observed:missing-id");
  const seed = {
    objectId: observed.objectId,
    assemblyId: observed.assemblyId,
    renderId,
  };

  return {
    renderId,
    canonicalDomainKey: selectCanonicalNodeDrilldownDomainKey(seed) ?? `${UNRESOLVED_ALIAS_PREFIX}${renderId}`,
    aliasSet: createNodeDrilldownIdentityAliases(seed),
    source: "observed",
    objectId: normalizeCanonicalObjectId(observed.objectId),
    assemblyId: normalizedAssemblyId,
    linkedGateId: normalizeCanonicalObjectId(observed.linkedGateId),
    structureType: observed.assemblyType,
    typeLabel: observed.typeName,
    displayName: observed.name,
    status: observed.status,
    isReadOnly: true,
    isActionable: false,
  };
}

export function describeRenderedNodeDrilldownIdentity(structure: NodeLocalStructure): NodeDrilldownDebugRow {
  const seed = {
    objectId: structure.objectId,
    assemblyId: structure.assemblyId,
    renderId: structure.id,
    source: structure.source,
  };

  return {
    renderId: structure.id,
    canonicalDomainKey: structure.canonicalDomainKey,
    aliasSet: createNodeDrilldownIdentityAliases(seed),
    source: structure.source,
    objectId: normalizeCanonicalObjectId(structure.objectId),
    assemblyId: normalizeNodeDrilldownAssemblyId(structure.assemblyId),
    directChainObjectId: normalizeCanonicalObjectId(structure.directChainObjectId),
    directChainAssemblyId: normalizeNodeDrilldownAssemblyId(structure.directChainAssemblyId),
    hasDirectChainAuthority: structure.hasDirectChainAuthority,
    directChainMatchCount: structure.directChainMatchCount,
    futureActionEligible: structure.futureActionEligible,
    linkedGateId: normalizeCanonicalObjectId(structure.linkedGateId),
    family: structure.family,
    typeLabel: structure.typeLabel,
    displayName: structure.displayName,
    status: structure.status,
    isReadOnly: structure.isReadOnly,
    isActionable: structure.isActionable,
  };
}