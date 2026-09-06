import test from "node:test";
import assert from "node:assert/strict";
import { byId, matches, type Filters } from "../data/catalog";
import { createCustomActivity } from "./customActivities";
const filters: Filters = { budget: null, radius: null, duration: null, vibes: [], query: "" };
test("nicheness threshold includes its boundary and composes with other filters", () => {
  const activity = byId("leaning-pine-arboretum");
  assert.equal(matches(activity, { ...filters, minNicheness: 7.8 }), true);
  assert.equal(matches(activity, { ...filters, minNicheness: 8 }), false);
  assert.equal(matches(activity, { ...filters, minNicheness: 7, query: "pottery" }), false);
});
test("Any nicheness keeps custom activities while an active threshold excludes unscored activities", () => {
  const activity = createCustomActivity({ name: "Games", venue: "Library", city: "SLO", vibes: ["Community"] }, "custom-filter-test");
  assert.equal(matches(activity, filters), true);
  assert.equal(matches(activity, { ...filters, minNicheness: 0 }), true);
  assert.equal(matches(activity, { ...filters, minNicheness: 0.5 }), false);
});
