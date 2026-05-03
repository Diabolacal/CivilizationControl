import { CompactCopyValue } from "@/components/CompactCopyValue";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { NodeStructureActionRail } from "@/components/topology/node-drilldown/NodeStructureActionRail";
import {
  formatNodeLocalActionAuthorityDetail,
  formatNodeLocalActionAuthorityLabel,
  getNodeLocalActionStatus,
} from "@/lib/nodeDrilldownActionAuthority";
import { buildFuelPresentation, type FuelPresentation, type FuelSeverity } from "@/lib/fuelRuntime";
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
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  const valueClasses = [
    "block",
    mono ? "font-mono text-[11px]" : "text-sm",
    muted ? "text-muted-foreground" : "text-foreground",
    typeof value === "string" ? "whitespace-pre-wrap break-words" : null,
  ].filter(Boolean).join(" ");

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">{label}</span>
      <div className="min-w-0 max-w-[68%] text-right">
        {typeof value === "string" ? <span className={valueClasses}>{value}</span> : value}
      </div>
    </div>
  );
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function renderIdentifierValue(value: string | null | undefined, fallback: string, ariaLabel: string) {
  if (!hasValue(value)) {
    return fallback;
  }

  return <CompactCopyValue value={value} ariaLabel={ariaLabel} />;
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

const FUEL_ACCENT_CLASS_BY_SEVERITY: Record<FuelSeverity, string> = {
  critical: "text-red-400",
  low: "text-amber-400",
  normal: "text-foreground",
  partial: "text-muted-foreground",
  unavailable: "text-muted-foreground",
};

const FUEL_BAR_CLASS_BY_SEVERITY: Record<FuelSeverity, string> = {
  critical: "bg-red-500/80",
  low: "bg-amber-500/80",
  normal: "bg-teal-500/70",
  partial: "bg-muted-foreground/45",
  unavailable: "bg-transparent",
};

function fuelStatusLabel(presentation: FuelPresentation): string | null {
  switch (presentation.severity) {
    case "critical":
      return "Critical fuel";
    case "low":
      return "Low fuel";
    case "partial":
      return "Runtime estimate unavailable";
    default:
      return null;
  }
}

function renderNodeFuelValue(presentation: FuelPresentation): React.ReactNode {
  const quantityLabel = presentation.amountLabel;
  const runtimeSummary = [
    presentation.typeLabel,
    presentation.runtimeLabel ? `~${presentation.runtimeLabel}` : null,
  ].filter((value): value is string => Boolean(value)).join(" · ");
  const compactUnavailableLabel = presentation.runtimeLabel == null && presentation.isRuntimeKnown === false
    ? fuelStatusLabel(presentation)
    : null;
  const statusLabel = fuelStatusLabel(presentation);

  return (
    <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right">
      {(presentation.fillPercent != null || quantityLabel) ? (
        <div className="flex min-w-0 items-center justify-end gap-2">
          {presentation.fillPercent != null ? (
            <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted/30">
              <div
                className={`h-full rounded-full ${FUEL_BAR_CLASS_BY_SEVERITY[presentation.severity]}`}
                style={{ width: `${presentation.fillPercent}%` }}
              />
            </div>
          ) : null}
          {quantityLabel ? (
            <span className="min-w-0 text-sm font-mono text-foreground">{quantityLabel}</span>
          ) : null}
        </div>
      ) : null}
      {runtimeSummary ? (
        <span className={`text-sm font-mono ${FUEL_ACCENT_CLASS_BY_SEVERITY[presentation.severity]}`}>
          {runtimeSummary}
        </span>
      ) : compactUnavailableLabel ? (
        <span className={`text-[11px] ${FUEL_ACCENT_CLASS_BY_SEVERITY[presentation.severity]}`}>
          {compactUnavailableLabel}
        </span>
      ) : null}
      {statusLabel && runtimeSummary ? (
        <span className={`text-[11px] ${FUEL_ACCENT_CLASS_BY_SEVERITY[presentation.severity]}`}>{statusLabel}</span>
      ) : null}
      {!quantityLabel && !runtimeSummary && !compactUnavailableLabel ? (
        <span className="text-sm font-mono text-muted-foreground">Unavailable</span>
      ) : null}
    </div>
  );
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
  const nodeFuelPresentation = selectedNode ? buildFuelPresentation(selectedNode) : null;
  const proofSignals = formatNodeProofSignals(selectedNode ?? null);
  const showStructureFeedback = Boolean(
    selectedStructure
      && powerStructureId === selectedStructure.id
      && powerStatus !== "idle"
      && onDismissPowerFeedback,
  );

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
            <InspectorRow label="Object ID" value={renderIdentifierValue(selectedStructure.objectId, "Not supplied", "Copy structure object ID")} muted={!hasValue(selectedStructure.objectId)} />
            <InspectorRow label="Assembly ID" value={renderIdentifierValue(selectedStructure.assemblyId, "Not indexed", "Copy structure assembly ID")} muted={!hasValue(selectedStructure.assemblyId)} />
            {selectedStructure.directChainObjectId && selectedStructure.directChainObjectId !== selectedStructure.objectId ? (
              <InspectorRow label="Chain Object ID" value={renderIdentifierValue(selectedStructure.directChainObjectId, "Not supplied", "Copy chain object ID")} />
            ) : null}
            {selectedStructure.directChainAssemblyId && selectedStructure.directChainAssemblyId !== selectedStructure.assemblyId ? (
              <InspectorRow label="Chain Assembly ID" value={renderIdentifierValue(selectedStructure.directChainAssemblyId, "Not supplied", "Copy chain assembly ID")} />
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
            {debugOperatorInventoryEnabled ? (
              <>
                <InspectorRow label="Source" value={formatStructureSource(selectedStructure)} muted />
                <InspectorRow label="Authority" value={formatStructureAuthority(selectedStructure)} muted />
                <InspectorRow label="Action Authority" value={formatNodeLocalActionAuthorityLabel(selectedStructure)} muted />
                <InspectorRow label="Action State" value={formatNodeLocalStatus(getNodeLocalActionStatus(selectedStructure))} muted />
                <InspectorRow label="Action Detail" value={formatNodeLocalActionAuthorityDetail(selectedStructure)} muted />
              </>
            ) : null}
          </>
        ) : (
          <>
            <InspectorRow label="Node" value={viewModel.node.displayName} />
            <InspectorRow label="Status" value={formatNodeLocalStatus(viewModel.node.status)} />
            <InspectorRow label="Grouped Structures" value={`${viewModel.structures.length}`} />
            <InspectorRow label="Families" value={summarizeNodeLocalFamilies(viewModel) || "None"} muted={!summarizeNodeLocalFamilies(viewModel)} />
            <InspectorRow label="Object ID" value={renderIdentifierValue(selectedNode?.objectId ?? viewModel.node.objectId, "Not supplied", "Copy node object ID")} muted={!hasValue(selectedNode?.objectId ?? viewModel.node.objectId)} />
            <InspectorRow label="Assembly ID" value={renderIdentifierValue(assemblyId, "Not indexed", "Copy node assembly ID")} muted={assemblyId == null} />
            <InspectorRow label="OwnerCap ID" value={renderIdentifierValue(ownerCapId, "Not indexed", "Copy node owner cap ID")} muted={ownerCapId == null} />
            <InspectorRow label="Energy Source ID" value={renderIdentifierValue(energySourceId, "None", "Copy node energy source ID")} muted={energySourceId == null} />
            <InspectorRow label="Canonical Identity" value={renderIdentifierValue(canonicalIdentity, "Not supplied", "Copy canonical node identity")} muted={canonicalIdentity == null} />
            <InspectorRow
              label="Fuel"
              value={nodeFuelPresentation && nodeFuelPresentation.source !== "none"
                ? renderNodeFuelValue(nodeFuelPresentation)
                : viewModel.node.fuelSummary ?? "Unavailable"}
              muted={(!nodeFuelPresentation || nodeFuelPresentation.source === "none") && viewModel.node.fuelSummary == null}
            />
            {debugOperatorInventoryEnabled ? (
              <>
                <InspectorRow label="Source" value={formatSourceMode(viewModel)} muted />
                <InspectorRow label="Raw Source Mode" value={viewModel.sourceMode} mono muted />
                <InspectorRow label="Coverage" value={formatCoverage(viewModel)} muted />
                {nodeFuelPresentation?.confidence ? (
                  <InspectorRow label="Fuel Confidence" value={nodeFuelPresentation.confidence} muted />
                ) : null}
                <InspectorRow label="Eligibility" value={formatNodeRenderEligibility(selectedNode ?? null)} muted />
                {proofSignals ? <InspectorRow label="Proof Signals" value={proofSignals} muted /> : null}
                {selectedNode?.networkNodeRenderMeta?.rawNodeIndex != null ? (
                  <InspectorRow label="Indexed Node Row" value={`${selectedNode.networkNodeRenderMeta.rawNodeIndex}`} mono muted />
                ) : null}
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

      {selectedStructure ? (
        <div className="space-y-3 border-t border-border/50 bg-muted/5 px-4 py-3">
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

          {showStructureFeedback ? (
            <TxFeedbackBanner
              status={powerStatus ?? "idle"}
              result={powerResult ?? null}
              error={powerError ?? null}
              successLabel={powerSuccessLabel ?? "Structure power state updated"}
              pendingLabel="Submitting structure power action…"
              onDismiss={onDismissPowerFeedback!}
            />
          ) : null}
        </div>
      ) : null}
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
      subtitle="Selection details and local node-view state"
    >
      {content}
    </DashboardPanelFrame>
  );
}