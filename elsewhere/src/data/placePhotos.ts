import type { ImageSourcePropType } from "react-native";

export type PlacePhoto = {
  id: string;
  source?: ImageSourcePropType;
  owned?: boolean;
  authors: { name: string; url?: string }[];
  license?: { name: string; url: string };
  googleIndex?: number;
};
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(" ", "_"))}`;
const by = { name: "CC BY 2.0", url: "https://creativecommons.org/licenses/by/2.0/" };
const cc0 = { name: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/" };
export const placePhotos: Record<string, PlacePhoto[]> = {
  "sloma": [{ id: "sloma-exterior", source: require("../../assets/places/sloma.jpg"), authors: [{ name: "Stilfehler", url: commons("San Luis Obispo Museum of Art (1).jpg") }], license: { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" } }],
  "bishop-peak": [{ id: "bishop-peak-view", source: require("../../assets/places/bishop-peak.jpg"), authors: [{ name: "Hey Paul", url: commons("Bishop's Peak.jpg") }], license: by }],
  "bubblegum-alley": [{ id: "bubblegum-alley-view", source: require("../../assets/places/bubblegum-alley.jpg"), authors: [{ name: "Piutus", url: commons("Bubble Gum Alley.jpg") }], license: by }],
  "history-center": [{ id: "history-center-exterior", source: require("../../assets/places/history-center.jpg"), authors: [{ name: "Padraic", url: commons("SLO historical museum.jpg") }], license: { name: "CC BY-SA 3.0", url: "https://creativecommons.org/licenses/by-sa/3.0/" } }],
  "leaning-pine-arboretum": [
    { id: "arboretum-topiary", source: require("../../assets/places/arboretum-topiary.jpg"), authors: [{ name: "Daderot", url: commons("Topiary garden - Leaning Pine Arboretum - DSC05400.JPG") }], license: cc0 },
    { id: "arboretum-garden", source: require("../../assets/places/arboretum-garden.jpg"), authors: [{ name: "Daderot", url: commons("Horticulture - Leaning Pine Arboretum - DSC05390.JPG") }], license: cc0 },
  ],
};
