import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import type { Experience } from "../data/catalog";
import { s } from "../theme";
export default function PlaceAttribution({ item }: { item?: Experience }) {
  return <View style={{ gap: 5, paddingVertical: 8 }}>
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(item?.sourceUrl ?? "https://maps.google.com").catch(() => {})}>
      <Text style={[s.tiny, { fontWeight: "500" }]}>Google Maps</Text>
    </Pressable>
    {item?.attributions?.map((a, i) => <Text key={i} style={s.tiny} onPress={a.url ? () => { Linking.openURL(a.url!).catch(() => {}); } : undefined}>{a.name}</Text>)}
  </View>;
}
