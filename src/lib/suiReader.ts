/**
 * Sui JSON-RPC read utilities for asset discovery.
 *
 * Implements the proven ownership chain:
 *   wallet → PlayerProfile → Character → OwnerCaps → shared assemblies
 *
 * Uses the @mysten/sui SDK for all RPC calls.
 */

import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";
import type {
  ObjectId,
  OwnerCapInfo,
  PlayerProfile,
  Structure,
  StructureType,
  StructureStatus,
  FuelState,
  GatePolicy,
  Listing,
  InventorySlot,
  InventoryEntry,
  PostureMode,
} from "@/types/domain";
import {
  callSuiRead,
  classifySuiRpcError,
  formatSuiRpcFailureCounts,
  getConfiguredSuiRpcUrl,
  getSuiClient,
  isSuiDiagnosticsEnabled,
  type SuiRpcFailureKind,
} from "@/lib/suiRpcClient";
import {
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
  CC_PACKAGE_ID,
  CC_ORIGINAL_PACKAGE_ID,
  GATE_CONFIG_ID,
} from "@/constants";

export { getSuiClient };

const STRUCTURE_BATCH_SIZE = 50;

interface FetchPlayerProfileOptions {
  includeCharacterMetadata?: boolean;
}

export type DiscoveryIssueKind =
  | "unsupported"
  | "stale-or-deleted"
  | "unreadable"
  | "missing-fields"
  | "rpc-failure"
  | "other";

export interface DiscoveryIssue {
  kind: DiscoveryIssueKind;
  ownerCapId: ObjectId | null;
  authorizedObjectId: ObjectId | null;
  structureType: StructureType | null;
  ownerCapType: string | null;
  detail: string | null;
}

export interface DiscoveryDiagnostics {
  runId: string;
  rpcUrl: string;
  wallet: string;
  characterId: string | null;
  ownerCapCount: number;
  objectReadsRequested: number;
  objectReadsResolved: number;
  objectReadsFailed: number;
  failures: Partial<Record<SuiRpcFailureKind, number>>;
  issueCounts: Partial<Record<DiscoveryIssueKind, number>>;
  issues: DiscoveryIssue[];
}

export interface AssetDiscoveryResult {
  profile: PlayerProfile | null;
  ownerCaps: OwnerCapInfo[];
  structures: Structure[];
  diagnostics: DiscoveryDiagnostics;
  warning: string | null;
}

interface DiscoveryInFlightEntry {
  runId: string;
  promise: Promise<AssetDiscoveryResult>;
}

const discoveryInFlight = new Map<string, DiscoveryInFlightEntry>();
let discoverySequence = 0;

function nextDiscoveryRunId(): string {
  discoverySequence += 1;
  return `disc-${Date.now().toString(36)}-${discoverySequence.toString(36)}`;
}

function shortenForLog(value: string | null | undefined): string {
  if (!value) return "none";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function incrementFailure(
  failures: Partial<Record<SuiRpcFailureKind, number>>,
  kind: SuiRpcFailureKind,
  amount = 1,
) {
  failures[kind] = (failures[kind] ?? 0) + amount;
}

function incrementIssueCount(
  counts: Partial<Record<DiscoveryIssueKind, number>>,
  kind: DiscoveryIssueKind,
  amount = 1,
) {
  counts[kind] = (counts[kind] ?? 0) + amount;
}

function isUserVisibleIssueKind(kind: DiscoveryIssueKind): boolean {
  return kind !== "unsupported";
}

function serializeDiscoveryDetail(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value instanceof Error) {
    const trimmed = value.message.trim();
    return trimmed.length > 0 ? trimmed : value.name;
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized && serialized !== "{}" ? serialized : String(value);
  } catch {
    return String(value);
  }
}

function classifyMissingObjectIssue(response: SuiObjectResponse): Pick<DiscoveryIssue, "kind" | "detail"> {
  const detail = serializeDiscoveryDetail(response.error) ?? "Missing object data";
  const normalized = detail.toLowerCase();

  if (
    normalized.includes("notexist")
    || normalized.includes("not found")
    || normalized.includes("deleted")
    || normalized.includes("wrapped")
    || normalized.includes("object does not exist")
  ) {
    return {
      kind: "stale-or-deleted",
      detail,
    };
  }

  return {
    kind: "unreadable",
    detail,
  };
}

function recordDiscoveryIssue(
  diagnostics: DiscoveryDiagnostics,
  issue: DiscoveryIssue,
) {
  incrementIssueCount(diagnostics.issueCounts, issue.kind);
  diagnostics.issues.push(issue);

  if (isUserVisibleIssueKind(issue.kind)) {
    diagnostics.objectReadsFailed += 1;
  }
}

function formatDiscoveryIssueCounts(
  counts: Partial<Record<DiscoveryIssueKind, number>>,
): string {
  return (Object.entries(counts) as Array<[DiscoveryIssueKind, number | undefined]>)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([kind, count]) => `${kind}:${count}`)
    .join(", ");
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function getUserVisibleIssueCount(diagnostics: DiscoveryDiagnostics): number {
  return Object.entries(diagnostics.issueCounts)
    .filter(([kind, count]) => isUserVisibleIssueKind(kind as DiscoveryIssueKind) && (count ?? 0) > 0)
    .reduce((total, [, count]) => total + (count ?? 0), 0);
}

function buildDiscoveryDiagnostics(walletAddress: string): DiscoveryDiagnostics {
  return {
    runId: nextDiscoveryRunId(),
    rpcUrl: getConfiguredSuiRpcUrl(),
    wallet: shortenForLog(walletAddress),
    characterId: null,
    ownerCapCount: 0,
    objectReadsRequested: 0,
    objectReadsResolved: 0,
    objectReadsFailed: 0,
    failures: {},
    issueCounts: {},
    issues: [],
  };
}

function buildPartialDiscoveryWarning(
  resolvedCount: number,
  diagnostics: DiscoveryDiagnostics,
): string | null {
  const skippedCount = getUserVisibleIssueCount(diagnostics);
  if (skippedCount === 0) {
    return null;
  }

  const staleOrDeletedCount = diagnostics.issueCounts["stale-or-deleted"] ?? 0;
  const rpcFailureCount = diagnostics.issueCounts["rpc-failure"] ?? 0;
  const structureLabel = pluralize(resolvedCount, "controllable structure", "controllable structures");
  const objectLabel = pluralize(skippedCount, "owned object", "owned objects");

  if (staleOrDeletedCount === skippedCount) {
    return `Showing ${resolvedCount} ${structureLabel}. ${skippedCount} ${objectLabel} ${pluralize(skippedCount, "is", "are")} missing on-chain and ${pluralize(skippedCount, "was", "were")} skipped.`;
  }

  if (rpcFailureCount === skippedCount) {
    return `Showing ${resolvedCount} ${structureLabel}. ${skippedCount} expected ${pluralize(skippedCount, "structure", "structures")} could not be read from Sui RPC.`;
  }

  return `Showing ${resolvedCount} ${structureLabel}. ${skippedCount} ${objectLabel} could not be read and ${pluralize(skippedCount, "was", "were")} skipped.`;
}

function logDiscoveryStart(diagnostics: DiscoveryDiagnostics) {
  if (!isSuiDiagnosticsEnabled()) {
    return;
  }

  console.info(`[discovery:${diagnostics.runId}] start`, {
    rpcUrl: diagnostics.rpcUrl,
    wallet: diagnostics.wallet,
  });
}

function logDiscoveryJoin(runId: string, walletAddress: string) {
  if (!isSuiDiagnosticsEnabled()) {
    return;
  }

  console.info(`[discovery:${runId}] join`, {
    wallet: shortenForLog(walletAddress),
  });
}

function logDiscoverySummary(
  diagnostics: DiscoveryDiagnostics,
  warning: string | null,
) {
  if (!isSuiDiagnosticsEnabled()) {
    return;
  }

  const summary = {
    rpcUrl: diagnostics.rpcUrl,
    wallet: diagnostics.wallet,
    characterId: shortenForLog(diagnostics.characterId),
    ownerCaps: diagnostics.ownerCapCount,
    objectReadsRequested: diagnostics.objectReadsRequested,
    objectReadsResolved: diagnostics.objectReadsResolved,
    objectReadsFailed: diagnostics.objectReadsFailed,
    failures: formatSuiRpcFailureCounts(diagnostics.failures) || "none",
    issues: formatDiscoveryIssueCounts(diagnostics.issueCounts) || "none",
    warning: warning ?? "none",
  };

  if (diagnostics.objectReadsFailed > 0) {
    console.warn(`[discovery:${diagnostics.runId}] summary`, summary);
    return;
  }

  console.info(`[discovery:${diagnostics.runId}] summary`, summary);
}

function logDiscoveryIssues(diagnostics: DiscoveryDiagnostics) {
  if (!isSuiDiagnosticsEnabled() || diagnostics.issues.length === 0) {
    return;
  }

  const entries = diagnostics.issues.slice(0, 20).map((issue) => ({
    reason: issue.kind,
    ownerCapId: issue.ownerCapId,
    authorizedObjectId: issue.authorizedObjectId,
    structureType: issue.structureType,
    ownerCapType: issue.ownerCapType,
    detail: issue.detail,
  }));

  const payload = {
    totalIssues: diagnostics.issues.length,
    shownIssues: entries.length,
    issueCounts: formatDiscoveryIssueCounts(diagnostics.issueCounts) || "none",
    issues: entries,
    ...(diagnostics.issues.length > entries.length
      ? { truncatedIssues: diagnostics.issues.length - entries.length }
      : {}),
  };

  if (getUserVisibleIssueCount(diagnostics) > 0) {
    console.warn(`[discovery:${diagnostics.runId}] issues`, payload);
    return;
  }

  console.info(`[discovery:${diagnostics.runId}] issues`, payload);
}

function logDiscoveryFailure(diagnostics: DiscoveryDiagnostics, error: unknown) {
  if (!isSuiDiagnosticsEnabled()) {
    return;
  }

  const failure = classifySuiRpcError(error);
  console.warn(`[discovery:${diagnostics.runId}] failed`, {
    rpcUrl: diagnostics.rpcUrl,
    wallet: diagnostics.wallet,
    characterId: shortenForLog(diagnostics.characterId),
    kind: failure.kind,
    statusCode: failure.statusCode,
    message: failure.message,
  });
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildStructureFromResponse(
  response: SuiObjectResponse,
  ownerCapId: ObjectId,
  structureType: StructureType,
): Structure | null {
  if (!response.data) return null;

  const objectId = getObjectId(response);
  if (!objectId) return null;

  const content = getObjectContent(response);
  const assemblyId = resolveAssemblyId(content);
  const status = resolveStatus(content);
  const name = resolveName(content, structureType, objectId);
  const networkNodeId = resolveNetworkNodeId(content);
  const linkedGateId = structureType === "gate" ? resolveLinkedGateId(content) : undefined;

  return {
    assemblyId,
    objectId,
    ownerCapId,
    readModelSource: "direct-chain",
    type: structureType,
    name,
    status,
    networkNodeId,
    fuel: resolveFuel(content),
    linkedGateId,
    extensionStatus: resolveExtensionAuth(content),
  };
}

async function fetchStructureBatch(
  ownerCaps: OwnerCapInfo[],
  diagnostics: DiscoveryDiagnostics,
): Promise<Structure[]> {
  if (ownerCaps.length === 0) {
    return [];
  }

  const structures: Structure[] = [];
  const batches = chunkArray(ownerCaps, STRUCTURE_BATCH_SIZE);

  for (const [batchIndex, batch] of batches.entries()) {
    const ids = batch.map((cap) => cap.authorizedObjectId);

    try {
      const responses = await callSuiRead(
        `discoverAssets.multiGetObjects[${batchIndex + 1}/${batches.length}]`,
        (client) => client.multiGetObjects({
          ids,
          options: { showContent: true, showType: true },
        }),
      );

      responses.forEach((response, responseIndex) => {
        const cap = batch[responseIndex];
        if (!cap) {
          return;
        }

        const structure = buildStructureFromResponse(response, cap.ownerCapId, cap.structureType);
        if (structure) {
          diagnostics.objectReadsResolved += 1;
          structures.push(structure);
          return;
        }

        const classifiedIssue = !response.data
          ? classifyMissingObjectIssue(response)
          : {
              kind: "missing-fields" as const,
              detail: "Object response missing objectId",
            };

        recordDiscoveryIssue(diagnostics, {
          kind: classifiedIssue.kind,
          ownerCapId: cap.ownerCapId,
          authorizedObjectId: cap.authorizedObjectId,
          structureType: cap.structureType,
          ownerCapType: null,
          detail: classifiedIssue.detail,
        });
      });
    } catch (error) {
      const failure = classifySuiRpcError(error);
      incrementFailure(diagnostics.failures, failure.kind, ids.length);

      for (const cap of batch) {
        recordDiscoveryIssue(diagnostics, {
          kind: "rpc-failure",
          ownerCapId: cap.ownerCapId,
          authorizedObjectId: cap.authorizedObjectId,
          structureType: cap.structureType,
          ownerCapType: null,
          detail: failure.message,
        });
      }
    }
  }

  return structures;
}

/**
 * Fetch a PlayerProfile owned by the given wallet address.
 * PlayerProfiles are direct-owned objects of type `{WORLD_PACKAGE}::character::PlayerProfile`.
 * The profile only contains character_id; name and tribe_id are on the shared Character object.
 */
export async function fetchPlayerProfile(
  walletAddress: string,
  options: FetchPlayerProfileOptions = {},
): Promise<PlayerProfile | null> {
  const profileType = `${WORLD_ORIGINAL_PACKAGE_ID}::character::PlayerProfile`;
  const includeCharacterMetadata = options.includeCharacterMetadata ?? true;

  const { data } = await callSuiRead(
    "fetchPlayerProfile.getOwnedObjects",
    (client) => client.getOwnedObjects({
      owner: walletAddress,
      filter: { StructType: profileType },
      options: { showContent: true },
    }),
  );

  if (!data || data.length === 0) return null;

  const obj = data[0];
  const content = getObjectContent(obj);
  if (!content) return null;

  const characterId = String(content.character_id ?? content.characterId ?? "");
  if (!characterId) return null;

  let characterName = "";
  let tribeId = 0;

  if (includeCharacterMetadata) {
    try {
      const metadata = await fetchCharacterMetadata(characterId);
      characterName = metadata.characterName;
      tribeId = metadata.tribeId;
    } catch {
      // Character metadata is optional — proceed with address/character fallback.
    }
  }

  return {
    objectId: getObjectId(obj),
    characterId,
    characterName,
    tribeId,
  };
}

export async function fetchCharacterMetadata(
  characterId: ObjectId,
): Promise<Pick<PlayerProfile, "characterName" | "tribeId">> {
  const charResp = await callSuiRead(
    "fetchCharacterMetadata.getObject",
    (client) => client.getObject({
      id: characterId,
      options: { showContent: true },
    }),
  );

  const charContent = getObjectContent(charResp);
  const meta = charContent?.metadata as Record<string, unknown> | undefined;
  const metaFields = (meta?.fields ?? meta) as Record<string, unknown> | undefined;

  return {
    characterName: String(metaFields?.name ?? ""),
    tribeId: Number(charContent?.tribe_id ?? 0),
  };
}

/**
 * Fetch OwnerCaps from a Character's object address.
 * OwnerCaps are child objects transferred to the Character (not the wallet).
 * Paginates through all pages since a character can own >50 caps.
 */
export async function fetchOwnerCaps(
  characterId: ObjectId,
  diagnostics?: DiscoveryDiagnostics,
): Promise<OwnerCapInfo[]> {
  const caps: OwnerCapInfo[] = [];
  let cursor: string | null | undefined = undefined;
  let hasNext = true;

  while (hasNext) {
    const response = await callSuiRead(
      "fetchOwnerCaps.getOwnedObjects",
      (client) => client.getOwnedObjects({
        owner: characterId,
        options: { showContent: true, showType: true },
        ...(cursor ? { cursor } : {}),
      }),
    );

    const data = response.data ?? [];
    for (const obj of data) {
      const typeName = getObjectType(obj);
      if (!typeName || !typeName.includes("OwnerCap")) continue;

      const ownerCapId = getObjectId(obj);
      const content = getObjectContent(obj);
      const authorizedObjectId =
        content?.authorized_object_id ?? content?.authorizedObjectId ?? "";

      const structureType = inferStructureType(typeName);
      if (!structureType) {
        if (diagnostics) {
          recordDiscoveryIssue(diagnostics, {
            kind: "unsupported",
            ownerCapId,
            authorizedObjectId: String(authorizedObjectId || "") || null,
            structureType: null,
            ownerCapType: typeName,
            detail: typeName,
          });
        }
        continue;
      }

      if (diagnostics) {
        diagnostics.ownerCapCount += 1;
        diagnostics.objectReadsRequested += 1;
      }

      if (!authorizedObjectId) {
        if (diagnostics) {
          recordDiscoveryIssue(diagnostics, {
            kind: "missing-fields",
            ownerCapId,
            authorizedObjectId: null,
            structureType,
            ownerCapType: typeName,
            detail: "OwnerCap is missing authorized_object_id",
          });
        }
        continue;
      }

      caps.push({
        ownerCapId,
        authorizedObjectId: String(authorizedObjectId),
        structureType,
      });
    }

    hasNext = response.hasNextPage ?? false;
    cursor = response.nextCursor;
  }

  return caps;
}

/**
 * Fetch a shared assembly object and resolve basic state.
 *
 * On-chain field structure (confirmed via RPC):
 *   - status.fields.status.variant → "ONLINE" | "OFFLINE" | "NULL"
 *   - metadata.fields.name → string (may be empty)
 *   - energy_source_id → ObjectId string (network node) | null
 *   - extension → { fields: { name: string } } | null
 *   - fuel.fields → { quantity, max_capacity, is_burning, ... }
 */
export async function fetchStructure(
  objectId: ObjectId,
  ownerCapId: ObjectId,
  structureType: StructureType,
): Promise<Structure | null> {
  const response = await callSuiRead(
    `fetchStructure.getObject:${structureType}`,
    (client) => client.getObject({
      id: objectId,
      options: { showContent: true, showType: true },
    }),
  );

  return buildStructureFromResponse(response, ownerCapId, structureType);
}

/**
 * Full discovery: wallet → PlayerProfile → Character → OwnerCaps → structures.
 */
export async function discoverAssets(walletAddress: string): Promise<{
  profile: PlayerProfile | null;
  ownerCaps: OwnerCapInfo[];
  structures: Structure[];
  diagnostics: DiscoveryDiagnostics;
  warning: string | null;
}> {
  const normalizedWallet = walletAddress.trim().toLowerCase();
  const existingRun = discoveryInFlight.get(normalizedWallet);
  if (existingRun) {
    logDiscoveryJoin(existingRun.runId, walletAddress);
    return existingRun.promise;
  }

  const diagnostics = buildDiscoveryDiagnostics(walletAddress);
  logDiscoveryStart(diagnostics);

  const promise = (async (): Promise<AssetDiscoveryResult> => {
    try {
      const profile = await fetchPlayerProfile(walletAddress, {
        includeCharacterMetadata: false,
      });

      diagnostics.characterId = profile?.characterId ?? null;

      if (!profile) {
        logDiscoverySummary(diagnostics, null);
        logDiscoveryIssues(diagnostics);
        return {
          profile: null,
          ownerCaps: [],
          structures: [],
          diagnostics,
          warning: null,
        };
      }

      const ownerCaps = await fetchOwnerCaps(profile.characterId, diagnostics);

      const structures = await fetchStructureBatch(ownerCaps, diagnostics);
      const warning = buildPartialDiscoveryWarning(structures.length, diagnostics);
      logDiscoverySummary(diagnostics, warning);
      logDiscoveryIssues(diagnostics);

      return {
        profile,
        ownerCaps,
        structures,
        diagnostics,
        warning,
      };
    } catch (error) {
      logDiscoveryFailure(diagnostics, error);
      throw error;
    }
  })().finally(() => {
    discoveryInFlight.delete(normalizedWallet);
  });

  discoveryInFlight.set(normalizedWallet, {
    runId: diagnostics.runId,
    promise,
  });

  return promise;
}

/**
 * Fetch gate policy presets from GateConfig dynamic fields.
 *
 * Reads PolicyPresetKey{gate_id, mode} DFs for both posture modes (0=Commercial,
 * 1=Defense) and the per-gate TreasuryKey{gate_id} on the shared GateConfig object.
 */
export async function fetchGateRules(gateId: ObjectId): Promise<GatePolicy> {
  const client = getSuiClient();
  const presetKeyType = `${CC_ORIGINAL_PACKAGE_ID}::gate_control::PolicyPresetKey`;
  const treasuryKeyType = `${CC_ORIGINAL_PACKAGE_ID}::gate_control::TreasuryKey`;

  const [commercialResp, defenseResp, treasuryResp] = await Promise.allSettled([
    client.getDynamicFieldObject({
      parentId: GATE_CONFIG_ID,
      name: { type: presetKeyType, value: { gate_id: gateId, mode: 0 } },
    }),
    client.getDynamicFieldObject({
      parentId: GATE_CONFIG_ID,
      name: { type: presetKeyType, value: { gate_id: gateId, mode: 1 } },
    }),
    client.getDynamicFieldObject({
      parentId: GATE_CONFIG_ID,
      name: {
        type: treasuryKeyType,
        value: { gate_id: gateId },
      },
    }),
  ]);

  const commercialPreset = parsePresetResponse(commercialResp);
  const defensePreset = parsePresetResponse(defenseResp);

  let treasury: string | null = null;
  if (treasuryResp.status === "fulfilled" && treasuryResp.value?.data) {
    const content = getObjectContent(treasuryResp.value);
    if (content) {
      const val = content.value as string | Record<string, unknown> | undefined;
      treasury = typeof val === "string" ? val : String(val ?? "");
    }
  }

  return { gateId, commercialPreset, defensePreset, treasury };
}

/** Parse a PolicyPreset DF response into the domain type. */
function parsePresetResponse(
  resp: PromiseSettledResult<SuiObjectResponse>,
): GatePolicy["commercialPreset"] {
  if (resp.status !== "fulfilled" || !resp.value?.data) return null;
  const content = getObjectContent(resp.value);
  if (!content) return null;

  const val = content.value as Record<string, unknown> | undefined;
  const fields = (val?.fields ?? val) as Record<string, unknown> | undefined;
  if (!fields) return null;

  const rawEntries = (fields.entries ?? []) as Array<{
    fields?: Record<string, unknown>;
    tribe?: unknown;
    access?: unknown;
    toll?: unknown;
  }>;

  const entries = rawEntries.map((e) => {
    const ef = e.fields ?? e;
    return {
      tribe: Number(ef.tribe ?? 0),
      access: Boolean(ef.access ?? false),
      toll: Number(ef.toll ?? 0),
    };
  });

  return {
    entries,
    defaultAccess: Boolean(fields.default_access ?? false),
    defaultToll: Number(fields.default_toll ?? 0),
  };
}

/**
 * Batch-fetch gate policies for multiple gates in parallel.
 * Used by posture switch to determine which gates have/lack coin tolls.
 */
export async function fetchBatchGatePolicies(
  gateIds: ObjectId[],
): Promise<GatePolicy[]> {
  return Promise.all(gateIds.map(fetchGateRules));
}

/**
 * Discover live marketplace listings via ListingCreatedEvent queries.
 *
 * Strategy: query events → extract listing IDs → multiGetObjects to find
 * which listings are still alive (not bought/cancelled). Optionally filter
 * by a specific storage unit.
 */
export async function fetchListings(
  storageUnitId?: ObjectId,
): Promise<Listing[]> {
  const client = getSuiClient();
  const eventType = `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingCreatedEvent`;

  // Paginate through all ListingCreatedEvents
  const listingCandidates: { id: string; storageUnitId: string }[] = [];
  let cursor: string | null | undefined = undefined;
  let hasNext = true;

  while (hasNext) {
    const page = await client.queryEvents({
      query: { MoveEventType: eventType },
      order: "descending",
      ...(cursor ? { cursor: { txDigest: cursor, eventSeq: "0" } } : {}),
    });

    for (const evt of page.data) {
      const json = evt.parsedJson as Record<string, unknown> | undefined;
      if (!json?.listing_id) continue;
      const listingId = String(json.listing_id);
      const ssuId = String(json.storage_unit_id ?? "");
      if (!storageUnitId || ssuId === storageUnitId) {
        listingCandidates.push({ id: listingId, storageUnitId: ssuId });
      }
    }

    hasNext = page.hasNextPage;
    cursor = page.nextCursor?.txDigest ?? null;
  }

  if (listingCandidates.length === 0) return [];

  // Deduplicate IDs (same listing may appear multiple times if events overlap)
  const uniqueIds = [...new Set(listingCandidates.map((c) => c.id))];

  // Fetch objects to check which are still alive
  const objects = await client.multiGetObjects({
    ids: uniqueIds,
    options: { showContent: true },
  });

  const listings: Listing[] = [];
  for (const obj of objects) {
    if (!obj.data?.objectId) continue; // deleted/consumed
    const content = getObjectContent(obj);
    if (!content) continue;

    listings.push({
      objectId: obj.data.objectId,
      storageUnitId: String(content.storage_unit_id ?? ""),
      seller: String(content.seller ?? ""),
      itemTypeId: Number(content.item_type_id ?? 0),
      quantity: Number(content.quantity ?? 0),
      price: Number(content.price ?? 0),
    });
  }

  return listings;
}

/**
 * Fetch SSU inventory from on-chain dynamic fields.
 *
 * Reads the StorageUnit object to get inventory_keys, then fetches each
 * inventory DF by key. Each DF value is an Inventory with items: VecMap<u64, ItemEntry>.
 *
 * Returns all inventory slots with their entries for the inventory browser.
 */
export async function fetchSsuInventory(
  storageUnitId: ObjectId,
): Promise<InventorySlot[]> {
  const client = getSuiClient();

  // Step 1: Read the StorageUnit object to get inventory_keys and owner_cap_id
  const ssuResp = await client.getObject({
    id: storageUnitId,
    options: { showContent: true },
  });

  const ssuContent = getObjectContent(ssuResp);
  if (!ssuContent) return [];

  const inventoryKeys: string[] = [];
  const rawKeys = ssuContent.inventory_keys as unknown;
  if (Array.isArray(rawKeys)) {
    for (const k of rawKeys) {
      const keyStr = typeof k === "string" ? k : String(k);
      if (keyStr) inventoryKeys.push(keyStr);
    }
  }

  if (inventoryKeys.length === 0) return [];

  // Step 2: Fetch each inventory DF using getDynamicFieldObject
  const slots: InventorySlot[] = [];
  const dfResults = await Promise.allSettled(
    inventoryKeys.map((key) =>
      client.getDynamicFieldObject({
        parentId: storageUnitId,
        name: { type: "0x2::object::ID", value: key },
      }),
    ),
  );

  for (let i = 0; i < dfResults.length; i++) {
    const result = dfResults[i];
    if (result.status !== "fulfilled" || !result.value?.data) continue;

    const dfContent = getObjectContent(result.value);
    if (!dfContent) continue;

    // The DF value holds the Inventory struct
    const value = dfContent.value as Record<string, unknown> | undefined;
    const fields = (value?.fields ?? value ?? dfContent) as Record<string, unknown>;

    const maxCapacity = Number(fields.max_capacity ?? fields.maxCapacity ?? 0);
    const usedCapacity = Number(fields.used_capacity ?? fields.usedCapacity ?? 0);

    // items is a VecMap<u64, ItemEntry> — RPC returns it as { fields: { contents: [...] } }
    const items = parseInventoryItems(fields.items);

    slots.push({
      key: inventoryKeys[i],
      maxCapacity,
      usedCapacity,
      items,
    });
  }

  return slots;
}

/**
 * Parse VecMap<u64, ItemEntry> from RPC object content.
 * On-chain VecMap is returned by RPC as:
 *   { type: "..::VecMap<..>", fields: { contents: [ { fields: { key, value: { fields: {...} } } } ] } }
 * or as a flat array in some serializations.
 */
function parseInventoryItems(raw: unknown): InventoryEntry[] {
  if (!raw) return [];

  // Unwrap RPC envelope
  let contents: unknown[] = [];
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const fieldsObj = obj.fields as Record<string, unknown> | undefined;
    const rawContents = fieldsObj?.contents ?? obj.contents;
    if (Array.isArray(rawContents)) {
      contents = rawContents;
    }
  }

  const entries: InventoryEntry[] = [];
  for (const entry of contents) {
    if (!entry || typeof entry !== "object") continue;
    const entryObj = entry as Record<string, unknown>;
    const entryFields = (entryObj.fields ?? entryObj) as Record<string, unknown>;

    // value holds the ItemEntry struct
    const valueRaw = entryFields.value as Record<string, unknown> | undefined;
    const valueFields = (valueRaw?.fields ?? valueRaw) as Record<string, unknown> | undefined;
    if (!valueFields) continue;

    entries.push({
      typeId: Number(valueFields.type_id ?? valueFields.typeId ?? entryFields.key ?? 0),
      itemId: Number(valueFields.item_id ?? valueFields.itemId ?? 0),
      volume: Number(valueFields.volume ?? 0),
      quantity: Number(valueFields.quantity ?? 0),
    });
  }

  return entries;
}

// ─── Gate Linked ID ───────────────────────────────────────

/**
 * Fetch the linked destination gate ID for a given gate.
 * Returns null if the gate has no linked partner.
 */
export async function fetchLinkedGateId(gateId: ObjectId): Promise<ObjectId | null> {
  const client = getSuiClient();
  const response = await client.getObject({
    id: gateId,
    options: { showContent: true },
  });
  const content = getObjectContent(response);
  if (!content) return null;
  const linkedRaw = content.linked_gate_id;
  // Option<ID> serializes as plain string when Some, null when None
  if (typeof linkedRaw === "string" && linkedRaw !== "") return linkedRaw;
  // Legacy envelope shape { fields: { id: "0x..." } } (older Sui versions)
  if (linkedRaw && typeof linkedRaw === "object") {
    const fields = (linkedRaw as Record<string, unknown>).fields as Record<string, unknown> | undefined;
    return (fields?.id as string) ?? null;
  }
  return null;
}

// ─── Event Queries ────────────────────────────────────────

/**
 * Fetch the current network posture from GateConfig dynamic field.
 * Returns "commercial" (default) or "defense".
 */
export async function fetchPosture(gateId: string): Promise<PostureMode> {
  const client = getSuiClient();
  try {
    const response = await client.getDynamicFieldObject({
      parentId: GATE_CONFIG_ID,
      name: {
        type: `${CC_ORIGINAL_PACKAGE_ID}::posture::PostureKey`,
        value: { gate_id: gateId },
      },
    });
    const content = getObjectContent(response);
    if (!content) return "commercial";
    const value = content.value as Record<string, unknown> | undefined;
    const fields = (value as Record<string, unknown>)?.fields as Record<string, unknown> | undefined;
    const mode = fields?.mode ?? (content.mode as number | undefined);
    return mode === 1 ? "defense" : "commercial";
  } catch {
    // DF not yet created = default commercial posture
    return "commercial";
  }
}

/**
 * Fetch recent CivilizationControl events from all modules.
 *
 * Queries gate_control, trade_post, posture, turret_bouncer, and
 * turret_defense modules in parallel using MoveModule filter, then
 * merges and sorts by timestamp descending.
 * Returns raw event objects for the eventParser to transform.
 */
export async function fetchRecentEvents(
  limit = 25,
): Promise<{ id: { txDigest: string; eventSeq: string }; type: string; parsedJson?: Record<string, unknown>; timestampMs?: string; sender?: string }[]> {
  const queryModuleEvents = (label: string, packageId: string, module: string) => callSuiRead(
    `fetchRecentEvents.${label}`,
    (client) => client.queryEvents({
      query: { MoveModule: { package: packageId, module } },
      order: "descending",
      limit,
    }),
  );

  const [gateEvents, tradeEvents, postureEvents, bouncerEvents, defenseEvents, turretExtEvents, turretEvents, worldGateEvents, worldSsuEvents] = await Promise.all([
    queryModuleEvents("gate_control", CC_PACKAGE_ID, "gate_control"),
    queryModuleEvents("trade_post", CC_PACKAGE_ID, "trade_post"),
    queryModuleEvents("posture", CC_PACKAGE_ID, "posture"),
    queryModuleEvents("turret_bouncer", CC_PACKAGE_ID, "turret_bouncer"),
    queryModuleEvents("turret_defense", CC_PACKAGE_ID, "turret_defense"),
    queryModuleEvents("world_turret", WORLD_RUNTIME_PACKAGE_ID, "turret"),
    queryModuleEvents("turret", CC_PACKAGE_ID, "turret"),
    // World-level gate events: StatusChangedEvent for gate power on/off
    queryModuleEvents("world_gate", WORLD_RUNTIME_PACKAGE_ID, "gate"),
    // World-level SSU events: StatusChangedEvent for trade post power on/off
    queryModuleEvents("world_storage_unit", WORLD_RUNTIME_PACKAGE_ID, "storage_unit"),
  ]);

  // Tag StatusChangedEvent events with assembly type based on source module.
  // Events have the same type string regardless of assembly; the MoveModule query
  // determines which assembly's entry-point emitted the event.
  const STATUS_TYPE_SUFFIX = "::status::StatusChangedEvent";
  const tagAssemblyType = (events: typeof gateEvents.data, assemblyType: string) => {
    for (const e of events) {
      if (e.type?.endsWith(STATUS_TYPE_SUFFIX) && e.parsedJson) {
        (e.parsedJson as Record<string, unknown>)._assemblyType = assemblyType;
      }
    }
  };
  tagAssemblyType(worldGateEvents.data, "gate");
  tagAssemblyType(turretExtEvents.data, "turret");
  tagAssemblyType(worldSsuEvents.data, "storage_unit");

  const allEvents = [
    ...gateEvents.data,
    ...tradeEvents.data,
    ...postureEvents.data,
    ...bouncerEvents.data,
    ...defenseEvents.data,
    ...turretExtEvents.data,
    ...turretEvents.data,
    ...worldGateEvents.data,
    ...worldSsuEvents.data,
  ] as {
    id: { txDigest: string; eventSeq: string };
    type: string;
    parsedJson?: Record<string, unknown>;
    timestampMs?: string;
    sender?: string;
  }[];

  allEvents.sort((a, b) => {
    const aTime = Number(a.timestampMs ?? 0);
    const bTime = Number(b.timestampMs ?? 0);
    return bTime - aTime;
  });

  return allEvents;
}

// ─── Helpers ──────────────────────────────────────────────

function getObjectContent(
  obj: SuiObjectResponse | { data?: { content?: { fields?: Record<string, unknown> } } },
): Record<string, unknown> | null {
  const data = "data" in obj ? obj.data : obj;
  const content = (data as Record<string, unknown>)?.content as
    | { fields?: Record<string, unknown> }
    | undefined;
  return (content?.fields as Record<string, unknown>) ?? null;
}

function getObjectId(obj: SuiObjectResponse): string {
  return obj.data?.objectId ?? "";
}

function getObjectType(obj: SuiObjectResponse): string {
  return (obj.data?.type as string) ?? "";
}

function inferStructureType(typeName: string): StructureType | null {
  if (typeName.includes("gate::Gate")) return "gate";
  if (typeName.includes("storage_unit::StorageUnit")) return "storage_unit";
  if (typeName.includes("turret::Turret")) return "turret";
  if (typeName.includes("network_node::NetworkNode")) return "network_node";
  return null;
}

/**
 * Resolve status from on-chain AssemblyStatus structure.
 *
 * On-chain shape:
 *   { status: { fields: { status: { variant: "ONLINE" | "OFFLINE" | "NULL" } } } }
 */
function resolveStatus(
  content: Record<string, unknown> | null,
): StructureStatus {
  if (!content) return "neutral";

  // Navigate the nested AssemblyStatus → Status → variant path
  const statusObj = content.status as Record<string, unknown> | undefined;
  const statusFields = statusObj?.fields as Record<string, unknown> | undefined;
  const innerStatus = statusFields?.status as Record<string, unknown> | undefined;
  const variant = innerStatus?.variant as string | undefined;

  if (variant === "ONLINE") return "online";
  if (variant === "OFFLINE") return "offline";

  // Fallback: flat field (shouldn't occur with real data, but defensive)
  const flat = content.is_online ?? content.isOnline;
  if (flat === true) return "online";
  if (flat === false) return "offline";

  return "neutral";
}

/**
 * Resolve name from on-chain Metadata structure.
 *
 * On-chain shape:
 *   { metadata: { fields: { name: string, description: string, ... } } }
 *
 * Metadata.name is often empty on-chain. Fall back to type + short ID.
 */
function resolveName(
  content: Record<string, unknown> | null,
  type: StructureType,
  objectId: ObjectId,
): string {
  if (content?.metadata) {
    const meta = content.metadata as Record<string, unknown>;
    const metaFields = meta?.fields as Record<string, unknown> | undefined;
    const name = metaFields?.name;
    if (typeof name === "string" && name.length > 0) return name;
  }

  // Flat fallback
  if (content?.name && typeof content.name === "string" && content.name.length > 0) {
    return content.name;
  }

  // Default: type label + short ID
  const shortId = objectId.slice(2, 10);
  const typeLabels: Record<StructureType, string> = {
    gate: "Gate",
    storage_unit: "Storage",
    turret: "Turret",
    network_node: "Network Node",
  };
  return `${typeLabels[type]} ${shortId}`;
}

function resolveAssemblyId(
  content: Record<string, unknown> | null,
): string | undefined {
  if (!content) return undefined;

  const key = content.key as Record<string, unknown> | undefined;
  const keyFields = key?.fields as Record<string, unknown> | undefined;
  const itemId = keyFields?.item_id ?? keyFields?.itemId ?? keyFields?.id;

  if (typeof itemId === "string" && itemId.length > 0) return itemId;
  if (typeof itemId === "number" && Number.isFinite(itemId)) return String(itemId);

  return undefined;
}

/**
 * Resolve the network node ID from the energy_source_id field.
 * Only non-NWN assemblies (gates, SSUs, turrets) have this field.
 */
function resolveNetworkNodeId(
  content: Record<string, unknown> | null,
): ObjectId | undefined {
  if (!content) return undefined;
  const id = content.energy_source_id;
  if (typeof id === "string" && id.length > 0) return id;
  return undefined;
}

/** Resolve linked gate ID from on-chain Option<ID> field. */
function resolveLinkedGateId(
  content: Record<string, unknown> | null,
): ObjectId | undefined {
  if (!content) return undefined;
  const raw = content.linked_gate_id;
  // Option<ID> serializes as plain string when Some, null when None
  if (typeof raw === "string" && raw !== "") return raw;
  // Legacy envelope shape { fields: { id: "0x..." } }
  if (raw && typeof raw === "object") {
    const fields = (raw as Record<string, unknown>).fields as Record<string, unknown> | undefined;
    const id = fields?.id as string | undefined;
    if (id) return id;
  }
  return undefined;
}

/**
 * Resolve fuel state from on-chain Fuel structure.
 *
 * On-chain shape: { fuel: { fields: { quantity, max_capacity, burn_rate_in_ms, type_id, unit_volume, is_burning, ... } } }
 * Only network nodes have a fuel field.
 */
function resolveFuel(content: Record<string, unknown> | null): FuelState | undefined {
  if (!content) return undefined;
  const fuelObj = content.fuel as Record<string, unknown> | undefined;
  const fuelFields = fuelObj?.fields as Record<string, unknown> | undefined;

  if (fuelFields) {
    return {
      quantity: Number(fuelFields.quantity ?? 0),
      maxCapacity: Number(fuelFields.max_capacity ?? fuelFields.maxCapacity ?? 0),
      burnRateMs: Number(fuelFields.burn_rate_in_ms ?? fuelFields.burnRateInMs ?? 0),
      isBurning: Boolean(fuelFields.is_burning ?? fuelFields.isBurning ?? false),
      typeId: resolveOptionU64(fuelFields.type_id ?? fuelFields.typeId),
      unitVolume: resolveOptionU64(fuelFields.unit_volume ?? fuelFields.unitVolume),
    };
  }

  return undefined;
}

/** Extract a number from a Sui Option<u64> JSON field (handles vec-wrapper and raw formats). */
function resolveOptionU64(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof raw === "object" && raw !== null && "vec" in raw) {
    const vec = (raw as { vec: unknown[] }).vec;
    if (Array.isArray(vec) && vec.length > 0) {
      const n = Number(vec[0]);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

/**
 * Resolve extension authorization from on-chain data.
 *
 * On-chain shape: { extension: { fields: { name: "pkg::module::Witness" } } }
 * Uses suffix matching: only exact module::Type patterns from CC code are
 * considered "authorized". The package prefix is not checked because turret
 * auth types (CommercialAuth, DefenseAuth) were introduced in v3 and their
 * type-origin package differs from both CC_ORIGINAL_PACKAGE_ID (v1) and
 * CC_PACKAGE_ID (latest). Suffix matching is safe because only our package
 * can mint these witness types to register them as extensions.
 */
function resolveExtensionAuth(
  content: Record<string, unknown> | null,
): "authorized" | "stale" | "none" {
  if (!content) return "none";

  const ext = content.extension;
  if (!ext || typeof ext !== "object") return "none";

  // Extract TypeName.name string from the RPC response
  const fields = (ext as Record<string, unknown>).fields as
    | Record<string, unknown>
    | undefined;
  const typeName = fields?.name as string | undefined;

  if (!typeName) return "none";

  // Whitelist: only these module::Type suffixes from the current contract
  // are valid. Legacy modules (turret_bouncer, turret_defense) and anything
  // else are stale.
  const VALID_AUTH_SUFFIXES = [
    "::gate_control::GateAuth",
    "::trade_post::TradeAuth",
    "::turret::CommercialAuth",
    "::turret::DefenseAuth",
  ];

  if (VALID_AUTH_SUFFIXES.some((s) => typeName.endsWith(s))) {
    return "authorized";
  }

  return "stale";
}
