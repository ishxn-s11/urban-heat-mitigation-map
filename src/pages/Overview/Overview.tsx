import { Link, useParams } from "react-router-dom";
import { useAOI, useHeatSummary } from "@/hooks/queries";
import { ObservedBadge, DemoBadge } from "@/components/Badges";
import { THERMAL_PROVENANCE } from "@/services/api/demo/mockBackend";
import { formatCoord, formatPop } from "@/lib/thermal";

export default function Overview() {
  const { aoiId } = useParams();
  const { data: aoi } = useAOI(aoiId ?? "default");
  const { data: s } = useHeatSummary();

  const riskDist = [
    { label: "EXTREME", value: s?.extreme_cells ?? 0, color: "#EF2B16" },
    { label: "HOT", value: (s?.hot_cells ?? 0) - (s?.extreme_cells ?? 0), color: "#FF5A1F" },
    { label: "MODERATE / COOL", value: 1600 - (s?.hot_cells ?? 0), color: "#4CAF50" },
  ];
  const total = riskDist.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">LOCATION ANALYTICS</p>
        <h1 className="display-xl mt-2 text-[clamp(2.2rem,5vw,4.5rem)]">THERMAL PROFILE</h1>
        <p className="mt-3 font-mono2 text-[11px] text-bone/50">
          {aoi ? `${aoi.name ?? "AOI"} · ${formatCoord(aoi.centroid[0], aoi.centroid[1])} · ${aoi.area_km2} km²` : "…"}
        </p>
      </div>

      {s && (
        <>
          <div className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["MEAN LST", `${s.mean_lst}°C`, <ObservedBadge key="b" />],
              ["MAX LST", `${s.max_lst}°C`, <ObservedBadge key="b" />],
              ["P95 LST", `${s.p95_lst}°C`, <ObservedBadge key="b" />],
              ["MEAN NDVI", `${s.mean_ndvi}`, <span key="b" className="badge badge-observed">SENTINEL-2</span>],
            ].map(([label, value, badge], i) => (
              <div key={i} className="bg-ink p-6">
                <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">{label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="font-display text-3xl">{value}</p>
                  {badge}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-labelledby="risk-dist" className="border border-bone/12 p-6">
              <h2 id="risk-dist" className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">HEAT-RISK DISTRIBUTION · 1600 CELLS</h2>
              <div className="mt-4 flex h-5 w-full overflow-hidden rounded-sm" role="img" aria-label={`Risk distribution: ${riskDist.map((r) => `${r.label} ${Math.round((100 * r.value) / total)}%`).join(", ")}`}>
                {riskDist.map((r) => (
                  <div key={r.label} style={{ background: r.color, width: `${(100 * r.value) / total}%` }} />
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {riskDist.map((r) => (
                  <li key={r.label} className="font-mono2 text-[11px]">
                    <span className="ramp-chip mr-2 align-middle" style={{ background: r.color }} />
                    {r.label}
                    <span className="ml-1 text-bone/50">{Math.round((100 * r.value) / total)}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-body text-sm text-bone/60">
                Population exposure ≈ <span className="font-display text-lg text-solar">{formatPop(s.population_total)}</span> residents
                inside the AOI.
              </p>
            </section>

            <section aria-labelledby="provenance" className="border border-bone/12 p-6">
              <h2 id="provenance" className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">LATEST OBSERVATION</h2>
              <dl className="mt-4 space-y-2 font-mono2 text-[12px]">
                {[
                  ["SATELLITE", String(THERMAL_PROVENANCE.satellite)],
                  ["SENSOR", String(THERMAL_PROVENANCE.sensor)],
                  ["DATASET", String(THERMAL_PROVENANCE.dataset)],
                  ["ACQUIRED", String(THERMAL_PROVENANCE.acquisition_time).replace("T", " ").slice(0, 16) + " UTC"],
                  ["NATIVE RESOLUTION", `${THERMAL_PROVENANCE.native_resolution_meters} m`],
                  ["CLOUD COVER", `${THERMAL_PROVENANCE.cloud_cover}%`],
                  ["SCENE ID", String(THERMAL_PROVENANCE.scene_id)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-bone/8 pb-1">
                    <dt className="text-bone/40">{k}</dt>
                    <dd className="text-right text-bone/85">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center gap-2">
                <DemoBadge label="DEMO DATASET" />
                <span className="font-mono2 text-[10px] text-bone/40">synthetic grid mirroring real product metadata</span>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="heat" className="border border-heat px-5 py-3 font-mono2 text-[11px] tracking-[0.2em] text-heat hover:bg-heat hover:text-ink">
              OPEN HEAT MAP →
            </Link>
            <Link to="history" className="border border-bone/25 px-5 py-3 font-mono2 text-[11px] tracking-[0.2em] hover:border-heat hover:text-heat">
              REWIND HISTORY →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
