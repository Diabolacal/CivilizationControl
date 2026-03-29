/**
 * StructureDetailHeader — Shared header for structure detail screens.
 *
 * Shows structure name, type glyph, status, object ID, and extension status.
 * Reused across Gate, TradePost, and individual structure detail views.
 */

import { StatusDot } from "@/components/StatusDot";
import { StructureGlyph } from "@/components/topology/Glyphs";
import { shortId } from "@/lib/formatAddress";
import type { Structure } from "@/types/domain";

interface StructureDetailHeaderProps {
  structure: Structure;
  /** Solar system name inherited from parent node's spatial pin. */
  solarSystemName?: string;
  /** Optional content rendered at the trailing edge of the header. */
  headerRight?: React.ReactNode;
}

export function StructureDetailHeader({ structure, solarSystemName, headerRight }: StructureDetailHeaderProps) {
  return (
    <div className="flex items-start gap-4 pb-4">
      <div className="text-muted-foreground mt-0.5">
        <StructureGlyph type={structure.type} size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            {structure.name}
          </h1>
          <StatusDot status={structure.status} size="md" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {solarSystemName && (
            <span className="text-[11px] text-muted-foreground/70">
              {solarSystemName}
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground/40" title={structure.objectId}>
            {shortId(structure.objectId)}
          </span>
        </div>
      </div>
      {headerRight}
    </div>
  );
}
