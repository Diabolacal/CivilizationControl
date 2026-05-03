import { useState } from "react";

import { NodeDrilldownCanvas } from "./NodeDrilldownCanvas";
import { NodeDrilldownLegend } from "./NodeDrilldownLegend";
import { TopologyPanelFade, TopologyPanelFrame } from "@/components/topology/TopologyPanelFrame";

import type { TxStatus } from "@/types/domain";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";
import type { ReactNode } from "react";

interface NodeDrilldownSurfaceProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string | null) => void;
  onHideStructure: (canonicalDomainKey: string) => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  powerStatus?: TxStatus;
  totalStructureCount: number;
  hiddenStructureCount: number;
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
  embedded?: boolean;
}

function NodeDrilldownSurfaceBody({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  onHideStructure,
  onTogglePower,
  powerStatus,
  totalStructureCount,
  hiddenStructureCount,
}: Pick<NodeDrilldownSurfaceProps, "viewModel" | "selectedStructureId" | "onSelectStructure" | "onHideStructure" | "onTogglePower" | "powerStatus" | "totalStructureCount" | "hiddenStructureCount">) {
  const [isLegendVisible, setIsLegendVisible] = useState(true);

  return (
    <div className="relative h-full">
      <NodeDrilldownCanvas
        viewModel={viewModel}
        selectedStructureId={selectedStructureId}
        onSelectStructure={onSelectStructure}
        onHideStructure={onHideStructure}
        onTogglePower={onTogglePower}
        powerStatus={powerStatus}
        totalStructureCount={totalStructureCount}
        hiddenStructureCount={hiddenStructureCount}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute right-2 top-2">
          <button
            type="button"
            onClick={() => setIsLegendVisible((current) => !current)}
            aria-pressed={isLegendVisible}
            className="rounded bg-background/50 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50 transition-colors hover:text-muted-foreground/75"
          >
            {isLegendVisible ? "hide key" : "key"}
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
  onHideStructure,
  onTogglePower,
  powerStatus,
  totalStructureCount,
  hiddenStructureCount,
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
      onHideStructure={onHideStructure}
      onTogglePower={onTogglePower}
      powerStatus={powerStatus}
      totalStructureCount={totalStructureCount}
      hiddenStructureCount={hiddenStructureCount}
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