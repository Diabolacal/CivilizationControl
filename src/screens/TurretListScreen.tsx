/**
 * TurretListScreen — Overview of all turrets under governance.
 *
 * Displays turrets with status, extension state, posture mode, and
 * per-row + bulk power controls. Includes posture-aware doctrine
 * rebinding for turrets that are unbound or stale after upgrade.
 */

import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import { TurretGlyph } from "@/components/topology/Glyphs";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { usePostureState } from "@/hooks/usePosture";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useStructurePower } from "@/hooks/useStructurePower";
import { getAssemblySummarySolarSystemName } from "@/lib/assemblyEnrichment";
import { shortId } from "@/lib/formatAddress";
import { getSpatialPin } from "@/lib/spatialPins";
import type { Structure, PostureMode, TurretSwitchTarget } from "@/types/domain";

interface TurretListScreenProps {
  structures: Structure[];
  isLoading: boolean;
}

export function TurretListScreen({ structures, isLoading }: TurretListScreenProps) {
  const turrets = structures.filter((s) => s.type === "turret");
  const firstGateId = structures.find((s) => s.type === "gate")?.objectId;
  const { data: posture } = usePostureState(firstGateId);
  const currentPosture: PostureMode = posture ?? "commercial";
  const queryClient = useQueryClient();

  const { authorizeTurrets, turretStatus, turretResult, turretError, resetTurret } =
    useAuthorizeExtension();

  const power = useStructurePower();

  const unauthorizedTargets: TurretSwitchTarget[] = useMemo(
    () =>
      turrets
        .filter((t) => t.extensionStatus !== "authorized")
        .map((t) => ({ turretId: t.objectId, ownerCapId: t.ownerCapId })),
    [turrets],
  );

  const offlineTurrets = useMemo(
    () => turrets.filter((t) => t.status === "offline" && t.networkNodeId),
    [turrets],
  );

  const onlineTurrets = useMemo(
    () => turrets.filter((t) => t.status === "online" && t.networkNodeId),
    [turrets],
  );

  const handleAuthorizeAll = useCallback(() => {
    authorizeTurrets(unauthorizedTargets, currentPosture).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  }, [authorizeTurrets, unauthorizedTargets, currentPosture, queryClient]);

  const handleBulkOnline = useCallback(() => {
    power.toggleBatch({
      structureType: "turret",
      targets: offlineTurrets.map((t) => ({
        structureId: t.objectId,
        ownerCapId: t.ownerCapId,
        networkNodeId: t.networkNodeId!,
      })),
      online: true,
    });
  }, [power, offlineTurrets]);

  const handleBulkOffline = useCallback(() => {
    power.toggleBatch({
      structureType: "turret",
      targets: onlineTurrets.map((t) => ({
        structureId: t.objectId,
        ownerCapId: t.ownerCapId,
        networkNodeId: t.networkNodeId!,
      })),
      online: false,
    });
  }, [power, onlineTurrets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Turrets
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            Bouncer Enforcement // {turrets.length} Enrolled
          </p>
        </div>
        <PostureBadge posture={currentPosture} />
      </div>

      {/* Doctrine rebind banner — prominent when turrets need binding */}
      {unauthorizedTargets.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3">
          <span className="text-amber-400 text-base">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">
              Turret Doctrine Rebind Required
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unauthorizedTargets.length} turret(s) not bound to current doctrine.
              Unbound turrets use default world targeting (shoot all non-tribe).
            </p>
          </div>
          <button
            onClick={handleAuthorizeAll}
            disabled={turretStatus === "pending"}
            className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {turretStatus === "pending"
              ? "Binding…"
              : `Rebind Doctrine (${unauthorizedTargets.length})`}
          </button>
        </div>
      )}

      {/* Authorization feedback */}
      {(turretStatus === "success" || turretStatus === "error") && (
        <TxFeedbackBanner
          status={turretStatus}
          result={turretResult}
          error={turretError ?? null}
          successLabel={`Doctrine bound on ${unauthorizedTargets.length} turret(s) — ${currentPosture === "defense" ? "Defense" : "Commercial"} mode`}
          onDismiss={resetTurret}
        />
      )}

      {/* Bulk power controls */}
      {turrets.length > 0 && (
        <div className="flex items-center gap-3">
          {offlineTurrets.length > 0 && (
            <button
              onClick={handleBulkOnline}
              disabled={power.status === "pending"}
              className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Bring All Online (${offlineTurrets.length})`}
            </button>
          )}
          {onlineTurrets.length > 0 && (
            <button
              onClick={handleBulkOffline}
              disabled={power.status === "pending"}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Take All Offline (${onlineTurrets.length})`}
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
          successLabel="Turret power state updated"
          onDismiss={power.reset}
        />
      )}

      {isLoading ? (
        <LoadingState />
      ) : turrets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Turret</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Posture Mode</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Extension</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Location</th>
              </tr>
            </thead>
            <tbody>
              {turrets.map((turret) => (
                <TurretRow key={turret.objectId} turret={turret} posture={currentPosture} structures={structures} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TurretRow({ turret, posture, structures }: { turret: Structure; posture: PostureMode; structures: Structure[] }) {
  const modeLabel = posture === "defense" ? "Defense" : "Bouncer";
  const modeVariant = posture === "defense" ? "warning" : "primary";
  const parentNode = turret.networkNodeId
    ? structures.find((s) => s.objectId === turret.networkNodeId && s.type === "network_node")
    : undefined;
  const pin = parentNode ? getSpatialPin(parentNode.objectId) : undefined;
  const locationName = pin?.solarSystemName ?? getAssemblySummarySolarSystemName(turret);

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
      <td className="py-3 px-4">
        <Link
          to={`/turrets/${turret.objectId}`}
          className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
        >
          <TurretGlyph size={16} />
          <span className="font-medium">{turret.name}</span>
        </Link>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusDot status={turret.status} size="sm" />
          <span className="text-xs text-muted-foreground capitalize">{turret.status}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <TagChip label={modeLabel} variant={modeVariant} size="sm" />
      </td>
      <td className="py-3 px-4">
        {turret.extensionStatus === "authorized" ? (
          <TagChip label="CC ACTIVE" variant="primary" size="sm" />
        ) : turret.extensionStatus === "stale" ? (
          <TagChip label="STALE — REBIND" variant="warning" size="sm" />
        ) : (
          <TagChip label="UNBOUND" variant="danger" size="sm" />
        )}
      </td>
      <td className="py-3 px-4">
        {locationName ? (
          <span className="text-[11px] text-muted-foreground">{locationName}</span>
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground/50" title={turret.objectId}>
            {shortId(turret.objectId)}
          </span>
        )}
      </td>
    </tr>
  );
}

function PostureBadge({ posture }: { posture: PostureMode }) {
  const isDefense = posture === "defense";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium transition-colors duration-[800ms] ease-in-out ${
      isDefense
        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
        : "bg-teal-500/10 border-teal-500/20 text-teal-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-[800ms] ease-in-out ${isDefense ? "bg-amber-500" : "bg-teal-500"}`} />
      {isDefense ? "Defense Mode" : "Bouncer Mode"}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
      <TurretGlyph size={32} />
      <p className="text-sm text-muted-foreground/60">No turrets discovered</p>
      <p className="text-[11px] text-muted-foreground/40">Connect a wallet with turret OwnerCaps to view turrets</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground animate-pulse">Discovering turrets…</p>
    </div>
  );
}
