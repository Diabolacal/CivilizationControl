import { cn } from "@/lib/utils";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface NodeDrilldownOverlayPanelProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

export function NodeDrilldownOverlayPanel({
  children,
  className,
  ...props
}: NodeDrilldownOverlayPanelProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded border border-border/60 bg-background/86 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}