import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/50 rounded bg-muted/5">
      {icon && <div className="text-muted-foreground opacity-50 mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground mb-2">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/70 mb-6 max-w-md">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors rounded text-[11px] font-medium tracking-wide"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
