import test from "node:test";
import assert from "node:assert/strict";
import { catalog, type Experience } from "../data/catalog";
import { buildCityGuides, cityGuideText, cityKey } from "./guides";
import { scorePreferences, type Preference } from "./ranking";

const places: Experience[] = [
  { ...catalog[0], id: "a", city: "San Luis Obispo" },
  { ...catalog[0], id: "b", city: "San Luis Obispo" },
  { ...catalog[0], id: "c", city: "San Francisco" },
  { ...catalog[0], id: "d", city: "San Luis Obispo" },
  { ...catalog[0], id: "saved-only", city: "Los Angeles" },
];
const preferences: Preference[] = [
  { id: "a", band: "liked", rank: 3, note: "Private visit note" },
  { id: "c", band: "liked", rank: 2 },
  { id: "b", band: "liked", rank: 1 },
  { id: "d", band: "okay", rank: null },
];

test("city guides come only from visits, keep personal order, and retain global scores", () => {
  const guides = buildCityGuides(preferences, places);
  assert.deepEqual(guides.map(g => g.city), ["San Luis Obispo", "San Francisco"]);
  assert.deepEqual(guides[0].entries.map(e => e.experience.id), ["b", "a", "d"]);
  assert.deepEqual(guides[0].entries.map(e => e.position), [1, 2, null]);
  assert.equal(guides[0].entries[1].score, scorePreferences(preferences).a);
  assert.equal(guides[0].entries[2].score, null);
});

test("a new visit or changed ranking updates its city guide without a separate save", () => {
  const next: Preference[] = [
    { id: "a", band: "liked", rank: 1 },
    { id: "b", band: "liked", rank: 2 },
    { id: "c", band: "liked", rank: 3 },
    { id: "d", band: "okay", rank: null },
    { id: "saved-only", band: "liked", rank: 4 },
  ];
  const guides = buildCityGuides(next, places);
  assert.equal(guides[0].entries[0].experience.id, "a");
  assert.ok(guides.some(g => g.city === "Los Angeles"));
  assert.equal(buildCityGuides(preferences.filter(p => p.id !== "c"), places).length, 1);
});

test("ties stay tied, unknown places are omitted, and shares omit private notes", () => {
  const guides = buildCityGuides([
    { id: "a", band: "liked", rank: 1, note: "Private visit note" },
    { id: "b", band: "liked", rank: 1 },
    { id: "missing", band: "liked", rank: 3 },
  ], places);
  assert.deepEqual(guides[0].entries.map(e => e.position), [1, 1]);
  assert.equal(guides[0].entries.length, 2);
  const text = cityGuideText(guides[0], "My guide");
  assert.match(text, /San Luis Obispo/);
  assert.ok(!text.includes("Private visit note"));
  assert.ok(text.includes(places[0].sourceUrl));
  assert.deepEqual(buildCityGuides([], places), []);
});

test("the catalog's nearby-SLO label shares a city guide without changing venue geography", () => {
  const nearby = { ...catalog[0], id: "nearby", city: "Near San Luis Obispo" };
  const guides = buildCityGuides([
    { id: "nearby", band: "liked", rank: 1 },
    { id: "a", band: "liked", rank: 2 },
  ], [...places, nearby]);
  assert.equal(guides.length, 1);
  assert.equal(guides[0].city, "San Luis Obispo");
  assert.equal(guides[0].key, cityKey(nearby.city));
  assert.equal(guides[0].entries[0].experience.city, "Near San Luis Obispo");
  assert.equal(guides[0].entries.length, 2);
});
