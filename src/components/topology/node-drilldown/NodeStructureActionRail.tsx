import { formatNodeLocalStatus } from "@/lib/nodeDrilldownModel";
import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionAuthorityLabel,
  getNodeLocalActionStatus,
  getNodeLocalPowerToggleIntent,
} from "@/lib/nodeDrilldownActionAuthority";
import { cn } from "@/lib/utils";

import type { TxStatus } from "@/types/domain";
import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

interface NodeStructureActionRailProps {
  structure: NodeLocalStructure;
  isHidden: boolean;
  onUnhideStructure: (canonicalDomainKey: string) => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  onFocusStructure?: (structureId: string) => void;
  powerStatus?: TxStatus;
  powerStructureId?: string | null;
  previewMode?: boolean;
  variant?: "rail" | "panel";
}

function statusToneClass(status: ReturnType<typeof getNodeLocalActionStatus>): string {
  switch (status) {
    case "online":
      return "text-teal-300/80";
    case "offline":
      return "text-red-300/80";
    case "warning":
      return "text-amber-300/80";
    default:
      return "text-muted-foreground/70";
  }
}

function actionButtonClass(nextOnline: boolean): string {
  return nextOnline
    ? "border-teal-500/30 bg-teal-500/10 text-teal-300/85 hover:bg-teal-500/15"
    : "border-red-500/30 bg-red-500/10 text-red-300/85 hover:bg-red-500/15";
}

export function NodeStructureActionRail({
  structure,
  isHidden,
  onUnhideStructure,
  onTogglePower,
  onFocusStructure,
  powerStatus = "idle",
  powerStructureId = null,
  previewMode = false,
  variant = "rail",
}: NodeStructureActionRailProps) {
  const toggleIntent = getNodeLocalPowerToggleIntent(structure);
  const effectiveStatus = getNodeLocalActionStatus(structure);
  const isPending = powerStatus === "pending" && powerStructureId === structure.id;
  const isBusy = powerStatus === "pending";
  const showPowerAction = toggleIntent != null && onTogglePower != null;

  const handleTogglePower = () => {
    if (!toggleIntent || !onTogglePower) return;
    onFocusStructure?.(structure.id);
    onTogglePower(structure, toggleIntent.nextOnline);
  };

  if (variant === "panel") {
    return (
      <div className="space-y-3 rounded border border-border/50 bg-muted/5 px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
              Action Authority
            </p>
            <p className="text-sm text-foreground">{formatNodeLocalActionAuthorityLabel(structure)}</p>
            <p className="text-xs text-muted-foreground">{formatNodeLocalActionAuthorityDetail(structure)}</p>
          </div>
          <span className={cn("text-[11px] uppercase tracking-wide", statusToneClass(effectiveStatus))}>
            {formatNodeLocalStatus(effectiveStatus)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isHidden ? (
            <button
              type="button"
              onClick={() => onUnhideStructure(structure.canonicalDomainKey)}
              className="rounded border border-border/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Unhide
            </button>
          ) : null}

          {showPowerAction ? (
            <button
              type="button"
              onClick={handleTogglePower}
              disabled={isBusy}
              className={cn(
                "rounded border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                actionButtonClass(toggleIntent.nextOnline),
              )}
            >
              {isPending ? "Executing…" : toggleIntent.actionLabel}
            </button>
          ) : null}

          {previewMode ? (
            <span className="rounded border border-border/50 bg-background/60 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
              Preview only
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="ml-1 flex w-[132px] shrink-0 flex-col items-end gap-1 text-right">
      <span className={cn("text-[11px] uppercase tracking-wide", statusToneClass(effectiveStatus))}>
        {formatNodeLocalStatus(effectiveStatus)}
      </span>

      {isHidden ? (
        <button
          type="button"
          onClick={() => onUnhideStructure(structure.canonicalDomainKey)}
          className="rounded border border-border/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          Unhide
        </button>
      ) : showPowerAction ? (
        <button
          type="button"
          onClick={handleTogglePower}
          disabled={isBusy}
          className={cn(
            "rounded border px-2 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            actionButtonClass(toggleIntent.nextOnline),
          )}
        >
          {isPending ? "Executing…" : toggleIntent.actionLabel}
        </button>
      ) : (
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/55">
          Unavailable
        </span>
      )}

      {previewMode && showPowerAction ? (
        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/50">
          Preview
        </span>
      ) : null}
    </div>
  );
}