/**
 * useSponsoredExecution — Transparent sponsored transaction hook.
 *
 * Returns an `executeTx(tx)` function that:
 *   1. If sponsorship is configured, builds the TransactionKind,
 *      requests gas sponsorship, has the player sign the sponsored TX,
 *      and submits with dual signatures.
 *   2. If sponsorship is not configured (or the sponsor endpoint is
 *      unreachable), falls back to standard signAndExecuteTransaction.
 *
 * All governance hooks call `executeTx(tx)` instead of
 * `dAppKit.signAndExecuteTransaction({ transaction: tx })`.
 */

import { useCallback } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { getSuiClient } from "@/lib/suiReader";
import {
  isSponsorshipConfigured,
  requestSponsorship,
  type SponsorResponse,
} from "@/lib/sponsorship";

const TAG = "[sponsor]";

/**
 * Hook providing a unified `executeTx` function for governance operations.
 *
 * Usage:
 * ```ts
 * const executeTx = useSponsoredExecution();
 * const { digest } = await executeTx(tx);
 * ```
 */
export function useSponsoredExecution() {
  const dAppKit = useDAppKit();

  const executeTx = useCallback(
    async (tx: Transaction): Promise<{ digest: string }> => {
      const { account } = dAppKit.stores.$connection.get();
      if (!account) throw new Error("No wallet connected");

      if (isSponsorshipConfigured()) {
        try {
          const client = getSuiClient();

          // ── Step 1: Build TransactionKind (commands only, no gas data)
          console.info(`${TAG} Step 1: Building TransactionKind...`);
          tx.setSenderIfNotSet(account.address);
          const kindBytes = await tx.build({ client, onlyTransactionKind: true });
          const kindB64 = toBase64(kindBytes);
          console.info(`${TAG} Step 1 OK: ${kindBytes.length} bytes`);

          // ── Step 2: Request gas sponsorship from worker
          console.info(`${TAG} Step 2: Requesting sponsorship...`);
          const sponsorResult: SponsorResponse = await requestSponsorship(
            kindB64,
            account.address,
          );
          console.info(`${TAG} Step 2 OK: txB64=${sponsorResult.txB64.length} chars`);

          // ── Step 3: Parse sponsored TX and sign with player wallet
          console.info(`${TAG} Step 3: Signing sponsored TX...`);
          const sponsoredTx = Transaction.from(sponsorResult.txB64);
          const { bytes, signature } = await dAppKit.signTransaction({
            transaction: sponsoredTx,
          });
          console.info(`${TAG} Step 3 OK: signed ${bytes.length} chars`);

          // ── Step 4: Execute with dual signatures (player + sponsor)
          console.info(`${TAG} Step 4: Executing with dual signatures...`);
          const result = await client.executeTransactionBlock({
            transactionBlock: bytes,
            signature: [signature, sponsorResult.sponsorSignature],
          });
          console.info(`${TAG} Step 4 OK: digest=${result.digest}`);
          console.info(`${TAG} ✓ Sponsored transaction complete`);

          return { digest: result.digest };
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          console.warn(`${TAG} Sponsor path failed: ${reason}`);
          console.warn(`${TAG} Falling back to standard (player-paid) execution`);
          // Fall through to standard path below
        }
      } else {
        console.info(`${TAG} Sponsorship not configured — using standard execution`);
      }

      // Standard (non-sponsored) execution
      console.info(`${TAG} Executing via wallet signAndExecuteTransaction...`);
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      const txData =
        result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
      if (!txData || result.$kind === "FailedTransaction") {
        throw new Error("Transaction failed on-chain");
      }
      console.info(`${TAG} Standard execution complete: digest=${txData.digest}`);
      return { digest: txData.digest };
    },
    [dAppKit],
  );

  return executeTx;
}
