import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalGuide, isFavorite, updateVisitDetails } from "./personal";
import { Preference, scorePreferences } from "./ranking";

const preferences: Preference[] = [
  { id: "sloma", band: "liked", rank: 2, note: "Private visit note", again: false },
  { id: "leaning-pine-arboretum", band: "liked", rank: 1 },
  { id: "anam-cre-pottery", band: "disliked", rank: 1 },
  { id: "downtown-creek-walk", band: "okay", rank: 1 },
  { id: "bishop-peak", band: "liked", rank: null },
];

test("a first guide includes only fully ranked favorites and preserves private data", () => {
  const data = {
    preferences,
    guide: [],
    guideCreated: false,
    guideNotes: { sloma: "Public guide note" },
    saved: ["anam-cre-pottery"],
  };
  const result = createPersonalGuide(data);
  assert.deepEqual(result.guide, ["leaning-pine-arboretum", "sloma"]);
  assert.equal(result.guideCreated, true);
  assert.deepEqual(result.preferences, preferences);
  assert.deepEqual(result.guideNotes, data.guideNotes);
  assert.deepEqual(result.saved, data.saved);
  assert.deepEqual(data.guide, []);
});

test("opening a guide preserves curation, including a deliberately emptied persisted guide", () => {
  const data = { preferences, guide: ["sloma"], guideCreated: true };
  assert.deepEqual(createPersonalGuide(data).guide, ["sloma"]);
  const emptied = JSON.parse(JSON.stringify({ ...data, guide: [] }));
  assert.deepEqual(createPersonalGuide(emptied).guide, []);
  // Preserve existing guides from before the initialization flag existed.
  assert.deepEqual(createPersonalGuide({ ...data, guideCreated: false }).guide, ["sloma"]);
});

test("editing visit metadata preserves every rank and score, including ties and pending visits", () => {
  const before: Preference[] = [
    ...preferences,
    { id: "slo-botanical-garden", band: "liked", rank: 2 },
  ];
  const result = updateVisitDetails(before, "sloma", { note: "Updated note", again: true });
  assert.deepEqual(scorePreferences(result), scorePreferences(before));
  assert.deepEqual(result.map(({ id, band, rank }) => ({ id, band, rank })),
    before.map(({ id, band, rank }) => ({ id, band, rank })));
  assert.equal(result.find((p) => p.id === "sloma")?.note, "Updated note");
  assert.equal(before.find((p) => p.id === "sloma")?.note, "Private visit note");
  assert.deepEqual(updateVisitDetails(result, "unknown", { note: "No visit" }), result);
  assert.equal(updateVisitDetails(result, "bishop-peak", { note: "Still pending" })
    .find((p) => p.id === "bishop-peak")?.rank, null);
});

test("favorites include liked reactions only, regardless of interest overlap or pending rank", () => {
  assert.equal(isFavorite("sloma", preferences), true);
  assert.equal(isFavorite("bishop-peak", preferences), true);
  assert.equal(isFavorite("anam-cre-pottery", preferences), false);
  assert.equal(isFavorite("downtown-creek-walk", preferences), false);
  assert.equal(isFavorite("unvisited", preferences), false);
});
