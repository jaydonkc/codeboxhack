import test from "node:test";
import assert from "node:assert/strict";
import { byId, catalog } from "../data/catalog";
import { comparePreferences, rankPositions, scorePreferences, type Preference } from "./ranking";
import { matchesIntent, matchesNiche, orderExperiences, recommendationScore, type DiscoveryContext } from "./discovery";

const context: DiscoveryContext = { catalog, preferences: [], interests: [], audience: "Friends" };
const niche = () => 5;

test("niche range is inclusive; unknown only passes unrestricted discovery", () => {
  assert.equal(matchesNiche(4, [4, 7]), true);
  assert.equal(matchesNiche(7, [4, 7]), true);
  assert.equal(matchesNiche(3.9, [4, 7]), false);
  assert.equal(matchesNiche(null, [4, 7]), false);
  assert.equal(matchesNiche(null, [0, 10]), true);
});

test("audience changes enjoyment ordering; missing reviews sort last", () => {
  const a = byId("sloma"), b = byId("bishop-peak"), c = byId("history-center");
  const social = { [a.id]: { friends: 9, everyone: 6, count: 2 }, [b.id]: { friends: 7, everyone: 8, count: 4 } };
  assert.deepEqual(orderExperiences([c, b, a], "enjoyment", { ...context, social }, niche).map(e => e.id), [a.id, b.id, c.id]);
  assert.deepEqual(orderExperiences([a, c, b], "enjoyment", { ...context, social, audience: "Everyone" }, niche).map(e => e.id), [b.id, a.id, c.id]);
});

test("price sorts free first and unknown last; device origin determines nearest", () => {
  const items = [byId("anam-cre-pottery"), byId("slo-botanical-garden"), byId("sloma")];
  assert.deepEqual(orderExperiences(items, "price", context, niche).map(e => e.priceUSD), [0, 10, null]);
  const garden = items[1];
  assert.equal(orderExperiences(items, "distance", { ...context, origin: {lat: garden.lat!, lng: garden.lng!} }, niche)[0].id, garden.id);
});

test("personal rankings keep distinct positions even when their scores round equally", () => {
  const preferences: Preference[] = Array.from({length: 100}, (_, i) => ({id: String(i), band: "liked", rank: i + 1}));
  const scores = scorePreferences(preferences);
  const pair = preferences.findIndex((p, i) => i > 0 && scores[p.id] === scores[preferences[i-1].id]);
  assert.ok(pair > 0);
  assert.ok(comparePreferences(preferences[pair-1], preferences[pair]) < 0);
  assert.equal([preferences[pair], preferences[pair-1]].sort(comparePreferences)[0].id, preferences[pair-1].id);
  const positions = rankPositions(preferences);
  assert.notEqual(positions[preferences[pair - 1].id], positions[preferences[pair].id]);
});

test("Been position labels preserve ties, skip occupied ranks, and leave pending visits blank", () => {
  const preferences: Preference[] = [
    { id: "later", band: "okay", rank: 1 },
    { id: "first", band: "liked", rank: 1 },
    { id: "tied", band: "liked", rank: 1 },
    { id: "pending", band: "liked", rank: null },
    { id: "invalid", band: "liked", rank: 0 },
  ];
  assert.deepEqual(rankPositions(preferences), { later: 3, first: 1, tied: 1, pending: null, invalid: null });
});

test("familiar excludes a disliked repeat even when its vibe matches; new excludes all logged items", () => {
  const item = byId("sloma");
  const c: DiscoveryContext = { ...context, interests: item.vibes, preferences: [{id: item.id, band: "disliked", rank: 1}] };
  assert.equal(matchesIntent(item, "familiar", c), false);
  assert.equal(matchesIntent(item, "new", c), false);
  assert.equal(matchesIntent(item, "all", c), true);
  assert.equal(matchesIntent(item, "familiar", {...c, preferences: [{...c.preferences[0], again: true}]}), true);
});

test("social evidence influences recommendations and disappears when disabled", () => {
  const item = byId("sloma");
  assert.equal(recommendationScore(item, context), 0);
  assert.ok(recommendationScore(item, {...context, social: {[item.id]: {friends: 9, everyone: 8, count: 4}}}) > 0);
  assert.equal(recommendationScore(item, {...context, social: undefined}), 0);
});

test("For You varies activity types without reintroducing filtered candidates or using niche", () => {
  const items = [byId("bishop-peak"), byId("cerro-san-luis"), byId("sloma")];
  const sorted = orderExperiences(items, "for-you", context, () => { throw Error("For You must not consult niche"); });
  assert.equal(sorted[1].id, "sloma");
  assert.deepEqual(new Set(sorted.map(e => e.id)), new Set(items.map(e => e.id)));
});

test("nicheness supports both directions while unknown scores stay last", () => {
  const items = [byId("sloma"), byId("bishop-peak"), byId("history-center")];
  const values: Record<string, number | null> = {sloma: 3, "bishop-peak": 7, "history-center": null};
  const score = (id: string) => values[id];
  assert.deepEqual(orderExperiences(items, "niche", context, score, false, "asc").map(e => e.id), ["sloma", "bishop-peak", "history-center"]);
  assert.deepEqual(orderExperiences(items, "niche", context, score, false, "desc").map(e => e.id), ["bishop-peak", "sloma", "history-center"]);
});
