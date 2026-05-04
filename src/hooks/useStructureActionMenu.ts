import { useCallback, useEffect, useRef, useState } from "react";

import {
  clampContextMenuPosition,
  estimateContextMenuHeightPx,
  estimateContextMenuWidthPx,
  getContextMenuMarginPx,
} from "@/lib/contextMenuPositioning";

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
    const margin = getContextMenuMarginPx();
    const menuHeight = estimateContextMenuHeightPx(params.items.length);
    const menuWidth = Math.min(
      estimateContextMenuWidthPx(params.items.map((item) => item.label)),
      window.innerWidth - margin * 2,
    );

    const left = clampContextMenuPosition(
      params.clientX,
      margin,
      window.innerWidth - menuWidth - margin,
    );
    const top = clampContextMenuPosition(
      params.clientY,
      margin,
      window.innerHeight - menuHeight - margin,
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