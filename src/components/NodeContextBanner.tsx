/**
 * NodeContextBanner — Shows parent network node context for child structures.
 *
 * Displays: "Powered by [NodeName]" + solar system (if pinned) + status + fuel.
 * Used on Gate, TradePost, and Turret detail screens.
 */

import { Link } from "react-router";
import { getSpatialPin } from "@/lib/spatialPins";
import {
  computeRuntimeMs,
  formatRuntime,
  fuelTypeLabel,
  getFuelEfficiency,
  formatIndexedFuelAmount,
  getIndexedFuelAmount,
} from "@/lib/fuelRuntime";
import type { Structure } from "@/types/domain";

interface NodeContextBannerProps {
  structure: Structure;
  structures: Structure[];
}

export function NodeContextBanner({ structure, structures }: NodeContextBannerProps) {
  if (!structure.networkNodeId) return null;

  const parentNode = structures.find(
    (s) => s.objectId === structure.networkNodeId && s.type === "network_node",
  );
  if (!parentNode) return null;

  const pin = getSpatialPin(parentNode.objectId);

  const fuel = parentNode.fuel;
  let fuelLabel = "";
  if (fuel && fuel.quantity > 0) {
    const efficiency = getFuelEfficiency(fuel.typeId) ?? 100;
    const runtimeMs = computeRuntimeMs(fuel.quantity, fuel.burnRateMs, efficiency);
    const typeLabel = fuelTypeLabel(fuel.typeId);
    const parts: string[] = [];
    if (typeLabel) parts.push(typeLabel);
    const pct = fuel.maxCapacity > 0
      ? Math.round((fuel.quantity / (fuel.maxCapacity / (fuel.unitVolume ?? 1))) * 100)
      : 0;
    parts.push(`${pct}%`);
    if (runtimeMs) parts.push(`~${formatRuntime(runtimeMs)}`);
    fuelLabel = parts.join(" · ");
  } else if (fuel) {
    fuelLabel = "No fuel";
  } else {
    fuelLabel = formatIndexedFuelAmount(getIndexedFuelAmount(parentNode)) ?? "";
  }

  const statusLabel = parentNode.status === "online" ? "Online" : "Offline";
  const statusColor = parentNode.status === "online" ? "text-teal-400" : "text-red-400";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded border border-border/50 bg-muted/10 text-xs">
      <span className="text-muted-foreground">Powered by</span>
      <Link
        to={`/nodes/${parentNode.objectId}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        {parentNode.name}
      </Link>
      {pin && (
        <span className="text-muted-foreground/70">{pin.solarSystemName}</span>
      )}
      <span className={statusColor}>{statusLabel}</span>
      {fuelLabel && (
        <span className="text-muted-foreground">{fuelLabel}</span>
      )}
    </div>
  );
}
