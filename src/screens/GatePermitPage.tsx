/**
 * GatePermitPage — Player-facing gate permit acquisition.
 *
 * Route: /gate or /gate/:gateId
 * Renders standalone (no operator sidebar/header).
 * Auto-connects the in-game wallet, discovers the player's character,
 * reads gate policy, and lets them acquire a JumpPermit.
 *
 * Includes visible staged status for in-game browser debugging.
 */

import { useConnection } from "@evefrontier/dapp-kit";
import { useAutoConnect } from "@/hooks/useAutoConnect";
import { useResolveGateId } from "@/hooks/useResolveGateId";
import { useGateData, usePermitAction } from "@/hooks/useGatePermit";
import { resolveTribeName } from "@/lib/tribeCatalog";
import { formatLux, formatEve } from "@/lib/currency";
import { shortId } from "@/lib/formatAddress";

type Stage = "init" | "resolve" | "wallet" | "loading" | "ready" | "error";

function stageLabel(s: Stage): string {
  switch (s) {
    case "init": return "Initializing…";
    case "resolve": return "Resolving gate context…";
    case "wallet": return "Connecting wallet…";
    case "loading": return "Loading gate data…";
    case "ready": return "Ready";
    case "error": return "Error";
  }
}

export function GatePermitPage() {
  const { gateId, source, error: resolveError } = useResolveGateId();
  const { isConnected, walletAddress } = useConnection();
  const { connectError } = useAutoConnect();

  const { data: gate, isLoading, error: loadError } = useGateData(gateId);
  const permit = usePermitAction();

  // Determine current stage for debug visibility
  let stage: Stage = "init";
  let stageError: string | null = null;

  if (resolveError) {
    stage = "error";
    stageError = resolveError;
  } else if (!gateId) {
    stage = "resolve";
  } else if (connectError) {
    stage = "error";
    stageError = `Wallet connect failed: ${connectError}`;
  } else if (!isConnected) {
    stage = "wallet";
  } else if (isLoading) {
    stage = "loading";
  } else if (loadError || !gate) {
    stage = "error";
    stageError = "Failed to load gate data. Verify the gate ID is correct.";
  } else {
    stage = "ready";
  }

  // --- Non-ready states ---

  if (stage === "error") {
    return (
      <PageShell stage={stage}>
        <p className="text-destructive text-sm">{stageError}</p>
        <StageDebug stage={stage} gateId={gateId} source={source} />
      </PageShell>
    );
  }

  if (!gateId) {
    return (
      <PageShell stage={stage}>
        <p className="text-muted-foreground text-sm">
          No gate context found. This page expects either a gate ID in the URL
          or in-game query parameters (?itemId=&amp;tenant=).
        </p>
        <StageDebug stage={stage} gateId={gateId} source={source} />
      </PageShell>
    );
  }

  if (!isConnected) {
    return (
      <PageShell stage={stage}>
        <p className="text-muted-foreground text-sm">Connecting wallet…</p>
        <StageDebug stage={stage} gateId={gateId} source={source} />
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell stage={stage}>
        <p className="text-muted-foreground text-sm">Loading gate data…</p>
        <StageDebug stage={stage} gateId={gateId} source={source} />
      </PageShell>
    );
  }

  if (!gate) {
    return (
      <PageShell stage={stage}>
        <p className="text-destructive text-sm">
          Failed to load gate data. Verify the gate ID is correct.
        </p>
        <StageDebug stage={stage} gateId={gateId} source={source} />
      </PageShell>
    );
  }

  const noCharacter = !gate.playerCharacterId;
  const noLinkedGate = !gate.linkedGateId;
  const canRequest = gate.accessAllowed && !noCharacter && !noLinkedGate;

  return (
    <PageShell stage={stage}>
      {/* Gate identity */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Gate Transit Permit
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {shortId(gateId)}
          {gate.linkedGateId && (
            <span> → {shortId(gate.linkedGateId)}</span>
          )}
        </p>
      </div>

      {/* Player identity */}
      <div className="space-y-1">
        <Label>Pilot</Label>
        {noCharacter ? (
          <p className="text-destructive text-sm">
            No character found for wallet {shortId(walletAddress ?? "")}.
          </p>
        ) : (
          <p className="text-sm text-foreground">
            {gate.playerCharacterName || shortId(gate.playerCharacterId!)}
            <span className="text-muted-foreground ml-2 text-xs">
              {resolveTribeName(gate.playerTribeId)}
            </span>
          </p>
        )}
      </div>

      {/* Gate policy */}
      <div className="space-y-2">
        <Label>Gate Policy</Label>
        {gate.effectiveToll === 0 && gate.accessAllowed && (
          <PolicyRow label="Open passage" value="No restrictions" />
        )}
        {!gate.accessAllowed && (
          <PolicyRow
            label="Access"
            value="Denied"
            blocked
          />
        )}
        {gate.effectiveToll > 0 && (
          <PolicyRow
            label="Transit toll"
            value={`${formatLux(gate.effectiveToll)} Lux (${formatEve(gate.effectiveToll)} EVE)`}
          />
        )}
        <PolicyRow
          label="Posture mode"
          value={gate.posture === "defense" ? "Defense" : "Commercial"}
        />
        {noLinkedGate && (
          <PolicyRow label="Destination" value="Not linked" blocked />
        )}
      </div>

      {/* Access denied warning */}
      {!gate.accessAllowed && (
        <p className="text-destructive text-sm">
          Your tribe ({resolveTribeName(gate.playerTribeId)}) is not
          permitted under the current {gate.posture} policy.
        </p>
      )}

      {/* Action */}
      {permit.status === "success" ? (
        <div className="space-y-2">
          <p className="text-primary text-sm font-medium">
            Permit acquired.
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            tx: {permit.digest}
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={() => permit.execute(gate, gateId)}
            disabled={!canRequest || permit.status === "pending"}
            className="w-full rounded border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {permit.status === "pending"
              ? "Requesting…"
              : gate.effectiveToll > 0
                ? `Pay ${formatLux(gate.effectiveToll)} Lux (${formatEve(gate.effectiveToll)} EVE) — Acquire Permit`
                : "Acquire Transit Permit"}
          </button>
          {permit.error && (
            <p className="text-destructive text-sm">{permit.error}</p>
          )}
        </>
      )}

      <StageDebug stage={stage} gateId={gateId} source={source} />
    </PageShell>
  );
}

// ─── Sub-components ──────────────────────────────────────

function PageShell({ children, stage }: { children: React.ReactNode; stage?: Stage }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-border/50 bg-secondary/30 p-6">
        {stage && (
          <div className="text-[10px] font-mono text-muted-foreground/60 border-b border-border/30 pb-2">
            Stage: {stageLabel(stage)}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function StageDebug({
  stage,
  gateId,
  source,
}: {
  stage: Stage;
  gateId: string | undefined;
  source: string;
}) {
  return (
    <div className="border-t border-border/30 pt-2 mt-2 space-y-0.5">
      <p className="text-[9px] font-mono text-muted-foreground/40">
        stage={stage} source={source} gate={gateId ? shortId(gateId) : "none"}
      </p>
      <p className="text-[9px] font-mono text-muted-foreground/40">
        url={typeof window !== "undefined" ? window.location.href : "ssr"}
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function PolicyRow({
  label,
  value,
  blocked = false,
}: {
  label: string;
  value: string;
  blocked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={blocked ? "text-destructive" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}
