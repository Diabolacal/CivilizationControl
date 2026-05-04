import { describe, expect, it } from 'vitest';
import {
  ABSOLUTE_MAX_COMMANDS,
  containsGasCoinReference,
  DEFAULT_MAX_COMMANDS,
  parseAppPolicies,
  type AppPolicy,
  validateCommands,
} from '../validation';

type Command = { $kind: string; [key: string]: unknown };

const WORLD_RUNTIME_PACKAGE = '0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780';
const WORLD_COMPAT_RUNTIME_PACKAGE = '0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c';
const CC_PACKAGE = '0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021';
const OTHER_PACKAGE = '0x1111111111111111111111111111111111111111111111111111111111111111';
const BAD_PACKAGE = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

const WORLD_TARGETS = new Map([
  ['character', new Set(['borrow_owner_cap', 'return_owner_cap'])],
  ['assembly', new Set(['update_metadata_name', 'online', 'offline', 'offline_connected_assembly'])],
  ['gate', new Set(['authorize_extension', 'update_metadata_url', 'update_metadata_name', 'online', 'offline', 'offline_connected_gate'])],
  ['storage_unit', new Set(['authorize_extension', 'update_metadata_url', 'update_metadata_name', 'online', 'offline', 'offline_connected_storage_unit'])],
  ['turret', new Set(['authorize_extension', 'update_metadata_name', 'online', 'offline', 'offline_connected_turret'])],
  ['network_node', new Set(['update_metadata_name', 'online', 'offline', 'destroy_offline_assemblies'])],
]);

const CC_POLICY: AppPolicy = {
  id: 'civilization-control',
  packages: new Map([
    [
      WORLD_RUNTIME_PACKAGE.toLowerCase(),
      new Map(WORLD_TARGETS),
    ],
    [
      WORLD_COMPAT_RUNTIME_PACKAGE.toLowerCase(),
      new Map(WORLD_TARGETS),
    ],
    [
      CC_PACKAGE.toLowerCase(),
      new Map([
        [
          'gate_control',
          new Set([
            'set_policy_preset',
            'remove_policy_preset',
            'set_treasury',
            'request_jump_permit_free',
            'request_jump_permit',
          ]),
        ],
        ['posture', new Set(['set_posture'])],
        [
          'trade_post',
          new Set(['create_listing', 'share_listing', 'cancel_listing', 'buy_to_inventory']),
        ],
      ]),
    ],
  ]),
  maxCommands: 200,
};

const OTHER_POLICY: AppPolicy = {
  id: 'secondary-app',
  packages: new Map([
    [OTHER_PACKAGE.toLowerCase(), new Map([['game', new Set(['ping'])]])],
  ]),
  maxCommands: DEFAULT_MAX_COMMANDS,
};

const BOTH_POLICIES = [CC_POLICY, OTHER_POLICY];

const GAS_COIN = { $kind: 'GasCoin' };
const INPUT_0 = { $kind: 'Input', Input: 0 };
const INPUT_1 = { $kind: 'Input', Input: 1 };
const RESULT_0 = { $kind: 'Result', Result: 0 };

function makeMoveCall(
  packageId: string = CC_PACKAGE,
  moduleName: string = 'posture',
  functionName: string = 'set_posture',
): Command {
  return {
    $kind: 'MoveCall',
    MoveCall: {
      package: packageId,
      module: moduleName,
      function: functionName,
      typeArguments: [],
      arguments: [INPUT_0, INPUT_1],
    },
  };
}

function makeSplitCoins(
  coin: Record<string, unknown>,
  amounts: Array<Record<string, unknown>>,
): Command {
  return {
    $kind: 'SplitCoins',
    SplitCoins: { coin, amounts },
  };
}

function makeMergeCoins(
  destination: Record<string, unknown>,
  sources: Array<Record<string, unknown>>,
): Command {
  return {
    $kind: 'MergeCoins',
    MergeCoins: { destination, sources },
  };
}

function makeMakeMoveVec(elements: Array<Record<string, unknown>>): Command {
  return {
    $kind: 'MakeMoveVec',
    MakeMoveVec: { type: null, elements },
  };
}

function makeTransferObjects(
  objects: Array<Record<string, unknown>>,
  address: Record<string, unknown>,
): Command {
  return {
    $kind: 'TransferObjects',
    TransferObjects: { objects, address },
  };
}

describe('containsGasCoinReference', () => {
  it('detects a direct GasCoin reference', () => {
    expect(containsGasCoinReference(GAS_COIN)).toBe(true);
  });

  it('detects a nested GasCoin reference', () => {
    expect(containsGasCoinReference(makeSplitCoins(GAS_COIN, [INPUT_0]))).toBe(true);
  });

  it('ignores player-owned object references', () => {
    expect(containsGasCoinReference(makeSplitCoins(INPUT_0, [INPUT_1]))).toBe(false);
    expect(containsGasCoinReference(makeTransferObjects([RESULT_0], INPUT_0))).toBe(false);
  });
});

describe('parseAppPolicies', () => {
  it('parses legacy single-package configs', () => {
    const policies = parseAppPolicies([
      { id: 'legacy', packageId: CC_PACKAGE, targets: { posture: ['set_posture'] } },
    ]);

    expect(policies).toHaveLength(1);
    expect(policies[0].packages.get(CC_PACKAGE)?.get('posture')).toEqual(
      new Set(['set_posture']),
    );
  });

  it('parses multi-package configs and clamps maxCommands', () => {
    const policies = parseAppPolicies([
      {
        id: 'civilization-control',
        packages: {
          [WORLD_RUNTIME_PACKAGE]: { gate: ['online'] },
          [WORLD_COMPAT_RUNTIME_PACKAGE]: { gate: ['offline'] },
          [CC_PACKAGE]: { posture: ['set_posture'] },
        },
        maxCommands: 999,
      },
    ]);

    expect(policies).toHaveLength(1);
    expect(policies[0].packages.size).toBe(3);
    expect(policies[0].maxCommands).toBe(ABSOLUTE_MAX_COMMANDS);
  });

  it('returns an empty array for invalid input', () => {
    expect(parseAppPolicies([] as never)).toEqual([]);
    expect(parseAppPolicies(undefined as never)).toEqual([]);
  });
});

describe('validateCommands happy path', () => {
  it('accepts a CC-only MoveCall', () => {
    const result = validateCommands([makeMoveCall()], [CC_POLICY]);
    expect(result.valid).toBe(true);
    expect(result.matchedApp).toBe('civilization-control');
  });

  it('accepts a world-only MoveCall', () => {
    const result = validateCommands(
      [makeMoveCall(WORLD_RUNTIME_PACKAGE, 'gate', 'online')],
      [CC_POLICY],
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a generic assembly MoveCall', () => {
    const result = validateCommands(
      [makeMoveCall(WORLD_RUNTIME_PACKAGE, 'assembly', 'online')],
      [CC_POLICY],
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a sponsored network-node offline PTB shape', () => {
    const result = validateCommands(
      [
        makeMoveCall(WORLD_RUNTIME_PACKAGE, 'character', 'borrow_owner_cap'),
        makeMoveCall(WORLD_RUNTIME_PACKAGE, 'network_node', 'offline'),
        makeMoveCall(WORLD_RUNTIME_PACKAGE, 'gate', 'offline_connected_gate'),
        makeMoveCall(WORLD_RUNTIME_PACKAGE, 'assembly', 'offline_connected_assembly'),
        makeMoveCall(WORLD_RUNTIME_PACKAGE, 'network_node', 'destroy_offline_assemblies'),
        makeMoveCall(WORLD_RUNTIME_PACKAGE, 'character', 'return_owner_cap'),
      ],
      [CC_POLICY],
    );

    expect(result.valid).toBe(true);
  });

  it('accepts a compatibility-world MoveCall', () => {
    const result = validateCommands(
      [makeMoveCall(WORLD_COMPAT_RUNTIME_PACKAGE, 'gate', 'offline')],
      [CC_POLICY],
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a multi-package governance PTB', () => {
    const commands = [
      makeMoveCall(WORLD_RUNTIME_PACKAGE, 'character', 'borrow_owner_cap'),
      makeMoveCall(WORLD_COMPAT_RUNTIME_PACKAGE, 'turret', 'authorize_extension'),
      makeMoveCall(CC_PACKAGE, 'posture', 'set_posture'),
      makeMoveCall(WORLD_RUNTIME_PACKAGE, 'character', 'return_owner_cap'),
    ];

    const result = validateCommands(commands, [CC_POLICY]);
    expect(result.valid).toBe(true);
  });

  it('accepts paid permit and trade flows that split player-owned EVE coins', () => {
    const paidPermit = [
      makeSplitCoins(INPUT_0, [INPUT_1]),
      makeMoveCall(CC_PACKAGE, 'gate_control', 'request_jump_permit'),
    ];
    const buyListing = [
      makeSplitCoins(INPUT_0, [INPUT_1]),
      makeMoveCall(CC_PACKAGE, 'trade_post', 'buy_to_inventory'),
    ];

    expect(validateCommands(paidPermit, [CC_POLICY]).valid).toBe(true);
    expect(validateCommands(buyListing, [CC_POLICY]).valid).toBe(true);
  });

  it('accepts helper commands that do not touch GasCoin', () => {
    const commands = [
      makeMergeCoins(INPUT_0, [INPUT_1]),
      makeMakeMoveVec([INPUT_0, INPUT_1]),
      makeMoveCall(CC_PACKAGE, 'trade_post', 'share_listing'),
    ];

    expect(validateCommands(commands, [CC_POLICY]).valid).toBe(true);
  });
});

describe('validateCommands rejection paths', () => {
  it('rejects GasCoin theft attempts', () => {
    const commands = [
      makeSplitCoins(GAS_COIN, [INPUT_0]),
      makeMoveCall(CC_PACKAGE, 'posture', 'set_posture'),
    ];

    const result = validateCommands(commands, [CC_POLICY]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('GasCoin');
  });

  it('rejects disallowed command kinds', () => {
    const result = validateCommands(
      [
        makeTransferObjects([RESULT_0], INPUT_0),
        makeMoveCall(CC_PACKAGE, 'posture', 'set_posture'),
      ],
      [CC_POLICY],
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('TransferObjects');
  });

  it('rejects unknown packages', () => {
    const result = validateCommands([makeMoveCall(BAD_PACKAGE, 'router', 'swap')], [CC_POLICY]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('package');
  });

  it('rejects unknown modules and functions', () => {
    const badModule = validateCommands([makeMoveCall(CC_PACKAGE, 'treasury', 'drain')], [CC_POLICY]);
    const badFunction = validateCommands(
      [makeMoveCall(CC_PACKAGE, 'trade_post', 'steal_inventory')],
      [CC_POLICY],
    );

    expect(badModule.valid).toBe(false);
    expect(badModule.reason).toContain('module');
    expect(badFunction.valid).toBe(false);
    expect(badFunction.reason).toContain('function');
  });

  it('rejects cross-app PTBs when another policy is present', () => {
    const commands = [
      makeMoveCall(CC_PACKAGE, 'posture', 'set_posture'),
      makeMoveCall(OTHER_PACKAGE, 'game', 'ping'),
    ];

    const result = validateCommands(commands, BOTH_POLICIES);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Cross-app');
  });

  it('rejects empty PTBs and PTBs with no MoveCall', () => {
    const empty = validateCommands([], [CC_POLICY]);
    const helperOnly = validateCommands([makeSplitCoins(INPUT_0, [INPUT_1])], [CC_POLICY]);

    expect(empty.valid).toBe(false);
    expect(helperOnly.valid).toBe(false);
    expect(helperOnly.reason).toContain('No MoveCall');
  });

  it('rejects policy and absolute command overflows', () => {
    const policyOverflow = Array.from({ length: CC_POLICY.maxCommands + 1 }, () =>
      makeMoveCall(CC_PACKAGE, 'posture', 'set_posture'),
    );
    const absoluteOverflow = Array.from({ length: ABSOLUTE_MAX_COMMANDS + 1 }, () =>
      makeMoveCall(CC_PACKAGE, 'posture', 'set_posture'),
    );

    expect(validateCommands(policyOverflow, [CC_POLICY]).valid).toBe(false);
    expect(validateCommands(absoluteOverflow, [CC_POLICY]).valid).toBe(false);
  });
});