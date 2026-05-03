import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionTooltip,
  getNodeLocalActionStatus,
  getNodeLocalPowerToggleIntent,
} from "@/lib/nodeDrilldownActionAuthority";
import { cn } from "@/lib/utils";

import type { StructureStatus, TxStatus } from "@/types/domain";
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

type PowerSegment = "off" | "on";

interface SegmentedPowerToggleProps {
  selectedSegment: PowerSegment | null;
  isInteractive: boolean;
  isBusy: boolean;
  disabledReason: string | null;
  onSelectSegment?: (segment: PowerSegment) => void;
}

function getSelectedSegment(status: StructureStatus): PowerSegment | null {
  if (status === "online") {
    return "on";
  }

  if (status === "offline") {
    return "off";
  }

  return null;
}

function segmentSelectedClass(segment: PowerSegment, isBusy: boolean): string {
  if (segment === "on") {
    return isBusy
      ? "border-teal-500/35 bg-teal-500/10 text-teal-200/70"
      : "border-teal-500/45 bg-teal-500/14 text-teal-200";
  }

  return isBusy
    ? "border-red-500/35 bg-red-500/10 text-red-200/70"
    : "border-red-500/45 bg-red-500/14 text-red-200";
}

function segmentIdleClass(segment: PowerSegment, isInteractive: boolean): string {
  if (!isInteractive) {
    return "text-muted-foreground/45";
  }

  return segment === "on"
    ? "text-teal-200/70 hover:bg-teal-500/8 hover:text-teal-200"
    : "text-red-200/70 hover:bg-red-500/8 hover:text-red-200";
}

function SegmentedPowerToggle({
  selectedSegment,
  isInteractive,
  isBusy,
  disabledReason,
  onSelectSegment,
}: SegmentedPowerToggleProps) {
  return (
    <div
      title={disabledReason ?? undefined}
      aria-label={disabledReason ?? "Power state control"}
      className="w-[116px]"
    >
      <div className="flex overflow-hidden rounded border border-border/60 bg-background/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {(["off", "on"] as const).map((segment, index) => {
          const isSelected = selectedSegment === segment;
          const isDisabled = isBusy || !isInteractive || isSelected;

          return (
            <button
              key={segment}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              onClick={() => onSelectSegment?.(segment)}
              className={cn(
                "flex-1 px-0 py-1 text-[10px] font-mono uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed",
                index === 1 ? "border-l border-border/60" : null,
                isSelected
                  ? segmentSelectedClass(segment, isBusy)
                  : segmentIdleClass(segment, isInteractive && !isBusy),
              )}
            >
              {segment}
            </button>
          );
        })}
      </div>
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
  powerStructureId = null,
  variant = "rail",
}: NodeStructureActionRailProps) {
  const toggleIntent = getNodeLocalPowerToggleIntent(structure);
  const effectiveStatus = getNodeLocalActionStatus(structure);
  const selectedSegment = getSelectedSegment(effectiveStatus);
  const isPending = powerStatus === "pending" && powerStructureId === structure.id;
  const isBusy = powerStatus === "pending";
  const showPowerAction = toggleIntent != null && onTogglePower != null;
  const disabledReason = isPending
    ? "Submitting structure power action…"
    : showPowerAction
      ? null
      : formatNodeLocalActionTooltip(structure);

  const handleTogglePower = (segment: PowerSegment) => {
    if (!toggleIntent || !onTogglePower) return;

    const nextOnline = segment === "on";
    if (toggleIntent.nextOnline !== nextOnline) return;

    onFocusStructure?.(structure.id);
    onTogglePower(structure, nextOnline);
  };

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
          <SegmentedPowerToggle
            selectedSegment={selectedSegment}
            isInteractive={showPowerAction && !isBusy}
            isBusy={isBusy}
            disabledReason={disabledReason}
            onSelectSegment={handleTogglePower}
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
    <div className="ml-1 flex w-[116px] shrink-0 flex-col items-end justify-center gap-1 text-right">
      {isHidden ? (
        <button
          type="button"
          onClick={() => onUnhideStructure(structure.canonicalDomainKey)}
          className="rounded border border-border/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          Unhide
        </button>
      ) : (
        <SegmentedPowerToggle
          selectedSegment={selectedSegment}
          isInteractive={showPowerAction && !isBusy}
          isBusy={isBusy}
          disabledReason={disabledReason}
          onSelectSegment={handleTogglePower}
        />
      )}
    </div>
  );
}