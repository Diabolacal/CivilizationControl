import { getSharedBackendBaseUrl } from "@/lib/assemblySummaryClient";

import type { IndexedActionCandidate, NodeAssemblyNode, NodeAssemblySummary, ObjectId } from "@/types/domain";

const NODE_ASSEMBLIES_PATH = "/api/civilization-control/node-assemblies";
const REQUEST_TIMEOUT_MS = 5_000;
const OBJECT_ID_HEX_LENGTH = 64;

export interface NodeAssembliesLookupResult {
  status: "success" | "error";
  networkNodeId: ObjectId;
  node: NodeAssemblyNode | null;
  assemblies: NodeAssemblySummary[];
  fetchedAt: string | null;
  source: string | null;
  error: string | null;
  isPartial: boolean;
  droppedCount: number;
}

interface FetchNodeAssembliesOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export function normalizeCanonicalObjectId(value: string | null | undefined): ObjectId | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]+$/.test(trimmed)) return null;

  const hex = trimmed.slice(2);
  if (hex.length === 0 || hex.length > OBJECT_ID_HEX_LENGTH) return null;

  return `0x${hex.padStart(OBJECT_ID_HEX_LENGTH, "0")}`;
}

export function buildNodeAssembliesUrl(
  networkNodeId: string,
  baseUrl = getSharedBackendBaseUrl(),
): string {
  const canonicalId = normalizeCanonicalObjectId(networkNodeId);
  if (!canonicalId) {
    throw new Error("Invalid network node ID");
  }

  const url = new URL(NODE_ASSEMBLIES_PATH, `${baseUrl}/`);
  url.searchParams.set("networkNodeId", canonicalId);
  return url.toString();
}

export async function fetchNodeAssembliesLookup(
  rawNetworkNodeId: string,
  options: FetchNodeAssembliesOptions = {},
): Promise<NodeAssembliesLookupResult> {
  const networkNodeId = normalizeCanonicalObjectId(rawNetworkNodeId);
  if (!networkNodeId) {
    return createErrorResult("Invalid network node ID", rawNetworkNodeId);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      buildNodeAssembliesUrl(networkNodeId, options.baseUrl ?? getSharedBackendBaseUrl()),
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return createErrorResult(
        `Node assemblies request failed with status ${response.status}`,
        networkNodeId,
      );
    }

    const payload = await response.json();
    const normalized = normalizeNodeAssembliesResponse(payload, networkNodeId);
    if (!normalized) {
      return createErrorResult("Node assemblies response shape was invalid", networkNodeId);
    }

    return {
      status: "success",
      networkNodeId,
      ...normalized,
      error: null,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return createErrorResult("Node assemblies request timed out", networkNodeId);
    }

    return createErrorResult(
      error instanceof Error ? error.message : "Node assemblies request failed",
      networkNodeId,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function createErrorResult(error: string, networkNodeId: string): NodeAssembliesLookupResult {
  return {
    status: "error",
    networkNodeId: normalizeCanonicalObjectId(networkNodeId) ?? `0x${"0".repeat(OBJECT_ID_HEX_LENGTH)}`,
    node: null,
    assemblies: [],
    fetchedAt: null,
    source: null,
    error,
    isPartial: false,
    droppedCount: 0,
  };
}

function normalizeNodeAssembliesResponse(
  payload: unknown,
  requestedNodeId: ObjectId,
): Omit<NodeAssembliesLookupResult, "status" | "networkNodeId" | "error"> | null {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const node = normalizeNodeAssemblyNode(candidate.node, requestedNodeId);
  if (!node) return null;
  if (!Array.isArray(candidate.assemblies)) return null;

  const seenKeys = new Set<string>();
  const assemblies: NodeAssemblySummary[] = [];
  let droppedCount = 0;

  for (const entry of candidate.assemblies) {
    const normalized = normalizeNodeAssemblySummary(entry, candidate.source);
    if (!normalized) {
      droppedCount += 1;
      continue;
    }

    const dedupeKey = normalized.objectId ?? (normalized.assemblyId ? `assembly:${normalized.assemblyId}` : null);
    if (!dedupeKey || seenKeys.has(dedupeKey)) {
      droppedCount += 1;
      continue;
    }

    seenKeys.add(dedupeKey);
    assemblies.push(normalized);
  }

  return {
    node,
    assemblies,
    fetchedAt: normalizeNullableTimestamp(candidate.fetchedAt),
    source: normalizeNullableString(candidate.source),
    isPartial: droppedCount > 0,
    droppedCount,
  };
}

function normalizeNodeAssemblyNode(value: unknown, requestedNodeId: ObjectId): NodeAssemblyNode | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const objectId = normalizeCanonicalObjectId(normalizeNullableString(candidate.objectId) ?? requestedNodeId);
  if (!objectId || objectId !== requestedNodeId) return null;

  return {
    objectId,
    name: normalizeNullableString(candidate.name),
    displayName: normalizeNullableString(candidate.displayName),
    displayNameSource: normalizeNullableString(candidate.displayNameSource),
    displayNameUpdatedAt: normalizeNullableTimestamp(candidate.displayNameUpdatedAt),
    status: normalizeNullableString(candidate.status),
    assemblyId: normalizeNullableString(candidate.assemblyId),
    solarSystemId: normalizeNullableString(candidate.solarSystemId),
    energySourceId: normalizeNullableString(candidate.energySourceId),
    fuelAmount: normalizeNullableString(candidate.fuelAmount),
    powerSummary: normalizeIndexedPowerSummary(candidate.powerSummary),
  };
}

function normalizeNodeAssemblySummary(
  value: unknown,
  topLevelSource: unknown,
): NodeAssemblySummary | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const objectId = normalizeCanonicalObjectId(normalizeNullableString(candidate.objectId));
  const assemblyId = normalizeNullableString(candidate.assemblyId);
  if (!objectId && !assemblyId) return null;

  return {
    objectId,
    assemblyId,
    linkedGateId: normalizeCanonicalObjectId(normalizeNullableString(candidate.linkedGateId)),
    assemblyType: normalizeNullableString(candidate.assemblyType),
    typeId: normalizeNumber(candidate.typeId),
    name: normalizeNullableString(candidate.name),
    displayName: normalizeNullableString(candidate.displayName),
    displayNameSource: normalizeNullableString(candidate.displayNameSource),
    displayNameUpdatedAt: normalizeNullableTimestamp(candidate.displayNameUpdatedAt),
    family: normalizeNullableString(candidate.family),
    size: normalizeNullableSize(candidate.size),
    status: normalizeNullableString(candidate.status),
    fuelAmount: normalizeNullableString(candidate.fuelAmount),
    powerSummary: normalizeIndexedPowerSummary(candidate.powerSummary),
    solarSystemId: normalizeNullableString(candidate.solarSystemId),
    networkNodeId: normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId)),
    energySourceId: normalizeNullableString(candidate.energySourceId),
    url: normalizeNullableString(candidate.url),
    lastUpdated: normalizeNullableTimestamp(candidate.lastUpdated),
    lastObservedCheckpoint: normalizeNullableString(candidate.lastObservedCheckpoint),
    lastObservedTimestamp: normalizeNullableTimestamp(candidate.lastObservedTimestamp),
    typeName: normalizeNullableString(candidate.typeName),
    ownerCapId: normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId)),
    ownerWalletAddress: normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerWalletAddress)),
    characterId: normalizeCanonicalObjectId(normalizeNullableString(candidate.characterId)),
    extensionStatus: normalizeNullableExtensionStatus(candidate.extensionStatus),
    partial: normalizeBoolean(candidate.partial),
    warnings: normalizeStringArray(candidate.warnings),
    actionCandidate: normalizeIndexedActionCandidate(candidate.actionCandidate),
    source: normalizeNullableString(candidate.source) ?? normalizeNullableString(topLevelSource) ?? "shared-frontier-backend",
    provenance: normalizeNullableString(candidate.provenance) ?? "node-local-indexer",
  };
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNullableSize(value: unknown): "mini" | "standard" | "heavy" | null {
  const normalized = normalizeNullableString(value)?.toLowerCase();
  if (normalized === "mini" || normalized === "standard" || normalized === "heavy") {
    return normalized;
  }

  return null;
}

function normalizeNullableExtensionStatus(
  value: unknown,
): "authorized" | "stale" | "none" | null {
  const normalized = normalizeNullableString(value)?.toLowerCase();
  if (normalized === "authorized" || normalized === "stale" || normalized === "none") {
    return normalized;
  }

  return null;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const normalized = normalizeNullableString(entry);
    return normalized ? [normalized] : [];
  });
}

function normalizeIndexedPowerSummary(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as NodeAssemblySummary["powerSummary"];
}

function normalizeIndexedActionCandidate(value: unknown): IndexedActionCandidate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as IndexedActionCandidate;
}

function normalizeNullableTimestamp(value: unknown): string | null {
  const normalized = normalizeNullableString(value);
  if (!normalized) return null;

  return Number.isNaN(Date.parse(normalized)) ? null : normalized;
}
