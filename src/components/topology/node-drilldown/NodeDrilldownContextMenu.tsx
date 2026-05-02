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
      className="pointer-events-auto absolute z-30 min-w-[196px]"
      style={{ left, top }}
    >
      <NodeDrilldownOverlayPanel className="overflow-hidden">
        <div className="border-b border-border/40 px-3 py-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
            Structure Actions
          </p>
          <p className="mt-1 truncate text-sm text-foreground">{structureName}</p>
        </div>

        <button
          type="button"
          role="menuitem"
          autoFocus
          onClick={onHideStructure}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none"
        >
          <span>Hide from Node View</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
            Local
          </span>
        </button>
      </NodeDrilldownOverlayPanel>
    </div>
  );
}