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
import { TribeRuleEditor } from "@/components/TribeRuleEditor";
import { CoinTollEditor } from "@/components/CoinTollEditor";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useGatePolicy } from "@/hooks/useGatePolicy";
import { useGatePolicyMutation } from "@/hooks/useGatePolicyMutation";
import { useStructurePower } from "@/hooks/useStructurePower";
import { useAuthorizeExtension } from "@/hooks/useAuthorizeExtension";
import { useAdminCapOwner } from "@/hooks/useAdminCapOwner";
import { useLinkedGate, useTransitProofAction } from "@/hooks/useTransitProof";
import { useConnection } from "@evefrontier/dapp-kit";
import { formatLux } from "@/lib/currency";
import type { Structure } from "@/types/domain";

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

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={gate} />
      <PowerControlSection gate={gate} />
      <PolicyComposerSection gate={gate} />
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

function PolicyComposerSection({ gate }: { gate: Structure }) {
  const { policy, isLoading: policyLoading } = useGatePolicy(gate.objectId);
  const mutation = useGatePolicyMutation(gate.objectId);
  const { walletAddress } = useConnection();
  const { data: adminCapOwner } = useAdminCapOwner();

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

  const adminCapMismatch =
    adminCapOwner != null &&
    walletAddress != null &&
    adminCapOwner.toLowerCase() !== walletAddress.toLowerCase();

  if (adminCapMismatch) {
    return (
      <section className="border border-border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Gate Directive</h2>
          <p className="text-[11px] font-mono text-muted-foreground">Policy Configuration</p>
        </div>
        <div className="border border-dashed border-red-500/30 rounded py-8 flex flex-col items-center gap-2">
          <p className="text-sm text-red-400/80">
            AdminCap owned by a different wallet
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Transfer the GateControl AdminCap to this wallet before configuring policies
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

      <TribeRuleEditor
        currentRule={policy?.tribeRule ?? null}
        isLoading={policyLoading}
        txStatus={mutation.status}
        onSet={mutation.setTribeRule}
        onRemove={mutation.removeTribeRule}
      />

      <CoinTollEditor
        currentRule={policy?.coinTollRule ?? null}
        isLoading={policyLoading}
        txStatus={mutation.status}
        defaultTreasury={walletAddress ?? undefined}
        onSet={mutation.setCoinToll}
        onRemove={mutation.removeCoinToll}
      />
    </section>
  );
}

function PowerControlSection({ gate }: { gate: Structure }) {
  const power = useStructurePower();
  const isOnline = gate.status === "online";
  const hasNetworkNode = !!gate.networkNodeId;

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
          successLabel={isOnline ? "Gate taken offline" : "Gate brought online"}
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
    authorizeGates([{ gateId: gate.objectId, ownerCapId: gate.ownerCapId }]).then(() => {
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
  const { status, result, error, execute, reset } = useTransitProofAction();

  if (gate.extensionStatus !== "authorized") return null;

  const hasToll = !!policy?.coinTollRule;
  const tollLabel = hasToll
    ? `(${formatLux(policy!.coinTollRule!.price)} Lux toll)`
    : "";

  const handleExecute = () => {
    if (!linkedGateId) return;
    execute(gate.objectId, linkedGateId, policy);
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
          {policy?.tribeRule && (
            <span className="ml-3 text-muted-foreground/60">
              Tribe rule: {policy.tribeRule.tribe}
            </span>
          )}
          {hasToll && (
            <span className="ml-3 text-muted-foreground/60">
              Toll: {formatLux(policy!.coinTollRule!.price)} Lux
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
