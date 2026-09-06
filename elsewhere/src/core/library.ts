import type { Experience } from "../data/catalog";
import type { Preference } from "./ranking";

type Library = {
  preferences: Preference[];
  saved: string[];
  customExperiences: Experience[];
  awareness: Record<string, string>;
};

/** Metadata changes must preserve the exact ranking, including unresolved visits. */
export function updateVisitDetails<T extends Library>(data: T, id: string, details: Pick<Preference, "note" | "again">): T {
  return { ...data, preferences: data.preferences.map(p => p.id === id ? { ...p, note: details.note?.trim() ?? "", again: details.again === true } : p) };
}

export function removeVisit<T extends Library>(data: T, id: string, keepSaved: boolean): T {
  return {
    ...data,
    preferences: data.preferences.filter(p => p.id !== id),
    saved: keepSaved ? [...new Set([...data.saved, id])] : data.saved.filter(saved => saved !== id),
  };
}

/** Only an owned custom place can be deleted from the catalog. */
export function deleteCustomPlace<T extends Library>(data: T, id: string): T {
  if (!id.startsWith("user:") || !data.customExperiences.some(e => e.id === id)) return data;
  const { [id]: removed, ...awareness } = data.awareness;
  return { ...removeVisit(data, id, false), awareness, customExperiences: data.customExperiences.filter(e => e.id !== id) };
}

export function hasMapCoordinates(item: Pick<Experience, "lat" | "lng">): item is typeof item & { lat: number; lng: number } {
  return typeof item.lat === "number" && Number.isFinite(item.lat) && Math.abs(item.lat) <= 90
    && typeof item.lng === "number" && Number.isFinite(item.lng) && Math.abs(item.lng) <= 180;
}
