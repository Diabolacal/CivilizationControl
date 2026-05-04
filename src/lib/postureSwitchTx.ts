/**
 * Posture switch PTB builder.
 *
 * Constructs a single Programmable Transaction Block that atomically:
 *   1. Records per-gate posture changes (emits PostureChangedEvent per gate)
 *   2. Swaps turret extensions (CommercialAuth ↔ DefenseAuth)
 *
 * Each gate posture change borrows OwnerCap<Gate> from the operator's
 * Character. Gate toll configuration is intentionally NOT modified by
 * posture switches — tolls are an independent operator concern managed
 * through the gate policy composer.
 *
 * Move signatures used:
 *   posture::set_posture(config: &mut GateConfig, owner_cap: &OwnerCap<Gate>, gate_id: ID, mode: u8)
 *   character::borrow_owner_cap<T>(character: &mut Character, cap_ticket: Receiving<OwnerCap<T>>)
 *   turret::authorize_extension<Auth>(turret: &mut Turret, cap: &OwnerCap<Turret>)
 *   character::return_owner_cap<T>(character: &Character, cap: OwnerCap<T>, receipt: ReturnOwnerCapReceipt)
 */

import { Transaction } from "@mysten/sui/transactions";
import {
  CC_PACKAGE_ID,
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
  GATE_CONFIG_ID,
} from "@/constants";
import type { PostureMode, TurretSwitchTarget, GatePostureTarget } from "@/types/domain";

export const NO_POSTURE_TARGETS_ERROR = "No eligible gates or turrets to switch.";

// On-chain posture constants (must match posture.move)
const POSTURE_COMMERCIAL = 0;
const POSTURE_DEFENSE = 1;

interface PostureSwitchParams {
  /** Target posture mode. */
  targetMode: PostureMode;
  /** Gates to set posture on (requires OwnerCap<Gate>). */
  gates: GatePostureTarget[];
  /** Turrets to swap extension on. */
  turrets: TurretSwitchTarget[];
  /** The current wallet's Character object ID. */
  characterId: string;
}

export function hasPostureSwitchTargets(
  params: Pick<PostureSwitchParams, "gates" | "turrets">,
): boolean {
  return params.gates.length > 0 || params.turrets.length > 0;
}

/**
 * Build a single PTB that switches the network's enforcement posture.
 *
 * Records per-gate posture change + swaps turret extensions.
 * Gate toll configuration is NOT modified — tolls are an independent
 * operator concern managed via the gate policy composer.
 */
export function buildPostureSwitchTx(params: PostureSwitchParams): Transaction {
  const { targetMode, gates, turrets, characterId } = params;

  if (!hasPostureSwitchTargets({ gates, turrets })) {
    throw new Error(NO_POSTURE_TARGETS_ERROR);
  }

  const tx = new Transaction();

  const modeValue = targetMode === "defense" ? POSTURE_DEFENSE : POSTURE_COMMERCIAL;

  // ─── 1. Per-gate posture changes (PostureChangedEvent per gate) ───
  const gateType = `${WORLD_ORIGINAL_PACKAGE_ID}::gate::Gate`;
  for (const gate of gates) {
    const [gateCap, gateReceipt] = tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
      typeArguments: [gateType],
      arguments: [
        tx.object(characterId),
        tx.object(gate.ownerCapId),
      ],
    });

    tx.moveCall({
      target: `${CC_PACKAGE_ID}::posture::set_posture`,
      arguments: [
        tx.object(GATE_CONFIG_ID),
        gateCap,
        tx.pure.id(gate.gateId),
        tx.pure.u8(modeValue),
      ],
    });

    tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
      typeArguments: [gateType],
      arguments: [
        tx.object(characterId),
        gateCap,
        gateReceipt,
      ],
    });
  }

  // ─── 2. Turret extension swaps ───
  const turretType = `${WORLD_ORIGINAL_PACKAGE_ID}::turret::Turret`;
  const authType = targetMode === "defense"
    ? `${CC_PACKAGE_ID}::turret::DefenseAuth`
    : `${CC_PACKAGE_ID}::turret::CommercialAuth`;

  for (const turret of turrets) {
    // Borrow OwnerCap<Turret> from Character via Receiving
    const [cap, receipt] = tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
      typeArguments: [turretType],
      arguments: [
        tx.object(characterId),
        tx.object(turret.ownerCapId),
      ],
    });

    // Swap turret extension to target posture
    tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::turret::authorize_extension`,
      typeArguments: [authType],
      arguments: [
        tx.object(turret.turretId),
        cap,
      ],
    });

    // Return OwnerCap<Turret> to Character
    tx.moveCall({
      target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
      typeArguments: [turretType],
      arguments: [
        tx.object(characterId),
        cap,
        receipt,
      ],
    });
  }

  return tx;
}
