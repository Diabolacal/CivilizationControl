/**
 * useAutoConnect — Auto-connect wallet in the in-game browser.
 *
 * The VaultProvider only auto-reconnects when a prior session exists
 * (localStorage flag). This hook handles first-visit auto-connect:
 * if EVE Frontier Client Wallet is detected and no wallet is connected,
 * connect immediately without user interaction.
 */

import { useEffect, useRef, useState } from "react";
import { useConnection } from "@evefrontier/dapp-kit";

export function useAutoConnect(): { connectError: string | null } {
  const { isConnected, hasEveVault, handleConnect } = useConnection();
  const attempted = useRef(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (attempted.current || isConnected || !hasEveVault) return;
    attempted.current = true;
    try {
      // handleConnect is typed void but returns a Promise internally.
      // Catch it defensively to prevent unhandled rejections in CEF.
      const maybePromise = handleConnect() as unknown;
      if (maybePromise instanceof Promise) {
        maybePromise.catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[useAutoConnect] wallet connect failed:", msg);
          setConnectError(msg);
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[useAutoConnect] wallet connect threw:", msg);
      setConnectError(msg);
    }
  }, [isConnected, hasEveVault, handleConnect]);

  return { connectError };
}
