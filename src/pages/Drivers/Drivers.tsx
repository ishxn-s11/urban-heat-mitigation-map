import { useHotspotExplanation, useHotspots } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { DemoBadge } from "@/components/Badges";

export default function Drivers() {
  const { data: hotspots } = useHotspots();
  const selected = useAppStore((s) => s.selectedHotspot);
  const selectHotspot = useAppStore((s) => s.selectHotspot);
  const id = selected?.hotspot_id ?? hotspots?.[0]?.hotspot_id ?? null;
  const { data: ex } = useHotspotExplanation(id);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">DRIVER ANALYSIS</p>
        <h1 className="display-xl mt-2 text-[clamp(2.2rem,5vw,4.5rem)]">
          WHY IS THIS<br />PLACE <span className="text-heat">HOT?</span>
        </h1>
      </div>

      <div role="tablist" aria-label="Hotspot selector" className="flex flex-wrap gap-2">
        {(hotspots ?? []).map((hs) => (
          <button
            key={hs.hotspot_id}
            role="tab"
            aria-selected={(id === hs.hotspot_id)}
            onClick={() => selectHotspot(hs)}
            className={`border px-4 py-2 font-mono2 text-[11px] tracking-[0.15em] ${
              id === hs.hotspot_id ? "border-heat bg-heat/10 text-heat" : "border-bone/20 text-bone/60 hover:text-bone"
            }`}
          >
            {hs.name}
          </button>
        ))}
      </div>

      {ex && (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section className="border border-bone/12 p-6" aria-label="Driver contributions">
            <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">
              MODEL-ASSOCIATED CONTRIBUTIONS · {ex.name.toUpperCase()}
            </h2>
            <div className="mt-6 space-y-3">
              {[...ex.warming_factors, ...ex.cooling_factors]
                .slice()
                .sort((a, b) => b.contribution - a.contribution)
                .map((d) => (
                  <div key={d.feature} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 font-mono2 text-[11px] text-bone/70">{d.feature}</span>
                    <div className="h-3 flex-1 bg-bone/8">
                      <div
                        className={`h-full ${d.direction === "warming" ? "bg-thermal" : "bg-water"}`}
                        style={{ width: `${(d.contribution / 35) * 100}%` }}
                      />
                    </div>
                    <span className={`w-12 text-right font-mono2 text-[12px] ${d.direction === "warming" ? "text-thermal" : "text-water"}`}>
                      {d.direction === "warming" ? "+" : "−"}{d.contribution}%
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-8 space-y-3">
              <p className="font-mono2 text-[10px] leading-relaxed text-bone/50">
                <span className="text-thermal">■</span> warming factor — associated with higher LST in the model grid
              </p>
              <p className="font-mono2 text-[10px] leading-relaxed text-bone/50">
                <span className="text-water">■</span> cooling factor — associated with lower LST in the model grid
              </p>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="demo-watermark p-5">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-heat">METHODOLOGY</h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-bone/70">{ex.methodology}</p>
              <p className="mt-3 font-mono2 text-[10px] text-bone/45">
                Attribution engine:{" "}
                <span className="text-solar">
                  {ex.explanation_method === "shap_tree_explainer_exact"
                    ? "SHAP (exact tree explainer)"
                    : "demo feature contributions"}
                </span>
                {ex.model_version ? ` · model v${ex.model_version}` : ""}
              </p>
              {typeof ex.base_value === "number" && typeof ex.predicted_lst === "number" && (
                <p className="mt-2 font-mono2 text-[10px] text-bone/55">
                  base {ex.base_value}°C → predicted {ex.predicted_lst}°C for this cell
                </p>
              )}
            </section>
            <section className="border border-bone/12 p-5">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">CONFIDENCE</h2>
              <p className="mt-2 font-display text-3xl text-solar">{ex.confidence}</p>
              <p className="mt-2 font-body text-xs leading-relaxed text-bone/50">
                Attribution confidence reflects demo data. Values are associations,
                not causal effects — correlation between surface state and temperature
                is not proof of mechanism.
              </p>
              <div className="mt-3"><DemoBadge /></div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
