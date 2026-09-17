import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useCities, useCreateAOI, useGeocode } from "@/hooks/queries";
import { DEFAULT_AOI_ID } from "@/services/api/demo/mockBackend";

export default function Explore() {
  const navigate = useNavigate();
  const { data: cities } = useCities();
  const createAOI = useCreateAOI();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: results, isFetching } = useGeocode(submitted, submitted.length >= 2);

  const suggestions = useMemo(() => results ?? [], [results]);

  function pick(lat: number, lon: number, name?: string, country?: string) {
    createAOI.mutate(
      { center: [lat, lon], radius_km: 10, name, country },
      { onSuccess: (aoi) => navigate(`/explore/${aoi.aoi_id}/heat`) },
    );
  }

  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="border-b border-bone/10">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl text-heat">UrbanFlux</Link>
          <Link to={`/explore/${DEFAULT_AOI_ID}/heat`} className="font-mono2 text-[11px] tracking-[0.2em] text-bone/60 hover:text-heat">
            OPEN DEMO AOI →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1100px] px-5 pb-10 pt-20 text-center">
        <p className="font-mono2 text-[11px] tracking-[0.35em] text-heat">GLOBAL EXPLORER</p>
        <h1 className="display-xl mt-4 text-[clamp(2.8rem,8vw,7rem)]">
          SEARCH THE<br /><span className="text-heat">PLANET.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-body text-base text-bone/60">
          Any city, district, coordinate or landmark on Earth. UrbanFlux resolves it,
          checks satellite coverage, and opens the analysis workspace.
        </p>

        <form
          className="mx-auto mt-10 flex max-w-2xl items-center border border-bone/25 bg-ink/60 focus-within:border-heat"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(query);
          }}
          role="search"
        >
          <Search className="ml-4 shrink-0 text-bone/40" size={18} aria-hidden />
          <input
            className="w-full bg-transparent px-4 py-4 font-mono2 text-sm tracking-wide outline-none placeholder:text-bone/30"
            placeholder="DELHI · 28.6139, 77.2090 · PHOENIX · LAGOS …"
            aria-label="Search location or coordinates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="shrink-0 bg-heat px-6 py-4 font-mono2 text-[11px] tracking-[0.2em] text-ink hover:bg-solar">
            {isFetching ? <Loader2 className="animate-spin" size={14} /> : "LOCATE"}
          </button>
        </form>

        {suggestions.length > 0 && (
          <ul className="mx-auto mt-4 max-w-2xl divide-y divide-bone/10 border border-bone/15 text-left" role="listbox" aria-label="Search results">
            {suggestions.map((r, i) => (
              <li key={`${r.lat}-${r.lon}-${i}`}>
                <button
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-heat/10"
                  onClick={() => pick(r.lat, r.lon, r.short_name, r.country)}
                >
                  <span className="flex items-center gap-3 font-head text-sm">
                    <MapPin size={14} className="text-heat" /> {r.name}
                  </span>
                  <span className="font-mono2 text-[10px] text-bone/40">{r.source}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {createAOI.isPending && (
          <p className="mt-6 font-mono2 text-[11px] tracking-[0.25em] text-solar">
            CHECKING DATA AVAILABILITY → BUILDING DATASET → OPENING WORKSPACE…
          </p>
        )}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-24">
        <p className="font-mono2 text-[11px] tracking-[0.3em] text-bone/40">OR START FROM A DEMONSTRATION CITY</p>
        <div className="mt-6 grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
          {(cities ?? []).map((c) => (
            <button
              key={c.city_id}
              className="group bg-ink p-6 text-left transition-colors hover:bg-heat/5"
              onClick={() => pick(c.latitude, c.longitude, c.name, c.country)}
            >
              <p className="font-display text-2xl group-hover:text-heat">{c.name}</p>
              <p className="mt-1 font-mono2 text-[10px] tracking-[0.2em] text-bone/40">{c.country}</p>
              <p className="mt-4 font-mono2 text-[11px] text-bone/60">
                {Math.abs(c.latitude).toFixed(2)}° {c.latitude >= 0 ? "N" : "S"} · {Math.abs(c.longitude).toFixed(2)}° {c.longitude >= 0 ? "E" : "W"}
              </p>
              <p className="mt-3 font-mono2 text-[10px] text-veg">
                {c.available_datasets.length} DATASETS AVAILABLE
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
