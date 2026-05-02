/**
 * Dashboard — Command Overview screen.
 *
 * Layout mirrors Figma guidance:
 *   1. Header with system-status pill
 *   2. 5-col metric grid (hero revenue col-span-2 + 3 supporting cards)
 *   3. Strategic Network topology panel
 *   4. Lower section: Recent Signals (2/3) + Attention Required (1/3)
 *   5. Spatial assignment panel
 *
 * Governance vocabulary: "Command Overview", "Gross Network Yield",
 * "Enforced Directives", "Telemetry Signals" per narrative spec.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Building2,
  Shield,
  Power,
  DollarSign,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { MetricCard } from "@/components/MetricCard";
import { PostureControl } from "@/components/PostureControl";
import { StrategicMapPanel } from "@/components/topology/StrategicMapPanel";
import { TopologyPanelFade, TopologyPanelFrame } from "@/components/topology/TopologyPanelFrame";
import { NodeDrilldownSurface } from "@/components/topology/node-drilldown/NodeDrilldownSurface";
import { NodeSelectionInspector } from "@/components/topology/node-drilldown/NodeSelectionInspector";
import { NodeStructureListPanel } from "@/components/topology/node-drilldown/NodeStructureListPanel";
import { SignalEventRow } from "@/components/SignalEventRow";
import { useSignalFeed } from "@/hooks/useSignalFeed";
import { formatLux, formatEve } from "@/lib/currency";
import { computeRuntimeMs, getFuelEfficiency, formatRuntime } from "@/lib/fuelRuntime";
import { buildLiveNodeLocalViewModel } from "@/lib/nodeDrilldownModel";
import type { NetworkNodeGroup, NetworkMetrics, SpatialPin, Structure } from "@/types/domain";

interface DashboardProps {
  nodeGroups: NetworkNodeGroup[];
  metrics: NetworkMetrics;
  pins: SpatialPin[];
  structures: Structure[];
  isLoading: boolean;
  isConnected: boolean;
}

export function Dashboard({
  nodeGroups,
  metrics,
  pins,
  structures,
  isLoading,
  isConnected,
}: DashboardProps) {
  const { walletAddress } = useConnection();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const ownedObjectIds = useMemo(
    () => structures.map((s) => s.objectId),
    [structures],
  );
  const [postureTransitioning, setPostureTransitioning] = useState(false);
  const handlePostureTransitionChange = useCallback((t: boolean) => setPostureTransitioning(t), []);
  const PREVIEW_COUNT = 6;
  const TRANSITION_DURATION_MS = 520;
  const { signals: recentSignals } = useSignalFeed({
    limit: 10,
    ownedObjectIds,
    walletAddress: walletAddress ?? null,
    aggressiveRefetch: postureTransitioning,
  });
  const revenueSignals = recentSignals.filter((s) => s.variant === "revenue");
  const totalRevenueBaseUnits = revenueSignals.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const totalRevenueLuxStr = formatLux(totalRevenueBaseUnits);
  const totalRevenueEveStr = formatEve(totalRevenueBaseUnits);
  const hasRevenue = totalRevenueBaseUnits > 0;
  const handleSelectNode = useCallback((nodeId: string) => setSelectedNodeId(nodeId), []);
  const selectedNodeGroup = useMemo(
    () => nodeGroups.find((group) => group.node.objectId === selectedNodeId) ?? null,
    [nodeGroups, selectedNodeId],
  );
  const selectedNodeViewModel = useMemo(
    () => (selectedNodeGroup ? buildLiveNodeLocalViewModel(selectedNodeGroup) : null),
    [selectedNodeGroup],
  );
  const handleExitNodeControl = useCallback(() => {
    setSelectedStructureId(null);
    setSelectedNodeId(null);
  }, []);
  const topologyModeKey = selectedNodeViewModel ? `node-${selectedNodeViewModel.node.id}` : "macro";
  const topologyTitle = selectedNodeViewModel ? "Node Control" : "Strategic Network";
  const topologySubtitle = selectedNodeViewModel
    ? `${selectedNodeViewModel.node.displayName} • Read-only local topology`
    : "Infrastructure Posture & Topology Control";
  const topologyHeaderAction = selectedNodeViewModel ? (
    <button
      type="button"
      onClick={handleExitNodeControl}
      className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      Back to Strategic Network
    </button>
  ) : (
    <div className="flex items-center justify-end">
      <PostureControl nodeGroups={nodeGroups} isConnected={isConnected} inline onTransitionChange={handlePostureTransitionChange} />
    </div>
  );

  useEffect(() => {
    setSelectedStructureId(null);
  }, [selectedNodeId]);

  useEffect(() => {
    if (selectedNodeId != null && selectedNodeGroup == null) {
      setSelectedStructureId(null);
      setSelectedNodeId(null);
    }
  }, [selectedNodeGroup, selectedNodeId]);

  useEffect(() => {
    if (selectedNodeViewModel == null) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }
      handleExitNodeControl();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExitNodeControl, selectedNodeViewModel]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Command Overview
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            Governed Infrastructure at a Glance
          </p>
        </div>

      </div>

      {/* Metric Cards — 5-column: hero revenue (span-2) + 3 supporting */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <div className="col-span-2">
          <MetricCard
            title="Gross Network Yield (24h)"
            value={hasRevenue ? totalRevenueLuxStr : "0"}
            variant="hero"
            unit="Lux"
            icon={<DollarSign className="w-4 h-4" />}
            secondaryLabel={hasRevenue ? `${totalRevenueEveStr} EVE • ${revenueSignals.length} revenue event${revenueSignals.length !== 1 ? "s" : ""}` : "Awaiting toll and trade events"}
          />
        </div>
        <MetricCard
          title="Active Structures"
          value={metrics.totalStructures}
          icon={<Building2 className="w-3.5 h-3.5" />}
          subtitle={`${metrics.gateCount} Gate${metrics.gateCount !== 1 ? "s" : ""} / ${metrics.governedGateCount} Governed / ${metrics.storageUnitCount} Post${metrics.storageUnitCount !== 1 ? "s" : ""} / ${metrics.networkNodeCount} Node${metrics.networkNodeCount !== 1 ? "s" : ""}`}
        />
        <MetricCard
          title="Grid Status"
          value={`${metrics.onlineCount}/${metrics.totalStructures}`}
          icon={<Power className="w-3.5 h-3.5" />}
          subtitle={metrics.onlineCount === metrics.totalStructures ? "All operational" : `${metrics.totalStructures - metrics.onlineCount} structure${metrics.totalStructures - metrics.onlineCount !== 1 ? "s" : ""} offline`}
        />
        <MetricCard
          title="Enforced Directives"
          value={metrics.enforcedDirectives}
          icon={<Shield className="w-3.5 h-3.5" />}
          subtitle="Active policies"
        />
      </div>

      {/* Strategic Network — Topology + Posture Command (integrated) */}
      <div className="mt-5">
        <TopologyPanelFrame
          title={topologyTitle}
          subtitle={topologySubtitle}
          headerAction={topologyHeaderAction}
          headerActionClassName={selectedNodeViewModel ? "flex w-[240px] justify-end" : "flex justify-end whitespace-nowrap"}
          bodyClassName="select-none"
        >
          <TopologyPanelFade contentKey={topologyModeKey} durationMs={TRANSITION_DURATION_MS}>
            {selectedNodeViewModel ? (
              <NodeDrilldownSurface
                embedded
                viewModel={selectedNodeViewModel}
                selectedStructureId={selectedStructureId}
                onSelectStructure={setSelectedStructureId}
                title=""
                subtitle=""
              />
            ) : (
              <StrategicMapPanel
                embedded
                nodeGroups={nodeGroups}
                pins={pins}
                structures={structures}
                isConnected={isConnected}
                signals={recentSignals}
                onPostureTransitionChange={handlePostureTransitionChange}
                onSelectNode={handleSelectNode}
                selectedNodeId={selectedNodeId}
              />
            )}
          </TopologyPanelFade>
        </TopologyPanelFrame>
      </div>

      {/* Lower section: Recent Signals + Attention Required */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardPanelFrame
            title={selectedNodeViewModel ? `Attached Structures (${selectedNodeViewModel.structures.length})` : "Recent Telemetry Signals"}
            subtitle={selectedNodeViewModel ? "Read-only structure index" : "Signal feed across governed infrastructure"}
            headerAction={selectedNodeViewModel ? undefined : (
              <Link
                to="/activity"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                View Log →
              </Link>
            )}
          >
            <TopologyPanelFade contentKey={`lower-left-${topologyModeKey}`} durationMs={TRANSITION_DURATION_MS} className="h-auto">
              {selectedNodeViewModel ? (
                <NodeStructureListPanel
                  embedded
                  viewModel={selectedNodeViewModel}
                  selectedStructureId={selectedStructureId}
                  onSelectStructure={setSelectedStructureId}
                />
              ) : (
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
                  {recentSignals.length > 0 ? (
                    recentSignals.slice(0, PREVIEW_COUNT).map((signal) => (
                      <SignalEventRow key={signal.id} signal={signal} />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground/60">
                        {isConnected ? "No telemetry for your infrastructure" : "Connect wallet to view telemetry"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/40">
                        {isConnected
                          ? "Events from your gates, trade posts, and turrets will appear here"
                          : "Signal Feed shows activity from your governed infrastructure"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TopologyPanelFade>
          </DashboardPanelFrame>
        </div>

        <div>
          <DashboardPanelFrame
            title={selectedNodeViewModel ? "Selection Inspector" : "Attention Required"}
            subtitle={selectedNodeViewModel ? "Placeholder for later controls" : "Operational risks requiring review"}
          >
            <TopologyPanelFade contentKey={`lower-right-${topologyModeKey}`} durationMs={TRANSITION_DURATION_MS} className="h-auto">
              {selectedNodeViewModel ? (
                <NodeSelectionInspector
                  embedded
                  viewModel={selectedNodeViewModel}
                  selectedStructureId={selectedStructureId}
                />
              ) : (
                <div className="divide-y divide-border/50">
                  <AttentionAlerts metrics={metrics} structures={structures} />
                </div>
              )}
            </TopologyPanelFade>
          </DashboardPanelFrame>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground animate-pulse">
            Resolving chain state…
          </p>
        </div>
      )}
    </div>
  );
}

/** Computed alerts from real data instead of static placeholders. */
function AttentionAlerts({ metrics, structures }: { metrics: NetworkMetrics; structures: Structure[] }) {
  const offlineCount = metrics.totalStructures - metrics.onlineCount;
  const noExtCount = structures.filter(
    (s) => (s.type === "gate" || s.type === "turret") && s.extensionStatus !== "authorized",
  ).length;

  const alerts: { icon: React.ReactNode; name: string; issue: string; severity: "critical" | "warning" | "info"; to?: string }[] = [];

  if (offlineCount > 0) {
    alerts.push({
      icon: <Power className="w-3.5 h-3.5" />,
      name: "Offline Structures",
      issue: `${offlineCount} structure${offlineCount !== 1 ? "s" : ""} offline`,
      severity: "critical",
    });
  }

  if (noExtCount > 0) {
    alerts.push({
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      name: "Extension Gaps",
      issue: `${noExtCount} structure${noExtCount !== 1 ? "s" : ""} without authorized extension`,
      severity: "warning",
      to: "/gates",
    });
  }

  // Low-fuel: network nodes with < 24h runtime remaining
  const LOW_RUNTIME_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const nodes = structures.filter((s) => s.type === "network_node" && s.fuel?.isBurning);
  const lowFuelNodes = nodes.filter((s) => {
    const fuel = s.fuel!;
    const eff = getFuelEfficiency(fuel.typeId);
    if (eff === undefined) return false;
    const runtimeMs = computeRuntimeMs(fuel.quantity, fuel.burnRateMs, eff);
    return runtimeMs !== undefined && runtimeMs < LOW_RUNTIME_THRESHOLD_MS;
  });

  if (lowFuelNodes.length > 0) {
    // Show shortest runtime for urgency context
    const shortestMs = lowFuelNodes.reduce((min, s) => {
      const fuel = s.fuel!;
      const eff = getFuelEfficiency(fuel.typeId);
      if (eff === undefined) return min;
      const rt = computeRuntimeMs(fuel.quantity, fuel.burnRateMs, eff) ?? Infinity;
      return rt < min ? rt : min;
    }, Infinity);

    alerts.push({
      icon: <Flame className="w-3.5 h-3.5" />,
      name: "Low Fuel",
      issue: `${lowFuelNodes.length} node${lowFuelNodes.length !== 1 ? "s" : ""} under 24h — shortest ${formatRuntime(shortestMs)}`,
      severity: "warning",
      to: "/nodes",
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-muted-foreground/60">All clear</p>
        <p className="text-[11px] text-muted-foreground/40 mt-1">No issues detected</p>
      </div>
    );
  }

  return (
    <>
      {alerts.map((a) => {
        const severityColor = {
          critical: "text-destructive",
          warning: "text-primary",
          info: "text-muted-foreground",
        }[a.severity];

        const content = (
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors group">
            <div className={`${severityColor} shrink-0`}>{a.icon}</div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {a.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {a.issue}
            </span>
          </div>
        );

        return a.to ? (
          <Link key={a.name} to={a.to}>{content}</Link>
        ) : (
          <div key={a.name}>{content}</div>
        );
      })}
    </>
  );
}
