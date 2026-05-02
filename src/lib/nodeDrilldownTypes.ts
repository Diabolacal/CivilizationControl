import type { Structure, StructureStatus } from "@/types/domain";

export type NodeLocalSource = "live" | "synthetic";

export type NodeLocalFamily =
  | "networkNode"
  | "gate"
  | "tradePost"
  | "turret"
  | "printer"
  | "refinery"
  | "assembler"
  | "berth"
  | "relay"
  | "nursery"
  | "nest"
  | "shelter";

export type NodeLocalBand = "corridor" | "industry" | "logistics" | "support" | "defense";

export type NodeLocalIconFamily =
  | "networkNode"
  | "gate"
  | "tradePost"
  | "turret"
  | "printer"
  | "refinery"
  | "assembler"
  | "berth"
  | "relay"
  | "nursery"
  | "hangar"
  | "nest";

export type NodeLocalTone = "neutral" | "online" | "offline" | "warning";

export type NodeLocalBadge = "M" | "H" | null;

export type NodeLocalSizeVariant = "mini" | "standard" | "heavy" | null;

export interface NodeLocalNode {
  id: string;
  objectId?: string;
  displayName: string;
  status: StructureStatus;
  tone: NodeLocalTone;
  warningPip: boolean;
  source: NodeLocalSource;
  fuelSummary?: string;
  extensionStatus?: Structure["extensionStatus"];
  solarSystemName?: string | null;
  isSyntheticContainer?: boolean;
}

export interface NodeLocalStructure {
  id: string;
  objectId?: string;
  assemblyId?: string;
  linkedGateId?: string;
  typeId?: number;
  displayName: string;
  typeLabel: string;
  family: NodeLocalFamily;
  familyLabel: string;
  iconFamily: NodeLocalIconFamily;
  band: NodeLocalBand;
  sizeVariant: NodeLocalSizeVariant;
  badge: NodeLocalBadge;
  status: StructureStatus;
  tone: NodeLocalTone;
  warningPip: boolean;
  source: NodeLocalSource;
  extensionStatus?: Structure["extensionStatus"];
  sortLabel: string;
}

export interface NodeLocalViewModel {
  node: NodeLocalNode;
  structures: NodeLocalStructure[];
  source: NodeLocalSource;
  layoutAlgorithm: "family-bands-v1";
  coverage: "current-live-families" | "synthetic-expanded";
}

export interface NodeLocalScenario {
  id: string;
  label: string;
  description: string;
  viewModel: NodeLocalViewModel;
}

export interface SyntheticNodeLocalStructureInput {
  family: Exclude<NodeLocalFamily, "networkNode">;
  displayName: string;
  typeLabel?: string;
  sizeVariant?: NodeLocalSizeVariant;
  status?: StructureStatus;
  warningPip?: boolean;
  linkedGateId?: string;
}

export interface SyntheticNodeLocalViewModelInput {
  nodeId: string;
  nodeLabel: string;
  nodeStatus?: StructureStatus;
  nodeWarningPip?: boolean;
  description?: string;
  solarSystemName?: string;
  structures: SyntheticNodeLocalStructureInput[];
}