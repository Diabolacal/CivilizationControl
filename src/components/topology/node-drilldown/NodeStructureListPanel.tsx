import { useMemo } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { formatNodeLocalSize, formatNodeLocalStatus, sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";
import { cn } from "@/lib/utils";

import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeStructureListPanelProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string) => void;
  hiddenCanonicalKeySet: ReadonlySet<string>;
  onUnhideStructure: (canonicalDomainKey: string) => void;
  embedded?: boolean;
}

function shortObjectId(value: string | undefined): string {
  if (!value) return "Synthetic";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function shortStructureReference(structure: NodeLocalStructure): string {
  if (structure.objectId) {
    return shortObjectId(structure.objectId);
  }

  if (structure.assemblyId) {
    return structure.assemblyId.length <= 16
      ? `asm:${structure.assemblyId}`
      : `asm:${structure.assemblyId.slice(0, 6)}…${structure.assemblyId.slice(-4)}`;
  }

  return structure.source === "synthetic" ? "Synthetic" : "Backend";
}

function NodeStructureListContent({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  hiddenCanonicalKeySet,
  onUnhideStructure,
}: Pick<NodeStructureListPanelProps, "viewModel" | "selectedStructureId" | "onSelectStructure" | "hiddenCanonicalKeySet" | "onUnhideStructure">) {
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
          const sizeLabel = formatNodeLocalSize(structure.sizeVariant);
          const authorityMeta = structure.source === "backendMembership"
            ? structure.hasDirectChainAuthority
              ? structure.directChainMatchCount > 1
                ? `Chain-backed (${structure.directChainMatchCount})`
                : "Chain-backed"
              : "Backend-only"
            : structure.source === "backendObserved"
              ? "Observed"
              : null;
          const meta = [
            structure.typeLabel,
            structure.familyLabel,
            sizeLabel,
            authorityMeta,
          ].filter(Boolean).join(" • ");

          return (
            <div
              key={structure.id}
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
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectStructure(structure.id)}
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{structure.displayName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
                    {isHidden ? (
                      <span className="mt-1.5 inline-flex rounded border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75">
                        Hidden from map
                      </span>
                    ) : null}
                  </div>
                </button>

                <div className="ml-1 flex w-[116px] shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    {formatNodeLocalStatus(structure.status)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {shortStructureReference(structure)}
                  </span>
                  {isHidden ? (
                    <button
                      type="button"
                      onClick={() => onUnhideStructure(structure.canonicalDomainKey)}
                      className="mt-1 rounded border border-border/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      Unhide
                    </button>
                  ) : null}
                </div>
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
  embedded = false,
}: NodeStructureListPanelProps) {
  const content = (
    <NodeStructureListContent
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
      onSelectStructure={onSelectStructure}
      hiddenCanonicalKeySet={hiddenCanonicalKeySet}
      onUnhideStructure={onUnhideStructure}
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