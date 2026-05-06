import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import {
  createNodeDrilldownIdentityAliases,
  normalizeNodeDrilldownAssemblyId,
} from "@/lib/nodeDrilldownIdentity";

import type { NodeLocalActionAuthority, NodeLocalStructure, NodeLocalViewModel } from "./nodeDrilldownTypes";

export type NodeLocalStructureResolutionSource =
  | "none"
  | "render-id"
  | "object-id"
  | "assembly-id"
  | "canonical-domain-key"
  | "input-row"
  | "fallback";

export interface NodeLocalStructureSelectionInput {
  structure?: NodeLocalStructure | null;
  structureId?: string | null;
  canonicalDomainKey?: string | null;
  objectId?: string | null;
  assemblyId?: string | null;
}

export interface NodeLocalStructureResolution {
  structure: NodeLocalStructure | null;
  source: NodeLocalStructureResolutionSource;
  inputSource: "canvas-projection" | "attached-list-projection" | "selected-state" | "context-menu" | "inspector" | "action-rail" | "bulk-plan" | "unknown";
  matchedKey: string | null;
  replacedWeakRow: boolean;
}

interface IndexedStructureRow {
  source: Exclude<NodeLocalStructureResolutionSource, "none" | "fallback">;
  key: string;
  structure: NodeLocalStructure;
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function normalizeRenderId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getActionAuthorityObjectIds(authority: NodeLocalActionAuthority): string[] {
  return [
    authority.verifiedTarget?.structureId,
    ...authority.candidateTargets.map((target) => target.structureId),
  ]
    .map((value) => normalizeCanonicalObjectId(value))
    .filter((value): value is string => Boolean(value));
}

function getActionAuthorityOwnerCapIds(authority: NodeLocalActionAuthority): string[] {
  return [
    authority.verifiedTarget?.ownerCapId,
    ...authority.candidateTargets.map((target) => target.ownerCapId),
  ]
    .map((value) => normalizeCanonicalObjectId(value))
    .filter((value): value is string => Boolean(value));
}

function getActionAuthorityNetworkNodeIds(authority: NodeLocalActionAuthority): string[] {
  return [
    authority.verifiedTarget?.networkNodeId,
    ...authority.candidateTargets.map((target) => target.networkNodeId),
  ]
    .map((value) => normalizeCanonicalObjectId(value))
    .filter((value): value is string => Boolean(value));
}

function scoreActionAuthorityProof(authority: NodeLocalActionAuthority): number {
  const candidateScore = authority.candidateTargets.reduce((score, candidate) => score + (
    (candidate.structureId ? 4 : 0)
    + (candidate.ownerCapId ? 4 : 0)
    + (candidate.networkNodeId ? 4 : 0)
    + (candidate.structureType ? 1 : 0)
    + (candidate.status !== "neutral" ? 1 : 0)
  ), 0);

  return (authority.verifiedTarget ? 48 : 0) + candidateScore;
}

function scoreStructureProof(structure: NodeLocalStructure): number {
  const powerAction = structure.actionCandidate?.actions.power;
  const powerIds = powerAction?.requiredIds;

  return scoreActionAuthorityProof(structure.actionAuthority)
    + (structure.objectId ? 12 : 0)
    + (getActionAuthorityObjectIds(structure.actionAuthority).length > 0 ? 10 : 0)
    + (structure.assemblyId ? 4 : 0)
    + (getActionAuthorityOwnerCapIds(structure.actionAuthority).length > 0 ? 10 : 0)
    + (getActionAuthorityNetworkNodeIds(structure.actionAuthority).length > 0 ? 10 : 0)
    + (structure.actionCandidate ? 8 : 0)
    + (powerIds?.structureId ? 5 : 0)
    + (powerIds?.ownerCapId ? 5 : 0)
    + (powerIds?.networkNodeId ? 5 : 0)
    + (structure.powerRequirement ? 5 : 0)
    + (structure.energySourceId ? 2 : 0)
    + (structure.hasDirectChainAuthority ? 2 : 0);
}

function preferAuthoritativeStructure(left: NodeLocalStructure, right: NodeLocalStructure): NodeLocalStructure {
  const leftScore = scoreStructureProof(left);
  const rightScore = scoreStructureProof(right);
  if (rightScore > leftScore) return right;
  if (rightScore < leftScore) return left;

  if (left.source !== "backendMembership" && right.source === "backendMembership") return right;
  if (left.source === "synthetic" && right.source !== "synthetic") return right;
  return left;
}

function addUniqueIndexEntry(entries: IndexedStructureRow[], source: IndexedStructureRow["source"], key: string | null, structure: NodeLocalStructure) {
  if (!key) return;
  entries.push({ source, key, structure });
}

function getStructureIndexEntries(structure: NodeLocalStructure): IndexedStructureRow[] {
  const entries: IndexedStructureRow[] = [];
  addUniqueIndexEntry(entries, "render-id", normalizeRenderId(structure.id), structure);
  addUniqueIndexEntry(entries, "canonical-domain-key", structure.canonicalDomainKey, structure);
  addUniqueIndexEntry(entries, "object-id", normalizeCanonicalObjectId(structure.objectId), structure);
  addUniqueIndexEntry(entries, "object-id", normalizeCanonicalObjectId(structure.directChainObjectId), structure);
  for (const objectId of getActionAuthorityObjectIds(structure.actionAuthority)) {
    addUniqueIndexEntry(entries, "object-id", objectId, structure);
  }
  addUniqueIndexEntry(entries, "assembly-id", normalizeNodeDrilldownAssemblyId(structure.assemblyId), structure);
  addUniqueIndexEntry(entries, "assembly-id", normalizeNodeDrilldownAssemblyId(structure.directChainAssemblyId), structure);

  for (const alias of createNodeDrilldownIdentityAliases({
    objectId: structure.objectId,
    assemblyId: structure.assemblyId,
    renderId: structure.id,
    source: structure.source,
  })) {
    if (alias.startsWith("object:")) {
      addUniqueIndexEntry(entries, "object-id", alias.slice("object:".length), structure);
    } else if (alias.startsWith("assembly:")) {
      addUniqueIndexEntry(entries, "assembly-id", alias.slice("assembly:".length), structure);
    }
  }

  return entries;
}

function createQueryEntries(input: NodeLocalStructureSelectionInput): Array<{ source: IndexedStructureRow["source"]; key: string }> {
  const entries: Array<{ source: IndexedStructureRow["source"]; key: string }> = [];
  const push = (source: IndexedStructureRow["source"], key: string | null) => {
    if (key) entries.push({ source, key });
  };

  push("object-id", normalizeCanonicalObjectId(input.objectId));
  push("object-id", normalizeCanonicalObjectId(input.structure?.objectId));
  push("object-id", normalizeCanonicalObjectId(input.structure?.directChainObjectId));
  if (input.structure) {
    for (const objectId of getActionAuthorityObjectIds(input.structure.actionAuthority)) {
      push("object-id", objectId);
    }
  }

  push("assembly-id", normalizeNodeDrilldownAssemblyId(input.assemblyId));
  push("assembly-id", normalizeNodeDrilldownAssemblyId(input.structure?.assemblyId));
  push("assembly-id", normalizeNodeDrilldownAssemblyId(input.structure?.directChainAssemblyId));
  push("canonical-domain-key", input.canonicalDomainKey ?? null);
  push("canonical-domain-key", input.structure?.canonicalDomainKey ?? null);

  const identityAliases = createNodeDrilldownIdentityAliases({
    objectId: input.objectId ?? input.structure?.objectId,
    assemblyId: input.assemblyId ?? input.structure?.assemblyId,
    renderId: input.structureId ?? input.structure?.id,
    source: input.structure?.source,
  });
  for (const alias of identityAliases) {
    if (alias.startsWith("object:")) {
      push("object-id", alias.slice("object:".length));
    } else if (alias.startsWith("assembly:")) {
      push("assembly-id", alias.slice("assembly:".length));
    }
  }
  push("render-id", normalizeRenderId(input.structureId));
  push("render-id", normalizeRenderId(input.structure?.id));

  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.source}:${entry.key}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveNodeLocalStructure(
  viewModel: NodeLocalViewModel | null | undefined,
  input: NodeLocalStructureSelectionInput,
  inputSource: NodeLocalStructureResolution["inputSource"] = "unknown",
): NodeLocalStructureResolution {
  if (!viewModel || viewModel.structures.length === 0) {
    return {
      structure: input.structure ?? null,
      source: input.structure ? "input-row" : "none",
      inputSource,
      matchedKey: null,
      replacedWeakRow: false,
    };
  }

  const indexedRows = new Map<string, IndexedStructureRow[]>();
  for (const structure of viewModel.structures) {
    for (const entry of getStructureIndexEntries(structure)) {
      const bucketKey = `${entry.source}:${entry.key}`;
      const current = indexedRows.get(bucketKey);
      if (current) {
        current.push(entry);
      } else {
        indexedRows.set(bucketKey, [entry]);
      }
    }
  }

  const queryEntries = createQueryEntries(input);
  for (const queryEntry of queryEntries) {
    const matches = indexedRows.get(`${queryEntry.source}:${queryEntry.key}`);
    if (!matches || matches.length === 0) continue;

    const authoritative = matches
      .map((match) => match.structure)
      .reduce(preferAuthoritativeStructure);
    const inputRow = input.structure ?? null;
    const replacedWeakRow = Boolean(inputRow && authoritative !== inputRow && scoreStructureProof(authoritative) > scoreStructureProof(inputRow));

    return {
      structure: authoritative,
      source: queryEntry.source,
      inputSource,
      matchedKey: queryEntry.key,
      replacedWeakRow,
    };
  }

  if (input.structure) {
    return {
      structure: input.structure,
      source: "input-row",
      inputSource,
      matchedKey: null,
      replacedWeakRow: false,
    };
  }

  return {
    structure: null,
    source: "none",
    inputSource,
    matchedKey: null,
    replacedWeakRow: false,
  };
}

export function resolveNodeLocalStructureId(
  viewModel: NodeLocalViewModel | null | undefined,
  input: NodeLocalStructureSelectionInput,
): string | null {
  return resolveNodeLocalStructure(viewModel, input, "selected-state").structure?.id ?? null;
}

export function getAuthoritativeNodeLocalStructures(viewModel: NodeLocalViewModel | null | undefined): NodeLocalStructure[] {
  if (!viewModel) return [];

  const byIdentity = new Map<string, NodeLocalStructure>();
  for (const structure of viewModel.structures) {
    const resolution = resolveNodeLocalStructure(viewModel, { structure }, "bulk-plan");
    const resolved = resolution.structure ?? structure;
    const key = resolved.canonicalDomainKey
      || (hasValue(resolved.objectId) ? `object:${normalizeCanonicalObjectId(resolved.objectId)}` : null)
      || (hasValue(resolved.assemblyId) ? `assembly:${normalizeNodeDrilldownAssemblyId(resolved.assemblyId)}` : null)
      || resolved.id;
    const current = byIdentity.get(key);
    byIdentity.set(key, current ? preferAuthoritativeStructure(current, resolved) : resolved);
  }

  return [...byIdentity.values()];
}
