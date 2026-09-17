import { NavLink, Outlet, useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useAOI } from "@/hooks/queries";
import { useAppStore } from "@/stores/useAppStore";
import { PageLoader } from "@/components/Loading";
import { THERMAL_PROVENANCE } from "@/services/api/demo/mockBackend";
import { DEMO_MODE } from "@/services/api/client";
import { ErrorBoundary } from "@/app/error-boundary";
import { formatCoord } from "@/lib/thermal";
import { ArrowLeft } from "lucide-react";

const ROUTES = [
  { to: "", label: "OVERVIEW" },
  { to: "heat", label: "HEAT" },
  { to: "history", label: "HISTORY" },
  { to: "layers", label: "LAYERS" },
  { to: "drivers", label: "DRIVERS" },
  { to: "model", label: "MODEL" },
  { to: "scenario", label: "SCENARIO" },
  { to: "optimize", label: "OPTIMIZE" },
  { to: "solutions", label: "SOLUTIONS" },
  { to: "report", label: "REPORT" },
];

export function WorkspaceLayout() {
  const { aoiId = "default" } = useParams();
  const location = useLocation();
  const { data: aoi, isError } = useAOI(aoiId);
  const setAoi = useAppStore((s) => s.setAoi);
  const fetching = useIsFetching() > 0;

  // Data-aware page loader: appears only when queries run longer than 350ms,
  // so cached renders stay instant while slow loads get the branded spinner.
  const [showLoader, setShowLoader] = useState(false);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setShowLoader(false);
    timerRef.current = window.setTimeout(() => setShowLoader(true), 350);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [location.pathname]);
  useEffect(() => {
    if (!fetching && timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      setShowLoader(false);
    }
  }, [fetching]);

  useEffect(() => {
    if (aoi) setAoi(aoi);
  }, [aoi, setAoi]);

  const name = aoi?.name ?? "AOI";
  const country = aoi?.country ?? "";
  const [lat, lon] = aoi?.centroid ?? [0, 0];

  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-40 border-b border-bone/10 bg-ink/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
          <Link to="/" className="font-display text-lg tracking-tight text-heat hover:text-solar">
            UrbanFlux
          </Link>
          <span className="hidden font-mono2 text-[10px] tracking-[0.2em] text-bone/50 md:inline">
            {formatCoord(lat, lon)}
          </span>
          <span className="font-head text-sm font-semibold uppercase tracking-wide">
            {name}{country ? `, ${country}` : ""}
          </span>
          <span className="hidden font-mono2 text-[10px] tracking-[0.2em] text-bone/50 lg:inline">
            14 MAY 2026 · {String(THERMAL_PROVENANCE.satellite)} / {String(THERMAL_PROVENANCE.sensor)}
          </span>
          <span className="badge badge-demo ml-auto">DEMO DATA</span>
        </div>
        <nav aria-label="Breadcrumb" className="px-4 pb-2 font-mono2 text-[10px] tracking-[0.2em] text-bone/40">
          <Link to="/explore" className="hover:text-heat">EARTH</Link>
          <span className="mx-1">/</span>
          <span>{country || "CUSTOM AOI"}</span>
          <span className="mx-1">/</span>
          <span className="text-bone/70">{name}</span>
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside aria-label="Workspace sections" className="sticky top-[92px] hidden h-[calc(100vh-92px)] w-52 shrink-0 border-r border-bone/10 py-6 md:block">
          <Link to="/explore" className="mx-4 mb-6 flex items-center gap-2 font-mono2 text-[10px] tracking-[0.2em] text-bone/50 hover:text-heat">
            <ArrowLeft size={12} /> EXPLORER
          </Link>
          <ul>
            {ROUTES.map((r, i) => (
              <li key={r.to}>
                <NavLink
                  to={r.to}
                  end={r.to === ""}
                  className={({ isActive }) =>
                    `flex items-baseline gap-3 px-4 py-2 font-head text-[13px] font-semibold tracking-wide transition-colors ${
                      isActive ? "bg-heat/10 text-heat" : "text-bone/60 hover:text-bone"
                    }`
                  }
                >
                  <span className="font-mono2 text-[9px] text-bone/30">{String(i + 1).padStart(2, "0")}</span>
                  {r.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          {/* Mobile route selector */}
          <div className="mb-4 flex gap-1 overflow-x-auto md:hidden" role="tablist" aria-label="Workspace sections">
            {ROUTES.map((r) => (
              <NavLink
                key={r.to}
                to={r.to}
                end={r.to === ""}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-sm border px-3 py-1.5 font-mono2 text-[10px] tracking-[0.15em] ${
                    isActive ? "border-heat text-heat" : "border-bone/15 text-bone/60"
                  }`
                }
              >
                {r.label}
              </NavLink>
            ))}
          </div>
          <ErrorBoundary label="workspace-page">
            <Outlet />
          </ErrorBoundary>
          {showLoader && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 backdrop-blur-sm">
              <PageLoader label="FETCHING EARTH OBSERVATIONS…" />
            </div>
          )}
        </main>
      </div>

      {isError && (
        <div className="fixed bottom-4 right-4 demo-watermark p-4 font-mono2 text-xs text-heat">
          AOI UNAVAILABLE — return to <Link to="/explore" className="underline">explorer</Link>
        </div>
      )}
      {DEMO_MODE && (
        <footer className="border-t border-bone/10 px-4 py-3 font-mono2 text-[10px] tracking-[0.2em] text-bone/30">
          UrbanFlux ANALYSIS WORKSPACE · SCENARIO_TYPE: DEMO · NOT VALIDATED SCIENCE
        </footer>
      )}
    </div>
  );
}
