/**
 * Hook: background tribe catalog refresh from the Utopia World API.
 *
 * Fire-and-forget — runs once per mount, no loading chrome.
 * On success, merges fresh data into the in-memory catalog via
 * mergeFreshTribes(), which notifies any subscribed hooks.
 *
 * If the API is unreachable the bundled snapshot keeps working.
 */

import { useQuery } from "@tanstack/react-query";
import { mergeFreshTribes } from "@/lib/tribeCatalog";
import type { Tribe } from "@/types/domain";

const API_BASE =
  "https://world-api-utopia.uat.pub.evefrontier.com/v2/tribes";
const PAGE_SIZE = 500;

interface ApiResponse {
  data?: { id: number; name?: string; nameShort?: string }[];
}

async function fetchAllTribes(): Promise<Tribe[]> {
  const all: Tribe[] = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}`);
    if (!res.ok) throw new Error(`Tribes API ${res.status}`);
    const body: ApiResponse = await res.json();
    const rows = body.data ?? [];
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const r of rows) {
      all.push({
        tribeId: r.id,
        name: r.name ?? "",
        nameShort: r.nameShort ?? "",
      });
    }
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export function useTribesRefresh() {
  useQuery<Tribe[]>({
    queryKey: ["tribes-refresh"],
    queryFn: async () => {
      const fresh = await fetchAllTribes();
      mergeFreshTribes(fresh);
      return fresh;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
