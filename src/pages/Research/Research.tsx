import { Link } from "react-router-dom";

const PIPELINE = [
  ["01", "AOI + SCENE DISCOVERY", "Every analysis anchors to an Area Of Interest. STAC-style discovery finds scenes across Landsat, Sentinel-2/3, MODIS, VIIRS."],
  ["02", "QUALITY FILTER", "QA_PIXEL cloud masking, cloud-cover thresholds, seasonal windowing. Poor acquisitions are rejected, never averaged away."],
  ["03", "ALIGNMENT", "CRS normalization to EPSG:4326, resampling to the AOI analysis grid at native sensor resolution."],
  ["04", "FEATURE ENGINEERING", "LST, NDVI, NDWI, NDBI, albedo, morphology, population, ERA5 weather — one shared analysis grid."],
  ["05", "MODEL ROUTER", "Registry models are checked against the AOI's climate/latitude envelope before inference. Extrapolation is flagged, never hidden."],
  ["06", "EXPLANATION", "Feature attributions ranked per hotspot; phrased as model-associated factors, not causal claims."],
  ["07", "SCENARIO + OPTIMIZATION", "Energy-balance response model feeds NSGA-II. RAG evidence proposes; the optimizer allocates."],
];

const PRINCIPLES = [
  ["OBSERVATION ≠ MODEL", "Satellite-derived values carry OBSERVED badges with mission, sensor, dataset, acquisition time. Model output is labelled MODEL-ESTIMATED."],
  ["SIMULATION ≠ PREDICTION", "Scenario results use SIMULATED badges and documented first-order physics — never presented as forecasts."],
  ["NO SILENT MOCKS", "If real processing fails, the UI shows ANALYSIS UNAVAILABLE. Demo data is always flagged DEMO SCENARIO."],
  ["EVIDENCE ≠ GUARANTEE", "RAG citations grade evidence quality (HIGH/MEDIUM/LOW) from comparable climates. Evidence grade is not a promise of local cooling."],
];

export default function Research() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="border-b border-bone/10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl text-heat">UrbanFlux</Link>
          <Link to="/models" className="font-mono2 text-[11px] tracking-[0.2em] text-bone/60 hover:text-heat">MODEL REGISTRY →</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-5 py-16">
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">METHODOLOGY</p>
        <h1 className="display-xl mt-3 text-[clamp(2.6rem,7vw,6rem)]">
          HOW UrbanFlux<br />THINKS.
        </h1>

        <section className="mt-14 space-y-px border border-bone/10 bg-bone/10" aria-label="Processing pipeline">
          {PIPELINE.map(([n, t, d]) => (
            <div key={n} className="flex gap-6 bg-ink p-6">
              <span className="font-display text-2xl text-heat">{n}</span>
              <div>
                <p className="font-head text-sm font-semibold tracking-wide">{t}</p>
                <p className="mt-1 font-body text-sm leading-relaxed text-bone/60">{d}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16" aria-label="Scientific principles">
          <h2 className="font-mono2 text-[11px] tracking-[0.3em] text-bone/50">THE SEPARATION PRINCIPLE</h2>
          <div className="mt-6 grid gap-px border border-bone/10 bg-bone/10 md:grid-cols-2">
            {PRINCIPLES.map(([t, d]) => (
              <div key={t} className="bg-ink p-6">
                <p className="font-display text-xl text-solar">{t}</p>
                <p className="mt-2 font-body text-sm leading-relaxed text-bone/60">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border border-bone/12 p-8" aria-label="Validation strategy">
          <h2 className="font-mono2 text-[11px] tracking-[0.3em] text-bone/50">VALIDATION STRATEGY</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="font-head text-sm font-semibold">SPATIAL BLOCK CV</p>
              <p className="mt-1 font-body text-sm leading-relaxed text-bone/60">
                Neighboring pixels share microclimate; random splits leak. UrbanFlux
                blocks contiguous cells per fold and reports local, regional,
                unseen-city and unseen-climate generalization separately.
              </p>
            </div>
            <div>
              <p className="font-head text-sm font-semibold">HONEST METRICS</p>
              <p className="mt-1 font-body text-sm leading-relaxed text-bone/60">
                MAE, RMSE, R² are reported exactly as measured, with the training
                domain stated. No metric is rounded toward hope. Uncertainty and
                OOD scores ship with every prediction.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16" aria-label="Evidence corpus">
          <h2 className="font-mono2 text-[11px] tracking-[0.3em] text-bone/50">EVIDENCE BASE</h2>
          <p className="mt-4 max-w-3xl font-body text-sm leading-relaxed text-bone/60">
            The Climate RAG retrieves from a curated corpus — IPCC AR6 WGII,
            meta-analyses in <em>Landscape and Urban Planning</em> and{" "}
            <em>Building and Environment</em>, UNEP and WHO guidance, C40 reviews —
            with metadata filtering by climate zone and intervention, BM25 +
            dense hybrid retrieval, and evidence-grade reranking. Every citation
            resolves to a DOI or URL.
          </p>
        </section>
      </div>
    </div>
  );
}
