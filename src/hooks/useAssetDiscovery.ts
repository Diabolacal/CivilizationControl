/**
 * Hook: asset discovery from wallet → PlayerProfile → Character → OwnerCaps → structures.
 *
 * Uses TanStack Query for caching and automatic refetching.
 * Groups structures by network node for the dashboard view.
 */

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";
import { useAssemblySummaryEnrichment } from "@/hooks/useAssemblySummaryEnrichment";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { getSuiDiscoveryErrorMessage, getConfiguredSuiRpcUrl } from "@/lib/suiRpcClient";
import { discoverAssets, fetchCharacterMetadata } from "@/lib/suiReader";
import type {
  NetworkNodeGroup,
  Structure,
  NetworkMetrics,
} from "@/types/domain";

export function useAssetDiscovery() {
  const { walletAddress, isConnected } = useConnection();
  const rpcUrl = getConfiguredSuiRpcUrl();
  const operatorInventory = useOperatorInventory();
  const shouldUseDirectFallback = Boolean(
    operatorInventory.isConnected && operatorInventory.walletAddress && operatorInventory.isError,
  );

  const discoveryQuery = useQuery({
    queryKey: ["assetDiscovery", walletAddress, rpcUrl],
    queryFn: () => discoverAssets(walletAddress!),
    enabled: shouldUseDirectFallback,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });

  const profile = discoveryQuery.data?.profile ?? null;
  const profileMetadataQuery = useQuery({
    queryKey: ["characterMetadata", profile?.characterId ?? null, rpcUrl],
    queryFn: () => fetchCharacterMetadata(profile!.characterId),
    enabled: shouldUseDirectFallback && profile?.characterId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });

  const resolvedProfile = profile ? {
    ...profile,
    characterName: profileMetadataQuery.data?.characterName ?? profile.characterName,
    tribeId: profileMetadataQuery.data?.tribeId ?? profile.tribeId,
  } : null;

  const fallbackStructures = discoveryQuery.data?.structures ?? [];
  const { structures: enrichedFallbackStructures } = useAssemblySummaryEnrichment(
    shouldUseDirectFallback ? fallbackStructures : [],
  );
  const fallbackWarning = discoveryQuery.data?.warning ?? null;
  const fallbackErrorMessage = discoveryQuery.isError
    ? getSuiDiscoveryErrorMessage(discoveryQuery.error)
    : null;
  const operatorStructures = operatorInventory.adapted?.structures ?? null;
  const structures = operatorStructures ?? enrichedFallbackStructures;
  const isUsingOperatorInventory = operatorInventory.adapted != null;
  const profileResult = isUsingOperatorInventory
    ? operatorInventory.adapted?.profile ?? null
    : resolvedProfile;
  const nodeGroups = groupByNetworkNode(structures);
  const metrics = isUsingOperatorInventory
    ? operatorInventory.adapted?.metrics ?? computeMetrics(structures)
    : computeMetrics(structures);

  const warning = isUsingOperatorInventory
    ? operatorInventory.adapted?.warning ?? null
    : shouldUseDirectFallback && structures.length > 0
      ? [
        "Shared read model unavailable. Showing direct-chain fallback inventory.",
        fallbackWarning,
      ].filter(Boolean).join(" ")
      : fallbackWarning;

  const errorMessage = isUsingOperatorInventory
    ? null
    : shouldUseDirectFallback
      ? discoveryQuery.isLoading
        ? null
        : discoveryQuery.isError
          ? `Operator inventory unavailable. Direct-chain fallback also failed: ${fallbackErrorMessage ?? operatorInventory.errorMessage ?? "Unknown direct-chain error."}`
          : structures.length === 0
            ? `Shared read model unavailable. Direct-chain fallback found no controllable structures.`
            : null
      : operatorInventory.errorMessage;

  const isLoadingResult = isUsingOperatorInventory
    ? operatorInventory.isLoading
    : operatorInventory.isLoading || (shouldUseDirectFallback && discoveryQuery.isLoading);

  const isErrorResult = !isUsingOperatorInventory && shouldUseDirectFallback && discoveryQuery.isError;

  const errorResult = isUsingOperatorInventory
    ? null
    : discoveryQuery.error ?? operatorInventory.error ?? null;
  const inventoryStatusLabel = isUsingOperatorInventory
    ? formatInventoryStatusLabel(operatorInventory.adapted?.diagnostics?.fetchedAt ?? null, "Shared read model")
    : shouldUseDirectFallback && structures.length > 0
      ? "Direct-chain fallback"
      : null;

  return {
    profile: profileResult,
    structures,
    nodeGroups,
    metrics,
    isLoading: isLoadingResult,
    isConnected: isConnected ?? false,
    isError: isErrorResult,
    error: errorResult,
    warning,
    errorMessage,
    inventoryStatusLabel,
    diagnostics: isUsingOperatorInventory
      ? operatorInventory.adapted?.diagnostics ?? null
      : discoveryQuery.data?.diagnostics ?? null,
    refetch: operatorInventory.refetch,
  };
}

function formatInventoryStatusLabel(
  fetchedAt: string | null,
  prefix: string,
): string {
  if (!fetchedAt) {
    return prefix;
  }

  const parsed = Date.parse(fetchedAt);
  if (Number.isNaN(parsed)) {
    return prefix;
  }

  return `${prefix} • Updated ${new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)}`;
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
    governedGateCount: structures.filter((s) => s.type === "gate" && s.extensionStatus === "authorized").length,
    storageUnitCount: structures.filter((s) => s.type === "storage_unit").length,
    turretCount: structures.filter((s) => s.type === "turret").length,
    networkNodeCount: structures.filter((s) => s.type === "network_node").length,
    enforcedDirectives: structures.filter((s) => s.extensionStatus === "authorized").length,
  };
}
