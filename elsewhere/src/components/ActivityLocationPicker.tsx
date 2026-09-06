import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { SearchOrigin } from "../data/catalog";
import type { CustomDraft } from "../core/customExperience";
import { hasMapCoordinates } from "../core/library";
import { C, fonts, s } from "../theme";
import ExperienceMap from "./ExperienceMap";
import Disclosure from "./Disclosure";
import { useDeviceLocation } from "./useDeviceLocation";

export default function ActivityLocationPicker({ draft, onChange, origin, busy }: {
  draft: CustomDraft;
  onChange: React.Dispatch<React.SetStateAction<CustomDraft>>;
  origin?: SearchOrigin;
  busy: boolean;
}) {
  const coordinates = { lat: Number(draft.latitude), lng: Number(draft.longitude) };
  const point = draft.latitude.trim() && draft.longitude.trim() && hasMapCoordinates(coordinates) ? coordinates : undefined;
  const [showMap, setShowMap] = useState(false);
  const [mapOrigin, setMapOrigin] = useState<SearchOrigin | undefined>();
  const { locate, locating, locationError } = useDeviceLocation();
  const choose = (location: SearchOrigin) => {
    if (!busy) onChange(d => ({ ...d, latitude: location.lat.toFixed(6), longitude: location.lng.toFixed(6) }));
  };
  const useLocation = (location: SearchOrigin) => { choose(location); setMapOrigin(location); setShowMap(true); };
  return <View style={{ gap: 10 }}>
    <Text style={[s.text, { fontFamily: fonts.medium }]}>Map location</Text>
    <Text style={[s.text, s.tiny]}>{point ? "Pin added. Saving will show this activity on your map." : "Choose a pin to show this activity on your map. A written address alone won't add a pin."}</Text>
    <Pressable accessibilityRole="button" disabled={busy || locating} onPress={() => void locate(useLocation)} style={s.secondary}>
      <Text style={s.text}>{locating ? "Locating…" : "Use my current location"}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { if (!showMap) setMapOrigin(point ?? origin); setShowMap(!showMap); }} style={s.secondary}>
      <Text style={s.text}>{showMap ? "Hide location picker" : point ? "Adjust pin on map" : "Choose on map"}</Text>
    </Pressable>
    {showMap && <View style={{ gap: 8 }} pointerEvents={busy ? "none" : "auto"}>
      <Text style={[s.text, s.tiny]}>Move or zoom the map, then tap where the activity happens.</Text>
      <ExperienceMap items={[]} selected={null} onSelect={() => {}} origin={mapOrigin} pickedLocation={point} onPickLocation={choose} onUserLocation={useLocation} height={280}/>
    </View>}
    {!!locationError && <Text accessibilityRole="alert" style={[s.text, { color: C.coral }]}>{locationError} You can also choose a pin on the map or enter coordinates.</Text>}
    <Disclosure title="Enter coordinates" summary={point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : "Optional"}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {([ ["latitude", "Latitude", "35.28"], ["longitude", "Longitude", "-120.66"] ] as const).map(([key, label, placeholder]) => <View key={key} style={{ flex: 1, gap: 6 }}>
          <Text style={[s.text, s.tiny]}>{label}</Text>
          <TextInput accessibilityLabel={label} value={draft[key]} onChangeText={value => onChange(d => ({ ...d, [key]: value }))} placeholder={placeholder} placeholderTextColor={C.muted} maxLength={18} editable={!busy} autoCorrect={false} style={s.inputBox}/>
        </View>)}
      </View>
    </Disclosure>
    {!!(draft.latitude || draft.longitude) && <Pressable accessibilityRole="button" disabled={busy} onPress={() => onChange(d => ({ ...d, latitude: "", longitude: "" }))} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[s.text, { color: C.coral }]}>Remove map pin</Text></Pressable>}
  </View>;
}
