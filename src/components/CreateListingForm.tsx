/**
 * CreateListingForm — Inventory-backed listing creation form.
 *
 * Operator selects an item from the SSU inventory browser,
 * chooses quantity, sets a price, and submits. Raw type-ID
 * entry is available as an advanced fallback only.
 */

import { useState } from "react";
import { InventoryBrowser } from "@/components/InventoryBrowser";
import { resolveItemTypeName } from "@/lib/typeCatalog";
import { luxToBaseUnits } from "@/lib/currency";
import type { TxStatus, InventoryEntry } from "@/types/domain";

interface CreateListingFormProps {
  txStatus: TxStatus;
  onSubmit: (itemTypeId: number, quantity: number, price: number) => void;
  inventoryItems: InventoryEntry[];
  isInventoryLoading: boolean;
}

export function CreateListingForm({
  txStatus,
  onSubmit,
  inventoryItems,
  isInventoryLoading,
}: CreateListingFormProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryEntry | null>(null);
  const [quantity, setQuantity] = useState("");
  const [priceInLux, setPriceInLux] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTypeId, setManualTypeId] = useState("");

  const isBusy = txStatus === "pending";

  const handleSelect = (entry: InventoryEntry) => {
    setSelectedItem(entry);
    setQuantity("");
    setValidationError(null);
    setShowManualEntry(false);
    setManualTypeId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    let typeId: number;
    let maxQty: number;

    if (showManualEntry) {
      typeId = Number(manualTypeId);
      maxQty = Infinity;
      if (!Number.isFinite(typeId) || typeId <= 0) {
        setValidationError("Item Type ID must be a positive number");
        return;
      }
    } else {
      if (!selectedItem) {
        setValidationError("Select an item from inventory");
        return;
      }
      typeId = selectedItem.typeId;
      maxQty = selectedItem.quantity;
    }

    const parsedQty = Number(quantity);
    const parsedPrice = Number(priceInLux);

    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setValidationError("Quantity must be a positive integer");
      return;
    }
    if (!showManualEntry && parsedQty > maxQty) {
      setValidationError(`Only ${maxQty} available in inventory`);
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setValidationError("Price must be greater than 0");
      return;
    }

    const priceInBaseUnits = luxToBaseUnits(parsedPrice);
    onSubmit(typeId, parsedQty, priceInBaseUnits);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Inventory browser */}
      {!showManualEntry && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Select item from inventory</p>
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              Manual entry →
            </button>
          </div>
          <InventoryBrowser
            items={inventoryItems}
            isLoading={isInventoryLoading}
            selectedTypeId={selectedItem?.typeId}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* Manual type ID fallback */}
      {showManualEntry && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Manual type ID entry</p>
            <button
              type="button"
              onClick={() => {
                setShowManualEntry(false);
                setManualTypeId("");
              }}
              className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              ← Back to inventory
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={manualTypeId}
            onChange={(e) => setManualTypeId(e.target.value)}
            placeholder="e.g. 78437"
            disabled={isBusy}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40"
          />
        </div>
      )}

      {/* Selected item summary */}
      {selectedItem && !showManualEntry && (
        <div className="px-3 py-2 rounded border border-primary/20 bg-primary/5 text-sm">
          <span className="text-foreground">{resolveItemTypeName(selectedItem.typeId)}</span>
          <span className="text-muted-foreground ml-2">
            — {selectedItem.quantity.toLocaleString()} available
          </span>
        </div>
      )}

      {/* Quantity + Price row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="quantity"
            className="block text-[11px] text-muted-foreground mb-1"
          >
            Quantity
          </label>
          <input
            id="quantity"
            type="text"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={
              selectedItem && !showManualEntry
                ? `Max ${selectedItem.quantity}`
                : "1"
            }
            disabled={isBusy}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40"
          />
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-[11px] text-muted-foreground mb-1"
          >
            Price (Lux)
          </label>
          <input
            id="price"
            type="text"
            inputMode="decimal"
            value={priceInLux}
            onChange={(e) => setPriceInLux(e.target.value)}
            placeholder="10"
            disabled={isBusy}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40"
          />
        </div>
      </div>

      {validationError && (
        <p className="text-xs text-red-400">{validationError}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/50">
          Items remain in your SSU until purchased. Listing can be cancelled at any time.
        </p>
        <button
          type="submit"
          disabled={isBusy || (!selectedItem && !showManualEntry)}
          className="text-xs px-4 py-2 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isBusy ? "Creating…" : "Create Listing"}
        </button>
      </div>
    </form>
  );
}
