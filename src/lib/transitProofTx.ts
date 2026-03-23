/**
 * Transit proof PTB builder.
 *
 * Constructs a Programmable Transaction Block that calls
 * `request_jump_permit` or `request_jump_permit_free` to generate
 * live transit-proof events (TribeCheckPassedEvent, TollCollectedEvent).
 *
 * This is an operator self-test: the operator requests a permit for
 * their own character on their own gate. The permit is transferred to
 * the character on-chain. The proof moments are the emitted events,
 * not the permit itself.
 *
 * Move signatures:
 *   request_jump_permit(
 *     config: &GateConfig, source_gate: &Gate, destination_gate: &Gate,
 *     character: &Character, payment: Coin<EVE>, clock: &Clock, ctx
 *   )
 *   request_jump_permit_free(
 *     config: &GateConfig, source_gate: &Gate, destination_gate: &Gate,
 *     character: &Character, clock: &Clock, ctx
 *   )
 */

import { Transaction } from "@mysten/sui/transactions";
import { CC_PACKAGE_ID, GATE_CONFIG_ID } from "@/constants";
import type { ObjectId } from "@/types/domain";

const SUI_CLOCK = "0x6";

interface TransitProofParams {
  sourceGateId: ObjectId;
  destinationGateId: ObjectId;
  characterId: ObjectId;
}

interface TransitProofWithTollParams extends TransitProofParams {
  eveCoinId: ObjectId;
  tollPrice: number;
}

/** Build PTB for toll-free transit proof (no coin toll configured). */
export function buildTransitProofFreeTx(params: TransitProofParams): Transaction {
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

/** Build PTB for transit proof with toll payment. */
export function buildTransitProofWithTollTx(params: TransitProofWithTollParams): Transaction {
  const { sourceGateId, destinationGateId, eveCoinId, tollPrice, characterId } = params;
  const tx = new Transaction();

  // Split exact toll amount from the operator's EVE coin
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
