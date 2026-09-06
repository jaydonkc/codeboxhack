import React, { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { catalog, icons } from "../data/catalog";
import { C, fonts, s } from "../theme";

export default function ActivityPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const activities = catalog.filter((activity) =>
    `${activity.name} ${activity.venue} ${activity.activityType} ${activity.city}`
      .toLowerCase().includes(search),
  );

  return (
    <View style={s.stack}>
      <Text style={s.muted}>Choose an activity to log your visit.</Text>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={C.muted} />
        <TextInput
          accessibilityLabel="Search activities"
          placeholder="Search activities or places"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          style={s.input}
        />
        {!!query && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear activity search"
            onPress={() => setQuery("")} style={s.icon}>
            <Ionicons name="close" size={20} color={C.muted} />
          </Pressable>
        )}
      </View>
      <View>
        {activities.map((activity) => (
          <Pressable key={activity.id} accessibilityRole="button"
            accessibilityLabel={`Log ${activity.name}`}
            onPress={() => { Keyboard.dismiss(); onSelect(activity.id); }}
            style={({ pressed }) => [styles.activity, pressed && styles.pressed]}>
            <View style={styles.icon}>
              <Ionicons name={(icons[activity.activityType] || "sparkles-outline") as React.ComponentProps<typeof Ionicons>["name"]}
                size={22} color={C.green} />
            </View>
            <View style={styles.details}>
              <Text style={styles.name}>{activity.name}</Text>
              <Text style={s.tiny}>{activity.venue} · {activity.city}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
        ))}
        {!activities.length && (
          <View style={s.empty}>
            <Text style={s.heading}>No activities found</Text>
            <Text style={[s.muted, styles.emptyText]}>Try another activity or place name.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 13, paddingRight: 4, minHeight: 48, borderRadius: 12, backgroundColor: C.surface },
  activity: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.line },
  pressed: { backgroundColor: C.surface },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  details: { flex: 1, gap: 4 },
  name: { color: C.ink, fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  emptyText: { textAlign: "center" },
});
