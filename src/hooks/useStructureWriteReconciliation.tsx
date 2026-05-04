import { useConnection } from "@evefrontier/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useStructureWriteRefresh, type StructureWriteRefreshOptions } from "@/hooks/useStructureWriteRefresh";
import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import {
  applyStructureWriteOverlaysToNodeAssembliesLookup,
  applyStructureWriteOverlaysToNodeGroups,
  applyStructureWriteOverlaysToStructures,
  buildStructureWriteOverlayKey,
  createPendingStructureWriteOverlay,
  resolveStructureWriteConfirmation,
  STRUCTURE_WRITE_RETRY_DELAYS_MS,
  type PendingStructureWriteOverlay,
  type StructureWriteDebugController,
  type StructureWriteTarget,
} from "@/lib/structureWriteReconciliation";
import { normalizeOperatorInventoryWalletAddress } from "@/lib/operatorInventoryClient";
import type { NetworkNodeGroup, Structure, StructureStatus } from "@/types/domain";
import type { OperatorInventoryResponse } from "@/types/operatorInventory";

interface ReconcileStructureWriteInput {
  action: "rename" | "power";
  digest?: string | null;
  target: StructureWriteTarget;
  desiredName?: string | null;
  desiredStatus?: StructureStatus | null;
  refreshOptions?: StructureWriteRefreshOptions;
}

interface StructureWriteReconciliationContextValue {
  applyStructures: (structures: Structure[]) => Structure[];
  applyNodeGroups: (nodeGroups: NetworkNodeGroup[]) => NetworkNodeGroup[];
  applyNodeAssembliesLookup: (lookup: NodeAssembliesLookupResult | null | undefined) => NodeAssembliesLookupResult | null;
  reconcileWrite: (input: ReconcileStructureWriteInput) => void;
}

const StructureWriteReconciliationContext = createContext<StructureWriteReconciliationContextValue | null>(null);

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isStructureWriteDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const value = new URLSearchParams(window.location.search).get("debugStructureWrites");
  if (value == null) {
    return false;
  }

  return value !== "0" && value.toLowerCase() !== "false";
}

export function StructureWriteReconciliationProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const refreshAfterWrite = useStructureWriteRefresh();
  const { walletAddress } = useConnection();
  const normalizedWalletAddress = normalizeOperatorInventoryWalletAddress(walletAddress);
  const [overlaysByKey, setOverlaysByKey] = useState<Record<string, PendingStructureWriteOverlay>>({});
  const overlays = useMemo(() => Object.values(overlaysByKey), [overlaysByKey]);
  const debugEnabled = useMemo(() => isStructureWriteDebugEnabled(), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!debugEnabled) {
      if (window.__CC_STRUCTURE_WRITE_DEBUG__) {
        window.__CC_STRUCTURE_WRITE_DEBUG__.clear();
      }
      return;
    }

    const controller: StructureWriteDebugController = window.__CC_STRUCTURE_WRITE_DEBUG__ ?? {
      enabled: true,
      latest: null,
      clear: () => {
        if (!window.__CC_STRUCTURE_WRITE_DEBUG__) {
          return;
        }

        window.__CC_STRUCTURE_WRITE_DEBUG__.latest = null;
      },
    };

    controller.enabled = true;
    controller.latest = overlays.map((overlay) => ({
      ...overlay,
      latestAction: overlay.pendingStatus != null ? "power" : "rename",
    }));
    window.__CC_STRUCTURE_WRITE_DEBUG__ = controller;
  }, [debugEnabled, overlays]);

  const applyStructures = useCallback(
    (structures: Structure[]) => applyStructureWriteOverlaysToStructures(structures, overlays),
    [overlays],
  );

  const applyNodeGroups = useCallback(
    (nodeGroups: NetworkNodeGroup[]) => applyStructureWriteOverlaysToNodeGroups(nodeGroups, overlays),
    [overlays],
  );

  const applyNodeAssembliesLookup = useCallback(
    (lookup: NodeAssembliesLookupResult | null | undefined) => applyStructureWriteOverlaysToNodeAssembliesLookup(lookup, overlays),
    [overlays],
  );

  const reconcileWrite = useCallback(
    (input: ReconcileStructureWriteInput) => {
      const overlayKey = buildStructureWriteOverlayKey(input.target);

      setOverlaysByKey((current) => ({
        ...current,
        [overlayKey]: createPendingStructureWriteOverlay(input, current[overlayKey] ?? null),
      }));

      void (async () => {
        for (let attemptIndex = 0; attemptIndex < STRUCTURE_WRITE_RETRY_DELAYS_MS.length; attemptIndex += 1) {
          const delayMs = STRUCTURE_WRITE_RETRY_DELAYS_MS[attemptIndex];
          if (delayMs > 0) {
            await waitFor(delayMs);
          }

          await refreshAfterWrite(input.refreshOptions);

          setOverlaysByKey((current) => {
            const existing = current[overlayKey];
            if (!existing) {
              return current;
            }

            const normalizedNodeId = normalizeCanonicalObjectId(
              input.refreshOptions?.selectedNodeId ?? existing.networkNodeId ?? null,
            );
            const operatorInventory = normalizedWalletAddress
              ? queryClient.getQueryData<OperatorInventoryResponse>(["operatorInventory", normalizedWalletAddress])
              : null;
            const nodeLookup = normalizedNodeId
              ? queryClient.getQueryData<NodeAssembliesLookupResult>(["nodeAssemblies", normalizedNodeId])
              : null;
            const confirmation = resolveStructureWriteConfirmation(operatorInventory, nodeLookup, existing);
            const nextOverlay: PendingStructureWriteOverlay = {
              ...existing,
              pendingName: confirmation.nameConfirmed ? null : existing.pendingName,
              pendingStatus: confirmation.statusConfirmed ? null : existing.pendingStatus,
              refreshAttempts: attemptIndex + 1,
              operatorInventoryConfirmed: confirmation.operatorInventoryConfirmed,
              nodeAssembliesConfirmed: confirmation.nodeAssembliesConfirmed,
              timedOut: attemptIndex === STRUCTURE_WRITE_RETRY_DELAYS_MS.length - 1,
            };

            if (nextOverlay.pendingName == null && nextOverlay.pendingStatus == null) {
              const next = { ...current };
              delete next[overlayKey];
              return next;
            }

            return {
              ...current,
              [overlayKey]: nextOverlay,
            };
          });
        }
      })().catch(() => {
        setOverlaysByKey((current) => {
          const existing = current[overlayKey];
          if (!existing) {
            return current;
          }

          return {
            ...current,
            [overlayKey]: {
              ...existing,
              refreshAttempts: STRUCTURE_WRITE_RETRY_DELAYS_MS.length,
              timedOut: true,
            },
          };
        });
      });
    },
    [normalizedWalletAddress, queryClient, refreshAfterWrite],
  );

  const value = useMemo<StructureWriteReconciliationContextValue>(() => ({
    applyStructures,
    applyNodeGroups,
    applyNodeAssembliesLookup,
    reconcileWrite,
  }), [applyNodeAssembliesLookup, applyNodeGroups, applyStructures, reconcileWrite]);

  return (
    <StructureWriteReconciliationContext.Provider value={value}>
      {children}
    </StructureWriteReconciliationContext.Provider>
  );
}

export function useStructureWriteReconciliation() {
  const context = useContext(StructureWriteReconciliationContext);
  if (!context) {
    throw new Error("useStructureWriteReconciliation must be used within StructureWriteReconciliationProvider.");
  }

  return context;
}