import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { ActivityRow } from '../components/ActivityRow';
import { StatusDot } from '../components/StatusDot';
import { StrategicMapPanel } from '../components/StrategicMapPanel';
import { 
  Building2, 
  DollarSign, 
  Power,
  Shield,
  Radio,
  ArrowUpRight,
  AlertTriangle,
  Link as LinkIcon,
  Fuel
} from 'lucide-react';
import { Link } from 'react-router';

export function Dashboard() {
  const alerts = [
    { id: '2', icon: <Fuel className="w-3.5 h-3.5" />, name: 'Beta Gate', issue: 'Low fuel - 2 hours remaining', time: '8m ago', severity: 'warning' as const },
    { id: '3', icon: <Power className="w-3.5 h-3.5" />, name: 'Gamma Gate', issue: 'Offline for 45 minutes', time: '45m ago', severity: 'critical' as const },
    { id: '2', icon: <AlertTriangle className="w-3.5 h-3.5" />, name: 'Beta Gate', issue: 'Unusual traffic pattern', time: '1h ago', severity: 'info' as const }
  ];

  const recentSignals = [
    {
      timestamp: '14:32',
      structureName: 'Alpha Gate',
      structureId: '1',
      eventType: 'Transit',
      icon: <Radio className="w-4 h-4" />,
      description: 'Passage completed. +125 Lux',
      amount: '+125 Lux',
      transactionHash: '0x123...',
      variant: 'revenue' as const
    },
    {
      timestamp: '14:28',
      structureName: 'Main Hub',
      structureId: '4',
      eventType: 'Trade',
      icon: <ArrowUpRight className="w-4 h-4" />,
      description: 'Trade settled. Advanced Components ×50',
      amount: '+2,500 Lux',
      transactionHash: '0x456...',
      variant: 'revenue' as const
    },
    {
      timestamp: '14:15',
      structureName: 'Beta Gate',
      structureId: '2',
      eventType: 'Status',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Fuel level warning threshold reached',
      variant: 'neutral' as const
    },
    {
      timestamp: '14:08',
      structureName: 'Alpha Gate',
      structureId: '1',
      eventType: 'Link',
      icon: <LinkIcon className="w-4 h-4" />,
      description: 'Linked to Delta Gate in Sector 7',
      variant: 'neutral' as const
    },
    {
      timestamp: '13:55',
      structureName: 'Gamma Gate',
      structureId: '3',
      eventType: 'Status',
      icon: <Power className="w-4 h-4" />,
      description: 'Gamma Gate offline.',
      variant: 'neutral' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">Command Overview</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">Governed Infrastructure // Node Status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(234,88,12,0.6)]"></span>
            System Nominal
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-5 gap-4">
        {/* Revenue Card - Reduced Visual Emphasis */}
        <div className="col-span-2">
          <div className="bg-[#09090b] border border-border rounded p-5 h-full relative overflow-hidden flex flex-col justify-between group hover:border-border/80 transition-colors">
            {/* Top row: Title and Icon */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xs font-medium text-muted-foreground">Gross Network Yield (24h)</h3>
              <DollarSign className="w-4 h-4 text-muted-foreground opacity-70 flex-shrink-0" />
            </div>
            
            {/* Content row: Metrics and Sparkline */}
            <div className="flex items-end justify-between gap-6">
              {/* Left: Content */}
              <div className="flex-1">
                <div className="text-3xl font-mono text-green-500/90 mb-1 leading-none tracking-tight">18,425 <span className="text-lg text-green-500/50">Lux</span></div>
                <p className="text-xs text-muted-foreground mb-3">≈ 1,842.5 SUI</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">↑ 12.5%</span>
                  <span className="text-[11px] text-muted-foreground">vs Prev Cycle</span>
                </div>
              </div>
              
              {/* Right: Sparkline */}
              <div className="flex items-end gap-1 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
                <div className="w-1.5 bg-green-500/50 h-5 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-7 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-3 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-9 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-6 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-8 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-4 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-10 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-7 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/50 h-11 rounded-sm"></div>
                <div className="w-1.5 bg-green-500/80 h-9 rounded-sm"></div>
                <div className="w-1.5 bg-green-500 h-12 rounded-sm shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Metrics */}
        <MetricCard
          title="Active Structures"
          value={7}
          icon={<Building2 className="w-3.5 h-3.5" />}
          subtitle="3 Gates / 2 Posts / 2 Nodes"
        />
        <MetricCard
          title="Grid Status"
          value="5/7"
          icon={<Power className="w-3.5 h-3.5" />}
          subtitle="Online / Deployed"
        />
        <MetricCard
          title="Enforced Directives"
          value={3}
          icon={<Shield className="w-3.5 h-3.5" />}
          subtitle="Active policies on 2 nodes"
        />
      </div>

      {/* Strategic Network Panel */}
      <StrategicMapPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signals - Promoted */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Recent Telemetry Signals</h2>
            <Link 
              to="/activity"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              View Log →
            </Link>
          </div>
          <div className="bg-[#09090b] border border-border rounded overflow-hidden divide-y divide-border/50">
            {recentSignals.map((activity, index) => (
              <ActivityRow key={index} {...activity} />
            ))}
          </div>
        </div>

        {/* Attention Required - Compressed */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Attention Required</h2>
          </div>
          <div className="bg-[#09090b] border border-border rounded overflow-hidden divide-y divide-border/50">
            {alerts.slice(0, 3).map((alert, index) => {
              const severityColors = {
                critical: 'text-destructive',
                warning: 'text-primary',
                info: 'text-muted-foreground'
              };

              return (
                <Link
                  key={index}
                  to={`/gates/${alert.id}`}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/10 transition-colors cursor-pointer group"
                >
                  <div className={`${severityColors[alert.severity]} mt-0.5`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate mb-0.5">
                      {alert.name}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {alert.issue}
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground flex-shrink-0">
                    {alert.time}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}