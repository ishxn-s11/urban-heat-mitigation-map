/** Thermal color ramps and numeric formatting utilities. */

export function formatSigned(v: number, digits = 1): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)}`;
}

export function formatDegrees(v: number): string {
  return `${v.toFixed(1)}°C`;
}

export function formatUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function formatPop(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}

export function formatCoord(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
}

/** LST ramp: 33–46 °C → thermal palette. */
export function lstColor(v: number): string {
  const stops: Array<[number, [number, number, number]]> = [
    [33, [38, 79, 160]],
    [37, [22, 119, 255]],
    [39, [76, 175, 80]],
    [41, [255, 212, 59]],
    [43, [255, 90, 31]],
    [46, [239, 43, 22]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (v <= a) return rgb(ca);
    if (v <= b) {
      const t = (v - a) / (b - a);
      return rgb(ca.map((c, j) => c + (cb[j] - c) * t) as [number, number, number]);
    }
  }
  return rgb(stops[stops.length - 1][1]);
}

/** Diverging delta ramp: cooling (blue) → neutral → warming (red). */
export function deltaColor(v: number): string {
  const t = Math.max(-3, Math.min(0, v)) / -3; // 0 (no change) → 1 (max cooling)
  const warm: [number, number, number] = [242, 240, 232];
  const cool: [number, number, number] = [22, 119, 255];
  return rgb(warm.map((c, i) => c + (cool[i] - c) * t) as [number, number, number]);
}

/** Single-hue ramps for indices. */
export function ndviColor(v: number): string {
  const t = clamp01((v + 0.2) / 1.0);
  const dead: [number, number, number] = [130, 110, 70];
  const lush: [number, number, number] = [76, 175, 80];
  return rgb(mix(dead, lush, t));
}

export function ndbiColor(v: number): string {
  const t = clamp01((v + 0.2) / 1.0);
  return rgb(mix([120, 120, 130], [255, 138, 76], t));
}

export function ndwiColor(v: number): string {
  const t = clamp01((v + 0.5) / 1.2);
  return rgb(mix([90, 80, 60], [22, 119, 255], t));
}

export function albedoColor(v: number): string {
  const t = clamp01(v / 0.5);
  return rgb(mix([40, 40, 40], [242, 240, 232], t));
}

export function populationColor(v: number): string {
  const t = clamp01(v / 9500);
  return rgb(mix([17, 17, 17], [255, 212, 59], t));
}

export function riskColor(risk: string): string {
  switch (risk) {
    case "EXTREME": return "#EF2B16";
    case "HOT": return "#FF5A1F";
    case "MODERATE": return "#FFD43B";
    default: return "#4CAF50";
  }
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return a.map((c, i) => c + (b[i] - c) * t) as [number, number, number];
}

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

function rgb([r, g, b]: [number, number, number]): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
