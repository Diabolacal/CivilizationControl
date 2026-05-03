import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import { DEFAULT_SUI_RPC_URL } from "@/constants";

export type SuiRpcFailureKind =
  | "cors"
  | "rate-limit"
  | "timeout"
  | "network"
  | "http"
  | "other";

export interface SuiRpcFailure {
  kind: SuiRpcFailureKind;
  message: string;
  statusCode: number | null;
  retryable: boolean;
}

export class SuiReadError extends Error {
  readonly label: string;
  readonly failure: SuiRpcFailure;
  readonly cause: unknown;

  constructor(label: string, failure: SuiRpcFailure, cause: unknown) {
    super(failure.message);
    this.name = "SuiReadError";
    this.label = label;
    this.failure = failure;
    this.cause = cause;
  }
}

const MAX_READ_ATTEMPTS = 2;
const TRANSIENT_RETRY_DELAY_MS = 1_250;
const RATE_LIMIT_RETRY_DELAY_MS = 3_000;

let clientInstance: SuiJsonRpcClient | null = null;
let clientRpcUrl: string | null = null;
let loggedRpcUrl: string | null = null;

function isPreviewOrLocalHost(hostname: string): boolean {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname.endsWith(".pages.dev");
}

export function isSuiDiagnosticsEnabled(): boolean {
  if (typeof window === "undefined") {
    return import.meta.env.DEV;
  }

  return import.meta.env.DEV || isPreviewOrLocalHost(window.location.hostname);
}

export function isVerboseDiscoveryDebugEnabled(): boolean {
  if (!isSuiDiagnosticsEnabled() || typeof window === "undefined") {
    return false;
  }

  const value = new URLSearchParams(window.location.search).get("debugDiscovery");
  if (value == null) {
    return false;
  }

  return value !== "0" && value.toLowerCase() !== "false";
}

export function getConfiguredSuiRpcUrl(): string {
  const envValue = import.meta.env.VITE_SUI_RPC_URL;
  if (typeof envValue === "string" && envValue.trim().length > 0) {
    return envValue.trim();
  }

  return DEFAULT_SUI_RPC_URL;
}

function logSelectedRpcUrl(url: string) {
  if (!isSuiDiagnosticsEnabled() || loggedRpcUrl === url) {
    return;
  }

  console.info("[sui-rpc] read endpoint", url);
  loggedRpcUrl = url;
}

export function getSuiClient(): SuiJsonRpcClient {
  const rpcUrl = getConfiguredSuiRpcUrl();

  if (!clientInstance || clientRpcUrl !== rpcUrl) {
    clientInstance = new SuiJsonRpcClient({ url: rpcUrl, network: "testnet" });
    clientRpcUrl = rpcUrl;
    logSelectedRpcUrl(rpcUrl);
  }

  return clientInstance;
}

function extractStatusCode(message: string): number | null {
  const explicitMatch = message.match(/\b(?:status(?: code)?|http)\s*[:=]?\s*(\d{3})\b/i);
  if (explicitMatch) {
    return Number(explicitMatch[1]);
  }

  const namedMatch = message.match(/\b(403|404|429|500|502|503|504)\b/);
  if (
    namedMatch
    && /too many requests|forbidden|not found|internal server error|bad gateway|service unavailable|gateway timeout/i.test(message)
  ) {
    return Number(namedMatch[1]);
  }

  return null;
}

export function classifySuiRpcError(error: unknown): SuiRpcFailure {
  if (error instanceof SuiReadError) {
    return error.failure;
  }

  const message = error instanceof Error ? error.message : String(error ?? "Unknown Sui read error");
  const normalized = message.toLowerCase();
  const statusCode = extractStatusCode(message);

  if (
    normalized.includes("too many requests")
    || normalized.includes("rate limit")
    || statusCode === 429
  ) {
    return { kind: "rate-limit", message, statusCode: 429, retryable: true };
  }

  if (
    normalized.includes("cors")
    || normalized.includes("cross-origin")
    || normalized.includes("access-control-allow-origin")
    || normalized.includes("failed to fetch")
    || normalized.includes("load failed")
    || normalized.includes("networkerror when attempting to fetch resource")
  ) {
    return { kind: "cors", message, statusCode, retryable: false };
  }

  if (
    normalized.includes("timeout")
    || normalized.includes("timed out")
    || normalized.includes("aborted")
  ) {
    return { kind: "timeout", message, statusCode, retryable: true };
  }

  if (statusCode != null) {
    if (statusCode >= 500) {
      return { kind: "http", message, statusCode, retryable: true };
    }

    if (statusCode >= 400) {
      return { kind: "http", message, statusCode, retryable: false };
    }
  }

  if (
    normalized.includes("network")
    || normalized.includes("socket")
    || normalized.includes("connection")
    || normalized.includes("fetch")
  ) {
    return { kind: "network", message, statusCode, retryable: true };
  }

  return { kind: "other", message, statusCode, retryable: false };
}

function getRetryDelayMs(failure: SuiRpcFailure, attempt: number): number {
  if (failure.kind === "rate-limit") {
    return RATE_LIMIT_RETRY_DELAY_MS * attempt;
  }

  if (failure.kind === "timeout" || failure.kind === "network" || failure.kind === "http") {
    return TRANSIENT_RETRY_DELAY_MS * attempt;
  }

  return 0;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function callSuiRead<T>(
  label: string,
  execute: (client: SuiJsonRpcClient) => Promise<T>,
): Promise<T> {
  let attempt = 0;

  while (attempt < MAX_READ_ATTEMPTS) {
    attempt += 1;

    try {
      return await execute(getSuiClient());
    } catch (error) {
      const failure = classifySuiRpcError(error);
      const canRetry = failure.retryable && attempt < MAX_READ_ATTEMPTS;

      if (!canRetry) {
        throw new SuiReadError(label, failure, error);
      }

      const delayMs = getRetryDelayMs(failure, attempt);
      if (isSuiDiagnosticsEnabled()) {
        console.warn(`[sui-rpc] ${label} retry scheduled`, {
          attempt,
          maxAttempts: MAX_READ_ATTEMPTS,
          delayMs,
          kind: failure.kind,
          statusCode: failure.statusCode,
        });
      }

      if (delayMs > 0) {
        await wait(delayMs);
      }
    }
  }

  throw new SuiReadError(label, classifySuiRpcError("Unknown Sui read failure"), null);
}

export function formatSuiRpcFailureCounts(
  counts: Partial<Record<SuiRpcFailureKind, number>>,
): string {
  return (Object.entries(counts) as Array<[SuiRpcFailureKind, number | undefined]>)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([kind, count]) => `${kind}:${count}`)
    .join(", ");
}

export function getSuiDiscoveryErrorMessage(error: unknown): string {
  const failure = classifySuiRpcError(error);

  switch (failure.kind) {
    case "rate-limit":
      return "Public Sui RPC is rate limited right now. Discovery is paused until you retry or another action refreshes chain state.";
    case "cors":
      return "Browser access to the configured Sui RPC is blocked. Discovery cannot continue until the endpoint allows browser reads.";
    case "timeout":
      return "Sui RPC timed out while discovering structures. Retry once chain reads settle.";
    case "network":
    case "http":
      return "Sui RPC is temporarily unavailable. Cached or partial structure data may remain visible while reads recover.";
    default:
      return "Structure discovery could not complete. Retry once chain reads stabilize.";
  }
}