import { Transaction } from "@mysten/sui/transactions";

import {
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
} from "@/constants";
import type { ObjectId, StructureType } from "@/types/domain";

const MODULE_MAP: Record<StructureType, { module: string; typeStr: string }> = {
  gate: { module: "gate", typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::gate::Gate` },
  network_node: {
    module: "network_node",
    typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::network_node::NetworkNode`,
  },
  storage_unit: {
    module: "storage_unit",
    typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::storage_unit::StorageUnit`,
  },
  turret: { module: "turret", typeStr: `${WORLD_ORIGINAL_PACKAGE_ID}::turret::Turret` },
};

interface StructureRenameParams {
  structureType: StructureType;
  structureId: ObjectId;
  ownerCapId: ObjectId;
  name: string;
  characterId: string;
}

export function buildStructureRenameTx(params: StructureRenameParams): Transaction {
  const { structureType, structureId, ownerCapId, name, characterId } = params;
  const mapping = MODULE_MAP[structureType];
  if (!mapping) {
    throw new Error(`Unsupported structure type: ${structureType}`);
  }

  const tx = new Transaction();

  const [ownerCap, receipt] = tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [mapping.typeStr],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::${mapping.module}::update_metadata_name`,
    arguments: [tx.object(structureId), ownerCap, tx.pure.string(name)],
  });

  tx.moveCall({
    target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [mapping.typeStr],
    arguments: [tx.object(characterId), ownerCap, receipt],
  });

  return tx;
}