import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface Mission {
  id: string;
  mission: string;
  platforms: string;
  sensor: string;
  dataset: string;
  products: string;
  provider: string;
  resolution: string;
  temporal: string;
  earliest: number | string;
  color: string;
  note?: string;
}

const MISSIONS: Mission[] = [
  { id: "landsat9", mission: "LANDSAT 9", platforms: "Landsat 8 · Landsat 9", sensor: "OLI-2 + TIRS-2", dataset: "Collection 2 Level-2", products: "Surface temperature · reflectance", provider: "USGS / NASA", resolution: "30 m", temporal: "16-day", earliest: 1982, color: "#FF5A1F" },
  { id: "sentinel2", mission: "SENTINEL-2C", platforms: "S2A · S2B · S2C", sensor: "MSI", dataset: "Level-2A", products: "NDVI · NDWI · NDBI · land cover", provider: "Copernicus / ESA", resolution: "10 m", temporal: "5-day", earliest: 2015, color: "#4CAF50", note: "no thermal band — never used for LST" },
  { id: "terra", mission: "TERRA", platforms: "Terra", sensor: "MODIS", dataset: "MOD11 / MOD21", products: "LST · emissivity · vegetation", provider: "NASA", resolution: "1 km", temporal: "daily / 8-day", earliest: 2000, color: "#FFD43B" },
  { id: "snpp", mission: "SUOMI NPP", platforms: "Suomi NPP · NOAA-20/21", sensor: "VIIRS", dataset: "VNP21 / VJ121", products: "LST · nighttime", provider: "NASA / NOAA", resolution: "1 km", temporal: "daily", earliest: 2011, color: "#1677FF" },
  { id: "s3", mission: "SENTINEL-3", platforms: "S3A · S3B", sensor: "SLSTR", dataset: "Level-2 LST", products: "Land surface temperature", provider: "Copernicus / ESA", resolution: "1 km", temporal: "daily", earliest: 2016, color: "#7db4ff" },
  { id: "ecostress", mission: "ECOSTRESS", platforms: "International Space Station", sensor: "thermal radiometer", dataset: "ECO2LSTE", products: "High-resolution LST", provider: "NASA / JPL", resolution: "70 m", temporal: "ISS orbit", earliest: 2018, color: "#c9a0ff", note: "an ISS instrument — not a satellite" },
  { id: "era5", mission: "ERA5", platforms: "reanalysis", sensor: "model + observations", dataset: "ERA5", products: "T2M · humidity · wind · radiation", provider: "ECMWF / Copernicus C3S", resolution: "~31 km", temporal: "hourly", earliest: 1940, color: "#9fe870", note: "not satellite imagery" },
];

const MATRIX = [
  ["Landsat C2 L2", "Landsat 4–9", "LST", "1982", "present", "AVAILABLE"],
  ["Sentinel-2 L2A", "S2 constellation", "NDVI/NDWI/NDBI", "2015", "present", "AVAILABLE"],
  ["MOD11/MYD11", "Terra / Aqua", "LST · emissivity", "2000", "present", "AVAILABLE"],
  ["VNP21", "SNPP / NOAA-20/21", "LST", "2011", "present", "AVAILABLE"],
  ["SLSTR L2", "Sentinel-3A/B", "LST", "2016", "present", "AVAILABLE"],
  ["ERA5", "ECMWF reanalysis", "T2M · RH · wind", "1940", "present", "AVAILABLE"],
];

export default function Datasets() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="border-b border-bone/10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl text-heat">UrbanFlux</Link>
          <Link to="/explore" className="font-mono2 text-[11px] tracking-[0.2em] text-bone/60 hover:text-heat">EXPLORER →</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-16">
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">GLOBAL DATA</p>
        <h1 className="display-xl mt-3 text-[clamp(2.6rem,7vw,6.5rem)]">
          THE MISSION<br /><span className="text-heat">CATALOGUE.</span>
        </h1>

        <div className="mt-14 grid gap-px border border-bone/10 bg-bone/10 md:grid-cols-2">
          {MISSIONS.map((m) => (
            <article key={m.id} className="group bg-ink p-8" style={{ borderTop: `3px solid ${m.color}` }}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-4xl">{m.mission}</h2>
                <span className="font-mono2 text-[10px] tracking-[0.2em]" style={{ color: m.color }}>SINCE {m.earliest}</span>
              </div>
              <p className="mt-2 font-mono2 text-[11px] text-bone/50">{m.platforms} · {m.sensor}</p>
              <dl className="mt-5 space-y-1.5 font-mono2 text-[11px]">
                <div className="flex justify-between border-b border-bone/8 pb-1"><dt className="text-bone/35">DATASET</dt><dd>{m.dataset}</dd></div>
                <div className="flex justify-between border-b border-bone/8 pb-1"><dt className="text-bone/35">PRODUCTS</dt><dd className="text-right">{m.products}</dd></div>
                <div className="flex justify-between border-b border-bone/8 pb-1"><dt className="text-bone/35">RESOLUTION</dt><dd>{m.resolution}</dd></div>
                <div className="flex justify-between border-b border-bone/8 pb-1"><dt className="text-bone/35">REVISIT</dt><dd>{m.temporal}</dd></div>
                <div className="flex justify-between"><dt className="text-bone/35">PROVIDER</dt><dd>{m.provider}</dd></div>
              </dl>
              {m.note && <p className="mt-3 font-mono2 text-[10px] text-solar">ⓘ {m.note}</p>}
            </article>
          ))}
        </div>

        <section className="mt-16" aria-label="Availability matrix">
          <h2 className="font-mono2 text-[11px] tracking-[0.3em] text-bone/50">AVAILABILITY MATRIX · TEMPORAL COVERAGE</h2>
          <div className="mt-4 overflow-x-auto border border-bone/12">
            <table className="w-full font-mono2 text-[11px]">
              <thead>
                <tr className="border-b border-bone/15 text-left text-bone/40">
                  {["DATASET", "PLATFORM", "VARIABLE", "EARLIEST", "LATEST", "STATUS"].map((h) => (
                    <th key={h} className="px-4 py-2.5 tracking-[0.15em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((r) => (
                  <tr key={r[0]} className="border-b border-bone/8">
                    {r.slice(0, 5).map((c, i) => <td key={i} className="px-4 py-2.5 text-bone/75">{c}</td>)}
                    <td className="px-4 py-2.5 text-veg">● {r[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono2 text-[10px] text-bone/40">
            Status reflects product era boundaries. Per-AOI availability is checked dynamically when Earth Engine is configured.
          </p>
        </section>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link to="/explore" className="bg-heat px-6 py-3.5 font-mono2 text-[11px] tracking-[0.2em] text-ink hover:bg-solar">
            CHECK COVERAGE FOR ANY AOI <ArrowUpRight size={13} className="inline" />
          </Link>
          <Link to="/models" className="border border-bone/25 px-6 py-3.5 font-mono2 text-[11px] tracking-[0.2em] hover:border-heat hover:text-heat">
            SEE WHAT THE MODELS CONSUME
          </Link>
        </div>
      </div>
    </div>
  );
}
