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
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerProfile } from "@/lib/suiReader";
import { resolveTribeName } from "@/lib/tribeCatalog";

type Stage = "init" | "resolve" | "wallet" | "loading" | "ready" | "error";

export function SsuMarketplacePage() {
  const { ssuId, error: resolveError } = useResolveSsuId();
  const { isConnected, walletAddress } = useConnection();
  const { connectError } = useAutoConnect();

  const { listings, isLoading: listingsLoading } = useListings(ssuId);
  const buyMutation = useBuyListing(ssuId ?? "");

  const { data: profile } = useQuery({
    queryKey: ["playerProfile", walletAddress],
    queryFn: () => fetchPlayerProfile(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 60_000,
  });

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
      <PageShell>
        <p className="text-destructive text-sm">{stageError}</p>
      </PageShell>
    );
  }

  if (!ssuId) {
    return (
      <PageShell>
        <p className="text-muted-foreground text-sm">
          No SSU context found. This page expects either an SSU ID in the URL
          or in-game query parameters (?itemId=&amp;tenant=).
        </p>
      </PageShell>
    );
  }

  if (!isConnected) {
    return (
      <PageShell>
        <p className="text-muted-foreground text-sm">Connecting wallet…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
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
        {profile?.characterName ? (
          <p className="text-sm text-foreground">
            {profile.characterName}
            <span className="text-muted-foreground ml-2 text-xs">
              {resolveTribeName(profile.tribeId)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-foreground">
            {shortId(walletAddress ?? "")}
          </p>
        )}
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
    </PageShell>
  );
}

// ─── Sub-components ──────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-border/50 bg-secondary/30 p-6">
        {children}
      </div>
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
