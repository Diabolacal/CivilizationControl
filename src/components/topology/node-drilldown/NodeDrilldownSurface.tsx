import { useState } from "react";

import { NodeDrilldownCanvas } from "./NodeDrilldownCanvas";
import { NodeDrilldownLegend } from "./NodeDrilldownLegend";
import { TopologyPanelFade, TopologyPanelFrame } from "@/components/topology/TopologyPanelFrame";

import type { OpenNodeDrilldownStructureMenuParams } from "@/hooks/useNodeDrilldownStructureMenu";
import type { NodeDrilldownLayoutOverrides, NodeDrilldownLayoutPosition } from "@/lib/nodeDrilldownLayoutOverrides";
import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";
import type { OpenNodeDrilldownNodeMenuParams } from "./NodeDrilldownCanvas";
import type { ReactNode } from "react";

interface NodeDrilldownSurfaceProps {
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
  hasManualLayout?: boolean;
  isRefreshing?: boolean;
  isStructureMenuOpen?: boolean;
  onRefresh?: () => void | Promise<void>;
  onResetLayout?: () => void;
  onUpdateStructurePosition?: (canonicalDomainKey: string, position: NodeDrilldownLayoutPosition) => void;
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
  embedded?: boolean;
}

function NodeDrilldownSurfaceBody({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  onOpenNodeMenu,
  onOpenStructureMenu,
  onCloseStructureMenu,
  totalStructureCount,
  hiddenStructureCount,
  layoutOverrides,
  powerUsageLabel,
  hasManualLayout,
  isRefreshing = false,
  isStructureMenuOpen,
  onRefresh,
  onResetLayout,
  onUpdateStructurePosition,
}: Pick<
  NodeDrilldownSurfaceProps,
  | "viewModel"
  | "selectedStructureId"
  | "onSelectStructure"
  | "onOpenNodeMenu"
  | "onOpenStructureMenu"
  | "onCloseStructureMenu"
  | "totalStructureCount"
  | "hiddenStructureCount"
  | "layoutOverrides"
  | "powerUsageLabel"
  | "hasManualLayout"
  | "isRefreshing"
  | "isStructureMenuOpen"
  | "onRefresh"
  | "onResetLayout"
  | "onUpdateStructurePosition"
>) {
  const [isLegendVisible, setIsLegendVisible] = useState(true);

  return (
    <div className="relative h-full">
      <NodeDrilldownCanvas
        viewModel={viewModel}
        selectedStructureId={selectedStructureId}
        onSelectStructure={onSelectStructure}
        onOpenNodeMenu={onOpenNodeMenu}
        onOpenStructureMenu={onOpenStructureMenu}
        onCloseStructureMenu={onCloseStructureMenu}
        totalStructureCount={totalStructureCount}
        hiddenStructureCount={hiddenStructureCount}
        layoutOverrides={layoutOverrides}
        powerUsageLabel={powerUsageLabel}
        isStructureMenuOpen={isStructureMenuOpen}
        onUpdateStructurePosition={onUpdateStructurePosition}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        {onRefresh ? (
          <div className="pointer-events-auto absolute left-2 top-2">
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              aria-label="Refresh node structures"
              className="rounded bg-background/50 px-1.5 py-0.5 font-mono text-[9px] text-foreground/85 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        ) : null}

        <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-1.5">
          {onResetLayout ? (
            <button
              type="button"
              onClick={onResetLayout}
              disabled={!hasManualLayout}
              className="rounded bg-background/50 px-1.5 py-0.5 font-mono text-[9px] text-foreground/85 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            >
              Reset Layout
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsLegendVisible((current) => !current)}
            aria-pressed={isLegendVisible}
            className="rounded bg-background/50 px-1.5 py-0.5 font-mono text-[9px] text-foreground/85 transition-colors hover:text-foreground"
          >
            {isLegendVisible ? "Hide Key" : "Show Key"}
          </button>
        </div>

        {isLegendVisible ? (
          <div className="pointer-events-auto absolute bottom-3 left-3">
            <NodeDrilldownLegend />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NodeDrilldownSurface({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  onOpenNodeMenu,
  onOpenStructureMenu,
  onCloseStructureMenu,
  totalStructureCount,
  hiddenStructureCount,
  layoutOverrides,
  powerUsageLabel,
  hasManualLayout,
  isRefreshing,
  isStructureMenuOpen,
  onRefresh,
  onResetLayout,
  onUpdateStructurePosition,
  title,
  subtitle,
  headerAction,
  embedded = false,
}: NodeDrilldownSurfaceProps) {
  const body = (
    <NodeDrilldownSurfaceBody
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
      onSelectStructure={onSelectStructure}
      onOpenNodeMenu={onOpenNodeMenu}
      onOpenStructureMenu={onOpenStructureMenu}
      onCloseStructureMenu={onCloseStructureMenu}
      totalStructureCount={totalStructureCount}
      hiddenStructureCount={hiddenStructureCount}
      layoutOverrides={layoutOverrides}
      powerUsageLabel={powerUsageLabel}
      hasManualLayout={hasManualLayout}
      isRefreshing={isRefreshing}
      isStructureMenuOpen={isStructureMenuOpen}
      onRefresh={onRefresh}
      onResetLayout={onResetLayout}
      onUpdateStructurePosition={onUpdateStructurePosition}
    />
  );

  if (embedded) {
    return body;
  }

  return (
    <TopologyPanelFrame title={title} subtitle={subtitle} headerAction={headerAction}>
      <TopologyPanelFade>{body}</TopologyPanelFade>
    </TopologyPanelFrame>
  );
}
