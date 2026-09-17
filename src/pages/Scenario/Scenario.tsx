import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { useRunScenario } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { HeatMap } from "@/features/maps/HeatMap";
import { SimulatedBadge, DemoBadge, ObservedBadge } from "@/components/Badges";
import { formatSigned, formatUSD, formatPop } from "@/lib/thermal";
import type { ScenarioResult } from "@/types";

function BeforeAfter({ result }: { result: ScenarioResult }) {
  const [pos, setPos] = useState(50);
  const n = result.simulated_lst.length;
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return (
    <div>
      <div
        className="relative h-40 select-none overflow-hidden border border-bone/20"
        role="slider"
        aria-label="Before after comparison slider"
        aria-valuenow={pos}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
        }}
        onClick={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          setPos(((e.clientX - rect.left) / rect.width) * 100);
        }}
      >
        {/* CURRENT (observed-style banding) */}
        <div className="absolute inset-0" aria-hidden>
          {Array.from({ length: 64 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${(i / 64) * 100}%`,
                width: `${100 / 64}%`,
                background: `hsl(${18 + ((i * 7919) % 40)}, 95%, ${28 + ((i * 31) % 22)}%)`,
              }}
            />
          ))}
        </div>
        {/* SIMULATED (cooler banding, clipped to slider) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} aria-hidden>
          {Array.from({ length: 64 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${(i / 64) * 100}%`,
                width: `${100 / 64}%`,
                background: `hsl(${150 + ((i * 6151) % 50)}, 45%, ${22 + ((i * 37) % 16)}%)`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 w-0.5 bg-bone" style={{ left: `${pos}%` }} aria-hidden />
        <p className="absolute left-3 top-2 font-mono2 text-[10px] tracking-[0.2em] text-ink">UrbanFlux OPTIMIZED →</p>
        <p className="absolute right-3 top-2 font-mono2 text-[10px] tracking-[0.2em] text-bone">← CURRENT CITY</p>
      </div>
      <p className="mt-2 font-mono2 text-[10px] text-bone/45">
        MEAN CURRENT 41.8°C →
        SIMULATED {(mean(result.delta_lst.map((d) => 41.8 + d))).toFixed(1)}°C ·
        ILLUSTRATIVE BANDING — NOT SATELLITE IMAGERY
      </p>
      <p className="font-mono2 text-[9px] text-bone/30">n cells = {n} · drag / arrow keys to move the divider</p>
    </div>
  );
}

export default function Scenario() {
  const run = useRunScenario();
  const selectScenario = useAppStore((s) => s.selectScenario);
  const [params, setParams] = useState({
    tree_canopy_percent: 15,
    cool_roof_percent: 30,
    green_roof_percent: 0,
    albedo_delta: 0.05,
    water_area_delta: 0,
    climate: "semi-arid",
  });

  const result = run.data?.result ?? null;

  const stats = useMemo(() => {
    if (!result) return null;
    return result.summary;
  }, [result]);

  function submit() {
    selectScenario(null);
    run.mutate(params);
  }

  const SLIDERS: Array<[keyof typeof params, string, number, number, number, string]> = [
    ["tree_canopy_percent", "TREE COVER", 0, 50, 1, "%"],
    ["cool_roof_percent", "COOL ROOFS", 0, 100, 1, "%"],
    ["green_roof_percent", "GREEN ROOFS", 0, 100, 1, "%"],
    ["albedo_delta", "ALBEDO Δ", 0, 0.45, 0.01, ""],
    ["water_area_delta", "WATER AREA", 0, 10, 0.5, "%"],
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">SCENARIO LAB</p>
        <h1 className="display-xl mt-2 text-[clamp(2.2rem,5vw,4.5rem)]">
          WHAT IF WE<br /><span className="text-heat">CHANGED THE CITY?</span>
        </h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.4fr]">
        {/* Controls */}
        <section className="border border-bone/12 p-6" aria-label="Intervention controls">
          <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">INTERVENTION BUILDER</h2>
          <div className="mt-6 space-y-6">
            {SLIDERS.map(([key, label, min, max, step, unit]) => (
              <div key={key}>
                <div className="flex justify-between font-mono2 text-[11px]">
                  <label htmlFor={`sl-${key}`} className="tracking-[0.15em] text-bone/70">{label}</label>
                  <span className="text-solar">{params[key]}{unit}</span>
                </div>
                <input
                  id={`sl-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={Number(params[key])}
                  onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
                  className="mt-1 w-full accent-heat"
                />
              </div>
            ))}
            <div>
              <label htmlFor="climate" className="font-mono2 text-[11px] tracking-[0.15em] text-bone/70">CLIMATE CONTEXT</label>
              <select
                id="climate"
                value={params.climate}
                onChange={(e) => setParams((p) => ({ ...p, climate: e.target.value }))}
                className="mt-1 w-full border border-bone/25 bg-ink px-3 py-2 font-mono2 text-sm"
              >
                {["semi-arid", "arid", "tropical", "temperate"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <p className="mt-1 font-mono2 text-[9px] text-bone/35">moisture-limited evapotranspiration adjusts vegetation cooling</p>
            </div>
            <button
              onClick={submit}
              disabled={run.isPending}
              className="flex w-full items-center justify-center gap-3 bg-heat py-4 font-mono2 text-[12px] tracking-[0.25em] text-ink hover:bg-solar disabled:opacity-50"
            >
              <Play size={14} /> {run.isPending ? "SIMULATING…" : "RUN SIMULATION"}
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="space-y-6" aria-live="polite">
          {stats ? (
            <>
              <div className="grid grid-cols-2 gap-px border border-bone/10 bg-bone/10 sm:grid-cols-4">
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">BASELINE</p>
                  <p className="mt-1 font-display text-2xl">41.8°C <ObservedBadge /></p>
                </div>
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">SIMULATED</p>
                  <p className="mt-1 font-display text-2xl text-water">{stats.mean_simulated_lst}°C <SimulatedBadge /></p>
                </div>
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">Δ MEAN</p>
                  <p className="mt-1 font-display text-2xl text-heat">{formatSigned(stats.mean_delta_lst, 2)}°C</p>
                </div>
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">MAX COOLING</p>
                  <p className="mt-1 font-display text-2xl text-solar">{formatSigned(stats.max_cooling, 1)}°C</p>
                </div>
              </div>

              <div className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-3">
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">POPULATION BENEFITED</p>
                  <p className="mt-1 font-display text-2xl">{formatPop(stats.population_benefited)} <span className="font-mono2 text-[10px] text-bone/40">({stats.population_pct}%)</span></p>
                </div>
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">EXTREME CELLS</p>
                  <p className="mt-1 font-display text-2xl">{stats.hotspot_count_before} → {stats.hotspot_count_after}</p>
                </div>
                <div className="bg-ink p-4">
                  <p className="font-mono2 text-[9px] tracking-[0.15em] text-bone/40">ESTIMATED COST</p>
                  <p className="mt-1 font-display text-2xl">{formatUSD(stats.estimated_cost_usd)}</p>
                </div>
              </div>

              <div className="demo-watermark p-4">
                <DemoBadge /> <span className="ml-2 font-mono2 text-[10px] text-bone/55">
                  first-order energy-balance heuristic on synthetic demo grid — not a calibrated local prediction
                </span>
              </div>

              <BeforeAfter result={result!} />
            </>
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center border border-dashed border-bone/20 p-10 text-center">
              <p className="font-mono2 text-[11px] leading-relaxed tracking-[0.2em] text-bone/40">
                SET INTERVENTIONS AND RUN —<br />BASELINE vs SIMULATED APPEARS HERE
              </p>
            </div>
          )}
        </section>
      </div>

      {result && (
        <section aria-label="Simulated map">
          <h2 className="mb-3 font-mono2 text-[11px] tracking-[0.25em] text-bone/60">SIMULATED GRID · ΔLST <SimulatedBadge /> <DemoBadge /></h2>
          <HeatMap scenario={result} height="480px" />
        </section>
      )}
    </div>
  );
}
