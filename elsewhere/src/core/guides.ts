import type { Experience } from "../data/catalog";
import { comparePreferences, scorePreferences, type Preference } from "./ranking";

export type CityGuide = {
  key: string;
  city: string;
  entries: {
    experience: Experience;
    score: number | null;
    position: number | null;
  }[];
};

export function cityKey(city: string): string {
  return city.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/** Guides are views of visit history, never a separately maintained list. */
export function buildCityGuides(
  preferences: readonly Preference[],
  experiences: readonly Experience[],
): CityGuide[] {
  const byId = new Map(experiences.map((experience) => [experience.id, experience]));
  const unique = [...new Map(preferences.map((preference) => [preference.id, preference])).values()];
  const scores = scorePreferences(unique);
  const cities = new Map<string, { city: string; preferences: Preference[] }>();
  for (const preference of unique) {
    const experience = byId.get(preference.id);
    if (!experience?.city.trim()) continue;
    const key = cityKey(experience.city);
    const group = cities.get(key) ?? { city: experience.city.trim(), preferences: [] };
    group.preferences.push(preference);
    cities.set(key, group);
  }
  return [...cities].map(([key, group]) => {
    group.preferences.sort(comparePreferences);
    let position = 0;
    return {
      key,
      city: group.city,
      entries: group.preferences.map((preference, index, sorted) => {
        const score = scores[preference.id] ?? null;
        if (!index || comparePreferences(preference, sorted[index - 1]) !== 0) position = index + 1;
        return {
          experience: byId.get(preference.id)!,
          score,
          position: score === null ? null : position,
        };
      }),
    };
  }).sort((a, b) => b.entries.length - a.entries.length || a.city.localeCompare(b.city));
}

/** Sharing includes the ranking and public links, not private visit notes. */
export function cityGuideText(guide: CityGuide, owner: string): string {
  return `${owner} · ${guide.city}\n${guide.entries.length} experiences visited\n\n` +
    guide.entries.map(({ experience, score, position }) =>
      `${position === null ? "Unranked" : `${position}.`} ${experience.name}${score === null ? "" : ` · ${score.toFixed(1)}`}\n${experience.sourceUrl}`,
    ).join("\n\n");
}
