/**
 * Hook: asset discovery from wallet → PlayerProfile → Character → OwnerCaps → structures.
 *
 * Uses TanStack Query for caching and automatic refetching.
 * Groups structures by network node for the dashboard view.
 */

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";
import { discoverAssets } from "@/lib/suiReader";
import type {
  NetworkNodeGroup,
  Structure,
  NetworkMetrics,
} from "@/types/domain";

export function useAssetDiscovery() {
  const { walletAddress, isConnected } = useConnection();

  const query = useQuery({
    queryKey: ["assetDiscovery", walletAddress],
    queryFn: () => discoverAssets(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const structures = query.data?.structures ?? [];
  const profile = query.data?.profile ?? null;

  // Group structures by network node
  const nodeGroups = groupByNetworkNode(structures);
  const metrics = computeMetrics(structures);

  return {
    profile,
    structures,
    nodeGroups,
    metrics,
    isLoading: query.isLoading,
    isConnected: isConnected ?? false,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function groupByNetworkNode(structures: Structure[]): NetworkNodeGroup[] {
  const nodes = structures.filter((s) => s.type === "network_node");
  const others = structures.filter((s) => s.type !== "network_node");

  // For each network node, find co-located structures
  const groups: NetworkNodeGroup[] = nodes.map((node) => {
    const colocated = others.filter(
      (s) => s.networkNodeId === node.objectId,
    );

    return {
      node,
      gates: colocated.filter((s) => s.type === "gate"),
      storageUnits: colocated.filter((s) => s.type === "storage_unit"),
      turrets: colocated.filter((s) => s.type === "turret"),
    };
  });

  // Structures without a network node go into an "unassigned" group
  const assignedIds = new Set(
    groups.flatMap((g) => [
      ...g.gates.map((s) => s.objectId),
      ...g.storageUnits.map((s) => s.objectId),
      ...g.turrets.map((s) => s.objectId),
    ]),
  );

  const unassigned = others.filter((s) => !assignedIds.has(s.objectId));
  if (unassigned.length > 0) {
    // Create a synthetic "unassigned" group
    groups.push({
      node: {
        objectId: "unassigned",
        ownerCapId: "",
        type: "network_node",
        name: "Unassigned Structures",
        status: "neutral",
        extensionStatus: "none" as const,
      },
      gates: unassigned.filter((s) => s.type === "gate"),
      storageUnits: unassigned.filter((s) => s.type === "storage_unit"),
      turrets: unassigned.filter((s) => s.type === "turret"),
    });
  }

  return groups;
}

function computeMetrics(structures: Structure[]): NetworkMetrics {
  return {
    totalStructures: structures.length,
    onlineCount: structures.filter((s) => s.status === "online").length,
    gateCount: structures.filter((s) => s.type === "gate").length,
    storageUnitCount: structures.filter((s) => s.type === "storage_unit").length,
    turretCount: structures.filter((s) => s.type === "turret").length,
    networkNodeCount: structures.filter((s) => s.type === "network_node").length,
    enforcedDirectives: structures.filter((s) => s.extensionStatus === "authorized").length,
  };
}
