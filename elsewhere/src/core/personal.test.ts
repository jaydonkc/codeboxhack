import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalGuide, isFavorite, saveRankedVisit, updateVisitDetails } from "./personal";
import { answerRanking, beginRanking, Preference, scorePreferences } from "./ranking";

const preferences: Preference[] = [
  { id: "sloma", band: "liked", rank: 2, note: "Private visit note", again: false, visitedOn: "2026-08-12" },
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

test("completed rerankings replace the saved score immediately and survive reload", () => {
  const original = { preferences, saved: ["sloma", "unvisited"], guide: ["sloma"] };
  const details = { note: "Updated visit", again: true };
  const promoted = answerRanking(beginRanking("sloma", "liked", preferences), "new");
  const saved = saveRankedVisit(original, promoted, details);
  assert.equal(scorePreferences(original.preferences).sloma, 7.8);
  assert.equal(scorePreferences(saved.preferences).sloma, 8.9);
  assert.deepEqual(saved.saved, ["unvisited"]);
  assert.deepEqual(saved.guide, ["sloma"]);
  assert.equal(saved.preferences.find((p) => p.id === "sloma")?.note, details.note);
  assert.equal(saved.preferences.find((p) => p.id === "sloma")?.visitedOn, "2026-08-12");
  assert.deepEqual(scorePreferences(JSON.parse(JSON.stringify(saved)).preferences),
    scorePreferences(saved.preferences));

  // Closing the result or tapping Done can save again without changing its score.
  const closed = saveRankedVisit(saved, promoted, details);
  assert.deepEqual(closed, saved);
  assert.equal(closed.preferences.filter((p) => p.id === "sloma").length, 1);

  const demoted = answerRanking(beginRanking("sloma", "liked", saved.preferences), "existing");
  const reranked = saveRankedVisit(saved, demoted, details);
  assert.equal(scorePreferences(reranked.preferences).sloma, 7.8);
  assert.equal(scorePreferences(reranked.preferences)["leaning-pine-arboretum"], 8.9);
});

test("visit dates can be saved, edited, and cleared without changing scores or other visits", () => {
  const updated = updateVisitDetails(preferences, "sloma", { visitedOn: "2026-09-05" });
  assert.equal(updated.find((p) => p.id === "sloma")?.visitedOn, "2026-09-05");
  assert.deepEqual(scorePreferences(updated), scorePreferences(preferences));
  assert.deepEqual(updated.filter((p) => p.id !== "sloma"), preferences.filter((p) => p.id !== "sloma"));
  assert.equal(JSON.parse(JSON.stringify(updated))[0].visitedOn, "2026-09-05");
  const cleared = updateVisitDetails(updated, "sloma", { visitedOn: undefined });
  assert.equal(cleared[0].visitedOn, undefined);
  assert.equal(preferences[0].visitedOn, "2026-08-12");
  const data = { preferences: [] as Preference[], saved: ["new-visit"] };
  const logged = saveRankedVisit(data, beginRanking("new-visit", "liked", []), { visitedOn: "2026-09-04" });
  assert.equal(logged.preferences[0].visitedOn, "2026-09-04");
  // Existing undated visits keep their unknown date when reranked.
  const legacy = saveRankedVisit(data, beginRanking("old-visit", "liked", []), {});
  assert.equal(legacy.preferences[0].visitedOn, undefined);
});

test("first ratings and reaction changes save the score shown on completion", () => {
  const data = { preferences: [] as Preference[], saved: ["museum"] };
  const first = saveRankedVisit(data, beginRanking("museum", "liked", []), {});
  assert.equal(scorePreferences(first.preferences).museum, 8.4);
  const changed = saveRankedVisit(first, beginRanking("museum", "okay", first.preferences), {});
  assert.equal(scorePreferences(changed.preferences).museum, 5);
  assert.equal(changed.preferences.length, 1);
});

test("ties persist as the same personal score for both experiences", () => {
  const data = { preferences, saved: [] as string[] };
  const tied = answerRanking(beginRanking("sloma", "liked", preferences), "tie");
  const saved = saveRankedVisit(data, tied, {});
  const scores = scorePreferences(saved.preferences);
  assert.equal(scores.sloma, 8.4);
  assert.equal(scores["leaning-pine-arboretum"], scores.sloma);
});

test("closing an unfinished rerank preserves the prior score unless a pending reaction is explicitly saved", () => {
  const data = { preferences, saved: ["sloma"] };
  const active = beginRanking("sloma", "liked", preferences);
  assert.equal(saveRankedVisit(data, active, {}), data);
  const pending = answerRanking(active, "skip");
  assert.equal(pending.status, "pending");
  assert.equal(saveRankedVisit(data, pending, {}), data);
  const saved = saveRankedVisit(data, pending, {}, { savePending: true });
  assert.equal(scorePreferences(saved.preferences).sloma, null);
  assert.equal(saved.preferences.find((p) => p.id === "sloma")?.note, "Private visit note");
});
