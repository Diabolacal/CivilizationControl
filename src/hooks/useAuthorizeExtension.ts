import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import {
  WORLD_PACKAGE_ID,
  CC_PACKAGE_ID,
  CC_ORIGINAL_PACKAGE_ID,
  CHARACTER_ID,
  GATE_ID,
  GATE_OWNER_CAP_ID,
  SSU_ID,
  SSU_OWNER_CAP_ID,
} from "../constants";
import type { TurretSwitchTarget, GateAuthTarget, SsuAuthTarget } from "@/types/domain";

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
        typeArguments: [`${CC_ORIGINAL_PACKAGE_ID}::gate_control::GateAuth`],
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

  const authorizeGates = useCallback(
    async (targets: GateAuthTarget[]) => {
      if (targets.length === 0) return;
      setGateStatus("pending");
      setGateError(null);
      try {
        const tx = new Transaction();
        const gateType = `${WORLD_PACKAGE_ID}::gate::Gate`;
        const gateAuthType = `${CC_ORIGINAL_PACKAGE_ID}::gate_control::GateAuth`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [gateType],
            arguments: [tx.object(CHARACTER_ID), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::gate::authorize_extension`,
            typeArguments: [gateAuthType],
            arguments: [tx.object(target.gateId), ownerCap],
          });

          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [gateType],
            arguments: [tx.object(CHARACTER_ID), ownerCap, receipt],
          });
        }

        const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
        if (!txData || result.$kind === "FailedTransaction") {
          throw new Error("Gate authorization transaction failed on-chain");
        }
        setGateResult({ digest: txData.digest });
        setGateStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setGateError(message);
        setGateStatus("error");
      }
    },
    [dAppKit],
  );

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
        typeArguments: [`${CC_ORIGINAL_PACKAGE_ID}::trade_post::TradeAuth`],
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

  const authorizeSsus = useCallback(
    async (targets: SsuAuthTarget[]) => {
      if (targets.length === 0) return;
      setSsuStatus("pending");
      setSsuError(null);
      try {
        const tx = new Transaction();
        const ssuType = `${WORLD_PACKAGE_ID}::storage_unit::StorageUnit`;
        const tradeAuthType = `${CC_ORIGINAL_PACKAGE_ID}::trade_post::TradeAuth`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [ssuType],
            arguments: [tx.object(CHARACTER_ID), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::storage_unit::authorize_extension`,
            typeArguments: [tradeAuthType],
            arguments: [tx.object(target.ssuId), ownerCap],
          });

          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [ssuType],
            arguments: [tx.object(CHARACTER_ID), ownerCap, receipt],
          });
        }

        const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
        if (!txData || result.$kind === "FailedTransaction") {
          throw new Error("SSU authorization transaction failed on-chain");
        }
        setSsuResult({ digest: txData.digest });
        setSsuStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setSsuError(message);
        setSsuStatus("error");
      }
    },
    [dAppKit],
  );

  // ── Turret BouncerAuth batch authorization ──
  const [turretStatus, setTurretStatus] = useState<AuthStatus>("idle");
  const [turretResult, setTurretResult] = useState<AuthResult | null>(null);
  const [turretError, setTurretError] = useState<string | null>(null);

  const authorizeTurrets = useCallback(
    async (targets: TurretSwitchTarget[]) => {
      if (targets.length === 0) return;
      setTurretStatus("pending");
      setTurretError(null);
      try {
        const tx = new Transaction();
        const turretType = `${WORLD_PACKAGE_ID}::turret::Turret`;
        // BouncerAuth introduced in v2 — type origin is CC_PACKAGE_ID
        const bouncerAuthType = `${CC_PACKAGE_ID}::turret_bouncer::BouncerAuth`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [turretType],
            arguments: [tx.object(CHARACTER_ID), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::turret::authorize_extension`,
            typeArguments: [bouncerAuthType],
            arguments: [tx.object(target.turretId), ownerCap],
          });

          tx.moveCall({
            target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [turretType],
            arguments: [tx.object(CHARACTER_ID), ownerCap, receipt],
          });
        }

        const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        const txData =
          result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
        if (!txData || result.$kind === "FailedTransaction") {
          throw new Error("Turret authorization transaction failed on-chain");
        }
        setTurretResult({ digest: txData.digest });
        setTurretStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setTurretError(message);
        setTurretStatus("error");
      }
    },
    [dAppKit],
  );

  return {
    authorizeGate,
    authorizeGates,
    gateStatus,
    gateResult,
    gateError,
    resetGate: useCallback(() => {
      setGateStatus("idle");
      setGateResult(null);
      setGateError(null);
    }, []),
    authorizeSsu,
    authorizeSsus,
    ssuStatus,
    ssuResult,
    ssuError,
    resetSsu: useCallback(() => {
      setSsuStatus("idle");
      setSsuResult(null);
      setSsuError(null);
    }, []),
    authorizeTurrets,
    turretStatus,
    turretResult,
    turretError,
    resetTurret: useCallback(() => {
      setTurretStatus("idle");
      setTurretResult(null);
      setTurretError(null);
    }, []),
  };
}
