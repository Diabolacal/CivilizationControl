/**
 * CivilizationControl gas sponsor service (Cloudflare Worker).
 *
 * Implements Sui-native dual-signature gas sponsorship for current
 * CivilizationControl governance PTBs. The player signs TransactionKind;
 * this service adds sponsor gas payment and co-signs the built transaction.
 *
 * Policy is supplied through APP_POLICIES. Current deployment config keeps a
 * single `civilization-control` app entry, but the validation layer remains
 * multi-policy capable so future reuse still rejects cross-app PTBs.
 *
 * API:
 *   POST /sponsor
 *   Body:    { txKindB64: string; sender: string; timestamp?: number }
 *   Returns: { txB64: string; sponsorSignature: string }
 */

import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import {
  auditLog,
  MAX_BODY_BYTES,
  MAX_REQUEST_AGE_MS,
  parseAppPolicies,
  type AppPolicy,
  type AppPolicyConfig,
  validateCommands,
} from './validation';

interface Env {
  SPONSOR_PRIVATE_KEY: string;
  SUI_RPC_URL?: string;
  ALLOWED_ORIGINS?: string;
  GAS_BUDGET?: string;
  SPONSOR_API_KEY?: string;
  APP_POLICIES?: string;
  ALLOWED_ORIGIN_SUFFIXES?: string;
  SPONSOR_ENABLED?: string;
  BLOCKED_SENDERS?: string;
}

interface SponsorRequest {
  txKindB64: string;
  sender: string;
  timestamp?: number;
}

interface SponsorResponse {
  txB64: string;
  sponsorSignature: string;
}

const DEFAULT_RPC = 'https://fullnode.testnet.sui.io:443';
const DEFAULT_GAS_BUDGET = 50_000_000;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://civilizationcontrol.pages.dev',
  'http://localhost:5173',
];
const DEFAULT_ORIGIN_SUFFIXES = ['.civilizationcontrol.pages.dev'];

function getAllowedOrigins(env: Env): string[] {
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map((value) => value.trim());
  }

  return DEFAULT_ALLOWED_ORIGINS;
}

function getOriginSuffixes(env: Env): string[] {
  if (env.ALLOWED_ORIGIN_SUFFIXES) {
    return env.ALLOWED_ORIGIN_SUFFIXES.split(',').map((value) => value.trim());
  }

  return DEFAULT_ORIGIN_SUFFIXES;
}

function isOriginAllowed(origin: string, env: Env): boolean {
  const allowedOrigins = getAllowedOrigins(env);
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') {
      return false;
    }

    return getOriginSuffixes(env).some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const matchedOrigin = origin && isOriginAllowed(origin, env) ? origin : '';

  return {
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function checkAuth(request: Request, env: Env): boolean {
  if (!env.SPONSOR_API_KEY) {
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false;
  }

  return parts[1] === env.SPONSOR_API_KEY;
}

function isSponsorEnabled(env: Env): boolean {
  return env.SPONSOR_ENABLED?.toLowerCase() !== 'false';
}

function isSenderBlocked(sender: string, env: Env): boolean {
  if (!env.BLOCKED_SENDERS) {
    return false;
  }

  const blockedSenders = env.BLOCKED_SENDERS.split(',').map((value) =>
    value.trim().toLowerCase(),
  );

  return blockedSenders.includes(sender.toLowerCase());
}

function loadPolicies(env: Env): AppPolicy[] {
  if (!env.APP_POLICIES) {
    return [];
  }

  try {
    const configs: AppPolicyConfig[] = JSON.parse(env.APP_POLICIES);
    return parseAppPolicies(configs);
  } catch {
    return [];
  }
}

function validateIntent(
  kindBytes: Uint8Array,
  env: Env,
): { valid: boolean; reason?: string; commandKinds?: string[]; matchedApp?: string } {
  const policies = loadPolicies(env);
  if (policies.length === 0) {
    return { valid: false, reason: 'App policies not configured' };
  }

  let transaction: Transaction;
  try {
    transaction = Transaction.fromKind(kindBytes);
  } catch {
    return { valid: false, reason: 'Malformed transaction' };
  }

  const commands = transaction.getData().commands as Array<{
    $kind: string;
    [key: string]: unknown;
  }>;
  const result = validateCommands(commands, policies);

  return {
    ...result,
    commandKinds: Array.isArray(commands)
      ? commands.map((command) => command.$kind)
      : undefined,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/sponsor') {
      return jsonResponse({ error: 'Not Found' }, 404, cors);
    }

    const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    if (!isSponsorEnabled(env)) {
      auditLog({
        event: 'sponsor_rejected',
        timestamp: new Date().toISOString(),
        ip: clientIp,
        sender: '',
        reason: 'Service disabled via SPONSOR_ENABLED=false',
      });

      return jsonResponse(
        { error: 'Sponsor service temporarily disabled' },
        503,
        cors,
      );
    }

    if (!checkAuth(request, env)) {
      auditLog({
        event: 'sponsor_rejected',
        timestamp: new Date().toISOString(),
        ip: clientIp,
        sender: '',
        reason: 'Authentication failed',
      });

      return jsonResponse({ error: 'Unauthorized' }, 401, cors);
    }

    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Request too large' }, 413, cors);
    }

    if (!env.SPONSOR_PRIVATE_KEY) {
      return jsonResponse({ error: 'Sponsor service not configured' }, 503, cors);
    }

    try {
      const body: unknown = await request.json();
      const { txKindB64, sender } = body as SponsorRequest;

      if (!txKindB64 || typeof txKindB64 !== 'string') {
        return jsonResponse({ error: 'Missing or invalid txKindB64' }, 400, cors);
      }

      if (!sender || typeof sender !== 'string' || !sender.startsWith('0x')) {
        return jsonResponse({ error: 'Missing or invalid sender address' }, 400, cors);
      }

      if (isSenderBlocked(sender, env)) {
        auditLog({
          event: 'sponsor_rejected',
          timestamp: new Date().toISOString(),
          ip: clientIp,
          sender,
          reason: 'Sender is blocked',
        });

        return jsonResponse({ error: 'Sponsorship unavailable' }, 403, cors);
      }

      const { timestamp: requestTimestamp } = body as SponsorRequest;
      if (typeof requestTimestamp === 'number') {
        const age = Math.abs(Date.now() - requestTimestamp);
        if (age > MAX_REQUEST_AGE_MS) {
          auditLog({
            event: 'sponsor_rejected',
            timestamp: new Date().toISOString(),
            ip: clientIp,
            sender,
            reason: `Request timestamp too old (${age}ms)`,
          });

          return jsonResponse({ error: 'Request expired — please retry' }, 400, cors);
        }
      }

      const { secretKey } = decodeSuiPrivateKey(env.SPONSOR_PRIVATE_KEY);
      const keypair = Ed25519Keypair.fromSecretKey(secretKey);
      const sponsorAddress = keypair.getPublicKey().toSuiAddress();
      const rpcUrl = env.SUI_RPC_URL || DEFAULT_RPC;
      const client = new SuiJsonRpcClient({ url: rpcUrl, network: 'testnet' });
      const kindBytes = fromBase64(txKindB64);
      const intent = validateIntent(kindBytes, env);

      if (!intent.valid) {
        auditLog({
          event: 'sponsor_rejected',
          timestamp: new Date().toISOString(),
          ip: clientIp,
          sender,
          app: intent.matchedApp,
          commandKinds: intent.commandKinds,
          reason: intent.reason,
        });

        return jsonResponse(
          { error: 'Transaction not eligible for sponsorship' },
          403,
          cors,
        );
      }

      const transaction = Transaction.fromKind(kindBytes);
      transaction.setSender(sender);
      transaction.setGasOwner(sponsorAddress);

      const parsedBudget = env.GAS_BUDGET ? parseInt(env.GAS_BUDGET, 10) : Number.NaN;
      const gasBudget = Number.isNaN(parsedBudget)
        ? DEFAULT_GAS_BUDGET
        : parsedBudget;
      transaction.setGasBudget(gasBudget);

      const txBytes = await transaction.build({ client });
      const { signature: sponsorSignature } = await keypair.signTransaction(txBytes);
      const response: SponsorResponse = {
        txB64: toBase64(txBytes),
        sponsorSignature,
      };

      auditLog({
        event: 'sponsor_approved',
        timestamp: new Date().toISOString(),
        ip: clientIp,
        sender,
        app: intent.matchedApp,
        commandKinds: intent.commandKinds,
      });

      return jsonResponse(response, 200, cors);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[civilizationcontrol-sponsor] Error:', message);
      auditLog({
        event: 'sponsor_error',
        timestamp: new Date().toISOString(),
        ip: clientIp,
        sender: '',
        reason: message,
      });

      return jsonResponse(
        { error: 'Sponsorship failed. Please try again.' },
        500,
        cors,
      );
    }
  },
} satisfies ExportedHandler<Env>;