import type { PendingStructureWriteOverlay } from "@/lib/structureWriteReconciliation";

const STRUCTURE_POWER_CORRECTIONS_KEY = "cc:structure-power-corrections:v1";

function isBrowserSessionStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isPersistablePowerCorrection(overlay: PendingStructureWriteOverlay): boolean {
  return overlay.pendingStatus === "offline" && overlay.pendingName == null && overlay.latestDigest == null;
}

function normalizeRecord(value: unknown): Record<string, PendingStructureWriteOverlay> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record: Record<string, PendingStructureWriteOverlay> = {};
  for (const [key, overlay] of Object.entries(value)) {
    if (!overlay || typeof overlay !== "object") continue;
    const candidate = overlay as PendingStructureWriteOverlay;
    if (candidate.key === key && isPersistablePowerCorrection(candidate)) {
      record[key] = candidate;
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

  const corrections = Object.fromEntries(
    Object.entries(overlaysByKey).filter(([, overlay]) => isPersistablePowerCorrection(overlay)),
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