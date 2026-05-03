import type { NetworkNodeGroup, Structure } from "@/types/domain";

export interface AssetDiscoveryDisplayDebugState {
  operatorInventoryDisplayActive: boolean;
  operatorInventorySucceeded: boolean;
  operatorInventoryFailed: boolean;
  directChainFallbackEnabled: boolean;
  directChainFallbackRan: boolean;
  displayUsesDirectChainFallback: boolean;
  mergedIntoDisplay: boolean;
}

interface SelectDisplayNodeGroupsInput {
  operatorInventoryNodeGroups: NetworkNodeGroup[] | null;
  structures: Structure[];
  useOperatorInventory: boolean;
}

export function buildDisplayNodeGroupsFromStructures(structures: Structure[]): NetworkNodeGroup[] {
  const groups = new Map<string, NetworkNodeGroup>();

  for (const structure of structures) {
    if (structure.type !== "network_node") {
      continue;
    }

    const existing = groups.get(structure.objectId);
    if (!existing) {
      groups.set(structure.objectId, {
        node: structure,
        gates: [],
        storageUnits: [],
        turrets: [],
      });
      continue;
    }

    groups.set(structure.objectId, {
      ...existing,
      node: preferDisplayNode(existing.node, structure),
    });
  }

  for (const structure of structures) {
    if (structure.type === "network_node" || !structure.networkNodeId) {
      continue;
    }

    const group = groups.get(structure.networkNodeId);
    if (!group) {
      continue;
    }

    switch (structure.type) {
      case "gate":
        if (!group.gates.some((entry) => entry.objectId === structure.objectId)) {
          group.gates.push(structure);
        }
        break;
      case "storage_unit":
        if (!group.storageUnits.some((entry) => entry.objectId === structure.objectId)) {
          group.storageUnits.push(structure);
        }
        break;
      case "turret":
        if (!group.turrets.some((entry) => entry.objectId === structure.objectId)) {
          group.turrets.push(structure);
        }
        break;
    }
  }

  return [...groups.values()];
}

export function selectDisplayNodeGroups(input: SelectDisplayNodeGroupsInput): NetworkNodeGroup[] {
  return input.useOperatorInventory
    ? input.operatorInventoryNodeGroups ?? []
    : buildDisplayNodeGroupsFromStructures(input.structures);
}

function preferDisplayNode(existing: Structure, incoming: Structure): Structure {
  const existingScore = displayNodeScore(existing);
  const incomingScore = displayNodeScore(incoming);

  if (incomingScore > existingScore) {
    return incoming;
  }

  if (incomingScore < existingScore) {
    return existing;
  }

  if (!existing.summary && incoming.summary) {
    return incoming;
  }

  return existing;
}

function displayNodeScore(structure: Structure): number {
  let score = 0;

  if (structure.readModelSource === "operator-inventory") {
    score += 4;
  }

  if (structure.summary) {
    score += 2;
  }

  if (structure.ownerCapId) {
    score += 1;
  }

  if (structure.extensionStatus === "authorized") {
    score += 1;
  }

  return score;
}