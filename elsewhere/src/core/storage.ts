import { parseCustomActivities } from "./customActivities";
import { catalog, VIBES, type Experience } from "../data/catalog";
import { Preference } from "./ranking";
import { parseVisitDate, randomVisitDate } from "./visitDate";

// Keep the original key so an upgrade finds and migrates existing histories.
export const STORAGE_KEY = "elsewhere-demo-v1";

export type OnboardingState = {
  version: 1;
  step: "interests" | "complete";
  draftInterests: string[];
  firstSavePromptDismissed: boolean;
};

export type Stored = {
  version: 2;
  customActivities?: Experience[];
  sampleVisitDatesAdded: boolean;
  saved: string[];
  preferences: Preference[];
  awareness: Record<string, string>;
  guide: string[];
  guideCreated: boolean;
  guideNotes: Record<string, string>;
  interests: string[];
  demoSocial: boolean;
  city: string;
  onboarding: OnboardingState;
};

export function createFreshState(): Stored {
  return {
    version: 2,
    sampleVisitDatesAdded: true,
    saved: [],
    preferences: [],
    awareness: {},
    guide: [],
    guideCreated: false,
    guideNotes: {},
    interests: [],
    demoSocial: false,
    city: "San Luis Obispo",
    onboarding: {
      version: 1,
      step: "interests",
      draftInterests: [],
      firstSavePromptDismissed: false,
    },
  };
}

const builtInIds = new Set(catalog.filter((entry) => !entry.userCreated).map((entry) => entry.id));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((x): x is string => typeof x === "string"))] : [];

const interests = (value: unknown) => [...new Set(strings(value)
  .map((vibe) => vibe === "Hangout" ? "Community" : vibe)
  .filter((vibe) => VIBES.includes(vibe)))];
const textRecord = (value: unknown): Record<string, string> =>
  isRecord(value)
    ? Object.fromEntries(Object.entries(value).filter((entry) => typeof entry[1] === "string")) as Record<string, string>
    : {};

/** Null means a new install. Invalid/unreadable data must never become a new store. */
export function parseStoredState(raw: string | null): Stored {
  if (raw === null) return createFreshState();
  const p: unknown = JSON.parse(raw);
  if (!isRecord(p) || ![1, 2].includes(p.version as number) ||
      !Array.isArray(p.saved) || !Array.isArray(p.preferences)) {
    throw new Error("Unrecognized saved data");
  }
  const legacy = p.version === 1;
  const onboarding = p.onboarding;
  if (!legacy && (!isRecord(onboarding) || onboarding.version !== 1 ||
      !["interests", "complete"].includes(onboarding.step as string))) {
    throw new Error("Unrecognized onboarding data");
  }
  const customActivities = parseCustomActivities(p.customActivities);
  const validIds = new Set([...builtInIds, ...customActivities.map((activity) => activity.id)]);
  const ids = (value: unknown) => strings(value).filter((id) => validIds.has(id));
  const fresh = createFreshState();
  const saved = ids(p.saved);
  const guide = ids(p.guide);
  return {
    ...fresh,
    ...(customActivities.length ? { customActivities } : {}),
    saved,
    preferences: p.preferences.filter((r): r is Preference =>
      isRecord(r) && typeof r.id === "string" && validIds.has(r.id) &&
      ["liked", "okay", "disliked"].includes(r.band as string) &&
      (r.rank === null || (typeof r.rank === "number" && Number.isFinite(r.rank) && r.rank >= 1)),
    ).map((r) => ({
      ...r,
      note: typeof r.note === "string" ? r.note : undefined,
      again: typeof r.again === "boolean" ? r.again : undefined,
      // One-time, user-requested sample dates for existing undated Been entries.
      // Once migrated, clearing a date stays cleared on subsequent loads.
      visitedOn: parseVisitDate(r.visitedOn) ? r.visitedOn
        : !p.sampleVisitDatesAdded && r.visitedOn == null ? randomVisitDate() : undefined,
    })),
    awareness: textRecord(p.awareness),
    guide,
    guideCreated: Boolean(p.guideCreated || guide.length),
    guideNotes: textRecord(p.guideNotes),
    interests: Array.isArray(p.interests) ? interests(p.interests) : legacy ? ["Relax", "Creative"] : [],
    demoSocial: typeof p.demoSocial === "boolean" ? p.demoSocial : legacy,
    city: typeof p.city === "string" && p.city.trim() ? p.city : fresh.city,
    onboarding: legacy ? {
      version: 1,
      step: "complete",
      draftInterests: [],
      firstSavePromptDismissed: true,
    } : {
      version: 1,
      step: (onboarding as Record<string, unknown>).step as OnboardingState["step"],
      draftInterests: interests((onboarding as Record<string, unknown>).draftInterests),
      firstSavePromptDismissed: Boolean((onboarding as Record<string, unknown>).firstSavePromptDismissed || saved.length),
    },
  };
}

export function toggleDraftInterest(data: Stored, interest: string): Stored {
  if (data.onboarding.step === "complete" || !VIBES.includes(interest)) return data;
  const draft = data.onboarding.draftInterests;
  return {
    ...data,
    onboarding: {
      ...data.onboarding,
      draftInterests: draft.includes(interest) ? draft.filter((v) => v !== interest) : [...draft, interest],
    },
  };
}

export function completeOnboarding(data: Stored, skip = false): Stored {
  if (data.onboarding.step === "complete") return data;
  return {
    ...data,
    interests: skip ? [] : [...data.onboarding.draftInterests],
    onboarding: { ...data.onboarding, step: "complete", draftInterests: [] },
  };
}

export function dismissFirstSavePrompt(data: Stored): Stored {
  return { ...data, onboarding: { ...data.onboarding, firstSavePromptDismissed: true } };
}

export function toggleSavedExperience(data: Stored, id: string): Stored {
  if (!builtInIds.has(id) && !data.customActivities?.some((activity) => activity.id === id)) return data;
  const removing = data.saved.includes(id);
  return {
    ...(removing ? data : dismissFirstSavePrompt(data)),
    saved: removing ? data.saved.filter((value) => value !== id) : [...data.saved, id],
  };
}

/** Serialize snapshots, and allow a later write/retry after a failed write. */
export function createStateWriter(setItem: (key: string, value: string) => Promise<void>) {
  let queue = Promise.resolve();
  return (data: Stored) => {
    const snapshot = JSON.stringify(data);
    queue = queue.catch(() => {}).then(() => setItem(STORAGE_KEY, snapshot));
    return queue;
  };
}
