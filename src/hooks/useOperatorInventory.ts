import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";

import { getSharedBackendBaseUrl } from "@/lib/assemblySummaryClient";
import {
  fetchOperatorInventory,
  getOperatorInventoryErrorMessage,
  normalizeOperatorInventoryWalletAddress,
} from "@/lib/operatorInventoryClient";
import { adaptOperatorInventory } from "@/lib/operatorInventoryAdapter";
import { useStructureWriteReconciliation } from "@/hooks/useStructureWriteReconciliation";

export function useOperatorInventory() {
  const { walletAddress, isConnected } = useConnection();
  const normalizedWalletAddress = normalizeOperatorInventoryWalletAddress(walletAddress);
  const sharedBackendBaseUrl = getSharedBackendBaseUrl();
  const { applyOperatorInventory } = useStructureWriteReconciliation();

  const query = useQuery({
    queryKey: ["operatorInventory", sharedBackendBaseUrl, normalizedWalletAddress],
    queryFn: () => fetchOperatorInventory(normalizedWalletAddress!, { baseUrl: sharedBackendBaseUrl }),
    enabled: Boolean(isConnected && normalizedWalletAddress),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: "always",
    retry: false,
  });

  const inventory = useMemo(
    () => applyOperatorInventory(query.data),
    [applyOperatorInventory, query.data],
  );

  const adapted = useMemo(
    () => (inventory ? adaptOperatorInventory(inventory) : null),
    [inventory],
  );

  return {
    walletAddress: normalizedWalletAddress,
    isConnected: isConnected ?? false,
    inventory,
    adapted,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.isError ? getOperatorInventoryErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}