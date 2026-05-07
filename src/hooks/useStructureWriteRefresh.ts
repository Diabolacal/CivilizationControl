import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "@evefrontier/dapp-kit";

import { getSharedBackendBaseUrl } from "@/lib/assemblySummaryClient";
import { SIGNAL_FEED_QUERY_KEY } from "@/hooks/useSignalHistory";
import { normalizeCanonicalObjectId } from "@/lib/nodeAssembliesClient";
import { normalizeOperatorInventoryWalletAddress } from "@/lib/operatorInventoryClient";
import { getConfiguredSuiRpcUrl } from "@/lib/suiRpcClient";
import type { StructureWriteTarget } from "@/lib/structureWriteReconciliation";

export interface StructureWriteRefreshOptions {
  selectedNodeId?: string | null;
  refetchNodeAssemblies?: (() => Promise<unknown>) | null;
  refetchSignalFeed?: boolean;
  refetchAssetDiscovery?: boolean;
  refetchStructureExtensionStatus?: boolean;
  target?: StructureWriteTarget;
  targets?: StructureWriteTarget[];
}

export function useStructureWriteRefresh() {
  const queryClient = useQueryClient();
  const { walletAddress } = useConnection();
  const rpcUrl = getConfiguredSuiRpcUrl();
  const normalizedWalletAddress = normalizeOperatorInventoryWalletAddress(walletAddress);
  const sharedBackendBaseUrl = getSharedBackendBaseUrl();

  return useCallback(
    async (options: StructureWriteRefreshOptions = {}) => {
      const refreshes: Array<Promise<unknown>> = [];

      if (normalizedWalletAddress) {
        const operatorInventoryKey = ["operatorInventory", sharedBackendBaseUrl, normalizedWalletAddress] as const;
        queryClient.invalidateQueries({ queryKey: operatorInventoryKey });
        refreshes.push(queryClient.refetchQueries({ queryKey: operatorInventoryKey, type: "active" }));
      }

      if (options.refetchAssetDiscovery !== false && walletAddress) {
        const assetDiscoveryKey = ["assetDiscovery", walletAddress, rpcUrl] as const;
        queryClient.invalidateQueries({ queryKey: assetDiscoveryKey });
        refreshes.push(queryClient.refetchQueries({ queryKey: assetDiscoveryKey, type: "active" }));
      }

      const normalizedNodeId = normalizeCanonicalObjectId(options.selectedNodeId ?? null);
      if (normalizedNodeId) {
        if (options.refetchNodeAssemblies) {
          refreshes.push(Promise.resolve(options.refetchNodeAssemblies()));
        } else {
          const nodeAssembliesKey = ["nodeAssemblies", sharedBackendBaseUrl, normalizedNodeId] as const;
          queryClient.invalidateQueries({ queryKey: nodeAssembliesKey });
          refreshes.push(queryClient.refetchQueries({ queryKey: nodeAssembliesKey, type: "active" }));
        }
      }

      if (options.refetchSignalFeed && normalizedWalletAddress) {
        queryClient.invalidateQueries({ queryKey: [SIGNAL_FEED_QUERY_KEY] });
        refreshes.push(queryClient.refetchQueries({ queryKey: [SIGNAL_FEED_QUERY_KEY], type: "active" }));
      }

      if (options.refetchStructureExtensionStatus) {
        queryClient.invalidateQueries({ queryKey: ["structureExtensionStatus"] });
        refreshes.push(queryClient.refetchQueries({ queryKey: ["structureExtensionStatus"], type: "active" }));
      }

      if (refreshes.length === 0) {
        return;
      }

      await Promise.all(refreshes.map((refresh) => refresh.catch(() => undefined)));
    },
    [normalizedWalletAddress, queryClient, rpcUrl, sharedBackendBaseUrl, walletAddress],
  );
}
