import { useEffect, useMemo, useRef, useState } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import {
  applyNodeDrilldownPositionOverrides,
  clampNodeDrilldownPosition,
  layoutNodeDrilldown,
} from "@/lib/nodeDrilldownLayout";
import { describeNodeLocalWarningMarker } from "@/lib/nodeDrilldownModel";
import { resolveNodeLocalStructure } from "@/lib/nodeDrilldownSelection";
import { cn } from "@/lib/utils";

import { NodeDrilldownTooltip, type NodeDrilldownTooltipData } from "./NodeDrilldownTooltip";

import type { OpenNodeDrilldownStructureMenuParams } from "@/hooks/useNodeDrilldownStructureMenu";
import type { NodeDrilldownLayoutOverrides, NodeDrilldownLayoutPosition } from "@/lib/nodeDrilldownLayoutOverrides";
import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

export interface OpenNodeDrilldownNodeMenuParams {
  clientX: number;
  clientY: number;
}

interface NodeDrilldownCanvasProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string | null) => void;
  onOpenNodeMenu?: (params: OpenNodeDrilldownNodeMenuParams) => void;
  onOpenStructureMenu?: (params: OpenNodeDrilldownStructureMenuParams) => void;
  onCloseStructureMenu?: () => void;
  totalStructureCount: number;
  hiddenStructureCount: number;
  layoutOverrides?: NodeDrilldownLayoutOverrides;
  powerUsageLabel?: string;
  isStructureMenuOpen?: boolean;
  onUpdateStructurePosition?: (canonicalDomainKey: string, position: NodeDrilldownLayoutPosition) => void;
}

interface DragState {
  canonicalDomainKey: string;
  iconSize: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  didDrag: boolean;
}

interface DragPreview {
  structureId: string;
  xPercent: number;
  yPercent: number;
}

const DRAG_THRESHOLD_PX = 6;

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
  const warningDetail = describeNodeLocalWarningMarker(structure);

  return {
    id: structure.id,
    xPercent,
    yPercent,
    ...tooltipPlacement(xPercent, yPercent),
    title: structure.displayName,
    detail: buildButtonLabel([structure.typeLabel, sizeLabel, formatTitleCase(structure.status), warningDetail]),
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
  const warningDetail = describeNodeLocalWarningMarker(structure);

  return buildButtonLabel([
    structure.displayName,
    structure.typeLabel,
    structure.familyLabel,
    structure.sizeVariant ? formatTitleCase(structure.sizeVariant) : null,
    formatTitleCase(structure.status),
    warningDetail,
  ]);
}

export function NodeDrilldownCanvas({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  onOpenNodeMenu,
  onOpenStructureMenu,
  onCloseStructureMenu,
  totalStructureCount,
  hiddenStructureCount,
  layoutOverrides = {},
  powerUsageLabel,
  isStructureMenuOpen = false,
  onUpdateStructurePosition,
}: NodeDrilldownCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickStructureIdRef = useRef<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const renderViewModel = useMemo(() => {
    const structuresById = new Map<string, NodeLocalViewModel["structures"][number]>();
    for (const structure of viewModel.structures) {
      const resolvedStructure = resolveNodeLocalStructure(
        viewModel,
        { structure },
        "canvas-projection",
      ).structure ?? structure;
      if (!structuresById.has(resolvedStructure.id)) {
        structuresById.set(resolvedStructure.id, resolvedStructure);
      }
    }

    return { ...viewModel, structures: [...structuresById.values()] };
  }, [viewModel]);
  const baseLayout = useMemo(() => layoutNodeDrilldown(renderViewModel), [renderViewModel]);
  const layout = useMemo(
    () => applyNodeDrilldownPositionOverrides(baseLayout, renderViewModel.structures, layoutOverrides),
    [baseLayout, layoutOverrides, renderViewModel.structures],
  );
  const displayedLayout = useMemo(() => {
    if (!dragPreview) return layout;

    return {
      ...layout,
      structures: layout.structures.map((item) => (
        item.id === dragPreview.structureId
          ? { ...item, xPercent: dragPreview.xPercent, yPercent: dragPreview.yPercent }
          : item
      )),
    };
  }, [dragPreview, layout]);
  const [tooltip, setTooltip] = useState<NodeDrilldownTooltipData | null>(null);
  const structureMap = useMemo(
    () => new Map(renderViewModel.structures.map((structure) => [structure.id, structure])),
    [renderViewModel.structures],
  );
  const visibleStructureCount = renderViewModel.structures.length;

  const getCanvasPosition = (clientX: number, clientY: number, iconSize: number): NodeDrilldownLayoutPosition | null => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;

    return clampNodeDrilldownPosition({
      xPercent: ((clientX - bounds.left) / bounds.width) * 100,
      yPercent: ((clientY - bounds.top) / bounds.height) * 100,
    }, {
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
      iconSize,
    });
  };

  useEffect(() => {
    if (!isStructureMenuOpen) {
      return;
    }

    setTooltip(null);
  }, [isStructureMenuOpen]);

  return (
    <div ref={canvasRef} className="relative h-full overflow-hidden">
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
        onClick={() => {
          onCloseStructureMenu?.();
          onSelectStructure(null);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setTooltip(null);
          onSelectStructure(null);
          onOpenNodeMenu?.({
            clientX: event.clientX,
            clientY: event.clientY,
          });
        }}
        onKeyDown={(event) => {
          if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setTooltip(null);
          const bounds = event.currentTarget.getBoundingClientRect();
          onSelectStructure(null);
          onOpenNodeMenu?.({
            clientX: bounds.left + bounds.width / 2,
            clientY: bounds.top + bounds.height / 2,
          });
        }}
        onMouseEnter={() => {
          if (isStructureMenuOpen) return;
          setTooltip(buildNodeTooltip(viewModel, layout.anchor.xPercent, layout.anchor.yPercent));
        }}
        onMouseLeave={() => setTooltip((current) => (current?.id === viewModel.node.id ? null : current))}
        onFocus={() => {
          if (isStructureMenuOpen) return;
          setTooltip(buildNodeTooltip(viewModel, layout.anchor.xPercent, layout.anchor.yPercent));
        }}
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
          {totalStructureCount} attached structure{totalStructureCount === 1 ? "" : "s"}
        </p>
        {hiddenStructureCount > 0 ? (
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/55">
            {visibleStructureCount} visible / {hiddenStructureCount} hidden from map
          </p>
        ) : null}
      </div>

      {displayedLayout.structures.map((item) => {
        const structure = structureMap.get(item.id);
        if (!structure) return null;
        const isDragging = dragPreview?.structureId === structure.id;
        const isSelected = selectedStructureId === structure.id;

        return (
          <button
            key={structure.id}
            type="button"
            onClick={() => {
              if (suppressClickStructureIdRef.current === structure.id) {
                suppressClickStructureIdRef.current = null;
                return;
              }

              onCloseStructureMenu?.();
              onSelectStructure(structure.id);
            }}
            onPointerDown={(event) => {
              if (!onUpdateStructurePosition || event.button !== 0) return;

              dragStateRef.current = {
                canonicalDomainKey: structure.canonicalDomainKey,
                iconSize: item.iconSize,
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                didDrag: false,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const dragState = dragStateRef.current;
              if (!dragState || dragState.pointerId !== event.pointerId || !onUpdateStructurePosition) return;

              const distance = Math.hypot(event.clientX - dragState.startClientX, event.clientY - dragState.startClientY);
              if (!dragState.didDrag && distance <= DRAG_THRESHOLD_PX) return;

              const position = getCanvasPosition(event.clientX, event.clientY, dragState.iconSize);
              if (!position) return;

              dragState.didDrag = true;
              setTooltip(null);
              onCloseStructureMenu?.();
              setDragPreview({ structureId: structure.id, ...position });
              event.preventDefault();
              event.stopPropagation();
            }}
            onPointerUp={(event) => {
              const dragState = dragStateRef.current;
              if (!dragState || dragState.pointerId !== event.pointerId) return;

              dragStateRef.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
              if (!dragState.didDrag || !onUpdateStructurePosition) {
                setDragPreview(null);
                return;
              }

              const position = getCanvasPosition(event.clientX, event.clientY, dragState.iconSize);
              if (position) {
                onUpdateStructurePosition(dragState.canonicalDomainKey, position);
              }

              suppressClickStructureIdRef.current = structure.id;
              setDragPreview(null);
              event.preventDefault();
              event.stopPropagation();
            }}
            onPointerCancel={(event) => {
              const dragState = dragStateRef.current;
              if (dragState?.pointerId === event.pointerId) {
                dragStateRef.current = null;
                setDragPreview(null);
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setTooltip(null);
              onSelectStructure(structure.id);
              onOpenStructureMenu?.({
                structure,
                clientX: event.clientX,
                clientY: event.clientY,
                isHidden: false,
              });
            }}
            onKeyDown={(event) => {
              if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              setTooltip(null);
              const bounds = event.currentTarget.getBoundingClientRect();
              onSelectStructure(structure.id);
              onOpenStructureMenu?.({
                structure,
                clientX: bounds.left + bounds.width / 2,
                clientY: bounds.top + bounds.height / 2,
                isHidden: false,
              });
            }}
            onMouseEnter={() => {
              if (isStructureMenuOpen) return;
              setTooltip(buildStructureTooltip(structure, item.xPercent, item.yPercent));
            }}
            onMouseLeave={() => setTooltip((current) => (current?.id === structure.id ? null : current))}
            onFocus={() => {
              if (isStructureMenuOpen) return;
              setTooltip(buildStructureTooltip(structure, item.xPercent, item.yPercent));
            }}
            onBlur={() => setTooltip((current) => (current?.id === structure.id ? null : current))}
            aria-label={buildStructureAriaLabel(structure)}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-[1.03]",
              onUpdateStructurePosition ? "cursor-grab active:cursor-grabbing" : null,
              isDragging ? "scale-[1.04]" : null,
              isSelected ? "z-20" : "z-10",
            )}
            style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
          >
            <NodeIconPreviewGlyph
              family={structure.iconFamily}
              badge={structure.badge}
              tone={structure.tone}
              selected={isSelected}
              warningPip={structure.warningPip}
              size={item.iconSize}
            />
          </button>
        );
      })}

      {powerUsageLabel ? (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded border border-border/45 bg-background/45 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          {powerUsageLabel}
        </div>
      ) : null}

      {tooltip && !isStructureMenuOpen ? <NodeDrilldownTooltip tooltip={tooltip} /> : null}
    </div>
  );
}
