import { NodeDrilldownOverlayPanel } from "./NodeDrilldownOverlayPanel";

export interface NodeDrilldownTooltipData {
  id: string;
  xPercent: number;
  yPercent: number;
  horizontalAlign: "left" | "center" | "right";
  verticalAlign: "above" | "below";
  title: string;
  detail: string;
  meta?: string;
}

interface NodeDrilldownTooltipProps {
  tooltip: NodeDrilldownTooltipData;
}

function tooltipTransform(tooltip: NodeDrilldownTooltipData): string {
  const translateX = tooltip.horizontalAlign === "left"
    ? "10px"
    : tooltip.horizontalAlign === "right"
      ? "calc(-100% - 10px)"
      : "-50%";
  const translateY = tooltip.verticalAlign === "above" ? "calc(-100% - 10px)" : "10px";

  return `translate(${translateX}, ${translateY})`;
}

export function NodeDrilldownTooltip({ tooltip }: NodeDrilldownTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: `${tooltip.xPercent}%`,
        top: `${tooltip.yPercent}%`,
        transform: tooltipTransform(tooltip),
      }}
    >
      <NodeDrilldownOverlayPanel className="max-w-[220px] px-3 py-2">
        <p className="text-xs font-medium text-foreground">{tooltip.title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{tooltip.detail}</p>
        {tooltip.meta ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
            {tooltip.meta}
          </p>
        ) : null}
      </NodeDrilldownOverlayPanel>
    </div>
  );
}