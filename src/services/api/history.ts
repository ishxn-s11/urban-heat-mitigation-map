import { request, post, DEMO_MODE } from "./client";
import { timeline, satelliteForYear } from "./demo/mockBackend";
import type { MissionEra, TimelinePoint } from "@/types";

export interface HistoryFrame {
  timestamp: string;
  variable: string;
  provenance: {
    satellite: string;
    sensor: string;
    dataset: string;
    provider: string;
    cloud_cover: number;
    resolution: string;
    processing_level: string;
  };
  statistics: { mean: number; minimum: number; maximum: number; p95: number };
  scenario_type: string;
}

export async function getHistoryAvailability(): Promise<{ earliest_year: number; lst_earliest_year: number; eras: MissionEra[] }> {
  if (DEMO_MODE) {
    return {
      earliest_year: 1972,
      lst_earliest_year: 1982,
      eras: [
        { label: "LANDSAT ARCHIVE", start_year: 1972, end_year: 1981, satellite: "Landsat 1–3", sensor: "MSS", dataset: "Landsat MSS Archive", resolution: "80 m", note: "imagery only — no surface-temperature product" },
        { label: "LANDSAT THERMAL PRODUCTS", start_year: 1982, end_year: 1998, satellite: "Landsat 4/5", sensor: "TM Band 6", dataset: "Landsat Collection 2 Level-2", resolution: "60–120 m", note: "surface temperature from TM thermal band" },
        { label: "LANDSAT 7 ERA", start_year: 1999, end_year: 2012, satellite: "Landsat 7", sensor: "ETM+ Band 6", dataset: "Landsat Collection 2 Level-2", resolution: "60 m", note: "SLC-off after 2003 lowers usable scenes" },
        { label: "LANDSAT 8/9 ERA", start_year: 2013, end_year: null, satellite: "Landsat 8/9", sensor: "OLI / TIRS", dataset: "Landsat Collection 2 Level-2", resolution: "30 m", note: "two-satellite constellation since 2021 — 8-day repeat" },
        { label: "TERRA / MODIS", start_year: 2000, end_year: null, satellite: "Terra", sensor: "MODIS", dataset: "MOD11A2", resolution: "1 km", note: "8-day LST/emissivity" },
        { label: "AQUA / MODIS", start_year: 2002, end_year: null, satellite: "Aqua", sensor: "MODIS", dataset: "MYD11A2", resolution: "1 km", note: "afternoon overpass" },
        { label: "SUOMI NPP / VIIRS", start_year: 2011, end_year: null, satellite: "Suomi NPP", sensor: "VIIRS", dataset: "VNP21A2", resolution: "1 km", note: "daily global LST" },
        { label: "SENTINEL-3", start_year: 2016, end_year: null, satellite: "Sentinel-3A/B", sensor: "SLSTR", dataset: "Level-2 LST", resolution: "1 km", note: "global thermal continuity" },
        { label: "SENTINEL-2", start_year: 2015, end_year: null, satellite: "Sentinel-2A/B/C", sensor: "MSI", dataset: "Level-2A", resolution: "10 m", note: "optical only — no thermal band" },
        { label: "ECOSTRESS / ISS", start_year: 2018, end_year: null, satellite: "ISS (platform)", sensor: "ECOSTRESS", dataset: "ECO2LSTE", resolution: "70 m", note: "dynamic availability" },
      ],
    };
  }
  return request("/api/v1/history/aoi/availability");
}

export async function getTimeline(): Promise<TimelinePoint[]> {
  if (DEMO_MODE) return timeline();
  return request("/api/v1/history/aoi/timeline");
}

export async function getFrame(year: number): Promise<HistoryFrame> {
  if (DEMO_MODE) {
    const { sat, sensor } = satelliteForYear(year);
    return {
      timestamp: `${year}-05-15T10:35:00Z`,
      variable: "lst",
      provenance: {
        satellite: sat,
        sensor,
        dataset:
          sat.includes("Landsat") ? "Landsat Collection 2 Level-2"
          : sat === "Terra" ? "MOD11A2"
          : sat === "Aqua" ? "MYD11A2"
          : sat.includes("NPP") ? "VNP21A2"
          : sat.includes("ECOSTRESS") ? "ECO2LSTE"
          : sat.includes("Sentinel-3") ? "Level-2 LST"
          : "Level-2",
        provider: sat.includes("Landsat") ? "USGS" : sat.includes("Sentinel") ? "Copernicus" : "NASA",
        cloud_cover: Math.round((3 + (year % 7) * 1.7) * 10) / 10,
        resolution: sat.includes("Landsat") ? "30 m" : sat.includes("ECOSTRESS") ? "70 m" : "1 km",
        processing_level: sat.includes("Landsat") ? "L2SP" : "Collection 6.1",
      },
      statistics: { mean: 41.2, minimum: 34.1, maximum: 45.8, p95: 44.6 },
      scenario_type: "DEMO",
    };
  }
  return request(`/api/v1/history/aoi/frame?year=${year}`);
}

export interface CompareResult {
  season_match: boolean;
  season_note: string;
  change: { delta_lst: number; delta_ndvi_pct: number; delta_built_up_pct: number };
  scenario_type: string;
}

export async function compareDates(dateA: string, dateB: string): Promise<CompareResult> {
  if (DEMO_MODE) {
    const seasonOf = (m: number) => (m <= 2 || m === 12 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "autumn");
    const sa = seasonOf(Number(dateA.slice(5, 7)));
    const sb = seasonOf(Number(dateB.slice(5, 7)));
    const ya = Number(dateA.slice(0, 4));
    const yb = Number(dateB.slice(0, 4));
    return {
      season_match: sa === sb,
      season_note: sa === sb ? `Both frames are ${sa} — seasonally fair comparison.` : `WARNING: '${sa}' vs '${sb}' — comparison conflates seasonal and long-term change.`,
      change: {
        delta_lst: Math.round((yb - ya) * 0.034 * 100) / 100,
        delta_ndvi_pct: -Math.round((yb - ya) * 0.18 * 10) / 10,
        delta_built_up_pct: Math.round((yb - ya) * 0.42 * 10) / 10,
      },
      scenario_type: "DEMO",
    };
  }
  return post("/api/v1/history/aoi/compare", { date_a: dateA, date_b: dateB });
}
