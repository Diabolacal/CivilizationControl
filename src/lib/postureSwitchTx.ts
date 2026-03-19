/**
 * Posture switch PTB builder.
 *
 * Constructs a single Programmable Transaction Block that atomically:
 *   1. Records the posture change on GateConfig (emits PostureChangedEvent)
 *   2. Swaps turret extensions (BouncerAuth ↔ DefenseAuth)
 *
 * Gate toll configuration is intentionally NOT modified by posture switches.
 * Tolls are an independent operator concern managed through the gate policy
 * composer. This prevents silent overwrite of operator-configured toll values.
 *
 * Move signatures used:
 *   posture::set_posture(config: &mut GateConfig, admin: &AdminCap, mode: u8)
 *   character::borrow_owner_cap<Turret>(character: &mut Character, cap_ticket: Receiving<OwnerCap<Turret>>)
 *   turret::authorize_extension<Auth>(turret: &mut Turret, cap: &OwnerCap<Turret>)
 *   character::return_owner_cap<Turret>(character: &Character, cap: OwnerCap<Turret>, receipt: ReturnOwnerCapReceipt)
 */

import { Transaction } from "@mysten/sui/transactions";
import {
  CC_PACKAGE_ID,
  WORLD_PACKAGE_ID,
  GATE_CONFIG_ID,
  GATE_ADMIN_CAP_ID,
  CHARACTER_ID,
} from "@/constants";
import type { PostureMode, TurretSwitchTarget } from "@/types/domain";

// On-chain posture constants (must match posture.move)
const POSTURE_COMMERCIAL = 0;
const POSTURE_DEFENSE = 1;

interface PostureSwitchParams {
  /** Target posture mode. */
  targetMode: PostureMode;
  /** Turrets to swap extension on. */
  turrets: TurretSwitchTarget[];
}

/**
 * Build a single PTB that switches the network's enforcement posture.
 *
 * Records posture change + swaps turret extensions.
 * Gate toll configuration is NOT modified — tolls are an independent
 * operator concern managed via the gate policy composer.
 */
export function buildPostureSwitchTx(params: PostureSwitchParams): Transaction {
  const { targetMode, turrets } = params;
  const tx = new Transaction();

  const modeValue = targetMode === "defense" ? POSTURE_DEFENSE : POSTURE_COMMERCIAL;

  // ─── 1. Record posture change (PostureChangedEvent) ───
  tx.moveCall({
    target: `${CC_PACKAGE_ID}::posture::set_posture`,
    arguments: [
      tx.object(GATE_CONFIG_ID),
      tx.object(GATE_ADMIN_CAP_ID),
      tx.pure.u8(modeValue),
    ],
  });

  // ─── 2. Turret extension swaps ───
  const turretType = `${WORLD_PACKAGE_ID}::turret::Turret`;
  const authType = targetMode === "defense"
    ? `${CC_PACKAGE_ID}::turret_defense::DefenseAuth`
    : `${CC_PACKAGE_ID}::turret_bouncer::BouncerAuth`;

  for (const turret of turrets) {
    // Borrow OwnerCap<Turret> from Character via Receiving
    const [cap, receipt] = tx.moveCall({
      target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
      typeArguments: [turretType],
      arguments: [
        tx.object(CHARACTER_ID),
        tx.object(turret.ownerCapId),
      ],
    });

    // Swap turret extension to target posture
    tx.moveCall({
      target: `${WORLD_PACKAGE_ID}::turret::authorize_extension`,
      typeArguments: [authType],
      arguments: [
        tx.object(turret.turretId),
        cap,
      ],
    });

    // Return OwnerCap<Turret> to Character
    tx.moveCall({
      target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
      typeArguments: [turretType],
      arguments: [
        tx.object(CHARACTER_ID),
        cap,
        receipt,
      ],
    });
  }

  return tx;
}
