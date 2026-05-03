import { useMemo } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { NodeStructureActionRail } from "@/components/topology/node-drilldown/NodeStructureActionRail";
import type { OpenNodeDrilldownStructureMenuParams } from "@/hooks/useNodeDrilldownStructureMenu";
import { getNodeLocalActionStatus } from "@/lib/nodeDrilldownActionAuthority";
import { formatNodeLocalSize, formatNodeLocalStatus, sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";
import { cn } from "@/lib/utils";

import type { TxStatus } from "@/types/domain";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeStructureListPanelProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string) => void;
  hiddenCanonicalKeySet: ReadonlySet<string>;
  onUnhideStructure: (canonicalDomainKey: string) => void;
  onOpenStructureMenu?: (params: OpenNodeDrilldownStructureMenuParams) => void;
  onCloseStructureMenu?: () => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  powerStatus?: TxStatus;
  powerStructureId?: string | null;
  previewMode?: boolean;
  embedded?: boolean;
}

function normalizeComparisonLabel(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildStructureKindLabel(structure: NodeLocalStructure): string | null {
  const typeLabel = structure.typeLabel?.trim() ?? null;
  const sizeLabel = formatNodeLocalSize(structure.sizeVariant);
  const compactSizeLabel = sizeLabel === "Standard" ? null : sizeLabel;

  if (!typeLabel && !compactSizeLabel) {
    return null;
  }

  if (!typeLabel) {
    return compactSizeLabel;
  }

  if (!compactSizeLabel) {
    return typeLabel;
  }

  const normalizedType = normalizeComparisonLabel(typeLabel);
  const normalizedSize = normalizeComparisonLabel(compactSizeLabel);
  if (normalizedSize && !normalizedType.includes(normalizedSize)) {
    return `${compactSizeLabel} ${typeLabel}`;
  }

  return typeLabel;
}

function buildStructureSubtitle(structure: NodeLocalStructure, isHidden: boolean): string | null {
  const parts: string[] = [];
  const kindLabel = buildStructureKindLabel(structure);
  const normalizedName = normalizeComparisonLabel(structure.displayName);
  const normalizedKind = normalizeComparisonLabel(kindLabel);

  if (kindLabel && normalizedKind && !normalizedName.includes(normalizedKind)) {
    parts.push(kindLabel);
  }

  if (isHidden) {
    parts.push(formatNodeLocalStatus(getNodeLocalActionStatus(structure)));
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function NodeStructureListContent({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  hiddenCanonicalKeySet,
  onUnhideStructure,
  onOpenStructureMenu,
  onCloseStructureMenu,
  onTogglePower,
  powerStatus,
  powerStructureId,
}: Pick<NodeStructureListPanelProps, "viewModel" | "selectedStructureId" | "onSelectStructure" | "hiddenCanonicalKeySet" | "onUnhideStructure" | "onOpenStructureMenu" | "onCloseStructureMenu" | "onTogglePower" | "powerStatus" | "powerStructureId">) {
  const structures = useMemo(
    () => {
      const sortedStructures = sortNodeLocalStructures(viewModel.structures);
      const visibleStructures: typeof sortedStructures = [];
      const hiddenStructures: typeof sortedStructures = [];

      for (const structure of sortedStructures) {
        if (hiddenCanonicalKeySet.has(structure.canonicalDomainKey)) {
          hiddenStructures.push(structure);
          continue;
        }

        visibleStructures.push(structure);
      }

      return [...visibleStructures, ...hiddenStructures];
    },
    [hiddenCanonicalKeySet, viewModel.structures],
  );

  return (
    <div className="max-h-[420px] overflow-y-auto p-2">
      <div className="space-y-1.5">
        {structures.map((structure) => {
          const isHidden = hiddenCanonicalKeySet.has(structure.canonicalDomainKey);
          const subtitle = buildStructureSubtitle(structure, isHidden);
          const openStructureContextMenu = (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            onSelectStructure(structure.id);
            onOpenStructureMenu?.({
              structure,
              clientX: event.clientX,
              clientY: event.clientY,
              isHidden,
            });
          };

          return (
            <div
              key={structure.id}
              onContextMenu={openStructureContextMenu}
              className={cn(
                "rounded border px-3 py-2 transition-colors",
                isHidden ? "border-dashed" : null,
                selectedStructureId === structure.id
                  ? "border-primary/60 bg-primary/8"
                  : isHidden
                    ? "border-border/50 bg-muted/5"
                    : "border-transparent hover:border-border/70 hover:bg-muted/10",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onCloseStructureMenu?.();
                    onSelectStructure(structure.id);
                  }}
                  onContextMenu={openStructureContextMenu}
                  onKeyDown={(event) => {
                    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    const bounds = event.currentTarget.getBoundingClientRect();
                    onSelectStructure(structure.id);
                    onOpenStructureMenu?.({
                      structure,
                      clientX: bounds.left + bounds.width / 2,
                      clientY: bounds.top + bounds.height / 2,
                      isHidden,
                    });
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <NodeIconPreviewGlyph
                    family={structure.iconFamily}
                    badge={structure.badge}
                    tone={structure.tone}
                    selected={selectedStructureId === structure.id}
                    warningPip={structure.warningPip}
                    size={20}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{structure.displayName}</p>
                    {subtitle ? (
                      <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
                    ) : null}
                    {isHidden ? (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex rounded border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75">
                          Hidden from map
                        </span>
                      </div>
                    ) : null}
                  </div>
                </button>

                <NodeStructureActionRail
                  structure={structure}
                  isHidden={isHidden}
                  onUnhideStructure={onUnhideStructure}
                  onTogglePower={onTogglePower}
                  onFocusStructure={onSelectStructure}
                  powerStatus={powerStatus}
                  powerStructureId={powerStructureId}
                />
              </div>
            </div>
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
  hiddenCanonicalKeySet,
  onUnhideStructure,
  onOpenStructureMenu,
  onCloseStructureMenu,
  onTogglePower,
  powerStatus,
  powerStructureId,
  embedded = false,
}: NodeStructureListPanelProps) {
  const content = (
    <NodeStructureListContent
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
      onSelectStructure={onSelectStructure}
      hiddenCanonicalKeySet={hiddenCanonicalKeySet}
      onUnhideStructure={onUnhideStructure}
      onOpenStructureMenu={onOpenStructureMenu}
      onCloseStructureMenu={onCloseStructureMenu}
      onTogglePower={onTogglePower}
      powerStatus={powerStatus}
      powerStructureId={powerStructureId}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardPanelFrame
      title={`Attached Structures (${viewModel.structures.length})`}
      subtitle="Compact power controls plus local hide state"
    >
      {content}
    </DashboardPanelFrame>
  );
}