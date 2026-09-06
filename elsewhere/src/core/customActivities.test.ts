import test from "node:test";
import assert from "node:assert/strict";
import { createCustomActivity } from "./customActivities";
import { createFreshState, parseStoredState, toggleSavedExperience, type Stored } from "./storage";
import { beginRanking } from "./ranking";
import { saveRankedVisit } from "./personal";
import { byId, setCustomActivities } from "../data/catalog";

const draft = { name: " Board game night ", venue: " Community center ", city: " San Luis Obispo ", vibes: ["Community"] };

test("a new activity can be saved, ranked, and restored with its guide references", () => {
  const activity = createCustomActivity(draft, "custom-test");
  let state: Stored = { ...createFreshState(), customActivities: [activity] };
  state = toggleSavedExperience(state, activity.id);
  assert.deepEqual(state.saved, [activity.id]);
  state = saveRankedVisit(state, beginRanking(activity.id, "liked", []), { visitedOn: "2026-09-06" });
  state.guide = [activity.id];
  const restored = parseStoredState(JSON.stringify(state));
  assert.equal(restored.preferences[0].id, activity.id);
  assert.equal(restored.preferences[0].visitedOn, "2026-09-06");
  assert.deepEqual(restored.guide, [activity.id]);
  assert.deepEqual(restored.customActivities, [activity]);
  setCustomActivities(restored.customActivities ?? []);
  try {
    assert.equal(byId(activity.id).name, "Board game night");
    assert.equal(byId(activity.id).lat, null);
  } finally { setCustomActivities([]); }
});

test("invalid custom activity data fails without discarding saved history", () => {
  assert.throws(() => createCustomActivity({ ...draft, name: " " }, "custom-test"));
  const state = { ...createFreshState(), customActivities: [{ name: "Incomplete" }] };
  assert.throws(() => parseStoredState(JSON.stringify(state)), /Unrecognized custom activity/);
  assert.throws(() => createCustomActivity(draft, "sloma"), /Invalid activity ID/);
});
