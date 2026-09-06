import { demoGuide } from "./catalog";

export type ExperienceGuide = {
  id: string;
  title: string;
  author: string;
  city: string;
  description: string;
  coverId: string;
  experienceIds: string[];
  notes: Record<string, string>;
};

// Example collections, hidden with the existing Example social data setting.
export const exampleGuides: ExperienceGuide[] = [
  {
    id: "emma",
    title: "A slow weekend in SLO",
    author: "Emma",
    city: "San Luis Obispo",
    description: "A little art, a garden walk, and something handmade.",
    coverId: "leaning-pine-arboretum",
    experienceIds: demoGuide,
    notes: {
      sloma: "Start with a little art beside Mission Plaza.",
      "leaning-pine-arboretum": "A quiet garden detour when you want to slow down.",
      "downtown-farmers-market": "Make Thursday evening your downtown night.",
      "anam-cre-pottery": "Book a class and make something to remember the trip by.",
    },
  },
  {
    id: "art-and-making",
    title: "Art & making",
    author: "Elsewhere",
    city: "San Luis Obispo",
    description: "Gallery time, local history, and a hands-on pottery class.",
    coverId: "anam-cre-pottery",
    experienceIds: ["sloma", "anam-cre-pottery", "history-center"],
    notes: {},
  },
  {
    id: "get-outside",
    title: "Get outside",
    author: "Elsewhere",
    city: "San Luis Obispo",
    description: "Summit trails and gardens for a day outdoors.",
    coverId: "bishop-peak",
    experienceIds: ["bishop-peak", "cerro-san-luis", "slo-botanical-garden", "leaning-pine-arboretum"],
    notes: {},
  },
  {
    id: "downtown",
    title: "Around downtown",
    author: "Elsewhere",
    city: "San Luis Obispo",
    description: "Art, local landmarks, and the Thursday evening market.",
    coverId: "downtown-farmers-market",
    experienceIds: ["downtown-creek-walk", "sloma", "bubblegum-alley", "downtown-farmers-market"],
    notes: {},
  },
];
