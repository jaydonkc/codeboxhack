/** Editorial estimates researched on the web, not observed community awareness. */
export type NichenessConfidence = "low" | "medium";

export interface NichenessSource {
  title: string;
  url: string;
  kind: "tourism" | "venue" | "local-reporting";
  observation: string;
  publishedAt?: string;
}

export interface NichenessDimensions {
  /** 0 = signature visitor stop; 4 = discovery centered on a specialist context. */
  mainstreamDistance: number;
  /** 0 = broad casual audience; 4 = a narrowly focused participatory interest. */
  audienceSpecialization: number;
  /** 0 = ordinary downtown wandering; 4 = a deliberately sought-out experience. */
  intentionalVisit: number;
}

export interface NichenessEstimate {
  experienceId: string;
  score: number;
  label: "Estimated";
  confidence: NichenessConfidence;
  summary: string;
  reason: string;
  checkedAt: string;
  referenceArea: "San Luis Obispo";
  dimensions: NichenessDimensions;
  sources: readonly NichenessSource[];
}

export const NICHENESS_METHOD = {
  version: "editorial-slo-v1",
  checkedAt: "2026-09-05",
  label: "Research estimate",
  description:
    "How far an activity sits outside SLO’s usual visitor circuit, based on travel coverage, audience, and how deliberately you seek it out. Higher means more niche.",
  caveat:
    "An editorial estimate, not a survey, review count, or measure of quality. Local regulars may know a place well. New to you is personal and separate.",
  weights: {
    mainstreamDistance: 0.6,
    audienceSpecialization: 0.25,
    intentionalVisit: 0.15,
  },
} as const;

const californiaGuide: NichenessSource = {
  title: "Visit California · Essential guide to SLO",
  url: "https://www.visitcalifornia.com/places-to-visit/san-luis-obispo/",
  kind: "tourism",
  observation:
    "Statewide visitor coverage features downtown, the market, Bubblegum Alley, SLOMA, and the Bishop Peak and Cerro San Luis hikes.",
};

const downtownGuide: NichenessSource = {
  title: "Visit SLO · Downtown neighborhood",
  url: "https://visitslo.com/neighborhoods/meet-us-in-downtown/",
  kind: "tourism",
  observation:
    "The city’s downtown guide puts creek wandering, museums, the market, and Bubblegum Alley in its central visitor district.",
};

type EstimateInput = Omit<
  NichenessEstimate,
  "score" | "label" | "checkedAt" | "referenceArea" | "reason"
>;

function estimate(input: EstimateInput): NichenessEstimate {
  const { mainstreamDistance, audienceSpecialization, intentionalVisit } =
    input.dimensions;
  const weighted =
    mainstreamDistance * NICHENESS_METHOD.weights.mainstreamDistance +
    audienceSpecialization * NICHENESS_METHOD.weights.audienceSpecialization +
    intentionalVisit * NICHENESS_METHOD.weights.intentionalVisit;
  return {
    ...input,
    reason: input.summary,
    score: Math.round((weighted * 2.5 + Number.EPSILON) * 10) / 10,
    label: "Estimated",
    checkedAt: NICHENESS_METHOD.checkedAt,
    referenceArea: "San Luis Obispo",
  };
}

export const NICHENESS_ESTIMATES: readonly NichenessEstimate[] = [
  estimate({
    experienceId: "sloma",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 1.5,
      audienceSpecialization: 1.5,
      intentionalVisit: 1,
    },
    summary:
      "A downtown cultural staple with statewide travel coverage; more art-focused than an everyday stroll.",
    sources: [
      californiaGuide,
      {
        title: "SLOMA · Exhibitions and programs",
        url: "https://sloma.org/",
        kind: "venue",
        observation:
          "The museum presents contemporary exhibitions, public art, artist talks, and recurring community programs.",
      },
    ],
  }),
  estimate({
    experienceId: "downtown-farmers-market",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 0.5,
      audienceSpecialization: 0,
      intentionalVisit: 0.5,
    },
    summary:
      "One of SLO’s signature outings, with broad appeal and prominent visitor-guide coverage.",
    sources: [
      californiaGuide,
      {
        title: "Downtown SLO · Farmers’ Market",
        url: "https://downtownslo.com/farmers-market",
        kind: "venue",
        observation:
          "Its organizer presents the weekly, multi-block market as the city’s signature community event.",
      },
    ],
  }),
  estimate({
    experienceId: "cerro-san-luis",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 1.5,
      audienceSpecialization: 1,
      intentionalVisit: 1,
    },
    summary:
      "A well-established local hiking destination; exploring its reserve trails is a little more deliberate than a downtown stop.",
    sources: [
      californiaGuide,
      {
        title: "Visit SLO · Cerro San Luis Natural Reserve",
        url: "https://visitslo.com/things-to-do/outdoor-activities/hiking/cerro-san-luis-natural-reserve/",
        kind: "tourism",
        observation:
          "The destination guide describes popular sunrise and sunset visits, multiple routes, and its place in the Tri-Tip Challenge.",
      },
      {
        title: "The Tribune · Guide to SLO County hiking trails",
        url: "https://www.sanluisobispo.com/news/local/environment/article269160502.html",
        kind: "local-reporting",
        publishedAt: "2022-12-04",
        observation:
          "Local reporting identifies Bishop Peak and Cerro San Luis as iconic area hikes.",
      },
    ],
  }),
  estimate({
    experienceId: "bishop-peak",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 1,
      audienceSpecialization: 1,
      intentionalVisit: 1,
    },
    summary:
      "A signature SLO hike featured in first-visit itineraries and statewide travel guides.",
    sources: [
      californiaGuide,
      {
        title: "Visit SLO · Know before you go",
        url: "https://visitslo.com/plan-your-trip/know-before-you-go-to-san-luis-obispo/",
        kind: "tourism",
        observation:
          "The city tourism site includes Bishop Peak in its introductory 24-hour itinerary.",
      },
    ],
  }),
  estimate({
    experienceId: "slo-botanical-garden",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 2,
      audienceSpecialization: 1.5,
      intentionalVisit: 2,
    },
    summary:
      "An established garden destination beyond downtown, promoted for families as well as plant enthusiasts.",
    sources: [
      {
        title: "Visit SLO · Botanical Garden",
        url: "https://visitslo.com/things-to-do/family/slo-botanical-garden/",
        kind: "tourism",
        observation:
          "The family-travel guide promotes garden walks, educational activities, and events to a broad visitor audience.",
      },
      {
        title: "SLO Botanical Garden · Visit",
        url: "https://slobg.org/visit/",
        kind: "venue",
        observation:
          "The Mediterranean-climate garden occupies a separate destination in El Chorro Regional Park and offers docent tours.",
      },
    ],
  }),
  estimate({
    experienceId: "leaning-pine-arboretum",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 3.5,
      audienceSpecialization: 2,
      intentionalVisit: 3.5,
    },
    summary:
      "A tucked-away campus garden highlighted as an overlooked find, with a strong horticultural identity.",
    sources: [
      {
        title: "Cal Poly · Visiting Leaning Pine",
        url: "https://plantsciences.calpoly.edu/leaning-pine-arboretum/visiting-lpa",
        kind: "venue",
        observation:
          "The public living laboratory is at the north-end horticulture unit, with dedicated directions and self-guided tours.",
      },
      {
        title: "Mustang News · Understated spots on campus",
        url: "https://mustangnews.net/a-students-guide-to-the-understated-spots-on-campus/",
        kind: "local-reporting",
        publishedAt: "2022-04-06",
        observation:
          "Student reporting includes Leaning Pine among campus places that students can overlook and describes its specialist plant collections.",
      },
      {
        title: "Visit SLO · Activities for Cal Poly supporters",
        url: "https://visitslo.com/blog/top-activities-for-cal-poly-parents-supporters/",
        kind: "tourism",
        observation:
          "Tourism coverage includes it in campus discoveries for Cal Poly visitors; that coverage also keeps it from being treated as unknown.",
      },
    ],
  }),
  estimate({
    experienceId: "slo-skate-park",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 2,
      audienceSpecialization: 3.5,
      intentionalVisit: 2,
    },
    summary:
      "Well promoted locally, but the activity itself is focused on skaters rather than the typical sightseeing crowd.",
    sources: [
      {
        title: "Visit SLO · SLO Skate Park",
        url: "https://visitslo.com/things-to-do/outdoor-activities/parks-in-san-luis-obispo/slo-skate-park-santa-rosa-park/",
        kind: "tourism",
        observation:
          "The visitor listing markets the bowls, ramps, and rails to skaters and families, including visitors and locals.",
      },
      {
        title: "Visit SLO · Foothill neighborhood",
        url: "https://visitslo.com/neighborhoods/meet-us-in-foothill/",
        kind: "tourism",
        observation:
          "The skate park is a named recreation option in the official neighborhood guide, evidence against calling the venue hidden.",
      },
    ],
  }),
  estimate({
    experienceId: "anam-cre-pottery",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 2.5,
      audienceSpecialization: 3,
      intentionalVisit: 3,
    },
    summary:
      "A specialist clay experience in a longstanding local studio, discovered through creative circles and neighborhood tips.",
    sources: [
      {
        title: "Anam Cré · Studio and classes",
        url: "https://www.anamcre.com/",
        kind: "venue",
        observation:
          "The studio centers on pottery classes, private lessons, memberships, clay, and firing services; beginners are welcome.",
      },
      {
        title: "Visit SLO · MoJo neighborhood",
        url: "https://visitslo.com/neighborhoods/meet-us-in-mojo/",
        kind: "tourism",
        observation:
          "The neighborhood’s insider tips recommend clay-throwing classes at Anam Cré.",
      },
      {
        title: "New Times · Anam Cre studio community coverage",
        url: "https://www.newtimesslo.com/collections/volunteers-2020/",
        kind: "local-reporting",
        observation:
          "Archived local reporting profiles the studio’s two decades in the community, countering the idea that it is new or unknown locally.",
      },
    ],
  }),
  estimate({
    experienceId: "history-center",
    confidence: "low",
    dimensions: {
      mainstreamDistance: 2.5,
      audienceSpecialization: 2.5,
      intentionalVisit: 1,
    },
    summary:
      "An easy-to-reach downtown museum with a focused county-history audience and established cultural-guide coverage.",
    sources: [
      {
        title: "History Center · About",
        url: "https://www.historycenterslo.org/about",
        kind: "venue",
        observation:
          "The Carnegie Library museum and research center focus on preserving and interpreting county history.",
      },
      {
        title: "Visit SLO · History Center",
        url: "https://visitslo.com/things-to-do/arts-and-culture/museums/history-center-of-san-luis-obispo-county/",
        kind: "tourism",
        observation:
          "The official tourism museum directory lists the center and its county-history collections.",
      },
      downtownGuide,
    ],
  }),
  estimate({
    experienceId: "bubblegum-alley",
    confidence: "medium",
    dimensions: {
      mainstreamDistance: 0.5,
      audienceSpecialization: 0,
      intentionalVisit: 0.5,
    },
    summary:
      "An unusual sight, but a widely promoted SLO photo stop. Quirky does not necessarily mean niche.",
    sources: [californiaGuide, downtownGuide],
  }),
  estimate({
    experienceId: "downtown-creek-walk",
    confidence: "low",
    dimensions: {
      mainstreamDistance: 0.5,
      audienceSpecialization: 0,
      intentionalVisit: 0,
    },
    summary:
      "Downtown and creek wandering are central to the usual SLO visit; a specific side route could be more niche.",
    sources: [downtownGuide, californiaGuide],
  }),
];

const byId = new Map(
  NICHENESS_ESTIMATES.map((item) => [item.experienceId, item]),
);

export function getNicheness(id: string): NichenessEstimate {
  const result = byId.get(id);
  if (!result) {
    throw new Error(`No researched nicheness estimate for activity "${id}".`);
  }
  return result;
}
