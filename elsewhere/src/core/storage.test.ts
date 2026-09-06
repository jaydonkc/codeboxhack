import test from "node:test";
import assert from "node:assert/strict";
import { localDateKey, parseVisitDate } from "./visitDate";
import {
  completeOnboarding, createFreshState, createStateWriter, dismissFirstSavePrompt,
  parseStoredState, STORAGE_KEY, toggleDraftInterest, toggleSavedExperience,
} from "./storage";

test("a missing store starts with optional interests and no social fixtures", () => {
  const state = parseStoredState(null);
  assert.equal(state.onboarding.step, "interests");
  assert.deepEqual(state.interests, []);
  assert.deepEqual(state.onboarding.draftInterests, []);
  assert.equal(state.demoSocial, false);
  assert.equal(state.onboarding.firstSavePromptDismissed, false);
});

test("migrating existing history preserves choices, visits, guides and local details", () => {
  const legacy = {
    version: 1, saved: ["sloma"],
    preferences: [{ id: "leaning-pine-arboretum", band: "liked", rank: 1, note: "A quiet afternoon", again: true, visitedOn: "2026-09-05" }],
    awareness: { sloma: "heard-of" }, guide: ["leaning-pine-arboretum"],
    guideCreated: true, guideNotes: { "leaning-pine-arboretum": "Start here" },
    interests: ["Explore", "Learn"], demoSocial: true, city: "Los Angeles",
  };
  const migrated = parseStoredState(JSON.stringify(legacy));
  const { version, onboarding, sampleVisitDatesAdded, ...personal } = migrated;
  const { version: oldVersion, ...original } = legacy;
  assert.equal(version, 2);
  assert.deepEqual(personal, original);
  assert.equal(onboarding.step, "complete");
  assert.equal(onboarding.firstSavePromptDismissed, true);
  assert.deepEqual(parseStoredState(JSON.stringify(migrated)), migrated);
});

test("existing undated Been entries get sample dates once while entered dates survive", () => {
  const { sampleVisitDatesAdded, ...oldState } = createFreshState();
  const restored = parseStoredState(JSON.stringify({
    ...oldState,
    preferences: [
      { id: "sloma", band: "liked", rank: 1 },
      { id: "leaning-pine-arboretum", band: "liked", rank: 2, visitedOn: "2026-01-15" },
    ],
  }));
  const date = restored.preferences[0].visitedOn!;
  assert.ok(parseVisitDate(date));
  const earliest = new Date();
  earliest.setDate(earliest.getDate() - 180);
  assert.ok(date >= localDateKey(earliest) && date < localDateKey());
  assert.equal(restored.preferences[1].visitedOn, "2026-01-15");
  assert.deepEqual(parseStoredState(JSON.stringify(restored)), restored);
  restored.preferences[0].visitedOn = undefined;
  assert.equal(parseStoredState(JSON.stringify(restored)).preferences[0].visitedOn, undefined);
});

test("saved Hangout interests and onboarding drafts migrate to Community", () => {
  const state = createFreshState();
  state.interests = ["Hangout", "Community", "Explore"];
  state.onboarding.draftInterests = ["Hangout", "Relax"];
  const restored = parseStoredState(JSON.stringify(state));
  assert.deepEqual(restored.interests, ["Community", "Explore"]);
  assert.deepEqual(restored.onboarding.draftInterests, ["Community", "Relax"]);
  assert.deepEqual(parseStoredState(JSON.stringify(restored)), restored);
});

test("an empty legacy history is an existing user, including an intentionally empty guide", () => {
  const migrated = parseStoredState(JSON.stringify({
    version: 1, saved: [], preferences: [], guide: [], guideCreated: true,
    interests: [], demoSocial: false,
  }));
  assert.equal(migrated.onboarding.step, "complete");
  assert.equal(migrated.onboarding.firstSavePromptDismissed, true);
  assert.equal(migrated.guideCreated, true);
  assert.equal(migrated.demoSocial, false);
  assert.deepEqual(migrated.interests, []);
});

test("an interrupted setup restores draft choices without applying them early", () => {
  let state = toggleDraftInterest(createFreshState(), "Creative");
  state = toggleDraftInterest(state, "Explore");
  state = parseStoredState(JSON.stringify(state));
  assert.equal(state.onboarding.step, "interests");
  assert.deepEqual(state.interests, []);
  assert.deepEqual(state.onboarding.draftInterests, ["Creative", "Explore"]);
  state = toggleDraftInterest(state, "Creative");
  state = completeOnboarding(state);
  assert.deepEqual(state.interests, ["Explore"]);
  assert.equal(state.onboarding.step, "complete");
  assert.deepEqual(state.onboarding.draftInterests, []);
  assert.equal(parseStoredState(JSON.stringify(state)).onboarding.step, "complete");
  assert.equal(completeOnboarding(state, true), state, "a duplicate completion cannot reset choices");
});

test("skip and continue with no selection both leave interests unrestricted", () => {
  const skipped = completeOnboarding(toggleDraftInterest(createFreshState(), "Relax"), true);
  const empty = completeOnboarding(createFreshState());
  for (const state of [skipped, empty]) {
    assert.equal(state.onboarding.step, "complete");
    assert.deepEqual(state.interests, []);
    assert.deepEqual(state.saved, []);
    assert.deepEqual(state.preferences, []);
  }
});

test("saving ends the prompt permanently without marking a visit or altering taste", () => {
  const initial = completeOnboarding(toggleDraftInterest(createFreshState(), "Relax"));
  const saved = toggleSavedExperience(initial, "sloma");
  assert.deepEqual(saved.saved, ["sloma"]);
  assert.deepEqual(saved.interests, ["Relax"]);
  assert.deepEqual(saved.preferences, []);
  assert.deepEqual(saved.awareness, {});
  assert.equal(saved.onboarding.firstSavePromptDismissed, true);
  const removed = toggleSavedExperience(saved, "sloma");
  assert.deepEqual(removed.saved, []);
  assert.equal(parseStoredState(JSON.stringify(removed)).onboarding.firstSavePromptDismissed, true);
  const dismissed = parseStoredState(JSON.stringify(dismissFirstSavePrompt(initial)));
  assert.equal(dismissed.onboarding.firstSavePromptDismissed, true);
  assert.deepEqual(dismissed.saved, []);
});

test("invalid or future stores fail closed instead of resetting recoverable history", () => {
  for (const raw of ["", "not json", "null", "[]", "{}",
    JSON.stringify({ version: 3, saved: [], preferences: [] }),
    JSON.stringify({ version: 2, saved: [], preferences: [] }),
    JSON.stringify({ ...createFreshState(), onboarding: { version: 2, step: "complete" } }),
  ]) assert.throws(() => parseStoredState(raw));
});

test("stored interests and catalog references are validated while valid visit details survive", () => {
  const state = createFreshState();
  const restored = parseStoredState(JSON.stringify({
    ...state, saved: ["sloma", "missing", null, "sloma"],
    interests: ["Relax", "invalid", "Relax"],
    preferences: [null, { id: "missing", band: "liked", rank: 1 },
      { id: "sloma", band: "liked", rank: null, visitedOn: "2026-02-31" }],
    onboarding: { ...state.onboarding, draftInterests: ["Learn", null, "unknown", "Learn"] },
  }));
  assert.deepEqual(restored.saved, ["sloma"]);
  assert.deepEqual(restored.interests, ["Relax"]);
  assert.deepEqual(restored.onboarding.draftInterests, ["Learn"]);
  assert.equal(restored.preferences.length, 1);
  assert.equal(restored.preferences[0].visitedOn, undefined);
  assert.equal(restored.onboarding.firstSavePromptDismissed, true);
});

test("serialized writes keep the most recent draft even when an earlier write is slow", async () => {
  const events: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let persisted = "";
  const write = createStateWriter(async (key, snapshot) => {
    assert.equal(key, STORAGE_KEY);
    const state = parseStoredState(snapshot);
    events.push(state.onboarding.step);
    if (events.length === 1) await gate;
    persisted = snapshot;
  });
  const initial = createFreshState();
  const completed = completeOnboarding(toggleDraftInterest(initial, "Creative"));
  const pending = write(initial);
  const latest = write(completed);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["interests"]);
  release();
  await Promise.all([pending, latest]);
  assert.deepEqual(events, ["interests", "complete"]);
  assert.deepEqual(parseStoredState(persisted), completed);
});

test("a failed write reports failure and a retry can persist the latest complete state", async () => {
  let fail = true;
  let persisted: string | null = null;
  const write = createStateWriter(async (_key, snapshot) => {
    if (fail) throw new Error("Storage unavailable");
    persisted = snapshot;
  });
  await assert.rejects(write(createFreshState()), /Storage unavailable/);
  assert.equal(persisted, null);
  fail = false;
  const completed = completeOnboarding(toggleDraftInterest(createFreshState(), "Learn"));
  await write(completed);
  assert.deepEqual(parseStoredState(persisted), completed);
});
