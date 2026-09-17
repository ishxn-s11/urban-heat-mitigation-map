import { Link } from "react-router-dom";
import ThermalDisc from "@/features/thermal-disc/ThermalDisc";

const COORDS = Array.from({ length: 26 }, (_, i) => {
  const lat = ((i * 137.5) % 180) - 90;
  const lon = ((i * 61.8) % 360) - 180;
  return `${lat.toFixed(2)}° ${lon.toFixed(2)}°`;
});

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-bone">
      {/* GIS coordinate field */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
        {COORDS.map((c, i) => (
          <span
            key={i}
            className="absolute font-mono2 text-xs"
            style={{ left: `${(i * 37) % 90 + 3}%`, top: `${(i * 61) % 92 + 4}%` }}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1300px] flex-col items-center justify-center px-5 py-20 text-center">
        <div className="w-56 opacity-80 sm:w-72" aria-hidden>
          <ThermalDisc texture="CORRUPTED" className="aspect-square" />
        </div>

        <p className="mt-10 font-display text-[clamp(5rem,18vw,14rem)] leading-none text-heat">404</p>
        <h1 className="display-xl text-[clamp(2.4rem,8vw,6.5rem)]">
          SIGNAL<br />LOST.
        </h1>
        <p className="mt-6 font-mono2 text-[12px] leading-relaxed tracking-[0.25em] text-bone/50">
          THIS COORDINATE DOESN'T EXIST<br />IN OUR ROUTE MAP.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/" className="bg-heat px-7 py-4 font-mono2 text-[12px] tracking-[0.25em] text-ink hover:bg-solar">
            RETURN TO EARTH
          </Link>
          <Link to="/explore" className="border border-bone/25 px-7 py-4 font-mono2 text-[12px] tracking-[0.25em] hover:border-heat hover:text-heat">
            EXPLORE GLOBAL MAP
          </Link>
        </div>
      </div>
    </div>
  );
}
