import {
  formatNodeLocalActionAuthorityDetail,
  getNodeLocalPowerControlState,
  type NodeLocalPowerSegment,
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

const POWER_SEGMENT_LABELS = {
  offline: "Offline",
  online: "Online",
} as const;

interface SegmentedPowerToggleProps {
  selectedSegment: NodeLocalPowerSegment | null;
  isInteractive: boolean;
  isBusy: boolean;
  onSelectSegment?: (segment: NodeLocalPowerSegment) => void;
}

function segmentTone(segment: NodeLocalPowerSegment): string {
  return segment === "online" ? "var(--topo-state-online)" : "var(--topo-state-offline)";
}

function segmentSelectedStyle(segment: NodeLocalPowerSegment, isDimmed: boolean): React.CSSProperties {
  const tone = segmentTone(segment);

  return {
    borderColor: `color-mix(in srgb, ${tone} ${isDimmed ? "38%" : "46%"}, var(--border) ${isDimmed ? "62%" : "54%"})`,
    backgroundColor: `color-mix(in srgb, ${tone} ${isDimmed ? "10%" : "16%"}, transparent)`,
    color: tone,
    opacity: isDimmed ? 0.72 : 1,
  };
}

function segmentIdleStyle(segment: NodeLocalPowerSegment, isInteractive: boolean): React.CSSProperties | undefined {
  if (!isInteractive) {
    return undefined;
  }

  return {
    color: `color-mix(in srgb, ${segmentTone(segment)} 78%, var(--foreground) 22%)`,
  };
}

function segmentTitle(
  segment: NodeLocalPowerSegment,
  isSelected: boolean,
  isInteractive: boolean,
  isBusy: boolean,
): string {
  if (isBusy) {
    return "Submitting structure power action…";
  }

  if (!isInteractive) {
    return isSelected ? `Currently ${POWER_SEGMENT_LABELS[segment]}` : POWER_SEGMENT_LABELS[segment];
  }

  if (isSelected) {
    return `Currently ${POWER_SEGMENT_LABELS[segment]}`;
  }

  return segment === "online" ? "Bring Online" : "Take Offline";
}

function SegmentedPowerToggle({
  selectedSegment,
  isInteractive,
  isBusy,
  onSelectSegment,
}: SegmentedPowerToggleProps) {
  return (
    <div aria-label="Online or Offline control" className="w-[146px]">
      <div className="flex overflow-hidden rounded border border-border/60 bg-background/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {(["offline", "online"] as const).map((segment, index) => {
          const isSelected = selectedSegment === segment;
          const isUnavailable = !isInteractive && !isBusy;
          const title = segmentTitle(segment, isSelected, isInteractive, isBusy);

          return (
            <button
              key={segment}
              type="button"
              disabled={isBusy}
              aria-pressed={isSelected}
              aria-disabled={isBusy || isUnavailable || isSelected}
              title={title}
              onClick={() => {
                if (isSelected || isBusy || !isInteractive) {
                  return;
                }

                onSelectSegment?.(segment);
              }}
              className={cn(
                "flex-1 px-2 py-1 text-[11px] font-medium transition-colors",
                index === 1 ? "border-l border-border/60" : null,
                isBusy
                  ? "cursor-not-allowed text-muted-foreground/45"
                  : isUnavailable
                    ? "cursor-default text-muted-foreground/60"
                  : isSelected
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-background/50",
              )}
              style={isSelected ? segmentSelectedStyle(segment, isBusy || !isInteractive) : segmentIdleStyle(segment, isInteractive && !isBusy)}
            >
              {POWER_SEGMENT_LABELS[segment]}
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
  variant = "rail",
}: NodeStructureActionRailProps) {
  const powerControl = getNodeLocalPowerControlState(structure);
  const selectedSegment = powerControl.selectedSegment;
  const isBusy = powerStatus === "pending";
  const showPowerAction = powerControl.isInteractive && onTogglePower != null;

  const handleTogglePower = (segment: NodeLocalPowerSegment) => {
    if (powerControl.nextOnline == null || !onTogglePower) return;

    const nextOnline = segment === "online";
    if (powerControl.nextOnline !== nextOnline) return;

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
    <div className="ml-1 flex w-[146px] shrink-0 flex-col items-end justify-center gap-1 text-right">
      <SegmentedPowerToggle
        selectedSegment={selectedSegment}
        isInteractive={showPowerAction && !isBusy}
        isBusy={isBusy}
        onSelectSegment={handleTogglePower}
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