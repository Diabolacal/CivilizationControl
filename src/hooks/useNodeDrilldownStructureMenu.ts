import { useCallback, useEffect, useRef, useState } from "react";

import {
  clampContextMenuPosition,
  estimateContextMenuHeightPx,
  estimateContextMenuWidthPx,
  getContextMenuMarginPx,
} from "@/lib/contextMenuPositioning";
import { getNodeLocalPowerControlState, supportsNodeLocalRename } from "@/lib/nodeDrilldownActionAuthority";

import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

export interface OpenNodeDrilldownStructureMenuParams {
  structure: NodeLocalStructure;
  clientX: number;
  clientY: number;
  isHidden: boolean;
}

export interface NodeDrilldownStructureMenuState {
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

export function useNodeDrilldownStructureMenu() {
  const [contextMenu, setContextMenu] = useState<NodeDrilldownStructureMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }

      setContextMenu(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [contextMenu]);

  const closeStructureMenu = useCallback(() => setContextMenu(null), []);

  const openStructureMenu = useCallback(({ structure, clientX, clientY, isHidden }: OpenNodeDrilldownStructureMenuParams) => {
    const margin = getContextMenuMarginPx();
    const powerControl = getNodeLocalPowerControlState(structure);
    const canRename = supportsNodeLocalRename(structure);
    const menuLabels = [
      isHidden ? "Unhide" : "Hide from Node View",
      ...(powerControl.actionLabel ? [powerControl.actionLabel] : []),
      ...(canRename ? ["Rename Assembly"] : []),
    ];
    const menuHeight = estimateContextMenuHeightPx(menuLabels.length);
    const menuWidth = Math.min(
      estimateContextMenuWidthPx(menuLabels),
      window.innerWidth - margin * 2,
    );

    const left = clampContextMenuPosition(
      clientX,
      margin,
      window.innerWidth - menuWidth - margin,
    );
    const top = clampContextMenuPosition(
      clientY,
      margin,
      window.innerHeight - menuHeight - margin,
    );

    setContextMenu({
      structureId: structure.id,
      canonicalDomainKey: structure.canonicalDomainKey,
      structureName: structure.displayName,
      left,
      top,
      visibilityAction: isHidden ? "unhide" : "hide",
      visibilityActionLabel: isHidden ? "Unhide" : "Hide from Node View",
      powerActionLabel: powerControl.actionLabel,
      nextOnline: powerControl.nextOnline,
    });
  }, []);

  return {
    contextMenu,
    menuRef,
    openStructureMenu,
    closeStructureMenu,
  };
}