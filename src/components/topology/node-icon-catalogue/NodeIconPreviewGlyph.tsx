import {
  GateGlyph,
  NetworkNodeGlyph,
  TradePostGlyph,
  TurretGlyph,
} from "@/components/topology/Glyphs";
import { cn } from "@/lib/utils";

import {
  AssemblerGlyph,
  BerthGlyph,
  HangarGlyph,
  NestGlyph,
  NurseryGlyph,
  PrinterGlyph,
  RefineryGlyph,
  RelayGlyph,
} from "./NodeCatalogueGlyphs";
import type { NodeIconBadge, NodeIconFamily, NodeIconTone } from "./nodeIconCatalogueData";

interface NodeIconPreviewGlyphProps {
  family: NodeIconFamily;
  badge?: NodeIconBadge;
  tone?: NodeIconTone;
  selected?: boolean;
  warningPip?: boolean;
  size?: number;
  className?: string;
}

const toneColors: Record<NodeIconTone, string> = {
  neutral: "var(--topo-glyph-neutral)",
  online: "var(--topo-state-online)",
  offline: "var(--topo-state-offline)",
  warning: "var(--topo-state-warning)",
};

function familyGlyph(family: NodeIconFamily) {
  switch (family) {
    case "networkNode":
      return NetworkNodeGlyph;
    case "gate":
      return GateGlyph;
    case "tradePost":
      return TradePostGlyph;
    case "turret":
      return TurretGlyph;
    case "printer":
      return PrinterGlyph;
    case "refinery":
      return RefineryGlyph;
    case "assembler":
      return AssemblerGlyph;
    case "berth":
      return BerthGlyph;
    case "relay":
      return RelayGlyph;
    case "nursery":
      return NurseryGlyph;
    case "hangar":
      return HangarGlyph;
    case "nest":
      return NestGlyph;
  }
}

function NodeIconBadgeChip({
  value,
  size,
}: {
  value: Exclude<NodeIconBadge, null>;
  size: number;
}) {
  const isCompact = size <= 24;
  const badgeSize = isCompact ? 13 : 15;
  const fontSize = isCompact ? 8 : 9;

  return (
    <span
      className="absolute right-0 top-0 z-[3] inline-flex items-center justify-center rounded border bg-[var(--topo-background)] leading-none"
      style={{
        minWidth: badgeSize,
        height: badgeSize,
        paddingInline: isCompact ? 2 : 3,
        fontSize,
        fontWeight: 600,
        borderColor: "color-mix(in srgb, currentColor 48%, transparent)",
        color: "color-mix(in srgb, currentColor 72%, var(--topo-background) 28%)",
      }}
    >
      {value}
    </span>
  );
}

export function NodeIconPreviewGlyph({
  family,
  badge = null,
  tone = "neutral",
  selected = false,
  warningPip = false,
  size = 24,
  className,
}: NodeIconPreviewGlyphProps) {
  const Glyph = familyGlyph(family);
  const frameSize = size + (size <= 24 ? 14 : 16);
  const warningPipSize = size <= 24 ? 8 : 9;
  const warningPipOffset = size <= 24 ? 1 : 0;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: frameSize, height: frameSize }}
    >
      {selected ? (
        <span
          className="absolute z-0 rounded-full border"
          style={{
            width: size + 10,
            height: size + 10,
            borderColor: "var(--topo-selected)",
            opacity: 0.85,
          }}
        />
      ) : null}
      <div className="relative z-[1] flex items-center justify-center" style={{ color: toneColors[tone] }}>
        <Glyph size={size} />
      </div>
      {warningPip ? (
        <span
          className="absolute z-[2] rounded-full bg-[var(--topo-state-warning)] ring-[1.5px] ring-[var(--topo-background)]"
          style={{
            width: warningPipSize,
            height: warningPipSize,
            left: warningPipOffset,
            top: warningPipOffset,
          }}
        />
      ) : null}
      {badge ? <NodeIconBadgeChip value={badge} size={size} /> : null}
    </div>
  );
}