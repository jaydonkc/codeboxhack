import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { photosForPlace } from "../core/photos";
import { type PlacePhoto } from "../data/placePhotos";
import { usePhotos } from "../services/PhotoProvider";
import { usePhotoDraft } from "../services/usePhotoDraft";
import { usePlaceGallery } from "../services/usePlaceGallery";
import PhotoPicker from "./PhotoPicker";
import Sheet from "./Sheet";
import { C, fonts } from "../theme";

type Gallery = ReturnType<typeof usePlaceGallery>;
export function PhotoImage({ photo, label, contain = false, style }: { photo: PlacePhoto; label: string; contain?: boolean; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo.source]);
  return <View style={[g.image, style]}>
    {photo.source && !failed ? <Image source={photo.source} resizeMode={contain ? "contain" : "cover"} accessibilityLabel={label} style={g.image} onError={() => setFailed(true)} /> : <View style={g.fallback}>
      <Ionicons name="image-outline" size={30} color={C.muted} /><Text style={g.muted}>{failed ? "Photo unavailable" : "Photo"}</Text>
    </View>}
  </View>;
}
export function PhotoCredit({ photo, license = false }: { photo: PlacePhoto; license?: boolean }) {
  return <View style={g.credits}>
    {photo.googleIndex !== undefined && <Text style={g.credit}>Google Maps</Text>}
    {photo.authors.map((author, i) => author.url ? <Text key={i} accessibilityRole="link" onPress={() => void Linking.openURL(author.url!).catch(() => {})} style={g.credit}>{author.name}</Text> : <Text key={i} style={g.credit}>{author.name}</Text>)}
    {license && photo.license && <Text accessibilityRole="link" style={g.credit} onPress={() => void Linking.openURL(photo.license!.url).catch(() => {})}>{photo.license.name}</Text>}
  </View>;
}

export default function PlaceGallery({ placeId, placeName, gallery, openIndex, onOpen, onClose }: {
  placeId: string; placeName: string; gallery: Gallery; openIndex: number | null; onOpen: (index: number) => void; onClose: () => void;
}) {
  const { photos, remoteError, loading, load } = gallery;
  const storage = usePhotos();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = usePhotoDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const index = Math.min(openIndex ?? 0, Math.max(0, photos.length - 1));
  const photo = photos[index];
  useEffect(() => { setConfirmDelete(false); setError(""); if (openIndex !== null && photo?.googleIndex !== undefined) void load(photo.googleIndex); }, [openIndex, photo?.id]);
  const move = (direction: number) => { if (!deleting && index + direction >= 0 && index + direction < photos.length) onOpen(index + direction); };
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 25,
    onPanResponderRelease: (_, gesture) => { if (Math.abs(gesture.dx) > 40) move(gesture.dx < 0 ? 1 : -1); },
  }), [index, photos.length, deleting]);
  function add() { setDraft([]); setError(""); setAdding(true); }
  async function save() {
    if (saving || !draft.length) return;
    setSaving(true); setError("");
    try { await storage.add(placeId, draft); setDraft([]); setAdding(false); }
    catch (e) { setError(e instanceof Error && /Choose|photos per place|loading/.test(e.message) ? e.message : "Photos could not be saved. Check available storage and try again."); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!photo?.owned || deleting) return;
    setDeleting(true); setError("");
    try { await storage.remove(photo.id); setConfirmDelete(false); if (photos.length === 1) onClose(); else onOpen(Math.min(index, photos.length - 2)); }
    catch { setError("Photo could not be removed. Try again."); }
    finally { setDeleting(false); }
  }
  return <>
    <View style={g.section}>
      <View style={g.heading}>
        <Text style={g.title} accessibilityRole="header">Photos{photos.length ? ` (${photos.length})` : ""}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Add photos to this place" onPress={add} style={g.textButton}><Ionicons name="camera-outline" color={C.green} size={19} /><Text style={g.link}>Add photos</Text></Pressable>
      </View>
      {photos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.strip}>
        {photos.slice(0, 6).map((item, i) => <View key={item.id} style={g.thumbColumn}><Pressable accessibilityRole="button" accessibilityLabel={`View photo ${i + 1} of ${photos.length} of ${placeName}`} onPress={() => onOpen(i)} style={g.thumb}>
          <PhotoImage photo={item} label={`${placeName}, photo ${i + 1}`} />
          {i === 5 && photos.length > 6 && <View style={g.more}><Text style={g.title}>+{photos.length - 5}</Text></View>}
        </Pressable>{item.googleIndex !== undefined && item.source && <PhotoCredit photo={item} />}</View>)}
      </ScrollView> : loading ? <ActivityIndicator color={C.green} style={{ paddingVertical: 12 }} /> : <Pressable accessibilityRole="button" accessibilityLabel="Add the first photo" onPress={add} style={g.empty}><Ionicons name="images-outline" size={27} color={C.muted} /><Text style={g.muted}>No photos yet</Text></Pressable>}
      {!!remoteError && <Pressable accessibilityRole="button" onPress={() => void load(0)} style={g.textButton}><Text style={g.muted}>{remoteError} Retry</Text></Pressable>}
      {!!storage.loadError && <Text accessibilityRole="alert" style={g.error}>{storage.loadError}</Text>}
    </View>
    <Sheet visible={adding} onClose={() => { if (!saving) { setAdding(false); setDraft([]); } }} title="Add photos">
      <View style={g.composer}>
        <Text numberOfLines={2} style={g.title}>{placeName}</Text>
        <PhotoPicker assets={draft} onChange={setDraft} existingCount={photosForPlace(storage.photos, placeId).length} disabled={saving || !storage.ready} />
        {!!(error || storage.loadError) && <Text accessibilityRole="alert" style={g.error}>{error || storage.loadError}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || !draft.length }} disabled={saving || !draft.length} onPress={() => void save()} style={[g.save, (saving || !draft.length) && g.disabled]}>
          {saving && <ActivityIndicator color={C.greenInk} />}<Text style={g.saveText}>{saving ? "Saving…" : draft.length ? `Save ${draft.length} photo${draft.length === 1 ? "" : "s"}` : "Save photos"}</Text>
        </Pressable>
      </View>
    </Sheet>
    <Modal visible={openIndex !== null && !!photo} animationType="fade" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={g.viewerRoot}><SafeAreaView style={g.viewer}>
        <View style={g.viewerHeader}><View style={{ flex: 1 }}><Text numberOfLines={1} style={g.title}>{placeName}</Text><Text accessibilityLiveRegion="polite" style={g.muted}>{index + 1} of {photos.length}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close photos" onPress={onClose} style={g.icon}><Ionicons name="close" size={27} color={C.ink} /></Pressable></View>
        <View style={g.stage} {...swipe.panHandlers}>
          {photo && <PhotoImage photo={photo} label={`${placeName}, photo ${index + 1} of ${photos.length}`} contain style={{ flex: 1 }} />}
          {loading && <ActivityIndicator style={g.loader} color={C.green} />}
        </View>
        {!!remoteError && photo?.googleIndex !== undefined && !photo.source && <Pressable accessibilityRole="button" style={g.textButton} onPress={() => void load(photo.googleIndex)}><Text style={g.link}>Retry photo</Text></Pressable>}
        <View style={g.footer}>
          {photo && <PhotoCredit photo={photo} license />}
          {!!error && <Text accessibilityRole="alert" style={g.error}>{error}</Text>}
          {confirmDelete ? <View style={g.heading}><Text style={g.muted}>Remove this photo?</Text><Pressable accessibilityRole="button" disabled={deleting} onPress={() => setConfirmDelete(false)} style={g.textButton}><Text style={g.link}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={deleting} onPress={() => void remove()} style={g.textButton}><Text style={g.error}>{deleting ? "Removing…" : "Remove"}</Text></Pressable></View> : <View style={g.heading}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous photo" disabled={index === 0} onPress={() => move(-1)} style={[g.icon, index === 0 && g.disabled]}><Ionicons name="chevron-back" size={25} color={C.ink} /></Pressable>
            {photo?.owned && <Pressable accessibilityRole="button" accessibilityLabel="Delete your photo" onPress={() => setConfirmDelete(true)} style={g.icon}><Ionicons name="trash-outline" size={22} color={C.ink} /></Pressable>}
            <Pressable accessibilityRole="button" accessibilityLabel="Next photo" disabled={index >= photos.length - 1} onPress={() => move(1)} style={[g.icon, index >= photos.length - 1 && g.disabled]}><Ionicons name="chevron-forward" size={25} color={C.ink} /></Pressable>
          </View>}
        </View>
      </SafeAreaView></View>
    </Modal>
  </>;
}
const g = StyleSheet.create({
  section: { marginHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.line },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.medium, fontSize: 18, color: C.ink }, muted: { fontFamily: fonts.body, fontSize: 13, color: C.muted },
  textButton: { flexDirection: "row", gap: 7, alignItems: "center", minHeight: 44 }, link: { fontFamily: fonts.medium, fontSize: 14, color: C.green },
  strip: { gap: 8, paddingTop: 8 }, thumbColumn: { width: 124 }, thumb: { width: 124, height: 124, borderRadius: 10, overflow: "hidden" },
  image: { width: "100%", height: "100%", backgroundColor: C.surface }, fallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7 },
  empty: { borderWidth: 1, borderColor: C.line, borderRadius: 10, minHeight: 96, alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  more: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#18271f99" },
  credits: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingVertical: 6 }, credit: { fontFamily: fonts.body, fontSize: 11, color: C.ink },
  composer: { paddingHorizontal: 22, paddingBottom: 28, gap: 16 }, error: { fontFamily: fonts.body, fontSize: 14, color: C.coral },
  save: { minHeight: 48, borderRadius: 25, backgroundColor: C.green, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 }, saveText: { fontFamily: fonts.bold, color: C.greenInk, fontSize: 15 }, disabled: { opacity: 0.35 },
  viewerRoot: { flex: 1, backgroundColor: "#0c1610", alignItems: "center" }, viewer: { flex: 1, width: "100%", maxWidth: 640 },
  viewerHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }, icon: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  stage: { flex: 1, justifyContent: "center", overflow: "hidden" }, loader: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, footer: { paddingHorizontal: 18, paddingBottom: 12 },
});
