/**
 * Header — Fixed top bar with brand wordmark and wallet control.
 */

import { Link } from "react-router";

import { WalletControl } from "@/components/WalletControl";

interface HeaderProps {
  characterName?: string | null;
  onRequestHome?: () => void;
}

export function Header({ characterName, onRequestHome }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--background)] border-b border-border/50 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <h1 className="text-sm font-medium tracking-wide text-foreground">
          <Link to="/" onClick={onRequestHome} className="text-inherit no-underline">
            CivilizationControl
          </Link>
        </h1>
        <WalletControl characterName={characterName} />
      </div>
    </header>
  );
}
