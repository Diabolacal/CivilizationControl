import { useEffect, useMemo, useState, type ReactNode } from "react";

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
  contentKey?: string;
}

const STATIC_FADE_KEY = "__topology-panel-static__";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
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

export function TopologyPanelFade({
  children,
  className,
  durationMs = 260,
  contentKey,
}: TopologyPanelFadeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const normalizedKey = contentKey ?? STATIC_FADE_KEY;
  const [renderedKey, setRenderedKey] = useState(normalizedKey);
  const [renderedChildren, setRenderedChildren] = useState(children);
  const [isVisible, setIsVisible] = useState(true);
  const phaseDurationMs = contentKey ? Math.max(180, Math.round(durationMs / 2)) : durationMs;

  useEffect(() => {
    if (prefersReducedMotion) {
      setRenderedKey(normalizedKey);
      setRenderedChildren(children);
      setIsVisible(true);
      return undefined;
    }

    if (normalizedKey === renderedKey) {
      setRenderedChildren((currentChildren) => (currentChildren === children ? currentChildren : children));
      setIsVisible(true);
      return undefined;
    }

    let frameId = 0;
    setIsVisible(false);

    const swapTimer = window.setTimeout(() => {
      setRenderedKey(normalizedKey);
      setRenderedChildren(children);
      frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, phaseDurationMs);

    return () => {
      window.clearTimeout(swapTimer);
      window.cancelAnimationFrame(frameId);
    };
  }, [children, normalizedKey, phaseDurationMs, prefersReducedMotion, renderedKey]);

  const transitionStyle = useMemo(
    () => ({
      transitionDuration: `${phaseDurationMs}ms`,
      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    }),
    [phaseDurationMs],
  );

  return (
    <div
      className={cn(
        "h-full transition-opacity ease-out motion-reduce:transition-none",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={transitionStyle}
    >
      {renderedChildren}
    </div>
  );
}