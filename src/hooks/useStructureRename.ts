import { useCallback, useState } from "react";

import { useCharacterId } from "@/hooks/useCharacter";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import {
  useStructureWriteRefresh,
  type StructureWriteRefreshOptions,
} from "@/hooks/useStructureWriteRefresh";
import { buildStructureRenameTx } from "@/lib/structureMetadataTx";
import type { ObjectId, StructureType, TxResult, TxStatus } from "@/types/domain";

interface RenameStructureParams {
  structureType: StructureType;
  structureId: ObjectId;
  ownerCapId: ObjectId;
  name: string;
}

function friendlyError(raw: string): string {
  if (raw.includes("EMetadataNotSet")) return "Structure metadata is not initialized for rename.";
  if (raw.includes("NotAuthorized")) return "OwnerCap does not match this structure.";
  return raw;
}

export function useStructureRename() {
  const executeTx = useSponsoredExecution();
  const refreshAfterWrite = useStructureWriteRefresh();
  const characterId = useCharacterId();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rename = useCallback(
    async (params: RenameStructureParams, refreshOptions?: StructureWriteRefreshOptions) => {
      if (!characterId) throw new Error("Character not resolved yet — please wait");

      const trimmedName = params.name.trim();
      if (trimmedName.length === 0) {
        throw new Error("Name cannot be empty.");
      }

      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        const tx = buildStructureRenameTx({
          ...params,
          name: trimmedName,
          characterId,
        });
        const { digest } = await executeTx(tx);
        await refreshAfterWrite(refreshOptions);
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
    [characterId, executeTx, refreshAfterWrite],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, rename, reset };
}