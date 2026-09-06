import React, { useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Experience, MapBounds, SearchOrigin } from "../data/catalog";
import { useDeviceLocation } from "./useDeviceLocation";
import { C, s } from "../theme";
export type MapProps = {
  items: Experience[];
  selected: string | null;
  onSelect: (id: string) => void;
  onSearchArea?: (b: MapBounds) => void;
  onResetArea?: () => void;
  origin?: SearchOrigin;
  initialCenter?: SearchOrigin;
  onUserLocation?: (point: SearchOrigin) => void;
  height?: number;
  compact?: boolean;
};
const initial: Region = {
  latitude: 35.298,
  longitude: -120.69,
  latitudeDelta: 0.075,
  longitudeDelta: 0.08,
};
export default function ExperienceMap({
  items,
  selected,
  onSelect,
  onSearchArea,
  onResetArea,
  origin,
  initialCenter,
  onUserLocation,
  height = 390,
  compact = false,
}: MapProps) {
  const { locate, locating, locationError } = useDeviceLocation();
  const ref = useRef<MapView>(null),
    [bounds, setBounds] = useState<MapBounds | null>(null);
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
            : initialCenter
              ? { ...initial, latitude: initialCenter.lat, longitude: initialCenter.lng, latitudeDelta: 0.012, longitudeDelta: 0.015 }
              : origin ? { ...initial, latitude: origin.lat, longitude: origin.lng } : initial
        }
        userInterfaceStyle="dark"
        scrollEnabled={!compact}
        zoomEnabled={!compact}
        rotateEnabled={!compact}
        pitchEnabled={!compact}
        onRegionChangeComplete={(r) =>
          setBounds({
            north: r.latitude + r.latitudeDelta / 2,
            south: r.latitude - r.latitudeDelta / 2,
            east: r.longitude + r.longitudeDelta / 2,
            west: r.longitude - r.longitudeDelta / 2,
          })
        }
      >
        {items
          .filter((x) => x.lat !== null && x.lng !== null)
          .map((x) => (
            <Marker
              key={x.id}
              coordinate={{ latitude: x.lat!, longitude: x.lng! }}
              title={x.name}
              description="Approximate discovery location. Check official access information."
              pinColor={selected === x.id ? "#d66940" : "#587e3c"}
              onPress={() => onSelect(x.id)}
            />
          ))}
      </MapView>
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
            ref.current?.animateToRegion({ ...initial, latitude: point.lat, longitude: point.lng });
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
        <Text accessibilityRole="alert" style={{ color: C.ink }}>{locationError}</Text>
      </View>}
    </View>
  );
}
