import { cn } from "@/lib/utils";

interface NodeControlAuthorityStatePanelProps {
  state: "loading" | "unavailable";
  nodeObjectId: string | null;
  walletAddress: string | null;
  lookupKeysTried: readonly string[];
  className?: string;
}

export function NodeControlAuthorityStatePanel({
  state,
  nodeObjectId,
  walletAddress,
  lookupKeysTried,
  className,
}: NodeControlAuthorityStatePanelProps) {
  const isLoading = state === "loading";

  return (
    <div className={cn("flex min-h-[220px] items-center justify-center px-4 py-8", className)}>
      <div className="w-full max-w-xl rounded border border-border/60 bg-background/35 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <p className="text-sm font-medium text-foreground">
          {isLoading ? <>Resolving indexed node membership&hellip;</> : "Indexed node membership unavailable for this node."}
        </p>
        <div className="mt-3 space-y-1 text-[11px] font-mono text-muted-foreground/70">
          <p>Node object ID: {nodeObjectId ?? "Not supplied"}</p>
          <p>Wallet: {walletAddress ?? "Not connected"}</p>
          {isLoading ? null : (
            <p className="break-words">Lookup keys tried: {lookupKeysTried.length > 0 ? lookupKeysTried.join(", ") : "None"}</p>
          )}
        </div>
      </div>
    </div>
  );
}
