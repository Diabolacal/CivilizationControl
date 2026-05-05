import {
  buildScopedStorageKey,
  getBrowserStorageForScope,
  removeScopedStorageItem,
} from "@/lib/browserScopedStorage";

export interface NodeDrilldownLayoutPosition {
  xPercent: number;
  yPercent: number;
}

export type NodeDrilldownLayoutOverrides = Record<string, NodeDrilldownLayoutPosition>;

const NODE_DRILLDOWN_LAYOUT_VERSION = 1;
const NODE_DRILLDOWN_LAYOUT_PREFIX = "cc:node-drilldown:layout:v1";
const LAYOUT_ALGORITHM = "family-bands-v1";

interface NodeDrilldownLayoutRecord {
  version: typeof NODE_DRILLDOWN_LAYOUT_VERSION;
  nodeId: string;
  scopeKey: string;
  layoutAlgorithm: typeof LAYOUT_ALGORITHM;
  positions: NodeDrilldownLayoutOverrides;
  updatedAt: string;
}

function roundPosition(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizePosition(value: unknown): NodeDrilldownLayoutPosition | null {
  if (typeof value !== "object" || value == null) return null;

  const position = value as Partial<NodeDrilldownLayoutPosition>;
  const xPercent = position.xPercent;
  const yPercent = position.yPercent;
  if (!Number.isFinite(xPercent) || !Number.isFinite(yPercent)) return null;

  return {
    xPercent: roundPosition(Math.min(100, Math.max(0, xPercent as number))),
    yPercent: roundPosition(Math.min(100, Math.max(0, yPercent as number))),
  };
}

function normalizeOverrides(value: unknown): NodeDrilldownLayoutOverrides {
  if (typeof value !== "object" || value == null) return {};

  const entries: Array<[string, NodeDrilldownLayoutPosition]> = Object.entries(value as Record<string, unknown>).flatMap(([key, position]) => {
      const normalizedKey = key.trim();
      const normalizedPosition = normalizePosition(position);
      return normalizedKey && normalizedPosition ? [[normalizedKey, normalizedPosition]] : [];
    });

  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}

function isLayoutRecord(value: unknown): value is NodeDrilldownLayoutRecord {
  if (typeof value !== "object" || value == null) return false;

  const record = value as Partial<NodeDrilldownLayoutRecord>;
  return record.version === NODE_DRILLDOWN_LAYOUT_VERSION
    && typeof record.nodeId === "string"
    && typeof record.scopeKey === "string"
    && record.layoutAlgorithm === LAYOUT_ALGORITHM
    && typeof record.positions === "object"
    && record.positions != null
    && typeof record.updatedAt === "string";
}

export function buildNodeDrilldownLayoutStorageKey(nodeId: string, scopeKey: string | null): string {
  return buildScopedStorageKey(NODE_DRILLDOWN_LAYOUT_PREFIX, nodeId, scopeKey);
}

export function loadNodeDrilldownLayoutOverrides(nodeId: string, scopeKey: string | null): NodeDrilldownLayoutOverrides {
  const storage = getBrowserStorageForScope(scopeKey);
  const storageKey = buildNodeDrilldownLayoutStorageKey(nodeId, scopeKey);

  if (!storage) return {};

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!isLayoutRecord(parsed) || parsed.nodeId !== nodeId || parsed.scopeKey !== (scopeKey ?? "session")) {
      removeScopedStorageItem(storage, storageKey);
      return {};
    }

    return normalizeOverrides(parsed.positions);
  } catch {
    removeScopedStorageItem(storage, storageKey);
    return {};
  }
}

export function saveNodeDrilldownLayoutOverrides(
  nodeId: string,
  scopeKey: string | null,
  positions: NodeDrilldownLayoutOverrides,
): void {
  const storage = getBrowserStorageForScope(scopeKey);
  const storageKey = buildNodeDrilldownLayoutStorageKey(nodeId, scopeKey);
  const normalizedPositions = normalizeOverrides(positions);

  if (!storage) return;

  if (Object.keys(normalizedPositions).length === 0) {
    removeScopedStorageItem(storage, storageKey);
    return;
  }

  const record: NodeDrilldownLayoutRecord = {
    version: NODE_DRILLDOWN_LAYOUT_VERSION,
    nodeId,
    scopeKey: scopeKey ?? "session",
    layoutAlgorithm: LAYOUT_ALGORITHM,
    positions: normalizedPositions,
    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Ignore quota and private-mode storage failures and fail open.
  }
}

export function setNodeDrilldownLayoutOverride(
  positions: NodeDrilldownLayoutOverrides,
  canonicalDomainKey: string,
  position: NodeDrilldownLayoutPosition,
): NodeDrilldownLayoutOverrides {
  const normalizedKey = canonicalDomainKey.trim();
  const normalizedPosition = normalizePosition(position);
  if (!normalizedKey || !normalizedPosition) return positions;

  return {
    ...positions,
    [normalizedKey]: normalizedPosition,
  };
}