import type { Experience, MapBounds, SearchOrigin } from "../data/catalog";

export type CitySuggestion = { id: string; label: string };
export type PlacesRequest =
  | { action: "cities"; query: string }
  | { action: "city"; id: string }
  | { action: "details"; id: string }
  | { action: "search"; origin: SearchOrigin; radius: number; query?: string; bounds?: MapBounds; pageToken?: string };
export type PlacesResponse = {
  cities?: CitySuggestion[];
  city?: { label: string; origin: SearchOrigin };
  experiences?: Experience[];
  nextPageToken?: string;
};
export const isGoogleId = (id: unknown): id is string => typeof id === "string" && /^google:[A-Za-z0-9_-]{1,256}$/.test(id);
export const placeId = (id: string) => id.replace(/^google:/, "");
export const placeLink = (id: string) => `https://www.google.com/maps/search/?api=1&query=Place&query_place_id=${encodeURIComponent(placeId(id))}`;
// Only the reference and the user's own actions are stored on disk. Metadata is fetched again.
export function unresolvedPlace(id: string): Experience {
  return { id, name: "Saved place", venue: "Saved place", city: "", activityType: "Place", vibes: [], description: "Reconnect to load this place’s details. Your saves and rankings are still here.", priceUSD: null, priceNote: "Check with the venue", durationMinutesSuggested: null, durationNote: "Check with the venue", scheduleNote: "Check opening hours before visiting", sourceUrl: placeLink(id), checkedAt: "", lat: null, lng: null, locationNote: "Location unavailable", provider: "google", attributions: [] };
}
