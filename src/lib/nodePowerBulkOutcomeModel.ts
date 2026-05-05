import {
  toStructureWriteTarget,
  type NodePowerEligibilityReason,
  type NodePowerOperationDecision,
  type NodePowerOperationEvaluation,
  type NodePowerOperationPlan,
} from "@/lib/nodePowerControlModel";
import type { StructureWriteTarget } from "@/lib/structureWriteReconciliation";

const ALREADY_CORRECT_REASONS = new Set<NodePowerEligibilityReason>([
  "already_online",
  "already_offline",
]);

export interface NodePowerBulkOutcomeEntry {
  displayName: string;
  reason: NodePowerEligibilityReason;
}

export interface NodePowerBulkOutcomeSummary {
  requestedCount: number;
  submittedCount: number;
  alreadyCorrectCount: number;
  heldCount: number;
  submittedTargets: StructureWriteTarget[];
  correctionTargets: StructureWriteTarget[];
  alreadyCorrectEntries: NodePowerBulkOutcomeEntry[];
  heldEntries: NodePowerBulkOutcomeEntry[];
}

function toOutcomeEntry(decision: NodePowerOperationDecision): NodePowerBulkOutcomeEntry {
  return {
    displayName: decision.target.structure.displayName,
    reason: decision.reason,
  };
}

export function summarizeNodePowerBulkOutcome(
  plan: NodePowerOperationPlan,
  evaluation: NodePowerOperationEvaluation,
): NodePowerBulkOutcomeSummary {
  const alreadyCorrectDecisions = evaluation.decisions.filter((decision) => ALREADY_CORRECT_REASONS.has(decision.reason));
  const heldDecisions = evaluation.decisions.filter((decision) => !decision.included && !ALREADY_CORRECT_REASONS.has(decision.reason));

  return {
    requestedCount: plan.targets.length,
    submittedCount: evaluation.targets.length,
    alreadyCorrectCount: alreadyCorrectDecisions.length,
    heldCount: heldDecisions.length,
    submittedTargets: evaluation.targets.map(toStructureWriteTarget),
    correctionTargets: alreadyCorrectDecisions.map((decision) => toStructureWriteTarget(decision.target)),
    alreadyCorrectEntries: alreadyCorrectDecisions.map(toOutcomeEntry),
    heldEntries: heldDecisions.map(toOutcomeEntry),
  };
}

export function formatNodePowerOutcomeReason(reason: NodePowerEligibilityReason): string {
  switch (reason) {
    case "already_online":
      return "Already online";
    case "already_offline":
      return "Already offline";
    case "chain_status_unavailable":
      return "Status unavailable";
    case "invalid_chain_status":
      return "Status unresolved";
    case "missing_owner_cap":
      return "Control proof missing";
    case "missing_network_node":
      return "Node link missing";
    case "missing_structure_id":
      return "Object ID missing";
    case "modeled_online_without_chain_status":
      return "Status unverified";
    case "chain_offline":
      return "Queued online";
    case "chain_online":
      return "Queued offline";
  }
}

export function buildNodePowerOutcomeDetail(summary: NodePowerBulkOutcomeSummary): string | null {
  const parts: string[] = [];

  if (summary.submittedCount > 0) {
    parts.push(`${summary.submittedCount} submitted`);
  }

  if (summary.alreadyCorrectCount > 0) {
    parts.push(`${summary.alreadyCorrectCount} already matched`);
  }

  if (summary.heldCount > 0) {
    parts.push(`${summary.heldCount} held`);
  }

  return parts.length > 0 ? parts.join(" • ") : null;
}

export function buildNodePowerOutcomePreviewItems(
  summary: NodePowerBulkOutcomeSummary,
  maxItems = 3,
): string[] {
  const entries = [...summary.heldEntries, ...summary.alreadyCorrectEntries];
  const preview = entries.slice(0, maxItems).map((entry) => `${entry.displayName}: ${formatNodePowerOutcomeReason(entry.reason)}`);
  const remainingCount = entries.length - preview.length;

  if (remainingCount > 0) {
    preview.push(`+${remainingCount} more rows`);
  }

  return preview;
}