import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import {
  WORLD_PACKAGE_ID,
  CC_PACKAGE_ID,
  CHARACTER_ID,
  GATE_ID,
  GATE_OWNER_CAP_ID,
  SSU_ID,
  SSU_OWNER_CAP_ID,
} from "../constants";

interface AuthResult {
  digest: string;
}

type AuthStatus = "idle" | "pending" | "success" | "error";

export function useAuthorizeExtension() {
  const dAppKit = useDAppKit();

  const [gateStatus, setGateStatus] = useState<AuthStatus>("idle");
  const [gateResult, setGateResult] = useState<AuthResult | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  const [ssuStatus, setSsuStatus] = useState<AuthStatus>("idle");
  const [ssuResult, setSsuResult] = useState<AuthResult | null>(null);
  const [ssuError, setSsuError] = useState<string | null>(null);

  const authorizeGate = useCallback(async () => {
    setGateStatus("pending");
    setGateError(null);
    try {
      const tx = new Transaction();

      // 1. Borrow Gate OwnerCap from Character
      // tx.object() auto-resolves to Receiving when the Move param is Receiving<T>
      const [ownerCap, receipt] = tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
        typeArguments: [`${WORLD_PACKAGE_ID}::gate::Gate`],
        arguments: [tx.object(CHARACTER_ID), tx.object(GATE_OWNER_CAP_ID)],
      });

      // 2. Authorize GateAuth extension on the gate
      tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::gate::authorize_extension`,
        typeArguments: [`${CC_PACKAGE_ID}::gate_control::GateAuth`],
        arguments: [tx.object(GATE_ID), ownerCap],
      });

      // 3. Return OwnerCap (consume hot-potato receipt)
      tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
        typeArguments: [`${WORLD_PACKAGE_ID}::gate::Gate`],
        arguments: [tx.object(CHARACTER_ID), ownerCap, receipt],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      const txData = result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
      if (!txData || result.$kind === "FailedTransaction") {
        throw new Error("Transaction failed on-chain");
      }
      setGateResult({ digest: txData.digest });
      setGateStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setGateError(message);
      setGateStatus("error");
    }
  }, [dAppKit]);

  const authorizeSsu = useCallback(async () => {
    setSsuStatus("pending");
    setSsuError(null);
    try {
      const tx = new Transaction();

      // 1. Borrow SSU OwnerCap from Character
      const [ownerCap, receipt] = tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
        typeArguments: [`${WORLD_PACKAGE_ID}::storage_unit::StorageUnit`],
        arguments: [tx.object(CHARACTER_ID), tx.object(SSU_OWNER_CAP_ID)],
      });

      // 2. Authorize TradeAuth extension on the SSU
      tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::storage_unit::authorize_extension`,
        typeArguments: [`${CC_PACKAGE_ID}::trade_post::TradeAuth`],
        arguments: [tx.object(SSU_ID), ownerCap],
      });

      // 3. Return OwnerCap (consume hot-potato receipt)
      tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
        typeArguments: [`${WORLD_PACKAGE_ID}::storage_unit::StorageUnit`],
        arguments: [tx.object(CHARACTER_ID), ownerCap, receipt],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      const txData = result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
      if (!txData || result.$kind === "FailedTransaction") {
        throw new Error("Transaction failed on-chain");
      }
      setSsuResult({ digest: txData.digest });
      setSsuStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSsuError(message);
      setSsuStatus("error");
    }
  }, [dAppKit]);

  return {
    authorizeGate,
    gateStatus,
    gateResult,
    gateError,
    authorizeSsu,
    ssuStatus,
    ssuResult,
    ssuError,
  };
}
