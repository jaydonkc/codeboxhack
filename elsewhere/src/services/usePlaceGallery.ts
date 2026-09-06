import { useEffect, useMemo, useRef, useState } from "react";
import { photosForPlace } from "../core/photos";
import { placePhotos, type PlacePhoto } from "../data/placePhotos";
import { usePhotos } from "./PhotoProvider";
import { livePlacesEnabled, requestPlaces } from "./places";
import { isGoogleId } from "./placesTypes";

export function usePlaceGallery(placeId: string) {
  const { photos: saved } = usePhotos();
  const local = useMemo(() => photosForPlace(saved, placeId).map(p => ({ id: p.id, source: { uri: p.uri }, authors: [{ name: "You" }], owned: true })), [saved, placeId]);
  const [remote, setRemote] = useState<PlacePhoto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(new Set<number>());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function load(index = 0) {
    if (!isGoogleId(placeId) || !livePlacesEnabled || pending.current.has(index) || remote[index]?.source) return;
    pending.current.add(index);
    setLoading(true); setError("");
    try {
      const result = await requestPlaces({ action: "photo", id: placeId, index });
      if (!alive.current) return;
      setRemote(previous => Array.from({ length: result.photoCount ?? 0 }, (_, i) => i === index && result.photo
        ? { id: `${placeId}-photo-${i}`, googleIndex: i, source: { uri: result.photo.uri }, authors: result.photo.authors }
        : previous[i] ?? { id: `${placeId}-photo-${i}`, googleIndex: i, authors: [] }));
    } catch { if (alive.current) setError("Place photos could not be loaded."); }
    finally { pending.current.delete(index); if (alive.current) setLoading(false); }
  }
  useEffect(() => { void load(0); }, [placeId]);
  return { photos: [...local, ...(placePhotos[placeId] ?? []), ...remote] as PlacePhoto[], remoteError: error, loading, load };
}
