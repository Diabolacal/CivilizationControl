/**
 * Core domain types for CivilizationControl.
 *
 * Models the proven on-chain ownership chain:
 *   wallet → PlayerProfile → Character → OwnerCaps → shared assemblies
 *
 * Network nodes are the primary grouping unit.
 * Structures inherit location from their parent network node.
 */

/** Sui object address (0x-prefixed hex string). */
export type ObjectId = string;

/** Sui transaction digest. */
export type TxDigest = string;

/** Structure types matching on-chain assembly categories. */
export type StructureType = "gate" | "storage_unit" | "turret" | "network_node";

/** Operational status derived from on-chain state. */
export type StructureStatus = "online" | "warning" | "offline" | "neutral";

export interface IndexedActionRequiredIds {
  structureId: ObjectId | null;
  structureType: StructureType | null;
  ownerCapId: ObjectId | null;
  networkNodeId: ObjectId | null;
}

export interface IndexedStructureAction {
  candidate: boolean;
  currentlyImplementedInCivilizationControl: boolean;
  familySupported: boolean | null;
  indexedOwnerCapPresent: boolean | null;
  requiredIds: IndexedActionRequiredIds | null;
  unavailableReason: string | null;
}

export interface IndexedActionCandidate {
  actions: {
    power: IndexedStructureAction | null;
    rename: IndexedStructureAction | null;
  };
  supported: boolean | null;
  familySupported: boolean | null;
  unavailableReason: string | null;
}

/** Optional shared-backend assembly summary keyed by decimal assembly ID. */
export interface AssemblySummary {
  assemblyId: string;
  assemblyType: string | null;
  typeId: number | null;
  name: string | null;
  displayName?: string | null;
  status: string | null;
  fuelAmount: string | null;
  solarSystemId: string | null;
  energySourceId: string | null;
  url: string | null;
  lastUpdated: string | null;
  typeName: string | null;
  family?: string | null;
  size?: string | null;
  source?: string | null;
  provenance?: string | null;
  lastObservedCheckpoint?: string | null;
  lastObservedTimestamp?: string | null;
  extensionStatus?: "authorized" | "stale" | "none" | null;
  partial?: boolean;
  warnings?: string[];
  actionCandidate?: IndexedActionCandidate | null;
}

/** Provenance metadata for backend-observed node-local discovery rows. */
export interface NodeAssemblyProvenance {
  source: string | null;
  provenance: string | null;
}

/** Selected network node summary returned by the node-local backend discovery endpoint. */
export interface NodeAssemblyNode {
  objectId: ObjectId;
  name: string | null;
  displayName?: string | null;
  status: string | null;
  assemblyId: string | null;
  solarSystemId: string | null;
  energySourceId: string | null;
}

/** Backend-observed linked assembly returned for a selected network node. */
export interface NodeAssemblySummary extends NodeAssemblyProvenance {
  objectId: ObjectId | null;
  assemblyId: string | null;
  linkedGateId: ObjectId | null;
  assemblyType: string | null;
  typeId: number | null;
  name: string | null;
  displayName?: string | null;
  family?: string | null;
  size?: string | null;
  status: string | null;
  fuelAmount: string | null;
  powerSummary?: string | null;
  solarSystemId: string | null;
  energySourceId: string | null;
  url: string | null;
  lastUpdated: string | null;
  lastObservedCheckpoint?: string | null;
  lastObservedTimestamp?: string | null;
  typeName: string | null;
  ownerCapId?: ObjectId | null;
  ownerWalletAddress?: string | null;
  characterId?: ObjectId | null;
  extensionStatus?: "authorized" | "stale" | "none" | null;
  partial?: boolean;
  warnings?: string[];
  actionCandidate?: IndexedActionCandidate | null;
}

/** Browser-safe node-local discovery response keyed by selected network-node object ID. */
export interface NodeAssembliesResponse {
  node: NodeAssemblyNode;
  assemblies: NodeAssemblySummary[];
  fetchedAt: string | null;
  source: string | null;
}

/** Player profile resolved from wallet connection. */
export interface PlayerProfile {
  objectId: ObjectId;
  characterId: ObjectId;
  characterName: string;
  tribeId: number;
}

/** An OwnerCap discovered on a Character object. */
export interface OwnerCapInfo {
  ownerCapId: ObjectId;
  authorizedObjectId: ObjectId;
  structureType: StructureType;
}

/** A resolved on-chain structure (gate, SSU, turret, or network node). */
export interface Structure {
  /** Decimal in-game assembly ID from the on-chain TenantItemId key. */
  assemblyId?: string;
  objectId: ObjectId;
  ownerCapId: ObjectId;
  /** Indicates whether the row came from direct-chain discovery or the indexed read model. */
  readModelSource?: "direct-chain" | "operator-inventory";
  type: StructureType;
  name: string;
  status: StructureStatus;
  /** Parent network node ID — undefined for network nodes themselves. */
  networkNodeId?: ObjectId;
  /** Fuel state for network nodes. */
  fuel?: FuelState;
  /** Linked destination gate ID — only present for linked gates. */
  linkedGateId?: ObjectId;
  /** Optional shared-backend enrichment; direct-chain fields remain authoritative. */
  summary?: AssemblySummary;
  /**
   * Extension authorization status:
   * - "authorized" — extension matches the current CC package witness type
   * - "stale" — an extension exists but from a different (old) package
   * - "none" — no extension registered
   */
  extensionStatus: "authorized" | "stale" | "none";
}

/** Fuel state read from on-chain Fuel struct. */
export interface FuelState {
  /** Number of fuel units currently loaded. */
  quantity: number;
  /** Maximum volume capacity (unit_volume × max_units). */
  maxCapacity: number;
  /** Base burn rate in milliseconds per 1 fuel unit (at 100% efficiency). */
  burnRateMs: number;
  /** Whether fuel is actively being consumed. */
  isBurning: boolean;
  /** Fuel item type ID — used to resolve name and efficiency. */
  typeId?: number;
  /** Volume per fuel unit — used to compute max unit count from maxCapacity. */
  unitVolume?: number;
}

/** A network node with its grouped child structures. */
export interface NetworkNodeGroup {
  node: Structure;
  gates: Structure[];
  storageUnits: Structure[];
  turrets: Structure[];
  /** Manually assigned solar system for onboarding/location. */
  solarSystemId?: number;
}

/** Item type from the World API catalog (bundled at build time). */
export interface ItemType {
  typeId: number;
  name: string;
  description: string;
  mass: number;
  volume: number;
  portionSize: number;
  groupName: string;
  groupId: number;
  categoryName: string;
  categoryId: number;
}

/** Solar system from the World API catalog. */
export interface SolarSystem {
  solarSystemId: number;
  solarSystemName: string;
  constellationId: number;
  regionId: number;
  /** Raw API coordinates (not transformed). */
  location: { x: number; y: number; z: number };
}

/** Tribe from the World API catalog. */
export interface Tribe {
  tribeId: number;
  name: string;
  nameShort: string;
}

/**
 * Coordinate transform for rendering.
 * Raw World API: (x, y, z)
 * Render space:  (x, z, -y) per Scetrov coordinate-system reference.
 */
export interface RenderCoordinate {
  x: number;
  y: number;
}

/** Spatial pin: manual assignment of a solar system to a network node. */
export interface SpatialPin {
  networkNodeId: ObjectId;
  solarSystemId: number;
  solarSystemName: string;
  /** Timestamp of assignment (ISO string). */
  assignedAt: string;
}

/** Aggregate metrics for the command overview. */
export interface NetworkMetrics {
  totalStructures: number;
  onlineCount: number;
  gateCount: number;
  governedGateCount: number;
  storageUnitCount: number;
  turretCount: number;
  networkNodeCount: number;
  enforcedDirectives: number;
}

// ─── Listing Types ───────────────────────────────────────

/** A live marketplace listing (shared object from TradePost). */
export interface Listing {
  objectId: ObjectId;
  storageUnitId: ObjectId;
  seller: string;
  itemTypeId: number;
  quantity: number;
  /** Price in EVE base units (divide by 10_000_000 for Lux). */
  price: number;
}

// ─── Gate Policy Types (v2a — Preset Model) ─────────────

/** A tribe-specific policy entry within a preset. */
export interface TribePolicyEntry {
  tribe: number;
  access: boolean;
  toll: number;
}

/** Full policy preset for a gate under one posture mode. */
export interface PolicyPreset {
  entries: TribePolicyEntry[];
  defaultAccess: boolean;
  /** Default toll in EVE base units (divide by 10_000_000 for Lux). */
  defaultToll: number;
}

/** Resolved policy state for a single gate from GateConfig dynamic fields. */
export interface GatePolicy {
  gateId: ObjectId;
  commercialPreset: PolicyPreset | null;
  defensePreset: PolicyPreset | null;
  /** Global treasury payout address from GateConfig (shared across gates). */
  treasury: string | null;
}

// ─── Signal Feed Types ───────────────────────────────────

/** Event category for Signal Feed grouping. */
export type SignalCategory = "governance" | "trade" | "transit" | "status";

/** Visual variant for signal rendering. */
export type SignalVariant = "revenue" | "blocked" | "neutral" | "info";

/** Parsed on-chain event for the Signal Feed. */
export interface SignalEvent {
  /** Unique key: txDigest + eventSeq. */
  id: string;
  /** Transaction digest. */
  txDigest: TxDigest;
  /** Event sequence within the transaction. */
  eventSeq: string;
  /** ISO timestamp from chain. */
  timestamp: string;
  /** Short event type label for display. */
  label: string;
  /** Human-readable description. */
  description: string;
  /** Signal category. */
  category: SignalCategory;
  /** Visual variant. */
  variant: SignalVariant;
  /** Related object ID if applicable (gate, listing, etc.). */
  relatedObjectId?: ObjectId;
  /** Secondary related object ID (e.g. storage_unit_id on trade events). */
  secondaryObjectId?: ObjectId;
  /** Tx sender address. */
  sender?: string;
  /** Owner address for scoping (e.g. seller on trade events). */
  ownerAddress?: string;
  /** Amount in EVE base units, if applicable (toll, trade). Divide by 10_000_000 for Lux. */
  amount?: number;
}

// ─── Transaction Feedback Types ──────────────────────────

/** Transaction execution status for mutation feedback. */
export type TxStatus = "idle" | "pending" | "success" | "error";

/** Result of a signed transaction. */
export interface TxResult {
  digest: string;
}

// ─── SSU Inventory Types ─────────────────────────────────

/** A single item entry within an SSU inventory slot. */
export interface InventoryEntry {
  typeId: number;
  itemId: number;
  volume: number;
  quantity: number;
}

/** An inventory slot (main, open, or per-player owned). */
export interface InventorySlot {
  key: ObjectId;
  maxCapacity: number;
  usedCapacity: number;
  items: InventoryEntry[];
}

// ─── Posture Types ───────────────────────────────────────

/** Network-wide operational posture. */
export type PostureMode = "commercial" | "defense";

/** Posture state resolved from on-chain GateConfig dynamic field. */
export interface PostureState {
  mode: PostureMode;
}

/** Info needed per-turret for posture switch PTB. */
export interface TurretSwitchTarget {
  turretId: ObjectId;
  ownerCapId: ObjectId;
}

/** Info needed per-gate for batch extension authorization. */
export interface GateAuthTarget {
  gateId: ObjectId;
  ownerCapId: ObjectId;
}

/** Info needed per-gate for posture switch PTB. */
export interface GatePostureTarget {
  gateId: ObjectId;
  ownerCapId: ObjectId;
}

/** Info needed per-gate for batch preset deployment. */
export interface GatePolicyTarget {
  gateId: ObjectId;
  ownerCapId: ObjectId;
  gateName: string;
}

/** Info needed per-SSU for batch extension authorization. */
export interface SsuAuthTarget {
  ssuId: ObjectId;
  ownerCapId: ObjectId;
}
