import { create } from "zustand";
import type { AreaOfInterest, Hotspot } from "@/types";

export type LayerId = "lst" | "heat-risk" | "ndvi" | "ndbi" | "ndwi" | "albedo" | "population";

interface AppState {
  aoi: AreaOfInterest | null;
  setAoi: (a: AreaOfInterest | null) => void;
  cityId: string;
  hotspotId: string | null;
  selectedHotspot: Hotspot | null;
  activeLayers: LayerId[];
  layer: LayerId;
  climate: string;
  selectedSolutionId: string | null;
  selectedScenarioId: string | null;
  timelineYear: number;
  setCity: (id: string) => void;
  selectHotspot: (h: Hotspot | null) => void;
  toggleLayer: (l: LayerId) => void;
  setLayer: (l: LayerId) => void;
  setClimate: (c: string) => void;
  selectSolution: (id: string | null) => void;
  selectScenario: (id: string | null) => void;
  setTimelineYear: (y: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  aoi: null,
  setAoi: (a) => set({ aoi: a, selectedHotspot: null, hotspotId: null }),
  cityId: "delhi",
  hotspotId: null,
  selectedHotspot: null,
  activeLayers: ["lst"],
  layer: "lst",
  climate: "semi-arid",
  selectedSolutionId: null,
  selectedScenarioId: null,
  timelineYear: 2026,
  setCity: (id) => set({ cityId: id }),
  selectHotspot: (h) => set({ selectedHotspot: h, hotspotId: h?.hotspot_id ?? null }),
  toggleLayer: (l) =>
    set((s) => ({
      activeLayers: s.activeLayers.includes(l) ? s.activeLayers.filter((x) => x !== l) : [...s.activeLayers, l],
    })),
  setLayer: (l) => set({ layer: l }),
  setClimate: (c) => set({ climate: c }),
  selectSolution: (id) => set({ selectedSolutionId: id }),
  selectScenario: (id) => set({ selectedScenarioId: id }),
  setTimelineYear: (y) => set({ timelineYear: y }),
}));
