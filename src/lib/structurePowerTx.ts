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
  WORLD_PACKAGE_ID,
  CHARACTER_ID,
  ENERGY_CONFIG_ID,
} from "@/constants";
import type { ObjectId, StructureType } from "@/types/domain";

// ─── Module/type mapping per structure type ──────────────

const MODULE_MAP: Record<string, { module: string; typeStr: string }> = {
  gate: { module: "gate", typeStr: `${WORLD_PACKAGE_ID}::gate::Gate` },
  turret: { module: "turret", typeStr: `${WORLD_PACKAGE_ID}::turret::Turret` },
  storage_unit: { module: "storage_unit", typeStr: `${WORLD_PACKAGE_ID}::storage_unit::StorageUnit` },
};

// ─── Sui Clock address (always 0x6) ─────────────────────
const SUI_CLOCK = "0x6";

// ─── Single assembly online/offline ─────────────────────

interface AssemblyPowerParams {
  structureType: StructureType;
  structureId: ObjectId;
  ownerCapId: ObjectId;
  networkNodeId: ObjectId;
  online: boolean;
}

/**
 * Build a PTB to online/offline a single gate, turret, or SSU.
 * Signature: module::online|offline(assembly, nwn, energy_config, owner_cap)
 */
export function buildAssemblyPowerTx(params: AssemblyPowerParams): Transaction {
  const { structureType, structureId, ownerCapId, networkNodeId, online } = params;
  const mapping = MODULE_MAP[structureType];
  if (!mapping) throw new Error(`Unsupported structure type: ${structureType}`);

  const tx = new Transaction();

  const [cap, receipt] = tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [mapping.typeStr],
    arguments: [tx.object(CHARACTER_ID), tx.object(ownerCapId)],
  });

  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::${mapping.module}::${online ? "online" : "offline"}`,
    arguments: [
      tx.object(structureId),
      tx.object(networkNodeId),
      tx.object(ENERGY_CONFIG_ID),
      cap,
    ],
  });

  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [mapping.typeStr],
    arguments: [tx.object(CHARACTER_ID), cap, receipt],
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
  structureType: StructureType;
  targets: BatchAssemblyTarget[];
  online: boolean;
}

/**
 * Build a single PTB to online/offline multiple structures of the same type.
 * Each structure gets its own borrow → action → return cycle.
 */
export function buildBatchAssemblyPowerTx(params: BatchAssemblyPowerParams): Transaction {
  const { structureType, targets, online } = params;
  const mapping = MODULE_MAP[structureType];
  if (!mapping) throw new Error(`Unsupported structure type: ${structureType}`);

  const tx = new Transaction();

  for (const target of targets) {
    const [cap, receipt] = tx.moveCall({
      target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
      typeArguments: [mapping.typeStr],
      arguments: [tx.object(CHARACTER_ID), tx.object(target.ownerCapId)],
    });

    tx.moveCall({
      target: `${WORLD_PACKAGE_ID}::${mapping.module}::${online ? "online" : "offline"}`,
      arguments: [
        tx.object(target.structureId),
        tx.object(target.networkNodeId),
        tx.object(ENERGY_CONFIG_ID),
        cap,
      ],
    });

    tx.moveCall({
      target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
      typeArguments: [mapping.typeStr],
      arguments: [tx.object(CHARACTER_ID), cap, receipt],
    });
  }

  return tx;
}

// ─── Network node online ────────────────────────────────

interface NodeOnlineParams {
  nodeId: ObjectId;
  ownerCapId: ObjectId;
}

/**
 * Build a PTB to bring a network node online.
 * Signature: network_node::online(nwn, owner_cap, clock)
 */
export function buildNodeOnlineTx(params: NodeOnlineParams): Transaction {
  const { nodeId, ownerCapId } = params;
  const tx = new Transaction();
  const nodeType = `${WORLD_PACKAGE_ID}::network_node::NetworkNode`;

  const [cap, receipt] = tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [nodeType],
    arguments: [tx.object(CHARACTER_ID), tx.object(ownerCapId)],
  });

  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::network_node::online`,
    arguments: [tx.object(nodeId), cap, tx.object(SUI_CLOCK)],
  });

  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [nodeType],
    arguments: [tx.object(CHARACTER_ID), cap, receipt],
  });

  return tx;
}
