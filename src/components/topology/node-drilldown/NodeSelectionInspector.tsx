import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { findNodeLocalStructure, formatNodeLocalSize, formatNodeLocalStatus, summarizeNodeLocalFamilies } from "@/lib/nodeDrilldownModel";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeSelectionInspectorProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  embedded?: boolean;
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">{label}</span>
      <span className="max-w-[60%] break-all text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

function NodeSelectionInspectorContent({
  viewModel,
  selectedStructureId,
}: Pick<NodeSelectionInspectorProps, "viewModel" | "selectedStructureId">) {
  const selectedStructure = findNodeLocalStructure(viewModel, selectedStructureId);

  return (
    <>
      <div className="space-y-1 px-4 py-3">
        {selectedStructure ? (
          <>
            <InspectorRow label="Name" value={selectedStructure.displayName} />
            <InspectorRow label="Type" value={selectedStructure.typeLabel} />
            <InspectorRow label="Family" value={selectedStructure.familyLabel} />
            <InspectorRow label="Size" value={formatNodeLocalSize(selectedStructure.sizeVariant) ?? "Not tagged"} />
            <InspectorRow label="Status" value={formatNodeLocalStatus(selectedStructure.status)} />
            <InspectorRow label="Object ID" value={selectedStructure.objectId ?? "Synthetic fixture"} />
            <InspectorRow label="Assembly ID" value={selectedStructure.assemblyId ?? "Unavailable in this slice"} />
          </>
        ) : (
          <>
            <InspectorRow label="Node" value={viewModel.node.displayName} />
            <InspectorRow label="Status" value={formatNodeLocalStatus(viewModel.node.status)} />
            <InspectorRow label="Source" value={viewModel.source === "live" ? "Current live NetworkNodeGroup" : "Synthetic scenario"} />
            <InspectorRow label="Coverage" value={viewModel.coverage === "current-live-families" ? "Current live families only" : "Expanded synthetic families"} />
            <InspectorRow label="Structures" value={`${viewModel.structures.length}`} />
            <InspectorRow label="Families" value={summarizeNodeLocalFamilies(viewModel) || "None attached"} />
            <InspectorRow label="Fuel" value={viewModel.node.fuelSummary ?? "Not surfaced in this slice"} />
          </>
        )}
      </div>

      <div className="border-t border-border/50 bg-muted/5 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Write actions, presets, and layout persistence are intentionally deferred in this first slice.
        </p>
      </div>
    </>
  );
}

export function NodeSelectionInspector({
  viewModel,
  selectedStructureId,
  embedded = false,
}: NodeSelectionInspectorProps) {
  const content = (
    <NodeSelectionInspectorContent
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardPanelFrame
      title="Selection Inspector"
      subtitle="Placeholder for later controls"
    >
      {content}
    </DashboardPanelFrame>
  );
}