import type { Experience } from "../data/catalog";
export type CustomDraft = { name: string; city: string; activityType: string; description: string; latitude: string; longitude: string };
export function createCustomExperience(draft: CustomDraft, id: string): Experience {
  if (!draft.name.trim() || !draft.city.trim()) throw new Error("Enter an experience name and city.");
  const hasCoordinates = !!draft.latitude.trim() || !!draft.longitude.trim();
  const lat = hasCoordinates ? Number(draft.latitude) : null;
  const lng = hasCoordinates ? Number(draft.longitude) : null;
  if (hasCoordinates && (!draft.latitude.trim() || !draft.longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat!) > 90 || Math.abs(lng!) > 180)) throw new Error("Enter both latitude (−90 to 90) and longitude (−180 to 180), or leave both blank.");
  return { id, name: draft.name.trim(), venue: draft.name.trim(), city: draft.city.trim(), activityType: draft.activityType.trim() || "Experience", description: draft.description.trim() || "An experience you added.", vibes: [], priceUSD: null, priceNote: "Check current prices", durationMinutesSuggested: null, durationNote: "Duration not specified", scheduleNote: "Check availability before visiting", lat, lng, locationNote: hasCoordinates ? "Location entered by you." : "No map coordinates added.", checkedAt: "", sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${draft.name.trim()}, ${draft.city.trim()}`)}` };
}
