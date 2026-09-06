import test from "node:test";
import assert from "node:assert/strict";
import { deleteOwnComment, deleteOwnRequest, editOwnComment, editOwnRequest, type SocialState } from "./social";

const state = (): SocialState => ({
  placeholderVersion: 1, followed: ["emma"], likes: ["mine", "friend"],
  comments: { mine: [{ id: "one", text: "Original" }], friend: [{ id: "two", text: "Keep this" }] },
  requests: [{ id: "mine", kind: "request", authorId: "you", city: "SLO", title: "Ideas for SLO", timeLabel: "Just now", note: "Art", likes: 0, comments: [], suggestedExperienceIds: [] }],
});

test("owned comments can be edited or deleted without touching other comments", () => {
  const original = state();
  const edited = editOwnComment(original, "mine", "one", " Updated ");
  assert.deepEqual(edited.comments.mine, [{ id: "one", text: "Updated" }]);
  assert.equal(original.comments.mine[0].text, "Original");
  assert.equal(editOwnComment(original, "mine", "one", " "), original);
  assert.equal(editOwnComment(original, "mine", "fixture-comment", "No"), original);
  const removed = deleteOwnComment(edited, "mine", "one");
  assert.equal("mine" in removed.comments, false);
  assert.deepEqual(removed.comments.friend, original.comments.friend);
  assert.equal(deleteOwnComment(original, "mine", "fixture-comment"), original);
});

test("request edits preserve identity and replies; deletion clears only its related state", () => {
  const original = state();
  const edited = editOwnRequest(original, "mine", " LA ", " Walks ");
  assert.equal(edited.requests[0].id, "mine");
  assert.equal(edited.requests[0].title, "Ideas for LA");
  assert.equal(edited.requests[0].note, "Walks");
  assert.deepEqual(edited.comments, original.comments);
  assert.equal(editOwnRequest(original, "mine", "", "No city"), original);
  const removed = JSON.parse(JSON.stringify(deleteOwnRequest(edited, "mine"))) as SocialState;
  assert.deepEqual(removed.requests, []);
  assert.deepEqual(removed.likes, ["friend"]);
  assert.deepEqual(removed.comments, { friend: [{ id: "two", text: "Keep this" }] });
  assert.deepEqual(removed.followed, ["emma"]);
  assert.equal(deleteOwnRequest(original, "friend"), original);
});
