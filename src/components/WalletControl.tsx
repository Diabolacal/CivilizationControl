/**
 * WalletControl — Header wallet display with connected-state de-escalation.
 *
 * Disconnected: renders standard ConnectButton CTA (orange, prominent).
 * Connected: renders a quiet shell element showing character name or
 * abbreviated address, with a dropdown for wallet details and disconnect.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { ConnectButton } from "@mysten/dapp-kit-react";
import { ChevronDown, Copy, LogOut, Check } from "lucide-react";

function shortenAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

interface WalletControlProps {
  characterName?: string | null;
}

export function WalletControl({ characterName }: WalletControlProps) {
  const { isConnected, walletAddress, handleDisconnect } = useConnection();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [walletAddress]);

  if (!isConnected) {
    return <ConnectButton />;
  }

  const displayName = characterName || (walletAddress ? shortenAddress(walletAddress) : "Connected");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-3 text-xs font-medium text-foreground/80 bg-secondary/50 border border-border/50 rounded hover:bg-secondary/80 transition-colors"
      >
        <span className="tracking-wide">{displayName}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-[var(--popover)] border border-border rounded shadow-lg z-50">
          {walletAddress && (
            <div className="px-3 py-2.5 border-b border-border/50">
              <div className="text-[10px] text-muted-foreground tracking-wide mb-1">
                Connected Wallet
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-mono text-foreground/70 hover:text-foreground transition-colors w-full text-left"
              >
                <span className="truncate">{shortenAddress(walletAddress)}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-primary shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
              </button>
            </div>
          )}
          <button
            onClick={() => {
              handleDisconnect();
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors rounded-b"
          >
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
