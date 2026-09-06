import { getNicheness } from "./nicheness";
import source from "./slo.json";
import geocodes from "./geocodes.json";
export type Experience = {
  id: string;
  userCreated?: boolean;
  name: string;
  venue: string;
  activityType: string;
  vibes: string[];
  description: string;
  city: string;
  priceUSD: number | null;
  priceNote: string;
  priceEstimateUSD?: number;
  priceEstimateNote?: string;
  durationMinutesSuggested: number;
  durationNote: string;
  scheduleNote: string;
  sourceUrl: string;
  additionalSourceUrls?: string[];
  checkedAt: string;
  lat: number | null;
  lng: number | null;
  locationNote: string;
  coordinateSource?: string;
};
const builtInCatalog: Experience[] = source.experiences.map((x) => {
  const point = geocodes.points.find((p) => p.id === x.id);
  return point
    ? {
        ...x,
        lat: point.lat,
        lng: point.lng,
        coordinateSource: point.sourceUrl,
        locationNote:
          x.locationNote.replace("No official coordinates verified.", "") +
          " " +
          point.locationNote,
      }
    : x;
});
// Shared lookup used by cards, guides, and ranking views. Refresh on restore/create.
export let catalog: Experience[] = [...builtInCatalog];
export function setCustomActivities(activities: Experience[]) {
  catalog = [...builtInCatalog, ...activities];
}
export const byId = (id: string) => catalog.find((x) => x.id === id)!;
export const VIBES = [
  "Relax",
  "Active",
  "Community",
  "Creative",
  "Learn",
  "Explore",
];
export const demoGuide = [
  "sloma",
  "leaning-pine-arboretum",
  "downtown-farmers-market",
  "anam-cre-pottery",
];
export const demoReviews: Record<
  string,
  { friends: number; everyone: number; count: number }
> = Object.fromEntries(
  catalog.map((x, i) => [
    x.id,
    {
      friends: [8.9, 9.1, 8.6, 9.3, 8.5, 9.0, 8.2, 8.8, 8.1, 7.5, 8.4][i],
      everyone: [8.7, 8.8, 8.5, 9.0, 8.4, 8.8, 8.0, 8.6, 8.2, 7.8, 8.3][i],
      count: [4, 7, 3, 6, 2, 5, 2, 3, 2, 4, 3][i],
    },
  ]),
);
export const icons: Record<string, string> = {
  "Art museum": "color-palette-outline",
  "Food market": "basket-outline",
  Hike: "trail-sign-outline",
  "Garden visit": "leaf-outline",
  "Garden walk": "flower-outline",
  Skateboarding: "flash-outline",
  "Pottery class": "hand-left-outline",
  "History museum": "library-outline",
  "Local landmark": "camera-outline",
  "Self-guided walk": "walk-outline",
};
export type SearchOrigin = { lat: number; lng: number };
export function distance(x: Experience, origin?: SearchOrigin): number | null {
  if (x.lat === null || x.lng === null) return null;
  // Use an explicit location when available; otherwise the SLO catalog origin.
  const rad = Math.PI / 180,
    lat = origin?.lat ?? 35.28,
    lng = origin?.lng ?? -120.6625;
  const a =
    Math.sin(((x.lat - lat) * rad) / 2) ** 2 +
    Math.cos(lat * rad) *
      Math.cos(x.lat * rad) *
      Math.sin(((x.lng - lng) * rad) / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};
export type Filters = {
  minNicheness?: number;
  budget: number | null;
  radius: number | null;
  duration: number | null;
  vibes: string[];
  query: string;
  bounds?: MapBounds;
};
export function matches(x: Experience, f: Filters, origin?: SearchOrigin): boolean {
  const dist = distance(x, origin);
  return (
    (!(f.minNicheness && f.minNicheness > 0) || (!x.userCreated && getNicheness(x.id).score >= f.minNicheness)) &&
    (f.budget === null || (x.priceUSD !== null && x.priceUSD <= f.budget)) &&
    (!f.bounds ||
      (x.lat !== null &&
        x.lng !== null &&
        x.lat >= f.bounds.south &&
        x.lat <= f.bounds.north &&
        x.lng >= f.bounds.west &&
        x.lng <= f.bounds.east)) &&
    (f.radius === null || (dist !== null && dist <= f.radius)) &&
    (f.duration === null || (x.durationMinutesSuggested > 0 && x.durationMinutesSuggested <= f.duration)) &&
    (!f.vibes.length || x.vibes.some((v) => f.vibes.includes(v))) &&
    `${x.name} ${x.venue} ${x.activityType} ${x.vibes.join(" ")}`
      .toLocaleLowerCase()
      .includes(f.query.toLocaleLowerCase().trim())
  );
}
export function priceLevel(x: Experience): string {
  const price = x.priceUSD ?? x.priceEstimateUSD;
  if (price === undefined) return "Price varies";
  if (price === 0) return "Free";
  if (price <= 15) return "$";
  if (price <= 30) return "$$";
  if (price <= 50) return "$$$";
  return "$$$$";
}

export function priceLabel(x: Experience) {
  return x.priceUSD === null
    ? x.priceEstimateUSD === undefined ? "Price varies"
      : x.priceEstimateUSD === 0 ? "Free (est.)" : `~$${x.priceEstimateUSD} / person`
    : x.priceUSD === 0
      ? "Free admission"
      : `$${x.priceUSD} admission`;
}
