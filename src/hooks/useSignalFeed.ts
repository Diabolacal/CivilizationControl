/**
 * useSignalFeed — TanStack Query hook for CivilizationControl event polling.
 *
 * Polls gate_control, trade_post, posture, turret, and world modules for
 * recent events, parses into SignalEvents, and scopes to owned infrastructure.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { fetchRecentEvents } from "@/lib/suiReader";
import { parseChainEvents } from "@/lib/eventParser";
import { foldPostureSignals } from "@/lib/signalFolder";
import type { RawSuiEvent } from "@/lib/eventParser";
import type { SignalCategory, SignalEvent } from "@/types/domain";

const SIGNAL_FEED_KEY = "signalFeed";
const POLL_INTERVAL_MS = 30_000;
const FAST_POLL_INTERVAL_MS = 4_000;
/** Fixed per-module fetch limit — shared by all consumers for cache consistency. */
const FETCH_LIMIT = 50;

interface UseSignalFeedOptions {
  /** @deprecated Ignored — fetch limit is fixed internally for cache consistency. */
  limit?: number;
  /** Filter by category. Default: all. */
  category?: SignalCategory | "all";
  /** Enable auto-polling. Default: true. */
  polling?: boolean;
  /** Owned structure object IDs — events are scoped to these. */
  ownedObjectIds?: string[];
  /** Connected wallet address — fallback scope for sender-based events. */
  walletAddress?: string | null;
  /** Poll at accelerated cadence (4s) during posture transitions. */
  aggressiveRefetch?: boolean;
}

export function useSignalFeed(options: UseSignalFeedOptions = {}) {
  const { category = "all", polling = true, ownedObjectIds, walletAddress, aggressiveRefetch = false } = options;

  const ownedSet = useMemo(
    () => (ownedObjectIds ? new Set(ownedObjectIds) : null),
    [ownedObjectIds],
  );

  const { data, isLoading, isError, error, refetch } = useQuery<SignalEvent[]>({
    queryKey: [SIGNAL_FEED_KEY],
    queryFn: async () => {
      const rawEvents = await fetchRecentEvents(FETCH_LIMIT);
      const parsed = parseChainEvents(rawEvents as RawSuiEvent[]);
      return foldPostureSignals(parsed);
    },
    staleTime: aggressiveRefetch ? 2_000 : 15_000,
    refetchInterval: polling
      ? (aggressiveRefetch ? FAST_POLL_INTERVAL_MS : POLL_INTERVAL_MS)
      : false,
  });

  const allSignals = data ?? [];

  // Scope to owned infrastructure when ownership data is available
  const scopedSignals = useMemo(() => {
    if (!ownedSet || ownedSet.size === 0) return allSignals;
    return allSignals.filter((s) => {
      if (s.relatedObjectId && ownedSet.has(s.relatedObjectId)) return true;
      if (s.secondaryObjectId && ownedSet.has(s.secondaryObjectId)) return true;
      if (s.ownerAddress && walletAddress && s.ownerAddress === walletAddress) return true;
      if (s.sender && walletAddress && s.sender === walletAddress) return true;
      return false;
    });
  }, [allSignals, ownedSet, walletAddress]);

  const signals = category === "all"
    ? scopedSignals
    : scopedSignals.filter((s) => s.category === category);

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
