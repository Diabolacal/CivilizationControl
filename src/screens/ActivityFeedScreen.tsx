/**
 * ActivityFeedScreen — Signal Feed route shell.
 *
 * The wallet-scoped shared-indexer signal history endpoint is not shipped yet,
 * so the route stays present but avoids browser queryEvents polling.
 */

import { useMemo } from "react";
import { Radio } from "lucide-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useAssetDiscovery } from "@/hooks/useAssetDiscovery";

export function ActivityFeedScreen() {
  const { walletAddress } = useConnection();
  const { structures, isLoading } = useAssetDiscovery();
  const hasGovernedInfrastructure = useMemo(
    () => structures.length > 0,
    [structures],
  );

  const heading = !walletAddress
    ? "Connect wallet to restore operator context"
    : isLoading
      ? "Checking governed infrastructure"
      : hasGovernedInfrastructure
        ? "Signal history is being moved to the shared indexer."
        : "No governed infrastructure indexed for this wallet.";

  const detail = !walletAddress
    ? "Signal Feed will resume here once the wallet-scoped shared history route is available."
    : isLoading
      ? "This route stays paused while shared signal history replaces browser event polling."
      : hasGovernedInfrastructure
        ? "This route stays reserved for wallet-scoped signal history while the shared backend endpoint is completed."
        : "Connect a wallet with governed structures to use shared signal history once the endpoint is live.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Signal Feed</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide mt-1">
            Governed Infrastructure // Telemetry Log
          </p>
        </div>
      </header>

      <section className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3 text-center">
        <Radio className="w-6 h-6 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground/70">{heading}</p>
        <p className="text-[11px] text-muted-foreground/45 max-w-[44ch]">
          {detail}
        </p>
      </section>
    </div>
  );
}
