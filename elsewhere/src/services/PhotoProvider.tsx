import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { photosForPlace, validatePhotoSelection, type PhotoAsset, type SavedPhoto } from "../core/photos";
import { preparePhoto, releasePreview } from "./preparePhoto";
import * as storage from "./photoStorage";

type PhotosContext = {
  photos: SavedPhoto[]; ready: boolean; loadError: string;
  add: (placeId: string, assets: PhotoAsset[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removePlace: (placeId: string) => Promise<void>;
};
const Context = createContext<PhotosContext | null>(null);
export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const current = useRef(photos);
  const operations = useRef<Promise<unknown>>(Promise.resolve());
  const commit = (next: SavedPhoto[]) => { current.current = next; setPhotos(next); };
  useEffect(() => {
    let active = true;
    storage.loadPhotos().then(items => {
      if (active) { commit(items); setReady(true); }
      else items.forEach(storage.releasePhoto);
    }).catch(() => active && setLoadError("Photos could not be loaded. Reload and try again."));
    return () => { active = false; current.current.forEach(storage.releasePhoto); };
  }, []);
  function serialize<T>(operation: () => Promise<T>) {
    const next = operations.current.then(operation);
    operations.current = next.catch(() => {});
    return next;
  }
  function add(placeId: string, assets: PhotoAsset[]) {
    return serialize(async () => {
      if (!ready) throw new Error(loadError || "Photos are still loading. Try again.");
      if (!assets.length) return;
      validatePhotoSelection(assets, photosForPlace(current.current, placeId).length);
      const prepared: SavedPhoto[] = [];
      try {
        for (const [i, asset] of assets.entries()) {
          const result = await preparePhoto(asset);
          // Re-encoding stores pixels only; camera location/EXIF is not kept.
          prepared.push({ id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${i}`, placeId, uri: result.uri, width: result.width, height: result.height, createdAt: Date.now() + i });
        }
        const stored = await storage.storePhotos(prepared, current.current);
        commit([...current.current, ...stored]);
      } finally { prepared.forEach(p => releasePreview(p.uri)); }
    });
  }
  function remove(id: string) {
    return serialize(async () => {
      const photo = current.current.find(p => p.id === id);
      if (!photo) return;
      const remaining = current.current.filter(p => p.id !== id);
      await storage.deletePhoto(photo, remaining);
      commit(remaining);
    });
  }
  function removePlace(placeId: string) {
    return serialize(async () => {
      if (!ready) throw new Error(loadError || "Photos are still loading. Try again.");
      const removed = current.current.filter(p => p.placeId === placeId);
      if (!removed.length) return;
      const remaining = current.current.filter(p => p.placeId !== placeId);
      await storage.deletePhotos(removed, remaining);
      commit(remaining);
    });
  }
  return <Context.Provider value={{ photos, ready, loadError, add, remove, removePlace }}>{children}</Context.Provider>;
}
export function usePhotos() {
  const context = useContext(Context);
  if (!context) throw new Error("PhotoProvider is required.");
  return context;
}
