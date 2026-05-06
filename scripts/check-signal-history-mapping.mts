import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SignalEventRow } from "../src/components/SignalEventRow";
import {
  buildSignalHistoryUrl,
  fetchSignalHistory,
  normalizeSignalHistoryWalletAddress,
} from "../src/lib/signalHistoryClient";

const WALLET_ADDRESS = "0xabc";
const STRUCTURE_ID = "0x101";
const NETWORK_NODE_ID = "0x202";
const OWNER_CAP_ID = "0x303";
const TX_DIGEST_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TX_DIGEST_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TX_DIGEST_C = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const TX_DIGEST_D = "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
const TX_DIGEST_E = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const TX_DIGEST_F = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const TX_DIGEST_G = "0x1111111111111111111111111111111111111111111111111111111111111111";
const TX_DIGEST_H = "0x2222222222222222222222222222222222222222222222222222222222222222";

const expectedWalletAddress = normalizeSignalHistoryWalletAddress(WALLET_ADDRESS)!;
const expectedStructureId = normalizeSignalHistoryWalletAddress(STRUCTURE_ID)!;
const expectedNetworkNodeId = normalizeSignalHistoryWalletAddress(NETWORK_NODE_ID)!;
const expectedOwnerCapId = normalizeSignalHistoryWalletAddress(OWNER_CAP_ID)!;
const treasuryAddress = "0x999900000000000000000000000000000000000000000000000000000000abcd";
const queryClient = new QueryClient();

const samplePayload = {
  schemaVersion: "signal-history.v1",
  source: "shared-frontier-backend",
  fetchedAt: "2026-05-04T12:00:00.000Z",
  partial: true,
  warnings: ["lagging_recent_checkpoint_window"],
  operator: {
    walletAddress: expectedWalletAddress,
    characterId: null,
    characterName: "Operator Prime",
    tribeId: 77,
    tribeName: "Stillness Vanguard",
  },
  signals: [
    {
      id: "signal-1",
      timestamp: "2026-05-04T11:55:00.000Z",
      category: "governance",
      kind: "structure_renamed",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: "9103",
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_A,
      checkpoint: 4321,
      actorCharacterId: null,
      amount: null,
      metadata: {
        structureType: "turret",
        oldName: "Outer Ring",
        name: "Outer Bastion",
      },
    },
    {
      id: "signal-2",
      timestamp: "2026-05-04T11:50:00.000Z",
      category: "governance",
      kind: "extension_authorized",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: "9102",
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_B,
      checkpoint: 4320,
      actorCharacterId: null,
      amount: null,
      metadata: {
        structureType: "gate",
        previousExtension: "civilization_control::gate_control::GateControlV1",
        extensionType: "civilization_control::gate_control::GateControlV2",
        authorizationMode: "defense",
      },
    },
    {
      id: "signal-3",
      timestamp: "2026-05-04T11:45:00.000Z",
      category: "governance",
      kind: "posture_changed",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_C,
      checkpoint: 4319,
      actorCharacterId: null,
      amount: null,
      metadata: {
        oldMode: "commercial",
        newMode: "defense",
      },
    },
    {
      id: "signal-4",
      timestamp: "2026-05-04T11:40:00.000Z",
      category: "governance",
      kind: "gate_policy_preset_changed",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_D,
      checkpoint: 4318,
      actorCharacterId: null,
      amount: null,
      metadata: {
        operation: "set",
        mode: "commercial",
        entryCount: 2,
        defaultAccess: "allowlist",
        defaultToll: 25000000,
      },
    },
    {
      id: "signal-5",
      timestamp: "2026-05-04T11:35:00.000Z",
      category: "governance",
      kind: "gate_treasury_changed",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_E,
      checkpoint: 4317,
      actorCharacterId: null,
      amount: null,
      metadata: {
        treasuryAddress,
      },
    },
    {
      id: "signal-6",
      timestamp: "2026-05-04T11:30:00.000Z",
      category: "transit",
      kind: "permit_issued",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_F,
      checkpoint: 4316,
      actorCharacterId: expectedOwnerCapId,
      amount: null,
      metadata: {
        tribeId: 77,
        mode: "commercial",
      },
    },
    {
      id: "signal-7",
      timestamp: "2026-05-04T11:25:00.000Z",
      category: "transit",
      kind: "toll_paid",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_G,
      checkpoint: 4315,
      actorCharacterId: null,
      amount: "42000000",
      metadata: {
        tollAmount: 42000000,
      },
    },
    {
      id: "signal-8",
      timestamp: "2026-05-04T11:20:00.000Z",
      category: "governance",
      kind: "custom_future_signal",
      title: null,
      summary: null,
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_H,
      checkpoint: 4314,
      actorCharacterId: null,
      amount: null,
      metadata: {
        status: "offline",
      },
    },
  ],
  nextCursor: "cursor-2",
} as const;

const capturedRequests: string[] = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  capturedRequests.push(url);
  assert.equal(init?.method, "GET");

  return new Response(JSON.stringify(samplePayload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  const result = await fetchSignalHistory({
    walletAddress: WALLET_ADDRESS,
    limit: 999,
    categories: ["governance", "transit", "transit"],
    cursor: " cursor-1 ",
    networkNodeId: NETWORK_NODE_ID,
    structureId: STRUCTURE_ID,
    since: "2026-05-04T11:00:00Z",
  }, {
    baseUrl: "https://ef-map.com",
  });

  assert.equal(capturedRequests.length, 1);

  const requestUrl = new URL(capturedRequests[0]);
  assert.equal(requestUrl.origin, "https://ef-map.com");
  assert.equal(requestUrl.pathname, "/api/civilization-control/signal-history");
  assert.equal(requestUrl.searchParams.get("walletAddress"), expectedWalletAddress);
  assert.equal(requestUrl.searchParams.get("limit"), "100");
  assert.equal(requestUrl.searchParams.get("categories"), "governance,transit");
  assert.equal(requestUrl.searchParams.get("cursor"), "cursor-1");
  assert.equal(requestUrl.searchParams.get("networkNodeId"), expectedNetworkNodeId);
  assert.equal(requestUrl.searchParams.get("structureId"), expectedStructureId);
  assert.equal(requestUrl.searchParams.get("since"), "2026-05-04T11:00:00.000Z");

  assert.equal(result.schemaVersion, "signal-history.v1");
  assert.equal(result.partial, true);
  assert.deepEqual(result.warnings, ["lagging_recent_checkpoint_window"]);
  assert.equal(result.nextCursor, "cursor-2");
  assert.equal(result.operator?.walletAddress, expectedWalletAddress);
  assert.equal(result.signals.length, 8);

  const renamedSignal = result.signals[0];
  assert.equal(renamedSignal.category, "governance");
  assert.equal(renamedSignal.kind, "structure_renamed");
  assert.equal(renamedSignal.label, "Structure renamed");
  assert.equal(renamedSignal.description, "Turret renamed from Outer Ring to Outer Bastion.");
  assert.equal(renamedSignal.relatedObjectId, expectedStructureId);
  assert.equal(renamedSignal.secondaryObjectId, expectedNetworkNodeId);
  assert.equal(renamedSignal.assemblyId, "9103");
  assert.equal(renamedSignal.txDigest, TX_DIGEST_A);
  assert.equal(renamedSignal.eventSeq, "4321");
  assert.equal(renamedSignal.metadata?.oldName, "Outer Ring");

  const extensionSignal = result.signals[1];
  assert.equal(extensionSignal.kind, "extension_authorized");
  assert.equal(extensionSignal.label, "Extension reauthorized");
  assert.equal(extensionSignal.description, "Gate extension reauthorized from GateControlV1 to GateControlV2.");

  const postureSignal = result.signals[2];
  assert.equal(postureSignal.label, "Posture changed");
  assert.equal(postureSignal.description, "Posture changed from Commercial to Defense.");

  const policySignal = result.signals[3];
  assert.equal(policySignal.label, "Gate policy preset changed");
  assert.equal(policySignal.description, "Commercial gate policy preset set with 2 entries.");
  assert.equal(policySignal.metadata?.defaultToll, 25000000);

  const treasurySignal = result.signals[4];
  assert.equal(treasurySignal.label, "Gate treasury changed");
  assert.equal(treasurySignal.description, "Gate treasury set to 0x9999…abcd.");

  const permitSignal = result.signals[5];
  assert.equal(permitSignal.label, "Permit issued");
  assert.equal(permitSignal.description, "Permit issued for tribe 77 in Commercial posture.");
  assert.equal(permitSignal.actorCharacterId, expectedOwnerCapId);

  const tollSignal = result.signals[6];
  assert.equal(tollSignal.category, "transit");
  assert.equal(tollSignal.label, "Toll paid");
  assert.equal(tollSignal.description, "Transit toll recorded for a governed gate.");
  assert.equal(tollSignal.variant, "revenue");
  assert.equal(tollSignal.amount, 42000000);

  const renderedTollSignal = renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(SignalEventRow, { signal: tollSignal }),
    ),
  );
  assert(renderedTollSignal.includes("Toll paid"));
  assert(renderedTollSignal.includes("4.2 Lux"));

  const fallbackSignal = result.signals[7];
  assert.equal(fallbackSignal.kind, "custom_future_signal");
  assert.equal(fallbackSignal.label, "Custom Future Signal");
  assert.equal(fallbackSignal.description, "A signal was recorded in your governed infrastructure.");
  assert.equal(fallbackSignal.metadata?.status, "offline");

  const defaultLimitUrl = new URL(buildSignalHistoryUrl({ walletAddress: WALLET_ADDRESS, limit: 0 }, "https://ef-map.com"));
  assert.equal(defaultLimitUrl.searchParams.get("limit"), "50");

  console.log("signal-history mapping probe passed");
} finally {
  queryClient.clear();
  globalThis.fetch = originalFetch;
}
