/**
 * SignalEventRow — renders a single SignalEvent in the feed.
 *
 * Supports variant-based left border (revenue=green, blocked=red, info=blue).
 * Displays: timestamp, category badge, label, description, amount.
 */

import { Shield, ArrowRightLeft, Radio, AlertTriangle } from "lucide-react";
import { formatLux } from "@/lib/currency";
import type { SignalEvent, SignalCategory } from "@/types/domain";

const CATEGORY_CONFIG: Record<SignalCategory, { icon: typeof Shield; color: string; label: string }> = {
  governance: { icon: Shield, color: "text-primary", label: "GOV" },
  trade: { icon: ArrowRightLeft, color: "text-green-400", label: "TRD" },
  transit: { icon: Radio, color: "text-blue-400", label: "TRN" },
  status: { icon: AlertTriangle, color: "text-yellow-400", label: "STS" },
};

const VARIANT_BORDER: Record<string, string> = {
  revenue: "border-l-green-500/50",
  blocked: "border-l-destructive/50",
  info: "border-l-blue-500/30",
  neutral: "border-l-transparent",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function SignalEventRow({ signal }: { signal: SignalEvent }) {
  const cat = CATEGORY_CONFIG[signal.category];
  const Icon = cat.icon;
  const borderClass = VARIANT_BORDER[signal.variant] ?? VARIANT_BORDER.neutral;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 hover:bg-muted/10 transition-colors border-l-2 ${borderClass}`}
    >
      <div className={`${cat.color} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[11px] font-mono text-muted-foreground w-14 shrink-0">
        {formatTime(signal.timestamp)}
      </span>
      <span
        className={`text-[10px] font-mono uppercase tracking-wider w-8 shrink-0 ${cat.color}`}
      >
        {cat.label}
      </span>
      <span className="text-sm font-medium text-foreground w-36 shrink-0 truncate">
        {signal.label}
      </span>
      <span className="text-sm text-muted-foreground truncate flex-1">
        {signal.description}
      </span>
      {signal.amount != null && signal.amount > 0 && (
        <span className="text-sm font-mono text-green-400 shrink-0">
          {formatLux(signal.amount)} Lux
        </span>
      )}
      {signal.txDigest && (
        <a
          href={`https://suiscan.xyz/testnet/tx/${signal.txDigest}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
          title={signal.txDigest}
        >
          {truncateId(signal.txDigest)}
        </a>
      )}
    </div>
  );
}
