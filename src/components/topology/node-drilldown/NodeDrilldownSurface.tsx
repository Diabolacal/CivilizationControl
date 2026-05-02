import type { ReactNode } from "react";

import { Network } from "lucide-react";

import { NodeDrilldownCanvas } from "./NodeDrilldownCanvas";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

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
    <section className="w-full overflow-hidden rounded border border-border bg-[var(--card)]">
      <div className="relative z-10 flex items-center justify-between border-b border-border/50 bg-muted/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Network className="h-4 w-4 text-primary opacity-80" />
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-foreground">{title}</h2>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {headerAction}
      </div>
      <NodeDrilldownCanvas
        viewModel={viewModel}
        selectedStructureId={selectedStructureId}
        onSelectStructure={onSelectStructure}
      />
    </section>
  );
}