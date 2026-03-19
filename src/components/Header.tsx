/**
 * Header — Fixed top bar with brand, network indicator, and wallet.
 *
 * Uses @evefrontier/dapp-kit ConnectButton for wallet integration.
 * Network indicator provides operational context.
 */

import { ConnectButton } from "@mysten/dapp-kit-react";
import { Radio } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--background)] border-b border-border/50 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold tracking-wide text-foreground">
            CivilizationControl
          </h1>
          <div className="hidden sm:flex items-center gap-2 border-l border-border/50 pl-4">
            <Radio className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[11px] font-mono text-muted-foreground/60 tracking-wide">
              Utopia Testnet
            </span>
          </div>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
