/**
 * TagChip — Compact label/badge component.
 *
 * Recreated from Figma guidance with project color tokens.
 */

import { cn } from "@/lib/utils";

interface TagChipProps {
  label: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  onRemove?: () => void;
}

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-[11px]",
};

const variantClasses: Record<string, string> = {
  default: "bg-muted/30 text-muted-foreground border border-border/50",
  primary: "bg-primary/5 text-primary border border-primary/20",
  success: "bg-green-500/5 text-green-500 border border-green-500/20",
  warning: "bg-primary/10 text-primary border border-primary/30",
  danger: "bg-destructive/10 text-destructive border border-destructive/20",
};

export function TagChip({
  label,
  variant = "default",
  size = "md",
  onRemove,
}: TagChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium tracking-wide",
        sizeClasses[size],
        variantClasses[variant],
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
