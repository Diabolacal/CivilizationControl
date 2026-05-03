/**
 * useStructurePower — Generic hook for structure online/offline operations.
 *
 * Supports single and batch operations for gates, turrets, SSUs, and
 * network nodes. Wraps the PTB builders in structurePowerTx.ts.
 */

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildAssemblyPowerTx,
  buildBatchAssemblyPowerTx,
  buildNodeOnlineTx,
} from "@/lib/structurePowerTx";
import { useCharacterId } from "@/hooks/useCharacter";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import type { ObjectId, StructureType, TxStatus, TxResult } from "@/types/domain";

interface SinglePowerParams {
  structureType: StructureType;
  structureId: ObjectId;
  ownerCapId: ObjectId;
  networkNodeId: ObjectId;
  online: boolean;
}

interface BatchPowerParams {
  structureType: StructureType;
  targets: { structureId: ObjectId; ownerCapId: ObjectId; networkNodeId: ObjectId }[];
  online: boolean;
}

interface NodeOnlineParams {
  nodeId: ObjectId;
  ownerCapId: ObjectId;
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
  const queryClient = useQueryClient();
  const characterId = useCharacterId();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (buildTx: () => ReturnType<typeof buildAssemblyPowerTx>) => {
      setStatus("pending");
      setError(null);
      setResult(null);
      try {
        const tx = buildTx();
        const { digest } = await executeTx(tx);
        setResult({ digest });
        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["assetDiscovery"] });
        queryClient.invalidateQueries({ queryKey: ["operatorInventory"] });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(friendlyError(message));
        setStatus("error");
        return false;
      }
    },
    [executeTx, queryClient],
  );

  const toggleSingle = useCallback(
    (params: SinglePowerParams) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildAssemblyPowerTx({ ...params, characterId }));
    },
    [execute, characterId],
  );

  const toggleBatch = useCallback(
    (params: BatchPowerParams) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildBatchAssemblyPowerTx({ ...params, characterId }));
    },
    [execute, characterId],
  );

  const bringNodeOnline = useCallback(
    (params: NodeOnlineParams) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");
      return execute(() => buildNodeOnlineTx({ ...params, characterId }));
    },
    [execute, characterId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, toggleSingle, toggleBatch, bringNodeOnline, reset };
}
