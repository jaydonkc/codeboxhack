import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts, s } from "../theme";
import { VIBES, type Experience, type SearchOrigin } from "../data/catalog";
import { type CustomDraft } from "../core/customExperience";
import { audienceLabels, type ActivityAudience, type VisitorAccess } from "../core/submissions";
import Disclosure from "./Disclosure";
import ActivityLocationPicker from "./ActivityLocationPicker";

const audienceNotes: Record<ActivityAudience, string> = {
  private: "Keep this activity in your own lists. It won't be shared or recommended.",
  friends: "Only your friends can view it once accounts are connected. It will never become public automatically.",
  public: "People can pass it on. It stays out of Discover until reviewed, then starts with a small local audience.",
};
export function AudienceOptions({ value, onChange }: { value: ActivityAudience; onChange: (value: ActivityAudience) => void }) {
  return <View style={{ gap: 6 }}>
    <Text style={[s.text, { fontFamily: fonts.medium }]}>Who can see it?</Text>
    {(["private", "friends", "public"] as const).map(key => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={audienceLabels[key]} accessibilityState={{ checked: value === key }} onPress={() => onChange(key)} style={[s.row, { minHeight: 46, borderWidth: 1, borderColor: value === key ? C.green : C.line, borderRadius: 12, paddingHorizontal: 12 }]}>
      <Ionicons name={value === key ? "radio-button-on" : "radio-button-off"} color={value === key ? C.green : C.muted} size={20}/>
      <Text style={s.text}>{audienceLabels[key]}</Text>
    </Pressable>)}
    <Text style={[s.text, s.tiny]}>{audienceNotes[value]}</Text>
  </View>;
}

type Props = { draft: CustomDraft; onChange: React.Dispatch<React.SetStateAction<CustomDraft>>; duplicates: Experience[]; onExisting: (id: string) => void; onSave: (intent: "rank" | "save") => void; error: string; busy: boolean; editing: boolean; origin?: SearchOrigin };
export default function ActivityEditor({ draft, onChange, duplicates, onExisting, onSave, error, busy, editing, origin }: Props) {
  const set = (field: keyof CustomDraft, value: string) => onChange(d => ({ ...d, [field]: value }));
  const field = (key: keyof CustomDraft, label: string, placeholder: string, maxLength: number, multiline = false, numeric = false) => <View style={{ flex: 1, gap: 6 }}>
    <Text style={[s.text, s.tiny]}>{label}</Text>
    <TextInput accessibilityLabel={label} value={String(draft[key] ?? "")} onChangeText={value => set(key, value)} placeholder={placeholder} placeholderTextColor={C.muted} maxLength={maxLength} editable={!busy} multiline={multiline} keyboardType={numeric ? "decimal-pad" : "default"} style={[s.inputBox, multiline && { minHeight: 80, textAlignVertical: "top" }]}/>
  </View>;
  const accessOptions: [VisitorAccess, string][] = [["public", "Open to visitors"], ["permission", "Permission or booking needed"], ["unknown", "Not sure yet"], ["restricted", "Restricted access"]];
  const accessFields = <>
    <Text style={[s.text, { fontFamily: fonts.medium }]}>Visitor access</Text>
    {accessOptions.map(([key, label]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: draft.access === key }} disabled={busy} onPress={() => set("access", key)} style={[s.row, { minHeight: 42 }]}>
      <Ionicons name={draft.access === key ? "radio-button-on" : "radio-button-off"} color={draft.access === key ? C.green : C.muted} size={19}/><Text style={[s.text, { flex: 1 }]}>{label}</Text>
    </Pressable>)}
    {field("accessNote", "Access details", "Opening times, booking or permission, and any restrictions", 1200, true)}
    <Text style={[s.text, s.tiny]}>For tunnels and permission-dependent places, visitor access needs review before public discovery.</Text>
  </>;
  return <View style={{ gap: 16 }}>
    <Text style={[s.text, s.muted]}>Add a specific thing to do, like a geocaching loop in a park.</Text>
    {field("name", "Activity name", "e.g. Laguna Lake geocaching loop", 120)}
    {field("city", "City", "City", 120)}
    {!!duplicates.length && <View style={[s.notice, { gap: 10 }]}>
      <Text style={[s.text, { fontFamily: fonts.medium }]}>Already on Elsewhere</Text>
      <Text style={[s.text, s.tiny]}>Use the existing activity. A different route or program can have its own name.</Text>
      {duplicates.map(e => <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={`Use existing ${e.name}`} onPress={() => onExisting(e.id)} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[s.text, { color: C.green }]}>{e.name} · {e.city} ↗</Text></Pressable>)}
    </View>}
    {field("activityType", "Activity type", "e.g. Geocaching, tunnel tour, walk", 80)}
    {field("description", "What will people do?", "Describe the route or experience and what to expect", 1200, true)}
    {field("location", "Location or meeting area", "Park, entrance, venue, or meeting point", 300)}
    <ActivityLocationPicker draft={draft} onChange={onChange} origin={origin} busy={busy}/>
    <View style={{ flexDirection: "row", gap: 12 }}>
      {field("duration", "Duration (minutes)", "e.g. 60", 5, false, true)}
      {field("price", "Price per person ($)", "Unknown, or 0 for free", 9, false, true)}
    </View>
    <Disclosure title="More details" summary="Vibes, source">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {VIBES.map(v => <Pressable key={v} accessibilityRole="checkbox" accessibilityLabel={v} accessibilityState={{ checked: draft.vibes?.includes(v) }} onPress={() => onChange(d => ({ ...d, vibes: d.vibes?.includes(v) ? d.vibes.filter(x => x !== v) : [...d.vibes ?? [], v] }))} style={[s.pill, draft.vibes?.includes(v) && s.pillActive]}><Text style={[s.text, s.pillText]}>{v}</Text></Pressable>)}
      </View>
      {field("sourceUrl", "Source link (optional)", "https://", 2000)}
    </Disclosure>
    <AudienceOptions value={draft.audience ?? "private"} onChange={value => !busy && set("audience", value)}/>
    {draft.audience === "public" ? accessFields : <Disclosure title="Visitor access" summary="Optional for your own lists">{accessFields}</Disclosure>}
    {editing && <Text style={[s.text, s.tiny]}>Saving changes clears any previous discovery approval. Your rankings and photos stay attached.</Text>}
    <Text style={[s.text, s.tiny]}>Saved on this device. Friend delivery and public review aren't connected yet.</Text>
    {!!error && <Text accessibilityRole="alert" style={[s.text, { color: C.coral }]}>{error}</Text>}
    {!editing && <Text style={[s.text, s.tiny]}>Next: rate your experience and add notes or photos.</Text>}
    <Pressable accessibilityRole="button" disabled={busy || !!duplicates.length} accessibilityState={{ disabled: busy || !!duplicates.length }} onPress={() => onSave(editing ? "save" : "rank")} style={[s.primary, (busy || !!duplicates.length) && { opacity: 0.45 }]}>
      <Text style={[s.text, s.primaryText]}>{busy ? "Saving…" : editing ? "Save changes" : "Save and rank"}</Text>
    </Pressable>
    {!editing && <Pressable accessibilityRole="button" disabled={busy || !!duplicates.length} accessibilityState={{ disabled: busy || !!duplicates.length }} onPress={() => onSave("save")} style={[s.secondary, (busy || !!duplicates.length) && { opacity: 0.45 }]}>
      <Text style={s.text}>Haven’t been? Save to Want to try</Text>
    </Pressable>}
  </View>;
}
