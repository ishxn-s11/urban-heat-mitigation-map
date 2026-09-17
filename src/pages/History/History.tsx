import { useMemo, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, GitCompareArrows } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useHistoryTimeline, useHistoryAvailability, useHistoryFrame, useHistoryCompare } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { usePrefersReducedMotion } from "@/app/providers";
import { HeatMap } from "@/features/maps/HeatMap";
import { DemoBadge } from "@/components/Badges";
import { formatSigned } from "@/lib/thermal";
import type { MissionEra } from "@/types";

export default function History() {
  const { data: timeline } = useHistoryTimeline();
  const { data: availability } = useHistoryAvailability();
  const year = useAppStore((s) => s.timelineYear);
  const setYear = useAppStore((s) => s.setTimelineYear);
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [compareA, setCompareA] = useState("1986-05-10");
  const [compareB, setCompareB] = useState("2026-05-15");
  const [compareOn, setCompareOn] = useState(false);
  const { data: frame } = useHistoryFrame(year);
  const { data: compare } = useHistoryCompare(compareA, compareB, compareOn);

  const minYear = 1982; // LST product era; imagery-only era disabled for heat view
  const maxYear = 2026;

  // Greedy interval-graph coloring: eras are placed into the first row whose
  // previous band has ended, so concurrent missions never overlap on screen.
  const { packedEras, eraRows } = useMemo(() => {
    type Placed = { era: MissionEra; row: number; left: number; width: number };
    const rowEnds: number[] = [];
    const placed: Placed[] = [];
    for (const era of availability?.eras ?? []) {
      const start = Math.max(era.start_year, minYear);
      const end = Math.min(era.end_year ?? maxYear, maxYear);
      if (start >= end) continue;
      let row = rowEnds.findIndex((e) => start >= e);
      if (row === -1) {
        row = rowEnds.length;
        rowEnds.push(end);
      } else {
        rowEnds[row] = end;
      }
      placed.push({
        era,
        row,
        left: ((start - minYear) / (maxYear - minYear)) * 100,
        width: ((end - start) / (maxYear - minYear)) * 100,
      });
    }
    return { packedEras: placed, eraRows: Math.max(rowEnds.length, 1) };
  }, [availability]);

  const current = timeline?.find((p) => p.year === year) ?? timeline?.[timeline.length - 1];

  // Mission era in force at the scrubbed year. Prefers the era whose satellite
  // family matches the demo frame's provenance (e.g. Landsat 9 → LANDSAT 8/9 ERA),
  // falling back to the first era whose span contains the year.
  const activeEra = useMemo(() => {
    const eras = availability?.eras ?? [];
    const frameSat = frame?.provenance.satellite ?? "";
    return (
      eras.find((e) => frameSat.startsWith(e.satellite.split("/")[0].split(" ")[0]) && year >= e.start_year && (e.end_year == null || year <= e.end_year)) ??
      eras.find((e) => year >= e.start_year && (e.end_year == null || year <= e.end_year))
    );
  }, [availability, year, frame]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-heat">HISTORICAL EARTH</p>
        <h1 className="display-xl mt-2 text-[clamp(2.2rem,5vw,4.5rem)]">
          HOW HAS THIS PLACE<br /><span className="text-heat">CHANGED?</span>
        </h1>
      </div>

      {/* Timeline scrubber */}
      <section className="border border-bone/12 p-6" aria-label="Timeline scrubber">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPlaying((v) => !v)}
            disabled={reduced}
            className="flex h-10 w-10 items-center justify-center border border-heat text-heat disabled:opacity-30"
            aria-label={playing ? "Pause timeline playback" : "Play timeline animation"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={() => setYear(Math.max(minYear, year - 2))} aria-label="Step back two years" className="border border-bone/25 p-2 hover:border-heat hover:text-heat"><ChevronLeft size={14} /></button>
          <button onClick={() => setYear(Math.min(maxYear, year + 2))} aria-label="Step forward two years" className="border border-bone/25 p-2 hover:border-heat hover:text-heat"><ChevronRight size={14} /></button>
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="border border-bone/25 bg-ink px-2 py-1.5 font-mono2 text-[11px]"
          >
            {[0.5, 1, 2, 4].map((s) => <option key={s} value={s}>{s}x</option>)}
          </select>
          <label className="ml-auto flex items-center gap-3 font-mono2 text-[11px] text-bone/50">
            MAX CLOUD COVER
            <select className="border border-bone/25 bg-ink px-2 py-1.5 font-mono2 text-[11px]" defaultValue="20">
              <option value="5">&lt; 5%</option>
              <option value="10">&lt; 10%</option>
              <option value="20">&lt; 20%</option>
            </select>
          </label>
        </div>

        {/* Mission era bands — greedy row packing so concurrent eras never overlap */}
        <div className="relative mt-6" style={{ height: `${eraRows * 1.75 + 1.75}rem` }} aria-hidden>
          {packedEras.map(({ era, row, left, width }) => (
            <div
              key={era.label}
              className="absolute border-x border-bone/20 bg-bone/5"
              style={{ left: `${left}%`, width: `${Math.max(width, 6)}%`, top: `${row * 1.75}rem`, height: "1.5rem" }}
              title={`${era.label} · ${era.satellite} · ${era.sensor} · ${era.resolution}`}
            >
              <span className="block truncate px-1 font-mono2 text-[8px] leading-6 tracking-[0.1em] text-bone/50">{era.label}</span>
            </div>
          ))}
          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={2}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="absolute bottom-0 w-full accent-heat"
            aria-label="Timeline year selector"
          />
        </div>
        <div className="flex items-center justify-between font-mono2 text-[10px] text-bone/40">
          <span>1982 ─ LANDSAT THERMAL PRODUCTS</span>
          <p className="font-display text-2xl text-solar">{year}</p>
          <span>PRESENT</span>
        </div>

        {frame && (
          <p className="mt-3 border-t border-bone/10 pt-3 font-mono2 text-[11px] text-bone/60" aria-live="polite">
            {frame.provenance.satellite} · {frame.provenance.sensor} · {frame.provenance.dataset} · {frame.provenance.resolution} ·
            CLOUD {frame.provenance.cloud_cover}% <DemoBadge label="DEMO FRAME" />
          </p>
        )}
      </section>

      {/* Rewind map — the place itself, scrubbed through the decades */}
      <section className="border border-bone/12 p-6" aria-label="Historical map view">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">REWIND · {year}</h2>
          <p className="font-mono2 text-[10px] text-bone/40">BASEMAP: PRESENT-DAY CONTEXT · OVERLAY: ERA-ACCURATE MISSION LABEL · DRAG THE TIMELINE TO TRAVEL</p>
        </div>
        <HeatMap
          variant="context"
          height="460px"
          overlay={
            <>
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
                <p className="font-display text-5xl text-solar drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{year}</p>
                {frame && (
                  <p className="mt-1 font-mono2 text-[10px] tracking-[0.2em] text-bone/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    {frame.provenance.satellite} · {frame.provenance.sensor} · {frame.provenance.resolution}
                  </p>
                )}
              </div>
              <div className="absolute bottom-14 left-4 max-w-[70%]">
                <p className="border-l-2 border-heat bg-ink/60 pl-2 font-mono2 text-[10px] leading-relaxed text-bone/70 backdrop-blur-sm">
                  {activeEra?.label ?? "NO THERMAL MISSION"} — {activeEra?.note ?? "before continuous LST observation"}
                </p>
              </div>
            </>
          }
        />
      </section>

      {/* Chart */}
      <section className="border border-bone/12 p-6" aria-label="Average summer LST 1982 to 2026">
        <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">AVERAGE SUMMER LST · 1982–2026</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeline}
              onClick={(e) => { if (e?.activeLabel) setYear(Number(e.activeLabel)); }}
            >
              <CartesianGrid stroke="rgba(242,240,232,0.08)" />
              <XAxis dataKey="year" stroke="rgba(242,240,232,0.4)" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <YAxis domain={[40, 44]} stroke="rgba(242,240,232,0.4)" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} unit="°C" />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(242,240,232,.2)", fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <ReferenceLine x={year} stroke="#FF5A1F" strokeWidth={2} />
              <Line type="monotone" dataKey="mean_summer_lst" stroke="#FF5A1F" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 font-mono2 text-[10px] text-bone/40">
          HOVER/CLICK A POINT TO JUMP THE TIMELINE · {current ? `ANOMALY ${formatSigned(current.anomaly, 2)}°C VS 1982–90` : ""} <DemoBadge label="DEMO SERIES" />
        </p>
      </section>

      {/* Compare */}
      <section className="border border-bone/12 p-6" aria-label="Date comparison">
        <div className="flex items-center justify-between">
          <h2 className="font-mono2 text-[11px] tracking-[0.25em] text-bone/60">COMPARE DATES</h2>
          <button
            onClick={() => setCompareOn((v) => !v)}
            className={`flex items-center gap-2 border px-3 py-1.5 font-mono2 text-[10px] tracking-[0.2em] ${compareOn ? "border-heat text-heat" : "border-bone/25 text-bone/60"}`}
            aria-pressed={compareOn}
          >
            <GitCompareArrows size={12} /> {compareOn ? "HIDE" : "COMPARE"}
          </button>
        </div>
        {compareOn && compare && (
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr_1.2fr]">
            <div>
              <label className="font-mono2 text-[10px] text-bone/40" htmlFor="cmp-a">DATE A</label>
              <input id="cmp-a" type="date" value={compareA} onChange={(e) => setCompareA(e.target.value)}
                className="mt-1 w-full border border-bone/25 bg-ink px-3 py-2 font-mono2 text-sm" />
              <p className="mt-1 font-mono2 text-[10px] text-bone/50">1986 · LANDSAT 5 / TM</p>
            </div>
            <div>
              <label className="font-mono2 text-[10px] text-bone/40" htmlFor="cmp-b">DATE B</label>
              <input id="cmp-b" type="date" value={compareB} onChange={(e) => setCompareB(e.target.value)}
                className="mt-1 w-full border border-bone/25 bg-ink px-3 py-2 font-mono2 text-sm" />
              <p className="mt-1 font-mono2 text-[10px] text-bone/50">2026 · LANDSAT 9 / OLI-2</p>
            </div>
            <div className={compare.season_match ? "" : "demo-watermark p-3"}>
              <p className={`font-mono2 text-[10px] tracking-[0.15em] ${compare.season_match ? "text-veg" : "text-heat"}`}>
                {compare.season_match ? "✓ SEASONALLY FAIR" : "⚠ SEASON MISMATCH"}
              </p>
              <p className="mt-1 font-mono2 text-[10px] leading-relaxed text-bone/50">{compare.season_note}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 font-mono2 text-[12px]">
                <div><dt className="text-bone/40">ΔLST</dt><dd className="font-display text-lg text-thermal">{formatSigned(compare.change.delta_lst, 2)}°C</dd></div>
                <div><dt className="text-bone/40">ΔNDVI</dt><dd className="font-display text-lg text-veg">{formatSigned(compare.change.delta_ndvi_pct)}%</dd></div>
                <div><dt className="text-bone/40">ΔBUILT-UP</dt><dd className="font-display text-lg text-solar">{formatSigned(compare.change.delta_built_up_pct)}%</dd></div>
              </dl>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
