import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardPanelFrameProps {
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function DashboardPanelFrame({
  title,
  subtitle,
  headerAction,
  className,
  children,
}: DashboardPanelFrameProps) {
  return (
    <section className={cn("overflow-hidden rounded border border-border bg-[var(--card)]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
            {subtitle}
          </p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </section>
  );
}