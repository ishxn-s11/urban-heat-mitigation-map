import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Slim heat-gradient progress bar pinned under the header.
 * Indeterminate "journey" animation while navigation work is pending —
 * kicks on route change, settles on idle. Pure CSS, GPU transforms only.
 */
export function RouteProgressBar() {
  const location = useLocation();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // Any route change (re)starts the bar.
    timers.current.forEach(clearTimeout);
    setState("running");
    timers.current = [
      window.setTimeout(() => setState("done"), 550),
      window.setTimeout(() => setState("idle"), 1000),
    ];
    return () => timers.current.forEach(clearTimeout);
  }, [location.pathname, location.search]);

  if (state === "idle") return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[80] h-[3px] w-full overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="Page loading"
      aria-hidden={state === "done"}
    >
      <div
        className="h-full w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #FFD43B 35%, #FF5A1F 65%, #EF2B16 100%)",
          transform: state === "running" ? "translateX(-100%) scaleX(0.4)" : "translateX(0) scaleX(1)",
          transformOrigin: "left",
          transition: state === "running" ? "none" : "transform 400ms cubic-bezier(0.2, 0.8, 0.3, 1)",
          animation: state === "running" ? "uf-bar-run 550ms cubic-bezier(0.2, 0.8, 0.3, 1) forwards" : undefined,
          opacity: state === "done" ? 0 : 1,
        }}
      />
    </div>
  );
}

/**
 * Full page-level loading panel — the branded "instrument warming up" state.
 * Shows on slow queries (<LazyPage> suspense and explicit loading props).
 */
export function PageLoader({ label = "LOADING" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-5 py-20"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative h-16 w-16" aria-hidden>
        {/* Thermal core */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFD43B_0%,#FF5A1F_45%,#EF2B16_75%,transparent_100%)] blur-[2px]" />
        {/* Scan ring */}
        <div className="absolute inset-0 rounded-full border border-heat/50 [animation:uf-scan_1.6s_linear_infinite]" />
        {/* Crosshair ticks */}
        <span className="absolute left-1/2 top-[-6px] h-2 w-px -translate-x-1/2 bg-heat/70" />
        <span className="absolute left-1/2 bottom-[-6px] h-2 w-px -translate-x-1/2 bg-heat/70" />
        <span className="absolute top-1/2 left-[-6px] w-2 h-px -translate-y-1/2 bg-heat/70" />
        <span className="absolute top-1/2 right-[-6px] w-2 h-px -translate-y-1/2 bg-heat/70" />
      </div>
      <p className="font-mono2 text-[10px] tracking-[0.35em] text-heat">{label}</p>
      <div className="h-px w-40 overflow-hidden bg-bone/10" aria-hidden>
        <div className="h-full w-1/3 bg-heat [animation:uf-slide_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
