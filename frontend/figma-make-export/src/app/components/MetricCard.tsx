import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
}

export function MetricCard({ title, value, icon, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-[#09090b] border border-border rounded p-5 relative overflow-hidden flex flex-col justify-between group hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground flex-shrink-0 opacity-70">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-mono text-foreground mb-1.5">{value}</div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-xs font-mono ${trend > 0 ? 'text-green-500' : 'text-destructive'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}