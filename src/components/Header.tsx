/**
 * Header — Fixed top bar with brand wordmark, vote link, and wallet control.
 */

import { WalletControl } from "@/components/WalletControl";

interface HeaderProps {
  characterName?: string | null;
}

export function Header({ characterName }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--background)] border-b border-border/50 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <h1 className="text-sm font-medium tracking-wide text-foreground">
          CivilizationControl
        </h1>
        <a
          href="https://vote.deepsurge.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-orange-400/90 hover:text-orange-300 tracking-wide transition-all border border-orange-500/50 hover:border-orange-400/70 rounded-full px-4 py-1.5 bg-orange-500/5 hover:bg-orange-500/10 hover:shadow-[0_0_8px_rgba(249,115,22,0.15)]"
        >
          Vote for CivilizationControl ↗
        </a>
        <WalletControl characterName={characterName} />
      </div>
    </header>
  );
}
