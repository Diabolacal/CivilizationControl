import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Store, 
  Radio, 
  Settings2,
  Activity,
  Network
} from 'lucide-react';

export function StrategicMapPanel() {
  const [posture, setPosture] = useState<'open' | 'defense'>('open');

  return (
    <div className="w-full bg-[#09090b] border border-border rounded overflow-hidden flex flex-col relative">
      {/* Top Header / Control Bar */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/5 z-10 relative">
        <div className="flex items-center gap-3">
          <Network className="w-4 h-4 text-primary opacity-80" />
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-foreground mb-0.5">Strategic Network</h2>
            <p className="text-[11px] text-muted-foreground">Infrastructure Posture & Topology Control</p>
          </div>
        </div>

        {/* Posture Controls */}
        <div className="flex items-center gap-2 bg-[#09090b] border border-border/50 rounded p-1">
          <button
            onClick={() => setPosture('open')}
            className={`px-3 py-1.5 text-[11px] font-medium tracking-wide rounded transition-colors flex items-center gap-2 ${
              posture === 'open' 
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(234,88,12,0.1)]' 
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Commercial
          </button>
          
          <button
            onClick={() => setPosture('defense')}
            className={`px-3 py-1.5 text-[11px] font-medium tracking-wide rounded transition-colors flex items-center gap-2 ${
              posture === 'defense' 
                ? 'bg-destructive/20 text-destructive border border-destructive/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Defensive
          </button>

          <div className="w-px h-4 bg-border/50 mx-2"></div>

          <button className="px-3 py-1.5 text-[11px] font-medium tracking-wide rounded text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 border border-transparent hover:border-border/50">
            <Settings2 className="w-3 h-3" />
            Save Preset
          </button>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="relative h-[320px] bg-[#09090b] w-full overflow-hidden">
        {/* Subtle Grid Background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* SVG Network Links */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          {/* Active / Revenue paths */}
          <path d="M 150 160 L 350 100" stroke={posture === 'open' ? "#22c55e" : "#52525b"} strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
          <path d="M 350 100 L 550 160" stroke={posture === 'open' ? "#ea580c" : "#52525b"} strokeWidth="2" fill="none" className="opacity-60" />
          <path d="M 550 160 L 750 120" stroke={posture === 'open' ? "#ea580c" : "#52525b"} strokeWidth="2" fill="none" className="opacity-60" />
          
          {/* Neutral paths */}
          <path d="M 350 100 L 350 250" stroke="#52525b" strokeWidth="1.5" strokeDasharray="2 4" className="opacity-30" />
          <path d="M 550 160 L 650 260" stroke="#52525b" strokeWidth="1.5" className="opacity-30" />
          
          {/* Degraded path */}
          <path d="M 150 160 L 250 260" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 2" className="opacity-50" />
        </svg>

        {/* Nodes */}
        {/* Node 1: Alpha Gate (Controlled/Active) */}
        <div className="absolute top-[160px] left-[150px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors ${posture === 'open' ? 'bg-primary/10 border-primary text-primary shadow-primary/20' : 'bg-muted border-border text-muted-foreground'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Alpha Gate</span>
            <span className="text-[11px] font-medium text-muted-foreground">Command: Active</span>
          </div>
        </div>

        {/* Node 2: Main Hub (Controlled) */}
        <div className="absolute top-[100px] left-[350px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 shadow-lg transition-colors ${posture === 'open' ? 'bg-primary/20 border-primary text-primary shadow-primary/20' : 'bg-muted border-border text-muted-foreground'}`}>
            <Store className="w-6 h-6" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Main Hub</span>
            <span className="text-[11px] font-medium text-muted-foreground">Trade / Core</span>
          </div>
        </div>

        {/* Node 3: Beta Gate (Warning/Degraded) */}
        <div className="absolute top-[260px] left-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-destructive/10 border-2 border-destructive text-destructive flex items-center justify-center shadow-lg shadow-destructive/20 animate-pulse">
            <Activity className="w-4 h-4" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Beta Gate</span>
            <span className="text-[11px] text-destructive font-medium">Low Fuel</span>
          </div>
        </div>

        {/* Node 4: Outpost Market (Controlled) */}
        <div className="absolute top-[160px] left-[550px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 shadow-lg transition-colors ${posture === 'open' ? 'bg-primary/10 border-primary text-primary shadow-primary/20' : 'bg-muted border-border text-muted-foreground'}`}>
            <Store className="w-5 h-5" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Outpost Market</span>
            <span className="text-[11px] font-medium text-muted-foreground">Perimeter</span>
          </div>
        </div>

        {/* Node 5: Relay Node 1 (Neutral/Inactive) */}
        <div className="absolute top-[250px] left-[350px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-60">
          <div className="w-8 h-8 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Relay Node 1</span>
            <span className="text-[11px] font-medium text-muted-foreground">Neutral</span>
          </div>
        </div>

        {/* Node 6: Gamma Gate (Offline) */}
        <div className="absolute top-[260px] left-[650px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-50">
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-border text-muted-foreground flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Gamma Gate</span>
            <span className="text-[11px] font-medium text-muted-foreground">Offline</span>
          </div>
        </div>

        {/* Node 7: Sector 7 Link (External) */}
        <div className="absolute top-[120px] left-[750px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-70">
          <div className="w-8 h-8 rounded-sm bg-background border-2 border-dashed border-primary text-primary/70 flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <div className="bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Sector 7</span>
            <span className="text-[11px] font-medium text-primary/80">External Link</span>
          </div>
        </div>

        {/* Defense Mode Overlay */}
        {posture === 'defense' && (
          <div className="absolute inset-0 bg-destructive/5 pointer-events-none border-[3px] border-destructive/20 transition-all duration-500">
            <div className="absolute top-4 right-4 bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded text-[11px] font-medium tracking-wide flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)] backdrop-blur-md">
              <ShieldAlert className="w-3.5 h-3.5" />
              Defense Posture Active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
