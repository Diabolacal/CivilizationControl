import assert from "node:assert/strict";

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

const expectedWalletAddress = normalizeSignalHistoryWalletAddress(WALLET_ADDRESS)!;
const expectedStructureId = normalizeSignalHistoryWalletAddress(STRUCTURE_ID)!;
const expectedNetworkNodeId = normalizeSignalHistoryWalletAddress(NETWORK_NODE_ID)!;
const expectedOwnerCapId = normalizeSignalHistoryWalletAddress(OWNER_CAP_ID)!;

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
      kind: "extension_frozen",
      title: "Extension Frozen",
      summary: "A governed extension was frozen.",
      severity: "warning",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: null,
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_A,
      checkpoint: 4321,
      actorCharacterId: null,
      amount: null,
      metadata: null,
    },
    {
      id: "signal-2",
      timestamp: "2026-05-04T11:50:00.000Z",
      category: "trade",
      kind: "storage_deposit",
      title: "Storage Deposit",
      summary: "Inventory moved into governed storage.",
      severity: "info",
      networkNodeId: expectedNetworkNodeId,
      structureId: expectedStructureId,
      assemblyId: "9102",
      ownerCapId: expectedOwnerCapId,
      txDigest: TX_DIGEST_B,
      checkpoint: 4320,
      actorCharacterId: null,
      amount: "42000000",
      metadata: { volume: 42 },
    },
    {
      id: "signal-3",
      timestamp: "2026-05-04T11:45:00.000Z",
      category: "transit",
      kind: "gate_transit",
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
      metadata: null,
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
    categories: ["governance", "trade", "trade"],
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
  assert.equal(requestUrl.searchParams.get("categories"), "governance,trade");
  assert.equal(requestUrl.searchParams.get("cursor"), "cursor-1");
  assert.equal(requestUrl.searchParams.get("networkNodeId"), expectedNetworkNodeId);
  assert.equal(requestUrl.searchParams.get("structureId"), expectedStructureId);
  assert.equal(requestUrl.searchParams.get("since"), "2026-05-04T11:00:00.000Z");

  assert.equal(result.schemaVersion, "signal-history.v1");
  assert.equal(result.partial, true);
  assert.deepEqual(result.warnings, ["lagging_recent_checkpoint_window"]);
  assert.equal(result.nextCursor, "cursor-2");
  assert.equal(result.operator?.walletAddress, expectedWalletAddress);
  assert.equal(result.signals.length, 3);

  const frozenSignal = result.signals[0];
  assert.equal(frozenSignal.category, "governance");
  assert.equal(frozenSignal.variant, "blocked");
  assert.equal(frozenSignal.relatedObjectId, expectedStructureId);
  assert.equal(frozenSignal.secondaryObjectId, expectedNetworkNodeId);
  assert.equal(frozenSignal.txDigest, TX_DIGEST_A);
  assert.equal(frozenSignal.eventSeq, "4321");

  const depositSignal = result.signals[1];
  assert.equal(depositSignal.category, "trade");
  assert.equal(depositSignal.variant, "info");
  assert.equal(depositSignal.amount, 42000000);

  const transitSignal = result.signals[2];
  assert.equal(transitSignal.category, "transit");
  assert.equal(transitSignal.label, "Gate Transit");
  assert.equal(transitSignal.description, "A transit event was recorded through a governed gate.");

  const defaultLimitUrl = new URL(buildSignalHistoryUrl({ walletAddress: WALLET_ADDRESS, limit: 0 }, "https://ef-map.com"));
  assert.equal(defaultLimitUrl.searchParams.get("limit"), "50");

  console.log("signal-history mapping probe passed");
} finally {
  globalThis.fetch = originalFetch;
}