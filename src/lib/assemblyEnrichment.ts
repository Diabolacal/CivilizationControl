import { getSolarSystemById } from "@/lib/solarSystemCatalog";
import type { AssemblySummary, Structure, StructureType } from "@/types/domain";

const TYPE_LABELS: Record<StructureType, string> = {
  gate: "Gate",
  storage_unit: "Storage",
  turret: "Turret",
  network_node: "Network Node",
};

export function mergeAssemblySummaries(
  structures: Structure[],
  assembliesById: Map<string, AssemblySummary> | undefined,
): Structure[] {
  if (!assembliesById || assembliesById.size === 0) {
    return structures;
  }

  return structures.map((structure) => {
    if (!structure.assemblyId) return structure;

    const summary = assembliesById.get(structure.assemblyId);
    if (!summary) return structure;

    return {
      ...structure,
      name: shouldUseSummaryName(structure) && summary.name
        ? summary.name
        : structure.name,
      summary,
    };
  });
}

export function getAssemblySummarySolarSystemName(
  structure: Structure,
): string | undefined {
  const summarySolarSystemId = structure.summary?.solarSystemId;
  if (!summarySolarSystemId) return undefined;

  const parsedId = Number(summarySolarSystemId);
  if (!Number.isFinite(parsedId)) return undefined;

  return getSolarSystemById(parsedId)?.solarSystemName;
}

function shouldUseSummaryName(structure: Structure): boolean {
  const fallbackName = `${TYPE_LABELS[structure.type]} ${structure.objectId.slice(2, 10)}`;
  return structure.name === fallbackName;
}