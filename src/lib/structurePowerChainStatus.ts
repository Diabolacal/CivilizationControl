import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";

import { getSuiClient } from "@/lib/suiReader";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import type { StructureStatus } from "@/types/domain";

export interface StructurePowerChainStatusTarget {
  structureId: string;
}

export type StructurePowerChainState =
  | "online"
  | "offline"
  | "neutral"
  | "missing_object"
  | "missing_content"
  | "unexpected_variant";

export interface StructurePowerChainSnapshot {
  normalizedStructureId: string;
  chainStatus: StructureStatus | null;
  statusVariant: string | null;
  state: StructurePowerChainState;
}

function getObjectContent(
  response: SuiObjectResponse,
): Record<string, unknown> | null {
  const content = response.data?.content as { fields?: Record<string, unknown> } | undefined;
  return content?.fields ?? null;
}

function getStatusVariant(content: Record<string, unknown> | null): string | null {
  if (!content) {
    return null;
  }

  const status = content.status as Record<string, unknown> | undefined;
  const statusFields = status?.fields as Record<string, unknown> | undefined;
  const innerStatus = statusFields?.status as Record<string, unknown> | undefined;
  return typeof innerStatus?.variant === "string" ? innerStatus.variant : null;
}

export function resolveStructurePowerChainStatusFromContent(
  content: Record<string, unknown> | null,
): StructureStatus | null {
  const variant = getStatusVariant(content);

  if (variant === "ONLINE") return "online";
  if (variant === "OFFLINE") return "offline";
  if (variant === "NULL") return "neutral";

  return null;
}

export function resolveStructurePowerChainSnapshot(
  response: SuiObjectResponse,
  normalizedStructureId: string,
): StructurePowerChainSnapshot {
  if (!response.data) {
    return {
      normalizedStructureId,
      chainStatus: null,
      statusVariant: null,
      state: "missing_object",
    };
  }

  const content = getObjectContent(response);
  if (!content) {
    return {
      normalizedStructureId,
      chainStatus: null,
      statusVariant: null,
      state: "missing_content",
    };
  }

  const chainStatus = resolveStructurePowerChainStatusFromContent(content);
  const statusVariant = getStatusVariant(content);
  if (chainStatus === "online") {
    return { normalizedStructureId, chainStatus, statusVariant, state: "online" };
  }

  if (chainStatus === "offline") {
    return { normalizedStructureId, chainStatus, statusVariant, state: "offline" };
  }

  if (chainStatus === "neutral") {
    return { normalizedStructureId, chainStatus, statusVariant, state: "neutral" };
  }

  return {
    normalizedStructureId,
    chainStatus: null,
    statusVariant,
    state: "unexpected_variant",
  };
}

export async function fetchStructurePowerChainSnapshots(
  targets: readonly StructurePowerChainStatusTarget[],
): Promise<Map<string, StructurePowerChainSnapshot>> {
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

  const snapshots = new Map<string, StructurePowerChainSnapshot>();
  responses.forEach((response, index) => {
    const objectId = objectIds[index];
    if (!objectId) return;

    snapshots.set(objectId, resolveStructurePowerChainSnapshot(response, objectId));
  });

  return snapshots;
}

export async function fetchStructurePowerChainStatuses(
  targets: readonly StructurePowerChainStatusTarget[],
): Promise<Map<string, StructureStatus>> {
  const snapshots = await fetchStructurePowerChainSnapshots(targets);
  const statuses = new Map<string, StructureStatus>();
  snapshots.forEach((snapshot, objectId) => {
    if (snapshot.chainStatus === "online" || snapshot.chainStatus === "offline") {
      statuses.set(objectId, snapshot.chainStatus);
    }
  });

  return statuses;
}