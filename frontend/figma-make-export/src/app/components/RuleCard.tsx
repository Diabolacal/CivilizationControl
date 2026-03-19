import React from 'react';
import { TagChip } from './TagChip';

interface RuleCardProps {
  title: string;
  status: 'active' | 'configured' | 'off';
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  lastDeployed?: string;
  children?: React.ReactNode;
}

export function RuleCard({ title, status, enabled, onToggle, lastDeployed, children }: RuleCardProps) {
  const statusVariant = {
    active: 'success' as const,
    configured: 'warning' as const,
    off: 'default' as const
  };

  return (
    <div className="bg-[#09090b] border border-border rounded overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/5">
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-10 h-5 rounded peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-sm after:h-4 after:w-4 after:transition-all ${enabled ? 'bg-primary/80' : 'bg-muted-foreground/30'}`}></div>
          </label>
          <h4 className="text-[13px] font-semibold tracking-wide text-foreground">{title}</h4>
        </div>
        <TagChip label={status.toUpperCase()} variant={statusVariant[status]} size="sm" />
      </div>
      
      {children && <div className="p-5 space-y-4">{children}</div>}
      
      {lastDeployed && (
        <div className="px-5 py-3 border-t border-border/50 bg-background/50">
          <p className="text-[11px] font-mono text-muted-foreground">
            Deployed // {lastDeployed}
          </p>
        </div>
      )}
    </div>
  );
}
