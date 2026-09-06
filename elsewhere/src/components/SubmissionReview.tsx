import React, { useState } from "react";
import { Linking, Pressable, Switch, Text, TextInput, View } from "react-native";
import { C, s } from "../theme";
import type { Experience } from "../data/catalog";
import { publicReadiness, statusLabels, submissionOf } from "../core/submissions";

type Decision = "trial" | "published" | "changes-requested" | "removed";
export default function SubmissionReview({ items, onReview }: { items: Experience[]; onReview: (item: Experience, decision: Decision, note: string, accessVerified: boolean) => void }) {
  const [selected, setSelected] = useState<string>();
  const [note, setNote] = useState("");
  const [access, setAccess] = useState(false);
  const [error, setError] = useState("");
  const item = items.find(e => e.id === selected);
  const submission = item && submissionOf(item);
  function review(decision: Decision) {
    if (!item) return;
    try { onReview(item, decision, note, access); setError(""); setSelected(undefined); setNote(""); setAccess(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not review this activity."); }
  }
  return <View style={{ gap: 16 }}>
    <Text style={[s.text, s.notice]}>Development preview · Decisions only change this device's catalog. This does not publish an activity or contact a moderation service.</Text>
    {!item ? <>
      {!items.length && <Text style={[s.text, s.muted]}>No activities with public discovery enabled.</Text>}
      {items.map(e => <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={`Review ${e.name}`} onPress={() => { setSelected(e.id); setNote(""); setAccess(false); setError(""); }} style={[s.card, { paddingVertical: 12 }]}>
        <Text style={[s.text, s.heading]}>{e.name}</Text><Text style={[s.text, s.tiny]}>{e.city} · {statusLabels[submissionOf(e)!.status]}</Text>
      </Pressable>)}
    </> : <>
      <Text style={[s.text, s.heading]}>{item.name}</Text>
      <Text style={[s.text, s.tiny]}>{item.city} · {item.activityType} · {statusLabels[submission!.status]} · Revision {submission!.revision}</Text>
      <Text style={s.text}>{item.description}</Text>
      <Text style={s.text}>{submission!.location}</Text>
      <Text style={s.text}>Access: {submission!.access} · {submission!.accessNote || "No access information"}</Text>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(item.sourceUrl).catch(() => setError("Could not open the source."))}><Text style={[s.text, { color: C.green }]}>Open source ↗</Text></Pressable>
      {publicReadiness(item).map(issue => <Text key={issue} style={[s.text, s.tiny]}>{issue}</Text>)}
      <View style={s.between}><Text style={[s.text, { flex: 1 }]}>Visitor access reviewed</Text><Switch accessibilityLabel="Visitor access reviewed" value={access} onValueChange={setAccess}/></View>
      <TextInput accessibilityLabel="Review note" value={note} onChangeText={setNote} placeholder="What did you verify or what needs to change?" placeholderTextColor={C.muted} multiline maxLength={1200} style={[s.inputBox, { minHeight: 80 }]}/>
      <Text style={[s.text, s.tiny]}>A local trial needs no followers or shares. Wider discovery requires independent completed-experience evidence; none is fabricated in this preview.</Text>
      {!!submission?.review && <Text style={[s.text, s.tiny]}>Last decision: {submission.review.note}</Text>}
      {!!error && <Text accessibilityRole="alert" style={[s.text, { color: C.coral }]}>{error}</Text>}
      {submission?.status !== "removed" && <>
        <Pressable accessibilityRole="button" onPress={() => review("trial")} style={s.primary}><Text style={[s.text, s.primaryText]}>Preview local trial</Text></Pressable>
        {submission?.status === "trial" && <Pressable accessibilityRole="button" onPress={() => review("published")} style={s.secondary}><Text style={s.text}>Check wider discovery eligibility</Text></Pressable>}
        <Pressable accessibilityRole="button" onPress={() => review("changes-requested")} style={s.secondary}><Text style={s.text}>Request changes</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => review("removed")} style={s.secondary}><Text style={[s.text, { color: C.coral }]}>Remove from circulation</Text></Pressable>
      </>}
      <Pressable accessibilityRole="button" onPress={() => setSelected(undefined)} style={s.secondary}><Text style={s.text}>Back to review queue</Text></Pressable>
    </>}
  </View>;
}
