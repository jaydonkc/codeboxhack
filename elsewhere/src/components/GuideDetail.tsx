import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts } from "../theme";
import { byId, priceLabel } from "../data/catalog";
import { getActivityPhotos } from "../data/activityPhotos";
import { type ExperienceGuide } from "../data/guides";

type Props = {
  guide: ExperienceGuide;
  personal: boolean;
  saved: string[];
  map: boolean;
  mapView: React.ReactNode;
  onBack: () => void;
  onShare: () => void;
  onMap: () => void;
  onSaveAll: () => void;
  onSave: (id: string) => void;
  onOpen: (id: string) => void;
  onMoveUp: (index: number) => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onAdd: () => void;
};

function Action({ icon, label, accessibilityLabel, onPress, disabled = false, active = false }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={[d.action, active && d.activeAction, disabled && { opacity: 0.45 }]}>
    <Ionicons name={icon} size={17} color={active ? C.greenInk : C.ink} />
    <Text style={[d.actionText, active && { color: C.greenInk }]}>{label}</Text>
  </Pressable>;
}

export default function GuideDetail(props: Props) {
  const { guide, personal, saved } = props;
  const [editing, setEditing] = useState(false);
  const photo = getActivityPhotos(guide.coverId)[0];
  const allSaved = guide.experienceIds.length > 0 && guide.experienceIds.every((id) => saved.includes(id));
  return <View>
    <View style={d.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to guides" onPress={props.onBack} style={d.back}>
        <Ionicons name="chevron-back" size={22} color={C.ink} /><Text style={d.backText}>Guides</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Share guide" onPress={props.onShare} style={d.icon}>
        <Ionicons name="share-outline" size={22} color={C.ink} />
      </Pressable>
    </View>
    <View style={d.body}>
      <View style={d.cover}>
        {photo && <Image source={photo.source} accessibilityLabel={photo.alt} style={d.coverImage} />}
        <View style={d.shade} />
        <Text style={d.city}>{guide.city}</Text>
        <Text style={d.title}>{guide.title}</Text>
      </View>
      <View style={d.byline}>
        {personal ? (
          <Image source={require("../../assets/profile/jaydon-beli.png")} accessibilityLabel="Your profile photo" style={d.avatar} resizeMode="cover" />
        ) : (
          <View style={d.avatar}><Ionicons name={guide.author === "Emma" ? "person-outline" : "compass-outline"} size={17} color={C.green} /></View>
        )}
        <Text style={d.author}>{personal ? "By you" : `By ${guide.author}`}</Text>
        <Text style={d.meta}>·  {guide.experienceIds.length} experiences</Text>
      </View>
      <Text style={d.description}>{guide.description}</Text>
      <View style={d.actions}>
        {personal ? <Action icon={editing ? "checkmark" : "create-outline"} label={editing ? "Done editing" : "Edit guide"} active={editing} onPress={() => setEditing(!editing)} /> :
          <Action icon={allSaved ? "bookmark" : "bookmark-outline"} label={allSaved ? "All saved" : "Save all"} active={allSaved} disabled={!guide.experienceIds.length || allSaved} onPress={props.onSaveAll} />}
        <Action icon={props.map ? "list-outline" : "map-outline"} label={props.map ? "List" : "Map"} disabled={!guide.experienceIds.length} onPress={props.onMap} />
      </View>
      {props.map && props.mapView}
      <View style={d.listHeader}><Text style={d.listTitle}>The places</Text>
        {personal && <Pressable accessibilityRole="button" accessibilityLabel="Add experiences to guide" onPress={props.onAdd} style={d.add}>
          <Ionicons name="add" size={19} color={C.green} /><Text style={d.link}>Add</Text>
        </Pressable>}
      </View>
      {guide.experienceIds.map((id, index) => {
        const experience = byId(id);
        const thumbnail = getActivityPhotos(id)[0];
        const isSaved = saved.includes(id);
        return <View key={id} style={d.place}>
          <View style={d.placeRow}>
            <Text style={d.rank}>{index + 1}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`View ${experience.name}`} onPress={() => props.onOpen(id)} style={d.placeLink}>
              {thumbnail && <Image source={thumbnail.source} accessibilityLabel={thumbnail.alt} style={d.thumbnail} />}
              <View style={d.placeCopy}>
                <Text style={d.placeName} numberOfLines={2}>{experience.name}</Text>
                <Text style={d.meta} numberOfLines={1}>{experience.venue}</Text>
                <Text style={d.meta}>{priceLabel(experience)}</Text>
              </View>
            </Pressable>
            {!editing && <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved ? "Unsave" : "Save"} ${experience.name}`}
              accessibilityState={{ selected: isSaved }} onPress={() => props.onSave(id)} style={d.icon}>
              <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? C.green : C.muted} />
            </Pressable>}
          </View>
          {personal && editing ? <>
            <View style={d.editActions}>
              <Action icon="arrow-up" label="Move up" accessibilityLabel={`Move ${experience.name} up`} disabled={index === 0} onPress={() => props.onMoveUp(index)} />
              <Action icon="close" label="Remove" accessibilityLabel={`Remove ${experience.name} from guide`} onPress={() => props.onRemove(id)} />
            </View>
            <TextInput accessibilityLabel={`Guide note for ${experience.name}`} placeholder="Why recommend it?" placeholderTextColor={C.muted}
              value={guide.notes[id] || ""} onChangeText={(note) => props.onNote(id, note)} style={d.noteInput} multiline />
          </> : !!guide.notes[id] && <Text style={d.note}>{guide.notes[id]}</Text>}
        </View>;
      })}
      {!guide.experienceIds.length && <View style={d.empty}>
        <Text style={d.listTitle}>Add your first experience</Text>
        <Text style={d.description}>Open an experience you’ve been to and add it to this guide.</Text>
        <Action icon="add" label="Browse experiences" onPress={props.onAdd} />
      </View>}
      {photo && <Text style={d.credit}>Cover: {photo.credit}</Text>}
    </View>
  </View>;
}

const d = StyleSheet.create({
  navigation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
  back: { flexDirection: "row", alignItems: "center", minHeight: 44, paddingRight: 12, gap: 3 },
  backText: { color: C.ink, fontFamily: fonts.medium, fontSize: 16 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20 },
  cover: { height: 182, backgroundColor: C.surface, borderRadius: 12, overflow: "hidden", justifyContent: "flex-end", padding: 18 },
  coverImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)" },
  city: { color: "#fff", fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginBottom: 5 },
  title: { color: "#fff", fontFamily: fonts.bold, fontSize: 27, lineHeight: 32 },
  byline: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 9, flexWrap: "wrap" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.lifted },
  author: { color: C.ink, fontFamily: fonts.medium, fontSize: 13 },
  meta: { color: C.muted, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
  description: { color: C.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", gap: 10, marginTop: 17, marginBottom: 12 },
  action: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: C.line, borderRadius: 9, minHeight: 42, paddingHorizontal: 15 },
  activeAction: { backgroundColor: C.green, borderColor: C.green },
  actionText: { color: C.ink, fontFamily: fonts.medium, fontSize: 13 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46, borderBottomWidth: 1, borderColor: C.line },
  listTitle: { color: C.ink, fontFamily: fonts.bold, fontSize: 16 },
  add: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 8 },
  link: { color: C.green, fontFamily: fonts.medium, fontSize: 14 },
  place: { borderBottomWidth: 1, borderColor: C.line, paddingVertical: 16 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  rank: { width: 13, color: C.muted, fontFamily: fonts.medium, fontSize: 12 },
  placeLink: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 11 },
  thumbnail: { width: 60, height: 66, borderRadius: 7, backgroundColor: C.surface },
  placeCopy: { flex: 1, gap: 3, minWidth: 0 },
  placeName: { color: C.ink, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  note: { color: C.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginTop: 10, marginLeft: 22 },
  editActions: { flexDirection: "row", gap: 10, marginTop: 12, marginLeft: 22 },
  noteInput: { color: C.ink, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginTop: 10, padding: 12, borderRadius: 8, backgroundColor: C.surface, minHeight: 62 },
  empty: { gap: 12, paddingVertical: 28, alignItems: "flex-start" },
  credit: { color: C.muted, fontFamily: fonts.body, fontSize: 10, lineHeight: 15, marginTop: 20 },
});
