import { NodeDrilldownOverlayPanel } from "@/components/topology/node-drilldown/NodeDrilldownOverlayPanel";
import type { StructureActionMenuItem, StructureActionMenuState } from "@/hooks/useStructureActionMenu";

type StructureActionContextMenuItem = StructureActionMenuItem & {
  onSelect: () => void;
};

interface StructureActionContextMenuProps {
  menu: Pick<StructureActionMenuState, "structureName" | "left" | "top" | "items">;
  menuRef: React.RefObject<HTMLDivElement | null>;
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
      className="pointer-events-auto fixed z-40 w-max max-w-[calc(100vw-24px)]"
      style={{ left: menu.left, top: menu.top }}
    >
      <NodeDrilldownOverlayPanel className="overflow-hidden py-1">
        {menu.items.map((item, index) => {
          const title = item.disabled
            ? item.disabledReason ?? item.label
            : item.disabledReason ?? item.label;

          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              autoFocus={index === 0}
              disabled={item.disabled}
              title={title}
              onClick={() => {
                if (item.disabled) {
                  return;
                }

                onClose();
                item.onSelect();
              }}
              className={`w-full whitespace-nowrap px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${itemToneClass(item)}`}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </NodeDrilldownOverlayPanel>
    </div>
  );
}