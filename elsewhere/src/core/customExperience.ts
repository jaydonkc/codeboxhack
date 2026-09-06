import type { Experience } from "../data/catalog";
import { publicReadiness, submissionOf, type ActivityAudience, type VisitorAccess } from "./submissions";

export type CustomDraft = {
  name: string; city: string; activityType: string; description: string; latitude: string; longitude: string;
  location?: string; duration?: string; price?: string; sourceUrl?: string;
  audience?: ActivityAudience; access?: VisitorAccess; accessNote?: string; vibes?: string[];
};
export function emptyCustomDraft(city = "", name = ""): CustomDraft {
  return { name, city, activityType: "", description: "", latitude: "", longitude: "", location: "", duration: "", price: "", sourceUrl: "", audience: "friends", access: "unknown", accessNote: "", vibes: [] };
}
export function draftFromExperience(e: Experience): CustomDraft {
  const s = submissionOf(e);
  return { name: e.name, city: e.city, activityType: e.activityType, description: e.description, latitude: e.lat?.toString() ?? "", longitude: e.lng?.toString() ?? "",
    location: s?.location ?? "", duration: e.durationMinutesSuggested?.toString() ?? "", price: e.priceUSD?.toString() ?? "", sourceUrl: e.sourceUrl,
    audience: s?.audience ?? "private", access: s?.access ?? "unknown", accessNote: s?.accessNote ?? "", vibes: e.vibes };
}
export function createCustomExperience(draft: CustomDraft, id: string, now = Date.now(), creatorId = "you", creatorName = "You"): Experience {
  if (!draft.name.trim() || !draft.city.trim()) throw new Error("Enter an experience name and city.");
  if (!/^user:[A-Za-z0-9_-]+$/.test(id)) throw new Error("Invalid activity identifier.");
  for (const [field, max] of [["name", 120], ["city", 120], ["activityType", 80], ["description", 1200], ["location", 300], ["accessNote", 1200], ["sourceUrl", 2000]] as const) {
    if ((draft[field]?.length ?? 0) > max) throw new Error(`${field} is too long (maximum ${max} characters).`);
  }
  const hasCoordinates = !!draft.latitude.trim() || !!draft.longitude.trim();
  const lat = hasCoordinates ? Number(draft.latitude) : null, lng = hasCoordinates ? Number(draft.longitude) : null;
  if (hasCoordinates && (!draft.latitude.trim() || !draft.longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat!) > 90 || Math.abs(lng!) > 180)) throw new Error("Enter both latitude (−90 to 90) and longitude (−180 to 180), or leave both blank.");
  const duration = draft.duration?.trim() ? Number(draft.duration) : null;
  const price = draft.price?.trim() ? Number(draft.price) : null;
  if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 10080)) throw new Error("Duration must be between 1 and 10,080 minutes.");
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000)) throw new Error("Enter a valid price, or leave it blank if unknown.");
  const audience = draft.audience ?? "private", access = draft.access ?? "unknown";
  if (!["private", "friends", "public"].includes(audience) || !["public", "permission", "unknown", "restricted"].includes(access)) throw new Error("Choose an audience and visitor access.");
  let sourceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${draft.name.trim()}, ${draft.city.trim()}`)}`;
  if (draft.sourceUrl?.trim()) {
    try {
      const url = new URL(draft.sourceUrl.trim());
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
      sourceUrl = url.toString();
    } catch { throw new Error("Enter a valid https:// or http:// source link."); }
  }
  const at = new Date(now).toISOString();
  const item: Experience = {
    id, name: draft.name.trim(), venue: draft.name.trim(), city: draft.city.trim(), activityType: draft.activityType.trim() || "Experience",
    description: draft.description.trim() || "An experience you added.", vibes: [...new Set((draft.vibes ?? []).filter(v => ["Relax", "Active", "Hangout", "Creative", "Learn", "Explore"].includes(v)))],
    priceUSD: price, priceNote: price === null ? "Check current prices" : "Price added by the creator; check before visiting.",
    durationMinutesSuggested: duration, durationNote: duration === null ? "Duration not specified" : `About ${duration} minutes`, scheduleNote: "Check availability before visiting",
    lat, lng, locationNote: draft.location?.trim() || (hasCoordinates ? "Location entered by the creator." : "No map coordinates added."), checkedAt: "", sourceUrl,
    submission: { creatorId, creatorName, createdAt: at, updatedAt: at, revision: 1, audience, status: audience === "public" ? "pending" : "unlisted", location: draft.location?.trim() ?? "", access, accessNote: draft.accessNote?.trim() ?? "" },
  };
  if (audience === "public") {
    const issues = publicReadiness(item);
    if (issues.length) throw new Error(issues.join(" "));
  }
  return item;
}

export function updateCustomExperience(e: Experience, draft: CustomDraft, actorId: string, now = Date.now()): Experience {
  const old = submissionOf(e);
  if (!old || old.creatorId !== actorId) throw new Error("Only the creator can edit this activity.");
  if (old.status === "removed") throw new Error("This activity was removed and cannot be resubmitted here.");
  const updated = createCustomExperience(draft, e.id, now, old.creatorId, old.creatorName);
  // All content/audience edits invalidate the previous review. Shares cannot override this.
  return { ...updated, submission: { ...updated.submission!, createdAt: old.createdAt || updated.submission!.createdAt, revision: old.revision + 1 } };
}
