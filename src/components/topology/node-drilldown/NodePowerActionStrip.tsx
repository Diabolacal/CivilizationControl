import { Save, Upload, Download } from "lucide-react";

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

function disabledTitle(reason: string | null, isPending: boolean): string | undefined {
  if (isPending) return "action already pending";
  return reason ?? undefined;
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
  const bringDisabledReason = bringOnlinePlan.disabledReason;
  const takeDisabledReason = takeOfflinePlan.disabledReason;

  return (
    <div className="flex max-w-full items-center justify-end gap-2 overflow-x-auto py-0.5">
      <div className="inline-flex shrink-0 items-center gap-1 rounded border border-border/45 bg-background/25 p-0.5">
        {slots.map((slot, index) => {
          const slotIndex = index + 1;
          const plan = presetPlans[index];
          const isDisabled = isPending || !slot || plan?.disabledReason != null;
          return (
            <button
              key={slotIndex}
              type="button"
              disabled={isDisabled}
              title={disabledTitle(!slot ? "preset slot empty" : plan?.disabledReason ?? plan?.capacityReason ?? null, isPending)}
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
        disabled={isPending || savePresetDisabledReason != null}
        title={disabledTitle(savePresetDisabledReason, isPending)}
        onClick={onSavePreset}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-border/65 bg-background/20 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Save className="h-3.5 w-3.5" />
        Save power preset
      </button>

      <ActionDivider />

      <div className="inline-flex shrink-0 items-center gap-1 rounded border border-border/45 bg-background/25 p-0.5">
        <button
          type="button"
          disabled={isPending || takeDisabledReason != null}
          title={disabledTitle(takeDisabledReason, isPending)}
          onClick={() => onBulkPower(false)}
          className="inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium text-[var(--topo-state-offline)] transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-muted-foreground/45"
        >
          <Download className="h-3.5 w-3.5" />
          Take all offline
        </button>
        <button
          type="button"
          disabled={isPending || bringDisabledReason != null}
          title={disabledTitle(bringDisabledReason ?? bringOnlinePlan.capacityReason, isPending)}
          onClick={() => onBulkPower(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium text-[var(--topo-state-online)] transition-colors hover:bg-teal-500/10 disabled:cursor-not-allowed disabled:text-muted-foreground/45"
        >
          <Upload className="h-3.5 w-3.5" />
          Bring all online
        </button>
      </div>

      <ActionDivider />

      <button
        type="button"
        onClick={onBack}
        className="h-8 shrink-0 rounded border border-border/70 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        Back to Strategic Network
      </button>
    </div>
  );
}