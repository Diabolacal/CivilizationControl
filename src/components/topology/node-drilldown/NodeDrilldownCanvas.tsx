import { useMemo, useState } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { layoutNodeDrilldown } from "@/lib/nodeDrilldownLayout";
import { cn } from "@/lib/utils";

import { NodeDrilldownTooltip, type NodeDrilldownTooltipData } from "./NodeDrilldownTooltip";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeDrilldownCanvasProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string | null) => void;
}

function formatTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildButtonLabel(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

function tooltipPlacement(xPercent: number, yPercent: number) {
  return {
    horizontalAlign: xPercent <= 24 ? "left" : xPercent >= 76 ? "right" : "center",
    verticalAlign: yPercent <= 24 ? "below" : "above",
  } as const;
}

function buildNodeTooltip(viewModel: NodeLocalViewModel, xPercent: number, yPercent: number): NodeDrilldownTooltipData {
  return {
    id: viewModel.node.id,
    xPercent,
    yPercent,
    ...tooltipPlacement(xPercent, yPercent),
    title: viewModel.node.displayName,
    detail: buildButtonLabel(["Network Node", formatTitleCase(viewModel.node.status)]),
  };
}

function buildStructureTooltip(
  structure: NodeLocalViewModel["structures"][number],
  xPercent: number,
  yPercent: number,
): NodeDrilldownTooltipData {
  const sizeLabel = structure.sizeVariant ? formatTitleCase(structure.sizeVariant) : null;

  return {
    id: structure.id,
    xPercent,
    yPercent,
    ...tooltipPlacement(xPercent, yPercent),
    title: structure.displayName,
    detail: buildButtonLabel([structure.typeLabel, sizeLabel, formatTitleCase(structure.status)]),
  };
}

function buildNodeAriaLabel(viewModel: NodeLocalViewModel): string {
  return buildButtonLabel([
    viewModel.node.displayName,
    "Network Node",
    formatTitleCase(viewModel.node.status),
  ]);
}

function buildStructureAriaLabel(structure: NodeLocalViewModel["structures"][number]): string {
  return buildButtonLabel([
    structure.displayName,
    structure.typeLabel,
    structure.familyLabel,
    structure.sizeVariant ? formatTitleCase(structure.sizeVariant) : null,
    formatTitleCase(structure.status),
  ]);
}

export function NodeDrilldownCanvas({
  viewModel,
  selectedStructureId,
  onSelectStructure,
}: NodeDrilldownCanvasProps) {
  const layout = useMemo(() => layoutNodeDrilldown(viewModel), [viewModel]);
  const [tooltip, setTooltip] = useState<NodeDrilldownTooltipData | null>(null);
  const structureMap = useMemo(
    () => new Map(viewModel.structures.map((structure) => [structure.id, structure])),
    [viewModel.structures],
  );

  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--topo-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--topo-grid) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <button
        type="button"
        onClick={() => onSelectStructure(null)}
        onMouseEnter={() => setTooltip(buildNodeTooltip(viewModel, layout.anchor.xPercent, layout.anchor.yPercent))}
        onMouseLeave={() => setTooltip((current) => (current?.id === viewModel.node.id ? null : current))}
        onFocus={() => setTooltip(buildNodeTooltip(viewModel, layout.anchor.xPercent, layout.anchor.yPercent))}
        onBlur={() => setTooltip((current) => (current?.id === viewModel.node.id ? null : current))}
        aria-label={buildNodeAriaLabel(viewModel)}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-[1.03]",
          selectedStructureId == null ? "z-20" : "z-10",
        )}
        style={{ left: `${layout.anchor.xPercent}%`, top: `${layout.anchor.yPercent}%` }}
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
            onMouseEnter={() => setTooltip(buildStructureTooltip(structure, item.xPercent, item.yPercent))}
            onMouseLeave={() => setTooltip((current) => (current?.id === structure.id ? null : current))}
            onFocus={() => setTooltip(buildStructureTooltip(structure, item.xPercent, item.yPercent))}
            onBlur={() => setTooltip((current) => (current?.id === structure.id ? null : current))}
            aria-label={buildStructureAriaLabel(structure)}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-[1.03]",
              selectedStructureId === structure.id ? "z-20" : "z-10",
            )}
            style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
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

      {tooltip ? <NodeDrilldownTooltip tooltip={tooltip} /> : null}
    </div>
  );
}