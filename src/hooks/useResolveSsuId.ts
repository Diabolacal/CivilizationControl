/**
 * useResolveSsuId — Resolves the target SSU Sui object ID.
 *
 * Priority:
 *   1. URL path param /ssu/:ssuId  →  direct Sui object ID
 *   2. Query params ?itemId=&tenant= →  derived via ObjectRegistry
 *   3. Neither present               →  unresolved (error state)
 */

import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { resolveItemIdToObjectId } from "@/lib/objectResolver";

export type SsuIdSource = "url-param" | "query-context" | "none";

export interface ResolvedSsuId {
  ssuId: string | undefined;
  source: SsuIdSource;
  error: string | null;
}

const DEFAULT_TENANT = "stillness";

export function useResolveSsuId(): ResolvedSsuId {
  const { ssuId: paramSsuId } = useParams<{ ssuId: string }>();
  const [searchParams] = useSearchParams();

  const itemId = searchParams.get("itemId");
  const tenant = searchParams.get("tenant") || DEFAULT_TENANT;

  return useMemo(() => {
    if (paramSsuId) {
      return { ssuId: paramSsuId, source: "url-param" as const, error: null };
    }

    if (itemId) {
      try {
        const objectId = resolveItemIdToObjectId(itemId, tenant);
        return { ssuId: objectId, source: "query-context" as const, error: null };
      } catch {
        return {
          ssuId: undefined,
          source: "none" as const,
          error: "Failed to resolve SSU from in-game context.",
        };
      }
    }

    return { ssuId: undefined, source: "none" as const, error: null };
  }, [paramSsuId, itemId, tenant]);
}
