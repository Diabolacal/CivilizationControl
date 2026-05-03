import { useCallback, useEffect, useRef, useState } from "react";

import { getNodeLocalPowerToggleIntent } from "@/lib/nodeDrilldownActionAuthority";

import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

const CONTEXT_MENU_MARGIN_PX = 12;
const CONTEXT_MENU_WIDTH_PX = 196;
const CONTEXT_MENU_ITEM_HEIGHT_PX = 36;
const CONTEXT_MENU_CHROME_HEIGHT_PX = 12;

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

function clampPosition(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
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
    const toggleIntent = isHidden ? null : getNodeLocalPowerToggleIntent(structure);
    const menuHeight = CONTEXT_MENU_CHROME_HEIGHT_PX + (toggleIntent ? 2 : 1) * CONTEXT_MENU_ITEM_HEIGHT_PX;

    const left = clampPosition(
      clientX,
      CONTEXT_MENU_MARGIN_PX,
      window.innerWidth - CONTEXT_MENU_WIDTH_PX - CONTEXT_MENU_MARGIN_PX,
    );
    const top = clampPosition(
      clientY,
      CONTEXT_MENU_MARGIN_PX,
      window.innerHeight - menuHeight - CONTEXT_MENU_MARGIN_PX,
    );

    setContextMenu({
      structureId: structure.id,
      canonicalDomainKey: structure.canonicalDomainKey,
      structureName: structure.displayName,
      left,
      top,
      visibilityAction: isHidden ? "unhide" : "hide",
      visibilityActionLabel: isHidden ? "Unhide" : "Hide from Node View",
      powerActionLabel: toggleIntent?.actionLabel ?? null,
      nextOnline: toggleIntent?.nextOnline ?? null,
    });
  }, []);

  return {
    contextMenu,
    menuRef,
    openStructureMenu,
    closeStructureMenu,
  };
}