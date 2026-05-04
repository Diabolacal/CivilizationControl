import { useCallback, useEffect, useRef, useState } from "react";

export interface StructureActionMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string | null;
  tone?: "default" | "online" | "offline" | "muted";
}

interface StructureActionMenuEntry extends StructureActionMenuItem {
  onSelect: () => void;
}

export interface OpenStructureActionMenuParams {
  structureId: string;
  structureName: string;
  clientX: number;
  clientY: number;
  items: StructureActionMenuEntry[];
}

export interface StructureActionMenuState {
  structureId: string;
  structureName: string;
  left: number;
  top: number;
  items: StructureActionMenuEntry[];
}

const CONTEXT_MENU_MARGIN_PX = 12;
const CONTEXT_MENU_WIDTH_PX = 196;
const CONTEXT_MENU_ITEM_HEIGHT_PX = 36;
const CONTEXT_MENU_CHROME_HEIGHT_PX = 12;

function clampPosition(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function useStructureActionMenu() {
  const [contextMenu, setContextMenu] = useState<StructureActionMenuState | null>(null);
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

  const closeStructureActionMenu = useCallback(() => setContextMenu(null), []);

  const openStructureActionMenu = useCallback((params: OpenStructureActionMenuParams) => {
    const menuHeight = CONTEXT_MENU_CHROME_HEIGHT_PX + params.items.length * CONTEXT_MENU_ITEM_HEIGHT_PX;

    const left = clampPosition(
      params.clientX,
      CONTEXT_MENU_MARGIN_PX,
      window.innerWidth - CONTEXT_MENU_WIDTH_PX - CONTEXT_MENU_MARGIN_PX,
    );
    const top = clampPosition(
      params.clientY,
      CONTEXT_MENU_MARGIN_PX,
      window.innerHeight - menuHeight - CONTEXT_MENU_MARGIN_PX,
    );

    setContextMenu({
      structureId: params.structureId,
      structureName: params.structureName,
      left,
      top,
      items: params.items,
    });
  }, []);

  return {
    contextMenu,
    menuRef,
    openStructureActionMenu,
    closeStructureActionMenu,
  };
}