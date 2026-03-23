/**
 * objectResolver — Derives a Sui object ID from an in-game itemId + tenant.
 *
 * Uses the same deterministic derivation as @evefrontier/dapp-kit:
 *   BCS-encode TenantItemId → deriveObjectID(ObjectRegistry, typeTag, key)
 *
 * The derivation is pure blake2b math — zero RPC calls.
 */

import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import { WORLD_PACKAGE_ID } from "../constants";

/** ObjectRegistry singleton on Utopia testnet. Immutable after world deployment. */
const OBJECT_REGISTRY_ID =
  "0xc2b969a72046c47e24991d69472afb2216af9e91caf802684514f39706d7dc57";

const TYPE_TAG = `${WORLD_PACKAGE_ID}::in_game_id::TenantItemId`;

const TenantItemId = bcs.struct("TenantItemId", {
  id: bcs.u64(),
  tenant: bcs.string(),
});

/** Derive a Sui object ID from an in-game numeric itemId and tenant. */
export function resolveItemIdToObjectId(itemId: string, tenant: string): string {
  const key = TenantItemId.serialize({ id: BigInt(itemId), tenant }).toBytes();
  return deriveObjectID(OBJECT_REGISTRY_ID, TYPE_TAG, key);
}
