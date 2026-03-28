/**
 * TradePostListScreen — Overview of all trade posts (SSUs) under governance.
 *
 * Displays SSUs in a compact table with status, extension, and inventory hints.
 * Links to individual TradePost detail views.
 */

import { useMemo, useCallback } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { TradePostGlyph } from "@/components/topology/Glyphs";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useStructurePower } from "@/hooks/useStructurePower";
import { shortId } from "@/lib/formatAddress";
import { getSpatialPin } from "@/lib/spatialPins";
import type { Structure, SsuAuthTarget } from "@/types/domain";

interface TradePostListScreenProps {
  structures: Structure[];
  isLoading: boolean;
}

export function TradePostListScreen({ structures, isLoading }: TradePostListScreenProps) {
  const posts = structures.filter((s) => s.type === "storage_unit");
  const power = useStructurePower();
  const queryClient = useQueryClient();
  const { authorizeSsus, ssuStatus, ssuResult, ssuError, resetSsu } =
    useAuthorizeExtension();

  const unauthorizedSsus: SsuAuthTarget[] = useMemo(
    () =>
      posts
        .filter((p) => p.extensionStatus !== "authorized")
        .map((p) => ({ ssuId: p.objectId, ownerCapId: p.ownerCapId })),
    [posts],
  );

  const handleAuthorizeAll = useCallback(() => {
    authorizeSsus(unauthorizedSsus, window.location.origin).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  }, [authorizeSsus, unauthorizedSsus, queryClient]);

  const offlinePosts = useMemo(
    () => posts.filter((p) => p.status === "offline" && p.networkNodeId),
    [posts],
  );

  const onlinePosts = useMemo(
    () => posts.filter((p) => p.status === "online" && p.networkNodeId),
    [posts],
  );

  const handleBulkOnline = useCallback(() => {
    power.toggleBatch({
      structureType: "storage_unit",
      targets: offlinePosts.map((p) => ({
        structureId: p.objectId,
        ownerCapId: p.ownerCapId,
        networkNodeId: p.networkNodeId!,
      })),
      online: true,
    });
  }, [power, offlinePosts]);

  const handleBulkOffline = useCallback(() => {
    power.toggleBatch({
      structureType: "storage_unit",
      targets: onlinePosts.map((p) => ({
        structureId: p.objectId,
        ownerCapId: p.ownerCapId,
        networkNodeId: p.networkNodeId!,
      })),
      online: false,
    });
  }, [power, onlinePosts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            TradePosts
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            Commerce Infrastructure // {posts.length} Enrolled
          </p>
        </div>
      </div>

      {/* Batch extension authorization */}
      {unauthorizedSsus.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleAuthorizeAll}
            disabled={ssuStatus === "pending"}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ssuStatus === "pending"
              ? "Authorizing…"
              : `Authorize TradeAuth (${unauthorizedSsus.length})`}
          </button>
        </div>
      )}

      {/* Extension authorization feedback */}
      {(ssuStatus === "success" || ssuStatus === "error") && (
        <TxFeedbackBanner
          status={ssuStatus}
          result={ssuResult}
          error={ssuError}
          successLabel="TradePost extensions authorized"
          onDismiss={resetSsu}
        />
      )}

      {/* Bulk power controls */}
      {posts.length > 0 && (
        <div className="flex items-center gap-3">
          {offlinePosts.length > 0 && (
            <button
              onClick={handleBulkOnline}
              disabled={power.status === "pending"}
              className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Bring All Online (${offlinePosts.length})`}
            </button>
          )}
          {onlinePosts.length > 0 && (
            <button
              onClick={handleBulkOffline}
              disabled={power.status === "pending"}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Take All Offline (${onlinePosts.length})`}
            </button>
          )}
        </div>
      )}

      {/* Power control feedback */}
      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel="TradePost power state updated"
          onDismiss={power.reset}
        />
      )}

      {isLoading ? (
        <LoadingState />
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">TradePost</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Extension</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Location</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <PostRow key={post.objectId} post={post} structures={structures} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PostRow({ post, structures }: { post: Structure; structures: Structure[] }) {
  const parentNode = post.networkNodeId
    ? structures.find((s) => s.objectId === post.networkNodeId && s.type === "network_node")
    : undefined;
  const pin = parentNode ? getSpatialPin(parentNode.objectId) : undefined;

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
      <td className="py-3 px-4">
        <Link
          to={`/tradeposts/${post.objectId}`}
          className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
        >
          <TradePostGlyph size={16} />
          <span className="font-medium">{post.name}</span>
        </Link>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusDot status={post.status} size="sm" />
          <span className="text-xs text-muted-foreground capitalize">{post.status}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        {post.extensionStatus === "authorized" ? (
          <TagChip label="AUTHORIZED" variant="primary" size="sm" />
        ) : post.extensionStatus === "stale" ? (
          <TagChip label="STALE — RE-AUTH" variant="warning" size="sm" />
        ) : (
          <TagChip label="NONE" variant="default" size="sm" />
        )}
      </td>
      <td className="py-3 px-4">
        {pin ? (
          <span className="text-[11px] text-muted-foreground">{pin.solarSystemName}</span>
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground/50" title={post.objectId}>
            {shortId(post.objectId)}
          </span>
        )}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
      <TradePostGlyph size={32} />
      <p className="text-sm text-muted-foreground/60">No trade posts discovered</p>
      <p className="text-[11px] text-muted-foreground/40">Connect a wallet with SSU OwnerCaps to view trade posts</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground animate-pulse">Discovering trade posts…</p>
    </div>
  );
}
