/**
 * GateListScreen — Overview of all gates under governance.
 *
 * Displays gates in a compact table with status, link state, extension info,
 * and batch GateAuth authorization for uninitialized gates.
 */

import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { GateGlyph } from "@/components/topology/Glyphs";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useStructurePower } from "@/hooks/useStructurePower";
import { usePostureState } from "@/hooks/usePosture";
import { shortId } from "@/lib/formatAddress";
import { getSpatialPin } from "@/lib/spatialPins";
import type { Structure, GateAuthTarget } from "@/types/domain";

interface GateListScreenProps {
  structures: Structure[];
  isLoading: boolean;
}

export function GateListScreen({ structures, isLoading }: GateListScreenProps) {
  const gates = structures.filter((s) => s.type === "gate");
  const queryClient = useQueryClient();
  const firstGateId = gates[0]?.objectId;
  const { data: posture } = usePostureState(firstGateId);
  const isDefense = posture === "defense";

  const { authorizeGates, gateStatus, gateResult, gateError, resetGate } =
    useAuthorizeExtension();

  const power = useStructurePower();

  const unauthorizedTargets: GateAuthTarget[] = useMemo(
    () =>
      gates
        .filter((g) => g.extensionStatus !== "authorized")
        .map((g) => ({ gateId: g.objectId, ownerCapId: g.ownerCapId })),
    [gates],
  );

  const handleAuthorizeAll = useCallback(() => {
    authorizeGates(unauthorizedTargets).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  }, [authorizeGates, unauthorizedTargets, queryClient]);

  const offlineGates = useMemo(
    () => gates.filter((g) => g.status === "offline" && g.networkNodeId),
    [gates],
  );

  const onlineGates = useMemo(
    () => gates.filter((g) => g.status === "online" && g.networkNodeId),
    [gates],
  );

  const handleBulkOnline = useCallback(() => {
    power.toggleBatch({
      structureType: "gate",
      targets: offlineGates.map((g) => ({
        structureId: g.objectId,
        ownerCapId: g.ownerCapId,
        networkNodeId: g.networkNodeId!,
      })),
      online: true,
    });
  }, [power, offlineGates]);

  const handleBulkOffline = useCallback(() => {
    power.toggleBatch({
      structureType: "gate",
      targets: onlineGates.map((g) => ({
        structureId: g.objectId,
        ownerCapId: g.ownerCapId,
        networkNodeId: g.networkNodeId!,
      })),
      online: false,
    });
  }, [power, onlineGates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Gates
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            Gate Policy Management // {gates.length} Enrolled
          </p>
          {posture && (
            <div className="mt-1">
              <TagChip
                label={isDefense ? "DEFENSE MODE" : "COMMERCIAL"}
                variant={isDefense ? "warning" : "success"}
                size="sm"
              />
            </div>
          )}
        </div>
        {unauthorizedTargets.length > 0 && (
          <button
            onClick={handleAuthorizeAll}
            disabled={gateStatus === "pending"}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {gateStatus === "pending"
              ? "Authorizing…"
              : `Authorize GateAuth (${unauthorizedTargets.length})`}
          </button>
        )}
      </div>

      {/* Authorization feedback */}
      {(gateStatus === "success" || gateStatus === "error") && (
        <TxFeedbackBanner
          status={gateStatus}
          result={gateResult}
          error={gateError ?? null}
          successLabel={`GateAuth authorized on ${unauthorizedTargets.length} gate(s)`}
          onDismiss={resetGate}
        />
      )}

      {/* Bulk power controls */}
      {gates.length > 0 && (
        <div className="flex items-center gap-3">
          {offlineGates.length > 0 && (
            <button
              onClick={handleBulkOnline}
              disabled={power.status === "pending"}
              className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Bring All Online (${offlineGates.length})`}
            </button>
          )}
          {onlineGates.length > 0 && (
            <button
              onClick={handleBulkOffline}
              disabled={power.status === "pending"}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {power.status === "pending"
                ? "Executing…"
                : `Take All Offline (${onlineGates.length})`}
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
          successLabel="Gate power state updated"
          onDismiss={power.reset}
        />
      )}

      {isLoading ? (
        <LoadingState />
      ) : gates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Gate</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Destination</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Extension</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Location</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate) => (
                <GateRow key={gate.objectId} gate={gate} structures={structures} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GateRow({ gate, structures }: { gate: Structure; structures: Structure[] }) {
  const parentNode = gate.networkNodeId
    ? structures.find((s) => s.objectId === gate.networkNodeId && s.type === "network_node")
    : undefined;
  const pin = parentNode ? getSpatialPin(parentNode.objectId) : undefined;

  const linkedGate = gate.linkedGateId
    ? structures.find((s) => s.objectId === gate.linkedGateId)
    : undefined;

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
      <td className="py-3 px-4">
        <Link
          to={`/gates/${gate.objectId}`}
          className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
        >
          <GateGlyph size={16} />
          <span className="font-medium">{gate.name}</span>
        </Link>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusDot status={gate.status} size="sm" />
          <span className="text-xs text-muted-foreground capitalize">{gate.status}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        {gate.linkedGateId ? (
          <span className="text-[11px] text-muted-foreground" title={gate.linkedGateId}>
            {linkedGate ? linkedGate.name : shortId(gate.linkedGateId)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {gate.extensionStatus === "authorized" ? (
          <TagChip label="AUTHORIZED" variant="primary" size="sm" />
        ) : gate.extensionStatus === "stale" ? (
          <TagChip label="STALE — RE-AUTH" variant="warning" size="sm" />
        ) : (
          <TagChip label="NONE" variant="default" size="sm" />
        )}
      </td>
      <td className="py-3 px-4">
        {pin ? (
          <span className="text-[11px] text-muted-foreground">{pin.solarSystemName}</span>
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground/50" title={gate.objectId}>
            {shortId(gate.objectId)}
          </span>
        )}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
      <GateGlyph size={32} />
      <p className="text-sm text-muted-foreground/60">No gates discovered</p>
      <p className="text-[11px] text-muted-foreground/40">Connect a wallet with gate OwnerCaps to view gates</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground animate-pulse">Discovering gates…</p>
    </div>
  );
}
