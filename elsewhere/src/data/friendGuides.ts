import { catalog } from "./catalog";
import { friendFeed, type FriendId } from "./friends";
import { cityKey, guideCityName, type CityGuide } from "../core/guides";

// Fictional visit history supplements the recent events shown in the feed.
const history: Record<string, readonly (readonly [string, number])[]> = {
  jacob: [["cerro-san-luis", 9.0], ["slo-skate-park", 8.7], ["downtown-creek-walk", 8.5], ["sloma", 8.2], ["downtown-farmers-market", 8.0], ["history-center", 7.8]],
  usman: [["sloma", 8.6], ["downtown-creek-walk", 8.5], ["slo-skate-park", 8.3], ["bishop-peak", 8.0]],
  emma: [["leaning-pine-arboretum", 8.7], ["downtown-farmers-market", 8.4], ["anam-cre-pottery", 8.2], ["bishop-peak", 8.0], ["cerro-san-luis", 7.8], ["downtown-creek-walk", 7.6], ["history-center", 7.4]],
  maya: [["bishop-peak", 9.2], ["cerro-san-luis", 9.0], ["leaning-pine-arboretum", 8.8], ["sloma", 8.5], ["history-center", 8.2], ["downtown-creek-walk", 8.0]],
  alex: [["cerro-san-luis", 9.0], ["slo-skate-park", 8.8], ["downtown-creek-walk", 8.6], ["leaning-pine-arboretum", 8.4], ["downtown-farmers-market", 8.2], ["sloma", 8.0]],
  noah: [["sloma", 8.8], ["downtown-creek-walk", 8.6], ["history-center", 8.2], ["bubblegum-alley", 7.2]],
};
const earlierVisits = Object.entries(history).flatMap(([authorId, visits]) =>
  visits.map(([experienceId, score]) => ({ authorId: authorId as FriendId, experienceId, score })),
);

export function friendCityGuides(authorId: FriendId): CityGuide[] {
  const visits = [
    ...earlierVisits,
    ...friendFeed.filter(post => post.kind === "ranked"),
  ].filter(visit => visit.authorId === authorId);
  const unique = [...new Map(visits.map(visit => [visit.experienceId, visit])).values()];
  const groups = new Map<string, CityGuide>();
  for (const visit of unique.sort((a, b) => b.score - a.score)) {
    const experience = catalog.find(item => item.id === visit.experienceId);
    if (!experience) continue;
    const key = cityKey(experience.city);
    const guide = groups.get(key) ?? { key, city: guideCityName(experience.city), entries: [] };
    const previous = guide.entries.at(-1);
    guide.entries.push({ experience, score: visit.score,
      position: previous?.score === visit.score ? previous.position : guide.entries.length + 1 });
    groups.set(key, guide);
  }
  return [...groups.values()];
}
