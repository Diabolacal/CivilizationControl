import { useCallback, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSponsoredExecution } from "@/hooks/useSponsoredExecution";
import {
  CC_PACKAGE_ID,
  CC_ORIGINAL_PACKAGE_ID,
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
} from "../constants";
import { useCharacterId } from "@/hooks/useCharacter";
import type { TurretSwitchTarget, GateAuthTarget, SsuAuthTarget, PostureMode } from "@/types/domain";

interface AuthResult {
  digest: string;
}

type AuthStatus = "idle" | "pending" | "success" | "error";

export function useAuthorizeExtension() {
  const executeTx = useSponsoredExecution();
  const characterId = useCharacterId();

  const [gateStatus, setGateStatus] = useState<AuthStatus>("idle");
  const [gateResult, setGateResult] = useState<AuthResult | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  const [ssuStatus, setSsuStatus] = useState<AuthStatus>("idle");
  const [ssuResult, setSsuResult] = useState<AuthResult | null>(null);
  const [ssuError, setSsuError] = useState<string | null>(null);

  const authorizeGates = useCallback(
    async (targets: GateAuthTarget[], dappBaseUrl?: string) => {
      if (targets.length === 0) return;
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setGateStatus("pending");
      setGateError(null);
      try {
        const tx = new Transaction();
        const gateType = `${WORLD_ORIGINAL_PACKAGE_ID}::gate::Gate`;
        const gateAuthType = `${CC_ORIGINAL_PACKAGE_ID}::gate_control::GateAuth`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [gateType],
            arguments: [tx.object(characterId), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::gate::authorize_extension`,
            typeArguments: [gateAuthType],
            arguments: [tx.object(target.gateId), ownerCap],
          });

          // Set the in-game DApp URL so players see the permit page automatically
          if (dappBaseUrl) {
            tx.moveCall({
              target: `${WORLD_RUNTIME_PACKAGE_ID}::gate::update_metadata_url`,
              arguments: [
                tx.object(target.gateId),
                ownerCap,
                tx.pure.string(`${dappBaseUrl}/gate/${target.gateId}`),
              ],
            });
          }

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [gateType],
            arguments: [tx.object(characterId), ownerCap, receipt],
          });
        }

        const { digest } = await executeTx(tx);
        setGateResult({ digest });
        setGateStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setGateError(message);
        setGateStatus("error");
      }
    },
    [executeTx, characterId],
  );

  const authorizeSsus = useCallback(
    async (targets: SsuAuthTarget[], dappBaseUrl?: string) => {
      if (targets.length === 0) return;
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setSsuStatus("pending");
      setSsuError(null);
      try {
        const tx = new Transaction();
        const ssuType = `${WORLD_ORIGINAL_PACKAGE_ID}::storage_unit::StorageUnit`;
        const tradeAuthType = `${CC_ORIGINAL_PACKAGE_ID}::trade_post::TradeAuth`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [ssuType],
            arguments: [tx.object(characterId), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::storage_unit::authorize_extension`,
            typeArguments: [tradeAuthType],
            arguments: [tx.object(target.ssuId), ownerCap],
          });

          // Set the in-game DApp URL so players see the marketplace automatically
          if (dappBaseUrl) {
            tx.moveCall({
              target: `${WORLD_RUNTIME_PACKAGE_ID}::storage_unit::update_metadata_url`,
              arguments: [
                tx.object(target.ssuId),
                ownerCap,
                tx.pure.string(`${dappBaseUrl}/ssu/${target.ssuId}`),
              ],
            });
          }

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [ssuType],
            arguments: [tx.object(characterId), ownerCap, receipt],
          });
        }

        const { digest } = await executeTx(tx);
        setSsuResult({ digest });
        setSsuStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setSsuError(message);
        setSsuStatus("error");
      }
    },
    [executeTx, characterId],
  );

  const setSsuDappUrl = useCallback(
    async (targets: SsuAuthTarget[], dappBaseUrl: string) => {
      if (targets.length === 0) return;
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setSsuStatus("pending");
      setSsuError(null);
      try {
        const tx = new Transaction();
        const ssuType = `${WORLD_ORIGINAL_PACKAGE_ID}::storage_unit::StorageUnit`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [ssuType],
            arguments: [tx.object(characterId), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::storage_unit::update_metadata_url`,
            arguments: [
              tx.object(target.ssuId),
              ownerCap,
              tx.pure.string(`${dappBaseUrl}/ssu/${target.ssuId}`),
            ],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [ssuType],
            arguments: [tx.object(characterId), ownerCap, receipt],
          });
        }

        const { digest } = await executeTx(tx);
        setSsuResult({ digest });
        setSsuStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setSsuError(message);
        setSsuStatus("error");
      }
    },
    [executeTx, characterId],
  );

  // ── Turret doctrine batch authorization (posture-aware) ──
  const [turretStatus, setTurretStatus] = useState<AuthStatus>("idle");
  const [turretResult, setTurretResult] = useState<AuthResult | null>(null);
  const [turretError, setTurretError] = useState<string | null>(null);

  const authorizeTurrets = useCallback(
    async (targets: TurretSwitchTarget[], posture: PostureMode = "commercial") => {
      if (targets.length === 0) return;
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setTurretStatus("pending");
      setTurretError(null);
      try {
        const tx = new Transaction();
        const turretType = `${WORLD_ORIGINAL_PACKAGE_ID}::turret::Turret`;
        const authType = posture === "defense"
          ? `${CC_PACKAGE_ID}::turret::DefenseAuth`
          : `${CC_PACKAGE_ID}::turret::CommercialAuth`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [turretType],
            arguments: [tx.object(characterId), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::turret::authorize_extension`,
            typeArguments: [authType],
            arguments: [tx.object(target.turretId), ownerCap],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [turretType],
            arguments: [tx.object(characterId), ownerCap, receipt],
          });
        }

        const { digest } = await executeTx(tx);
        setTurretResult({ digest });
        setTurretStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setTurretError(message);
        setTurretStatus("error");
      }
    },
    [executeTx, characterId],
  );

  const setGateDappUrl = useCallback(
    async (targets: GateAuthTarget[], dappBaseUrl: string) => {
      if (targets.length === 0) return;
      if (!characterId) throw new Error("Character not resolved yet \u2014 please wait");
      setGateStatus("pending");
      setGateError(null);
      try {
        const tx = new Transaction();
        const gateType = `${WORLD_ORIGINAL_PACKAGE_ID}::gate::Gate`;

        for (const target of targets) {
          const [ownerCap, receipt] = tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
            typeArguments: [gateType],
            arguments: [tx.object(characterId), tx.object(target.ownerCapId)],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::gate::update_metadata_url`,
            arguments: [
              tx.object(target.gateId),
              ownerCap,
              tx.pure.string(`${dappBaseUrl}/gate/${target.gateId}`),
            ],
          });

          tx.moveCall({
            target: `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
            typeArguments: [gateType],
            arguments: [tx.object(characterId), ownerCap, receipt],
          });
        }

        const { digest } = await executeTx(tx);
        setGateResult({ digest });
        setGateStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setGateError(message);
        setGateStatus("error");
      }
    },
    [executeTx, characterId],
  );

  return {
    authorizeGates,
    setGateDappUrl,
    gateStatus,
    gateResult,
    gateError,
    resetGate: useCallback(() => {
      setGateStatus("idle");
      setGateResult(null);
      setGateError(null);
    }, []),
    authorizeSsus,
    setSsuDappUrl,
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
