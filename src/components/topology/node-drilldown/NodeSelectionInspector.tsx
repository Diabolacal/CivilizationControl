import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { findNodeLocalStructure, formatNodeLocalSize, formatNodeLocalStatus, summarizeNodeLocalFamilies } from "@/lib/nodeDrilldownModel";

import type { NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeSelectionInspectorProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  embedded?: boolean;
}

function formatObservedTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
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
            <InspectorRow label={selectedStructure.source === "backendObserved" ? "Observed Status" : "Status"} value={formatNodeLocalStatus(selectedStructure.status)} />
            <InspectorRow label="Object ID" value={selectedStructure.objectId ?? "Synthetic fixture"} />
            <InspectorRow label="Assembly ID" value={selectedStructure.assemblyId ?? "Unavailable in this slice"} />
            {selectedStructure.source === "backendObserved" ? (
              <>
                <InspectorRow label="Source" value={selectedStructure.source === "backendObserved" ? "Shared backend observation" : "Direct chain"} />
                <InspectorRow label="Authority" value="Read-only • Non-actionable" />
                {selectedStructure.lastUpdated || selectedStructure.fetchedAt ? (
                  <InspectorRow
                    label="Freshness"
                    value={formatObservedTimestamp(selectedStructure.lastUpdated) ?? formatObservedTimestamp(selectedStructure.fetchedAt) ?? "Observed"}
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <>
            <InspectorRow label="Node" value={viewModel.node.displayName} />
            <InspectorRow label="Status" value={formatNodeLocalStatus(viewModel.node.status)} />
            <InspectorRow
              label="Source"
              value={viewModel.source === "synthetic"
                ? "Synthetic scenario"
                : viewModel.coverage === "live-plus-backend-observed"
                  ? "Current live node plus backend observations"
                  : "Current live NetworkNodeGroup"}
            />
            <InspectorRow
              label="Coverage"
              value={viewModel.coverage === "current-live-families"
                ? "Current live families only"
                : viewModel.coverage === "live-plus-backend-observed"
                  ? "Live families plus backend-observed structures"
                  : "Expanded synthetic families"}
            />
            <InspectorRow label="Structures" value={`${viewModel.structures.length}`} />
            <InspectorRow label="Families" value={summarizeNodeLocalFamilies(viewModel) || "None attached"} />
            <InspectorRow label="Fuel" value={viewModel.node.fuelSummary ?? "Not surfaced in this slice"} />
            {viewModel.coverage === "live-plus-backend-observed" ? (
              <InspectorRow
                label="Observed"
                value={`${viewModel.structures.filter((structure) => structure.source === "backendObserved").length} read-only structure${viewModel.structures.filter((structure) => structure.source === "backendObserved").length === 1 ? "" : "s"}`}
              />
            ) : null}
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