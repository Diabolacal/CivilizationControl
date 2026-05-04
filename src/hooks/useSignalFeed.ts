/**
 * useSignalFeed — compatibility hook for the wallet-scoped shared Signal Feed.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { SIGNAL_FEED_QUERY_KEY, useSignalHistory } from "@/hooks/useSignalHistory";
import type { SignalCategory, SignalEvent } from "@/types/domain";

const POLL_INTERVAL_MS = 30_000;
const FAST_POLL_INTERVAL_MS = 4_000;
const DEFAULT_LIMIT = 50;

interface UseSignalFeedOptions {
  limit?: number;
  category?: SignalCategory | "all";
  polling?: boolean;
  /** @deprecated Signal history is wallet-scoped server side. */
  ownedObjectIds?: string[];
  walletAddress?: string | null;
  aggressiveRefetch?: boolean;
}

export function useSignalFeed(options: UseSignalFeedOptions = {}) {
  const { category = "all", polling = true, walletAddress, aggressiveRefetch = false } = options;
  const history = useSignalHistory({
    walletAddress,
    limit: options.limit ?? DEFAULT_LIMIT,
    categories: category === "all" ? undefined : [category],
    pollingMs: polling ? (aggressiveRefetch ? FAST_POLL_INTERVAL_MS : POLL_INTERVAL_MS) : false,
  });

  return {
    signals: history.signals as SignalEvent[],
    isLoading: history.isLoading,
    isError: history.isError,
    error: history.error,
    refetch: history.refetch,
    partial: history.partial,
    warnings: history.warnings,
  };
}

/** Returns a function to invalidate the signal feed cache (call after mutations). */
export function useInvalidateSignals() {
  const client = useQueryClient();
  return useCallback(
    () => client.invalidateQueries({ queryKey: [SIGNAL_FEED_QUERY_KEY] }),
    [client],
  );
}
