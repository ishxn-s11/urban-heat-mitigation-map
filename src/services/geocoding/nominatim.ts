import type { GeoProvider, SearchResult } from "./provider";

export const nominatim: GeoProvider = {
  name: "nominatim",
  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=${limit}&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((r) => {
      const address = (r.address ?? {}) as Record<string, string>;
      return {
        name: String(r.display_name ?? query),
        short_name: address.city ?? address.town ?? address.village ?? address.county ?? String(r.name ?? query),
        country: address.country,
        lat: Number(r.lat),
        lon: Number(r.lon),
        type: String(r.type ?? ""),
        source: "nominatim",
      };
    });
  },
};
