import { distance, type Experience, type SearchOrigin } from "../data/catalog";
import { comparePreferences, scorePreferences, type Preference } from "./ranking";

export type DiscoverySort = "for-you" | "enjoyment" | "niche" | "distance" | "price";
export type DiscoveryMode = "all" | "new" | "familiar";
export type SocialEvidence = { friends: number; everyone: number; count: number };
export type DiscoveryContext = {
  catalog: readonly Experience[];
  preferences: readonly Preference[];
  interests: readonly string[];
  audience: "Friends" | "Everyone";
  social?: Record<string, SocialEvidence>;
  origin?: SearchOrigin;
};

/** Missing evidence stays missing. Personal scores refine reaction strength. */
export function personalFit(item: Experience, context: DiscoveryContext): number | null {
  const explicit = context.interests.length
    ? item.vibes.filter(v => context.interests.includes(v)).length / Math.max(item.vibes.length, 1)
    : null;
  const scores = scorePreferences(context.preferences);
  let total = 0, weight = 0;
  for (const preference of context.preferences) {
    const previous = context.catalog.find(e => e.id === preference.id);
    if (!previous) continue;
    const similarity = (previous.activityType === item.activityType ? 2 : 0)
      + previous.vibes.filter(v => item.vibes.includes(v)).length;
    const reaction = preference.band === "liked" ? 1 : preference.band === "okay" ? 0.5 : 0;
    const strength = scores[preference.id] == null ? reaction : (reaction + scores[preference.id]! / 10) / 2;
    total += similarity * strength;
    weight += similarity;
  }
  if (!weight) return explicit;
  return (total + (explicit === null ? 0 : 2 * explicit)) / (weight + (explicit === null ? 0 : 2));
}

export function recommendationScore(item: Experience, context: DiscoveryContext): number {
  const personal = personalFit(item, context);
  const evidence = context.social?.[item.id];
  const community = evidence ? evidence.everyone / 10 : null;
  const friends = evidence && evidence.count > 0
    ? (evidence.count * evidence.friends / 10 + 3 * evidence.everyone / 10) / (evidence.count + 3)
    : null;
  const parts = [[personal, 0.6], [friends, 0.25], [community, 0.15]] as const;
  let score = 0, weight = 0;
  for (const [value, importance] of parts) {
    if (value === null) continue;
    score += value * importance;
    weight += importance;
  }
  return weight ? score / weight : 0;
}

export function matchesIntent(item: Experience, mode: DiscoveryMode, context: DiscoveryContext): boolean {
  const current = context.preferences.find(p => p.id === item.id);
  if (mode === "new") return !current;
  if (mode !== "familiar") return true;
  if (current) return current.band === "liked" || current.again === true;
  return item.vibes.some(v => context.interests.includes(v)) || context.preferences.some(p =>
    (p.band === "liked" || p.again === true) && context.catalog.find(e => e.id === p.id)?.activityType === item.activityType);
}

export function matchesNiche(score: number | null, range?: readonly [number, number]): boolean {
  if (!range || (range[0] === 0 && range[1] === 10)) return true;
  return score !== null && Number.isFinite(score) && score >= range[0] && score <= range[1];
}

export function orderExperiences(
  items: readonly Experience[], sort: DiscoverySort, context: DiscoveryContext,
  niche: (id: string) => number | null, personal = false, nicheDirection: "asc" | "desc" = "desc",
): Experience[] {
  const values = new Map(items.map(item => [item.id,
    sort === "for-you" ? recommendationScore(item, context)
      : sort === "enjoyment" ? context.social?.[item.id]?.[context.audience === "Friends" ? "friends" : "everyone"] ?? null
      : sort === "niche" ? niche(item.id)
      : sort === "distance" ? distance(item, context.origin) : item.priceUSD]));
  const ordered = [...items].sort((a, b) => {
    if (personal) return comparePreferences(context.preferences.find(p => p.id === a.id)!, context.preferences.find(p => p.id === b.id)!);
    const av = values.get(a.id), bv = values.get(b.id);
    if (av == null || bv == null) return av == null ? bv == null ? 0 : 1 : -1;
    return sort === "price" || sort === "distance" || (sort === "niche" && nicheDirection === "asc") ? av - bv : bv - av;
  });
  if (personal || sort !== "for-you") return ordered;
  // Vary the next few choices without overriding explicit sorts or hard filters.
  const result: Experience[] = [];
  while (ordered.length) {
    const previous = result.at(-1);
    const index = previous ? ordered.findIndex((item, i) => i < 3 && item.activityType !== previous.activityType) : 0;
    result.push(ordered.splice(Math.max(index, 0), 1)[0]);
  }
  return result;
}
