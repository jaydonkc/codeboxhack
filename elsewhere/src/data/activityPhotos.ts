import type { ImageSourcePropType } from "react-native";
import manifest from "./activity-photos.json";

export type ActivityPhoto = {
  id: string;
  file: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  originalUrl: string;
  license: string;
  licenseUrl?: string;
  source: ImageSourcePropType;
};

// Explicit requires let Metro bundle the real photos for web, iOS, and Android.
const sources: Record<string, ImageSourcePropType> = {
  "sloma-1.jpg": require("../../assets/activities/sloma-1.jpg"),
  "sloma-2.jpg": require("../../assets/activities/sloma-2.jpg"),
  "downtown-farmers-market-1.jpg": require("../../assets/activities/downtown-farmers-market-1.jpg"),
  "cerro-san-luis-1.jpg": require("../../assets/activities/cerro-san-luis-1.jpg"),
  "cerro-san-luis-2.jpg": require("../../assets/activities/cerro-san-luis-2.jpg"),
  "bishop-peak-1.jpg": require("../../assets/activities/bishop-peak-1.jpg"),
  "bishop-peak-2.jpg": require("../../assets/activities/bishop-peak-2.jpg"),
  "slo-botanical-garden-1.jpg": require("../../assets/activities/slo-botanical-garden-1.jpg"),
  "slo-botanical-garden-2.jpg": require("../../assets/activities/slo-botanical-garden-2.jpg"),
  "leaning-pine-arboretum-1.jpg": require("../../assets/activities/leaning-pine-arboretum-1.jpg"),
  "leaning-pine-arboretum-2.jpg": require("../../assets/activities/leaning-pine-arboretum-2.jpg"),
  "leaning-pine-arboretum-3.jpg": require("../../assets/activities/leaning-pine-arboretum-3.jpg"),
  "slo-skate-park-1.jpg": require("../../assets/activities/slo-skate-park-1.jpg"),
  "anam-cre-pottery-1.jpg": require("../../assets/activities/anam-cre-pottery-1.jpg"),
  "anam-cre-pottery-2.jpg": require("../../assets/activities/anam-cre-pottery-2.jpg"),
  "anam-cre-pottery-3.jpg": require("../../assets/activities/anam-cre-pottery-3.jpg"),
  "history-center-1.jpg": require("../../assets/activities/history-center-1.jpg"),
  "bubblegum-alley-1.jpg": require("../../assets/activities/bubblegum-alley-1.jpg"),
  "bubblegum-alley-2.jpg": require("../../assets/activities/bubblegum-alley-2.jpg"),
  "downtown-creek-walk-1.jpg": require("../../assets/activities/downtown-creek-walk-1.jpg"),
  "downtown-creek-walk-2.jpg": require("../../assets/activities/downtown-creek-walk-2.jpg"),
  "downtown-creek-walk-3.jpg": require("../../assets/activities/downtown-creek-walk-3.jpg"),
};

export function getActivityPhotos(activityId: string): ActivityPhoto[] {
  const photos = (manifest as Record<string, Omit<ActivityPhoto, "source">[]>)[activityId] ?? [];
  return photos.map((photo) => ({ ...photo, source: sources[photo.file] }));
}
