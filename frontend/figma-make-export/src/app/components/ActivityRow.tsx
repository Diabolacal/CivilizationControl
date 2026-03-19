import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

interface ActivityRowProps {
  timestamp: string;
  structureName: string;
  structureId: string;
  eventType: string;
  icon: React.ReactNode;
  description: string;
  amount?: string;
  transactionHash?: string;
  variant?: 'revenue' | 'blocked' | 'neutral';
}

export function ActivityRow({
  timestamp,
  structureName,
  structureId,
  eventType,
  icon,
  description,
  amount,
  transactionHash,
  variant = 'neutral'
}: ActivityRowProps) {
  const variantStyles = {
    revenue: 'border-l-2 border-l-green-500/50',
    blocked: 'border-l-2 border-l-destructive/50',
    neutral: 'border-l-2 border-l-transparent'
  };

  return (
    <div className={`flex items-center gap-4 py-3 px-4 hover:bg-muted/10 transition-colors border-b border-border/50 last:border-b-0 ${variantStyles[variant]} group`}>
      <div className="text-[11px] font-mono text-muted-foreground w-20 flex-shrink-0">
        {timestamp}
      </div>
      
      <div className="flex items-center gap-2 w-36 flex-shrink-0">
        <Link 
          to={`/gates/${structureId}`}
          className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate"
        >
          {structureName}
        </Link>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0 w-32">
        <div className="text-muted-foreground opacity-70">{icon}</div>
        <span className="text-[11px] font-medium text-muted-foreground">{eventType}</span>
      </div>
      
      <div className="flex-1 text-sm text-muted-foreground truncate">{description}</div>
      
      {amount && (
        <div className={`text-xs font-mono w-28 text-right flex-shrink-0 ${amount.startsWith('+') ? 'text-green-500/90' : 'text-destructive'}`}>
          {amount}
        </div>
      )}
      
      {transactionHash ? (
        <button 
          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 w-8 flex justify-end"
          aria-label="View transaction"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="w-8 flex-shrink-0"></div>
      )}
    </div>
  );
}