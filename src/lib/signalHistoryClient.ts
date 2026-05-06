import { getSharedBackendBaseUrl } from "@/lib/assemblySummaryClient";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type {
  SignalCategory,
  SignalEvent,
  SignalEventMetadata,
  SignalKind,
  SignalVariant,
} from "@/types/domain";
import type {
  SignalHistoryCategory,
  SignalHistoryOperator,
  SignalHistoryPage,
  SignalHistoryQuery,
} from "@/types/signalHistory";

const SIGNAL_HISTORY_PATH = "/api/civilization-control/signal-history";
const REQUEST_TIMEOUT_MS = 5_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const SIGNAL_HISTORY_CATEGORIES: ReadonlySet<SignalHistoryCategory> = new Set([
  "governance",
  "trade",
  "transit",
  "status",
]);

interface FetchSignalHistoryOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

interface ErrorPayload {
  error: string | null;
  message: string | null;
}

interface SignalHistoryDescriptor {
  label: string;
  description: string;
  variant: SignalVariant;
}

const SIGNAL_METADATA_TEXT_KEYS = [
  "authorizationMode",
  "defaultAccess",
  "errorCode",
  "extensionType",
  "itemTypeName",
  "mode",
  "name",
  "newMode",
  "oldMode",
  "oldName",
  "operation",
  "permitId",
  "previousExtension",
  "reason",
  "status",
  "structureType",
  "treasury",
  "treasuryAddress",
] as const;

const SIGNAL_METADATA_NUMBER_KEYS = [
  "amount",
  "defaultToll",
  "entryCount",
  "tollAmount",
  "tribeId",
  "volume",
] as const;

const SIGNAL_KIND_FALLBACKS: Record<string, SignalHistoryDescriptor> = {
  extension_authorized: {
    label: "Extension Authorized",
    description: "An extension authorization changed in your governed infrastructure.",
    variant: "info",
  },
  extension_frozen: {
    label: "Extension Frozen",
    description: "An extension is frozen in your governed infrastructure.",
    variant: "blocked",
  },
  fuel_changed: {
    label: "Fuel Updated",
    description: "Fuel state changed in your governed infrastructure.",
    variant: "neutral",
  },
  gate_transit: {
    label: "Gate Transit",
    description: "A transit event was recorded through a governed gate.",
    variant: "info",
  },
  gate_policy_preset_changed: {
    label: "Gate policy preset changed",
    description: "A governed gate policy preset changed.",
    variant: "info",
  },
  gate_treasury_changed: {
    label: "Gate treasury changed",
    description: "A governed gate treasury changed.",
    variant: "info",
  },
  node_critical_fuel: {
    label: "Critical Fuel",
    description: "A governed network node reached a critical fuel threshold.",
    variant: "blocked",
  },
  node_fuel_changed: {
    label: "Node Fuel Updated",
    description: "Node fuel changed in your governed infrastructure.",
    variant: "neutral",
  },
  node_low_fuel: {
    label: "Low Fuel",
    description: "A governed network node is approaching a low fuel threshold.",
    variant: "blocked",
  },
  ownership_transferred: {
    label: "Ownership Transferred",
    description: "Ownership changed on a governed structure.",
    variant: "info",
  },
  permit_issued: {
    label: "Permit issued",
    description: "A transit permit was issued for governed infrastructure.",
    variant: "info",
  },
  posture_changed: {
    label: "Posture changed",
    description: "Operational posture changed for governed infrastructure.",
    variant: "info",
  },
  storage_deposit: {
    label: "Storage Deposit",
    description: "Inventory was deposited into governed storage.",
    variant: "info",
  },
  storage_withdraw: {
    label: "Storage Withdrawal",
    description: "Inventory was withdrawn from governed storage.",
    variant: "info",
  },
  structure_destroyed: {
    label: "Structure Destroyed",
    description: "A governed structure was destroyed.",
    variant: "blocked",
  },
  structure_offline: {
    label: "Structure Offline",
    description: "A governed structure went offline.",
    variant: "blocked",
  },
  structure_online: {
    label: "Structure Online",
    description: "A governed structure came online.",
    variant: "info",
  },
  structure_renamed: {
    label: "Structure renamed",
    description: "A governed structure was renamed.",
    variant: "info",
  },
  structure_unanchored: {
    label: "Structure Unanchored",
    description: "A governed structure was unanchored.",
    variant: "blocked",
  },
  toll_paid: {
    label: "Toll paid",
    description: "A governed transit toll was recorded.",
    variant: "revenue",
  },
};

export class SignalHistoryError extends Error {
  status: number | null;
  code: string | null;

  constructor(message: string, options: { status?: number | null; code?: string | null } = {}) {
    super(message);
    this.name = "SignalHistoryError";
    this.status = options.status ?? null;
    this.code = options.code ?? null;
  }
}

export function normalizeSignalHistoryWalletAddress(value: string | null | undefined): string | null {
  return normalizeCanonicalObjectId(value);
}

export function normalizeSignalHistoryLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LIMIT;
  }

  const normalized = Math.trunc(value as number);
  if (normalized < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(normalized, MAX_LIMIT);
}

export function normalizeSignalHistoryCategories(
  value: readonly (SignalHistoryCategory | null | undefined)[] | null | undefined,
): SignalHistoryCategory[] {
  if (!value || value.length === 0) {
    return [];
  }

  const categories = new Set<SignalHistoryCategory>();
  for (const entry of value) {
    if (entry && SIGNAL_HISTORY_CATEGORIES.has(entry)) {
      categories.add(entry);
    }
  }

  return Array.from(categories);
}

export function buildSignalHistoryUrl(
  query: SignalHistoryQuery,
  baseUrl = getSharedBackendBaseUrl(),
): string {
  const walletAddress = normalizeSignalHistoryWalletAddress(query.walletAddress);
  if (!walletAddress) {
    throw new SignalHistoryError("Invalid wallet address", { code: "invalid_wallet_address" });
  }

  const url = new URL(SIGNAL_HISTORY_PATH, `${baseUrl}/`);
  url.searchParams.set("walletAddress", walletAddress);
  url.searchParams.set("limit", String(normalizeSignalHistoryLimit(query.limit)));

  const categories = normalizeSignalHistoryCategories(query.categories);
  if (categories.length > 0) {
    url.searchParams.set("categories", categories.join(","));
  }

  const cursor = normalizeOptionalText(query.cursor);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const networkNodeId = normalizeCanonicalObjectId(query.networkNodeId);
  if (networkNodeId) {
    url.searchParams.set("networkNodeId", networkNodeId);
  }

  const structureId = normalizeCanonicalObjectId(query.structureId);
  if (structureId) {
    url.searchParams.set("structureId", structureId);
  }

  const since = normalizeSignalHistorySince(query.since);
  if (since) {
    url.searchParams.set("since", since);
  }

  return url.toString();
}

export async function fetchSignalHistory(
  query: SignalHistoryQuery,
  options: FetchSignalHistoryOptions = {},
): Promise<SignalHistoryPage> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildSignalHistoryUrl(query, options.baseUrl ?? getSharedBackendBaseUrl()), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await buildSignalHistoryRequestError(response);
    }

    const payload = await response.json();
    const normalized = normalizeSignalHistoryResponse(payload);
    if (!normalized) {
      throw new SignalHistoryError("Signal history response shape was invalid", { code: "invalid_response" });
    }

    if (normalized.schemaVersion !== "signal-history.v1") {
      throw new SignalHistoryError(
        `Unsupported signal history schema: ${normalized.schemaVersion}`,
        { code: "schema_mismatch" },
      );
    }

    return normalized;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new SignalHistoryError("Signal history request timed out", { code: "timeout" });
    }

    if (error instanceof SignalHistoryError) {
      throw error;
    }

    throw new SignalHistoryError(
      error instanceof Error ? error.message : "Signal history request failed",
      { code: "request_failed" },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getSignalHistoryErrorMessage(error: unknown): string {
  if (!(error instanceof SignalHistoryError)) {
    return error instanceof Error ? error.message : "Signal Feed is unavailable.";
  }

  if (error.code === "invalid_wallet_address") {
    return "Connected wallet address is invalid for Signal Feed.";
  }

  if (error.code === "schema_mismatch") {
    return "Signal Feed response was not recognized by this build.";
  }

  if (error.status === 400) {
    return error.message || "Signal Feed request was rejected.";
  }

  if (error.status === 403) {
    return error.message || "Signal Feed is unavailable from this browser origin.";
  }

  if (error.status === 405) {
    return error.message || "Signal Feed request method was rejected.";
  }

  if (error.status != null && [502, 503, 504].includes(error.status)) {
    return "Signal Feed is temporarily unavailable.";
  }

  return error.message || "Signal Feed is unavailable.";
}

async function buildSignalHistoryRequestError(response: Response): Promise<SignalHistoryError> {
  const payload = await parseErrorPayload(response);
  const message = payload.message
    ?? (response.status === 400 ? "Signal Feed request was rejected." : null)
    ?? `Signal history request failed with status ${response.status}`;

  return new SignalHistoryError(message, {
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

function normalizeSignalHistoryResponse(payload: unknown): SignalHistoryPage | null {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const schemaVersion = normalizeNullableString(candidate.schemaVersion);
  if (!schemaVersion) return null;
  if (!Array.isArray(candidate.signals)) return null;

  const warnings = normalizeStringArray(candidate.warnings);
  const signals = candidate.signals
    .map((entry) => normalizeSignalHistorySignal(entry))
    .filter((entry): entry is SignalEvent => entry !== null);

  return {
    schemaVersion: schemaVersion as SignalHistoryPage["schemaVersion"],
    source: normalizeNullableString(candidate.source),
    fetchedAt: normalizeNullableTimestamp(candidate.fetchedAt),
    partial: normalizeBoolean(candidate.partial) ?? false,
    warnings,
    operator: normalizeSignalHistoryOperator(candidate.operator),
    signals,
    nextCursor: normalizeOptionalText(candidate.nextCursor),
  };
}

function normalizeSignalHistoryOperator(value: unknown): SignalHistoryOperator | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  return {
    walletAddress: normalizeSignalHistoryWalletAddress(normalizeNullableString(candidate.walletAddress)),
    characterId: normalizeCanonicalObjectId(normalizeNullableString(candidate.characterId)),
    characterName: normalizeNullableString(candidate.characterName),
    tribeId: normalizeNumber(candidate.tribeId),
    tribeName: normalizeNullableString(candidate.tribeName),
  };
}

function normalizeSignalHistorySignal(value: unknown): SignalEvent | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const id = normalizeOptionalText(candidate.id);
  const timestamp = normalizeNullableTimestamp(candidate.timestamp);
  const category = normalizeSignalCategory(candidate.category);
  if (!id || !timestamp || !category) {
    return null;
  }

  const kind = (normalizeOptionalText(candidate.kind) ?? "unknown") as SignalKind;
  const severity = normalizeOptionalText(candidate.severity)?.toLowerCase() ?? null;
  const metadata = normalizeSignalMetadata(candidate.metadata);
  const amount = normalizeNumber(candidate.amount) ?? getSignalMetadataNumber(metadata, "amount", "tollAmount");
  const fallback = SIGNAL_KIND_FALLBACKS[kind] ?? {
    label: fallbackTitleFromKind(kind, category),
    description: "A signal was recorded in your governed infrastructure.",
    variant: category === "status" ? "neutral" : "info",
  };
  const descriptor = resolveSignalDescriptor(kind, metadata, amount);

  const structureId = normalizeCanonicalObjectId(normalizeNullableString(candidate.structureId));
  const networkNodeId = normalizeCanonicalObjectId(normalizeNullableString(candidate.networkNodeId));
  const ownerCapId = normalizeCanonicalObjectId(normalizeNullableString(candidate.ownerCapId));
  const assemblyId = normalizeOptionalText(candidate.assemblyId);
  const actorCharacterId = normalizeCanonicalObjectId(normalizeNullableString(candidate.actorCharacterId));
  const checkpoint = normalizeNumberishValue(candidate.checkpoint);
  const eventSeq = normalizeNumberishValue(candidate.eventSeq) ?? checkpoint ?? id;
  const title = descriptor?.label ?? normalizeOptionalText(candidate.title) ?? fallback.label;
  const summary = descriptor?.description ?? normalizeOptionalText(candidate.summary) ?? fallback.description;
  const txDigest = normalizeOptionalText(candidate.txDigest) ?? id;
  const variant = resolveSignalVariant(category, kind, severity, descriptor?.variant ?? fallback.variant, amount);

  return {
    id,
    txDigest,
    eventSeq,
    timestamp,
    kind,
    label: title,
    description: summary,
    category,
    variant,
    relatedObjectId: structureId ?? networkNodeId ?? undefined,
    secondaryObjectId: structureId ? (networkNodeId ?? ownerCapId ?? undefined) : (networkNodeId ?? ownerCapId ?? undefined),
    assemblyId: assemblyId ?? undefined,
    networkNodeId: networkNodeId ?? undefined,
    ownerCapId: ownerCapId ?? undefined,
    actorCharacterId: actorCharacterId ?? undefined,
    checkpoint: checkpoint ?? undefined,
    severity,
    metadata,
    sender: normalizeSignalHistoryWalletAddress(normalizeNullableString(candidate.sender)) ?? undefined,
    ownerAddress: normalizeSignalHistoryWalletAddress(normalizeNullableString(candidate.ownerAddress)) ?? undefined,
    amount: amount ?? undefined,
  };
}

function resolveSignalVariant(
  category: SignalCategory,
  kind: string,
  severity: string | null,
  fallback: SignalVariant,
  amount: number | null,
): SignalVariant {
  if (kind === "toll_paid" && amount != null && amount > 0) {
    return "revenue";
  }

  if (kind === "structure_offline" || kind === "structure_destroyed" || kind === "structure_unanchored") {
    return "blocked";
  }

  if (kind === "extension_frozen" || kind === "node_critical_fuel") {
    return "blocked";
  }

  if (kind === "node_low_fuel") {
    return severity === "info" ? "info" : "blocked";
  }

  if (severity && ["critical", "error", "high", "warning"].includes(severity)) {
    return "blocked";
  }

  if (kind === "storage_deposit" || kind === "storage_withdraw" || kind === "gate_transit") {
    return "info";
  }

  if (kind === "structure_online" || kind === "extension_authorized" || kind === "ownership_transferred") {
    return "info";
  }

  if (category === "status") {
    return fallback === "info" ? "info" : "neutral";
  }

  return fallback;
}

function resolveSignalDescriptor(
  kind: SignalKind,
  metadata: SignalEventMetadata | null,
  amount: number | null,
): SignalHistoryDescriptor | null {
  switch (kind) {
    case "extension_authorized":
      return describeExtensionAuthorizedSignal(metadata);
    case "gate_policy_preset_changed":
      return describeGatePolicyPresetChangedSignal(metadata);
    case "gate_treasury_changed":
      return describeGateTreasuryChangedSignal(metadata);
    case "permit_issued":
      return describePermitIssuedSignal(metadata);
    case "posture_changed":
      return describePostureChangedSignal(metadata);
    case "structure_renamed":
      return describeStructureRenamedSignal(metadata);
    case "toll_paid":
      return describeTollPaidSignal(amount);
    default:
      return null;
  }
}

function describeStructureRenamedSignal(metadata: SignalEventMetadata | null): SignalHistoryDescriptor {
  const structureLabel = formatSignalStructureTypeLabel(getSignalMetadataText(metadata, "structureType"));
  const previousName = getSignalMetadataText(metadata, "oldName");
  const nextName = getSignalMetadataText(metadata, "name");

  if (previousName && nextName) {
    return {
      label: "Structure renamed",
      description: `${structureLabel} renamed from ${previousName} to ${nextName}.`,
      variant: "info",
    };
  }

  if (nextName) {
    return {
      label: "Structure renamed",
      description: `${structureLabel} renamed to ${nextName}.`,
      variant: "info",
    };
  }

  return {
    label: "Structure renamed",
    description: `${structureLabel} name changed in your governed infrastructure.`,
    variant: "info",
  };
}

function describeExtensionAuthorizedSignal(metadata: SignalEventMetadata | null): SignalHistoryDescriptor {
  const structureLabel = formatSignalStructureTypeLabel(getSignalMetadataText(metadata, "structureType"));
  const previousExtension = formatSignalExtensionLabel(getSignalMetadataText(metadata, "previousExtension"));
  const extensionType = formatSignalExtensionLabel(getSignalMetadataText(metadata, "extensionType"));
  const mode = formatSignalModeLabel(getSignalMetadataText(metadata, "authorizationMode", "mode"));
  const label = previousExtension ? "Extension reauthorized" : "Extension authorized";

  if (previousExtension && extensionType && previousExtension !== extensionType) {
    return {
      label,
      description: `${structureLabel} extension reauthorized from ${previousExtension} to ${extensionType}.`,
      variant: "info",
    };
  }

  if (extensionType && mode) {
    return {
      label,
      description: `${structureLabel} extension authorized to ${extensionType} for ${mode} posture.`,
      variant: "info",
    };
  }

  if (extensionType) {
    return {
      label,
      description: `${structureLabel} extension authorized to ${extensionType}.`,
      variant: "info",
    };
  }

  if (mode) {
    return {
      label,
      description: `${structureLabel} extension authorized for ${mode} posture.`,
      variant: "info",
    };
  }

  return {
    label,
    description: `${structureLabel} extension authorization changed.`,
    variant: "info",
  };
}

function describePostureChangedSignal(metadata: SignalEventMetadata | null): SignalHistoryDescriptor {
  const oldMode = formatSignalModeLabel(getSignalMetadataText(metadata, "oldMode"));
  const newMode = formatSignalModeLabel(getSignalMetadataText(metadata, "newMode", "mode"));

  if (oldMode && newMode) {
    return {
      label: "Posture changed",
      description: `Posture changed from ${oldMode} to ${newMode}.`,
      variant: "info",
    };
  }

  if (newMode) {
    return {
      label: "Posture changed",
      description: `Posture set to ${newMode}.`,
      variant: "info",
    };
  }

  return {
    label: "Posture changed",
    description: "Operational posture changed for governed infrastructure.",
    variant: "info",
  };
}

function describeGatePolicyPresetChangedSignal(metadata: SignalEventMetadata | null): SignalHistoryDescriptor {
  const mode = formatSignalModeLabel(getSignalMetadataText(metadata, "mode"));
  const operation = formatSignalPolicyOperation(getSignalMetadataText(metadata, "operation"));
  const entryCount = getSignalMetadataNumber(metadata, "entryCount");
  const entrySuffix = entryCount === 1 ? "entry" : "entries";

  if (operation === "removed" && mode) {
    return {
      label: "Gate policy preset changed",
      description: `${mode} gate policy preset removed.`,
      variant: "info",
    };
  }

  if (mode && entryCount != null && operation === "set") {
    return {
      label: "Gate policy preset changed",
      description: `${mode} gate policy preset set with ${entryCount} ${entrySuffix}.`,
      variant: "info",
    };
  }

  if (mode) {
    return {
      label: "Gate policy preset changed",
      description: `${mode} gate policy preset ${operation}.`,
      variant: "info",
    };
  }

  return {
    label: "Gate policy preset changed",
    description: `Gate policy preset ${operation}.`,
    variant: "info",
  };
}

function describeGateTreasuryChangedSignal(metadata: SignalEventMetadata | null): SignalHistoryDescriptor {
  const treasuryAddress = truncateSignalAddress(getSignalMetadataText(metadata, "treasuryAddress", "treasury"));
  return {
    label: "Gate treasury changed",
    description: treasuryAddress
      ? `Gate treasury set to ${treasuryAddress}.`
      : "Gate treasury updated.",
    variant: "info",
  };
}

function describePermitIssuedSignal(metadata: SignalEventMetadata | null): SignalHistoryDescriptor {
  const tribeId = getSignalMetadataNumber(metadata, "tribeId");
  const mode = formatSignalModeLabel(getSignalMetadataText(metadata, "mode", "authorizationMode"));

  if (tribeId != null && mode) {
    return {
      label: "Permit issued",
      description: `Permit issued for tribe ${tribeId} in ${mode} posture.`,
      variant: "info",
    };
  }

  if (tribeId != null) {
    return {
      label: "Permit issued",
      description: `Permit issued for tribe ${tribeId}.`,
      variant: "info",
    };
  }

  return {
    label: "Permit issued",
    description: "Transit permit issued for governed infrastructure.",
    variant: "info",
  };
}

function describeTollPaidSignal(amount: number | null): SignalHistoryDescriptor {
  return {
    label: "Toll paid",
    description: amount != null && amount > 0
      ? "Transit toll recorded for a governed gate."
      : "Transit toll recorded."
    ,
    variant: amount != null && amount > 0 ? "revenue" : "info",
  };
}

function formatSignalStructureTypeLabel(value: string | null): string {
  const normalized = value?.trim().toLowerCase() ?? null;
  switch (normalized) {
    case "network_node":
    case "networknode":
      return "Node";
    case "storage":
    case "storage_unit":
      return "Storage";
    case "trade_post":
      return "Trade Post";
    case "gate":
      return "Gate";
    case "turret":
      return "Turret";
    case "assembly":
      return "Assembly";
    default:
      return value
        ? value
          .split(/[_\s-]+/)
          .filter(Boolean)
          .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
          .join(" ")
        : "Structure";
  }
}

function formatSignalExtensionLabel(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const simple = trimmed.includes("::") ? trimmed.split("::").pop() ?? trimmed : trimmed;
  return simple.trim() || null;
}

function formatSignalModeLabel(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "commercial") return "Commercial";
  if (normalized === "defense" || normalized === "defensive") return "Defense";

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function formatSignalPolicyOperation(value: string | null): "set" | "removed" | "updated" {
  const normalized = value?.trim().toLowerCase() ?? null;
  if (!normalized) return "updated";
  if (["set", "created", "applied", "enabled"].includes(normalized)) return "set";
  if (["removed", "deleted", "cleared", "revoked", "disabled"].includes(normalized)) return "removed";
  return "updated";
}

function truncateSignalAddress(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

function normalizeSignalMetadata(value: unknown): SignalEventMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const metadata: SignalEventMetadata = {};

  for (const key of SIGNAL_METADATA_TEXT_KEYS) {
    const normalized = normalizeOptionalText(candidate[key]);
    if (normalized != null) {
      metadata[key] = normalized;
    }
  }

  for (const key of SIGNAL_METADATA_NUMBER_KEYS) {
    const normalized = normalizeNumber(candidate[key]);
    if (normalized != null) {
      metadata[key] = normalized;
    }
  }

  for (const [key, rawValue] of Object.entries(candidate)) {
    if (metadata[key] !== undefined) {
      continue;
    }

    const normalized = normalizeSignalMetadataValue(rawValue);
    if (normalized !== undefined) {
      metadata[key] = normalized;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

function normalizeSignalMetadataValue(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

function getSignalMetadataText(
  metadata: SignalEventMetadata | null,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function getSignalMetadataNumber(
  metadata: SignalEventMetadata | null,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = metadata?.[key];
    const normalized = normalizeNumber(value);
    if (normalized != null) {
      return normalized;
    }
  }

  return null;
}

function normalizeSignalCategory(value: unknown): SignalCategory | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  if (!SIGNAL_HISTORY_CATEGORIES.has(normalized as SignalHistoryCategory)) return null;
  return normalized as SignalCategory;
}

function normalizeSignalHistorySince(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function fallbackTitleFromKind(kind: string, category: SignalCategory): string {
  const words = kind.split("_").filter(Boolean).map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`);
  if (words.length > 0) {
    return words.join(" ");
  }

  if (category === "governance") return "Governance Update";
  if (category === "trade") return "Trade Update";
  if (category === "transit") return "Transit Update";
  return "Status Update";
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNullableString(value: unknown): string | null {
  return normalizeOptionalText(value);
}

function normalizeNullableTimestamp(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeOptionalText(entry))
    .filter((entry): entry is string => entry !== null);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNumberishValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  return /^\d+$/.test(normalized) ? normalized : null;
}

function normalizeBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}