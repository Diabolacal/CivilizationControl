import { useMemo } from "react";

import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { NodeStructureActionRail } from "@/components/topology/node-drilldown/NodeStructureActionRail";
import { formatNodeLocalActionBadgeText, formatNodeLocalActionAuthorityLabel } from "@/lib/nodeDrilldownActionAuthority";
import { formatNodeLocalSize, sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";
import { cn } from "@/lib/utils";

import type { TxStatus } from "@/types/domain";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeStructureListPanelProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string) => void;
  hiddenCanonicalKeySet: ReadonlySet<string>;
  onUnhideStructure: (canonicalDomainKey: string) => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  powerStatus?: TxStatus;
  powerStructureId?: string | null;
  previewMode?: boolean;
  embedded?: boolean;
}

function NodeStructureListContent({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  hiddenCanonicalKeySet,
  onUnhideStructure,
  onTogglePower,
  powerStatus,
  powerStructureId,
  previewMode,
}: Pick<NodeStructureListPanelProps, "viewModel" | "selectedStructureId" | "onSelectStructure" | "hiddenCanonicalKeySet" | "onUnhideStructure" | "onTogglePower" | "powerStatus" | "powerStructureId" | "previewMode">) {
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
          const stateBadges = [
            isHidden ? "Hidden from map" : null,
            formatNodeLocalActionBadgeText(structure),
          ].filter(Boolean);
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
                    {stateBadges.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {stateBadges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex rounded border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {structure.actionAuthority.state !== "verified-supported" ? (
                      <p className="mt-1 text-[11px] text-muted-foreground/75">
                        {formatNodeLocalActionAuthorityLabel(structure)}
                      </p>
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
                  previewMode={previewMode}
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
  onTogglePower,
  powerStatus,
  powerStructureId,
  previewMode,
  embedded = false,
}: NodeStructureListPanelProps) {
  const content = (
    <NodeStructureListContent
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
      onSelectStructure={onSelectStructure}
      hiddenCanonicalKeySet={hiddenCanonicalKeySet}
      onUnhideStructure={onUnhideStructure}
      onTogglePower={onTogglePower}
      powerStatus={powerStatus}
      powerStructureId={powerStructureId}
      previewMode={previewMode}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardPanelFrame
      title={`Attached Structures (${viewModel.structures.length})`}
      subtitle="Verified controls plus local hide state"
    >
      {content}
    </DashboardPanelFrame>
  );
}