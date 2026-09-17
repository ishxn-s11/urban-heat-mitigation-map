import type { ReactNode } from "react";

export function DemoBadge({ label = "DEMO SCENARIO" }: { label?: string }) {
  return <span className="badge badge-demo">{label}</span>;
}
export function ObservedBadge() {
  return <span className="badge badge-observed">OBSERVED</span>;
}
export function PredictedBadge() {
  return <span className="badge badge-predicted">PREDICTED</span>;
}
export function SimulatedBadge() {
  return <span className="badge badge-simulated">SIMULATED</span>;
}
export function ModelBadge() {
  return <span className="badge badge-model">MODEL-ESTIMATED</span>;
}

/** Value + provenance chip: the integrity unit used across the workspace. */
export function ValueWithProvenance({
  value,
  badge,
  note,
}: {
  value: ReactNode;
  badge: ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-3xl">{value}</span>
      {badge}
      {note && <span className="font-mono2 text-[10px] text-bone/40">{note}</span>}
    </div>
  );
}
