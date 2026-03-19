/**
 * Gate policy PTB builders.
 *
 * Constructs Programmable Transaction Blocks for gate rule mutations.
 * All mutations require the GateControl AdminCap (owned by the operator wallet).
 *
 * Move signatures:
 *   set_tribe_rule(config: &mut GateConfig, _: &AdminCap, gate_id: ID, tribe: u32)
 *   remove_tribe_rule(config: &mut GateConfig, _: &AdminCap, gate_id: ID)
 *   set_coin_toll(config: &mut GateConfig, _: &AdminCap, gate_id: ID, price: u64, treasury: address)
 *   remove_coin_toll(config: &mut GateConfig, _: &AdminCap, gate_id: ID)
 */

import { Transaction } from "@mysten/sui/transactions";
import {
  CC_PACKAGE_ID,
  GATE_CONFIG_ID,
  GATE_ADMIN_CAP_ID,
} from "@/constants";
import type { ObjectId } from "@/types/domain";

export function buildSetTribeRuleTx(gateId: ObjectId, tribe: number): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::set_tribe_rule`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(GATE_ADMIN_CAP_ID),
      tx.pure.id(gateId),
      tx.pure.u32(tribe),
    ],
  });
  return tx;
}

export function buildRemoveTribeRuleTx(gateId: ObjectId): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::remove_tribe_rule`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(GATE_ADMIN_CAP_ID),
      tx.pure.id(gateId),
    ],
  });
  return tx;
}

export function buildSetCoinTollTx(
  gateId: ObjectId,
  price: number,
  treasury: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::set_coin_toll`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(GATE_ADMIN_CAP_ID),
      tx.pure.id(gateId),
      tx.pure.u64(BigInt(price)),
      tx.pure.address(treasury),
    ],
  });
  return tx;
}

export function buildRemoveCoinTollTx(gateId: ObjectId): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::remove_coin_toll`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(GATE_ADMIN_CAP_ID),
      tx.pure.id(gateId),
    ],
  });
  return tx;
}
