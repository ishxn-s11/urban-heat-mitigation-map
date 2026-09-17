import { HeatMap } from "@/features/maps/HeatMap";
import { DemoBadge } from "@/components/Badges";

const LAYER_INFO: Array<[string, string, string]> = [
  ["LST", "Land Surface Temperature", "Landsat 9 TIRS-2, Collection 2 Level-2 · native 30 m thermal"],
  ["NDVI", "Vegetation index", "Sentinel-2 MSI Level-2A · (NIR − Red)/(NIR + Red) · 10 m"],
  ["NDBI", "Built-up index", "Sentinel-2 MSI · (SWIR − NIR)/(SWIR + NIR)"],
  ["NDWI", "Water index", "Sentinel-2 MSI · (Green − NIR)/(Green + NIR)"],
  ["ALBEDO", "Surface reflectivity", "Broadband albedo estimate from multi-band reflectance"],
  ["POPULATION", "Exposure per cell", "Settlement-layer derived residents per ~0.25 km²"],
];

export default function Layers() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">DATA LAYERS</p>
        <h1 className="display-xl mt-2 text-[clamp(2rem,4.5vw,4rem)]">EVERY LAYER,<br />EVERY SOURCE.</h1>
      </div>
      <HeatMap height="600px" />
      <div className="grid gap-px border border-bone/10 bg-bone/10 md:grid-cols-3">
        {LAYER_INFO.map(([id, name, src]) => (
          <div key={id} className="bg-ink p-5">
            <p className="font-mono2 text-[10px] tracking-[0.2em] text-heat">{id}</p>
            <p className="mt-1 font-head text-sm font-semibold">{name}</p>
            <p className="mt-2 font-mono2 text-[10px] leading-relaxed text-bone/45">{src}</p>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 font-mono2 text-[10px] text-bone/40">
        <DemoBadge /> native sensor resolution is displayed; coarse products are never presented as high-resolution observation
      </p>
    </div>
  );
}
