import type { AssemblySummary } from "@/types/domain";

const DEFAULT_SHARED_BACKEND_URL = "https://ef-map.com";
const ASSEMBLY_SUMMARY_PATH = "/api/civilization-control/assemblies";
const MAX_IDS_PER_REQUEST = 100;
const REQUEST_TIMEOUT_MS = 5_000;

export interface AssemblySummaryResponse {
  assemblies: AssemblySummary[];
  missingIds: string[];
  fetchedAt: string | null;
  source: string | null;
}

export interface AssemblySummaryLookupResult {
  assembliesById: Map<string, AssemblySummary>;
  missingIds: string[];
  failedIds: string[];
  errors: string[];
  fetchedAt: string | null;
  source: string | null;
  isPartial: boolean;
}

interface FetchAssemblySummaryLookupOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export function getSharedBackendBaseUrl(): string {
  const configured = import.meta.env?.VITE_SHARED_BACKEND_URL?.trim();
  return (configured && configured.length > 0
    ? configured
    : DEFAULT_SHARED_BACKEND_URL).replace(/\/$/, "");
}

export function buildAssemblySummaryUrl(
  assemblyIds: string[],
  baseUrl = getSharedBackendBaseUrl(),
): string {
  const url = new URL(ASSEMBLY_SUMMARY_PATH, `${baseUrl}/`);
  url.searchParams.set("ids", assemblyIds.join(","));
  return url.toString();
}

export async function fetchAssemblySummaryLookup(
  rawAssemblyIds: string[],
  options: FetchAssemblySummaryLookupOptions = {},
): Promise<AssemblySummaryLookupResult> {
  const assemblyIds = dedupeAssemblyIds(rawAssemblyIds);

  if (assemblyIds.length === 0) {
    return createEmptyLookupResult();
  }

  const chunks = chunkAssemblyIds(assemblyIds, MAX_IDS_PER_REQUEST);
  const settled = await Promise.allSettled(
    chunks.map((chunk) => fetchAssemblySummaryChunk(chunk, options)),
  );

  const assembliesById = new Map<string, AssemblySummary>();
  const missingIds = new Set<string>();
  const failedIds = new Set<string>();
  const errors: string[] = [];
  let fetchedAt: string | null = null;
  let source: string | null = null;

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      for (const assembly of result.value.assemblies) {
        assembliesById.set(assembly.assemblyId, assembly);
      }
      for (const missingId of result.value.missingIds) {
        missingIds.add(missingId);
      }
      fetchedAt = result.value.fetchedAt ?? fetchedAt;
      source = result.value.source ?? source;
      return;
    }

    for (const assemblyId of chunks[index]) {
      failedIds.add(assemblyId);
    }
    errors.push(result.reason instanceof Error
      ? result.reason.message
      : "Assembly summary request failed");
  });

  return {
    assembliesById,
    missingIds: Array.from(missingIds),
    failedIds: Array.from(failedIds),
    errors,
    fetchedAt,
    source,
    isPartial: failedIds.size > 0 || missingIds.size > 0,
  };
}

function createEmptyLookupResult(): AssemblySummaryLookupResult {
  return {
    assembliesById: new Map<string, AssemblySummary>(),
    missingIds: [],
    failedIds: [],
    errors: [],
    fetchedAt: null,
    source: null,
    isPartial: false,
  };
}

function dedupeAssemblyIds(rawAssemblyIds: string[]): string[] {
  return Array.from(new Set(rawAssemblyIds.map((id) => id.trim()).filter(Boolean)));
}

function chunkAssemblyIds(
  assemblyIds: string[],
  maxPerChunk: number,
): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < assemblyIds.length; index += maxPerChunk) {
    chunks.push(assemblyIds.slice(index, index + maxPerChunk));
  }

  return chunks;
}

async function fetchAssemblySummaryChunk(
  assemblyIds: string[],
  options: FetchAssemblySummaryLookupOptions,
): Promise<AssemblySummaryResponse> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      buildAssemblySummaryUrl(assemblyIds, options.baseUrl ?? getSharedBackendBaseUrl()),
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Assembly summary request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const normalized = normalizeAssemblySummaryResponse(payload);
    if (!normalized) {
      throw new Error("Assembly summary response shape was invalid");
    }

    return normalized;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Assembly summary request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeAssemblySummaryResponse(
  payload: unknown,
): AssemblySummaryResponse | null {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  if (!Array.isArray(candidate.assemblies)) return null;

  const assemblies = candidate.assemblies
    .map((entry) => normalizeAssemblySummary(entry))
    .filter((entry): entry is AssemblySummary => entry !== null);

  const missingIds = Array.isArray(candidate.missingIds)
    ? candidate.missingIds.filter(isNonEmptyString)
    : [];

  return {
    assemblies,
    missingIds,
    fetchedAt: normalizeNullableString(candidate.fetchedAt),
    source: normalizeNullableString(candidate.source),
  };
}

function normalizeAssemblySummary(entry: unknown): AssemblySummary | null {
  if (!entry || typeof entry !== "object") return null;

  const candidate = entry as Record<string, unknown>;
  const assemblyId = normalizeNullableString(candidate.assemblyId);
  const assemblyType = normalizeNullableString(candidate.assemblyType);
  const typeId = normalizeNumber(candidate.typeId);

  if (!assemblyId || !assemblyType || typeId == null) {
    return null;
  }

  return {
    assemblyId,
    assemblyType,
    typeId,
    name: normalizeNullableString(candidate.name) ?? "",
    status: normalizeNullableString(candidate.status) ?? "",
    fuelAmount: normalizeNullableString(candidate.fuelAmount),
    solarSystemId: normalizeNullableString(candidate.solarSystemId),
    energySourceId: normalizeNullableString(candidate.energySourceId),
    url: normalizeNullableString(candidate.url),
    lastUpdated: normalizeNullableString(candidate.lastUpdated),
    typeName: normalizeNullableString(candidate.typeName),
  };
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}