import { photoSize, type PhotoAsset } from "../core/photos";

export async function preparePhoto(asset: PhotoAsset) {
  const image = new Image();
  image.src = asset.uri;
  await image.decode();
  const size = photoSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = size.width; canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo could not be processed.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Photo could not be processed.")), "image/jpeg", 0.85));
  return { uri: URL.createObjectURL(blob), ...size };
}
export function releasePreview(uri: string) { if (uri.startsWith("blob:")) URL.revokeObjectURL(uri); }
