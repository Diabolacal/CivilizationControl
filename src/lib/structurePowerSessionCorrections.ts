import type { PendingStructureWriteOverlay } from "@/lib/structureWriteReconciliation";

const STRUCTURE_POWER_CORRECTIONS_KEY = "cc:structure-power-corrections:v1";
export const STRUCTURE_POWER_SESSION_CORRECTION_MAX_AGE_MS = 15 * 60_000;

interface PersistedStructurePowerCorrection {
  savedAt: string;
  overlay: PendingStructureWriteOverlay;
}

function isBrowserSessionStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isPersistablePowerCorrection(overlay: PendingStructureWriteOverlay): boolean {
  return (overlay.pendingStatus === "offline" || overlay.pendingStatus === "online")
    && overlay.pendingName == null
    && overlay.latestDigest == null;
}

function isFreshPersistedCorrection(savedAt: string): boolean {
  const parsed = Date.parse(savedAt);
  if (!Number.isFinite(parsed)) {
    return false;
  }

  return Date.now() - parsed <= STRUCTURE_POWER_SESSION_CORRECTION_MAX_AGE_MS;
}

function normalizeRecord(value: unknown): Record<string, PendingStructureWriteOverlay> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record: Record<string, PendingStructureWriteOverlay> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const candidate = entry as PersistedStructurePowerCorrection;
    if (!candidate.overlay || typeof candidate.overlay !== "object") {
      continue;
    }

    if (!isFreshPersistedCorrection(candidate.savedAt)) {
      continue;
    }

    const overlay = candidate.overlay as PendingStructureWriteOverlay;
    if (overlay.key === key && isPersistablePowerCorrection(overlay)) {
      record[key] = overlay;
    }
  }

  return record;
}

export function loadStructurePowerSessionCorrections(): Record<string, PendingStructureWriteOverlay> {
  if (!isBrowserSessionStorageAvailable()) {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(STRUCTURE_POWER_CORRECTIONS_KEY);
    return raw ? normalizeRecord(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function saveStructurePowerSessionCorrections(
  overlaysByKey: Record<string, PendingStructureWriteOverlay>,
) {
  if (!isBrowserSessionStorageAvailable()) {
    return;
  }

  const savedAt = new Date().toISOString();
  const corrections = Object.fromEntries(
    Object.entries(overlaysByKey)
      .filter(([, overlay]) => isPersistablePowerCorrection(overlay))
      .map(([key, overlay]) => [key, { savedAt, overlay } satisfies PersistedStructurePowerCorrection]),
  );

  try {
    if (Object.keys(corrections).length === 0) {
      window.sessionStorage.removeItem(STRUCTURE_POWER_CORRECTIONS_KEY);
      return;
    }

    window.sessionStorage.setItem(STRUCTURE_POWER_CORRECTIONS_KEY, JSON.stringify(corrections));
  } catch {
    // Session persistence is defensive only; in-memory overlays remain authoritative.
  }
}