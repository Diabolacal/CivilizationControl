import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

interface NodeDrilldownOverlayPanelProps {
  children: ReactNode;
  className?: string;
}

export function NodeDrilldownOverlayPanel({
  children,
  className,
}: NodeDrilldownOverlayPanelProps) {
  return (
    <div
      className={cn(
        "rounded border border-border/60 bg-background/86 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}