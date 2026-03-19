import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationPanelProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmationPanel({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default'
}: ConfirmationPanelProps) {
  return (
    <div className="bg-[#09090b] border border-border rounded overflow-hidden">
      <div className={`p-4 border-b border-border/50 flex items-center gap-3 ${variant === 'danger' ? 'bg-destructive/5' : 'bg-muted/5'}`}>
        {variant === 'danger' && (
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
        )}
        <h3 className={`text-[11px] font-semibold tracking-wide ${variant === 'danger' ? 'text-destructive' : 'text-foreground'}`}>{title}</h3>
      </div>
      <div className="p-5">
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-muted/10 hover:bg-muted/20 border border-border/50 transition-colors rounded text-[11px] font-medium text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 transition-colors rounded text-[11px] font-medium tracking-wide ${
              variant === 'danger'
                ? 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
                : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
