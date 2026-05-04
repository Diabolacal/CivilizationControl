import type { StructureStatus } from "@/types/domain";

import type { NodeLocalStructure } from "./nodeDrilldownTypes";

export type NodeLocalPowerSegment = "offline" | "online";

export interface NodeLocalPowerToggleIntent {
  actionLabel: "Bring Online" | "Take Offline";
  currentStatus: StructureStatus;
  nextOnline: boolean;
}

export interface NodeLocalPowerControlState {
  actionLabel: "Bring Online" | "Take Offline" | null;
  currentStatus: StructureStatus;
  nextOnline: boolean | null;
  selectedSegment: NodeLocalPowerSegment | null;
  isInteractive: boolean;
  isStatusOnly: boolean;
}

function selectNodeLocalPowerSegment(status: StructureStatus): NodeLocalPowerSegment | null {
  if (status === "online") {
    return "online";
  }

  if (status === "offline") {
    return "offline";
  }

  return null;
}

export function getNodeLocalActionStatus(structure: NodeLocalStructure): StructureStatus {
  return structure.actionAuthority.verifiedTarget?.status ?? structure.status;
}

export function getNodeLocalPowerToggleIntent(
  structure: NodeLocalStructure,
): NodeLocalPowerToggleIntent | null {
  const verifiedTarget = structure.actionAuthority.verifiedTarget;
  if (!verifiedTarget) return null;

  if (verifiedTarget.status === "online") {
    return {
      actionLabel: "Take Offline",
      currentStatus: verifiedTarget.status,
      nextOnline: false,
    };
  }

  if (verifiedTarget.status === "offline") {
    return {
      actionLabel: "Bring Online",
      currentStatus: verifiedTarget.status,
      nextOnline: true,
    };
  }

  return null;
}

export function getNodeLocalPowerControlState(
  structure: NodeLocalStructure,
): NodeLocalPowerControlState {
  const toggleIntent = getNodeLocalPowerToggleIntent(structure);
  const currentStatus = getNodeLocalActionStatus(structure);

  return {
    actionLabel: toggleIntent?.actionLabel ?? null,
    currentStatus,
    nextOnline: toggleIntent?.nextOnline ?? null,
    selectedSegment: selectNodeLocalPowerSegment(currentStatus),
    isInteractive: toggleIntent != null,
    isStatusOnly: toggleIntent == null,
  };
}

export function supportsNodeLocalRename(structure: NodeLocalStructure): boolean {
  return structure.actionAuthority.verifiedTarget != null;
}

export function formatNodeLocalActionAuthorityLabel(structure: NodeLocalStructure): string {
  switch (structure.actionAuthority.state) {
    case "verified-supported":
      return "Action ready";
    case "future-supported":
      return "Awaiting web controls";
    case "backend-only":
      return "Awaiting chain proof";
    case "ambiguous-match":
      return `Match review needed (${structure.actionAuthority.candidateTargets.length})`;
    case "unsupported-family":
      return "Action not approved";
    case "missing-owner-cap":
      return "Control proof missing";
    case "missing-node-context":
      return "Node link missing";
    case "synthetic":
      return "Lab preview";
  }
}

export function formatNodeLocalActionAuthorityDetail(structure: NodeLocalStructure): string {
  const unavailableReason = structure.actionAuthority.unavailableReason;
  switch (structure.actionAuthority.state) {
    case "verified-supported":
      return `This ${structure.familyLabel.toLowerCase()} can be controlled from this row.`;
    case "future-supported":
      return unavailableReason ?? "This structure is recognized, but web controls are not available yet.";
    case "backend-only":
      return unavailableReason ?? "Control unlocks when this row resolves to one verified structure with complete proof.";
    case "ambiguous-match":
      return unavailableReason ?? `Control is paused because ${structure.actionAuthority.candidateTargets.length} matching structures were found.`;
    case "unsupported-family":
      return unavailableReason ?? "This structure family is not approved for web power control in this release.";
    case "missing-owner-cap":
      return unavailableReason ?? "Control is paused because the required control proof is missing.";
    case "missing-node-context":
      return unavailableReason ?? "Control is paused because the linked node record is incomplete.";
    case "synthetic":
      return "Lab rows preview control state but never submit transactions.";
  }
}

export function formatNodeLocalActionTooltip(structure: NodeLocalStructure): string {
  if (structure.actionAuthority.unavailableReason && structure.actionAuthority.state !== "verified-supported") {
    return structure.actionAuthority.unavailableReason;
  }

  if (structure.actionAuthority.state === "verified-supported") {
    const actionStatus = getNodeLocalActionStatus(structure);
    if (actionStatus === "warning" || actionStatus === "neutral") {
      return "Status unresolved";
    }
  }

  return formatNodeLocalActionAuthorityLabel(structure);
}

export function formatNodeLocalActionBadgeText(structure: NodeLocalStructure): string {
  if (structure.actionAuthority.state === "verified-supported") {
    return "Action ready";
  }

  if (structure.actionAuthority.state === "future-supported") {
    return "Awaiting web controls";
  }

  if (structure.actionAuthority.state === "synthetic") {
    return "Lab preview";
  }

  return `Action unavailable: ${formatNodeLocalActionAuthorityLabel(structure)}`;
}