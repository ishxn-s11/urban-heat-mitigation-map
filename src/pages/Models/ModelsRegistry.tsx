import { Link } from "react-router-dom";
import { useModels } from "@/hooks/queries";
import { ModelBadge } from "@/components/Badges";

export default function ModelsRegistry() {
  const { data: models } = useModels();

  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="border-b border-bone/10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl text-heat">UrbanFlux</Link>
          <Link to="/research" className="font-mono2 text-[11px] tracking-[0.2em] text-bone/60 hover:text-heat">METHODOLOGY →</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-16">
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">MODEL REGISTRY</p>
        <h1 className="display-xl mt-3 text-[clamp(2.6rem,7vw,6.5rem)]">
          EVERY WEIGHT<br /><span className="text-heat">ACCOUNTED FOR.</span>
        </h1>

        <div className="mt-12 space-y-6">
          {(models ?? []).map((m) => (
            <article key={m.model_id} className="border border-bone/15 p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-3xl">{m.model_name}</h2>
                <div className="flex items-center gap-2">
                  <ModelBadge />
                  <span className="font-mono2 text-[11px] text-bone/40">v{m.version}</span>
                </div>
              </div>
              <p className="mt-2 font-mono2 text-[11px] text-bone/50">
                {m.model_id} · trained {m.training_date.slice(0, 10)} · regions: {m.training_regions.join(", ")}
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div>
                  <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">VALIDATION METRICS</p>
                  <dl className="mt-2 space-y-1 font-mono2 text-[12px]">
                    <div className="flex justify-between"><dt className="text-bone/45">MAE</dt><dd>{String(m.metrics.mae)} °C</dd></div>
                    <div className="flex justify-between"><dt className="text-bone/45">RMSE</dt><dd>{String(m.metrics.rmse)} °C</dd></div>
                    <div className="flex justify-between"><dt className="text-bone/45">R²</dt><dd>{String(m.metrics.r2)}</dd></div>
                  </dl>
                  <p className="mt-2 font-mono2 text-[9px] leading-relaxed text-bone/35">{m.validation_method}</p>
                </div>
                <div>
                  <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">TRAINING DOMAINS</p>
                  <p className="mt-2 font-mono2 text-[12px] leading-relaxed text-bone/70">
                    {m.training_domains.climates.join(" · ")}<br />
                    lat {m.training_domains.latitude_range[0]}° … {m.training_domains.latitude_range[1]}°
                  </p>
                </div>
                <div>
                  <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">ARTIFACT</p>
                  <p className="mt-2 break-all font-mono2 text-[10px] text-bone/50">sha256:{m.artifact_sha256}</p>
                  <p className="mt-2 font-mono2 text-[10px] text-veg">
                    physics-check: NDVI monotone {m.physics_check.ndvi_monotone ? "✓" : "✗"} ({m.physics_check.ndvi_effect_degC}°C)
                  </p>
                </div>
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer font-mono2 text-[10px] tracking-[0.2em] text-bone/50 hover:text-heat">
                  FEATURE SCHEMA ({m.features.length})
                </summary>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {m.features.map((f) => (
                    <li key={f} className="border border-bone/15 px-2 py-1 font-mono2 text-[10px] text-bone/60">{f}</li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-3xl font-body text-sm leading-relaxed text-bone/55">
          The registry is the single source of truth for what powers inference.
          Metrics are reported exactly as measured on the stated validation scheme —
          including the reference training set used in this build — and never
          presented as real-world accuracy.
        </p>
      </div>
    </div>
  );
}
