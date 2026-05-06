import { getSharedBackendBaseUrl } from "@/lib/assemblySummaryClient";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type {
  IndexedActionCandidate,
  IndexedActionRequiredIds,
  IndexedNodePowerUsageSummary,
  IndexedPowerRequirement,
  IndexedStructureAction,
  IndexedPowerSummary,
  StructureActionTargetType,
} from "@/types/domain";
import type {
  OperatorInventoryFamily,
  OperatorInventoryNode,
  OperatorInventoryOperator,
  OperatorInventoryResponse,
  OperatorInventorySize,
  OperatorInventoryStatus,
  OperatorInventoryStructure,
  OperatorInventoryRawActionProof,
  OperatorInventoryRawStructureProof,
} from "@/types/operatorInventory";

const OPERATOR_INVENTORY_PATH = "/api/civilization-control/operator-inventory";
const REQUEST_TIMEOUT_MS = 5_000;

interface FetchOperatorInventoryOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

interface ErrorPayload {
  error: string | null;
  message: string | null;
}

export class OperatorInventoryError extends Error {
  status: number | null;
  code: string | null;

  constructor(message: string, options: { status?: number | null; code?: string | null } = {}) {
    super(message);
    this.name = "OperatorInventoryError";
    this.status = options.status ?? null;
    this.code = options.code ?? null;
  }
}

export function normalizeOperatorInventoryWalletAddress(value: string | null | undefined): string | null {
  return normalizeCanonicalObjectId(value);
}

export function buildOperatorInventoryUrl(
  walletAddress: string,
  baseUrl = getSharedBackendBaseUrl(),
): string {
  const normalizedWallet = normalizeOperatorInventoryWalletAddress(walletAddress);
  if (!normalizedWallet) {
    throw new OperatorInventoryError("Invalid wallet address", { code: "invalid_wallet_address" });
  }

  const url = new URL(OPERATOR_INVENTORY_PATH, `${baseUrl}/`);
  url.searchParams.set("walletAddress", normalizedWallet);
  return url.toString();
}

export async function fetchOperatorInventory(
  walletAddress: string,
  options: FetchOperatorInventoryOptions = {},
): Promise<OperatorInventoryResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildOperatorInventoryUrl(walletAddress, options.baseUrl ?? getSharedBackendBaseUrl()), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await buildOperatorInventoryRequestError(response);
    }

    const payload = await response.json();
    const normalized = normalizeOperatorInventoryResponse(payload);
    if (!normalized) {
      throw new OperatorInventoryError("Operator inventory response shape was invalid", { code: "invalid_response" });
    }

    if (normalized.schemaVersion !== "operator-inventory.v1") {
      throw new OperatorInventoryError(
        `Unsupported operator inventory schema: ${normalized.schemaVersion}`,
        { code: "schema_mismatch" },
      );
    }

    return normalized;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OperatorInventoryError("Operator inventory request timed out", { code: "timeout" });
    }

    if (error instanceof OperatorInventoryError) {
      throw error;
    }

    throw new OperatorInventoryError(
      error instanceof Error ? error.message : "Operator inventory request failed",
      { code: "request_failed" },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getOperatorInventoryErrorMessage(error: unknown): string {
  if (!(error instanceof OperatorInventoryError)) {
    return error instanceof Error ? error.message : "Operator inventory is unavailable.";
  }

  if (error.code === "invalid_wallet_address") {
    return "Connected wallet address is invalid for operator inventory.";
  }

  if (error.code === "schema_mismatch") {
    return "Operator inventory schema was not recognized by this build.";
  }

  if (error.status === 400) {
    return error.message || "Operator inventory request was rejected by the shared read model.";
  }

  if (error.status === 403) {
    return error.message || "Operator inventory request was blocked for this browser origin.";
  }

  if (error.status === 405) {
    return error.message || "Operator inventory endpoint rejected this request method.";
  }

  if (error.status != null && [502, 503, 504].includes(error.status)) {
    return "Operator inventory is temporarily unavailable.";
  }

  return error.message || "Operator inventory is unavailable.";
}

async function buildOperatorInventoryRequestError(response: Response): Promise<OperatorInventoryError> {
  const payload = await parseErrorPayload(response);
  const message = payload.message
    ?? (response.status === 400 ? "Operator inventory request was rejected by the shared read model." : null)
    ?? `Operator inventory request failed with status ${response.status}`;

  return new OperatorInventoryError(message, {
    status: response.status,
    code: payload.error,
  });
}

async function parseErrorPayload(response: Response): Promise<ErrorPayload> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    try {
      const payload = await response.json() as Record<string, unknown>;
      return {
        error: normalizeNullableString(payload.error),
        message: normalizeNullableString(payload.message),
      };
    } catch {
      return { error: null, message: null };
    }
  }

  try {
    const text = normalizeNullableString(await response.text());
    return { error: null, message: text };
  } catch {
    return { error: null, message: null };
  }
}

export function normalizeOperatorInventoryResponse(payload: unknown): OperatorInventoryResponse | null {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const schemaVersion = normalizeNullableString(candidate.schemaVersion);
  if (!schemaVersion) return null;
  if (!Array.isArray(candidate.networkNodes) || !Array.isArray(candidate.unlinkedStructures)) return null;

  const warnings = normalizeStringArray(candidate.warnings);
  const partial = normalizeBoolean(candidate.partial) ?? false;
  const source = normalizeNullableString(candidate.source);
  const fetchedAt = normalizeNullableTimestamp(candidate.fetchedAt);

  return {
    schemaVersion: schemaVersion as OperatorInventoryResponse["schemaVersion"],
    operator: normalizeOperatorInventoryOperator(candidate.operator),
    networkNodes: candidate.networkNodes
      .map((entry) => normalizeOperatorInventoryNode(entry, { partial, source, warnings }))
      .filter((entry): entry is OperatorInventoryNode => entry !== null),
    unlinkedStructures: candidate.unlinkedStructures
      .map((entry) => normalizeOperatorInventoryStructure(entry, { partial, source, warnings }))
      .filter((entry): entry is OperatorInventoryStructure => entry !== null),
    warnings,
    partial,
    source,
    fetchedAt,
  };
}

function normalizeOperatorInventoryOperator(value: unknown): OperatorInventoryOperator | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const walletAddress = normalizeOperatorInventoryWalletAddress(normalizeNullableString(candidate.walletAddress));
  if (!walletAddress) {
    return null;
  }

  return {
    walletAddress,
    characterId: normalizeCanonicalObjectId(normalizeNullableString(candidate.characterId)),
    characterName: normalizeNullableString(candidate.characterName),
    tribeId: normalizeNumber(candidate.tribeId),
    tribeName: normalizeNullableString(candidate.tribeName),
  };
}

function normalizeOperatorInventoryNode(
  value: unknown,
  defaults: { partial: boolean; source: string | null; warnings: string[] },
): OperatorInventoryNode | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const rawNode = normalizeOperatorInventoryStructure(candidate.node, defaults);
  if (!rawNode || !Array.isArray(candidate.structures)) return null;

  const wrapperPowerUsageSummary = normalizeIndexedNodePowerUsageSummary(candidate.powerUsageSummary);
  const node = rawNode.powerUsageSummary == null && wrapperPowerUsageSummary != null
    ? {
        ...rawNode,
        powerUsageSummary: wrapperPowerUsageSummary,
      }
    : rawNode;

  return {
    node,
    structures: candidate.structures
      .map((entry) => normalizeOperatorInventoryStructure(entry, defaults))
      .filter((entry): entry is OperatorInventoryStructure => entry !== null),
    powerUsageSummary: wrapperPowerUsageSummary ?? node.powerUsageSummary,
  };
}

function normalizeOperatorInventoryStructure(
  value: unknown,
  defaults: { partial: boolean; source: string | null; warnings: string[] },
): OperatorInventoryStructure | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const objectId = normalizeCanonicalObjectId(normalizeNullableString(candidate.objectId));
  const assemblyId = normalizeNullableString(candidate.assemblyId);

  if (!objectId && !assemblyId) {
    return null;
  }

  const actionCandidate = normalizeIndexedActionCandidate(
    candidate.actionCandidate,
    candidate,
  );

  return {
    objectId,
    assemblyId,
    ownerCapId: normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId)),
    family: normalizeOperatorInventoryFamily(candidate.family, candidate.assemblyType, candidate.typeName),
    size: normalizeOperatorInventorySize(candidate.size, candidate.typeName, candidate.assemblyType),
    displayName: normalizeNullableString(candidate.displayName),
    displayNameSource: normalizeNullableString(candidate.displayNameSource),
    displayNameUpdatedAt: normalizeNullableTimestamp(candidate.displayNameUpdatedAt),
    name: normalizeNullableString(candidate.name),
    typeId: normalizeNumber(candidate.typeId),
    typeName: normalizeNullableString(candidate.typeName),
    assemblyType: normalizeNullableString(candidate.assemblyType),
    status: normalizeOperatorInventoryStatus(candidate.status),
    networkNodeId: normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId)),
    energySourceId: normalizeNullableString(candidate.energySourceId),
    linkedGateId: normalizeCanonicalObjectId(normalizeNullableString(candidate.linkedGateId)),
    ownerWalletAddress: normalizeOperatorInventoryWalletAddress(normalizeNullableString(candidate.ownerWalletAddress)),
    characterId: normalizeCanonicalObjectId(normalizeNullableString(candidate.characterId)),
    extensionStatus: normalizeExtensionStatus(candidate.extensionStatus),
    fuelAmount: normalizeNullableString(candidate.fuelAmount),
    powerSummary: normalizeIndexedPowerSummary(candidate.powerSummary),
    powerRequirement: normalizeIndexedPowerRequirement(candidate.powerRequirement),
    powerUsageSummary: normalizeIndexedNodePowerUsageSummary(candidate.powerUsageSummary),
    solarSystemId: normalizeNullableString(candidate.solarSystemId),
    url: normalizeNullableString(candidate.url),
    lastObservedCheckpoint: normalizeNullableString(candidate.lastObservedCheckpoint),
    lastObservedTimestamp: normalizeNullableTimestamp(candidate.lastObservedTimestamp),
    lastUpdated: normalizeNullableTimestamp(candidate.lastUpdated),
    source: normalizeNullableString(candidate.source) ?? defaults.source,
    provenance: normalizeNullableString(candidate.provenance),
    partial: normalizeBoolean(candidate.partial) ?? defaults.partial,
    warnings: normalizeStringArray(candidate.warnings).length > 0
      ? normalizeStringArray(candidate.warnings)
      : defaults.warnings,
    actionCandidate,
    rawProof: normalizeOperatorInventoryRawProof(candidate),
  };
}

function normalizeOperatorInventoryRawProof(candidate: Record<string, unknown>): OperatorInventoryRawStructureProof {
  return {
    objectId: normalizeCanonicalObjectId(normalizeNullableString(candidate.objectId)),
    assemblyId: normalizeNullableString(candidate.assemblyId),
    ownerCapId: normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId)),
    networkNodeId: normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId)),
    energySourceId: normalizeNullableString(candidate.energySourceId),
    displayName: normalizeNullableString(candidate.displayName),
    name: normalizeNullableString(candidate.name),
    typeName: normalizeNullableString(candidate.typeName),
    family: normalizeNullableString(candidate.family),
    size: normalizeNullableString(candidate.size),
    status: normalizeNullableString(candidate.status),
    source: normalizeNullableString(candidate.source),
    provenance: normalizeNullableString(candidate.provenance),
    displayNameSource: normalizeNullableString(candidate.displayNameSource),
    displayNameUpdatedAt: normalizeNullableTimestamp(candidate.displayNameUpdatedAt),
    powerRequirement: normalizeIndexedPowerRequirement(candidate.powerRequirement),
    powerUsageSummary: normalizeIndexedNodePowerUsageSummary(candidate.powerUsageSummary),
    actionCandidate: normalizeRawActionProof(candidate.actionCandidate),
  };
}

function normalizeRawActionProof(value: unknown): OperatorInventoryRawActionProof | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const actions = candidate.actions && typeof candidate.actions === "object"
    ? candidate.actions as Record<string, unknown>
    : {};
  const power = actions.power && typeof actions.power === "object" ? actions.power as Record<string, unknown> : null;
  const rename = actions.rename && typeof actions.rename === "object" ? actions.rename as Record<string, unknown> : null;

  return {
    actions: {
      power: { requiredIds: normalizeRawActionRequiredIds(power?.requiredIds) },
      rename: { requiredIds: normalizeRawActionRequiredIds(rename?.requiredIds) },
    },
  };
}

function normalizeRawActionRequiredIds(value: unknown): IndexedActionRequiredIds | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const structureId = normalizeCanonicalObjectId(normalizeNullableString(candidate.structureId));
  const ownerCapId = normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId));
  const networkNodeId = normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId));
  const structureType = normalizeStructureActionTargetType(candidate.structureType);

  if (!structureId && !ownerCapId && !networkNodeId && !structureType) {
    return null;
  }

  return {
    structureId,
    ownerCapId,
    networkNodeId,
    structureType,
  };
}

function normalizeIndexedPowerSummary(value: unknown): IndexedPowerSummary | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const fuelAmount = normalizeNumber(candidate.fuelAmount);
  const fuelMaxCapacity = normalizeNumber(candidate.fuelMaxCapacity);
  const fuelTypeId = normalizeNumber(candidate.fuelTypeId);
  const fuelTypeName = normalizeNullableString(candidate.fuelTypeName);
  const fuelGrade = normalizeNullableString(candidate.fuelGrade);
  const efficiencyPercent = normalizeNumber(candidate.efficiencyPercent);
  const burnRateUnitsPerHour = normalizeNumber(candidate.burnRateUnitsPerHour);
  const estimatedSecondsRemaining = normalizeNumber(candidate.estimatedSecondsRemaining);
  const estimatedHoursRemaining = normalizeNumber(candidate.estimatedHoursRemaining);
  const criticalFuelThresholdSeconds = normalizeNumber(candidate.criticalFuelThresholdSeconds);
  const lowFuelThresholdSeconds = normalizeNumber(candidate.lowFuelThresholdSeconds);
  const isLowFuel = normalizeBoolean(candidate.isLowFuel);
  const isCriticalFuel = normalizeBoolean(candidate.isCriticalFuel);
  const source = normalizeNullableString(candidate.source);
  const lastUpdated = normalizeNullableTimestamp(candidate.lastUpdated);
  const confidence = normalizeNullableString(candidate.confidence);

  const hasUsefulField = [
    fuelAmount,
    fuelMaxCapacity,
    fuelTypeId,
    fuelTypeName,
    fuelGrade,
    efficiencyPercent,
    burnRateUnitsPerHour,
    estimatedSecondsRemaining,
    estimatedHoursRemaining,
    criticalFuelThresholdSeconds,
    lowFuelThresholdSeconds,
    source,
    lastUpdated,
    confidence,
  ].some((field) => field != null)
    || isLowFuel != null
    || isCriticalFuel != null;

  if (!hasUsefulField) {
    return null;
  }

  return {
    fuelAmount,
    fuelMaxCapacity,
    fuelTypeId,
    fuelTypeName,
    fuelGrade,
    efficiencyPercent,
    burnRateUnitsPerHour,
    estimatedSecondsRemaining,
    estimatedHoursRemaining,
    criticalFuelThresholdSeconds,
    lowFuelThresholdSeconds,
    isLowFuel,
    isCriticalFuel,
    source,
    lastUpdated,
    confidence,
  };
}

function normalizeIndexedPowerRequirementSource(
  value: unknown,
): IndexedPowerRequirement["source"] {
  const normalized = normalizeNullableString(value);
  if (normalized === "indexed_config" || normalized === "indexed_type" || normalized === "unavailable") {
    return normalized;
  }

  return null;
}

function normalizeIndexedPowerRequirementConfidence(
  value: unknown,
): IndexedPowerRequirement["confidence"] {
  const normalized = normalizeNullableString(value);
  if (normalized === "indexed" || normalized === "unavailable") {
    return normalized;
  }

  return null;
}

function normalizeIndexedPowerRequirement(value: unknown): IndexedPowerRequirement | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const requiredGj = normalizeNumber(candidate.requiredGj);
  const source = normalizeIndexedPowerRequirementSource(candidate.source);
  const confidence = normalizeIndexedPowerRequirementConfidence(candidate.confidence);
  const typeId = normalizeNullableString(candidate.typeId);
  const family = normalizeNullableString(candidate.family);
  const size = normalizeNullableString(candidate.size);
  const lastUpdated = normalizeNullableTimestamp(candidate.lastUpdated);

  const hasUsefulField = [requiredGj, source, confidence, typeId, family, size, lastUpdated]
    .some((field) => field != null);

  if (!hasUsefulField) {
    return null;
  }

  return {
    requiredGj,
    source,
    confidence,
    typeId,
    family,
    size,
    lastUpdated,
  };
}

function normalizeIndexedNodePowerUsageSummarySource(
  value: unknown,
): IndexedNodePowerUsageSummary["source"] {
  const normalized = normalizeNullableString(value);
  if (normalized === "indexed_children" || normalized === "partial" || normalized === "unavailable") {
    return normalized;
  }

  return null;
}

function normalizeIndexedNodePowerUsageSummaryConfidence(
  value: unknown,
): IndexedNodePowerUsageSummary["confidence"] {
  const normalized = normalizeNullableString(value);
  if (normalized === "indexed" || normalized === "partial" || normalized === "unavailable") {
    return normalized;
  }

  return null;
}

function normalizeIndexedNodePowerUsageSummary(value: unknown): IndexedNodePowerUsageSummary | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const capacityGj = normalizeNumber(candidate.capacityGj);
  const usedGj = normalizeNumber(candidate.usedGj);
  const availableGj = normalizeNumber(candidate.availableGj);
  const onlineKnownLoadGj = normalizeNumber(candidate.onlineKnownLoadGj);
  const onlineUnknownLoadCount = normalizeNumber(candidate.onlineUnknownLoadCount);
  const totalKnownLoadGj = normalizeNumber(candidate.totalKnownLoadGj);
  const totalUnknownLoadCount = normalizeNumber(candidate.totalUnknownLoadCount);
  const source = normalizeIndexedNodePowerUsageSummarySource(candidate.source);
  const confidence = normalizeIndexedNodePowerUsageSummaryConfidence(candidate.confidence);
  const lastUpdated = normalizeNullableTimestamp(candidate.lastUpdated);

  const hasUsefulField = [
    capacityGj,
    usedGj,
    availableGj,
    onlineKnownLoadGj,
    onlineUnknownLoadCount,
    totalKnownLoadGj,
    totalUnknownLoadCount,
    source,
    confidence,
    lastUpdated,
  ].some((field) => field != null);

  if (!hasUsefulField) {
    return null;
  }

  return {
    capacityGj,
    usedGj,
    availableGj,
    onlineKnownLoadGj,
    onlineUnknownLoadCount,
    totalKnownLoadGj,
    totalUnknownLoadCount,
    source,
    confidence,
    lastUpdated,
  };
}

function normalizeIndexedActionCandidate(
  value: unknown,
  rowCandidate: Record<string, unknown>,
): IndexedActionCandidate | null {
  if (!value || typeof value !== "object") {
    const supported = normalizeBoolean(rowCandidate.supported);
    const familySupported = normalizeBoolean(rowCandidate.familySupported);
    const unavailableReason = normalizeNullableString(rowCandidate.unavailableReason);

    if (supported == null && familySupported == null && !unavailableReason) {
      return null;
    }

    return {
      actions: { power: null, rename: null },
      supported,
      familySupported,
      unavailableReason,
    };
  }

  const candidate = value as Record<string, unknown>;
  const actionsCandidate = candidate.actions as Record<string, unknown> | undefined;
  const actionDefaults = buildIndexedStructureActionDefaults(candidate, rowCandidate);
  return {
    actions: {
      power: normalizeIndexedStructureAction(actionsCandidate?.power, actionDefaults),
      rename: normalizeIndexedStructureAction(actionsCandidate?.rename, actionDefaults),
    },
    supported: normalizeBoolean(candidate.supported) ?? normalizeBoolean(rowCandidate.supported),
    familySupported: normalizeBoolean(candidate.familySupported) ?? normalizeBoolean(rowCandidate.familySupported),
    unavailableReason: normalizeNullableString(candidate.unavailableReason) ?? normalizeNullableString(rowCandidate.unavailableReason),
  };
}

interface IndexedStructureActionDefaults {
  indexedOwnerCapPresent: boolean | null;
  requiredIds: IndexedActionRequiredIds | null;
}

function buildIndexedStructureActionDefaults(
  candidate: Record<string, unknown>,
  rowCandidate: Record<string, unknown>,
): IndexedStructureActionDefaults {
  const requiredIdsFallback: IndexedActionRequiredIds = {
    structureId: normalizeCanonicalObjectId(normalizeNullableString(candidate.objectId))
      ?? normalizeCanonicalObjectId(normalizeNullableString(rowCandidate.objectId)),
    structureType: normalizeStructureActionTargetType(candidate.structureType)
      ?? normalizeStructureActionTargetType(rowCandidate.structureType)
      ?? normalizeStructureActionTargetType(rowCandidate.family)
      ?? normalizeStructureActionTargetType(rowCandidate.assemblyType)
      ?? normalizeStructureActionTargetType(rowCandidate.typeName),
    ownerCapId: normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId))
      ?? normalizeCanonicalObjectId(normalizeNullableString(rowCandidate.ownerCapId)),
    networkNodeId: normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId))
      ?? normalizeCanonicalObjectId(normalizeNullableString(rowCandidate.networkNodeId)),
  };
  const requiredIds = normalizeIndexedActionRequiredIds(candidate.requiredIds, requiredIdsFallback)
    ?? normalizeIndexedActionRequiredIds(null, requiredIdsFallback);

  return {
    indexedOwnerCapPresent: normalizeBoolean(candidate.indexedOwnerCapPresent)
      ?? normalizeBoolean(candidate.hasIndexedOwnerCap)
      ?? (requiredIds?.ownerCapId ? true : null),
    requiredIds,
  };
}

function normalizeIndexedStructureAction(
  value: unknown,
  defaults: IndexedStructureActionDefaults = { indexedOwnerCapPresent: null, requiredIds: null },
): IndexedStructureAction | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const requiredIds = normalizeIndexedActionRequiredIds(candidate.requiredIds, defaults.requiredIds ?? undefined)
    ?? defaults.requiredIds;

  return {
    candidate: normalizeBoolean(candidate.candidate) ?? false,
    currentlyImplementedInCivilizationControl: normalizeBoolean(candidate.currentlyImplementedInCivilizationControl) ?? false,
    familySupported: normalizeBoolean(candidate.familySupported),
    indexedOwnerCapPresent: normalizeBoolean(candidate.indexedOwnerCapPresent) ?? defaults.indexedOwnerCapPresent,
    requiredIds,
    unavailableReason: normalizeNullableString(candidate.unavailableReason),
  };
}

function normalizeIndexedActionRequiredIds(
  value: unknown,
  fallback?: Partial<IndexedActionRequiredIds>,
): IndexedActionRequiredIds | null {
  if ((!value || typeof value !== "object") && !fallback) return null;

  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const requiredIds: IndexedActionRequiredIds = {
    structureId: normalizeCanonicalObjectId(normalizeNullableString(candidate.structureId))
      ?? normalizeCanonicalObjectId(normalizeNullableString(candidate.objectId))
      ?? fallback?.structureId
      ?? null,
    structureType: normalizeStructureActionTargetType(candidate.structureType)
      ?? fallback?.structureType
      ?? null,
    ownerCapId: normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId))
      ?? fallback?.ownerCapId
      ?? null,
    networkNodeId: normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId))
      ?? fallback?.networkNodeId
      ?? null,
  };

  return Object.values(requiredIds).some((field) => field != null) ? requiredIds : null;
}

function normalizeStructureActionTargetType(value: unknown): StructureActionTargetType | null {
  const normalized = normalizeNullableString(value)?.trim().toLowerCase();
  if (!normalized) return null;

  switch (normalized) {
    case "gate":
      return "gate";
    case "storage":
    case "storage_unit":
    case "tradepost":
    case "trade_post":
      return "storage_unit";
    case "turret":
      return "turret";
    case "networknode":
    case "network_node":
      return "network_node";
    case "assembly":
    case "generic_assembly":
    case "printer":
    case "refinery":
    case "refiner":
    case "assembler":
    case "berth":
    case "relay":
    case "nursery":
    case "nest":
    case "shelter":
    case "hangar":
      return "assembly";
    default:
      return null;
  }
}

function normalizeOperatorInventoryFamily(
  family: unknown,
  assemblyType: unknown,
  typeName: unknown,
): OperatorInventoryFamily | null {
  const candidates = [family, assemblyType, typeName]
    .map((value) => normalizeNullableString(value)?.toLowerCase().replace(/[\s-]+/g, "_"))
    .filter((value): value is string => Boolean(value));

  if (candidates.some((value) => value.includes("network_node") || value.includes("networknode"))) return "networkNode";
  if (candidates.some((value) => value.includes("gate"))) return "gate";
  if (candidates.some((value) => value.includes("storage") || value.includes("trade_post") || value.includes("tradepost"))) return "storage";
  if (candidates.some((value) => value.includes("turret"))) return "turret";
  if (candidates.some((value) => value.includes("printer"))) return "printer";
  if (candidates.some((value) => value.includes("refinery") || value.includes("refiner"))) return "refinery";
  if (candidates.some((value) => value.includes("assembler"))) return "assembler";
  if (candidates.some((value) => value.includes("berth"))) return "berth";
  if (candidates.some((value) => value.includes("relay"))) return "relay";
  if (candidates.some((value) => value.includes("nursery"))) return "nursery";
  if (candidates.some((value) => value.includes("nest"))) return "nest";
  if (candidates.some((value) => value.includes("shelter") || value.includes("hangar"))) return "shelter";

  return null;
}

function normalizeOperatorInventorySize(
  size: unknown,
  typeName: unknown,
  assemblyType: unknown,
): OperatorInventorySize {
  const explicit = normalizeNullableString(size)?.toLowerCase();
  if (explicit === "mini" || explicit === "standard" || explicit === "heavy") {
    return explicit;
  }

  const combined = [typeName, assemblyType]
    .map((value) => normalizeNullableString(value)?.toLowerCase())
    .filter((value): value is string => Boolean(value))
    .join(" ");

  if (combined.includes("heavy")) return "heavy";
  if (combined.includes("mini") || combined.includes("field")) return "mini";
  return null;
}

function normalizeOperatorInventoryStatus(value: unknown): OperatorInventoryStatus | null {
  const normalized = normalizeNullableString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return null;

  switch (normalized) {
    case "online":
      return "online";
    case "offline":
      return "offline";
    case "unanchored":
      return "unanchored";
    case "warning":
    case "degraded":
      return "warning";
    case "unknown":
      return "unknown";
    default:
      return "unknown";
  }
}

function normalizeExtensionStatus(value: unknown): "authorized" | "stale" | "none" | null {
  const normalized = normalizeNullableString(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "authorized" || normalized === "stale" || normalized === "none") {
    return normalized;
  }
  return null;
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNullableTimestamp(value: unknown): string | null {
  const normalized = normalizeNullableString(value);
  if (!normalized) return null;
  return Number.isNaN(Date.parse(normalized)) ? null : normalized;
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

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => normalizeNullableString(entry)).filter((entry): entry is string => Boolean(entry));
}
