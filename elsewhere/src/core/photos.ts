export type PhotoAsset = { uri: string; width: number; height: number; fileSize?: number; mimeType?: string; type?: string | null };
export type SavedPhoto = { id: string; placeId: string; uri: string; width: number; height: number; createdAt: number };
export type PreparedPhoto = SavedPhoto;
export const MAX_PLACE_PHOTOS = 20;
export const MAX_PHOTO_BATCH = 6;

export function validatePhotoSelection(assets: PhotoAsset[], existingCount: number) {
  if (!assets.length) return;
  if (assets.length > MAX_PHOTO_BATCH) throw new Error(`Choose up to ${MAX_PHOTO_BATCH} photos at a time.`);
  if (existingCount + assets.length > MAX_PLACE_PHOTOS) throw new Error(`You can add up to ${MAX_PLACE_PHOTOS} photos per place. Remove a photo to add another.`);
  for (const asset of assets) {
    if ((asset.type && asset.type !== "image") || (asset.mimeType && !/^image\/(jpeg|png|webp|heic|heif|avif|gif)$/i.test(asset.mimeType))) {
      throw new Error("Choose a photo in JPEG, PNG, HEIC, WebP, AVIF, or GIF format.");
    }
    if (!asset.uri || !Number.isFinite(asset.width) || !Number.isFinite(asset.height) || asset.width <= 0 || asset.height <= 0) throw new Error("That photo could not be read. Choose another photo.");
    if ((asset.fileSize ?? 0) > 50 * 1024 * 1024 || asset.width * asset.height > 64_000_000) throw new Error("Choose photos smaller than 50 MB and 64 megapixels.");
  }
}

export function photoSize(width: number, height: number) {
  const scale = Math.min(1, 1600 / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function photosForPlace(photos: SavedPhoto[], placeId: string) {
  return photos.filter(photo => photo.placeId === placeId).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}
