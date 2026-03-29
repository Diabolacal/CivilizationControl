/**
 * txDetails — Fetch and shape transaction proof data from Sui JSON-RPC.
 *
 * Uses `sui_getTransactionBlock` with showEffects enabled to retrieve
 * status, gas, checkpoint, and timestamp for a given digest.
 */

import { getSuiClient } from "@/lib/suiReader";

export interface TxProofData {
  digest: string;
  status: "success" | "failure";
  error?: string;
  /** ISO-8601 timestamp */
  timestamp: string | null;
  checkpoint: string | null;
  /** Total gas charged in MIST (computation + storage - rebate) */
  gasMist: bigint | null;
  /** Human-readable gas in SUI */
  gasSui: string | null;
  /** e.g. "Programmable Transaction" */
  txKind: string | null;
  /** True when gas owner differs from sender (sponsored tx) */
  sponsored: boolean;
}

const MIST_PER_SUI = 1_000_000_000n;

function formatGas(mist: bigint): string {
  if (mist < 1_000_000n) return `${mist.toString()} MIST`;
  const sui = Number(mist) / Number(MIST_PER_SUI);
  return `${sui.toFixed(6)} SUI`;
}

function extractTxKind(tx: unknown): string | null {
  if (!tx || typeof tx !== "object") return null;
  const block = tx as Record<string, unknown>;
  const data = block.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const txn = data.transaction as Record<string, unknown> | undefined;
  if (!txn) return null;
  const kind = txn.kind as string | undefined;
  if (kind === "ProgrammableTransaction") return "Programmable Transaction";
  return kind ?? null;
}

export async function fetchTxProofData(digest: string): Promise<TxProofData> {
  const client = getSuiClient();
  const resp = await client.getTransactionBlock({
    digest,
    options: {
      showEffects: true,
      showInput: true,
    },
  });

  const effects = resp.effects;
  const status = effects?.status?.status ?? "failure";
  const error = effects?.status?.error;

  let gasMist: bigint | null = null;
  if (effects?.gasUsed) {
    const g = effects.gasUsed;
    gasMist =
      BigInt(g.computationCost) +
      BigInt(g.storageCost) -
      BigInt(g.storageRebate);
    if (gasMist < 0n) gasMist = 0n;
  }

  const txData = resp.transaction?.data as Record<string, unknown> | undefined;
  const sender = txData?.sender as string | undefined;
  const gasData = txData?.gasData as Record<string, unknown> | undefined;
  const gasOwner = gasData?.owner as string | undefined;
  const sponsored = !!(sender && gasOwner && sender !== gasOwner);

  return {
    digest: resp.digest,
    status,
    error,
    timestamp: resp.timestampMs
      ? new Date(Number(resp.timestampMs)).toISOString()
      : null,
    checkpoint: resp.checkpoint ?? null,
    gasMist,
    gasSui: gasMist != null ? formatGas(gasMist) : null,
    txKind: extractTxKind(resp.transaction),
    sponsored,
  };
}
