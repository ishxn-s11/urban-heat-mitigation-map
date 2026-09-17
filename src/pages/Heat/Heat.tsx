import { useParams } from "react-router-dom";
import { HeatMap, cellLngLat, aoiBbox } from "@/features/maps/HeatMap";
import { useHotspots, useHotspotExplanation } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { ObservedBadge, DemoBadge } from "@/components/Badges";
import { riskColor, formatCoord } from "@/lib/thermal";

export default function Heat() {
  const { aoiId } = useParams();
  const { data: hotspots } = useHotspots();
  const selected = useAppStore((s) => s.selectedHotspot);
  const selectHotspot = useAppStore((s) => s.selectHotspot);
  const aoi = useAppStore((s) => s.aoi);
  const { data: explanation } = useHotspotExplanation(selected?.hotspot_id ?? null);

  // Cell coordinates derive from the ACTIVE AOI grid, never hardcoded demo values.
  const cellCoord = (x: number, y: number) => {
    const [lon, lat] = cellLngLat(aoiBbox(aoi), x, y);
    return formatCoord(lat, lon);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">AOI {aoiId}</p>
          <h1 className="display-xl mt-1 text-[clamp(2rem,4.5vw,4rem)]">HEAT MAP</h1>
        </div>
        <div className="flex items-center gap-2">
          <ObservedBadge />
          <DemoBadge />
          <span className="font-mono2 text-[10px] text-bone/40">LST grid 40×40 · ~0.5 km cells</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <HeatMap height="620px" />

        <aside className="space-y-4" aria-label="Hotspot panel">
          <section className="border border-bone/12 p-5">
            <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">HOTSPOTS · SELECT TO SYNC</h2>
            <ul className="mt-3 space-y-2">
              {(hotspots ?? []).map((hs) => (
                <li key={hs.hotspot_id}>
                  <button
                    onClick={() => selectHotspot(hs)}
                    aria-pressed={selected?.hotspot_id === hs.hotspot_id}
                    className={`flex w-full items-center justify-between border p-3 text-left transition-colors ${
                      selected?.hotspot_id === hs.hotspot_id ? "border-heat bg-heat/10" : "border-bone/12 hover:border-bone/35"
                    }`}
                  >
                    <div>
                      <p className="font-head text-sm font-semibold">{hs.name}</p>
                      <p className="font-mono2 text-[10px] text-bone/40">
                        {cellCoord(hs.cell.x, hs.cell.y)} · cell {hs.cell.cell_index}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl" style={{ color: riskColor(hs.intensity) }}>{hs.mean_lst}°C</p>
                      <p className="font-mono2 text-[9px] text-bone/40">{hs.intensity}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selected && explanation && (
            <section className="border border-heat/40 p-5" aria-live="polite">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-heat">WHY IS THIS CELL HOT?</h2>
              <p className="mt-1 font-head text-lg font-semibold">{selected.name}</p>
              <ul className="mt-4 space-y-1.5">
                {explanation.warming_factors.map((d) => (
                  <li key={d.feature} className="flex items-center gap-2 font-mono2 text-[11px]">
                    <span className="w-40 shrink-0 text-bone/70">{d.feature}</span>
                    <div className="h-2 flex-1 bg-bone/10">
                      <div className="h-full bg-thermal" style={{ width: `${(d.contribution / 35) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right">+{d.contribution}%</span>
                  </li>
                ))}
                {explanation.cooling_factors.map((d) => (
                  <li key={d.feature} className="flex items-center gap-2 font-mono2 text-[11px]">
                    <span className="w-40 shrink-0 text-bone/70">{d.feature}</span>
                    <div className="h-2 flex-1 bg-bone/10">
                      <div className="h-full bg-water" style={{ width: `${(d.contribution / 35) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right text-water">−{d.contribution}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-bone/10 pt-3 font-mono2 text-[9px] leading-relaxed text-bone/40">
                {explanation.methodology}
                {explanation.explanation_method === "shap_tree_explainer_exact" && explanation.model_version && (
                  <span className="mt-1 block text-solar">SHAP · model v{explanation.model_version}</span>
                )}
              </p>
              <p className="mt-2 font-mono2 text-[9px] tracking-[0.15em] text-heat">CONFIDENCE: {explanation.confidence}</p>
              <a href="#/drivers" className="mt-3 inline-block font-mono2 text-[10px] tracking-[0.2em] text-solar hover:underline">
                FULL DRIVER ANALYSIS →
              </a>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
