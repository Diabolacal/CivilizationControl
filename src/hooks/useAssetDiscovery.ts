/**
 * Hook: asset discovery from wallet → PlayerProfile → Character → OwnerCaps → structures.
 *
 * Uses TanStack Query for caching and automatic refetching.
 * Groups structures by network node for the dashboard view.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";
import { useAssemblySummaryEnrichment } from "@/hooks/useAssemblySummaryEnrichment";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useStructureWriteReconciliation } from "@/hooks/useStructureWriteReconciliation";
import { buildDisplayNodeGroupsFromStructures, type AssetDiscoveryDisplayDebugState } from "@/lib/assetDiscoveryDisplayModel";
import { getSuiDiscoveryErrorMessage, getConfiguredSuiRpcUrl } from "@/lib/suiRpcClient";
import { discoverAssets, fetchCharacterMetadata } from "@/lib/suiReader";
import type {
  Structure,
  NetworkMetrics,
} from "@/types/domain";

export function useAssetDiscovery() {
  const { walletAddress, isConnected } = useConnection();
  const rpcUrl = getConfiguredSuiRpcUrl();
  const operatorInventory = useOperatorInventory();
  const { applyNodeGroups, applyStructures } = useStructureWriteReconciliation();
  const shouldUseDirectFallback = Boolean(
    operatorInventory.isConnected && operatorInventory.walletAddress && operatorInventory.isError,
  );

  const discoveryQuery = useQuery({
    queryKey: ["assetDiscovery", walletAddress, rpcUrl],
    queryFn: () => discoverAssets(walletAddress!),
    enabled: shouldUseDirectFallback,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: "always",
    retry: false,
  });

  const profile = discoveryQuery.data?.profile ?? null;
  const profileMetadataQuery = useQuery({
    queryKey: ["characterMetadata", profile?.characterId ?? null, rpcUrl],
    queryFn: () => fetchCharacterMetadata(profile!.characterId),
    enabled: shouldUseDirectFallback && profile?.characterId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: "always",
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
  const fallbackErrorMessage = discoveryQuery.isError
    ? getSuiDiscoveryErrorMessage(discoveryQuery.error)
    : null;
  const operatorStructures = operatorInventory.adapted?.structures ?? null;
  const baseStructures = operatorStructures ?? enrichedFallbackStructures;
  const structures = useMemo(
    () => applyStructures(baseStructures),
    [applyStructures, baseStructures],
  );
  const isUsingOperatorInventory = operatorInventory.adapted != null;
  const profileResult = isUsingOperatorInventory
    ? operatorInventory.adapted?.profile ?? null
    : resolvedProfile;
  const baseNodeGroups = isUsingOperatorInventory
    ? operatorInventory.adapted?.nodeGroups ?? []
    : buildDisplayNodeGroupsFromStructures(structures);
  const nodeGroups = useMemo(
    () => applyNodeGroups(baseNodeGroups),
    [applyNodeGroups, baseNodeGroups],
  );
  const metrics = computeMetrics(structures);
  const directChainFallbackRan = shouldUseDirectFallback && (
    discoveryQuery.fetchStatus !== "idle"
    || discoveryQuery.data != null
    || discoveryQuery.isError
  );
  const readModelDebug: AssetDiscoveryDisplayDebugState = {
    operatorInventoryDisplayActive: isUsingOperatorInventory,
    operatorInventorySucceeded: operatorInventory.inventory != null,
    operatorInventoryFailed: operatorInventory.isError,
    directChainFallbackEnabled: shouldUseDirectFallback,
    directChainFallbackRan,
    displayUsesDirectChainFallback: !isUsingOperatorInventory && shouldUseDirectFallback,
    mergedIntoDisplay: structures.some((structure) => structure.readModelSource === "operator-inventory")
      && structures.some((structure) => structure.readModelSource === "direct-chain"),
  };

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

  return {
    profile: profileResult,
    structures,
    nodeGroups,
    metrics,
    isLoading: isLoadingResult,
    isConnected: isConnected ?? false,
    isError: isErrorResult,
    error: errorResult,
    errorMessage,
    readModelDebug,
    diagnostics: isUsingOperatorInventory
      ? operatorInventory.adapted?.diagnostics ?? null
      : discoveryQuery.data?.diagnostics ?? null,
    refetch: operatorInventory.refetch,
  };
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
