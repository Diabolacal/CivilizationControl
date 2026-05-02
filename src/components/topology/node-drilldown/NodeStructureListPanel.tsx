import { useMemo } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { formatNodeLocalSize, formatNodeLocalStatus, sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";
import { cn } from "@/lib/utils";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeStructureListPanelProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string) => void;
  embedded?: boolean;
}

function shortObjectId(value: string | undefined): string {
  if (!value) return "Synthetic";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function NodeStructureListContent({
  viewModel,
  selectedStructureId,
  onSelectStructure,
}: Pick<NodeStructureListPanelProps, "viewModel" | "selectedStructureId" | "onSelectStructure">) {
  const structures = useMemo(
    () => sortNodeLocalStructures(viewModel.structures),
    [viewModel.structures],
  );

  return (
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
  );
}

export function NodeStructureListPanel({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  embedded = false,
}: NodeStructureListPanelProps) {
  const content = (
    <NodeStructureListContent
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
      onSelectStructure={onSelectStructure}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardPanelFrame
      title={`Attached Structures (${viewModel.structures.length})`}
      subtitle="Read-only structure index"
    >
      {content}
    </DashboardPanelFrame>
  );
}