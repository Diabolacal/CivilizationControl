import type { NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import {
  NETWORK_NODE_CONNECTED_CHILD_ID_REQUIRED_ERROR,
  NETWORK_NODE_ID_REQUIRED_ERROR,
  NETWORK_NODE_OWNER_CAP_REQUIRED_ERROR,
  type NodeOfflineChildTarget,
} from "@/lib/structurePowerTx";
import type { Structure } from "@/types/domain";

export const NETWORK_NODE_OFFLINE_CONFIRMATION_MESSAGE =
  "Taking this node offline may drop power to attached structures.";
export const NETWORK_NODE_OFFLINE_LOOKUP_REQUIRED_ERROR =
  "Connected-structure proof missing.";
export const NETWORK_NODE_OFFLINE_CHILD_TYPE_REQUIRED_ERROR =
  "Connected structure type is unresolved.";

const GENERIC_ASSEMBLY_FAMILIES = new Set([
  "assembler",
  "assembly",
  "berth",
  "nest",
  "nursery",
  "printer",
  "refinery",
  "relay",
  "shelter",
]);

export interface NetworkNodeOfflinePlan {
  connectedAssemblies: NodeOfflineChildTarget[];
  affectedStructureCount: number;
  unavailableReason: string | null;
}

function resolveLookupStructureType(
  lookup: NonNullable<NodeAssembliesLookupResult["assemblies"]>[number],
): NodeOfflineChildTarget["structureType"] | null {
  const normalizedFamily = lookup.family?.trim().toLowerCase() ?? null;
  if (normalizedFamily === "gate") {
    return "gate";
  }

  if (normalizedFamily === "storage") {
    return "storage_unit";
  }

  if (normalizedFamily === "turret") {
    return "turret";
  }

  if (normalizedFamily === "networknode") {
    return null;
  }

  if (normalizedFamily && GENERIC_ASSEMBLY_FAMILIES.has(normalizedFamily)) {
    return "assembly";
  }

  const typeHint = `${lookup.assemblyType ?? ""} ${lookup.typeName ?? ""}`.trim().toLowerCase();
  if (typeHint.includes("gate")) {
    return "gate";
  }

  if (typeHint.includes("storage") || typeHint.includes("trade post") || typeHint.includes("trade_post")) {
    return "storage_unit";
  }

  if (typeHint.includes("turret")) {
    return "turret";
  }

  if ([...GENERIC_ASSEMBLY_FAMILIES].some((family) => typeHint.includes(family.replace("_", " ")))) {
    return "assembly";
  }

  return null;
}

export function buildNetworkNodeOfflinePlan(
  node: Structure,
  lookup: NodeAssembliesLookupResult | null | undefined,
): NetworkNodeOfflinePlan {
  if (node.objectId.trim().length === 0) {
    return {
      connectedAssemblies: [],
      affectedStructureCount: 0,
      unavailableReason: NETWORK_NODE_ID_REQUIRED_ERROR,
    };
  }

  if (node.ownerCapId.trim().length === 0) {
    return {
      connectedAssemblies: [],
      affectedStructureCount: 0,
      unavailableReason: NETWORK_NODE_OWNER_CAP_REQUIRED_ERROR,
    };
  }

  if (!lookup || lookup.status !== "success") {
    return {
      connectedAssemblies: [],
      affectedStructureCount: 0,
      unavailableReason: NETWORK_NODE_OFFLINE_LOOKUP_REQUIRED_ERROR,
    };
  }

  const connectedAssemblies: NodeOfflineChildTarget[] = [];

  for (const assembly of lookup.assemblies) {
    if (!assembly.objectId) {
      return {
        connectedAssemblies: [],
        affectedStructureCount: 0,
        unavailableReason: NETWORK_NODE_CONNECTED_CHILD_ID_REQUIRED_ERROR,
      };
    }

    const structureType = resolveLookupStructureType(assembly);
    if (!structureType) {
      return {
        connectedAssemblies: [],
        affectedStructureCount: 0,
        unavailableReason: NETWORK_NODE_OFFLINE_CHILD_TYPE_REQUIRED_ERROR,
      };
    }

    connectedAssemblies.push({
      objectId: assembly.objectId,
      structureType,
    });
  }

  return {
    connectedAssemblies,
    affectedStructureCount: connectedAssemblies.length,
    unavailableReason: null,
  };
}

export function canTakeNetworkNodeOffline(
  node: Structure,
  lookup: NodeAssembliesLookupResult | null | undefined,
): boolean {
  return buildNetworkNodeOfflinePlan(node, lookup).unavailableReason == null;
}