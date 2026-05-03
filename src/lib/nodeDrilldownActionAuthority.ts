import type { StructureStatus } from "@/types/domain";

import type { NodeLocalStructure } from "./nodeDrilldownTypes";

export interface NodeLocalPowerToggleIntent {
  actionLabel: "Bring Online" | "Take Offline";
  currentStatus: StructureStatus;
  nextOnline: boolean;
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

export function formatNodeLocalActionAuthorityLabel(structure: NodeLocalStructure): string {
  switch (structure.actionAuthority.state) {
    case "verified-supported":
      return "Verified for online/offline";
    case "backend-only":
      return "Backend-only";
    case "ambiguous-match":
      return `Ambiguous direct-chain match (${structure.actionAuthority.candidateTargets.length})`;
    case "unsupported-family":
      return "Unsupported family in this slice";
    case "missing-owner-cap":
      return "OwnerCap proof missing";
    case "missing-node-context":
      return "Missing node link";
    case "synthetic":
      return "Lab preview only";
  }
}

export function formatNodeLocalActionAuthorityDetail(structure: NodeLocalStructure): string {
  switch (structure.actionAuthority.state) {
    case "verified-supported":
      return `Existing ${structure.familyLabel.toLowerCase()} power control can run safely from this row.`;
    case "backend-only":
      return "Action unavailable until this row resolves to one owned direct-chain structure.";
    case "ambiguous-match":
      return `Action unavailable because ${structure.actionAuthority.candidateTargets.length} direct-chain matches were found.`;
    case "unsupported-family":
      return "Action unavailable because this family has no approved web power path in Phase E.";
    case "missing-owner-cap":
      return "Action unavailable because the required OwnerCap proof is missing.";
    case "missing-node-context":
      return "Action unavailable because the linked network node context is missing.";
    case "synthetic":
      return "Action controls in the lab are browser-only previews and never submit transactions.";
  }
}

export function formatNodeLocalActionTooltip(structure: NodeLocalStructure): string {
  if (structure.actionAuthority.state === "verified-supported") {
    const actionStatus = getNodeLocalActionStatus(structure);
    if (actionStatus === "warning" || actionStatus === "neutral") {
      return "Status is not resolved to online or offline.";
    }
  }

  return formatNodeLocalActionAuthorityLabel(structure);
}

export function formatNodeLocalActionBadgeText(structure: NodeLocalStructure): string {
  if (structure.actionAuthority.state === "verified-supported") {
    return "Action verified";
  }

  if (structure.actionAuthority.state === "synthetic") {
    return "Lab-only preview";
  }

  return `Action unavailable: ${formatNodeLocalActionAuthorityLabel(structure)}`;
}