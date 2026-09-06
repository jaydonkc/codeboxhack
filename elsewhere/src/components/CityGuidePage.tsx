import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts } from "../theme";
import type { CityGuide } from "../core/guides";
import ExperienceMap from "./ExperienceMap";

export default function CityGuidePage({ guide, owner, savedIds, onBack, onShare, onExperience, onSave }: {
  guide: CityGuide | undefined;
  owner: string;
  savedIds: readonly string[];
  onBack: () => void;
  onShare: () => void;
  onExperience: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const [map, setMap] = useState(false);
  return <View style={g.page}>
    <View style={g.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back from city guide" onPress={onBack} style={g.icon}><Ionicons name="arrow-back" size={23} color={C.ink}/></Pressable>
      <Text style={g.eyebrow}>CITY GUIDE</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Share city guide" disabled={!guide} onPress={onShare} style={g.icon}><Ionicons name="share-outline" size={23} color={C.ink}/></Pressable>
    </View>
    <Text style={g.title}>{guide?.city ?? "City guide"}</Text>
    <Text style={g.subtitle}>{owner} · {guide?.entries.length ?? 0} experiences visited</Text>
    <View style={g.controls}>
      <Text style={g.sort}><Ionicons name="swap-vertical" size={14}/> Personal ranking</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={map ? "Show guide list" : "Show guide map"} style={g.mapButton} onPress={() => setMap(!map)}>
        <Ionicons name={map ? "list-outline" : "map-outline"} size={17} color={C.green}/><Text style={g.mapLabel}>{map ? "List" : "Map"}</Text>
      </Pressable>
    </View>
    {map && guide && <View style={g.map}><ExperienceMap items={guide.entries.map(entry => entry.experience)} selected={null} onSelect={onExperience}/></View>}
    {guide?.entries.map(({ experience, position, score }) => <View key={experience.id} style={g.row}>
      <Text style={g.position}>{position ?? "—"}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${experience.name}`} onPress={() => onExperience(experience.id)} style={g.activity}>
        <Text style={g.name}>{experience.name}</Text>
        <Text style={g.metadata}>{experience.activityType} · {experience.city}</Text>
        {score === null && <Text style={g.metadata}>Ranking in progress</Text>}
      </Pressable>
      {score !== null && <View style={g.scoreCircle}><Text style={g.score}>{score.toFixed(1)}</Text></View>}
      <Pressable accessibilityRole="button" accessibilityLabel={`${savedIds.includes(experience.id) ? "Unsave" : "Save"} ${experience.name}`} onPress={() => onSave(experience.id)} style={g.save}>
        <Ionicons name={savedIds.includes(experience.id) ? "bookmark" : "bookmark-outline"} size={20} color={C.green}/>
      </Pressable>
    </View>)}
    {!guide && <Text style={g.subtitle}>Visit and rank an experience to see its city guide here.</Text>}
  </View>;
}

const g = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingBottom: 24 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: C.muted, fontFamily: fonts.bold, letterSpacing: 1, fontSize: 11 },
  title: { color: C.ink, fontFamily: fonts.serif, fontSize: 36, lineHeight: 41, marginBottom: 8 },
  subtitle: { color: C.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 22 },
  controls: { marginTop: 22, marginBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sort: { color: C.green, fontFamily: fonts.medium, fontSize: 12 },
  mapButton: { flexDirection: "row", gap: 6, alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  mapLabel: { fontFamily: fonts.medium, fontSize: 12, color: C.green },
  map: { marginVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, gap: 9 },
  position: { width: 17, fontSize: 13, fontFamily: fonts.medium, color: C.muted },
  activity: { flex: 1, minWidth: 0 },
  name: { color: C.ink, fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  metadata: { color: C.muted, fontFamily: fonts.body, fontSize: 11, lineHeight: 17, marginTop: 3 },
  scoreCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  score: { fontFamily: fonts.bold, color: C.green, fontSize: 14 },
  save: { width: 28, height: 40, alignItems: "center", justifyContent: "center" },
});
