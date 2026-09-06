import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts, s } from "../theme";

export default function Disclosure({ title, summary, initiallyOpen = false, children }: {
  title: string;
  summary?: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={{ borderBottomWidth: 1, borderBottomColor: C.line }}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={[s.between, { minHeight: 58 }]}>
      <Text style={[s.text, { fontFamily: fonts.medium }]}>{title}</Text>
      <View style={[s.row, { flex: 1, justifyContent: "flex-end" }]}>
        {!!summary && <Text numberOfLines={1} style={[s.tiny, { flexShrink: 1 }]}>{summary}</Text>}
        <Ionicons name={open ? "chevron-up" : "chevron-down"} color={C.muted} size={17} />
      </View>
    </Pressable>
    {open && <View style={{ gap: 16, paddingBottom: 18 }}>{children}</View>}
  </View>;
}
