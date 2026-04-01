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

/** ObjectRegistry singleton on Stillness testnet. Immutable after world deployment. */
const OBJECT_REGISTRY_ID =
  "0x454a9aa3d37e1d08d3c9181239c1b683781e4087fbbbd48c935d54b6736fd05c";

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
