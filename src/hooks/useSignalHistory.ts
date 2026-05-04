import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  fetchSignalHistory,
  normalizeSignalHistoryCategories,
  normalizeSignalHistoryLimit,
  normalizeSignalHistoryWalletAddress,
} from "@/lib/signalHistoryClient";
import type { SignalEvent } from "@/types/domain";
import type { SignalHistoryCategory } from "@/types/signalHistory";

export const SIGNAL_FEED_QUERY_KEY = "signalFeed";

interface UseSignalHistoryOptions {
  walletAddress?: string | null;
  limit?: number;
  categories?: SignalHistoryCategory[];
  cursor?: string | null;
  networkNodeId?: string | null;
  structureId?: string | null;
  since?: string | null;
  enabled?: boolean;
  pollingMs?: number | false;
}

export function useSignalHistory(options: UseSignalHistoryOptions = {}) {
  const normalizedWalletAddress = normalizeSignalHistoryWalletAddress(options.walletAddress);
  const normalizedLimit = normalizeSignalHistoryLimit(options.limit);
  const normalizedCategories = useMemo(
    () => normalizeSignalHistoryCategories(options.categories),
    [options.categories],
  );

  const query = useInfiniteQuery({
    queryKey: [
      SIGNAL_FEED_QUERY_KEY,
      normalizedWalletAddress,
      normalizedLimit,
      normalizedCategories.join(","),
      options.networkNodeId ?? null,
      options.structureId ?? null,
      options.since ?? null,
    ],
    queryFn: ({ pageParam }) => fetchSignalHistory({
      walletAddress: normalizedWalletAddress!,
      limit: normalizedLimit,
      categories: normalizedCategories,
      cursor: typeof pageParam === "string" ? pageParam : options.cursor,
      networkNodeId: options.networkNodeId,
      structureId: options.structureId,
      since: options.since,
    }),
    enabled: Boolean((options.enabled ?? true) && normalizedWalletAddress),
    initialPageParam: options.cursor ?? null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: normalizedWalletAddress && options.pollingMs ? options.pollingMs : false,
    retry: false,
  });

  const pages = query.data?.pages ?? [];
  const signals = useMemo<SignalEvent[]>(
    () => pages.flatMap((page) => page.signals),
    [pages],
  );
  const warnings = useMemo(
    () => Array.from(new Set(pages.flatMap((page) => page.warnings))),
    [pages],
  );
  const lastPage = pages.length > 0 ? pages[pages.length - 1] : null;
  const firstPage = pages[0] ?? null;

  return {
    ...query,
    walletAddress: normalizedWalletAddress,
    signals,
    pages,
    warnings,
    partial: pages.some((page) => page.partial),
    nextCursor: lastPage?.nextCursor ?? null,
    source: firstPage?.source ?? null,
    fetchedAt: firstPage?.fetchedAt ?? null,
    operator: firstPage?.operator ?? null,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
  };
}