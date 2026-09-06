import { finishRanking, Preference, RankingSession, scorePreferences } from "./ranking";

type VisitHistory = { preferences: Preference[]; saved: string[] };

/** Completed comparisons are saved immediately; unresolved reactions require an explicit save. */
export function saveRankedVisit<T extends VisitHistory>(
  data: T,
  session: RankingSession,
  details: Pick<Preference, "note" | "again" | "visitedOn">,
  { savePending = false }: { savePending?: boolean } = {},
): T {
  if (session.status !== "placed" && !(savePending && session.status === "pending"))
    return data;
  return {
    ...data,
    preferences: updateVisitDetails(
      finishRanking(session, data.preferences),
      session.id,
      details,
    ),
    saved: data.saved.filter((id) => id !== session.id),
  };
}

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
  details: Pick<Preference, "note" | "again" | "visitedOn">,
): Preference[] {
  return preferences.map((p) => p.id === id ? { ...p, ...details } : p);
}

export function isFavorite(id: string, preferences: readonly Preference[]): boolean {
  return preferences.some((p) => p.id === id && p.band === "liked");
}
