export type StructurePowerErrorKind =
  | "network_node_already_offline"
  | "network_node_mismatch"
  | "target_already_in_state"
  | "not_online"
  | "no_fuel"
  | "not_authorized";

const NETWORK_NODE_ABORT_CODE_PATTERN = /network_node[\s\S]{0,160}(?:abort|code|MoveAbort)[\s\S]{0,60}\b7\b/i;

export function classifyStructurePowerError(raw: string): StructurePowerErrorKind | null {
  const normalized = raw.toLowerCase();

  if (
    raw.includes("ENetworkNodeOffline")
    || normalized.includes("network node is offline")
    || NETWORK_NODE_ABORT_CODE_PATTERN.test(raw)
  ) {
    return "network_node_already_offline";
  }

  if (raw.includes("ENetworkNodeMismatch")) return "network_node_mismatch";
  if (raw.includes("EAssemblyInvalidStatus")) return "target_already_in_state";
  if (raw.includes("ENotOnline")) return "not_online";
  if (raw.includes("ENoFuelToBurn")) return "no_fuel";
  if (raw.includes("NotAuthorized")) return "not_authorized";

  return null;
}

export function formatStructurePowerError(raw: string): string {
  switch (classifyStructurePowerError(raw)) {
    case "network_node_already_offline":
      return "Node is already offline. View updated.";
    case "network_node_mismatch":
      return "Wrong network node — structure may have moved.";
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