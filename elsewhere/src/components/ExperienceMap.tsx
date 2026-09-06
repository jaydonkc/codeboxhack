import React, { useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Experience, MapBounds } from "../data/catalog";
import { C, s } from "../theme";
export type MapProps = {
  items: Experience[];
  selected: string | null;
  onSelect: (id: string) => void;
  onSearchArea?: (b: MapBounds) => void;
  onResetArea?: () => void;
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
}: MapProps) {
  const ref = useRef<MapView>(null),
    [bounds, setBounds] = useState<MapBounds | null>(null);
  return (
    <View
      style={{
        height: 390,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: C.water,
      }}
    >
      <MapView
        ref={ref}
        style={{ flex: 1 }}
        initialRegion={initial}
        userInterfaceStyle="dark"
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
      {onSearchArea && bounds && (
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset map to San Luis Obispo"
        onPress={() => {
          ref.current?.animateToRegion(initial);
          onResetArea?.();
        }}
        style={[
          s.primary,
          { position: "absolute", bottom: 30, right: 12, minHeight: 42 },
        ]}
      >
        <Text style={s.primaryText}>All SLO</Text>
      </Pressable>
    </View>
  );
}
