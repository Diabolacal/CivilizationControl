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

import { getItemTypeById } from "@/lib/typeCatalog";

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

/** Format runtime milliseconds to human-readable string (e.g., "14d 21h"). */
export function formatRuntime(runtimeMs: number): string {
  const totalHours = runtimeMs / 3_600_000;
  if (totalHours >= 48) {
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (totalHours >= 1) {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, Math.round(totalHours * 60))}m`;
}
