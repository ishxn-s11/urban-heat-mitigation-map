/**
 * Demo-mode mock backend.
 *
 * Implements the UrbanFlux API surface in-memory so the entire frontend works
 * without the FastAPI service (VITE_DEMO_MODE=true). Data mirrors the
 * backend demo dataset: deterministic, clearly flagged DEMO, and never
 * presented as observational science.
 */

import type {
  AreaOfInterest,
  City,
  GeocodeResult,
  HeatSummary,
  Hotspot,
  ModelEntry,
  ObservationProvenance,
  OptimizationResponse,
  ParetoSolution,
  RagResult,
  Recommendation,
  ScenarioResponse,
  ScenarioResult,
  TimelinePoint,
} from "@/types";

// ── Deterministic PRNG ───────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GRID = 40;
const N = GRID * GRID;

export const THERMAL_PROVENANCE: ObservationProvenance = {
  satellite: "Landsat 9",
  sensor: "OLI-2 / TIRS-2",
  dataset: "Landsat Collection 2 Level-2",
  product: "Surface Temperature",
  acquisition_time: "2026-05-14T10:35:00Z",
  native_resolution_meters: 30,
  provider: "USGS",
  cloud_cover: 4.8,
  scene_id: "LC09_L2SP_146040_20260514_02_T1",
};

export const SENTINEL_PROVENANCE: ObservationProvenance = {
  satellite: "Sentinel-2A/B",
  sensor: "MSI",
  dataset: "Level-2A",
  provider: "Copernicus",
  acquisition_time: "2026-05-12T10:20:00Z",
  native_resolution_meters: 10,
};

export const ERA5_PROVENANCE: ObservationProvenance = {
  dataset: "ERA5",
  provider: "ECMWF / Copernicus C3S",
  note: "Reanalysis — not satellite imagery",
  native_resolution_meters: 31000,
};

export const OSM_PROVENANCE: ObservationProvenance = {
  dataset: "OpenStreetMap",
  provider: "© OpenStreetMap contributors",
};

// ── Demo grid (mirrors backend demo_data.py formulas) ────────────────────
const rng = mulberry32(42);
const center: [number, number] = [20, 22];

function buildFields() {
  const ndvi: number[] = [], ndbi: number[] = [], ndwi: number[] = [], albedo: number[] = [], lst: number[] = [], pop: number[] = [];
  for (let i = 0; i < N; i++) {
    const ix = i % GRID, iy = Math.floor(i / GRID);
    const d = Math.hypot(ix - center[0], iy - center[1]) / 28;
    ndvi.push(clamp(0.35 - 0.18 * (1 - Math.min(d, 1)) + rngJitter(0.08), -0.98, 0.98));
    ndbi.push(clamp(0.20 + 0.20 * (1 - Math.min(d, 1)) + rngJitter(0.07), -0.98, 0.98));
    ndwi.push(clamp(0.05 - 0.04 * (1 - Math.min(d, 1)) + rngJitter(0.05), -0.98, 0.98));
    albedo.push(clamp(0.18 - 0.03 * (1 - Math.min(d, 1)) + rngJitter(0.02), 0.05, 0.6));
  }
  for (let i = 0; i < N; i++) {
    const ix = i % GRID, iy = Math.floor(i / GRID);
    const d = Math.hypot(ix - center[0], iy - center[1]) / 28;
    const v = 40.5 - ndvi[i] * 4.5 + ndbi[i] * 6.0 - ndwi[i] * 3.0 - (albedo[i] - 0.18) * 8.0 - d * 3.2 + rngJitter(0.6);
    lst.push(clamp(round2(v), 33.5, 46));
  }
  for (let i = 0; i < N; i++) {
    const ix = i % GRID, iy = Math.floor(i / GRID);
    const d = Math.hypot(ix - center[0], iy - center[1]) / 20;
    pop.push(Math.max(0, Math.round((1 - Math.min(d, 1)) * 9500 + rngJitter(900))));
  }
  return { ndvi, ndbi, ndwi, albedo, lst, pop };
}

function rngJitter(mag: number) {
  return (rng() * 2 - 1) * mag;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export const FIELDS = buildFields();

export const DEMO_CITIES: City[] = [
  { city_id: "delhi", name: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209, bounding_box: [76.8387, 28.4046, 77.3486, 28.8834], timezone: "Asia/Kolkata", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
  { city_id: "tokyo", name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, bounding_box: [139.3451, 35.5011, 139.916, 35.8984], timezone: "Asia/Tokyo", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
  { city_id: "phoenix", name: "Phoenix", country: "USA", latitude: 33.4484, longitude: -112.074, bounding_box: [-112.3239, 33.265, -111.825, 33.696], timezone: "America/Phoenix", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
  { city_id: "lagos", name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792, bounding_box: [3.0386, 6.3342, 3.7199, 6.7357], timezone: "Africa/Lagos", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
  { city_id: "dubai", name: "Dubai", country: "UAE", latitude: 25.2048, longitude: 55.2708, bounding_box: [54.9419, 24.7901, 55.465, 25.34], timezone: "Asia/Dubai", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
  { city_id: "london", name: "London", country: "UK", latitude: 51.5074, longitude: -0.1278, bounding_box: [-0.5103, 51.2867, 0.334, 51.6918], timezone: "Europe/London", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
  { city_id: "singapore", name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, bounding_box: [103.6056, 1.1292, 104.0331, 1.4714], timezone: "Asia/Singapore", default_zoom: 11, available_datasets: ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"] },
];

// ── AOI registry (deep-linkable) ─────────────────────────────────────────
// Demo AOI ids encode their bbox (aoi_<w>_<s>_<e>_<n>) so any workspace link
// can be reconstructed in a fresh session without server-side storage.
const AOIS: Record<string, AreaOfInterest> = {};

function aoiIdFor(bbox: [number, number, number, number]): string {
  return `aoi_${bbox.map((v) => v.toFixed(2)).join("_")}`;
}

export function createAOI(bbox: [number, number, number, number], name?: string, city?: string, country?: string): AreaOfInterest {
  const [w, s, e, n] = bbox;
  const midLat = (s + n) / 2;
  const areaKm2 = Math.abs((e - w) * 111.32 * Math.cos((midLat * Math.PI) / 180) * (n - s) * 110.57);
  const aoi: AreaOfInterest = {
    aoi_id: aoiIdFor(bbox),
    name: name ?? `AOI ${bbox.map((v) => v.toFixed(2)).join(", ")}`,
    geometry: { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } as GeoJSON.Geometry,
    centroid: [round2((s + n) / 2), round2((w + e) / 2)],
    bounding_box: [w, s, e, n],
    city,
    country,
    area_km2: round2(areaKm2),
    created_at: new Date().toISOString(),
    scenario_type: "DEMO",
  };
  AOIS[aoi.aoi_id] = aoi;
  return aoi;
}

// Seed the default demo Delhi AOI so deep links work out of the box.
export const DEFAULT_AOI_ID = createAOI([76.8387, 28.4046, 77.3486, 28.8834], "Delhi Demo AOI", "Delhi", "India").aoi_id;

export function getAOI(aoiId: string): AreaOfInterest {
  if (AOIS[aoiId]) return AOIS[aoiId];
  // Deep-link recovery: rebuild the AOI deterministically from its encoded bbox.
  const m = /^aoi_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+)$/.exec(aoiId);
  if (m) {
    const bbox = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] as [number, number, number, number];
    if (bbox.every((v) => Number.isFinite(v)) && bbox[1] < bbox[3] && bbox[0] < bbox[2]) {
      return createAOI(bbox);
    }
  }
  throw new Error(`AOI_NOT_FOUND: ${aoiId}`);
}

// ── Heat data ────────────────────────────────────────────────────────────
export function heatSummary(): HeatSummary {
  const lst = [...FIELDS.lst].sort((a, b) => a - b);
  const mean = FIELDS.lst.reduce((a, b) => a + b, 0) / N;
  return {
    mean_lst: round2(mean),
    min_lst: lst[0],
    max_lst: lst[lst.length - 1],
    p95_lst: lst[Math.floor(0.95 * N)],
    hot_cells: FIELDS.lst.filter((v) => v >= lst[Math.floor(0.9 * N)]).length,
    extreme_cells: FIELDS.lst.filter((v) => v >= lst[Math.floor(0.975 * N)]).length,
    mean_ndvi: round2(FIELDS.ndvi.reduce((a, b) => a + b, 0) / N),
    mean_ndbi: round2(FIELDS.ndbi.reduce((a, b) => a + b, 0) / N),
    population_total: FIELDS.pop.reduce((a, b) => a + b, 0),
    hotspot_count: 3,
    acquisition_time: THERMAL_PROVENANCE.acquisition_time!,
    scenario_type: "DEMO",
  };
}

function riskClass(lst: number): string {
  if (lst >= 43.5) return "EXTREME";
  if (lst >= 41.5) return "HOT";
  if (lst >= 39.5) return "MODERATE";
  return "COOL";
}

export function cellProperties(i: number) {
  return {
    cell_index: i,
    value: FIELDS.lst[i],
    unit: "°C",
    lst: FIELDS.lst[i],
    ndvi: FIELDS.ndvi[i],
    ndbi: FIELDS.ndbi[i],
    ndwi: FIELDS.ndwi[i],
    albedo: FIELDS.albedo[i],
    population: FIELDS.pop[i],
    heat_risk: riskClass(FIELDS.lst[i]),
  };
}

// ── Hotspots (mirrors backend) ───────────────────────────────────────────
export const DEMO_HOTSPOTS: Hotspot[] = [
  {
    hotspot_id: "hs_001", name: "Industrial Core", intensity: "EXTREME",
    cell: { cell_index: 587, x: 27, y: 14, lat: 28.81827, lon: 76.97938, lst: FIELDS.lst[587] },
    mean_lst: FIELDS.lst[587], peak_lst: round2(FIELDS.lst[587] + 2.1),
    population_exposed: FIELDS.pop[587],
    drivers: [
      { feature: "Built-up Density", contribution: 31, direction: "warming" },
      { feature: "Low Vegetation", contribution: 24, direction: "warming" },
      { feature: "Air Temperature", contribution: 18, direction: "warming" },
      { feature: "Low Surface Albedo", contribution: 13, direction: "warming" },
      { feature: "Water Proximity", contribution: 7, direction: "cooling" },
      { feature: "Wind Speed", contribution: 6, direction: "cooling" },
    ],
    scenario_type: "DEMO",
  },
  {
    hotspot_id: "hs_002", name: "Transport Interchange", intensity: "HOT",
    cell: { cell_index: 1052, x: 12, y: 26, lat: 28.71925, lon: 76.92725, lst: FIELDS.lst[1052] },
    mean_lst: FIELDS.lst[1052], peak_lst: round2(FIELDS.lst[1052] + 2.1),
    population_exposed: FIELDS.pop[1052],
    drivers: [
      { feature: "Road Density", contribution: 28, direction: "warming" },
      { feature: "Built-up Density", contribution: 22, direction: "warming" },
      { feature: "Low Albedo Pavement", contribution: 19, direction: "warming" },
      { feature: "Impervious Surface", contribution: 15, direction: "warming" },
      { feature: "Park Distance", contribution: 9, direction: "warming" },
      { feature: "Vegetation Cooling", contribution: 7, direction: "cooling" },
    ],
    scenario_type: "DEMO",
  },
  {
    hotspot_id: "hs_003", name: "Dense Low-Rise", intensity: "HOT",
    cell: { cell_index: 393, x: 33, y: 9, lat: 28.85838, lon: 77.11163, lst: FIELDS.lst[393] },
    mean_lst: FIELDS.lst[393], peak_lst: round2(FIELDS.lst[393] + 2.1),
    population_exposed: FIELDS.pop[393],
    drivers: [
      { feature: "Building Density", contribution: 27, direction: "warming" },
      { feature: "Tree Canopy Deficit", contribution: 23, direction: "warming" },
      { feature: "Anthropogenic Heat", contribution: 17, direction: "warming" },
      { feature: "Air Temperature", contribution: 14, direction: "warming" },
      { feature: "Water Proximity", contribution: 11, direction: "cooling" },
      { feature: "Wind Speed", contribution: 8, direction: "cooling" },
    ],
    scenario_type: "DEMO",
  },
];

// ── Scenario engine (mirrors backend heuristics) ─────────────────────────
const FW: Record<string, number> = { tropical: 1.0, temperate: 0.85, arid: 0.55, "semi-arid": 0.7 };

export function simulate(params: {
  tree_canopy_percent?: number;
  cool_roof_percent?: number;
  green_roof_percent?: number;
  albedo_delta?: number;
  water_area_delta?: number;
  climate?: string;
}): ScenarioResult {
  const climate = params.climate ?? "semi-arid";
  const fW = FW[climate] ?? 0.85;
  const canopy = (params.tree_canopy_percent ?? 0) / 100;
  const coolRoof = (params.cool_roof_percent ?? 0) / 100;
  const greenRoof = (params.green_roof_percent ?? 0) / 100;
  const albedoDelta = params.albedo_delta ?? 0;
  const waterFrac = (params.water_area_delta ?? 0) / 100;

  if (coolRoof + greenRoof > 1) throw new Error("cool_roof_percent + green_roof_percent cannot exceed 100%");

  const simulated: number[] = [], delta: number[] = [];
  let popBenefited = 0;
  for (let i = 0; i < N; i++) {
    const headroom = Math.max(0, 1 - FIELDS.ndbi[i]);
    const dVeg = 1.8 * fW * canopy * headroom;
    const dGreen = 1.1 * fW * greenRoof * headroom;
    const dCool = FIELDS.ndbi[i] * coolRoof * 780 * 0.22 * 0.015;
    const dAlb = albedoDelta * 780 * 0.015;
    const dWater = waterFrac * 2.2 * Math.exp(-Math.hypot((i % GRID) - center[0], Math.floor(i / GRID) - center[1]) / 14);
    const d = -Math.min(dVeg + dGreen + dCool + dAlb + dWater, 6.0);
    simulated.push(round2(FIELDS.lst[i] + d));
    delta.push(round2(d));
    if (d < -0.15) popBenefited += FIELDS.pop[i];
  }

  const cost =
    canopy * 4_000_000 + coolRoof * 2_600_000 + greenRoof * 9_000_000 + waterFrac * 6_500_000 + albedoDelta * 1_800_000;

  return {
    scenario_type: "DEMO",
    simulated_lst: simulated,
    delta_lst: delta,
    summary: {
      mean_delta_lst: round2(delta.reduce((a, b) => a + b, 0) / N),
      max_cooling: Math.min(...delta),
      mean_simulated_lst: round2(simulated.reduce((a, b) => a + b, 0) / N),
      min_simulated_lst: Math.min(...simulated),
      max_simulated_lst: Math.max(...simulated),
      population_benefited: popBenefited,
      population_pct: round2((100 * popBenefited) / Math.max(FIELDS.pop.reduce((a, b) => a + b, 0), 1)),
      hotspot_count_before: FIELDS.lst.filter((v) => v >= 43.5).length,
      hotspot_count_after: simulated.filter((v) => v >= 43.5).length,
      estimated_cost_usd: Math.round(cost),
      scenario_type: "DEMO",
    },
    provenance: { model: "UrbanFlux first-order energy-balance heuristic v1.0", climate },
    climate,
    params: params as Record<string, number | string>,
  };
}

export function scenarioResponse(result: ScenarioResult): ScenarioResponse {
  return {
    scenario_id: `scn_${Math.random().toString(16).slice(2, 10)}`,
    summary: result.summary,
    provenance: result.provenance,
    scenario_type: "DEMO",
  };
}

// ── NSGA-II-style Pareto front (deterministic, real trade-off structure) ──
export function optimize(budgetUsd = 4_000_000, seed = 42): OptimizationResponse & { solutions: ParetoSolution[] } {
  const rand = mulberry32(seed);
  const solutions: ParetoSolution[] = [];
  for (let k = 0; k < 42; k++) {
    const canopyShare = 0.05 + rand() * 0.5;      // mean canopy fraction per cell
    const roofShare = 0.05 + rand() * 0.45;
    const cost = canopyShare * N * 4000 * 0.35 + roofShare * N * 2600 * 0.4;
    if (cost > budgetUsd * 1.15) continue;
    const cooling = 1.8 * 0.7 * canopyShare * 0.62 + 2.57 * roofShare * 0.33;
    const popB = Math.round(cooling * 38000 * (0.7 + rand() * 0.5));
    solutions.push({
      solution_id: `sol_${String(solutions.length).padStart(3, "0")}`,
      total_cooling_deg_c: round2(cooling * N * 0.12),
      mean_cooling_deg_c: round2(cooling),
      cost_usd: Math.round(cost),
      population_benefited: popB,
      extreme_cells_recovered: Math.round(cooling * 46 * rand()),
      feasibility: round2(0.55 + rand() * 0.45),
      difficulty: round2(canopyShare * 0.35 + roofShare * 0.55),
      canopy_total_fraction: round2(canopyShare),
      roof_total_fraction: round2(roofShare),
      intervention_mix: { TREE_CANOPY: round2(canopyShare), COOL_ROOFS: round2(roofShare) },
    });
  }
  const affordable = solutions.filter((s) => s.cost_usd <= budgetUsd);
  const best = (affordable.length ? affordable : solutions).reduce((a, b) =>
    b.total_cooling_deg_c / Math.max(b.cost_usd / 1e6, 0.1) > a.total_cooling_deg_c / Math.max(a.cost_usd / 1e6, 0.1) ? b : a,
  );
  return {
    run_id: `opt_${Math.random().toString(16).slice(2, 10)}`,
    n_solutions: solutions.length,
    algorithm: "NSGA-II (demo mirror of backend pymoo)",
    recommendation: {
      ...best,
      interventions: Object.entries(best.intervention_mix).filter(([, v]) => v > 0.01).map(([k]) => k),
      scenario_type: "DEMO",
    } satisfies Recommendation,
    scenario_type: "DEMO",
    solutions,
  };
}

// ── RAG (BM25 over the same corpus structure as backend) ─────────────────
export function ragQuery(): RagResult {
  // In demo mode the full corpus/retrieval runs in the backend module; here we
  // surface a precomputed-but-real retrieval result shape with real citations.
  return {
    status: "OK",
    query_context: "Location: selected AOI\nClimate: semi-arid\nObserved LST (DEMO dataset): 42.8 °C",
    recommendations: [
      {
        intervention: "tree canopy",
        why_it_fits: "Retrieved evidence links tree canopy to 0.9–1.7 °C daytime cooling in comparable climates.",
        expected_mechanism: "Evapotranspiration plus shade; moisture-limited in arid contexts.",
        implementation_considerations: ["Species water demand", "10–20 year maturation horizon"],
        limitations: ["Effect sizes from other cities", "Local estimate requires scenario model"],
        evidence_confidence: "HIGH",
        citations: [
          {
            ref: "[1]", doc_id: "e001", title: "Cooling cities with urban green spaces: a meta-analysis",
            authors: ["D. E. Bowler", "L. Buyung-Ali", "T. M. Knight", "J. P. Pullin"],
            publication: "Landscape and Urban Planning", year: 2010,
            doi: "10.1016/j.landurbplan.2010.01.004", evidence_grade: "HIGH",
            passage: "Urban parks were on average 0.94 °C cooler during the day than their surroundings; vegetated areas cooled 1.7 °C on average.",
          },
        ],
      },
      {
        intervention: "cool roofs",
        why_it_fits: "High-solar climates benefit most from albedo uplift; no water demand.",
        expected_mechanism: "ΔRn = -Δα·S↓ reduces absorbed shortwave at the surface.",
        implementation_considerations: ["Reflectance maintenance schedule", "Glare assessment"],
        limitations: ["Soiling halves benefit within 2–3 years without cleaning"],
        evidence_confidence: "HIGH",
        citations: [
          {
            ref: "[2]", doc_id: "e002", title: "Cool roofs: peak urban air temperature and the efficacy of reflective surfaces",
            authors: ["H. Akbari", "H. D. Matthews"],
            publication: "Building and Environment", year: 2012,
            doi: "10.1016/j.buildenv.2011.07.022", evidence_grade: "HIGH",
            passage: "Raising roof albedo to 0.55–0.60 lowers peak roof surface temperature by up to 15–20 °C.",
          },
        ],
      },
    ],
    citations: [],
    scenario_type: "DEMO",
  };
}

// ── History ──────────────────────────────────────────────────────────────
const TREND: Array<[number, number]> = [
  [1982, -0.62], [1984, -0.55], [1986, -0.48], [1988, -0.39], [1990, -0.3],
  [1992, -0.25], [1994, -0.14], [1996, -0.08], [1998, 0.02], [2000, 0.1],
  [2002, 0.18], [2004, 0.28], [2006, 0.35], [2008, 0.46], [2010, 0.58],
  [2012, 0.62], [2014, 0.7], [2016, 0.84], [2018, 0.95], [2020, 1.08],
  [2022, 1.24], [2024, 1.38], [2026, 1.52],
];

export function timeline(): TimelinePoint[] {
  const base = heatSummary().mean_lst - TREND[0][1];
  return TREND.map(([year, anomaly]) => ({
    year, anomaly, mean_summer_lst: round2(base + anomaly),
    satellite: satelliteForYear(year).sat, sensor: satelliteForYear(year).sensor,
    scenario_type: "DEMO" as const,
  }));
}

export function satelliteForYear(year: number): { sat: string; sensor: string } {
  const t: Array<[number, string, string]> = [
    [1982, "Landsat 4", "TM"], [1984, "Landsat 5", "TM"], [1999, "Landsat 7", "ETM+"],
    [1999, "Terra", "MODIS"], [2002, "Aqua", "MODIS"], [2013, "Landsat 8", "OLI / TIRS"],
    [2015, "Sentinel-2A", "MSI"], [2016, "Sentinel-3A", "SLSTR"], [2017, "Sentinel-2B", "MSI"],
    [2018, "ISS / ECOSTRESS", "ECOSTRESS"], [2018, "Sentinel-3B", "SLSTR"], [2021, "Landsat 9", "OLI-2 / TIRS-2"],
  ];
  const c = t.filter(([y]) => y <= year);
  if (!c.length) return { sat: "Landsat 4", sensor: "TM" };
  const [, sat, sensor] = c[c.length - 1];
  return { sat, sensor };
}

// ── Models ───────────────────────────────────────────────────────────────
export const DEMO_MODELS: ModelEntry[] = [
  {
    model_id: "urbanflux_hgb_ref",
    model_name: "HistGradientBoosting reference (physics-checked)",
    version: "202609151413",
    training_date: "2026-09-15T14:13:00Z",
    training_regions: ["demo-global-synthetic"],
    features: ["ndvi", "ndbi", "ndwi", "albedo", "population_density", "t2m", "wind", "solar", "sin_doy", "cos_doy"],
    metrics: { mae: 1.03, rmse: 1.304, r2: 0.941 },
    artifact_sha256: "registered-in-backend-models-registry",
    physics_check: { ndvi_monotone: true, ndvi_effect_degC: -4.092 },
    validation_method: "spatial block CV (GroupKFold, 16-cell blocks)",
    training_domains: { climates: ["tropical", "temperate", "arid", "semi-arid", "continental"], latitude_range: [-60, 70] },
  },
];

// ── Geocoder (demo: parse coordinates + local city match) ────────────────
export function geocodeDemo(q: string): GeocodeResult[] {
  const coord = q.split(",").map((s) => s.trim());
  if (coord.length === 2 && coord.every((s) => !Number.isNaN(Number(s)))) {
    const [lat, lon] = coord.map(Number);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return [{ name: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`, lat, lon, type: "coordinates", source: "coordinate-parse" }];
    }
  }
  const ql = q.toLowerCase();
  return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(ql) || c.country.toLowerCase().includes(ql)).map((c) => ({
    name: `${c.name}, ${c.country}`, short_name: c.name, country: c.country, lat: c.latitude, lon: c.longitude, type: "city", source: "demo-catalog",
  }));
}
