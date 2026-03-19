import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

type WalletState = 'disconnected' | 'connected' | 'error';

export function WalletButton() {
  const [state, setState] = useState<WalletState>('disconnected');
  const [address, setAddress] = useState<string>('');

  const handleConnect = () => {
    // Mock wallet connection
    setTimeout(() => {
      setState('connected');
      setAddress('0x742d...4a9f');
    }, 500);
  };

  const handleDisconnect = () => {
    setState('disconnected');
    setAddress('');
  };

  if (state === 'connected') {
    return (
      <button
        onClick={handleDisconnect}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border border-border/50 hover:bg-muted/20 hover:border-primary/50 transition-colors rounded group"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
        <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground">{address}</span>
      </button>
    );
  }

  if (state === 'error') {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors rounded"
      >
        <Wallet className="w-3 h-3" />
        <span className="text-[11px] font-medium">Auth Failed</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 text-muted-foreground border border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors rounded group"
    >
      <Wallet className="w-3 h-3" />
      <span className="text-[11px] font-medium group-hover:text-primary transition-colors">Authenticate</span>
    </button>
  );
}
