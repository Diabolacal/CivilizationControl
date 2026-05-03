import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";

import {
  fetchOperatorInventory,
  getOperatorInventoryErrorMessage,
  normalizeOperatorInventoryWalletAddress,
} from "@/lib/operatorInventoryClient";
import { adaptOperatorInventory } from "@/lib/operatorInventoryAdapter";

export function useOperatorInventory() {
  const { walletAddress, isConnected } = useConnection();
  const normalizedWalletAddress = normalizeOperatorInventoryWalletAddress(walletAddress);

  const query = useQuery({
    queryKey: ["operatorInventory", normalizedWalletAddress],
    queryFn: () => fetchOperatorInventory(normalizedWalletAddress!),
    enabled: Boolean(isConnected && normalizedWalletAddress),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });

  const adapted = useMemo(
    () => (query.data ? adaptOperatorInventory(query.data) : null),
    [query.data],
  );

  return {
    walletAddress: normalizedWalletAddress,
    isConnected: isConnected ?? false,
    inventory: query.data ?? null,
    adapted,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.isError ? getOperatorInventoryErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}