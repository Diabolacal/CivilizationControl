import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Radio, 
  Store, 
  Activity, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { StatusDot, StatusType } from './StatusDot';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface Structure {
  id: string;
  name: string;
  type: 'gate' | 'tradepost' | 'node';
  status: StatusType;
}

const navItems: NavItem[] = [
  { label: 'Command Overview', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Gates', path: '/gates', icon: <Radio className="w-4 h-4" /> },
  { label: 'TradePosts', path: '/tradeposts', icon: <Store className="w-4 h-4" /> },
  { label: 'Signal Feed', path: '/activity', icon: <Activity className="w-4 h-4" /> },
  { label: 'Configuration', path: '/settings', icon: <Settings className="w-4 h-4" /> }
];

const mockStructures: Structure[] = [
  { id: '1', name: 'Alpha Gate', type: 'gate', status: 'online' },
  { id: '2', name: 'Beta Gate', type: 'gate', status: 'warning' },
  { id: '3', name: 'Gamma Gate', type: 'gate', status: 'offline' },
  { id: '4', name: 'Main Hub', type: 'tradepost', status: 'online' },
  { id: '5', name: 'Outpost Market', type: 'tradepost', status: 'online' },
  { id: '6', name: 'Relay Node 1', type: 'node', status: 'online' },
  { id: '7', name: 'Relay Node 2', type: 'node', status: 'neutral' }
];

export function Sidebar() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gates: true,
    tradeposts: true,
    nodes: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const gates = mockStructures.filter(s => s.type === 'gate');
  const tradeposts = mockStructures.filter(s => s.type === 'tradepost');
  const nodes = mockStructures.filter(s => s.type === 'node');

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-sidebar border-r border-border overflow-y-auto">
      <nav className="p-4">
        {/* Primary Navigation */}
        <div className="space-y-1 mb-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border-l-2 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium border-primary'
                    : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-sidebar-border my-4"></div>

        {/* Structure Inventory */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground/70 px-3 mb-2">
            Structure Inventory
          </h3>

          {/* Gates */}
          <div>
            <button
              onClick={() => toggleSection('gates')}
              className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-sidebar-accent/50 rounded transition-colors text-sidebar-foreground group"
            >
              <span className="text-xs font-medium text-sidebar-foreground group-hover:text-primary transition-colors">Gates ({gates.length})</span>
              {expandedSections.gates ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.gates && (
              <div className="mt-1 space-y-0.5">
                {gates.map((structure) => (
                  <Link
                    key={structure.id}
                    to={`/gates/${structure.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 pl-6 hover:bg-sidebar-accent/50 rounded transition-colors"
                  >
                    <StatusDot status={structure.status} size="sm" />
                    <span className="text-sm truncate text-muted-foreground hover:text-foreground transition-colors">{structure.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* TradePosts */}
          <div>
            <button
              onClick={() => toggleSection('tradeposts')}
              className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-sidebar-accent/50 rounded transition-colors text-sidebar-foreground group"
            >
              <span className="text-xs font-medium text-sidebar-foreground group-hover:text-primary transition-colors">TradePosts ({tradeposts.length})</span>
              {expandedSections.tradeposts ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.tradeposts && (
              <div className="mt-1 space-y-0.5">
                {tradeposts.map((structure) => (
                  <Link
                    key={structure.id}
                    to={`/tradeposts/${structure.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 pl-6 hover:bg-sidebar-accent/50 rounded transition-colors"
                  >
                    <StatusDot status={structure.status} size="sm" />
                    <span className="text-sm truncate text-muted-foreground hover:text-foreground transition-colors">{structure.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Network Nodes */}
          <div>
            <button
              onClick={() => toggleSection('nodes')}
              className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-sidebar-accent/50 rounded transition-colors text-sidebar-foreground group"
            >
              <span className="text-xs font-medium text-sidebar-foreground group-hover:text-primary transition-colors">Network Nodes ({nodes.length})</span>
              {expandedSections.nodes ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.nodes && (
              <div className="mt-1 space-y-0.5">
                {nodes.map((structure) => (
                  <Link
                    key={structure.id}
                    to={`/nodes/${structure.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 pl-6 hover:bg-sidebar-accent/50 rounded transition-colors"
                  >
                    <StatusDot status={structure.status} size="sm" />
                    <span className="text-sm truncate text-muted-foreground hover:text-foreground transition-colors">{structure.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}