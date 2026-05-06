import { normalizeCanonicalObjectId, type NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import {
  createNodeDrilldownIdentityAliases,
  normalizeNodeDrilldownAssemblyId,
  selectCanonicalNodeDrilldownDomainKey,
} from "@/lib/nodeDrilldownIdentity";

import type { NetworkNodeGroup } from "@/types/domain";
import type { OperatorInventoryNode, OperatorInventoryResponse, OperatorInventoryStructure } from "@/types/operatorInventory";

export interface SelectedNodeInventoryLookupResolution {
  lookup: NodeAssembliesLookupResult | null;
  found: boolean;
  foundBy: "map-key" | "lookup-scan" | null;
  matchedKey: string | null;
  lookupKeysTried: string[];
  nodeLookupKeysPresent: string[];
  selectedNodeIdNormalized: string | null;
  lookupFailureReason: string | null;
  rawChildCount: number;
}

function pushUnique(values: string[], value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized || values.includes(normalized)) return;
  values.push(normalized);
}

export function getNodeLookupKeys(group: NetworkNodeGroup | null): string[] {
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

  return keys;
}

function getRequiredNetworkNodeIds(row: {
  actionCandidate?: OperatorInventoryStructure["actionCandidate"];
} | null | undefined): string[] {
  return [
    row?.actionCandidate?.actions.power?.requiredIds?.networkNodeId,
    row?.actionCandidate?.actions.rename?.requiredIds?.networkNodeId,
  ]
    .map((value) => normalizeCanonicalObjectId(value))
    .filter((value): value is string => Boolean(value));
}

function nodeAssemblySummaryReferencesNode(
  row: NodeAssembliesLookupResult["assemblies"][number],
  normalizedNodeId: string,
): boolean {
  return [
    row.networkNodeId,
    ...getRequiredNetworkNodeIds(row),
  ].some((value) => normalizeCanonicalObjectId(value) === normalizedNodeId);
}

function operatorInventoryRowReferencesNode(
  row: Pick<OperatorInventoryStructure, "objectId" | "networkNodeId" | "actionCandidate"> | null | undefined,
  normalizedNodeId: string,
  options: { allowObjectId: boolean },
): boolean {
  return [
    options.allowObjectId ? row?.objectId : null,
    row?.networkNodeId,
    ...getRequiredNetworkNodeIds(row),
  ].some((value) => normalizeCanonicalObjectId(value) === normalizedNodeId);
}

export function operatorInventoryNodeGroupReferencesNode(
  group: OperatorInventoryNode,
  nodeId: string | null | undefined,
): boolean {
  const normalizedNodeId = normalizeCanonicalObjectId(nodeId);
  if (!normalizedNodeId) return false;

  return operatorInventoryRowReferencesNode(group.node, normalizedNodeId, { allowObjectId: true })
    || group.structures.some((structure) => operatorInventoryRowReferencesNode(structure, normalizedNodeId, { allowObjectId: false }));
}

export function operatorInventoryContainsNode(
  inventory: OperatorInventoryResponse | null | undefined,
  nodeId: string | null | undefined,
): boolean {
  if (!inventory) return false;

  return inventory.networkNodes.some((group) => operatorInventoryNodeGroupReferencesNode(group, nodeId));
}

function lookupMatchesSelectedNode(lookup: NodeAssembliesLookupResult, group: NetworkNodeGroup): boolean {
  const selectedObjectId = normalizeCanonicalObjectId(group.node.objectId);
  const selectedAssemblyId = normalizeNodeDrilldownAssemblyId(group.node.assemblyId);
  const lookupObjectId = normalizeCanonicalObjectId(lookup.node?.objectId ?? lookup.networkNodeId);
  const lookupAssemblyId = normalizeNodeDrilldownAssemblyId(lookup.node?.assemblyId);

  return Boolean(
    (selectedObjectId && lookupObjectId && selectedObjectId === lookupObjectId)
    || (selectedAssemblyId && lookupAssemblyId && selectedAssemblyId === lookupAssemblyId)
    || (selectedObjectId && lookup.assemblies.some((assembly) => nodeAssemblySummaryReferencesNode(assembly, selectedObjectId))),
  );
}

function resolveLookupFailureReason(
  group: NetworkNodeGroup | null,
  nodeLookupsByNodeId: Map<string, NodeAssembliesLookupResult> | null | undefined,
): string | null {
  if (!group) return "selected-node-group-missing";
  if (!nodeLookupsByNodeId) return "operator-inventory-lookup-map-missing";
  if (nodeLookupsByNodeId.size === 0) return "operator-inventory-lookup-map-empty";
  return "selected-node-not-found-in-operator-inventory-lookup-map";
}

export function resolveSelectedNodeInventoryLookup(
  group: NetworkNodeGroup | null,
  nodeLookupsByNodeId: Map<string, NodeAssembliesLookupResult> | null | undefined,
): SelectedNodeInventoryLookupResolution {
  const lookupKeysTried = getNodeLookupKeys(group);
  const nodeLookupKeysPresent = nodeLookupsByNodeId ? [...nodeLookupsByNodeId.keys()] : [];
  const selectedNodeIdNormalized = normalizeCanonicalObjectId(group?.node.objectId);

  if (!group || !nodeLookupsByNodeId) {
    return {
      lookup: null,
      found: false,
      foundBy: null,
      matchedKey: null,
      lookupKeysTried,
      nodeLookupKeysPresent,
      selectedNodeIdNormalized,
      lookupFailureReason: resolveLookupFailureReason(group, nodeLookupsByNodeId),
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
        nodeLookupKeysPresent,
        selectedNodeIdNormalized,
        lookupFailureReason: null,
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
      nodeLookupKeysPresent,
      selectedNodeIdNormalized,
      lookupFailureReason: null,
      rawChildCount: lookup.status === "success" ? lookup.assemblies.length : 0,
    };
  }

  return {
    lookup: null,
    found: false,
    foundBy: null,
    matchedKey: null,
    lookupKeysTried,
    nodeLookupKeysPresent,
    selectedNodeIdNormalized,
    lookupFailureReason: resolveLookupFailureReason(group, nodeLookupsByNodeId),
    rawChildCount: 0,
  };
}
