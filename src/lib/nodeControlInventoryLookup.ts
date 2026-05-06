import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import {
  createNodeDrilldownIdentityAliases,
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
} from "@/lib/nodeDrilldownIdentity";

import type { NetworkNodeGroup } from "@/types/domain";

export interface SelectedNodeInventoryLookupResolution {
  lookup: NodeAssembliesLookupResult | null;
  found: boolean;
  foundBy: "map-key" | "lookup-scan" | null;
  matchedKey: string | null;
  lookupKeysTried: string[];
  rawChildCount: number;
}

function pushUnique(values: string[], value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized || values.includes(normalized)) return;
  values.push(normalized);
}

function getNodeLookupKeys(group: NetworkNodeGroup | null): string[] {
  if (!group) return [];

  const node = group.node;
  const keys: string[] = [];
  const objectId = normalizeCanonicalObjectId(node.objectId);
  const assemblyId = normalizeNodeDrilldownAssemblyId(node.assemblyId);
  const canonicalDomainKey = selectCanonicalNodeDrilldownDomainKey({
    objectId,
    assemblyId,
    renderId: node.objectId,
    source: node.readModelSource === "operator-inventory" ? "backendMembership" : "live",
  });

  pushUnique(keys, objectId);
  pushUnique(keys, canonicalDomainKey);
  pushUnique(keys, node.networkNodeRenderMeta?.canonicalIdentity);
  pushUnique(keys, assemblyId);
  for (const alias of createNodeDrilldownIdentityAliases({
    objectId,
    assemblyId,
    renderId: node.objectId,
    source: node.readModelSource === "operator-inventory" ? "backendMembership" : "live",
  })) {
    pushUnique(keys, alias);
  }
  pushUnique(keys, normalizeCanonicalObjectId(node.summary?.energySourceId));

  return keys;
}

function lookupMatchesSelectedNode(lookup: NodeAssembliesLookupResult, group: NetworkNodeGroup): boolean {
  const selectedObjectId = normalizeCanonicalObjectId(group.node.objectId);
  const selectedAssemblyId = normalizeNodeDrilldownAssemblyId(group.node.assemblyId);
  const lookupObjectId = normalizeCanonicalObjectId(lookup.node?.objectId ?? lookup.networkNodeId);
  const lookupAssemblyId = normalizeNodeDrilldownAssemblyId(lookup.node?.assemblyId);

  return Boolean(
    (selectedObjectId && lookupObjectId && selectedObjectId === lookupObjectId)
    || (selectedAssemblyId && lookupAssemblyId && selectedAssemblyId === lookupAssemblyId),
  );
}

export function resolveSelectedNodeInventoryLookup(
  group: NetworkNodeGroup | null,
  nodeLookupsByNodeId: Map<string, NodeAssembliesLookupResult> | null | undefined,
): SelectedNodeInventoryLookupResolution {
  const lookupKeysTried = getNodeLookupKeys(group);

  if (!group || !nodeLookupsByNodeId) {
    return {
      lookup: null,
      found: false,
      foundBy: null,
      matchedKey: null,
      lookupKeysTried,
      rawChildCount: 0,
    };
  }

  for (const key of lookupKeysTried) {
    const lookup = nodeLookupsByNodeId.get(key);
    if (lookup) {
      return {
        lookup,
        found: true,
        foundBy: "map-key",
        matchedKey: key,
        lookupKeysTried,
        rawChildCount: lookup.status === "success" ? lookup.assemblies.length : 0,
      };
    }
  }

  for (const [key, lookup] of nodeLookupsByNodeId.entries()) {
    if (!lookupMatchesSelectedNode(lookup, group)) continue;

    return {
      lookup,
      found: true,
      foundBy: "lookup-scan",
      matchedKey: key,
      lookupKeysTried,
      rawChildCount: lookup.status === "success" ? lookup.assemblies.length : 0,
    };
  }

  return {
    lookup: null,
    found: false,
    foundBy: null,
    matchedKey: null,
    lookupKeysTried,
    rawChildCount: 0,
  };
}
