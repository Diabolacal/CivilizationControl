import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Location } from "react-router";

import { cn } from "@/lib/utils";

interface ShellRouteTransitionProps {
  location: Location;
  children: (location: Location) => ReactNode;
  className?: string;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 400;

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

function routeContentKey(location: Location): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function ShellRouteTransition({
  location,
  children,
  className,
  durationMs = DEFAULT_DURATION_MS,
}: ShellRouteTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const normalizedKey = routeContentKey(location);
  const [renderedKey, setRenderedKey] = useState(normalizedKey);
  const [renderedLocation, setRenderedLocation] = useState(location);
  const [isVisible, setIsVisible] = useState(true);
  const phaseDurationMs = Math.max(0, Math.round(durationMs / 2));

  useEffect(() => {
    if (prefersReducedMotion) {
      setRenderedKey(normalizedKey);
      setRenderedLocation(location);
      setIsVisible(true);
      return undefined;
    }

    if (normalizedKey === renderedKey) {
      setRenderedLocation(location);
      setIsVisible(true);
      return undefined;
    }

    let frameId = 0;
    setIsVisible(false);

    const swapTimer = window.setTimeout(() => {
      setRenderedKey(normalizedKey);
      setRenderedLocation(location);
      frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, phaseDurationMs);

    return () => {
      window.clearTimeout(swapTimer);
      window.cancelAnimationFrame(frameId);
    };
  }, [location, normalizedKey, phaseDurationMs, prefersReducedMotion, renderedKey]);

  const transitionStyle = useMemo(
    () => ({
      transitionDuration: `${phaseDurationMs}ms`,
      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      willChange: "opacity",
    }),
    [phaseDurationMs],
  );

  return (
    <div
      className={cn(
        "transition-opacity ease-out motion-reduce:transition-none",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={transitionStyle}
    >
      {children(renderedLocation)}
    </div>
  );
}