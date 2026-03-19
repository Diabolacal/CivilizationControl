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

import { Link } from "react-router";
import {
  Building2,
  Shield,
  Power,
  DollarSign,
  AlertTriangle,
  Fuel,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PostureControl } from "@/components/PostureControl";
import { StrategicMapPanel } from "@/components/topology/StrategicMapPanel";
import { NodeLocationPanel } from "@/components/NodeLocationPanel";
import { SignalEventRow } from "@/components/SignalEventRow";
import { useSignalFeed } from "@/hooks/useSignalFeed";
import type { NetworkNodeGroup, NetworkMetrics, SpatialPin, ObjectId, PlayerProfile } from "@/types/domain";

interface DashboardProps {
  nodeGroups: NetworkNodeGroup[];
  metrics: NetworkMetrics;
  pins: SpatialPin[];
  isLoading: boolean;
  isConnected: boolean;
  profile: PlayerProfile | null;
  onAssignPin: (nodeId: ObjectId, systemId: number, systemName: string) => void;
  onRemovePin: (nodeId: ObjectId) => void;
}

export function Dashboard({
  nodeGroups,
  metrics,
  pins,
  isLoading,
  isConnected,
  profile,
  onAssignPin,
  onRemovePin,
}: DashboardProps) {
  const { signals: recentSignals } = useSignalFeed({ limit: 5 });
  const revenueSignals = recentSignals.filter((s) => s.variant === "revenue");
  const totalRevenueBaseUnits = revenueSignals.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const totalRevenueLux = totalRevenueBaseUnits / 10_000_000;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Command Overview
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            {profile
              ? `${profile.characterName || "Commander"} // Node Status`
              : "Governed Infrastructure // Node Status"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <div className="text-xs font-medium text-muted-foreground bg-muted/20 border border-border px-3 py-1.5 rounded">
              Wallet Disconnected
            </div>
          )}
          {isConnected && isLoading && (
            <div className="text-xs font-medium text-muted-foreground bg-muted/20 border border-border px-3 py-1.5 rounded animate-pulse">
              Resolving…
            </div>
          )}
          {isConnected && !isLoading && metrics.totalStructures > 0 && (
            <div className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
              System Active
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards — 5-column: hero revenue (span-2) + 3 supporting */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-2">
          <MetricCard
            title="Gross Network Yield (24h)"
            value={totalRevenueLux > 0 ? totalRevenueLux.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
            variant="hero"
            unit="Lux"
            icon={<DollarSign className="w-4 h-4" />}
            secondaryLabel={totalRevenueLux > 0 ? `${revenueSignals.length} revenue event${revenueSignals.length !== 1 ? "s" : ""}` : "Revenue from tolls and trades"}
          />
        </div>
        <MetricCard
          title="Active Structures"
          value={metrics.totalStructures}
          icon={<Building2 className="w-3.5 h-3.5" />}
          subtitle={`${metrics.gateCount} Gate${metrics.gateCount !== 1 ? "s" : ""} / ${metrics.storageUnitCount} Post${metrics.storageUnitCount !== 1 ? "s" : ""} / ${metrics.networkNodeCount} Node${metrics.networkNodeCount !== 1 ? "s" : ""}`}
        />
        <MetricCard
          title="Grid Status"
          value={`${metrics.onlineCount}/${metrics.totalStructures}`}
          icon={<Power className="w-3.5 h-3.5" />}
          subtitle="Online / Deployed"
        />
        <MetricCard
          title="Enforced Directives"
          value={metrics.enforcedDirectives}
          icon={<Shield className="w-3.5 h-3.5" />}
          subtitle="Active policies"
        />
      </div>

      {/* Network Posture Command */}
      <PostureControl nodeGroups={nodeGroups} isConnected={isConnected} />

      {/* Strategic Network Map */}
      <StrategicMapPanel nodeGroups={nodeGroups} pins={pins} />

      {/* Lower section: Recent Signals + Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Telemetry Signals (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">
              Recent Telemetry Signals
            </h2>
            <Link
              to="/activity"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              View Log →
            </Link>
          </div>
          <div className="bg-[var(--card)] border border-border rounded overflow-hidden divide-y divide-border/50">
            {recentSignals.length > 0 ? (
              recentSignals.map((signal) => (
                <SignalEventRow key={signal.id} signal={signal} />
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground/60">
                  No recent signals
                </p>
                <p className="text-[11px] text-muted-foreground/40 mt-1">
                  Events will appear after GateControl or TradePost transactions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attention Required (1/3 width) */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">
              Attention Required
            </h2>
          </div>
          <div className="bg-[var(--card)] border border-border rounded overflow-hidden divide-y divide-border/50">
            {metrics.totalStructures - metrics.onlineCount > 0 ? (
              <AlertRow
                icon={<Power className="w-3.5 h-3.5" />}
                name="Offline Structures"
                issue={`${metrics.totalStructures - metrics.onlineCount} structure${metrics.totalStructures - metrics.onlineCount !== 1 ? "s" : ""} offline`}
                severity="critical"
              />
            ) : null}
            <AlertRow
              icon={<Fuel className="w-3.5 h-3.5" />}
              name="Fuel Monitor"
              issue="Fuel telemetry pending"
              severity="info"
            />
            <AlertRow
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              name="Policy Gaps"
              issue="Extension audit pending"
              severity="info"
            />
          </div>
        </div>
      </div>

      {/* Node Location Assignment */}
      <NodeLocationPanel
        nodeGroups={nodeGroups}
        pins={pins}
        onAssignPin={onAssignPin}
        onRemovePin={onRemovePin}
      />

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

/** Alert row for Attention Required section */
function AlertRow({
  icon,
  name,
  issue,
  severity,
}: {
  icon: React.ReactNode;
  name: string;
  issue: string;
  severity: "critical" | "warning" | "info";
}) {
  const severityColor = {
    critical: "text-destructive",
    warning: "text-primary",
    info: "text-muted-foreground",
  }[severity];

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/10 transition-colors group">
      <div className={`${severityColor} mt-0.5`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate mb-0.5">
          {name}
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {issue}
        </div>
      </div>
    </div>
  );
}
