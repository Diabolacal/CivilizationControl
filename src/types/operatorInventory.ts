import type {
  IndexedActionCandidate,
  IndexedNodePowerUsageSummary,
  IndexedPowerRequirement,
  IndexedPowerSummary,
  ObjectId,
} from "@/types/domain";

export type OperatorInventorySchemaVersion = "operator-inventory.v1";

export type OperatorInventoryFamily =
  | "networkNode"
  | "gate"
  | "storage"
  | "turret"
  | "printer"
  | "refinery"
  | "assembler"
  | "berth"
  | "relay"
  | "nursery"
  | "nest"
  | "shelter";

export type OperatorInventorySize = "mini" | "standard" | "heavy" | null;

export type OperatorInventoryStatus = "online" | "offline" | "unanchored" | "unknown" | "warning";

export interface OperatorInventoryOperator {
  walletAddress: string;
  characterId: ObjectId | null;
  characterName: string | null;
  tribeId: number | null;
  tribeName: string | null;
}

export interface OperatorInventoryStructure {
  objectId: ObjectId | null;
  assemblyId: string | null;
  ownerCapId: ObjectId | null;
  family: OperatorInventoryFamily | null;
  size: OperatorInventorySize;
  displayName: string | null;
  name: string | null;
  typeId: number | null;
  typeName: string | null;
  assemblyType: string | null;
  status: OperatorInventoryStatus | null;
  networkNodeId: ObjectId | null;
  energySourceId: string | null;
  linkedGateId: ObjectId | null;
  ownerWalletAddress: string | null;
  characterId: ObjectId | null;
  extensionStatus: "authorized" | "stale" | "none" | null;
  fuelAmount: string | null;
  powerSummary: IndexedPowerSummary | null;
  powerRequirement: IndexedPowerRequirement | null;
  powerUsageSummary: IndexedNodePowerUsageSummary | null;
  solarSystemId: string | null;
  url: string | null;
  lastObservedCheckpoint: string | null;
  lastObservedTimestamp: string | null;
  lastUpdated: string | null;
  source: string | null;
  provenance: string | null;
  partial: boolean;
  warnings: string[];
  actionCandidate: IndexedActionCandidate | null;
}

export interface OperatorInventoryNode {
  node: OperatorInventoryStructure;
  structures: OperatorInventoryStructure[];
}

export interface OperatorInventoryResponse {
  schemaVersion: OperatorInventorySchemaVersion;
  operator: OperatorInventoryOperator | null;
  networkNodes: OperatorInventoryNode[];
  unlinkedStructures: OperatorInventoryStructure[];
  warnings: string[];
  partial: boolean;
  source: string | null;
  fetchedAt: string | null;
}