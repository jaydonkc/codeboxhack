import type { Experience } from "../data/catalog";
import { comparePreferences, scorePreferences, type Preference } from "./ranking";
import { canExportActivity, type Viewer } from "./submissions";

export type CityGuide = {
  key: string;
  city: string;
  entries: {
    experience: Experience;
    score: number | null;
    position: number | null;
  }[];
};

export function guideCityName(city: string): string {
  const name = city.trim().replace(/\s+/g, " ");
  // The original SLO catalog used a proximity label for the botanical garden.
  // Keep its venue location intact while grouping it with the same city guide.
  return /^near san luis obispo$/i.test(name) ? "San Luis Obispo" : name;
}

export function cityKey(city: string): string {
  return guideCityName(city).toLocaleLowerCase();
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
    const group = cities.get(key) ?? { city: guideCityName(experience.city), preferences: [] };
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
export function cityGuideText(guide: CityGuide, owner: string, viewer: Viewer = {}): string {
  const entries = guide.entries.filter(({ experience }) => canExportActivity(experience, viewer));
  if (!entries.length) return "No shareable experiences in this guide.";
  // Renumber the exported subset so private entries cannot leak through rank gaps.
  const positions = new Map<number, number>();
  return `${owner} · ${guide.city}\n${entries.length} experiences visited\n\n` +
    entries.map(({ experience, score, position }, index) => {
      if (position !== null && !positions.has(position)) positions.set(position, index + 1);
      return `${position === null ? "Unranked" : `${positions.get(position)}.`} ${experience.name}${score === null ? "" : ` · ${score.toFixed(1)}`}\n${experience.sourceUrl}`;
    }).join("\n\n");
}
