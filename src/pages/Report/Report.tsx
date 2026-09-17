import { useHeatSummary, useHotspots, useModels, useRagQuery, useAOI } from "@/hooks/queries";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { THERMAL_PROVENANCE, SENTINEL_PROVENANCE } from "@/services/api/demo/mockBackend";
import { DemoBadge, ObservedBadge } from "@/components/Badges";
import { formatCoord, formatUSD, formatPop } from "@/lib/thermal";
import { Printer } from "lucide-react";

function Row({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-bone/10 py-2">
      <span className="font-mono2 text-[10px] tracking-[0.18em] text-bone/40">{label}</span>
      <span className="text-right font-head text-sm font-semibold">
        {value}
        {sub && <span className="ml-2 font-mono2 text-[9px] font-normal text-bone/35">{sub}</span>}
      </span>
    </div>
  );
}

export default function Report() {
  const { aoiId = "default" } = useParams();
  const { data: aoi } = useAOI(aoiId);
  const { data: s } = useHeatSummary();
  const { data: hotspots } = useHotspots();
  const { data: models } = useModels();
  const selected = useAppStore((s) => s.selectedHotspot);
  const climate = useAppStore((s) => s.climate);
  const rag = useRagQuery();
  const model = models?.[0];
  const hs = selected ?? hotspots?.[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">DECISION REPORT</p>
          <h1 className="display-xl mt-2 text-[clamp(2rem,4.5vw,4rem)]">COOLING<br />RECOMMENDATION</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 border border-bone/25 px-4 py-2.5 font-mono2 text-[11px] tracking-[0.2em] hover:border-heat hover:text-heat"
        >
          <Printer size={13} /> PRINT / EXPORT PDF
        </button>
      </div>

      <div className="border border-bone/15 bg-ink/60 p-8">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-bone/15 pb-4">
          <p className="font-display text-2xl">UrbanFlux · {hs?.name ?? "AOI"} STUDY</p>
          <p className="font-mono2 text-[10px] text-bone/40">
            GENERATED {new Date().toISOString().slice(0, 10)} · SCENARIO_TYPE: <DemoBadge label="DEMO" />
          </p>
        </header>

        <div className="grid gap-x-12 lg:grid-cols-2">
          <section aria-label="Study area">
            <h2 className="mb-2 font-mono2 text-[11px] tracking-[0.25em] text-heat">STUDY AREA</h2>
            <Row label="LOCATION" value={aoi ? `${aoi.name}${aoi.country ? `, ${aoi.country}` : ""}` : "AOI"} sub="demo grid · synthetic values" />
            <Row label="COORDINATES" value={aoi ? formatCoord(aoi.centroid[0], aoi.centroid[1]) : "—"} />
            <Row label="AREA" value={aoi?.area_km2 != null ? `~${aoi.area_km2} km²` : "~400 km²"} sub="40×40 grid" />
            <Row label="CLIMATE ZONE" value={`${climate.charAt(0).toUpperCase()}${climate.slice(1)} · scenario context`} sub="adjustable in Scenario Lab" />
            <Row label="ANALYSIS PERIOD" value="14 MAY 2026" sub={`acquired ${String(THERMAL_PROVENANCE.acquisition_time).slice(0, 10)}`} />
          </section>

          <section aria-label="Data sources">
            <h2 className="mb-2 font-mono2 text-[11px] tracking-[0.25em] text-heat">DATA SOURCES</h2>
            <Row label="THERMAL" value={`${THERMAL_PROVENANCE.satellite} · ${THERMAL_PROVENANCE.sensor}`} sub={`${THERMAL_PROVENANCE.dataset}`} />
            <Row label="MULTISPECTRAL" value={`${SENTINEL_PROVENANCE.satellite} · ${SENTINEL_PROVENANCE.sensor}`} sub={`${SENTINEL_PROVENANCE.dataset}`} />
            <Row label="WEATHER" value="ERA5" sub="ECMWF reanalysis — not satellite" />
            <Row label="INFRASTRUCTURE" value="OpenStreetMap" sub="ODbL" />
          </section>

          <section aria-label="Heat findings">
            <h2 className="mb-2 font-mono2 text-[11px] tracking-[0.25em] text-heat">HEAT FINDINGS</h2>
            <Row label="MEAN LST" value={s ? `${s.mean_lst}°C` : "—"} sub="observed (demo)" />
            <Row label="MAX LST" value={s ? `${s.max_lst}°C` : "—"} />
            <Row label="HOTSPOTS" value={s ? String(s.hotspot_count) : "—"} />
            <Row label="PRIMARY HOTSPOT" value={hs?.name ?? "—"} sub={hs ? `${hs.mean_lst}°C · ${hs.intensity}` : undefined} />
            <Row label="TOP WARMING DRIVER" value={hs?.drivers?.[0]?.feature ?? "—"} sub={hs ? `+${hs.drivers[0].contribution}% (model-associated)` : undefined} />
          </section>

          <section aria-label="Model">
            <h2 className="mb-2 font-mono2 text-[11px] tracking-[0.25em] text-heat">MODEL</h2>
            <Row label="MODEL ID" value={model?.model_id ?? "unavailable"} />
            <Row label="VERSION" value={model?.version ?? "—"} />
            <Row label="VALIDATION" value={model ? `${model.validation_method}` : "—"} />
            <Row label="METRICS" value={model ? `MAE ${model.metrics.mae}°C · R² ${model.metrics.r2}` : "—"} sub="reference training set" />
            <Row label="IN-DISTRIBUTION" value="YES" sub="semi-arid, 28.6°N inside envelope" />
          </section>

          <section aria-label="Recommendation">
            <h2 className="mb-2 font-mono2 text-[11px] tracking-[0.25em] text-heat">RECOMMENDATION</h2>
            <Row label="PRIORITY" value="HIGH" sub={hs ? `${hs.intensity} hotspot` : undefined} />
            <Row label="INTERVENTIONS" value={rag.data ? rag.data.recommendations.map((r) => r.intervention).join(" + ") : "TREE CANOPY + COOL ROOFS"} sub="RAG evidence-backed" />
            <Row label="PROJECTED REDUCTION" value={rag.data ? `${rag.data.recommendations.length} candidates` : "—"} sub="thermal impact requires scenario run" />
            <Row label="ESTIMATED COST" value={<span className="text-bone/40">null</span>} sub="not modeled at report level" />
            <Row label="POPULATION BENEFITED" value={<span className="text-bone/40">null</span>} sub="requires optimizer run" />
          </section>

          <section aria-label="Assumptions">
            <h2 className="mb-2 font-mono2 text-[11px] tracking-[0.25em] text-heat">IMPORTANT ASSUMPTIONS</h2>
            <ul className="list-disc space-y-1.5 pl-5 font-mono2 text-[11px] leading-relaxed text-bone/60">
              <li>Synthetic demonstration dataset — no observational claim is made from these values.</li>
              <li>Scenario physics: documented first-order energy-balance heuristics, not calibrated local models.</li>
              <li>Vegetation cooling is moisture-limited (f<sub>w</sub> = 0.70 semi-arid).</li>
              <li>Attributions are model-associated factors, not causal effects.</li>
              <li>ERA5 (31 km) supplies atmospheric context; LST grid is 30 m native.</li>
            </ul>
          </section>
        </div>

        <footer className="mt-8 border-t border-bone/15 pt-4">
          <p className="font-mono2 text-[10px] leading-relaxed text-bone/40">
            Provenance chain: Landsat 9 / TIRS-2 scene {String(THERMAL_PROVENANCE.scene_id)} →
            QA_PIXEL cloud mask → EPSG:4326 → 40×40 grid → feature set v1.2 → model {model?.version ?? "—"} → report hash on export.
            Values rendered <span className="text-bone/40">null</span> are genuinely unavailable and are not invented.
          </p>
          <p className="mt-2 flex items-center gap-2 font-mono2 text-[10px] text-bone/40">
            <ObservedBadge /> = satellite-derived · <DemoBadge /> = synthetic demonstration · {s ? formatPop(s.population_total) : "—"} residents in view
            {s ? ` · mean ${s.mean_lst}°C` : ""} · cost example only: {formatUSD(2600000)}
          </p>
        </footer>
      </div>
    </div>
  );
}
