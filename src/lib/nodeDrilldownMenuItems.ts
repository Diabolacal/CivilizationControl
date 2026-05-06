import { getNodeLocalPowerControlState } from "@/lib/nodeDrilldownActionAuthority";

import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

export interface NodeDrilldownMenuContext {
  structureId: string;
  canonicalDomainKey: string;
  structureName: string;
  left: number;
  top: number;
  visibilityAction: "hide" | "unhide";
  visibilityActionLabel: "Hide from Node View" | "Unhide";
  powerActionLabel: "Bring Online" | "Take Offline" | null;
  nextOnline: boolean | null;
}

export interface NodeDrilldownMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string | null;
  tone?: "default" | "online" | "offline" | "muted";
  onSelect: () => void;
}

interface BuildNodeDrilldownMenuItemsOptions {
  contextMenu: NodeDrilldownMenuContext;
  structure: NodeLocalStructure | null | undefined;
  isPowerPending?: boolean;
  isRenamePending?: boolean;
  onHideStructure: (canonicalDomainKey: string) => void;
  onUnhideStructure: (canonicalDomainKey: string) => void;
  onTogglePower?: (structure: NodeLocalStructure, nextOnline: boolean) => void;
  onRenameStructure?: (structure: NodeLocalStructure) => void;
}

export function buildNodeDrilldownMenuItems({
  contextMenu,
  structure,
  isPowerPending = false,
  isRenamePending = false,
  onHideStructure,
  onUnhideStructure,
  onTogglePower,
  onRenameStructure,
}: BuildNodeDrilldownMenuItemsOptions): NodeDrilldownMenuItem[] {
  const powerControl = structure ? getNodeLocalPowerControlState(structure) : null;
  const nextOnline = powerControl?.nextOnline ?? null;
  const visibilityCanonicalDomainKey = structure?.canonicalDomainKey ?? contextMenu.canonicalDomainKey;
  const items: NodeDrilldownMenuItem[] = [
    {
      key: contextMenu.visibilityAction,
      label: contextMenu.visibilityActionLabel,
      onSelect: () => {
        if (contextMenu.visibilityAction === "unhide") {
          onUnhideStructure(visibilityCanonicalDomainKey);
          return;
        }

        onHideStructure(visibilityCanonicalDomainKey);
      },
    },
  ];

  if (structure && nextOnline != null && onTogglePower) {
    items.push({
      key: nextOnline ? "bring-online" : "take-offline",
      label: powerControl?.actionLabel ?? contextMenu.powerActionLabel ?? (nextOnline ? "Bring Online" : "Take Offline"),
      disabled: isPowerPending,
      disabledReason: isPowerPending ? "Submitting structure power action…" : null,
      tone: nextOnline ? "online" : "offline",
      onSelect: () => onTogglePower(structure, nextOnline),
    });
  }

  if (structure?.actionAuthority.verifiedTarget && onRenameStructure) {
    items.push({
      key: "rename-assembly",
      label: "Rename Assembly",
      disabled: isRenamePending,
      disabledReason: isRenamePending ? "Submitting rename…" : null,
      onSelect: () => onRenameStructure(structure),
    });
  }

  return items;
}
