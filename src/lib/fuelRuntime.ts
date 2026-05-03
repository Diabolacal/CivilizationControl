/**
 * Fuel runtime — resolves fuel type, efficiency, and runtime estimation.
 *
 * On-chain formula (fuel.move):
 *   actual_consumption_rate_ms = (burn_rate_in_ms × fuel_efficiency) / 100
 *   units_consumed = elapsed_ms / actual_consumption_rate_ms
 *
 * Lower efficiency → lower actual rate → faster consumption → shorter runtime.
 * D1 (10%) burns 10× faster than 100% baseline.
 */

import { getItemTypeById, getItemTypeByName } from "@/lib/typeCatalog";
import type { IndexedPowerSummary, Structure } from "@/types/domain";

export const DEFAULT_CRITICAL_FUEL_THRESHOLD_SECONDS = 60 * 60;
export const DEFAULT_LOW_FUEL_THRESHOLD_SECONDS = 24 * 60 * 60;
const CANONICAL_FUEL_TANK_RAW_CAPACITY = 1000;
const CANONICAL_CAPACITY_TOLERANCE_RATIO = 0.25;

export type FuelSeverity = "critical" | "low" | "normal" | "partial" | "unavailable";

export interface FuelPresentation {
  source: "indexed-power-summary" | "direct-fuel" | "indexed-quantity" | "none";
  severity: FuelSeverity;
  typeLabel: string | null;
  runtimeLabel: string | null;
  amountLabel: string | null;
  fillRatio: number | null;
  fillPercent: number | null;
  fillReason: string | null;
  quantityUnits: number | null;
  maxCapacityUnits: number | null;
  estimatedSecondsRemaining: number | null;
  criticalThresholdSeconds: number | null;
  lowThresholdSeconds: number | null;
  isRuntimeKnown: boolean;
  confidence: string | null;
}

type FuelStructureLike = Pick<Structure, "fuel" | "indexedFuelAmount" | "indexedPowerSummary" | "summary">;

// ─── Fuel Efficiency Lookup ──────────────────────────────

/**
 * Known fuel efficiencies by item type ID (10–100%).
 * Sourced from on-chain FuelConfig. If new fuels appear,
 * add their type ID → efficiency here.
 */
const FUEL_EFFICIENCY: Record<number, number> = {
  88335: 10, // D1 Fuel
  88319: 15, // D2 Fuel
  78516: 40, // EU-40 Fuel
  84868: 40, // SOF-40 Fuel
  78515: 80, // SOF-80 Fuel
  78437: 90, // EU-90 Fuel
};

/** Resolve fuel type display label from type ID (e.g., "D1", "EU-40"). */
export function fuelTypeLabel(typeId?: number): string | undefined {
  if (typeId == null) return undefined;
  const itemType = getItemTypeById(typeId);
  if (!itemType) return undefined;
  return itemType.name.replace(/ Fuel$/, "");
}

/** Look up fuel efficiency (10–100) by type ID. Returns undefined if unknown. */
export function getFuelEfficiency(typeId?: number): number | undefined {
  if (typeId == null) return undefined;
  return FUEL_EFFICIENCY[typeId];
}

// ─── Runtime Computation ─────────────────────────────────

/**
 * Compute estimated runtime in milliseconds.
 * Matches on-chain formula: quantity × burnRateMs × efficiency / 100.
 * Returns undefined if inputs are invalid.
 */
export function computeRuntimeMs(
  quantity: number,
  burnRateMs: number,
  efficiency: number,
): number | undefined {
  if (efficiency <= 0 || burnRateMs <= 0 || quantity <= 0) return undefined;
  return (quantity * burnRateMs * efficiency) / 100;
}

/** Format runtime milliseconds to human-readable string (e.g., "7d 14h"). */
export function formatRuntime(runtimeMs: number): string {
  return formatRuntimeSeconds(runtimeMs / 1000);
}

export function formatRuntimeSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "1m";
  }

  const clampedSeconds = Math.max(0, seconds);
  const totalMinutes = Math.max(1, Math.round(clampedSeconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const totalHours = Math.max(1, Math.round(clampedSeconds / 3600));
  if (totalHours < 24) {
    return `${totalHours}h`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

function normalizeFuelAmount(fuelAmount: string | number | null | undefined): string | null {
  if (typeof fuelAmount === "number" && Number.isFinite(fuelAmount)) {
    return `${fuelAmount}`;
  }

  if (typeof fuelAmount !== "string") {
    return null;
  }

  const trimmed = fuelAmount.trim();
  return trimmed ? trimmed : null;
}

function formatIntegerString(value: string): string {
  const isNegative = value.startsWith("-");
  const digits = isNegative ? value.slice(1) : value;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return isNegative ? `-${grouped}` : grouped;
}

export function getIndexedFuelAmount(
  structure: Pick<Structure, "indexedFuelAmount" | "indexedPowerSummary" | "summary">,
): string | null {
  return normalizeFuelAmount(structure.indexedFuelAmount)
    ?? normalizeFuelAmount(structure.indexedPowerSummary?.fuelAmount)
    ?? normalizeFuelAmount(structure.summary?.powerSummary?.fuelAmount)
    ?? normalizeFuelAmount(structure.summary?.fuelAmount);
}

export function getIndexedPowerSummary(
  structure: Pick<Structure, "indexedPowerSummary" | "summary">,
): IndexedPowerSummary | null {
  return structure.indexedPowerSummary ?? structure.summary?.powerSummary ?? null;
}

export function formatIndexedFuelAmount(fuelAmount: string | number | null | undefined): string | null {
  const normalized = normalizeFuelAmount(fuelAmount);
  if (!normalized) {
    return null;
  }

  const formatted = /^-?\d+$/.test(normalized)
    ? formatIntegerString(normalized)
    : normalized;
  return /\bunits?\b/i.test(formatted) ? formatted : `${formatted} units`;
}

function normalizeNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNonNegativeNumber(value: number | string | null | undefined): number | null {
  const normalized = normalizeNumber(value);
  if (normalized == null) {
    return null;
  }

  return normalized >= 0 ? normalized : null;
}

function normalizeString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolvePowerSummaryRuntimeSeconds(powerSummary: IndexedPowerSummary): number | null {
  const seconds = normalizeNonNegativeNumber(powerSummary.estimatedSecondsRemaining);
  if (seconds != null) {
    return seconds;
  }

  const hours = normalizeNonNegativeNumber(powerSummary.estimatedHoursRemaining);
  if (hours == null) {
    return null;
  }

  return Math.round(hours * 3600);
}

function resolvePowerSummaryTypeLabel(powerSummary: IndexedPowerSummary): string | null {
  return normalizeString(powerSummary.fuelGrade)
    ?? normalizeString(powerSummary.fuelTypeName)?.replace(/ Fuel$/i, "")
    ?? fuelTypeLabel(powerSummary.fuelTypeId ?? undefined)
    ?? null;
}

function resolveFuelCatalogItem(powerSummary: IndexedPowerSummary) {
  const byId = powerSummary.fuelTypeId != null ? getItemTypeById(powerSummary.fuelTypeId) : undefined;
  if (byId) {
    return byId;
  }

  const typeName = normalizeString(powerSummary.fuelTypeName);
  if (typeName) {
    const byName = getItemTypeByName(typeName);
    if (byName) {
      return byName;
    }
  }

  const grade = resolvePowerSummaryTypeLabel(powerSummary);
  if (grade) {
    return getItemTypeByName(`${grade} Fuel`);
  }

  return undefined;
}

function resolveCanonicalFuelCapacityUnits(powerSummary: IndexedPowerSummary): number | null {
  const itemType = resolveFuelCatalogItem(powerSummary);
  if (!itemType || itemType.volume <= 0) {
    return null;
  }

  return Math.floor(CANONICAL_FUEL_TANK_RAW_CAPACITY / itemType.volume);
}

function isWithinTolerance(value: number, target: number, ratio: number): boolean {
  const tolerance = Math.max(1, target * ratio);
  return Math.abs(value - target) <= tolerance;
}

function resolveIndexedCapacityUnits(powerSummary: IndexedPowerSummary): {
  maxCapacityUnits: number | null;
  fillReason: string | null;
} {
  const rawCapacity = normalizeNonNegativeNumber(powerSummary.fuelMaxCapacity);
  const canonicalCapacityUnits = resolveCanonicalFuelCapacityUnits(powerSummary);

  if (rawCapacity != null && canonicalCapacityUnits != null && isWithinTolerance(rawCapacity, canonicalCapacityUnits, CANONICAL_CAPACITY_TOLERANCE_RATIO)) {
    return {
      maxCapacityUnits: rawCapacity,
      fillReason: "indexed-usable-capacity",
    };
  }

  if (canonicalCapacityUnits != null) {
    return {
      maxCapacityUnits: canonicalCapacityUnits,
      fillReason: rawCapacity != null ? "indexed-canonical-capacity" : "indexed-canonical-capacity-fallback",
    };
  }

  return {
    maxCapacityUnits: rawCapacity,
    fillReason: rawCapacity != null ? "indexed-raw-capacity" : null,
  };
}

function resolveFillRatio(quantityUnits: number | null, maxCapacityUnits: number | null): number | null {
  if (quantityUnits == null || maxCapacityUnits == null || maxCapacityUnits <= 0) {
    return null;
  }

  return Math.min(1, Math.max(0, quantityUnits / maxCapacityUnits));
}

function resolveFillPercent(fillRatio: number | null): number | null {
  if (fillRatio == null) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(fillRatio * 100)));
}

function formatUnitCount(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatAmountLabel(quantityUnits: number | null, maxCapacityUnits: number | null): string | null {
  if (quantityUnits == null) {
    return null;
  }

  if (maxCapacityUnits != null && maxCapacityUnits > 0) {
    return `${formatUnitCount(quantityUnits)} / ${formatUnitCount(maxCapacityUnits)} units`;
  }

  return `${formatUnitCount(quantityUnits)} units`;
}

export function resolveFuelSeverity({
  isCriticalFuel,
  isLowFuel,
  estimatedSecondsRemaining,
  criticalThresholdSeconds,
  lowThresholdSeconds,
  hasQuantity,
  runtimeKnown,
}: {
  isCriticalFuel?: boolean | null;
  isLowFuel?: boolean | null;
  estimatedSecondsRemaining: number | null;
  criticalThresholdSeconds?: number | null;
  lowThresholdSeconds?: number | null;
  hasQuantity: boolean;
  runtimeKnown: boolean;
}): FuelSeverity {
  const resolvedCriticalThreshold = criticalThresholdSeconds ?? DEFAULT_CRITICAL_FUEL_THRESHOLD_SECONDS;
  const resolvedLowThreshold = lowThresholdSeconds ?? DEFAULT_LOW_FUEL_THRESHOLD_SECONDS;

  if (isCriticalFuel === true) {
    return "critical";
  }

  if (estimatedSecondsRemaining != null && estimatedSecondsRemaining <= resolvedCriticalThreshold) {
    return "critical";
  }

  if (isLowFuel === true) {
    return "low";
  }

  if (estimatedSecondsRemaining != null && estimatedSecondsRemaining <= resolvedLowThreshold) {
    return "low";
  }

  if (runtimeKnown && estimatedSecondsRemaining != null) {
    return "normal";
  }

  if (hasQuantity) {
    return "partial";
  }

  return "unavailable";
}

export function formatFuelPresentationSummary(presentation: FuelPresentation): string | null {
  if (presentation.source === "none") {
    return null;
  }

  const segments: string[] = [];
  if (presentation.typeLabel) {
    segments.push(presentation.typeLabel);
  }

  if (presentation.runtimeLabel) {
    segments.push(`~${presentation.runtimeLabel}`);
  } else if (presentation.amountLabel) {
    segments.push(presentation.amountLabel);
  }

  return segments.length > 0 ? segments.join(" · ") : null;
}

export function buildFuelPresentation(structure: FuelStructureLike): FuelPresentation {
  const indexedPowerSummary = getIndexedPowerSummary(structure);
  const indexedFuelAmount = getIndexedFuelAmount(structure);

  if (indexedPowerSummary) {
    const quantityUnits = normalizeNonNegativeNumber(indexedPowerSummary.fuelAmount);
    const { maxCapacityUnits, fillReason } = resolveIndexedCapacityUnits(indexedPowerSummary);
    const estimatedSecondsRemaining = resolvePowerSummaryRuntimeSeconds(indexedPowerSummary);
    const confidence = normalizeString(indexedPowerSummary.confidence);
    const isRuntimeKnown = confidence?.toLowerCase() === "indexed" && estimatedSecondsRemaining != null;
    const amountLabel = formatAmountLabel(quantityUnits, maxCapacityUnits)
      ?? formatIndexedFuelAmount(indexedFuelAmount);
    const fillRatio = resolveFillRatio(quantityUnits, maxCapacityUnits);

    return {
      source: "indexed-power-summary",
      severity: resolveFuelSeverity({
        isCriticalFuel: indexedPowerSummary.isCriticalFuel,
        isLowFuel: indexedPowerSummary.isLowFuel,
        estimatedSecondsRemaining,
        criticalThresholdSeconds: indexedPowerSummary.criticalFuelThresholdSeconds,
        lowThresholdSeconds: indexedPowerSummary.lowFuelThresholdSeconds,
        hasQuantity: amountLabel != null,
        runtimeKnown: isRuntimeKnown,
      }),
      typeLabel: resolvePowerSummaryTypeLabel(indexedPowerSummary),
      runtimeLabel: isRuntimeKnown && estimatedSecondsRemaining != null
        ? formatRuntimeSeconds(estimatedSecondsRemaining)
        : null,
      amountLabel,
      fillRatio,
      fillPercent: resolveFillPercent(fillRatio),
      fillReason,
      quantityUnits,
      maxCapacityUnits,
      estimatedSecondsRemaining,
      criticalThresholdSeconds: indexedPowerSummary.criticalFuelThresholdSeconds ?? DEFAULT_CRITICAL_FUEL_THRESHOLD_SECONDS,
      lowThresholdSeconds: indexedPowerSummary.lowFuelThresholdSeconds ?? DEFAULT_LOW_FUEL_THRESHOLD_SECONDS,
      isRuntimeKnown,
      confidence,
    };
  }

  if (structure.fuel) {
    const quantityUnits = structure.fuel.quantity;
    const maxCapacityUnits = structure.fuel.unitVolume && structure.fuel.unitVolume > 0
      ? Math.floor(structure.fuel.maxCapacity / structure.fuel.unitVolume)
      : null;
    const efficiency = getFuelEfficiency(structure.fuel.typeId);
    const runtimeMs = efficiency != null
      && structure.fuel.burnRateMs > 0
      && structure.fuel.quantity >= 0
      && structure.fuel.isBurning
      ? computeRuntimeMs(structure.fuel.quantity, structure.fuel.burnRateMs, efficiency)
      : undefined;
    const estimatedSecondsRemaining = runtimeMs != null ? Math.round(runtimeMs / 1000) : null;
    const amountLabel = formatAmountLabel(quantityUnits, maxCapacityUnits);
    const fillRatio = resolveFillRatio(quantityUnits, maxCapacityUnits);

    return {
      source: "direct-fuel",
      severity: resolveFuelSeverity({
        estimatedSecondsRemaining,
        criticalThresholdSeconds: DEFAULT_CRITICAL_FUEL_THRESHOLD_SECONDS,
        lowThresholdSeconds: DEFAULT_LOW_FUEL_THRESHOLD_SECONDS,
        hasQuantity: amountLabel != null,
        runtimeKnown: runtimeMs != null,
      }),
      typeLabel: fuelTypeLabel(structure.fuel.typeId) ?? null,
      runtimeLabel: runtimeMs != null ? formatRuntime(runtimeMs) : null,
      amountLabel,
      fillRatio,
      fillPercent: resolveFillPercent(fillRatio),
      fillReason: maxCapacityUnits != null ? "direct-fuel-capacity" : null,
      quantityUnits,
      maxCapacityUnits,
      estimatedSecondsRemaining,
      criticalThresholdSeconds: DEFAULT_CRITICAL_FUEL_THRESHOLD_SECONDS,
      lowThresholdSeconds: DEFAULT_LOW_FUEL_THRESHOLD_SECONDS,
      isRuntimeKnown: runtimeMs != null,
      confidence: null,
    };
  }

  if (indexedFuelAmount) {
    return {
      source: "indexed-quantity",
      severity: "partial",
      typeLabel: null,
      runtimeLabel: null,
      amountLabel: formatIndexedFuelAmount(indexedFuelAmount),
      fillRatio: null,
      fillPercent: null,
      fillReason: null,
      quantityUnits: normalizeNonNegativeNumber(indexedFuelAmount),
      maxCapacityUnits: null,
      estimatedSecondsRemaining: null,
      criticalThresholdSeconds: null,
      lowThresholdSeconds: null,
      isRuntimeKnown: false,
      confidence: null,
    };
  }

  return {
    source: "none",
    severity: "unavailable",
    typeLabel: null,
    runtimeLabel: null,
    amountLabel: null,
    fillRatio: null,
    fillPercent: null,
    fillReason: null,
    quantityUnits: null,
    maxCapacityUnits: null,
    estimatedSecondsRemaining: null,
    criticalThresholdSeconds: null,
    lowThresholdSeconds: null,
    isRuntimeKnown: false,
    confidence: null,
  };
}
