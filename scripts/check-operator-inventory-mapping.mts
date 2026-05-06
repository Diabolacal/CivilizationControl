import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { Sidebar } from "../src/components/Sidebar";
import { selectDisplayNodeGroups } from "../src/lib/assetDiscoveryDisplayModel";
import { buildFuelPresentation } from "../src/lib/fuelRuntime";
import { getNodeLocalPowerToggleIntent } from "../src/lib/nodeDrilldownActionAuthority";
import { getStructurePowerAction } from "../src/lib/structureActionSupport";
import { buildOperatorInventoryDebugCopySummary, buildOperatorInventoryDebugSnapshot } from "../src/lib/operatorInventoryDebug";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel";
import type { IndexedPowerSummary, NetworkNodeGroup, Structure } from "../src/types/domain";
import type { OperatorInventoryResponse } from "../src/types/operatorInventory";

const NETWORK_NODE_A_ID = "0x00000000000000000000000000000000000000000000000000000000000000aa";
const NETWORK_NODE_B_ID = "0x00000000000000000000000000000000000000000000000000000000000000bb";
const NETWORK_NODE_B_ALIAS_ID = "0x00000000000000000000000000000000000000000000000000000000000000bc";
const NETWORK_NODE_EMPTY_VALID_ID = "0x00000000000000000000000000000000000000000000000000000000000000be";
const NETWORK_NODE_OBJECT_ONLY_ID = "0x00000000000000000000000000000000000000000000000000000000000000bf";
const NETWORK_NODE_WEAK_NEUTRAL_ID = "0x00000000000000000000000000000000000000000000000000000000000000c0";
const STRAY_NETWORK_NODE_ID = "0x00000000000000000000000000000000000000000000000000000000000000cc";
const MISSING_IDENTITY_NODE_OWNER_CAP_ID = "0x00000000000000000000000000000000000000000000000000000000000000ce";
const LEGACY_FALLBACK_NODE_ID = "0x00000000000000000000000000000000000000000000000000000000000000dd";
const GATE_ID = "0x0000000000000000000000000000000000000000000000000000000000000101";
const STORAGE_ID = "0x0000000000000000000000000000000000000000000000000000000000000102";
const TURRET_ID = "0x0000000000000000000000000000000000000000000000000000000000000103";
const PRINTER_ID = "0x0000000000000000000000000000000000000000000000000000000000000104";
const REFINERY_ID = "0x0000000000000000000000000000000000000000000000000000000000000106";
const ASSEMBLER_ID = "0x0000000000000000000000000000000000000000000000000000000000000107";
const BERTH_ID = "0x0000000000000000000000000000000000000000000000000000000000000108";
const DUPLICATE_AUTHORITY_NODE_ID = "0x0000000000000000000000000000000000000000000000000000000000000110";
const DUPLICATE_AUTHORITY_TURRET_ID = "0x0000000000000000000000000000000000000000000000000000000000000111";
const DUPLICATE_AUTHORITY_NODE_OWNER_CAP_ID = "0x0000000000000000000000000000000000000000000000000000000000000f10";
const DUPLICATE_AUTHORITY_TURRET_OWNER_CAP_ID = "0x000000000000000000000000000000000000000000000000000000000000c111";
const UNLINKED_STORAGE_ID = "0x0000000000000000000000000000000000000000000000000000000000000105";
const GATE_B_ID = "0x0000000000000000000000000000000000000000000000000000000000000201";
const TURRET_B_ID = "0x0000000000000000000000000000000000000000000000000000000000000202";
const SUSPICIOUS_TURRET_A_ID = "0x8a7ee45a74d7b1fe98e2eee787037e7c59245f2af1f17fe74bab19ec424fb3c5";
const SUSPICIOUS_TURRET_B_ID = "0xc6234a6f3cd05a852b1d5635aa5495cb31de189da5a630a4acff82873dc61893";
const OPERATOR_WALLET = "0x0000000000000000000000000000000000000000000000000000000000000abc";
const CHARACTER_ID = "0x0000000000000000000000000000000000000000000000000000000000000def";
const SHARED_BACKEND_SOURCE = "shared-frontier-backend";
const OBSERVED_AT = "2026-05-03T12:00:00.000Z";
const RAW_WARNING_TEXT = "action_candidates_are_indexed_hints_only_and_not_operator_copy";

const response: OperatorInventoryResponse = {
  schemaVersion: "operator-inventory.v1",
  operator: {
    walletAddress: OPERATOR_WALLET,
    characterId: CHARACTER_ID,
    characterName: "Operator Prime",
    tribeId: 77,
    tribeName: "Stillness Vanguard",
  },
  networkNodes: [
    {
      node: networkNodeRow({
        objectId: NETWORK_NODE_A_ID,
        assemblyId: "9001",
        ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000faa",
        displayName: "Index Node",
        name: "Legacy Node Alpha",
        displayNameSource: "metadata_event",
        displayNameUpdatedAt: OBSERVED_AT,
        solarSystemId: "30000142",
        fuelAmount: "1200",
        powerSummary: createPowerSummary({
          fuelAmount: 1200,
          fuelMaxCapacity: 2400,
          fuelTypeId: 88319,
          fuelTypeName: "D2 Fuel",
          fuelGrade: "D2",
          efficiencyPercent: 15,
          burnRateUnitsPerHour: 6.6,
          estimatedSecondsRemaining: 655200,
          estimatedHoursRemaining: 182,
          criticalFuelThresholdSeconds: 3600,
          lowFuelThresholdSeconds: 86400,
          isLowFuel: false,
          isCriticalFuel: false,
          confidence: "indexed",
        }),
      }),
      structures: [
        actionRow({
          objectId: GATE_ID,
          assemblyId: "9101",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c101",
          family: "gate",
          displayName: "Governor Gate",
          typeId: 88010,
          typeName: "Gate",
          assemblyType: "gate",
          status: "online",
          extensionStatus: "authorized",
          requiredIds: {
            structureId: GATE_ID,
            structureType: "gate",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c101",
            networkNodeId: NETWORK_NODE_A_ID,
          },
        }),
        actionRow({
          objectId: STORAGE_ID,
          assemblyId: "9102",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c102",
          family: "storage",
          displayName: "Forward Storage",
          typeId: 88082,
          typeName: "Mini Storage",
          assemblyType: "storage_unit",
          status: "online",
          extensionStatus: "authorized",
          size: "mini",
          requiredIds: {
            structureId: STORAGE_ID,
            structureType: "storage_unit",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c102",
            networkNodeId: NETWORK_NODE_A_ID,
          },
        }),
        actionRow({
          objectId: TURRET_ID,
          assemblyId: "9103",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c103",
          family: "turret",
          displayName: "Outer Turret",
          typeId: 92279,
          typeName: "Mini Turret",
          assemblyType: "turret",
          status: "offline",
          extensionStatus: "authorized",
          size: "mini",
          requiredIds: {
            structureId: TURRET_ID,
            structureType: "turret",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c103",
            networkNodeId: NETWORK_NODE_A_ID,
          },
        }),
        liveGenericAssemblyRow({
          objectId: PRINTER_ID,
          ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000001104",
          networkNodeId: NETWORK_NODE_A_ID,
          family: "printer",
          displayName: "Mini Printer",
          typeId: 88067,
          typeName: "Mini Printer",
          assemblyType: "printer",
          status: "online",
          size: "mini",
        }),
        liveGenericAssemblyRow({
          objectId: REFINERY_ID,
          ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000001106",
          networkNodeId: NETWORK_NODE_A_ID,
          family: "refinery",
          displayName: "Refinery",
          typeId: 88068,
          typeName: "Refinery",
          assemblyType: "refinery",
          status: "online",
        }),
        liveGenericAssemblyRow({
          objectId: ASSEMBLER_ID,
          ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000001107",
          networkNodeId: NETWORK_NODE_A_ID,
          family: "assembler",
          displayName: "Assembler",
          typeId: 88069,
          typeName: "Assembler",
          assemblyType: "assembler",
          status: "offline",
        }),
        liveGenericAssemblyRow({
          objectId: BERTH_ID,
          ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000001108",
          networkNodeId: NETWORK_NODE_A_ID,
          family: "berth",
          displayName: "Mini Berth",
          typeId: 88070,
          typeName: "Mini Berth",
          assemblyType: "berth",
          status: "offline",
          size: "mini",
        }),
      ],
    },
    {
      node: networkNodeRow({
        objectId: NETWORK_NODE_B_ID,
        assemblyId: "9002",
        ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000fab",
        displayName: "Relay Node",
        solarSystemId: "30000143",
        fuelAmount: "1400",
        powerSummary: createPowerSummary({
          fuelAmount: 1400,
          fuelMaxCapacity: 2200,
          fuelTypeId: 78516,
          fuelTypeName: "EU-40 Fuel",
          fuelGrade: "EU40",
          efficiencyPercent: 40,
          burnRateUnitsPerHour: 10,
          estimatedSecondsRemaining: 1800,
          estimatedHoursRemaining: 0.5,
          criticalFuelThresholdSeconds: 3600,
          lowFuelThresholdSeconds: 86400,
          isLowFuel: true,
          isCriticalFuel: true,
          confidence: "indexed",
        }),
      }),
      structures: [
        actionRow({
          objectId: GATE_B_ID,
          assemblyId: "9201",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d201",
          family: "gate",
          displayName: "Relay Gate",
          typeId: 88010,
          typeName: "Gate",
          assemblyType: "gate",
          status: "online",
          extensionStatus: "authorized",
          requiredIds: {
            structureId: GATE_B_ID,
            structureType: "gate",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d201",
            networkNodeId: NETWORK_NODE_B_ID,
          },
        }),
        actionRow({
          objectId: TURRET_B_ID,
          assemblyId: "9202",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d202",
          family: "turret",
          displayName: "Relay Turret",
          typeId: 92279,
          typeName: "Mini Turret",
          assemblyType: "turret",
          status: "online",
          extensionStatus: "authorized",
          size: "mini",
          requiredIds: {
            structureId: TURRET_B_ID,
            structureType: "turret",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d202",
            networkNodeId: NETWORK_NODE_B_ID,
          },
        }),
      ],
    },
    {
      node: networkNodeRow({
        objectId: NETWORK_NODE_B_ALIAS_ID,
        assemblyId: "9002",
        ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000fab",
        displayName: "Relay Node Duplicate",
        solarSystemId: "30000143",
        fuelAmount: "1400",
        powerSummary: createPowerSummary({
          fuelAmount: 1400,
          fuelMaxCapacity: 2200,
          fuelTypeId: 78516,
          fuelTypeName: "EU-40 Fuel",
          fuelGrade: "EU40",
          efficiencyPercent: 40,
          burnRateUnitsPerHour: 10,
          estimatedSecondsRemaining: 1800,
          estimatedHoursRemaining: 0.5,
          criticalFuelThresholdSeconds: 3600,
          lowFuelThresholdSeconds: 86400,
          isLowFuel: true,
          isCriticalFuel: true,
          confidence: "indexed",
        }),
      }),
      structures: [
        actionRow({
          objectId: TURRET_B_ID,
          assemblyId: "9202",
          ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d202",
          family: "turret",
          displayName: "Relay Turret Duplicate",
          typeId: 92279,
          typeName: "Mini Turret",
          assemblyType: "turret",
          status: "online",
          extensionStatus: "authorized",
          size: "mini",
          requiredIds: {
            structureId: TURRET_B_ID,
            structureType: "turret",
            ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000d202",
            networkNodeId: NETWORK_NODE_B_ID,
          },
        }),
      ],
    },
    {
      node: networkNodeRow({
        objectId: NETWORK_NODE_EMPTY_VALID_ID,
        assemblyId: null,
        ownerCapId: "0x0000000000000000000000000000000000000000000000000000000000000fac",
        displayName: "Reserve Node",
        solarSystemId: "30000144",
        fuelAmount: "900",
        status: "unknown",
        powerSummary: createPowerSummary({
          fuelAmount: 900,
          fuelMaxCapacity: 1800,
          fuelTypeId: 88335,
          fuelTypeName: "D1 Fuel",
          fuelGrade: "D1",
          efficiencyPercent: 10,
          burnRateUnitsPerHour: 0,
          estimatedSecondsRemaining: null,
          estimatedHoursRemaining: null,
          criticalFuelThresholdSeconds: 3600,
          lowFuelThresholdSeconds: 86400,
          isLowFuel: null,
          isCriticalFuel: null,
          confidence: "indexed",
        }),
      }),
      structures: [],
    },
    {
      node: networkNodeRow({
        objectId: NETWORK_NODE_OBJECT_ONLY_ID,
        assemblyId: null,
        ownerCapId: null,
        displayName: "Object-Only Phantom",
        solarSystemId: "30000145",
        fuelAmount: null,
        status: "unknown",
      }),
      structures: [],
    },
    {
      node: networkNodeRow({
        objectId: NETWORK_NODE_WEAK_NEUTRAL_ID,
        assemblyId: "9004",
        ownerCapId: null,
        displayName: "Weak Neutral Node",
        solarSystemId: "30000146",
        fuelAmount: null,
        status: "unknown",
      }),
      structures: [],
    },
    {
      node: networkNodeRow({
        objectId: null,
        assemblyId: null,
        ownerCapId: MISSING_IDENTITY_NODE_OWNER_CAP_ID,
        displayName: "Identityless Node",
        solarSystemId: "30000147",
        fuelAmount: null,
        status: "unknown",
      }),
      structures: [],
    },
  ],
  unlinkedStructures: [
    strayNodeLikeRow(),
    actionRow({
      objectId: UNLINKED_STORAGE_ID,
      assemblyId: "9199",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c199",
      family: "storage",
      displayName: "Unlinked Storage",
      typeId: 88083,
      typeName: "Storage",
      assemblyType: "storage_unit",
      status: "unknown",
      extensionStatus: "stale",
      requiredIds: {
        structureId: UNLINKED_STORAGE_ID,
        structureType: "storage_unit",
        ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000c199",
        networkNodeId: null,
      },
    }),
    actionRow({
      objectId: SUSPICIOUS_TURRET_A_ID,
      assemblyId: "9301",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000e301",
      family: "turret",
      displayName: "Suspicious Turret A",
      typeId: 92279,
      typeName: "Mini Turret",
      assemblyType: "turret",
      status: "offline",
      extensionStatus: "stale",
      size: "mini",
      requiredIds: {
        structureId: SUSPICIOUS_TURRET_A_ID,
        structureType: "turret",
        ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000e301",
        networkNodeId: null,
      },
    }),
    actionRow({
      objectId: SUSPICIOUS_TURRET_B_ID,
      assemblyId: "9302",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000e302",
      family: "turret",
      displayName: "Suspicious Turret B",
      typeId: 92279,
      typeName: "Mini Turret",
      assemblyType: "turret",
      status: "offline",
      extensionStatus: "stale",
      size: "mini",
      requiredIds: {
        structureId: SUSPICIOUS_TURRET_B_ID,
        structureType: "turret",
        ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000e302",
        networkNodeId: null,
      },
    }),
  ],
  warnings: ["Several indexed structures are still unlinked.", RAW_WARNING_TEXT],
  partial: true,
  source: SHARED_BACKEND_SOURCE,
  fetchedAt: OBSERVED_AT,
};

const adapted = adaptOperatorInventory(response);
const offlineResponse: OperatorInventoryResponse = {
  ...response,
  networkNodes: response.networkNodes.map((nodeGroup, index) => index === 0
    ? { ...nodeGroup, node: { ...nodeGroup.node, status: "offline" as const } }
    : nodeGroup),
};
const offlineAdapted = adaptOperatorInventory(offlineResponse);
const legacyFallbackStructures = buildLegacyFallbackStructures();
const displayNodeGroups = selectDisplayNodeGroups({
  operatorInventoryNodeGroups: adapted.nodeGroups,
  structures: [...adapted.structures, ...legacyFallbackStructures],
  useOperatorInventory: true,
});

assert.equal(adapted.profile?.characterId, response.operator?.characterId);
assert.equal(adapted.metrics.networkNodeCount, 3);
assert.equal(adapted.metrics.totalStructures, 8);
assert.equal(adapted.metrics.onlineCount, 6);
assert.equal(adapted.metrics.gateCount, 2);
assert.equal(adapted.metrics.storageUnitCount, 1);
assert.equal(adapted.metrics.turretCount, 2);
assert.equal(adapted.diagnostics.ignoredUnlinkedNodeLikeCount, 1);
assert.match(adapted.warning ?? "", /unlinked/i);
assert(adapted.structures.every((structure) => structure.readModelSource === "operator-inventory"));
assert.equal(adapted.unlinkedStructures.length, 3);
assert.equal(adapted.nodeGroups.length, 3);
assert.deepEqual(adapted.nodeGroups.map((group) => group.node.objectId), [NETWORK_NODE_A_ID, NETWORK_NODE_B_ID, NETWORK_NODE_EMPTY_VALID_ID]);
assert.equal(adapted.nodeEligibilityDecisions.length, 7);
assert.equal(displayNodeGroups.length, 3);
assert(!displayNodeGroups.some((group) => group.node.objectId === LEGACY_FALLBACK_NODE_ID));
assert(!adapted.structures.some((structure) => structure.objectId === STRAY_NETWORK_NODE_ID));
assert(!adapted.structures.some((structure) => structure.objectId === NETWORK_NODE_OBJECT_ONLY_ID));
assert(!adapted.structures.some((structure) => structure.objectId === NETWORK_NODE_WEAK_NEUTRAL_ID));
assert(!displayNodeGroups.some((group) => group.node.objectId === NETWORK_NODE_OBJECT_ONLY_ID));
assert(!displayNodeGroups.some((group) => group.node.objectId === NETWORK_NODE_WEAK_NEUTRAL_ID));
assert.equal(adapted.quarantinedNodeRows.length, 4);
assert(adapted.quarantinedNodeRows.some((row) => row.objectId === NETWORK_NODE_B_ALIAS_ID && row.reason === "duplicate-canonical-node"));
assert(adapted.quarantinedNodeRows.some((row) => row.objectId === NETWORK_NODE_OBJECT_ONLY_ID && row.reason === "zero-structure-missing-strong-owned-proof"));
assert(adapted.quarantinedNodeRows.some((row) => row.objectId === NETWORK_NODE_WEAK_NEUTRAL_ID && row.reason === "zero-structure-missing-strong-owned-proof"));
assert(adapted.quarantinedNodeRows.some((row) => row.displayName === "Identityless Node" && row.reason === "missing-canonical-identity"));
assert(adapted.nodeEligibilityDecisions.some((row) => row.objectId === NETWORK_NODE_EMPTY_VALID_ID && row.rendered && row.strongOwnedNodeProof && row.renderEligibility === "strong-owned-node-proof"));
assert(adapted.nodeEligibilityDecisions.some((row) => row.objectId === NETWORK_NODE_OBJECT_ONLY_ID && !row.rendered && row.quarantineReason === "zero-structure-missing-strong-owned-proof"));
assert(adapted.nodeEligibilityDecisions.some((row) => row.objectId === NETWORK_NODE_WEAK_NEUTRAL_ID && !row.rendered && row.quarantineReason === "zero-structure-missing-strong-owned-proof"));

const group = buildGroup(displayNodeGroups, NETWORK_NODE_A_ID);
const lookup = adapted.nodeLookupsByNodeId.get(NETWORK_NODE_A_ID);
const relayGroup = buildGroup(displayNodeGroups, NETWORK_NODE_B_ID);
const reserveGroup = buildGroup(displayNodeGroups, NETWORK_NODE_EMPTY_VALID_ID);
const reserveLookup = adapted.nodeLookupsByNodeId.get(NETWORK_NODE_EMPTY_VALID_ID);
const offlineDisplayNodeGroups = selectDisplayNodeGroups({
  operatorInventoryNodeGroups: offlineAdapted.nodeGroups,
  structures: offlineAdapted.structures,
  useOperatorInventory: true,
});
const offlineGroup = buildGroup(offlineDisplayNodeGroups, NETWORK_NODE_A_ID);
const offlineLookup = offlineAdapted.nodeLookupsByNodeId.get(NETWORK_NODE_A_ID);
const groupFuelPresentation = buildFuelPresentation(group.node);
const relayFuelPresentation = buildFuelPresentation(relayGroup.node);
const reserveFuelPresentation = buildFuelPresentation(reserveGroup.node);
const restoredQuantityFuelPresentation = buildFuelPresentation({
  fuel: undefined,
  indexedFuelAmount: null,
  indexedPowerSummary: createPowerSummary({
    fuelAmount: 1800,
    fuelMaxCapacity: 10000,
    fuelTypeId: 88335,
    fuelTypeName: "D1 Fuel",
    fuelGrade: "D1",
    efficiencyPercent: 10,
    burnRateUnitsPerHour: 10,
    estimatedSecondsRemaining: 651600,
    estimatedHoursRemaining: 181,
    criticalFuelThresholdSeconds: 3600,
    lowFuelThresholdSeconds: 86400,
    isLowFuel: false,
    isCriticalFuel: false,
    confidence: "indexed",
  }),
  summary: undefined,
});
const smallerVisibleFuelPresentation = buildFuelPresentation({
  fuel: undefined,
  indexedFuelAmount: null,
  indexedPowerSummary: createPowerSummary({
    fuelAmount: 540,
    fuelMaxCapacity: 10000,
    fuelTypeId: 88335,
    fuelTypeName: "D1 Fuel",
    fuelGrade: "D1",
    efficiencyPercent: 10,
    burnRateUnitsPerHour: 10,
    estimatedSecondsRemaining: 194400,
    estimatedHoursRemaining: 54,
    criticalFuelThresholdSeconds: 3600,
    lowFuelThresholdSeconds: 86400,
    isLowFuel: false,
    isCriticalFuel: false,
    confidence: "indexed",
  }),
  summary: undefined,
});
const lowOnlyFuelPresentation = buildFuelPresentation({
  fuel: undefined,
  indexedFuelAmount: null,
  indexedPowerSummary: createPowerSummary({
    fuelAmount: 600,
    fuelMaxCapacity: 1200,
    fuelTypeId: 84868,
    fuelTypeName: "SOF-40 Fuel",
    fuelGrade: "SOF40",
    efficiencyPercent: 40,
    burnRateUnitsPerHour: 8,
    estimatedSecondsRemaining: 14400,
    estimatedHoursRemaining: 4,
    criticalFuelThresholdSeconds: 3600,
    lowFuelThresholdSeconds: 86400,
    isLowFuel: true,
    isCriticalFuel: false,
    confidence: "indexed",
  }),
  summary: undefined,
});

assert(lookup, "expected a selected-node lookup from operator inventory");
assert.equal(lookup?.assemblies.length, 7);
assert(reserveLookup, "expected reserve node lookup from operator inventory");
assert.equal(relayGroup.gates.length, 1);
assert.equal(relayGroup.turrets.length, 1);
assert.equal(reserveGroup.gates.length + reserveGroup.storageUnits.length + reserveGroup.turrets.length, 0);
assert.equal(reserveGroup.node.assemblyId, undefined);
assert.equal(reserveGroup.node.indexedFuelAmount, "900");
assert.equal(group.node.indexedPowerSummary?.criticalFuelThresholdSeconds, 3600);
assert.equal(group.node.indexedPowerSummary?.lowFuelThresholdSeconds, 86400);
assert.equal(groupFuelPresentation.runtimeLabel, "7d 14h");
assert.equal(groupFuelPresentation.severity, "normal");
assert.equal(groupFuelPresentation.fillReason, "indexed-canonical-capacity");
assert.equal(relayFuelPresentation.severity, "critical");
assert.equal(reserveGroup.node.indexedPowerSummary?.fuelGrade, "D1");
assert.equal(reserveLookup?.node.fuelAmount, "900");
assert.equal(reserveLookup?.node.powerSummary?.criticalFuelThresholdSeconds, 3600);
assert.equal(reserveLookup?.node.powerSummary?.lowFuelThresholdSeconds, 86400);
assert.equal(reserveFuelPresentation.runtimeLabel, null);
assert.equal(reserveFuelPresentation.severity, "partial");
assert.equal(restoredQuantityFuelPresentation.runtimeLabel, "7d 13h");
assert.equal(restoredQuantityFuelPresentation.severity, "normal");
assert.equal(restoredQuantityFuelPresentation.fillReason, "indexed-canonical-capacity");
assert.equal(restoredQuantityFuelPresentation.fillPercent, 50);
assert(restoredQuantityFuelPresentation.fillRatio != null && restoredQuantityFuelPresentation.fillRatio > 0.49 && restoredQuantityFuelPresentation.fillRatio < 0.51);
assert.equal(restoredQuantityFuelPresentation.amountLabel, "1,800 / 3,571 units");
assert.equal(smallerVisibleFuelPresentation.runtimeLabel, "2d 6h");
assert.equal(smallerVisibleFuelPresentation.fillReason, "indexed-canonical-capacity");
assert.equal(smallerVisibleFuelPresentation.fillPercent, 15);
assert(smallerVisibleFuelPresentation.fillRatio != null && smallerVisibleFuelPresentation.fillRatio > 0.14 && smallerVisibleFuelPresentation.fillRatio < 0.16);
assert.equal(lowOnlyFuelPresentation.severity, "low");

const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
const reserveViewModel = buildLiveNodeLocalViewModelWithObserved(reserveGroup, reserveLookup, { preferObservedMembership: true });
const offlineViewModel = buildLiveNodeLocalViewModelWithObserved(offlineGroup, offlineLookup, { preferObservedMembership: true });

const duplicateAuthorityResponse: OperatorInventoryResponse = {
  schemaVersion: "operator-inventory.v1",
  operator: response.operator,
  networkNodes: [
    {
      node: networkNodeRow({
        objectId: DUPLICATE_AUTHORITY_NODE_ID,
        assemblyId: "9410",
        ownerCapId: DUPLICATE_AUTHORITY_NODE_OWNER_CAP_ID,
        displayName: "Authority Node",
        solarSystemId: "30000144",
        fuelAmount: null,
        powerUsageSummary: createNodePowerUsageSummary({
          capacityGj: 1000,
          usedGj: 320,
          availableGj: 680,
          onlineKnownLoadGj: 320,
          onlineUnknownLoadCount: 0,
          totalKnownLoadGj: 320,
          totalUnknownLoadCount: 0,
        }),
      }),
      powerUsageSummary: createNodePowerUsageSummary({
        capacityGj: 1000,
        usedGj: 320,
        availableGj: 680,
        onlineKnownLoadGj: 320,
        onlineUnknownLoadCount: 0,
        totalKnownLoadGj: 320,
        totalUnknownLoadCount: 0,
      }),
      structures: [
        actionRow({
          objectId: DUPLICATE_AUTHORITY_TURRET_ID,
          assemblyId: "9411",
          ownerCapId: DUPLICATE_AUTHORITY_TURRET_OWNER_CAP_ID,
          family: "turret",
          displayName: "Authority Turret",
          typeId: 92279,
          typeName: "Mini Turret",
          assemblyType: "turret",
          status: "online",
          extensionStatus: "authorized",
          size: "mini",
          powerRequirement: createPowerRequirement({ requiredGj: 180 }),
          requiredIds: {
            structureId: DUPLICATE_AUTHORITY_TURRET_ID,
            structureType: "turret",
            ownerCapId: DUPLICATE_AUTHORITY_TURRET_OWNER_CAP_ID,
            networkNodeId: DUPLICATE_AUTHORITY_NODE_ID,
          },
        }),
      ],
    },
    {
      node: networkNodeRow({
        objectId: DUPLICATE_AUTHORITY_NODE_ID,
        assemblyId: "9410",
        ownerCapId: null,
        displayName: "Authority Node Corrected",
        displayNameSource: "metadata_event",
        displayNameUpdatedAt: OBSERVED_AT,
        solarSystemId: "30000144",
        fuelAmount: "1600",
        powerSummary: createPowerSummary({
          fuelAmount: 1600,
          fuelMaxCapacity: 2400,
          fuelTypeId: 88319,
          fuelTypeName: "D2 Fuel",
          fuelGrade: "D2",
          efficiencyPercent: 15,
          burnRateUnitsPerHour: 6.6,
          estimatedSecondsRemaining: 873600,
          estimatedHoursRemaining: 242,
          criticalFuelThresholdSeconds: 3600,
          lowFuelThresholdSeconds: 86400,
          isLowFuel: false,
          isCriticalFuel: false,
          confidence: "indexed",
        }),
      }),
      powerUsageSummary: null,
      structures: [
        actionRow({
          objectId: DUPLICATE_AUTHORITY_TURRET_ID,
          assemblyId: "9411",
          ownerCapId: null,
          family: "turret",
          displayName: "Authority Turret Corrected",
          displayNameSource: "metadata_event",
          displayNameUpdatedAt: OBSERVED_AT,
          typeId: 92279,
          typeName: "Mini Turret",
          assemblyType: "turret",
          status: "offline",
          extensionStatus: "authorized",
          size: "mini",
          fuelAmount: "40",
          powerSummary: createPowerSummary({
            fuelAmount: 40,
            fuelMaxCapacity: 80,
            fuelTypeId: 88319,
            fuelTypeName: "D2 Fuel",
            fuelGrade: "D2",
            efficiencyPercent: 15,
            burnRateUnitsPerHour: 6.6,
            estimatedSecondsRemaining: 21600,
            estimatedHoursRemaining: 6,
            criticalFuelThresholdSeconds: 3600,
            lowFuelThresholdSeconds: 86400,
            isLowFuel: true,
            isCriticalFuel: false,
            confidence: "indexed",
          }),
          requiredIds: {
            structureId: DUPLICATE_AUTHORITY_TURRET_ID,
            structureType: "turret",
            ownerCapId: null,
            networkNodeId: DUPLICATE_AUTHORITY_NODE_ID,
          },
        }),
      ],
    },
  ],
  unlinkedStructures: [],
  warnings: [],
  partial: false,
  source: SHARED_BACKEND_SOURCE,
  fetchedAt: OBSERVED_AT,
};
const duplicateAuthorityAdapted = adaptOperatorInventory(duplicateAuthorityResponse);
const duplicateAuthorityGroup = buildGroup(duplicateAuthorityAdapted.nodeGroups, DUPLICATE_AUTHORITY_NODE_ID);
const duplicateAuthorityLookup = duplicateAuthorityAdapted.nodeLookupsByNodeId.get(DUPLICATE_AUTHORITY_NODE_ID);
const duplicateAuthorityViewModel = buildLiveNodeLocalViewModelWithObserved(
  duplicateAuthorityGroup,
  duplicateAuthorityLookup,
  { preferObservedMembership: true },
);
const duplicateAuthorityTurret = duplicateAuthorityViewModel.structures.find(
  (structure) => structure.objectId === DUPLICATE_AUTHORITY_TURRET_ID,
);

assert.equal(viewModel.sourceMode, "backend-membership");
assert.equal(viewModel.structures.length, 7);
assert.equal(group.node.summary?.displayNameSource, "metadata_event");
assert.equal(group.node.summary?.displayNameUpdatedAt, OBSERVED_AT);
assert.equal(lookup?.node.displayNameSource, "metadata_event");
assert.equal(lookup?.node.displayNameUpdatedAt, OBSERVED_AT);
assert.equal(viewModel.node.displayName, "Index Node", "expected node-local header to prefer indexed displayName over stale legacy name fields");
assert.equal(viewModel.node.displayNameSource, "metadata_event");
assert.equal(viewModel.node.displayNameUpdatedAt, OBSERVED_AT);
assert.equal(offlineGroup.node.status, "offline", "expected raw operator-inventory offline node to render offline in /nodes list source");
assert.equal(offlineViewModel.node.status, "offline", "expected Node Control to use the same adapted offline node status as /nodes");
assert.equal(reserveGroup.node.status, "neutral", "expected raw unknown node status to adapt to neutral rather than online");
assert.equal(reserveViewModel.node.status, "neutral", "expected Node Control to preserve neutral node status rather than defaulting to online");
assert.equal(getStructurePowerAction(reserveGroup.node), null, "expected neutral network nodes not to receive a fake node power action");
assert.equal(reserveViewModel.node.fuelSummary, "D1 · 900 / 3,571 units");
assert.equal(reserveViewModel.node.fuelAmount, "900");
assert.equal(duplicateAuthorityGroup.node.ownerCapId, DUPLICATE_AUTHORITY_NODE_OWNER_CAP_ID, "expected duplicate node merge to preserve operator-inventory node authority");
assert.equal(duplicateAuthorityGroup.node.indexedPowerUsageSummary?.usedGj, 320, "expected duplicate node merge to preserve node power usage summaries");
assert(duplicateAuthorityLookup, "expected duplicate authority scenario to produce a selected-node lookup");
assert.equal(duplicateAuthorityLookup?.node.displayName, "Authority Node Corrected", "expected duplicate node merge to keep fresher display names");
assert.equal(duplicateAuthorityLookup?.node.powerUsageSummary?.usedGj, 320, "expected duplicate node merge to keep wrapper-level node power usage summaries in the selected-node lookup");
assert.equal(duplicateAuthorityViewModel.node.displayName, "Authority Node Corrected", "expected Node Control to use fresher duplicate node labels without stripping authority");
assert.equal(duplicateAuthorityViewModel.node.powerUsageSummary?.usedGj, 320, "expected Node Control to retain authoritative node power usage after duplicate merge");
assert(duplicateAuthorityTurret, "expected duplicate authority turret to render in Node Control");
assert.equal(duplicateAuthorityTurret?.displayName, "Authority Turret Corrected", "expected duplicate turret merge to keep fresher display names");
assert.equal(duplicateAuthorityTurret?.actionAuthority.state, "verified-supported", "expected duplicate turret merge not to strip Node Control write authority");
assert.equal(duplicateAuthorityTurret?.actionAuthority.verifiedTarget?.ownerCapId, DUPLICATE_AUTHORITY_TURRET_OWNER_CAP_ID, "expected duplicate turret merge to keep owner-cap authority for write actions");
assert.equal(duplicateAuthorityTurret?.powerRequirement?.requiredGj, 180, "expected duplicate turret merge to keep indexed child power requirements");
assert.equal(getNodeLocalPowerToggleIntent(duplicateAuthorityTurret!)?.actionLabel, "Bring Online", "expected duplicate turret merge to preserve power actions while using fresher status labels");

const gate = viewModel.structures.find((structure) => structure.objectId === GATE_ID);
const storage = viewModel.structures.find((structure) => structure.objectId === STORAGE_ID);
const turret = viewModel.structures.find((structure) => structure.objectId === TURRET_ID);
const printer = viewModel.structures.find((structure) => structure.objectId === PRINTER_ID);
const refinery = viewModel.structures.find((structure) => structure.objectId === REFINERY_ID);
const assembler = viewModel.structures.find((structure) => structure.objectId === ASSEMBLER_ID);
const berth = viewModel.structures.find((structure) => structure.objectId === BERTH_ID);

assert.equal(gate?.actionAuthority.state, "verified-supported");
assert.equal(storage?.actionAuthority.state, "verified-supported");
assert.equal(turret?.actionAuthority.state, "verified-supported");
assert.equal(printer?.actionAuthority.state, "verified-supported");
assert.equal(printer?.actionAuthority.verifiedTarget?.structureType, "assembly");
assert.equal(printer?.actionAuthority.unavailableReason, null);
for (const genericStructure of [printer, refinery, assembler, berth]) {
  assert(genericStructure, "expected live-shaped generic assembly row in node control");
  assert.equal(genericStructure.assemblyId, undefined);
  assert.equal(genericStructure.actionCandidate?.actions.power?.requiredIds ?? null, null);
  assert.equal(genericStructure.actionCandidate?.actions.power?.currentlyImplementedInCivilizationControl ?? false, false);
  assert.equal(genericStructure.actionAuthority.state, "verified-supported");
  assert.equal(genericStructure.actionAuthority.verifiedTarget?.structureType, "assembly");
  assert.equal(genericStructure.actionAuthority.verifiedTarget?.networkNodeId, NETWORK_NODE_A_ID);
  assert.equal(genericStructure.actionAuthority.unavailableReason, null);
}
assert.equal(getNodeLocalPowerToggleIntent(gate!)?.actionLabel, "Take Offline");
assert.equal(getNodeLocalPowerToggleIntent(turret!)?.actionLabel, "Bring Online");
assert.equal(getNodeLocalPowerToggleIntent(printer!)?.actionLabel, "Take Offline");
assert.equal(getNodeLocalPowerToggleIntent(refinery!)?.actionLabel, "Take Offline");
assert.equal(getNodeLocalPowerToggleIntent(assembler!)?.actionLabel, "Bring Online");
assert.equal(getNodeLocalPowerToggleIntent(berth!)?.actionLabel, "Bring Online");

const unlinkedStorage = adapted.structures.find((structure) => structure.objectId === UNLINKED_STORAGE_ID);
const suspiciousTurretA = adapted.structures.find((structure) => structure.objectId === SUSPICIOUS_TURRET_A_ID);
const suspiciousTurretB = adapted.structures.find((structure) => structure.objectId === SUSPICIOUS_TURRET_B_ID);
const hiddenUnlinkedStorage = adapted.unlinkedStructures.find((structure) => structure.objectId === UNLINKED_STORAGE_ID);
const hiddenSuspiciousTurretA = adapted.unlinkedStructures.find((structure) => structure.objectId === SUSPICIOUS_TURRET_A_ID);
const hiddenSuspiciousTurretB = adapted.unlinkedStructures.find((structure) => structure.objectId === SUSPICIOUS_TURRET_B_ID);

assert.equal(unlinkedStorage, undefined);
assert.equal(suspiciousTurretA, undefined);
assert.equal(suspiciousTurretB, undefined);
assert(hiddenUnlinkedStorage, "expected unlinked structure to remain outside governed inventory");
assert.equal(hiddenUnlinkedStorage?.networkNodeId, undefined);
assert.equal(hiddenUnlinkedStorage?.extensionStatus, "stale");
assert(hiddenSuspiciousTurretA, "expected suspicious turret A to remain visible only in hidden unlinked rows");
assert(hiddenSuspiciousTurretB, "expected suspicious turret B to remain visible only in hidden unlinked rows");
assert.equal(
  displayNodeGroups.flatMap((entry) => [...entry.gates, ...entry.storageUnits, ...entry.turrets]).filter(
    (structure) => structure.objectId === SUSPICIOUS_TURRET_A_ID || structure.objectId === SUSPICIOUS_TURRET_B_ID,
  ).length,
  0,
);

const debugSnapshot = buildOperatorInventoryDebugSnapshot({
  requestedWalletAddress: OPERATOR_WALLET,
  inventory: response,
  adapted,
  displayStructures: adapted.structures,
  displayNodeGroups,
  selectedNodeRows: viewModel.structures,
  selectedNodeSourceMode: viewModel.sourceMode,
  selectedNodeId: NETWORK_NODE_A_ID,
  readModelDebug: {
    operatorInventoryDisplayActive: true,
    operatorInventorySucceeded: true,
    operatorInventoryFailed: false,
    directChainFallbackEnabled: true,
    directChainFallbackRan: true,
    displayUsesDirectChainFallback: false,
    mergedIntoDisplay: false,
  },
  nodeAssembliesFallbackEnabled: false,
  nodeAssembliesFallbackRan: false,
  operatorInventoryErrorMessage: null,
});

assert.equal(debugSnapshot.requestedWalletAddress, OPERATOR_WALLET);
assert.equal(debugSnapshot.rawOperatorWalletAddress, OPERATOR_WALLET);
assert.match(debugSnapshot.operatorInventoryUrl ?? "", /walletAddress=/i);
assert.equal(debugSnapshot.rawNetworkNodeCount, 7);
assert.equal(debugSnapshot.rawUnlinkedStructureCount, 4);
assert.equal(debugSnapshot.rawNetworkNodeDuplicateBucketsByCanonicalIdentity.length, 1);
assert.equal(debugSnapshot.rawNetworkNodeDuplicateBucketsByOwnerCapId.length, 1);
assert.equal(debugSnapshot.groupedNodeEligibilityDecisions.length, 7);
assert.equal(debugSnapshot.rawGroupedDuplicateBucketsByCanonicalDomainKey.length, 1);
assert.equal(debugSnapshot.renderedMacroNetworkNodeCount, 3);
assert.equal(debugSnapshot.renderedNetworkNodeListCount, 3);
assert.equal(debugSnapshot.renderedNodeGroups.length, 3);
assert.equal(debugSnapshot.renderedNetworkNodeListRows.length, 3);
assert.equal(debugSnapshot.renderedNodeControlSelectedNodeStructuresCount, 7);
assert.equal(debugSnapshot.mergedIntoDisplay, false);
assert.equal(debugSnapshot.displayUsesDirectChainFallback, false);
assert.equal(debugSnapshot.directChainFallbackRan, true);
assert.equal(debugSnapshot.adaptedStructureCount, adapted.structures.length);
assert.equal(debugSnapshot.adaptedUnlinkedStructureCount, adapted.unlinkedStructures.length);
assert.equal(debugSnapshot.quarantinedNodeRows.length, 4);
assert.equal(debugSnapshot.zeroStructureGroupedNodes.length, 4);
assert.equal(debugSnapshot.missingIdentityNodeRows.length, 1);
assert.equal(debugSnapshot.localStorageOrDebugFixturesParticipated, false);
assert(debugSnapshot.rawNetworkNodes.some((row) => row.objectId === NETWORK_NODE_EMPTY_VALID_ID && row.rendered && row.strongOwnedNodeProof && row.renderEligibility === "strong-owned-node-proof"));
assert(debugSnapshot.rawNetworkNodes.some((row) => row.objectId === NETWORK_NODE_OBJECT_ONLY_ID && !row.rendered && row.quarantineReason === "zero-structure-missing-strong-owned-proof" && row.proofSignals.length === 0));
assert(debugSnapshot.rawNetworkNodes.some((row) => row.objectId === NETWORK_NODE_WEAK_NEUTRAL_ID && !row.rendered && row.quarantineReason === "zero-structure-missing-strong-owned-proof" && row.proofSignals.includes("assembly-id")));
assert(debugSnapshot.rawUnlinkedRows.some((row) => row.objectId === STRAY_NETWORK_NODE_ID));
assert(debugSnapshot.rawUnlinkedRows.some((row) => row.objectId === SUSPICIOUS_TURRET_A_ID));
assert(debugSnapshot.rawUnlinkedRows.some((row) => row.objectId === SUSPICIOUS_TURRET_B_ID));
assert(debugSnapshot.adaptedUnlinkedRows.some((row) => row.objectId === SUSPICIOUS_TURRET_A_ID));
assert(debugSnapshot.adaptedUnlinkedRows.some((row) => row.objectId === SUSPICIOUS_TURRET_B_ID));
assert.equal(debugSnapshot.duplicateBucketsByObjectId.length, 0);
assert.equal(debugSnapshot.duplicateBucketsByCanonicalDomainKey.length, 0);

const debugCopySummary = buildOperatorInventoryDebugCopySummary(debugSnapshot);
assert.equal(debugCopySummary?.rawNetworkNodes.length, 7);
assert.equal(debugCopySummary?.renderedNetworkNodes.length, 3);
assert.equal(debugCopySummary?.quarantinedNodes.length, 4);
assert(debugCopySummary?.quarantinedNodes.some((row) => row.objectId === NETWORK_NODE_OBJECT_ONLY_ID && row.reason === "zero-structure-missing-strong-owned-proof"));

const nodeListScreenSource = readFileSync(new URL("../src/screens/NetworkNodeListScreen.tsx", import.meta.url), "utf8");
assert.match(nodeListScreenSource, />\s*Object ID\s*<\/th>/);
assert.doesNotMatch(nodeListScreenSource, />\s*Location\s*<\/th>/);

const sidebarMarkup = renderToStaticMarkup(
  React.createElement(
    MemoryRouter,
    null,
    React.createElement(Sidebar, {
      structures: adapted.structures,
      isConnected: true,
      isLoading: false,
      isError: false,
      discoveryErrorMessage: null,
      inventoryStatusLabel: "Shared read model • Updated 15:07",
      discoveryWarning: RAW_WARNING_TEXT,
    } as any),
  ),
);

assert(!sidebarMarkup.includes("Shared read model • Updated 15:07"));
assert(!sidebarMarkup.includes(RAW_WARNING_TEXT));

console.info("operator inventory mapping probe passed", {
  structures: adapted.structures.length,
  renderedNodes: displayNodeGroups.length,
  nodeRows: viewModel.structures.length,
  sourceMode: viewModel.sourceMode,
});

function actionRow(input: {
  objectId: string;
  assemblyId: string;
  ownerCapId: string | null;
  family: "gate" | "storage" | "turret";
  displayName: string;
  name?: string | null;
  displayNameSource?: string | null;
  displayNameUpdatedAt?: string | null;
  typeId: number;
  typeName: string;
  assemblyType: string;
  status: "online" | "offline" | "unknown";
  extensionStatus: "authorized" | "stale" | "none" | null;
  fuelAmount?: string | null;
  powerSummary?: IndexedPowerSummary | null;
  powerRequirement?: Structure["indexedPowerRequirement"];
  powerUsageSummary?: Structure["indexedPowerUsageSummary"];
  requiredIds: {
    structureId: string;
    structureType: "gate" | "storage_unit" | "turret";
    ownerCapId: string | null;
    networkNodeId: string | null;
  };
  size?: "mini" | "standard" | "heavy";
}) {
  return {
    objectId: input.objectId,
    assemblyId: input.assemblyId,
    ownerCapId: input.ownerCapId,
    family: input.family,
    size: input.size ?? "standard",
    displayName: input.displayName,
    displayNameSource: input.displayNameSource ?? null,
    displayNameUpdatedAt: input.displayNameUpdatedAt ?? null,
    name: input.name ?? input.displayName,
    typeId: input.typeId,
    typeName: input.typeName,
    assemblyType: input.assemblyType,
    status: input.status,
    networkNodeId: input.requiredIds.networkNodeId,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: OPERATOR_WALLET,
    characterId: CHARACTER_ID,
    extensionStatus: input.extensionStatus,
    fuelAmount: input.fuelAmount ?? null,
    powerSummary: input.powerSummary ?? null,
    powerRequirement: input.powerRequirement ?? null,
    powerUsageSummary: input.powerUsageSummary ?? null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: "101010",
    lastObservedTimestamp: OBSERVED_AT,
    lastUpdated: OBSERVED_AT,
    source: SHARED_BACKEND_SOURCE,
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: {
      actions: {
        power: {
          candidate: true,
          currentlyImplementedInCivilizationControl: true,
          familySupported: true,
          indexedOwnerCapPresent: input.requiredIds.ownerCapId != null,
          requiredIds: input.requiredIds,
          unavailableReason: null,
        },
        rename: {
          candidate: true,
          currentlyImplementedInCivilizationControl: false,
          familySupported: true,
          indexedOwnerCapPresent: input.requiredIds.ownerCapId != null,
          requiredIds: input.requiredIds,
          unavailableReason: "Rename remains deferred in this pass.",
        },
      },
      supported: true,
      familySupported: true,
      unavailableReason: null,
    },
  };
}

function networkNodeRow(input: {
  objectId: string | null;
  assemblyId: string | null;
  ownerCapId: string | null;
  displayName: string;
  name?: string | null;
  displayNameSource?: string | null;
  displayNameUpdatedAt?: string | null;
  solarSystemId: string | null;
  fuelAmount: string | null;
  status?: "online" | "offline" | "warning" | "unknown" | "unanchored";
  powerSummary?: IndexedPowerSummary | null;
  powerUsageSummary?: Structure["indexedPowerUsageSummary"];
  energySourceId?: string | null;
}) {
  return {
    objectId: input.objectId,
    assemblyId: input.assemblyId,
    ownerCapId: input.ownerCapId,
    family: "networkNode",
    size: "standard",
    displayName: input.displayName,
    displayNameSource: input.displayNameSource ?? null,
    displayNameUpdatedAt: input.displayNameUpdatedAt ?? null,
    name: input.name ?? input.displayName,
    typeId: 99001,
    typeName: "Network Node",
    assemblyType: "network_node",
    status: input.status ?? "online",
    networkNodeId: null,
    energySourceId: input.energySourceId ?? null,
    linkedGateId: null,
    ownerWalletAddress: OPERATOR_WALLET,
    characterId: CHARACTER_ID,
    extensionStatus: "authorized",
    fuelAmount: input.fuelAmount,
    powerSummary: input.powerSummary ?? null,
    powerRequirement: null,
    powerUsageSummary: input.powerUsageSummary ?? null,
    solarSystemId: input.solarSystemId,
    url: null,
    lastObservedCheckpoint: "101010",
    lastObservedTimestamp: OBSERVED_AT,
    lastUpdated: OBSERVED_AT,
    source: SHARED_BACKEND_SOURCE,
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: null,
  };
}

function createPowerSummary(overrides: Partial<IndexedPowerSummary> = {}): IndexedPowerSummary {
  return {
    fuelAmount: overrides.fuelAmount ?? null,
    fuelMaxCapacity: overrides.fuelMaxCapacity ?? null,
    fuelTypeId: overrides.fuelTypeId ?? null,
    fuelTypeName: overrides.fuelTypeName ?? null,
    fuelGrade: overrides.fuelGrade ?? null,
    efficiencyPercent: overrides.efficiencyPercent ?? null,
    burnRateUnitsPerHour: overrides.burnRateUnitsPerHour ?? null,
    estimatedSecondsRemaining: overrides.estimatedSecondsRemaining ?? null,
    estimatedHoursRemaining: overrides.estimatedHoursRemaining ?? null,
    criticalFuelThresholdSeconds: overrides.criticalFuelThresholdSeconds ?? null,
    lowFuelThresholdSeconds: overrides.lowFuelThresholdSeconds ?? null,
    isLowFuel: overrides.isLowFuel ?? null,
    isCriticalFuel: overrides.isCriticalFuel ?? null,
    source: overrides.source ?? "operator-inventory",
    lastUpdated: overrides.lastUpdated ?? OBSERVED_AT,
    confidence: overrides.confidence ?? "indexed",
  };
}

function createPowerRequirement(
  overrides: Partial<NonNullable<Structure["indexedPowerRequirement"]>> = {},
): NonNullable<Structure["indexedPowerRequirement"]> {
  return {
    requiredGj: overrides.requiredGj ?? null,
    source: overrides.source ?? "indexed_type",
    confidence: overrides.confidence ?? "indexed",
    typeId: overrides.typeId ?? null,
    family: overrides.family ?? null,
    size: overrides.size ?? null,
    lastUpdated: overrides.lastUpdated ?? OBSERVED_AT,
  };
}

function createNodePowerUsageSummary(
  overrides: Partial<NonNullable<Structure["indexedPowerUsageSummary"]>> = {},
): NonNullable<Structure["indexedPowerUsageSummary"]> {
  return {
    capacityGj: overrides.capacityGj ?? null,
    usedGj: overrides.usedGj ?? null,
    availableGj: overrides.availableGj ?? null,
    onlineKnownLoadGj: overrides.onlineKnownLoadGj ?? null,
    onlineUnknownLoadCount: overrides.onlineUnknownLoadCount ?? null,
    totalKnownLoadGj: overrides.totalKnownLoadGj ?? null,
    totalUnknownLoadCount: overrides.totalUnknownLoadCount ?? null,
    source: overrides.source ?? "indexed_children",
    confidence: overrides.confidence ?? "indexed",
    lastUpdated: overrides.lastUpdated ?? OBSERVED_AT,
  };
}

function liveGenericAssemblyRow(input: {
  objectId: string;
  ownerCapId: string | null;
  networkNodeId: string | null;
  family: "printer" | "refinery" | "assembler" | "berth" | "relay" | "nursery" | "nest" | "shelter";
  displayName: string;
  typeId: number;
  typeName: string;
  assemblyType: string;
  status: "online" | "offline" | "unknown";
  size?: "mini" | "standard" | "heavy";
}) {
  return {
    objectId: input.objectId,
    assemblyId: null,
    ownerCapId: input.ownerCapId,
    family: input.family,
    size: input.size ?? "standard",
    displayName: input.displayName,
    name: input.displayName,
    typeId: input.typeId,
    typeName: input.typeName,
    assemblyType: input.assemblyType,
    status: input.status,
    networkNodeId: input.networkNodeId,
    energySourceId: input.networkNodeId,
    linkedGateId: null,
    ownerWalletAddress: null,
    characterId: null,
    extensionStatus: null,
    fuelAmount: null,
    powerSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: "101010",
    lastObservedTimestamp: OBSERVED_AT,
    lastUpdated: OBSERVED_AT,
    source: SHARED_BACKEND_SOURCE,
    provenance: "operator-inventory",
    partial: false,
    warnings: [],
    actionCandidate: {
      actions: {
        power: {
          candidate: true,
          currentlyImplementedInCivilizationControl: false,
          familySupported: true,
          indexedOwnerCapPresent: input.ownerCapId != null,
          requiredIds: null,
          unavailableReason: "frontend_action_not_implemented",
        },
        rename: {
          candidate: true,
          currentlyImplementedInCivilizationControl: false,
          familySupported: true,
          indexedOwnerCapPresent: input.ownerCapId != null,
          requiredIds: null,
          unavailableReason: "frontend_action_not_implemented",
        },
      },
      supported: true,
      familySupported: true,
      unavailableReason: "frontend_action_not_implemented",
    },
  };
}

function strayNodeLikeRow() {
  return {
    objectId: STRAY_NETWORK_NODE_ID,
    assemblyId: "9300",
    ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000e300",
    family: "networkNode",
    size: "standard",
    displayName: "Stray Node",
    name: "Stray Node",
    typeId: 99001,
    typeName: "Network Node",
    assemblyType: "network_node",
    status: "unknown",
    networkNodeId: null,
    energySourceId: null,
    linkedGateId: null,
    ownerWalletAddress: OPERATOR_WALLET,
    characterId: CHARACTER_ID,
    extensionStatus: "stale",
    fuelAmount: null,
    powerSummary: null,
    solarSystemId: null,
    url: null,
    lastObservedCheckpoint: "101012",
    lastObservedTimestamp: "2026-05-03T12:02:00.000Z",
    lastUpdated: "2026-05-03T12:02:00.000Z",
    source: SHARED_BACKEND_SOURCE,
    provenance: "operator-inventory",
    partial: false,
    warnings: ["Unlinked network node-like row should not render as a macro node."],
    actionCandidate: null,
  };
}

function buildGroup(nodeGroups: NetworkNodeGroup[], nodeId: string): NetworkNodeGroup {
  const group = nodeGroups.find((entry) => entry.node.objectId === nodeId);
  if (!group) {
    throw new Error("Missing node structure for probe group");
  }

  return group;
}

function buildLegacyFallbackStructures(): Structure[] {
  return [
    {
      objectId: LEGACY_FALLBACK_NODE_ID,
      assemblyId: "9901",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000f901",
      readModelSource: "direct-chain",
      type: "network_node",
      name: "Legacy Fallback Node",
      status: "online",
      extensionStatus: "authorized",
    },
    {
      objectId: "0x000000000000000000000000000000000000000000000000000000000000f902",
      assemblyId: "9902",
      ownerCapId: "0x000000000000000000000000000000000000000000000000000000000000f902",
      readModelSource: "direct-chain",
      type: "gate",
      name: "Legacy Fallback Gate",
      status: "online",
      extensionStatus: "authorized",
      networkNodeId: LEGACY_FALLBACK_NODE_ID,
    },
  ];
}
