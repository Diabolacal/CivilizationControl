import assert from "node:assert/strict";
import { buildPostureSwitchTx, NO_POSTURE_TARGETS_ERROR } from "../src/lib/postureSwitchTx.ts";
import {
  CC_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
} from "../src/constants.ts";

type Command = {
  $kind: string;
  MoveCall?: {
    target?: string;
    package?: string;
    module?: string;
    function?: string;
  };
};

function objectId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, "0")}`;
}

function getMoveTargets(commands: Command[]): string[] {
  return commands
    .filter((command) => command.$kind === "MoveCall")
    .map((command) => {
      const moveCall = command.MoveCall;
      if (moveCall?.target) return moveCall.target;
      return `${moveCall?.package}::${moveCall?.module}::${moveCall?.function}`;
    });
}

function getCommands(targetMode: "commercial" | "defense", gateCount: number, turretCount: number): Command[] {
  const tx = buildPostureSwitchTx({
    targetMode,
    characterId: objectId(1),
    gates: Array.from({ length: gateCount }, (_, index) => ({
      gateId: objectId(100 + index),
      ownerCapId: objectId(200 + index),
    })),
    turrets: Array.from({ length: turretCount }, (_, index) => ({
      turretId: objectId(300 + index),
      ownerCapId: objectId(400 + index),
    })),
  });

  return tx.getData().commands as Command[];
}

const gateAndTurretCommands = getCommands("defense", 1, 1);
const gateAndTurretTargets = getMoveTargets(gateAndTurretCommands);

assert.equal(gateAndTurretCommands.length, 6, "expected one gate and one turret to produce six commands");
assert.deepEqual(gateAndTurretTargets, [
  `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
  `${CC_PACKAGE_ID}::posture::set_posture`,
  `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
  `${WORLD_RUNTIME_PACKAGE_ID}::turret::authorize_extension`,
  `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
]);
assert.equal(
  gateAndTurretTargets.filter((target) => target === `${CC_PACKAGE_ID}::posture::set_posture`).length,
  1,
  "expected a gate posture move call when gates are present",
);

const turretOnlyCommands = getCommands("commercial", 0, 1);
const turretOnlyTargets = getMoveTargets(turretOnlyCommands);

assert.equal(turretOnlyCommands.length, 3, "expected one turret-only switch to produce three commands");
assert.equal(
  turretOnlyTargets.includes(`${CC_PACKAGE_ID}::posture::set_posture`),
  false,
  "turret-only switches must not inject gate posture calls",
);
assert.equal(
  turretOnlyTargets.includes(`${WORLD_RUNTIME_PACKAGE_ID}::turret::authorize_extension`),
  true,
  "turret-only switches must still authorize turret doctrine",
);
assert.equal(
  turretOnlyTargets.some((target) =>
    target.includes("set_commercial") || target.includes("set_defense") || target.includes("set_treasury")),
  false,
  "posture switches must not rewrite gate presets or treasury state",
);

assert.throws(
  () => buildPostureSwitchTx({
    targetMode: "defense",
    characterId: objectId(1),
    gates: [],
    turrets: [],
  }),
  (error: unknown) => error instanceof Error && error.message === NO_POSTURE_TARGETS_ERROR,
  "empty posture switches must fail before building a PTB",
);

console.log("check-posture-switch-tx: ok");