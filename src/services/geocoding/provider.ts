/**
 * Geocoding provider abstraction — UrbanFlux is not coupled to one provider.
 * Nominatim (OSM) is the default; MapTiler drops in behind the same shape.
 */

export interface GeoProvider {
  name: string;
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

export interface SearchResult {
  name: string;
  short_name?: string;
  country?: string;
  lat: number;
  lon: number;
  type?: string;
  source: string;
}

export { geocode } from "../api/cities";
