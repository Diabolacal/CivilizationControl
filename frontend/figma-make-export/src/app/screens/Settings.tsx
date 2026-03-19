import React from 'react';
import { EmptyState } from '../components/EmptyState';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">Configuration</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">System Preferences // Access Control</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/5">
            <h2 className="text-[11px] font-semibold tracking-wide text-foreground">Operator Profile</h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-2">Callsign</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded focus:outline-none focus:border-primary/50 text-sm font-mono text-foreground"
                placeholder="Enter operator callsign"
                defaultValue="Cmdr. Shepard"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-3">Telemetry Alerts</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="rounded border-border/50 bg-muted/10 text-primary focus:ring-primary/20" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Critical Fuel Thresholds</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="rounded border-border/50 bg-muted/10 text-primary focus:ring-primary/20" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Node State Transitions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="rounded border-border/50 bg-muted/10 text-primary focus:ring-primary/20" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Economic Yield Events</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/5">
            <h2 className="text-[11px] font-semibold tracking-wide text-foreground">Interface Directives</h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-2">Display Mode</label>
              <select className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded focus:outline-none focus:border-primary/50 text-sm text-foreground">
                <option>Tactical Dark (Active)</option>
                <option>High Contrast</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-2">Information Density</label>
              <select className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded focus:outline-none focus:border-primary/50 text-sm text-foreground">
                <option>Command (1440p Optimized)</option>
                <option>Compact (1080p Fallback)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#09090b] border border-border rounded overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/5">
            <h2 className="text-[11px] font-semibold tracking-wide text-destructive">Advanced Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            <button className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 border border-border/50 transition-colors rounded text-left text-sm font-medium text-foreground">
              Export Telemetry Log
            </button>
            <button className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 border border-border/50 transition-colors rounded text-left text-sm font-medium text-foreground">
              Manage API Credentials
            </button>
            <button className="w-full px-4 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors rounded text-left border border-destructive/30 text-sm font-medium">
              Factory Reset Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}