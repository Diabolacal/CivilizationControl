import { NodeDrilldownCanvas } from "./NodeDrilldownCanvas";
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
  return (
    <TopologyPanelFrame title={title} subtitle={subtitle} headerAction={headerAction}>
      <TopologyPanelFade>
        <NodeDrilldownCanvas
          viewModel={viewModel}
          selectedStructureId={selectedStructureId}
          onSelectStructure={onSelectStructure}
        />
      </TopologyPanelFade>
    </TopologyPanelFrame>
  );
}