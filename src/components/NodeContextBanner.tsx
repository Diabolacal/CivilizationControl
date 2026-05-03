/**
 * NodeContextBanner — Shows parent network node context for child structures.
 *
 * Displays: "Powered by [NodeName]" + solar system (if pinned) + status + fuel.
 * Used on Gate, TradePost, and Turret detail screens.
 */

import { Link } from "react-router";
import { getSpatialPin } from "@/lib/spatialPins";
import { buildFuelPresentation } from "@/lib/fuelRuntime";
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

  const fuelPresentation = buildFuelPresentation(parentNode);
  const fuelLabel = fuelPresentation.source === "none"
    ? ""
    : [
      fuelPresentation.typeLabel,
      fuelPresentation.runtimeLabel ? `~${fuelPresentation.runtimeLabel}` : fuelPresentation.amountLabel,
    ].filter((value): value is string => Boolean(value)).join(" · ");
  const fuelTextClass = fuelPresentation.severity === "critical"
    ? "text-red-400"
    : fuelPresentation.severity === "low"
      ? "text-amber-400"
      : "text-muted-foreground";

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
        <span className={fuelTextClass}>{fuelLabel}</span>
      )}
    </div>
  );
}
