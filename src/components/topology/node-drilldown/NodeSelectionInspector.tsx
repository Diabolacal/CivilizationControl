import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { NodeStructureActionRail } from "@/components/topology/node-drilldown/NodeStructureActionRail";
import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionAuthorityLabel,
  getNodeLocalActionStatus,
} from "@/lib/nodeDrilldownActionAuthority";
import { findNodeLocalStructure, formatNodeLocalSize, formatNodeLocalStatus, summarizeNodeLocalFamilies } from "@/lib/nodeDrilldownModel";

import type { TxResult, TxStatus } from "@/types/domain";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeSelectionInspectorProps {
  viewModel: NodeLocalViewModel;
  selectedStructureId: string | null;
  hiddenCanonicalKeySet: ReadonlySet<string>;
  onUnhideStructure: (canonicalDomainKey: string) => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  powerStatus?: TxStatus;
  powerResult?: TxResult | null;
  powerError?: string | null;
  powerStructureId?: string | null;
  powerSuccessLabel?: string;
  onDismissPowerFeedback?: () => void;
  previewMode?: boolean;
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

function formatSourceMode(viewModel: NodeLocalViewModel): string {
  switch (viewModel.sourceMode) {
    case "backend-membership":
      return "Backend membership rows rendered";
    case "loading":
      return "Live fallback while backend membership loads";
    case "error-fallback":
      return "Live fallback after backend lookup error";
    case "live-fallback":
      return "Current live NetworkNodeGroup";
    case "synthetic":
      return "Synthetic scenario";
  }
}

function formatCoverage(viewModel: NodeLocalViewModel): string {
  switch (viewModel.sourceMode) {
    case "backend-membership":
      return "Backend rows define membership; live rows annotate authority only";
    case "loading":
    case "error-fallback":
    case "live-fallback":
      return "Current live families only";
    case "synthetic":
      return "Expanded synthetic families";
  }
}

function formatStructureSource(structure: NodeLocalStructure): string {
  switch (structure.source) {
    case "backendMembership":
      return "Backend membership";
    case "backendObserved":
      return "Shared backend observation";
    case "synthetic":
      return "Synthetic scenario";
    case "live":
    default:
      return "Direct chain";
  }
}

function formatStructureAuthority(structure: NodeLocalStructure): string {
  if (structure.source === "live") {
    return "Direct-chain membership row";
  }

  if (structure.source === "synthetic") {
    return "Synthetic lab fixture";
  }

  if (!structure.hasDirectChainAuthority) {
    return "Backend membership only";
  }

  if (structure.directChainMatchCount > 1) {
    return `Direct-chain annotated (${structure.directChainMatchCount})`;
  }

  return "Direct-chain annotated";
}

function NodeSelectionInspectorContent({
  viewModel,
  selectedStructureId,
  hiddenCanonicalKeySet,
  onUnhideStructure,
  onTogglePower,
  powerStatus,
  powerResult,
  powerError,
  powerStructureId,
  powerSuccessLabel,
  onDismissPowerFeedback,
  previewMode,
}: Pick<NodeSelectionInspectorProps, "viewModel" | "selectedStructureId" | "hiddenCanonicalKeySet" | "onUnhideStructure" | "onTogglePower" | "powerStatus" | "powerResult" | "powerError" | "powerStructureId" | "powerSuccessLabel" | "onDismissPowerFeedback" | "previewMode">) {
  const selectedStructure = findNodeLocalStructure(viewModel, selectedStructureId);
  const isSelectedStructureHidden = selectedStructure
    ? hiddenCanonicalKeySet.has(selectedStructure.canonicalDomainKey)
    : false;
  const chainBackedCount = viewModel.structures.filter((structure) => structure.hasDirectChainAuthority).length;
  const backendOnlyCount = viewModel.structures.length - chainBackedCount;

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
            <InspectorRow label="Node View" value={isSelectedStructureHidden ? "Hidden from map (local only)" : "Visible in node view"} />
            <InspectorRow label="Source" value={formatStructureSource(selectedStructure)} />
            <InspectorRow label="Authority" value={formatStructureAuthority(selectedStructure)} />
            <InspectorRow label="Action Authority" value={formatNodeLocalActionAuthorityLabel(selectedStructure)} />
            <InspectorRow label="Action State" value={formatNodeLocalStatus(getNodeLocalActionStatus(selectedStructure))} />
            <InspectorRow label="Action Detail" value={formatNodeLocalActionAuthorityDetail(selectedStructure)} />
            <InspectorRow label="Object ID" value={selectedStructure.objectId ?? "Unavailable in rendered row"} />
            <InspectorRow label="Assembly ID" value={selectedStructure.assemblyId ?? "Unavailable in this slice"} />
            {selectedStructure.directChainObjectId && selectedStructure.directChainObjectId !== selectedStructure.objectId ? (
              <InspectorRow label="Chain Object ID" value={selectedStructure.directChainObjectId} />
            ) : null}
            {selectedStructure.directChainAssemblyId && selectedStructure.directChainAssemblyId !== selectedStructure.assemblyId ? (
              <InspectorRow label="Chain Assembly ID" value={selectedStructure.directChainAssemblyId} />
            ) : null}
            {selectedStructure.source === "backendMembership" || selectedStructure.source === "backendObserved" ? (
              <>
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
            <InspectorRow label="Source" value={formatSourceMode(viewModel)} />
            <InspectorRow label="Coverage" value={formatCoverage(viewModel)} />
            <InspectorRow label="Structures" value={`${viewModel.structures.length}`} />
            <InspectorRow label="Families" value={summarizeNodeLocalFamilies(viewModel) || "None attached"} />
            <InspectorRow label="Fuel" value={viewModel.node.fuelSummary ?? "Not surfaced in this slice"} />
            {viewModel.sourceMode === "backend-membership" ? (
              <InspectorRow
                label="Authority"
                value={`${chainBackedCount} chain-backed / ${backendOnlyCount} backend-only`}
              />
            ) : null}
          </>
        )}
      </div>

      <div className="space-y-3 border-t border-border/50 bg-muted/5 px-4 py-3">
        {selectedStructure ? (
          <NodeStructureActionRail
            structure={selectedStructure}
            isHidden={isSelectedStructureHidden}
            onUnhideStructure={onUnhideStructure}
            onTogglePower={onTogglePower}
            powerStatus={powerStatus}
            powerStructureId={powerStructureId}
            previewMode={previewMode}
            variant="panel"
          />
        ) : null}

        {selectedStructure && powerStructureId === selectedStructure.id && powerStatus !== "idle" && onDismissPowerFeedback ? (
          <TxFeedbackBanner
            status={powerStatus ?? "idle"}
            result={powerResult ?? null}
            error={powerError ?? null}
            successLabel={powerSuccessLabel ?? "Structure power state updated"}
            pendingLabel="Submitting structure power action…"
            onDismiss={onDismissPowerFeedback}
          />
        ) : null}

        <p className="text-xs text-muted-foreground">
          Additional controls remain deliberately deferred in this slice.
        </p>
      </div>
    </>
  );
}

export function NodeSelectionInspector({
  viewModel,
  selectedStructureId,
  hiddenCanonicalKeySet,
  onUnhideStructure,
  onTogglePower,
  powerStatus,
  powerResult,
  powerError,
  powerStructureId,
  powerSuccessLabel,
  onDismissPowerFeedback,
  previewMode,
  embedded = false,
}: NodeSelectionInspectorProps) {
  const content = (
    <NodeSelectionInspectorContent
      viewModel={viewModel}
      selectedStructureId={selectedStructureId}
      hiddenCanonicalKeySet={hiddenCanonicalKeySet}
      onUnhideStructure={onUnhideStructure}
      onTogglePower={onTogglePower}
      powerStatus={powerStatus}
      powerResult={powerResult}
      powerError={powerError}
      powerStructureId={powerStructureId}
      powerSuccessLabel={powerSuccessLabel}
      onDismissPowerFeedback={onDismissPowerFeedback}
      previewMode={previewMode}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardPanelFrame
      title="Selection Inspector"
      subtitle="Action authority and node view state"
    >
      {content}
    </DashboardPanelFrame>
  );
}