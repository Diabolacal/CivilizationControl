import { useEffect, useMemo, useRef, useState } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { getNodeLocalPowerToggleIntent } from "@/lib/nodeDrilldownActionAuthority";
import { layoutNodeDrilldown } from "@/lib/nodeDrilldownLayout";
import { cn } from "@/lib/utils";

import { NodeDrilldownContextMenu } from "./NodeDrilldownContextMenu";
import { NodeDrilldownTooltip, type NodeDrilldownTooltipData } from "./NodeDrilldownTooltip";

import type { TxStatus } from "@/types/domain";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeDrilldownCanvasProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string | null) => void;
  onHideStructure: (canonicalDomainKey: string) => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  powerStatus?: TxStatus;
  totalStructureCount: number;
  hiddenStructureCount: number;
}

interface StructureContextMenuState {
  structureId: string;
  canonicalDomainKey: string;
  structureName: string;
  left: number;
  top: number;
  powerActionLabel: string | null;
  nextOnline: boolean | null;
}

const CONTEXT_MENU_MARGIN_PX = 12;
const CONTEXT_MENU_WIDTH_PX = 196;
const CONTEXT_MENU_ITEM_HEIGHT_PX = 36;
const CONTEXT_MENU_CHROME_HEIGHT_PX = 12;

function clampPosition(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
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
  onHideStructure,
  onTogglePower,
  powerStatus = "idle",
  totalStructureCount,
  hiddenStructureCount,
}: NodeDrilldownCanvasProps) {
  const layout = useMemo(() => layoutNodeDrilldown(viewModel), [viewModel]);
  const [tooltip, setTooltip] = useState<NodeDrilldownTooltipData | null>(null);
  const [contextMenu, setContextMenu] = useState<StructureContextMenuState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const structureMap = useMemo(
    () => new Map(viewModel.structures.map((structure) => [structure.id, structure])),
    [viewModel.structures],
  );
  const visibleStructureCount = viewModel.structures.length;

  useEffect(() => {
    if (!contextMenu) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }

      setContextMenu(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) return;

    const isStructureStillVisible = viewModel.structures.some((structure) => structure.id === contextMenu.structureId);
    if (!isStructureStillVisible) {
      setContextMenu(null);
    }
  }, [contextMenu, viewModel.structures]);

  const openStructureContextMenu = (
    structure: NodeLocalViewModel["structures"][number],
    clientX: number,
    clientY: number,
  ) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const toggleIntent = onTogglePower ? getNodeLocalPowerToggleIntent(structure) : null;
    const menuHeight = CONTEXT_MENU_CHROME_HEIGHT_PX + (toggleIntent ? 2 : 1) * CONTEXT_MENU_ITEM_HEIGHT_PX;

    const left = clampPosition(
      clientX - bounds.left,
      CONTEXT_MENU_MARGIN_PX,
      bounds.width - CONTEXT_MENU_WIDTH_PX - CONTEXT_MENU_MARGIN_PX,
    );
    const top = clampPosition(
      clientY - bounds.top,
      CONTEXT_MENU_MARGIN_PX,
      bounds.height - menuHeight - CONTEXT_MENU_MARGIN_PX,
    );

    setTooltip(null);
    setContextMenu({
      structureId: structure.id,
      canonicalDomainKey: structure.canonicalDomainKey,
      structureName: structure.displayName,
      left,
      top,
      powerActionLabel: toggleIntent?.actionLabel ?? null,
      nextOnline: toggleIntent?.nextOnline ?? null,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
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
          closeContextMenu();
          onSelectStructure(null);
        }}
        onMouseEnter={() => {
          if (contextMenu) return;
          setTooltip(buildNodeTooltip(viewModel, layout.anchor.xPercent, layout.anchor.yPercent));
        }}
        onMouseLeave={() => setTooltip((current) => (current?.id === viewModel.node.id ? null : current))}
        onFocus={() => {
          if (contextMenu) return;
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

      {layout.structures.map((item) => {
        const structure = structureMap.get(item.id);
        if (!structure) return null;

        return (
          <button
            key={structure.id}
            type="button"
            onClick={() => {
              closeContextMenu();
              onSelectStructure(structure.id);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              openStructureContextMenu(structure, event.clientX, event.clientY);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              const bounds = event.currentTarget.getBoundingClientRect();
              openStructureContextMenu(
                structure,
                bounds.left + bounds.width / 2,
                bounds.top + bounds.height / 2,
              );
            }}
            onMouseEnter={() => {
              if (contextMenu) return;
              setTooltip(buildStructureTooltip(structure, item.xPercent, item.yPercent));
            }}
            onMouseLeave={() => setTooltip((current) => (current?.id === structure.id ? null : current))}
            onFocus={() => {
              if (contextMenu) return;
              setTooltip(buildStructureTooltip(structure, item.xPercent, item.yPercent));
            }}
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

      {tooltip && !contextMenu ? <NodeDrilldownTooltip tooltip={tooltip} /> : null}

      {contextMenu ? (
        <NodeDrilldownContextMenu
          menuRef={menuRef}
          structureName={contextMenu.structureName}
          left={contextMenu.left}
          top={contextMenu.top}
          powerActionLabel={contextMenu.powerActionLabel ?? undefined}
          powerActionDisabled={powerStatus === "pending"}
          onPowerAction={contextMenu.nextOnline != null && onTogglePower
            ? () => {
              const structure = structureMap.get(contextMenu.structureId);
              const nextOnline = contextMenu.nextOnline;
              if (!structure) {
                closeContextMenu();
                return;
              }

              if (nextOnline == null) {
                closeContextMenu();
                return;
              }

              onSelectStructure(contextMenu.structureId);
              onTogglePower(structure, nextOnline);
              closeContextMenu();
            }
            : undefined}
          onClose={closeContextMenu}
          onHideStructure={() => {
            onHideStructure(contextMenu.canonicalDomainKey);
            closeContextMenu();
          }}
        />
      ) : null}
    </div>
  );
}