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

import { useCallback, useMemo, useRef } from "react";
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
}

export function PostureControl({ nodeGroups, isConnected, compact, inline }: PostureControlProps) {
  const firstGateId = useMemo(() => {
    for (const group of nodeGroups) {
      if (group.gates.length > 0) return group.gates[0].objectId;
    }
    return undefined;
  }, [nodeGroups]);

  const { data: currentPosture, isLoading: postureLoading, isFetching: postureRefetching } = usePostureState(firstGateId);
  const { status, result, error, switchPosture, reset } = usePostureSwitch();
  const readiness = useOperatorReadiness(nodeGroups, isConnected);

  const posture: PostureMode = currentPosture ?? "commercial";
  const isDefense = posture === "defense";
  const isConfirming = status === "success" && postureRefetching;

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
    switchPosture({
      targetMode,
      gates: gateTargets,
      turrets,
    });
  }, [isDefense, gateTargets, turrets, switchPosture]);

  const isPending = status === "pending";
  // Prevent same-posture spam: also disable if already in the target posture
  const isDisabled = isPending || postureLoading || !readiness.isReady;

  const stateLabel = postureLoading
    ? "Resolving\u2026"
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
      {isPending
        ? "Executing…"
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

  // Inline mode-selector variant: Commercial / Defensive chip tabs + Save Preset placeholder.
  if (inline) {
    const commercialActive = !isDefense && !postureLoading;
    const defensiveActive = isDefense && !postureLoading;

    const chipBase =
      "flex items-center gap-2 rounded px-3 py-1.5 font-medium transition-colors duration-[800ms] ease-in-out border cursor-pointer disabled:cursor-not-allowed";
    const activeCommercial =
      "text-xs text-primary bg-primary/10 border-primary/20";
    const activeDefensive =
      "text-xs text-destructive bg-destructive/10 border-destructive/20";
    const inactive =
      "text-[11px] tracking-wide text-muted-foreground hover:text-foreground border-transparent disabled:opacity-50";

    return (
      <>
        {/* Mode selector pill strip */}
        <div className="flex items-center bg-[#09090b] border border-border/50 rounded p-1 gap-2">
          <button
            onClick={isDefense ? handleSwitch : undefined}
            disabled={isDisabled || commercialActive}
            className={`${chipBase} ${commercialActive ? activeCommercial : inactive}`}
          >
            <Store className="w-3.5 h-3.5" />
            {isPending && !isDefense ? "Switching…" : "Commercial"}
          </button>
          <button
            onClick={!isDefense ? handleSwitch : undefined}
            disabled={isDisabled || defensiveActive}
            className={`${chipBase} ${defensiveActive ? activeDefensive : inactive}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {isPending && isDefense ? "Switching…" : "Defensive"}
          </button>
        </div>
        {/* Save Preset placeholder (ghost — not wired yet) */}
        <div className="w-px h-4 bg-border/50 mx-2" />
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium tracking-wide rounded text-muted-foreground/60 border border-transparent cursor-not-allowed"
          title="Save Preset — coming soon"
        >
          <Settings2 className="w-3 h-3" />
          Save Preset
        </button>
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
                isDefense ? "bg-amber-500" : "bg-teal-500"
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
