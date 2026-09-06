// Fictional social fixtures. Venue information comes from the real SLO catalog.
export type FriendId = "emma" | "maya" | "alex" | "noah" | "jacob" | "usman";

export type FriendProfile = Readonly<{
  id: FriendId;
  name: string;
  handle: string;
  initials: string;
  color: string;
  bio: string;
  city: string;
  rankedCount: number;
  savedCount: number;
}>;

export type FriendComment = Readonly<{
  id: string;
  authorId: FriendId;
  text: string;
}>;

type EventBase = Readonly<{
  id: string;
  authorId: FriendId;
  timeLabel: string;
  note: string;
  likes: number;
  comments: readonly FriendComment[];
}>;

export type FriendEvent = EventBase & (
  | Readonly<{ kind: "ranked"; experienceId: string; score: number }>
  | Readonly<{ kind: "bookmarked"; experienceId: string }>
  | Readonly<{
      kind: "guide";
      owner: "emma";
      title: string;
      city: string;
    }>
  | Readonly<{
      kind: "request";
      city: string;
      title: string;
      suggestedExperienceIds: readonly string[];
    }>
);

export const friends: readonly FriendProfile[] = [
  { id: "jacob", name: "Jacob", handle: "jacob", initials: "J", color: "#c9d9b3", bio: "Trails, good views, and finding the next weekend plan.", city: "San Luis Obispo", rankedCount: 7, savedCount: 4 },
  { id: "usman", name: "Usman", handle: "usman", initials: "U", color: "#c8c0e2", bio: "Always down to try something new with friends.", city: "San Luis Obispo", rankedCount: 6, savedCount: 5 },
  {
    id: "emma",
    name: "Emma Chen",
    handle: "emmachen",
    initials: "EC",
    color: "#c5dfa8",
    bio: "Art stops, slow walks, and a good weekend plan.",
    city: "San Luis Obispo",
    rankedCount: 8,
    savedCount: 3,
  },
  {
    id: "maya",
    name: "Maya Patel",
    handle: "mayap",
    initials: "MP",
    color: "#ddc6ec",
    bio: "Usually making something or finding a new trail.",
    city: "San Luis Obispo",
    rankedCount: 6,
    savedCount: 4,
  },
  {
    id: "alex",
    name: "Alex Rivera",
    handle: "alexr",
    initials: "AR",
    color: "#ffb297",
    bio: "Outside whenever possible. Always up for a detour.",
    city: "San Luis Obispo",
    rankedCount: 7,
    savedCount: 2,
  },
  {
    id: "noah",
    name: "Noah Brooks",
    handle: "noahb",
    initials: "NB",
    color: "#b5d6e3",
    bio: "New cities, local favorites, and plans with friends.",
    city: "San Luis Obispo",
    rankedCount: 4,
    savedCount: 5,
  },
];

export function friendById(id: FriendId): FriendProfile {
  const friend = friends.find((profile) => profile.id === id);
  if (!friend) throw new Error(`Unknown friend profile: ${id}`);
  return friend;
}

export const friendFeed: readonly FriendEvent[] = [
  { id: "jacob-bishop", kind: "ranked", authorId: "jacob", experienceId: "bishop-peak", score: 9.4, timeLabel: "20 minutes ago", note: "Worth the climb. Next time we’re going for sunset.", likes: 8, comments: [{id: "usman-bishop", authorId: "usman", text: "I’m in for the next one."}] },
  { id: "usman-pottery", kind: "ranked", authorId: "usman", experienceId: "anam-cre-pottery", score: 9.1, timeLabel: "1 hour ago", note: "First time trying the wheel. Would definitely do another class.", likes: 6, comments: [{id: "jacob-pottery", authorId: "jacob", text: "Adding it to my list."}] },
  { id: "jacob-garden", kind: "bookmarked", authorId: "jacob", experienceId: "leaning-pine-arboretum", timeLabel: "3 hours ago", note: "Saving this for a quiet afternoon between classes.", likes: 3, comments: [] },
  { id: "usman-market", kind: "ranked", authorId: "usman", experienceId: "downtown-farmers-market", score: 8.7, timeLabel: "Yesterday", note: "An easy Thursday plan with everyone.", likes: 9, comments: [] },
  {
    id: "emma-ranked-sloma",
    kind: "ranked",
    authorId: "emma",
    experienceId: "sloma",
    score: 8.9,
    timeLabel: "2 hours ago",
    note: "My favorite way to slow down downtown. I paired this with a walk by the creek and would happily do it again.",
    likes: 12,
    comments: [
      { id: "sloma-maya", authorId: "maya", text: "Adding this to my weekend list." },
      { id: "sloma-noah", authorId: "noah", text: "This is exactly the kind of afternoon I’m looking for." },
    ],
  },
  {
    id: "maya-saved-pottery",
    kind: "bookmarked",
    authorId: "maya",
    experienceId: "anam-cre-pottery",
    timeLabel: "4 hours ago",
    note: "I’ve wanted to try the wheel for ages. Saving this for a day when we can all book a class together.",
    likes: 7,
    comments: [
      { id: "pottery-emma", authorId: "emma", text: "Count me in. Let’s find a class." },
    ],
  },
  {
    id: "alex-ranked-bishop",
    kind: "ranked",
    authorId: "alex",
    experienceId: "bishop-peak",
    score: 9.2,
    timeLabel: "Yesterday",
    note: "A proper workout and such a good view. I took my time coming down and was very glad I brought extra water.",
    likes: 18,
    comments: [
      { id: "bishop-maya", authorId: "maya", text: "One of my favorites here too." },
    ],
  },
  {
    id: "noah-requests-slo-weekend",
    kind: "request",
    authorId: "noah",
    city: "San Luis Obispo",
    title: "A relaxed weekend in SLO",
    timeLabel: "Yesterday",
    note: "A friend is coming to town. What’s one thing you’d take them to? We’re into art, easy walks, and trying something new.",
    suggestedExperienceIds: ["sloma", "leaning-pine-arboretum", "downtown-creek-walk"],
    likes: 5,
    comments: [
      { id: "request-emma", authorId: "emma", text: "SLOMA, then a creek walk. That’s my ideal easy afternoon." },
      { id: "request-alex", authorId: "alex", text: "Leaning Pine if you want somewhere a little quieter." },
    ],
  },
  {
    id: "emma-shared-slo-guide",
    kind: "guide",
    authorId: "emma",
    owner: "emma",
    title: "Emma’s San Luis Obispo",
    city: "San Luis Obispo",
    timeLabel: "2 days ago",
    note: "My San Luis Obispo rankings so far. Pick a couple and leave room to wander.",
    likes: 16,
    comments: [
      { id: "guide-noah", authorId: "noah", text: "Saving this for my friend’s visit." },
    ],
  },
  {
    id: "noah-saved-leaning-pine",
    kind: "bookmarked",
    authorId: "noah",
    experienceId: "leaning-pine-arboretum",
    timeLabel: "3 days ago",
    note: "A quiet garden walk sounds like a very good use of a free afternoon.",
    likes: 4,
    comments: [],
  },
];
