import { useEffect, useRef, useState } from "react";

import { ChevronDown, Download, Save, Upload } from "lucide-react";

import type { NodePowerOperationPlan } from "@/lib/nodePowerControlModel";
import { getDefaultNodePowerPresetLabel, type NodePowerPresetSlot } from "@/lib/nodePowerPresets";
import { cn } from "@/lib/utils";

interface NodePowerActionStripProps {
  slots: readonly (NodePowerPresetSlot | null)[];
  presetPlans: readonly NodePowerOperationPlan[];
  bringOnlinePlan: NodePowerOperationPlan;
  takeOfflinePlan: NodePowerOperationPlan;
  isPending: boolean;
  savePresetDisabledReason: string | null;
  onApplyPreset: (slotIndex: number) => void;
  onSavePreset: () => void;
  onBulkPower: (nextOnline: boolean) => void;
  onBack: () => void;
}

function ActionDivider() {
  return <span className="h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />;
}

export function NodePowerActionStrip({
  slots,
  presetPlans,
  bringOnlinePlan,
  takeOfflinePlan,
  isPending,
  savePresetDisabledReason,
  onApplyPreset,
  onSavePreset,
  onBulkPower,
  onBack,
}: NodePowerActionStripProps) {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const presetMenuRef = useRef<HTMLDivElement | null>(null);
  const bringDisabledReason = bringOnlinePlan.disabledReason;
  const takeDisabledReason = takeOfflinePlan.disabledReason;

  useEffect(() => {
    if (!isPresetMenuOpen) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!presetMenuRef.current?.contains(target)) {
        setIsPresetMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPresetMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPresetMenuOpen]);

  return (
    <div className="flex max-w-full min-w-0 items-center justify-end gap-1.5 overflow-visible py-0.5 xl:gap-2">
      <div ref={presetMenuRef} className="relative inline-flex shrink-0 lg:hidden">
        <button
          type="button"
          aria-label="Power presets"
          aria-expanded={isPresetMenuOpen}
          onClick={() => setIsPresetMenuOpen((current) => !current)}
          className="inline-flex h-8 items-center gap-1.5 rounded border border-border/65 bg-background/20 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/70"
        >
          Presets
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isPresetMenuOpen && "rotate-180")} />
        </button>
        {isPresetMenuOpen && (
          <div className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-44 rounded border border-border/70 bg-background/95 p-1 shadow-lg shadow-black/40">
            {slots.map((slot, index) => {
              const slotIndex = index + 1;
              const plan = presetPlans[index];
              const isDisabled = isPending || !slot || plan?.disabledReason != null;
              return (
                <button
                  key={slotIndex}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onApplyPreset(slotIndex);
                    setIsPresetMenuOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-full items-center rounded px-2 text-left text-[11px] font-medium transition-colors",
                    isDisabled
                      ? "cursor-not-allowed text-muted-foreground/45"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <span className="truncate">{slot?.label ?? getDefaultNodePowerPresetLabel(slotIndex)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-1 rounded border border-border/45 bg-background/25 p-0.5 lg:inline-flex">
        {slots.map((slot, index) => {
          const slotIndex = index + 1;
          const plan = presetPlans[index];
          const isDisabled = isPending || !slot || plan?.disabledReason != null;
          return (
            <button
              key={slotIndex}
              type="button"
              disabled={isDisabled}
              onClick={() => onApplyPreset(slotIndex)}
              className={cn(
                "h-7 max-w-[92px] truncate rounded px-2.5 text-[11px] font-medium transition-colors",
                isDisabled
                  ? "cursor-not-allowed text-muted-foreground/45"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
              )}
            >
              {slot?.label ?? getDefaultNodePowerPresetLabel(slotIndex)}
            </button>
          );
        })}
      </div>

      <ActionDivider />

      <button
        type="button"
        aria-label="Save power preset"
        disabled={isPending || savePresetDisabledReason != null}
        onClick={onSavePreset}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-border/65 bg-background/20 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Save className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Save power preset</span>
        <span className="xl:hidden">Save</span>
      </button>

      <ActionDivider />

      <div className="inline-flex shrink-0 items-center gap-1 rounded border border-border/45 bg-background/25 p-0.5">
        <button
          type="button"
          aria-label="Take all offline"
          disabled={isPending || takeDisabledReason != null}
          onClick={() => onBulkPower(false)}
          className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[11px] font-medium text-[var(--topo-state-offline)] transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-muted-foreground/45"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Take all offline</span>
          <span className="xl:hidden">Offline</span>
        </button>
        <button
          type="button"
          aria-label="Bring all online"
          disabled={isPending || bringDisabledReason != null}
          onClick={() => onBulkPower(true)}
          className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[11px] font-medium text-[var(--topo-state-online)] transition-colors hover:bg-teal-500/10 disabled:cursor-not-allowed disabled:text-muted-foreground/45"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Bring all online</span>
          <span className="xl:hidden">Online</span>
        </button>
      </div>

      <ActionDivider />

      <button
        type="button"
        aria-label="Back to Strategic Network"
        onClick={onBack}
        className="h-8 shrink-0 whitespace-nowrap rounded border border-border/70 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <span className="hidden xl:inline">Back to Strategic Network</span>
        <span className="xl:hidden">Back</span>
      </button>
    </div>
  );
}
