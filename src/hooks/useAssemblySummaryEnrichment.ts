import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { mergeAssemblySummaries } from "@/lib/assemblyEnrichment";
import { fetchAssemblySummaryLookup } from "@/lib/assemblySummaryClient";
import type { Structure } from "@/types/domain";

export function useAssemblySummaryEnrichment(structures: Structure[]) {
  const assemblyIds = useMemo(
    () => structures.flatMap((structure) => structure.assemblyId ? [structure.assemblyId] : []),
    [structures],
  );

  const query = useQuery({
    queryKey: ["assemblySummaryEnrichment", assemblyIds],
    queryFn: () => fetchAssemblySummaryLookup(assemblyIds),
    enabled: assemblyIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const enrichedStructures = useMemo(
    () => mergeAssemblySummaries(structures, query.data?.assembliesById),
    [structures, query.data?.assembliesById],
  );

  return {
    structures: enrichedStructures,
    summaryLookup: query.data ?? null,
  };
}