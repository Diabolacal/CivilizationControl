/**
 * MetricCard — Stat display card for the command overview.
 *
 * Two variants:
 *  - default: compact KPI readout (text-2xl font-mono value)
 *  - hero: wide revenue card (text-3xl font-mono green value + sparkline)
 *
 * Recreated from Figma guidance. Dark card with monospace readouts.
 */

import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number;
  /** Hero variant for revenue card (col-span-2, green accent, sparkline) */
  variant?: "default" | "hero";
  /** Unit suffix shown after value in hero variant */
  unit?: string;
  /** Secondary line below value in hero variant */
  secondaryLabel?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  variant = "default",
  unit,
  secondaryLabel,
}: MetricCardProps) {
  if (variant === "hero") {
    return (
      <div className="bg-[var(--card)] border border-border rounded p-5 h-full relative overflow-hidden flex flex-col justify-between group hover:border-border/80 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
          {icon && (
            <div className="text-muted-foreground flex-shrink-0 opacity-70">{icon}</div>
          )}
        </div>
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            <div className="text-3xl font-mono text-green-500/90 mb-1 leading-none tracking-tight">
              {value}{" "}
              {unit && <span className="text-lg text-green-500/50">{unit}</span>}
            </div>
            {secondaryLabel && (
              <p className="text-xs text-muted-foreground mb-3">{secondaryLabel}</p>
            )}
            {trend !== undefined && trend !== 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </span>
                <span className="text-[11px] text-muted-foreground">vs Prev Cycle</span>
              </div>
            )}
          </div>
          {/* Sparkline */}
          <div className="flex items-end gap-1 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
            {[5, 7, 3, 9, 6, 8, 4, 10, 7, 11, 9].map((h, i, arr) => (
              <div
                key={i}
                className={`w-1.5 rounded-sm ${
                  i === arr.length - 1
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                    : i === arr.length - 2
                      ? "bg-green-500/80"
                      : "bg-green-500/50"
                }`}
                style={{ height: `${h * 4}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-border rounded p-5 relative overflow-hidden flex flex-col justify-between group hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {icon && (
          <div className="text-muted-foreground flex-shrink-0 opacity-70">{icon}</div>
        )}
      </div>
      <div>
        <div className="text-2xl font-mono text-foreground mb-1.5">{value}</div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
        )}
        {trend !== undefined && trend !== 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={`text-xs font-mono ${
                trend > 0 ? "text-green-500" : "text-destructive"
              }`}
            >
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
