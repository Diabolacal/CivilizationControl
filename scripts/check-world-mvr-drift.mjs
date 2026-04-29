import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_TIMEOUT_MS = 5000;
const MODES = new Set(['default', 'ci', 'strict']);

const FILES = {
  baseline: path.join(ROOT, 'config/chain/worldMvrBaseline.json'),
  chain: path.join(ROOT, 'config/chain/stillness.ts'),
  constants: path.join(ROOT, 'src/constants.ts'),
  policy: path.join(ROOT, 'config/sponsorship/civilizationControlPolicy.ts'),
  wrangler: path.join(ROOT, 'workers/sponsor-service/wrangler.toml'),
  workerTest: path.join(ROOT, 'workers/sponsor-service/src/__tests__/validation.test.ts'),
  sponsorValidation: path.join(ROOT, 'scripts/validate-sponsor-policy.mjs'),
  moveToml: path.join(ROOT, 'contracts/civilization_control/Move.toml'),
  moveLock: path.join(ROOT, 'contracts/civilization_control/Move.lock'),
  vendorPublished: path.join(ROOT, 'vendor/world-contracts/contracts/world/Published.toml'),
};

class DriftConfigError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DriftConfigError';
    this.code = code;
  }
}

function failUsage(message) {
  console.error(message);
  process.exit(64);
}

function parseArgs(argv) {
  const options = {
    mode: 'default',
    chainKey: 'stillness',
    mvrName: undefined,
    mvrEndpoint: undefined,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (const arg of argv) {
    if (arg === '--ci') {
      options.mode = 'ci';
      continue;
    }

    if (arg === '--strict') {
      options.mode = 'strict';
      continue;
    }

    if (arg.startsWith('--mode=')) {
      options.mode = arg.slice('--mode='.length);
      continue;
    }

    if (arg.startsWith('--chain-key=')) {
      options.chainKey = arg.slice('--chain-key='.length);
      continue;
    }

    if (arg.startsWith('--mvr-name=')) {
      options.mvrName = arg.slice('--mvr-name='.length);
      continue;
    }

    if (arg.startsWith('--mvr-endpoint=')) {
      options.mvrEndpoint = arg.slice('--mvr-endpoint='.length);
      continue;
    }

    if (arg.startsWith('--timeout-ms=')) {
      const timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10);
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        failUsage(`Invalid --timeout-ms value: ${arg}`);
      }
      options.timeoutMs = timeoutMs;
      continue;
    }

    failUsage(`Unknown argument: ${arg}`);
  }

  if (!MODES.has(options.mode)) {
    failUsage(`Unsupported mode: ${options.mode}`);
  }

  return options;
}

function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
      const lines = [
        `Required file missing: ${relativePath}`,
      ];

      if (relativePath === 'vendor/world-contracts/contracts/world/Published.toml') {
        lines.push('Likely cause in CI: git submodules were not checked out.');
        lines.push('Fix GitHub Actions checkout with actions/checkout and submodules: recursive.');
        lines.push('Local fix: run git submodule update --init --recursive.');
      }

      throw new DriftConfigError('MISSING_REQUIRED_FILE', lines.join('\n'));
    }

    throw error;
  }
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function normalizePackageId(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isHexPackageId(value) {
  return /^0x[a-f0-9]{64}$/.test(value);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function extractJsonConst(filePath, constName) {
  const source = readText(filePath);
  const pattern = new RegExp(`export const ${constName} = ` + '`([\\s\\S]*?)`;');
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Could not extract ${constName} from ${path.relative(ROOT, filePath)}`);
  }

  return JSON.parse(match[1]);
}

function extractTsConstant(filePath, constantName) {
  const source = readText(filePath);
  const pattern = new RegExp(`export const ${constantName}\\s*=\\s*["']([^"']+)["'];`);
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Could not extract ${constantName} from ${path.relative(ROOT, filePath)}`);
  }

  return normalizePackageId(match[1]);
}

function extractJsConstant(filePath, constantName) {
  const source = readText(filePath);
  const pattern = new RegExp(`const ${constantName}\\s*=\\s*["']([^"']+)["'];`);
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Could not extract ${constantName} from ${path.relative(ROOT, filePath)}`);
  }

  return normalizePackageId(match[1]);
}

function extractOptionalJsConstant(filePath, constantName) {
  const source = readText(filePath);
  const pattern = new RegExp(`const ${constantName}\\s*=\\s*["']([^"']+)["'];`);
  const match = source.match(pattern);
  if (!match) {
    return null;
  }

  return normalizePackageId(match[1]);
}

function extractPublishedSection(filePath, sectionName) {
  const source = readText(filePath);
  const sectionMatch = source.match(new RegExp(`\\[${sectionName.replace('.', '\\.')}\\]([\\s\\S]*?)(?:\\n\\[|$)`));
  if (!sectionMatch) {
    throw new Error(`Could not locate [${sectionName}] in ${path.relative(ROOT, filePath)}`);
  }

  const readField = (fieldName, quoted = true) => {
    const pattern = quoted
      ? new RegExp(`${fieldName} = ["']([^"']+)["']`)
      : new RegExp(`${fieldName} = ([^\n]+)`);
    const match = sectionMatch[1].match(pattern);
    if (!match) {
      throw new Error(`Could not extract ${fieldName} from [${sectionName}] in ${path.relative(ROOT, filePath)}`);
    }
    return match[1].trim();
  };

  return {
    chainId: readField('chain-id'),
    publishedAt: normalizePackageId(readField('published-at')),
    originalId: normalizePackageId(readField('original-id')),
    version: Number.parseInt(readField('version', false), 10),
  };
}

function extractWranglerPolicies(filePath) {
  const source = readText(filePath);
  const match = source.match(/APP_POLICIES = '([^']+)'/);
  if (!match) {
    throw new Error(`Could not extract APP_POLICIES from ${path.relative(ROOT, filePath)}`);
  }

  return JSON.parse(match[1]);
}

function extractRuntimePackageIdsFromScript(filePath) {
  return uniqueSorted(
    [
      extractOptionalJsConstant(filePath, 'WORLD_RUNTIME_PACKAGE'),
      extractOptionalJsConstant(filePath, 'WORLD_COMPAT_RUNTIME_PACKAGE'),
      extractOptionalJsConstant(filePath, 'WORLD_PACKAGE'),
      extractOptionalJsConstant(filePath, 'CC_PACKAGE'),
    ].filter(Boolean),
  );
}

function extractMoveDependencyModes(filePath) {
  const source = readText(filePath);
  const world = source.match(/^world\s*=\s*\{([^}]*)\}/m)?.[1] ?? '';
  const assets = source.match(/^assets\s*=\s*\{([^}]*)\}/m)?.[1] ?? '';

  const classify = (value, localPath) => {
    if (value.includes(`local = "${localPath}"`)) {
      return 'local-vendor';
    }

    if (value.includes('r.mvr')) {
      return 'mvr';
    }

    if (value.trim().length === 0) {
      return 'missing';
    }

    return 'other';
  };

  return {
    world: classify(world, '../../vendor/world-contracts/contracts/world'),
    assets: classify(assets, '../../vendor/world-contracts/contracts/assets'),
  };
}

function extractMoveLockSources(filePath) {
  const source = readText(filePath);
  return {
    hasWorldLocalVendor:
      source.includes("vendor\\world-contracts\\contracts\\world")
      || source.includes('vendor/world-contracts/contracts/world'),
    hasAssetsLocalVendor:
      source.includes("vendor\\world-contracts\\contracts\\assets")
      || source.includes('vendor/world-contracts/contracts/assets'),
  };
}

function normalizeTargets(targets) {
  const normalized = {};

  for (const packageId of Object.keys(targets).sort()) {
    normalized[normalizePackageId(packageId)] = {};
    const modules = targets[packageId] ?? {};
    for (const moduleName of Object.keys(modules).sort()) {
      normalized[normalizePackageId(packageId)][moduleName] = [...modules[moduleName]].sort();
    }
  }

  return normalized;
}

function getWorldPolicyPackageIds(packageIds, ccPackageId) {
  return packageIds.filter((packageId) => packageId !== ccPackageId);
}

function compareArrays(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function compareObjects(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createTimeoutPromise(timeoutMs, label) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

async function resolveMvrPackage({ endpoint, packageName, rpcUrl, timeoutMs }) {
  const errors = [];

  try {
    const client = new SuiJsonRpcClient({
      url: rpcUrl,
      network: 'testnet',
      mvr: { url: endpoint },
    });
    const result = await Promise.race([
      client.core.mvr.resolvePackage({ package: packageName }),
      createTimeoutPromise(timeoutMs, 'SDK MVR resolution'),
    ]);
    const packageId = normalizePackageId(result.package);
    if (isHexPackageId(packageId)) {
      return { ok: true, method: 'sdk', packageId, endpoint };
    }
    errors.push(`SDK returned a non-package value: ${String(result.package)}`);
  } catch (error) {
    errors.push(`SDK resolution failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const response = await fetch(`${endpoint}/v1/resolution/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mvr-Source': 'civilization-control-world-drift-check',
      },
      body: JSON.stringify({ names: [packageName] }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${body}`);
    }

    const payload = await response.json();
    const packageId = normalizePackageId(payload?.resolution?.[packageName]?.package_id ?? '');
    if (isHexPackageId(packageId)) {
      return { ok: true, method: 'http', packageId, endpoint };
    }

    throw new Error('response did not include resolution.<name>.package_id');
  } catch (error) {
    errors.push(`HTTP resolution failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    ok: false,
    endpoint,
    error: errors.join(' | '),
  };
}

function addCheck(collection, severity, code, message) {
  collection.push({ severity, code, message });
}

function renderList(items, emptyLabel) {
  if (items.length === 0) {
    console.log(`- ${emptyLabel}`);
    return;
  }

  for (const item of items) {
    console.log(`- [${item.code}] ${item.message}`);
  }
}

function printSection(title, lines) {
  console.log(`\n${title}`);
  for (const line of lines) {
    console.log(line);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseline = readJson(FILES.baseline);

  if (options.chainKey !== baseline.chainKey) {
    failUsage(`Unsupported chain key: ${options.chainKey}`);
  }

  const chain = extractJsonConst(FILES.chain, 'STILLNESS_CHAIN_JSON');
  const policy = extractJsonConst(FILES.policy, 'CIVILIZATION_CONTROL_POLICY_JSON');
  const wranglerPolicies = extractWranglerPolicies(FILES.wrangler);
  const wranglerPolicy = wranglerPolicies[0] ?? null;
  const constants = {
    worldRuntime: extractTsConstant(FILES.constants, 'WORLD_RUNTIME_PACKAGE_ID'),
    worldOriginal: extractTsConstant(FILES.constants, 'WORLD_ORIGINAL_PACKAGE_ID'),
    ccRuntime: extractTsConstant(FILES.constants, 'CC_PACKAGE_ID'),
    ccOriginal: extractTsConstant(FILES.constants, 'CC_ORIGINAL_PACKAGE_ID'),
  };
  const testPackageIds = extractRuntimePackageIdsFromScript(FILES.workerTest);
  const validationExpectedPackageIds = extractRuntimePackageIdsFromScript(FILES.sponsorValidation);
  const moveDependencyModes = extractMoveDependencyModes(FILES.moveToml);
  const moveLockSources = extractMoveLockSources(FILES.moveLock);
  const vendor = extractPublishedSection(FILES.vendorPublished, 'published.testnet_stillness');

  const chainWorldRuntime = normalizePackageId(chain.WORLD_RUNTIME_PACKAGE_ID);
  const chainWorldOriginal = normalizePackageId(chain.WORLD_ORIGINAL_PACKAGE_ID);
  const chainCcRuntime = normalizePackageId(chain.CC_PACKAGE_ID);
  const chainCcOriginal = normalizePackageId(chain.CC_ORIGINAL_PACKAGE_ID);

  const policyPackageIds = uniqueSorted(Object.keys(policy.packages).map((value) => normalizePackageId(value)));
  const wranglerPackageIds = uniqueSorted(
    Object.keys(wranglerPolicy?.packages ?? {}).map((value) => normalizePackageId(value)),
  );
  const policyWorldPackages = getWorldPolicyPackageIds(policyPackageIds, chainCcRuntime);
  const wranglerWorldPackages = getWorldPolicyPackageIds(wranglerPackageIds, chainCcRuntime);

  const checks = [];
  const errors = [];
  const warnings = [];
  const knownDrift = [];

  const record = (severity, code, message) => {
    addCheck(checks, severity, code, message);
    if (severity === 'fail') {
      addCheck(errors, severity, code, message);
      return;
    }
    if (severity === 'warn') {
      addCheck(warnings, severity, code, message);
      return;
    }
    if (severity === 'known') {
      addCheck(knownDrift, severity, code, message);
    }
  };

  const modeAwareSeverity = (defaultSeverity, ciSeverity) => {
    if (options.mode === 'default') {
      return defaultSeverity;
    }
    return ciSeverity;
  };

  const expectedRuntimeIds = uniqueSorted([chainWorldRuntime, chainWorldOriginal, chainCcRuntime]);
  const normalizedPolicy = normalizeTargets(policy.packages);
  const normalizedWrangler = normalizeTargets(wranglerPolicy?.packages ?? {});

  if (constants.worldRuntime === chainWorldRuntime) {
    record('ok', 'INTERNAL_WORLD_RUNTIME_CONSTANT_MATCH', 'src/constants.ts world runtime package matches config/chain/stillness.ts');
  } else {
    record('fail', 'INTERNAL_WORLD_RUNTIME_CONSTANT_MISMATCH', `src/constants.ts WORLD_RUNTIME_PACKAGE_ID (${constants.worldRuntime}) does not match config/chain/stillness.ts WORLD_RUNTIME_PACKAGE_ID (${chainWorldRuntime})`);
  }

  if (constants.worldOriginal === chainWorldOriginal) {
    record('ok', 'INTERNAL_WORLD_ORIGINAL_CONSTANT_MATCH', 'src/constants.ts world original package matches config/chain/stillness.ts');
  } else {
    record('fail', 'INTERNAL_WORLD_ORIGINAL_CONSTANT_MISMATCH', `src/constants.ts WORLD_ORIGINAL_PACKAGE_ID (${constants.worldOriginal}) does not match config/chain/stillness.ts WORLD_ORIGINAL_PACKAGE_ID (${chainWorldOriginal})`);
  }

  if (constants.ccRuntime === chainCcRuntime) {
    record('ok', 'INTERNAL_CC_CONSTANT_MATCH', 'src/constants.ts matches config/chain/stillness.ts CC runtime package');
  } else {
    record('fail', 'INTERNAL_CC_CONSTANT_MISMATCH', `src/constants.ts CC_PACKAGE_ID (${constants.ccRuntime}) does not match config/chain/stillness.ts CC_PACKAGE_ID (${chainCcRuntime})`);
  }

  if (constants.ccOriginal === chainCcOriginal) {
    record('ok', 'INTERNAL_CC_ORIGINAL_MATCH', 'src/constants.ts matches config/chain/stillness.ts CC original package');
  } else {
    record('fail', 'INTERNAL_CC_ORIGINAL_MISMATCH', `src/constants.ts CC_ORIGINAL_PACKAGE_ID (${constants.ccOriginal}) does not match config/chain/stillness.ts CC_ORIGINAL_PACKAGE_ID (${chainCcOriginal})`);
  }

  if (policy.id === 'civilization-control') {
    record('ok', 'INTERNAL_POLICY_ID', 'config/sponsorship/civilizationControlPolicy.ts policy id is civilization-control');
  } else {
    record('fail', 'INTERNAL_POLICY_ID', `Unexpected sponsor policy id: ${policy.id}`);
  }

  if (compareArrays(policyPackageIds, expectedRuntimeIds)) {
    record('ok', 'INTERNAL_POLICY_PACKAGES', 'Sponsor policy packages match the committed world and CC runtime packages');
  } else {
    record('fail', 'INTERNAL_POLICY_PACKAGES', `Sponsor policy packages ${policyPackageIds.join(', ')} do not match expected ${expectedRuntimeIds.join(', ')}`);
  }

  if (wranglerPolicies.length === 1) {
    record('ok', 'INTERNAL_WRANGLER_POLICY_COUNT', 'workers/sponsor-service/wrangler.toml defines exactly one app policy');
  } else {
    record('fail', 'INTERNAL_WRANGLER_POLICY_COUNT', `workers/sponsor-service/wrangler.toml defines ${wranglerPolicies.length} app policies`);
  }

  if (compareObjects(normalizedPolicy, normalizedWrangler)) {
    record('ok', 'INTERNAL_WRANGLER_MATCH', 'Worker wrangler APP_POLICIES matches the committed sponsor policy');
  } else {
    record('fail', 'INTERNAL_WRANGLER_MATCH', 'Worker wrangler APP_POLICIES does not match config/sponsorship/civilizationControlPolicy.ts');
  }

  if (compareArrays(testPackageIds, expectedRuntimeIds)) {
    record('ok', 'INTERNAL_TEST_EXPECTATIONS', 'Worker validation tests expect the committed runtime, compatibility, and CC packages');
  } else {
    record('fail', 'INTERNAL_TEST_EXPECTATIONS', `Worker validation tests expect ${testPackageIds.join(', ')}, but committed package set is ${expectedRuntimeIds.join(', ')}`);
  }

  if (compareArrays(validationExpectedPackageIds, expectedRuntimeIds)) {
    record('ok', 'INTERNAL_VALIDATION_SCRIPT', 'scripts/validate-sponsor-policy.mjs expects the committed world and CC runtime packages');
  } else {
    record('fail', 'INTERNAL_VALIDATION_SCRIPT', `scripts/validate-sponsor-policy.mjs expects ${validationExpectedPackageIds.join(', ')}, but committed runtime is ${expectedRuntimeIds.join(', ')}`);
  }

  if (moveDependencyModes.world === baseline.expectedMoveDependencyMode && moveDependencyModes.assets === baseline.expectedMoveDependencyMode) {
    record('ok', 'INTERNAL_MOVE_TOML_MODE', 'contracts/civilization_control/Move.toml still uses local vendor world/assets dependencies');
  } else {
    record('fail', 'INTERNAL_MOVE_TOML_MODE', `contracts/civilization_control/Move.toml dependency mode changed unexpectedly (world=${moveDependencyModes.world}, assets=${moveDependencyModes.assets})`);
  }

  if (moveLockSources.hasWorldLocalVendor && moveLockSources.hasAssetsLocalVendor) {
    record('ok', 'INTERNAL_MOVE_LOCK_MODE', 'contracts/civilization_control/Move.lock still references local vendor world/assets sources');
  } else {
    record('fail', 'INTERNAL_MOVE_LOCK_MODE', 'contracts/civilization_control/Move.lock no longer contains local vendor world/assets source entries');
  }

  if (chainWorldOriginal === baseline.auditedOriginalPackageId) {
    record('ok', 'INTERNAL_WORLD_ORIGINAL', 'config/chain/stillness.ts world original package matches the audited original package');
  } else {
    record('fail', 'INTERNAL_WORLD_ORIGINAL', `config/chain/stillness.ts WORLD_ORIGINAL_PACKAGE_ID (${chainWorldOriginal}) does not match the audited original package (${baseline.auditedOriginalPackageId})`);
  }

  const baselineDriftSeverity = modeAwareSeverity('warn', 'fail');

  if (vendor.publishedAt === baseline.auditedLatestRuntimePackageId) {
    record('ok', 'BASELINE_VENDOR_LATEST', 'Vendor Stillness published-at matches the audited latest runtime package');
  } else {
    record(baselineDriftSeverity, 'BASELINE_VENDOR_LATEST', `Vendor Stillness published-at (${vendor.publishedAt}) does not match the audited latest runtime package (${baseline.auditedLatestRuntimePackageId})`);
  }

  if (vendor.originalId === baseline.auditedOriginalPackageId) {
    record('ok', 'BASELINE_VENDOR_ORIGINAL', 'Vendor Stillness original-id matches the audited original package');
  } else {
    record(baselineDriftSeverity, 'BASELINE_VENDOR_ORIGINAL', `Vendor Stillness original-id (${vendor.originalId}) does not match the audited original package (${baseline.auditedOriginalPackageId})`);
  }

  if (vendor.version === baseline.auditedLatestVersion) {
    record('ok', 'BASELINE_VENDOR_VERSION', 'Vendor Stillness version matches the audited world version');
  } else {
    record(baselineDriftSeverity, 'BASELINE_VENDOR_VERSION', `Vendor Stillness version (${vendor.version}) does not match the audited world version (${baseline.auditedLatestVersion})`);
  }

  let mvrResult = null;
  try {
    mvrResult = await resolveMvrPackage({
      endpoint: options.mvrEndpoint ?? baseline.mvrEndpoint,
      packageName: options.mvrName ?? baseline.packageName,
      rpcUrl: chain.SUI_RPC_URL,
      timeoutMs: options.timeoutMs,
    });
  } catch (error) {
    mvrResult = {
      ok: false,
      endpoint: options.mvrEndpoint ?? baseline.mvrEndpoint,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (mvrResult.ok) {
    record('ok', 'MVR_RESOLUTION', `Resolved ${options.mvrName ?? baseline.packageName} via ${mvrResult.method}`);

    if (mvrResult.packageId === baseline.auditedLatestRuntimePackageId) {
      record('ok', 'BASELINE_MVR_LATEST', 'MVR latest package matches the audited latest runtime package');
    } else {
      record(baselineDriftSeverity, 'BASELINE_MVR_LATEST', `MVR latest package (${mvrResult.packageId}) does not match the audited latest runtime package (${baseline.auditedLatestRuntimePackageId})`);
    }

    if (mvrResult.packageId === vendor.publishedAt) {
      record('ok', 'BASELINE_MVR_VENDOR', 'MVR latest package matches vendor Published.toml Stillness published-at');
    } else {
      record(baselineDriftSeverity, 'BASELINE_MVR_VENDOR', `MVR latest package (${mvrResult.packageId}) does not match vendor Published.toml Stillness published-at (${vendor.publishedAt})`);
    }
  } else {
    record(modeAwareSeverity('warn', 'fail'), 'MVR_UNAVAILABLE', `Could not resolve ${options.mvrName ?? baseline.packageName} from ${mvrResult.endpoint}: ${mvrResult.error}`);
  }

  const knownPinnedRuntime =
    chainWorldRuntime === baseline.auditedOriginalPackageId
    && vendor.publishedAt === baseline.auditedLatestRuntimePackageId
    && chainWorldRuntime !== vendor.publishedAt;

  if (knownPinnedRuntime) {
    record('known', 'WORLD_MIGRATION_PENDING', `Committed runtime remains intentionally pinned to ${chainWorldRuntime} while latest audited/MVR world is ${vendor.publishedAt}; migration status is ${baseline.migrationStatus}`);
  }

  if (options.mode === 'strict') {
    if (!mvrResult.ok) {
      record('fail', 'STRICT_MVR_UNAVAILABLE', 'Strict mode requires live MVR resolution');
    } else {
      const strictExpectedPackageIds = uniqueSorted([mvrResult.packageId, chainWorldOriginal, chainCcRuntime]);
      if (chainWorldRuntime !== mvrResult.packageId) {
        record('fail', 'STRICT_RUNTIME_NOT_LATEST', `config/chain/stillness.ts WORLD_RUNTIME_PACKAGE_ID (${chainWorldRuntime}) is not aligned to MVR latest (${mvrResult.packageId})`);
      }
      if (constants.worldRuntime !== mvrResult.packageId) {
        record('fail', 'STRICT_RUNTIME_CONSTANT_NOT_LATEST', `src/constants.ts WORLD_RUNTIME_PACKAGE_ID (${constants.worldRuntime}) is not aligned to MVR latest (${mvrResult.packageId})`);
      }
      if (!compareArrays(policyPackageIds, strictExpectedPackageIds)) {
        record('fail', 'STRICT_POLICY_NOT_LATEST', `Sponsor policy packages (${policyPackageIds.join(', ')}) are not aligned to strict expected set (${strictExpectedPackageIds.join(', ')})`);
      }
      if (!compareArrays(wranglerPackageIds, strictExpectedPackageIds)) {
        record('fail', 'STRICT_WRANGLER_NOT_LATEST', `Worker wrangler packages (${wranglerPackageIds.join(', ')}) are not aligned to strict expected set (${strictExpectedPackageIds.join(', ')})`);
      }
      if (!compareArrays(testPackageIds, strictExpectedPackageIds)) {
        record('fail', 'STRICT_TEST_NOT_LATEST', `Worker validation tests still expect ${testPackageIds.join(', ')}, not strict expected set ${strictExpectedPackageIds.join(', ')}`);
      }
      if (!compareArrays(validationExpectedPackageIds, strictExpectedPackageIds)) {
        record('fail', 'STRICT_VALIDATION_SCRIPT_NOT_LATEST', `scripts/validate-sponsor-policy.mjs still expects ${validationExpectedPackageIds.join(', ')}, not strict expected set ${strictExpectedPackageIds.join(', ')}`);
      }
    }
  }

  const observedMvrPackage = mvrResult?.ok ? mvrResult.packageId : '(unresolved)';
  const observedMvrMethod = mvrResult?.ok ? mvrResult.method : 'none';

  console.log('World MVR Drift Report');
  console.log(`Mode: ${options.mode}`);
  console.log(`Chain key: ${chain.CHAIN_KEY}`);
  console.log(`Chain id: ${chain.CHAIN_ID}`);
  console.log(`MVR package: ${options.mvrName ?? baseline.packageName}`);
  console.log(`MVR endpoint: ${options.mvrEndpoint ?? baseline.mvrEndpoint}`);

  printSection('Current committed runtime package', [
    `- src/constants.ts WORLD_RUNTIME_PACKAGE_ID: ${constants.worldRuntime}`,
    `- config/chain/stillness.ts WORLD_RUNTIME_PACKAGE_ID: ${chainWorldRuntime}`,
  ]);
  printSection('Current committed original/type-origin package', [
    `- src/constants.ts WORLD_ORIGINAL_PACKAGE_ID: ${constants.worldOriginal}`,
    `- config/chain/stillness.ts WORLD_ORIGINAL_PACKAGE_ID: ${chainWorldOriginal}`,
  ]);
  printSection('Sponsor policy package', [
    `- config/sponsorship/civilizationControlPolicy.ts world packages: ${policyWorldPackages.join(', ') || '(missing)'}`,
  ]);
  printSection('Worker config package', [
    `- workers/sponsor-service/wrangler.toml world packages: ${wranglerWorldPackages.join(', ') || '(missing)'}`,
  ]);
  printSection('Test package expectations', [
    `- workers/sponsor-service/src/__tests__/validation.test.ts package ids: ${testPackageIds.join(', ') || '(missing)'}`,
    `- scripts/validate-sponsor-policy.mjs package ids: ${validationExpectedPackageIds.join(', ') || '(missing)'}`,
  ]);
  printSection('Vendor Published.toml latest/original', [
    `- ${baseline.vendorPublishedSection} published-at: ${vendor.publishedAt}`,
    `- ${baseline.vendorPublishedSection} original-id: ${vendor.originalId}`,
    `- ${baseline.vendorPublishedSection} version: ${vendor.version}`,
  ]);
  printSection('MVR latest, if resolved', [
    `- resolved package: ${observedMvrPackage}`,
    `- resolution method: ${observedMvrMethod}`,
  ]);
  printSection('Checks', checks.map((item) => `- [${item.severity}] ${item.code} ${item.message}`));

  console.log('\nKnown drift');
  renderList(knownDrift, 'none');

  console.log('\nErrors');
  renderList(errors, 'none');

  console.log('\nWarnings');
  renderList(warnings, 'none');

  const verdict = errors.length > 0 ? 'fail' : warnings.length > 0 || knownDrift.length > 0 ? 'warn' : 'pass';
  const exitCode = errors.length > 0 ? 1 : 0;
  console.log(`\nRESULT=${verdict} MODE=${options.mode} FAILURES=${errors.length} WARNINGS=${warnings.length + knownDrift.length} EXIT=${exitCode}`);
  process.exitCode = exitCode;
}

main().catch((error) => {
  if (error instanceof DriftConfigError) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = 70;
    return;
  }

  console.error(`Internal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 70;
});