import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { photoSize, type PhotoAsset } from "../core/photos";

export async function preparePhoto(asset: PhotoAsset) {
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    context.resize(photoSize(asset.width, asset.height));
    const rendered = await context.renderAsync();
    try { return await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 }); }
    finally { rendered.release(); }
  } finally { context.release(); }
}
export function releasePreview(_uri: string) {}
