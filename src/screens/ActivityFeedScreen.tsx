import { useState } from "react";
import { Radio } from "lucide-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { SignalEventRow } from "@/components/SignalEventRow";
import { SignalFeedCategoryBar } from "@/components/signal-feed/SignalFeedCategoryBar";
import { useSignalHistory } from "@/hooks/useSignalHistory";
import { getSignalHistoryErrorMessage } from "@/lib/signalHistoryClient";
import type { SignalCategory } from "@/types/domain";

const PAGE_SIZE = 25;

export function ActivityFeedScreen() {
  const { walletAddress } = useConnection();
  const [selectedCategory, setSelectedCategory] = useState<SignalCategory | "all">("all");
  const signalHistory = useSignalHistory({
    walletAddress: walletAddress ?? null,
    limit: PAGE_SIZE,
    categories: selectedCategory === "all" ? undefined : [selectedCategory],
  });
  const isDisconnected = !walletAddress;
  const isEmpty = !signalHistory.isLoading && !signalHistory.isError && signalHistory.signals.length === 0;
  const shouldShowIndexingHint = !isDisconnected && (signalHistory.partial || signalHistory.warnings.length > 0);

  const heading = signalHistory.isError
    ? getSignalHistoryErrorMessage(signalHistory.error)
    : isDisconnected
      ? "Connect wallet to restore operator context"
      : "No signals for your governed infrastructure";

  const detail = signalHistory.isError
    ? "Recent signals return automatically once the feed responds again."
    : isDisconnected
      ? "Signal Feed appears here once your command wallet is connected."
      : "Recent status, governance, trade, and transit signals appear here as they index for your governed infrastructure.";

  return (
    <div className="space-y-6">
      <header className="border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Signal Feed</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide mt-1">
            Governed Infrastructure // Telemetry Log
          </p>
        </div>
      </header>

      <SignalFeedCategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        disabled={isDisconnected}
      />

      {shouldShowIndexingHint ? (
        <p className="text-[11px] text-muted-foreground/50">
          Some recent signals may still be indexing.
        </p>
      ) : null}

      <section className="overflow-hidden rounded border border-border/60 bg-card/40">
        {signalHistory.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Radio className="h-6 w-6 animate-pulse text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/70">Resolving Signal Feed</p>
            <p className="text-[11px] text-muted-foreground/45 max-w-[44ch]">
              Recent signals are loading for your governed infrastructure.
            </p>
          </div>
        ) : isEmpty || signalHistory.isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Radio className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/70">{heading}</p>
            <p className="text-[11px] text-muted-foreground/45 max-w-[44ch]">
              {detail}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {signalHistory.signals.map((signal) => (
              <SignalEventRow key={signal.id} signal={signal} />
            ))}
          </div>
        )}

        {signalHistory.hasNextPage && signalHistory.signals.length > 0 ? (
          <div className="border-t border-border/50 px-4 py-3">
            <button
              type="button"
              disabled={signalHistory.isLoadingMore}
              onClick={() => void signalHistory.loadMore()}
              className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/50 disabled:text-muted-foreground/40"
            >
              {signalHistory.isLoadingMore ? "Loading more" : "Load more"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
