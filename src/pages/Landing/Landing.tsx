import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ThermalDisc from "@/features/thermal-disc/ThermalDisc";
import { DemoBadge } from "@/components/Badges";
import { useHeatSummary, useHotspots } from "@/hooks/queries";
import { usePrefersReducedMotion } from "@/app/providers";

function useReveal() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced || !ref.current) return;
    let ctx: gsap.Context | undefined;
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
            gsap.fromTo(
              el,
              { y: 40, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 85%" } },
            );
          });
        }, ref.current!);
      });
    });
    return () => ctx?.revert();
  }, [reduced]);
  return ref;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="display-xl text-[clamp(2.4rem,7vw,6rem)]" data-reveal>
      {children}
    </h2>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 font-mono2 text-[11px] tracking-[0.3em] text-heat" data-reveal>{children}</p>
  );
}

export default function Landing() {
  const ref = useReveal();
  const { data: summary } = useHeatSummary();
  const { data: hotspots } = useHotspots();

  return (
    <div ref={ref} className="bg-ink text-bone">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-bone/10 bg-ink/85 backdrop-blur">
        <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3" aria-label="Main">
          <Link to="/" className="font-display text-xl text-heat">UrbanFlux</Link>
          <ul className="hidden items-center gap-7 font-mono2 text-[11px] tracking-[0.2em] md:flex">
            <li><a className="hover:text-heat" href="#problem">PROBLEM</a></li>
            <li><a className="hover:text-heat" href="#data">DATA</a></li>
            <li><a className="hover:text-heat" href="#model">MODEL</a></li>
            <li><a className="hover:text-heat" href="#explorer">EXPLORER</a></li>
            <li><Link className="hover:text-heat" to="/datasets">SATELLITES</Link></li>
            <li><Link className="hover:text-heat" to="/research">RESEARCH</Link></li>
          </ul>
          <Link
            to="/explore"
            className="flex items-center gap-2 border border-heat px-4 py-2 font-mono2 text-[11px] tracking-[0.2em] text-heat transition-colors hover:bg-heat hover:text-ink"
          >
            EXPLORE EARTH <ArrowUpRight size={13} />
          </Link>
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="pointer-events-none absolute -right-40 top-1/2 w-[52rem] opacity-25" aria-hidden>
          <ThermalDisc texture="LST" className="aspect-square" />
        </div>
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 px-5 py-20 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-mono2 text-[11px] tracking-[0.35em] text-solar" data-reveal>
              URBAN CLIMATE INTELLIGENCE · 1972 → PRESENT
            </p>
            <h1 className="display-xl mt-6 text-[clamp(3.4rem,10vw,9.5rem)]">
              THE CITY<br />
              BECOMES<br />
              <span className="text-heat">A MODEL.</span>
            </h1>
            <p className="mt-8 max-w-xl font-body text-lg leading-relaxed text-bone/70" data-reveal>
              UrbanFlux turns four decades of satellite observation into a working
              digital twin of urban heat — locate any city on Earth, trace what
              made it hot, test what would cool it down.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4" data-reveal>
              <Link
                to="/explore"
                className="flex items-center gap-3 bg-heat px-7 py-4 font-mono2 text-[12px] tracking-[0.25em] text-ink transition-transform hover:-translate-y-0.5"
              >
                SEARCH THE PLANET <ArrowRight size={14} />
              </Link>
              <a href="#explorer" className="border border-bone/25 px-7 py-4 font-mono2 text-[12px] tracking-[0.25em] hover:border-heat hover:text-heat">
                SEE THE HEAT
              </a>
            </div>
            {summary && (
              <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-bone/10 pt-6" data-reveal>
                <div>
                  <dt className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">MEAN LST · DELHI DEMO</dt>
                  <dd className="font-display text-3xl text-solar">{summary.mean_lst}°C <DemoBadge label="DEMO" /></dd>
                </div>
                <div>
                  <dt className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">HOT CELLS</dt>
                  <dd className="font-display text-3xl">{summary.hot_cells}</dd>
                </div>
                <div>
                  <dt className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">POP. EXPOSED</dt>
                  <dd className="font-display text-3xl">{(summary.population_total / 1e6).toFixed(1)}M</dd>
                </div>
              </dl>
            )}
          </div>
          <div className="relative hidden items-center justify-center lg:flex" aria-hidden>
            <div className="w-[30rem]">
              <ThermalDisc texture="LST" className="aspect-square" />
              <p className="mt-4 text-center font-mono2 text-[10px] tracking-[0.25em] text-bone/40">
                LST DISC · INTERACTIVE · DRAG TO TILT
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────────── */}
      <section id="problem" className="border-t border-bone/10 py-28">
        <div className="mx-auto max-w-[1500px] px-5">
          <Kicker>01 — THE PROBLEM</Kicker>
          <H2>DON'T JUST<br />PREDICT HEAT.<br /><span className="text-heat">EXPLAIN IT.</span></H2>
          <div className="mt-14 grid gap-px overflow-hidden border border-bone/10 bg-bone/10 md:grid-cols-3" data-reveal>
            {[
              ["WHERE", "Static heat maps show temperature. They cannot say why one block burns while the park beside it breathes."],
              ["WHY", "Vegetation, built density, albedo, water and wind conspire. UrbanFlux decomposes their model-associated contributions."],
              ["WHAT IF", "Trees here, cool roofs there, water where wind carries it. Simulate before a single shovel breaks ground."],
            ].map(([k, t]) => (
              <div key={k} className="bg-ink p-8">
                <p className="font-display text-4xl text-heat">{k}</p>
                <p className="mt-4 font-body text-sm leading-relaxed text-bone/65">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DATA UNIVERSE ───────────────────────────────────── */}
      <section id="data" className="border-t border-bone/10 py-28">
        <div className="mx-auto max-w-[1500px] px-5">
          <Kicker>02 — THE DATA UNIVERSE</Kicker>
          <H2>FIFTY YEARS OF<br />WATCHING EARTH<br /><span className="text-outline">BURN.</span></H2>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-reveal>
            {[
              ["LANDSAT 4–9", "TIRS / OLI", "Surface temperature since 1982. The thermal backbone.", "#FF5A1F"],
              ["SENTINEL-2", "MSI · 10 m", "Vegetation, water, built-up — the urban form in color.", "#4CAF50"],
              ["MODIS · VIIRS", "1 km · daily", "Every day, every city. Thermal continuity and history.", "#FFD43B"],
              ["ERA5", "ECMWF REANALYSIS", "Atmospheric context since 1940. Weather is half the story.", "#1677FF"],
            ].map(([m, s, t, c]) => (
              <div key={m} className="border border-bone/12 p-6 transition-colors hover:border-bone/30" style={{ borderTopColor: c as string, borderTopWidth: 3 }}>
                <p className="font-display text-2xl">{m}</p>
                <p className="mt-1 font-mono2 text-[10px] tracking-[0.2em]" style={{ color: c as string }}>{s}</p>
                <p className="mt-4 font-body text-sm text-bone/60">{t}</p>
              </div>
            ))}
          </div>
          <Link to="/datasets" className="mt-10 inline-flex items-center gap-2 font-mono2 text-[11px] tracking-[0.25em] text-heat hover:text-solar" data-reveal>
            FULL MISSION CATALOG <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── MODEL / PHYSICS ─────────────────────────────────── */}
      <section id="model" className="border-t border-bone/10 py-28">
        <div className="mx-auto grid max-w-[1500px] gap-16 px-5 lg:grid-cols-2">
          <div>
            <Kicker>03 — THE MODEL</Kicker>
            <H2>PHYSICS<br />CONSTRAINS<br /><span className="text-heat">THE AI.</span></H2>
            <p className="mt-8 max-w-lg font-body text-base leading-relaxed text-bone/70" data-reveal>
              Machine learning finds the patterns. Physics keeps it honest. Every
              simulation respects the surface energy balance
              <span className="font-mono2 text-solar"> Rn = H + LE + G</span> — vegetation
              cools by evaporating water, albedo deflects sunlight, water breathes
              into the wind.
            </p>
          </div>
          <div className="space-y-6 self-center" data-reveal>
            {[
              ["Rn = H + LE + G", "Net radiation splits into sensible, latent and ground flux. Interventions re-partition it."],
              ["ΔRn = −Δα · S↓", "Raising albedo by Δα deflects Δα·S↓ of incoming shortwave before it ever becomes heat."],
              ["f_w · evapotranspiration", "Vegetation cooling is moisture-limited: arid cities get less per tree. UrbanFlux does not pretend otherwise."],
            ].map(([eq, d]) => (
              <div key={eq} className="border-l-2 border-heat pl-6">
                <p className="font-mono2 text-lg text-solar">{eq}</p>
                <p className="mt-1 font-body text-sm text-bone/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOTSPOTS / EXPLORER TEASER ──────────────────────── */}
      <section id="explorer" className="border-t border-bone/10 py-28">
        <div className="mx-auto max-w-[1500px] px-5">
          <Kicker>04 — THE INSTRUMENT</Kicker>
          <H2>WHAT IF WE<br />CHANGED<br /><span className="text-heat">THE CITY?</span></H2>
          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4" data-reveal>
              {(hotspots ?? []).map((hs, i) => (
                <div key={hs.hotspot_id} className="flex items-center justify-between border border-bone/12 p-5">
                  <div>
                    <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/40">HOTSPOT {String(i + 1).padStart(2, "0")}</p>
                    <p className="font-head text-lg font-semibold">{hs.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl text-heat">{hs.mean_lst}°C</p>
                    <p className="font-mono2 text-[10px] text-bone/40">{hs.intensity}</p>
                  </div>
                </div>
              ))}
              <p className="pt-2"><DemoBadge /> <span className="ml-2 font-mono2 text-[10px] text-bone/40">synthetic demonstration grid — not observations</span></p>
            </div>
            <div className="demo-watermark p-8" data-reveal>
              <p className="font-mono2 text-[11px] tracking-[0.25em] text-heat">WORKFLOW</p>
              <ol className="mt-6 space-y-3 font-head text-sm">
                {["SEARCH ANYWHERE ON EARTH", "SEE THE HEAT, CELL BY CELL", "REWIND FOUR DECADES", "ASK WHY — WITH RECEIPTS", "SIMULATE THE INTERVENTION", "OPTIMIZE WHERE TO ACT"].map((s, i) => (
                  <li key={s} className="flex items-baseline gap-4">
                    <span className="font-mono2 text-heat">{String(i + 1).padStart(2, "0")}</span>
                    <span className="tracking-wide text-bone/80">{s}</span>
                  </li>
                ))}
              </ol>
              <Link to="/explore" className="mt-8 inline-flex items-center gap-3 bg-bone px-6 py-3 font-mono2 text-[11px] tracking-[0.25em] text-ink hover:bg-heat">
                OPEN THE EXPLORER <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-bone/10 py-36 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[46rem] -translate-x-1/2 -translate-y-1/2 opacity-15" aria-hidden>
          <ThermalDisc texture="OPTIMIZED" className="aspect-square" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5">
          <Kicker>UrbanFlux</Kicker>
          <h2 className="display-xl text-[clamp(2.6rem,8vw,7rem)]">
            DON'T COOL<br />EVERYWHERE.<br />
            <span className="text-heat">COOL WHERE<br />IT MATTERS.</span>
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-4" data-reveal>
            <Link to="/explore" className="bg-heat px-8 py-4 font-mono2 text-[12px] tracking-[0.25em] text-ink hover:bg-solar">
              PREDICT. SIMULATE. OPTIMIZE. COOL.
            </Link>
            <Link to="/research" className="border border-bone/25 px-8 py-4 font-mono2 text-[12px] tracking-[0.25em] hover:border-heat hover:text-heat">
              READ THE METHODOLOGY
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-bone/10 py-14">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 md:grid-cols-4">
          <div>
            <p className="font-display text-2xl text-heat">UrbanFlux</p>
            <p className="mt-2 font-mono2 text-[10px] leading-relaxed tracking-[0.15em] text-bone/40">
              PREDICT. SIMULATE.<br />OPTIMIZE. COOL.
            </p>
          </div>
          <nav aria-label="Platform">
            <p className="font-mono2 text-[10px] tracking-[0.25em] text-bone/40">PLATFORM</p>
            <ul className="mt-3 space-y-2 font-head text-sm">
              <li><Link className="hover:text-heat" to="/explore">Global Explorer</Link></li>
              <li><Link className="hover:text-heat" to="/datasets">Dataset Catalog</Link></li>
              <li><Link className="hover:text-heat" to="/models">Model Registry</Link></li>
            </ul>
          </nav>
          <nav aria-label="Science">
            <p className="font-mono2 text-[10px] tracking-[0.25em] text-bone/40">SCIENCE</p>
            <ul className="mt-3 space-y-2 font-head text-sm">
              <li><Link className="hover:text-heat" to="/research">Methodology</Link></li>
              <li><Link className="hover:text-heat" to="/models">Validation</Link></li>
              <li><Link className="hover:text-heat" to="/about">About</Link></li>
            </ul>
          </nav>
          <div>
            <p className="font-mono2 text-[10px] tracking-[0.25em] text-bone/40">PROVENANCE</p>
            <p className="mt-3 font-body text-xs leading-relaxed text-bone/50">
              Every number traces to a satellite, sensor, dataset and model version.
              Demo values are labelled. The model does not invent the science.
            </p>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[1500px] px-5 font-mono2 text-[10px] tracking-[0.2em] text-bone/25">
          © 2026 UrbanFlux · OBSERVATION ≠ MODEL ≠ SIMULATION ≠ GENERATIVE AI
        </p>
      </footer>
    </div>
  );
}
