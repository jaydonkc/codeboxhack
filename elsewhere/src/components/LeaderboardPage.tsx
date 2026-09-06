import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C, fonts } from "../theme";
import { friends, friendById, type FriendId } from "../data/friends";
import { friendCityGuides } from "../data/friendGuides";
import type { CityGuide } from "../core/guides";
import { rankVisitors } from "../core/leaderboard";
import Sheet from "./Sheet";

export type LeaderboardPageProps = {
  guides: readonly CityGuide[];
  showExamples: boolean;
  onGuide: (owner: FriendId | "you", city?: string) => void;
  onYou: () => void;
};

const STORAGE_KEY = "elsewhere-friends-v1";
type Dialog = "members" | "city" | FriendId | null;

export default function LeaderboardPage({ guides, showExamples, onGuide, onYou }: LeaderboardPageProps) {
  const [audience, setAudience] = useState<"All Members" | "Friends">("All Members");
  const [city, setCity] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [followed, setFollowed] = useState<FriendId[]>(friends.map(friend => friend.id));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!alive || !raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.followed)) setFollowed(data.followed.filter((id: FriendId) => friends.some(friend => friend.id === id)));
    }).catch(() => { if (alive) setError("Couldn’t load your friends. Try again later."); })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const visitors = useMemo(() => [
    { id: "you", name: "You", handle: "you", initials: "Y", color: C.green, guides },
    ...(showExamples ? friends.map(friend => ({ ...friend, guides: friendCityGuides(friend.id) })) : []),
  ], [guides, showExamples]);
  const cities = [...new Map(visitors.flatMap(visitor => visitor.guides).map(guide => [guide.key, guide.city])).entries()];
  const rows = rankVisitors(visitors.filter(visitor => audience === "All Members" || visitor.id === "you" || followed.includes(visitor.id as FriendId)), city);
  const selectedMember = dialog && dialog !== "members" && dialog !== "city" ? friendById(dialog) : null;
  const memberGuides = selectedMember ? friendCityGuides(selectedMember.id) : [];
  const memberCount = new Set(memberGuides.flatMap(guide => guide.entries.map(entry => entry.experience.id))).size;

  async function toggleFollow(id: FriendId) {
    if (!loaded || saving) return;
    setSaving(true);
    setError("");
    const next = followed.includes(id) ? followed.filter(friend => friend !== id) : [...followed, id];
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const previous = raw ? JSON.parse(raw) : { placeholderVersion: 1, likes: [], comments: {}, requests: [] };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...previous, followed: next }));
      setFollowed(next);
    } catch {
      setError("Couldn’t save that change. Please try again.");
    } finally { setSaving(false); }
  }

  return <View style={l.root}>
    <View style={l.header}>
      <Text style={l.title}>Leaderboard</Text>
      <View style={l.metric}><Text style={l.metricText}>Been</Text></View>
      <Text style={l.description}>Number of places you’ve been</Text>
      <View style={l.filters}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Leaderboard members: ${audience}`} onPress={() => setDialog("members")} style={l.pill}>
          <Text style={l.pillText}>{audience}</Text><Ionicons name="chevron-down" size={15} color={C.green}/>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Leaderboard city: ${cities.find(([key]) => key === city)?.[1] ?? "All cities"}`} onPress={() => setDialog("city")} style={l.pill}>
          <Text numberOfLines={1} style={l.cityText}>{cities.find(([key]) => key === city)?.[1] ?? "All cities"}</Text><Ionicons name="chevron-down" size={15} color={C.green}/>
        </Pressable>
      </View>
    </View>
    <ScrollView contentContainerStyle={l.list}>
      {rows.map(row => <Pressable key={row.id} accessibilityRole="button"
        accessibilityLabel={`${row.name}, rank ${row.rank}, ${row.count} places visited`}
        onPress={() => row.id === "you" ? onYou() : setDialog(row.id as FriendId)}
        style={({ pressed }) => [l.row, row.id === "you" && l.youRow, pressed && { opacity: 0.7 }]}>
        <Text style={l.rank}>{row.rank}</Text>
        <View style={[l.avatar, { backgroundColor: row.color }]}><Text style={l.initials}>{row.initials}</Text></View>
        <Text style={l.handle}>{row.id === "you" ? "You" : `@${row.handle}`}</Text>
        <Text style={l.visits}>{row.count}</Text>
      </Pressable>)}
      {!rows.length && <View style={l.empty}><Ionicons name="people-outline" size={38} color={C.green}/><Text style={l.description}>No visits here yet.</Text></View>}
      {!!error && <Text accessibilityRole="alert" style={l.error}>{error}</Text>}
    </ScrollView>

    <Sheet visible={!!dialog} onClose={() => setDialog(null)} title={dialog === "members" ? "Show members" : dialog === "city" ? "Choose city" : "Profile"}>
      <ScrollView contentContainerStyle={l.sheet}>
        {dialog === "members" && (["All Members", "Friends"] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: audience === value }} onPress={() => { setAudience(value); setDialog(null); }} style={l.option}>
          <Text style={l.optionText}>{value}</Text>{audience === value && <Ionicons name="checkmark" size={22} color={C.green}/>}</Pressable>)}
        {dialog === "city" && [[null, "All cities"], ...cities].map(([key, label]) => <Pressable key={key ?? "all"} accessibilityRole="button" accessibilityState={{ selected: city === key }} onPress={() => { setCity(key); setDialog(null); }} style={l.option}>
          <Text style={l.optionText}>{label}</Text>{city === key && <Ionicons name="checkmark" size={22} color={C.green}/>}</Pressable>)}
        {selectedMember && <>
          <View style={l.profileHeader}><View style={[l.largeAvatar, { backgroundColor: selectedMember.color }]}><Text style={l.largeInitials}>{selectedMember.initials}</Text></View>
            <View style={l.profileIdentity}><Text style={l.memberName}>{selectedMember.name}</Text><Text style={l.description}>@{selectedMember.handle}</Text></View></View>
          <Text style={l.bio}>{selectedMember.bio}</Text>
          <View style={l.stats}><Text style={l.description}><Text style={l.statNumber}>{memberCount}</Text> been</Text><Text style={l.description}><Text style={l.statNumber}>{selectedMember.savedCount}</Text> want to try</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${followed.includes(selectedMember.id) ? "Unfollow" : "Follow"} ${selectedMember.name}`} disabled={!loaded || saving} onPress={() => void toggleFollow(selectedMember.id)} style={l.follow}>
            <Text style={l.followText}>{followed.includes(selectedMember.id) ? "Following" : "Follow"}</Text></Pressable>
          <Text style={l.sectionTitle}>City guides</Text>
          {memberGuides.map(guide => <Pressable key={guide.key} accessibilityRole="button" accessibilityLabel={`Open ${selectedMember.name}'s ${guide.city} guide`}
            onPress={() => { setDialog(null); onGuide(selectedMember.id, guide.key); }} style={l.option}>
            <Ionicons name="map-outline" size={24} color={C.green}/><View style={l.guideIdentity}><Text style={l.optionText}>{guide.city}</Text><Text style={l.description}>{guide.entries.length} experiences · Personal ranking</Text></View><Ionicons name="chevron-forward" color={C.green} size={20}/>
          </Pressable>)}
          {!!error && <Text accessibilityRole="alert" style={l.error}>{error}</Text>}
        </>}
      </ScrollView>
    </Sheet>
  </View>;
}

const l = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 12 },
  title: { color: C.ink, fontFamily: fonts.serif, fontSize: 34, marginBottom: 23 },
  metric: { alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 25, backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.line, marginBottom: 12 },
  metricText: { color: C.ink, fontFamily: fonts.bold, fontSize: 12 },
  description: { color: C.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 19 },
  filters: { flexDirection: "row", gap: 8, marginTop: 13 },
  pill: { maxWidth: "60%", borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  pillText: { color: C.green, fontFamily: fonts.bold, fontSize: 12 },
  cityText: { color: C.green, fontFamily: fonts.bold, fontSize: 12, flexShrink: 1 },
  list: { paddingHorizontal: 14, paddingBottom: 28 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 64, gap: 12, paddingHorizontal: 10, borderRadius: 10 },
  youRow: { backgroundColor: C.surface },
  rank: { width: 19, color: C.muted, fontFamily: fonts.medium, fontSize: 12 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  initials: { color: C.greenInk, fontFamily: fonts.bold, fontSize: 11 },
  handle: { flex: 1, color: C.muted, fontFamily: fonts.medium, fontSize: 14 },
  visits: { color: C.ink, fontFamily: fonts.bold, fontSize: 15, minWidth: 30, textAlign: "right" },
  empty: { alignItems: "center", gap: 15, paddingVertical: 40 },
  error: { color: C.coral, fontFamily: fonts.body, fontSize: 13, paddingVertical: 15 },
  sheet: { paddingHorizontal: 22, paddingBottom: 26 },
  option: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  optionText: { flex: 1, color: C.ink, fontFamily: fonts.medium, fontSize: 15 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 17 },
  largeAvatar: { width: 65, height: 65, borderRadius: 33, alignItems: "center", justifyContent: "center" },
  largeInitials: { color: C.greenInk, fontFamily: fonts.bold, fontSize: 22 },
  profileIdentity: { flex: 1, gap: 5 },
  memberName: { fontFamily: fonts.bold, fontSize: 23, color: C.ink },
  bio: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: C.ink, marginBottom: 16 },
  stats: { flexDirection: "row", gap: 28, marginBottom: 20 },
  statNumber: { fontFamily: fonts.bold, color: C.ink, fontSize: 18 },
  follow: { borderRadius: 24, borderWidth: 1, borderColor: C.green, paddingVertical: 12, alignItems: "center" },
  followText: { color: C.green, fontFamily: fonts.bold, fontSize: 14 },
  sectionTitle: { color: C.ink, fontFamily: fonts.bold, fontSize: 18, marginTop: 24 },
  guideIdentity: { flex: 1, gap: 4 },
});
