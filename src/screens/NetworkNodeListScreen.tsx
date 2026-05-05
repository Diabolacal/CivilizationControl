/**
 * NetworkNodeListScreen — Overview of all network nodes under governance.
 *
 * Displays nodes with status, fuel level, attached structure counts,
 * and node-specific governance actions.
 */

import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import { NetworkNodeGlyph } from "@/components/topology/Glyphs";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useStructureSurfaceActions } from "@/hooks/useStructureSurfaceActions";
import { buildFuelPresentation, type FuelSeverity } from "@/lib/fuelRuntime";
import type { NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import { shortId } from "@/lib/formatAddress";
import type { Structure, NetworkNodeGroup } from "@/types/domain";

const FUEL_BAR_CLASS_BY_SEVERITY: Record<FuelSeverity, string> = {
  critical: "bg-red-500/80",
  low: "bg-amber-500/80",
  normal: "bg-teal-500/70",
  partial: "bg-muted-foreground/45",
  unavailable: "bg-transparent",
};

const FUEL_VALUE_CLASS_BY_SEVERITY: Record<FuelSeverity, string> = {
  critical: "text-red-400",
  low: "text-amber-400",
  normal: "text-foreground",
  partial: "text-muted-foreground",
  unavailable: "text-muted-foreground",
};

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
  const operatorInventory = useOperatorInventory();
  const actions = useStructureSurfaceActions();

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
    actions.power.bringNodeOnline({
      nodeId: first.objectId,
      ownerCapId: first.ownerCapId,
    }, { refetchSignalFeed: true });
  }, [actions.power, offlineNodes]);

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
              disabled={actions.power.status === "pending"}
              className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actions.power.status === "pending"
                ? "Executing…"
                : `Bring Online (${offlineNodes.length} offline)`}
            </button>
          )}
        </div>
      </div>

      {/* Power control feedback */}
      {(actions.power.status === "success" || actions.power.status === "error") && (
        <TxFeedbackBanner
          status={actions.power.status}
          result={actions.power.result}
          error={actions.power.error}
          successLabel={actions.powerSuccessLabel}
          onDismiss={actions.dismissPowerFeedback}
        />
      )}

      {(actions.rename.status === "success" || actions.rename.status === "error") && (
        <TxFeedbackBanner
          status={actions.rename.status}
          result={actions.rename.result}
          error={actions.rename.error}
          successLabel={actions.renameSuccessLabel}
          onDismiss={actions.dismissRenameFeedback}
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
                <NodeRow
                  key={node.objectId}
                  node={node}
                  group={groupMap.get(node.objectId)}
                  nodeLookup={operatorInventory.adapted?.nodeLookupsByNodeId.get(node.objectId) ?? null}
                  onOpenStructureMenu={actions.openStructureContextMenu}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actions.renderContextMenu}
      {actions.renderRenameDialog}
      {actions.renderPowerConfirmDialog}
    </div>
  );
}

function NodeRow({
  node,
  group,
  nodeLookup,
  onOpenStructureMenu,
}: {
  node: Structure;
  group?: NetworkNodeGroup;
  nodeLookup: NodeAssembliesLookupResult | null;
  onOpenStructureMenu: (
    structure: Structure,
    clientX: number,
    clientY: number,
    options?: { nodeOfflineLookup?: NodeAssembliesLookupResult | null },
  ) => void;
}) {
  const attachedCount = group
    ? group.gates.length + group.storageUnits.length + group.turrets.length
    : 0;
  const fuelPresentation = buildFuelPresentation(node);
  const primaryFuelLabel = fuelPresentation.runtimeLabel
    ? `~${fuelPresentation.runtimeLabel}`
    : fuelPresentation.amountLabel;

  return (
    <tr
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpenStructureMenu(node, event.clientX, event.clientY, { nodeOfflineLookup: nodeLookup });
      }}
      className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
    >
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
        {fuelPresentation.source !== "none" ? (
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {fuelPresentation.fillPercent != null ? (
              <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted/30" title={fuelPresentation.amountLabel ?? undefined}>
                <div
                  className={`h-full rounded-full ${FUEL_BAR_CLASS_BY_SEVERITY[fuelPresentation.severity]}`}
                  style={{ width: `${fuelPresentation.fillPercent}%` }}
                />
              </div>
            ) : null}
            {fuelPresentation.typeLabel ? (
              <span className="text-muted-foreground">{fuelPresentation.typeLabel}</span>
            ) : null}
            {primaryFuelLabel ? (
              <span className={FUEL_VALUE_CLASS_BY_SEVERITY[fuelPresentation.severity]}>{primaryFuelLabel}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
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
