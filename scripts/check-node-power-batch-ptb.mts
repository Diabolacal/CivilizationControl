import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { WORLD_RUNTIME_PACKAGE_ID } from "../src/constants.ts";
import { buildMixedAssemblyPowerTx } from "../src/lib/structurePowerTx.ts";

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

const mixedTx = buildMixedAssemblyPowerTx({
  characterId: objectId(1),
  targets: [
    {
      structureId: objectId(101),
      structureType: "storage_unit",
      ownerCapId: objectId(201),
      networkNodeId: objectId(301),
      online: false,
    },
    {
      structureId: objectId(102),
      structureType: "gate",
      ownerCapId: objectId(202),
      networkNodeId: objectId(301),
      online: false,
    },
    {
      structureId: objectId(103),
      structureType: "turret",
      ownerCapId: objectId(203),
      networkNodeId: objectId(301),
      online: true,
    },
    {
      structureId: objectId(104),
      structureType: "assembly",
      ownerCapId: objectId(204),
      networkNodeId: objectId(301),
      online: true,
    },
  ],
});

assert.deepEqual(
  getMoveTargets(mixedTx.getData().commands as Command[]),
  [
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::storage_unit::offline`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::gate::offline`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::turret::online`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::borrow_owner_cap`,
    `${WORLD_RUNTIME_PACKAGE_ID}::assembly::online`,
    `${WORLD_RUNTIME_PACKAGE_ID}::character::return_owner_cap`,
  ],
  "expected one mixed child-power PTB to contain every family command in a single transaction",
);

const dashboardSource = readFileSync("src/screens/Dashboard.tsx", "utf8");
assert(dashboardSource.includes("structurePower.toggleMixed"), "expected Node Control bulk/preset execution to use the mixed one-PTB hook path");
assert(!dashboardSource.includes("structurePower.toggleBatch"), "expected Node Control not to loop same-family batch submissions from Dashboard");
assert(dashboardSource.includes("operatorInventory.refetch()"), "expected Node Control bulk/preset execution to preflight-refresh before final diffing");
assert(dashboardSource.includes("fetchStructurePowerChainSnapshots"), "expected Node Control bulk/preset execution to chain-preflight final targets before wallet prompt");
assert(dashboardSource.includes("inspectNodePowerPlanForChainEligibility"), "expected Node Control bulk/preset execution to classify final online eligibility before wallet prompt");
assert(dashboardSource.includes("structurePower.reportLocalSuccess"), "expected all-excluded Node Control plans to stop before wallet execution");
assert(!/queryEvents\s*\(/.test(dashboardSource), "expected Node Control bulk/preset execution not to use browser queryEvents");
assert(!/setInterval\s*\(/.test(dashboardSource), "expected Node Control bulk/preset execution not to add broad polling");
assert(!/window\.confirm\s*\(/.test(dashboardSource), "expected Node Control bulk/preset execution not to use native browser confirmation popups");

const chainStatusSource = readFileSync("src/lib/structurePowerChainStatus.ts", "utf8");
assert(chainStatusSource.includes("multiGetObjects"), "expected final target truth guard to use targeted object reads only");
assert(!/queryEvents\s*\(/.test(chainStatusSource), "expected final target truth guard not to query events");
assert(!/setInterval\s*\(/.test(chainStatusSource), "expected final target truth guard not to poll broadly");

const powerHookSource = readFileSync("src/hooks/useStructurePower.ts", "utf8");
assert(powerHookSource.includes("buildMixedAssemblyPowerTx"), "expected the power hook to expose a mixed-family PTB builder path");
assert(powerHookSource.includes("toggleMixed"), "expected one hook call to represent one wallet approval for mixed child writes");

console.log("Node power mixed PTB batching checks passed.");