import React, { useState } from 'react';
import { useParams } from 'react-router';
import { StatusDot } from '../components/StatusDot';
import { TagChip } from '../components/TagChip';
import { EmptyState } from '../components/EmptyState';
import { Edit2, Trash2, ExternalLink, Package } from 'lucide-react';

type Tab = 'inventory' | 'listings' | 'history' | 'revenue';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
}

interface Listing {
  id: string;
  item: string;
  price: number;
  quantity: number;
  status: 'active' | 'pending' | 'sold';
}

interface TradeHistoryEntry {
  id: string;
  timestamp: string;
  item: string;
  price: number;
  buyer: string;
  txHash: string;
}

export function TradePostDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  // Mock data
  const tradepost = {
    id,
    name: 'Main Hub',
    status: 'online' as const
  };

  const inventory: InventoryItem[] = [
    { id: '1', name: 'Advanced Components', quantity: 450, category: 'Materials' },
    { id: '2', name: 'Fuel Cells', quantity: 1200, category: 'Consumables' },
    { id: '3', name: 'Shield Modules', quantity: 85, category: 'Equipment' },
    { id: '4', name: 'Weapon Systems', quantity: 34, category: 'Equipment' }
  ];

  const listings: Listing[] = [
    { id: '1', item: 'Advanced Components', price: 50, quantity: 50, status: 'active' },
    { id: '2', item: 'Shield Modules', price: 1250, quantity: 10, status: 'active' },
    { id: '3', item: 'Fuel Cells', price: 5, quantity: 100, status: 'pending' }
  ];

  const history: TradeHistoryEntry[] = [
    {
      id: '1',
      timestamp: '2026-02-17 14:28',
      item: 'Advanced Components x50',
      price: 2500,
      buyer: '0x742d...4a9f',
      txHash: '0xabc...'
    },
    {
      id: '2',
      timestamp: '2026-02-17 12:15',
      item: 'Weapon Systems x2',
      price: 8400,
      buyer: '0x8f3a...d92c',
      txHash: '0xdef...'
    },
    {
      id: '3',
      timestamp: '2026-02-17 09:42',
      item: 'Fuel Cells x500',
      price: 2500,
      buyer: '0x2c1b...4f8e',
      txHash: '0xghi...'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              {tradepost.name}
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </h1>
            <StatusDot status={tradepost.status} />
          </div>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">Governed Infrastructure // Trade Node Operations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50">
        <div className="flex gap-6">
          {(['inventory', 'listings', 'history', 'revenue'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[11px] font-semibold tracking-wide transition-colors relative ${
                activeTab === tab
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(234,88,12,0.5)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-medium text-muted-foreground">
                {inventory.length} items in inventory
              </p>
              <button className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors rounded text-[11px] font-medium tracking-wide">
                Create Listing
              </button>
            </div>
            <div className="bg-[#09090b] border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/5">
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Item</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Category</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Quantity</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 last:border-b-0 hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{item.name}</td>
                      <td className="py-3 px-4">
                        <TagChip label={item.category} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{item.quantity.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <button className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors">
                          List Item →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-4">
            <p className="text-[11px] font-medium text-muted-foreground">
              {listings.length} active listings
            </p>
            <div className="grid grid-cols-3 gap-4">
              {listings.map((listing) => {
                const statusVariants = {
                  active: 'success' as const,
                  pending: 'warning' as const,
                  sold: 'default' as const
                };

                return (
                  <div key={listing.id} className="bg-[#09090b] border border-border rounded p-4 relative overflow-hidden group hover:border-border/80 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-bold text-foreground">{listing.item}</h3>
                      <TagChip 
                        label={listing.status.toUpperCase()} 
                        variant={statusVariants[listing.status]} 
                        size="sm" 
                      />
                    </div>
                    <div className="space-y-3 mb-5 border-t border-border/50 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-muted-foreground">Unit Price</span>
                        <span className="font-mono text-green-500 text-sm">{listing.price} Lux</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-muted-foreground">Listed Volume</span>
                        <span className="font-mono text-foreground text-sm">{listing.quantity} Units</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-muted-foreground">Projected Value</span>
                        <span className="font-mono text-muted-foreground text-sm">{(listing.price * listing.quantity).toLocaleString()} Lux</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-muted/10 hover:bg-muted/20 border border-border/50 transition-colors rounded text-[11px] font-medium flex items-center justify-center gap-1.5 text-foreground">
                        <Edit2 className="w-3 h-3" />
                        Amend
                      </button>
                      <button className="flex-1 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 transition-colors rounded text-[11px] font-medium flex items-center justify-center gap-1.5 border border-destructive/30 text-destructive">
                        <Trash2 className="w-3 h-3" />
                        Delist
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <p className="text-[11px] font-medium text-muted-foreground">
              Recent trade history
            </p>
            <div className="bg-[#09090b] border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/5">
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Timestamp</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Contract</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Settlement</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Counterparty</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground text-[11px] tracking-wide">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/50 last:border-b-0 hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3 px-4 text-[11px] font-mono text-muted-foreground">{entry.timestamp}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{entry.item}</td>
                      <td className="py-3 px-4 font-mono text-green-500">
                        {entry.price.toLocaleString()} Lux
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{entry.buyer}</td>
                      <td className="py-3 px-4">
                        <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[11px] font-medium">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <select className="px-4 py-2 bg-[#09090b] border border-border rounded text-[11px] font-medium text-muted-foreground focus:outline-none">
                <option>T-24 Hours</option>
                <option>T-7 Days</option>
                <option>T-30 Days</option>
                <option>All Time</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden">
                <h3 className="text-[11px] font-medium text-muted-foreground mb-2">Gross Trading Yield</h3>
                <div className="text-3xl font-mono text-green-500 mb-1">13,400 <span className="text-lg text-green-500/50">Lux</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">↑ 18.2%</span>
                  <span className="text-[11px] text-muted-foreground">vs Prev Cycle</span>
                </div>
              </div>
              <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden">
                <h3 className="text-[11px] font-medium text-muted-foreground mb-2">Settled Contracts</h3>
                <div className="text-3xl font-mono text-foreground mb-1">247</div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">↑ 12.5%</span>
                  <span className="text-[11px] text-muted-foreground">vs Prev Cycle</span>
                </div>
              </div>
              <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden">
                <h3 className="text-[11px] font-medium text-muted-foreground mb-2">Average Contract Value</h3>
                <div className="text-3xl font-mono text-foreground mb-1">54 <span className="text-lg text-muted-foreground">Lux</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">↑ 5.1%</span>
                  <span className="text-[11px] text-muted-foreground">vs Prev Cycle</span>
                </div>
              </div>
            </div>

            <div className="bg-[#09090b] border border-border rounded overflow-hidden">
              <div className="p-4 border-b border-border/50 bg-muted/5">
                <h3 className="text-[11px] font-semibold tracking-wide text-foreground">Highest Yield Categories</h3>
              </div>
              <div className="p-0 divide-y divide-border/50">
                {[
                  { name: 'Advanced Components', sales: 85, revenue: 4250 },
                  { name: 'Fuel Cells', sales: 120, revenue: 3600 },
                  { name: 'Shield Modules', sales: 24, revenue: 3000 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">{item.sales} Contracts Settled</div>
                    </div>
                    <div className="font-mono text-green-500">{item.revenue.toLocaleString()} Lux</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}