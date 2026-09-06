import { Preference, scorePreferences } from "./ranking";

type GuideHistory = {
  guide: string[];
  guideCreated: boolean;
  preferences: Preference[];
};

/** Initialize once; an intentionally emptied guide is still an existing guide. */
export function createPersonalGuide<T extends GuideHistory>(data: T): T {
  if (data.guideCreated || data.guide.length) return data;
  const scores = scorePreferences(data.preferences);
  return {
    ...data,
    guideCreated: true,
    guide: data.preferences
      .filter((p) => p.band === "liked" && p.rank !== null)
      .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
      .map((p) => p.id),
  };
}

export function updateVisitDetails(
  preferences: readonly Preference[],
  id: string,
  details: Pick<Preference, "note" | "again">,
): Preference[] {
  return preferences.map((p) => p.id === id ? { ...p, ...details } : p);
}

export function isFavorite(id: string, preferences: readonly Preference[]): boolean {
  return preferences.some((p) => p.id === id && p.band === "liked");
}
