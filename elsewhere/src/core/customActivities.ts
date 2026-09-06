import { type Experience, VIBES } from "../data/catalog";

export type ActivityDraft = { name: string; venue: string; city: string; vibes: string[] };

export function createCustomActivity(draft: ActivityDraft, id: string): Experience {
  const name = draft.name.trim(), venue = draft.venue.trim(), city = draft.city.trim();
  if (!name || !venue || !city) throw new Error("Enter an activity name, place, and city.");
  if (!id.startsWith("custom-")) throw new Error("Invalid activity ID.");
  return {
    id, name, venue, city, activityType: "Personal activity", userCreated: true,
    vibes: [...new Set(draft.vibes.filter((vibe) => VIBES.includes(vibe)))],
    description: "An activity you added.", priceUSD: null, priceNote: "Cost not added.",
    durationMinutesSuggested: 0, durationNote: "Duration not added.",
    scheduleNote: "Check with the venue for hours and access.",
    sourceUrl: "", checkedAt: "", lat: null, lng: null,
    locationNote: `${venue}, ${city}. Exact map location not added.`,
  };
}

export function parseCustomActivities(value: unknown): Experience[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Unrecognized custom activities");
  const seen = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== "object" || typeof item.id !== "string" ||
      typeof item.name !== "string" || typeof item.venue !== "string" ||
      typeof item.city !== "string" || !Array.isArray(item.vibes) || seen.has(item.id)) {
      throw new Error("Unrecognized custom activity");
    }
    seen.add(item.id);
    return createCustomActivity(item, item.id);
  });
}
