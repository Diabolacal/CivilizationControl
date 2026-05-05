import { useCallback, useEffect, useState } from "react";

import {
  loadNodePowerPresetSlots,
  saveNodePowerPresetSlots,
  upsertNodePowerPresetSlot,
  type NodePowerPresetSlot,
} from "@/lib/nodePowerPresets";

import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

interface UseNodePowerPresetsArgs {
  nodeId: string | null;
  scopeKey: string | null;
  structures: readonly NodeLocalStructure[];
}

function emptySlots(): Array<NodePowerPresetSlot | null> {
  return [null, null, null, null];
}

export function useNodePowerPresets({ nodeId, scopeKey, structures }: UseNodePowerPresetsArgs) {
  const [slots, setSlots] = useState<Array<NodePowerPresetSlot | null>>(emptySlots);
  const [loadedStorageIdentity, setLoadedStorageIdentity] = useState<string | null>(null);
  const storageIdentity = nodeId ? `${scopeKey ?? "session"}:${nodeId}` : null;

  useEffect(() => {
    if (!nodeId || !storageIdentity) {
      setSlots(emptySlots());
      setLoadedStorageIdentity(null);
      return;
    }

    setSlots(loadNodePowerPresetSlots(nodeId, scopeKey));
    setLoadedStorageIdentity(storageIdentity);
  }, [nodeId, scopeKey, storageIdentity]);

  useEffect(() => {
    if (!nodeId || !storageIdentity || loadedStorageIdentity !== storageIdentity) return;
    saveNodePowerPresetSlots(nodeId, scopeKey, slots);
  }, [loadedStorageIdentity, nodeId, scopeKey, slots, storageIdentity]);

  const savePreset = useCallback((slotIndex: number, label: string) => {
    if (!nodeId) return;
    setSlots((current) => upsertNodePowerPresetSlot(current, {
      label,
      nodeId,
      slotIndex,
      structures,
    }));
  }, [nodeId, structures]);

  return { slots, savePreset };
}