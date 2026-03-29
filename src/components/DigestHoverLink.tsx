/**
 * DigestHoverLink — Transaction digest with hover proof card.
 *
 * Wraps a truncated digest link to SuiScan. On ~500ms hover,
 * fetches tx details and shows a TxProofCard popover. Cached by
 * digest so repeated hovers are instant. Click still opens SuiScan.
 */

import { useRef, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTxDetails } from "@/hooks/useTxDetails";
import { TxProofCard, TxProofLoading, TxProofError } from "@/components/TxProofCard";

interface DigestHoverLinkProps {
  digest: string;
  children: ReactNode;
  className?: string;
}

const HOVER_DELAY = 500;
const CARD_GAP = 8;

export function DigestHoverLink({
  digest,
  children,
  className,
}: DigestHoverLinkProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, fetch } = useTxDetails(digest);

  const computePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cardWidth = 288; // w-72 = 18rem = 288px
    const cardHeight = 200; // conservative estimate

    let top = rect.bottom + CARD_GAP;
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + cardWidth > window.innerWidth - 8) {
      left = window.innerWidth - cardWidth - 8;
    }
    // If no room below, show above
    if (top + cardHeight > window.innerHeight - 8) {
      top = rect.top - CARD_GAP - cardHeight;
      if (top < 8) top = 8;
    }

    setPosition({ top, left });
  }, []);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      computePosition();
      setShow(true);
      if (!data && !isLoading) {
        fetch();
      }
    }, HOVER_DELAY);
  }, [data, isLoading, fetch, computePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
  }, []);

  return (
    <>
      <a
        ref={anchorRef}
        href={`https://suiscan.xyz/testnet/tx/${digest}`}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </a>
      {show &&
        position &&
        createPortal(
          <div
            ref={cardRef}
            className="fixed z-[9999] pointer-events-none"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={handleMouseLeave}
          >
            {isLoading && !data ? (
              <TxProofLoading />
            ) : isError && !data ? (
              <TxProofError />
            ) : data ? (
              <TxProofCard data={data} />
            ) : (
              <TxProofLoading />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
