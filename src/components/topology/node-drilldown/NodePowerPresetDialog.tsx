import { useEffect, useMemo, useState } from "react";

import { NodeDrilldownOverlayPanel } from "@/components/topology/node-drilldown/NodeDrilldownOverlayPanel";
import {
  getDefaultNodePowerPresetLabel,
  NODE_POWER_PRESET_LABEL_MAX_LENGTH,
  NODE_POWER_PRESET_SLOT_COUNT,
  type NodePowerPresetSlot,
} from "@/lib/nodePowerPresets";
import { cn } from "@/lib/utils";

interface NodePowerPresetDialogProps {
  isOpen: boolean;
  slots: readonly (NodePowerPresetSlot | null)[];
  defaultSlotIndex: number;
  onClose: () => void;
  onSave: (slotIndex: number, label: string) => void;
}

export function NodePowerPresetDialog({
  isOpen,
  slots,
  defaultSlotIndex,
  onClose,
  onSave,
}: NodePowerPresetDialogProps) {
  const [slotIndex, setSlotIndex] = useState(defaultSlotIndex);
  const [draftLabel, setDraftLabel] = useState(getDefaultNodePowerPresetLabel(defaultSlotIndex));
  const selectedSlot = slots[slotIndex - 1] ?? null;
  const trimmedLabel = draftLabel.trim();
  const validationMessage = useMemo(() => {
    if (trimmedLabel.length === 0) return "Name cannot be empty.";
    if (trimmedLabel.length > NODE_POWER_PRESET_LABEL_MAX_LENGTH) {
      return `Name must be ${NODE_POWER_PRESET_LABEL_MAX_LENGTH} characters or fewer.`;
    }
    return null;
  }, [trimmedLabel]);

  useEffect(() => {
    if (!isOpen) return;

    setSlotIndex(defaultSlotIndex);
    setDraftLabel(slots[defaultSlotIndex - 1]?.label ?? getDefaultNodePowerPresetLabel(defaultSlotIndex));
  }, [defaultSlotIndex, isOpen, slots]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSaveDisabled = validationMessage != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <NodeDrilldownOverlayPanel className="relative z-10 w-full max-w-md p-5" role="dialog" aria-modal="true" aria-labelledby="node-power-preset-title">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
              Node Power State
            </p>
            <h2 id="node-power-preset-title" className="text-lg font-semibold text-foreground">Save power preset</h2>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: NODE_POWER_PRESET_SLOT_COUNT }, (_, index) => {
              const nextSlotIndex = index + 1;
              const slot = slots[index];
              const isSelected = slotIndex === nextSlotIndex;
              return (
                <button
                  key={nextSlotIndex}
                  type="button"
                  onClick={() => {
                    setSlotIndex(nextSlotIndex);
                    setDraftLabel(slot?.label ?? getDefaultNodePowerPresetLabel(nextSlotIndex));
                  }}
                  className={cn(
                    "rounded border px-2 py-2 text-left text-[11px] transition-colors",
                    isSelected
                      ? "border-primary/55 bg-primary/10 text-primary"
                      : "border-border/60 bg-background/35 text-muted-foreground hover:border-primary/35 hover:text-foreground",
                  )}
                >
                  <span className="block font-medium">{slot?.label ?? getDefaultNodePowerPresetLabel(nextSlotIndex)}</span>
                  <span className="mt-0.5 block font-mono uppercase tracking-[0.16em] text-[9px] opacity-65">
                    {slot ? "Overwrite" : "Empty"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70" htmlFor="node-power-preset-name">
              Preset name
            </label>
            <input
              id="node-power-preset-name"
              type="text"
              value={draftLabel}
              maxLength={NODE_POWER_PRESET_LABEL_MAX_LENGTH}
              autoFocus
              onChange={(event) => setDraftLabel(event.target.value)}
              className="w-full rounded border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
            />
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className={validationMessage ? "text-red-400" : "text-muted-foreground/70"}>
                {validationMessage ?? (selectedSlot ? "Saving will replace this slot." : "Saved locally for this node.")}
              </span>
              <span className="font-mono text-muted-foreground/60">
                {trimmedLabel.length}/{NODE_POWER_PRESET_LABEL_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(slotIndex, trimmedLabel)}
              disabled={isSaveDisabled}
              className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save power preset
            </button>
          </div>
        </div>
      </NodeDrilldownOverlayPanel>
    </div>
  );
}