import { NodeDrilldownOverlayPanel } from "./NodeDrilldownOverlayPanel";

interface NodeDrilldownContextMenuProps {
  structureName: string;
  left: number;
  top: number;
  onHideStructure: () => void;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export function NodeDrilldownContextMenu({
  structureName,
  left,
  top,
  onHideStructure,
  onClose,
  menuRef,
}: NodeDrilldownContextMenuProps) {
  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${structureName} actions`}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className="pointer-events-auto absolute z-30 min-w-[172px]"
      style={{ left, top }}
    >
      <NodeDrilldownOverlayPanel className="overflow-hidden py-1">
        <button
          type="button"
          role="menuitem"
          autoFocus
          onClick={onHideStructure}
          className="w-full whitespace-nowrap px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none"
        >
          <span>Hide from Node View</span>
        </button>
      </NodeDrilldownOverlayPanel>
    </div>
  );
}