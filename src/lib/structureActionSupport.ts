import type { Structure } from "@/types/domain";

export interface StructurePowerActionSupport {
  label: "Bring Online" | "Take Offline";
  nextOnline: boolean;
  disabledReason: string | null;
  tone: "online" | "offline";
}

export function getStructurePowerAction(structure: Structure): StructurePowerActionSupport | null {
  if (structure.type === "network_node") {
    if (structure.status === "online") {
      return null;
    }

    return {
      label: "Bring Online",
      nextOnline: true,
      disabledReason: null,
      tone: "online",
    };
  }

  return {
    label: structure.status === "online" ? "Take Offline" : "Bring Online",
    nextOnline: structure.status !== "online",
    disabledReason: structure.networkNodeId ? null : "Missing node context.",
    tone: structure.status === "online" ? "offline" : "online",
  };
}

export function supportsStructureRename(structure: Structure): boolean {
  return ["gate", "network_node", "storage_unit", "turret"].includes(structure.type);
}