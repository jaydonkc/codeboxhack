import type { PlacesRequest, PlacesResponse } from "./placesTypes";
export const placesUrl = process.env.EXPO_PUBLIC_PLACES_API_URL?.replace(/\/$/, "") ?? "";
export const livePlacesEnabled = !!placesUrl;
export async function requestPlaces(body: PlacesRequest, signal?: AbortSignal): Promise<PlacesResponse> {
  if (!placesUrl) throw new Error("Live discovery isn’t connected yet. You can explore the sample collection.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`${placesUrl}/api/places`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search is unavailable. Try again.");
    return data;
  } finally { clearTimeout(timeout); signal?.removeEventListener("abort", abort); }
}
