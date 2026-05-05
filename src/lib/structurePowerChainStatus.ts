import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";

import { getSuiClient } from "@/lib/suiReader";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type { StructureStatus } from "@/types/domain";

export interface StructurePowerChainStatusTarget {
  structureId: string;
}

function getObjectContent(
  response: SuiObjectResponse,
): Record<string, unknown> | null {
  const content = response.data?.content as { fields?: Record<string, unknown> } | undefined;
  return content?.fields ?? null;
}

export function resolveStructurePowerChainStatusFromContent(
  content: Record<string, unknown> | null,
): StructureStatus | null {
  if (!content) {
    return null;
  }

  const status = content.status as Record<string, unknown> | undefined;
  const statusFields = status?.fields as Record<string, unknown> | undefined;
  const innerStatus = statusFields?.status as Record<string, unknown> | undefined;
  const variant = typeof innerStatus?.variant === "string" ? innerStatus.variant : null;

  if (variant === "ONLINE") return "online";
  if (variant === "OFFLINE") return "offline";
  if (variant === "NULL") return "neutral";

  return null;
}

export async function fetchStructurePowerChainStatuses(
  targets: readonly StructurePowerChainStatusTarget[],
): Promise<Map<string, StructureStatus>> {
  const objectIds = Array.from(new Set(
    targets
      .map((target) => normalizeCanonicalObjectId(target.structureId))
      .filter((value): value is string => value != null),
  ));
  if (objectIds.length === 0) {
    return new Map();
  }

  const responses = await getSuiClient().multiGetObjects({
    ids: objectIds,
    options: { showContent: true },
  });

  const statuses = new Map<string, StructureStatus>();
  responses.forEach((response, index) => {
    const objectId = objectIds[index];
    if (!objectId) return;

    const status = resolveStructurePowerChainStatusFromContent(getObjectContent(response));
    if (status === "online" || status === "offline") {
      statuses.set(objectId, status);
    }
  });

  return statuses;
}