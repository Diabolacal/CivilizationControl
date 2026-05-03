import { buildSyntheticNodeLocalViewModel } from "@/lib/nodeDrilldownModel";

import type { NodeLocalActionAuthority, NodeLocalActionCandidateTarget, NodeLocalScenario, NodeLocalStructure, SyntheticNodeLocalStructureInput } from "./nodeDrilldownTypes";

function toneForStatus(status: NodeLocalStructure["status"]): NodeLocalStructure["tone"] {
  switch (status) {
    case "online":
      return "online";
    case "offline":
      return "offline";
    case "warning":
      return "warning";
    default:
      return "neutral";
  }
}

function applyStructureOverride(
  structure: NodeLocalStructure,
  override: Partial<NodeLocalStructure> & { actionAuthority?: NodeLocalActionAuthority },
): NodeLocalStructure {
  const status = override.status ?? structure.status;
  return {
    ...structure,
    ...override,
    status,
    tone: override.tone ?? toneForStatus(status),
    actionAuthority: override.actionAuthority ?? structure.actionAuthority,
  };
}

function candidate(
  structureId: string,
  structureType: NodeLocalActionCandidateTarget["structureType"],
  status: NodeLocalActionCandidateTarget["status"],
  options: Pick<NodeLocalActionCandidateTarget, "ownerCapId" | "networkNodeId"> = {},
): NodeLocalActionCandidateTarget {
  return {
    structureId,
    structureType,
    status,
    ownerCapId: options.ownerCapId,
    networkNodeId: options.networkNodeId,
  };
}

function repeatStructures(
  family: SyntheticNodeLocalStructureInput["family"],
  count: number,
  options: {
    labelPrefix: string;
    sizeVariant?: SyntheticNodeLocalStructureInput["sizeVariant"];
    typeLabel?: string;
    status?: SyntheticNodeLocalStructureInput["status"];
    warningPip?: boolean;
    startIndex?: number;
  },
): SyntheticNodeLocalStructureInput[] {
  const startIndex = options.startIndex ?? 1;

  return Array.from({ length: count }, (_, index) => ({
    family,
    displayName: `${options.labelPrefix} ${startIndex + index}`,
    sizeVariant: options.sizeVariant,
    typeLabel: options.typeLabel,
    status: options.status,
    warningPip: options.warningPip,
  }));
}

function createScenario(config: {
  id: string;
  label: string;
  description: string;
  nodeLabel: string;
  structures: SyntheticNodeLocalStructureInput[];
  initialHiddenCanonicalKeys?: string[];
}): NodeLocalScenario {
  return {
    id: config.id,
    label: config.label,
    description: config.description,
    viewModel: buildSyntheticNodeLocalViewModel({
      nodeId: config.id,
      nodeLabel: config.nodeLabel,
      structures: config.structures,
    }),
    initialHiddenCanonicalKeys: config.initialHiddenCanonicalKeys,
  };
}

function createAuthorityMatrixScenario(): NodeLocalScenario {
  const baseScenario = createScenario({
    id: "authority-matrix",
    label: "Authority Matrix",
    description: "Verified, hidden, backend-only, ambiguous, unsupported, and missing-context rows for Phase E action review.",
    nodeLabel: "Authority Review Node",
    structures: [
      { family: "tradePost", displayName: "Storage Alpha", typeLabel: "Storage", status: "online" },
      { family: "turret", displayName: "Turret Beta", typeLabel: "Turret", status: "offline" },
      { family: "printer", displayName: "Printer Gamma", typeLabel: "Printer", status: "online" },
      { family: "assembler", displayName: "Assembler Delta", typeLabel: "Assembler", status: "online" },
      { family: "gate", displayName: "Gate Epsilon", typeLabel: "Mini Gate", sizeVariant: "mini", status: "online" },
      { family: "gate", displayName: "Gate Zeta", typeLabel: "Mini Gate", sizeVariant: "mini", status: "warning", warningPip: true },
      { family: "gate", displayName: "Gate Eta", typeLabel: "Mini Gate", sizeVariant: "mini", status: "neutral" },
    ],
  });

  const nodeId = baseScenario.viewModel.node.id;
  const structures = baseScenario.viewModel.structures.map((structure) => {
    switch (structure.displayName) {
      case "Storage Alpha":
        return applyStructureOverride(structure, {
          source: "live",
          objectId: "0xstoragealpha",
          assemblyId: "41001",
          directChainObjectId: "0xstoragealpha",
          directChainAssemblyId: "41001",
          hasDirectChainAuthority: true,
          directChainMatchCount: 1,
          futureActionEligible: true,
          isReadOnly: false,
          isActionable: true,
          actionAuthority: {
            state: "verified-supported",
            verifiedTarget: {
              structureId: "0xstoragealpha",
              structureType: "storage_unit",
              ownerCapId: "0xstoragecapalpha",
              networkNodeId: nodeId,
              status: "online",
            },
            candidateTargets: [candidate("0xstoragealpha", "storage_unit", "online", { ownerCapId: "0xstoragecapalpha", networkNodeId: nodeId })],
          },
        });
      case "Turret Beta":
        return applyStructureOverride(structure, {
          source: "live",
          objectId: "0xturretbeta",
          assemblyId: "41002",
          directChainObjectId: "0xturretbeta",
          directChainAssemblyId: "41002",
          hasDirectChainAuthority: true,
          directChainMatchCount: 1,
          futureActionEligible: true,
          isReadOnly: false,
          isActionable: true,
          actionAuthority: {
            state: "verified-supported",
            verifiedTarget: {
              structureId: "0xturretbeta",
              structureType: "turret",
              ownerCapId: "0xturretcapbeta",
              networkNodeId: nodeId,
              status: "offline",
            },
            candidateTargets: [candidate("0xturretbeta", "turret", "offline", { ownerCapId: "0xturretcapbeta", networkNodeId: nodeId })],
          },
        });
      case "Printer Gamma":
        return applyStructureOverride(structure, {
          source: "backendMembership",
          objectId: undefined,
          assemblyId: "51001",
          directChainObjectId: null,
          directChainAssemblyId: null,
          hasDirectChainAuthority: false,
          directChainMatchCount: 0,
          futureActionEligible: false,
          actionAuthority: {
            state: "backend-only",
            verifiedTarget: null,
            candidateTargets: [],
          },
        });
      case "Assembler Delta":
        return applyStructureOverride(structure, {
          source: "backendMembership",
          objectId: "0xassemblerdelta",
          assemblyId: "51002",
          directChainObjectId: "0xassemblerdelta",
          directChainAssemblyId: "51002",
          hasDirectChainAuthority: true,
          directChainMatchCount: 1,
          futureActionEligible: true,
          actionAuthority: {
            state: "unsupported-family",
            verifiedTarget: null,
            candidateTargets: [candidate("0xassemblerdelta", "storage_unit", "online", { ownerCapId: "0xassemblercapdelta", networkNodeId: nodeId })],
          },
        });
      case "Gate Epsilon":
        return applyStructureOverride(structure, {
          source: "live",
          objectId: "0xgateepsilon",
          assemblyId: "41003",
          directChainObjectId: "0xgateepsilon",
          directChainAssemblyId: "41003",
          hasDirectChainAuthority: true,
          directChainMatchCount: 1,
          futureActionEligible: true,
          isReadOnly: false,
          isActionable: true,
          actionAuthority: {
            state: "verified-supported",
            verifiedTarget: {
              structureId: "0xgateepsilon",
              structureType: "gate",
              ownerCapId: "0xgatecapepsilon",
              networkNodeId: nodeId,
              status: "online",
            },
            candidateTargets: [candidate("0xgateepsilon", "gate", "online", { ownerCapId: "0xgatecapepsilon", networkNodeId: nodeId })],
          },
        });
      case "Gate Zeta":
        return applyStructureOverride(structure, {
          source: "backendMembership",
          objectId: "0xgatezeta",
          assemblyId: "51003",
          directChainObjectId: "0xgatezeta-a",
          directChainAssemblyId: "51003",
          hasDirectChainAuthority: true,
          directChainMatchCount: 2,
          futureActionEligible: false,
          actionAuthority: {
            state: "ambiguous-match",
            verifiedTarget: null,
            candidateTargets: [
              candidate("0xgatezeta-a", "gate", "warning", { ownerCapId: "0xgatecapzetaa", networkNodeId: nodeId }),
              candidate("0xgatezeta-b", "gate", "offline", { ownerCapId: "0xgatecapzetab", networkNodeId: nodeId }),
            ],
          },
        });
      case "Gate Eta":
        return applyStructureOverride(structure, {
          source: "backendMembership",
          objectId: "0xgateeta",
          assemblyId: "51004",
          directChainObjectId: "0xgateeta",
          directChainAssemblyId: "51004",
          hasDirectChainAuthority: true,
          directChainMatchCount: 1,
          futureActionEligible: false,
          actionAuthority: {
            state: "missing-node-context",
            verifiedTarget: null,
            candidateTargets: [candidate("0xgateeta", "gate", "neutral", { ownerCapId: "0xgatecapeta" })],
          },
        });
      default:
        return structure;
    }
  });
  const hiddenGate = structures.find((structure) => structure.displayName === "Gate Epsilon");

  return {
    ...baseScenario,
    viewModel: {
      ...baseScenario.viewModel,
      structures,
    },
    initialHiddenCanonicalKeys: hiddenGate ? [hiddenGate.canonicalDomainKey] : undefined,
  };
}

export const NODE_DRILLDOWN_SCENARIOS: NodeLocalScenario[] = [
  createAuthorityMatrixScenario(),
  createScenario({
    id: "sparse-solo-node",
    label: "Sparse Solo Node",
    description: "Minimal live-like footprint using the currently hydrated live families only.",
    nodeLabel: "Khanid Relay",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Gate", sizeVariant: "mini", typeLabel: "Mini Gate" }),
      ...repeatStructures("tradePost", 1, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("turret", 1, { labelPrefix: "Turret", typeLabel: "Turret" }),
    ],
  }),
  createScenario({
    id: "industry-node",
    label: "Industry Node",
    description: "Primary industry rows plus logistics support around a stable operating node.",
    nodeLabel: "Aritcio Foundry",
    structures: [
      ...repeatStructures("printer", 4, { labelPrefix: "Printer", typeLabel: "Printer" }),
      ...repeatStructures("printer", 1, { labelPrefix: "Heavy Printer", sizeVariant: "heavy", typeLabel: "Heavy Printer" }),
      ...repeatStructures("refinery", 2, { labelPrefix: "Refinery", typeLabel: "Refinery" }),
      ...repeatStructures("assembler", 1, { labelPrefix: "Assembler", typeLabel: "Assembler" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 2, { labelPrefix: "Berth", typeLabel: "Berth" }),
      ...repeatStructures("gate", 2, { labelPrefix: "Gate", sizeVariant: "heavy", typeLabel: "Heavy Gate" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery" }),
    ],
  }),
  createScenario({
    id: "no-gate-industry-node",
    label: "No-Gate Industry Node",
    description: "Industry-led node with logistics and support, but no corridor rail, for direct comparison against Industry Node.",
    nodeLabel: "Aritcio Reserve",
    structures: [
      ...repeatStructures("printer", 4, { labelPrefix: "Printer", typeLabel: "Printer" }),
      ...repeatStructures("printer", 1, { labelPrefix: "Heavy Printer", sizeVariant: "heavy", typeLabel: "Heavy Printer" }),
      ...repeatStructures("refinery", 2, { labelPrefix: "Refinery", typeLabel: "Refinery" }),
      ...repeatStructures("assembler", 1, { labelPrefix: "Assembler", typeLabel: "Assembler" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 2, { labelPrefix: "Berth", typeLabel: "Berth" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery" }),
    ],
  }),
  createScenario({
    id: "no-gate-dense-manufacturing",
    label: "No-Gate Dense Manufacturing",
    description: "Dense manufacturing stack with no gate rail and no defense block, for corridor-free compacting and centering validation.",
    nodeLabel: "Kador Fabrication Ring",
    structures: [
      ...repeatStructures("printer", 4, { labelPrefix: "Printer", typeLabel: "Printer" }),
      ...repeatStructures("printer", 1, { labelPrefix: "Heavy Printer", sizeVariant: "heavy", typeLabel: "Heavy Printer" }),
      ...repeatStructures("refinery", 2, { labelPrefix: "Refinery", typeLabel: "Refinery" }),
      ...repeatStructures("refinery", 1, { labelPrefix: "Heavy Refinery", sizeVariant: "heavy", typeLabel: "Heavy Refinery" }),
      ...repeatStructures("assembler", 2, { labelPrefix: "Assembler", typeLabel: "Assembler" }),
      ...repeatStructures("tradePost", 3, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 3, { labelPrefix: "Berth", typeLabel: "Berth" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery" }),
      ...repeatStructures("shelter", 1, { labelPrefix: "Shelter", typeLabel: "Shelter" }),
    ],
  }),
  createScenario({
    id: "mixed-operating-base",
    label: "Mixed Operating Base",
    description: "Balanced industry, logistics, support, and defense around one active node. Use this fixture for hide/unhide review across map, list, and inspector.",
    nodeLabel: "Caldari Exchange",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Gate", sizeVariant: "mini", typeLabel: "Mini Gate" }),
      ...repeatStructures("printer", 3, { labelPrefix: "Printer", typeLabel: "Printer" }),
      ...repeatStructures("refinery", 1, { labelPrefix: "Heavy Refinery", sizeVariant: "heavy", typeLabel: "Heavy Refinery" }),
      ...repeatStructures("assembler", 1, { labelPrefix: "Assembler", typeLabel: "Assembler" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 2, { labelPrefix: "Berth", typeLabel: "Berth" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery" }),
      ...repeatStructures("shelter", 1, { labelPrefix: "Shelter", typeLabel: "Shelter" }),
      ...repeatStructures("turret", 8, { labelPrefix: "Turret", typeLabel: "Turret" }),
    ],
  }),
  createScenario({
    id: "support-clutter-test",
    label: "Support Clutter Test",
    description: "Compact support-band validation with mixed relay, nursery, nest, and shelter counts.",
    nodeLabel: "Support Terrace",
    structures: [
      ...repeatStructures("gate", 1, { labelPrefix: "Gate", sizeVariant: "mini", typeLabel: "Mini Gate" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("relay", 4, { labelPrefix: "Relay", typeLabel: "Relay" }),
      ...repeatStructures("nursery", 3, { labelPrefix: "Nursery", typeLabel: "Nursery" }),
      ...repeatStructures("nest", 2, { labelPrefix: "Nest", typeLabel: "Nest" }),
      ...repeatStructures("shelter", 4, { labelPrefix: "Shelter", typeLabel: "Shelter" }),
      ...repeatStructures("turret", 6, { labelPrefix: "Turret", typeLabel: "Turret" }),
    ],
  }),
  createScenario({
    id: "defense-heavy-node",
    label: "Defense Heavy Node",
    description: "A heavy perimeter posture with dense defensive placement and corridor coverage.",
    nodeLabel: "Outer Bastion",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Heavy Gate", sizeVariant: "heavy", typeLabel: "Heavy Gate" }),
      ...repeatStructures("tradePost", 1, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("turret", 12, { labelPrefix: "Turret", typeLabel: "Turret", status: "warning", warningPip: true }),
      ...repeatStructures("turret", 4, { labelPrefix: "Heavy Turret", sizeVariant: "heavy", typeLabel: "Heavy Turret", status: "warning", warningPip: true, startIndex: 13 }),
    ],
  }),
  createScenario({
    id: "turret-stress-test",
    label: "Turret Stress Test",
    description: "High-density defensive block for first-slice dense layout validation.",
    nodeLabel: "Perimeter Lock",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Heavy Gate", sizeVariant: "heavy", typeLabel: "Heavy Gate" }),
      ...repeatStructures("turret", 34, { labelPrefix: "Turret", typeLabel: "Turret" }),
      ...repeatStructures("turret", 8, { labelPrefix: "Mini Turret", sizeVariant: "mini", typeLabel: "Mini Turret", startIndex: 35 }),
      ...repeatStructures("turret", 8, { labelPrefix: "Heavy Turret", sizeVariant: "heavy", typeLabel: "Heavy Turret", startIndex: 43 }),
    ],
  }),
];