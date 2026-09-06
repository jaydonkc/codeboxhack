import React, { useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { catalog, icons, VIBES } from "../data/catalog";
import { type ActivityDraft } from "../core/customActivities";
import { C, fonts, s } from "../theme";

export default function ActivityPicker({ onSelect, onCreate, city: initialCity }: {
  onSelect: (id: string) => void;
  onCreate: (draft: ActivityDraft) => void;
  city: string;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState(initialCity);
  const [vibes, setVibes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const activities = catalog.filter((activity) =>
    `${activity.name} ${activity.venue} ${activity.activityType} ${activity.city}`
      .toLowerCase().includes(search),
  );

  if (creating) return (
    <View style={s.stack}>
      <Pressable accessibilityRole="button" onPress={() => setCreating(false)} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: C.green }}>‹ Back to search</Text>
      </Pressable>
      <Text style={s.heading}>Create an activity</Text>
      <Text style={s.muted}>Add it to your activities, then log your visit.</Text>
      {([
        ["Activity name", name, setName, "e.g. Board game night"],
        ["Place", venue, setVenue, "Venue or gathering place"],
        ["City", city, setCity, "City"],
      ] as const).map(([label, value, setter, placeholder]) => (
        <View key={label} style={{ gap: 8 }}>
          <Text style={s.muted}>{label}</Text>
          <TextInput accessibilityLabel={label} value={value} onChangeText={setter}
            placeholder={placeholder} placeholderTextColor={C.muted} maxLength={120}
            autoCapitalize="words" style={[s.input, { backgroundColor: C.surface, borderRadius: 12, padding: 14 }]} />
        </View>
      ))}
      <Text style={s.muted}>Tags (optional)</Text>
      <View style={s.wrap}>
        {VIBES.map((vibe) => <Pressable key={vibe} accessibilityRole="checkbox"
          accessibilityState={{ checked: vibes.includes(vibe) }}
          onPress={() => setVibes(vibes.includes(vibe) ? vibes.filter((item) => item !== vibe) : [...vibes, vibe])}
          style={{ padding: 12, borderRadius: 20, backgroundColor: vibes.includes(vibe) ? C.green : C.surface }}>
          <Text style={{ color: vibes.includes(vibe) ? C.greenInk : C.ink }}>{vibe}</Text>
        </Pressable>)}
      </View>
      {!!error && <Text accessibilityRole="alert" style={s.muted}>{error}</Text>}
      <Pressable accessibilityRole="button" onPress={() => {
        if (submitting.current) return;
        if (!name.trim() || !venue.trim() || !city.trim()) {
          setError("Enter an activity name, place, and city."); return;
        }
        submitting.current = true;
        Keyboard.dismiss();
        onCreate({ name, venue, city, vibes });
      }} style={{ padding: 16, borderRadius: 14, alignItems: "center", backgroundColor: C.green }}>
        <Text style={{ color: C.greenInk, fontFamily: fonts.bold }}>Create and log activity</Text>
      </Pressable>
    </View>
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
      <Pressable accessibilityRole="button" onPress={() => { setName(query.trim()); setCreating(true); }}
        style={styles.activity}>
        <Ionicons name="add-circle-outline" size={24} color={C.green} />
        <Text style={[styles.name, { color: C.green }]}>Create a new activity</Text>
      </Pressable>
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
            <Text style={[s.muted, styles.emptyText]}>Create a new activity above, or try another search.</Text>
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
