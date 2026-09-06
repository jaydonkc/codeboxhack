import React, { useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { MAX_PHOTO_BATCH, MAX_PLACE_PHOTOS, validatePhotoSelection, type PhotoAsset } from "../core/photos";
import { C, fonts } from "../theme";
import { releasePreview } from "../services/preparePhoto";

export default function PhotoPicker({ assets, onChange, existingCount, disabled = false }: {
  assets: PhotoAsset[]; onChange: (assets: PhotoAsset[]) => void; existingCount: number; disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(false);
  const [picking, setPicking] = useState(false);
  const remaining = Math.max(0, Math.min(MAX_PHOTO_BATCH - assets.length, MAX_PLACE_PHOTOS - existingCount - assets.length));
  async function pick(camera: boolean) {
    if (disabled || picking || !remaining) return;
    setError(""); setSettings(false); setPicking(true);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setError("Allow camera access to take a photo."); setSettings(!permission.canAskAgain); return; }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: remaining, orderedSelection: true, quality: 1, exif: false });
      if (result.canceled) return;
      const next = [...assets, ...result.assets];
      try { validatePhotoSelection(next, existingCount); }
      catch (e) { result.assets.forEach(p => releasePreview(p.uri)); throw e; }
      onChange(next);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Those photos could not be opened. Try again."); }
    finally { setPicking(false); }
  }
  return <View style={p.root}>
    {!!assets.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={p.previews}>
      {assets.map((asset, i) => <View key={`${asset.uri}-${i}`} style={p.preview}>
        <Image source={{ uri: asset.uri }} style={p.image} accessibilityLabel={`Selected photo ${i + 1}`} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove selected photo ${i + 1}`} disabled={disabled} onPress={() => onChange(assets.filter((_, index) => index !== i))} style={p.remove}>
          <Ionicons name="close" color={C.ink} size={19} />
        </Pressable>
      </View>)}
    </ScrollView>}
    <View style={p.actions}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || picking || !remaining }} disabled={disabled || picking || !remaining} onPress={() => void pick(false)} style={[p.button, (disabled || picking || !remaining) && p.disabled]}>
        <Ionicons name="images-outline" color={C.green} size={21} /><Text style={p.label}>{picking ? "Opening photos…" : assets.length ? "Add more" : "Choose photos"}</Text>
      </Pressable>
      {Platform.OS !== "web" && <Pressable accessibilityRole="button" accessibilityLabel="Take a photo" disabled={disabled || picking || !remaining} onPress={() => void pick(true)} style={[p.button, (disabled || picking || !remaining) && p.disabled]}>
        <Ionicons name="camera-outline" color={C.green} size={21} /><Text style={p.label}>Camera</Text>
      </Pressable>}
      {!!assets.length && <Text style={p.count}>{assets.length}/{MAX_PHOTO_BATCH}</Text>}
    </View>
    {!!error && <Text accessibilityRole="alert" style={p.error}>{error}</Text>}
    {existingCount >= MAX_PLACE_PHOTOS && <Text style={p.count}>{existingCount}/{MAX_PLACE_PHOTOS} photos</Text>}
    {settings && <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings().catch(() => setError("Open your device’s Settings to allow camera access."))} style={p.button}><Text style={p.label}>Open settings</Text></Pressable>}
  </View>;
}
const p = StyleSheet.create({
  root: { gap: 8 }, actions: { flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" },
  button: { minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center" },
  label: { fontFamily: fonts.medium, fontSize: 14, color: C.green }, count: { fontFamily: fonts.body, color: C.muted, fontSize: 13 },
  previews: { gap: 10, paddingTop: 4 }, preview: { width: 96, height: 96, borderRadius: 10, overflow: "hidden" }, image: { width: "100%", height: "100%" },
  remove: { position: "absolute", right: 0, top: 0, width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#18271fdd", borderBottomLeftRadius: 12 },
  error: { fontFamily: fonts.body, color: C.coral, fontSize: 14 }, disabled: { opacity: 0.45 },
});
