/**
 * StructureDetailHeader — Shared header for structure detail screens.
 *
 * Shows structure name, type glyph, status, object ID, and extension status.
 * Reused across Gate, TradePost, and individual structure detail views.
 */

import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import { StructureGlyph } from "@/components/topology/Glyphs";
import { fuelTypeLabel } from "@/lib/fuelRuntime";
import type { Structure } from "@/types/domain";

interface StructureDetailHeaderProps {
  structure: Structure;
}

const short = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`;

export function StructureDetailHeader({ structure }: StructureDetailHeaderProps) {
  return (
    <div className="flex items-start gap-4 border-b border-border/50 pb-4">
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
          <span className="text-[11px] font-mono text-muted-foreground" title={structure.objectId}>
            {short(structure.objectId)}
          </span>
          <TagChip
            label={structure.status === "online" ? "ONLINE" : structure.status === "offline" ? "OFFLINE" : "NEUTRAL"}
            variant={structure.status === "online" ? "success" : structure.status === "offline" ? "danger" : "default"}
            size="sm"
          />
          {structure.extensionStatus === "authorized" && (
            <TagChip label="EXTENSION" variant="primary" size="sm" />
          )}
          {structure.extensionStatus === "stale" && (
            <TagChip label="STALE EXTENSION" variant="warning" size="sm" />
          )}
          {structure.fuel !== undefined && (
            <TagChip
              label={`FUEL ${fuelTypeLabel(structure.fuel.typeId) ?? ""} ${structure.fuel.quantity.toLocaleString()} units`.trim()}
              variant={structure.fuel.quantity > 0 ? "default" : "warning"}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
