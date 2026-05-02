import { useMemo } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { formatNodeLocalSize, formatNodeLocalStatus, sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";
import { cn } from "@/lib/utils";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeStructureListPanelProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string) => void;
}

function shortObjectId(value: string | undefined): string {
  if (!value) return "Synthetic";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export function NodeStructureListPanel({
  viewModel,
  selectedStructureId,
  onSelectStructure,
}: NodeStructureListPanelProps) {
  const structures = useMemo(
    () => sortNodeLocalStructures(viewModel.structures),
    [viewModel.structures],
  );

  return (
    <section className="overflow-hidden rounded border border-border bg-[var(--card)]">
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Attached Structures ({structures.length})
        </h2>
        <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
          Read-only structure index
        </p>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-2">
        <div className="space-y-1.5">
          {structures.map((structure) => {
            const sizeLabel = formatNodeLocalSize(structure.sizeVariant);
            const meta = [structure.typeLabel, structure.familyLabel, sizeLabel].filter(Boolean).join(" • ");

            return (
              <button
                key={structure.id}
                type="button"
                onClick={() => onSelectStructure(structure.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded border px-3 py-2 text-left transition-colors",
                  selectedStructureId === structure.id
                    ? "border-primary/60 bg-primary/8"
                    : "border-transparent hover:border-border/70 hover:bg-muted/10",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <NodeIconPreviewGlyph
                    family={structure.iconFamily}
                    badge={structure.badge}
                    tone={structure.tone}
                    selected={selectedStructureId === structure.id}
                    warningPip={structure.warningPip}
                    size={20}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{structure.displayName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
                  </div>
                </div>

                <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    {formatNodeLocalStatus(structure.status)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {shortObjectId(structure.objectId)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}