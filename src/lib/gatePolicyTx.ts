/**
 * Gate policy PTB builders — operator-owned authority model.
 *
 * Constructs Programmable Transaction Blocks for gate policy mutations.
 * All mutations require OwnerCap<Gate> — borrowed from the operator's
 * Character via the borrow/return pattern.
 *
 * Move signatures:
 *   set_policy_preset(config, owner_cap, gate_id, mode, tribes[], accesses[], tolls[], default_access, default_toll)
 *   remove_policy_preset(config, owner_cap, gate_id, mode)
 *   set_treasury(config, owner_cap, gate_id, treasury_address)
 */

import { Transaction } from "@mysten/sui/transactions";
import {
  CC_PACKAGE_ID,
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
  GATE_CONFIG_ID,
} from "@/constants";
import type { ObjectId, TribePolicyEntry, GatePolicyTarget } from "@/types/domain";

const GATE_TYPE = `${WORLD_ORIGINAL_PACKAGE_ID}::gate::Gate`;

function borrowOwnerCap(tx: Transaction, characterId: string, ownerCapId: string) {
  return tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [GATE_TYPE],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });
}

function returnOwnerCap(
  tx: Transaction,
  characterId: string,
  cap: ReturnType<typeof borrowOwnerCap>[0],
  receipt: ReturnType<typeof borrowOwnerCap>[1],
) {
  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [GATE_TYPE],
    arguments: [tx.object(characterId), cap, receipt],
  });
}

export function buildSetPolicyPresetTx(
  gateId: ObjectId,
  mode: number,
  entries: TribePolicyEntry[],
  defaultAccess: boolean,
  defaultToll: number,
  ownerCapId: string,
  characterId: string,
): Transaction {
  const tx = new Transaction();
  const [cap, receipt] = borrowOwnerCap(tx, characterId, ownerCapId);
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::set_policy_preset`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      cap,
      tx.pure.id(gateId),
      tx.pure.u8(mode),
      tx.pure("vector<u32>", entries.map((e) => e.tribe)),
      tx.pure("vector<bool>", entries.map((e) => e.access)),
      tx.pure("vector<u64>", entries.map((e) => BigInt(e.toll))),
      tx.pure.bool(defaultAccess),
      tx.pure.u64(BigInt(defaultToll)),
    ],
  });
  returnOwnerCap(tx, characterId, cap, receipt);
  return tx;
}

export function buildRemovePolicyPresetTx(
  gateId: ObjectId,
  mode: number,
  ownerCapId: string,
  characterId: string,
): Transaction {
  const tx = new Transaction();
  const [cap, receipt] = borrowOwnerCap(tx, characterId, ownerCapId);
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::remove_policy_preset`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      cap,
      tx.pure.id(gateId),
      tx.pure.u8(mode),
    ],
  });
  returnOwnerCap(tx, characterId, cap, receipt);
  return tx;
}

export function buildSetTreasuryTx(
  gateId: ObjectId,
  treasury: string,
  ownerCapId: string,
  characterId: string,
): Transaction {
  const tx = new Transaction();
  const [cap, receipt] = borrowOwnerCap(tx, characterId, ownerCapId);
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::set_treasury`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      cap,
      tx.pure.id(gateId),
      tx.pure.address(treasury),
    ],
  });
  returnOwnerCap(tx, characterId, cap, receipt);
  return tx;
}

/**
 * Build a single PTB that deploys the same policy preset to multiple gates.
 *
 * Iterates over targets, borrowing/returning OwnerCap<Gate> per gate.
 * Each gate gets its own set_policy_preset call with identical preset data.
 * Sui PTB command limit (1000) accommodates ~300 gates (3 commands each).
 */
export function buildBatchSetPolicyPresetTx(
  targets: GatePolicyTarget[],
  mode: number,
  entries: TribePolicyEntry[],
  defaultAccess: boolean,
  defaultToll: number,
  characterId: string,
): Transaction {
  const tx = new Transaction();

  const tribes = entries.map((e) => e.tribe);
  const accesses = entries.map((e) => e.access);
  const tolls = entries.map((e) => BigInt(e.toll));
  const defToll = BigInt(defaultToll);

  for (const target of targets) {
    const [cap, receipt] = borrowOwnerCap(tx, characterId, target.ownerCapId);
    tx.moveCall({
      target: `${CC_PACKAGE_ID}::gate_control::set_policy_preset`,
      arguments: [
        tx.object(GATE_CONFIG_ID),
        cap,
        tx.pure.id(target.gateId),
        tx.pure.u8(mode),
        tx.pure("vector<u32>", tribes),
        tx.pure("vector<bool>", accesses),
        tx.pure("vector<u64>", tolls),
        tx.pure.bool(defaultAccess),
        tx.pure.u64(defToll),
      ],
    });
    returnOwnerCap(tx, characterId, cap, receipt);
  }

  return tx;
}

/**
 * Build a single PTB that sets the same treasury address on multiple gates.
 *
 * Same borrow/return pattern as batch preset. Idempotent — overwrites
 * any existing treasury DF. ~300 gates per PTB (3 commands each).
 */
export function buildBatchSetTreasuryTx(
  targets: GatePolicyTarget[],
  treasury: string,
  characterId: string,
): Transaction {
  const tx = new Transaction();

  for (const target of targets) {
    const [cap, receipt] = borrowOwnerCap(tx, characterId, target.ownerCapId);
    tx.moveCall({
      target: `${CC_PACKAGE_ID}::gate_control::set_treasury`,
      arguments: [
        tx.object(GATE_CONFIG_ID),
        cap,
        tx.pure.id(target.gateId),
        tx.pure.address(treasury),
      ],
    });
    returnOwnerCap(tx, characterId, cap, receipt);
  }

  return tx;
}
