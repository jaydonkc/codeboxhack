import { useEffect, useRef, useState } from "react";
import type { PhotoAsset } from "../core/photos";
import { releasePreview } from "./preparePhoto";

export function usePhotoDraft() {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const previous = useRef(photos);
  useEffect(() => {
    const retained = new Set(photos.map(p => p.uri));
    previous.current.filter(p => !retained.has(p.uri)).forEach(p => releasePreview(p.uri));
    previous.current = photos;
  }, [photos]);
  useEffect(() => () => previous.current.forEach(p => releasePreview(p.uri)), []);
  return [photos, setPhotos] as const;
}
