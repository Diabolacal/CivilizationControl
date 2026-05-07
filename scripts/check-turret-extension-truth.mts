import assert from "node:assert/strict";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { DEFAULT_SUI_RPC_URL } from "../src/constants.ts";
import { isExtensionAuthorizationAttentionStatus } from "../src/lib/extensionStatus.ts";
import { adaptOperatorInventory } from "../src/lib/operatorInventoryAdapter.ts";
import { buildLiveNodeLocalViewModelWithObserved, describeNodeLocalWarningMarker } from "../src/lib/nodeDrilldownModel.ts";
import {
  applyStructureExtensionStatusOverlayToNodeGroups,
  applyStructureExtensionStatusOverlayToStructures,
  buildStructureExtensionStatusOverlayTargetIds,
} from "../src/lib/structureExtensionStatusOverlay.ts";
import { fetchStructureExtensionStatuses } from "../src/lib/suiReader.ts";
import {
  buildOperatorInventoryUrl,
  normalizeOperatorInventoryResponse,
} from "../src/lib/operatorInventoryClient.ts";
import { normalizeCanonicalObjectId } from "../src/lib/nodeAssembliesClient.ts";

import type { ExtensionStatus, NetworkNodeGroup, Structure } from "../src/types/domain.ts";
import type { OperatorInventoryStructure } from "../src/types/operatorInventory.ts";

const DEFAULT_WALLET_ADDRESS = "0x11dd567e72d160ad7116a7358684dfff800af2a8e429cd1a65778640f8a61f62";
const DEFAULT_BASE_URL = "https://ef-map.com";
const DEFAULT_ORIGIN = "https://civilizationcontrol.com";

interface Args {
  walletAddress: string;
  baseUrl: string;
  origin: string;
  assertAuthorized: boolean;
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
    assertAuthorized: !args.includes("--no-assert-authorized"),
  };
}

function findRawTurretRows(nodeGroups: OperatorInventoryStructure[][]): OperatorInventoryStructure[] {
  return nodeGroups
    .flat()
    .filter((row) => row.family === "turret" || row.assemblyType === "turret");
}

function findStructureById(structures: Structure[], objectId: string | null | undefined): Structure | null {
  const normalizedId = normalizeCanonicalObjectId(objectId);
  if (!normalizedId) {
    return null;
  }

  return structures.find((structure) => normalizeCanonicalObjectId(structure.objectId) === normalizedId) ?? null;
}

function findGroupForStructure(groups: NetworkNodeGroup[], objectId: string | null | undefined): NetworkNodeGroup | null {
  const normalizedId = normalizeCanonicalObjectId(objectId);
  if (!normalizedId) {
    return null;
  }

  return groups.find((group) => (
    group.turrets.some((turret) => normalizeCanonicalObjectId(turret.objectId) === normalizedId)
  )) ?? null;
}

function formatExpectedTurretAuthTypes(): string[] {
  return [
    "902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021::turret::CommercialAuth",
    "902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021::turret::DefenseAuth",
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const response = await fetch(buildOperatorInventoryUrl(args.walletAddress, args.baseUrl), {
    headers: { Accept: "application/json", Origin: args.origin },
  });
  if (!response.ok) {
    throw new Error(`operator-inventory fetch failed: ${response.status} ${response.statusText}`);
  }

  const rawPayload = await response.json();
  const inventory = normalizeOperatorInventoryResponse(rawPayload);
  assert(inventory, "operator-inventory payload must normalize");

  const rawTurrets = findRawTurretRows(inventory.networkNodes.map((node) => node.structures));
  assert(rawTurrets.length > 0, "operator-inventory must include turret rows");

  const adapted = adaptOperatorInventory(inventory);
  const overlayTargetIds = buildStructureExtensionStatusOverlayTargetIds(adapted.structures);
  const directOverlay = await fetchStructureExtensionStatuses(overlayTargetIds);
  const suiClient = new SuiJsonRpcClient({ url: DEFAULT_SUI_RPC_URL, network: "testnet" });
  const rawChainResponses = await suiClient.multiGetObjects({
    ids: overlayTargetIds,
    options: { showContent: true, showType: true },
  });
  const rawChainProofs = new Map(rawChainResponses.map((response, index) => {
    const requestedId = overlayTargetIds[index] ?? "";
    const content = response.data?.content?.dataType === "moveObject"
      ? response.data.content.fields as Record<string, unknown>
      : null;
    const extension = content?.extension as { fields?: { name?: string } } | null | undefined;
    return [normalizeCanonicalObjectId(response.data?.objectId ?? requestedId) ?? requestedId, {
      objectType: response.data?.type ?? null,
      extensionType: extension?.fields?.name ?? null,
    }];
  }));
  const overlayStructures = applyStructureExtensionStatusOverlayToStructures(adapted.structures, directOverlay);
  const overlayNodeGroups = applyStructureExtensionStatusOverlayToNodeGroups(adapted.nodeGroups, directOverlay);

  const traces = rawTurrets.map((raw) => {
    const adaptedStructure = findStructureById(adapted.structures, raw.objectId);
    const finalStructure = findStructureById(overlayStructures, raw.objectId);
    const rawGroup = findGroupForStructure(adapted.nodeGroups, raw.objectId);
    const finalGroup = findGroupForStructure(overlayNodeGroups, raw.objectId);
    const rawNodeViewModel = rawGroup ? buildLiveNodeLocalViewModelWithObserved(rawGroup) : null;
    const finalNodeViewModel = finalGroup ? buildLiveNodeLocalViewModelWithObserved(finalGroup) : null;
    const rawNodeRow = rawNodeViewModel?.structures.find((row) => normalizeCanonicalObjectId(row.objectId) === normalizeCanonicalObjectId(raw.objectId)) ?? null;
    const finalNodeRow = finalNodeViewModel?.structures.find((row) => normalizeCanonicalObjectId(row.objectId) === normalizeCanonicalObjectId(raw.objectId)) ?? null;
    const normalizedObjectId = normalizeCanonicalObjectId(raw.objectId) ?? "";
    const directStatus = directOverlay.get(normalizedObjectId) ?? "unknown";
    const rawChainProof = rawChainProofs.get(normalizedObjectId) ?? null;

    return {
      objectId: raw.objectId,
      displayName: raw.displayName ?? raw.name,
      expectedExtensionAuthTypes: formatExpectedTurretAuthTypes(),
      indexedExtensionStatus: raw.extensionStatus,
      normalizedExtensionStatusBeforeOverlay: adaptedStructure?.extensionStatus ?? null,
      directChainExtensionStatus: directStatus,
      directChainObjectType: rawChainProof?.objectType ?? null,
      directChainExtensionType: rawChainProof?.extensionType ?? null,
      finalExtensionStatus: finalStructure?.extensionStatus ?? null,
      legacyUiWarningStateBeforeFix: raw.extensionStatus === "authorized"
        ? null
        : "Extension authorization needs attention.",
      currentUiWarningStateBeforeOverlay: rawNodeRow ? describeNodeLocalWarningMarker(rawNodeRow) : null,
      finalUiWarningState: finalNodeRow ? describeNodeLocalWarningMarker(finalNodeRow) : null,
      finalWarningPip: finalNodeRow?.warningPip ?? null,
      finalDecision: finalNodeRow && isExtensionAuthorizationAttentionStatus(finalNodeRow.extensionStatus)
        ? "extension_attention"
        : finalNodeRow?.extensionStatus === "authorized"
          ? "extension_clear"
          : "extension_unverified",
    };
  });

  console.log(JSON.stringify({
    walletAddress: args.walletAddress,
    baseUrl: args.baseUrl,
    origin: args.origin,
    rpcUrl: DEFAULT_SUI_RPC_URL,
    transport: {
      operatorInventoryStatus: response.status,
      accessControlAllowOrigin: response.headers.get("access-control-allow-origin"),
    },
    traceCount: traces.length,
    traces,
  }, null, 2));

  if (args.assertAuthorized) {
    const directAuthorized = traces.filter((trace) => trace.directChainExtensionStatus === "authorized");
    assert(directAuthorized.length > 0, "expected at least one direct-chain authorized turret");
    for (const trace of directAuthorized) {
      assert.equal(trace.finalExtensionStatus as ExtensionStatus, "authorized");
      assert.equal(trace.finalUiWarningState, null);
      assert.equal(trace.finalDecision, "extension_clear");
    }
  }
}

await main();
