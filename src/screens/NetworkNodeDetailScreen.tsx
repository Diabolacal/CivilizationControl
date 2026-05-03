/**
 * NetworkNodeDetailScreen — Individual network node governance view.
 *
 * Shows node status, fuel level, online control, and a summary of
 * attached child structures (gates, turrets, SSUs) with their status.
 */

import { useMemo } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { StructureDetailHeader } from "@/components/StructureDetailHeader";
import { StatusDot } from "@/components/StatusDot";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useStructurePower } from "@/hooks/useStructurePower";
import {
  fuelTypeLabel,
  getFuelEfficiency,
  computeRuntimeMs,
  formatRuntime,
  formatIndexedFuelAmount,
  getIndexedFuelAmount,
} from "@/lib/fuelRuntime";
import { getSpatialPin } from "@/lib/spatialPins";
import type { Structure, NetworkNodeGroup } from "@/types/domain";

interface NetworkNodeDetailScreenProps {
  structures: Structure[];
  nodeGroups: NetworkNodeGroup[];
  isLoading: boolean;
}

export function NetworkNodeDetailScreen({ structures, nodeGroups, isLoading }: NetworkNodeDetailScreenProps) {
  const { id } = useParams<{ id: string }>();
  const group = nodeGroups.find((g) => g.node.objectId === id);
  const node = group?.node ?? structures.find((s) => s.objectId === id && s.type === "network_node");

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">Loading node…</p>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground/60">Network node not found</p>
        </div>
      </div>
    );
  }

  const pin = node ? getSpatialPin(node.objectId) : undefined;

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={node} solarSystemName={pin?.solarSystemName} />
      <PowerControlSection node={node} />
      {group && <AttachedStructuresSection group={group} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/nodes"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All Network Nodes
    </Link>
  );
}

function PowerControlSection({ node }: { node: Structure }) {
  const power = useStructurePower();
  const isOnline = node.status === "online";
  const indexedFuelLabel = formatIndexedFuelAmount(getIndexedFuelAmount(node));

  const handleOnline = () => {
    power.bringNodeOnline({
      nodeId: node.objectId,
      ownerCapId: node.ownerCapId,
    });
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        {!isOnline ? (
          <button
            onClick={handleOnline}
            disabled={power.status === "pending"}
            className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {power.status === "pending" ? "Executing…" : "Bring Online"}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Node offline not yet implemented — use in-game controls
          </span>
        )}
      </div>
      {node.fuel != null ? (
        (() => {
          const label = fuelTypeLabel(node.fuel.typeId);
          const eff = getFuelEfficiency(node.fuel.typeId);
          const runtimeMs = eff && node.fuel.burnRateMs > 0 && node.fuel.quantity > 0
            ? computeRuntimeMs(node.fuel.quantity, node.fuel.burnRateMs, eff)
            : undefined;
          const maxUnits = node.fuel.unitVolume && node.fuel.unitVolume > 0
            ? Math.floor(node.fuel.maxCapacity / node.fuel.unitVolume)
            : undefined;
          const fillPct = maxUnits != null && maxUnits > 0
            ? Math.min(100, Math.round((node.fuel.quantity / maxUnits) * 100))
            : undefined;

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Fuel</span>
                <span className="text-sm font-mono text-foreground">
                  {label && <span className="text-muted-foreground mr-1.5">{label} •</span>}
                  {node.fuel.quantity.toLocaleString()}
                  {maxUnits != null ? ` / ${maxUnits.toLocaleString()}` : ""} units
                </span>
              </div>
              {fillPct != null && (
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${fillPct > 20 ? "bg-teal-500/60" : "bg-amber-500/60"}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              )}
              {runtimeMs != null ? (
                <p className="text-[11px] text-muted-foreground">
                  Est. runtime: ~{formatRuntime(runtimeMs)} ({label} @ {eff}% efficiency)
                </p>
              ) : node.fuel.quantity > 0 && !eff ? (
                <p className="text-[11px] text-amber-400/80">
                  Unknown fuel type — cannot estimate runtime
                </p>
              ) : null}
              {node.fuel.quantity === 0 && (
                <p className="text-[11px] text-amber-400/80">
                  No fuel loaded — node will shut down when current cycle expires
                </p>
              )}
            </div>
          );
        })()
      ) : indexedFuelLabel ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Fuel</span>
            <span className="text-sm font-mono text-foreground">{indexedFuelLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Runtime estimate unavailable for this node.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Fuel data unavailable.</p>
      )}
      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel="Network node brought online"
          onDismiss={power.reset}
        />
      )}
    </section>
  );
}

function AttachedStructuresSection({ group }: { group: NetworkNodeGroup }) {
  const allChildren = useMemo(
    () => [...group.gates, ...group.turrets, ...group.storageUnits],
    [group],
  );

  if (allChildren.length === 0) {
    return (
      <section className="border border-border rounded p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Attached Structures</h2>
        <p className="text-xs text-muted-foreground">No structures connected to this node.</p>
      </section>
    );
  }

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Attached Structures ({allChildren.length})
      </h2>
      <div className="space-y-1.5">
        {allChildren.map((s) => (
          <Link
            key={s.objectId}
            to={structurePath(s)}
            className="flex items-center justify-between px-3 py-2 rounded hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <StatusDot status={s.status} size="sm" />
              <span className="text-sm text-foreground">{s.name}</span>
              <span className="text-[11px] text-muted-foreground capitalize">{s.type.replace("_", " ")}</span>
            </div>
            <span className="text-[11px] text-muted-foreground capitalize">{s.status}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function structurePath(s: Structure): string {
  switch (s.type) {
    case "gate": return `/gates/${s.objectId}`;
    case "turret": return `/turrets/${s.objectId}`;
    case "storage_unit": return `/tradeposts/${s.objectId}`;
    default: return "/";
  }
}
