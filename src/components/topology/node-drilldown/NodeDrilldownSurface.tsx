import { useState } from "react";

import { NodeDrilldownCanvas } from "./NodeDrilldownCanvas";
import { NodeDrilldownLegend } from "./NodeDrilldownLegend";
import { TopologyPanelFade, TopologyPanelFrame } from "@/components/topology/TopologyPanelFrame";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";
import type { ReactNode } from "react";

interface NodeDrilldownSurfaceProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  onSelectStructure: (structureId: string | null) => void;
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
}

export function NodeDrilldownSurface({
  viewModel,
  selectedStructureId,
  onSelectStructure,
  title,
  subtitle,
  headerAction,
}: NodeDrilldownSurfaceProps) {
  const [isLegendVisible, setIsLegendVisible] = useState(true);

  return (
    <TopologyPanelFrame title={title} subtitle={subtitle} headerAction={headerAction}>
      <TopologyPanelFade>
        <div className="relative h-full">
          <NodeDrilldownCanvas
            viewModel={viewModel}
            selectedStructureId={selectedStructureId}
            onSelectStructure={onSelectStructure}
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
      </TopologyPanelFade>
    </TopologyPanelFrame>
  );
}