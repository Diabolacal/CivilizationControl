/**
 * TradePostDetailScreen — Individual trade post governance view.
 *
 * Hierarchy: identity + power control → commerce surfaces → setup.
 * Setup utilities (DApp URL, extension authority) are collapsed.
 * Infrastructure context and passive metadata are excluded from this surface.
 */

import { useParams, Link } from "react-router";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useCallback, useState, useRef } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { StructureDetailHeader } from "@/components/StructureDetailHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ListingCard } from "@/components/ListingCard";
import { CreateListingForm } from "@/components/CreateListingForm";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
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
  const power = useStructurePower();
  const lastPowerLabel = useRef("Storage power state updated");
  const post = structures.find((s) => s.objectId === id && s.type === "storage_unit");

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">Loading storage…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground/60">Storage not found</p>
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

  const isOnline = post.status === "online";
  const hasNetworkNode = !!post.networkNodeId;

  const handlePowerToggle = () => {
    lastPowerLabel.current = isOnline ? "Storage taken offline" : "Storage brought online";
    power.toggleSingle({
      structureType: "storage_unit",
      structureId: post.objectId,
      ownerCapId: post.ownerCapId,
      networkNodeId: post.networkNodeId!,
      online: !isOnline,
    });
  };

  const powerControl = hasNetworkNode ? (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-[10px] uppercase tracking-wider ${isOnline ? "text-teal-500/50" : "text-muted-foreground/40"}`}>
        {isOnline ? "Online" : "Offline"}
      </span>
      <button
        onClick={handlePowerToggle}
        disabled={power.status === "pending"}
        className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isOnline
            ? "border border-red-500/20 text-red-400/70 hover:bg-red-500/10"
            : "border border-teal-500/20 text-teal-400/70 hover:bg-teal-500/10"
        }`}
      >
        {power.status === "pending" ? "\u2026" : isOnline ? "Power Off" : "Power On"}
      </button>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={post} solarSystemName={solarSystemName} headerRight={powerControl} />

      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel={lastPowerLabel.current}
          onDismiss={power.reset}
        />
      )}

      {/* Commerce — primary surface */}
      <MarketplaceSection post={post} />

      {/* Setup — secondary configuration */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-1">Setup</p>
        <InGameDAppUrlSection post={post} />
        <ExtensionSection post={post} />
      </div>
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
      All Storages
    </Link>
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
        <h2 className="text-sm font-semibold text-foreground">Marketplace</h2>
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
        <h2 className="text-sm font-semibold text-foreground">Create Listing</h2>

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
          <span className="text-[11px] text-muted-foreground/60">
            {listingsLoading ? "Loading…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
          </span>
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
    <CollapsibleSection title="In-Game DApp URL" subtitle="Set once per storage">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Set this URL on-chain so players see the marketplace when interacting with this storage.
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
      </div>
    </CollapsibleSection>
  );
}

function ExtensionSection({ post }: { post: Structure }) {
  const { authorizeSsus, ssuStatus, ssuResult, ssuError, resetSsu } =
    useAuthorizeExtension();
  const queryClient = useQueryClient();
  const needsAuth = post.extensionStatus !== "authorized";

  const statusLabel = post.extensionStatus === "authorized"
    ? "Active"
    : post.extensionStatus === "stale"
      ? "Needs re-authorization"
      : "Not authorized";

  const handleReAuth = () => {
    authorizeSsus(
      [{ ssuId: post.objectId, ownerCapId: post.ownerCapId }],
      window.location.origin,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  };

  return (
    <CollapsibleSection
      title="Trade Extension"
      subtitle={statusLabel}
      defaultOpen={needsAuth}
      headerRight={
        needsAuth ? (
          <span className="text-[10px] font-medium text-amber-400">Action needed</span>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {needsAuth && (
          <button
            onClick={handleReAuth}
            disabled={ssuStatus === "pending"}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ssuStatus === "pending"
              ? "Authorizing…"
              : post.extensionStatus === "stale"
                ? "Re-authorize"
                : "Authorize"}
          </button>
        )}
        {(ssuStatus === "success" || ssuStatus === "error") && (
          <TxFeedbackBanner
            status={ssuStatus}
            result={ssuResult}
            error={ssuError}
            successLabel="TradeAuth authorized"
            onDismiss={resetSsu}
          />
        )}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Control Module</p>
            <p className="font-mono text-foreground">
              {post.extensionStatus === "authorized"
                ? "CivilizationControl"
                : post.extensionStatus === "stale"
                  ? "Stale — needs rebind"
                  : "None"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Owner Capability</p>
            <p className="font-mono text-[11px] text-muted-foreground truncate" title={post.ownerCapId}>
              {post.ownerCapId.slice(0, 10)}…{post.ownerCapId.slice(-6)}
            </p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
