/**
 * TribeRuleEditor — Tribe filter rule card for the gate policy composer.
 *
 * States: no-rule / configured / editing / submitting
 */

import { useState } from "react";
import { TagChip } from "@/components/TagChip";
import { TribePicker } from "@/components/TribePicker";
import { resolveTribeName } from "@/lib/tribeCatalog";
import type { TribeRule, TxStatus, Tribe } from "@/types/domain";

interface TribeRuleEditorProps {
  currentRule: TribeRule | null;
  isLoading: boolean;
  txStatus: TxStatus;
  onSet: (tribe: number) => void;
  onRemove: () => void;
}

export function TribeRuleEditor({
  currentRule,
  isLoading,
  txStatus,
  onSet,
  onRemove,
}: TribeRuleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const isPending = txStatus === "pending";
  const hasRule = currentRule !== null;

  function handleTribeSelect(tribe: Tribe) {
    onSet(tribe.tribeId);
    setIsEditing(false);
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  if (isLoading) {
    return (
      <div className="border border-border/50 rounded p-4">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading tribe filter…
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Tribe Filter</p>
          <p className="text-[11px] text-muted-foreground">
            Restrict jump access to a specific tribe
          </p>
        </div>
        <TagChip
          label={hasRule ? "ACTIVE" : "INACTIVE"}
          variant={hasRule ? "success" : "default"}
          size="sm"
        />
      </div>

      {hasRule && !isEditing && (
        <div className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
          <p className="text-sm font-mono text-foreground">
            {resolveTribeName(currentRule.tribe)} ({currentRule.tribe})
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={isPending}
              className="text-[11px] px-3 py-1 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={onRemove}
              disabled={isPending}
              className="text-[11px] px-3 py-1 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {(!hasRule || isEditing) && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <TribePicker onSelect={handleTribeSelect} />
            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="text-[11px] px-3 py-1.5 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
