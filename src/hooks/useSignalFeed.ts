/**
 * useSignalFeed — TanStack Query hook for CivilizationControl event polling.
 *
 * Polls both gate_control and trade_post modules for recent events,
 * parses them into SignalEvents, and exposes cache invalidation.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchRecentEvents } from "@/lib/suiReader";
import { parseChainEvents } from "@/lib/eventParser";
import type { RawSuiEvent } from "@/lib/eventParser";
import type { SignalCategory, SignalEvent } from "@/types/domain";

const SIGNAL_FEED_KEY = "signalFeed";
const POLL_INTERVAL_MS = 30_000;

interface UseSignalFeedOptions {
  /** Max events per module to fetch. Default: 25. */
  limit?: number;
  /** Filter by category. Default: all. */
  category?: SignalCategory | "all";
  /** Enable auto-polling. Default: true. */
  polling?: boolean;
}

export function useSignalFeed(options: UseSignalFeedOptions = {}) {
  const { limit = 25, category = "all", polling = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery<SignalEvent[]>({
    queryKey: [SIGNAL_FEED_KEY, limit],
    queryFn: async () => {
      const rawEvents = await fetchRecentEvents(limit);
      return parseChainEvents(rawEvents as RawSuiEvent[]);
    },
    staleTime: 15_000,
    refetchInterval: polling ? POLL_INTERVAL_MS : false,
  });

  const signals = category === "all"
    ? data ?? []
    : (data ?? []).filter((s) => s.category === category);

  return { signals, isLoading, isError, error, refetch };
}

/** Returns a function to invalidate the signal feed cache (call after mutations). */
export function useInvalidateSignals() {
  const client = useQueryClient();
  return useCallback(
    () => client.invalidateQueries({ queryKey: [SIGNAL_FEED_KEY] }),
    [client],
  );
}
