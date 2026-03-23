/**
 * TreasuryEditor — Global treasury address card for toll payouts.
 */

import { useState } from "react";
import { TagChip } from "@/components/TagChip";
import type { TxStatus } from "@/types/domain";

interface TreasuryEditorProps {
  currentTreasury: string | null;
  isLoading: boolean;
  txStatus: TxStatus;
  defaultAddress?: string;
  onSet: (treasury: string) => void;
}

export function TreasuryEditor({
  currentTreasury,
  isLoading,
  txStatus,
  defaultAddress,
  onSet,
}: TreasuryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState(currentTreasury ?? defaultAddress ?? "");
  const isPending = txStatus === "pending";

  if (isLoading) {
    return (
      <div className="border border-border/50 rounded p-4">
        <p className="text-sm text-muted-foreground animate-pulse">Loading treasury…</p>
      </div>
    );
  }

  function handleApply() {
    if (!input || !input.startsWith("0x")) return;
    onSet(input);
    setIsEditing(false);
  }

  function handleEdit() {
    setInput(currentTreasury ?? defaultAddress ?? "");
    setIsEditing(true);
  }

  return (
    <div className="border border-border/50 rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Treasury</p>
          <p className="text-[11px] text-muted-foreground">
            Toll proceeds destination address
          </p>
        </div>
        <TagChip
          label={currentTreasury ? "SET" : "NOT SET"}
          variant={currentTreasury ? "success" : "default"}
          size="sm"
        />
      </div>

      {currentTreasury && !isEditing && (
        <div className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
          <p className="text-sm font-mono text-foreground truncate max-w-[300px]" title={currentTreasury}>
            {currentTreasury.slice(0, 10)}…{currentTreasury.slice(-6)}
          </p>
          <button
            onClick={handleEdit}
            disabled={isPending}
            className="text-[11px] px-3 py-1 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Edit
          </button>
        </div>
      )}

      {(!currentTreasury || isEditing) && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Treasury address (0x…)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
          />
          <p className="text-[11px] text-muted-foreground/50">
            All toll proceeds are sent to this address. Defaults to connected wallet.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={isPending || !input}
              className="text-[11px] px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {currentTreasury ? "Update" : "Set Treasury"}
            </button>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
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
