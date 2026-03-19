/**
 * TxFeedbackBanner — Transaction status feedback component.
 *
 * Displays pending/success/error state inline. Supports action-specific
 * copy via the optional `successLabel` and `pendingLabel` props.
 */

import type { TxStatus, TxResult } from "@/types/domain";

interface TxFeedbackBannerProps {
  status: TxStatus;
  result: TxResult | null;
  error: string | null;
  onDismiss: () => void;
  /** Custom label for the success state (default: "Transaction confirmed"). */
  successLabel?: string;
  /** Custom label for the pending state (default: "Submitting transaction…"). */
  pendingLabel?: string;
}

export function TxFeedbackBanner({
  status,
  result,
  error,
  onDismiss,
  successLabel = "Transaction confirmed",
  pendingLabel = "Submitting transaction…",
}: TxFeedbackBannerProps) {
  if (status === "idle") return null;

  return (
    <div
      className={`rounded px-4 py-3 text-sm border ${
        status === "pending"
          ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
          : status === "success"
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
            : "border-red-500/30 bg-red-500/5 text-red-200"
      }`}
    >
      {status === "pending" && (
        <p className="animate-pulse">{pendingLabel}</p>
      )}

      {status === "success" && result && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{successLabel}</p>
            <p className="text-[11px] font-mono opacity-70 mt-0.5">
              Digest: {result.digest.slice(0, 16)}…{result.digest.slice(-8)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-[11px] px-2 py-1 rounded border border-current/20 hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Transaction failed</p>
            <p className="text-[11px] opacity-70 mt-0.5">
              {error ?? "Unknown error"}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-[11px] px-2 py-1 rounded border border-current/20 hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
