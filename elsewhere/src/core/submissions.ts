import type { Experience } from "../data/catalog";

export type ActivityAudience = "private" | "friends" | "public";
export type VisitorAccess = "public" | "permission" | "unknown" | "restricted";
export type PublicationStatus = "unlisted" | "pending" | "trial" | "published" | "changes-requested" | "removed";
export type Submission = {
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  audience: ActivityAudience;
  status: PublicationStatus;
  location: string;
  access: VisitorAccess;
  accessNote: string;
  review?: { reviewerId: string; at: string; revision: number; decision: PublicationStatus; note: string; accessVerified: boolean };
};
export type CreationReceipt = { id: string; creatorId: string; at: string };
export type ActivityReport = { experienceId: string; reporterId: string; reason: string; at: string };
export type CommunityState = { creations: CreationReceipt[]; reports: ActivityReport[]; hiddenIds: string[]; blockedCreatorIds: string[] };
export const emptyCommunity: CommunityState = { creations: [], reports: [], hiddenIds: [], blockedCreatorIds: [] };
export const DAY = 86_400_000;
export const audienceLabels: Record<ActivityAudience, string> = { private: "Only me", friends: "Friends only", public: "Allow public discovery" };
export const statusLabels: Record<PublicationStatus, string> = { unlisted: "Unlisted", pending: "Awaiting review", trial: "Local trial", published: "In discovery", "changes-requested": "Changes requested", removed: "Removed" };

/** Old local entries have no sharing consent. Missing metadata always fails closed. */
export function submissionOf(e: Experience): Submission | undefined {
  if (!e.id.startsWith("user:")) return undefined;
  return e.submission ?? { creatorId: "you", creatorName: "You", createdAt: "", updatedAt: "", revision: 1, audience: "private", status: "unlisted", location: "", access: "unknown", accessNote: "" };
}

const dateOK = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
const str = (v: unknown, max = 1200) => typeof v === "string" ? v.slice(0, max).trim() : "";
export function restoreSubmission(value: unknown): Submission | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Partial<Submission>;
  if (!v.creatorId || !Number.isInteger(v.revision) || v.revision! < 1 || !dateOK(v.createdAt) || !dateOK(v.updatedAt)
    || !["private", "friends", "public"].includes(v.audience!) || !Object.hasOwn(statusLabels, v.status!)
    || !["public", "permission", "unknown", "restricted"].includes(v.access!)) return undefined;
  const review = v.review && dateOK(v.review.at) && typeof v.review.reviewerId === "string" && Object.hasOwn(statusLabels, v.review.decision)
    ? { reviewerId: v.review.reviewerId, at: v.review.at, revision: v.review.revision, decision: v.review.decision, note: str(v.review.note), accessVerified: v.review.accessVerified === true } : undefined;
  return { creatorId: str(v.creatorId, 120), creatorName: str(v.creatorName, 120) || "Community member", createdAt: v.createdAt, updatedAt: v.updatedAt,
    revision: v.revision!, audience: v.audience!, status: v.status!, location: str(v.location, 300), access: v.access!, accessNote: str(v.accessNote), review };
}

export function restoreCommunity(value: unknown): CommunityState {
  const v = value && typeof value === "object" ? value as Partial<CommunityState> : {};
  const ids = (x: unknown) => Array.isArray(x) ? [...new Set(x.filter((id): id is string => typeof id === "string"))] : [];
  return {
    creations: Array.isArray(v.creations) ? v.creations.filter(r => r && typeof r.id === "string" && typeof r.creatorId === "string" && dateOK(r.at)) : [],
    reports: Array.isArray(v.reports) ? v.reports.filter(r => r && typeof r.experienceId === "string" && typeof r.reporterId === "string" && typeof r.reason === "string" && dateOK(r.at)) : [],
    hiddenIds: ids(v.hiddenIds), blockedCreatorIds: ids(v.blockedCreatorIds),
  };
}

/** Deletion never deletes these receipts. Production must enforce this atomically on the server. */
export function assertCreationAllowed(receipts: readonly CreationReceipt[], creatorId: string, now: number, established = false) {
  const limit = established ? 10 : 3;
  const recent = new Map(receipts.filter(r => r.creatorId === creatorId && Date.parse(r.at) > now - DAY).map(r => [r.id, r]));
  if (recent.size >= limit) throw new Error(`You can add ${limit} activities in 24 hours. Try again later, or save an existing activity.`);
}

const normalized = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function findDuplicateActivities(draft: { name: string; city: string }, catalog: readonly Experience[], excludeId?: string) {
  const name = normalized(draft.name), city = normalized(draft.city).replace(/^near /, "");
  if (!name || !city) return [];
  return catalog.filter(e => e.id !== excludeId && normalized(e.city).replace(/^near /, "") === city
    && [e.name, e.venue].some(n => normalized(n) === name));
}

export function publicReadiness(e: Experience): string[] {
  const s = submissionOf(e);
  if (!s) return [];
  const issues: string[] = [];
  if (e.description.trim().length < 20 || e.description === "An experience you added.") issues.push("Describe what someone will do (at least 20 characters).");
  if (!e.activityType.trim() || e.activityType === "Experience") issues.push("Add an activity type.");
  if (!s.location.trim()) issues.push("Add a location or meeting area.");
  if (e.durationMinutesSuggested === null) issues.push("Add an approximate duration.");
  if (s.access === "unknown" || s.access === "restricted") issues.push("Public discovery requires visitor access to be established.");
  if (s.accessNote.trim().length < 10) issues.push("Explain visitor access, including any permission needed.");
  return issues;
}

export function isPubliclyDiscoverable(e: Experience): boolean {
  const s = submissionOf(e);
  if (!s) return true;
  return s.audience === "public" && ["trial", "published"].includes(s.status) && !publicReadiness(e).length
    && s.review?.revision === s.revision && s.review.decision === s.status && s.review.accessVerified
    && s.review.reviewerId !== s.creatorId;
}

export type Viewer = { id?: string; friendOfCreator?: boolean; hasShareAccess?: boolean; hiddenIds?: readonly string[]; blockedCreatorIds?: readonly string[] };
export function isHidden(e: Experience, viewer: Viewer) {
  const s = submissionOf(e);
  return !!viewer.hiddenIds?.includes(e.id) || !!(s && viewer.blockedCreatorIds?.includes(s.creatorId));
}
export function canViewActivity(e: Experience, viewer: Viewer = {}): boolean {
  if (isHidden(e, viewer)) return false;
  const s = submissionOf(e);
  if (!s) return true;
  if (viewer.id === s.creatorId) return true;
  if (["removed", "changes-requested"].includes(s.status)) return false;
  if (s.audience === "private") return false;
  if (s.audience === "friends") return !!viewer.id && viewer.friendOfCreator === true;
  return isPubliclyDiscoverable(e) || viewer.hasShareAccess === true;
}

/** Unrestricted text exports cannot enforce friends-only access. */
export function canExportActivity(e: Experience, viewer: Viewer = {}) {
  if (!canViewActivity(e, viewer)) return false;
  const s = submissionOf(e);
  return !s || (s.audience === "public" && !["removed", "changes-requested"].includes(s.status));
}
export function activityShareText(e: Experience, viewer: Viewer): string | null {
  if (!canExportActivity(e, viewer)) return null;
  const s = submissionOf(e);
  if (!s) return `${e.venue}\n${e.city}\n${e.sourceUrl}`;
  return `${e.name}\n${e.city} · ${e.activityType}\n${e.description}\n${s.location}\n~${e.durationMinutesSuggested ?? "Unknown"} min\nAccess: ${s.accessNote || "Check before visiting"}\nAdded by ${s.creatorName}\n${e.sourceUrl}`;
}

/** Apply after feasibility filtering; one trial per result set, rotated daily. */
export function limitDiscoveryTrials(items: readonly Experience[], now = Date.now()): Experience[] {
  const eligible = items.filter(isPubliclyDiscoverable);
  const trials = eligible.filter(e => submissionOf(e)?.status === "trial").sort((a, b) => a.id.localeCompare(b.id));
  const chosen = trials.length ? trials[Math.floor(now / DAY) % trials.length].id : undefined;
  return eligible.filter(e => submissionOf(e)?.status !== "trial" || e.id === chosen);
}

export type ReactionEvidence = { userId: string; groupId: string; established: boolean; completed: boolean; reaction: "liked" | "okay" | "disliked"; at: string };
export function expansionEvidence(e: Experience, evidence: readonly ReactionEvidence[], now = Date.now()) {
  const s = submissionOf(e);
  // Newest current reaction per person. A rerating cannot create a second vote.
  const current = new Map<string, ReactionEvidence>();
  for (const r of evidence) {
    const at = Date.parse(r.at);
    if (!r.userId || r.userId === s?.creatorId || !Number.isFinite(at) || at > now || at < now - 180 * DAY) continue;
    if (!current.has(r.userId) || at >= Date.parse(current.get(r.userId)!.at)) current.set(r.userId, r);
  }
  const valid = [...current.values()].filter(r => r.established && r.completed && r.groupId && ["liked", "okay", "disliked"].includes(r.reaction));
  const groups = new Map<string, ReactionEvidence[]>();
  for (const r of valid) groups.set(r.groupId, [...groups.get(r.groupId) ?? [], r]);
  // Each group gets equal weight so a large friend circle cannot dominate positivity.
  const positive = groups.size ? [...groups.values()].reduce((sum, group) => sum + group.filter(r => r.reaction === "liked").length / group.length, 0) / groups.size : 0;
  return { people: valid.length, groups: groups.size, positive, ready: valid.length >= 5 && groups.size >= 3 && positive >= 0.7 };
}

export function reviewActivity(e: Experience, decision: "trial" | "published" | "changes-requested" | "removed", context: {
  reviewerId: string; isModerator: boolean; revision: number; accessVerified: boolean; note: string; now: number;
  evidence?: readonly ReactionEvidence[]; moderationHold?: boolean;
}): Experience {
  const s = submissionOf(e);
  if (!s || !context.isModerator || context.reviewerId === s.creatorId) throw new Error("A separate moderator must review this activity.");
  if (context.revision !== s.revision) throw new Error("The activity changed. Review its latest details.");
  if (!context.note.trim()) throw new Error("Add a review note.");
  if (s.status === "removed") throw new Error("A removed activity cannot be republished here.");
  if (["trial", "published"].includes(decision)) {
    if (s.audience !== "public") throw new Error("The creator has not allowed public discovery.");
    const issues = publicReadiness(e);
    if (issues.length) throw new Error(issues.join(" "));
    if (!context.accessVerified) throw new Error("Confirm visitor access before approving discovery.");
    if (context.moderationHold) throw new Error("Resolve the moderation hold before approving discovery.");
    if (decision === "published" && (s.status !== "trial" || !expansionEvidence(e, context.evidence ?? [], context.now).ready)) throw new Error("More independent completed experiences are needed before expanding discovery.");
  }
  const at = new Date(context.now).toISOString();
  return { ...e, submission: { ...s, status: decision, updatedAt: at, review: { reviewerId: context.reviewerId, at, revision: s.revision, decision, note: context.note.trim(), accessVerified: context.accessVerified } } };
}

/** A report hides the item for its author; only review can remove it for everyone. */
export function reportActivity(state: CommunityState, experienceId: string, reporterId: string, reason: string, now: number): CommunityState {
  if (!reason.trim()) throw new Error("Choose a reason for the report.");
  return { ...state, hiddenIds: [...new Set([...state.hiddenIds, experienceId])],
    reports: [...state.reports.filter(r => r.experienceId !== experienceId || r.reporterId !== reporterId), { experienceId, reporterId, reason: reason.trim(), at: new Date(now).toISOString() }] };
}
