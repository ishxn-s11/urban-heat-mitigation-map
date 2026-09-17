interface Props {
  label: string;
  unit: string;
  min: number;
  max: number;
  gradient: string;
  classes?: Array<{ label: string; color: string }>;
}

/** Legend: color is never the only encoding — numeric endpoints + labels. */
export function RampLegend({ label, unit, min, max, gradient, classes }: Props) {
  return (
    <div className="rounded-sm border border-bone/15 bg-ink/85 p-3 backdrop-blur">
      <p className="font-mono2 text-[10px] tracking-[0.2em] text-bone/60">{label}</p>
      {classes ? (
        <ul className="mt-2 space-y-1">
          {classes.map((c) => (
            <li key={c.label} className="flex items-center gap-2 font-mono2 text-[11px]">
              <span className="ramp-chip" style={{ background: c.color }} aria-hidden />
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="mt-2 h-3 w-44 rounded-sm border border-bone/20" style={{ background: gradient }} aria-hidden />
          <div className="mt-1 flex w-44 justify-between font-mono2 text-[10px] text-bone/60">
            <span>{min}{unit}</span>
            <span>{max}{unit}</span>
          </div>
        </>
      )}
    </div>
  );
}
