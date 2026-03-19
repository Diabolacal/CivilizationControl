import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { StatusDot } from '../components/StatusDot';
import { TagChip } from '../components/TagChip';
import { ActivityRow } from '../components/ActivityRow';
import { 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Power, 
  Radio, 
  DollarSign,
  Link as LinkIcon,
  MapPin,
  Settings as SettingsIcon
} from 'lucide-react';

export function GateDetail() {
  const { id } = useParams();
  const [isOnline, setIsOnline] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    accessRules: true,
    economicRules: true,
    linking: false,
    activity: false,
    spatial: false
  });
  const [showRuleComposer, setShowRuleComposer] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Mock data
  const gate = {
    id,
    name: 'Alpha Gate',
    objectId: '0x8f3a...d92c',
    extension: 'Sector Link',
    linkPartner: 'Delta Gate',
    tags: ['Primary', 'High Traffic']
  };

  const activities = [
    {
      timestamp: '14:32',
      structureName: 'Alpha Gate',
      structureId: gate.id || '1',
      eventType: 'Transit',
      icon: <Radio className="w-4 h-4" />,
      description: 'Fleet passage recorded',
      amount: '+125 Lux',
      transactionHash: '0x123...'
    },
    {
      timestamp: '14:08',
      structureName: 'Alpha Gate',
      structureId: gate.id || '1',
      eventType: 'Link',
      icon: <LinkIcon className="w-4 h-4" />,
      description: 'Linked to Delta Gate in Sector 7'
    },
    {
      timestamp: '13:22',
      structureName: 'Alpha Gate',
      structureId: gate.id || '1',
      eventType: 'Config',
      icon: <SettingsIcon className="w-4 h-4" />,
      description: 'Access rules updated'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border/50 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
              {gate.name}
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </h1>
            <StatusDot status={isOnline ? 'online' : 'offline'} />
          </div>
          <p className="text-xs text-muted-foreground font-mono bg-muted/20 inline-block px-2 py-0.5 rounded border border-border/50">{gate.objectId}</p>
        </div>
        <div className="flex items-center gap-4 bg-[#09090b] p-3 rounded border border-border/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">Command State:</span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-10 h-5 rounded peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-sm after:h-4 after:w-4 after:transition-all ${isOnline ? 'bg-green-500/80' : 'bg-destructive/80'}`}></div>
            </div>
            <span className={`text-[11px] font-semibold tracking-wide ${isOnline ? 'text-green-500' : 'text-destructive'}`}>{isOnline ? 'Online' : 'Offline'}</span>
          </label>
        </div>
      </div>

      {/* Extension and Tags */}
      <div className="flex items-center gap-3">
        {gate.extension && <TagChip label={gate.extension} variant="primary" size="sm" />}
        {gate.linkPartner && (
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground bg-muted/10 border border-border/50 px-2.5 py-1 rounded">
            <LinkIcon className="w-3 h-3 text-primary/70" />
            <span>Linked: <Link to="#" className="hover:text-primary transition-colors text-foreground">{gate.linkPartner}</Link></span>
          </div>
        )}
        <div className="flex gap-2">
          {gate.tags.map((tag) => (
            <TagChip key={tag} label={tag} size="sm" variant="default" />
          ))}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Access Rules */}
        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <button
            onClick={() => toggleSection('accessRules')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors border-b border-transparent data-[state=open]:border-border/50"
            data-state={expandedSections.accessRules ? 'open' : 'closed'}
          >
            <h2 className="text-xs font-semibold tracking-wide text-foreground">Access Policy</h2>
            {expandedSections.accessRules ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedSections.accessRules && (
            <div className="p-5 bg-background/50 border-t border-border/50 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/10 border border-border/50 rounded p-4">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">Alliance Whitelist</div>
                  <div className="text-sm font-medium text-foreground">3 active alliances</div>
                </div>
                <div className="bg-muted/10 border border-border/50 rounded p-4">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">Corp Blacklist</div>
                  <div className="text-sm font-medium text-foreground">12 restricted</div>
                </div>
                <div className="bg-muted/10 border border-border/50 rounded p-4">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">Ship Class Filter</div>
                  <div className="text-sm font-medium text-primary">Capitals Only</div>
                </div>
              </div>
              <button
                onClick={() => setShowRuleComposer(true)}
                className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors rounded text-[11px] font-medium tracking-wide"
              >
                Configure Policy
              </button>
            </div>
          )}
        </div>

        {/* Economic Rules */}
        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <button
            onClick={() => toggleSection('economicRules')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors border-b border-transparent data-[state=open]:border-border/50"
            data-state={expandedSections.economicRules ? 'open' : 'closed'}
          >
            <h2 className="text-xs font-semibold tracking-wide text-foreground">Economic Directives</h2>
            {expandedSections.economicRules ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedSections.economicRules && (
            <div className="p-5 bg-background/50 border-t border-border/50 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 border border-border/50 rounded p-4">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">Base Transit Toll</div>
                  <div className="text-xl font-mono text-foreground">50 <span className="text-sm text-muted-foreground">Lux</span></div>
                </div>
                <div className="bg-muted/10 border border-border/50 rounded p-4">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">Class Multiplier</div>
                  <div className="text-xl font-mono text-primary">2.5x <span className="text-[11px] font-sans text-muted-foreground ml-2 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Capitals</span></div>
                </div>
              </div>
              <div className="border border-border/50 bg-[#09090b] rounded overflow-hidden">
                <div className="p-3 border-b border-border/50 bg-muted/5">
                  <h3 className="text-[11px] font-semibold tracking-wide text-foreground">Yield Telemetry (24h)</h3>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 divide-x divide-border/50">
                  <div className="px-2">
                    <div className="text-[11px] font-medium text-muted-foreground mb-1">Gross Yield</div>
                    <div className="text-xl font-mono text-green-500">8,420 <span className="text-sm text-green-500/50">Lux</span></div>
                  </div>
                  <div className="px-4">
                    <div className="text-[11px] font-medium text-muted-foreground mb-1">Cleared Transits</div>
                    <div className="text-xl font-mono text-foreground">168</div>
                  </div>
                  <div className="px-4">
                    <div className="text-[11px] font-medium text-muted-foreground mb-1">Avg Yield / Transit</div>
                    <div className="text-xl font-mono text-foreground">50 <span className="text-sm text-muted-foreground">Lux</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Linking */}
        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <button
            onClick={() => toggleSection('linking')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors border-b border-transparent data-[state=open]:border-border/50"
            data-state={expandedSections.linking ? 'open' : 'closed'}
          >
            <h2 className="text-xs font-semibold tracking-wide text-foreground">Topology Link</h2>
            {expandedSections.linking ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedSections.linking && (
            <div className="p-5 bg-background/50 border-t border-border/50 space-y-5">
              <div className="bg-muted/10 border border-border/50 rounded p-4">
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                  <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground">Active Topology Connection</h3>
                  <StatusDot status="online" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Partner Node</span>
                    <Link to="/gates/8" className="hover:text-primary transition-colors text-sm font-medium text-foreground">{gate.linkPartner}</Link>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Target Vector</span>
                    <span className="text-sm text-foreground">Sector 7, Grid A4</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Jump Distance</span>
                    <span className="text-sm font-mono text-muted-foreground">42.5 LY</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2.5 bg-muted/10 text-foreground border border-border/50 hover:border-primary/50 transition-colors rounded text-[11px] font-medium">
                  Modify Link Target
                </button>
                <button className="flex-1 px-4 py-2.5 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors rounded text-[11px] font-medium">
                  Sever Connection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <button
            onClick={() => toggleSection('activity')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors border-b border-transparent data-[state=open]:border-border/50"
            data-state={expandedSections.activity ? 'open' : 'closed'}
          >
            <h2 className="text-xs font-semibold tracking-wide text-foreground">Local Telemetry</h2>
            {expandedSections.activity ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedSections.activity && (
            <div className="border-t border-border/50 bg-background/50">
              <div className="p-3 border-b border-border/50 bg-muted/5 flex justify-end">
                <select className="px-3 py-1.5 bg-[#09090b] border border-border/50 rounded text-[11px] font-medium text-muted-foreground focus:outline-none focus:border-primary/50">
                  <option>T-24 Hours</option>
                  <option>T-7 Days</option>
                  <option>T-30 Days</option>
                </select>
              </div>
              <div className="divide-y divide-border/50">
                {activities.map((activity, index) => (
                  <ActivityRow key={index} {...activity} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spatial Assignment */}
        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <button
            onClick={() => toggleSection('spatial')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors border-b border-transparent data-[state=open]:border-border/50"
            data-state={expandedSections.spatial ? 'open' : 'closed'}
          >
            <h2 className="text-xs font-semibold tracking-wide text-foreground">Spatial Assignment</h2>
            {expandedSections.spatial ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedSections.spatial && (
            <div className="p-5 bg-background/50 border-t border-border/50 space-y-5">
              <div className="bg-muted/10 border border-border/50 rounded p-4">
                <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground opacity-70" />
                  <h3 className="text-xs font-medium text-foreground">Current Anchor Point</h3>
                </div>
                <div className="text-sm space-y-2 font-mono">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] font-sans text-muted-foreground font-medium">Star System</span>
                    <span className="text-sm font-medium font-sans text-foreground">Jita</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] font-sans text-muted-foreground font-medium">Coordinates</span>
                    <span className="text-sm text-foreground">X: 1250, Y: -840, Z: 320</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/70">
                User-curated placement. Position data is cosmetic and does not affect operational mechanics.
              </p>
              <button className="px-4 py-2 bg-muted/10 text-foreground border border-border/50 hover:border-primary/50 transition-colors rounded text-[11px] font-medium">
                Reassign Anchor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rule Composer Overlay */}
      {showRuleComposer && (
        <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-border rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/5">
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted/5">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">Configure Node Policy</h2>
              <button
                onClick={() => setShowRuleComposer(false)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-background">
              <p className="text-[11px] font-mono text-muted-foreground mb-6 tracking-wide border-l-2 border-primary pl-3 py-1 bg-primary/5">
                Target Node: {gate.name} // Policy Config
              </p>
              <div className="text-center py-12 text-sm font-mono text-muted-foreground border border-dashed border-border/50 rounded bg-muted/5">
                [ Policy compiler interface offline ]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}