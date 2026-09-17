import { request, post, DEMO_MODE } from "./client";
import { DEMO_CITIES, createAOI, getAOI, geocodeDemo, DEFAULT_AOI_ID } from "./demo/mockBackend";
import type { AreaOfInterest, City, GeocodeResult } from "@/types";

export async function getCities(): Promise<City[]> {
  if (DEMO_MODE) return DEMO_CITIES;
  return request<City[]>("/api/v1/cities");
}

export async function getCity(cityId: string): Promise<City> {
  if (DEMO_MODE) return DEMO_CITIES.find((c) => c.city_id === cityId) ?? DEMO_CITIES[0];
  return request<City>(`/api/v1/cities/${cityId}`);
}

export interface AOICreateInput {
  bbox?: [number, number, number, number];
  center?: [number, number];
  radius_km?: number;
  name?: string;
  city?: string;
  country?: string;
}

export async function createAOI2(input: AOICreateInput): Promise<AreaOfInterest> {
  if (DEMO_MODE) {
    let bbox: [number, number, number, number];
    if (input.bbox) bbox = input.bbox;
    else if (input.center && input.radius_km) {
      const [lat, lon] = input.center;
      const dLat = input.radius_km / 110.57;
      const dLon = input.radius_km / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 1e-6));
      bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
    } else throw new Error("INVALID_AOI");
    return createAOI(bbox, input.name, input.city, input.country);
  }
  return post<AreaOfInterest>("/api/v1/aoi", input);
}

export async function fetchAOI(aoiId: string): Promise<AreaOfInterest> {
  if (DEMO_MODE) return aoiId === "default" ? getAOI(DEFAULT_AOI_ID) : getAOI(aoiId);
  return request<AreaOfInterest>(`/api/v1/aoi/${aoiId}`);
}

export async function geocode(q: string): Promise<GeocodeResult[]> {
  if (DEMO_MODE) return geocodeDemo(q);
  return request<GeocodeResult[]>(`/api/v1/geocode?q=${encodeURIComponent(q)}`);
}
