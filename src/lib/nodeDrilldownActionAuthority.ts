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
      return "Control pending";
    case "backend-only":
      return "Control proof needed";
    case "ambiguous-match":
      return `Match review needed (${structure.actionAuthority.candidateTargets.length})`;
    case "unsupported-family":
      return "Action not approved";
    case "missing-object-id":
      return "Object ID missing";
    case "missing-owner-cap":
      return "Control proof missing";
    case "missing-node-context":
      return "Node link missing";
    case "synthetic":
      return "Lab preview";
  }
}

function formatUnavailableReason(reason: string | null | undefined): string | null {
  if (!reason) return null;

  const normalized = reason.trim().toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  switch (normalized) {
    case "frontend_action_not_implemented":
    case "frontend_action_not_supported":
    case "web_controls_not_implemented":
      return "Control unavailable: this assembly type is not wired for power control yet.";
    case "missing_owner_cap":
    case "owner_cap_missing":
    case "missing_ownercap":
      return "Control unavailable: owner cap not indexed.";
    case "missing_object_id":
    case "object_id_missing":
      return "Control unavailable: missing object ID.";
    case "missing_network_node_id":
    case "network_node_missing":
    case "missing_node_context":
      return "Control unavailable: linked network node not indexed.";
    default:
      return reason;
  }
}

export function formatNodeLocalActionAuthorityDetail(structure: NodeLocalStructure): string {
  const unavailableReason = formatUnavailableReason(structure.actionAuthority.unavailableReason);
  switch (structure.actionAuthority.state) {
    case "verified-supported":
      return `This ${structure.familyLabel.toLowerCase()} can be controlled from this row.`;
    case "future-supported":
      return unavailableReason ?? "This structure is recognized, but control is not available yet.";
    case "backend-only":
      return unavailableReason ?? "Control unlocks when this row resolves to one verified structure with complete proof.";
    case "ambiguous-match":
      return unavailableReason ?? `Control is paused because ${structure.actionAuthority.candidateTargets.length} matching structures were found.`;
    case "unsupported-family":
      return unavailableReason ?? "This structure family is not approved for web power control in this release.";
    case "missing-object-id":
      return unavailableReason ?? "Control unavailable: missing object ID.";
    case "missing-owner-cap":
      return unavailableReason ?? "Control unavailable: owner cap not indexed.";
    case "missing-node-context":
      return unavailableReason ?? "Control unavailable: linked network node not indexed.";
    case "synthetic":
      return "Lab rows preview control state but never submit transactions.";
  }
}

export function formatNodeLocalActionAvailability(structure: NodeLocalStructure): string {
  if (structure.actionAuthority.verifiedTarget) {
    return "Power and rename available";
  }

  return formatNodeLocalActionAuthorityDetail(structure);
}

export function formatNodeLocalActionTooltip(structure: NodeLocalStructure): string {
  const unavailableReason = formatUnavailableReason(structure.actionAuthority.unavailableReason);
  if (unavailableReason && structure.actionAuthority.state !== "verified-supported") {
    return unavailableReason;
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
    return "Control pending";
  }

  if (structure.actionAuthority.state === "synthetic") {
    return "Lab preview";
  }

  return `Action unavailable: ${formatNodeLocalActionAuthorityLabel(structure)}`;
}