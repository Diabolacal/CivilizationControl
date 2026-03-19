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
import { usePostureState, usePostureSwitch } from "@/hooks/usePosture";
import { useOperatorReadiness } from "@/hooks/useOperatorReadiness";
import { useAdminCapOwner } from "@/hooks/useAdminCapOwner";
import { useConnection } from "@evefrontier/dapp-kit";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";

import type {
  NetworkNodeGroup,
  PostureMode,
  TurretSwitchTarget,
} from "@/types/domain";

interface PostureControlProps {
  nodeGroups: NetworkNodeGroup[];
  isConnected: boolean;
}

export function PostureControl({ nodeGroups, isConnected }: PostureControlProps) {
  const { data: currentPosture, isLoading: postureLoading, isFetching: postureRefetching } = usePostureState();
  const { status, result, error, switchPosture, reset } = usePostureSwitch();
  const { data: adminCapOwner } = useAdminCapOwner();
  const { walletAddress } = useConnection();
  const readiness = useOperatorReadiness(nodeGroups, isConnected, adminCapOwner, walletAddress);

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

  const handleSwitch = useCallback(() => {
    const targetMode: PostureMode = isDefense ? "commercial" : "defense";
    lastTargetRef.current = targetMode;
    switchPosture({
      targetMode,
      turrets,
    });
  }, [isDefense, turrets, switchPosture]);

  const isPending = status === "pending";
  // Prevent same-posture spam: also disable if already in the target posture
  const isDisabled = isPending || postureLoading || !readiness.isReady;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-400">Network Posture</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-[800ms] ease-in-out ${
                isDefense ? "bg-amber-500" : "bg-teal-500"
              }`}
            />
            <span className="text-lg font-semibold text-zinc-100">
              {postureLoading
                ? "Resolving\u2026"
                : isConfirming
                  ? "Confirming\u2026"
                  : isDefense ? "Defense Mode" : "Open for Business"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {isDefense
              ? "Gates locked to tribe. Turrets targeting hostiles."
              : "Gates accepting traffic. Turrets in bouncer stance."}
          </p>
        </div>

        <button
          onClick={handleSwitch}
          disabled={isDisabled}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-[800ms] ease-in-out ${
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
      </div>

      {/* Readiness blockers */}
      {readiness.blockers.length > 0 && (
        <div className="mt-3 space-y-1.5">
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
        <div className="mt-3">
          <TxFeedbackBanner
            status={status}
            result={result}
            error={error ?? null}
            successLabel={`Posture switched to ${lastTargetRef.current === "defense" ? "Defense" : "Commercial"}`}
            onDismiss={reset}
          />
        </div>
      )}
    </div>
  );
}
