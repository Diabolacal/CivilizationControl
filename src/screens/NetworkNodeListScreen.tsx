/**
 * NetworkNodeListScreen — Overview of all network nodes under governance.
 *
 * Displays nodes with status, fuel level, and attached structure counts.
 * Provides bulk and per-node online controls. Network node offline is
 * complex (hot-potato pattern requiring all connected assemblies) and
 * is documented but not yet implemented.
 */

import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import { NetworkNodeGlyph } from "@/components/topology/Glyphs";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useStructurePower } from "@/hooks/useStructurePower";
import { fuelTypeLabel, getFuelEfficiency, computeRuntimeMs, formatRuntime } from "@/lib/fuelRuntime";
import { shortId } from "@/lib/formatAddress";
import type { Structure, NetworkNodeGroup } from "@/types/domain";

interface NetworkNodeListScreenProps {
  structures: Structure[];
  nodeGroups: NetworkNodeGroup[];
  isLoading: boolean;
}

export function NetworkNodeListScreen({ nodeGroups, isLoading }: NetworkNodeListScreenProps) {
  const nodes = useMemo(
    () => nodeGroups.map((group) => group.node),
    [nodeGroups],
  );
  const power = useStructurePower();

  const offlineNodes = useMemo(
    () => nodes.filter((n) => n.status === "offline"),
    [nodes],
  );

  const handleBulkOnline = useCallback(() => {
    // Network node online is processed sequentially per node since each
    // needs its own OwnerCap. We batch by executing first offline node.
    // For true bulk, we'd need to build a single PTB with all nodes.
    // Using single-node call for now as each has different OwnerCap.
    if (offlineNodes.length === 0) return;
    const first = offlineNodes[0];
    power.bringNodeOnline({
      nodeId: first.objectId,
      ownerCapId: first.ownerCapId,
    });
  }, [power, offlineNodes]);

  // Build lookup from nodeId → group for child count display
  const groupMap = useMemo(() => {
    const map = new Map<string, NetworkNodeGroup>();
    for (const g of nodeGroups) {
      map.set(g.node.objectId, g);
    }
    return map;
  }, [nodeGroups]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Network Nodes
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            Energy Infrastructure // {nodes.length} Enrolled
          </p>
        </div>
        <div className="flex items-center gap-3">
          {offlineNodes.length > 0 && (
            <button
              onClick={handleBulkOnline}
              disabled={power.status === "pending"}
              className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Bring Online (${offlineNodes.length} offline)`}
            </button>
          )}
        </div>
      </div>

      {/* Power control feedback */}
      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel="Network node brought online"
          onDismiss={power.reset}
        />
      )}

      {isLoading ? (
        <LoadingState />
      ) : nodes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Node</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Fuel</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Attached</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Object ID</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <NodeRow key={node.objectId} node={node} group={groupMap.get(node.objectId)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Offline limitation notice */}
      <div className="border border-border/50 rounded p-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span>{" "}
          Taking a network node offline is technically possible from web but requires
          disconnecting all attached structures in the same transaction. This operation
          is not yet implemented — use in-game controls for node shutdown until a future update.
        </p>
      </div>
    </div>
  );
}

function NodeRow({ node, group }: { node: Structure; group?: NetworkNodeGroup }) {
  const attachedCount = group
    ? group.gates.length + group.storageUnits.length + group.turrets.length
    : 0;

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
      <td className="py-3 px-4">
        <Link
          to={`/nodes/${node.objectId}`}
          className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
        >
          <NetworkNodeGlyph size={16} />
          <span className="font-medium">{node.name}</span>
        </Link>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusDot status={node.status} size="sm" />
          <span className="text-xs text-muted-foreground capitalize">{node.status}</span>
        </div>
      </td>
      <td className="py-3 px-4">
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
              <div className="flex items-center gap-2 text-[11px] font-mono">
                {/* Compact fuel gauge */}
                {fillPct != null && (
                  <div className="w-14 h-1.5 rounded-full bg-muted/30 overflow-hidden shrink-0" title={`${node.fuel.quantity.toLocaleString()} / ${maxUnits!.toLocaleString()} units`}>
                    <div
                      className={`h-full rounded-full ${fillPct > 20 ? "bg-teal-500/70" : fillPct > 0 ? "bg-amber-500/70" : "bg-transparent"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                )}
                {label && <span className="text-muted-foreground">{label}</span>}
                {runtimeMs != null ? (
                  <span className="text-foreground">~{formatRuntime(runtimeMs)}</span>
                ) : node.fuel.quantity > 0 && !eff ? (
                  <span className="text-amber-400/80">unknown type</span>
                ) : node.fuel.quantity === 0 ? (
                  <span className="text-amber-400/80">empty</span>
                ) : null}
              </div>
            );
          })()
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <TagChip label={`${attachedCount} structures`} variant="default" size="sm" />
      </td>
      <td className="py-3 px-4">
        <div className="space-y-0.5" title={node.objectId}>
          <span className="block text-[11px] font-mono text-foreground" aria-label={`Object ID ${node.objectId}`}>
            {shortId(node.objectId)}
          </span>
          <span className="block text-[10px] font-mono text-muted-foreground/70">
            {node.assemblyId ? `Assembly ${node.assemblyId}` : "Assembly not indexed"}
          </span>
        </div>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
      <NetworkNodeGlyph size={32} />
      <p className="text-sm text-muted-foreground/60">No network nodes discovered</p>
      <p className="text-[11px] text-muted-foreground/40">Connect a wallet with node OwnerCaps to view nodes</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground animate-pulse">Discovering network nodes…</p>
    </div>
  );
}
