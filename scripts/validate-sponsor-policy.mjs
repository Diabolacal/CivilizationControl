import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FLAPPY_PACKAGE_ID = '0xde1554bde721b2a256ea6b3b21ed08b174308a676216e11df8c651f34353e4eb';

const CHAIN_FILE = path.join(ROOT, 'config/chain/stillness.ts');
const POLICY_FILE = path.join(ROOT, 'config/sponsorship/civilizationControlPolicy.ts');
const CONSTANTS_FILE = path.join(ROOT, 'src/constants.ts');
const PUBLISHED_FILE = path.join(ROOT, 'contracts/civilization_control/Published.toml');
const WRANGLER_FILE = path.join(ROOT, 'workers/sponsor-service/wrangler.toml');

const SOURCE_FILES = [
  'src/lib/gatePolicyTx.ts',
  'src/lib/gatePermitTx.ts',
  'src/lib/postureSwitchTx.ts',
  'src/lib/structurePowerTx.ts',
  'src/lib/tradePostTx.ts',
  'src/lib/transitProofTx.ts',
  'src/hooks/useAuthorizeExtension.ts',
].map((filePath) => path.join(ROOT, filePath));

const EXPECTED_TARGETS = {
  '0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c': {
    character: ['borrow_owner_cap', 'return_owner_cap'],
    gate: ['authorize_extension', 'update_metadata_url', 'online', 'offline'],
    storage_unit: ['authorize_extension', 'update_metadata_url', 'online', 'offline'],
    turret: ['authorize_extension', 'online', 'offline'],
    network_node: ['online'],
  },
  '0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021': {
    gate_control: [
      'set_policy_preset',
      'remove_policy_preset',
      'set_treasury',
      'request_jump_permit_free',
      'request_jump_permit',
    ],
    posture: ['set_posture'],
    trade_post: ['create_listing', 'share_listing', 'cancel_listing', 'buy_to_inventory'],
  },
};

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function extractJsonConst(filePath, constName) {
  const source = readText(filePath);
  const pattern = new RegExp(`export const ${constName} = ` + '`([\\s\\S]*?)`;');
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Could not extract ${constName} from ${filePath}`);
  }

  return JSON.parse(match[1]);
}

function extractTsConstant(filePath, constantName) {
  const source = readText(filePath);
  const pattern = new RegExp(`export const ${constantName}\\s*=\\s*\"([^\"]+)\";`);
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Could not extract ${constantName} from ${filePath}`);
  }

  return match[1];
}

function extractPublishedStillnessValue(fieldName) {
  const source = readText(PUBLISHED_FILE);
  const sectionMatch = source.match(/\[published\.testnet_stillness\]([\s\S]*?)(?:\n\[|$)/);
  if (!sectionMatch) {
    throw new Error('Could not locate [published.testnet_stillness] in Published.toml');
  }

  const pattern = new RegExp(`${fieldName} = \"([^\"]+)\"`);
  const fieldMatch = sectionMatch[1].match(pattern);
  if (!fieldMatch) {
    throw new Error(`Could not extract ${fieldName} from Published.toml`);
  }

  return fieldMatch[1];
}

function extractWranglerPolicies() {
  const source = readText(WRANGLER_FILE);
  const match = source.match(/APP_POLICIES = '([^']+)'/);
  if (!match) {
    throw new Error('Could not extract APP_POLICIES from wrangler.toml');
  }

  return JSON.parse(match[1]);
}

function normalizeTargets(targets) {
  const normalized = {};

  for (const [packageId, modules] of Object.entries(targets)) {
    normalized[packageId.toLowerCase()] = {};
    for (const [moduleName, functions] of Object.entries(modules)) {
      normalized[packageId.toLowerCase()][moduleName] = [...functions].sort();
    }
  }

  return normalized;
}

function pushResult(results, ok, message) {
  results.push({ ok, message });
}

function check(condition, message, results) {
  pushResult(results, Boolean(condition), message);
}

function sourceReferencesTarget(moduleName, functionName, sourceText, structurePowerText) {
  if (sourceText.includes(`::${moduleName}::${functionName}`)) {
    return true;
  }

  const isDynamicPowerTarget = ['gate', 'storage_unit', 'turret'].includes(moduleName)
    && ['online', 'offline'].includes(functionName)
    && structurePowerText.includes(`module: "${moduleName}"`)
    && structurePowerText.includes('::${mapping.module}::${online ? "online" : "offline"}');

  return isDynamicPowerTarget;
}

function main() {
  const results = [];
  const chain = extractJsonConst(CHAIN_FILE, 'STILLNESS_CHAIN_JSON');
  const policy = extractJsonConst(POLICY_FILE, 'CIVILIZATION_CONTROL_POLICY_JSON');
  const wranglerPolicies = extractWranglerPolicies();
  const wranglerPolicy = wranglerPolicies[0];

  check(wranglerPolicies.length === 1, 'wrangler.toml defines exactly one app policy', results);
  check(policy.id === 'civilization-control', 'policy id is civilization-control', results);
  check(!JSON.stringify(wranglerPolicies).includes(FLAPPY_PACKAGE_ID), 'wrangler policy contains no Flappy package id', results);
  check(!JSON.stringify(policy).includes(FLAPPY_PACKAGE_ID), 'config policy contains no Flappy package id', results);

  check(
    chain.WORLD_RUNTIME_PACKAGE_ID === extractTsConstant(CONSTANTS_FILE, 'WORLD_RUNTIME_PACKAGE_ID'),
    'WORLD runtime package matches src/constants.ts',
    results,
  );
  check(
    chain.WORLD_ORIGINAL_PACKAGE_ID === extractTsConstant(CONSTANTS_FILE, 'WORLD_ORIGINAL_PACKAGE_ID'),
    'WORLD original package matches src/constants.ts',
    results,
  );
  check(
    chain.CC_PACKAGE_ID === extractTsConstant(CONSTANTS_FILE, 'CC_PACKAGE_ID'),
    'CC runtime package matches src/constants.ts',
    results,
  );
  check(
    chain.CC_ORIGINAL_PACKAGE_ID === extractTsConstant(CONSTANTS_FILE, 'CC_ORIGINAL_PACKAGE_ID'),
    'CC original package matches src/constants.ts',
    results,
  );
  check(
    chain.EVE_ASSETS_PACKAGE_ID === extractTsConstant(CONSTANTS_FILE, 'EVE_ASSETS_PACKAGE_ID'),
    'EVE assets package matches src/constants.ts',
    results,
  );
  check(
    chain.GATE_CONFIG_ID === extractTsConstant(CONSTANTS_FILE, 'GATE_CONFIG_ID'),
    'GateConfig object id matches src/constants.ts',
    results,
  );
  check(
    chain.ENERGY_CONFIG_ID === extractTsConstant(CONSTANTS_FILE, 'ENERGY_CONFIG_ID'),
    'EnergyConfig object id matches src/constants.ts',
    results,
  );

  check(
    chain.CC_PACKAGE_ID === extractPublishedStillnessValue('published-at'),
    'CC runtime package matches Published.toml stillness published-at',
    results,
  );
  check(
    chain.CC_ORIGINAL_PACKAGE_ID === extractPublishedStillnessValue('original-id'),
    'CC original package matches Published.toml stillness original-id',
    results,
  );
  check(
    extractPublishedStillnessValue('chain-id') === chain.CHAIN_ID,
    'chain id matches Published.toml stillness chain-id',
    results,
  );

  const normalizedPolicy = normalizeTargets(policy.packages);
  const normalizedExpected = normalizeTargets(EXPECTED_TARGETS);
  const normalizedWrangler = normalizeTargets(wranglerPolicy.packages);
  check(
    JSON.stringify(normalizedPolicy) === JSON.stringify(normalizedExpected),
    'config policy targets match current expected CivilizationControl targets',
    results,
  );
  check(
    JSON.stringify(normalizedWrangler) === JSON.stringify(normalizedExpected),
    'wrangler APP_POLICIES matches config policy targets',
    results,
  );
  check(policy.maxCommands === 200, 'config policy maxCommands is 200', results);
  check(wranglerPolicy.maxCommands === 200, 'wrangler policy maxCommands is 200', results);

  const packageIds = Object.keys(normalizedPolicy).sort();
  check(
    JSON.stringify(packageIds) ===
      JSON.stringify([chain.CC_PACKAGE_ID.toLowerCase(), chain.WORLD_RUNTIME_PACKAGE_ID.toLowerCase()].sort()),
    'policy package ids are exactly the current world runtime and CC runtime packages',
    results,
  );

  const sourceTexts = SOURCE_FILES.map((filePath) => ({
    filePath,
    text: readText(filePath),
  }));
  const sourceText = sourceTexts.map((entry) => entry.text).join('\n');
  const structurePowerText = sourceTexts.find((entry) =>
    entry.filePath.endsWith('src\\lib\\structurePowerTx.ts'),
  )?.text ?? '';
  for (const [packageId, modules] of Object.entries(EXPECTED_TARGETS)) {
    for (const [moduleName, functions] of Object.entries(modules)) {
      for (const functionName of functions) {
        check(
          sourceReferencesTarget(moduleName, functionName, sourceText, structurePowerText),
          `source builders reference ${packageId}::${moduleName}::${functionName}`,
          results,
        );
      }
    }
  }

  console.log('Sponsor policy validation summary');
  let hasFailure = false;
  for (const result of results) {
    const prefix = result.ok ? '[ok]' : '[fail]';
    console.log(`${prefix} ${result.message}`);
    if (!result.ok) {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
    return;
  }

  console.log('[ok] sponsor policy validation passed');
}

main();