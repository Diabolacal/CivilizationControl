import { buildSyntheticNodeLocalViewModel } from "@/lib/nodeDrilldownModel";
import type {
  IndexedActionCandidate,
  IndexedNodePowerUsageSummary,
  IndexedPowerRequirement,
  IndexedActionRequiredIds,
  IndexedStructureAction,
  StructureActionTargetType,
} from "@/types/domain";

import type {
  NodeLocalActionCandidateTarget,
  NodeLocalScenario,
  SyntheticNodeLocalStructureInput,
} from "./nodeDrilldownTypes";

const CONTROLLABLE_TARGET_BY_FAMILY: Record<SyntheticNodeLocalStructureInput["family"], StructureActionTargetType> = {
  gate: "gate",
  tradePost: "storage_unit",
  turret: "turret",
  printer: "assembly",
  refinery: "assembly",
  assembler: "assembly",
  berth: "assembly",
  relay: "assembly",
  nursery: "assembly",
  nest: "assembly",
  shelter: "assembly",
};

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

function fixtureSeed(scenarioId: string, index: number): bigint {
  let seed = 0;

  for (const character of scenarioId) {
    seed = (seed * 33 + character.charCodeAt(0)) % 1_000_000;
  }

  return BigInt(seed * 100 + index + 1);
}

function fixtureHex(seed: bigint, offset = 0n): string {
  return `0x${(seed + offset).toString(16).padStart(64, "0")}`;
}

function fixtureAssemblyId(seed: bigint): string {
  return (500_000n + seed).toString();
}

function buildIndexedAction(
  requiredIds: IndexedActionRequiredIds,
  overrides: Partial<IndexedStructureAction> = {},
): IndexedStructureAction {
  return {
    candidate: true,
    currentlyImplementedInCivilizationControl: true,
    familySupported: true,
    indexedOwnerCapPresent: requiredIds.ownerCapId != null,
    requiredIds,
    unavailableReason: null,
    ...overrides,
  };
}

function buildControllableActionCandidate(
  structureId: string,
  structureType: StructureActionTargetType,
  ownerCapId: string,
  networkNodeId: string,
): IndexedActionCandidate {
  const requiredIds: IndexedActionRequiredIds = {
    structureId,
    structureType,
    ownerCapId,
    networkNodeId,
  };

  return {
    actions: {
      power: buildIndexedAction(requiredIds),
      rename: buildIndexedAction(requiredIds),
    },
    supported: true,
    familySupported: true,
    unavailableReason: null,
  };
}

function createPowerRequirement(
  requiredGj: number | null,
  overrides: Partial<IndexedPowerRequirement> = {},
): IndexedPowerRequirement {
  return {
    requiredGj,
    source: requiredGj == null ? "unavailable" : "indexed_type",
    confidence: requiredGj == null ? "unavailable" : "indexed",
    typeId: null,
    family: null,
    size: null,
    lastUpdated: "2026-05-05T12:00:00.000Z",
    ...overrides,
  };
}

function createPowerUsageSummary(
  overrides: Partial<IndexedNodePowerUsageSummary> = {},
): IndexedNodePowerUsageSummary {
  return {
    capacityGj: 1000,
    usedGj: null,
    availableGj: null,
    onlineKnownLoadGj: null,
    onlineUnknownLoadCount: 0,
    totalKnownLoadGj: null,
    totalUnknownLoadCount: 0,
    source: "indexed_children",
    confidence: "indexed",
    lastUpdated: "2026-05-05T12:00:00.000Z",
    ...overrides,
  };
}

function buildMissingOwnerCapActionCandidate(
  structureId: string,
  structureType: StructureActionTargetType,
  networkNodeId: string,
): IndexedActionCandidate {
  const requiredIds: IndexedActionRequiredIds = {
    structureId,
    structureType,
    ownerCapId: null,
    networkNodeId,
  };

  return {
    actions: {
      power: buildIndexedAction(requiredIds, {
        indexedOwnerCapPresent: false,
        unavailableReason: "Authority proof is unavailable for this structure.",
      }),
      rename: buildIndexedAction(requiredIds, {
        indexedOwnerCapPresent: false,
        unavailableReason: "Authority proof is unavailable for this structure.",
      }),
    },
    supported: true,
    familySupported: true,
    unavailableReason: "Authority proof is unavailable for this structure.",
  };
}

function buildMissingNodeContextActionCandidate(
  structureId: string,
  structureType: StructureActionTargetType,
  ownerCapId: string,
): IndexedActionCandidate {
  const requiredIds: IndexedActionRequiredIds = {
    structureId,
    structureType,
    ownerCapId,
    networkNodeId: null,
  };

  return {
    actions: {
      power: buildIndexedAction(requiredIds, {
        unavailableReason: "Linked node context is unavailable for this structure.",
      }),
      rename: buildIndexedAction(requiredIds, {
        unavailableReason: "Linked node context is unavailable for this structure.",
      }),
    },
    supported: true,
    familySupported: true,
    unavailableReason: "Linked node context is unavailable for this structure.",
  };
}

function createControllableFixture(
  nodeId: string,
  scenarioId: string,
  index: number,
  structure: SyntheticNodeLocalStructureInput,
): SyntheticNodeLocalStructureInput {
  const targetType = CONTROLLABLE_TARGET_BY_FAMILY[structure.family];
  const seed = fixtureSeed(scenarioId, index);
  const objectId = structure.objectId ?? fixtureHex(seed);
  const assemblyId = structure.assemblyId ?? fixtureAssemblyId(seed);
  const ownerCapId = fixtureHex(seed, 1_000_000n);

  return {
    ...structure,
    source: structure.source ?? "backendMembership",
    objectId,
    assemblyId,
    actionCandidate: structure.actionCandidate ?? buildControllableActionCandidate(
      objectId,
      targetType,
      ownerCapId,
      nodeId,
    ),
  };
}

function createMissingOwnerCapFixture(
  nodeId: string,
  scenarioId: string,
  index: number,
  structure: SyntheticNodeLocalStructureInput,
): SyntheticNodeLocalStructureInput {
  const targetType = CONTROLLABLE_TARGET_BY_FAMILY[structure.family];
  const seed = fixtureSeed(scenarioId, index);
  const objectId = structure.objectId ?? fixtureHex(seed);
  const assemblyId = structure.assemblyId ?? fixtureAssemblyId(seed);

  return {
    ...structure,
    source: "backendMembership",
    objectId,
    assemblyId,
    actionCandidate: buildMissingOwnerCapActionCandidate(objectId, targetType, nodeId),
  };
}

function createMissingNodeContextFixture(
  scenarioId: string,
  index: number,
  structure: SyntheticNodeLocalStructureInput,
): SyntheticNodeLocalStructureInput {
  const targetType = CONTROLLABLE_TARGET_BY_FAMILY[structure.family];
  const seed = fixtureSeed(scenarioId, index);
  const objectId = structure.objectId ?? fixtureHex(seed);
  const assemblyId = structure.assemblyId ?? fixtureAssemblyId(seed);
  const ownerCapId = fixtureHex(seed, 1_000_000n);

  return {
    ...structure,
    source: "backendMembership",
    objectId,
    assemblyId,
    actionCandidate: buildMissingNodeContextActionCandidate(objectId, targetType, ownerCapId),
  };
}

function createAmbiguousFixture(
  nodeId: string,
  scenarioId: string,
  index: number,
  structure: SyntheticNodeLocalStructureInput,
): SyntheticNodeLocalStructureInput {
  const targetType = CONTROLLABLE_TARGET_BY_FAMILY[structure.family];
  const seed = fixtureSeed(scenarioId, index);
  const objectId = structure.objectId ?? fixtureHex(seed);
  const assemblyId = structure.assemblyId ?? fixtureAssemblyId(seed);
  const firstStructureId = fixtureHex(seed, 10_000n);
  const secondStructureId = fixtureHex(seed, 20_000n);
  const firstOwnerCapId = fixtureHex(seed, 30_000n);
  const secondOwnerCapId = fixtureHex(seed, 40_000n);
  const status = structure.status ?? "offline";

  return {
    ...structure,
    source: "backendMembership",
    objectId,
    assemblyId,
    authorityCandidates: [
      candidate(firstStructureId, targetType, status, { ownerCapId: firstOwnerCapId, networkNodeId: nodeId }),
      candidate(secondStructureId, targetType, status, { ownerCapId: secondOwnerCapId, networkNodeId: nodeId }),
    ],
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

function decorateControllableStructures(
  scenarioId: string,
  nodeId: string,
  structures: SyntheticNodeLocalStructureInput[],
): SyntheticNodeLocalStructureInput[] {
  return structures.map((structure, index) => {
    if (
      structure.actionCandidate
      || (structure.authorityCandidates?.length ?? 0) > 0
      || structure.objectId
      || structure.assemblyId
      || (structure.source != null && structure.source !== "synthetic")
    ) {
      return structure;
    }

    return createControllableFixture(nodeId, scenarioId, index, structure);
  });
}

function createScenario(
  config: {
    id: string;
    label: string;
    description: string;
    nodeLabel: string;
    nodePowerUsageSummary?: IndexedNodePowerUsageSummary | null;
    structures: SyntheticNodeLocalStructureInput[];
    initialHiddenCanonicalKeys?: string[];
  },
  options: { decorateControllable?: boolean } = {},
): NodeLocalScenario {
  const structures = options.decorateControllable
    ? decorateControllableStructures(config.id, config.id, config.structures)
    : config.structures;

  return {
    id: config.id,
    label: config.label,
    description: config.description,
    viewModel: buildSyntheticNodeLocalViewModel({
      nodeId: config.id,
      nodeLabel: config.nodeLabel,
      nodePowerUsageSummary: config.nodePowerUsageSummary ?? null,
      structures,
    }),
    initialHiddenCanonicalKeys: config.initialHiddenCanonicalKeys,
  };
}

function createAuthorityMatrixScenario(): NodeLocalScenario {
  const baseScenario = createScenario({
    id: "authority-matrix",
    label: "Authority Matrix",
    description: "Controllable rows plus deliberate authority failures for node-drilldown action review.",
    nodeLabel: "Authority Review Node",
    structures: [
      createControllableFixture("authority-matrix", "authority-matrix", 0, {
        family: "tradePost",
        displayName: "Storage Alpha",
        typeLabel: "Storage",
        status: "online",
      }),
      createControllableFixture("authority-matrix", "authority-matrix", 1, {
        family: "turret",
        displayName: "Turret Beta",
        typeLabel: "Turret",
        status: "offline",
      }),
      createControllableFixture("authority-matrix", "authority-matrix", 2, {
        family: "printer",
        displayName: "Printer Gamma",
        typeLabel: "Printer",
        status: "offline",
      }),
      createMissingOwnerCapFixture("authority-matrix", "authority-matrix", 3, {
        family: "assembler",
        displayName: "Assembler Delta",
        typeLabel: "Assembler",
        status: "offline",
      }),
      createControllableFixture("authority-matrix", "authority-matrix", 4, {
        family: "gate",
        displayName: "Gate Epsilon",
        typeLabel: "Mini Gate",
        sizeVariant: "mini",
        status: "online",
      }),
      createAmbiguousFixture("authority-matrix", "authority-matrix", 5, {
        family: "gate",
        displayName: "Gate Zeta",
        typeLabel: "Mini Gate",
        sizeVariant: "mini",
        status: "warning",
        warningPip: true,
      }),
      createMissingNodeContextFixture("authority-matrix", 6, {
        family: "gate",
        displayName: "Gate Eta",
        typeLabel: "Mini Gate",
        sizeVariant: "mini",
        status: "neutral",
      }),
    ],
  });

  const hiddenGate = baseScenario.viewModel.structures.find((structure) => structure.displayName === "Gate Epsilon");

  return {
    ...baseScenario,
    initialHiddenCanonicalKeys: hiddenGate ? [hiddenGate.canonicalDomainKey] : undefined,
  };
}

function createKnownPowerScenario(): NodeLocalScenario {
  const baseScenario = createScenario({
    id: "power-summary-known",
    label: "Power Summary Known",
    description: "Indexed node load is available, and hidden online children still count through the summary.",
    nodeLabel: "Indexed Load Node",
    nodePowerUsageSummary: createPowerUsageSummary({
      usedGj: 320,
      availableGj: 680,
      onlineKnownLoadGj: 320,
      totalKnownLoadGj: 770,
    }),
    structures: [
      createControllableFixture("power-summary-known", "power-summary-known", 0, {
        family: "tradePost",
        displayName: "Storage Alpha",
        typeLabel: "Storage",
        status: "online",
        powerRequirement: createPowerRequirement(120, { family: "storage", size: "standard" }),
      }),
      createControllableFixture("power-summary-known", "power-summary-known", 1, {
        family: "gate",
        displayName: "Hidden Gate Beta",
        typeLabel: "Mini Gate",
        sizeVariant: "mini",
        status: "online",
        powerRequirement: createPowerRequirement(200, { family: "gate", size: "mini" }),
      }),
      createControllableFixture("power-summary-known", "power-summary-known", 2, {
        family: "turret",
        displayName: "Turret Gamma",
        typeLabel: "Turret",
        status: "offline",
        powerRequirement: createPowerRequirement(150, { family: "turret", size: "standard" }),
      }),
      createControllableFixture("power-summary-known", "power-summary-known", 3, {
        family: "printer",
        displayName: "Printer Delta",
        typeLabel: "Printer",
        status: "offline",
        powerRequirement: createPowerRequirement(300, { family: "printer", size: "standard" }),
      }),
    ],
  });

  const hiddenGate = baseScenario.viewModel.structures.find((structure) => structure.displayName === "Hidden Gate Beta");
  return {
    ...baseScenario,
    initialHiddenCanonicalKeys: hiddenGate ? [hiddenGate.canonicalDomainKey] : undefined,
  };
}

function createOverCapacityScenario(): NodeLocalScenario {
  return createScenario({
    id: "power-summary-over-cap",
    label: "Power Summary Over Cap",
    description: "Bring all online would exceed indexed node capacity before the wallet step.",
    nodeLabel: "Over-Cap Node",
    nodePowerUsageSummary: createPowerUsageSummary({
      usedGj: 320,
      availableGj: 680,
      onlineKnownLoadGj: 320,
      totalKnownLoadGj: 1120,
    }),
    structures: [
      createControllableFixture("power-summary-over-cap", "power-summary-over-cap", 0, {
        family: "tradePost",
        displayName: "Storage Alpha",
        typeLabel: "Storage",
        status: "online",
        powerRequirement: createPowerRequirement(120, { family: "storage", size: "standard" }),
      }),
      createControllableFixture("power-summary-over-cap", "power-summary-over-cap", 1, {
        family: "gate",
        displayName: "Gate Beta",
        typeLabel: "Mini Gate",
        sizeVariant: "mini",
        status: "online",
        powerRequirement: createPowerRequirement(200, { family: "gate", size: "mini" }),
      }),
      createControllableFixture("power-summary-over-cap", "power-summary-over-cap", 2, {
        family: "turret",
        displayName: "Turret Gamma",
        typeLabel: "Turret",
        status: "offline",
        powerRequirement: createPowerRequirement(300, { family: "turret", size: "standard" }),
      }),
      createControllableFixture("power-summary-over-cap", "power-summary-over-cap", 3, {
        family: "printer",
        displayName: "Printer Delta",
        typeLabel: "Printer",
        status: "offline",
        powerRequirement: createPowerRequirement(500, { family: "printer", size: "standard" }),
      }),
    ],
  });
}

function createUnknownPowerScenario(): NodeLocalScenario {
  return createScenario({
    id: "power-summary-unknown",
    label: "Power Summary Unknown",
    description: "Partial power data keeps the readout unavailable and blocks false confidence.",
    nodeLabel: "Partial Load Node",
    nodePowerUsageSummary: createPowerUsageSummary({
      usedGj: null,
      availableGj: null,
      onlineKnownLoadGj: 200,
      onlineUnknownLoadCount: 1,
      totalKnownLoadGj: 350,
      totalUnknownLoadCount: 1,
      source: "partial",
      confidence: "partial",
    }),
    structures: [
      createControllableFixture("power-summary-unknown", "power-summary-unknown", 0, {
        family: "tradePost",
        displayName: "Storage Alpha",
        typeLabel: "Storage",
        status: "online",
        powerRequirement: createPowerRequirement(200, { family: "storage", size: "standard" }),
      }),
      createControllableFixture("power-summary-unknown", "power-summary-unknown", 1, {
        family: "relay",
        displayName: "Relay Beta",
        typeLabel: "Relay",
        status: "online",
        powerRequirement: createPowerRequirement(null, { family: "relay", size: "standard" }),
      }),
      createControllableFixture("power-summary-unknown", "power-summary-unknown", 2, {
        family: "turret",
        displayName: "Turret Gamma",
        typeLabel: "Turret",
        status: "offline",
        powerRequirement: createPowerRequirement(150, { family: "turret", size: "standard" }),
      }),
    ],
  });
}

export const NODE_DRILLDOWN_SCENARIOS: NodeLocalScenario[] = [
  createKnownPowerScenario(),
  createOverCapacityScenario(),
  createUnknownPowerScenario(),
  createAuthorityMatrixScenario(),
  createScenario({
    id: "sparse-solo-node",
    label: "Sparse Solo Nodes",
    description: "Minimal owned examples for gate, storage, and turret action review.",
    nodeLabel: "Khanid Relay",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Gate", sizeVariant: "mini", typeLabel: "Mini Gate" }),
      ...repeatStructures("tradePost", 1, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("turret", 1, { labelPrefix: "Turret", typeLabel: "Turret", status: "offline" }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "industry-node",
    label: "Node Gate Industry Node",
    description: "Industry-led node with controllable gate, storage, and assembly families for action review.",
    nodeLabel: "Aritcio Foundry",
    structures: [
      ...repeatStructures("printer", 4, { labelPrefix: "Printer", typeLabel: "Printer", status: "offline" }),
      ...repeatStructures("printer", 1, { labelPrefix: "Heavy Printer", sizeVariant: "heavy", typeLabel: "Heavy Printer", status: "offline" }),
      ...repeatStructures("refinery", 2, { labelPrefix: "Refinery", typeLabel: "Refinery", status: "offline" }),
      ...repeatStructures("assembler", 1, { labelPrefix: "Assembler", typeLabel: "Assembler", status: "offline" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 2, { labelPrefix: "Berth", typeLabel: "Berth", status: "offline" }),
      ...repeatStructures("gate", 2, { labelPrefix: "Gate", sizeVariant: "heavy", typeLabel: "Heavy Gate" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay", status: "offline" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery", status: "offline" }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "no-gate-industry-node",
    label: "No-Gate Industry Node",
    description: "Industry-led node with logistics and support, but no corridor rail, for direct comparison against Node Gate Industry Node.",
    nodeLabel: "Aritcio Reserve",
    structures: [
      ...repeatStructures("printer", 4, { labelPrefix: "Printer", typeLabel: "Printer", status: "offline" }),
      ...repeatStructures("printer", 1, { labelPrefix: "Heavy Printer", sizeVariant: "heavy", typeLabel: "Heavy Printer", status: "offline" }),
      ...repeatStructures("refinery", 2, { labelPrefix: "Refinery", typeLabel: "Refinery", status: "offline" }),
      ...repeatStructures("assembler", 1, { labelPrefix: "Assembler", typeLabel: "Assembler", status: "offline" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 2, { labelPrefix: "Berth", typeLabel: "Berth", status: "offline" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay", status: "offline" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery", status: "offline" }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "no-gate-dense-manufacturing",
    label: "No-Gate Dense Manufacturing",
    description: "Dense manufacturing stack with no gate rail and controllable attached assemblies for compact layout validation.",
    nodeLabel: "Kador Fabrication Ring",
    structures: [
      ...repeatStructures("printer", 4, { labelPrefix: "Printer", typeLabel: "Printer", status: "offline" }),
      ...repeatStructures("printer", 1, { labelPrefix: "Heavy Printer", sizeVariant: "heavy", typeLabel: "Heavy Printer", status: "offline" }),
      ...repeatStructures("refinery", 2, { labelPrefix: "Refinery", typeLabel: "Refinery", status: "offline" }),
      ...repeatStructures("refinery", 1, { labelPrefix: "Heavy Refinery", sizeVariant: "heavy", typeLabel: "Heavy Refinery", status: "offline" }),
      ...repeatStructures("assembler", 2, { labelPrefix: "Assembler", typeLabel: "Assembler", status: "offline" }),
      ...repeatStructures("tradePost", 3, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 3, { labelPrefix: "Berth", typeLabel: "Berth", status: "offline" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay", status: "offline" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery", status: "offline" }),
      ...repeatStructures("shelter", 1, { labelPrefix: "Shelter", typeLabel: "Shelter", status: "offline" }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "mixed-operating-base",
    label: "Mixed Operating Base",
    description: "Balanced industry, logistics, support, and defense with controllable owned examples across the attached assembly families.",
    nodeLabel: "Caldari Exchange",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Gate", sizeVariant: "mini", typeLabel: "Mini Gate" }),
      ...repeatStructures("printer", 3, { labelPrefix: "Printer", typeLabel: "Printer", status: "offline" }),
      ...repeatStructures("refinery", 1, { labelPrefix: "Heavy Refinery", sizeVariant: "heavy", typeLabel: "Heavy Refinery", status: "offline" }),
      ...repeatStructures("assembler", 1, { labelPrefix: "Assembler", typeLabel: "Assembler", status: "offline" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("berth", 2, { labelPrefix: "Berth", typeLabel: "Berth", status: "offline" }),
      ...repeatStructures("relay", 1, { labelPrefix: "Relay", typeLabel: "Relay", status: "offline" }),
      ...repeatStructures("nursery", 1, { labelPrefix: "Nursery", typeLabel: "Nursery", status: "offline" }),
      ...repeatStructures("shelter", 1, { labelPrefix: "Shelter", typeLabel: "Shelter", status: "offline" }),
      ...repeatStructures("turret", 8, { labelPrefix: "Turret", typeLabel: "Turret", status: "offline" }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "support-clutter-test",
    label: "Support Clutter Test",
    description: "Compact support-band validation with controllable relay, nursery, nest, and shelter rows.",
    nodeLabel: "Support Terrace",
    structures: [
      ...repeatStructures("gate", 1, { labelPrefix: "Gate", sizeVariant: "mini", typeLabel: "Mini Gate" }),
      ...repeatStructures("tradePost", 2, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("relay", 4, { labelPrefix: "Relay", typeLabel: "Relay", status: "offline" }),
      ...repeatStructures("nursery", 3, { labelPrefix: "Nursery", typeLabel: "Nursery", status: "offline" }),
      ...repeatStructures("nest", 2, { labelPrefix: "Nest", typeLabel: "Nest", status: "offline" }),
      ...repeatStructures("shelter", 4, { labelPrefix: "Shelter", typeLabel: "Shelter", status: "offline" }),
      ...repeatStructures("turret", 6, { labelPrefix: "Turret", typeLabel: "Turret", status: "offline" }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "defense-heavy-node",
    label: "Defense Heavy Node",
    description: "A heavy perimeter posture with controllable gates and warning-marker turret rows for explanation coverage.",
    nodeLabel: "Outer Bastion",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Heavy Gate", sizeVariant: "heavy", typeLabel: "Heavy Gate" }),
      ...repeatStructures("tradePost", 1, { labelPrefix: "Storage", typeLabel: "Storage" }),
      ...repeatStructures("turret", 12, { labelPrefix: "Turret", typeLabel: "Turret", status: "warning", warningPip: true }),
      ...repeatStructures("turret", 4, { labelPrefix: "Heavy Turret", sizeVariant: "heavy", typeLabel: "Heavy Turret", status: "warning", warningPip: true, startIndex: 13 }),
    ],
  }, { decorateControllable: true }),
  createScenario({
    id: "turret-stress-test",
    label: "Turret Stress Test",
    description: "High-density defensive block with owned controllable turret rows for layout and action validation.",
    nodeLabel: "Perimeter Lock",
    structures: [
      ...repeatStructures("gate", 2, { labelPrefix: "Heavy Gate", sizeVariant: "heavy", typeLabel: "Heavy Gate" }),
      ...repeatStructures("turret", 34, { labelPrefix: "Turret", typeLabel: "Turret", status: "offline" }),
      ...repeatStructures("turret", 8, { labelPrefix: "Mini Turret", sizeVariant: "mini", typeLabel: "Mini Turret", status: "offline", startIndex: 35 }),
      ...repeatStructures("turret", 8, { labelPrefix: "Heavy Turret", sizeVariant: "heavy", typeLabel: "Heavy Turret", status: "offline", startIndex: 43 }),
    ],
  }, { decorateControllable: true }),
];
