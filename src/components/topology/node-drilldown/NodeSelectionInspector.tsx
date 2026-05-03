import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { NodeStructureActionRail } from "@/components/topology/node-drilldown/NodeStructureActionRail";
import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionAuthorityLabel,
  getNodeLocalActionStatus,
} from "@/lib/nodeDrilldownActionAuthority";
import { selectCanonicalNodeDrilldownDomainKey } from "@/lib/nodeDrilldownIdentity";
import { findNodeLocalStructure, formatNodeLocalSize, formatNodeLocalStatus, summarizeNodeLocalFamilies } from "@/lib/nodeDrilldownModel";

import type { Structure, TxResult, TxStatus } from "@/types/domain";
import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

interface NodeSelectionInspectorProps {
  viewModel: NodeLocalViewModel;
  selectedNode?: Structure | null;
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
  debugOperatorInventoryEnabled?: boolean;
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

function InspectorRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}) {
  const valueClasses = [
    "max-w-[68%]",
    "break-all",
    "text-right",
    mono ? "font-mono text-[11px]" : "text-sm",
    muted ? "text-muted-foreground" : "text-foreground",
  ].join(" ");

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">{label}</span>
      <span className={valueClasses}>{value}</span>
    </div>
  );
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function formatSourceMode(viewModel: NodeLocalViewModel): string {
  switch (viewModel.sourceMode) {
    case "backend-membership":
      return "Indexed node membership";
    case "loading":
      return "Indexed membership pending";
    case "error-fallback":
    case "live-fallback":
      return "Current live node membership";
    case "synthetic":
      return "Synthetic scenario";
  }
}

function formatCoverage(viewModel: NodeLocalViewModel): string {
  switch (viewModel.sourceMode) {
    case "backend-membership":
      return "Indexed inventory with live authority overlays";
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
      return "Indexed inventory";
    case "backendObserved":
      return "Shared indexer read model";
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
    return "Indexed inventory only";
  }

  if (structure.directChainMatchCount > 1) {
    return `Live authority overlays (${structure.directChainMatchCount})`;
  }

  return "Live authority overlay";
}

function formatNodeRenderEligibility(selectedNode: Structure | null): string {
  const eligibility = selectedNode?.networkNodeRenderMeta?.renderEligibility;

  if (eligibility === "grouped-structures") {
    return "Rendered from grouped structures";
  }

  if (eligibility === "strong-owned-node-proof") {
    return "Rendered from strong indexed ownership proof";
  }

  if (selectedNode?.readModelSource === "direct-chain") {
    return "Direct-chain fallback";
  }

  return "Not supplied";
}

function formatNodeProofSignals(selectedNode: Structure | null): string | null {
  const proofSignals = selectedNode?.networkNodeRenderMeta?.proofSignals ?? [];

  if (proofSignals.length === 0) {
    return null;
  }

  return proofSignals.map((signal) => {
    switch (signal) {
      case "assembly-id":
        return "Assembly ID";
      case "owner-cap-id":
        return "OwnerCap ID";
      case "non-neutral-status":
        return "Non-neutral status";
      case "fuel-amount":
        return "Indexed fuel";
      case "power-summary":
        return "Indexed power";
      case "energy-source-id":
        return "Energy source";
    }
  }).join(" • ");
}
function NodeSelectionInspectorContent({
  viewModel,
  selectedNode,
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
  debugOperatorInventoryEnabled,
  previewMode,
}: Pick<
  NodeSelectionInspectorProps,
  | "viewModel"
  | "selectedNode"
  | "selectedStructureId"
  | "hiddenCanonicalKeySet"
  | "onUnhideStructure"
  | "onTogglePower"
  | "powerStatus"
  | "powerResult"
  | "powerError"
  | "powerStructureId"
  | "powerSuccessLabel"
  | "onDismissPowerFeedback"
  | "debugOperatorInventoryEnabled"
  | "previewMode"
>) {
  const selectedStructure = findNodeLocalStructure(viewModel, selectedStructureId);
  const isSelectedStructureHidden = selectedStructure
    ? hiddenCanonicalKeySet.has(selectedStructure.canonicalDomainKey)
    : false;
  const chainBackedCount = viewModel.structures.filter((structure) => structure.hasDirectChainAuthority).length;
  const backendOnlyCount = viewModel.structures.length - chainBackedCount;
  const canonicalIdentity = selectedNode?.networkNodeRenderMeta?.canonicalIdentity
    ?? selectCanonicalNodeDrilldownDomainKey({
      objectId: selectedNode?.objectId ?? viewModel.node.objectId,
      assemblyId: selectedNode?.assemblyId ?? null,
    });
  const ownerCapId = hasValue(selectedNode?.ownerCapId) ? selectedNode.ownerCapId : null;
  const assemblyId = hasValue(selectedNode?.assemblyId) ? selectedNode.assemblyId : null;
  const energySourceId = hasValue(selectedNode?.summary?.energySourceId) ? selectedNode.summary.energySourceId : null;
  const proofSignals = formatNodeProofSignals(selectedNode ?? null);

  return (
    <>
      <div className="space-y-1 px-4 py-3">
        {selectedStructure ? (
          <>
            <InspectorRow label="Name" value={selectedStructure.displayName} />
            <InspectorRow label="Type" value={selectedStructure.typeLabel} />
            <InspectorRow label="Family" value={selectedStructure.familyLabel} />
            <InspectorRow label="Size" value={formatNodeLocalSize(selectedStructure.sizeVariant) ?? "Not tagged"} muted={formatNodeLocalSize(selectedStructure.sizeVariant) == null} />
            <InspectorRow label="Status" value={formatNodeLocalStatus(selectedStructure.status)} />
            <InspectorRow label="Node View" value={isSelectedStructureHidden ? "Hidden from map (local only)" : "Visible in node view"} />
            <InspectorRow label="Source" value={formatStructureSource(selectedStructure)} />
            <InspectorRow label="Authority" value={formatStructureAuthority(selectedStructure)} />
            <InspectorRow label="Action Authority" value={formatNodeLocalActionAuthorityLabel(selectedStructure)} />
            <InspectorRow label="Action State" value={formatNodeLocalStatus(getNodeLocalActionStatus(selectedStructure))} />
            <InspectorRow label="Action Detail" value={formatNodeLocalActionAuthorityDetail(selectedStructure)} />
            <InspectorRow label="Object ID" value={selectedStructure.objectId ?? "Not supplied"} mono={hasValue(selectedStructure.objectId)} muted={!hasValue(selectedStructure.objectId)} />
            <InspectorRow label="Assembly ID" value={selectedStructure.assemblyId ?? "Not indexed"} mono={hasValue(selectedStructure.assemblyId)} muted={!hasValue(selectedStructure.assemblyId)} />
            {selectedStructure.directChainObjectId && selectedStructure.directChainObjectId !== selectedStructure.objectId ? (
              <InspectorRow label="Chain Object ID" value={selectedStructure.directChainObjectId} mono />
            ) : null}
            {selectedStructure.directChainAssemblyId && selectedStructure.directChainAssemblyId !== selectedStructure.assemblyId ? (
              <InspectorRow label="Chain Assembly ID" value={selectedStructure.directChainAssemblyId} mono />
            ) : null}
            {selectedStructure.source === "backendMembership" || selectedStructure.source === "backendObserved" ? (
              <>
                {selectedStructure.lastUpdated || selectedStructure.fetchedAt ? (
                  <InspectorRow
                    label="Freshness"
                    value={formatObservedTimestamp(selectedStructure.lastUpdated) ?? formatObservedTimestamp(selectedStructure.fetchedAt) ?? "Observed"}
                    muted={formatObservedTimestamp(selectedStructure.lastUpdated) == null && formatObservedTimestamp(selectedStructure.fetchedAt) == null}
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
            <InspectorRow label="Grouped Structures" value={`${viewModel.structures.length}`} />
            <InspectorRow label="Families" value={summarizeNodeLocalFamilies(viewModel) || "None"} muted={!summarizeNodeLocalFamilies(viewModel)} />
            <InspectorRow label="Object ID" value={selectedNode?.objectId ?? viewModel.node.objectId ?? "Not supplied"} mono={hasValue(selectedNode?.objectId ?? viewModel.node.objectId)} muted={!hasValue(selectedNode?.objectId ?? viewModel.node.objectId)} />
            <InspectorRow label="Assembly ID" value={assemblyId ?? "Not indexed"} mono={assemblyId != null} muted={assemblyId == null} />
            <InspectorRow label="OwnerCap ID" value={ownerCapId ?? "Not indexed"} mono={ownerCapId != null} muted={ownerCapId == null} />
            <InspectorRow label="Energy Source ID" value={energySourceId ?? "None"} mono={energySourceId != null} muted={energySourceId == null} />
            <InspectorRow label="Canonical Identity" value={canonicalIdentity ?? "Not supplied"} mono={canonicalIdentity != null} muted={canonicalIdentity == null} />
            <InspectorRow label="Fuel" value={viewModel.node.fuelSummary ?? "None"} muted={viewModel.node.fuelSummary == null} />
            {selectedNode?.networkNodeRenderMeta?.rawNodeIndex != null ? (
              <InspectorRow label="Indexed Node Row" value={`${selectedNode.networkNodeRenderMeta.rawNodeIndex}`} mono />
            ) : null}
            {debugOperatorInventoryEnabled ? (
              <>
                <InspectorRow label="Source Mode" value={viewModel.sourceMode} mono muted />
                <InspectorRow label="Coverage" value={formatCoverage(viewModel)} muted />
                <InspectorRow label="Eligibility" value={formatNodeRenderEligibility(selectedNode ?? null)} muted />
                {proofSignals ? <InspectorRow label="Proof Signals" value={proofSignals} muted /> : null}
                {viewModel.sourceMode === "backend-membership" ? (
                  <InspectorRow
                    label="Authority Overlay"
                    value={`${chainBackedCount} live overlay / ${backendOnlyCount} indexed only`}
                    muted
                  />
                ) : null}
              </>
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
  selectedNode,
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
  debugOperatorInventoryEnabled,
  previewMode,
  embedded = false,
}: NodeSelectionInspectorProps) {
  const content = (
    <NodeSelectionInspectorContent
      viewModel={viewModel}
      selectedNode={selectedNode}
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
      debugOperatorInventoryEnabled={debugOperatorInventoryEnabled}
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