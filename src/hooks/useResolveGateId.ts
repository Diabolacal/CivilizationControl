/**
 * useResolveGateId — Resolves the target gate Sui object ID.
 *
 * Priority:
 *   1. URL path param /gate/:gateId  →  direct Sui object ID
 *   2. Query params ?itemId=&tenant= →  derived via ObjectRegistry
 *   3. Neither present               →  unresolved (error state)
 */

import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { resolveItemIdToObjectId } from "@/lib/objectResolver";

export type GateIdSource = "url-param" | "query-context" | "none";

export interface ResolvedGateId {
  gateId: string | undefined;
  source: GateIdSource;
  error: string | null;
}

const DEFAULT_TENANT = "stillness";

export function useResolveGateId(): ResolvedGateId {
  const { gateId: paramGateId } = useParams<{ gateId: string }>();
  const [searchParams] = useSearchParams();

  const itemId = searchParams.get("itemId");
  const tenant = searchParams.get("tenant") || DEFAULT_TENANT;

  return useMemo(() => {
    if (paramGateId) {
      return { gateId: paramGateId, source: "url-param" as const, error: null };
    }

    if (itemId) {
      try {
        const objectId = resolveItemIdToObjectId(itemId, tenant);
        return { gateId: objectId, source: "query-context" as const, error: null };
      } catch {
        return {
          gateId: undefined,
          source: "none" as const,
          error: "Failed to resolve gate from in-game context.",
        };
      }
    }

    return { gateId: undefined, source: "none" as const, error: null };
  }, [paramGateId, itemId, tenant]);
}
