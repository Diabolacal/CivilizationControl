import { QueryClient } from "@tanstack/react-query";

import { classifySuiRpcError } from "@/lib/suiRpcClient";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: (failureCount, error) => {
        const failure = classifySuiRpcError(error);
        if (failure.kind === "cors" || failure.kind === "rate-limit") {
          return false;
        }

        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 4_000),
    },
    mutations: {
      retry: 0,
    },
  },
});