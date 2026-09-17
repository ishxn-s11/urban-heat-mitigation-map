import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ResponsiveContainer, Cell } from "recharts";
import { useRunOptimization } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { DemoBadge } from "@/components/Badges";
import { formatUSD, formatPop, formatSigned } from "@/lib/thermal";

export default function Optimize() {
  const run = useRunOptimization();
  const [budget, setBudget] = useState(4_000_000);
  const selectedId = useAppStore((s) => s.selectedSolutionId);
  const selectSolution = useAppStore((s) => s.selectSolution);

  const data = run.data;
  const solutions = data?.solutions ?? [];
  const selected = solutions.find((s) => s.solution_id === selectedId) ?? data?.recommendation;
  const sel = selected as (typeof solutions)[number] | undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">OPTIMIZATION ENGINE · NSGA-II</p>
          <h1 className="display-xl mt-2 text-[clamp(2.2rem,5vw,4.5rem)]">
            THE PARETO<br /><span className="text-heat">FRONTIER.</span>
          </h1>
        </div>
        <div className="flex items-end gap-3">
          <label className="font-mono2 text-[10px] text-bone/40">
            BUDGET
            <input
              type="number"
              min={500000}
              step={500000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-1 block w-40 border border-bone/25 bg-ink px-3 py-2 font-mono2 text-sm text-bone"
            />
          </label>
          <button
            onClick={() => run.mutate(budget)}
            disabled={run.isPending}
            className="bg-heat px-6 py-3 font-mono2 text-[11px] tracking-[0.2em] text-ink hover:bg-solar disabled:opacity-50"
          >
            {run.isPending ? "OPTIMIZING…" : "RUN OPTIMIZER"}
          </button>
        </div>
      </div>

      {data ? (
        <>
          <section className="border border-bone/12 p-6" aria-label="Pareto frontier scatter">
            <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">
              COST (→) VS MEAN COOLING (↑) · BUBBLE = POPULATION BENEFITED · {data.n_solutions} NON-DOMINATED SOLUTIONS
            </h2>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid stroke="rgba(242,240,232,0.08)" />
                  <XAxis
                    type="number" dataKey="cost_usd" name="Cost" tickFormatter={(v: number) => formatUSD(v)}
                    stroke="rgba(242,240,232,0.4)" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    label={{ value: "IMPLEMENTATION COST (USD)", position: "insideBottom", offset: -12, fill: "rgba(242,240,232,.4)", fontSize: 10 }}
                  />
                  <YAxis
                    type="number" dataKey="mean_cooling_deg_c" name="Cooling" unit="°C" domain={[0, "auto"]}
                    stroke="rgba(242,240,232,0.4)" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                  />
                  <ZAxis type="number" dataKey="population_benefited" range={[40, 420]} name="Population" />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid rgba(242,240,232,.2)", fontFamily: "JetBrains Mono", fontSize: 11 }}
                    formatter={(v: number, n: string) => [n === "Cost" ? formatUSD(v) : n === "Population" ? formatPop(v) : `${v}°C`, n]}
                  />
                  <Scatter
                    data={solutions}
                    isAnimationActive={false}
                    onClick={(d) => selectSolution(d.solution_id)}
                  >
                    {solutions.map((s) => (
                      <Cell
                        key={s.solution_id}
                        fill={s.solution_id === selectedId ? "#FFD43B" : s.cost_usd <= budget ? "#FF5A1F" : "#5b4a42"}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 font-mono2 text-[10px] text-bone/40">
              CLICK A POINT TO INSPECT ITS INTERVENTION MIX — <DemoBadge /> {data.algorithm}
            </p>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="border border-heat/40 p-6" aria-label="Selected solution">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-heat">
                {sel && "solution_id" in sel ? `SOLUTION ${sel.solution_id}` : "RECOMMENDED (KNEE POINT)"}
              </h2>
              {sel && (
                <dl className="mt-4 space-y-2 font-mono2 text-[12px]">
                  {[
                    ["MEAN COOLING", `${formatSigned(sel.mean_cooling_deg_c, 2)} °C`],
                    ["TOTAL COOLING", sel.total_cooling_deg_c !== undefined ? `${sel.total_cooling_deg_c} °C·cells` : "—"],
                    ["COST", formatUSD(sel.cost_usd)],
                    ["POPULATION BENEFITED", formatPop(sel.population_benefited)],
                    ["EXTREME CELLS RECOVERED", sel.extreme_cells_recovered !== undefined ? String(sel.extreme_cells_recovered) : "—"],
                    ["FEASIBILITY", `${Math.round(sel.feasibility * 100)}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-bone/8 pb-1.5">
                      <dt className="text-bone/40">{k}</dt>
                      <dd className="font-display text-base">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {sel && "intervention_mix" in sel && (
                <div className="mt-4">
                  <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">INTERVENTION MIX</p>
                  <div className="mt-2 flex h-4 overflow-hidden rounded-sm border border-bone/15">
                    <div className="bg-veg" style={{ width: `${sel.intervention_mix.TREE_CANOPY * 100}%` }} />
                    <div className="bg-solar" style={{ width: `${sel.intervention_mix.COOL_ROOFS * 100}%` }} />
                  </div>
                  <p className="mt-1 font-mono2 text-[10px] text-bone/50">
                    TREE CANOPY {(sel.intervention_mix.TREE_CANOPY * 100).toFixed(0)}% · COOL ROOFS {(sel.intervention_mix.COOL_ROOFS * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </section>

            <section className="demo-watermark p-6" aria-label="Recommendation">
              <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-heat">UrbanFlux RECOMMENDATION</h2>
              <p className="mt-3 font-head text-lg font-semibold">
                {data.recommendation.interventions.join(" + ")}
              </p>
              <p className="mt-4 font-body text-sm leading-relaxed text-bone/70">
                Among budget-feasible Pareto solutions, this mix maximizes cooling
                per invested $M: {formatSigned(data.recommendation.mean_cooling_deg_c, 2)}°C mean
                cooling for {formatUSD(data.recommendation.cost_usd)}, benefiting{" "}
                {formatPop(data.recommendation.population_benefited)} residents at{" "}
                {Math.round(data.recommendation.feasibility * 100)}% feasibility.
              </p>
              <p className="mt-4 font-mono2 text-[10px] leading-relaxed text-bone/45">
                Optimization runs on the demo grid with the same energy-balance
                response the scenario engine uses. RAG evidence explains candidate
                interventions; the optimizer — not the LLM — decides allocation.
              </p>
            </section>
          </div>
        </>
      ) : (
        <div className="flex h-64 items-center justify-center border border-dashed border-bone/20">
          <p className="font-mono2 text-[11px] tracking-[0.25em] text-bone/40">RUN THE OPTIMIZER TO GENERATE THE PARETO FRONT</p>
        </div>
      )}
    </div>
  );
}
