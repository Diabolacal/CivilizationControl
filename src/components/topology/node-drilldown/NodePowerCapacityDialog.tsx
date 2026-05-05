import { useEffect } from "react";

import { NodeDrilldownOverlayPanel } from "@/components/topology/node-drilldown/NodeDrilldownOverlayPanel";

interface NodePowerCapacityDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel?: string | null;
  dismissLabel?: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
}

export function NodePowerCapacityDialog({
  isOpen,
  title,
  body,
  confirmLabel = null,
  dismissLabel = "Close",
  isPending = false,
  onCancel,
  onConfirm,
}: NodePowerCapacityDialogProps) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (!isPending) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => { if (!isPending) onCancel(); }} />
      <NodeDrilldownOverlayPanel className="relative z-10 w-full max-w-md p-5" role="dialog" aria-modal="true" aria-labelledby="node-power-capacity-title">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
              Node Power State
            </p>
            <h2 id="node-power-capacity-title" className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dismissLabel}
            </button>
            {confirmLabel && onConfirm ? (
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Submitting..." : confirmLabel}
              </button>
            ) : null}
          </div>
        </div>
      </NodeDrilldownOverlayPanel>
    </div>
  );
}