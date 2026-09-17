import type { GeoProvider, SearchResult } from "./provider";

/** MapTiler geocoding — requires VITE_MAPTILER_KEY. */
export const maptiler: GeoProvider = {
  name: "maptiler",
  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const key = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
    if (!key) throw new Error("VITE_MAPTILER_KEY not configured");
    const res = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${key}&limit=${limit}`,
    );
    if (!res.ok) throw new Error(`maptiler ${res.status}`);
    const body = (await res.json()) as { features: Array<{ text: string; place_name: string; center: [number, number]; properties?: Record<string, unknown> }> };
    return body.features.map((f) => ({
      name: f.place_name,
      short_name: f.text,
      country: (f.properties?.country_code as string) ?? undefined,
      lat: f.center[1],
      lon: f.center[0],
      type: "maptiler",
      source: "maptiler",
    }));
  },
};
