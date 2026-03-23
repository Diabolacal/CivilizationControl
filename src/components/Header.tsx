/**
 * Header — Fixed top bar with brand wordmark and wallet control.
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
        <WalletControl characterName={characterName} />
      </div>
    </header>
  );
}
