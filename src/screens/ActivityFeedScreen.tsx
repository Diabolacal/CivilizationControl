/**
 * ActivityFeedScreen — Signal Feed for governance events.
 *
 * Queries both gate_control and trade_post modules via useSignalFeed,
 * renders parsed SignalEvents with category filtering.
 */

import { useState, useMemo } from "react";
import { Radio } from "lucide-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useSignalFeed } from "@/hooks/useSignalFeed";
import { useAssetDiscovery } from "@/hooks/useAssetDiscovery";
import { SignalEventRow } from "@/components/SignalEventRow";
import { SIGNAL_CATEGORIES } from "@/lib/eventParser";
import type { SignalCategory } from "@/types/domain";
import { cn } from "@/lib/utils";

export function ActivityFeedScreen() {
  const [activeCategory, setActiveCategory] = useState<SignalCategory | "all">("all");
  const { walletAddress } = useConnection();
  const { structures } = useAssetDiscovery();
  const ownedObjectIds = useMemo(
    () => structures.map((s) => s.objectId),
    [structures],
  );
  const { signals, isLoading, isError, refetch } = useSignalFeed({
    limit: 50,
    category: activeCategory,
    ownedObjectIds,
    walletAddress: walletAddress ?? null,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Signal Feed</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide mt-1">
            Governed Infrastructure // Telemetry Log
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs font-medium text-muted-foreground hover:text-primary border border-border px-3 py-1.5 rounded transition-colors"
        >
          Refresh
        </button>
      </header>

      {/* Category Filters */}
      <div className="flex gap-2">
        {SIGNAL_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "text-xs font-mono px-3 py-1.5 rounded border transition-colors",
              activeCategory === cat.value
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      {isLoading && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground animate-pulse">
            Querying chain events…
          </p>
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-sm text-destructive">
            Failed to query events. Check RPC connectivity.
          </p>
        </div>
      )}

      {!isLoading && !isError && signals.length === 0 && (
        <section className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
          <Radio className="w-6 h-6 text-muted-foreground/30" />
          {!walletAddress ? (
            <>
              <p className="text-sm text-muted-foreground/60">
                Connect wallet to view telemetry
              </p>
              <p className="text-[11px] text-muted-foreground/40 max-w-[36ch] text-center">
                Signal Feed shows activity from your governed infrastructure
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground/60">
                No telemetry for your infrastructure
              </p>
              <p className="text-[11px] text-muted-foreground/40 max-w-[36ch] text-center">
                Events from your gates, storage structures, and turrets will appear here
              </p>
            </>
          )}
        </section>
      )}

      {!isLoading && signals.length > 0 && (
        <section className="bg-[var(--card)] border border-border rounded overflow-hidden divide-y divide-border/50">
          {signals.map((signal) => (
            <SignalEventRow key={signal.id} signal={signal} />
          ))}
        </section>
      )}

      {/* Summary bar */}
      {!isLoading && signals.length > 0 && (
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground/60 px-1">
          <span>{signals.length} signal{signals.length !== 1 ? "s" : ""}</span>
          <span>Polling every 30s</span>
        </div>
      )}
    </div>
  );
}
