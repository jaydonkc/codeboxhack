import type { Experience } from "../src/data/catalog";
import type { PlacesRequest, PlacesResponse } from "../src/services/placesTypes";
import { placeId, placeLink } from "../src/services/placesTypes";

const TYPES = ["museum", "art_gallery", "park", "botanical_garden", "hiking_area", "tourist_attraction", "bowling_alley", "amusement_center", "aquarium", "zoo", "cultural_center", "sports_activity_location"];
const FIELDS = "id,displayName,formattedAddress,location,primaryType,primaryTypeDisplayName,googleMapsUri,attributions,businessStatus";
type GooglePlace = { id?: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; primaryType?: string; primaryTypeDisplayName?: { text?: string }; googleMapsUri?: string; businessStatus?: string; attributions?: { provider?: string; providerUri?: string }[] };
export class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
const finite = (x: unknown, min: number, max: number): x is number => typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
export function validateRequest(input: any): PlacesRequest {
  if (!input || typeof input !== "object") throw new RequestError(400, "Invalid request.");
  if (input.action === "cities") {
    if (typeof input.query !== "string" || input.query.trim().length < 2 || input.query.length > 150) throw new RequestError(400, "Enter a city name (2–150 characters).");
  } else if (input.action === "city" || input.action === "details") {
    if (typeof input.id !== "string" || !/^(google:)?[A-Za-z0-9_-]{1,256}$/.test(input.id)) throw new RequestError(400, "Invalid place reference.");
  } else if (input.action === "search") {
    if (!finite(input.origin?.lat, -90, 90) || !finite(input.origin?.lng, -180, 180) || !finite(input.radius, 1, 50000)) throw new RequestError(400, "Choose a location and a radius up to 50 km.");
    if (input.query !== undefined && (typeof input.query !== "string" || input.query.length > 200)) throw new RequestError(400, "Search text is too long.");
    if (input.pageToken !== undefined && (typeof input.pageToken !== "string" || input.pageToken.length > 2048)) throw new RequestError(400, "Invalid page token.");
    const b = input.bounds;
    if (b && (!finite(b.south, -90, 90) || !finite(b.north, -90, 90) || b.south >= b.north || !finite(b.west, -180, 180) || !finite(b.east, -180, 180) || b.west === b.east)) throw new RequestError(400, "Invalid map area.");
  } else throw new RequestError(400, "Unknown search operation.");
  return input;
}
const safeUrl = (value?: string) => { try { return value && new URL(value).protocol === "https:" ? value : undefined; } catch { return undefined; } };
export function normalizePlace(p: GooglePlace): Experience | null {
  if (!p.id || !/^[A-Za-z0-9_-]{1,256}$/.test(p.id) || !p.displayName?.text || !finite(p.location?.latitude, -90, 90) || !finite(p.location?.longitude, -180, 180) || p.businessStatus === "CLOSED_PERMANENTLY") return null;
  const id = `google:${p.id}`;
  const type = p.primaryType ?? "place";
  const vibes = /museum|gallery|cultural/.test(type) ? ["Learn", "Creative"] : /park|garden/.test(type) ? ["Relax", "Explore"] : /hiking|sport|bowling/.test(type) ? ["Active", "Hangout"] : ["Explore"];
  return { id, name: p.displayName.text, venue: p.displayName.text, activityType: p.primaryTypeDisplayName?.text ?? type.replaceAll("_", " "), city: p.formattedAddress ?? "", vibes, description: "Explore this venue. Check current activities, access, and opening hours before visiting.", priceUSD: null, priceNote: "Admission and activity prices have not been verified.", durationMinutesSuggested: null, durationNote: "Visit duration depends on your activity.", scheduleNote: p.businessStatus === "CLOSED_TEMPORARILY" ? "Temporarily closed. Check before visiting." : "Check current opening hours and booking requirements.", sourceUrl: safeUrl(p.googleMapsUri) ?? placeLink(id), checkedAt: new Date().toISOString().slice(0, 10), lat: p.location.latitude, lng: p.location.longitude, locationNote: "Venue location from Google Maps; confirm the entrance before visiting.", provider: "google", attributions: (p.attributions ?? []).filter(a => a.provider).map(a => ({ name: a.provider!, url: safeUrl(a.providerUri) })) };
}
export async function queryPlaces(input: unknown, apiKey: string, fetcher: typeof fetch = fetch): Promise<PlacesResponse> {
  const r = validateRequest(input);
  if (!apiKey) throw new RequestError(503, "Live discovery is not configured yet.");
  async function google(path: string, body?: object, fields?: string) {
    const response = await fetcher(`https://places.googleapis.com/v1/${path}`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, ...(fields ? { "X-Goog-FieldMask": fields } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new RequestError(response.status === 429 ? 429 : 502, response.status === 429 ? "Search limit reached. Please try again later." : "Place search is unavailable. Check the server’s Google API configuration or try again later.");
    return response.json();
  }
  if (r.action === "cities") {
    const data = await google("places:autocomplete", { input: r.query.trim(), includedPrimaryTypes: ["(cities)"] });
    return { cities: (data.suggestions ?? []).flatMap((s: any) => s.placePrediction?.placeId && s.placePrediction?.text?.text ? [{ id: s.placePrediction.placeId, label: s.placePrediction.text.text }] : []) };
  }
  if (r.action === "city") {
    const p = await google(`places/${encodeURIComponent(placeId(r.id))}`, undefined, "id,displayName,formattedAddress,location");
    if (!finite(p.location?.latitude, -90, 90) || !finite(p.location?.longitude, -180, 180)) throw new RequestError(404, "That city has no map location.");
    return { city: { label: p.formattedAddress ?? p.displayName?.text ?? "Selected city", origin: { lat: p.location.latitude, lng: p.location.longitude } } };
  }
  if (r.action === "details") {
    const item = normalizePlace(await google(`places/${encodeURIComponent(placeId(r.id))}`, undefined, FIELDS));
    return { experiences: item ? [item] : [] };
  }
  const circle = { center: { latitude: r.origin.lat, longitude: r.origin.lng }, radius: r.radius };
  const latDelta = r.radius / 111320;
  const lngDelta = Math.min(179.99, latDelta / Math.max(0.001, Math.cos(r.origin.lat * Math.PI / 180)));
  const wrap = (lng: number) => ((lng + 540) % 360) - 180;
  const area = r.bounds ?? { south: Math.max(-90, r.origin.lat - latDelta), north: Math.min(90, r.origin.lat + latDelta), west: wrap(r.origin.lng - lngDelta), east: wrap(r.origin.lng + lngDelta) };
  const rect = { rectangle: { low: { latitude: area.south, longitude: area.west }, high: { latitude: area.north, longitude: area.east } } };
  // Text Search supplies pagination and rectangular search areas. Nearby Search supplies category discovery.
  const textSearch = !!r.query?.trim() || !!r.bounds;
  const body = textSearch ? { textQuery: r.query?.trim() || "things to do", pageSize: 20, ...(r.pageToken ? { pageToken: r.pageToken } : {}), locationRestriction: rect } : { includedTypes: TYPES, maxResultCount: 20, rankPreference: "DISTANCE", locationRestriction: { circle } };
  const data = await google(textSearch ? "places:searchText" : "places:searchNearby", body, FIELDS.split(",").map(f => `places.${f}`).join(",") + (textSearch ? ",nextPageToken" : ""));
  return { experiences: (data.places ?? []).map(normalizePlace).filter(Boolean), nextPageToken: data.nextPageToken };
}
