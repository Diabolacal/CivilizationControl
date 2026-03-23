/**
 * SsuMarketplacePage — Player-facing SSU marketplace.
 *
 * Route: /ssu/:ssuId or /ssu?itemId=&tenant=
 * Renders standalone (no operator sidebar/header).
 * Auto-connects the in-game wallet, reads live listings,
 * and lets players buy items from the marketplace.
 */

import { useConnection } from "@evefrontier/dapp-kit";
import { useAutoConnect } from "@/hooks/useAutoConnect";
import { useResolveSsuId } from "@/hooks/useResolveSsuId";
import { useListings } from "@/hooks/useListings";
import { useBuyListing } from "@/hooks/useBuyListing";
import { ListingCard } from "@/components/ListingCard";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { shortId } from "@/lib/formatAddress";

type Stage = "init" | "resolve" | "wallet" | "loading" | "ready" | "error";

function stageLabel(s: Stage): string {
  switch (s) {
    case "init": return "Initializing…";
    case "resolve": return "Resolving SSU context…";
    case "wallet": return "Connecting wallet…";
    case "loading": return "Loading marketplace…";
    case "ready": return "Ready";
    case "error": return "Error";
  }
}

export function SsuMarketplacePage() {
  const { ssuId, source, error: resolveError } = useResolveSsuId();
  const { isConnected, walletAddress } = useConnection();
  const { connectError } = useAutoConnect();

  const { listings, isLoading: listingsLoading } = useListings(ssuId);
  const buyMutation = useBuyListing(ssuId ?? "");

  let stage: Stage = "init";
  let stageError: string | null = null;

  if (resolveError) {
    stage = "error";
    stageError = resolveError;
  } else if (!ssuId) {
    stage = "resolve";
  } else if (connectError) {
    stage = "error";
    stageError = `Wallet connect failed: ${connectError}`;
  } else if (!isConnected) {
    stage = "wallet";
  } else if (listingsLoading) {
    stage = "loading";
  } else {
    stage = "ready";
  }

  if (stage === "error") {
    return (
      <PageShell stage={stage}>
        <p className="text-destructive text-sm">{stageError}</p>
        <StageDebug stage={stage} ssuId={ssuId} source={source} />
      </PageShell>
    );
  }

  if (!ssuId) {
    return (
      <PageShell stage={stage}>
        <p className="text-muted-foreground text-sm">
          No SSU context found. This page expects either an SSU ID in the URL
          or in-game query parameters (?itemId=&amp;tenant=).
        </p>
        <StageDebug stage={stage} ssuId={ssuId} source={source} />
      </PageShell>
    );
  }

  if (!isConnected) {
    return (
      <PageShell stage={stage}>
        <p className="text-muted-foreground text-sm">Connecting wallet…</p>
        <StageDebug stage={stage} ssuId={ssuId} source={source} />
      </PageShell>
    );
  }

  return (
    <PageShell stage={stage}>
      {/* SSU identity */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Commerce Post — Marketplace
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {shortId(ssuId)}
        </p>
      </div>

      {/* Pilot identity */}
      <div className="space-y-1">
        <Label>Pilot</Label>
        <p className="text-sm text-foreground">
          {shortId(walletAddress ?? "")}
        </p>
      </div>

      {/* Buy feedback */}
      <TxFeedbackBanner
        status={buyMutation.status}
        result={buyMutation.result}
        error={buyMutation.error}
        onDismiss={buyMutation.reset}
        successLabel="Purchase confirmed"
        pendingLabel="Executing purchase…"
      />

      {/* Listings */}
      <div className="space-y-2">
        <Label>Available Listings</Label>

        {listingsLoading && (
          <p className="text-sm text-muted-foreground/60 animate-pulse text-center py-4">
            Discovering listings…
          </p>
        )}

        {!listingsLoading && listings.length === 0 && (
          <div className="border border-dashed border-border/50 rounded py-8 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground/60">No active listings</p>
            <p className="text-[11px] text-muted-foreground/40">
              Check back later — sellers may post offers at any time
            </p>
          </div>
        )}

        {listings.length > 0 && (
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.objectId}
                listing={listing}
                txStatus={buyMutation.status}
                onBuy={buyMutation.buy}
                walletAddress={walletAddress ?? undefined}
              />
            ))}
          </div>
        )}
      </div>

      <StageDebug stage={stage} ssuId={ssuId} source={source} />
    </PageShell>
  );
}

// ─── Sub-components ──────────────────────────────────────

function PageShell({ children, stage }: { children: React.ReactNode; stage?: Stage }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-border/50 bg-secondary/30 p-6">
        {stage && (
          <div className="text-[10px] font-mono text-muted-foreground/60 border-b border-border/30 pb-2">
            Stage: {stageLabel(stage)}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function StageDebug({
  stage,
  ssuId,
  source,
}: {
  stage: Stage;
  ssuId: string | undefined;
  source: string;
}) {
  return (
    <div className="border-t border-border/30 pt-2 mt-2 space-y-0.5">
      <p className="text-[9px] font-mono text-muted-foreground/40">
        stage={stage} source={source} ssu={ssuId ? shortId(ssuId) : "none"}
      </p>
      <p className="text-[9px] font-mono text-muted-foreground/40">
        url={typeof window !== "undefined" ? window.location.href : "ssr"}
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}
