/**
 * Sponsor service client — sends TransactionKind bytes to a sponsor
 * worker and receives a full sponsored transaction with gas payment.
 *
 * Env vars (via Vite):
 *   VITE_SPONSOR_URL     — sponsor worker endpoint (required to enable sponsorship)
 *   VITE_SPONSOR_API_KEY — bearer token (optional; worker skips auth when no key is configured)
 *
 * When VITE_SPONSOR_URL is set, `isSponsorshipConfigured()` returns true and
 * governance transactions are routed through the sponsor path.
 */

const SPONSOR_URL = import.meta.env.VITE_SPONSOR_URL as string | undefined;
const SPONSOR_API_KEY = import.meta.env.VITE_SPONSOR_API_KEY as string | undefined;

export function isSponsorshipConfigured(): boolean {
  return !!SPONSOR_URL;
}

export interface SponsorResponse {
  /** Full sponsored transaction bytes (base64), ready for player signing. */
  txB64: string;
  /** Sponsor's signature over the transaction (base64). */
  sponsorSignature: string;
}

/**
 * Request gas sponsorship from the sponsor worker.
 *
 * @param txKindB64 - base64-encoded TransactionKind bytes (no gas/sender)
 * @param senderAddress - player's Sui address
 * @returns sponsored transaction bytes + sponsor signature
 */
export async function requestSponsorship(
  txKindB64: string,
  senderAddress: string,
): Promise<SponsorResponse> {
  if (!SPONSOR_URL) {
    throw new Error("Sponsorship not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SPONSOR_API_KEY) {
    headers["Authorization"] = `Bearer ${SPONSOR_API_KEY}`;
  }

  // Worker expects POST /sponsor
  const url = SPONSOR_URL.replace(/\/+$/, "") + "/sponsor";
  console.info(`[sponsor] POST ${url} (sender=${senderAddress.slice(0, 10)}…, kind=${txKindB64.length} chars)`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      txKindB64,
      sender: senderAddress,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sponsor request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.info(`[sponsor] Response OK: txB64=${data.txB64?.length ?? 0} chars`);
  return { txB64: data.txB64, sponsorSignature: data.sponsorSignature };
}
