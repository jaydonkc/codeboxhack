import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts } from "../theme";
import { getActivityPhotos } from "../data/activityPhotos";
import { type ExperienceGuide } from "../data/guides";

export type GuideLibraryTab = "explore" | "mine";

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

export default function GuideLibrary({ examples, personal, created, tab, onTab, onOpen, onCreate }: {
  examples: ExperienceGuide[];
  personal: ExperienceGuide;
  created: boolean;
  tab: GuideLibraryTab;
  onTab: (tab: GuideLibraryTab) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const available = tab === "mine" ? (created ? [personal] : []) : examples;
  const search = query.trim().toLowerCase();
  const guides = available.filter((guide) =>
    `${guide.title} ${guide.author} ${guide.city}`.toLowerCase().includes(search));
  return (
    <View style={g.page}>
      <Text style={g.title}>Friends</Text>
      <View style={g.tabs}>
        {([ ["explore", "Explore"], ["mine", "My guide"] ] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }}
            onPress={() => { setQuery(""); onTab(value); }} style={[g.tab, tab === value && g.activeTab]}>
            <Text style={[g.tabText, tab === value && g.activeTabText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!!available.length && <View style={g.search}>
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput accessibilityLabel="Search guides" placeholder="Search guides" placeholderTextColor={C.muted}
          value={query} onChangeText={setQuery} style={g.input} autoCorrect={false} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear guide search" onPress={() => setQuery("")} style={g.clear}>
          <Ionicons name="close" size={19} color={C.muted} />
        </Pressable>}
      </View>}
      {!!guides.length && <>
        <View style={g.section}>
          <Text style={g.sectionTitle}>{tab === "mine" ? "Made by you" : "San Luis Obispo"}</Text>
          <Text style={g.meta}>{guides.length} {guides.length === 1 ? "guide" : "guides"}</Text>
        </View>
        <View style={g.grid}>
          {guides.map((guide) => <View key={guide.id} style={g.cell}>
            <GuideCover guide={guide} onPress={() => onOpen(guide.id)} />
          </View>)}
        </View>
      </>}
      {!guides.length && <View style={g.empty}>
        <Ionicons name={search ? "search-outline" : "book-outline"} size={30} color={C.green} />
        <Text style={g.emptyTitle}>{search ? "No guides found" : tab === "mine" ? "Your favorites, together" : "No guides to explore yet"}</Text>
        <Text style={g.emptyText}>{search ? "Try a different title or creator." : tab === "mine"
          ? "Start a guide with the experiences you’ve liked. Add your notes and share it."
          : "You can still make a guide of your own."}</Text>
        {!search && <Pressable accessibilityRole="button" onPress={tab === "mine" ? onCreate : () => onTab("mine")} style={g.action}>
          <Text style={g.actionText}>{tab === "mine" ? "Create my guide" : "My guide"}</Text>
        </Pressable>}
      </View>}
    </View>
  );
}

const g = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 4 },
  title: { color: C.ink, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, marginBottom: 10 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: C.line, marginBottom: 16 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, borderBottomWidth: 2, borderColor: "transparent" },
  activeTab: { borderColor: C.green },
  tabText: { color: C.muted, fontFamily: fonts.medium, fontSize: 15 },
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
