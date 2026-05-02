import { useMemo } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { layoutNodeDrilldown } from "@/lib/nodeDrilldownLayout";
import { cn } from "@/lib/utils";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeDrilldownCanvasProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string | null) => void;
}

export function NodeDrilldownCanvas({
  viewModel,
  selectedStructureId,
  onSelectStructure,
}: NodeDrilldownCanvasProps) {
  const layout = useMemo(() => layoutNodeDrilldown(viewModel), [viewModel]);
  const structureMap = useMemo(
    () => new Map(viewModel.structures.map((structure) => [structure.id, structure])),
    [viewModel.structures],
  );

  return (
    <div className="relative h-[440px] overflow-hidden bg-[var(--topo-background)]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--topo-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--topo-grid) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_52%,rgba(234,88,12,0.08),transparent_28%),radial-gradient(circle_at_82%_32%,rgba(245,158,11,0.08),transparent_24%)]" />

      {layout.labels.map((label) => (
        <div
          key={label.id}
          className="pointer-events-none absolute text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground/45"
          style={{ left: `${label.xPercent}%`, top: `${label.yPercent}%` }}
        >
          {label.label}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onSelectStructure(null)}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-[1.03]",
          selectedStructureId == null ? "z-20" : "z-10",
        )}
        style={{ left: `${layout.anchor.xPercent}%`, top: `${layout.anchor.yPercent}%` }}
        title={viewModel.node.displayName}
      >
        <NodeIconPreviewGlyph
          family="networkNode"
          tone={viewModel.node.tone}
          selected={selectedStructureId == null}
          warningPip={viewModel.node.warningPip}
          size={30}
        />
      </button>

      <div
        className="pointer-events-none absolute -translate-x-1/2 text-center"
        style={{ left: `${layout.anchor.xPercent}%`, top: `${layout.anchor.yPercent + 10}%` }}
      >
        <p className="text-sm font-medium text-foreground">{viewModel.node.displayName}</p>
        <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
          {viewModel.structures.length} attached structure{viewModel.structures.length === 1 ? "" : "s"}
        </p>
      </div>

      {layout.structures.map((item) => {
        const structure = structureMap.get(item.id);
        if (!structure) return null;

        return (
          <button
            key={structure.id}
            type="button"
            onClick={() => onSelectStructure(structure.id)}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-[1.03]",
              selectedStructureId === structure.id ? "z-20" : "z-10",
            )}
            style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
            title={`${structure.displayName} — ${structure.typeLabel}`}
          >
            <NodeIconPreviewGlyph
              family={structure.iconFamily}
              badge={structure.badge}
              tone={structure.tone}
              selected={selectedStructureId === structure.id}
              warningPip={structure.warningPip}
              size={item.iconSize}
            />
          </button>
        );
      })}

      <div className="absolute bottom-3 left-4 rounded border border-border/60 bg-background/80 px-3 py-2 text-[10px] font-mono uppercase tracking-wide text-muted-foreground/70">
        Family-bands-v1 • Read-only surface
      </div>
    </div>
  );
}