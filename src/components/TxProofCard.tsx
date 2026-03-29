/**
 * TxProofCard — Compact on-chain transaction proof summary.
 *
 * Rendered inside a hover popover. Shows status, type, digest,
 * checkpoint, timestamp, and gas — no raw JSON.
 */

import { CheckCircle2, XCircle } from "lucide-react";
import type { TxProofData } from "@/lib/txDetails";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncate(s: string, head = 8, tail = 6): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function TxProofCard({ data }: { data: TxProofData }) {
  const isSuccess = data.status === "success";

  return (
    <div className="w-72 rounded border border-border bg-[#0d0d10] shadow-xl p-3 space-y-2 text-xs">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            isSuccess ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {isSuccess ? "Success" : "Failed"}
        </span>
        {data.txKind && (
          <span className="text-muted-foreground/60 font-mono text-[10px]">
            {data.txKind}
          </span>
        )}
      </div>

      {/* Error detail if failed */}
      {data.error && (
        <p className="text-[10px] text-red-400/70 truncate" title={data.error}>
          {data.error}
        </p>
      )}

      {/* Detail rows */}
      <div className="space-y-1 text-[11px]">
        <Row label="Digest" value={truncate(data.digest)} mono />
        {data.checkpoint && (
          <Row label="Checkpoint" value={data.checkpoint} mono />
        )}
        {data.timestamp && (
          <Row label="Time" value={formatTimestamp(data.timestamp)} />
        )}
        {data.gasSui && (
          <Row
            label="Gas"
            value={data.sponsored ? `Sponsored · ${data.gasSui}` : data.gasSui}
            mono
          />
        )}
        {!data.gasSui && data.sponsored && (
          <Row label="Gas" value="Sponsored" mono />
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/40 pt-1 border-t border-border/30">
        Finalized on Sui testnet
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground/60 shrink-0">{label}</span>
      <span
        className={`text-foreground truncate ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

export function TxProofLoading() {
  return (
    <div className="w-72 rounded border border-border bg-[#0d0d10] shadow-xl p-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
        <span className="text-xs text-muted-foreground/50 animate-pulse">
          Loading proof…
        </span>
      </div>
    </div>
  );
}

export function TxProofError() {
  return (
    <div className="w-72 rounded border border-border/50 bg-[#0d0d10] shadow-xl p-3">
      <span className="text-xs text-muted-foreground/50">
        Could not load transaction details
      </span>
    </div>
  );
}
