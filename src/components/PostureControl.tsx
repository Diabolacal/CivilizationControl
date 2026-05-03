/**
 * PostureControl — Operator-facing posture switch command surface.
 *
 * Displays the current network posture and provides a single-action
 * button to switch between Commercial and Defense modes. The switch
 * executes a single PTB that atomically changes gate rules + turret
 * extensions + posture state.
 *
 * UX follows command infrastructure doctrine: calm authority, not settings.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ShieldAlert, Store, Settings2 } from "lucide-react";
import { usePostureState, usePostureSwitch } from "@/hooks/usePosture";
import { useOperatorReadiness } from "@/hooks/useOperatorReadiness";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";

import type {
  NetworkNodeGroup,
  PostureMode,
  TurretSwitchTarget,
  GatePostureTarget,
} from "@/types/domain";

interface PostureControlProps {
  nodeGroups: NetworkNodeGroup[];
  isConnected: boolean;
  /** Compact strip variant for embedding within another panel. */
  compact?: boolean;
  /** Inline variant: just state indicator + button, no wrapper. For embedding in a header row. */
  inline?: boolean;
  /** Callback fired when transition state changes (true = transitioning). */
  onTransitionChange?: (isTransitioning: boolean) => void;
}

export function PostureControl({ nodeGroups, isConnected, compact, inline, onTransitionChange }: PostureControlProps) {
  const firstGateId = useMemo(() => {
    for (const group of nodeGroups) {
      if (group.gates.length > 0) return group.gates[0].objectId;
    }
    return undefined;
  }, [nodeGroups]);

  // Transition lifecycle: pendingTarget is set on click, cleared when
  // read-path confirms the new posture or on error/timeout.
  const [pendingTarget, setPendingTarget] = useState<PostureMode | null>(null);
  const isTransitioning = pendingTarget !== null;

  // Notify parent when transition state changes
  useEffect(() => {
    onTransitionChange?.(isTransitioning);
  }, [isTransitioning, onTransitionChange]);

  const { data: currentPosture, isLoading: postureLoading, isFetching: postureRefetching } = usePostureState(firstGateId, isTransitioning);
  const { status, result, error, switchPosture, reset } = usePostureSwitch();
  const readiness = useOperatorReadiness(nodeGroups, isConnected);

  const posture: PostureMode = currentPosture ?? "commercial";
  const isDefense = posture === "defense";
  const isConfirming = status === "success" && postureRefetching;

  // Clear pendingTarget when read-path confirms the transition completed
  useEffect(() => {
    if (pendingTarget && currentPosture === pendingTarget) {
      setPendingTarget(null);
    }
  }, [pendingTarget, currentPosture]);

  // Clear pendingTarget on error so controls re-enable
  useEffect(() => {
    if (status === "error") {
      setPendingTarget(null);
    }
  }, [status]);

  // Capture the target mode at mutation time so the success banner
  // doesn't flip after cache invalidation changes isDefense.
  const lastTargetRef = useRef<PostureMode>("commercial");

  const turrets = useMemo(() => {
    const turretTargets: TurretSwitchTarget[] = [];
    for (const group of nodeGroups) {
      for (const turret of group.turrets) {
        turretTargets.push({
          turretId: turret.objectId,
          ownerCapId: turret.ownerCapId,
        });
      }
    }
    return turretTargets;
  }, [nodeGroups]);

  const gateTargets = useMemo(() => {
    const targets: GatePostureTarget[] = [];
    for (const group of nodeGroups) {
      for (const gate of group.gates) {
        targets.push({
          gateId: gate.objectId,
          ownerCapId: gate.ownerCapId,
        });
      }
    }
    return targets;
  }, [nodeGroups]);

  const handleSwitch = useCallback(() => {
    const targetMode: PostureMode = isDefense ? "commercial" : "defense";
    lastTargetRef.current = targetMode;
    setPendingTarget(targetMode);
    switchPosture({
      targetMode,
      gates: gateTargets,
      turrets,
    });
  }, [isDefense, gateTargets, turrets, switchPosture]);

  const isPending = status === "pending";
  // Prevent clicks while transitioning (PTB executing, awaiting confirmation, or read-path catching up)
  const isDisabled = isPending || isTransitioning || postureLoading || !readiness.isReady;

  const stateLabel = postureLoading
    ? "Resolving\u2026"
    : isTransitioning
      ? isPending
        ? "Executing\u2026"
        : "Transitioning\u2026"
      : isConfirming
        ? "Confirming\u2026"
        : isDefense ? "Defense Mode" : "Open for Business";

  const actionButton = (
    <button
      onClick={handleSwitch}
      disabled={isDisabled}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-[800ms] ease-in-out ${
        isDefense
          ? "bg-teal-600 text-white hover:bg-teal-500 disabled:bg-teal-800"
          : "bg-amber-600 text-white hover:bg-amber-500 disabled:bg-amber-800"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {isTransitioning
        ? "Applying\u2026"
        : isDefense
          ? "Stand Down"
          : "Defense Mode"}
    </button>
  );

  const feedbackBlock = (
    <>
      {readiness.blockers.length > 0 && (
        <div className="space-y-1.5">
          {readiness.blockers.map((b) => (
            <div
              key={b.key}
              className={`flex items-start gap-2 rounded px-3 py-2 text-xs ${
                b.severity === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {b.severity === "error" ? "⛔" : "⚠"}
              </span>
              <span>{b.label}</span>
              {b.link && (
                <Link
                  to={b.link}
                  className="ml-auto shrink-0 underline underline-offset-2 hover:text-zinc-100"
                >
                  Resolve →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      {(status === "success" || status === "error") && (
        <TxFeedbackBanner
          status={status}
          result={result}
          error={error ?? null}
          successLabel={`Posture switched to ${lastTargetRef.current === "defense" ? "Defense" : "Commercial"}`}
          onDismiss={reset}
        />
      )}
    </>
  );

  // Inline mode-selector variant: Commercial / Defensive chip tabs + transition indicator.
  if (inline) {
    const commercialActive = !isDefense && !postureLoading && !isTransitioning;
    const defensiveActive = isDefense && !postureLoading && !isTransitioning;
    // During transition, show the pending target as the "active-becoming" chip
    const pendingCommercial = isTransitioning && pendingTarget === "commercial";
    const pendingDefensive = isTransitioning && pendingTarget === "defense";

    const chipBase =
      "flex items-center gap-2 rounded px-3 py-1.5 font-medium transition-colors duration-[800ms] ease-in-out border cursor-pointer disabled:cursor-not-allowed";
    const activeCommercial =
      "text-xs text-primary bg-primary/10 border-primary/20";
    const activeDefensive =
      "text-xs text-destructive bg-destructive/10 border-destructive/20";
    const pendingChip =
      "text-xs text-muted-foreground bg-muted/10 border-border/40 animate-pulse";
    const inactive =
      "text-[11px] tracking-wide text-muted-foreground hover:text-foreground border-transparent disabled:opacity-50";

    const commercialChipClass = commercialActive
      ? activeCommercial
      : pendingCommercial
        ? pendingChip
        : inactive;
    const defensiveChipClass = defensiveActive
      ? activeDefensive
      : pendingDefensive
        ? pendingChip
        : inactive;

    return (
      <>
        {/* Mode selector pill strip */}
        <div className="flex items-center bg-[#09090b] border border-border/50 rounded p-1 gap-2">
          <button
            onClick={isDefense ? handleSwitch : undefined}
            disabled={isDisabled || commercialActive}
            className={`${chipBase} ${commercialChipClass}`}
          >
            <Store className="w-3.5 h-3.5" />
            {pendingCommercial ? "Applying\u2026" : "Commercial"}
          </button>
          <button
            onClick={!isDefense ? handleSwitch : undefined}
            disabled={isDisabled || defensiveActive}
            className={`${chipBase} ${defensiveChipClass}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {pendingDefensive ? "Applying\u2026" : "Defensive"}
          </button>
        </div>
        {/* Transition status indicator */}
        {isTransitioning && (
          <>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <span className="text-[10px] tracking-wide text-muted-foreground animate-pulse">
              {isPending ? "Awaiting wallet\u2026" : "Confirming on-chain\u2026"}
            </span>
          </>
        )}
        {/* Save Preset placeholder (ghost — not wired yet) */}
        {!isTransitioning && (
          <>
            <div className="w-px h-4 bg-border/50 mx-2" />
            <button
              disabled
              aria-label="Save Preset coming soon"
              className="flex items-center gap-2 whitespace-nowrap rounded border border-transparent px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground/60 cursor-not-allowed"
            >
              <Settings2 className="w-3 h-3" />
              Save Preset
            </button>
          </>
        )}
      </>
    );
  }

  return (
    <div className={compact ? "px-5 py-2.5 border-b border-border/50 bg-muted/5" : "rounded-lg border border-border bg-[var(--card)] p-4"}>
      <div className="flex items-center justify-between">
        <div className={compact ? "flex items-center gap-3" : ""}>
          {!compact && <h3 className="text-sm font-medium text-zinc-400">Network Posture</h3>}
          <div className={compact ? "flex items-center gap-2" : "mt-1 flex items-center gap-2"}>
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-[800ms] ease-in-out ${
                isTransitioning
                  ? "bg-zinc-400 animate-pulse"
                  : isDefense ? "bg-amber-500" : "bg-teal-500"
              }`}
            />
            <span className={compact ? "text-sm font-semibold text-zinc-100" : "text-lg font-semibold text-zinc-100"}>
              {stateLabel}
            </span>
          </div>
          {!compact && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {isDefense
                ? "Gates locked to tribe. Turrets engaging outsiders."
                : "Gates accepting traffic. Turrets standing down."}
            </p>
          )}
        </div>

        {actionButton}
      </div>

      <div className="mt-3">
        {feedbackBlock}
      </div>
    </div>
  );
}
