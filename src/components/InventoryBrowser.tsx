/**
 * InventoryBrowser — SSU inventory display with item selection for listing creation.
 *
 * Shows all items in an SSU's inventory with resolved names from the type catalog.
 * Allows selecting an item to prefill the create listing flow.
 */

import { resolveItemTypeName, getItemTypeById } from "@/lib/typeCatalog";
import type { InventoryEntry } from "@/types/domain";

interface InventoryBrowserProps {
  items: InventoryEntry[];
  isLoading: boolean;
  selectedTypeId?: number;
  onSelect: (entry: InventoryEntry) => void;
}

export function InventoryBrowser({
  items,
  isLoading,
  selectedTypeId,
  onSelect,
}: InventoryBrowserProps) {
  if (isLoading) {
    return (
      <div className="border border-dashed border-border/50 rounded py-6 flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground/60 animate-pulse">
          Reading inventory…
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border/50 rounded py-6 flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground/60">Inventory empty</p>
        <p className="text-[11px] text-muted-foreground/40">
          No items found in this SSU's storage
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((entry) => {
        const itemType = getItemTypeById(entry.typeId);
        const isSelected = selectedTypeId === entry.typeId;

        return (
          <button
            key={entry.typeId}
            type="button"
            onClick={() => onSelect(entry)}
            className={`w-full text-left px-3 py-2.5 rounded border transition-colors ${
              isSelected
                ? "border-primary/50 bg-primary/10"
                : "border-border/50 bg-background hover:border-border hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">
                  {resolveItemTypeName(entry.typeId)}
                </p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    #{entry.typeId}
                  </span>
                  {itemType?.categoryName && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {itemType.categoryName}
                    </span>
                  )}
                  {itemType && itemType.volume > 0 && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {itemType.volume} m³
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <p className="text-sm font-mono text-foreground">
                  ×{entry.quantity.toLocaleString()}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
