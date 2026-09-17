import { useModels } from "@/hooks/queries";
import { ModelBadge, DemoBadge } from "@/components/Badges";

export default function Model() {
  const { data: models } = useModels();
  const m = models?.[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">MODEL CARD</p>
        <h1 className="display-xl mt-2 text-[clamp(2rem,4.5vw,4rem)]">THE MODEL<br />BEHIND THIS ANALYSIS</h1>
      </div>

      {m ? (
        <>
          <div className="grid gap-px border border-bone/10 bg-bone/10 md:grid-cols-4">
            {[
              ["MODEL ID", m.model_id],
              ["VERSION", m.version],
              ["TRAINED", m.training_date.slice(0, 10)],
              ["VALIDATION", "Spatial block CV"],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink p-5">
                <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">{k}</p>
                <p className="mt-1 font-head text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="border border-bone/12 p-6" aria-label="Validation metrics">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">VALIDATION (REFERENCE TRAINING SET)</h2>
              <dl className="mt-4 space-y-3 font-mono2 text-[12px]">
                <div className="flex justify-between border-b border-bone/8 pb-2"><dt className="text-bone/40">MAE</dt><dd className="font-display text-xl">{String(m.metrics.mae)} °C</dd></div>
                <div className="flex justify-between border-b border-bone/8 pb-2"><dt className="text-bone/40">RMSE</dt><dd className="font-display text-xl">{String(m.metrics.rmse)} °C</dd></div>
                <div className="flex justify-between border-b border-bone/8 pb-2"><dt className="text-bone/40">R²</dt><dd className="font-display text-xl">{String(m.metrics.r2)}</dd></div>
              </dl>
              <p className="mt-4 font-mono2 text-[10px] leading-relaxed text-bone/45">
                {m.validation_method}. Metrics are from the documented reference
                generator — NOT presented as real-world accuracy. Spatial block
                CV prevents neighboring-pixel leakage between train and test folds.
              </p>
            </section>

            <section className="border border-bone/12 p-6" aria-label="Applicability">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">AOI APPLICABILITY</h2>
              <p className="mt-4 flex items-center gap-3 font-head text-sm">
                <span className="text-veg">✓</span> Semi-arid / tropical / temperate / arid / continental climates
              </p>
              <p className="mt-2 flex items-center gap-3 font-head text-sm">
                <span className="text-veg">✓</span> Latitude −60° … 70°
              </p>
              <p className="mt-2 flex items-center gap-3 font-head text-sm">
                <span className="text-solar">△</span> Polar & high-albedo coastal regimes → OUT-OF-DISTRIBUTION WARNING
              </p>
              <p className="mt-4 font-mono2 text-[10px] leading-relaxed text-bone/45">
                The ModelRouter checks the AOI against the training envelope before
                inference; extrapolation lowers confidence and is flagged in every response.
              </p>
              <h3 className="mt-6 font-mono2 text-[11px] tracking-[0.25em] text-bone/60">PHYSICS CHECK</h3>
              <p className="mt-2 flex items-center gap-2 font-mono2 text-[12px]">
                <ModelBadge /> NDVI→LST monotone: {String(m.physics_check.ndvi_monotone)} ({m.physics_check.ndvi_effect_degC} °C effect)
              </p>
            </section>
          </div>

          <section className="border border-bone/12 p-6" aria-label="Feature schema">
            <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">FEATURE SCHEMA ({m.features.length})</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {m.features.map((f) => (
                <li key={f} className="border border-bone/15 px-2 py-1 font-mono2 text-[10px] text-bone/60">{f}</li>
              ))}
            </ul>
            <p className="mt-4 font-mono2 text-[10px] text-bone/45">
              Training domains: {m.training_domains.climates.join(" · ")} — no city-ID memorization; geographic context enters as coordinates, climate class and solar geometry.
            </p>
            <div className="mt-4"><DemoBadge label="REFERENCE TRAINING SET" /></div>
          </section>
        </>
      ) : (
        <p className="demo-watermark p-6 font-mono2 text-sm text-heat">
          NO TRAINED MODEL IN REGISTRY — run <code>python -m app.ml.training.train_model</code> in the backend.
        </p>
      )}
    </div>
  );
}
