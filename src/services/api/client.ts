import type { ApiResponse } from "@/types";

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Connection to Earth lost. The UrbanFlux backend is unreachable.", 0);
  }
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) {
    throw new ApiError("BAD_RESPONSE", `Unparseable response from ${path}`, res.status);
  }
  if (!body.success || body.error) {
    throw new ApiError(body.error?.code ?? "UNKNOWN", body.error?.message ?? "Unknown error", res.status);
  }
  // The backend envelope types data as nullable; success implies data.
  return (body.data ?? {}) as T;
}

export async function post<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(payload) });
}
