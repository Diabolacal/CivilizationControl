/**
 * useStructurePower — Generic hook for structure online/offline operations.
 *
 * Supports single and batch operations for gates, turrets, SSUs, and
 * network nodes. Wraps the PTB builders in structurePowerTx.ts.
 */

import { useCallback, useState } from "react";
import type { Transaction } from "@mysten/sui/transactions";

import {
  buildAssemblyPowerTx,
  buildBatchAssemblyPowerTx,
  buildNodeOfflineTx,
  buildNodeOnlineTx,
  type NodeOfflineChildTarget,
} from "@/lib/structurePowerTx";
import { useCharacterId } from "@/hooks/useCharacter";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import { useStructureWriteReconciliation } from "@/hooks/useStructureWriteReconciliation";
import {
  useStructureWriteRefresh,
  type StructureWriteRefreshOptions,
} from "@/hooks/useStructureWriteRefresh";
import type { ObjectId, StructureActionTargetType, TxStatus, TxResult } from "@/types/domain";

type AssemblyPowerStructureType = Exclude<StructureActionTargetType, "network_node">;

interface SinglePowerParams {
  structureType: AssemblyPowerStructureType;
  structureId: ObjectId;
  ownerCapId: ObjectId;
  networkNodeId: ObjectId;
  online: boolean;
}

interface BatchPowerParams {
  structureType: AssemblyPowerStructureType;
  targets: { structureId: ObjectId; ownerCapId: ObjectId; networkNodeId: ObjectId }[];
  online: boolean;
}

interface NodeOnlineParams {
  nodeId: ObjectId;
  ownerCapId: ObjectId;
}

interface NodeOfflineParams {
  nodeId: ObjectId;
  ownerCapId: ObjectId;
  connectedAssemblies: NodeOfflineChildTarget[];
}

/** Map known Move abort strings to user-friendly messages. */
function friendlyError(raw: string): string {
  if (raw.includes("ENetworkNodeMismatch")) return "Wrong network node — structure may have moved.";
  if (raw.includes("EAssemblyInvalidStatus")) return "Structure is already in the target state.";
  if (raw.includes("ENotOnline")) return "Structure is not online.";
  if (raw.includes("ENoFuelToBurn")) return "No fuel deposited — node cannot come online.";
  if (raw.includes("NotAuthorized")) return "OwnerCap does not match this structure.";
  return raw;
}

export function useStructurePower() {
  const executeTx = useSponsoredExecution();
  const characterId = useCharacterId();
  const { reconcileWrite } = useStructureWriteReconciliation();
  const refreshAfterWrite = useStructureWriteRefresh();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      buildTx: () => Transaction,
      desiredStatus: "online" | "offline",
      refreshOptions?: StructureWriteRefreshOptions,
    ) => {
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildTx();
        const { digest } = await executeTx(tx);
        if (refreshOptions?.target || refreshOptions?.targets?.length) {
          reconcileWrite({
            action: "power",
            digest,
            target: refreshOptions.target,
            targets: refreshOptions.targets,
            desiredStatus,
            refreshOptions,
          });
        } else {
          await refreshAfterWrite(refreshOptions);
        }
        setResult({ digest });
        setStatus("success");
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(friendlyError(message));
        setStatus("error");
        return false;
      }
    },
    [executeTx, reconcileWrite, refreshAfterWrite],
  );

  const toggleSingle = useCallback(
    (params: SinglePowerParams, refreshOptions?: StructureWriteRefreshOptions) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(
        () => buildAssemblyPowerTx({ ...params, characterId }),
        params.online ? "online" : "offline",
        refreshOptions,
      );
    },
    [execute, characterId],
  );

  const toggleBatch = useCallback(
    (params: BatchPowerParams, refreshOptions?: StructureWriteRefreshOptions) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(
        () => buildBatchAssemblyPowerTx({ ...params, characterId }),
        params.online ? "online" : "offline",
        refreshOptions,
      );
    },
    [execute, characterId],
  );

  const bringNodeOnline = useCallback(
    (params: NodeOnlineParams, refreshOptions?: StructureWriteRefreshOptions) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildNodeOnlineTx({ ...params, characterId }), "online", refreshOptions);
    },
    [execute, characterId],
  );

  const bringNodeOffline = useCallback(
    (params: NodeOfflineParams, refreshOptions?: StructureWriteRefreshOptions) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(
        () => buildNodeOfflineTx({ ...params, characterId }),
        "offline",
        refreshOptions,
      );
    },
    [execute, characterId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, toggleSingle, toggleBatch, bringNodeOnline, bringNodeOffline, reset };
}
