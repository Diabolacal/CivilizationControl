/**
 * GateDetailScreen — Individual gate governance view.
 *
 * Shows gate status, extension configuration, and the active policy
 * rules (tribe filter, coin toll) read from on-chain GateConfig
 * dynamic fields. Enables live policy authoring via the Rule Composer.
 *
 * Governance vocabulary: "Gate Directive", "Policy Configuration",
 * "Extension Authority" per narrative spec.
 */

import { useParams, Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { StructureDetailHeader } from "@/components/StructureDetailHeader";
import { NodeContextBanner } from "@/components/NodeContextBanner";
import { PolicyPresetEditor } from "@/components/PolicyPresetEditor";
import { TreasuryEditor } from "@/components/TreasuryEditor";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useGatePolicy } from "@/hooks/useGatePolicy";
import { useGatePolicyMutation, useBatchPresetMutation } from "@/hooks/useGatePolicyMutation";
import { useStructurePower } from "@/hooks/useStructurePower";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useLinkedGate, useTransitProofAction } from "@/hooks/useTransitProof";
import { usePostureState } from "@/hooks/usePosture";
import { useConnection } from "@evefrontier/dapp-kit";
import { formatLux, formatEve } from "@/lib/currency";
import { resolveEffectivePolicy } from "@/lib/policyResolver";
import { getSpatialPin } from "@/lib/spatialPins";
import { Copy, Check } from "lucide-react";
import { useState, useCallback, useMemo, useRef } from "react";
import type { Structure, GatePolicyTarget } from "@/types/domain";

interface GateDetailScreenProps {
  structures: Structure[];
  isLoading: boolean;
}

export function GateDetailScreen({ structures, isLoading }: GateDetailScreenProps) {
  const { id } = useParams<{ id: string }>();
  const gate = structures.find((s) => s.objectId === id && s.type === "gate");

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">Loading gate…</p>
      </div>
    );
  }

  if (!gate) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground/60">Gate not found</p>
          <p className="text-[11px] text-muted-foreground/40">Object may have been removed or is not owned by this wallet</p>
        </div>
      </div>
    );
  }

  const solarSystemName = gate.networkNodeId
    ? (() => {
        const parentNode = structures.find(
          (s) => s.objectId === gate.networkNodeId && s.type === "network_node",
        );
        const pin = parentNode ? getSpatialPin(parentNode.objectId) : undefined;
        return pin?.solarSystemName;
      })()
    : undefined;

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={gate} solarSystemName={solarSystemName} />
      <NodeContextBanner structure={gate} structures={structures} />
      <InGameDAppUrlSection gate={gate} />
      <TopologyLinkSection gate={gate} structures={structures} />
      <PowerControlSection gate={gate} />
      <PolicyComposerSection gate={gate} structures={structures} />
      <TransitProofSection gate={gate} />
      <ExtensionSection gate={gate} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/gates"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All Gates
    </Link>
  );
}

function InGameDAppUrlSection({ gate }: { gate: Structure }) {
  const [copied, setCopied] = useState(false);
  const { setGateDappUrl, gateStatus, gateResult, gateError, resetGate } =
    useAuthorizeExtension();
  const queryClient = useQueryClient();
  const dappUrl = `${window.location.origin}/gate/${gate.objectId}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(dappUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [dappUrl]);

  const handleSetOnChain = useCallback(() => {
    setGateDappUrl(
      [{ gateId: gate.objectId, ownerCapId: gate.ownerCapId }],
      window.location.origin,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  }, [setGateDappUrl, gate.objectId, gate.ownerCapId, queryClient]);

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">In-Game DApp URL</h2>
        <p className="text-[11px] font-mono text-muted-foreground">Operator Setup</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Set this URL on-chain so players who interact with this gate see the permit page automatically.
      </p>
      {(gateStatus === "success" || gateStatus === "error") && (
        <TxFeedbackBanner
          status={gateStatus}
          result={gateResult}
          error={gateError ?? null}
          successLabel="DApp URL set on-chain"
          onDismiss={resetGate}
        />
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground truncate select-all" title={dappUrl}>
          {dappUrl}
        </div>
        <button
          onClick={handleSetOnChain}
          disabled={gateStatus === "pending"}
          className="shrink-0 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {gateStatus === "pending" ? "Setting…" : "Set On-Chain"}
        </button>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy URL</span>
          )}
        </button>
      </div>
    </section>
  );
}

function TopologyLinkSection({ gate, structures }: { gate: Structure; structures: Structure[] }) {
  const linkedGate = gate.linkedGateId
    ? structures.find((s) => s.objectId === gate.linkedGateId)
    : undefined;

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Topology Link</h2>
        <p className="text-[11px] font-mono text-muted-foreground">Gate ↔ Gate</p>
      </div>
      {gate.linkedGateId ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Destination Gate</p>
            {linkedGate ? (
              <Link
                to={`/gates/${linkedGate.objectId}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {linkedGate.name}
              </Link>
            ) : (
              <p className="font-mono text-[11px] text-foreground" title={gate.linkedGateId}>
                {gate.linkedGateId.slice(0, 10)}…{gate.linkedGateId.slice(-6)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Link Status</p>
            <p className="text-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(175,45%,50%)] mr-1.5 align-middle" />
              Linked
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border/50 rounded py-4 flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground/60">Not linked</p>
          <p className="text-[11px] text-muted-foreground/40">
            Gate must be linked to a destination in-game before transit is possible
          </p>
        </div>
      )}
    </section>
  );
}

function PolicyComposerSection({ gate, structures }: { gate: Structure; structures: Structure[] }) {
  const { policy, isLoading: policyLoading } = useGatePolicy(gate.objectId);
  const mutation = useGatePolicyMutation(gate.objectId, gate.ownerCapId);
  const batch = useBatchPresetMutation();
  const { walletAddress } = useConnection();

  const batchTargets: GatePolicyTarget[] = useMemo(
    () =>
      structures
        .filter(
          (s) =>
            s.type === "gate" &&
            s.objectId !== gate.objectId &&
            s.extensionStatus === "authorized",
        )
        .map((s) => ({ gateId: s.objectId, ownerCapId: s.ownerCapId, gateName: s.name })),
    [structures, gate.objectId],
  );

  if (gate.extensionStatus !== "authorized") {
    const isStale = gate.extensionStatus === "stale";
    return (
      <section className="border border-border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Gate Directive</h2>
          <p className="text-[11px] font-mono text-muted-foreground">Policy Configuration</p>
        </div>
        <div className="border border-dashed border-border/50 rounded py-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground/60">
            {isStale ? "Extension bound to old package" : "Extension not authorized"}
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            {isStale
              ? "Re-authorize GateAuth from the Gates list to bind to the current package"
              : "Authorize the CivilizationControl extension to configure gate policies"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-border rounded p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Gate Directive</h2>
        <p className="text-[11px] font-mono text-muted-foreground">Policy Configuration</p>
      </div>

      <TxFeedbackBanner
        status={mutation.status}
        result={mutation.result}
        error={mutation.error}
        onDismiss={mutation.reset}
        successLabel="Directive deployed"
        pendingLabel="Deploying directive…"
      />

      {(batch.status === "success" || batch.status === "error") && (
        <TxFeedbackBanner
          status={batch.status}
          result={batch.result}
          error={batch.error}
          onDismiss={batch.reset}
          successLabel="Preset deployed to all target gates"
          pendingLabel="Deploying preset to gates…"
        />
      )}

      <PolicyPresetEditor
        commercialPreset={policy?.commercialPreset ?? null}
        defensePreset={policy?.defensePreset ?? null}
        isLoading={policyLoading}
        txStatus={mutation.status}
        onSetPreset={mutation.setPreset}
        onRemovePreset={mutation.removePreset}
        batchTargets={batchTargets}
        batchTxStatus={batch.status}
        onBatchApply={batch.deployPreset}
      />

      <TreasuryEditor
        currentTreasury={policy?.treasury ?? null}
        isLoading={policyLoading}
        txStatus={mutation.status}
        defaultAddress={walletAddress ?? undefined}
        onSet={mutation.setTreasury}
      />
    </section>
  );
}

function PowerControlSection({ gate }: { gate: Structure }) {
  const power = useStructurePower();
  const isOnline = gate.status === "online";
  const hasNetworkNode = !!gate.networkNodeId;
  const lastActionLabel = useRef("Gate power state updated");

  if (!hasNetworkNode) {
    return (
      <section className="border border-border rounded p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        <p className="text-xs text-muted-foreground">
          No network node linked — cannot control power state from web.
        </p>
      </section>
    );
  }

  const handleToggle = () => {
    lastActionLabel.current = isOnline ? "Gate taken offline" : "Gate brought online";
    power.toggleSingle({
      structureType: "gate",
      structureId: gate.objectId,
      ownerCapId: gate.ownerCapId,
      networkNodeId: gate.networkNodeId!,
      online: !isOnline,
    });
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        <button
          onClick={handleToggle}
          disabled={power.status === "pending"}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isOnline
              ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
          }`}
        >
          {power.status === "pending"
            ? "Executing…"
            : isOnline
              ? "Take Offline"
              : "Bring Online"}
        </button>
      </div>
      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel={lastActionLabel.current}
          onDismiss={power.reset}
        />
      )}
    </section>
  );
}

function ExtensionSection({ gate }: { gate: Structure }) {
  const { authorizeGates, gateStatus, gateResult, gateError, resetGate } =
    useAuthorizeExtension();
  const queryClient = useQueryClient();
  const needsAuth = gate.extensionStatus !== "authorized";

  const handleReAuth = () => {
    authorizeGates(
      [{ gateId: gate.objectId, ownerCapId: gate.ownerCapId }],
      window.location.origin,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Extension Authority</h2>
        {needsAuth && (
          <button
            onClick={handleReAuth}
            disabled={gateStatus === "pending"}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {gateStatus === "pending"
              ? "Authorizing…"
              : gate.extensionStatus === "stale"
                ? "Re-authorize GateAuth"
                : "Authorize GateAuth"}
          </button>
        )}
      </div>
      {(gateStatus === "success" || gateStatus === "error") && (
        <TxFeedbackBanner
          status={gateStatus}
          result={gateResult}
          error={gateError ?? null}
          successLabel="GateAuth authorized"
          onDismiss={resetGate}
        />
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Extension</p>
          <p className="font-mono text-foreground">
            {gate.extensionStatus === "authorized"
              ? "GateAuth (CivilizationControl)"
              : gate.extensionStatus === "stale"
                ? "Stale — old package"
                : "None"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">OwnerCap</p>
          <p className="font-mono text-[11px] text-foreground truncate" title={gate.ownerCapId}>
            {gate.ownerCapId.slice(0, 10)}…{gate.ownerCapId.slice(-6)}
          </p>
        </div>
      </div>
    </section>
  );
}

function TransitProofSection({ gate }: { gate: Structure }) {
  const { data: linkedGateId, isLoading: linkedLoading } = useLinkedGate(gate.objectId);
  const { policy } = useGatePolicy(gate.objectId);
  const { data: posture } = usePostureState(gate.objectId);
  const { status, result, error, execute, reset } = useTransitProofAction();

  if (gate.extensionStatus !== "authorized") return null;

  const activePosture = posture ?? "commercial";
  const resolved = resolveEffectivePolicy(policy, activePosture, 0);
  const tollLabel = resolved.toll > 0 ? `(${formatLux(resolved.toll)} Lux / ${formatEve(resolved.toll)} EVE)` : "";

  const handleExecute = () => {
    if (!linkedGateId) return;
    execute(gate.objectId, linkedGateId, resolved.toll);
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Transit Proof</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Request a jump permit for your character to generate verifiable transit events
          </p>
        </div>
        <button
          onClick={handleExecute}
          disabled={status === "pending" || linkedLoading || !linkedGateId}
          className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "pending"
            ? "Executing…"
            : `Generate Transit Proof ${tollLabel}`}
        </button>
      </div>

      {linkedLoading && (
        <p className="text-[11px] text-muted-foreground/60 animate-pulse">
          Checking linked gate…
        </p>
      )}

      {!linkedLoading && !linkedGateId && (
        <div className="border border-dashed border-border/50 rounded py-4 flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground/60">
            No linked destination gate
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Gate must be linked to a destination before transit proofs can be generated
          </p>
        </div>
      )}

      {linkedGateId && !linkedLoading && (
        <div className="text-[11px] text-muted-foreground">
          <span className="text-muted-foreground/60">Destination: </span>
          <span className="font-mono">{linkedGateId.slice(0, 10)}…{linkedGateId.slice(-6)}</span>
          <span className="ml-3 text-muted-foreground/60">
            Mode: {activePosture}
          </span>
          {resolved.toll > 0 && (
            <span className="ml-3 text-muted-foreground/60">
              Toll: {formatLux(resolved.toll)} Lux ({formatEve(resolved.toll)} EVE)
            </span>
          )}
        </div>
      )}

      {(status === "success" || status === "error") && (
        <TxFeedbackBanner
          status={status}
          result={result}
          error={error}
          successLabel="Transit proof generated — check Signal Feed"
          onDismiss={reset}
        />
      )}
    </section>
  );
}
