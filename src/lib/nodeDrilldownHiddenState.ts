import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";
import {
  buildScopedStorageKey,
  getBrowserStorageForScope,
  normalizeStorageScopeValue,
  removeScopedStorageItem,
} from "@/lib/browserScopedStorage";

const NODE_DRILLDOWN_HIDDEN_STATE_VERSION = 1;
const NODE_DRILLDOWN_HIDDEN_STATE_PREFIX = "cc:node-drilldown:hidden:v1";

interface NodeDrilldownHiddenStateRecord {
  version: typeof NODE_DRILLDOWN_HIDDEN_STATE_VERSION;
  nodeId: string;
  scopeKey: string;
  hiddenCanonicalKeys: string[];
  updatedAt: string;
}

function buildStorageKey(nodeId: string, scopeKey: string | null): string {
  return buildScopedStorageKey(NODE_DRILLDOWN_HIDDEN_STATE_PREFIX, nodeId, scopeKey);
}

function isHiddenStateRecord(value: unknown): value is NodeDrilldownHiddenStateRecord {
  if (typeof value !== "object" || value == null) return false;

  const record = value as Partial<NodeDrilldownHiddenStateRecord>;
  return record.version === NODE_DRILLDOWN_HIDDEN_STATE_VERSION
    && typeof record.nodeId === "string"
    && typeof record.scopeKey === "string"
    && Array.isArray(record.hiddenCanonicalKeys)
    && record.hiddenCanonicalKeys.every((key) => typeof key === "string")
    && typeof record.updatedAt === "string";
}

export function resolveNodeDrilldownScopeKey(
  characterId: string | null | undefined,
  walletAddress: string | null | undefined,
): string | null {
  const normalizedCharacterId = normalizeStorageScopeValue(characterId);
  if (normalizedCharacterId) {
    return `character:${normalizedCharacterId}`;
  }

  const normalizedWalletAddress = normalizeStorageScopeValue(walletAddress);
  if (normalizedWalletAddress) {
    return `wallet:${normalizedWalletAddress}`;
  }

  return null;
}

export function loadNodeDrilldownHiddenCanonicalKeys(nodeId: string, scopeKey: string | null): string[] {
  const storage = getBrowserStorageForScope(scopeKey);
  const storageKey = buildStorageKey(nodeId, scopeKey);

  if (!storage) return [];

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!isHiddenStateRecord(parsed)) {
      removeScopedStorageItem(storage, storageKey);
      return [];
    }

    return [...new Set(parsed.hiddenCanonicalKeys.map((key) => key.trim()).filter(Boolean))].sort();
  } catch {
    removeScopedStorageItem(storage, storageKey);
    return [];
  }
}

export function saveNodeDrilldownHiddenCanonicalKeys(
  nodeId: string,
  scopeKey: string | null,
  hiddenCanonicalKeys: readonly string[],
): void {
  const storage = getBrowserStorageForScope(scopeKey);
  const storageKey = buildStorageKey(nodeId, scopeKey);

  if (!storage) return;

  const nextKeys = [...new Set(hiddenCanonicalKeys.map((key) => key.trim()).filter(Boolean))].sort();
  if (nextKeys.length === 0) {
    removeScopedStorageItem(storage, storageKey);
    return;
  }

  const record: NodeDrilldownHiddenStateRecord = {
    version: NODE_DRILLDOWN_HIDDEN_STATE_VERSION,
    nodeId,
    scopeKey: scopeKey ?? "session",
    hiddenCanonicalKeys: nextKeys,
    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Ignore quota and private-mode storage failures and fail open.
  }
}

export function partitionNodeDrilldownStructures(
  structures: readonly NodeLocalStructure[],
  hiddenCanonicalKeys: ReadonlySet<string>,
): { visibleStructures: NodeLocalStructure[]; hiddenStructures: NodeLocalStructure[] } {
  const visibleStructures: NodeLocalStructure[] = [];
  const hiddenStructures: NodeLocalStructure[] = [];

  for (const structure of structures) {
    if (hiddenCanonicalKeys.has(structure.canonicalDomainKey)) {
      hiddenStructures.push(structure);
      continue;
    }

    visibleStructures.push(structure);
  }

  return { visibleStructures, hiddenStructures };
}