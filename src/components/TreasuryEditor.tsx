/**
 * TreasuryEditor — Treasury destination card with on-chain state honesty.
 *
 * Distinguishes between:
 * - NOT CONFIGURED: no treasury DF exists on-chain (toll flows will fail)
 * - CONFIGURED: treasury address is stored on-chain
 *
 * When not configured, prominently shows "Set On-Chain" with the wallet
 * address pre-filled. The operator must explicitly write to chain.
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
  const [input, setInput] = useState("");
  const isPending = txStatus === "pending";
  const isConfigured = !!currentTreasury;

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

  function handleSetWalletDefault() {
    if (!defaultAddress) return;
    onSet(defaultAddress);
  }

  function handleEdit() {
    setInput(currentTreasury ?? "");
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
          label={isConfigured ? "CONFIGURED" : "NOT CONFIGURED"}
          variant={isConfigured ? "success" : "warning"}
          size="sm"
        />
      </div>

      {/* Not configured — prominent setup prompt */}
      {!isConfigured && !isEditing && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded bg-amber-500/5 border border-amber-500/20 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80">
              Treasury is not yet configured on-chain. Toll collection and permit flows will fail until an address is set.
            </p>
          </div>
          {defaultAddress && (
            <div className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-mono text-foreground truncate max-w-[260px]" title={defaultAddress}>
                  {defaultAddress.slice(0, 10)}…{defaultAddress.slice(-6)}
                </p>
                <p className="text-[10px] text-muted-foreground/50">Connected wallet</p>
              </div>
              <button
                onClick={handleSetWalletDefault}
                disabled={isPending}
                className="text-[11px] px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 shrink-0"
              >
                {isPending ? "Setting…" : "Set On-Chain"}
              </button>
            </div>
          )}
          <button
            onClick={() => { setInput(""); setIsEditing(true); }}
            disabled={isPending}
            className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-50"
          >
            Use a different address →
          </button>
        </div>
      )}

      {/* Configured — show current address with edit controls */}
      {isConfigured && !isEditing && (
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

      {/* Editing state — manual address entry */}
      {isEditing && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Treasury address (0x…)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={isPending || !input}
              className="text-[11px] px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {isConfigured ? "Update" : "Set On-Chain"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="text-[11px] px-3 py-1.5 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
