import { useEffect, useState } from "react";

const BOOT_LINES = [
  "CALIBRATING THERMAL INSTRUMENT",
  "LINKING SATELLITE ARCHIVES · 1972 → PRESENT",
  "WARMING THE DIGITAL TWIN",
];

/**
 * First-load splash: instrument boot sequence.
 * Shows once per browser session (sessionStorage), skippable, and
 * immediately dismissed under prefers-reduced-motion.
 */
export function StartSplash() {
  const [phase, setPhase] = useState<"boot" | "exit" | "gone">(() => {
    if (typeof window === "undefined") return "gone";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "gone";
    try {
      return sessionStorage.getItem("urbanflux.booted") ? "gone" : "boot";
    } catch {
      return "boot";
    }
  });

  useEffect(() => {
    if (phase !== "boot") return;
    try {
      sessionStorage.setItem("urbanflux.booted", "1");
    } catch {
      /* private mode — splash just returns each load */
    }
    const t1 = window.setTimeout(() => setPhase("exit"), 2100);
    const t2 = window.setTimeout(() => setPhase("gone"), 2700);
    const skip = () => setPhase("exit");
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink ${
        phase === "exit" ? "[animation:uf-boot-exit_600ms_ease_forwards]" : ""
      }`}
      role="status"
      aria-label="UrbanFlux starting"
    >
      <p className="font-mono2 text-[10px] tracking-[0.4em] text-bone/40">URBAN CLIMATE INTELLIGENCE</p>
      <h1 className="mt-3 font-display text-[clamp(3rem,10vw,7rem)] leading-none tracking-tight">
        URBAN<span className="text-heat">FLUX</span>
      </h1>
      <p className="mt-2 font-mono2 text-[11px] tracking-[0.3em] text-heat">PREDICT · SIMULATE · OPTIMIZE · COOL</p>

      <div className="mt-10 w-56" aria-hidden>
        <div className="h-px w-full overflow-hidden bg-bone/10">
          <div
            className="h-full bg-gradient-to-r from-solar via-heat to-thermal"
            style={{ animation: "uf-boot-bar 2s cubic-bezier(0.3, 0.8, 0.3, 1) forwards" }}
          />
        </div>
        <ul className="mt-4 space-y-1.5">
          {BOOT_LINES.map((line, i) => (
            <li
              key={line}
              className="font-mono2 text-[9px] tracking-[0.22em] text-bone/45"
              style={{ animation: `uf-boot-fade 400ms ease ${300 + i * 650}ms both` }}
            >
              {line}
            </li>
          ))}
        </ul>
      </div>

      <p className="absolute bottom-6 font-mono2 text-[9px] tracking-[0.3em] text-bone/25">
        PRESS ANY KEY TO SKIP
      </p>
    </div>
  );
}
