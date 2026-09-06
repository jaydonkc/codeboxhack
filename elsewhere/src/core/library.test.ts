import test from "node:test";
import assert from "node:assert/strict";
import { byId, catalog } from "../data/catalog";
import { buildCityGuides } from "./guides";
import { deleteCustomPlace, hasMapCoordinates, removeVisit, updateVisitDetails } from "./library";
import { rankPositions, scorePreferences, type Preference } from "./ranking";

const place = { ...byId("sloma"), id: "user:review", city: "Test City", lat: null, lng: null };
const makeData = () => ({
  preferences: [
    { id: "sloma", band: "liked", rank: 1, note: "Old note" },
    { id: place.id, band: "liked", rank: 1, again: true },
    { id: "bishop-peak", band: "liked", rank: 3 },
    { id: "cerro-san-luis", band: "okay", rank: null },
  ] as Preference[],
  saved: [place.id, "history-center"], customExperiences: [place],
  awareness: { [place.id]: "yes", sloma: "no" }, placeholderVersion: 1,
});

test("editing metadata preserves every score, tie and pending rank", () => {
  const original = makeData();
  const next = updateVisitDetails(original, "sloma", { note: " New note ", again: true });
  assert.deepEqual(scorePreferences(next.preferences), scorePreferences(original.preferences));
  assert.deepEqual(rankPositions(next.preferences), rankPositions(original.preferences));
  assert.equal(next.preferences[0].note, "New note");
  assert.equal(original.preferences[0].note, "Old note");
  assert.equal(updateVisitDetails(next, "cerro-san-luis", { note: "Pending note" }).preferences[3].rank, null);
  assert.equal(updateVisitDetails(next, "missing", { note: "No visit" }).preferences.length, 4);
});

test("removing a tied visit updates ranks and city guides and can retain a bookmark", () => {
  const original = makeData();
  const next = removeVisit(original, place.id, true);
  assert.equal(next.preferences.some(p => p.id === place.id), false);
  assert.equal(next.saved.filter(id => id === place.id).length, 1);
  assert.deepEqual(rankPositions(next.preferences), { sloma: 1, "bishop-peak": 2, "cerro-san-luis": null });
  assert.equal(buildCityGuides(next.preferences, [...catalog, place]).some(g => g.city === "Test City"), false);
  assert.equal(next.customExperiences.length, 1, "unmarking Been must not delete the custom place");
  assert.equal(JSON.parse(JSON.stringify(next)).placeholderVersion, 1, "removal must retain the no-reseed marker");
  assert.equal(removeVisit(original, place.id, false).saved.includes(place.id), false);
});

test("custom place deletion removes only owned references and keeps unrelated records", () => {
  const original = makeData();
  const next = deleteCustomPlace(original, place.id);
  assert.equal(next.customExperiences.length, 0);
  assert.equal(next.preferences.some(p => p.id === place.id), false);
  assert.deepEqual(next.saved, ["history-center"]);
  assert.deepEqual(next.awareness, { sloma: "no" });
  assert.equal(original.customExperiences.length, 1);
  assert.equal(deleteCustomPlace(original, "sloma"), original);
  assert.equal(deleteCustomPlace(original, "user:unknown"), original);
});

test("map locations require two finite coordinates in range, including valid zeroes", () => {
  assert.equal(hasMapCoordinates({ lat: 0, lng: 0 }), true);
  assert.equal(hasMapCoordinates({ lat: -90, lng: 180 }), true);
  for (const point of [{ lat: null, lng: 12 }, { lat: 12, lng: null }, { lat: NaN, lng: 0 }, { lat: 0, lng: Infinity }, { lat: 91, lng: 0 }, { lat: 0, lng: -181 }]) {
    assert.equal(hasMapCoordinates(point), false);
  }
});
