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

import { useMemo } from "react";
import { Link } from "react-router";
import {
  Building2,
  Shield,
  Power,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { MetricCard } from "@/components/MetricCard";
import { StrategicMapPanel } from "@/components/topology/StrategicMapPanel";
import { SignalEventRow } from "@/components/SignalEventRow";
import { useSignalFeed } from "@/hooks/useSignalFeed";
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
  const ownedObjectIds = useMemo(
    () => structures.map((s) => s.objectId),
    [structures],
  );
  const PREVIEW_COUNT = 6;
  const { signals: recentSignals } = useSignalFeed({
    limit: 10,
    ownedObjectIds,
    walletAddress: walletAddress ?? null,
  });
  const revenueSignals = recentSignals.filter((s) => s.variant === "revenue");
  const totalRevenueBaseUnits = revenueSignals.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const totalRevenueLux = totalRevenueBaseUnits / 10_000_000;

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
            value={totalRevenueLux > 0 ? totalRevenueLux.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"}
            variant="hero"
            unit="Lux"
            icon={<DollarSign className="w-4 h-4" />}
            secondaryLabel={totalRevenueLux > 0 ? `${revenueSignals.length} revenue event${revenueSignals.length !== 1 ? "s" : ""}` : "Awaiting toll and trade events"}
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
        <StrategicMapPanel nodeGroups={nodeGroups} pins={pins} structures={structures} isConnected={isConnected} />
      </div>

      {/* Lower section: Recent Signals + Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Recent Telemetry Signals (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2.5">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
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
              recentSignals.slice(0, PREVIEW_COUNT).map((signal) => (
                <SignalEventRow key={signal.id} signal={signal} />
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground/60">
                  No signals yet
                </p>
                <p className="text-[11px] text-muted-foreground/40 mt-1">
                  Deploy policies to begin governing your infrastructure
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attention Required (1/3 width) */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2.5">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
              Attention Required
            </h2>
          </div>
          <div className="bg-[var(--card)] border border-border rounded overflow-hidden divide-y divide-border/50">
            <AttentionAlerts metrics={metrics} structures={structures} />
          </div>
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
