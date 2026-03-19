/**
 * NodeLocationPanel — Onboarding panel for assigning solar systems to network nodes.
 *
 * This is the primary location model:
 *   - User assigns a solar system to each network node
 *   - Co-located structures inherit that location
 *   - No on-chain location reveal required
 */

import { SolarSystemPicker } from "@/components/SolarSystemPicker";
import { NetworkNodeGlyph } from "@/components/topology/Glyphs";
import { StatusDot } from "@/components/StatusDot";
import { TagChip } from "@/components/TagChip";
import type {
  NetworkNodeGroup,
  SpatialPin,
  ObjectId,
  SolarSystem,
} from "@/types/domain";

interface NodeLocationPanelProps {
  nodeGroups: NetworkNodeGroup[];
  pins: SpatialPin[];
  onAssignPin: (
    nodeId: ObjectId,
    systemId: number,
    systemName: string,
  ) => void;
  onRemovePin: (nodeId: ObjectId) => void;
}

export function NodeLocationPanel({
  nodeGroups,
  pins,
  onAssignPin,
  onRemovePin,
}: NodeLocationPanelProps) {
  const pinMap = new Map(pins.map((p) => [p.networkNodeId, p]));

  // Only show real network nodes (not the synthetic "unassigned" group)
  const realNodes = nodeGroups.filter(
    (g) => g.node.objectId !== "unassigned",
  );

  if (realNodes.length === 0) return null;

  return (
    <div className="bg-[var(--card)] border border-border rounded">
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-xs font-semibold tracking-wide text-foreground mb-0.5">
          Spatial Assignment
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Assign solar systems to network nodes. Co-located structures inherit
          position.
        </p>
      </div>

      <div className="divide-y divide-border/50">
        {realNodes.map((group) => {
          const pin = pinMap.get(group.node.objectId);
          const childCount =
            group.gates.length +
            group.storageUnits.length +
            group.turrets.length;

          return (
            <div
              key={group.node.objectId}
              className="px-5 py-4 flex items-start gap-4"
            >
              {/* Node identity */}
              <div className="flex items-center gap-2 w-48 flex-shrink-0">
                <NetworkNodeGlyph
                  size={20}
                  className="text-muted-foreground"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusDot status={group.node.status} size="sm" />
                    <span className="text-sm font-medium text-foreground">
                      {group.node.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {childCount} structure{childCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Solar system assignment */}
              <div className="flex-1">
                {pin ? (
                  <div className="flex items-center gap-3">
                    <TagChip label={pin.solarSystemName} variant="primary" />
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ID: {pin.solarSystemId}
                    </span>
                    <button
                      onClick={() => onRemovePin(group.node.objectId)}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <SolarSystemPicker
                    placeholder={`Assign solar system to ${group.node.name}...`}
                    onSelect={(system: SolarSystem) =>
                      onAssignPin(
                        group.node.objectId,
                        system.solarSystemId,
                        system.solarSystemName,
                      )
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
