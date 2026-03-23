/**
 * Gate permit PTB builders — player-parameterized.
 *
 * Unlike transitProofTx.ts (operator self-test with hardcoded CHARACTER_ID),
 * these builders accept a dynamic characterId so any connected player can
 * request a JumpPermit on any governed gate.
 *
 * Move signatures:
 *   request_jump_permit(config, source_gate, dest_gate, character, payment, clock, ctx)
 *   request_jump_permit_free(config, source_gate, dest_gate, character, clock, ctx)
 */

import { Transaction } from "@mysten/sui/transactions";
import { CC_PACKAGE_ID, GATE_CONFIG_ID } from "@/constants";
import type { ObjectId } from "@/types/domain";

const SUI_CLOCK = "0x6";

interface PermitFreeParams {
  sourceGateId: ObjectId;
  destinationGateId: ObjectId;
  characterId: ObjectId;
}

interface PermitTollParams extends PermitFreeParams {
  eveCoinId: ObjectId;
  tollPrice: number;
}

/** Build PTB for toll-free permit request. */
export function buildPermitFreeTx(params: PermitFreeParams): Transaction {
  const { sourceGateId, destinationGateId, characterId } = params;
  const tx = new Transaction();

  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::request_jump_permit_free`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(sourceGateId),
      tx.object(destinationGateId),
      tx.object(characterId),
      tx.object(SUI_CLOCK),
    ],
  });

  return tx;
}

/** Build PTB for permit request with toll payment. */
export function buildPermitTollTx(params: PermitTollParams): Transaction {
  const { sourceGateId, destinationGateId, characterId, eveCoinId, tollPrice } = params;
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.object(eveCoinId), [tx.pure.u64(BigInt(tollPrice))]);

  tx.moveCall({
    target: `${CC_PACKAGE_ID}::gate_control::request_jump_permit`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(sourceGateId),
      tx.object(destinationGateId),
      tx.object(characterId),
      payment,
      tx.object(SUI_CLOCK),
    ],
  });

  return tx;
}
