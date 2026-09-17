import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import maplibregl, { type Map as MLMap, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GRID, DEMO_HOTSPOTS, cellProperties } from "@/services/api/demo/mockBackend";
import { lstColor, ndviColor, ndbiColor, ndwiColor, albedoColor, populationColor, riskColor, deltaColor, formatCoord } from "@/lib/thermal";
import { RampLegend } from "@/components/RampLegend";
import { useAppStore, type LayerId } from "@/stores/useAppStore";
import type { ScenarioResult } from "@/types";
import type { AreaOfInterest } from "@/types";
import { Database, Map as MapIcon, X } from "lucide-react";

const DEMO_BBOX: [number, number, number, number] = [76.8387, 28.4046, 77.3486, 28.8834];

/**
 * Real-map context: streets, districts, POIs that put the AOI in its
 * geographic setting — neighbouring areas, rivers, roads, place names.
 * Esri Canvas tiles are keyless; CARTO's free tier now watermarks tiles.
 */
const BASEMAP_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
];
const BASEMAP_ATTRIBUTION = "Esri, HERE, Garmin, FAO, NOAA, USGS · © OpenStreetMap contributors";

/** Transparent label-only overlay, sandwiched ABOVE the heat grid so place names stay readable over the data. */
const LABEL_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
];

/** Optional user-provided vector style (MapTiler/CARTO with key). Overrides the built-in raster stack. */
const CUSTOM_STYLE_URL: string | undefined = import.meta.env.VITE_MAP_STYLE_URL;

export function aoiBbox(aoi: AreaOfInterest | null): [number, number, number, number] {
  if (aoi?.bounding_box) return aoi.bounding_box as [number, number, number, number];
  return DEMO_BBOX;
}

function fitOptions(): maplibregl.FitBoundsOptions {
  return { padding: 24, maxZoom: 12.5, duration: 0 };
}

function boundsOf(bbox: [number, number, number, number]): [[number, number], [number, number]] {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
}

/** Project a grid cell (ix, iy) into lon/lat within bbox. Cell (0,0) is top-left. */
export function cellLngLat(bbox: [number, number, number, number], ix: number, iy: number): [number, number] {
  const [w, s, e, n] = bbox;
  const lon = w + ((ix + 0.5) * (e - w)) / GRID;
  const lat = n - ((iy + 0.5) * (n - s)) / GRID;
  return [lon, lat];
}

function gridCollection(bbox: [number, number, number, number], layer: LayerId, sim?: ScenarioResult | null) {
  const [w, s, e, n] = bbox;
  const dLon = (e - w) / GRID;
  const dLat = (n - s) / GRID;
  const feats: GeoJSON.Feature[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const ix = i % GRID, iy = Math.floor(i / GRID);
    const lon0 = w + ix * dLon, lon1 = lon0 + dLon;
    const lat1 = n - iy * dLat, lat0 = lat1 - dLat;
    const p = cellProperties(i);
    let value = p.lst;
    let color: string;
    switch (layer) {
      case "lst": value = p.lst; color = lstColor(p.lst); break;
      case "heat-risk": color = riskColor(p.heat_risk); break;
      case "ndvi": color = ndviColor(p.ndvi); break;
      case "ndbi": color = ndbiColor(p.ndbi); break;
      case "ndwi": color = ndwiColor(p.ndwi); break;
      case "albedo": color = albedoColor(p.albedo); break;
      case "population": color = populationColor(p.population); break;
      default: color = lstColor(p.lst);
    }
    if (sim && layer === "lst") {
      value = sim.simulated_lst[i];
      color = deltaColor(sim.delta_lst[i]);
    }
    feats.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]] },
      properties: { ...p, value, fill: color },
    });
  }
  return { type: "FeatureCollection" as const, features: feats };
}

const LAYER_META: Record<LayerId, { label: string; gradient?: string; unit: string; min?: number; max?: number; classes?: Array<{ label: string; color: string }> }> = {
  "lst": { label: "LAND SURFACE TEMPERATURE", unit: "°C", min: 33, max: 46, gradient: "linear-gradient(90deg,#26509F,#1677FF,#4CAF50,#FFD43B,#FF5A1F,#EF2B16)" },
  "heat-risk": { label: "HEAT RISK CLASS", unit: "", classes: [
    { label: "EXTREME ≥ 43.5°C", color: "#EF2B16" },
    { label: "HOT ≥ 41.5°C", color: "#FF5A1F" },
    { label: "MODERATE ≥ 39.5°C", color: "#FFD43B" },
    { label: "COOL < 39.5°C", color: "#4CAF50" },
  ]},
  "ndvi": { label: "NDVI — VEGETATION", unit: "", min: -0.2, max: 0.8, gradient: "linear-gradient(90deg,#826E46,#4CAF50)" },
  "ndbi": { label: "NDBI — BUILT-UP", unit: "", min: -0.2, max: 0.8, gradient: "linear-gradient(90deg,#787882,#FF8A4C)" },
  "ndwi": { label: "NDWI — WATER", unit: "", min: -0.5, max: 0.7, gradient: "linear-gradient(90deg,#5A503C,#1677FF)" },
  "albedo": { label: "SURFACE ALBEDO", unit: "", min: 0.05, max: 0.5, gradient: "linear-gradient(90deg,#282828,#F2F0E8)" },
  "population": { label: "POPULATION EXPOSURE", unit: "", min: 0, max: 9500, gradient: "linear-gradient(90deg,#111111,#FFD43B)" },
};

interface Props {
  scenario?: ScenarioResult | null;
  showHotspots?: boolean;
  onCellSelect?: (index: number) => void;
  height?: string;
  /** "grid" renders the analysis grid + markers; "context" is the bare instrument map. */
  variant?: "grid" | "context";
  /** Overlay content (era labels, captions) rendered above the map canvas. */
  overlay?: ReactNode;
}

export function HeatMap({ scenario = null, showHotspots: _showHotspots = true, onCellSelect, height = "540px", variant = "grid", overlay }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const layer = useAppStore((s) => s.layer);
  const setLayer = useAppStore((s) => s.setLayer);
  const selectHotspot = useAppStore((s) => s.selectHotspot);
  const aoi = useAppStore((s) => s.aoi);
  // Style-loaded gate: grid source and markers can only be touched after load.
  const [mapReady, setMapReady] = useState(false);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // Real-map context: streets, rivers, districts and place labels under the grid.
  const [showContext, setShowContext] = useState(true);

  const data = useMemo(() => gridCollection(aoiBbox(aoi), layer, scenario), [aoi, layer, scenario]);
  // Latest data for the one-time load handler — never stale on async AOI resolution.
  const dataRef = useRef(data);
  const variantRef = useRef(variant);
  variantRef.current = variant;

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const style: StyleSpecification = {
      version: 8,
      sources: {
        basemap: {
          type: "raster",
          tiles: BASEMAP_TILES,
          tileSize: 256,
          maxzoom: 16,
          attribution: BASEMAP_ATTRIBUTION,
        },
        labels: { type: "raster", tiles: LABEL_TILES, tileSize: 256, maxzoom: 16 },
      },
      layers: [
        { id: "bg", type: "background", paint: { "background-color": "#161616" } },
        { id: "basemap-raster", type: "raster", source: "basemap", paint: { "raster-opacity": 1 } },
      ],
    };
    const map = new maplibregl.Map({
      container: container.current,
      style: CUSTOM_STYLE_URL ?? style,
      bounds: boundsOf(aoiBbox(aoi)),
      fitBoundsOptions: fitOptions(),
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    map.on("load", () => {
      // Use the LATEST data — aoi may have resolved while the style was loading.
      if (variantRef.current === "grid") {
        map.addSource("grid", { type: "geojson", data: dataRef.current });
        map.addLayer({
          id: "grid-fill", type: "fill", source: "grid",
          paint: { "fill-color": ["get", "fill"], "fill-opacity": 0.82 },
        });
        map.addLayer({
          id: "grid-line", type: "line", source: "grid",
          paint: { "line-color": "rgba(17,17,17,0.35)", "line-width": 0.5 },
        });
        // Label sandwich: place names ABOVE the thermal data (cartographic standard).
        map.addLayer({
          id: "basemap-labels", type: "raster", source: "labels",
          paint: { "raster-opacity": 0.95 },
        });
      }
      // AOI boundary so the analysis extent reads clearly against surrounding context.
      map.addSource("aoi-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[]],
          },
        },
      });
      map.addLayer({
        id: "aoi-boundary-line", type: "line", source: "aoi-boundary",
        paint: {
          "line-color": "#F2F0E8",
          "line-width": 1.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.9,
        },
      });
      // Re-fit now that layout is real (constructor fit can run in a 0-size container).
      map.fitBounds(boundsOf(aoiBbox(aoi)), fitOptions());
      setMapReady(true);
    });
    map.on("click", "grid-fill", (e) => {
      const idx = e.features?.[0]?.properties?.cell_index as number | undefined;
      if (idx !== undefined) {
        setInspecting(idx);
        onCellSelect?.(idx);
      }
    });
    map.on("mouseenter", "grid-fill", () => (map.getCanvas().style.cursor = "crosshair"));
    map.on("mouseleave", "grid-fill", () => (map.getCanvas().style.cursor = ""));

    // Track container resizes so the canvas never freezes at initial layout size.
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container.current);

    return () => {
      ro.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push grid updates; also record latest data so the load handler never uses stale values.
  useEffect(() => {
    dataRef.current = data;
    const map = mapRef.current;
    if (!map || !mapReady || variantRef.current !== "grid") return;
    const src = map.getSource("grid") as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(data);
  }, [data, mapReady]);

  // Hotspot markers track the ACTIVE AOI grid, rebuilt whenever it changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || variantRef.current !== "grid") return;
    markersRef.current.forEach((m) => m.remove());
    const bbox = aoiBbox(aoi);
    markersRef.current = DEMO_HOTSPOTS.map((hs, k) => {
      const el = document.createElement("button");
      el.className = "urbanflux-hotspot-marker";
      el.setAttribute("aria-label", `Select hotspot ${hs.name}`);
      el.textContent = `${k + 1}`;
      el.style.cssText =
        "width:26px;height:26px;border-radius:50%;border:2px solid #111;background:#EF2B16;color:#F2F0E8;font:bold 12px 'JetBrains Mono';cursor:pointer;box-shadow:0 0 14px rgba(239,43,22,.8)";
      el.onclick = () => selectHotspot(hs);
      return new maplibregl.Marker({ element: el })
        .setLngLat(cellLngLat(bbox, hs.cell.x, hs.cell.y))
        .addTo(map);
    });
  }, [aoi, mapReady, selectHotspot]);

  // Re-fit the viewport when the active AOI changes (no remount on AOI switch).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.fitBounds(boundsOf(aoiBbox(aoi)), { ...fitOptions(), duration: 400 });
  }, [aoi, mapReady]);

  // AOI boundary polygon tracks the active bbox.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource("aoi-boundary") as maplibregl.GeoJSONSource | undefined;
    const [w, s, e, n] = aoiBbox(aoi);
    if (src) {
      src.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
        },
      });
    }
  }, [aoi, mapReady]);

  // Context (basemap) visibility toggle; the label sandwich ships with it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const vis = showContext ? "visible" : "none";
    if (map.getLayer("basemap-raster")) map.setLayoutProperty("basemap-raster", "visibility", vis);
    if (map.getLayer("basemap-labels")) map.setLayoutProperty("basemap-labels", "visibility", vis);
  }, [showContext, mapReady]);

  // Analysis-grid layers only exist on the "grid" variant.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const vis = variant === "grid" ? "visible" : "none";
    for (const id of ["grid-fill", "grid-line"]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
    }
  }, [variant, mapReady]);

  const meta = LAYER_META[layer];
  const inspection = useMemo(() => (inspecting !== null ? cellProperties(inspecting) : null), [inspecting]);

  return (
    <div className="relative overflow-hidden rounded-sm border border-bone/15" style={{ height }}>
      <div ref={container} className="h-full w-full" />

      {overlay && <div className="pointer-events-none absolute inset-0 z-10">{overlay}</div>}

      {/* Layer control (analysis variant only) */}
      <div hidden={variant !== "grid"} className="absolute left-3 top-3 flex flex-col gap-1" role="tablist" aria-label="Map layers">
        {(Object.keys(LAYER_META) as LayerId[]).map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={layer === l}
            onClick={() => setLayer(l)}
            className={`rounded-sm border px-2 py-1 text-left font-mono2 text-[10px] tracking-[0.12em] backdrop-blur transition-colors ${
              layer === l ? "border-heat bg-heat/20 text-heat" : "border-bone/15 bg-ink/70 text-bone/60 hover:text-bone"
            }`}
          >
            {l.toUpperCase().replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Legend (analysis variant only) */}
      <div hidden={variant !== "grid"} className="absolute bottom-3 left-3">
        <RampLegend
          label={`${meta.label}${scenario && layer === "lst" ? " — SIMULATED Δ" : ""}`}
          unit={meta.unit}
          min={meta.min ?? 0}
          max={meta.max ?? 0}
          gradient={meta.gradient ?? ""}
          classes={meta.classes}
        />
      </div>

      {/* Context (basemap) toggle — analysis variant only */}
      {variant === "grid" && (
        <button
          onClick={() => setShowContext((v) => !v)}
          aria-pressed={showContext}
          className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-sm border px-2 py-1.5 font-mono2 text-[10px] tracking-[0.15em] backdrop-blur transition-colors ${
            showContext ? "border-solar bg-solar/15 text-solar" : "border-bone/20 bg-ink/80 text-bone/60 hover:text-bone"
          }`}
        >
          <MapIcon size={11} /> CONTEXT MAP
        </button>
      )}

      {/* Data sources — analysis variant only */}
      {variant === "grid" && (
        <button
          onClick={() => setSourcesOpen((v) => !v)}
          className="absolute right-3 top-14 flex items-center gap-1.5 rounded-sm border border-bone/20 bg-ink/80 px-2 py-1.5 font-mono2 text-[10px] tracking-[0.15em] text-bone/80 backdrop-blur hover:border-heat hover:text-heat"
          aria-expanded={sourcesOpen}
        >
          <Database size={11} /> DATA SOURCES
        </button>
      )}
      {sourcesOpen && (
        <div className="absolute right-3 top-28 w-72 rounded-sm border border-bone/20 bg-ink/95 p-4 backdrop-blur" role="dialog" aria-label="Data sources">
          <button className="absolute right-2 top-2 text-bone/50 hover:text-bone" onClick={() => setSourcesOpen(false)} aria-label="Close data sources"><X size={14} /></button>
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-heat">THERMAL</p>
          <p className="mt-1 font-head text-xs font-semibold">Landsat 9 · TIRS-2</p>
          <p className="font-mono2 text-[10px] text-bone/50">Collection 2 Level-2 · Surface Temperature · USGS · 30 m</p>
          <p className="mt-3 font-mono2 text-[9px] tracking-[0.2em] text-veg">VEGETATION</p>
          <p className="mt-1 font-head text-xs font-semibold">Sentinel-2A/B · MSI</p>
          <p className="font-mono2 text-[10px] text-bone/50">Level-2A · Copernicus · 10 m</p>
          <p className="mt-3 font-mono2 text-[9px] tracking-[0.2em] text-water">WEATHER</p>
          <p className="mt-1 font-head text-xs font-semibold">ERA5 · ECMWF</p>
          <p className="font-mono2 text-[10px] text-bone/50">Reanalysis · Copernicus C3S · not satellite</p>
          <p className="mt-3 font-mono2 text-[9px] tracking-[0.2em] text-solar">BUILDINGS</p>
          <p className="mt-1 font-head text-xs font-semibold">OpenStreetMap</p>
          <p className="font-mono2 text-[10px] text-bone/50">Vector infrastructure · ODbL</p>
          <p className="mt-3 font-mono2 text-[9px] tracking-[0.2em] text-bone/40">BASEMAP</p>
          <p className="mt-1 font-head text-xs font-semibold">Esri Dark Gray Canvas</p>
          <p className="font-mono2 text-[10px] text-bone/50">Raster tiles · Esri, HERE, Garmin, FAO, NOAA, USGS · context only, no analysis data</p>
        </div>
      )}

      {/* Pixel inspector */}
      {inspection && (
        <div className="absolute right-3 bottom-3 w-64 rounded-sm border border-heat/40 bg-ink/95 p-4 backdrop-blur" role="dialog" aria-label="Pixel inspector">
          <button className="absolute right-2 top-2 text-bone/50 hover:text-bone" onClick={() => setInspecting(null)} aria-label="Close inspector"><X size={14} /></button>
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-heat">INSPECT DATA · CELL {inspection.cell_index}</p>
          <p className="mt-1 font-mono2 text-[10px] text-bone/60">
            {(() => {
              const [lon, lat] = cellLngLat(aoiBbox(aoi), inspection.cell_index % GRID, Math.floor(inspection.cell_index / GRID));
              return formatCoord(lat, lon);
            })()}
          </p>
          <dl className="mt-2 space-y-1 font-mono2 text-[11px]">
            <div className="flex justify-between"><dt className="text-bone/50">LST</dt><dd>{inspection.lst} °C</dd></div>
            <div className="flex justify-between"><dt className="text-bone/50">NDVI</dt><dd>{inspection.ndvi.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-bone/50">NDBI</dt><dd>{inspection.ndbi.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-bone/50">Albedo</dt><dd>{inspection.albedo.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-bone/50">Population</dt><dd>{inspection.population}</dd></div>
            <div className="flex justify-between"><dt className="text-bone/50">Risk</dt><dd style={{ color: riskColor(inspection.heat_risk) }}>{inspection.heat_risk}</dd></div>
          </dl>
          <p className="mt-2 border-t border-bone/10 pt-2 font-mono2 text-[9px] leading-relaxed text-bone/40">
            LANDSAT 9 · TIRS-2 · C2 L2 · 30 m · 2026-05-14<br />ERA5 (31 km) · OSM vectors
          </p>
        </div>
      )}
    </div>
  );
}
