import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadNodeDrilldownLayoutOverrides,
  saveNodeDrilldownLayoutOverrides,
  setNodeDrilldownLayoutOverride,
  type NodeDrilldownLayoutPosition,
  type NodeDrilldownLayoutOverrides,
} from "@/lib/nodeDrilldownLayoutOverrides";

interface UseNodeDrilldownLayoutOverridesArgs {
  nodeId: string | null;
  scopeKey: string | null;
}

export function useNodeDrilldownLayoutOverrides({ nodeId, scopeKey }: UseNodeDrilldownLayoutOverridesArgs) {
  const [positions, setPositions] = useState<NodeDrilldownLayoutOverrides>({});
  const [loadedStorageIdentity, setLoadedStorageIdentity] = useState<string | null>(null);
  const storageIdentity = nodeId ? `${scopeKey ?? "session"}:${nodeId}` : null;

  useEffect(() => {
    if (!nodeId || !storageIdentity) {
      setPositions({});
      setLoadedStorageIdentity(null);
      return;
    }

    setPositions(loadNodeDrilldownLayoutOverrides(nodeId, scopeKey));
    setLoadedStorageIdentity(storageIdentity);
  }, [nodeId, scopeKey, storageIdentity]);

  useEffect(() => {
    if (!nodeId || !storageIdentity || loadedStorageIdentity !== storageIdentity) return;
    saveNodeDrilldownLayoutOverrides(nodeId, scopeKey, positions);
  }, [loadedStorageIdentity, nodeId, positions, scopeKey, storageIdentity]);

  const hasManualLayout = useMemo(() => Object.keys(positions).length > 0, [positions]);

  const setStructurePosition = useCallback((canonicalDomainKey: string, position: NodeDrilldownLayoutPosition) => {
    setPositions((current) => setNodeDrilldownLayoutOverride(current, canonicalDomainKey, position));
  }, []);

  const resetLayout = useCallback(() => setPositions({}), []);

  return { positions, hasManualLayout, setStructurePosition, resetLayout };
}