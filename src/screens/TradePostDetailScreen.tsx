/**
 * TradePostDetailScreen — Individual trade post governance view.
 *
 * Shows SSU status, extension configuration, live marketplace listings,
 * seller-side listing creation, buy flow, and cancel flow.
 * Governance vocabulary: "Commerce Post", "Marketplace",
 * "Trade Extension" per narrative spec.
 */

import { useParams, Link } from "react-router";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { StructureDetailHeader } from "@/components/StructureDetailHeader";
import { NodeContextBanner } from "@/components/NodeContextBanner";
import { ListingCard } from "@/components/ListingCard";
import { CreateListingForm } from "@/components/CreateListingForm";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { TagChip } from "@/components/TagChip";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useListings } from "@/hooks/useListings";
import { useBuyListing } from "@/hooks/useBuyListing";
import { useCreateListing } from "@/hooks/useCreateListing";
import { useCancelListing } from "@/hooks/useCancelListing";
import { useSsuInventory } from "@/hooks/useSsuInventory";
import { useStructurePower } from "@/hooks/useStructurePower";
import { getSpatialPin } from "@/lib/spatialPins";
import type { Structure } from "@/types/domain";

interface TradePostDetailScreenProps {
  structures: Structure[];
  isLoading: boolean;
}

export function TradePostDetailScreen({ structures, isLoading }: TradePostDetailScreenProps) {
  const { id } = useParams<{ id: string }>();
  const post = structures.find((s) => s.objectId === id && s.type === "storage_unit");

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">Loading trade post…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground/60">Trade post not found</p>
          <p className="text-[11px] text-muted-foreground/40">Object may have been removed or is not owned by this wallet</p>
        </div>
      </div>
    );
  }

  const solarSystemName = post.networkNodeId
    ? (() => {
        const parentNode = structures.find(
          (s) => s.objectId === post.networkNodeId && s.type === "network_node",
        );
        const pin = parentNode ? getSpatialPin(parentNode.objectId) : undefined;
        return pin?.solarSystemName;
      })()
    : undefined;

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={post} solarSystemName={solarSystemName} />
      <NodeContextBanner structure={post} structures={structures} />
      <InGameDAppUrlSection post={post} />
      <PowerControlSection post={post} />
      <MarketplaceSection post={post} />
      <ExtensionSection post={post} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/tradeposts"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All TradePosts
    </Link>
  );
}

function PowerControlSection({ post }: { post: Structure }) {
  const power = useStructurePower();
  const isOnline = post.status === "online";
  const hasNetworkNode = !!post.networkNodeId;

  if (!hasNetworkNode) {
    return (
      <section className="border border-border rounded p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        <p className="text-xs text-muted-foreground">
          No network node linked — cannot control power state from web.
        </p>
      </section>
    );
  }

  const handleToggle = () => {
    power.toggleSingle({
      structureType: "storage_unit",
      structureId: post.objectId,
      ownerCapId: post.ownerCapId,
      networkNodeId: post.networkNodeId!,
      online: !isOnline,
    });
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        <button
          onClick={handleToggle}
          disabled={power.status === "pending"}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isOnline
              ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
          }`}
        >
          {power.status === "pending"
            ? "Executing…"
            : isOnline
              ? "Take Offline"
              : "Bring Online"}
        </button>
      </div>
      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel={isOnline ? "TradePost taken offline" : "TradePost brought online"}
          onDismiss={power.reset}
        />
      )}
    </section>
  );
}

function MarketplaceSection({ post }: { post: Structure }) {
  const { walletAddress } = useConnection();
  const { listings, isLoading: listingsLoading } = useListings(post.objectId);
  const { items: inventoryItems, isLoading: inventoryLoading } = useSsuInventory(post.objectId);
  const buyMutation = useBuyListing(post.objectId);
  const createMutation = useCreateListing(post.objectId);
  const cancelMutation = useCancelListing(post.objectId);

  if (post.extensionStatus !== "authorized") {
    const isStale = post.extensionStatus === "stale";
    return (
      <section className="border border-border rounded p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Marketplace</h2>
          <p className="text-[11px] font-mono text-muted-foreground">Listings</p>
        </div>
        <div className="border border-dashed border-border/50 rounded py-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground/60">
            {isStale ? "Extension bound to old package" : "Extension not authorized"}
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            {isStale
              ? "Re-authorize TradeAuth to bind to the current package"
              : "Authorize the TradeAuth extension to enable commerce"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Listing section */}
      <section className="border border-border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Create Listing</h2>
          <p className="text-[11px] font-mono text-muted-foreground">Seller</p>
        </div>

        <TxFeedbackBanner
          status={createMutation.status}
          result={createMutation.result}
          error={createMutation.error}
          onDismiss={createMutation.reset}
          successLabel="Listing created"
          pendingLabel="Creating listing…"
        />

        <CreateListingForm
          txStatus={createMutation.status}
          onSubmit={createMutation.createListing}
          inventoryItems={inventoryItems}
          isInventoryLoading={inventoryLoading}
        />
      </section>

      {/* Active Listings section */}
      <section className="border border-border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Marketplace</h2>
          <p className="text-[11px] font-mono text-muted-foreground">
            {listingsLoading ? "Loading…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <TxFeedbackBanner
          status={buyMutation.status}
          result={buyMutation.result}
          error={buyMutation.error}
          onDismiss={buyMutation.reset}
          successLabel="Purchase confirmed"
          pendingLabel="Executing purchase…"
        />

        <TxFeedbackBanner
          status={cancelMutation.status}
          result={cancelMutation.result}
          error={cancelMutation.error}
          onDismiss={cancelMutation.reset}
          successLabel="Listing cancelled"
          pendingLabel="Cancelling listing…"
        />

        {listingsLoading && (
          <p className="text-sm text-muted-foreground/60 animate-pulse text-center py-4">
            Discovering listings…
          </p>
        )}

        {!listingsLoading && listings.length === 0 && (
          <div className="border border-dashed border-border/50 rounded py-8 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground/60">No active listings</p>
            <p className="text-[11px] text-muted-foreground/40">
              Create a listing above or wait for sellers to post offers
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
                onCancel={cancelMutation.cancelListing}
                cancelTxStatus={cancelMutation.status}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InGameDAppUrlSection({ post }: { post: Structure }) {
  const [copied, setCopied] = useState(false);
  const { setSsuDappUrl, ssuStatus, ssuResult, ssuError, resetSsu } =
    useAuthorizeExtension();
  const queryClient = useQueryClient();
  const dappUrl = `${window.location.origin}/ssu/${post.objectId}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(dappUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [dappUrl]);

  const handleSetOnChain = useCallback(() => {
    setSsuDappUrl(
      [{ ssuId: post.objectId, ownerCapId: post.ownerCapId }],
      window.location.origin,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  }, [setSsuDappUrl, post.objectId, post.ownerCapId, queryClient]);

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">In-Game DApp URL</h2>
        <p className="text-[11px] font-mono text-muted-foreground">Operator Setup</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Set this URL on-chain so players who interact with this commerce post see the marketplace automatically.
      </p>
      {(ssuStatus === "success" || ssuStatus === "error") && (
        <TxFeedbackBanner
          status={ssuStatus}
          result={ssuResult}
          error={ssuError}
          successLabel="DApp URL set on-chain"
          onDismiss={resetSsu}
        />
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground truncate select-all" title={dappUrl}>
          {dappUrl}
        </div>
        <button
          onClick={handleSetOnChain}
          disabled={ssuStatus === "pending"}
          className="shrink-0 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ssuStatus === "pending" ? "Setting…" : "Set On-Chain"}
        </button>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy URL</span>
          )}
        </button>
      </div>
    </section>
  );
}

function ExtensionSection({ post }: { post: Structure }) {
  const { authorizeSsus, ssuStatus, ssuResult, ssuError, resetSsu } =
    useAuthorizeExtension();
  const queryClient = useQueryClient();
  const needsAuth = post.extensionStatus !== "authorized";

  const handleReAuth = () => {
    authorizeSsus(
      [{ ssuId: post.objectId, ownerCapId: post.ownerCapId }],
      window.location.origin,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Trade Extension
        </h2>
        {needsAuth && (
          <button
            onClick={handleReAuth}
            disabled={ssuStatus === "pending"}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ssuStatus === "pending"
              ? "Authorizing…"
              : post.extensionStatus === "stale"
                ? "Re-authorize TradeAuth"
                : "Authorize TradeAuth"}
          </button>
        )}
      </div>
      {(ssuStatus === "success" || ssuStatus === "error") && (
        <TxFeedbackBanner
          status={ssuStatus}
          result={ssuResult}
          error={ssuError}
          successLabel="TradeAuth authorized"
          onDismiss={resetSsu}
        />
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Extension</p>
          <p className="font-mono text-foreground">
            {post.extensionStatus === "authorized"
              ? "TradeAuth (CivilizationControl)"
              : post.extensionStatus === "stale"
                ? "Stale — old package"
                : "None"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">OwnerCap</p>
          <p className="font-mono text-[11px] text-foreground truncate" title={post.ownerCapId}>
            {post.ownerCapId.slice(0, 10)}…{post.ownerCapId.slice(-6)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        {post.extensionStatus === "authorized" ? (
          <TagChip label="TRADE ENABLED" variant="success" size="sm" />
        ) : post.extensionStatus === "stale" ? (
          <TagChip label="STALE — RE-AUTH" variant="warning" size="sm" />
        ) : (
          <TagChip label="NOT AUTHORIZED" variant="warning" size="sm" />
        )}
      </div>
    </section>
  );
}
