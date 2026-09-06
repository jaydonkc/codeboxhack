import test from "node:test";
import assert from "node:assert/strict";
import { rankVisitors } from "./leaderboard";
import { catalog } from "../data/catalog";
import { friends } from "../data/friends";
import { friendCityGuides } from "../data/friendGuides";

const guide = (key: string, ids: number[]) => ({ key, city: key,
  entries: ids.map(id => ({ experience: catalog[id], position: id + 1, score: 8 })) });

test("leaderboards count unique visited places, with shared ranks for ties", () => {
  const rows = rankVisitors([
    { id: "a", name: "Alex", guides: [guide("slo", [0, 1, 1])] },
    { id: "b", name: "Blake", guides: [guide("slo", [0]), guide("sf", [2])] },
    { id: "c", name: "Casey", guides: [guide("sf", [3])] },
  ]);
  assert.deepEqual(rows.map(row => [row.id, row.count, row.rank]), [["a", 2, 1], ["b", 2, 1], ["c", 1, 3]]);
  assert.deepEqual(rankVisitors(rows, "slo").map(row => [row.id, row.count, row.rank]), [["a", 2, 1], ["b", 1, 2]]);
});

test("example profiles and city guides agree on each member's visited count", () => {
  for (const friend of friends) {
    const [row] = rankVisitors([{ ...friend, guides: friendCityGuides(friend.id) }]);
    assert.equal(row.count, friend.rankedCount, friend.name);
  }
});
