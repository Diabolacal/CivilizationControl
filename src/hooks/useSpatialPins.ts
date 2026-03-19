/**
 * Hook: spatial pin management for network nodes.
 *
 * Provides React state integration over the spatial pin store.
 * Pins are persisted to localStorage.
 */

import { useState, useCallback } from "react";
import type { ObjectId, SpatialPin } from "@/types/domain";
import {
  getAllSpatialPins,
  getSpatialPin,
  setSpatialPin,
  removeSpatialPin,
} from "@/lib/spatialPins";

export function useSpatialPins() {
  const [pins, setPinsState] = useState<SpatialPin[]>(() => getAllSpatialPins());

  const assignPin = useCallback(
    (networkNodeId: ObjectId, solarSystemId: number, solarSystemName: string) => {
      setSpatialPin(networkNodeId, solarSystemId, solarSystemName);
      setPinsState(getAllSpatialPins());
    },
    [],
  );

  const removePin = useCallback((networkNodeId: ObjectId) => {
    removeSpatialPin(networkNodeId);
    setPinsState(getAllSpatialPins());
  }, []);

  const getPin = useCallback(
    (networkNodeId: ObjectId): SpatialPin | undefined => {
      return getSpatialPin(networkNodeId);
    },
    [],
  );

  return { pins, assignPin, removePin, getPin };
}
