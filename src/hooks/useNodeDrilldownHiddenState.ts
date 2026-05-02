import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadNodeDrilldownHiddenCanonicalKeys,
  partitionNodeDrilldownStructures,
  saveNodeDrilldownHiddenCanonicalKeys,
} from "@/lib/nodeDrilldownHiddenState";

import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

interface UseNodeDrilldownHiddenStateArgs {
  nodeId: string | null;
  scopeKey: string | null;
  structures: readonly NodeLocalStructure[];
}

export function useNodeDrilldownHiddenState({
  nodeId,
  scopeKey,
  structures,
}: UseNodeDrilldownHiddenStateArgs) {
  const [hiddenCanonicalKeys, setHiddenCanonicalKeys] = useState<string[]>([]);
  const [loadedStorageIdentity, setLoadedStorageIdentity] = useState<string | null>(null);
  const storageIdentity = nodeId ? `${scopeKey ?? "session"}:${nodeId}` : null;

  useEffect(() => {
    if (!nodeId || !storageIdentity) {
      setHiddenCanonicalKeys([]);
      setLoadedStorageIdentity(null);
      return;
    }

    setHiddenCanonicalKeys(loadNodeDrilldownHiddenCanonicalKeys(nodeId, scopeKey));
    setLoadedStorageIdentity(storageIdentity);
  }, [nodeId, scopeKey, storageIdentity]);

  useEffect(() => {
    if (!nodeId || !storageIdentity || loadedStorageIdentity !== storageIdentity) return;
    saveNodeDrilldownHiddenCanonicalKeys(nodeId, scopeKey, hiddenCanonicalKeys);
  }, [hiddenCanonicalKeys, loadedStorageIdentity, nodeId, scopeKey, storageIdentity]);

  const hiddenCanonicalKeySet = useMemo(
    () => new Set(hiddenCanonicalKeys),
    [hiddenCanonicalKeys],
  );

  const { visibleStructures, hiddenStructures } = useMemo(
    () => partitionNodeDrilldownStructures(structures, hiddenCanonicalKeySet),
    [hiddenCanonicalKeySet, structures],
  );

  const hideStructure = useCallback((canonicalDomainKey: string) => {
    setHiddenCanonicalKeys((current) => {
      if (!canonicalDomainKey || current.includes(canonicalDomainKey)) {
        return current;
      }

      return [...current, canonicalDomainKey].sort();
    });
  }, []);

  const unhideStructure = useCallback((canonicalDomainKey: string) => {
    setHiddenCanonicalKeys((current) => current.filter((key) => key !== canonicalDomainKey));
  }, []);

  const isStructureHidden = useCallback(
    (structure: NodeLocalStructure | null | undefined) => (
      structure ? hiddenCanonicalKeySet.has(structure.canonicalDomainKey) : false
    ),
    [hiddenCanonicalKeySet],
  );

  return {
    hiddenCanonicalKeys,
    hiddenCanonicalKeySet,
    hiddenCount: hiddenStructures.length,
    visibleStructures,
    hiddenStructures,
    hideStructure,
    unhideStructure,
    isStructureHidden,
  };
}