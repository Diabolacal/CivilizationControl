/**
 * StatusDot — Glowing status indicator.
 *
 * Recreated from Figma guidance. Uses the topology color doctrine
 * (SVG Topology Layer Spec §4): gray default, colored exceptions.
 */

import { cn } from "@/lib/utils";

export type StatusType = "online" | "warning" | "offline" | "neutral";

interface StatusDotProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<string, string> = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

const statusClasses: Record<StatusType, string> = {
  online: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]",
  warning: "bg-primary shadow-[0_0_8px_rgba(234,88,12,0.4)]",
  offline: "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]",
  neutral: "bg-muted-foreground",
};

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  return (
    <div
      className={cn("rounded-full", sizeClasses[size], statusClasses[status])}
      aria-label={`Status: ${status}`}
    />
  );
}
