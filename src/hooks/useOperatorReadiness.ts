/**
 * useOperatorReadiness — Evaluates whether the posture switch is executable.
 *
 * Checks:
 *   1. Wallet connected
 *   2. Turret extension status (how many authorized vs not)
 *   3. Gates and SSUs extension status
 *
 * Returns a structured readiness report consumed by PostureControl
 * to gate the switch button and surface specific blockers.
 */

import { useMemo } from "react";
import { isExtensionAuthorizationAttentionStatus } from "@/lib/extensionStatus";
import type { NetworkNodeGroup } from "@/types/domain";

export interface ReadinessBlocker {
  key: string;
  label: string;
  severity: "error" | "warning";
  /** Optional route to navigate for resolving this blocker. */
  link?: string;
}

export interface OperatorReadiness {
  /** True when all checks pass — posture switch can execute. */
  isReady: boolean;
  /** Ordered list of blockers (empty when ready). */
  blockers: ReadinessBlocker[];
  /** Turret extension summary. */
  turrets: {
    total: number;
    authorized: number;
    unauthorized: number;
  };
}

export function useOperatorReadiness(
  nodeGroups: NetworkNodeGroup[],
  isConnected: boolean,
): OperatorReadiness {
  return useMemo(() => {
    const blockers: ReadinessBlocker[] = [];

    // ── Wallet check ──
    if (!isConnected) {
      blockers.push({
        key: "wallet",
        label: "Connect wallet to enable posture control",
        severity: "error",
      });
    }

    // ── Turret extension check ──
    const allTurrets = nodeGroups.flatMap((g) => g.turrets);
    const authorized = allTurrets.filter((t) => t.extensionStatus === "authorized").length;
    const unauthorized = allTurrets.filter((t) => isExtensionAuthorizationAttentionStatus(t.extensionStatus)).length;

    if (unauthorized > 0) {
      blockers.push({
        key: "turret-ext",
        label: `${unauthorized} turret${unauthorized > 1 ? "s" : ""} will be rebound to the selected doctrine during switch`,
        severity: "warning",
        link: "/turrets",
      });
    }

    // ── Gate extension check ──
    const allGates = nodeGroups.flatMap((g) => g.gates);
    const gatesUnauth = allGates.filter((g) => isExtensionAuthorizationAttentionStatus(g.extensionStatus)).length;
    if (gatesUnauth > 0) {
      blockers.push({
        key: "gate-ext",
        label: `${gatesUnauth} gate${gatesUnauth > 1 ? "s" : ""} missing GateAuth extension`,
        severity: "warning",
        link: "/gates",
      });
    }

    return {
      isReady: blockers.every((b) => b.severity !== "error"),
      blockers,
      turrets: { total: allTurrets.length, authorized, unauthorized },
    };
  }, [nodeGroups, isConnected]);
}
