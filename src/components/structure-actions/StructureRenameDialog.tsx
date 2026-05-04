import { useEffect, useMemo, useState } from "react";

import { NodeDrilldownOverlayPanel } from "@/components/topology/node-drilldown/NodeDrilldownOverlayPanel";

const STRUCTURE_RENAME_MAX_LENGTH = 64;

interface StructureRenameDialogProps {
  isOpen: boolean;
  structureName: string;
  initialValue: string;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (nextName: string) => void;
}

export function StructureRenameDialog({
  isOpen,
  structureName,
  initialValue,
  isPending = false,
  error = null,
  onClose,
  onSubmit,
}: StructureRenameDialogProps) {
  const [draftName, setDraftName] = useState(initialValue);
  const trimmedName = draftName.trim();
  const normalizedInitialName = initialValue.trim();
  const validationMessage = useMemo(() => {
    if (trimmedName.length === 0) {
      return "Name cannot be empty.";
    }

    if (trimmedName.length > STRUCTURE_RENAME_MAX_LENGTH) {
      return `Name must be ${STRUCTURE_RENAME_MAX_LENGTH} characters or fewer.`;
    }

    return null;
  }, [trimmedName]);
  const isUnchanged = trimmedName === normalizedInitialName;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftName(initialValue);
  }, [initialValue, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      if (!isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) {
    return null;
  }

  const isSubmitDisabled = isPending || validationMessage != null || isUnchanged;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => { if (!isPending) onClose(); }} />
      <NodeDrilldownOverlayPanel className="relative z-10 w-full max-w-md p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
              Structure Action
            </p>
            <h2 className="text-lg font-semibold text-foreground">Rename Assembly</h2>
            <p className="text-sm text-muted-foreground">
              Update the operator-facing name for {structureName}.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70" htmlFor="structure-rename-input">
              Assembly Name
            </label>
            <input
              id="structure-rename-input"
              type="text"
              value={draftName}
              maxLength={STRUCTURE_RENAME_MAX_LENGTH}
              disabled={isPending}
              autoFocus
              onChange={(event) => setDraftName(event.target.value)}
              className="w-full rounded border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
            />
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className={validationMessage ? "text-red-400" : "text-muted-foreground/70"}>
                {validationMessage ?? "Use a concise operator-facing label."}
              </span>
              <span className="font-mono text-muted-foreground/60">
                {trimmedName.length}/{STRUCTURE_RENAME_MAX_LENGTH}
              </span>
            </div>
            {error ? <p className="text-[11px] text-red-400">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSubmit(trimmedName)}
              disabled={isSubmitDisabled}
              className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Renaming…" : "Rename Assembly"}
            </button>
          </div>
        </div>
      </NodeDrilldownOverlayPanel>
    </div>
  );
}