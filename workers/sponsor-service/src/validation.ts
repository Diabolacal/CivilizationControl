/**
 * Transaction intent validation for the CivilizationControl sponsor service.
 */

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface AuditEntry {
  event:
    | 'sponsor_request'
    | 'sponsor_rejected'
    | 'sponsor_approved'
    | 'sponsor_error';
  timestamp: string;
  ip: string;
  sender: string;
  app?: string;
  commandKinds?: string[];
  reason?: string;
}

export interface AppPolicyConfig {
  id: string;
  packages?: Record<string, Record<string, string[]>>;
  packageId?: string;
  targets?: Record<string, string[]>;
  maxCommands?: number;
}

export interface AppPolicy {
  id: string;
  packages: Map<string, Map<string, Set<string>>>;
  maxCommands: number;
}

export const DEFAULT_MAX_COMMANDS = 6;
export const ABSOLUTE_MAX_COMMANDS = 250;
export const ALLOWED_COMMAND_KINDS = new Set([
  'MoveCall',
  'SplitCoins',
  'MergeCoins',
  'MakeMoveVec',
]);
export const MAX_BODY_BYTES = 524_288;
export const MAX_REQUEST_AGE_MS = 60_000;

const OWNER_CAP_PROTECTED_ACTIONS = new Map<string, Set<string>>([
  ['assembly', new Set(['update_metadata_name', 'online', 'offline'])],
  ['gate', new Set(['authorize_extension', 'update_metadata_name', 'update_metadata_url', 'online', 'offline'])],
  ['storage_unit', new Set(['authorize_extension', 'update_metadata_name', 'update_metadata_url', 'online', 'offline'])],
  ['turret', new Set(['authorize_extension', 'update_metadata_name', 'online', 'offline'])],
  ['network_node', new Set(['update_metadata_name', 'online'])],
  ['posture', new Set(['set_posture'])],
  ['gate_control', new Set(['set_policy_preset', 'remove_policy_preset', 'set_treasury'])],
]);

const NODE_OFFLINE_TAIL_ACTIONS = new Map<string, Set<string>>([
  ['assembly', new Set(['offline_connected_assembly'])],
  ['gate', new Set(['offline_connected_gate'])],
  ['storage_unit', new Set(['offline_connected_storage_unit'])],
  ['turret', new Set(['offline_connected_turret'])],
]);

interface MoveCallShape {
  module: string;
  functionName: string;
  kind:
    | 'borrow-owner-cap'
    | 'return-owner-cap'
    | 'owner-cap-action'
    | 'node-offline'
    | 'node-offline-tail'
    | 'destroy-offline-assemblies'
    | 'generic';
}

type OpenOwnerCapSequence = 'borrowed' | 'generic-action' | 'node-offline';

function classifyMoveCall(moduleName: string, functionName: string): MoveCallShape['kind'] {
  if (moduleName === 'character' && functionName === 'borrow_owner_cap') {
    return 'borrow-owner-cap';
  }

  if (moduleName === 'character' && functionName === 'return_owner_cap') {
    return 'return-owner-cap';
  }

  if (moduleName === 'network_node' && functionName === 'offline') {
    return 'node-offline';
  }

  if (moduleName === 'network_node' && functionName === 'destroy_offline_assemblies') {
    return 'destroy-offline-assemblies';
  }

  if (NODE_OFFLINE_TAIL_ACTIONS.get(moduleName)?.has(functionName)) {
    return 'node-offline-tail';
  }

  if (OWNER_CAP_PROTECTED_ACTIONS.get(moduleName)?.has(functionName)) {
    return 'owner-cap-action';
  }

  return 'generic';
}

function validateMoveCallShape(
  commands: Array<{ $kind: string; [key: string]: unknown }>,
): ValidationResult {
  let openSequence: OpenOwnerCapSequence | null = null;
  let awaitingNodeOfflineDestroy = false;

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];

    if (command.$kind !== 'MoveCall') {
      if (openSequence || awaitingNodeOfflineDestroy) {
        return {
          valid: false,
          reason: `Command ${index} (${command.$kind}) is not allowed inside a protected sequence`,
        };
      }

      continue;
    }

    const call = command.MoveCall as {
      package: string;
      module: string;
      function: string;
    };

    const moveCall: MoveCallShape = {
      module: call.module,
      functionName: call.function,
      kind: classifyMoveCall(call.module, call.function),
    };

    switch (moveCall.kind) {
      case 'borrow-owner-cap':
        if (openSequence || awaitingNodeOfflineDestroy) {
          return {
            valid: false,
            reason: `Command ${index}: borrow_owner_cap cannot start inside another protected sequence`,
          };
        }

        openSequence = 'borrowed';
        break;

      case 'return-owner-cap':
        if (!openSequence) {
          return {
            valid: false,
            reason: `Command ${index}: return_owner_cap without an active borrow_owner_cap`,
          };
        }

        if (openSequence === 'borrowed') {
          return {
            valid: false,
            reason: `Command ${index}: return_owner_cap must follow an allowed protected action`,
          };
        }

        awaitingNodeOfflineDestroy = openSequence === 'node-offline';
        openSequence = null;
        break;

      case 'owner-cap-action':
        if (!openSequence) {
          return {
            valid: false,
            reason: `Command ${index}: ${moveCall.module}::${moveCall.functionName} requires borrow_owner_cap`,
          };
        }

        if (openSequence === 'node-offline') {
          return {
            valid: false,
            reason: `Command ${index}: network_node::offline must be returned before other protected actions`,
          };
        }

        openSequence = 'generic-action';
        break;

      case 'node-offline':
        if (!openSequence) {
          return {
            valid: false,
            reason: `Command ${index}: network_node::offline requires borrow_owner_cap`,
          };
        }

        if (openSequence !== 'borrowed') {
          return {
            valid: false,
            reason: `Command ${index}: network_node::offline must be the first protected action after borrow_owner_cap`,
          };
        }

        openSequence = 'node-offline';
        break;

      case 'node-offline-tail':
        if (openSequence || !awaitingNodeOfflineDestroy) {
          return {
            valid: false,
            reason: `Command ${index}: ${moveCall.functionName} is only allowed after network_node::offline and return_owner_cap`,
          };
        }

        break;

      case 'destroy-offline-assemblies':
        if (openSequence || !awaitingNodeOfflineDestroy) {
          return {
            valid: false,
            reason: `Command ${index}: destroy_offline_assemblies requires an active network_node::offline teardown`,
          };
        }

        awaitingNodeOfflineDestroy = false;
        break;

      case 'generic':
        if (openSequence || awaitingNodeOfflineDestroy) {
          return {
            valid: false,
            reason: `Command ${index}: ${moveCall.module}::${moveCall.functionName} is not allowed inside a protected sequence`,
          };
        }

        break;

      default:
        break;
    }
  }

  if (openSequence) {
    return {
      valid: false,
      reason: 'OwnerCap sequence missing return_owner_cap',
    };
  }

  if (awaitingNodeOfflineDestroy) {
    return {
      valid: false,
      reason: 'network_node::offline sequence missing destroy_offline_assemblies',
    };
  }

  return { valid: true };
}

export function parseAppPolicies(configs: AppPolicyConfig[]): AppPolicy[] {
  if (!Array.isArray(configs) || configs.length === 0) {
    return [];
  }

  return configs.map((config) => {
    const rawPackages: Record<string, Record<string, string[]>> =
      config.packages ??
      (config.packageId && config.targets ? { [config.packageId]: config.targets } : {});

    const packages = new Map<string, Map<string, Set<string>>>();
    for (const [packageId, targets] of Object.entries(rawPackages)) {
      packages.set(
        packageId.toLowerCase(),
        new Map(
          Object.entries(targets).map(([moduleName, functions]) => [
            moduleName,
            new Set(functions),
          ]),
        ),
      );
    }

    return {
      id: config.id,
      packages,
      maxCommands: Math.min(config.maxCommands ?? DEFAULT_MAX_COMMANDS, ABSOLUTE_MAX_COMMANDS),
    };
  });
}

export function containsGasCoinReference(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsGasCoinReference(item));
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.$kind === 'GasCoin') {
    return true;
  }

  return Object.values(candidate).some(
    (item) => typeof item === 'object' && item !== null && containsGasCoinReference(item),
  );
}

export function validateCommands(
  commands: Array<{ $kind: string; [key: string]: unknown }>,
  policies: AppPolicy[],
): ValidationResult & { matchedApp?: string } {
  if (!Array.isArray(commands) || commands.length === 0) {
    return { valid: false, reason: 'Empty transaction' };
  }

  if (commands.length > ABSOLUTE_MAX_COMMANDS) {
    return {
      valid: false,
      reason: `Too many commands (${commands.length}/${ABSOLUTE_MAX_COMMANDS})`,
    };
  }

  let matchedPolicy: AppPolicy | null = null;

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    const kind = command.$kind;

    if (!ALLOWED_COMMAND_KINDS.has(kind)) {
      return { valid: false, reason: `Disallowed command kind: ${kind}` };
    }

    if (containsGasCoinReference(command)) {
      return {
        valid: false,
        reason: `Command ${index} (${kind}) references GasCoin`,
      };
    }

    if (kind === 'MoveCall') {
      const call = command.MoveCall as {
        package: string;
        module: string;
        function: string;
      };

      if (!call || typeof call !== 'object') {
        return { valid: false, reason: `Command ${index}: malformed MoveCall` };
      }

      const packageId = call.package.toLowerCase();
      const policy = policies.find((candidate) => candidate.packages.has(packageId));
      if (!policy) {
        return { valid: false, reason: `Disallowed package in command ${index}` };
      }

      if (matchedPolicy && matchedPolicy.id !== policy.id) {
        return { valid: false, reason: 'Cross-app calls not allowed' };
      }

      matchedPolicy = policy;
      const packageTargets = policy.packages.get(packageId)!;
      const allowedFunctions = packageTargets.get(call.module);
      if (!allowedFunctions) {
        return { valid: false, reason: `Disallowed module: ${call.module}` };
      }

      if (!allowedFunctions.has(call.function)) {
        return { valid: false, reason: `Disallowed function: ${call.function}` };
      }
    }
  }

  if (!matchedPolicy) {
    return { valid: false, reason: 'No MoveCall commands' };
  }

  if (commands.length > matchedPolicy.maxCommands) {
    return {
      valid: false,
      reason: `Too many commands (${commands.length}/${matchedPolicy.maxCommands})`,
    };
  }

  const shapeValidation = validateMoveCallShape(commands);
  if (!shapeValidation.valid) {
    return shapeValidation;
  }

  return { valid: true, matchedApp: matchedPolicy.id };
}

export function auditLog(entry: AuditEntry): void {
  console.log(JSON.stringify(entry));
}