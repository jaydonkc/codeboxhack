import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts } from "../theme";
import { getActivityPhotos } from "../data/activityPhotos";
import { type ExperienceGuide } from "../data/guides";
import { byId } from "../data/catalog";
import { demoFriendActivity } from "../data/friends";

export type FriendsTab = "activity" | "guides" | "mine";

export function GuideCover({ guide, onPress, compact = false }: {
  guide: ExperienceGuide;
  onPress: () => void;
  compact?: boolean;
}) {
  const photo = getActivityPhotos(guide.coverId)[0];
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={`Open ${guide.title}, ${guide.experienceIds.length} experiences, by ${guide.author}`}
      onPress={onPress} style={({ pressed }) => [g.card, compact && g.compact, pressed && g.pressed]}>
      <View style={[g.cover, compact && g.compactCover]}>
        {photo ? <Image source={photo.source} accessibilityLabel={photo.alt} style={g.image} /> :
          <View style={g.placeholder}><Ionicons name="book-outline" size={32} color={C.green} /></View>}
        <View style={g.shade} />
        <Text numberOfLines={3} style={g.coverTitle}>{guide.title}</Text>
      </View>
      <View style={g.caption}>
        <Text style={g.author} numberOfLines={1}>{guide.author === "You" ? "Your collection" : `By ${guide.author}`}</Text>
        <Text style={g.meta}>{guide.experienceIds.length} experiences</Text>
      </View>
    </Pressable>
  );
}

export default function FriendsPage({ guides, personal, created, onCreate, demoSocial, tab, onTab, onOpenGuide, onOpenActivity }: {
  guides: ExperienceGuide[];
  personal: ExperienceGuide;
  created: boolean;
  onCreate: () => void;
  demoSocial: boolean;
  tab: FriendsTab;
  onTab: (tab: FriendsTab) => void;
  onOpenGuide: (id: string) => void;
  onOpenActivity: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const available = tab === "mine" ? (created ? [personal] : []) : guides;
  const filteredGuides = available.filter((guide) =>
    `${guide.title} ${guide.author} ${guide.city}`.toLowerCase().includes(search));
  return (
    <View style={g.page}>
      <View style={g.section}>
        <Text style={g.title}>Friends</Text>
      </View>
      <View style={g.tabs}>
        {([["activity", "Activity"], ["guides", "Friends’ guides"], ["mine", "My guides"]] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }}
            onPress={() => { setQuery(""); onTab(value); }} style={[g.tab, tab === value && g.activeTab]}>
            <Text style={[g.tabText, tab === value && g.activeTabText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === "activity" ? (
        demoSocial ? <View style={g.feed}>
          {demoFriendActivity.map((activity) => {
            const experience = byId(activity.experienceId);
            const photo = getActivityPhotos(experience.id)[0];
            return <Pressable key={activity.id} accessibilityRole="button"
              accessibilityLabel={`${activity.friend} rated ${experience.venue} ${activity.score.toFixed(1)}. Open experience`}
              onPress={() => onOpenActivity(experience.id)} style={({ pressed }) => [g.feedCard, pressed && g.pressed]}>
              <View style={g.feedHeading}>
                <View style={g.avatar}><Text style={g.initial}>{activity.friend[0]}</Text></View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={g.friendName}>{activity.friend}</Text>
                  <Text style={g.meta}>Visited · {activity.when}</Text>
                </View>
                <View style={g.rating}><Text style={g.ratingText}>{activity.score.toFixed(1)}</Text></View>
              </View>
              <View style={g.experienceRow}>
                {photo && <Image source={photo.source} accessibilityLabel={photo.alt} style={g.feedPhoto} resizeMode="cover" />}
                <View style={g.experienceInfo}>
                  <Text style={g.experienceTitle}>{experience.venue}</Text>
                  <Text style={g.meta}>{experience.activityType} · {experience.city}</Text>
                </View>
              </View>
              <Text style={g.note}>{activity.note}</Text>
            </Pressable>;
          })}
        </View> : <View style={g.empty}>
          <Ionicons name="people-outline" size={30} color={C.green} />
          <Text style={g.emptyTitle}>No friend activity yet</Text>
          <Text style={g.emptyText}>Friends’ visits and ratings will appear here. Turn on Example social data in About Elsewhere to preview the feed.</Text>
        </View>
      ) : <>
        {!!available.length && <View style={g.search}>
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput accessibilityLabel={tab === "mine" ? "Search my guides" : "Search friends’ guides"} placeholder={tab === "mine" ? "Search my guides" : "Search guides or friends"} placeholderTextColor={C.muted}
            value={query} onChangeText={setQuery} style={g.input} autoCorrect={false} />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear guide search" onPress={() => setQuery("")} style={g.clear}>
            <Ionicons name="close" size={19} color={C.muted} />
          </Pressable>}
        </View>}
        {!!filteredGuides.length && <>
          <View style={g.section}>
            <Text style={g.sectionTitle}>{tab === "mine" ? "Made by you" : "From your friends"}</Text>
            <Text style={g.meta}>{filteredGuides.length} {filteredGuides.length === 1 ? "guide" : "guides"}</Text>
          </View>
          <View style={g.grid}>
            {filteredGuides.map((guide) => <View key={guide.id} style={g.cell}>
              <GuideCover guide={guide} onPress={() => onOpenGuide(guide.id)} />
            </View>)}
          </View>
        </>}
        {!filteredGuides.length && <View style={g.empty}>
          <Ionicons name={search ? "search-outline" : "book-outline"} size={30} color={C.green} />
          <Text style={g.emptyTitle}>{search ? "No guides found" : tab === "mine" ? "Your favorites, together" : "No friend guides yet"}</Text>
          <Text style={g.emptyText}>{search ? "Try a different title or friend." : tab === "mine" ? "Start a guide with the experiences you’ve liked. Add your notes and share it." : "Your friends’ collections will appear here."}</Text>
          {!search && tab === "mine" && <Pressable accessibilityRole="button" onPress={onCreate} style={g.action}>
            <Text style={g.actionText}>Create my guide</Text>
          </Pressable>}
        </View>}
      </>}
    </View>
  );
}

const g = StyleSheet.create({
  feed: { gap: 18 },
  feedCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 8 },
  feedHeading: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 6 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.purpleBg, alignItems: "center", justifyContent: "center" },
  initial: { color: C.purple, fontFamily: fonts.bold, fontSize: 18 },
  friendName: { color: C.ink, fontFamily: fonts.bold, fontSize: 15 },
  rating: { borderWidth: 1.5, borderColor: C.green, borderRadius: 23, width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  ratingText: { color: C.green, fontFamily: fonts.bold, fontSize: 18 },
  experienceTitle: { color: C.ink, fontFamily: fonts.bold, fontSize: 19, lineHeight: 25 },
  note: { color: C.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginVertical: 4 },
  experienceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  experienceInfo: { flex: 1, minWidth: 0, gap: 4 },
  feedPhoto: { width: 72, height: 72, flexShrink: 0, borderRadius: 10 },
  page: { paddingHorizontal: 20, paddingTop: 4 },
  title: { color: C.ink, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, marginBottom: 10 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: C.line, marginBottom: 16 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48, paddingHorizontal: 4, borderBottomWidth: 2, borderColor: "transparent" },
  activeTab: { borderColor: C.green },
  tabText: { color: C.muted, fontFamily: fonts.medium, fontSize: 14, textAlign: "center" },
  activeTabText: { color: C.ink, fontFamily: fonts.bold },
  search: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 10, paddingLeft: 13, minHeight: 44, gap: 9, marginBottom: 21 },
  input: { color: C.ink, fontFamily: fonts.body, fontSize: 14, flex: 1, minWidth: 0, paddingVertical: 11 },
  clear: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 },
  sectionTitle: { color: C.ink, fontFamily: fonts.bold, fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, rowGap: 22 },
  cell: { width: "50%", paddingHorizontal: 6 },
  card: { gap: 9 },
  pressed: { opacity: 0.75 },
  cover: { aspectRatio: 0.96, borderRadius: 10, overflow: "hidden", backgroundColor: C.surface, justifyContent: "flex-end" },
  image: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.3)" },
  coverTitle: { color: "#fff", fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, padding: 13, paddingTop: 28, backgroundColor: "rgba(0,0,0,0.23)", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  caption: { gap: 3 },
  author: { color: C.ink, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  meta: { color: C.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  compact: { flexDirection: "row", alignItems: "center", gap: 14 },
  compactCover: { width: 150, aspectRatio: 1.2 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 42, paddingHorizontal: 12 },
  emptyTitle: { color: C.ink, fontFamily: fonts.bold, fontSize: 20, textAlign: "center" },
  emptyText: { color: C.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: "center" },
  action: { backgroundColor: C.green, paddingVertical: 13, paddingHorizontal: 23, borderRadius: 10, marginTop: 8 },
  actionText: { color: C.greenInk, fontFamily: fonts.bold, fontSize: 14 },
});
