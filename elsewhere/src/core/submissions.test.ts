import test from "node:test";
import assert from "node:assert/strict";
import { catalog, matches } from "../data/catalog";
import { createCustomExperience, draftFromExperience, updateCustomExperience, type CustomDraft } from "./customExperience";
import { activityShareText, assertCreationAllowed, canViewActivity, DAY, emptyCommunity, expansionEvidence, findDuplicateActivities, isPubliclyDiscoverable, limitDiscoveryTrials, reportActivity, restoreCommunity, restoreSubmission, reviewActivity, submissionOf, type ActivityAudience, type ReactionEvidence } from "./submissions";
import { buildCityGuides, cityGuideText } from "./guides";
import { deleteCustomPlace } from "./library";

const now = Date.parse("2026-09-06T12:00:00Z");
const draft: CustomDraft = { name: "Laguna Lake geocaching loop", city: "San Luis Obispo", activityType: "Geocaching", description: "Follow a walking loop through the park and look for caches.", latitude: "35.269", longitude: "-120.692", location: "Park entrance", duration: "60", price: "0", audience: "public", access: "public", accessNote: "Use the public paths during posted park hours.", vibes: ["Explore"] };
const create = (audience: ActivityAudience = "public", id = "user:loop") => createCustomExperience({ ...draft, audience }, id, now, "alice", "Alice");
const context = { reviewerId: "moderator", isModerator: true, revision: 1, accessVerified: true, note: "Checked the route and visitor access.", now };
const trial = (id = "user:loop") => reviewActivity(create("public", id), "trial", context);
const evidence: ReactionEvidence[] = ["a", "a", "b", "b", "c"].map((groupId, i) => ({ userId: `visitor-${i}`, groupId, established: true, completed: true, reaction: "liked", at: new Date(now).toISOString() }));

test("a new activity remains unlisted despite public consent, and its creator can still save/view/share it", () => {
  const item = create();
  assert.equal(item.submission?.status, "pending");
  assert.equal(isPubliclyDiscoverable(item), false);
  assert.equal(canViewActivity(item), false);
  assert.equal(canViewActivity(item, { id: "alice" }), true);
  assert.equal(canViewActivity(item, { hasShareAccess: true }), true);
  const text = activityShareText(item, { id: "alice" })!;
  assert.match(text, /Added by Alice/);
  assert.match(text, /public paths/);
  assert.equal(item.priceUSD, 0);
  assert.equal(item.durationMinutesSuggested, 60);
});

test("friends-only visibility needs authenticated friendship, never clout or an unrestricted link", () => {
  const friends = create("friends"), privateItem = create("private");
  for (const viewer of [{}, { hasShareAccess: true }, { friendOfCreator: true }, { id: "bob" }]) assert.equal(canViewActivity(friends, viewer), false);
  assert.equal(canViewActivity(friends, { id: "bob", friendOfCreator: true }), true);
  assert.equal(canViewActivity(privateItem, { id: "bob", friendOfCreator: true, hasShareAccess: true }), false);
  assert.equal(activityShareText(friends, { id: "alice" }), null);
  assert.equal(activityShareText(privateItem, { id: "alice" }), null);
  assert.throws(() => reviewActivity(friends, "trial", context), /not allowed public/);
});

test("a reviewer can start a zero-follower local trial but creator approval, stale review and unresolved holds fail", () => {
  assert.equal(isPubliclyDiscoverable(trial()), true);
  assert.throws(() => reviewActivity(create(), "trial", { ...context, reviewerId: "alice" }), /separate moderator/);
  assert.throws(() => reviewActivity(create(), "trial", { ...context, isModerator: false }), /moderator/);
  assert.throws(() => reviewActivity(create(), "trial", { ...context, revision: 2 }), /latest details/);
  assert.throws(() => reviewActivity(create(), "trial", { ...context, moderationHold: true }), /moderation hold/);
  assert.throws(() => reviewActivity(create(), "trial", { ...context, accessVerified: false }), /visitor access/);
});

test("edits and audience revocation immediately invalidate approval, retain identity, and cannot be undone by old review metadata", () => {
  const original = trial();
  const edited = updateCustomExperience(original, { ...draft, description: "A revised route requiring another access review." }, "alice", now + 100);
  assert.equal(edited.id, original.id);
  assert.equal(edited.submission?.revision, 2);
  assert.equal(edited.submission?.createdAt, original.submission?.createdAt);
  assert.equal(edited.submission?.review, undefined);
  assert.equal(isPubliclyDiscoverable(edited), false);
  const stale = { ...edited, submission: { ...edited.submission!, status: "trial" as const, review: original.submission?.review } };
  assert.equal(isPubliclyDiscoverable(stale), false);
  const revoked = updateCustomExperience(original, { ...draft, audience: "friends" }, "alice", now + 100);
  assert.equal(canViewActivity(revoked, { hasShareAccess: true }), false);
  assert.equal(isPubliclyDiscoverable(revoked), false);
  assert.throws(() => updateCustomExperience(original, draft, "bob", now), /Only the creator/);
});

test("tunnels and other locations cannot enter discovery with missing or restricted access", () => {
  for (const access of ["unknown", "restricted"] as const) assert.throws(() => createCustomExperience({ ...draft, name: "Tunnel walk", access }, "user:tunnel", now), /visitor access/);
  assert.throws(() => createCustomExperience({ ...draft, location: "", accessNote: "" }, "user:missing", now), /location or meeting area/);
  const permission = createCustomExperience({ ...draft, access: "permission", accessNote: "Book with the operator before entering." }, "user:tour", now, "alice");
  assert.throws(() => reviewActivity(permission, "trial", { ...context, accessVerified: false }), /visitor access/);
  assert.equal(isPubliclyDiscoverable(reviewActivity(permission, "trial", context)), true);
  assert.throws(() => createCustomExperience({ ...draft, sourceUrl: "javascript:alert(1)" }, "user:bad", now), /valid https/);
  assert.throws(() => createCustomExperience({ ...draft, duration: "NaN" }, "user:bad", now), /Duration/);
  assert.throws(() => createCustomExperience({ ...draft, price: "-1" }, "user:bad", now), /price/);
});

test("duplicate checks normalize punctuation and city but preserve distinct activities at one venue", () => {
  const item = create();
  assert.deepEqual(findDuplicateActivities({ name: " LAGUNA  LAKE geocaching-loop! ", city: "San Luis Obispo " }, [item]).map(e => e.id), [item.id]);
  assert.equal(findDuplicateActivities({ ...draft, name: "Birdwatching at Laguna Lake" }, [item]).length, 0);
  assert.equal(findDuplicateActivities({ ...draft, city: "Seattle" }, [item]).length, 0);
  assert.equal(findDuplicateActivities(draft, [item], item.id).length, 0);
});

test("rolling creation receipts survive deletion and expire at the 24-hour boundary", () => {
  const creations = [1, 2, 3].map(n => ({ id: `user:${n}`, creatorId: "alice", at: new Date(now - 1).toISOString() }));
  const state = { customExperiences: [create("public", "user:1")], saved: ["user:1"], preferences: [], awareness: {}, community: { ...emptyCommunity, creations } };
  const deleted = deleteCustomPlace(state, "user:1");
  assert.equal(deleted.customExperiences.length, 0);
  assert.throws(() => assertCreationAllowed(deleted.community.creations, "alice", now), /3 activities/);
  assert.doesNotThrow(() => assertCreationAllowed(creations, "bob", now));
  assert.doesNotThrow(() => assertCreationAllowed(creations, "alice", now + DAY));
  assert.doesNotThrow(() => assertCreationAllowed([creations[0], creations[0]], "alice", now));
});

test("expansion counts current completed reactions from independent established people, with equal group weight", () => {
  assert.equal(expansionEvidence(create(), evidence, now).ready, true);
  assert.equal(expansionEvidence(create(), Array(100).fill(evidence[0]), now).ready, false);
  assert.equal(expansionEvidence(create(), evidence.map(r => ({ ...r, groupId: "one-circle" })), now).ready, false);
  assert.equal(expansionEvidence(create(), evidence.map(r => ({ ...r, completed: false })), now).ready, false);
  assert.equal(expansionEvidence(create(), evidence.map(r => ({ ...r, established: false })), now).ready, false);
  assert.equal(expansionEvidence(create(), [...evidence, ...evidence.map(r => ({ ...r, reaction: "disliked" as const, at: new Date(now + 1).toISOString() }))], now + 1).ready, false);
  assert.equal(expansionEvidence(create(), evidence.map(r => ({ ...r, at: new Date(now - 181 * DAY).toISOString() })), now).ready, false);
  assert.throws(() => reviewActivity(trial(), "published", context), /independent completed/);
  assert.equal(isPubliclyDiscoverable(reviewActivity(trial(), "published", { ...context, evidence })), true);
});

test("removed activities cannot be opened by recipients, exported or republished; owner retains management history", () => {
  const removed = reviewActivity(trial(), "removed", context);
  assert.equal(canViewActivity(removed, { id: "alice" }), true);
  assert.equal(canViewActivity(removed, { hasShareAccess: true }), false);
  assert.equal(activityShareText(removed, { id: "alice" }), null);
  assert.equal(isPubliclyDiscoverable(removed), false);
  assert.throws(() => updateCustomExperience(removed, draft, "alice", now), /removed/);
  assert.throws(() => reviewActivity(removed, "trial", context), /removed/);
});

test("reporting hides for the reporter only, deduplicates reports, and blocks override shares and public visibility", () => {
  const item = trial();
  const report = reportActivity(emptyCommunity, item.id, "bob", "Spam", now);
  const repeat = reportActivity(report, item.id, "bob", "Incorrect details", now + 1);
  assert.equal(repeat.reports.length, 1);
  assert.equal(canViewActivity(item, { id: "bob", hiddenIds: repeat.hiddenIds }), false);
  assert.equal(canViewActivity(item, { id: "carol" }), true);
  assert.equal(canViewActivity(item, { hasShareAccess: true, blockedCreatorIds: ["alice"] }), false);
  assert.equal(activityShareText(item, { id: "alice", blockedCreatorIds: ["alice"] }), null);
  assert.equal(isPubliclyDiscoverable(item), true);
});

test("private and friends-only activity names, URLs and rank gaps never leak through a public city guide", () => {
  const items = [create("private", "user:private"), create("friends", "user:friends"), trial()]
    .map((e, i) => ({ ...e, name: ["SECRET ROUTE", "FRIENDS ROUTE", "PUBLIC ROUTE"][i], sourceUrl: `https://example.com/${i}` }));
  const guide = buildCityGuides(items.map((e, i) => ({ id: e.id, band: "liked" as const, rank: i + 1, note: "Private visit note" })), items)[0];
  assert.equal(guide.entries.length, 3);
  const text = cityGuideText(guide, "Alice", { id: "alice" });
  assert.match(text, /1 experiences visited/);
  assert.match(text, /1\. PUBLIC ROUTE/);
  assert.doesNotMatch(text, /SECRET|FRIENDS|example.com\/[01]|Private visit note|3\./);
  assert.equal(cityGuideText(guide, "Alice", { id: "alice", hiddenIds: ["user:loop"] }), "No shareable experiences in this guide.");
});

test("trial allocation obeys hard filters and rotates at most one trial without hiding reviewed catalog entries", () => {
  const a = trial("user:a"), b = trial("user:b");
  const items = [...catalog, create(), a, b];
  const first = limitDiscoveryTrials(items, now), second = limitDiscoveryTrials(items, now + DAY);
  assert.equal(first.length, catalog.length + 1);
  assert.notDeepEqual(first.map(e => e.id), second.map(e => e.id));
  assert.equal(first.some(e => e.id === "user:loop"), false);
  const filtered = items.filter(e => matches(e, { query: "", budget: 0, radius: null, duration: 30, vibes: [] }));
  assert.equal(limitDiscoveryTrials(filtered, now).some(e => e.id.startsWith("user:")), false);
});

test("legacy/malformed submission state fails closed, and valid local state survives serialization", () => {
  const legacy = { ...create(), submission: undefined };
  assert.equal(submissionOf(legacy)?.audience, "private");
  assert.equal(isPubliclyDiscoverable(legacy), false);
  assert.equal(activityShareText(legacy, { id: "you" }), null);
  assert.equal(restoreSubmission({ ...create().submission, audience: "anything" }), undefined);
  const item = trial();
  const restored = { ...item, submission: restoreSubmission(JSON.parse(JSON.stringify(item.submission))) };
  assert.equal(isPubliclyDiscoverable(restored), true);
  assert.equal(draftFromExperience(restored).audience, "public");
  assert.deepEqual(restoreCommunity(null), emptyCommunity);
  const report = reportActivity(emptyCommunity, item.id, "bob", "Spam", now);
  assert.deepEqual(restoreCommunity(JSON.parse(JSON.stringify(report))), report);
});
