/**
 * PTB builders for structure online/offline operations.
 *
 * Covers all web-controllable structure types:
 *   - Gates, Turrets, Storage Units: same signature (assembly, nwn, energy_config, owner_cap)
 *   - Network Nodes: unique signature (nwn, owner_cap, clock)
 *
 * Batch variants build one PTB for multiple structures of the same type.
 */

import { Transaction } from "@mysten/sui/transactions";
import {
  ENERGY_CONFIG_ID,
  FUEL_CONFIG_ID,
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
} from "@/constants";
import type { ObjectId, StructureActionTargetType } from "@/types/domain";

// ─── Module/type mapping per structure type ──────────────

export type AssemblyActionTargetType = Exclude<StructureActionTargetType, "network_node">;

const MODULE_MAP: Record<AssemblyActionTargetType, { module: string; typeStr: string }> = {
  assembly: { module: "assembly", typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::assembly::Assembly` },
  gate: { module: "gate", typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::gate::Gate` },
  turret: { module: "turret", typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::turret::Turret` },
  storage_unit: { module: "storage_unit", typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::storage_unit::StorageUnit` },
};

// ─── Sui Clock address (always 0x6) ─────────────────────
const SUI_CLOCK = "0x6";

const NETWORK_NODE_TYPE = `${WORLD_ORIGINAL_PACKAGE_ID}::network_node::NetworkNode`;

export const NETWORK_NODE_ID_REQUIRED_ERROR = "Network node object ID is required.";
export const NETWORK_NODE_OWNER_CAP_REQUIRED_ERROR = "Network node OwnerCap ID is required.";
export const NETWORK_NODE_CHARACTER_REQUIRED_ERROR = "Character ID is required for network node power operations.";
export const NETWORK_NODE_CONNECTED_CHILD_ID_REQUIRED_ERROR = "Connected child object ID is required for network node offline.";

export interface NodeOfflineChildTarget {
  objectId: ObjectId;
  structureType: AssemblyActionTargetType;
}

interface NodeOfflineParams {
  nodeId: ObjectId;
  ownerCapId: ObjectId;
  characterId: string;
  connectedAssemblies: NodeOfflineChildTarget[];
}

function assertRequiredObjectId(value: string, message: string): string {
  if (value.trim().length === 0) {
    throw new Error(message);
  }

  return value;
}

function getNodeOfflineChildTarget(structureType: AssemblyActionTargetType): { module: string; functionName: string } {
  switch (structureType) {
    case "gate":
      return { module: "gate", functionName: "offline_connected_gate" };
    case "storage_unit":
      return { module: "storage_unit", functionName: "offline_connected_storage_unit" };
    case "turret":
      return { module: "turret", functionName: "offline_connected_turret" };
    case "assembly":
    default:
      return { module: "assembly", functionName: "offline_connected_assembly" };
  }
}

// ─── Single assembly online/offline ─────────────────────

interface AssemblyPowerParams {
  structureType: AssemblyActionTargetType;
  structureId: ObjectId;
  ownerCapId: ObjectId;
  networkNodeId: ObjectId;
  online: boolean;
  characterId: string;
}

/**
 * Build a PTB to online/offline a single gate, turret, or SSU.
 * Signature: module::online|offline(assembly, nwn, energy_config, owner_cap)
 */
export function buildAssemblyPowerTx(params: AssemblyPowerParams): Transaction {
  const { structureType, structureId, ownerCapId, networkNodeId, online, characterId } = params;
  const mapping = MODULE_MAP[structureType];
  if (!mapping) throw new Error(`Unsupported structure type: ${structureType}`);

  const tx = new Transaction();

  const [cap, receipt] = tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [mapping.typeStr],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::${mapping.module}::${online ? "online" : "offline"}`,
    arguments: [
      tx.object(structureId),
      tx.object(networkNodeId),
      tx.object(ENERGY_CONFIG_ID),
      cap,
    ],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [mapping.typeStr],
    arguments: [tx.object(characterId), cap, receipt],
  });

  return tx;
}

// ─── Batch assembly online/offline ──────────────────────

interface BatchAssemblyTarget {
  structureId: ObjectId;
  ownerCapId: ObjectId;
  networkNodeId: ObjectId;
}

interface BatchAssemblyPowerParams {
  structureType: AssemblyActionTargetType;
  targets: BatchAssemblyTarget[];
  online: boolean;
  characterId: string;
}

/**
 * Build a single PTB to online/offline multiple structures of the same type.
 * Each structure gets its own borrow → action → return cycle.
 */
export function buildBatchAssemblyPowerTx(params: BatchAssemblyPowerParams): Transaction {
  const { structureType, targets, online, characterId } = params;
  const mapping = MODULE_MAP[structureType];
  if (!mapping) throw new Error(`Unsupported structure type: ${structureType}`);

  const tx = new Transaction();

  for (const target of targets) {
    const [cap, receipt] = tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
      typeArguments: [mapping.typeStr],
      arguments: [tx.object(characterId), tx.object(target.ownerCapId)],
    });

    tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::${mapping.module}::${online ? "online" : "offline"}`,
      arguments: [
        tx.object(target.structureId),
        tx.object(target.networkNodeId),
        tx.object(ENERGY_CONFIG_ID),
        cap,
      ],
    });

    tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
      typeArguments: [mapping.typeStr],
      arguments: [tx.object(characterId), cap, receipt],
    });
  }

  return tx;
}

// ─── Network node online ────────────────────────────────

interface NodeOnlineParams {
  nodeId: ObjectId;
  ownerCapId: ObjectId;
  characterId: string;
}

/**
 * Build a PTB to bring a network node online.
 * Signature: network_node::online(nwn, owner_cap, clock)
 */
export function buildNodeOnlineTx(params: NodeOnlineParams): Transaction {
  const { nodeId, ownerCapId, characterId } = params;
  const tx = new Transaction();

  const [cap, receipt] = tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [NETWORK_NODE_TYPE],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::network_node::online`,
    arguments: [tx.object(nodeId), cap, tx.object(SUI_CLOCK)],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [NETWORK_NODE_TYPE],
    arguments: [tx.object(characterId), cap, receipt],
  });

  return tx;
}

/**
 * Build a PTB to take a network node offline.
 *
 * The runtime returns an OfflineAssemblies hot potato that must be consumed
 * in the same transaction, even when the node has zero connected children.
 */
export function buildNodeOfflineTx(params: NodeOfflineParams): Transaction {
  const nodeId = assertRequiredObjectId(params.nodeId, NETWORK_NODE_ID_REQUIRED_ERROR);
  const ownerCapId = assertRequiredObjectId(params.ownerCapId, NETWORK_NODE_OWNER_CAP_REQUIRED_ERROR);
  const characterId = assertRequiredObjectId(params.characterId, NETWORK_NODE_CHARACTER_REQUIRED_ERROR);

  const tx = new Transaction();

  const [ownerCap, receipt] = tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [NETWORK_NODE_TYPE],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });

  let [offlineAssemblies] = tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::network_node::offline`,
    arguments: [
      tx.object(nodeId),
      tx.object(FUEL_CONFIG_ID),
      ownerCap,
      tx.object(SUI_CLOCK),
    ],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [NETWORK_NODE_TYPE],
    arguments: [tx.object(characterId), ownerCap, receipt],
  });

  for (const connectedAssembly of params.connectedAssemblies) {
    const childObjectId = assertRequiredObjectId(
      connectedAssembly.objectId,
      NETWORK_NODE_CONNECTED_CHILD_ID_REQUIRED_ERROR,
    );
    const childTarget = getNodeOfflineChildTarget(connectedAssembly.structureType);
    [offlineAssemblies] = tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::${childTarget.module}::${childTarget.functionName}`,
      arguments: [
        tx.object(childObjectId),
        offlineAssemblies,
        tx.object(nodeId),
        tx.object(ENERGY_CONFIG_ID),
      ],
    });
  }

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::network_node::destroy_offline_assemblies`,
    arguments: [offlineAssemblies],
  });

  return tx;
}
