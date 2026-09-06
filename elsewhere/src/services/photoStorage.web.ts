import type { PreparedPhoto, SavedPhoto } from "../core/photos";
import { deletePhotoRecords, openPhotoDatabase, readPhotoRecords, writePhotoRecords } from "./photoDatabase";

export async function loadPhotos(): Promise<SavedPhoto[]> {
  const db = await openPhotoDatabase();
  try { return (await readPhotoRecords(db)).map(({ blob, ...photo }) => ({ ...photo, uri: URL.createObjectURL(blob) })); }
  finally { db.close(); }
}
export async function storePhotos(photos: PreparedPhoto[], _existing: SavedPhoto[]): Promise<SavedPhoto[]> {
  const blobs = await Promise.all(photos.map(async p => (await fetch(p.uri)).blob()));
  const db = await openPhotoDatabase();
  try { await writePhotoRecords(db, photos, blobs); }
  finally { db.close(); }
  return photos.map((p, i) => ({ ...p, uri: URL.createObjectURL(blobs[i]) }));
}
export async function deletePhoto(photo: SavedPhoto, _remaining: SavedPhoto[]) {
  return deletePhotos([photo], _remaining);
}
export async function deletePhotos(photos: SavedPhoto[], _remaining: SavedPhoto[]) {
  const db = await openPhotoDatabase();
  try { await deletePhotoRecords(db, photos.map(p => p.id)); }
  finally { db.close(); }
  photos.forEach(releasePhoto);
}
export function releasePhoto(photo: SavedPhoto) { URL.revokeObjectURL(photo.uri); }
