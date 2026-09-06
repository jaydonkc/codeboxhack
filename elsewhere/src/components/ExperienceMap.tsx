import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import MapView, { Marker, Region, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { Experience, MapBounds, SearchOrigin } from "../data/catalog";
import { useDeviceLocation } from "./useDeviceLocation";
import Constants from "expo-constants";
import { C, s } from "../theme";
export type MapProps = {
  items: Experience[];
  selected: string | null;
  scores?: Record<string, number | null | undefined>;
  scoreLabel?: string;
  onSelect: (id: string) => void;
  onSearchArea?: (b: MapBounds) => void;
  onResetArea?: () => void;
  origin?: SearchOrigin;
  userLocation?: SearchOrigin;
  onUserLocation?: (point: SearchOrigin) => void;
  pickedLocation?: SearchOrigin;
  onPickLocation?: (point: SearchOrigin) => void;
  height?: number;
  compact?: boolean;
};
const initial: Region = { latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };
export default function ExperienceMap({
  items,
  selected,
  scores,
  scoreLabel = "Enjoyment",
  onSelect,
  onSearchArea,
  onResetArea,
  origin,
  userLocation,
  onUserLocation,
  pickedLocation,
  onPickLocation,
  height = 390,
  compact = false,
}: MapProps) {
  const { locate, locating, locationError, position } = useDeviceLocation();
  const ref = useRef<MapView>(null),
    [bounds, setBounds] = useState<MapBounds | null>(null);
  const devicePoint = position ?? userLocation;
  const center = compact && items[0]?.lat != null && items[0]?.lng != null ? { lat: items[0].lat, lng: items[0].lng } : origin;
  useEffect(() => { if (center) ref.current?.animateToRegion({ latitude: center.lat, longitude: center.lng, latitudeDelta: compact ? 0.012 : 0.075, longitudeDelta: compact ? 0.015 : 0.08 }); }, [center?.lat, center?.lng, compact]);
  const useAppleMaps = Platform.OS === "ios";
  const googleReady = Constants.executionEnvironment === "storeClient" || Constants.expoConfig?.extra?.googleMapsAndroidReady;
  // iOS uses native Apple Maps in Expo Go and installed builds. Google Places
  // results remain in the list; our catalog and custom activities have map pins.
  const mapItems = useAppleMaps ? items.filter(item => item.provider !== "google") : items;
  if (!useAppleMaps && !googleReady) return <View style={{ height, padding: 18, gap: 12, backgroundColor: C.water }}>
    <Text style={s.text}>Map unavailable. View places in the list.</Text>
  </View>;
  return (
    <View
      style={{
        height,
        borderRadius: compact ? 0 : 20,
        overflow: "hidden",
        backgroundColor: C.water,
      }}
    >
      <MapView
        provider={useAppleMaps ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
        ref={ref}
        style={{ flex: 1 }}
        initialRegion={
          compact && items[0]?.lat != null && items[0]?.lng != null
            ? {
                latitude: items[0].lat,
                longitude: items[0].lng,
                latitudeDelta: 0.012,
                longitudeDelta: 0.015,
              }
            : origin ? { latitude: origin.lat, longitude: origin.lng, latitudeDelta: 0.075, longitudeDelta: 0.08 } : initial
        }
        userInterfaceStyle="dark"
        scrollEnabled={!compact}
        zoomEnabled={!compact}
        rotateEnabled={!compact}
        pitchEnabled={!compact}
        onPress={onPickLocation ? event => onPickLocation({ lat: event.nativeEvent.coordinate.latitude, lng: event.nativeEvent.coordinate.longitude }) : undefined}
        onRegionChangeComplete={(r) =>
          setBounds({
            north: r.latitude + r.latitudeDelta / 2,
            south: r.latitude - r.latitudeDelta / 2,
            east: r.longitude + r.longitudeDelta / 2,
            west: r.longitude - r.longitudeDelta / 2,
          })
        }
      >
        {pickedLocation && <Marker coordinate={{ latitude: pickedLocation.lat, longitude: pickedLocation.lng }} title="Activity location" pinColor="#d66940" />}
        {!compact && devicePoint && <Marker
          coordinate={{ latitude: devicePoint.lat, longitude: devicePoint.lng }}
          title="Your location"
          description="Your last requested phone location"
          pinColor="#4285F4"
        />}
        {mapItems
          .filter((x) => x.lat !== null && x.lng !== null)
          .map((x) => (
            <Marker
              key={x.id}
              coordinate={{ latitude: x.lat!, longitude: x.lng! }}
              title={`${x.name} · ${scoreLabel} ${scores?.[x.id] == null ? "unrated" : scores[x.id]!.toFixed(1)}`}
              description="Approximate discovery location. Check official access information."
              pinColor={selected === x.id ? "#d66940" : "#587e3c"}
              onPress={() => onSelect(x.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={selected === x.id ? 1000 : 1}
            >
              <View style={{ minWidth: 48, height: 36, paddingHorizontal: 9, borderRadius: 18, borderWidth: 2, borderColor: "#fff9e9", backgroundColor: selected === x.id ? "#d66940" : scores?.[x.id] == null ? "#50635a" : "#345c36", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff9e9", fontSize: 15, lineHeight: 20, fontWeight: "700" }}>{scores?.[x.id] == null ? "—" : scores[x.id]!.toFixed(1)}</Text>
              </View>
            </Marker>
          ))}
      </MapView>
      {useAppleMaps && items.some(item => item.provider === "google") && <View style={{ position: "absolute", top: 60, left: 12, right: 12, backgroundColor: C.surface, padding: 12 }}>
        <Text style={s.muted}>Some places are available in the list only.</Text>
      </View>}
      {!compact && onSearchArea && bounds && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSearchArea(bounds)}
          style={[
            s.primary,
            {
              position: "absolute",
              top: 12,
              alignSelf: "center",
              minHeight: 42,
            },
          ]}
        >
          <Text style={s.primaryText}>Search this area</Text>
        </Pressable>
      )}
      {!compact && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset map to my location"
          disabled={locating}
          onPress={() => locate((point) => {
            ref.current?.animateToRegion({ latitude: point.lat, longitude: point.lng, latitudeDelta: 0.075, longitudeDelta: 0.08 });
            onResetArea?.();
            onUserLocation?.(point);
          })}
          style={[
            s.primary,
            { position: "absolute", bottom: 30, right: 12, minHeight: 42 },
          ]}
        >
          <Text style={s.primaryText}>{locating ? "Locating…" : "My location"}</Text>
        </Pressable>
      )}
      {!!locationError && <View style={{ position: "absolute", bottom: 80, left: 12, right: 12, backgroundColor: C.surface, padding: 12 }}>
        <Text accessibilityRole="alert" style={s.muted}>{locationError}</Text>
      </View>}
    </View>
  );
}
