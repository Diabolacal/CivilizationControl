import type { Structure } from "@/types/domain";

export interface StructurePowerActionSupport {
  label: "Bring online" | "Take offline";
  nextOnline: boolean;
  disabledReason: string | null;
  tone: "online" | "offline";
}

interface StructurePowerActionOptions {
  networkNodeOfflineAvailable?: boolean;
}

export function getStructurePowerAction(
  structure: Structure,
  options: StructurePowerActionOptions = {},
): StructurePowerActionSupport | null {
  if (structure.type === "network_node") {
    if (structure.status === "online" && !options.networkNodeOfflineAvailable) {
      return null;
    }

    return {
      label: structure.status === "online" ? "Take offline" : "Bring online",
      nextOnline: structure.status !== "online",
      disabledReason: null,
      tone: structure.status === "online" ? "offline" : "online",
    };
  }

  return {
    label: structure.status === "online" ? "Take offline" : "Bring online",
    nextOnline: structure.status !== "online",
    disabledReason: structure.networkNodeId ? null : "Missing node context.",
    tone: structure.status === "online" ? "offline" : "online",
  };
}

export function supportsStructureRename(structure: Structure): boolean {
  return ["gate", "network_node", "storage_unit", "turret"].includes(structure.type);
}