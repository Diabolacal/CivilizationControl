/**
 * GateDetailScreen — Individual gate governance view.
 *
 * Hierarchy: identity + power control → directive/policy → setup.
 * Setup utilities (treasury, DApp URL, extension authority) are collapsed.
 * Infrastructure context and topology are excluded from this surface.
 */

import { useParams, Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { StructureDetailHeader } from "@/components/StructureDetailHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PolicyPresetEditor } from "@/components/PolicyPresetEditor";
import { TreasuryEditor } from "@/components/TreasuryEditor";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useGatePolicy } from "@/hooks/useGatePolicy";
import { useGatePolicyMutation, useBatchPresetMutation } from "@/hooks/useGatePolicyMutation";
import { useStructurePower } from "@/hooks/useStructurePower";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useConnection } from "@evefrontier/dapp-kit";
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
  const power = useStructurePower();
  const lastPowerLabel = useRef("Gate power state updated");
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

  const isOnline = gate.status === "online";
  const hasNetworkNode = !!gate.networkNodeId;

  const handlePowerToggle = () => {
    lastPowerLabel.current = isOnline ? "Gate taken offline" : "Gate brought online";
    power.toggleSingle({
      structureType: "gate",
      structureId: gate.objectId,
      ownerCapId: gate.ownerCapId,
      networkNodeId: gate.networkNodeId!,
      online: !isOnline,
    });
  };

  const powerControl = hasNetworkNode ? (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-[10px] uppercase tracking-wider ${isOnline ? "text-teal-500/50" : "text-muted-foreground/40"}`}>
        {isOnline ? "Online" : "Offline"}
      </span>
      <button
        onClick={handlePowerToggle}
        disabled={power.status === "pending"}
        className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isOnline
            ? "border border-red-500/20 text-red-400/70 hover:bg-red-500/10"
            : "border border-teal-500/20 text-teal-400/70 hover:bg-teal-500/10"
        }`}
      >
        {power.status === "pending" ? "\u2026" : isOnline ? "Power Off" : "Power On"}
      </button>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={gate} solarSystemName={solarSystemName} headerRight={powerControl} />

      {(power.status === "success" || power.status === "error") && (
        <TxFeedbackBanner
          status={power.status}
          result={power.result}
          error={power.error}
          successLabel={lastPowerLabel.current}
          onDismiss={power.reset}
        />
      )}

      {/* Gate Directive — primary surface */}
      <PolicyComposerSection gate={gate} structures={structures} />

      {/* Setup — secondary configuration */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-1">Setup</p>
        <TreasurySetupSection gate={gate} />
        <InGameDAppUrlSection gate={gate} />
        <ExtensionSection gate={gate} />
      </div>
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
    <CollapsibleSection title="In-Game DApp URL" subtitle="Set once per gate">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Set this URL on-chain so players see the permit page when interacting with this gate.
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
      </div>
    </CollapsibleSection>
  );
}

function PolicyComposerSection({ gate, structures }: { gate: Structure; structures: Structure[] }) {
  const { policy, isLoading: policyLoading } = useGatePolicy(gate.objectId);
  const mutation = useGatePolicyMutation(gate.objectId, gate.ownerCapId);
  const batch = useBatchPresetMutation();

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
        <h2 className="text-sm font-semibold text-foreground">Gate Directive</h2>
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
      <h2 className="text-sm font-semibold text-foreground">Gate Directive</h2>

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

    </section>
  );
}

function TreasurySetupSection({ gate }: { gate: Structure }) {
  const { policy, isLoading } = useGatePolicy(gate.objectId);
  const mutation = useGatePolicyMutation(gate.objectId, gate.ownerCapId);
  const { walletAddress } = useConnection();

  return (
    <CollapsibleSection title="Treasury" subtitle={policy?.treasury ? "Configured" : "Not set"}>
      <TreasuryEditor
        currentTreasury={policy?.treasury ?? null}
        isLoading={isLoading}
        txStatus={mutation.status}
        defaultAddress={walletAddress ?? undefined}
        onSet={mutation.setTreasury}
      />
      {(mutation.status === "success" || mutation.status === "error") && (
        <div className="mt-3">
          <TxFeedbackBanner
            status={mutation.status}
            result={mutation.result}
            error={mutation.error}
            successLabel="Treasury updated"
            onDismiss={mutation.reset}
          />
        </div>
      )}
    </CollapsibleSection>
  );
}

function ExtensionSection({ gate }: { gate: Structure }) {
  const { authorizeGates, gateStatus, gateResult, gateError, resetGate } =
    useAuthorizeExtension();
  const queryClient = useQueryClient();
  const needsAuth = gate.extensionStatus !== "authorized";

  const statusLabel = gate.extensionStatus === "authorized"
    ? "Active"
    : gate.extensionStatus === "stale"
      ? "Needs re-authorization"
      : "Not authorized";

  const handleReAuth = () => {
    authorizeGates(
      [{ gateId: gate.objectId, ownerCapId: gate.ownerCapId }],
      window.location.origin,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
    });
  };

  return (
    <CollapsibleSection
      title="Extension Authority"
      subtitle={statusLabel}
      defaultOpen={needsAuth}
      headerRight={
        needsAuth ? (
          <span className="text-[10px] font-medium text-amber-400">Action needed</span>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {needsAuth && (
          <button
            onClick={handleReAuth}
            disabled={gateStatus === "pending"}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {gateStatus === "pending"
              ? "Authorizing…"
              : gate.extensionStatus === "stale"
                ? "Re-authorize"
                : "Authorize"}
          </button>
        )}
        {(gateStatus === "success" || gateStatus === "error") && (
          <TxFeedbackBanner
            status={gateStatus}
            result={gateResult}
            error={gateError ?? null}
            successLabel="Extension authorized"
            onDismiss={resetGate}
          />
        )}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Control Module</p>
            <p className="font-mono text-foreground">
              {gate.extensionStatus === "authorized"
                ? "CivilizationControl"
                : gate.extensionStatus === "stale"
                  ? "Stale — needs rebind"
                  : "None"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Owner Capability</p>
            <p className="font-mono text-[11px] text-muted-foreground truncate" title={gate.ownerCapId}>
              {gate.ownerCapId.slice(0, 10)}…{gate.ownerCapId.slice(-6)}
            </p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// Transit Proof section removed from main gate detail surface.
// The underlying hooks and tx builders remain available in:
//   src/hooks/useTransitProof.ts
//   src/lib/transitProofTx.ts
// To re-enable, import the hooks and render a TransitProofSection component.
//
// Excluded because: (1) confusing for demo/judges, (2) fires user-wallet tx
// (not sponsored), (3) requires linked destination which may surface errors,
// (4) demo beat sheet frames toll collection via post-prod, not live gate page.
