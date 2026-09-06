import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import type { PreparedPhoto, SavedPhoto } from "../core/photos";

const KEY = "elsewhere-place-photos-v1";
const directory = () => new Directory(Paths.document, "place-photos");
const fileFor = (id: string) => new File(directory(), `${id}.jpg`);
const index = (photos: SavedPhoto[]) => JSON.stringify(photos.map(({ uri, ...photo }) => photo));

export async function loadPhotos(): Promise<SavedPhoto[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const photos: Omit<SavedPhoto, "uri">[] = JSON.parse(raw);
  if (!Array.isArray(photos)) throw new Error("Photos could not be loaded.");
  return photos.filter(p => /^photo-[A-Za-z0-9-]+$/.test(p.id) && typeof p.placeId === "string" && fileFor(p.id).exists)
    .map(p => ({ ...p, uri: fileFor(p.id).uri }));
}
export async function storePhotos(photos: PreparedPhoto[], existing: SavedPhoto[]): Promise<SavedPhoto[]> {
  directory().create({ intermediates: true, idempotent: true });
  const copied: SavedPhoto[] = [];
  try {
    for (const photo of photos) {
      const destination = fileFor(photo.id);
      new File(photo.uri).copy(destination);
      copied.push({ ...photo, uri: destination.uri });
    }
    await AsyncStorage.setItem(KEY, index([...existing, ...copied]));
    return copied;
  } catch (error) {
    for (const photo of copied) { try { fileFor(photo.id).delete(); } catch {} }
    throw error;
  }
}
export async function deletePhoto(photo: SavedPhoto, remaining: SavedPhoto[]) {
  return deletePhotos([photo], remaining);
}
export async function deletePhotos(photos: SavedPhoto[], remaining: SavedPhoto[]) {
  await AsyncStorage.setItem(KEY, index(remaining));
  for (const photo of photos) {
    try { fileFor(photo.id).delete(); } catch {} // A missing file is already removed.
  }
}
export function releasePhoto(_photo: SavedPhoto) {}
