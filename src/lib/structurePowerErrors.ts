export type StructurePowerErrorKind =
  | "network_node_already_offline"
  | "network_node_mismatch"
  | "target_already_offline"
  | "target_invalid_online_state"
  | "target_already_in_state"
  | "not_online"
  | "no_fuel"
  | "not_authorized";

const NETWORK_NODE_ABORT_CODE_PATTERN = /network_node[\s\S]{0,160}(?:abort|code|MoveAbort)[\s\S]{0,60}\b7\b/i;
const STATUS_OFFLINE_FRAME_PATTERN = /(?:^|[:'"`\s])status::offline\b/i;
const STATUS_ONLINE_FRAME_PATTERN = /(?:^|[:'"`\s])status::online\b/i;

export interface StructurePowerErrorContext {
  desiredStatus?: "online" | "offline" | null;
}

export function getMoveAbortCommandIndex(raw: string): number | null {
  const ordinalMatch = raw.match(/MoveAbort\s+in\s+(\d+)(?:st|nd|rd|th)\s+command/i);
  if (ordinalMatch?.[1]) {
    const ordinal = Number.parseInt(ordinalMatch[1], 10);
    return Number.isFinite(ordinal) && ordinal > 0 ? ordinal - 1 : null;
  }

  const indexedMatch = raw.match(/MoveAbort\s+in\s+command\s+(\d+)/i);
  if (indexedMatch?.[1]) {
    const index = Number.parseInt(indexedMatch[1], 10);
    return Number.isFinite(index) && index >= 0 ? index : null;
  }

  return null;
}

export function classifyStructurePowerError(
  raw: string,
  context: StructurePowerErrorContext = {},
): StructurePowerErrorKind | null {
  const normalized = raw.toLowerCase();

  if (
    raw.includes("ENetworkNodeOffline")
    || normalized.includes("network node is offline")
    || NETWORK_NODE_ABORT_CODE_PATTERN.test(raw)
  ) {
    return "network_node_already_offline";
  }

  if (raw.includes("ENetworkNodeMismatch")) return "network_node_mismatch";
  if (raw.includes("EAssemblyInvalidStatus")) {
    if (context.desiredStatus === "offline" && STATUS_OFFLINE_FRAME_PATTERN.test(raw)) {
      return "target_already_offline";
    }

    if (context.desiredStatus === "online" && STATUS_ONLINE_FRAME_PATTERN.test(raw)) {
      return "target_invalid_online_state";
    }

    return "target_already_in_state";
  }
  if (raw.includes("ENotOnline")) return "not_online";
  if (raw.includes("ENoFuelToBurn")) return "no_fuel";
  if (raw.includes("NotAuthorized")) return "not_authorized";

  return null;
}

export function formatStructurePowerError(
  raw: string,
  context: StructurePowerErrorContext = {},
): string {
  switch (classifyStructurePowerError(raw, context)) {
    case "network_node_already_offline":
      return "Node is already offline. View updated.";
    case "network_node_mismatch":
      return "Wrong network node — structure may have moved.";
    case "target_already_offline":
      return "Already offline. View updated.";
    case "target_invalid_online_state":
      return "Cannot bring online from current chain status.";
    case "target_already_in_state":
      return "Structure is already in the target state.";
    case "not_online":
      return "Structure is not online.";
    case "no_fuel":
      return "No fuel deposited — node cannot come online.";
    case "not_authorized":
      return "OwnerCap does not match this structure.";
    default:
      return raw;
  }
}