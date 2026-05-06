import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { StructureActionContextMenu } from "../src/components/structure-actions/StructureActionContextMenu.tsx";
import { NodeDrilldownCanvas } from "../src/components/topology/node-drilldown/NodeDrilldownCanvas.tsx";
import { NodeSelectionInspector } from "../src/components/topology/node-drilldown/NodeSelectionInspector.tsx";
import { NodeStructureActionRail } from "../src/components/topology/node-drilldown/NodeStructureActionRail.tsx";
import { NodeStructureListPanel } from "../src/components/topology/node-drilldown/NodeStructureListPanel.tsx";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { buildNodeDrilldownMenuItems } from "../src/lib/nodeDrilldownMenuItems.ts";
import { buildLiveNodeLocalViewModelWithObserved } from "../src/lib/nodeDrilldownModel.ts";
import { resolveNodeLocalStructure } from "../src/lib/nodeDrilldownSelection.ts";
import { getNodePowerUsageReadout } from "../src/lib/nodePowerControlModel.ts";
import {
  buildOperatorInventoryUrl,
  normalizeOperatorInventoryResponse,
} from "../src/lib/operatorInventoryClient.ts";
import {
  buildNodeDiagnostic,
  detectProofLoss,
  findRawNode,
  makeInventoryStructure,
  objectId,
  selectNodeGroups,
} from "./node-live-proof-loss-core.mts";

import type { OperatorInventoryResponse } from "../src/types/operatorInventory.ts";
import type { NodeLocalStructure, NodeLocalViewModel } from "../src/lib/nodeDrilldownTypes.ts";

const DEFAULT_WALLET_ADDRESS = "0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62";
const DEFAULT_BASE_URL = "https://ef-map.com";
const DEFAULT_ORIGIN = "https://civilizationcontrol.com";

interface Args {
  walletAddress: string;
  baseUrl: string;
  origin: string;
  nodeObjectId: string | null;
  fixtureOnly: boolean;
}

function readArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

function parseArgs(args: string[]): Args {
  return {
    walletAddress: readArgValue(args, "--wallet")
      ?? readArgValue(args, "--walletAddress")
      ?? DEFAULT_WALLET_ADDRESS,
    baseUrl: readArgValue(args, "--base") ?? DEFAULT_BASE_URL,
    origin: readArgValue(args, "--origin") ?? DEFAULT_ORIGIN,
    nodeObjectId: readArgValue(args, "--node") ?? readArgValue(args, "--nodeObjectId"),
    fixtureOnly: args.includes("--fixture-only"),
  };
}

function powerAction(structureId: string, structureType: "storage_unit" | "assembly", ownerCapId: string, networkNodeId: string) {
  return {
    candidate: true,
    currentlyImplementedInCivilizationControl: true,
    familySupported: true,
    indexedOwnerCapPresent: true,
    requiredIds: { structureId, structureType, ownerCapId, networkNodeId },
    unavailableReason: null,
  };
}

function makeFixtureInventory(): OperatorInventoryResponse {
  const nodeId = objectId(100);
  const storageId = objectId(101);
  const refineryId = objectId(102);
  const storageOwnerCapId = objectId(201);
  const refineryOwnerCapId = objectId(202);

  return {
    schemaVersion: "operator-inventory.v1",
    operator: {
      walletAddress: DEFAULT_WALLET_ADDRESS,
      characterId: objectId(300),
      characterName: "Proof Fixture",
      tribeId: 7,
      tribeName: "Stillness Vanguard",
    },
    networkNodes: [{
      node: makeInventoryStructure({
        objectId: nodeId,
        assemblyId: "7000",
        ownerCapId: objectId(200),
        family: "networkNode",
        size: "standard",
        displayName: "Proof Node",
        name: "Proof Node",
        typeId: 99001,
        typeName: "Network Node",
        assemblyType: "network_node",
        status: "online",
        powerUsageSummary: {
          capacityGj: 1000,
          usedGj: 240,
          availableGj: 760,
          onlineKnownLoadGj: 240,
          onlineUnknownLoadCount: 0,
          totalKnownLoadGj: 420,
          totalUnknownLoadCount: 0,
          source: "indexed_children",
          confidence: "indexed",
          lastUpdated: "2026-05-06T12:00:00.000Z",
        },
      }),
      structures: [
        makeInventoryStructure({
          objectId: storageId,
          assemblyId: "7101",
          ownerCapId: storageOwnerCapId,
          family: "storage",
          size: "standard",
          displayName: "Proof Storage",
          name: "Proof Storage",
          typeId: 88083,
          typeName: "Storage",
          assemblyType: "storage_unit",
          status: "online",
          networkNodeId: nodeId,
          extensionStatus: "authorized",
          powerRequirement: {
            requiredGj: 120,
            source: "indexed_type",
            confidence: "indexed",
            typeId: "88083",
            family: "storage",
            size: "standard",
            lastUpdated: "2026-05-06T12:00:00.000Z",
          },
          actionCandidate: {
            actions: { power: powerAction(storageId, "storage_unit", storageOwnerCapId, nodeId), rename: null },
            supported: true,
            familySupported: true,
            unavailableReason: null,
          },
        }),
        makeInventoryStructure({
          objectId: refineryId,
          assemblyId: "7102",
          ownerCapId: refineryOwnerCapId,
          family: "refinery",
          size: "standard",
          displayName: "Proof Refinery",
          name: "Proof Refinery",
          typeId: 88069,
          typeName: "Refinery",
          assemblyType: "refinery",
          status: "offline",
          networkNodeId: nodeId,
          powerRequirement: {
            requiredGj: 300,
            source: "indexed_type",
            confidence: "indexed",
            typeId: "88069",
            family: "refinery",
            size: "standard",
            lastUpdated: "2026-05-06T12:00:00.000Z",
          },
          actionCandidate: {
            actions: {
              power: powerAction(refineryId, "assembly", refineryOwnerCapId, nodeId),
              rename: powerAction(refineryId, "assembly", refineryOwnerCapId, nodeId),
            },
            supported: true,
            familySupported: true,
            unavailableReason: null,
          },
        }),
      ],
    }],
    unlinkedStructures: [],
    warnings: [],
    partial: false,
    source: "shared-frontier-backend",
    fetchedAt: "2026-05-06T12:00:00.000Z",
  };
}

function runFixtureAssertions(): void {
  const inventory = makeFixtureInventory();
  const adapted = adaptOperatorInventory(inventory);
  const group = adapted.nodeGroups[0];
  assert(group, "expected fixture to adapt into one node group");

  const lookup = adapted.nodeLookupsByNodeId.get(group.node.objectId) ?? null;
  assert(lookup, "expected fixture to build a NodeAssemblySummary lookup");

  const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
  const diagnostic = buildNodeDiagnostic({ rawNode: inventory.networkNodes[0] ?? null, group, lookup, viewModel });
  assert.equal(diagnostic.proofLoss.ok, true, "expected complete live-shaped proof to survive into inspector projection");

  const refineryProjection = diagnostic.nodeSelectionInspectorProjection.structures.find((row) => row.assemblyId === "7102");
  assert(refineryProjection, "expected generic refinery row to render from operator inventory lookup");
  assert.equal(refineryProjection.objectId, objectId(102), "expected refinery Object ID proof");
  assert.equal(refineryProjection.ownerCapId, objectId(202), "expected refinery OwnerCap proof");
  assert.equal(refineryProjection.networkNodeId, objectId(100), "expected refinery Network Node proof");
  assert.equal(refineryProjection.verifiedTarget?.structureType, "assembly", "expected generic assembly verified target");
  assert.equal(refineryProjection.powerRequirement?.requiredGj, 300, "expected refinery power requirement");

  const lossyProjection = {
    ...diagnostic.nodeSelectionInspectorProjection,
    structures: diagnostic.nodeSelectionInspectorProjection.structures.map((row) => row.assemblyId === "7102"
      ? { ...row, objectId: null, ownerCapId: null, networkNodeId: null, actionCandidate: null, verifiedTarget: null, powerRequirement: null }
      : row),
  };
  const simulatedFailures = detectProofLoss({ rawNode: inventory.networkNodes[0] ?? null, group, lookup, projection: lossyProjection });
  assert.equal(simulatedFailures.length, 1, "expected screenshot-shaped proof loss to fail deterministically");
  assert.deepEqual(simulatedFailures[0]?.lostFields, [
    "object_id",
    "owner_cap_id",
    "network_node_id",
    "action_candidate",
    "verified_target",
    "power_requirement",
  ]);
}

function makeWeakRenderedStructure(structure: NodeLocalStructure): NodeLocalStructure {
  return {
    ...structure,
    id: structure.assemblyId ? `assembly:${structure.assemblyId}` : structure.id,
    displayName: "Test 3",
    typeLabel: structure.familyLabel,
    sizeVariant: null,
    badge: null,
    objectId: undefined,
    directChainObjectId: null,
    directChainAssemblyId: null,
    hasDirectChainAuthority: false,
    directChainMatchCount: 0,
    futureActionEligible: false,
    source: "backendObserved",
    powerRequirement: null,
    actionCandidate: null,
    actionAuthority: {
      state: "backend-only",
      verifiedTarget: null,
      candidateTargets: [],
      unavailableReason: null,
    },
    isReadOnly: true,
    isActionable: false,
    sortLabel: "test 3",
  };
}

function withWeakRenderedSelection(viewModel: NodeLocalViewModel, weakStructure: NodeLocalStructure): NodeLocalViewModel {
  return {
    ...viewModel,
    structures: [
      weakStructure,
      ...viewModel.structures,
    ],
  };
}

function assertRenderedUiProof(viewModel: NodeLocalViewModel, groupNode: Parameters<typeof NodeSelectionInspector>[0]["selectedNode"], strongStructure: NodeLocalStructure): void {
  const weakStructure = makeWeakRenderedStructure(strongStructure);
  const weakViewModel = withWeakRenderedSelection(viewModel, weakStructure);
  const resolution = resolveNodeLocalStructure(weakViewModel, { structure: weakStructure }, "canvas-projection");
  const resolvedStructure = resolution.structure;
  assert(resolvedStructure, "expected weak rendered selection to resolve");
  assert.equal(resolvedStructure.objectId, strongStructure.objectId, "expected weak rendered selection to resolve to authoritative object row");
  assert.equal(resolvedStructure.actionAuthority.verifiedTarget?.ownerCapId, strongStructure.actionAuthority.verifiedTarget?.ownerCapId, "expected weak rendered selection to resolve OwnerCap proof");
  assert.equal(resolution.replacedWeakRow, true, "expected selected-row resolver to report weak row replacement");

  const inspectorMarkup = renderToStaticMarkup(React.createElement(NodeSelectionInspector, {
    embedded: true,
    viewModel: weakViewModel,
    selectedNode: groupNode,
    selectedStructureId: weakStructure.id,
    hiddenCanonicalKeySet: new Set<string>(),
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
  }));
  assert(inspectorMarkup.includes(strongStructure.displayName), "expected rendered inspector to show selected structure label");
  assert(inspectorMarkup.includes("Copy structure object ID"), "expected rendered inspector to include Object ID proof control");
  assert(!inspectorMarkup.includes("Not supplied"), "expected rendered inspector not to show missing Object ID proof");
  assert(inspectorMarkup.includes("Copy structure owner cap ID"), "expected rendered inspector to include OwnerCap proof control");
  assert(!inspectorMarkup.includes("Not indexed"), "expected rendered inspector not to show missing indexed proof");
  assert(inspectorMarkup.includes("Copy linked network node ID"), "expected rendered inspector to include Network Node proof control");
  assert(inspectorMarkup.includes("Power and rename available"), "expected rendered inspector to show write authority");
  assert(!inspectorMarkup.includes("Test 3"), "expected inspector display to ignore stale weak-row names");

  const listMarkup = renderToStaticMarkup(React.createElement(NodeStructureListPanel, {
    embedded: true,
    viewModel: weakViewModel,
    selectedStructureId: weakStructure.id,
    hiddenCanonicalKeySet: new Set<string>(),
    onSelectStructure: () => undefined,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
  }));
  assert(listMarkup.includes(strongStructure.displayName), "expected attached list to render the authoritative display name");
  assert(!listMarkup.includes("Test 3"), "expected attached list not to render stale weak-row names");
  assert(listMarkup.includes("Copy") === false, "expected attached list to remain a list projection, not inspector markup");

  const canvasMarkup = renderToStaticMarkup(React.createElement(NodeDrilldownCanvas, {
    viewModel: weakViewModel,
    selectedStructureId: weakStructure.id,
    onSelectStructure: () => undefined,
    totalStructureCount: viewModel.structures.length,
    hiddenStructureCount: 0,
    powerUsageLabel: "320 / 1000 GJ",
  }));
  assert(canvasMarkup.includes(strongStructure.displayName), "expected canvas aria labels to use the authoritative display name");
  assert(!canvasMarkup.includes("Test 3"), "expected canvas projection not to expose stale weak-row names");

  const railMarkup = renderToStaticMarkup(React.createElement(NodeStructureActionRail, {
    structure: resolvedStructure,
    isHidden: false,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
    variant: "panel",
  }));
  assert(railMarkup.includes("Action Control"), "expected action rail to render");
  assert(railMarkup.includes("ONLINE"), "expected action rail to show online status");
  assert(railMarkup.includes("Take offline"), "expected action rail to render enabled Take offline action");

  const menuItems = buildNodeDrilldownMenuItems({
    contextMenu: {
      structureId: weakStructure.id,
      canonicalDomainKey: weakStructure.canonicalDomainKey,
      structureName: weakStructure.displayName,
      left: 0,
      top: 0,
      visibilityAction: "hide",
      visibilityActionLabel: "Hide from Node View",
      powerActionLabel: null,
      nextOnline: null,
    },
    structure: resolvedStructure,
    onHideStructure: () => undefined,
    onUnhideStructure: () => undefined,
    onTogglePower: () => undefined,
    onRenameStructure: () => undefined,
  });
  assert.deepEqual(menuItems.map((item) => item.label), ["Hide from Node View", "Take Offline", "Rename Assembly"]);

  const menuMarkup = renderToStaticMarkup(React.createElement(StructureActionContextMenu, {
    menu: {
      structureName: strongStructure.displayName,
      left: 0,
      top: 0,
      items: menuItems,
    },
    menuRef: { current: null },
    onClose: () => undefined,
  }));
  assert(menuMarkup.includes('role="menu"'), "expected context menu markup");
  assert(menuMarkup.includes(`${strongStructure.displayName} actions`), "expected context menu aria label for selected structure");
  assert(menuMarkup.includes("Take Offline"), "expected rendered context menu to include power action");
  assert(menuMarkup.includes("Rename Assembly"), "expected rendered context menu to include rename action");

  const readout = getNodePowerUsageReadout(viewModel.node, viewModel.structures);
  assert.equal(readout.isAvailable, true, "expected rendered target power readout to be available");
  assert.notEqual(readout.label, "Power usage unavailable", "expected rendered target power readout not to degrade");
}

function makeLiveShapedRawPayload() {
  const nodeId = objectId(400);
  const assemblerId = objectId(401);
  const assemblerOwnerCapId = objectId(501);

  return {
    schemaVersion: "operator-inventory.v1",
    operator: {
      walletAddress: DEFAULT_WALLET_ADDRESS,
      characterId: objectId(600),
      characterName: "Proof Fixture",
      tribeId: 7,
      tribeName: "Stillness Vanguard",
    },
    networkNodes: [{
      node: {
        objectId: nodeId,
        assemblyId: "8000",
        ownerCapId: objectId(500),
        family: "network_node",
        size: "standard",
        displayName: "Live-Shaped Node",
        name: null,
        typeId: 88092,
        typeName: "Network Node",
        assemblyType: "network_node",
        status: "online",
        powerUsageSummary: {
          capacityGj: 1000,
          usedGj: 200,
          availableGj: 800,
          onlineKnownLoadGj: 200,
          onlineUnknownLoadCount: 0,
          totalKnownLoadGj: 200,
          totalUnknownLoadCount: 0,
          source: "indexed_children",
          confidence: "indexed",
          lastUpdated: "2026-05-06T12:00:00.000Z",
        },
      },
      structures: [
        {
          objectId: null,
          assemblyId: "8101",
          ownerCapId: null,
          family: "assembler",
          size: "unknown",
          displayName: "Amazing Assembler",
          displayNameSource: "assembly_snapshot",
          displayNameUpdatedAt: "2026-05-06T12:05:00.000Z",
          name: null,
          typeId: 88068,
          typeName: "Assembler",
          assemblyType: "assembler",
          status: "online",
          networkNodeId: nodeId,
          energySourceId: nodeId,
          source: "shared-frontier-backend",
          provenance: "node-local-indexer",
        },
        {
          objectId: assemblerId,
          assemblyId: "8101",
          ownerCapId: assemblerOwnerCapId,
          family: "assembler",
          size: "unknown",
          displayName: "Assembler",
          displayNameSource: "type_name",
          name: null,
          typeId: 88068,
          typeName: "Assembler",
          assemblyType: "assembler",
          status: "online",
          networkNodeId: nodeId,
          energySourceId: nodeId,
          powerRequirement: {
            requiredGj: 200,
            source: "indexed_config",
            confidence: "indexed",
            typeId: "88068",
            family: "assembler",
            size: "unknown",
            lastUpdated: null,
          },
          source: "shared-frontier-backend",
          provenance: "operator-inventory-indexer",
          actionCandidate: {
            supported: false,
            familySupported: false,
            hasIndexedOwnerCap: true,
            indexedAuthorityCandidate: true,
            requiredIds: {
              objectId: assemblerId,
              ownerCapId: assemblerOwnerCapId,
              energySourceId: nodeId,
              networkNodeId: nodeId,
            },
            actions: {
              power: {
                candidate: true,
                currentlyImplementedInCivilizationControl: false,
                unavailableReason: "frontend_action_not_implemented",
              },
              rename: {
                candidate: true,
                currentlyImplementedInCivilizationControl: false,
                unavailableReason: "frontend_action_not_implemented",
              },
            },
            unavailableReason: "frontend_action_not_implemented",
          },
        },
      ],
    }],
    unlinkedStructures: [],
    warnings: [],
    partial: false,
    source: "shared-frontier-backend",
    fetchedAt: "2026-05-06T12:00:00.000Z",
  };
}

function runLiveShapedPayloadAssertions(): void {
  const inventory = normalizeOperatorInventoryResponse(makeLiveShapedRawPayload());
  assert(inventory, "expected live-shaped raw fixture to normalize");

  const adapted = adaptOperatorInventory(inventory);
  const group = adapted.nodeGroups[0];
  assert(group, "expected live-shaped fixture to adapt into one node group");

  const lookup = adapted.nodeLookupsByNodeId.get(group.node.objectId) ?? null;
  assert(lookup, "expected live-shaped fixture to build a selected-node lookup");

  const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
  const diagnostic = buildNodeDiagnostic({ rawNode: inventory.networkNodes[0] ?? null, group, lookup, viewModel });
  assert.equal(diagnostic.proofLoss.ok, true, "expected live-shaped weak/display plus strong/proof rows to preserve proof");

  const assemblerProjection = diagnostic.nodeSelectionInspectorProjection.structures.find((row) => row.assemblyId === "8101");
  assert(assemblerProjection, "expected the live-shaped assembler row to render by canonical assembly identity");
  assert.equal(assemblerProjection.displayRowExists, true, "expected the live-shaped assembler display row");
  assert.equal(assemblerProjection.status, "online", "expected the live-shaped display status to survive");
  assert.equal(assemblerProjection.objectId, objectId(401), "expected live-shaped Object ID proof");
  assert.equal(assemblerProjection.ownerCapId, objectId(501), "expected live-shaped OwnerCap proof");
  assert.equal(assemblerProjection.networkNodeId, objectId(400), "expected live-shaped Network Node proof");
  assert.equal(assemblerProjection.verifiedTarget?.structureType, "assembly", "expected live-shaped generic assembly write target");
  assert.equal(assemblerProjection.powerRequirement?.requiredGj, 200, "expected live-shaped power requirement proof");

  const assemblerStructure = viewModel.structures.find((row) => row.assemblyId === "8101");
  assert(assemblerStructure, "expected live-shaped assembler row in rendered view model");
  assertRenderedUiProof(viewModel, group.node, assemblerStructure);

  const lossyProjection = {
    ...diagnostic.nodeSelectionInspectorProjection,
    structures: diagnostic.nodeSelectionInspectorProjection.structures.map((row) => row.assemblyId === "8101"
      ? { ...row, objectId: null, ownerCapId: null, networkNodeId: null, actionCandidate: null, verifiedTarget: null, powerRequirement: null }
      : row),
  };
  const simulatedFailures = detectProofLoss({ rawNode: inventory.networkNodes[0] ?? null, group, lookup, projection: lossyProjection });
  assert.equal(simulatedFailures.length, 1, "expected live-shaped screenshot proof loss to fail deterministically");
  assert.deepEqual(simulatedFailures[0]?.lostFields, [
    "object_id",
    "owner_cap_id",
    "network_node_id",
    "action_candidate",
    "verified_target",
    "power_requirement",
  ]);
}

async function fetchLiveInventory(args: Args) {
  const response = await fetch(buildOperatorInventoryUrl(args.walletAddress, args.baseUrl), {
    headers: { Origin: args.origin },
  });
  if (!response.ok) throw new Error(`operator-inventory fetch failed: ${response.status} ${response.statusText}`);

  const rawPayload = await response.json();
  const inventory = normalizeOperatorInventoryResponse(rawPayload);
  if (!inventory) throw new Error("operator-inventory payload did not normalize to operator-inventory.v1.");

  return {
    rawPayload,
    inventory,
    transport: {
      status: response.status,
      accessControlAllowOrigin: response.headers.get("access-control-allow-origin"),
      vary: response.headers.get("vary"),
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function readNullableString(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function summarizeRawPayloadStructure(value: unknown) {
  const row = asRecord(value);
  const actionCandidate = asRecord(row?.actionCandidate);
  const actions = asRecord(actionCandidate?.actions);
  const powerAction = asRecord(actions?.power);
  const renameAction = asRecord(actions?.rename);
  const powerRequirement = asRecord(row?.powerRequirement);

  return {
    displayName: readNullableString(row, "displayName"),
    name: readNullableString(row, "name"),
    family: readNullableString(row, "family"),
    size: readNullableString(row, "size"),
    status: readNullableString(row, "status"),
    objectId: readNullableString(row, "objectId"),
    assemblyId: readNullableString(row, "assemblyId"),
    ownerCapId: readNullableString(row, "ownerCapId"),
    networkNodeId: readNullableString(row, "networkNodeId"),
    energySourceId: readNullableString(row, "energySourceId"),
    actionCandidateRequiredIds: asRecord(actionCandidate?.requiredIds),
    actionCandidateActions: {
      powerRequiredIds: asRecord(powerAction?.requiredIds),
      renameRequiredIds: asRecord(renameAction?.requiredIds),
    },
    powerRequirementRequiredGj: typeof powerRequirement?.requiredGj === "number" ? powerRequirement.requiredGj : null,
  };
}

function summarizeRawPayloadNode(rawPayload: unknown, nodeObjectId: string) {
  const payload = asRecord(rawPayload);
  const networkNodes = Array.isArray(payload?.networkNodes) ? payload.networkNodes : [];
  const normalizedNodeObjectId = nodeObjectId.toLowerCase();
  const rawNodeGroup = networkNodes
    .map(asRecord)
    .find((entry) => readNullableString(asRecord(entry?.node), "objectId")?.toLowerCase() === normalizedNodeObjectId)
    ?? null;

  if (!rawNodeGroup) return null;

  return {
    node: summarizeRawPayloadStructure(rawNodeGroup.node),
    powerUsageSummary: asRecord(rawNodeGroup.powerUsageSummary) ?? asRecord(asRecord(rawNodeGroup.node)?.powerUsageSummary),
    structures: Array.isArray(rawNodeGroup.structures)
      ? rawNodeGroup.structures.map(summarizeRawPayloadStructure)
      : [],
  };
}

async function main() {
  runFixtureAssertions();
  runLiveShapedPayloadAssertions();

  const args = parseArgs(process.argv.slice(2));
  if (args.fixtureOnly) {
    console.log(JSON.stringify({ liveFetch: false, fixture: "check-node-live-proof-loss fixture assertions passed" }, null, 2));
    return;
  }

  const { rawPayload, inventory, transport } = await fetchLiveInventory(args);
  const adapted = adaptOperatorInventory(inventory);
  const selectedNodeGroups = selectNodeGroups(adapted, args.nodeObjectId);
  if (selectedNodeGroups.length === 0) {
    throw new Error(args.nodeObjectId
      ? `No adapted node group matched ${args.nodeObjectId}.`
      : "No adapted node groups were available for this wallet.");
  }

  const nodes = selectedNodeGroups.map((group) => {
    const rawNode = findRawNode(inventory, group.node.objectId);
    const lookup = adapted.nodeLookupsByNodeId.get(group.node.objectId) ?? null;
    const viewModel = buildLiveNodeLocalViewModelWithObserved(group, lookup, { preferObservedMembership: true });
    return {
      rawOperatorInventoryPayload: summarizeRawPayloadNode(rawPayload, group.node.objectId),
      ...buildNodeDiagnostic({ rawNode, group, lookup, viewModel }),
    };
  });
  const proofLossFailures = nodes.flatMap((node) => node.proofLoss.failures);

  console.log(JSON.stringify({
    liveFetch: true,
    walletAddress: args.walletAddress,
    requestedNodeObjectId: args.nodeObjectId,
    baseUrl: args.baseUrl,
    origin: args.origin,
    transport,
    rawOperatorInventory: {
      schemaVersion: inventory.schemaVersion,
      operator: inventory.operator,
      source: inventory.source,
      fetchedAt: inventory.fetchedAt,
      partial: inventory.partial,
      warnings: inventory.warnings,
      networkNodeCount: inventory.networkNodes.length,
      unlinkedStructureCount: inventory.unlinkedStructures.length,
      payloadKeys: rawPayload && typeof rawPayload === "object" ? Object.keys(rawPayload as Record<string, unknown>) : [],
    },
    proofLoss: {
      ok: proofLossFailures.length === 0,
      failureCount: proofLossFailures.length,
      failures: proofLossFailures,
    },
    nodes,
  }, null, 2));

  if (proofLossFailures.length > 0) {
    throw new Error(`selected-node proof was lost for ${proofLossFailures.length} display row(s)`);
  }
}

await main();
