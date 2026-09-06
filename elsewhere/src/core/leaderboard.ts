import type { CityGuide } from "./guides";

export type Visitor = { id: string; name: string; guides: readonly CityGuide[] };

export function rankVisitors<T extends Visitor>(visitors: readonly T[], city: string | null = null) {
  const rows = visitors.map(visitor => ({
    ...visitor,
    count: new Set(visitor.guides.filter(guide => !city || guide.key === city)
      .flatMap(guide => guide.entries.map(entry => entry.experience.id))).size,
  })).filter(visitor => !city || visitor.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  let rank = 0;
  return rows.map((row, index) => {
    if (!index || row.count !== rows[index - 1].count) rank = index + 1;
    return { ...row, rank };
  });
}
