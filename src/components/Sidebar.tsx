/**
 * Sidebar — Fixed left navigation.
 *
 * Primary nav follows Figma layout: Command Overview, Gates, TradePosts, Signal Feed, Configuration.
 * Structure Inventory section shows actual discovered structures grouped by type.
 * Uses project topology glyphs instead of lucide-react placeholders.
 */

import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, ChevronRight, Activity, Settings } from "lucide-react";
import { StatusDot, type StatusType } from "@/components/StatusDot";
import { getSpatialPin } from "@/lib/spatialPins";
import {
  NetworkNodeGlyph,
  GateGlyph,
  TradePostGlyph,
  TurretGlyph,
} from "@/components/topology/Glyphs";
import type { Structure } from "@/types/domain";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Command Overview",
    path: "/",
    icon: <NetworkNodeGlyph className="w-4 h-4" size={16} />,
  },
  {
    label: "Gates",
    path: "/gates",
    icon: <GateGlyph className="w-4 h-4" size={16} />,
  },
  {
    label: "TradePosts",
    path: "/tradeposts",
    icon: <TradePostGlyph className="w-4 h-4" size={16} />,
  },
  {
    label: "Turrets",
    path: "/turrets",
    icon: <TurretGlyph className="w-4 h-4" size={16} />,
  },
  {
    label: "Network Nodes",
    path: "/nodes",
    icon: <NetworkNodeGlyph className="w-4 h-4" size={16} />,
  },
  {
    label: "Signal Feed",
    path: "/activity",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    label: "Configuration",
    path: "/settings",
    icon: <Settings className="w-4 h-4" />,
  },
];

interface SidebarProps {
  structures?: Structure[];
  isConnected?: boolean;
  isLoading?: boolean;
}

function structureStatus(s: Structure): StatusType {
  return s.status;
}

function structurePath(s: Structure): string {
  switch (s.type) {
    case "gate":
      return `/gates/${s.objectId}`;
    case "storage_unit":
      return `/tradeposts/${s.objectId}`;
    case "turret":
      return `/turrets/${s.objectId}`;
    case "network_node":
      return `/nodes/${s.objectId}`;
    default:
      return `/`;
  }
}

export function Sidebar({ structures = [], isConnected = false, isLoading = false }: SidebarProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    gates: false,
    tradeposts: false,
    turrets: false,
    nodes: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const gates = structures.filter((s) => s.type === "gate");
  const tradeposts = structures.filter((s) => s.type === "storage_unit");
  const turrets = structures.filter((s) => s.type === "turret");
  const nodes = structures.filter((s) => s.type === "network_node");

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 overflow-y-auto border-r border-border bg-[var(--sidebar)]">
      <nav className="p-4 pb-32">
        {/* Primary navigation */}
        <div className="space-y-1 mb-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border-l-2 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-primary"
                    : "border-transparent text-muted-foreground hover:bg-[var(--sidebar-accent)]/50 hover:text-[var(--sidebar-foreground)]"
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-[var(--sidebar-border)] my-4" />

        {/* Structure Inventory */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground/70 px-3 mb-2">
            Structure Inventory
          </h3>

          {!isConnected && (
            <p className="px-3 text-[11px] text-muted-foreground/40">
              Connect wallet to discover structures
            </p>
          )}

          {isConnected && isLoading && structures.length === 0 && (
            <p className="px-3 text-[11px] text-muted-foreground/40 animate-pulse">
              Resolving chain state…
            </p>
          )}

          {isConnected && !isLoading && structures.length === 0 && (
            <p className="px-3 text-[11px] text-muted-foreground/40">
              No structures discovered
            </p>
          )}

          {structures.length > 0 && (
            <>
          <StructureSection
            label="Gates"
            icon={<GateGlyph size={12} />}
            items={gates}
            expanded={expandedSections.gates}
            onToggle={() => toggleSection("gates")}
          />

          <StructureSection
            label="TradePosts"
            icon={<TradePostGlyph size={12} />}
            items={tradeposts}
            expanded={expandedSections.tradeposts}
            onToggle={() => toggleSection("tradeposts")}
          />

          <StructureSection
            label="Turrets"
            icon={<TurretGlyph size={12} />}
            items={turrets}
            expanded={expandedSections.turrets}
            onToggle={() => toggleSection("turrets")}
          />

          <StructureSection
            label="Network Nodes"
            icon={<NetworkNodeGlyph size={12} />}
            items={nodes}
            expanded={expandedSections.nodes}
            onToggle={() => toggleSection("nodes")}
          />
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}

function StructureSection({
  label,
  icon,
  items,
  expanded,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  items: Structure[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-[var(--sidebar-accent)]/50 rounded transition-colors text-muted-foreground group"
      >
        <span className="flex items-center gap-2 text-xs font-medium group-hover:text-primary transition-colors">
          {icon}
          {label} ({items.length})
        </span>
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
      {expanded && (
        <div className="mt-1 space-y-0.5">
          {items.map((structure) => {
            const locationId = structure.type === "network_node"
              ? structure.objectId
              : structure.networkNodeId;
            const pin = locationId ? getSpatialPin(locationId) : undefined;
            return (
              <Link
                key={structure.objectId}
                to={structurePath(structure)}
                className="flex items-center gap-2 px-3 py-1.5 pl-6 hover:bg-[var(--sidebar-accent)]/50 rounded transition-colors"
              >
                <StatusDot status={structureStatus(structure)} size="sm" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate text-muted-foreground hover:text-foreground transition-colors">
                    {(() => {
                      const m = structure.name.match(/^(.+?)\s+([0-9a-f]{8})$/);
                      if (!m) return structure.name;
                      return <>{m[1]} <span className="text-muted-foreground/40 font-mono text-[10px]">{m[2]}</span></>;
                    })()}
                  </span>
                  {pin && (
                    <span className="text-[10px] truncate text-muted-foreground/50">
                      {pin.solarSystemName}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {items.length === 0 && (
            <p className="px-6 py-1.5 text-[11px] text-muted-foreground/50">
              None discovered
            </p>
          )}
        </div>
      )}
    </div>
  );
}
