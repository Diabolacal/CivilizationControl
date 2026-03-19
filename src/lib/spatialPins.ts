/**
 * Spatial pin store — manages manual solar-system assignments for network nodes.
 *
 * Pins are persisted to localStorage for session continuity.
 * This is the primary onboarding/location model:
 *   - User assigns a solar system to a network node
 *   - Co-located structures inherit that location
 *   - No on-chain location reveal required
 */

import type { ObjectId, SpatialPin } from "@/types/domain";

const STORAGE_KEY = "cc_spatial_pins";

function loadPins(): Map<ObjectId, SpatialPin> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const arr: SpatialPin[] = JSON.parse(raw);
    const map = new Map<ObjectId, SpatialPin>();
    for (const pin of arr) {
      map.set(pin.networkNodeId, pin);
    }
    return map;
  } catch {
    return new Map();
  }
}

function savePins(pins: Map<ObjectId, SpatialPin>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...pins.values()]));
}

let pinCache: Map<ObjectId, SpatialPin> | null = null;

function getPinMap(): Map<ObjectId, SpatialPin> {
  if (!pinCache) {
    pinCache = loadPins();
  }
  return pinCache;
}

/** Get the spatial pin for a network node. */
export function getSpatialPin(networkNodeId: ObjectId): SpatialPin | undefined {
  return getPinMap().get(networkNodeId);
}

/** Get all spatial pins. */
export function getAllSpatialPins(): SpatialPin[] {
  return [...getPinMap().values()];
}

/** Assign a solar system to a network node. */
export function setSpatialPin(
  networkNodeId: ObjectId,
  solarSystemId: number,
  solarSystemName: string,
): SpatialPin {
  const pin: SpatialPin = {
    networkNodeId,
    solarSystemId,
    solarSystemName,
    assignedAt: new Date().toISOString(),
  };
  const map = getPinMap();
  map.set(networkNodeId, pin);
  savePins(map);
  return pin;
}

/** Remove a spatial pin from a network node. */
export function removeSpatialPin(networkNodeId: ObjectId): void {
  const map = getPinMap();
  map.delete(networkNodeId);
  savePins(map);
}
