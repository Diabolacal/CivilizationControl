import { buildSyntheticNodeLocalViewModel } from "@/lib/nodeDrilldownModel";

import type { NodeLocalScenario, SyntheticNodeLocalStructureInput } from "./nodeDrilldownTypes";

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
  };
}

export const NODE_DRILLDOWN_SCENARIOS: NodeLocalScenario[] = [
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