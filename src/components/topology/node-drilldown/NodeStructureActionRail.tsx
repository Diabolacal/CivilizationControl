import {
  formatNodeLocalActionAuthorityDetail,
  getNodeLocalPowerControlState,
  type NodeLocalPowerSegment,
} from "@/lib/nodeDrilldownActionAuthority";
import { cn } from "@/lib/utils";

import type { TxStatus } from "@/types/domain";
import type { StructureStatus } from "@/types/domain";
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

interface PowerActionControlProps {
  currentStatus: StructureStatus;
  actionLabel: "Bring Online" | "Take Offline" | null;
  isInteractive: boolean;
  isBusy: boolean;
  unavailableReason: string | null;
  onTriggerAction?: () => void;
}

interface StatusPillDescriptor {
  label: string;
  tone: string;
}

function getStatusPillDescriptor(status: StructureStatus): StatusPillDescriptor {
  switch (status) {
    case "online":
      return { label: "ONLINE", tone: "var(--topo-state-online)" };
    case "offline":
      return { label: "OFFLINE", tone: "var(--topo-state-offline)" };
    case "warning":
      return { label: "ALERT", tone: "var(--topo-state-warning)" };
    default:
      return { label: "UNCLEAR", tone: "var(--muted-foreground)" };
  }
}

function getFallbackActionLabel(status: StructureStatus): "Bring online" | "Take offline" | null {
  if (status === "online") {
    return "Take offline";
  }

  if (status === "offline") {
    return "Bring online";
  }

  return null;
}

function formatActionButtonLabel(actionLabel: "Bring Online" | "Take Offline" | null, status: StructureStatus): string | null {
  if (actionLabel === "Bring Online") {
    return "Bring online";
  }

  if (actionLabel === "Take Offline") {
    return "Take offline";
  }

  return getFallbackActionLabel(status);
}

function getStatusPillStyle(status: StructureStatus, isDimmed: boolean): React.CSSProperties {
  const descriptor = getStatusPillDescriptor(status);

  return {
    borderColor: `color-mix(in srgb, ${descriptor.tone} ${isDimmed ? "34%" : "42%"}, var(--border) ${isDimmed ? "66%" : "58%"})`,
    backgroundColor: `color-mix(in srgb, ${descriptor.tone} ${isDimmed ? "10%" : "15%"}, transparent)`,
    color: descriptor.tone,
    opacity: isDimmed ? 0.7 : 1,
  };
}

function PowerActionControl({
  currentStatus,
  actionLabel,
  isInteractive,
  isBusy,
  unavailableReason,
  onTriggerAction,
}: PowerActionControlProps) {
  const pill = getStatusPillDescriptor(currentStatus);
  const buttonLabel = isBusy ? "Working..." : formatActionButtonLabel(actionLabel, currentStatus);
  const showActionButton = buttonLabel != null && (isInteractive || unavailableReason != null || isBusy);
  const buttonTitle = isBusy
    ? "Submitting structure power action…"
    : isInteractive
      ? buttonLabel
      : unavailableReason;

  return (
    <div aria-label="Structure status and power action" className="grid w-[184px] grid-cols-[72px_104px] items-center justify-end gap-2">
      <span
        className="inline-flex h-7 items-center justify-center rounded border bg-background/35 px-2 text-[10px] font-mono uppercase tracking-[0.2em] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        style={getStatusPillStyle(currentStatus, isBusy || !isInteractive)}
        title={`Current status: ${pill.label.toLowerCase()}`}
      >
        {pill.label}
      </span>

      {showActionButton ? (
        <button
          type="button"
          disabled={!isInteractive || isBusy}
          aria-disabled={!isInteractive || isBusy}
          aria-busy={isBusy || undefined}
          title={buttonTitle ?? undefined}
          onClick={() => {
            if (!isInteractive || isBusy) {
              return;
            }

            onTriggerAction?.();
          }}
          className={cn(
            "inline-flex h-7 items-center justify-center rounded border px-2.5 text-[11px] font-medium transition-colors",
            isInteractive && !isBusy
              ? "border-border/60 bg-background/35 text-foreground hover:border-primary/50 hover:bg-background/55 hover:text-primary"
              : "cursor-default border-border/50 bg-background/20 text-muted-foreground/60",
            isBusy ? "cursor-not-allowed" : null,
          )}
        >
          {buttonLabel}
        </button>
      ) : (
        <span className="h-7" aria-hidden="true" />
      )}
    </div>
  );
}

export function NodeStructureActionRail({
  structure,
  isHidden,
  onUnhideStructure,
  onTogglePower,
  onFocusStructure,
  powerStatus = "idle",
  variant = "rail",
}: NodeStructureActionRailProps) {
  const powerControl = getNodeLocalPowerControlState(structure);
  const isBusy = powerStatus === "pending";
  const showPowerAction = powerControl.isInteractive && onTogglePower != null;
  const unavailableReason = powerControl.isStatusOnly ? formatNodeLocalActionAuthorityDetail(structure) : null;

  const handleTogglePower = (segment: NodeLocalPowerSegment) => {
    if (powerControl.nextOnline == null || !onTogglePower) return;

    const nextOnline = segment === "online";
    if (powerControl.nextOnline !== nextOnline) return;

    onFocusStructure?.(structure.id);
    onTogglePower(structure, nextOnline);
  };

  const nextSegment = powerControl.nextOnline == null ? null : powerControl.nextOnline ? "online" : "offline";

  if (variant === "panel") {
    return (
      <div className="space-y-3 rounded border border-border/50 bg-muted/5 px-3 py-3">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
            Action Control
          </p>
          <p className="text-xs text-muted-foreground">{formatNodeLocalActionAuthorityDetail(structure)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PowerActionControl
            currentStatus={powerControl.currentStatus}
            actionLabel={powerControl.actionLabel}
            isInteractive={showPowerAction && !isBusy}
            isBusy={isBusy}
            unavailableReason={unavailableReason}
            onTriggerAction={() => {
              if (nextSegment == null) {
                return;
              }

              handleTogglePower(nextSegment);
            }}
          />

          {isHidden ? (
            <button
              type="button"
              onClick={() => onUnhideStructure(structure.canonicalDomainKey)}
              className="rounded border border-border/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Unhide
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="ml-1 flex w-[184px] shrink-0 flex-col items-end justify-center gap-1 text-right">
      <PowerActionControl
        currentStatus={powerControl.currentStatus}
        actionLabel={powerControl.actionLabel}
        isInteractive={showPowerAction && !isBusy}
        isBusy={isBusy}
        unavailableReason={unavailableReason}
        onTriggerAction={() => {
          if (nextSegment == null) {
            return;
          }

          handleTogglePower(nextSegment);
        }}
      />

      {isHidden ? (
        <button
          type="button"
          onClick={() => onUnhideStructure(structure.canonicalDomainKey)}
          className="rounded border border-border/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          Unhide
        </button>
      ) : null}
    </div>
  );
}