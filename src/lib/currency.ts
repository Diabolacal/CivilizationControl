/**
 * Currency — Centralized denomination and EVE token utilities.
 *
 * Settlement token: EVE (from the assets package).
 * Operator display: Lux (primary), EVE (secondary).
 * Conversion: 100 Lux = 1 EVE.
 *
 * EVE has 9 decimals: 1 EVE = 1,000,000,000 base units (like SUI/MIST).
 * Lux is a governance denomination: 100 Lux = 1 EVE = 1,000,000,000 base units.
 * Therefore 1 Lux = 10,000,000 base units (10^7).
 */

import { getSuiClient } from "@/lib/suiReader";

// ─── EVE Token Constants ─────────────────────────────────

/** Stillness EVE assets package ID (from @evefrontier/dapp-kit TENANT_CONFIG). */
export const EVE_PACKAGE_ID =
  "0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60";

/** Fully qualified EVE coin type for RPC queries. */
export const EVE_COIN_TYPE = `${EVE_PACKAGE_ID}::EVE::EVE`;

// ─── Denomination Constants ──────────────────────────────

/** Number of EVE base units per 1 EVE (10^9). */
export const BASE_UNITS_PER_EVE = 1_000_000_000;

/** Number of Lux per 1 EVE. */
export const LUX_PER_EVE = 100;

/** Number of EVE base units per 1 Lux (10^7). */
export const BASE_UNITS_PER_LUX = BASE_UNITS_PER_EVE / LUX_PER_EVE;

// ─── Conversion Functions ────────────────────────────────

/** Convert EVE base units (on-chain u64) to Lux. */
export function baseUnitsToLux(baseUnits: number): number {
  return baseUnits / BASE_UNITS_PER_LUX;
}

/** Convert Lux to EVE base units (on-chain u64). */
export function luxToBaseUnits(lux: number): number {
  return Math.round(lux * BASE_UNITS_PER_LUX);
}

/** Convert EVE base units to EVE (human-readable). */
export function baseUnitsToEve(baseUnits: number): number {
  return baseUnits / BASE_UNITS_PER_EVE;
}

/** Convert EVE (human-readable) to EVE base units. */
export function eveToBaseUnits(eve: number): number {
  return Math.round(eve * BASE_UNITS_PER_EVE);
}

/** Convert Lux to EVE. */
export function luxToEve(lux: number): number {
  return lux / LUX_PER_EVE;
}

// ─── Display Formatting ──────────────────────────────────

/** Format a base-unit amount as Lux with locale-aware grouping. */
export function formatLux(baseUnits: number): string {
  const lux = baseUnitsToLux(baseUnits);
  return lux.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Format a base-unit amount as EVE with locale-aware grouping. */
export function formatEve(baseUnits: number): string {
  const eve = baseUnitsToEve(baseUnits);
  return eve.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/**
 * Format for display: "X Lux" primary, optional "(Y EVE)" secondary.
 * Use in signal feed, listing cards, toll displays.
 */
export function formatLuxWithEve(baseUnits: number): { lux: string; eve: string } {
  return {
    lux: `${formatLux(baseUnits)} Lux`,
    eve: `${formatEve(baseUnits)} EVE`,
  };
}

// ─── EVE Coin Discovery ──────────────────────────────────

interface CoinObject {
  coinObjectId: string;
  balance: string;
}

/**
 * Fetch all EVE coin objects owned by the given address.
 * Uses suix_getCoins RPC method with pagination.
 */
export async function fetchEveCoinObjects(ownerAddress: string): Promise<CoinObject[]> {
  const client = getSuiClient();
  const coins: CoinObject[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const response = await (client as unknown as { call: (method: string, params: unknown[]) => Promise<{
      data: Array<{ coinObjectId: string; balance: string }>;
      hasNextPage: boolean;
      nextCursor: string | null;
    }> }).call("suix_getCoins", [
      ownerAddress,
      EVE_COIN_TYPE,
      cursor,
      50,
    ]);

    for (const coin of response.data) {
      coins.push({
        coinObjectId: coin.coinObjectId,
        balance: coin.balance,
      });
    }

    hasNext = response.hasNextPage;
    cursor = response.nextCursor;
  }

  return coins;
}

/**
 * Select a suitable EVE coin object for a payment of at least `requiredAmount` base units.
 * Returns the coin object ID to use, or null if insufficient funds.
 *
 * Strategy: find first coin with sufficient balance, or the largest coin
 * for merging via PTB if needed.
 */
export function selectEveCoin(
  coins: CoinObject[],
  requiredAmount: number,
): { coinObjectId: string; balance: bigint } | null {
  if (coins.length === 0) return null;

  // Find first coin with sufficient balance
  for (const coin of coins) {
    const bal = BigInt(coin.balance);
    if (bal >= BigInt(requiredAmount)) {
      return { coinObjectId: coin.coinObjectId, balance: bal };
    }
  }

  // No single coin is sufficient — return the largest for potential merge
  let largest = coins[0];
  for (const coin of coins) {
    if (BigInt(coin.balance) > BigInt(largest.balance)) {
      largest = coin;
    }
  }

  // Check if total across all coins is sufficient
  const total = coins.reduce((sum, c) => sum + BigInt(c.balance), 0n);
  if (total >= BigInt(requiredAmount)) {
    return { coinObjectId: largest.coinObjectId, balance: BigInt(largest.balance) };
  }

  return null;
}
