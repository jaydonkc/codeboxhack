import type { FriendId } from "../data/friends";

export type OwnRequest = {
  id: string; kind: "request"; authorId: "you"; city: string; title: string;
  timeLabel: string; note: string; likes: number; comments: []; suggestedExperienceIds: string[];
};
export type LocalComment = { id: string; text: string };
export type SocialState = {
  placeholderVersion?: number; likes: string[]; followed: FriendId[];
  comments: Record<string, LocalComment[]>; requests: OwnRequest[];
};

export function editOwnComment(state: SocialState, postId: string, id: string, text: string): SocialState {
  if (!text.trim() || !state.comments[postId]?.some(c => c.id === id)) return state;
  return { ...state, comments: { ...state.comments, [postId]: state.comments[postId].map(c => c.id === id ? { ...c, text: text.trim() } : c) } };
}

export function deleteOwnComment(state: SocialState, postId: string, id: string): SocialState {
  if (!state.comments[postId]?.some(c => c.id === id)) return state;
  const comments = { ...state.comments, [postId]: state.comments[postId].filter(c => c.id !== id) };
  if (!comments[postId].length) delete comments[postId];
  return { ...state, comments };
}

export function editOwnRequest(state: SocialState, id: string, city: string, note: string): SocialState {
  if (!city.trim() || !note.trim()) return state;
  return { ...state, requests: state.requests.map(p => p.id === id && p.authorId === "you" ? { ...p, city: city.trim(), title: `Ideas for ${city.trim()}`, note: note.trim() } : p) };
}

export function deleteOwnRequest(state: SocialState, id: string): SocialState {
  if (!state.requests.some(p => p.id === id && p.authorId === "you")) return state;
  const { [id]: removed, ...comments } = state.comments;
  return { ...state, requests: state.requests.filter(p => p.id !== id), likes: state.likes.filter(like => like !== id), comments };
}
