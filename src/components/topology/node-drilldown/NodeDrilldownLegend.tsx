import { NodeIconPreviewGlyph } from "@/components/topology/node-icon-catalogue/NodeIconPreviewGlyph";

import { NodeDrilldownOverlayPanel } from "./NodeDrilldownOverlayPanel";

const LEGEND_ITEMS = [
  { family: "networkNode", label: "Network Node" },
  { family: "gate", label: "Gate" },
  { family: "tradePost", label: "Storage / Trade Post" },
  { family: "turret", label: "Turret" },
  { family: "printer", label: "Printer" },
  { family: "refinery", label: "Refinery" },
  { family: "assembler", label: "Assembler" },
  { family: "berth", label: "Berth" },
  { family: "relay", label: "Relay" },
  { family: "nursery", label: "Nursery" },
  { family: "hangar", label: "Shelter" },
  { family: "nest", label: "Nest" },
] as const;

export function NodeDrilldownLegend() {
  return (
    <NodeDrilldownOverlayPanel className="w-[248px] max-w-[calc(100vw-2rem)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Node Key
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
          M/H = size
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <NodeIconPreviewGlyph family={item.family} tone="neutral" size={18} />
            <span className="leading-tight text-foreground/88">{item.label}</span>
          </div>
        ))}
      </div>
    </NodeDrilldownOverlayPanel>
  );
}