import React from 'react';
import { WalletButton } from './WalletButton';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#09090b] border-b border-border/50 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium tracking-wide text-foreground">
            CivilizationControl
          </h1>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
