import { useEffect, useState } from "react";

import { Check, Copy } from "lucide-react";

import { truncateMiddle } from "@/lib/formatAddress";

interface CompactCopyValueProps {
  value: string;
  ariaLabel: string;
  headChars?: number;
  tailChars?: number;
}

export function CompactCopyValue({
  value,
  ariaLabel,
  headChars = 6,
  tailChars = 4,
}: CompactCopyValueProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center justify-end gap-1.5">
      <span className="truncate whitespace-nowrap font-mono text-[11px] text-foreground" title={value}>
        {truncateMiddle(value, headChars, tailChars)}
      </span>
      <button
        type="button"
        onClick={() => {
          void handleCopy();
        }}
        className="rounded border border-border/60 p-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        aria-label={copied ? `${ariaLabel} copied` : ariaLabel}
        title={copied ? "Copied" : "Copy full value"}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}