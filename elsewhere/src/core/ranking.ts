/**
 * Elsewhere's own bounded comparison algorithm; it is not an implementation of
 * another product's ranking internals. Lower rank numbers mean more preferred.
 */
export type Band = "liked" | "okay" | "disliked";

export interface Preference {
  id: string;
  band: Band;
  /** One-based first occupied rank of a tied group, or null while unresolved. */
  rank: number | null;
  note?: string;
  again?: boolean;
}

export type RankingAnswer = "new" | "existing" | "tie" | "skip";

export interface RankingSession {
  id: string;
  band: Band;
  /** Fully placed same-band groups, ordered from most to least preferred. */
  groups: string[][];
  /** Inclusive lower and upper candidate insertion gaps. */
  lo: number;
  hi: number;
  /** Answered questions, including skips. */
  compared: number;
  /** Group indexes skipped by the user; a skip gives no ordering evidence. */
  skipped: number[];
  status: "active" | "placed" | "pending";
  placement: { kind: "insert" | "tie"; index: number } | null;
  pendingReason?: "question-limit" | "skipped-opponents";
}

export const MAX_RANKING_QUESTIONS = 5;

/** Keep one vote per experience even when persisted input contains duplicates. */
function uniquePreferences(preferences: readonly Preference[]): Preference[] {
  return [
    ...new Map(
      preferences.map((preference) => [preference.id, preference]),
    ).values(),
  ];
}

function isPlaced(preference: Preference): boolean {
  return (
    preference.rank !== null &&
    Number.isFinite(preference.rank) &&
    preference.rank >= 1
  );
}

function orderedGroups(
  preferences: readonly Preference[],
  band: Band,
): string[][] {
  const groups = new Map<number, string[]>();
  for (const preference of uniquePreferences(preferences)) {
    if (preference.band !== band || !isPlaced(preference)) continue;
    const rank = preference.rank as number;
    const group = groups.get(rank) ?? [];
    group.push(preference.id);
    groups.set(rank, group);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([, ids]) => ids);
}

/** Select the most balanced useful comparison within the unresolved interval. */
function opponentIndex(session: RankingSession): number | null {
  if (session.status !== "active" || session.compared >= MAX_RANKING_QUESTIONS)
    return null;
  const skipped = new Set(session.skipped);
  const midpoint = (session.lo + session.hi - 1) / 2;
  let best: number | null = null;
  for (let index = session.lo; index < session.hi; index += 1) {
    if (skipped.has(index)) continue;
    if (best === null || Math.abs(index - midpoint) < Math.abs(best - midpoint))
      best = index;
  }
  return best;
}

function settleSession(session: RankingSession): RankingSession {
  if (session.placement) return { ...session, status: "placed" };
  if (session.lo === session.hi) {
    return {
      ...session,
      status: "placed",
      placement: { kind: "insert", index: session.lo },
    };
  }
  if (session.compared >= MAX_RANKING_QUESTIONS) {
    return { ...session, status: "pending", pendingReason: "question-limit" };
  }
  if (opponentIndex(session) === null) {
    return {
      ...session,
      status: "pending",
      pendingReason: "skipped-opponents",
    };
  }
  return session;
}

/** Start fresh, excluding the experience itself and other unresolved ratings. */
export function beginRanking(
  id: string,
  band: Band,
  preferences: readonly Preference[],
): RankingSession {
  const groups = orderedGroups(
    preferences.filter((preference) => preference.id !== id),
    band,
  );
  return settleSession({
    id,
    band,
    groups,
    lo: 0,
    hi: groups.length,
    compared: 0,
    skipped: [],
    status: "active",
    placement: null,
  });
}

/** A tied group is represented by its first experience; no opponent means done. */
export function currentOpponent(session: RankingSession): string | null {
  const index = opponentIndex(session);
  return index === null ? null : session.groups[index][0];
}

/**
 * Record one answer immutably. "new" prefers the incoming experience; "existing"
 * prefers the displayed opponent. Skips never narrow the candidate interval.
 */
export function answerRanking(
  session: RankingSession,
  answer: RankingAnswer,
): RankingSession {
  const index = opponentIndex(session);
  if (index === null) return session;
  const next: RankingSession = { ...session, compared: session.compared + 1 };
  if (answer === "new") next.hi = index;
  else if (answer === "existing") next.lo = index + 1;
  else if (answer === "tie") next.placement = { kind: "tie", index };
  else next.skipped = [...session.skipped, index];
  return settleSession(next);
}

/**
 * Upsert one rating and retain notes, revisit choices, and all other bands.
 * Calling this before resolution saves the selected band with a pending rank.
 */
export function finishRanking(
  session: RankingSession,
  preferences: readonly Preference[],
): Preference[] {
  const groups = session.groups.map((group) => [...group]);
  if (session.status === "placed" && session.placement) {
    const { kind, index } = session.placement;
    if (kind === "tie") groups[index].push(session.id);
    else groups.splice(index, 0, [session.id]);
  }

  const ranks = new Map<string, number>();
  let nextRank = 1;
  for (const group of groups) {
    for (const id of group) ranks.set(id, nextRank);
    nextRank += group.length;
  }

  let found = false;
  const result = uniquePreferences(preferences).map((preference) => {
    if (preference.id === session.id) {
      found = true;
      return {
        ...preference,
        band: session.band,
        rank: ranks.get(session.id) ?? null,
      };
    }
    if (preference.band === session.band && ranks.has(preference.id)) {
      return { ...preference, rank: ranks.get(preference.id) as number };
    }
    return { ...preference };
  });
  if (!found)
    result.push({
      id: session.id,
      band: session.band,
      rank: ranks.get(session.id) ?? null,
    });
  return result;
}

const BAND_BOUNDS_TENTHS: Record<Band, readonly [number, number]> = {
  disliked: [0, 33],
  okay: [34, 66],
  liked: [67, 100],
};

/**
 * Compute from the complete preference collection before applying display filters.
 * N counts fully placed experiences in a band; tied groups use their average
 * occupied rank r. q = (N - r + 1) / (N + 1). Unresolved scores remain null.
 */
export function scorePreferences(
  preferences: readonly Preference[],
): Record<string, number | null> {
  const unique = uniquePreferences(preferences);
  const scores: Record<string, number | null> = Object.fromEntries(
    unique.map(({ id }) => [id, null]),
  );
  for (const band of ["disliked", "okay", "liked"] as const) {
    const groups = orderedGroups(unique, band);
    const count = groups.reduce((total, group) => total + group.length, 0);
    const [lower, upper] = BAND_BOUNDS_TENTHS[band];
    let preceding = 0;
    for (const group of groups) {
      // Express q as integers to round decimal halves upward without float drift.
      const denominator = 2 * (count + 1);
      const numerator = 2 * count + 1 - 2 * preceding - group.length;
      const scaledNumerator = lower * denominator + (upper - lower) * numerator;
      const score =
        Math.floor((2 * scaledNumerator + denominator) / (2 * denominator)) /
        10;
      for (const id of group) scores[id] = score;
      preceding += group.length;
    }
  }
  return scores;
}
