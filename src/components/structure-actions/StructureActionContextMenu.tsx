import { useLayoutEffect, useMemo, useState, type RefObject } from "react";

import { NodeDrilldownOverlayPanel } from "@/components/topology/node-drilldown/NodeDrilldownOverlayPanel";
import type { StructureActionMenuItem, StructureActionMenuState } from "@/hooks/useStructureActionMenu";
import { clampContextMenuPosition, getContextMenuMarginPx } from "@/lib/contextMenuPositioning";

type StructureActionContextMenuItem = StructureActionMenuItem & {
  onSelect: () => void;
};

interface StructureActionContextMenuProps {
  menu: Pick<StructureActionMenuState, "structureName" | "left" | "top" | "items">;
  menuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

function itemToneClass(item: StructureActionContextMenuItem): string {
  if (item.disabled) {
    return "text-muted-foreground/55";
  }

  switch (item.tone) {
    case "online":
      return "text-[var(--topo-state-online)]";
    case "offline":
      return "text-[var(--topo-state-offline)]";
    case "muted":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

export function StructureActionContextMenu({ menu, menuRef, onClose }: StructureActionContextMenuProps) {
  const menuSignature = useMemo(
    () => `${menu.left}:${menu.top}:${menu.structureName}:${menu.items.map((item) => item.label).join("|")}`,
    [menu.items, menu.left, menu.structureName, menu.top],
  );
  const [measuredPosition, setMeasuredPosition] = useState({ left: menu.left, top: menu.top });

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!element) {
      setMeasuredPosition({ left: menu.left, top: menu.top });
      return;
    }

    const margin = getContextMenuMarginPx();
    const bounds = element.getBoundingClientRect();
    const nextPosition = {
      left: clampContextMenuPosition(menu.left, margin, window.innerWidth - bounds.width - margin),
      top: clampContextMenuPosition(menu.top, margin, window.innerHeight - bounds.height - margin),
    };

    setMeasuredPosition((current) => (
      current.left === nextPosition.left && current.top === nextPosition.top ? current : nextPosition
    ));
  }, [menu.left, menu.top, menuSignature, menuRef]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${menu.structureName} actions`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className="pointer-events-auto fixed z-40"
      style={{ left: measuredPosition.left, top: measuredPosition.top }}
    >
      <NodeDrilldownOverlayPanel className="grid w-max max-w-[calc(100vw-24px)] overflow-hidden py-1">
        {menu.items.map((item, index) => {
          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              autoFocus={index === 0}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) {
                  return;
                }

                onClose();
                item.onSelect();
              }}
              className={`whitespace-nowrap px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${itemToneClass(item)}`}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </NodeDrilldownOverlayPanel>
    </div>
  );
}