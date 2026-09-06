import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { byId, catalog } from "../data/catalog";
import {
  friends,
  friendFeed,
  friendById,
  type FriendId,
  type FriendEvent,
} from "../data/friends";
import { C, fonts } from "../theme";
import { friendCityGuides } from "../data/friendGuides";
import { cityGuideText, cityKey } from "../core/guides";
import Sheet from "./Sheet";

export type FriendsPageProps = {
  savedIds: string[];
  showExamples: boolean;
  onExperience: (id: string) => void;
  onSave: (id: string) => void;
  onRank: (id: string) => void;
  onGuide: (owner: FriendId | "you", city?: string) => void;
  onNearby: () => void;
  onDiscover: () => void;
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type OwnRequest = {
  id: string;
  kind: "request";
  authorId: "you";
  city: string;
  title: string;
  timeLabel: string;
  note: string;
  likes: number;
  comments: [];
  suggestedExperienceIds: string[];
};
type FeedPost = FriendEvent | OwnRequest;
type LocalComment = { id: string; text: string };
type SocialState = {
  placeholderVersion?: number;
  likes: string[];
  followed: FriendId[];
  comments: Record<string, LocalComment[]>;
  requests: OwnRequest[];
};
type Dialog =
  | { kind: "friends" }
  | { kind: "profile"; id: FriendId }
  | { kind: "comments"; post: FeedPost }
  | { kind: "share"; post: FeedPost }
  | { kind: "compose" }
  | null;
const STORAGE_KEY = "elsewhere-friends-v1";
const emptyState: SocialState = {
  placeholderVersion: 1,
  likes: [],
  followed: ["emma", "maya", "alex", "noah", "jacob", "usman"],
  comments: {},
  requests: [],
};
const you = { name: "You", initials: "Y", color: C.green, handle: "you" };

function Avatar({
  id,
  onPress,
  large = false,
}: {
  id: FriendId | "you";
  onPress?: () => void;
  large?: boolean;
}) {
  const person = id === "you" ? you : friendById(id);
  const content = id === "you" ? (
    <Image
      source={require("../../assets/profile/jaydon-beli.png")}
      accessibilityLabel="Your profile photo"
      style={{ width: "100%", height: "100%", borderRadius: large ? 33 : 100 }}
      resizeMode="cover"
    />
  ) : (
    <Text style={[f.avatarText, large && f.avatarTextLarge]}>
      {person.initials}
    </Text>
  );
  const style = [
    f.avatar,
    { backgroundColor: person.color },
    large && f.avatarLarge,
  ];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${person.name}'s profile`}
      onPress={onPress}
      style={style}
    >
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  active = false,
  count,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  count?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [f.iconButton, pressed && f.pressed]}
    >
      <Ionicons name={icon} size={22} color={active ? C.green : C.ink} />
      {count !== undefined && count > 0 && (
        <Text style={[f.count, active && { color: C.green }]}>{count}</Text>
      )}
    </Pressable>
  );
}

function validStoredState(value: unknown): value is SocialState {
  if (!value || typeof value !== "object") return false;
  const v = value as SocialState;
  return (
    Array.isArray(v.likes) &&
    v.likes.every((id) => typeof id === "string") &&
    Array.isArray(v.followed) &&
    v.followed.every((id) => friends.some((p) => p.id === id)) &&
    !!v.comments &&
    typeof v.comments === "object" &&
    Object.values(v.comments).every(
      (items) =>
        Array.isArray(items) &&
        items.every(
          (c) => typeof c?.id === "string" && typeof c?.text === "string",
        ),
    ) &&
    Array.isArray(v.requests) &&
    v.requests.every(
      (post) =>
        post?.kind === "request" &&
        post.authorId === "you" &&
        typeof post.id === "string" &&
        typeof post.title === "string" &&
        typeof post.note === "string" &&
        typeof post.city === "string" &&
        typeof post.timeLabel === "string" &&
        typeof post.likes === "number" &&
        Number.isFinite(post.likes) &&
        Array.isArray(post.comments) &&
        post.comments.length === 0 &&
        Array.isArray(post.suggestedExperienceIds) &&
        post.suggestedExperienceIds.every((id) =>
          catalog.some((activity) => activity.id === id),
        ),
    )
  );
}

function shareText(post: FeedPost) {
  if (post.kind === "ranked" || post.kind === "bookmarked") {
    const activity = byId(post.experienceId);
    return `${activity.name}\n${activity.venue} · ${activity.city}\n${post.note}\n${activity.sourceUrl}`;
  }
  if (post.kind === "guide") {
    const guide = friendCityGuides(post.owner).find(guide => guide.key === cityKey(post.city));
    return guide ? cityGuideText(guide, friendById(post.owner).name) : post.title;
  }
  return `${post.title}\n${post.city}\n${post.note}`;
}

export default function FriendsPage({
  savedIds,
  showExamples,
  onExperience,
  onSave,
  onRank,
  onGuide,
  onNearby,
  onDiscover,
}: FriendsPageProps) {
  const [social, setSocial] = useState<SocialState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [comment, setComment] = useState("");
  const [requestCity, setRequestCity] = useState("San Luis Obispo");
  const [requestText, setRequestText] = useState("");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (validStoredState(parsed)) setSocial(parsed.placeholderVersion === 1 ? parsed : { ...parsed, placeholderVersion: 1, followed: [...new Set<FriendId>([...parsed.followed, "jacob", "usman"])] });
      })
      .catch(() => {
        if (alive) setNotice("Some friend activity could not be loaded.");
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(social)).catch(() =>
      setNotice("Your latest changes could not be saved."),
    );
  }, [social, loaded]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const allPosts = useMemo(
    () => [
      ...social.requests,
      ...(showExamples
        ? friendFeed.filter((post) => social.followed.includes(post.authorId))
        : []),
    ],
    [social.requests, social.followed, showExamples],
  );
  const visiblePosts = allPosts;
  const open = (next: NonNullable<Dialog>) => {
    setComment("");
    setCopied(false);
    setDialog(next);
  };
  const openProfile = (id: FriendId | "you") => {
    if (id !== "you") open({ kind: "profile", id });
  };
  const toggleLike = (id: string) =>
    setSocial((value) => ({
      ...value,
      likes: value.likes.includes(id)
        ? value.likes.filter((key) => key !== id)
        : [...value.likes, id],
    }));
  const toggleFollow = (id: FriendId) =>
    setSocial((value) => ({
      ...value,
      followed: value.followed.includes(id)
        ? value.followed.filter((key) => key !== id)
        : [...value.followed, id],
    }));
  const selectActivity = (id: string) => {
    setDialog(null);
    onExperience(id);
  };
  const selectGuide = (owner: FriendId | "you", city?: string) => {
    setDialog(null);
    onGuide(owner, city);
  };
  const postTitle = (post: FeedPost) =>
    post.kind === "ranked" || post.kind === "bookmarked"
      ? byId(post.experienceId).name
      : post.title;
  const openPost = (post: FeedPost) => {
    if (post.kind === "ranked" || post.kind === "bookmarked")
      selectActivity(post.experienceId);
    else if (post.kind === "guide") selectGuide(post.owner, post.city);
    else open({ kind: "comments", post });
  };

  const renderPost = (post: FeedPost) => {
    const person = post.authorId === "you" ? you : friendById(post.authorId);
    const guide = post.kind === "guide" ? friendCityGuides(post.owner).find(guide => guide.key === cityKey(post.city)) : null;
    const isActivity = post.kind === "ranked" || post.kind === "bookmarked";
    const activity = isActivity ? byId(post.experienceId) : null;
    const liked = social.likes.includes(post.id);
    const comments =
      post.comments.length + (social.comments[post.id]?.length ?? 0);
    const verb =
      post.kind === "ranked"
        ? "ranked"
        : post.kind === "bookmarked"
          ? "bookmarked"
          : post.kind === "guide"
            ? "shared a guide"
            : "asked for recs";
    return (
      <View key={post.id} style={f.post}>
        <View style={f.postHeader}>
          <Avatar
            id={post.authorId}
            onPress={
              post.authorId === "you"
                ? undefined
                : () => openProfile(post.authorId)
            }
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${postTitle(post)}`}
            onPress={() => openPost(post)}
            style={f.postHeading}
          >
            <Text style={f.postTitle}>
              <Text style={f.bold}>{person.name.split(" ")[0]}</Text> {verb}
              {isActivity ? " " : "\n"}
              <Text style={f.bold}>{postTitle(post)}</Text>
            </Text>
            <Text style={f.subtitle}>
              {activity
                ? `${activity.activityType} · ${activity.city}`
                : post.kind === "guide"
                  ? `${guide?.entries.length ?? 0} experiences · ${post.city}`
                  : post.kind === "request"
                    ? post.city
                    : ""}
            </Text>
          </Pressable>
          {post.kind === "ranked" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${person.name}'s score: ${post.score.toFixed(1)}. Open activity`}
              onPress={() => selectActivity(post.experienceId)}
              style={f.score}
            >
              <Text style={f.scoreText}>{post.score.toFixed(1)}</Text>
            </Pressable>
          )}
        </View>
        <View style={f.postBody}>
          <Text style={f.note}>
            {post.kind === "ranked" && <Text style={f.bold}>Notes: </Text>}
            {post.note}
          </Text>
          {post.kind === "guide" && (
            <Pressable
              accessibilityRole="button"
              onPress={() => selectGuide(post.owner, post.city)}
              style={f.inlineLink}
            >
              <Ionicons name="map-outline" color={C.green} size={18} />
              <Text style={f.link}>Open city guide</Text>
              <Ionicons name="chevron-forward" color={C.green} size={16} />
            </Pressable>
          )}
          <View style={f.postActions}>
            <View style={f.actionGroup}>
              <IconButton
                icon={liked ? "heart" : "heart-outline"}
                label={`${liked ? "Unlike" : "Like"} ${person.name}'s post`}
                active={liked}
                count={post.likes + (liked ? 1 : 0)}
                onPress={() => toggleLike(post.id)}
              />
              <IconButton
                icon="chatbubble-outline"
                label={`Comments on ${postTitle(post)}, ${comments} ${comments === 1 ? "comment" : "comments"}`}
                count={comments}
                onPress={() => open({ kind: "comments", post })}
              />
              <IconButton
                icon="paper-plane-outline"
                label={`Share ${postTitle(post)}`}
                onPress={() => open({ kind: "share", post })}
              />
            </View>
            {activity && (
              <View style={f.actionGroup}>
                <IconButton
                  icon="add-circle-outline"
                  label={`Rank ${activity.name}`}
                  onPress={() => {
                    setDialog(null);
                    onRank(activity.id);
                  }}
                />
                <IconButton
                  icon={
                    savedIds.includes(activity.id)
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  label={`${savedIds.includes(activity.id) ? "Unsave" : "Save"} ${activity.name}`}
                  active={savedIds.includes(activity.id)}
                  onPress={() => onSave(activity.id)}
                />
              </View>
            )}
          </View>
          <Text style={f.timestamp}>{post.timeLabel}</Text>
        </View>
      </View>
    );
  };

  const renderMember = (id: FriendId) => {
    const person = friendById(id);
    const following = social.followed.includes(id);
    return (
      <View style={f.memberRow} key={id}>
        <Avatar id={id} onPress={() => open({ kind: "profile", id })} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${person.name}'s profile`}
          onPress={() => open({ kind: "profile", id })}
          style={f.memberText}
        >
          <Text style={f.memberName}>{person.name}</Text>
          <Text style={f.subtitle}>@{person.handle}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${following ? "Unfollow" : "Follow"} ${person.name}`}
          accessibilityState={{ selected: following }}
          onPress={() => toggleFollow(id)}
          style={[f.followButton, !following && f.followActive]}
        >
          <Text style={[f.followText, !following && { color: C.greenInk }]}>
            {following ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>
    );
  };
  const renderActivity = (id: string) => {
    const activity = byId(id);
    return (
      <Pressable
        key={id}
        accessibilityRole="button"
        onPress={() => selectActivity(id)}
        style={f.activityRow}
      >
        <Ionicons name="location-outline" size={21} color={C.green} />
        <View style={f.memberText}>
          <Text style={f.memberName}>{activity.name}</Text>
          <Text style={f.subtitle}>
            {activity.activityType} · {activity.city}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.muted} />
      </Pressable>
    );
  };

  const dialogTitle =
    dialog?.kind === "friends"
      ? "Search members"
      : dialog?.kind === "profile"
        ? "Member profile"
          : dialog?.kind === "comments"
            ? "Comments"
            : dialog?.kind === "share"
              ? "Share"
              : "Ask your friends";
  return (
    <View style={f.root}>
      <View style={f.fixedTools}>
        <View style={f.search}>
          <Pressable accessibilityRole="button" accessibilityLabel="Search experiences"
            onPress={onDiscover} style={{ flex: 1, flexDirection: "row", gap: 9, alignItems: "center", height: 43 }}>
            <Ionicons name="search" size={19} color={C.muted} />
            <Text style={{ color: C.muted, fontFamily: fonts.body, fontSize: 14 }}>Search experiences, places…</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Search members"
            onPress={() => { setMemberQuery(""); open({ kind: "friends" }); }} style={f.clear}>
            <Ionicons name="people-outline" size={21} color={C.green}/>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={onNearby}
          style={[f.shortcut, { flex: 0, alignSelf: "flex-start", paddingHorizontal: 14, marginTop: 12 }]}>
          <Ionicons name="navigate-outline" size={16} color={C.green}/>
          <Text style={f.shortcutText}>Recs Nearby</Text>
        </Pressable>
      </View>
      <ScrollView
        style={f.feed}
        contentContainerStyle={f.feedContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={f.feedLabel}>Your feed</Text>
          <View style={f.composerRow}>
            <Avatar id="you" />
            <Pressable
              accessibilityRole="button"
              onPress={() => open({ kind: "compose" })}
              style={f.composer}
            >
              <Text style={f.composerText}>Ask your friends for recs</Text>
              <Ionicons name="create-outline" size={20} color={C.green} />
            </Pressable>
          </View>
        {visiblePosts.map(renderPost)}
        {!visiblePosts.length && (
          <View style={f.empty}>
            <Ionicons name="people-outline" size={34} color={C.green}/>
            <Text style={f.emptyTitle}>Your feed is empty</Text>
            <Text style={f.emptyText}>Follow friends to see their activity here.</Text>
            {showExamples && <Pressable accessibilityRole="button" style={f.primary} onPress={() => open({ kind: "friends" })}>
              <Text style={f.primaryText}>Find friends</Text>
            </Pressable>}
          </View>
        )}
        {visiblePosts.length > 0 && <Text style={f.feedEnd}>You’re all caught up</Text>}
      </ScrollView>
      {!!notice && (
        <View style={f.toast} accessibilityLiveRegion="polite">
          <Text style={f.toastText}>{notice}</Text>
        </View>
      )}

      <Sheet
        visible={!!dialog}
        onClose={() => setDialog(null)}
        title={dialogTitle}
        contentBottomPadding={28}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={f.dialogContent}
        >
          {dialog?.kind === "friends" && (
            <>
              <View style={[f.search, f.dialogSearch]}>
                <Ionicons name="search" color={C.muted} size={19} />
                <TextInput
                  accessibilityLabel="Search members"
                  placeholder="Name or username"
                  placeholderTextColor={C.muted}
                  style={f.searchInput}
                  value={memberQuery}
                  onChangeText={setMemberQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              {(showExamples
                ? friends.filter((person) =>
                    `${person.name} ${person.handle}`
                      .toLowerCase()
                      .includes(memberQuery.trim().toLowerCase()),
                  )
                : []
              ).map((person) => renderMember(person.id))}
              {(!showExamples ||
                !friends.some((person) =>
                  `${person.name} ${person.handle}`
                    .toLowerCase()
                    .includes(memberQuery.trim().toLowerCase()),
                )) && (
                <Text style={f.emptyText}>
                  No members found. Try another name.
                </Text>
              )}
            </>
          )}
          {dialog?.kind === "profile" &&
            (() => {
              const person = friendById(dialog.id);
              const following = social.followed.includes(person.id);
              return (
                <>
                  <View style={f.profileTop}>
                    <Avatar id={person.id} large />
                    <View style={f.memberText}>
                      <Text style={f.profileName}>{person.name}</Text>
                      <Text style={f.subtitle}>
                        @{person.handle} · {person.city}
                      </Text>
                    </View>
                  </View>
                  <Text style={f.note}>{person.bio}</Text>
                  <View style={f.profileStats}>
                    <Text style={f.stat}>
                      <Text style={f.bold}>{person.rankedCount}</Text> been
                    </Text>
                    <Text style={f.stat}>
                      <Text style={f.bold}>{person.savedCount}</Text> want to
                      try
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${following ? "Unfollow" : "Follow"} ${person.name}`}
                    onPress={() => toggleFollow(person.id)}
                    style={[f.primary, following && f.followingPrimary]}
                  >
                    <Text
                      style={[f.primaryText, following && { color: C.green }]}
                    >
                      {following ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                  {friendCityGuides(person.id).length > 0 && <>
                    <Text style={[f.eyebrow, { marginTop: 16 }]}>City guides</Text>
                    {friendCityGuides(person.id).map(guide => <Pressable key={guide.key} accessibilityRole="button"
                      accessibilityLabel={`Open ${person.name}'s ${guide.city} guide`}
                      onPress={() => selectGuide(person.id, guide.key)} style={f.guideRow}>
                      <Ionicons name="map-outline" color={C.green} size={24}/>
                      <View style={f.memberText}><Text style={f.memberName}>{guide.city}</Text>
                        <Text style={f.subtitle}>{guide.entries.length} experiences · Personal ranking</Text></View>
                      <Ionicons name="chevron-forward" color={C.green} size={20}/>
                    </Pressable>)}
                  </>}
                  <Text style={[f.eyebrow, { marginTop: 16 }]}>
                    Recent activity
                  </Text>
                  <View style={f.profilePosts}>
                    {friendFeed
                      .filter((post) => post.authorId === person.id)
                      .map(renderPost)}
                  </View>
                </>
              );
            })()}
          {dialog?.kind === "comments" && (
            <>
              <Text style={f.dialogIntro}>{postTitle(dialog.post)}</Text>
              {dialog.post.comments.map((item) => (
                <View style={f.commentRow} key={item.id}>
                  <Avatar
                    id={item.authorId}
                    onPress={() => openProfile(item.authorId)}
                  />
                  <View style={f.memberText}>
                    <Text style={f.memberName}>
                      {friendById(item.authorId).name}
                    </Text>
                    <Text style={f.note}>{item.text}</Text>
                  </View>
                </View>
              ))}
              {(social.comments[dialog.post.id] ?? []).map((item) => (
                <View style={f.commentRow} key={item.id}>
                  <Avatar id="you" />
                  <View style={f.memberText}>
                    <Text style={f.memberName}>You</Text>
                    <Text style={f.note}>{item.text}</Text>
                  </View>
                </View>
              ))}
              {!dialog.post.comments.length &&
                !social.comments[dialog.post.id]?.length && (
                  <Text style={f.emptyText}>Start the conversation.</Text>
                )}
              <View style={f.commentInputRow}>
                <TextInput
                  accessibilityLabel="Write a comment"
                  placeholder="Write a comment…"
                  placeholderTextColor={C.muted}
                  style={f.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={600}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add comment"
                  disabled={!comment.trim() || !loaded}
                  style={[f.sendButton, !comment.trim() && f.disabled]}
                  onPress={() => {
                    const postId = dialog.post.id;
                    const text = comment.trim();
                    if (!text) return;
                    setSocial((value) => ({
                      ...value,
                      comments: {
                        ...value.comments,
                        [postId]: [
                          ...(value.comments[postId] ?? []),
                          { id: `comment-${Date.now()}`, text },
                        ],
                      },
                    }));
                    setComment("");
                  }}
                >
                  <Ionicons name="arrow-up" color={C.greenInk} size={22} />
                </Pressable>
              </View>
            </>
          )}
          {dialog?.kind === "share" && (
            <>
              <Text style={f.dialogIntro}>Send a little inspiration.</Text>
              <View style={f.sharePreview}>
                <Text selectable style={f.note}>
                  {shareText(dialog.post)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={f.primary}
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(shareText(dialog.post));
                    setCopied(true);
                  } catch {
                    setNotice(
                      "Could not copy. Select the text above to copy it.",
                    );
                  }
                }}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  color={C.greenInk}
                  size={19}
                />
                <Text style={f.primaryText}>
                  {copied ? "Copied" : "Copy to share"}
                </Text>
              </Pressable>
            </>
          )}
          {dialog?.kind === "compose" && (
            <>
              <Text style={f.dialogIntro}>
                Where are you going, and what sounds good?
              </Text>
              <Text style={f.fieldLabel}>City</Text>
              <TextInput
                accessibilityLabel="City for recommendations"
                style={f.fieldInput}
                value={requestCity}
                onChangeText={setRequestCity}
                placeholder="San Luis Obispo"
                placeholderTextColor={C.muted}
                maxLength={70}
              />
              <Text style={f.fieldLabel}>Your plan</Text>
              <TextInput
                accessibilityLabel="Recommendation request"
                style={[f.fieldInput, f.requestInput]}
                value={requestText}
                onChangeText={setRequestText}
                placeholder="A friend is visiting this weekend. Any favorite art stops or easy walks?"
                placeholderTextColor={C.muted}
                multiline
                maxLength={600}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!requestText.trim() || !requestCity.trim() || !loaded}
                style={[
                  f.primary,
                  (!requestText.trim() || !requestCity.trim()) && f.disabled,
                ]}
                onPress={() => {
                  const city = requestCity.trim();
                  const note = requestText.trim();
                  if (!city || !note) return;
                  const post: OwnRequest = {
                    id: `request-${Date.now()}`,
                    kind: "request",
                    authorId: "you",
                    city,
                    title: `Ideas for ${city}`,
                    timeLabel: "Just now",
                    note,
                    likes: 0,
                    comments: [],
                    suggestedExperienceIds: [],
                  };
                  setSocial((value) => ({
                    ...value,
                    requests: [post, ...value.requests],
                  }));
                  setRequestText("");
                  setDialog(null);
                }}
              >
                <Text style={f.primaryText}>Add to your feed</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </Sheet>
    </View>
  );
}

const f = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  fixedTools: {
    paddingHorizontal: 19,
    paddingTop: 2,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  search: {
    height: 43,
    borderRadius: 9,
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: C.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 10,
  },
  clear: {
    width: 30,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcuts: { flexDirection: "row", gap: 7, marginTop: 12 },
  shortcut: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 35,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#2b4d3f",
  },
  shortcutText: { color: C.green, fontFamily: fonts.medium, fontSize: 12 },
  feed: { flex: 1 },
  feedContent: { paddingBottom: 25 },
  feedLabel: {
    marginHorizontal: 20,
    marginTop: 19,
    marginBottom: 13,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: C.muted,
  },
  composerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 19,
    paddingBottom: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  composer: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 23,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
  },
  composerText: { color: C.muted, fontFamily: fonts.body, fontSize: 14 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: { fontFamily: fonts.bold, color: C.greenInk, fontSize: 14 },
  avatarLarge: { width: 66, height: 66, borderRadius: 33 },
  avatarTextLarge: { fontSize: 21 },
  post: {
    paddingHorizontal: 19,
    paddingTop: 19,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  postHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  postHeading: { flex: 1, minWidth: 0, paddingTop: 1 },
  postTitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: C.ink,
  },
  bold: { fontFamily: fonts.bold },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 17,
    color: C.muted,
    marginTop: 3,
  },
  score: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  scoreText: { fontFamily: fonts.bold, fontSize: 15, color: C.green },
  postBody: { marginTop: 14 },
  note: { color: C.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginLeft: -6,
    marginRight: -5,
  },
  actionGroup: { flexDirection: "row", alignItems: "center", gap: 1 },
  iconButton: {
    minWidth: 32,
    minHeight: 40,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  count: { color: C.muted, fontFamily: fonts.body, fontSize: 11 },
  timestamp: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  inlineLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 43,
    marginTop: 3,
  },
  link: { color: C.green, fontFamily: fonts.medium, fontSize: 13, flex: 1 },
  feedEnd: {
    textAlign: "center",
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    paddingTop: 25,
  },
  searchResults: { paddingHorizontal: 19, paddingTop: 18 },
  eyebrow: {
    color: C.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  memberText: { flex: 1, minWidth: 0 },
  memberName: {
    fontFamily: fonts.bold,
    color: C.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  followButton: {
    minHeight: 35,
    minWidth: 79,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  followActive: { backgroundColor: C.green, borderColor: C.green },
  followText: { fontFamily: fonts.medium, color: C.green, fontSize: 12 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  empty: {
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 35,
    paddingVertical: 42,
  },
  emptyTitle: {
    color: C.ink,
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 8,
  },
  dialogContent: { paddingHorizontal: 22, paddingBottom: 28, gap: 12 },
  dialogSearch: { marginBottom: 3 },
  dialogIntro: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  primary: {
    minHeight: 46,
    borderRadius: 24,
    backgroundColor: C.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 17,
    marginTop: 6,
  },
  primaryText: { color: C.greenInk, fontFamily: fonts.bold, fontSize: 14 },
  followingPrimary: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
  },
  profileTop: { flexDirection: "row", gap: 14, alignItems: "center" },
  profilePosts: { marginHorizontal: -22 },
  profileName: { color: C.ink, fontFamily: fonts.bold, fontSize: 22 },
  profileStats: { flexDirection: "row", gap: 23, paddingVertical: 6 },
  stat: { fontFamily: fonts.body, fontSize: 14, color: C.muted },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 19,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  commentRow: { flexDirection: "row", gap: 11, paddingVertical: 11 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    borderRadius: 16,
    backgroundColor: C.surface,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: C.ink,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.green,
  },
  fieldLabel: {
    color: C.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 5,
  },
  fieldInput: {
    color: C.ink,
    backgroundColor: C.surface,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  requestInput: { minHeight: 130, textAlignVertical: "top", lineHeight: 22 },
  sharePreview: { padding: 15, backgroundColor: C.surface, borderRadius: 12 },
  toast: {
    position: "absolute",
    bottom: 14,
    left: 19,
    right: 19,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.green,
  },
  toastText: {
    color: C.greenInk,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
