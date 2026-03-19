import React, { useState } from 'react';
import { Link } from 'react-router';
import { StatusDot, StatusType } from '../components/StatusDot';
import { TagChip } from '../components/TagChip';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  objectId: string;
  status: StatusType;
  linkPartner: string | null;
  extension: string | null;
  rules: string[];
  fuelLevel: number;
  revenue24h: number;
  tags: string[];
}

const mockGates: Gate[] = [
  {
    id: '1',
    name: 'Alpha Gate',
    objectId: '0x8f3a...d92c',
    status: 'online',
    linkPartner: 'Delta Gate',
    extension: 'Sector Link',
    rules: ['Access Control', 'Toll'],
    fuelLevel: 85,
    revenue24h: 8420,
    tags: ['Primary', 'High Traffic']
  },
  {
    id: '2',
    name: 'Beta Gate',
    objectId: '0x2c1b...4f8e',
    status: 'warning',
    linkPartner: 'Echo Gate',
    extension: 'Jump Network',
    rules: ['Access Control', 'Toll', 'Restrictions'],
    fuelLevel: 15,
    revenue24h: 3200,
    tags: ['Secondary']
  },
  {
    id: '3',
    name: 'Gamma Gate',
    objectId: '0x7d9e...a3b1',
    status: 'offline',
    linkPartner: null,
    extension: null,
    rules: ['Access Control'],
    fuelLevel: 0,
    revenue24h: 0,
    tags: ['Under Construction']
  },
  {
    id: '8',
    name: 'Delta Gate',
    objectId: '0x4b2f...c7d8',
    status: 'online',
    linkPartner: 'Alpha Gate',
    extension: 'Sector Link',
    rules: ['Access Control', 'Toll'],
    fuelLevel: 92,
    revenue24h: 6805,
    tags: ['Remote']
  }
];

export function GateList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('offline-first');

  const filterOptions = ['Online', 'Offline', 'Linked', 'Unlinked', 'Has Extension'];

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">Gates</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">Governed Infrastructure // Node Inventory</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search gates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#09090b] border border-border rounded focus:outline-none focus:border-primary/50 text-sm font-mono"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border hover:border-border/80 transition-colors rounded text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Filter</span>
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-muted/30 border border-border hover:border-border/80 transition-colors rounded cursor-pointer focus:outline-none text-sm font-medium tracking-wide text-muted-foreground"
            >
              <option value="offline-first">Offline First</option>
              <option value="name">Name</option>
              <option value="revenue">Revenue</option>
              <option value="fuel">Fuel Level</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`px-3 py-1 rounded text-[11px] font-medium tracking-wide transition-colors border ${
                selectedFilters.includes(filter)
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted/20 text-muted-foreground border-transparent hover:border-border/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Gates Table */}
      <div className="bg-[#09090b] border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Status</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Name</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Object ID</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Link Partner</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Extension</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Rules</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Fuel</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Revenue (24h)</th>
                <th className="text-left py-2 px-4 font-semibold text-muted-foreground tracking-wide text-[11px]">Tags</th>
              </tr>
            </thead>
            <tbody>
              {mockGates.map((gate) => (
                <tr
                  key={gate.id}
                  className="border-b border-border/50 last:border-b-0 hover:bg-muted/10 transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <StatusDot status={gate.status} />
                  </td>
                  <td className="py-2.5 px-4">
                    <Link 
                      to={`/gates/${gate.id}`}
                      className="hover:text-primary transition-colors text-foreground font-medium"
                    >
                      {gate.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-[11px] text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded border border-border/50">{gate.objectId}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-sm">
                      {gate.linkPartner || <span className="text-muted-foreground">—</span>}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    {gate.extension ? (
                      <TagChip label={gate.extension} variant="primary" size="sm" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {gate.rules.map((rule) => (
                        <TagChip key={rule} label={rule} size="sm" variant="default" />
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-muted rounded-none overflow-hidden border border-border/50">
                        <div
                          className={`h-full ${
                            gate.fuelLevel > 50 ? 'bg-muted-foreground' : gate.fuelLevel > 20 ? 'bg-primary' : 'bg-destructive'
                          }`}
                          style={{ width: `${gate.fuelLevel}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground w-8 text-right">{gate.fuelLevel}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-sm text-green-500/90">
                      {gate.revenue24h > 0 ? `+${gate.revenue24h.toLocaleString()}` : '0'} Lux
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {gate.tags.map((tag) => (
                        <TagChip key={tag} label={tag} size="sm" variant="default" />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}