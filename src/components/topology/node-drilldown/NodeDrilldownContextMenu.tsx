import { NodeDrilldownOverlayPanel } from "./NodeDrilldownOverlayPanel";

interface NodeDrilldownContextMenuProps {
  structureName: string;
  left: number;
  top: number;
  onVisibilityAction: () => void;
  visibilityActionLabel: string;
  onPowerAction?: () => void;
  powerActionLabel?: string;
  powerActionDisabled?: boolean;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export function NodeDrilldownContextMenu({
  structureName,
  left,
  top,
  onVisibilityAction,
  visibilityActionLabel,
  onPowerAction,
  powerActionLabel,
  powerActionDisabled = false,
  onClose,
  menuRef,
}: NodeDrilldownContextMenuProps) {
  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${structureName} actions`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className="pointer-events-auto fixed z-40 min-w-[172px]"
      style={{ left, top }}
    >
      <NodeDrilldownOverlayPanel className="overflow-hidden py-1">
        <button
          type="button"
          role="menuitem"
          autoFocus
          onClick={onVisibilityAction}
          className="w-full whitespace-nowrap px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none"
        >
          <span>{visibilityActionLabel}</span>
        </button>

        {onPowerAction && powerActionLabel ? (
          <button
            type="button"
            role="menuitem"
            disabled={powerActionDisabled}
            onClick={onPowerAction}
            className="w-full whitespace-nowrap px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{powerActionLabel}</span>
          </button>
        ) : null}
      </NodeDrilldownOverlayPanel>
    </div>
  );
}