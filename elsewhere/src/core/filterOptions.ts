export const PRICE_OPTIONS = [
  { value: null, label: "Any", description: "Any admission price" },
  { value: 0, label: "Free", description: "Free admission" },
  { value: 15, label: "$", description: "Up to $15 per person" },
  { value: 30, label: "$$", description: "Up to $30 per person" },
  { value: 50, label: "$$$", description: "Up to $50 per person" },
] as const;

export function priceFilterLabel(budget: number | null): string {
  return PRICE_OPTIONS.find((option) => option.value === budget)?.label ?? "Any";
}

export const MAX_DISTANCE_MILES = 25;
export const DISTANCE_SLIDER_MAX = MAX_DISTANCE_MILES + 1;

export function distanceFromSlider(value: number): number | null {
  const rounded = Math.max(1, Math.min(DISTANCE_SLIDER_MAX, Math.round(value)));
  return rounded === DISTANCE_SLIDER_MAX ? null : rounded;
}

export function distanceSliderLabel(value: number | null): string {
  return value === null ? "Any distance" : `${value} ${value === 1 ? "mile" : "miles"}`;
}
