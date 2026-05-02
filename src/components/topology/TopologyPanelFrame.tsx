import { useEffect, useState, type ReactNode } from "react";

import { Network } from "lucide-react";

import { cn } from "@/lib/utils";

interface TopologyPanelFrameProps {
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
  headerActionClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}

interface TopologyPanelFadeProps {
  children: ReactNode;
  className?: string;
  durationMs?: number;
}

export function TopologyPanelFrame({
  title,
  subtitle,
  headerAction,
  headerActionClassName,
  bodyClassName,
  children,
}: TopologyPanelFrameProps) {
  return (
    <section className="w-full overflow-hidden rounded border border-border bg-[var(--card)]">
      <div className="relative z-10 flex h-[76px] items-center justify-between gap-4 border-b border-border/50 bg-muted/5 px-5 py-4">
        <div className="min-w-0 flex items-center gap-3">
          <Network className="h-4 w-4 shrink-0 text-primary opacity-80" />
          <div className="min-w-0">
            <h2 className="mb-0.5 truncate text-xs font-semibold tracking-wide text-foreground">
              {title}
            </h2>
            <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {headerAction ? <div className={cn("shrink-0", headerActionClassName)}>{headerAction}</div> : null}
      </div>

      <div className={cn("relative h-[440px] overflow-hidden bg-[var(--topo-background)]", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function TopologyPanelFade({ children, className, durationMs = 260 }: TopologyPanelFadeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className={cn(
        "h-full transition-opacity ease-out motion-reduce:transition-none",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ transitionDuration: `${durationMs}ms` }}
    >
      {children}
    </div>
  );
}