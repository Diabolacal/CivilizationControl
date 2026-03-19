/**
 * CoinTollEditor — Coin toll rule card for the gate policy composer.
 *
 * States: no-rule / configured / editing / submitting
 */

import { useState } from "react";
import { TagChip } from "@/components/TagChip";
import type { CoinTollRule, TxStatus } from "@/types/domain";
import { baseUnitsToEve, eveToBaseUnits, baseUnitsToLux, LUX_PER_EVE } from "@/lib/currency";

interface CoinTollEditorProps {
  currentRule: CoinTollRule | null;
  isLoading: boolean;
  txStatus: TxStatus;
  /** Connected wallet address — used as default treasury destination. */
  defaultTreasury?: string;
  onSet: (price: number, treasury: string) => void;
  onRemove: () => void;
}

export function CoinTollEditor({
  currentRule,
  isLoading,
  txStatus,
  defaultTreasury,
  onSet,
  onRemove,
}: CoinTollEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [priceInput, setPriceInput] = useState(
    currentRule?.price ? baseUnitsToEve(currentRule.price).toString() : "",
  );
  const [treasuryInput, setTreasuryInput] = useState(
    currentRule?.treasury ?? defaultTreasury ?? "",
  );

  const isPending = txStatus === "pending";
  const hasRule = currentRule !== null;

  // Lux equivalent for display (1 EVE = 100 Lux)
  const luxEquivalent = (() => {
    const eve = parseFloat(priceInput);
    if (!Number.isFinite(eve) || eve <= 0) return null;
    const lux = eve * LUX_PER_EVE;
    return lux.toLocaleString(undefined, { maximumFractionDigits: 2 });
  })();

  function handleApply() {
    const eve = parseFloat(priceInput);
    if (!Number.isFinite(eve) || eve <= 0) return;
    if (!treasuryInput || !treasuryInput.startsWith("0x")) return;
    onSet(eveToBaseUnits(eve), treasuryInput);
    setIsEditing(false);
  }

  function handleEdit() {
    setPriceInput(currentRule ? baseUnitsToEve(currentRule.price).toString() : "");
    setTreasuryInput(currentRule?.treasury ?? defaultTreasury ?? "");
    setIsEditing(true);
  }

  function handleCancel() {
    setPriceInput(currentRule ? baseUnitsToEve(currentRule.price).toString() : "");
    setTreasuryInput(currentRule?.treasury ?? defaultTreasury ?? "");
    setIsEditing(false);
  }

  if (isLoading) {
    return (
      <div className="border border-border/50 rounded p-4">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading coin toll…
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Coin Toll</p>
          <p className="text-[11px] text-muted-foreground">
            Require EVE toll per jump
          </p>
        </div>
        <TagChip
          label={hasRule ? "ACTIVE" : "INACTIVE"}
          variant={hasRule ? "success" : "default"}
          size="sm"
        />
      </div>

      {hasRule && !isEditing && (
        <div className="space-y-2 bg-background/50 rounded px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-mono text-foreground">
                Price: {baseUnitsToEve(currentRule.price).toLocaleString(undefined, { maximumFractionDigits: 4 })} EVE
                <span className="text-muted-foreground ml-1.5 text-[11px]">
                  ({baseUnitsToLux(currentRule.price).toLocaleString(undefined, { maximumFractionDigits: 2 })} Lux)
                </span>
              </p>
              <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[300px]" title={currentRule.treasury}>
                Treasury: {currentRule.treasury.slice(0, 10)}…{currentRule.treasury.slice(-6)}
              </p>
            </div>
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
        </div>
      )}

      {(!hasRule || isEditing) && (
        <div className="space-y-2">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Price in EVE (e.g. 100)"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            disabled={isPending}
            className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
          />
          {luxEquivalent && (
            <p className="text-[11px] text-muted-foreground/60">
              ≈ {luxEquivalent} Lux
            </p>
          )}
          <input
            type="text"
            placeholder="Treasury address (0x…)"
            value={treasuryInput}
            onChange={(e) => setTreasuryInput(e.target.value)}
            disabled={isPending}
            className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
          />
          <p className="text-[11px] text-muted-foreground/50">
            Toll proceeds destination. Defaults to your connected wallet.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={isPending || !priceInput || !treasuryInput}
              className="text-[11px] px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {hasRule ? "Update" : "Set Toll"}
            </button>
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
