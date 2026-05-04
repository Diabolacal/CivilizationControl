import {
  buildScopedStorageKey,
  getBrowserStorageForScope,
  removeScopedStorageItem,
} from "@/lib/browserScopedStorage";

import type { StructureStatus } from "@/types/domain";
import type { NodeLocalStructure } from "./nodeDrilldownTypes";

export const NODE_POWER_PRESET_SLOT_COUNT = 4;
export const NODE_POWER_PRESET_LABEL_MAX_LENGTH = 12;

const NODE_POWER_PRESET_VERSION = 1;
const NODE_POWER_PRESET_PREFIX = "cc:node-power-presets:v1";

export interface NodePowerPresetTarget {
  canonicalDomainKey: string;
  desiredOnline: boolean;
  objectId: string | null;
  assemblyId: string | null;
  directChainObjectId: string | null;
  directChainAssemblyId: string | null;
  displayName: string;
  family: string;
  typeLabel: string;
}

export interface NodePowerPresetSlot {
  slotIndex: number;
  label: string;
  savedAt: string;
  nodeId: string;
  targets: NodePowerPresetTarget[];
}

interface NodePowerPresetRecord {
  version: typeof NODE_POWER_PRESET_VERSION;
  nodeId: string;
  scopeKey: string;
  slots: Array<NodePowerPresetSlot | null>;
  updatedAt: string;
}

function isExactPowerStatus(status: StructureStatus): status is "online" | "offline" {
  return status === "online" || status === "offline";
}

function normalizePresetLabel(label: string, slotIndex: number): string {
  const trimmed = label.trim().replace(/\s+/g, " ");
  const fallback = `Preset ${slotIndex}`;
  return (trimmed || fallback).slice(0, NODE_POWER_PRESET_LABEL_MAX_LENGTH);
}

function emptySlots(): Array<NodePowerPresetSlot | null> {
  return Array.from({ length: NODE_POWER_PRESET_SLOT_COUNT }, () => null);
}

function isSlot(value: unknown): value is NodePowerPresetSlot {
  if (typeof value !== "object" || value == null) return false;

  const slot = value as Partial<NodePowerPresetSlot>;
  return Number.isInteger(slot.slotIndex)
    && typeof slot.label === "string"
    && typeof slot.savedAt === "string"
    && typeof slot.nodeId === "string"
    && Array.isArray(slot.targets)
    && slot.targets.every((target) => (
      typeof target === "object"
      && target != null
      && typeof (target as Partial<NodePowerPresetTarget>).canonicalDomainKey === "string"
      && typeof (target as Partial<NodePowerPresetTarget>).desiredOnline === "boolean"
    ));
}

function isPresetRecord(value: unknown): value is NodePowerPresetRecord {
  if (typeof value !== "object" || value == null) return false;

  const record = value as Partial<NodePowerPresetRecord>;
  return record.version === NODE_POWER_PRESET_VERSION
    && typeof record.nodeId === "string"
    && typeof record.scopeKey === "string"
    && Array.isArray(record.slots)
    && typeof record.updatedAt === "string";
}

export function buildNodePowerPresetStorageKey(nodeId: string, scopeKey: string | null): string {
  return buildScopedStorageKey(NODE_POWER_PRESET_PREFIX, nodeId, scopeKey);
}

export function getDefaultNodePowerPresetLabel(slotIndex: number): string {
  return `Preset ${slotIndex}`;
}

export function buildNodePowerPresetTargets(structures: readonly NodeLocalStructure[]): NodePowerPresetTarget[] {
  return structures
    .filter((structure) => isExactPowerStatus(structure.status))
    .map((structure) => ({
      canonicalDomainKey: structure.canonicalDomainKey,
      desiredOnline: structure.status === "online",
      objectId: structure.objectId ?? null,
      assemblyId: structure.assemblyId ?? null,
      directChainObjectId: structure.directChainObjectId ?? null,
      directChainAssemblyId: structure.directChainAssemblyId ?? null,
      displayName: structure.displayName,
      family: structure.family,
      typeLabel: structure.typeLabel,
    }));
}

export function loadNodePowerPresetSlots(nodeId: string, scopeKey: string | null): Array<NodePowerPresetSlot | null> {
  const storage = getBrowserStorageForScope(scopeKey);
  const storageKey = buildNodePowerPresetStorageKey(nodeId, scopeKey);

  if (!storage) return emptySlots();

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return emptySlots();

    const parsed = JSON.parse(raw) as unknown;
    if (!isPresetRecord(parsed) || parsed.nodeId !== nodeId || parsed.scopeKey !== (scopeKey ?? "session")) {
      removeScopedStorageItem(storage, storageKey);
      return emptySlots();
    }

    const slots = emptySlots();
    parsed.slots.forEach((slot) => {
      if (!isSlot(slot)) return;
      if (slot.slotIndex < 1 || slot.slotIndex > NODE_POWER_PRESET_SLOT_COUNT) return;

      slots[slot.slotIndex - 1] = {
        ...slot,
        label: normalizePresetLabel(slot.label, slot.slotIndex),
        targets: slot.targets.filter((target) => target.canonicalDomainKey.trim().length > 0),
      };
    });

    return slots;
  } catch {
    removeScopedStorageItem(storage, storageKey);
    return emptySlots();
  }
}

export function saveNodePowerPresetSlots(
  nodeId: string,
  scopeKey: string | null,
  slots: readonly (NodePowerPresetSlot | null)[],
): void {
  const storage = getBrowserStorageForScope(scopeKey);
  const storageKey = buildNodePowerPresetStorageKey(nodeId, scopeKey);

  if (!storage) return;

  const normalizedSlots = emptySlots();
  slots.slice(0, NODE_POWER_PRESET_SLOT_COUNT).forEach((slot, index) => {
    if (!slot) return;
    normalizedSlots[index] = {
      ...slot,
      slotIndex: index + 1,
      label: normalizePresetLabel(slot.label, index + 1),
      targets: slot.targets.filter((target) => target.canonicalDomainKey.trim().length > 0),
    };
  });

  if (normalizedSlots.every((slot) => slot == null)) {
    removeScopedStorageItem(storage, storageKey);
    return;
  }

  const record: NodePowerPresetRecord = {
    version: NODE_POWER_PRESET_VERSION,
    nodeId,
    scopeKey: scopeKey ?? "session",
    slots: normalizedSlots,
    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Ignore quota and private-mode storage failures and fail open.
  }
}

export function upsertNodePowerPresetSlot(
  slots: readonly (NodePowerPresetSlot | null)[],
  params: {
    label: string;
    nodeId: string;
    slotIndex: number;
    structures: readonly NodeLocalStructure[];
  },
): Array<NodePowerPresetSlot | null> {
  const nextSlots = emptySlots();
  slots.slice(0, NODE_POWER_PRESET_SLOT_COUNT).forEach((slot, index) => {
    nextSlots[index] = slot ?? null;
  });

  nextSlots[params.slotIndex - 1] = {
    slotIndex: params.slotIndex,
    label: normalizePresetLabel(params.label, params.slotIndex),
    savedAt: new Date().toISOString(),
    nodeId: params.nodeId,
    targets: buildNodePowerPresetTargets(params.structures),
  };

  return nextSlots;
}