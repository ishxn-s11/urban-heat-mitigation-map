import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCities, getCity, createAOI2, fetchAOI, geocode, type AOICreateInput } from "@/services/api/cities";
import { getHeatSummary, getHotspots, getHotspotExplanation, inspectCell } from "@/services/api/heat";
import { runScenario, type ScenarioInput } from "@/services/api/scenarios";
import { runOptimization } from "@/services/api/optimization";
import { queryRag } from "@/services/api/rag";
import { getHistoryAvailability, getTimeline, getFrame, compareDates } from "@/services/api/history";
import { getModels } from "@/services/api/models";

export function useCities() {
  return useQuery({ queryKey: ["cities"], queryFn: getCities });
}

export function useCity(cityId: string) {
  return useQuery({ queryKey: ["city", cityId], queryFn: () => getCity(cityId) });
}

export function useAOI(aoiId: string) {
  return useQuery({ queryKey: ["aoi", aoiId], queryFn: () => fetchAOI(aoiId) });
}

export function useCreateAOI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AOICreateInput) => createAOI2(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aois"] }),
  });
}

export function useGeocode(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["geocode", query],
    queryFn: () => geocode(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useHeatSummary() {
  return useQuery({ queryKey: ["heatSummary"], queryFn: getHeatSummary });
}

export function useHotspots() {
  return useQuery({ queryKey: ["hotspots"], queryFn: getHotspots });
}

export function useHotspotExplanation(hotspotId: string | null) {
  return useQuery({
    queryKey: ["explanation", hotspotId],
    queryFn: () => getHotspotExplanation(hotspotId!),
    enabled: !!hotspotId,
  });
}

export function useCellInspection(index: number | null) {
  return useQuery({
    queryKey: ["cell", index],
    queryFn: () => inspectCell(index!),
    enabled: index !== null,
  });
}

export function useRunScenario() {
  return useMutation({ mutationFn: (input: ScenarioInput) => runScenario(input) });
}

export function useRunOptimization() {
  return useMutation({ mutationFn: (budget: number) => runOptimization(budget) });
}

export function useRagQuery() {
  return useMutation({ mutationFn: (question: string) => queryRag(question) });
}

export function useHistoryAvailability() {
  return useQuery({ queryKey: ["historyAvailability"], queryFn: getHistoryAvailability });
}

export function useHistoryTimeline() {
  return useQuery({ queryKey: ["historyTimeline"], queryFn: getTimeline });
}

export function useHistoryFrame(year: number) {
  return useQuery({ queryKey: ["historyFrame", year], queryFn: () => getFrame(year) });
}

export function useHistoryCompare(dateA: string, dateB: string, enabled: boolean) {
  return useQuery({
    queryKey: ["historyCompare", dateA, dateB],
    queryFn: () => compareDates(dateA, dateB),
    enabled,
  });
}

export function useModels() {
  return useQuery({ queryKey: ["models"], queryFn: getModels });
}
