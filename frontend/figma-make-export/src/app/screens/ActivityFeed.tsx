import React, { useState } from 'react';
import { ActivityRow } from '../components/ActivityRow';
import { 
  Radio, 
  ArrowUpRight, 
  AlertTriangle, 
  Link as LinkIcon, 
  Power,
  Settings as SettingsIcon,
  Fuel
} from 'lucide-react';

export function ActivityFeed() {
  const [timeRange, setTimeRange] = useState('24h');
  const [filterType, setFilterType] = useState('all');

  const activities = [
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
      icon: <AlertTriangle className="w-4 h-4 text-primary" />,
      description: 'Fuel level warning threshold reached',
      variant: 'blocked' as const
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
      icon: <Power className="w-4 h-4 text-destructive" />,
      description: 'Gamma Gate offline.',
      variant: 'blocked' as const
    },
    {
      timestamp: '13:42',
      structureName: 'Outpost Market',
      structureId: '5',
      eventType: 'Trade',
      icon: <ArrowUpRight className="w-4 h-4" />,
      description: 'Trade settled. Weapon Systems ×2',
      amount: '+8,400 Lux',
      transactionHash: '0x789...',
      variant: 'revenue' as const
    },
    {
      timestamp: '13:30',
      structureName: 'Alpha Gate',
      structureId: '1',
      eventType: 'Transit',
      icon: <Radio className="w-4 h-4" />,
      description: 'Capital ship passage completed. +312 Lux',
      amount: '+312 Lux',
      transactionHash: '0xabc...',
      variant: 'revenue' as const
    },
    {
      timestamp: '13:22',
      structureName: 'Alpha Gate',
      structureId: '1',
      eventType: 'Config',
      icon: <SettingsIcon className="w-4 h-4" />,
      description: 'Access rules updated',
      variant: 'neutral' as const
    },
    {
      timestamp: '13:15',
      structureName: 'Beta Gate',
      structureId: '2',
      eventType: 'Fuel',
      icon: <Fuel className="w-4 h-4 text-destructive" />,
      description: 'Fuel refill completed',
      amount: '-2,000 Lux',
      transactionHash: '0xdef...',
      variant: 'blocked' as const
    },
    {
      timestamp: '13:08',
      structureName: 'Main Hub',
      structureId: '4',
      eventType: 'Trade',
      icon: <ArrowUpRight className="w-4 h-4" />,
      description: 'Trade settled. Fuel Cells ×500',
      amount: '+2,500 Lux',
      transactionHash: '0xghi...',
      variant: 'revenue' as const
    },
    {
      timestamp: '12:55',
      structureName: 'Delta Gate',
      structureId: '8',
      eventType: 'Transit',
      icon: <Radio className="w-4 h-4" />,
      description: 'Passage completed. +125 Lux',
      amount: '+125 Lux',
      transactionHash: '0xjkl...',
      variant: 'revenue' as const
    },
    {
      timestamp: '12:42',
      structureName: 'Alpha Gate',
      structureId: '1',
      eventType: 'Transit',
      icon: <Radio className="w-4 h-4" />,
      description: 'Multiple ship passage completed. +450 Lux',
      amount: '+450 Lux',
      transactionHash: '0xmno...',
      variant: 'revenue' as const
    }
  ];

  const eventTypes = ['all', 'transit', 'trade', 'status', 'link', 'config', 'fuel'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">Signal Feed</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">Governed Infrastructure // Telemetry Log</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-1.5 bg-[#09090b] border border-border rounded text-[11px] font-medium text-muted-foreground focus:outline-none"
          >
            <option value="1h">T-1 Hour</option>
            <option value="24h">T-24 Hours</option>
            <option value="7d">T-7 Days</option>
            <option value="30d">T-30 Days</option>
            <option value="all">All Time</option>
          </select>

          <div className="flex bg-[#09090b] border border-border rounded p-1">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded text-[11px] font-medium tracking-wide transition-colors ${
                  filterType === type
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(234,88,12,0.1)]'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button className="px-4 py-2 bg-muted/20 text-foreground border border-border hover:border-border/80 transition-colors rounded text-[11px] font-medium tracking-wide">
          Export Log
        </button>
      </div>

      {/* Activity List */}
      <div className="bg-[#09090b] border border-border rounded overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-300px)] divide-y divide-border/50">
          {activities.map((activity, index) => (
            <ActivityRow key={index} {...activity} />
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden">
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Total Telemetry Events</div>
          <div className="text-2xl font-mono text-foreground">{activities.length}</div>
        </div>
        <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden">
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Economic Events</div>
          <div className="text-2xl font-mono text-green-500">
            {activities.filter(a => a.amount && a.amount.startsWith('+')).length}
          </div>
        </div>
        <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden">
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Status Transitions</div>
          <div className="text-2xl font-mono text-muted-foreground">
            {activities.filter(a => a.eventType === 'Status').length}
          </div>
        </div>
        <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]">
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Gross Yield</div>
          <div className="text-2xl font-mono text-green-500">14,412 Lux</div>
        </div>
      </div>
    </div>
  );
}