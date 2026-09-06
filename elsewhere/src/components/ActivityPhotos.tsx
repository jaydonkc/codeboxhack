import React, { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { type ActivityPhoto } from "../data/activityPhotos";
import { C, fonts } from "../theme";

function Photo({ photo, contain = false }: { photo: ActivityPhoto; contain?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <View style={p.unavailable}>
      <Ionicons name="image-outline" size={28} color={C.muted} />
      <Text style={p.caption}>Photo unavailable</Text>
      <Pressable accessibilityRole="button" onPress={() => setFailed(false)} style={p.retry}>
        <Text style={p.credit}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <Image
      source={photo.source}
      accessibilityLabel={photo.alt}
      resizeMode={contain ? "contain" : "cover"}
      style={p.image}
      onError={() => setFailed(true)}
    />
  );
}

function PhotoPager({
  photos,
  initialIndex = 0,
  contain = false,
  onIndexChange,
  onOpen,
}: {
  photos: ActivityPhoto[];
  initialIndex?: number;
  contain?: boolean;
  onIndexChange: (index: number) => void;
  onOpen?: (index: number) => void;
}) {
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const [index, setIndex] = useState(initialIndex);
  const list = useRef<FlatList<ActivityPhoto>>(null);
  const select = (next: number) => {
    list.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
    onIndexChange(next);
  };

  return (
    <View style={p.pager} onLayout={(event) => {
      const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
      setSize({ width: nextWidth, height: nextHeight });
    }}>
      {width > 0 && height > 0 && (
        <FlatList
          key={`${width}:${height}`}
          ref={list}
          data={photos}
          keyExtractor={(photo) => photo.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onScroll={(event) => {
            const next = Math.max(0, Math.min(photos.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
            if (next !== index) {
              setIndex(next);
              onIndexChange(next);
            }
          }}
          scrollEventThrottle={32}
          renderItem={({ item, index: i }) => (
            onOpen ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open photo ${i + 1} of ${photos.length}: ${item.alt}`}
                onPress={() => onOpen(i)}
                style={{ width, height }}
              >
                <Photo photo={item} />
              </Pressable>
            ) : (
              <View style={{ width, height }}>
                <Photo photo={item} contain={contain} />
              </View>
            )
          )}
        />
      )}
      {photos.length > 1 && (
        <View style={p.arrows} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous photo"
            disabled={index === 0}
            onPress={() => select(index - 1)}
            style={[p.arrow, index === 0 && p.hidden]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next photo"
            disabled={index === photos.length - 1}
            onPress={() => select(index + 1)}
            style={[p.arrow, index === photos.length - 1 && p.hidden]}
          >
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ActivityPhotos({ photos, venue }: { photos: ActivityPhoto[]; venue: string }) {
  const [index, setIndex] = useState(0);
  const [viewerStart, setViewerStart] = useState<number | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerRevision, setViewerRevision] = useState(0);
  if (!photos.length) return null;
  const current = photos[viewerIndex];
  const open = (next: number) => {
    setViewerIndex(next);
    setViewerStart(next);
    setViewerRevision((revision) => revision + 1);
  };
  const openSource = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn’t open the photo source", "Please try again.");
    }
  };

  return (
    <View style={p.gallery}>
      <PhotoPager photos={photos} onIndexChange={setIndex} onOpen={open} />
      <View style={p.bottom} pointerEvents="box-none">
        <View style={p.dots} pointerEvents="none">
          {photos.length > 1 && photos.map((photo, i) => (
            <View key={photo.id} style={[p.dot, i === index && p.activeDot]} />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View all ${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
          onPress={() => open(index)}
          style={p.count}
        >
          <Ionicons name="images-outline" size={16} color="#fff" />
          <Text style={p.countText}>{index + 1} / {photos.length}</Text>
        </Pressable>
      </View>
      <Modal
        visible={viewerStart !== null}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setViewerStart(null)}
      >
        <SafeAreaView style={p.viewer}>
          <View style={p.viewerHeader}>
            <Text numberOfLines={2} style={p.viewerTitle}>{venue}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close photos"
              onPress={() => setViewerStart(null)}
              style={p.close}
            >
              <Ionicons name="close" size={25} color="#fff" />
            </Pressable>
          </View>
          {viewerStart !== null && (
            <PhotoPager
              key={viewerRevision}
              photos={photos}
              initialIndex={viewerStart}
              contain
              onIndexChange={setViewerIndex}
            />
          )}
          <View style={p.viewerFooter}>
            <Text style={p.position} accessibilityLiveRegion="polite">
              {viewerIndex + 1} of {photos.length}
            </Text>
            <Text style={p.caption}>{current.alt}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Photo source: ${current.credit}`}
              onPress={() => openSource(current.sourceUrl)}
              style={p.source}
            >
              <Text style={p.credit}>Photo: {current.credit}</Text>
              <Ionicons name="open-outline" size={13} color={C.green} />
            </Pressable>
            {current.licenseUrl && (
              <Pressable accessibilityRole="link" onPress={() => openSource(current.licenseUrl!)} style={p.license}>
                <Text style={p.credit}>{current.license}</Text>
              </Pressable>
            )}
            {photos.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={p.thumbnails}>
                {photos.map((photo, i) => (
                  <Pressable
                    key={photo.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Show photo ${i + 1}`}
                    accessibilityState={{ selected: i === viewerIndex }}
                    onPress={() => open(i)}
                    style={[p.thumbnail, i === viewerIndex && p.selectedThumbnail]}
                  >
                    <Image source={photo.source} style={p.image} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const p = StyleSheet.create({
  gallery: { height: 264, backgroundColor: C.surface },
  pager: { flex: 1 },
  image: { width: "100%", height: "100%" },
  unavailable: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.surface },
  retry: { padding: 12 },
  arrows: { position: "absolute", top: "50%", marginTop: -22, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" },
  arrow: { height: 44, width: 44, borderRadius: 22, backgroundColor: "#1020188c", alignItems: "center", justifyContent: "center" },
  hidden: { opacity: 0 },
  bottom: { position: "absolute", bottom: 12, left: 18, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ffffff70", borderWidth: 0.5, borderColor: "#00000030" },
  activeDot: { width: 18, backgroundColor: "#fff" },
  count: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#102018d9", borderRadius: 18, minHeight: 36, paddingHorizontal: 12 },
  countText: { fontFamily: fonts.medium, color: "#fff", fontSize: 12 },
  viewer: { flex: 1, backgroundColor: "#101713" },
  viewerHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 14 },
  viewerTitle: { flex: 1, fontFamily: fonts.medium, color: "#fff", fontSize: 16, lineHeight: 22 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  viewerFooter: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 18, gap: 8 },
  position: { fontFamily: fonts.medium, color: C.muted, fontSize: 12 },
  caption: { fontFamily: fonts.body, color: C.ink, fontSize: 14, lineHeight: 20 },
  source: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, minHeight: 36 },
  credit: { fontFamily: fonts.medium, color: C.green, fontSize: 12, lineHeight: 18 },
  license: { alignSelf: "flex-start", paddingVertical: 6 },
  thumbnails: { gap: 10, paddingVertical: 8 },
  thumbnail: { width: 64, height: 58, borderRadius: 9, overflow: "hidden", borderWidth: 2, borderColor: "transparent", opacity: 0.55 },
  selectedThumbnail: { borderColor: C.green, opacity: 1 },
});
