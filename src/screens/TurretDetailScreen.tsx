/**
 * TurretDetailScreen — Individual turret governance view.
 *
 * Shows turret status, power control, extension state, and
 * parent network node association.
 */

import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { StructureDetailHeader } from "@/components/StructureDetailHeader";
import { NodeContextBanner } from "@/components/NodeContextBanner";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useStructureSurfaceActions } from "@/hooks/useStructureSurfaceActions";
import { getSpatialPin } from "@/lib/spatialPins";
import type { Structure } from "@/types/domain";

interface TurretDetailScreenProps {
  structures: Structure[];
  isLoading: boolean;
}

export function TurretDetailScreen({ structures, isLoading }: TurretDetailScreenProps) {
  const { id } = useParams<{ id: string }>();
  const actions = useStructureSurfaceActions();
  const turret = structures.find((s) => s.objectId === id && s.type === "turret");

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">Loading turret…</p>
      </div>
    );
  }

  if (!turret) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="border border-dashed border-border rounded py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground/60">Turret not found</p>
          <p className="text-[11px] text-muted-foreground/40">Object may have been removed or is not owned by this wallet</p>
        </div>
      </div>
    );
  }

  const solarSystemName = turret.networkNodeId
    ? (() => {
        const parentNode = structures.find(
          (s) => s.objectId === turret.networkNodeId && s.type === "network_node",
        );
        const pin = parentNode ? getSpatialPin(parentNode.objectId) : undefined;
        return pin?.solarSystemName;
      })()
    : undefined;

  return (
    <div className="space-y-6">
      <BackLink />
      <StructureDetailHeader structure={turret} solarSystemName={solarSystemName} />
      <NodeContextBanner structure={turret} structures={structures} />
      <PowerControlSection turret={turret} actions={actions} />
      <ExtensionSection turret={turret} />

      {(actions.rename.status === "success" || actions.rename.status === "error") && (
        <TxFeedbackBanner
          status={actions.rename.status}
          result={actions.rename.result}
          error={actions.rename.error}
          successLabel={actions.renameSuccessLabel}
          onDismiss={actions.dismissRenameFeedback}
        />
      )}

      {actions.renderContextMenu}
      {actions.renderRenameDialog}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/turrets"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All Turrets
    </Link>
  );
}

function PowerControlSection({
  turret,
  actions,
}: {
  turret: Structure;
  actions: ReturnType<typeof useStructureSurfaceActions>;
}) {
  const isOnline = turret.status === "online";
  const hasNetworkNode = !!turret.networkNodeId;

  if (!hasNetworkNode) {
    return (
      <section className="border border-border rounded p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            No network node linked — cannot control power state from web.
          </p>
          <button
            type="button"
            onClick={(event) => actions.openStructureContextMenuFromElement(turret, event.currentTarget)}
            className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Actions
          </button>
        </div>
      </section>
    );
  }

  const handleToggle = () => {
    void actions.executePowerAction(turret, !isOnline);
  };

  return (
    <section className="border border-border rounded p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Power State</h2>
        <button
          onClick={handleToggle}
          disabled={actions.power.status === "pending"}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isOnline
              ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
          }`}
        >
          {actions.power.status === "pending"
            ? "Executing…"
            : isOnline
              ? "Take Offline"
              : "Bring Online"}
        </button>
        <button
          type="button"
          onClick={(event) => actions.openStructureContextMenuFromElement(turret, event.currentTarget)}
          className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          Actions
        </button>
      </div>
      {(actions.power.status === "success" || actions.power.status === "error") && (
        <TxFeedbackBanner
          status={actions.power.status}
          result={actions.power.result}
          error={actions.power.error}
          successLabel={actions.powerSuccessLabel}
          onDismiss={actions.dismissPowerFeedback}
        />
      )}
    </section>
  );
}

function ExtensionSection({ turret }: { turret: Structure }) {
  return (
    <section className="border border-border rounded p-5 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Extension Authority</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Extension</p>
          <p className="font-mono text-foreground">
            {turret.extensionStatus === "authorized"
              ? "CC Extension Active"
              : turret.extensionStatus === "stale"
                ? "Stale — old package"
                : "None"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">OwnerCap</p>
          <p className="font-mono text-[11px] text-foreground truncate" title={turret.ownerCapId}>
            {turret.ownerCapId.slice(0, 10)}…{turret.ownerCapId.slice(-6)}
          </p>
        </div>
      </div>
    </section>
  );
}
