import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_RANKING_QUESTIONS,
  answerRanking,
  beginRanking,
  currentOpponent,
  finishRanking,
  scorePreferences,
  type Preference,
} from "./ranking";

const liked = (...ids: string[]): Preference[] =>
  ids.map((id, index) => ({ id, band: "liked", rank: index + 1 }));

test("inserts at every position with comparison answers consistent with the desired order", () => {
  const preferences = liked("a", "b", "c", "d", "e", "f");
  for (
    let desiredIndex = 0;
    desiredIndex <= preferences.length;
    desiredIndex += 1
  ) {
    let session = beginRanking("new", "liked", preferences);
    while (session.status === "active") {
      const opponent = currentOpponent(session);
      const opponentIndex = preferences.findIndex(({ id }) => id === opponent);
      session = answerRanking(
        session,
        desiredIndex <= opponentIndex ? "new" : "existing",
      );
    }
    assert.equal(session.status, "placed");
    const expected = preferences.map(({ id }) => id);
    expected.splice(desiredIndex, 0, "new");
    const actual = finishRanking(session, preferences).sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    );
    assert.deepEqual(
      actual.map(({ id }) => id),
      expected,
    );
    assert.deepEqual(
      actual.map(({ rank }) => rank),
      expected.map((_, index) => index + 1),
    );
  }
});

test("first experience is placed without comparisons; pending entries are not opponents", () => {
  const preferences: Preference[] = [
    { id: "pending", band: "liked", rank: null },
  ];
  const session = beginRanking("first", "liked", preferences);
  assert.equal(session.status, "placed");
  assert.equal(session.compared, 0);
  assert.equal(currentOpponent(session), null);
  assert.deepEqual(finishRanking(session, preferences), [
    ...preferences,
    { id: "first", band: "liked", rank: 1 },
  ]);
});

test("ties join a group and shift following occupied ranks", () => {
  const preferences = liked("a", "b", "c");
  const original = beginRanking("x", "liked", preferences);
  assert.equal(currentOpponent(original), "b");
  const session = answerRanking(original, "tie");
  const result = finishRanking(session, preferences);
  assert.deepEqual(
    Object.fromEntries(result.map(({ id, rank }) => [id, rank])),
    { a: 1, b: 2, c: 4, x: 2 },
  );
  assert.deepEqual(beginRanking("y", "liked", result).groups, [
    ["a"],
    ["b", "x"],
    ["c"],
  ]);
  assert.equal(original.status, "active");
  assert.deepEqual(original.groups, [["a"], ["b"], ["c"]]);
  assert.deepEqual(preferences, liked("a", "b", "c"));
});

test("a skip does not imply preference, asks a different useful opponent, and can still resolve", () => {
  const original = beginRanking("x", "liked", liked("a", "b", "c"));
  assert.equal(currentOpponent(original), "b");
  const skipped = answerRanking(original, "skip");
  assert.equal(skipped.lo, original.lo);
  assert.equal(skipped.hi, original.hi);
  assert.deepEqual(skipped.skipped, [1]);
  assert.equal(currentOpponent(skipped), "a");
  const placed = answerRanking(skipped, "new");
  assert.equal(placed.status, "placed");
  assert.deepEqual(placed.placement, { kind: "insert", index: 0 });
  assert.equal(placed.compared, 2);
});

test("skipped unresolved ordering leaves a pending score instead of inventing a rank", () => {
  const preferences = liked("a", "b", "c");
  let session = beginRanking("x", "liked", preferences);
  session = answerRanking(session, "skip"); // No relation to b.
  session = answerRanking(session, "existing"); // a > x.
  assert.equal(currentOpponent(session), "c");
  session = answerRanking(session, "new"); // x > c, but relation to b is unknown.
  assert.equal(session.status, "pending");
  assert.equal(session.pendingReason, "skipped-opponents");
  assert.equal(currentOpponent(session), null);
  const result = finishRanking(session, preferences);
  assert.equal(result.find(({ id }) => id === "x")?.rank, null);
  assert.equal(scorePreferences(result).x, null);
  assert.deepEqual(result.slice(0, 3), preferences);
});

test("skipping the sole opponent and finishing an active session both save pending", () => {
  const preferences = liked("a");
  const active = beginRanking("x", "liked", preferences);
  assert.equal(
    finishRanking(active, preferences).find(({ id }) => id === "x")?.rank,
    null,
  );
  const pending = answerRanking(active, "skip");
  assert.equal(pending.status, "pending");
  assert.equal(pending.lo, 0);
  assert.equal(pending.hi, 1);
  assert.equal(
    finishRanking(pending, preferences).find(({ id }) => id === "x")?.rank,
    null,
  );
});

test("reranking excludes self, preserves personal metadata, and keeps one vote per experience", () => {
  const preferences: Preference[] = [
    { id: "a", band: "liked", rank: 1, note: "Loved the view", again: true },
    { id: "b", band: "liked", rank: 2 },
    { id: "other", band: "okay", rank: 8, note: "Untouched", again: false },
  ];
  let session = beginRanking("a", "liked", preferences);
  assert.deepEqual(session.groups, [["b"]]);
  assert.equal(currentOpponent(session), "b");
  session = answerRanking(session, "existing");
  const result = finishRanking(session, preferences);
  assert.equal(result.filter(({ id }) => id === "a").length, 1);
  assert.deepEqual(
    result.find(({ id }) => id === "a"),
    { ...preferences[0], rank: 2 },
  );
  assert.deepEqual(
    result.find(({ id }) => id === "other"),
    preferences[2],
  );
  assert.deepEqual(scorePreferences(result), { a: 7.8, b: 8.9, other: 5 });
  assert.deepEqual(finishRanking(session, result), result);
});

test("changing bands moves the same experience and preserves other band records", () => {
  const preferences: Preference[] = [
    ...liked("a", "b"),
    { id: "okay", band: "okay", rank: 1 },
    { id: "disliked", band: "disliked", rank: 1 },
  ];
  const session = answerRanking(beginRanking("a", "okay", preferences), "tie");
  const result = finishRanking(session, preferences);
  assert.equal(result.length, preferences.length);
  assert.deepEqual(
    result.find(({ id }) => id === "a"),
    { id: "a", band: "okay", rank: 1 },
  );
  assert.deepEqual(
    result.find(({ id }) => id === "b"),
    preferences[1],
  );
  assert.deepEqual(
    result.find(({ id }) => id === "disliked"),
    preferences[3],
  );
});

test("duplicate persisted IDs cannot create extra opponents or votes", () => {
  const preferences = [
    ...liked("a", "b"),
    { id: "a", band: "liked", rank: 1 } as Preference,
  ];
  const session = beginRanking("x", "liked", preferences);
  assert.deepEqual(session.groups, [["a"], ["b"]]);
  assert.deepEqual(
    scorePreferences(preferences),
    scorePreferences(liked("a", "b")),
  );
  const result = finishRanking(answerRanking(session, "tie"), preferences);
  assert.equal(result.filter(({ id }) => id === "a").length, 1);
});

test("band midpoints use decimal half-up rounding, including liked singleton 8.4", () => {
  const preferences: Preference[] = [
    { id: "liked", band: "liked", rank: 1 },
    { id: "okay", band: "okay", rank: 1 },
    { id: "disliked", band: "disliked", rank: 1 },
  ];
  assert.deepEqual(scorePreferences(preferences), {
    liked: 8.4,
    okay: 5,
    disliked: 1.7,
  });
});

test("scoring counts experiences, averages occupied tie ranks, and ignores pending entries", () => {
  const preferences: Preference[] = [
    { id: "a", band: "liked", rank: 1 },
    { id: "b", band: "liked", rank: 1 },
    { id: "c", band: "liked", rank: 3 },
    { id: "pending", band: "liked", rank: null },
  ];
  // N=3; the first tie occupies ranks 1 and 2, so r=1.5 and q=0.625.
  assert.deepEqual(scorePreferences(preferences), {
    a: 8.8,
    b: 8.8,
    c: 7.5,
    pending: null,
  });
  assert.deepEqual(
    scorePreferences([...preferences].reverse()),
    scorePreferences(preferences),
  );
  assert.equal(
    scorePreferences(preferences.filter(({ id }) => id !== "pending")).a,
    8.8,
  );
});

test("rank gaps are normalized and all-tied groups receive their band midpoint", () => {
  const preferences: Preference[] = [
    { id: "a", band: "liked", rank: 20 },
    { id: "b", band: "liked", rank: 20 },
    { id: "c", band: "liked", rank: 20 },
  ];
  assert.deepEqual(scorePreferences(preferences), { a: 8.4, b: 8.4, c: 8.4 });
  assert.deepEqual(scorePreferences([{ ...preferences[0], rank: 50 }]), {
    a: 8.4,
  });
});

test("scores stay in their band, remain ordered, and do not depend on other bands", () => {
  const bounds = {
    liked: [6.7, 10],
    okay: [3.4, 6.6],
    disliked: [0, 3.3],
  } as const;
  for (const band of ["liked", "okay", "disliked"] as const) {
    const preferences: Preference[] = Array.from(
      { length: 40 },
      (_, index) => ({ id: `${band}-${index}`, band, rank: index + 1 }),
    );
    const scores = scorePreferences(preferences);
    const values = preferences.map(({ id }) => scores[id] as number);
    assert.ok(
      values.every(
        (value) => value >= bounds[band][0] && value <= bounds[band][1],
      ),
    );
    assert.ok(
      values.every((value, index) => index === 0 || value <= values[index - 1]),
    );
    const unrelated: Preference = {
      id: "other",
      band: band === "liked" ? "okay" : "liked",
      rank: 1,
    };
    const expanded = scorePreferences([...preferences, unrelated]);
    assert.deepEqual(
      preferences.map(({ id }) => expanded[id]),
      values,
    );
  }
});

test("display filters only select from global scores and never rescore visible subsets", () => {
  const preferences = liked("museum", "night-market", "concert", "trail");
  const scores = scorePreferences(preferences);
  const displayed = ["museum", "concert"];
  const visibleScores = Object.fromEntries(
    displayed.map((id) => [id, scores[id]]),
  );
  assert.deepEqual(visibleScores, { museum: 9.3, concert: 8 });
  assert.equal(visibleScores.museum, scores.museum);
  assert.equal(visibleScores.concert, scores.concert);
});

test("five-question cap leaves unresolved insertion pending and refuses further answers", () => {
  const preferences = liked(
    ...Array.from({ length: 64 }, (_, index) => `item-${index}`),
  );
  let session = beginRanking("x", "liked", preferences);
  for (let index = 0; index < MAX_RANKING_QUESTIONS; index += 1) {
    assert.equal(session.status, "active");
    assert.notEqual(currentOpponent(session), null);
    session = answerRanking(session, "new");
  }
  assert.equal(session.compared, 5);
  assert.equal(session.status, "pending");
  assert.equal(session.pendingReason, "question-limit");
  assert.equal(currentOpponent(session), null);
  assert.equal(answerRanking(session, "tie"), session);
  assert.equal(
    finishRanking(session, preferences).find(({ id }) => id === "x")?.rank,
    null,
  );
});

test("a decisive answer on the fifth question resolves, and skips also consume the cap", () => {
  const preferences = liked(
    ...Array.from({ length: 31 }, (_, index) => `item-${index}`),
  );
  let placed = beginRanking("x", "liked", preferences);
  for (let index = 0; index < 5; index += 1)
    placed = answerRanking(placed, "new");
  assert.equal(placed.compared, 5);
  assert.equal(placed.status, "placed");
  assert.equal(
    finishRanking(placed, preferences).find(({ id }) => id === "x")?.rank,
    1,
  );

  let skipped = beginRanking("x", "liked", preferences);
  const seen = new Set<string>();
  for (let index = 0; index < 5; index += 1) {
    const opponent = currentOpponent(skipped) as string;
    assert.ok(!seen.has(opponent));
    seen.add(opponent);
    skipped = answerRanking(skipped, "skip");
  }
  assert.equal(skipped.status, "pending");
  assert.equal(skipped.compared, 5);
  assert.equal(skipped.lo, 0);
  assert.equal(skipped.hi, 31);
});

test("invalid placed ranks are treated as pending", () => {
  const preferences: Preference[] = [
    { id: "nan", band: "liked", rank: Number.NaN },
    { id: "zero", band: "liked", rank: 0 },
    { id: "infinite", band: "liked", rank: Number.POSITIVE_INFINITY },
  ];
  assert.deepEqual(scorePreferences(preferences), {
    nan: null,
    zero: null,
    infinite: null,
  });
  assert.deepEqual(beginRanking("x", "liked", preferences).groups, []);
});
