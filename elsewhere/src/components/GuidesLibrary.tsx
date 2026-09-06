import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts } from "../theme";
import type { CityGuide } from "../core/guides";

export default function GuidesLibrary({ guides, onOpen, onExplore }: {
  guides: readonly CityGuide[];
  onOpen: (city: string) => void;
  onExplore: () => void;
}) {
  const [city, setCity] = useState<string | null>(null);
  const visible = useMemo(() => guides.filter(guide => !city || guide.key === city), [guides, city]);
  return <View style={g.root}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.filters}>
      {[{ key: null, city: "All cities" }, ...guides].map(item => <Pressable key={item.key ?? "all"}
        accessibilityRole="button" accessibilityState={{ selected: city === item.key }}
        onPress={() => setCity(city === item.key ? null : item.key)}
        style={[g.chip, city === item.key && g.activeChip]}>
        <Text style={[g.chipText, city === item.key && { color: C.green }]}>{item.city}</Text>
      </Pressable>)}
    </ScrollView>
    <View style={g.headingRow}>
      <Text style={g.heading}>Your city guides</Text>
      <Text style={g.count}>{guides.length} {guides.length === 1 ? "city" : "cities"}</Text>
    </View>
    <View style={g.grid}>
      {visible.map(guide => <Pressable key={guide.key} accessibilityRole="button"
        accessibilityLabel={`Open your ${guide.city} guide, ${guide.entries.length} experiences`}
        onPress={() => onOpen(guide.key)} style={({ pressed }) => [g.card, pressed && { opacity: 0.75 }]}>
        <View style={g.cover}>
          <View style={g.coverHeader}><Text style={g.brand}>elsewhere</Text><Ionicons name="open-outline" size={18} color={C.green}/></View>
          <Ionicons name="map-outline" size={80} color="#45624a" style={g.watermark}/>
          <Text style={g.coverTitle}>{guide.city}</Text>
          <Text style={g.coverLabel}>YOUR GUIDE</Text>
        </View>
        <Text style={g.cardTitle}>{guide.city}</Text>
        <Text style={g.count}>{guide.entries.length} experiences · Your ranking</Text>
      </Pressable>)}
    </View>
    {!guides.length && <View style={g.empty}>
      <Ionicons name="map-outline" size={42} color={C.green}/>
      <Text style={g.heading}>No city guides yet</Text>
      <Text style={g.emptyText}>Rank a place you’ve been to. Your guide will appear here automatically.</Text>
      <Pressable accessibilityRole="button" onPress={onExplore} style={g.button}><Text style={g.buttonText}>Explore experiences</Text></Pressable>
    </View>}
  </View>;
}

const g = StyleSheet.create({
  root: { paddingBottom: 20 },
  filters: { paddingHorizontal: 22, gap: 8, paddingBottom: 22 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7 },
  activeChip: { backgroundColor: C.surface, borderColor: C.green },
  chipText: { color: C.muted, fontFamily: fonts.medium, fontSize: 12 },
  headingRow: { paddingHorizontal: 22, marginBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { color: C.ink, fontFamily: fonts.bold, fontSize: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, paddingHorizontal: 22 },
  card: { width: "47%", marginBottom: 12 },
  cover: { aspectRatio: 0.92, backgroundColor: C.surface, borderRadius: 9, padding: 13, overflow: "hidden", justifyContent: "flex-end", borderWidth: 1, borderColor: C.line },
  coverHeader: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: fonts.serif, fontSize: 14, color: C.green },
  watermark: { position: "absolute", top: 47, right: -6, transform: [{ rotate: "-12deg" }] },
  coverTitle: { color: C.ink, fontSize: 23, lineHeight: 27, fontFamily: fonts.bold },
  coverLabel: { color: C.green, fontSize: 9, fontFamily: fonts.bold, letterSpacing: 1.2, marginTop: 12 },
  cardTitle: { marginTop: 9, marginBottom: 3, color: C.ink, fontFamily: fonts.bold, fontSize: 14 },
  count: { color: C.muted, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
  empty: { padding: 30, gap: 14, alignItems: "center" },
  emptyText: { color: C.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: "center" },
  button: { backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 24 },
  buttonText: { color: C.greenInk, fontFamily: fonts.bold, fontSize: 14 },
});
